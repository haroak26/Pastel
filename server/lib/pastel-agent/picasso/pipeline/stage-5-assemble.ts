import type { Brief, Tokens, ScreenPlan, LayoutPlan, PropContract } from "./types";
import type { MockDataset, CopyPlan } from "./stage-4-build";
import type { ProductContext } from "./anti-slop";
import { chatText, MAX_TOKENS_PER_CALL, type ChatMessage } from "../../gateway";
import { antiSlopSystemPrompt } from "./anti-slop";
import { tokenSnapshot } from "./lib/base-components";
import { auditScreenProps, applyPropAutoFix, type PropViolation } from "./lib/prop-validation";
import { transform } from "esbuild";

export interface ComposeScreenInput {
  screenPlan: ScreenPlan;
  components: Record<string, string>;
  tokens: Tokens;
  data: MockDataset;
  copy: CopyPlan;
  productContext: ProductContext;
  propContract: PropContract;
  brief: Brief;
  creativeSeed: string;
  extraContext?: string;
}

export interface ScreenResult {
  screen: string;
  retries: number;
}

export interface ComposeAllScreensInput extends Omit<ComposeScreenInput, "screenPlan" | "copy"> {
  layoutPlan: LayoutPlan;
  copy: CopyPlan;
  onProgress?: (screenName: string, index: number, total: number) => void;
}

const SCREEN_SYSTEM = `You are a senior frontend engineer composing application screens from a library of finished, product-specific components. You write layout-ONLY composition — the components carry all styling; you arrange them.

## Laws
1. IMPORT components — never redefine or restyle them. Use the exact aliased imports given.
2. LAYOUT ONLY: grid/flex/spacing/containers (max-w, mx-auto, py-*, gap-*). You may use theme surface utilities for screen-level backgrounds (bg-background, bg-muted) and text utilities for screen-level copy (text-foreground, text-muted-foreground, text-2xl font-bold for headings). NEVER new component styling, no raw hex, no gradients, no arbitrary shadows.
3. FOLLOW the wireframe: place each component slot in its region; honor hierarchy (primary region gets the biggest type and the dominant position), roles, and the dominant moment — the first thing a user should see.
4. CONTENT: use the provided copy and data for this screen. Every item from the data that belongs on this screen must be rendered — no empty screens, no "sample data".
5. Responsive: single column under lg, the wireframe's columns from lg up. The dominant moment stays first on mobile.
6. A screen must feel complete: header/chrome if the wireframe says so, spacing rhythm that varies, nothing cut off, no overflow-x.

## Structure
- Default export function named after the screen id (PascalCase).
- One region per wireframe region, using semantic <header>/<nav>/<main>/<aside>/<section>/<footer> wrappers.
- Varied vertical rhythm: py-10/py-14/py-16 sections — never uniform.
- No inline <style> blocks. No React fragments with nothing inside.

Output ONLY the complete screen file.`;

function importsBlock(components: Record<string, string>): { block: string; aliases: string[] } {
  const lines: string[] = [];
  const aliases: string[] = [];
  for (const [id, code] of Object.entries(components)) {
    const exports = extractExports(code);
    if (exports.length === 0) continue;
    const alias = pascal(id);
    // Alias EVERY export with the manifest name so components built from the
    // same base (two cards, two dialogs) never collide on export names.
    const parts = exports.map((e) => `${e} as ${alias}${e}`);
    lines.push(`import { ${parts.join(", ")} } from "./${kebab(id)}"`);
    aliases.push(alias);
  }
  return { block: lines.join("\n"), aliases };
}

function extractExports(code: string): string[] {
  const out: string[] = [];
  const named = code.match(/export \{\s*([^}]+)\s*\}/g) ?? [];
  for (const block of named) {
    const inner = block.replace(/export \{/, "").replace(/\}/, "");
    for (const part of inner.split(",")) {
      const name = part.trim().split(/\s+as\s+/)[1]?.trim() ?? part.trim();
      if (name && name !== "type" && !name.startsWith("type ")) out.push(name.replace(/,/g, "").trim());
    }
  }
  const direct = code.match(/export\s+(?:function|const)\s+([A-Za-z_$][\w$]*)/g) ?? [];
  for (const d of direct) out.push(d.split(/\s+/).pop() ?? "");
  return [...new Set(out.filter(Boolean))];
}

function pascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_m, _p, c) => c.toUpperCase());
}

function kebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export async function composeScreen(input: ComposeScreenInput): Promise<ScreenResult> {
  const { screenPlan, components, tokens, data, copy, productContext, brief, creativeSeed } = input;

  const regionBlock = screenPlan.regions
    .map((r) => {
      const slots = r.componentTypes
        .map((c) => `    - ${c.name} (${c.description})`)
        .join("\n");
      return `  Region "${r.name}" [role=${r.role}, hierarchy=${r.hierarchy}]: ${r.purpose}\n${slots}`;
    })
    .join("\n");

  const { block } = importsBlock(components);

  const screenCopy = copy.screens[screenPlan.id];
  const copyBlock = screenCopy
    ? `Heading: ${screenCopy.heading}\nSubheading: ${screenCopy.subheading}\nCTAs: ${screenCopy.ctas.map((c) => `${c.label}${c.variant ? ` (${c.variant})` : ""}`).join(" | ")}\nLabels: ${Object.entries(screenCopy.labels).map(([k, v]) => `${k}=${v}`).join(", ")}`
    : "(no copy plan for this screen — write real copy)";

  const dataExcerpt = JSON.stringify({ metrics: data.metrics, items: data.items.slice(0, 8), screen: data.screens[screenPlan.id] ?? {} }, null, 2).slice(0, 4000);

  const messages: ChatMessage[] = [
    { role: "system", content: SCREEN_SYSTEM },
    {
      role: "user",
      content: [
        `## PRODUCT`,
        `Name: ${brief.productName} — ${brief.description}`,
        `Personality: ${brief.personality.join(", ")} · Creative seed: ${creativeSeed}`,
        "",
        `## SCREEN`,
        `${screenPlan.name} (${screenPlan.id}) — ${screenPlan.description}`,
        `Route: ${screenPlan.route} · Dominant moment: ${screenPlan.dominantMoment}`,
        `Grid: ${screenPlan.gridColumns} columns`,
        `## REGIONS`,
        regionBlock,
        "",
        `## COPY FOR THIS SCREEN`,
        copyBlock,
        "",
        `## DATA FOR THIS SCREEN (render the relevant parts)`,
        "```json",
        dataExcerpt,
        "```",
        "",
        `## COMPONENT IMPORTS (use exactly these aliased imports)`,
        block || "(no components available — build the screen with plain semantic HTML + layout utilities)",
        "",
        tokenSnapshot(tokens),
        "",
        antiSlopSystemPrompt(),
        "",
        input.extraContext ? `## REGENERATION NOTES\n${input.extraContext}` : "",
        "",
        `Compose ${screenPlan.id} now. Output ONLY the complete screen file.`,
      ].join("\n"),
    },
  ];

  const raw = await chatText(messages, {
    model: "assemble",
    temperature: 0.55,
    maxTokens: MAX_TOKENS_PER_CALL.assemble,
  });

  const screen = cleanScreenOutput(raw);
  return { screen, retries: 0 };
}

export async function composeScreenWithRetry(
  input: ComposeScreenInput,
  maxRetries = 2,
): Promise<ScreenResult> {
  let attempt = 0;
  let lastError = "";

  while (attempt <= maxRetries) {
    try {
      const result = await composeScreen({ ...input, extraContext: attempt > 0 ? `Fix: ${lastError}` : undefined });
      const syntaxOk = await syntaxCheck(result.screen);
      if (syntaxOk) return result;
      lastError = "The screen file has a syntax error — fix it.";
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    attempt++;
  }
  // Last-chance: one more compose without extra context
  const result = await composeScreen(input);
  return result;
}

async function syntaxCheck(code: string): Promise<boolean> {
  try {
    await transform(code, { loader: "tsx", jsx: "automatic" });
    return true;
  } catch {
    return false;
  }
}

export async function composeAllScreens(input: ComposeAllScreensInput): Promise<Record<string, string>> {
  const { layoutPlan, components, tokens, data, copy, productContext, propContract, brief, creativeSeed, onProgress } = input;
  const screens: Record<string, string> = {};

  const tasks = layoutPlan.screens.map(async (screenPlan, i) => {
    const result = await composeScreenWithRetry({
      screenPlan,
      components,
      tokens,
      data,
      copy,
      productContext,
      propContract,
      brief,
      creativeSeed,
    });
    screens[screenPlan.id] = result.screen;
    onProgress?.(screenPlan.id, i + 1, layoutPlan.screens.length);
    return result;
  });

  await Promise.all(tasks);
  return screens;
}

// ── V8: prop-contract-gated composition (IMPROVEMENTS.md #3) ─────────────

export interface ComposedScreenV8 {
  code: string;
  retries: number;
  /** Violations that could not be auto-fixed — the screen ships with them
   *  flagged for the report, never silently. */
  propViolations: PropViolation[];
  /** Mounts auto-fixed (empty usages replaced with a safe wrapper). */
  autoFixed: string[];
}

/**
 * Compose a screen and enforce the prop contract before it is persisted:
 * every usage of a manifest component is checked against its declared
 * required props; violations trigger a targeted retry ("pass real props or
 * remove the usage"), and any usage that still cannot be verified is
 * auto-fixed deterministically (empty usage → safe wrapper) so crash-prone
 * JSX never ships.
 */
export async function composeScreenV8(input: ComposeScreenInput): Promise<ComposedScreenV8> {
  const propContract = input.propContract;
  let result = await composeScreenWithRetry(input);

  let audit = auditScreenProps(result.screen, propContract);
  if (audit.violations.length > 0) {
    const notes = audit.violations
      .map((v) => `- ${v.componentName} requires ${v.missingRequired.join(", ")} — pass real props from the screen's data/copy or remove the usage.`)
      .join("\n");
    const retried = await composeScreenWithRetry(
      { ...input, extraContext: `PROP-CONTRACT VIOLATIONS (fix these):\n${notes}` },
      1,
    );
    result = retried;
    audit = auditScreenProps(retried.screen, propContract);
  }

  const fixed = applyPropAutoFix(result.screen, audit, propContract);
  return {
    code: fixed.code,
    retries: result.retries,
    propViolations: fixed.audit.violations,
    autoFixed: fixed.fixed,
  };
}

function cleanScreenOutput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:tsx|typescript|jsx|javascript)?\s*\n?/, "");
  s = s.replace(/\n?```\s*$/, "");
  return s.trim();
}

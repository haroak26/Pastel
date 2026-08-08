import { chatText, extractFencedBlock, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { baseComponentCode } from "../base-components/index";
import { SANDBOX_CONTRACT } from "../contract";
import type { ComponentUISpec, ResolvedTheme, WireframePlan } from "../schemas";
import type { VisualReference } from "../types";
import { datasetPrompt, type MockDataset } from "../lib/content";

/**
 * V6/V7 Builder agent — generates the product's OWN components by ADAPTING the
 * base component library to the company's design language. Runs in PARALLEL
 * across components (cheap model). The exemplar is reference material (never
 * shipped); the output is unique per run.
 *
 * V7: the builder receives (a) the screens that mount this component and
 * their purposes, (b) the run's domain dataset — so it renders REAL product
 * data through props instead of inventing values (v6 shipped "0.0 mi" stats
 * and empty-state bodies inside avatars because the builder had no context),
 * and (c) a component size budget (no pages inside components).
 */

export interface BuilderInput {
  specs: ComponentUISpec[];
  theme: ResolvedTheme;
  wireframe: WireframePlan;
  data: MockDataset;
  onUsage?: OnUsage;
  onFile?: (path: string) => void;
  /** V11: the inspiration company's slug — its reference imagery is attached
   * to builder prompts so components match the real brand's look. */
  companySlug?: string;
  visualReference?: VisualReference;
  /** V18: screen composition summary — the full layout narrative injected into
   * each builder prompt so components are designed with awareness of the
   * overall screen context rather than in isolation. */
  compositionSummary?: string;
}

export interface BuilderOutput {
  components: Record<string, string>;
}

function componentPath(name: string): string {
  return `src/components/${name}.jsx`;
}

function tokensBlock(theme: ResolvedTheme): string {
  const keys = [
    "--background", "--foreground", "--card", "--card-foreground", "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground", "--muted", "--muted-foreground", "--accent", "--accent-foreground",
    "--destructive", "--destructive-foreground", "--success", "--warning", "--border", "--input", "--ring",
  ];
  const lines = ["DESIGN TOKENS — use ONLY these CSS custom properties (never hardcode colors):", ":root {"];
  for (const k of keys) lines.push(`  ${k}: ${theme.cssVars[k]};`);
  lines.push("  --radius-md: " + theme.cssVars["--radius-md"] + ";");
  lines.push("  --radius-lg: " + theme.cssVars["--radius-lg"] + ";");
  lines.push("  --control-sm: 32px; --control-md: 40px; --control-lg: 48px;");
  lines.push("}");
  lines.push("CONTROL SIZING (V11, hard): interactive heights come from the --control-* scale (h-[var(--control-sm)] / h-[var(--control-md)] / h-[var(--control-lg)]) — never raw h-9/h-10/h-11 utilities. Radii come from var(--radius-*) (rounded-[var(--radius-md)] etc.) — never raw rounded-md/xl values that override the theme.");
  return lines.join("\n");
}

function rulesBlock(theme: ResolvedTheme): string {
  return [
    "COMPANY RULES — follow these composition rules:",
    ...theme.manifest.rules.map((r) => `- ${r}`),
    ...theme.manifest.signatureMoves.slice(0, 3).map((s) => `- Signature: ${s}`),
  ].join("\n");
}

function componentSystemPrompt(): string {
  return `You are a senior React developer adapting a reference component for a specific product and design language.

You receive:
1. A COMPONENT SPEC — the props, variants, states and notes the generated component must support.
2. A REFERENCE IMPLEMENTATION — proven, professional code. ADAPT it: keep its craft (spacing rhythm, focus states, token usage, accessibility), but make it THIS product's component: honor the spec's props/variants/notes and the company's design language. The output must be YOUR code — distinct from the reference — never identical.
3. SCREEN COMPOSITION CONTEXT (V18) — the full layout narrative showing where this component sits, what surrounds it, and the screen's dominant moment. Design with awareness of your place in the hierarchy.
4. SCREEN CONTEXT — which screens mount this component and what they are for.
5. PRODUCT DATA — the real domain data this component will display (metrics, items, people, activity). Render it through props; NEVER invent sample values.

CONTRACT:
- Self-contained: imports only from "react" and "lucide-react". NO other packages.
- Default export: export default function Name(props) {...} — keep the same props as the reference (you may add product-specific ones, never drop reference props).
- DESIGN INTENT (V18): the spec carries a one-line creative brief — a concrete description of how this component should look and feel in THIS product. Treat it as art direction. The component must be DISTINCTLY this product's — never a re-skin of the reference. If the reference uses blue, you use the product's primary color. If the reference uses symmetrical layout, try asymmetry. If the reference uses cards, use rows, tiles, or direct content. The output must look like it was designed from scratch for THIS product.
- COMPOSITION CONTEXT (V18): the SCREEN COMPOSITION CONTEXT shows where your component lives. If you're in the dominant moment (text-5xl+ heading, scoreboard-scale data), build LARGE — display-scale type, expansive spacing, hero-scale metrics. If you're a secondary section, stay quiet and compact. If your surface is tonal-band, use transparent or semi-transparent sub-elements. If it's divided-list, don't add your own card containers — the rows ARE the surface. Never compete with the dominant moment.
- RENDER THE PROPS: every value slot (labels, values, units, names, initials, counts) comes from props — never hardcode sample values like "0.0", "0 km", "1,234", "Demo", placeholder names, or empty-state bodies inside a component.
- DISTINCTIVENESS: never produce a component that could be mistaken for the base component with just a color swap. Change shape (rounded-full vs rounded-lg), change density (compact vs generous), change layout (stacked vs side-by-side). The reference is a starting point, not a template.
- SMALL DATA VISUALS: if the component shows a trend, progress, or ratio, render it as a small inline SVG (sparkline, ring, or bar) sized to the slot — never a full chart widget with axes. The Chart component stays a screen-level block.
- SIZE BUDGET — a component is a BUILDING BLOCK, never a page:
  · No position:fixed overlays, no bottom sheets, no modals.
  · No page-scale empty states (no max-w-2xl, no p-12/p-16, no text-4xl inside components).
  · Never nest whole-page UI (headers, navbars, big CTA banners) inside a component.
  · Small display slots (avatars, chips, icons) render small — one line or one glyph, never a full block.
  · Every stat/variant renders DISTINCT labels — never repeat the same label for different data slots.
- Style with Tailwind utility classes + the provided CSS custom properties (bg-card, text-muted-foreground, bg-primary, border-input, ring-ring etc. are defined).
- NEVER hardcode colors. This is a HARD rule:
  · No hex codes (#fff, #FFD700, rgba(...)) anywhere in the file.
  · No Tailwind color literals (bg-orange-500, text-pink-600, border-blue-400, from-red-500, etc.).
  · Use ONLY the provided tokens: var(--primary), bg-primary, text-muted-foreground, bg-success, text-success, bg-warning, bg-destructive, border-input, ring-ring, plus the theme's own vars.
- Never hardcode fonts — use var(--font-display)/var(--font-body).
- Implement every prop, variant and state from the spec. Hover/focus/active on interactive elements.
- No <style> tags. No comments about the reference.
- Output ONLY the JSX code inside a single \`\`\`jsx fenced block.

${SANDBOX_CONTRACT}`;
}

const HARDCODED_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsl\(|bg-[a-z]+-[0-9]+|text-[a-z]+-[0-9]+|border-[a-z]+-[0-9]+|from-[a-z]+-[0-9]+|to-[a-z]+-[0-9]+|via-[a-z]+-[0-9]+/;

function hardcodedColorHits(code: string): string[] {
  const hits = new Set<string>();
  for (const m of code.match(/[^'"\s]*#[0-9a-fA-F]{3,8}\b[^'"\s]*/g) ?? []) hits.add(m.trim());
  for (const m of code.match(/[a-z]+-[a-z]+-[0-9]+/g) ?? []) {
    if (/(bg|text|border|from|to|via|ring|divide|fill|stroke|decoration|placeholder|accent|caret|outline)-[a-z]+-[0-9]+/.test(m)) hits.add(m);
  }
  return [...hits].slice(0, 8);
}

export async function generateComponent(
  spec: ComponentUISpec,
  theme: ResolvedTheme,
  opts?: { onUsage?: OnUsage; wireframe?: WireframePlan; data?: MockDataset; companySlug?: string; visualReference?: VisualReference; compositionSummary?: string },
): Promise<string> {
  const exemplar = baseComponentCode(spec.basedOn);
  if (!exemplar) {
    throw new Error(`base component "${spec.basedOn}" not found`);
  }

  // V11: attach the company's reference imagery (vision) so the component is
  // adapted to the brand's ACTUAL look — spacing, shape, component style —
  // not just its token colors. Best effort: prompts still work without it.
  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  if (opts?.companySlug) {
    try {
      const { companyRefImageBlocks } = await import("../knowledge/index");
      refImages = await companyRefImageBlocks(opts.companySlug, 2);
    } catch {
      /* optional */
    }
  }
  if (opts?.visualReference) refImages.push(...opts.visualReference.images);
  const refText = refImages.length > 0
    ? "\n\n### VISUAL REFERENCE IMAGERY\nReference screenshots are attached. Match product-target geometry, spacing, radii, and density; use company imagery only as a secondary style cue. Render THIS product's data through props and do not copy reference content or logos."
    : "";

  const screenContext = opts?.wireframe
    ? (() => {
        const lines: string[] = [];
        for (const s of opts.wireframe!.screens) {
          if (spec.usedBy?.includes(s.id) || spec.usedBy?.length === 0) {
            lines.push(`- ${s.id} (${s.archetype}): ${s.purpose}`);
          }
        }
        return lines.length > 0 ? `### SCREENS THAT MOUNT THIS COMPONENT\n${lines.join("\n")}` : "";
      })()
    : "";

  const dataBlock = opts?.data ? datasetPrompt(opts.data) : "";

  const compositionBlock = opts?.compositionSummary
    ? `### SCREEN COMPOSITION CONTEXT (V18 — where your component lives)\n${opts.compositionSummary}\n\nDesign with awareness of what's around you: if you're in the dominant moment, build LARGE; if you're a secondary section, stay quiet. If your surface is tonal-band, use transparent sub-elements. If divided-list, don't add your own card containers. Never compete with the dominant moment.`
    : "";

  const textPart = [
    "### COMPONENT SPEC",
    JSON.stringify(spec, null, 2),
    "",
    "### REFERENCE IMPLEMENTATION (adapt — never ship verbatim)",
    "```jsx",
    exemplar,
    "```",
    "",
    compositionBlock,
    "",
    screenContext,
    "",
    dataBlock,
    "",
    tokensBlock(theme),
    "",
    rulesBlock(theme),
    "",
    refText,
    "",
    `Generate the component now. It will live at ${componentPath(spec.name)}. Output ONLY the jsx fenced block.`,
  ].join("\n");

  const raw = await chatText(
    [
      { role: "system" as const, content: componentSystemPrompt() },
      { role: "user" as const, content: refImages.length > 0 ? [{ type: "text", text: textPart }, ...refImages] : textPart },
    ],
    {
      model: "builder",
      // V10 creative nudge: warm temperature so the output is a distinctive
      // product component, not a re-skinned exemplar.
      temperature: 0.5,
      maxTokens: MAX_TOKENS_PER_CALL.builder,
      onUsage: opts?.onUsage,
    },
  );

  let code = (extractFencedBlock(raw, "jsx") ?? extractFencedBlock(raw, "js") ?? raw).trim();

  // Bounded token-discipline self-check: one corrective retry listing the
  // offending color literals (cheap, only fires when the gate would fail).
  const hits = hardcodedColorHits(code);
  if (hits.length > 0) {
    const retry = await chatText(
      [
        { role: "system" as const, content: componentSystemPrompt() },
        {
          role: "user" as const,
          content: `${textPart}\n\n### CORRECTION REQUIRED\nYour previous output violates the no-hardcoded-colors rule. Replace EVERY one of these with the theme tokens (bg-primary, text-muted-foreground, var(--primary), var(--success), var(--destructive), etc.):\n${hits.map((h) => `- ${h}`).join("\n")}\n\nRe-emit the full corrected component. Output ONLY the jsx fenced block.`,
        },
      ],
      {
        model: "builder",
        temperature: 0.2,
        maxTokens: MAX_TOKENS_PER_CALL.builder,
        onUsage: opts?.onUsage,
      },
    );
    const corrected = (extractFencedBlock(retry, "jsx") ?? extractFencedBlock(retry, "js") ?? retry).trim();
    if (corrected.length > 0) {
      const remaining = hardcodedColorHits(corrected);
      if (remaining.length === 0) {
        code = corrected;
      } else {
        console.warn(`[pastel v6] builder color self-check: still ${remaining.length} hardcoded color(s) in ${spec.name} after corrective retry`);
      }
    }
  }

  return code;
}

// ── Bounded parallelism ─────────────────────────────────────────────────

const CONCURRENCY = Number(process.env.PASTEL_BUILDER_CONCURRENCY) || 6;

async function pool<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.min(size, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(lanes);
  return results;
}

export async function runBuilder(input: BuilderInput): Promise<BuilderOutput> {
  const components: Record<string, string> = {};
  const generated = await pool(input.specs, CONCURRENCY, async (spec) => {
    const code = await generateComponent(spec, input.theme, {
      onUsage: input.onUsage,
      wireframe: input.wireframe,
      data: input.data,
      companySlug: input.companySlug,
      visualReference: input.visualReference,
      compositionSummary: input.compositionSummary,
    });
    return { path: componentPath(spec.name), code };
  });
  for (const g of generated) {
    components[g.path] = g.code;
    input.onFile?.(g.path);
  }
  return { components };
}

// ── Targeted repair (same contract as v5) ────────────────────────────────

export interface RepairInput {
  path: string;
  code: string;
  fixes: string[];
  theme: ResolvedTheme;
  onUsage?: OnUsage;
}

export async function repairGeneratedFile(input: RepairInput): Promise<string> {
  const systemPrompt = `You are a React developer performing TARGETED REPAIR on an existing generated component.
- Apply the listed fixes precisely; do not redesign or restructure beyond the fixes.
- Preserve exports, props, and the token-based styling (CSS custom properties only).
- Follow the React sandbox contract.
- Output ONLY the repaired file in a \`\`\`jsx fenced block.`;

  const userPrompt = [
    "### FILE TO REPAIR",
    `Path: ${input.path}`,
    "```jsx",
    input.code,
    "```",
    "",
    "### REQUIRED FIXES",
    ...input.fixes.map((f, i) => `${i + 1}. ${f}`),
    "",
    tokensBlock(input.theme),
    "",
    "Apply the fixes and output the complete repaired file. Output ONLY the jsx fenced block.",
  ].join("\n");

  const raw = await chatText(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      model: "repair",
      temperature: 0.2,
      maxTokens: MAX_TOKENS_PER_CALL.repair,
      onUsage: input.onUsage,
    },
  );

  const code = extractFencedBlock(raw, "jsx") ?? extractFencedBlock(raw, "js") ?? raw;
  return code.trim();
}

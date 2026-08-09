import { chatText, extractFencedBlock, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { componentDesignLaw } from "../knowledge/component-law";
import { SANDBOX_CONTRACT } from "../contract";
import type { ComponentUISpec, ResolvedTheme, WireframePlan } from "../schemas";
import type { VisualReference } from "../types";
import { datasetPrompt, type MockDataset } from "../lib/content";

/**
 * V21 Builder agent — generates the product's OWN components from the
 * Component Design Law + the planner's spec. The base-component library is
 * GONE: there is no reference code in the prompt, so every component is
 * designed for this product from scratch.
 *
 * V21 model split (cost + quality): CUSTOM product components are built on
 * the MID tier (gpt-5.6-luna — the model that actually designs); SHELL
 * chrome (Topbar/Sidebar/Button/Avatar/Badge/Input/Select/Separator) stays
 * on the CHEAP tier (claude-haiku-4-5). Components are where most visible
 * design quality lives, and v20 built them on the weakest model in the
 * pipeline.
 *
 * V21 cost rule: company reference imagery is NOT attached to builder calls
 * (the base64 images were the dominant per-call token cost). The design
 * tokens + law carry the style; a user-uploaded visual target is attached
 * for custom components only.
 */

export interface BuilderInput {
  specs: ComponentUISpec[];
  theme: ResolvedTheme;
  wireframe: WireframePlan;
  data: MockDataset;
  onUsage?: OnUsage;
  onFile?: (path: string) => void;
  /** User-uploaded product visual target (Figma/Banani screenshot). */
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
  lines.push("  --radius-xl: " + theme.cssVars["--radius-xl"] + ";");
  lines.push("  --control-sm: 32px; --control-md: 40px; --control-lg: 48px;");
  lines.push("  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10);");
  lines.push("  --shadow-md: 0 4px 6px rgba(16, 24, 40, 0.04), 0 10px 20px rgba(16, 24, 40, 0.10);");
  lines.push("}");
  lines.push("CONTROL SIZING (V11, hard): interactive heights come from the --control-* scale (h-[var(--control-sm)] / h-[var(--control-md)] / h-[var(--control-lg)]) — never raw h-9/h-10/h-11 utilities. Radii come from var(--radius-*) (rounded-[var(--radius-md)] etc.) — never raw rounded-md/xl values that override the theme.");
  lines.push("ELEVATION (V22): shadow-[var(--shadow-sm)] / shadow-[var(--shadow-md)] ONLY for floating/overlay elements and the component's one dominant surface. Never on static panels — no drop-shadows there.");
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
  return `You are a senior product designer + React developer at a real startup. You design ORIGINAL, production-grade components for one specific product. A user should look at your component and think a human design team built it — never "an AI generated this".

You receive:
1. A COMPONENT SPEC — the props, variants, states, and art direction the component must support.
2. THE COMPONENT DESIGN LAW — the design rules you must design under. There is NO reference implementation anywhere; the law is the only anchor. Do not write anything that looks like a generic SaaS component.
3. SCREEN COMPOSITION CONTEXT (V18) — where this component lives, what surrounds it, and the screen's dominant moment.
4. SCREEN CONTEXT — which screens mount this component and what they are for.
5. PRODUCT DATA — the real domain data this component displays (metrics, items, people, activity). Render it through props; NEVER invent sample values.

DESIGN PRINCIPLES (V19/V21 — this is the core of the job):
- THINK LIKE A DESIGNER. Before writing code, decide: what is the ONE visual idea of this component? A big number with a trend? A photo-first tile? A tight metric cluster? That idea should be unmistakable in the output.
- The component must be DISTINCTLY this product's. Ask yourself: "could this component ship in a DIFFERENT product unchanged?" If yes, it is too generic. Reference the product's data, its units, its items, its actions.
- Vary internal layout: a left-aligned cluster, a top row + body, an asymmetric 2/3-1/3 inner split. NEVER center everything.
- Vary density. A compact stat row and a display-scale hero stat are different components, not the same one resized.
- Real product UIs are rarely a grid of identical cards. Prefer divided rows, tonal bands, and asymmetric clusters over card grids. Cards are ONE option among many — and at most ONE card-like container per component.
- USE THE THEME'S RADIUS: panels and containers get rounded-[var(--radius-md)] or rounded-[var(--radius-lg)]; a hero surface may get rounded-[var(--radius-xl)]. A component with no rounded corners reads as unfinished.
- Every value slot (labels, values, units, names, initials, counts) comes from props — never hardcode sample values like "0.0", "0 km", "1,234", "Demo", or placeholder names.

CONTRACT:
- Self-contained: imports only from "react" and "lucide-react". NO other packages.
- Default export: export default function Name(props) {...}.
- DESIGN INTENT (V19): the spec carries a one-line creative brief — a concrete description of how this component should look and feel in THIS product. Treat it as art direction and push it further.
- COMPOSITION CONTEXT (V18): the SCREEN COMPOSITION CONTEXT shows where your component lives. If you're in the dominant moment (text-4xl+ heading, scoreboard-scale data), build LARGE — display-scale type, expansive spacing, hero-scale metrics. If you're a secondary section, stay quiet and compact. If your surface is tonal-band, use transparent or semi-transparent sub-elements. If it's divided-list, don't add your own card containers — the rows ARE the surface. Never compete with the dominant moment.
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
- NEVER hardcode raw sizing that breaks the theme law:
  · Radii come from var(--radius-*) (rounded-[var(--radius-md)] etc.) — never raw rounded-md/xl/lg values.
  · Interactive heights come from the --control-* scale (h-[var(--control-sm)]/h-[var(--control-md)]/h-[var(--control-lg)]) — never raw h-9/h-10/h-11.
  · No gradients. No drop-shadows on static panels. No Inter/Roboto/system-ui.
- Never hardcode fonts — use var(--font-display)/var(--font-body).
- Implement every prop, variant and state from the spec. Hover/focus/active on interactive elements.
- No <style> tags. No comments about deleted references.
- Output ONLY the JSX code inside a single \`\`\`jsx fenced block.

${SANDBOX_CONTRACT}`;
}

const HARDCODED_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsl\(|bg-[a-z]+-[0-9]+|text-[a-z]+-[0-9]+|border-[a-z]+-[0-9]+|from-[a-z]+-[0-9]+|to-[a-z]+-[0-9]+|via-[a-z]+-[0-9]+/;

/** V19: raw utility values that break the theme law — hardcoded radii and
 * off-scale control heights. These are REJECTED like hardcoded colors. */
const THEME_BREAK_RE = /rounded-(?:sm|md|lg|xl|2xl|3xl)\b|\bh-(?:9|10|11|12)\b/;

function hardcodedColorHits(code: string): string[] {
  const hits = new Set<string>();
  for (const m of code.match(/[^'"\s]*#[0-9a-fA-F]{3,8}\b[^'"\s]*/g) ?? []) hits.add(m.trim());
  for (const m of code.match(/[a-z]+-[a-z]+-[0-9]+/g) ?? []) {
    if (/(bg|text|border|from|to|via|ring|divide|fill|stroke|decoration|placeholder|accent|caret|outline)-[a-z]+-[0-9]+/.test(m)) hits.add(m);
  }
  for (const m of code.match(THEME_BREAK_RE) ?? []) hits.add(m);
  return [...hits].slice(0, 8);
}

export async function generateComponent(
  spec: ComponentUISpec,
  theme: ResolvedTheme,
  opts?: { onUsage?: OnUsage; wireframe?: WireframePlan; data?: MockDataset; visualReference?: VisualReference; compositionSummary?: string },
): Promise<string> {
  // V21: custom components are designed by the MID tier; shell chrome stays
  // on the CHEAP tier. Components are the visible design surface — building
  // them on the pipeline's weakest model was the quality bottleneck.
  const shell = spec.name === "Topbar" || spec.name === "Sidebar" || spec.name === "Button"
    || spec.name === "Avatar" || spec.name === "Badge" || spec.name === "Input"
    || spec.name === "Select" || spec.name === "Separator";
  const model: "builder" | "builderCustom" = shell ? "builder" : "builderCustom";

  // V21: the user's visual target (Figma/Banani screenshot) attaches for
  // custom components only. Company reference imagery is never attached —
  // tokens + law carry the brand style at a fraction of the cost.
  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  if (!shell && opts?.visualReference) refImages.push(...opts.visualReference.images);
  const refText = refImages.length > 0
    ? "\n\n### VISUAL REFERENCE IMAGERY\nThe attached product target defines the intended geometry, spacing, radii, and density. Adapt THIS product's data through props; do not copy reference content or logos."
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
    JSON.stringify({ ...spec, basedOn: undefined }, null, 2),
    "",
    "### COMPONENT DESIGN LAW (the ONLY reference — design under it)",
    componentDesignLaw(),
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
      model,
      // V10 creative nudge: warm temperature so the output is a distinctive
      // product component, not a re-skinned template.
      temperature: 0.5,
      maxTokens: MAX_TOKENS_PER_CALL[model],
      onUsage: opts?.onUsage,
    },
  );

  let code = (extractFencedBlock(raw, "jsx") ?? extractFencedBlock(raw, "js") ?? raw).trim();

  // Bounded token-discipline self-check: one corrective retry listing the
  // offending literals (cheap, only fires when the gate would fail).
  const hits = hardcodedColorHits(code);
  if (hits.length > 0) {
    const retry = await chatText(
      [
        { role: "system" as const, content: componentSystemPrompt() },
        {
          role: "user" as const,
          content: `${textPart}\n\n### CORRECTION REQUIRED\nYour previous output violates the token/theme law. Replace EVERY one of these with theme tokens and the radius/control scale:\n${hits.map((h) => `- ${h}`).join("\n")}\n- raw radii → rounded-[var(--radius-md)] / var(--radius-lg)\n- raw heights → h-[var(--control-sm)] / h-[var(--control-md)] / h-[var(--control-lg)]\n\nRe-emit the full corrected component. Output ONLY the jsx fenced block.`,
        },
      ],
      {
        model,
        temperature: 0.2,
        maxTokens: MAX_TOKENS_PER_CALL[model],
        onUsage: opts?.onUsage,
      },
    );
    const corrected = (extractFencedBlock(retry, "jsx") ?? extractFencedBlock(retry, "js") ?? retry).trim();
    if (corrected.length > 0) {
      const remaining = hardcodedColorHits(corrected);
      if (remaining.length === 0) {
        code = corrected;
      } else {
        console.warn(`[pastel v21] builder color self-check: still ${remaining.length} theme violations in ${spec.name} after corrective retry`);
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

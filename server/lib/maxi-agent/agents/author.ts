import { MAX_TOKENS_PER_CALL, MODELS, type OnUsage } from "../gateway";
import type { ChatMessage } from "../gateway";
import { sanitizeFileContent } from "../sandbox";
import type { ResolvedTheme } from "../schemas";
import type { BlueprintScreen, Concept, DesignBlueprint, ManifestComponent } from "../lib/blueprint";
import { callText, gatewayModelChat, type ModelChat } from "../lib/model-chat";
import { SHELL_ICON_NAMES } from "../lib/shell-gen";
import { authorPromptSuffix, HARD_CONSTRAINTS } from "../lib/model-adapter";

/**
 * Maxi Agent v26 — Wave 1 · SYNTHESIS.
 *
 * v26 adds model-aware prompts (Luna gets creative bias, Gemini gets
 * simplicity bias) and a HARD CONSTRAINTS block that moves anti-slop rules
 * from post-hoc lint into the prompt itself. The text-4xl cap, hex ban,
 * TypeScript ban, and gradient ban are now explicit "violation = rejection"
 * constraints that models see before they write a single line.
 */

// ── Shared context ─────────────────────────────────────────────────────────

export interface AuthorContext {
  blueprint: DesignBlueprint;
  concept: Concept;
  theme: ResolvedTheme;
  /** Full src/data.js content — the single content source. */
  dataJs: string;
  chat?: ModelChat;
  onUsage?: OnUsage;
}

function conceptBlock(concept: Concept): string {
  return [
    `CONCEPT — "${concept.name}" (the art direction; every decision obeys it):`,
    concept.thesis,
    `Type voice: ${concept.fonts.display} (display) + ${concept.fonts.body} (body).`,
    `Density: ${concept.density}. Corners: ${concept.cornerLanguage}. Motion: ${concept.motion}.`,
    "Signature moves (make them recognizable):",
    ...concept.signatureMoves.map((s) => `- ${s}`),
  ].join("\n");
}

function tokensBlock(theme: ResolvedTheme): string {
  const keys = [
    "--background", "--foreground", "--card", "--card-foreground", "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground", "--muted", "--muted-foreground", "--accent", "--accent-foreground",
    "--destructive", "--success", "--warning", "--border", "--input", "--ring",
  ];
  const lines = ["DESIGN TOKENS — the ONLY colors/geometry this product uses:", ":root {"];
  for (const k of keys) lines.push(`  ${k}: ${theme.cssVars[k]};`);
  lines.push(`  --radius-sm/md/lg/xl/full: ${theme.cssVars["--radius-sm"]}/${theme.cssVars["--radius-md"]}/${theme.cssVars["--radius-lg"]}/${theme.cssVars["--radius-xl"]}/9999px;`);
  lines.push(`  --control-sm/md/lg: ${theme.cssVars["--control-sm"]}/${theme.cssVars["--control-md"]}/${theme.cssVars["--control-lg"]};`);
  lines.push(`  --font-display: ${theme.cssVars["--font-display"]}; --font-body: ${theme.cssVars["--font-body"]};`);
  lines.push("}");
  return lines.join("\n");
}

function craftPrinciples(model: string): string {
  return `${HARD_CONSTRAINTS}

CRAFT PRINCIPLES (this is the job — a human design team should be proud to ship this):
- ONE VISUAL IDEA. Decide the single thing this surface is about and make it unmistakable. Everything else supports it.
- THE BAR: "could this ship in a different product unchanged?" If yes, redesign — it's generic. Anchor to THIS product's data, units, and actions.
- The dominant moment is DISPLAY-SCALE — the largest element on the screen by far (tabular numerals for data). Use text-4xl + font-black + tracking-tight for maximum impact. NEVER exceed text-4xl.
- Real product UIs are rarely grids of identical cards. Divided rows, tonal bands, asymmetric clusters, inset panels — vary the composition; at most one card-like container per section.
- Density reads as designed, not empty: populate with real DATA rows; no placeholder dashes, no lorem, no invented values.
- Responsive by construction: it must render beautifully at 375px (stack, wrap, hide) and 1440px.
- A11y is craft: visible labels on inputs, aria-labels on icon controls, :focus-visible rings on every interactive element.
- No drop shadows on static panels (reserved for overlays + the one dominant surface). No gradients. No decorative blobs.
${authorPromptSuffix(model)}`;
}

const CODE_CONTRACT = `CODE CONTRACT (hard — verified after you write):
- Self-contained: import ONLY from "react" and "lucide-react" (plus nothing else).
- Default export: export default function Name(props) { ... }.
- EVERY color from tokens: bg-primary, text-muted-foreground, bg-background, border-border, var(--radius-md), var(--control-md)… NEVER hex, rgb(), or Tailwind color literals (bg-blue-500).
- Interactive heights: h-[var(--control-sm|md|lg)]. Radii: rounded-[var(--radius-sm|md|lg|xl)].
- Fonts: var(--font-display) for headings, var(--font-body) for text (the body sets it).
- Implement every declared prop with a sensible default; hover/focus/disabled states on interactive elements.
- Small inline SVG (sparkline/ring/bar) for trends — sized to the slot, never a chart widget with axes.
- Output ONLY the file content — no markdown fences, no commentary.`;

// ── Validation ─────────────────────────────────────────────────────────────

const LEGAL_IMPORT_RE = /^import\s.+?from\s+["'](react|react-dom|lucide-react)(\/[\w-]+)?["'];?$/;
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

export function validateAuthoredFile(code: string, kind: "component" | "screen"): string[] {
  const errors: string[] = [];
  if (!/export\s+default\s+(async\s+)?(function|class|\{)/.test(code) && !/export\s*\{[^}]*\bas\s+default[^}]*\}/.test(code)) {
    errors.push("the file has no default export");
  }
  const importLines = code.match(/^import\s[^\n]+$/gm) ?? [];
  for (const line of importLines) {
    const from = line.match(/from\s+["']([^"']+)["']/)?.[1] ?? "";
    const legal =
      LEGAL_IMPORT_RE.test(line.trim()) ||
      (kind === "screen" && (from.startsWith("./") || from.startsWith("../")));
    if (!legal) {
      errors.push(`illegal import "${from}" — only react/lucide-react${kind === "screen" ? " and project-relative files" : ""} are allowed`);
    }
  }
  if (HEX_RE.test(code)) {
    errors.push("hex color literal found — every color must come from the design tokens");
  }
  if (/bg-(?:blue|red|green|yellow|purple|pink|orange|indigo|violet|cyan|teal|emerald|rose|amber|lime|sky|fuchsia|slate|gray|zinc|neutral|stone)-\d{2,3}/.test(code)) {
    errors.push("raw Tailwind color literal found (e.g. bg-blue-500) — use the token classes (bg-primary, text-muted-foreground…)");
  }
  return errors;
}

function correctiveRetry(messages: ChatMessage[], previous: string, errors: string[]): ChatMessage[] {
  return [
    ...messages,
    { role: "assistant", content: previous },
    {
      role: "user",
      content: `Your file failed deterministic verification:\n${errors.map((e) => `- ${e}`).join("\n")}\n\nRewrite the COMPLETE file fixing every error. Keep everything that worked. Output ONLY the file content.`,
    },
  ];
}

// ── Component authoring ────────────────────────────────────────────────────

const COMPONENT_SYSTEM = `You are a senior product designer + React engineer at a real startup. You write production components — the kind that ship in front of real users at Vercel/Stripe-tier companies. A user looking at your component should think a human design team built it.

You write ONE complete component file per request: original, self-contained, unmistakably THIS product's.`;

function componentUserMessage(ctx: AuthorContext, spec: ManifestComponent, neighbors: string[], model: string): string {
  return [
    conceptBlock(ctx.concept),
    "",
    tokensBlock(ctx.theme),
    "",
    `PRODUCT: ${ctx.blueprint.brief.title} — ${ctx.blueprint.brief.description}`,
    `VOICE: ${ctx.blueprint.brief.copyDirection}`,
    "",
    `YOUR COMPONENT — ${spec.name} (${spec.kind})`,
    `Intent: ${spec.intent}`,
    "Props API (implement EVERY one; this is the contract the screens code against):",
    ...spec.props.map((p) => `- ${p.name}${p.required ? " (required)" : ""}: ${p.type}${p.description ? ` — ${p.description}` : ""}`),
    "",
    neighbors.length > 0 ? `SIBLING COMPONENTS on the same screens (don't compete, don't duplicate):\n${neighbors.join("\n")}` : "",
    "",
    "THE DATA components render (pass real values through props in screens — never hardcode):",
    ctx.dataJs,
    "",
    craftPrinciples(model),
    "",
    spec.kind === "primitive"
      ? "PRIMITIVE NOTE: you carry the concept's corner language and weight. A pill concept gets pill controls; a sharp editorial concept gets 2px squared controls. Controls feel deliberate at h-[var(--control-sm|md|lg)]."
      : "COMPONENT NOTE: you are the product's furniture — designed for the concept's signature moves. A component is a building block, never a page: no fixed overlays, no modals, no page-scale empty states, no page headers.",
    "",
    CODE_CONTRACT,
  ]
    .filter(Boolean)
    .join("\n");
}

export interface AuthoredFile {
  code: string;
  notes: string[];
}

export async function authorComponent(ctx: AuthorContext, spec: ManifestComponent): Promise<AuthoredFile> {
  const chatFn = ctx.chat ?? gatewayModelChat();
  const model = MODELS.author;
  const neighbors = ctx.blueprint.componentManifest
    .filter((c) => c.name !== spec.name && c.usedBy.some((sid) => spec.usedBy.includes(sid)))
    .map((c) => `- ${c.name}: ${c.intent}`);

  const messages: ChatMessage[] = [
    { role: "system", content: COMPONENT_SYSTEM },
    { role: "user", content: componentUserMessage(ctx, spec, neighbors, model) },
  ];

  let code = sanitizeFileContent(await callText(chatFn, messages, {
    model: "author",
    maxTokens: MAX_TOKENS_PER_CALL.author,
    temperature: 0.6,
    onUsage: ctx.onUsage,
  }));
  let errors = validateAuthoredFile(code, "component");

  if (errors.length > 0) {
    code = sanitizeFileContent(await callText(chatFn, correctiveRetry(messages, code, errors), {
      model: "author",
      maxTokens: MAX_TOKENS_PER_CALL.author,
      temperature: 0.4,
      onUsage: ctx.onUsage,
    }));
    errors = validateAuthoredFile(code, "component");
  }
  if (errors.length > 0) {
    throw new Error(`${spec.name}: ${errors.join("; ")}`);
  }
  return { code, notes: [] };
}

// ── Screen authoring ───────────────────────────────────────────────────────

const SCREEN_SYSTEM = `You are a senior product designer + React engineer at a real startup. You write ONE complete app screen per request — production UI that ships in front of real users. Users should think a human design team built it.

You write the COMPLETE screen file: imports, the default-exported component, and a body you design freely — there is no template, no layout plan, no quota. The concept's thesis is your art direction; the screen's job is to make it unmistakable.`;

function manifestApiBlock(manifest: ManifestComponent[], screenId: string): string {
  return [
    "COMPONENT APIs (import from ../components/<Name>.jsx — default exports):",
    ...manifest.map((c) => {
      const props = c.props.map((p) => `${p.name}${p.required ? "!" : "?"}:${p.type}`).join(", ");
      const scope = c.usedBy.includes(screenId) ? "YOURS" : "other screens";
      return `- ${c.name} [${scope}](${c.usedBy.join(",")}): ${props} — ${c.intent}`;
    }),
    "Components marked YOURS are planned for this screen — mount them with real DATA props. You may also use any other listed component if the design wants it.",
  ].join("\n");
}

function screenUserMessage(ctx: AuthorContext, screen: BlueprintScreen, model: string): string {
  return [
    conceptBlock(ctx.concept),
    "",
    tokensBlock(ctx.theme),
    "",
    `PRODUCT: ${ctx.blueprint.brief.title} — ${ctx.blueprint.brief.description}`,
    `VOICE: ${ctx.blueprint.brief.copyDirection}  ·  AUDIENCE: ${ctx.blueprint.brief.audience}`,
    "",
    `YOUR SCREEN — "${screen.id}"`,
    `Intent: ${screen.intent}`,
    `Dominant moment: ${screen.dominantMoment}`,
    "",
    screen.composition ? [
      "SCREEN COMPOSITION (the structural blueprint — adapt freely but keep the spirit):",
      `Hero: ${screen.composition.heroSurface} — ${screen.dominantMoment}`,
      ...screen.composition.sections.map((s, i) => `Section ${i + 1}: ${s.surface} — ${s.purpose}`),
      `Distinct because: ${screen.composition.screenDifferentiator}`,
    ].join("\n") : "",
    "",
    manifestApiBlock(ctx.blueprint.componentManifest, screen.id),
    "",
    "THE DATA (import { DATA } from \"../data.js\" — render ONLY from it; never invent values):",
    ctx.dataJs,
    "",
    `CHROME CONTRACT (navigation is deterministic — never build your own):
import { useState } from "react";
import { NavAdapter, IconOf } from "../lib/shell.jsx";
import { DATA } from "../data.js";
export default function ${screenName(screen.id)}() {
  const [active, setActive] = useState("${screen.id}");
  return (
    <NavAdapter nav="${screen.nav}" activeId="${screen.id}" onNavigate={setActive}>
      {/* your body — designed freely */}
    </NavAdapter>
  );
}
${screen.nav === "none" ? "This screen declares nav \"none\": do NOT mount NavAdapter — the body is the whole screen." : "Mount NavAdapter EXACTLY as shown — it is the only chrome. IconOf names: " + SHELL_ICON_NAMES.join(", ") + ". (You may also import lucide-react icons directly.)"}`,
    "",
    craftPrinciples(model),
    "",
    "SCREEN NOTES: this is an APP screen, not a landing page — no marketing hero, no footer, no pricing. One dominant moment, everything else supporting it. Every list region renders the full DATA.list.rows (all of them). One clear primary action using DATA.primaryCta.",
    "",
    CODE_CONTRACT.replace("import ONLY from \"react\" and \"lucide-react\" (plus nothing else)", "import from react, lucide-react, ../components/*.jsx, ../lib/shell.jsx, ../data.js — nothing else"),
  ].join("\n");
}

export function screenName(id: string): string {
  return id
    .split("-")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join("");
}

function validateScreen(code: string, screen: BlueprintScreen, manifest: ManifestComponent[]): string[] {
  const errors = validateAuthoredFile(code, "screen");
  if (screen.nav !== "none" && !/<NavAdapter\b/.test(code)) {
    errors.push("NavAdapter is not mounted — every screen with nav chrome must wrap its body in NavAdapter");
  }
  if (screen.nav === "none" && /<NavAdapter\b/.test(code)) {
    errors.push("this screen declares nav \"none\" — do not mount NavAdapter");
  }
  if (!/from\s+["']\.\.\/data(\.js)?["']/.test(code)) {
    errors.push("the screen does not import DATA from ../data.js — all content renders from DATA");
  }
  for (const c of manifest) {
    if (!c.usedBy.includes(screen.id)) continue;
    if (!new RegExp(`<${c.name}[\\s/>]`).test(code)) {
      errors.push(`planned component <${c.name}> is never mounted (the manifest plans it for this screen)`);
    }
  }
  return errors;
}

export async function authorScreen(ctx: AuthorContext, screen: BlueprintScreen): Promise<AuthoredFile> {
  const chatFn = ctx.chat ?? gatewayModelChat();
  const model = MODELS.author;
  const messages: ChatMessage[] = [
    { role: "system", content: SCREEN_SYSTEM },
    { role: "user", content: screenUserMessage(ctx, screen, model) },
  ];

  let code = sanitizeFileContent(await callText(chatFn, messages, {
    model: "author",
    maxTokens: MAX_TOKENS_PER_CALL.author,
    temperature: 0.6,
    onUsage: ctx.onUsage,
  }));
  let errors = validateScreen(code, screen, ctx.blueprint.componentManifest);

  if (errors.length > 0) {
    code = sanitizeFileContent(await callText(chatFn, correctiveRetry(messages, code, errors), {
      model: "author",
      maxTokens: MAX_TOKENS_PER_CALL.author,
      temperature: 0.4,
      onUsage: ctx.onUsage,
    }));
    errors = validateScreen(code, screen, ctx.blueprint.componentManifest);
  }
  if (errors.length > 0) {
    throw new Error(`${screen.id}: ${errors.join("; ")}`);
  }
  return { code, notes: [] };
}

import type { ResolvedTheme } from "./schemas";
import { hexToRgb } from "./lib/colors";

/**
 * Deterministic stylesheet compiler — Pastel v5.
 *
 * Emits the complete stylesheet from a resolved theme: tokens, semantic
 * utility classes (bg-card, text-muted-foreground, border-border…), radius
 * and type-scale overrides, focus rings, and layout helpers. The generated
 * components reference these classes; every pixel is token-driven.
 * Zero model tokens, zero variance.
 *
 * V22: opacity-modified semantic classes (bg-accent/20, bg-muted/50, …) have
 * NO static rule here — the Tailwind CDN doesn't know the semantic tokens and
 * silently emits nothing for them, so those elements render transparent.
 * `compileStylesForRun` scans the run's actual generated files and emits an
 * explicit rule for every opacity class the model wrote.
 */

export interface CompiledStyles {
  css: string;
  fontFamilies: string[];
}

/** Semantic color tokens compileStyles() hand-writes base utilities for. */
const SEMANTIC_TOKENS =
  "background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|success|success-subtle|warning|warning-subtle|border|input|ring";

/** Every {prefix}-{token}/{opacity} usage — optional hover:/focus: chain. */
const OPACITY_CLASS_RE = new RegExp(
  `\\b((?:(?:hover|focus|focus-visible|active|group-hover|even|odd|disabled)\\s*:\\s*)*(?:bg|text|border|ring|divide))-(${SEMANTIC_TOKENS})\\/(\\d{1,3})\\b`,
  "g",
);

const OPACITY_PROPERTY: Record<string, string> = {
  bg: "background-color",
  text: "color",
  border: "border-color",
  ring: "--tw-ring-color",
  divide: "border-color",
};

/**
 * V22 — deterministic opacity coverage for the run's ACTUAL class usage.
 *
 * Scans every generated source file for opacity-modified semantic classes
 * (with or without hover:/focus: prefixes) and emits an explicit rule per
 * unique (prefix, token, opacity) triple. It is generated from the resolved
 * theme hex + the alpha, so it always matches exactly what the model wrote —
 * no static allowlist to drift out of sync with the CDN.
 *
 * Each rule carries BOTH declarations: a precomputed rgba() (zero runtime
 * support risk — verified against the headless Chromium screenshots render)
 * and a color-mix() that keeps the CSS-var reference for evergreen browsers.
 */
export function compileOpacityCoverage(files: Record<string, string>, theme: ResolvedTheme): string {
  const seen = new Set<string>();
  const rules: Array<{ prefix: string; token: string; opacity: number; pseudos: string[] }> = [];

  for (const [path, code] of Object.entries(files)) {
    if (!path.startsWith("src/") || !/\.(jsx|tsx)$/.test(path)) continue;
    for (const m of code.matchAll(OPACITY_CLASS_RE)) {
      const chain = m[1];
      const token = m[2];
      const opacity = Number(m[3]);
      if (!Number.isInteger(opacity) || opacity < 1 || opacity > 100) continue;
      const pseudos = chain.match(/[\w-]+(?=:)/g) ?? [];
      const prefix = chain.split(":").pop() as string;
      const key = `${pseudos.join(",")}:${prefix}-${token}/${opacity}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rules.push({ prefix, token, opacity, pseudos });
    }
  }

  const lines: string[] = [];
  for (const { prefix, token, opacity, pseudos } of rules) {
    const varName = `--${token}`;
    const hex = theme.cssVars[varName];
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
    const { r, g, b } = hexToRgb(hex);
    const alpha = opacity / 100;
    const prop = OPACITY_PROPERTY[prefix];
    if (!prop) continue;

    const escapedClass = [...pseudos.map((p) => `${p}\\:`), `${prefix}-${token}\\/${opacity}`].join("");
    const pseudoSelectors = pseudos.map((p) => `:${p}`).join("");
    const selector = prefix === "divide"
      ? `.${escapedClass}${pseudoSelectors} > :not([hidden]) ~ :not([hidden])`
      : `.${escapedClass}${pseudoSelectors}`;

    const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    const colorMix = `color-mix(in srgb, var(${varName}) ${opacity}%, transparent)`;
    lines.push(`${selector} { ${prop}: ${rgba}; ${prop}: ${colorMix}; }`);
  }

  return lines.length > 0 ? `/* ── V22 opacity coverage (scanned from generated files) ── */\n${lines.join("\n")}` : "";
}

/** Base stylesheet — the full token + semantic-utility sheet (no opacity coverage). */
function compileBaseStyles(theme: ResolvedTheme): string {
  const vars = Object.entries(theme.cssVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  const chartVars = theme.colors.chart
    .map((c, i) => `  --chart-${i + 1}: ${c};`)
    .join("\n");

  const css = [
    ":root {",
    vars,
    chartVars,
    "}",
    "",
    "/* ── Base ── */",
    "* { box-sizing: border-box; }",
    "html { scroll-behavior: smooth; }",
    "body {",
    "  margin: 0;",
    "  font-family: var(--font-body);",
    "  font-size: var(--text-base);",
    "  line-height: 1.5;",
    "  color: var(--foreground);",
    "  background: var(--background);",
    "  -webkit-font-smoothing: antialiased;",
    "  text-rendering: optimizeLegibility;",
    "}",
    "::selection { background: var(--accent); color: var(--accent-foreground); }",
    "a { color: var(--primary); text-decoration: none; }",
    "a:hover { text-decoration: underline; text-underline-offset: 2px; }",
    "button { cursor: pointer; font-family: inherit; }",
    "",
    "/* ── Focus (keyboard visible, mouse invisible) ── */",
    ":focus { outline: none; }",
    ":focus-visible {",
    "  outline: 2px solid var(--ring);",
    "  outline-offset: 2px;",
    "  border-radius: 4px;",
    "}",
    "",
    "/* ── Motion ── */",
    "button, a, input, select, textarea, [role='button'] {",
    "  transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;",
    "}",
    "",
    "/* ── Scrollbar ── */",
    "* { scrollbar-width: thin; scrollbar-color: var(--input) transparent; }",
    "*::-webkit-scrollbar { width: 10px; height: 10px; }",
    "*::-webkit-scrollbar-thumb { background: var(--input); border-radius: 8px; }",
    "*::-webkit-scrollbar-track { background: transparent; }",
    "",
    "/* ── Semantic surface utilities (shadcn-style, token-driven) ── */",
    ".bg-background { background-color: var(--background); }",
    ".bg-card { background-color: var(--card); }",
    ".bg-popover { background-color: var(--popover); }",
    ".bg-primary { background-color: var(--primary); }",
    ".bg-secondary { background-color: var(--secondary); }",
    ".bg-muted { background-color: var(--muted); }",
    ".bg-accent { background-color: var(--accent); }",
    ".bg-destructive { background-color: var(--destructive); }",
    ".bg-success { background-color: var(--success); }",
    ".bg-success-subtle { background-color: var(--success-subtle); }",
    ".bg-warning { background-color: var(--warning); }",
    ".bg-warning-subtle { background-color: var(--warning-subtle); }",
    ".bg-transparent { background-color: transparent; }",
    "",
    ".text-foreground { color: var(--foreground); }",
    ".text-card-foreground { color: var(--card-foreground); }",
    ".text-popover-foreground { color: var(--popover-foreground); }",
    ".text-primary { color: var(--primary); }",
    ".text-primary-foreground { color: var(--primary-foreground); }",
    ".text-secondary-foreground { color: var(--secondary-foreground); }",
    ".text-muted-foreground { color: var(--muted-foreground); }",
    ".text-accent-foreground { color: var(--accent-foreground); }",
    ".text-destructive { color: var(--destructive); }",
    ".text-success { color: var(--success); }",
    ".text-warning { color: var(--warning); }",
    "",
    ".border-border { border-color: var(--border); }",
    ".border-input { border-color: var(--input); }",
    ".border-destructive { border-color: var(--destructive); }",
    ".border-primary { border-color: var(--primary); }",
    ".divide-border > :not([hidden]) ~ :not([hidden]) { border-color: var(--border); }",
    "",
    "/* ── Hover variants (explicit — CDN can't alpha-blend CSS vars) ── */",
    ".hover\\:bg-primary:hover { background-color: var(--primary-hover); }",
    ".hover\\:bg-primary\\/90:hover { background-color: var(--primary-hover); }",
    ".hover\\:bg-accent\\/90:hover { background-color: var(--accent-hover); }",
    ".hover\\:bg-destructive\\/90:hover { background-color: var(--destructive-hover); }",
    ".hover\\:bg-secondary\\/80:hover { background-color: var(--secondary); }",
    ".hover\\:bg-muted\\/50:hover { background-color: var(--muted); }",
    ".hover\\:bg-muted\\/80:hover { background-color: var(--muted); }",
    ".hover\\:text-primary:hover { color: var(--primary); }",
    ".hover\\:text-muted-foreground:hover { color: var(--muted-foreground); }",
    ".hover\\:text-accent-foreground:hover { color: var(--accent-foreground); }",
    ".hover\\:border-primary:hover { border-color: var(--primary); }",
    "",
    "/* ── Rings (color only — width from Tailwind's ring-* utilities) ── */",
    ".ring-ring { --tw-ring-color: var(--ring); }",
    ".focus-visible\\:ring-ring:focus-visible { --tw-ring-color: var(--ring); }",
    ".ring-offset-background { --tw-ring-offset-color: var(--background); }",
    "",
    "/* ── Type scale overrides (body-prefixed to beat CDN specificity) ── */",
    "body .text-xs { font-size: var(--text-xs); }",
    "body .text-sm { font-size: var(--text-sm); }",
    "body .text-base { font-size: var(--text-base); }",
    "body .text-lg { font-size: var(--text-lg); }",
    "body .text-xl { font-size: var(--text-xl); }",
    "body .text-2xl { font-size: var(--text-2xl); }",
    "body .text-3xl { font-size: var(--text-3xl); }",
    "body .text-4xl { font-size: var(--text-4xl); }",
    "body .text-5xl { font-size: var(--text-4xl); }",
    "",
    "/* ── Radius overrides (theme-tunable rounding) ── */",
    "body .rounded-sm { border-radius: var(--radius-sm); }",
    "body .rounded-md { border-radius: var(--radius-md); }",
    "body .rounded-lg { border-radius: var(--radius-lg); }",
    "body .rounded-xl { border-radius: var(--radius-xl); }",
    "body .rounded-full { border-radius: var(--radius-full); }",
    "body .rounded { border-radius: var(--radius-sm); }",
    "body .rounded-[var(--radius)] { border-radius: var(--radius-md); }",
    "",
    "/* ── Visually hidden (a11y) ── */",
    ".sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }",
    "",
    "/* ── Layout helpers ── */",
    ".pastel-frame {",
    "  max-width: var(--content-max);",
    "  margin-inline: auto;",
    // V11: every gutter is on the 8px rhythm (16/24/32/48) — the old 20px
    // floor sat off-grid at mobile and fed geometry off-grid false positives.
    "  padding-inline: clamp(16px, 4vw, 48px);",
    "}",
    ".pastel-prose { max-width: 65ch; }",
    ".pastel-tabular { font-variant-numeric: tabular-nums; }",
    "",
    "/* ── Chart gridlines ── */",
    ".chart-grid line { stroke: var(--border); stroke-opacity: 0.7; }",
    ".chart-axis text { font-size: var(--text-xs); fill: var(--muted-foreground); }",
    "",
    "/* ── Tables ── */",
    "table { border-collapse: collapse; width: 100%; }",
    "th { text-align: left; font-weight: 500; }",
    "td, th { vertical-align: middle; }",
    "",
    "/* ── Display type helper ── */",
    ".pastel-display { font-family: var(--font-display); }",
    "",
    "/* ── Backdrop transparency fallbacks (no alpha-blend needed) ── */",
    ".bg-background\\/95 { background-color: var(--background); }",
    ".bg-background\\/80 { background-color: var(--background); }",
    "",
  ].join("\n");

  return css;
}

/** Thin wrapper kept for callers that only need the base sheet. */
export function compileStyles(theme: ResolvedTheme): CompiledStyles {
  return { css: compileBaseStyles(theme), fontFamilies: theme.fontFamilies };
}

/**
 * V22 — full run stylesheet: base tokens + opacity coverage for every
 * semantic {color}/{opacity} class the run's generated files actually use.
 * Every render path (screenshots, final export, component proofs) should call
 * this with the final generated file set so no opacity class ever renders
 * transparent.
 */
export function compileStylesForRun(theme: ResolvedTheme, files: Record<string, string>): CompiledStyles {
  const coverage = compileOpacityCoverage(files, theme);
  const css = coverage ? `${compileBaseStyles(theme)}\n${coverage}` : compileBaseStyles(theme);
  return { css, fontFamilies: theme.fontFamilies };
}

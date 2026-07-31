import type { DesignSystemSpec } from "../schemas/plan-schemas";
import { cssTokenName } from "./derive";

/**
 * Deterministic src/styles.css — generated from design-system tokens with zero
 * model calls. This is the single source of truth consumed by every component,
 * every screen, and the preview iframe.
 */
export function designTokensToCss(ds: DesignSystemSpec): string {
  const colors = ds.tokens.colors ?? {};
  const fonts = ds.tokens.fonts ?? {};
  const sizes = ds.tokens.sizes ?? {};
  const radius = ds.tokens.radius ?? {};
  const shadows = ds.tokens.shadows ?? {};

  const rootLines = [
    ":root {",
    ...Object.entries(colors).map(([k, v]) => `  --color-${cssTokenName(k)}: ${v};`),
    ...Object.entries(fonts).map(([k, v]) => `  --font-${cssTokenName(k)}: "${v}", sans-serif;`),
    ...Object.entries(sizes).map(([k, v]) => `  --size-${cssTokenName(k)}: ${v};`),
    ...Object.entries(radius).map(([k, v]) => `  --radius-${cssTokenName(k)}: ${v};`),
    ...Object.entries(shadows).map(([k, v]) => `  --shadow-${cssTokenName(k)}: ${v};`),
    "",
    `  --bp-mobile: ${ds.breakpoints.mobile}px;`,
    `  --bp-tablet: ${ds.breakpoints.tablet}px;`,
    `  --bp-desktop: ${ds.breakpoints.desktop}px;`,
    `  --grid-columns: ${ds.grid.columns};`,
    `  --grid-gap: ${ds.grid.gapPx}px;`,
    `  --grid-margin: ${ds.grid.marginPx}px;`,
    `  --container-width: ${ds.spacing.containerWidth}px;`,
    `  --section-gap: ${ds.spacing.sectionGap}px;`,
    "",
    `  --motion-fast: ${ds.motion.durationFastMs}ms;`,
    `  --motion-base: ${ds.motion.durationBaseMs}ms;`,
    `  --motion-ease: ${ds.motion.easing};`,
    "}",
  ];

  return [
    ...rootLines,
    "",
    "* { box-sizing: border-box; margin: 0; padding: 0; }",
    "body { font-family: var(--font-body, sans-serif); background: var(--color-background, #fff); color: var(--color-text, #111); }",
    "button, a, input, select, textarea { transition: color var(--motion-fast) var(--motion-ease), background-color var(--motion-fast) var(--motion-ease), border-color var(--motion-fast) var(--motion-ease); }",
    "",
  ].join("\n");
}

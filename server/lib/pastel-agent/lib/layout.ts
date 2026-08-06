import type { BlockInstance } from "../schemas-v6";

/**
 * V11 layout law — the deterministic spacing/rhythm engine.
 *
 * Every section's vertical padding is assigned by the composer from the 8px
 * rhythm, never hardcoded ad hoc in a recipe. The law (megadesign §4):
 *   - Sections alternate between two ladder steps down the page: lg (32px)
 *     and xl (48px) — never two adjacent sections on the same step.
 *   - The screen's ONE dominant moment and deliberate full-bleed accent
 *     bands take the 2xl step (64px).
 *   - Nothing below 32px of section separation ships (the geometry gate
 *     enforces the same constants on the RENDERED result).
 *
 * The ladder is the ONLY source of section paddings in the recipes: a recipe
 * that invents `py-N` (or reuses a stale step) is a layout-law defect.
 */

/** Alternating rhythm steps (8px rhythm): lg = 32px, xl = 48px. */
export const PAD_STEPS = ["py-8", "py-12"] as const;

/** Dominant-moment step: 64px (2xl) — the hero-scale band. */
export const DOMINANT_PAD = "py-16";

/** Full-bleed accent band moments keep the same generous 2xl step. */
export const BAND_PAD = "py-16";

/** Steps in px, one per ladder level — the gate's rhythm thresholds. */
export const LADDER_PX: Record<string, number> = {
  "py-8": 32,
  "py-12": 48,
  "py-16": 64,
};

export interface PadContext {
  /** Vertical padding step assigned to a section. */
  __pad?: string;
}

/**
 * Section padding for the nth rendered section. The dominant moment is
 * always the biggest; everything else alternates lg/xl rhythm steps.
 */
export function sectionPad(emphasis: boolean | undefined, index: number): string {
  if (emphasis) return DOMINANT_PAD;
  return PAD_STEPS[index % PAD_STEPS.length];
}

/** Tailwind class for a block's assigned rhythm pad (recipe helper). */
export function padCls(inst: BlockInstance & PadContext): string {
  return inst.__pad ?? PAD_STEPS[0];
}

/** Gap between sections (px) — the whitespace floor enforced by the gate. */
export const SECTION_GAP_PX = 16;

/** A step of the rhythm ladder in px (for the gate's threshold math). */
export const STEP_PX = 32;

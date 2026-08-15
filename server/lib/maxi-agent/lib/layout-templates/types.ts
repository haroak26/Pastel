import type { ProductMode } from "../../schemas";

/**
 * Maxi Agent v24 — layout template types.
 *
 * A template is a literal, hand-tuned page structure: page gutter, column
 * gap, section gap, an explicit 8px-multiple spacing scale, and a named
 * slot sequence. The templates are authored ONCE by a human and reused by
 * lib/layout-plan.ts (select-and-fill) instead of re-derived from scratch on
 * every run — the v21 freeform derivation is retired.
 */

export type TemplateNav = "sidebar" | "topbar" | "sidebar+topbar";

/** Section-count buckets the templates are keyed by. */
export type SectionBucket = "2-3" | "4-5" | "6+";

/** Template families — the seven product modes collapse into three page
 *  shapes: catalog (browse/transact), dashboard (track/create/operate/
 *  learn), and social. */
export type TemplateFamily = "catalog" | "dashboard" | "social";

export function familyForMode(mode: ProductMode): TemplateFamily {
  if (mode === "browse" || mode === "transact") return "catalog";
  if (mode === "social") return "social";
  return "dashboard";
}

export function classifySectionBucket(n: number): SectionBucket {
  if (n <= 3) return "2-3";
  if (n <= 5) return "4-5";
  return "6+";
}

/** One slot in the sequence — each consumes exactly one genome region in
 *  order (pair-left + pair-right consume two consecutive regions). */
export interface TemplateSlot {
  placement: "full" | "split-left" | "split-right";
  height: "dominant" | "standard" | "compact";
  /** V24 a11y contract: this slot renders interactive controls, so the
   *  composed section requires visible labels and :focus-visible rings by
   *  construction — a template property, not a per-run check. */
  interactive: boolean;
  /** Optional trailing slot: dropped (never improvised) when the region
   *  count is below the sequence length. Only trailing slots may be
   *  optional, and only when the template declares it. */
  optional?: boolean;
}

export interface LayoutTemplate {
  family: TemplateFamily;
  nav: TemplateNav;
  bucket: SectionBucket;
  /** The canonical screen role this template is authored for. */
  role: "home" | "detail";
  /** Region counts this template accepts — a count outside the set FAILS
   *  loudly ("extend the template set"), it is never improvised. */
  fits: number[];
  /** 8px-multiple spacing scale. */
  gutter: { desktop: number; tablet: number; mobile: number };
  columnGap: number;
  sectionGap: number;
  contentMaxWidth: number;
  slots: TemplateSlot[];
}

/** Named slot-sequence helpers — the same information V21Section carried,
 *  but authored once, not re-derived per run. */
export const SLOTS = {
  dominantFull: (): TemplateSlot => ({ placement: "full", height: "dominant", interactive: false }),
  full: (opts?: { interactive?: boolean; optional?: boolean }): TemplateSlot => ({
    placement: "full", height: "standard", interactive: opts?.interactive ?? false, optional: opts?.optional,
  }),
  compactFull: (opts?: { interactive?: boolean; optional?: boolean }): TemplateSlot => ({
    placement: "full", height: "compact", interactive: opts?.interactive ?? false, optional: opts?.optional,
  }),
  pairLeft: (interactive = false): TemplateSlot => ({ placement: "split-left", height: "standard", interactive }),
  pairRight: (interactive = false): TemplateSlot => ({ placement: "split-right", height: "standard", interactive }),
};

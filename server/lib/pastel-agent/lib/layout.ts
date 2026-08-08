import type { BlockInstance, ProductContext, V17ScreenLayout, V17SectionPlan } from "../schemas";
import type { V17FrameSpec, V17ColumnLayout, CompositionSurface } from "./composition";
import { defaultFrameSpec, columnLayoutFor, canonicalSurface, surfaceCls, CARD_LIKE_SURFACES, framePad } from "./composition";

/**
 * V17 layout law — composition-aware spacing engine.
 *
 * V17 replaces mechanical section-padding alternation with a full
 * frame/column/gap model that understands the relationships BETWEEN sections.
 *
 * Layout is derived from:
 * 1. The product context (app, dashboard, workspace, feed, editor, catalog,
 *    marketing, onboarding) — drives the frame spec.
 * 2. The spacing mood (compact, standard, generous) — drives density within
 *    the frame.
 * 3. The screen's column layout (single, two-column, rail, split, stacked) —
 *    drives content placement.
 * 4. The section relationships (continues, separated, supports, follows) —
 *    drives inter-section gaps.
 *
 * Backward-compatible with v15 PadContext (compose.ts recipes still use it;
 * the frame spec is written into the pad from section metadata).
 */

export type SpacingMood = "compact" | "standard" | "generous";

export interface PadContext {
  __pad?: string;
  __cols?: "2" | "3" | "4";
  __pattern?: "uniform" | "featured-first" | "asymmetric";
  /** V17: the rendered surface class for this block. */
  __surface?: string;
  /** V17: relationship to the previous section. */
  __relationship?: V17SectionPlan["relationship"];
  /** V17: placement frame (full, content, rail). */
  __frame?: "full" | "content" | "rail";
}

/** Legacy ladders for backward compat. */
export const PAD_LADDERS: Record<SpacingMood, readonly [string, string]> = {
  compact: ["py-8", "py-10"],
  standard: ["py-8", "py-12"],
  generous: ["py-12", "py-14"],
};

export const DOMINANT_PAD = "py-16";
export const BAND_PAD = "py-16";

export const LADDER_PX: Record<string, number> = {
  "py-8": 32, "py-10": 40, "py-12": 48, "py-14": 56, "py-16": 64,
};

export const SECTION_GAP_PX = 16;
export const STEP_PX = 32;

/** V17: section padding from the V17FrameSpec, not from alternating ladders. */
export function sectionPadV17(
  emphasis: boolean | undefined,
  relationship: "continues" | "separated" | "supports" | "follows" | undefined,
  spec: V17FrameSpec,
): string {
  if (emphasis) return framePad(spec.dominantPaddingY);
  if (relationship === "supports" || relationship === "continues") return framePad(spec.compactPaddingY);
  return framePad(spec.standardPaddingY);
}

/** Legacy section padding (used by v15 composes). */
export function sectionPad(emphasis: boolean | undefined, index: number, mood: SpacingMood = "standard"): string {
  if (emphasis) return DOMINANT_PAD;
  return PAD_LADDERS[mood][index % 2];
}

export function padCls(inst: BlockInstance & PadContext): string {
  return inst.__pad ?? PAD_LADDERS.standard[0];
}

/** V17: build a V17ScreenLayout from block instances + product context. */
export function v17ScreenLayout(
  screenId: string,
  blocks: (BlockInstance & { component?: string })[],
  ctx: ProductContext,
  mood: SpacingMood,
): V17ScreenLayout {
  const spec = defaultFrameSpec(ctx, mood);
  const frame = columnLayoutFor(screenId === "home" ? "home" : "detail", "track", ctx);
  const sections: V17SectionPlan[] = blocks.map((b, i) => {
    const emphasis = b.emphasis ?? false;
    const prev = i > 0 ? blocks[i - 1] : null;
    const relationship: V17SectionPlan["relationship"] = emphasis ? "separated"
      : prev?.emphasis ? "supports"
      : i === 0 ? "separated"
      : "continues";
    const surface = canonicalSurface(b.block, b.variant, screenId === "home" ? "home" : "detail", emphasis);
    return {
      block: b.block,
      variant: b.variant,
      surface,
      relationship,
      width: b.block === "hero" ? "full" : "content",
      sticky: screenId === "detail" && b.block === "detail",
      pair: Boolean((b as any).ratio),
      emphasis,
      component: (b as any).component,
    };
  });

  return {
    screenId,
    frame,
    sections,
  };
}

/** V17: generate the Tailwind spacing grid for this screen's layout. */
export function layoutGridCls(spec: V17FrameSpec, frame: V17ColumnLayout): string {
  const gutter = `px-${Math.round(spec.pageGutter / 4)}`;
  switch (frame) {
    case "single": return `${gutter}`;
    case "two-column": return `${gutter} lg:grid lg:grid-cols-[${Math.round(spec.primaryColumnRatio * 100)}fr_${Math.round(spec.secondaryColumnRatio * 100)}fr] lg:gap-${Math.round(spec.columnGap / 4)}`;
    case "rail": return `${gutter} lg:grid lg:grid-cols-[300px_1fr] lg:gap-${Math.round(spec.columnGap / 4)}`;
    case "split": return `${gutter} lg:grid lg:grid-cols-2 lg:gap-${Math.round(spec.columnGap / 4)}`;
    case "stacked": return `${gutter}`;
  }
}

/** V17: max-width container class for the content column. */
export function contentMaxCls(spec: V17FrameSpec): string {
  return `max-w-[${spec.contentMaxWidth}px] mx-auto`;
}

import type { ProductMode, ProductContext } from "../schemas";

/**
 * V17 composition engine — the deterministic layout model.
 *
 * V17 replaces section-only padding alternation with a full composition model
 * that understands page frames, columns, rails, module groups, and the
 * relationships BETWEEN sections (not just their order).
 *
 * Every section is placed inside a named frame, and spacing derives from the
 * frame/column/gap hierarchy — no more alternating py-8/py-12 without context.
 */

export type CompositionSurface =
  | "tonal-band"
  | "soft-wash"
  | "hairline-section"
  | "divided-list"
  | "inset-panel"
  | "floating-action"
  | "accent-block"
  | "split-panel"
  | "editorial-tile"
  | "metric-cluster"
  | "plain"
  | "card";

export interface V17FrameSpec {
  pageGutter: number;            // px
  contentMaxWidth: number;       // px
  columnGap: number;             // px, between columns
  moduleGap: number;             // px, between unrelated modules
  sectionGap: number;            // px, between related sections
  subsectionGap: number;         // px, between subsections within a module
  controlGap: number;            // px, between interactive controls
  denseGap: number;              // px, compact list gaps
  primaryColumnRatio: number;    // 0-1 fraction of content width
  secondaryColumnRatio: number;  // 0-1 fraction
  dominantPaddingY: number;      // px, the hero-scale vertical breathing
  standardPaddingY: number;      // px, normal section padding
  compactPaddingY: number;       // px, dense section padding
  headerHeight: number;          // px, topbar or sidebar header
}

export type V17ColumnLayout = "single" | "two-column" | "rail" | "split" | "stacked";

export type V17SectionRelationship = "continues" | "separated" | "supports" | "follows";

export interface V17SectionPlan {
  block: string;
  variant?: string;
  surface: CompositionSurface;
  group?: string;
  relationship?: V17SectionRelationship;
  width?: "full" | "content" | "rail";
  sticky?: boolean;
  pair?: boolean;
  emphasis?: boolean;
  component?: string;
}

export interface V17ScreenLayout {
  screenId: string;
  frame: V17ColumnLayout;
  primaryWidth?: "compact" | "standard" | "wide";
  secondaryWidth?: "compact" | "standard" | "wide";
  gap?: "tight" | "standard" | "wide";
  alignment?: "top" | "center" | "stretch";
  mobileOrder?: string[];
  dominantMoment?: string;
  sections: V17SectionPlan[];
}

export interface V17LayoutPlan {
  version: "1.0.0";
  screens: V17ScreenLayout[];
  rationale?: string;
}

/** V17 frame defaults per product context. */
export function defaultFrameSpec(ctx: ProductContext, density: "compact" | "standard" | "generous"): V17FrameSpec {
  const isApp = ctx !== "marketing" && ctx !== "onboarding";
  return {
    pageGutter: density === "compact" ? 24 : density === "generous" ? 48 : 32,
    contentMaxWidth: isApp ? 1440 : 1280,
    columnGap: density === "compact" ? 20 : density === "generous" ? 32 : 24,
    moduleGap: density === "compact" ? 24 : density === "generous" ? 48 : 32,
    sectionGap: density === "compact" ? 12 : density === "generous" ? 24 : 16,
    subsectionGap: density === "compact" ? 8 : density === "generous" ? 16 : 12,
    controlGap: density === "compact" ? 4 : density === "generous" ? 12 : 8,
    denseGap: density === "compact" ? 2 : density === "generous" ? 8 : 4,
    primaryColumnRatio: 0.65,
    secondaryColumnRatio: 0.35,
    dominantPaddingY: density === "compact" ? 48 : density === "generous" ? 80 : 64,
    standardPaddingY: density === "compact" ? 24 : density === "generous" ? 48 : 32,
    compactPaddingY: density === "compact" ? 12 : density === "generous" ? 24 : 16,
    headerHeight: 56,
  };
}

/** Tailwind padding class for a given pixel value on the 8px rhythm. */
export function framePad(px: number): string {
  const steps = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 88, 96];
  let best = 16;
  for (const s of steps) {
    if (Math.abs(s - px) < Math.abs(best - px)) best = s;
  }
  return `py-${best / 4}`;
}

/** The visual surface class for each surface type. */
export function surfaceCls(surface: CompositionSurface): string {
  switch (surface) {
    case "tonal-band":
      return "bg-muted/50";
    case "soft-wash":
      return "bg-muted/30";
    case "hairline-section":
      return "border-b";
    case "inset-panel":
      return "rounded-xl border bg-card px-6 py-5";
    case "floating-action":
      return "rounded-2xl bg-background shadow-md";
    case "accent-block":
      return "bg-accent/10 rounded-2xl";
    case "split-panel":
      return "";
    case "editorial-tile":
      return "rounded-xl bg-muted/40 overflow-hidden";
    case "metric-cluster":
      return "";
    case "plain":
      return "";
    case "card":
      return "rounded-xl border bg-card";
  }
}

/** Card-like surfaces that count against the card budget. */
export const CARD_LIKE_SURFACES: Set<CompositionSurface> = new Set([
  "card",
  "inset-panel",
  "editorial-tile",
]);

/** Best column layout for a given screen role + product context. */
export function columnLayoutFor(
  role: "home" | "detail",
  mode: ProductMode,
  ctx: ProductContext,
): V17ColumnLayout {
  if (ctx === "marketing" || ctx === "onboarding") return "single";
  if (role === "detail") return mode === "browse" || mode === "transact" ? "split" : "two-column";
  if (mode === "browse" || mode === "transact") return "single";
  if (mode === "create" || mode === "operate") return "two-column";
  if (mode === "social") return "stacked";
  return "two-column";
}

/** Canonical surface for each section type (not "card" by default). */
export function canonicalSurface(
  block: string,
  variant?: string,
  role?: "home" | "detail",
  emphasis?: boolean,
): CompositionSurface {
  switch (block) {
    case "hero": return "tonal-band";
    case "stats": return "soft-wash";
    case "chart": return variant === "band" ? "soft-wash" : "inset-panel";
    case "search": return "plain";
    case "list": return variant === "cards" ? "soft-wash" : "divided-list";
    case "media": return "plain";
    case "detail": return role === "detail" ? "inset-panel" : "plain";
    case "cta": return "tonal-band";
    case "table": return "inset-panel";
    default: return "plain";
  }
}

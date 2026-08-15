import type { LayoutTemplate, TemplateFamily, TemplateNav, SectionBucket, TemplateSlot } from "./types";
import { SLOTS } from "./types";

/**
 * Maxi Agent v24 — the closed template registry.
 *
 * 3 families (catalog / dashboard / social) × 3 navs (sidebar / topbar /
 * sidebar+topbar) × 3 section-count buckets (2-3 / 4-5 / 6+) — every one is
 * authored by hand below: page gutter, column gap, section gap, the 8px
 * spacing scale, and the named slot sequence. The genome's regions map onto
 * a template's slots in order; a region count no template fits fails loudly
 * (extend THIS set — never improvise a layout at runtime).
 *
 * The bucket templates accept a range of region counts via `fits`; when the
 * actual count is below the sequence length, only slots explicitly marked
 * `optional` (always trailing, always full-width) may be dropped.
 */

function make(family: TemplateFamily, nav: TemplateNav, bucket: SectionBucket, role: "home" | "detail", fits: number[], slots: TemplateSlot[], contentMaxWidth = 1280, columnGap = 32): LayoutTemplate {
  return {
    family,
    nav,
    bucket,
    role,
    fits,
    gutter: { desktop: 24, tablet: 24, mobile: 16 },
    columnGap,
    sectionGap: 32,
    contentMaxWidth,
    slots,
  };
}

// ── Catalog family (browse / transact) ────────────────────────────────────
//
// Home: hero (dominant) → search toolbar + stat cluster pair → product grid
// → custom signature section. Detail: gallery (dominant) → info pane +
// action/list pair → closing action band → optional trailing full.
// Interactive slots: the search toolbar (home pair-left) and the detail
// action band (full).

const CATALOG_HOME_3 = () => [SLOTS.dominantFull(), SLOTS.full({ interactive: true }), SLOTS.full()];
const CATALOG_HOME_5 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(true), SLOTS.pairRight(), SLOTS.full(), SLOTS.full({ optional: true })];
const CATALOG_HOME_6 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(true), SLOTS.pairRight(), SLOTS.full(), SLOTS.full(), SLOTS.full()];

const CATALOG_DETAIL_3 = () => [SLOTS.dominantFull(), SLOTS.full({ interactive: true }), SLOTS.full({ interactive: true, optional: true })];
const CATALOG_DETAIL_5 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full({ interactive: true }), SLOTS.full({ optional: true })];
const CATALOG_DETAIL_6 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full(), SLOTS.full({ interactive: true }), SLOTS.full()];

// ── Dashboard family (track / create / operate / learn) ───────────────────
//
// Home: stat scoreboard (dominant) → trend band → list + custom pair →
// history rows. Detail: info pane (dominant) → activity + custom pair →
// closing action band → optional trailing full.
// Interactive slots: the pair-right on detail (custom components with
// actions) and the action band (full).

const DASH_HOME_3 = () => [SLOTS.dominantFull(), SLOTS.full(), SLOTS.full({ optional: true })];
const DASH_HOME_5 = () => [SLOTS.dominantFull(), SLOTS.full(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full({ optional: true })];
const DASH_HOME_6 = () => [SLOTS.dominantFull(), SLOTS.full(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full(), SLOTS.full()];

const DASH_DETAIL_3 = () => [SLOTS.dominantFull(), SLOTS.full(), SLOTS.full({ interactive: true, optional: true })];
const DASH_DETAIL_5 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full({ interactive: true }), SLOTS.full({ optional: true })];
const DASH_DETAIL_6 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full(), SLOTS.full(), SLOTS.full({ interactive: true })];

// ── Social family ─────────────────────────────────────────────────────────
//
// Home: activity feed (dominant) → community pulse + trending pair →
// custom signature. Detail: thread pane (dominant) → replies + custom pair
// → community action band.
// Interactive slots: the pair-right on detail and the trailing action band.

const SOCIAL_HOME_3 = () => [SLOTS.dominantFull(), SLOTS.full(), SLOTS.full({ optional: true })];
const SOCIAL_HOME_5 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(), SLOTS.full(), SLOTS.full({ optional: true })];
const SOCIAL_HOME_6 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(), SLOTS.full(), SLOTS.full(), SLOTS.full()];

const SOCIAL_DETAIL_3 = () => [SLOTS.dominantFull(), SLOTS.full(), SLOTS.full({ interactive: true, optional: true })];
const SOCIAL_DETAIL_5 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full({ interactive: true }), SLOTS.full({ optional: true })];
const SOCIAL_DETAIL_6 = () => [SLOTS.dominantFull(), SLOTS.pairLeft(), SLOTS.pairRight(true), SLOTS.full(), SLOTS.full(), SLOTS.full()];

const HOME_FOR: Record<TemplateFamily, Record<SectionBucket, () => TemplateSlot[]>> = {
  catalog: { "2-3": CATALOG_HOME_3, "4-5": CATALOG_HOME_5, "6+": CATALOG_HOME_6 },
  dashboard: { "2-3": DASH_HOME_3, "4-5": DASH_HOME_5, "6+": DASH_HOME_6 },
  social: { "2-3": SOCIAL_HOME_3, "4-5": SOCIAL_HOME_5, "6+": SOCIAL_HOME_6 },
};

const DETAIL_FOR: Record<TemplateFamily, Record<SectionBucket, () => TemplateSlot[]>> = {
  catalog: { "2-3": CATALOG_DETAIL_3, "4-5": CATALOG_DETAIL_5, "6+": CATALOG_DETAIL_6 },
  dashboard: { "2-3": DASH_DETAIL_3, "4-5": DASH_DETAIL_5, "6+": DASH_DETAIL_6 },
  social: { "2-3": SOCIAL_DETAIL_3, "4-5": SOCIAL_DETAIL_5, "6+": SOCIAL_DETAIL_6 },
};

const NAVS: TemplateNav[] = ["sidebar", "topbar", "sidebar+topbar"];
const BUCKETS: SectionBucket[] = ["2-3", "4-5", "6+"];

function buildAll(): LayoutTemplate[] {
  const out: LayoutTemplate[] = [];
  for (const family of ["catalog", "dashboard", "social"] as TemplateFamily[]) {
    for (const nav of NAVS) {
      for (const bucket of BUCKETS) {
        const fits = bucket === "2-3" ? [2, 3] : bucket === "4-5" ? [4, 5] : [6];
        // contentMaxWidth + columnGap are hand-tuned so the pair row
        // (2/3 + 1/3) lands on 8px multiples: for 1280 with a 24px gutter
        // the inner width is 1232, so gap-8 (32px) leaves 1200 = 3×400;
        // for 1200 the inner width is 1152, so gap-6 (24px) leaves
        // 1128 = 3×376. Both column edges stay on the 8px grid.
        if (family === "catalog") {
          out.push(make(family, nav, bucket, "home", fits, HOME_FOR[family][bucket](), 1200, 24));
          out.push(make(family, nav, bucket, "detail", fits, DETAIL_FOR[family][bucket](), 1200, 24));
        } else {
          out.push(make(family, nav, bucket, "home", fits, HOME_FOR[family][bucket](), 1280, 32));
          out.push(make(family, nav, bucket, "detail", fits, DETAIL_FOR[family][bucket](), 1280, 32));
        }
      }
    }
  }
  return out;
}

/** The closed template set — every (family × nav × bucket × role) exists. */
export const LAYOUT_TEMPLATES: LayoutTemplate[] = buildAll();

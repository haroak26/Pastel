import type {
  V21LayoutPlan, V21ScreenLayout, V21Section, CopyPlan, ResolvedTheme,
  UxDesignPlan, VisualIntent, WireframePlan, WireframeScreen,
} from "../schemas";
import { uxLayoutFor } from "./ux-design";

/**
 * V21 layout plan — the deterministic PLACEMENT brain.
 *
 * v20's composer was told to "stack the sections" and invented all placement
 * itself, which produced the sparse, unbalanced screens users saw (900px
 * empty gaps, boards with one card per column, odd alignment). V21 derives
 * placement deterministically from the enforced wireframe + UX design +
 * tokens:
 *
 *   - exactly one dominant moment, full-width, display-scale, NO header;
 *   - every other section gets a deterministic header (eyebrow + title);
 *   - sections the UX plan pairs render as a two-up row (2/3 + 1/3);
 *   - every section gets a placement (full / split-left / split-right /
 *     rail), a width, and a height intent;
 *   - the composer receives this plan as a HARD contract and fills the
 *     planned structure — it never invents sections or moves them.
 *
 * The layout gate (checks/layout.ts) verifies the composed output against
 * this plan, so placement is enforced, not requested.
 */

export const SECTION_BLOCK_CAP: Record<string, number> = { home: 5, detail: 4 };

/** Eyebrow + title vocabulary per block (product-aware where copy exists). */
function headerFor(
  block: string,
  variant: string | undefined,
  screen: WireframeScreen,
  copy: CopyPlan,
): { eyebrow?: string; title: string } {
  const c = copy.screens.find((s) => s.screenId === screen.id);
  const fallbackTitle: Record<string, string> = {
    stats: "At a glance",
    chart: "Trends",
    list: "Latest",
    table: "Overview",
    search: "Find",
    media: "Gallery",
    detail: "Details",
    cta: "Next step",
    custom: "Highlights",
    hero: "Overview",
  };
  switch (block) {
    case "stats": {
      const statLabel = c?.statLabels?.[0]?.label;
      return { eyebrow: "Overview", title: statLabel ? `${statLabel} at a glance` : fallbackTitle.stats };
    }
    case "chart":
      return { eyebrow: "Trends", title: c?.chartTitle ?? c?.chartSubtitle ?? fallbackTitle.chart };
    case "list": {
      if (variant === "activity") return { eyebrow: "Activity", title: "Recent activity" };
      if (variant === "sequence") return { eyebrow: "Progress", title: "Your path" };
      if (variant === "cards") return { eyebrow: "Browse", title: "Explore" };
      if (variant === "featured") return { eyebrow: "Featured", title: "Curated picks" };
      return { eyebrow: "Overview", title: c?.tableTitle ?? fallbackTitle.list };
    }
    case "media":
      return { eyebrow: "Gallery", title: "In detail" };
    case "detail":
      return { eyebrow: "Details", title: c?.detailFields?.[0] ?? fallbackTitle.detail };
    case "cta":
      return { eyebrow: "Next", title: c?.primaryCta ?? fallbackTitle.cta };
    case "search":
      return { eyebrow: "Find", title: c?.searchPlaceholder ?? fallbackTitle.search };
    case "table":
      return { eyebrow: "Overview", title: c?.tableTitle ?? fallbackTitle.table };
    case "hero":
      return { eyebrow: "Welcome", title: c?.overline ?? c?.headline ?? fallbackTitle.hero };
    default:
      return { eyebrow: "Highlights", title: fallbackTitle.custom };
  }
}

/** Height intent per block — the dominant moment is display-scale; charts and
 * lists are standard; search/filters and compact rows are compact. */
function heightFor(block: string, emphasis: boolean | undefined): V21Section["heightIntent"] {
  if (emphasis) return "dominant";
  if (block === "search" || block === "hero") return "compact";
  if (block === "stats" && !emphasis) return "compact";
  return "standard";
}

function surfaceFor(block: string, variant: string | undefined, uxSurface: string | undefined): string {
  if (uxSurface) {
    const map: Record<string, string> = {
      band: "tonal-band",
      card: "card",
      rows: "divided-list",
      tiles: "soft-wash",
      toolbar: "plain",
      gallery: "plain",
    };
    if (map[uxSurface]) return map[uxSurface];
  }
  switch (`${block}:${variant ?? "default"}`) {
    case "hero:app": return "tonal-band";
    case "stats:scoreboard": return "soft-wash";
    case "chart:band": return "soft-wash";
    case "list:cards": return "soft-wash";
    case "list:activity": return "divided-list";
    case "list:rows": return "divided-list";
    case "list:sequence": return "divided-list";
    case "media:gallery": return "plain";
    case "detail:pane": return "inset-panel";
    case "cta:band": return "tonal-band";
    case "search:dropdown": return "plain";
    default: return "plain";
  }
}

/**
 * Derive the V21 placement plan for one screen.
 *
 * Placement rules:
 * - The dominant block is full-width, display-scale, no header.
 * - The detail pane is a two-column split (content-left + sticky summary).
 * - Sections the UX plan pairs render as a two-up row (first = split-left
 *   with the larger share, second = split-right).
 * - Everything else is full-width with a deterministic header.
 */
export function layoutForScreen(
  wireframe: WireframePlan,
  screen: WireframeScreen,
  ux: UxDesignPlan | null,
  visual: VisualIntent | null,
  copy: CopyPlan,
): V21ScreenLayout {
  const uxScreen = ux?.screens.find((s) => s.screenId === screen.id);
  const uxSections = ux ? uxLayoutFor(ux, screen.id) : new Map();
  const mood = visual?.spacingMood ?? "standard";
  const contentMaxWidth = mood === "generous" ? 1200 : mood === "compact" ? 1360 : 1280;

  const sections: V21Section[] = [];
  const blocks = screen.blocks;
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.block === "sidebar" || b.block === "topbar") {
      i++;
      continue;
    }
    const emphasis = b.emphasis ?? false;
    const pair = uxSections.get(b.block)?.pair ?? false;
    const next = i + 1 < blocks.length ? blocks[i + 1] : null;
    const nextEmphasis = next?.emphasis ?? false;
    const pairWith = pair && next && !nextEmphasis && next.block !== "sidebar" && next.block !== "topbar" ? next : null;

    if (b.block === "detail") {
      // Detail pane = two-column: content + sticky summary handled by the
      // detail block itself; the plan marks it full-width with a header.
      sections.push({
        block: b.block,
        variant: b.variant,
        component: b.component,
        placement: "full",
        width: "content",
        heightIntent: emphasis ? "dominant" : "standard",
        surface: surfaceFor(b.block, b.variant, undefined),
        header: emphasis ? undefined : headerFor(b.block, b.variant, screen, copy),
        emphasis,
      });
      i++;
      continue;
    }

    if (pairWith) {
      // Two-up row: the pair renders side-by-side (2/3 + 1/3).
      const left = b;
      const right = pairWith;
      sections.push({
        block: left.block,
        variant: left.variant,
        component: left.component,
        placement: "split-left",
        width: "content",
        heightIntent: heightFor(left.block, left.emphasis),
        surface: surfaceFor(left.block, left.variant, uxSections.get(left.block)?.surface),
        header: headerFor(left.block, left.variant, screen, copy),
        emphasis: left.emphasis,
      });
      sections.push({
        block: right.block,
        variant: right.variant,
        component: right.component,
        placement: "split-right",
        width: "content",
        heightIntent: heightFor(right.block, right.emphasis),
        surface: surfaceFor(right.block, right.variant, uxSections.get(right.block)?.surface),
        header: headerFor(right.block, right.variant, screen, copy),
        emphasis: right.emphasis,
      });
      i += 2;
      continue;
    }

    sections.push({
      block: b.block,
      variant: b.variant,
      component: b.component,
      placement: "full",
      width: "content",
      heightIntent: heightFor(b.block, emphasis),
      surface: surfaceFor(b.block, b.variant, uxSections.get(b.block)?.surface),
      // The dominant moment is the statement — it carries no header.
      header: emphasis ? undefined : headerFor(b.block, b.variant, screen, copy),
      emphasis,
    });
    i++;
  }

  const frame = uxScreen?.layout.structure === "catalog-rail"
    ? "rail"
    : uxScreen?.layout.structure === "detail-asymmetric" || uxScreen?.layout.structure === "detail-classic"
      ? "two-column"
      : "single";

  return {
    screenId: screen.id,
    frame,
    contentMaxWidth,
    sections,
  };
}

/** Full V21 plan for both canonical screens. */
export function buildV21LayoutPlan(
  wireframe: WireframePlan,
  ux: UxDesignPlan | null,
  visual: VisualIntent | null,
  copy: CopyPlan,
): V21LayoutPlan {
  const screens = wireframe.screens.map((s) => layoutForScreen(wireframe, s, ux, visual, copy));
  return {
    version: "1.0.0",
    screens,
    rationale: "Deterministic placement — the composer fills the planned structure exactly.",
  };
}

/** Compact text contract for the composer — the sections it MUST render. */
export function layoutPlanPrompt(plan: V21LayoutPlan): string {
  const lines: string[] = ["## LAYOUT PLAN (HARD — render exactly this, in this order)"];
  for (const screen of plan.screens) {
    lines.push(`\n### ${screen.screenId} — content max ${screen.contentMaxWidth}px, frame ${screen.frame}`);
    for (const sec of screen.sections) {
      const header = sec.header
        ? ` header[eyebrow="${sec.header.eyebrow ?? ""}" title="${sec.header.title}"${sec.header.action ? ` action="${sec.header.action}"` : ""}]`
        : " header[none — dominant moment]";
      const comp = sec.component ? ` component=${sec.component}` : "";
      const surface = sec.surface ? ` surface=${sec.surface}` : "";
      lines.push(`- ${sec.block}:${sec.variant ?? "default"} placement=${sec.placement} width=${sec.width} height=${sec.heightIntent}${surface}${comp}${header}`);
    }
  }
  lines.push("\nRender these sections in EXACTLY this order with EXACTLY these placements. Never add, merge, reorder, or drop a section.");
  return lines.join("\n");
}

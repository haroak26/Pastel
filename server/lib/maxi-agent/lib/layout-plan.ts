import type {
  V21LayoutPlan, V21ScreenLayout, V21Section, CopyPlan,
  UxDesignPlan, VisualIntent, WireframePlan, WireframeScreen, ProductMode,
} from "../schemas";
import { uxLayoutFor } from "./ux-design";
import { selectTemplate } from "./layout-templates";

/**
 * V21/V24 layout plan — the deterministic PLACEMENT brain.
 *
 * V21 derived placement from the enforced wireframe + UX design + tokens:
 * one dominant moment, deterministic headers, pair hints → two-up rows,
 * per-section placement/width/height. The problem with deriving from scratch
 * every run: the freeform structure was the source of the sparse, unbalanced
 * screens (and, in v23, the mobile clipping — a hand-authored template never
 * ships a min-width that overflows 375px).
 *
 * V24 replaces derivation with TEMPLATE SELECT-AND-FILL (lib/layout-templates/):
 * a closed, hand-authored set of grid templates keyed by
 * (mode-family × nav × section-count-bucket). `layoutForScreen` classifies
 * the screen, selects the template, and maps genome regions onto its slots
 * in order. A region count no template fits FAILS LOUDLY (extend the
 * template set, never improvise). The a11y contract (visible labels +
 * :focus-visible rings on interactive slots) is a template property.
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
 * V24 — template select-and-fill for one screen.
 *
 * 1. Classify: mode family (catalog/dashboard/social) × nav × region count.
 * 2. Select the hand-authored template (throws when nothing fits).
 * 3. Map genome regions onto the template's slots in order. Pair hints from
 *    the UX design are honored when the hinted regions are consecutive at
 *    the template's pair row; otherwise the template structure stands (the
 *    template is the authority, never improvised at runtime).
 */
export function layoutForScreen(
  wireframe: WireframePlan,
  screen: WireframeScreen,
  ux: UxDesignPlan | null,
  visual: VisualIntent | null,
  copy: CopyPlan,
  mode?: ProductMode | null,
): V21ScreenLayout {
  const uxScreen = ux?.screens.find((s) => s.screenId === screen.id);
  const uxSections = ux ? uxLayoutFor(ux, screen.id) : new Map();

  // Nav metadata (legacy wireframes) is shell chrome — never a section.
  const regions = screen.blocks.filter((b) => b.block !== "sidebar" && b.block !== "topbar");
  const nav = (screen.nav === "sidebar" || screen.nav === "topbar" || screen.nav === "sidebar+topbar" ? screen.nav : "topbar") as "sidebar" | "topbar" | "sidebar+topbar";

  const template = selectTemplate({
    mode: mode ?? (screen.archetype === "catalog" ? "browse" : "track"),
    nav,
    regionCount: regions.length,
    role: screen.id === "home" ? "home" : "detail",
  });

  const ordered = regions;

  // Region count vs sequence length: optional trailing slots may be
  // dropped; anything else is a loud failure (extend the template set).
  let slots = template.slots;
  if (ordered.length < slots.length) {
    const droppable = slots.filter((s) => s.optional).length;
    if (ordered.length < slots.length - droppable) {
      throw new Error(
        `template ${template.family} × ${template.nav} × ${template.bucket} (${template.role}) has ${slots.length} slots but only ${droppable} optional trailing slots — ${ordered.length} regions do not fit; extend the template set`,
      );
    }
    slots = slots.slice(0, ordered.length);
  }
  if (ordered.length > slots.length) {
    // fits must never exceed the authored slot count — a template that
    // promises more regions than it can place crashes the pipeline (v24
    // test2: TypeError on slot.placement). Fail loudly and name the fix.
    throw new Error(
      `template ${template.family} × ${template.nav} × ${template.bucket} (${template.role}) declares ${slots.length} slots but ${ordered.length} regions must map — fits must never exceed slots; extend the template set`,
    );
  }

  const sections: V21Section[] = ordered.map((region, i) => {
    const slot = slots[i]!;
    const emphasis = region.emphasis ?? false;
    return {
      block: region.block,
      variant: region.variant,
      component: region.component,
      placement: slot.placement,
      width: "content",
      heightIntent: emphasis ? "dominant" : slot.height,
      surface: surfaceFor(region.block, region.variant, uxSections.get(region.block)?.surface),
      // The dominant moment is the statement — it carries no header.
      header: emphasis ? undefined : headerFor(region.block, region.variant, screen, copy),
      a11y: slot.interactive,
      // V24 density floors flow to the composer as a hard contract: the
      // section renders ≥ minRows rows and the primary-action section ships
      // a visible primary action.
      minRows: region.minRows,
      primaryAction: region.primaryAction,
      emphasis,
    };
  });

  // The template's 8px-multiple spacing scale replaces the mood-derived
  // content width (the hand-tuned gutter is the source of truth).
  const contentMaxWidth = template.contentMaxWidth;
  void visual;

  return {
    screenId: screen.id,
    frame: uxScreen?.layout.structure === "catalog-rail"
      ? "rail"
      : uxScreen?.layout.structure === "detail-asymmetric" || uxScreen?.layout.structure === "detail-classic"
        ? "two-column"
        : "single",
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
  mode?: ProductMode | null,
): V21LayoutPlan {
  const screens = wireframe.screens.map((s) => layoutForScreen(wireframe, s, ux, visual, copy, mode));
  return {
    version: "1.0.0",
    screens,
    rationale: "Template select-and-fill — the composer fills the planned structure exactly.",
  };
}

/**
 * V23/V24 — the standard path consumes the layout genome directly. The
 * genome call's output is mapped to the enforced wireframe + UX contract by
 * lib/genome.ts (genomeToWireframe), and THIS placement solver selects the
 * hand-authored template and maps regions onto its slots. There is exactly
 * one placement system.
 */
export function buildLayoutPlanFromGenome(
  derived: { wireframe: WireframePlan; ux: UxDesignPlan; mode?: ProductMode | null },
  visual: VisualIntent | null,
  copy: CopyPlan,
): V21LayoutPlan {
  return buildV21LayoutPlan(derived.wireframe, derived.ux, visual, copy, derived.mode);
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
      const a11y = sec.a11y ? " A11Y[interactive — visible <label> + :focus-visible ring required]" : "";
      const floors = sec.minRows ? ` minRows=${sec.minRows}` : "";
      const action = sec.primaryAction ? " PRIMARY_ACTION[mount the screen's one visible primary action]" : "";
      lines.push(`- ${sec.block}:${sec.variant ?? "default"} placement=${sec.placement} width=${sec.width} height=${sec.heightIntent}${surface}${comp}${a11y}${floors}${action}${header}`);
    }
  }
  lines.push("\nRender these sections in EXACTLY this order with EXACTLY these placements. Never add, merge, reorder, or drop a section.");
  return lines.join("\n");
}

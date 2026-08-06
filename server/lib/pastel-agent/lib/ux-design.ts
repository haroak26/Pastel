import type { WireframePlan, WireframeScreen, BlockInstance, ComponentInventory, UxDesignPlan, UxScreenDesign, ProductBrief } from "../schemas-v6";

/**
 * V14 UX design engine — the deterministic half of the UX component.
 *
 * V14 (de-Airbnb fix): the canonical model is PRODUCT-LED, not marketplace-
 * led. Exactly two screens still ship, but their structure derives from the
 * brief's screen purposes:
 *   1. "home"    — the product's primary workflow (dashboard, feed,
 *                  workspace, coaching, or catalog — chosen per product).
 *   2. "detail"  — the focused secondary workflow for one item, record,
 *                  task, or content object.
 * Search toolbars, product grids, photo galleries, booking panes, and guest
 * reviews are ONLY enforced when the product genuinely is a browse/market-
 * place product. A coaching app or dashboard never inherits an Airbnb-style
 * catalog + listing template.
 *
 * This module is the ground truth for that model: it normalizes brief screen
 * purposes to the canonical pair, enforces per-archetype block allowlists and
 * canonical ordering, assigns visual surfaces and card budgets, and derives
 * the default `UxDesignPlan` the composer consumes.
 */

// ── Two-screen canonical model ────────────────────────────────────────────

export const CANONICAL_SCREENS = [
  {
    id: "home",
    archetype: "catalog" as const,
    title: "Home",
    purpose: "The product's primary workflow — the screen users spend the most time in",
    nav: "topbar" as const,
  },
  {
    id: "detail",
    archetype: "list-detail" as const,
    title: "Detail",
    purpose: "The focused secondary workflow for one item, record, task, or content object",
    nav: "topbar" as const,
  },
];

// V14: product-led role derivation. A product only inherits marketplace
// structure when its own screen purposes ask for it — never by default.
const CATALOG_HOME_RE =
  /catalog|browse|marketplace|shop|shopping|store|search|stays?|listing|rental|venue|booking/i;
const MEDIA_DETAIL_RE =
  /listing|gallery|photo|photograph|image|media|video|episode|stay|property|album|visual/i;
const REVIEW_DETAIL_RE =
  /listing|stay|property|reviews?|episode|album|book(?:ing)?|product/i;

/** A home screen that genuinely browses (search + grid are legal and forced). */
export function isCatalogHome(purpose?: string): boolean {
  return CATALOG_HOME_RE.test(purpose ?? "");
}

/** A detail screen that is media-rich (photo/video gallery is the hero). */
export function isMediaDetail(purpose?: string): boolean {
  return MEDIA_DETAIL_RE.test(purpose ?? "");
}

/** A detail screen whose secondary section is social proof (reviews). */
export function detailWantsReviews(purpose?: string): boolean {
  return REVIEW_DETAIL_RE.test(purpose ?? "");
}

const HOMEISH =
  /^(home|landing|dashboard|overview|today|index)$|catalog|browse|explore|discover|feed|library|shop|search|stays|listings|dash|metric|overview|stat/i;
const DETAILISH =
  /^detail$|info|view|item|product|listing|stay|record|episode|workout|guided|page|guide|booking|property/i;

export type ScreenRole = "home" | "detail";

/** The visual surfaces the composer renders sections on. */
export type UxSectionSurface = "band" | "card" | "rows" | "tiles" | "toolbar" | "gallery";

export function roleScore(role: ScreenRole, text: string): number {
  const re = role === "home" ? HOMEISH : DETAILISH;
  let score = 0;
  if (re.test(text)) score += 3;
  if (/^(home|detail)$/i.test(text.trim())) score += 2;
  if (/^home$/i.test(text)) score += 1;
  return score;
}

export function screenRoleOf(screen: { id: string; archetype?: string; purpose?: string }): ScreenRole {
  const text = `${screen.id} ${screen.archetype ?? ""} ${screen.purpose ?? ""}`;
  const home = roleScore("home", text);
  const detail = roleScore("detail", text);
  return home >= detail ? "home" : "detail";
}

/**
 * V9 brief discipline: a brief ALWAYS describes exactly two screens — the
 * main browse screen and the item detail page. Model purposes are matched to
 * those two roles; unmatched purposes are dropped, missing roles fall back to
 * the canonical purpose text. Ids are canonical ("home", "detail") so every
 * later artifact (wireframe, copy, nav, e2e assertions) is stable.
 */
export function normalizeTwoScreens(
  purposes: Array<{ id: string; purpose: string }>,
): Array<{ id: string; purpose: string }> {
  const scored = purposes.map((p) => ({
    p,
    home: roleScore("home", `${p.id} ${p.purpose}`),
    detail: roleScore("detail", `${p.id} ${p.purpose}`),
  }));
  const bestHome = [...scored].sort((a, b) => b.home - a.home)[0];
  const detailCandidates = scored.filter((s) => s !== bestHome).length > 0
    ? scored.filter((s) => s !== bestHome).sort((a, b) => b.detail - a.detail)
    : [bestHome];
  const bestDetail = detailCandidates[0];

  const home = bestHome?.home > 0 ? bestHome.p : { id: "home", purpose: CANONICAL_SCREENS[0].purpose };
  const detail = bestDetail?.detail > 0 ? bestDetail.p : { id: "detail", purpose: CANONICAL_SCREENS[1].purpose };
  const out = [
    { id: "home", purpose: home.id === "home" ? home.purpose : `${home.purpose}` },
    { id: "detail", purpose: detail.id === "detail" ? detail.purpose : `${detail.purpose}` },
  ];
  if (out[0].purpose === home.purpose && home.id !== "home" && home.id !== "detail") {
    out[0].purpose = home.purpose;
  }
  if (out[1].purpose === detail.purpose && detail.id !== "home" && detail.id !== "detail") {
    out[1].purpose = detail.purpose;
  }
  return out;
}

// ── Per-role block discipline ─────────────────────────────────────────────

/** Blocks that belong on each canonical screen. Everything else is a random
 * element in the wrong place and is dropped by enforcement. */
export const ROLE_ALLOWED: Record<ScreenRole, Set<string>> = {
  home: new Set(["hero", "stats", "search", "list", "chart", "custom"]),
  detail: new Set(["media", "detail", "cta", "list", "custom"]),
};

/** Variant normalization — the composer's surface IS the variant, so the
 * wireframe must pick the non-card surface for non-moment sections. */
export const ROLE_VARIANTS: Record<ScreenRole, Record<string, string>> = {
  home: {
    hero: "app",
    search: "dropdown",
    list: "cards",
    stats: "scoreboard",
    chart: "band",
  },
  detail: {
    media: "gallery",
    detail: "pane",
    cta: "band",
    list: "activity",
  },
};

/** Canonical block order per role (search before grid, gallery before pane…). */
export const ROLE_ORDER: Record<ScreenRole, string[]> = {
  home: ["hero", "search", "list", "stats", "chart"],
  detail: ["media", "detail", "cta", "list"],
};

/** Card surfaces per screen (the composer + the gate share this budget):
 * home: the product grid (≤6) is THE catalog moment; everything else is a
 * band/rows/toolbar. detail: exactly ONE summary card; gallery = image tiles. */
export const ROLE_CARD_BUDGET: Record<ScreenRole, number> = {
  home: 7,
  detail: 2,
};

/** V14: the product-led dominant moment — a browse home emphasizes the
 * product grid; a dashboard/feed home emphasizes its hero moment; a
 * media-rich detail emphasizes the gallery; a focused detail emphasizes the
 * info pane. */
export function dominantMomentFor(role: ScreenRole, screen: { purpose?: string }): string {
  if (role === "home") return isCatalogHome(screen.purpose) ? "list:cards" : "hero:app";
  return isMediaDetail(screen.purpose) ? "media:gallery" : "detail:pane";
}

// ── V10/V14 layout structures ─────────────────────────────────────────────

/** Legal layout structures per screen role. The model UX agent picks one;
 * anything else is normalized back to the role's canonical structure.
 * V14: home structures are PRODUCT-LED — dashboard/feed/workspace for
 * non-browse products, catalog-* only when the product genuinely browses. */
export const ROLE_STRUCTURES: Record<ScreenRole, string[]> = {
  home: ["dashboard-led", "feed-led", "workspace-led", "catalog-classic", "catalog-rail", "catalog-featured"],
  detail: ["detail-classic", "detail-asymmetric"],
};

/** Legal structure values (mirrors the uxScreenSchema enum). */
export type UxStructure =
  | "dashboard-led" | "feed-led" | "workspace-led"
  | "catalog-classic" | "catalog-rail" | "catalog-featured"
  | "detail-classic" | "detail-asymmetric"
  | "single-column" | "two-column" | "split";

export function canonicalStructure(role: ScreenRole, structure?: string, catalog = true): UxStructure {
  const s = structure ?? "";
  if (ROLE_STRUCTURES[role].includes(s)) return s as UxStructure;
  if (role === "detail") return "detail-classic";
  return catalog ? "catalog-classic" : "dashboard-led";
}

/** V14: the product-led default home structure — catalog layout only for
 * products that browse, dashboard-led otherwise. */
export function homeStructureFor(purpose?: string): UxStructure {
  return canonicalStructure("home", undefined, isCatalogHome(purpose));
}

const HOME_REQUIRED = ["search", "list"];
const DETAIL_REQUIRED_CATALOG = ["media", "detail", "cta", "list"];
const DETAIL_REQUIRED_FOCUSED = ["detail", "cta"];

function normalizeBlocks(role: ScreenRole, blocks: BlockInstance[], screen: { purpose?: string }): { blocks: BlockInstance[]; notes: string[] } {
  const notes: string[] = [];
  const allowed = ROLE_ALLOWED[role];
  const variants = ROLE_VARIANTS[role];
  // V14: product-led requirements from the screen's own purpose.
  const catalogHome = role === "home" && isCatalogHome(screen.purpose);
  const mediaDetail = role === "detail" && isMediaDetail(screen.purpose);
  const wantsReviews = role === "detail" && detailWantsReviews(screen.purpose);

  let kept = blocks.filter((b) => {
    if (!allowed.has(b.block)) return false;
    // Only the variant(s) that serve this role survive.
    if (role === "home" && b.block === "list" && b.variant && !["cards", "featured", "sequence"].includes(b.variant)) return false;
    if (role === "home" && b.block === "hero" && b.variant && b.variant !== "app") return false;
    if (role === "detail" && b.block === "list" && b.variant && b.variant !== "activity") return false;
    if (role === "detail" && b.block === "detail" && b.variant && !["pane", "bottom"].includes(b.variant)) return false;
    return true;
  });

  // Normalize variants to the role's surface (hero:app, search:dropdown,
  // list:cards, stats:scoreboard, chart:band, media:gallery, cta:band).
  kept = kept.map((b) =>
    variants[b.block] && b.variant && b.variant !== variants[b.block] && !(b.block === "list" && b.variant === "featured")
      ? { ...b, variant: variants[b.block] }
      : b,
  );

  const dropped = blocks.filter((b) => !kept.includes(b));
  if (dropped.length > 0) notes.push(`dropped off-archetype blocks: ${dropped.map((b) => `${b.block}:${b.variant ?? "default"}`).join(", ")}`);

  // Canonical order: role order first, custom blocks trail in their order.
  const ordered: BlockInstance[] = [];
  const customs = kept.filter((b) => b.block === "custom");
  for (const name of ROLE_ORDER[role]) {
    for (const b of kept) if (b.block === name && !ordered.includes(b)) ordered.push(b);
  }
  for (const b of customs) if (!ordered.includes(b)) ordered.push(b);
  if (ordered.length !== kept.length) notes.push("reordered blocks to the canonical layout");

  // Required blocks are guaranteed by construction — but only the ones the
  // product's own purpose calls for (V14: no Airbnb-shaped defaults for
  // non-browse products).
  const present = new Set(ordered.map((b) => b.block));
  if (role === "home") {
    // Browse products get search + grid; everything else is product-led and
    // takes NO forced search toolbar or catalog grid (the v12 coaching
    // dashboard is the canonical example: its primary task is starting
    // today's plan, not browsing).
    if (catalogHome) {
      if (!present.has("search")) {
        ordered.splice(1, 0, { block: "search", variant: "dropdown" });
        notes.push("added search toolbar to home (browse product)");
      }
      if (!present.has("list")) {
        ordered.push({ block: "list", variant: "cards", emphasis: true });
        notes.push("added product grid to home (browse product)");
      }
    } else {
      notes.push(`home is product-led (${(screen.purpose ?? "no purpose").slice(0, 60)}) — no forced search/grid`);
    }
  } else {
    const required = mediaDetail ? DETAIL_REQUIRED_CATALOG : wantsReviews ? [...DETAIL_REQUIRED_FOCUSED, "list"] : DETAIL_REQUIRED_FOCUSED;
    for (let i = required.length - 1; i >= 0; i--) {
      const name = required[i];
      if (!present.has(name)) {
        ordered.splice(0, 0, { block: name, variant: ROLE_VARIANTS.detail[name], content: name === "list" ? undefined : undefined });
        notes.push(`added ${name} to detail`);
      }
    }
  }

  // Final canonical sort (stable): hero → search → grid → bands on home;
  // gallery → pane → action band → reviews on detail.
  const rank = (b: BlockInstance) => {
    const idx = ROLE_ORDER[role].indexOf(b.block);
    return idx === -1 ? ROLE_ORDER[role].length : idx;
  };
  ordered.sort((a, b) => rank(a) - rank(b));

  // V9: one instance per block type — two `detail` or two `search` blocks
  // would double-render the same surface (the double-Reserve bug). Custom
  // blocks stay plural: each mounts a different component.
  const seenBlocks = new Set<string>();
  const deduped: BlockInstance[] = [];
  for (const b of ordered) {
    if (b.block !== "custom" && seenBlocks.has(b.block)) continue;
    seenBlocks.add(b.block);
    deduped.push(b);
  }
  if (deduped.length !== ordered.length) notes.push("dropped duplicate blocks");

  // V9: guest reviews are a DETERMINISTIC section (list:activity on detail).
  // A custom review-ish component would duplicate it — and render its own
  // empty state — so drop review-named customs when the section exists.
  if (role === "detail" && ordered.some((b) => b.block === "list" && b.variant === "activity")) {
    const dup = ordered.filter((b) => b.block === "custom" && /review|testimonial|feedback/i.test(b.component ?? ""));
    if (dup.length > 0) {
      notes.push(`dropped duplicate review component(s): ${dup.map((b) => b.component).join(", ")} (deterministic reviews section renders them)`);
      for (const b of dup) {
        const idx = ordered.indexOf(b);
        if (idx !== -1) ordered.splice(idx, 1);
      }
    }
  }

  // Exactly ONE emphasized (dominant) block per screen.
  const dominantKey = dominantMomentFor(role, screen);
  const emphasized = ordered.filter((b) => b.emphasis);
  if (emphasized.length === 0) {
    const [kind, variant] = dominantKey.split(":");
    const target = ordered.find((b) => b.block === kind && (!variant || b.variant === variant)) ?? ordered.find((b) => b.block === kind) ?? ordered[0];
    if (target) {
      ordered[ordered.indexOf(target)] = { ...target, emphasis: true };
      notes.push(`emphasized ${target.block}:${target.variant ?? "default"} as the dominant moment`);
    }
  } else if (emphasized.length > 1) {
    const [kind, variant] = dominantKey.split(":");
    const keep = emphasized.find((b) => b.block === kind && (!variant || b.variant === variant)) ?? emphasized[0];
    const drop = emphasized.filter((e) => e !== keep);
    notes.push(`de-emphasized ${drop.map((b) => b.block).join(", ")} — one dominant moment per screen`);
    ordered.forEach((b, i) => {
      if (drop.includes(b)) ordered[i] = { ...b, emphasis: undefined };
    });
  }

  return { blocks: ordered, notes };
}

function normalizeNav(role: ScreenRole, nav: WireframeScreen["nav"]): WireframeScreen["nav"] {
  if (nav === "none") return "topbar";
  return nav;
}

/** Pick the single best screen per role (never the same screen twice). */
function pickScreens(screens: WireframeScreen[]): { home: WireframeScreen; detail: WireframeScreen; dropped: WireframeScreen[] } {
  const scored = screens.map((s) => ({ s, role: screenRoleOf(s) }));
  const homes = scored.filter((x) => x.role === "home").sort((a, b) => roleScore("home", `${b.s.id} ${b.s.archetype} ${b.s.purpose}`) - roleScore("home", `${a.s.id} ${a.s.archetype} ${a.s.purpose}`));
  const details = scored.filter((x) => x.role === "detail").sort((a, b) => roleScore("detail", `${b.s.id} ${b.s.archetype} ${b.s.purpose}`) - roleScore("detail", `${a.s.id} ${a.s.archetype} ${a.s.purpose}`));

  let home = homes[0]?.s;
  let detail = details[0]?.s;
  if (home && detail && home.id === detail.id) {
    // Same screen scored highest for both roles — take the runner-up for detail.
    detail = details.find((x) => x.s.id !== home.id)?.s ?? homes.find((x) => x.s.id !== home.id)?.s ?? home;
  }
  if (!home) home = scored.filter((x) => x.s.id !== detail?.id)[0]?.s ?? screens[0];
  if (!detail) detail = scored.find((x) => x.s.id !== home.id)?.s ?? home;

  const chosen = new Set([home, detail]);
  return { home, detail, dropped: screens.filter((s) => !chosen.has(s)) };
}

/**
 * V9 wireframe enforcement — the deterministic UX design.
 * 1. Keep exactly two screens: the best home screen + the best detail screen.
 * 2. Canonical ids ("home" / "detail"), role-correct archetype + nav.
 * 3. Per-role block allowlist, variant normalization, canonical order,
 *    required blocks, exactly one dominant moment.
 * 4. Inventory `usedBy` remapped to the canonical ids; unmounted components
 *    dropped (min 4 stays).
 */
export function enforceUxDesign(
  plan: WireframePlan,
  inventory?: ComponentInventory,
): { plan: WireframePlan; inventory: ComponentInventory; notes: string[] } {
  const notes: string[] = [];
  const { home, detail, dropped } = pickScreens(plan.screens);
  if (dropped.length > 0) notes.push(`dropped ${dropped.length} non-canonical screen(s): ${dropped.map((s) => s.id).join(", ")}`);

  const normalize = (s: WireframeScreen, role: ScreenRole): WireframeScreen => {
    // V14: product-led derivation runs on the MODEL's purpose (the screen
    // purpose is canonicalized AFTER block normalization).
    const { blocks, notes: blockNotes } = normalizeBlocks(role, s.blocks, s);
    notes.push(...blockNotes.map((n) => `${role}/${s.id}: ${n}`));
    const archetype = role === "home" ? (s.archetype === "app-dashboard" ? "app-dashboard" : "catalog") : "list-detail";
    const title = s.title ?? (role === "home" ? "Home" : "Detail");
    return {
      id: role,
      archetype,
      title,
      purpose: role === "home" ? CANONICAL_SCREENS[0].purpose : CANONICAL_SCREENS[1].purpose,
      nav: normalizeNav(role, s.nav),
      blocks,
    };
  };

  const normalizedPlan: WireframePlan = {
    version: "1.0.0",
    screens: [normalize(home, "home"), normalize(detail, "detail")],
    rationale: plan.rationale,
  };

  let outInventory = inventory;
  if (inventory) {
    // Remap usedBy from pre-canonical ids to home/detail, then drop the
    // unmounted (mount contract — v8 rule, kept in v9).
    const idMap = new Map<string, string>([
      [home.id, "home"],
      [detail.id, "detail"],
    ]);
    const mapped = inventory.components.map((c) => ({
      ...c,
      usedBy: c.usedBy.map((id) => idMap.get(id) ?? id),
    }));

    // V11 backfill: a custom block that omits `component` (the wireframe
    // model has a history of doing exactly that, silently killing the entire
    // inventory — test5 shipped 0 components) gets one assigned
    // deterministically: name/purpose keyword match on the block content,
    // else the first unused inventory component for the screen's role, else
    // the block is dropped (and noted).
    const used = new Set<string>();
    const backfill = (role: ScreenRole, b: BlockInstance): BlockInstance => {
      if (b.block !== "custom") return b;
      if (b.component && mapped.some((c) => c.name === b.component)) return b;
      const needle = `${b.content ?? ""} ${CANONICAL_SCREENS[role === "home" ? 0 : 1].purpose}`
        .toLowerCase();
      const byName = mapped.find((c) => !used.has(c.name) && needle.includes(c.name.toLowerCase()));
      if (byName) {
        used.add(byName.name);
        notes.push(`backfilled ${byName.name} onto a custom block on ${role} (component field was missing)`);
        return { ...b, component: byName.name };
      }
      const byRole = mapped.find((c) => !used.has(c.name) && (c.usedBy?.includes(role) ?? false));
      if (byRole) {
        used.add(byRole.name);
        notes.push(`backfilled ${byRole.name} onto a custom block on ${role} (component field was missing)`);
        return { ...b, component: byRole.name };
      }
      notes.push(`dropped custom block with no mountable component on ${role}`);
      return b;
    };
    normalizedPlan.screens = normalizedPlan.screens.map((s) => ({
      ...s,
      blocks: s.blocks.map((b) => backfill(screenRoleOf(s), b)),
    }));

    const mounted = new Set<string>(
      normalizedPlan.screens.flatMap((s) => s.blocks.filter((b) => b.block === "custom" && b.component).map((b) => b.component as string)),
    );
    const kept = mapped.filter((c) => mounted.has(c.name)).slice(0, 8);
    const unmounted = mapped.filter((c) => !kept.includes(c));
    if (unmounted.length > 0) notes.push(`dropped unmounted components: ${unmounted.map((c) => c.name).join(", ")}`);
    outInventory = { ...inventory, components: kept };
  }

  return { plan: normalizedPlan, inventory: outInventory ?? { version: "1.0.0", components: [] }, notes };
}

// ── UX design plan (default) ──────────────────────────────────────────────

const SURFACE_OF: Record<string, UxSectionSurface> = {
  "hero:app": "band",
  "stats:scoreboard": "band",
  "search:dropdown": "toolbar",
  "search:filters": "toolbar",
  "list:cards": "card",
  "chart:band": "band",
  "media:gallery": "gallery",
  "detail:pane": "rows",
  "cta:band": "band",
  "list:activity": "rows",
  custom: "card",
};

function defaultUxFor(screen: WireframeScreen, role: ScreenRole): UxScreenDesign {
  const dominant = screen.blocks.find((b) => b.emphasis) ?? screen.blocks[0];
  const catalogHome = role === "home" && isCatalogHome(screen.purpose);
  const mediaDetail = role === "detail" && isMediaDetail(screen.purpose);
  return {
    screenId: screen.id,
    layout: {
      structure: role === "home" ? homeStructureFor(screen.purpose) : canonicalStructure("detail", undefined),
      dominantMoment: dominant ? `${dominant.block}:${dominant.variant ?? "default"}` : dominantMomentFor(role, screen),
      sections: screen.blocks.map((b) => ({
        block: b.block,
        variant: b.variant,
        surface: SURFACE_OF[`${b.block}:${b.variant ?? "default"}`] ?? SURFACE_OF.custom,
        sticky: role === "detail" && b.block === "detail" && b.variant === "pane",
        emphasis: b.emphasis,
      })),
    },
    notes: role === "detail"
      ? (mediaDetail ? "gallery is the hero; the summary pane is the single card, sticky on desktop" : "the info pane is the focus; the action band closes the screen")
      : (catalogHome ? "toolbar + product grid is the dominant moment; stats/charts render as bands" : "the hero moment leads; no browse toolbar unless the product browses"),
  };
}

/**
 * Build the canonical default UX design for an enforced plan, then overlay a
 * model-authored plan (agents/ux-v6.ts): surface/pair/sticky/emphasis choices
 * are accepted only for blocks that actually exist. The result is what the
 * composer consumes.
 */
export function resolveUxDesign(plan: WireframePlan, modelUx?: UxDesignPlan | null): UxDesignPlan {
  const defaults = plan.screens.map((s) => defaultUxFor(s, screenRoleOf(s)));
  if (!modelUx) return { version: "1.0.0", screens: defaults };

  const modelByScreen = new Map(modelUx.screens.map((s) => [s.screenId, s]));
  const merged = defaults.map((d) => {
    const m = modelByScreen.get(d.screenId);
    if (!m) return d;
    const planScreen = plan.screens.find((s) => s.id === d.screenId);
    const role = screenRoleOf({ id: d.screenId });
    const sections = d.layout.sections.map((sec) => {
      const cand = m.layout.sections.find((c) => c.block === sec.block);
      if (!cand) return sec;
      return {
        block: sec.block,
        variant: sec.variant,
        surface: cand.surface ?? sec.surface,
        pair: cand.pair ?? sec.pair,
        sticky: cand.sticky ?? sec.sticky,
        emphasis: cand.emphasis ?? sec.emphasis,
      };
    });
    return {
      screenId: d.screenId,
      layout: {
        // V10/V14: the structure the model picks is validated against the
        // role's legal set — a home screen can never claim a detail
        // structure, and invalid home structures fall back to the
        // product-led default (catalog-classic for browse, dashboard-led
        // otherwise).
        structure: role === "home"
          ? canonicalStructure(role, m.layout.structure, isCatalogHome(planScreen?.purpose))
          : canonicalStructure(role, m.layout.structure),
        dominantMoment: m.layout.dominantMoment ?? d.layout.dominantMoment,
        sections,
      },
      notes: m.notes ?? d.notes,
    };
  });
  return { version: "1.0.0", screens: merged, rationale: modelUx.rationale };
}

/** Per-screen layout metadata for the composer: block key → behavior. */
export function uxLayoutFor(ux: UxDesignPlan, screenId: string): Map<string, { pair?: boolean; sticky?: boolean; surface?: string; emphasis?: boolean }> {
  const screen = ux.screens.find((s) => s.screenId === screenId);
  const map = new Map<string, { pair?: boolean; sticky?: boolean; surface?: string; emphasis?: boolean }>();
  if (!screen) return map;
  for (const sec of screen.layout.sections) {
    map.set(sec.block, { pair: sec.pair, sticky: sec.sticky, surface: sec.surface, emphasis: sec.emphasis });
  }
  return map;
}

/** The canonical two-screen purpose list for a brief (normalized). */
export function canonicalPurposes(brief: ProductBrief): ProductBrief["screenPurposes"] {
  return normalizeTwoScreens(brief.screenPurposes);
}

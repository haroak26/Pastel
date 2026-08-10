import type { WireframePlan, WireframeScreen, BlockInstance, ComponentInventory, UxDesignPlan, UxScreenDesign, ProductBrief, ProductMode, ProductContext, V17SectionPlan, V17ScreenLayout } from "../schemas";

/**
 * V14 UX design engine — the deterministic half of the UX component.
 *
 * The canonical model is PRODUCT-LED, not marketplace-
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

// ── V15: product-mode helpers (layout intent, never keyword domains) ─────

/** A product whose primary job is discovering items (search + grid legal). */
export function isBrowseMode(mode?: ProductMode | string | null): boolean {
  return mode === "browse" || mode === "transact";
}

/** A product that books/purchases — the ONLY mode where a price/dates/guests
 * booking summary card is legal. */
export function isStayMode(mode?: ProductMode | string | null): boolean {
  return mode === "transact";
}

/** A product whose detail screen carries social proof (reviews). */
export function modeWantsReviews(mode?: ProductMode | string | null): boolean {
  return mode === "browse" || mode === "transact" || mode === "social";
}

/** Deterministic mode classifier — the fallback when the brief model fails
 * or a legacy brief has no mode. Keyword-based like the domain packs, but it
 * only ever feeds CONTENT-adjacent structure (search/grid/reviews), and the
 * booking card stays gated on `transact` alone. */
const MODE_RULES: Array<[ProductMode, RegExp[]]> = [
  ["transact", [/book(?:ing| a| your)? stay/, /vacation rental/, /airbnb/, /checkout/, /purchase/, /add to cart/, /cart/, /reserve/, /host(?:s|ed|ing)?\b/, /nightly/, /check-in/, /book your/]],
  ["social", [/social/, /community/, /feed/, /post(?:s)?\b/, /follow/, /connect/, /share/, /network/, /messag/, /chat/, /creator/, /thread/]],
  ["browse", [/browse/, /catalog/, /marketplace/, /shop/, /store/, /discover/, /explore/, /search.*(?:filter|find)/, /listing/, /collection/]],
  ["create", [/create/, /build(?:ing)?\b/, /design(?:er)?\b/, /author/, /write/, /compose/, /develop(?:er|ment)?\b/, /template/, /agent/, /automate/, /draft/, /code/]],
  ["learn", [/learn/, /coach/, /course/, /lesson/, /train(?:er|ing)?\b/, /practice/, /teach/, /study/, /quiz/, /skill/, /guide/]],
  ["operate", [/manage/, /team/, /project/, /task/, /ops/, /admin/, /email/, /invoice/, /report/, /schedule/, /workflow/, /pipeline/, /dashboard.*team/]],
  ["track", [/track/, /dashboard/, /metric/, /streak/, /habit/, /health/, /fitness/, /workout/, /\brun/, /\bruns/, /record/, /stat/, /progress/, /monitor/, /readiness/, /activity/]],
];

const MODE_PRIORITY: ProductMode[] = ["transact", "social", "browse", "create", "learn", "operate", "track"];

export function classifyMode(text: string): ProductMode {
  const t = text.toLowerCase();
  const scores = new Map<ProductMode, number>();
  for (const [mode, res] of MODE_RULES) {
    scores.set(mode, res.reduce((n, re) => (re.test(t) ? n + 1 : n), 0));
  }
  let best: ProductMode = "track";
  let bestScore = 0;
  for (const mode of MODE_PRIORITY) {
    const s = scores.get(mode) ?? 0;
    if (s > bestScore) {
      best = mode;
      bestScore = s;
    }
  }
  return best;
}

// ── V17: product-context classifier (app vs marketing) ────────────────────
//
// V17 classifies the PRODUCT CONTEXT — "what kind of surface experience is
// this?" — independently from the mode ("what job does the product do?").
// A fitness-tracking dashboard is context=dashboard, mode=track.
// A landing page is context=marketing regardless of mode.
// A coding workspace is context=workspace (or editor), mode=create.

const CONTEXT_RULES: Array<[ProductContext, RegExp[]]> = [
  ["onboarding", [/onboarding/, /sign.?up/, /sign.?in/, /welcome screen/, /registration/, /login page/, /getting started page/]],
  ["marketing", [/landing page/, /marketing/, /product website/, /pricing page/, /campaign/, /promotional/, /company site/, /homepage for/, /public page/]],
  ["catalog", [/browse.*(?:catalog|store|shop)|catalog.*page|shop.*page|store.*page/]],
  ["editor", [/canvas/, /text editor/, /writing tool/, /drawing app/, /design tool/, /creative app/, /code editor/]],
  ["feed", [/feed/, /timeline/, /activity stream/, /social.*page|social.*app/, /content feed/]],
  ["dashboard", [/dashboard/, /metrics page/, /analytics dashboard/, /report.*dashboard/, /admin.*panel/]],
  ["workspace", [/workspace/, /project.*page/, /team.*workspace/, /manage.*project/, /document.*workspace/]],
  ["app", [/app/, /application/, /mobile app/, /web app/, /product interface/, /tool/]],
];

const CONTEXT_PRIORITY: ProductContext[] = ["onboarding", "marketing", "editor", "catalog", "feed", "dashboard", "workspace", "app"];

export function classifyContext(text: string): ProductContext {
  const t = text.toLowerCase();
  const scores = new Map<ProductContext, number>();
  for (const [ctx, res] of CONTEXT_RULES) {
    scores.set(ctx, res.reduce((n, re) => (re.test(t) ? n + 1 : n), 0));
  }
  let best: ProductContext = "app";
  let bestScore = 0;
  for (const ctx of CONTEXT_PRIORITY) {
    const s = scores.get(ctx) ?? 0;
    if (s > bestScore) { best = ctx; bestScore = s; }
  }
  return best;
}

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

/** A home screen that genuinely browses (search + grid are legal and forced).
 * V15: the brief's MODE wins; the purpose regex is only the fallback for
 * legacy briefs without a mode. */
export function isCatalogHome(purpose?: string, mode?: ProductMode | string | null): boolean {
  if (mode !== undefined && mode !== null) return isBrowseMode(mode);
  return CATALOG_HOME_RE.test(purpose ?? "");
}

/** A detail screen that is media-rich (photo/video gallery is the hero).
 * V15: media-richness is a property of the ITEM (its purpose/data), not the
 * mode — a template catalog or a shop is not automatically photo-first. */
export function isMediaDetail(purpose?: string, mode?: ProductMode | string | null): boolean {
  if (mode === "transact") return true;
  return MEDIA_DETAIL_RE.test(purpose ?? "");
}

/** A detail screen whose secondary section is social proof (reviews).
 * V15: browse/transact/social modes want reviews; otherwise the purpose
 * wording decides. */
export function detailWantsReviews(purpose?: string, mode?: ProductMode | string | null): boolean {
  if (mode !== undefined && mode !== null) return modeWantsReviews(mode);
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
 * element in the wrong place and is dropped by enforcement.
 * V17: sidebar and topbar are nav metadata, not content blocks — preserved
 * for the compose layer to interpret as shell configuration. */
export const ROLE_ALLOWED: Record<ScreenRole, Set<string>> = {
  home: new Set(["hero", "stats", "search", "list", "chart", "custom", "sidebar", "topbar"]),
  detail: new Set(["media", "detail", "cta", "list", "custom", "sidebar", "topbar"]),
};

/** V15: the home hero variants a dashboard/coaching/workspace home may use —
 * the app scoreboard (default) or a statement/split/banded/fullbleed moment.
 * Marketing-only "none"-nav variants stay illegal on app screens. */
export const APP_HERO_VARIANTS = new Set(["app", "statement", "split", "banded", "fullbleed"]);

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
export function dominantMomentFor(role: ScreenRole, screen: { purpose?: string }, mode?: ProductMode | string | null): string {
  if (role === "home") return isCatalogHome(screen.purpose, mode) ? "list:cards" : "hero:app";
  return isMediaDetail(screen.purpose, mode) ? "media:gallery" : "detail:pane";
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
export function homeStructureFor(purpose?: string, mode?: ProductMode | string | null): UxStructure {
  return canonicalStructure("home", undefined, isCatalogHome(purpose, mode));
}

const HOME_REQUIRED = ["search", "list"];
const DETAIL_REQUIRED_CATALOG = ["media", "detail", "cta", "list"];
const DETAIL_REQUIRED_FOCUSED = ["detail", "cta"];

function normalizeBlocks(role: ScreenRole, blocks: BlockInstance[], screen: { purpose?: string }, mode?: ProductMode | string | null): { blocks: BlockInstance[]; notes: string[] } {
  const notes: string[] = [];
  const allowed = ROLE_ALLOWED[role];
  const variants = ROLE_VARIANTS[role];
  // V14: product-led requirements from the screen's own purpose.
  // V15: the brief's mode wins; the purpose wording is the legacy fallback.
  const catalogHome = role === "home" && isCatalogHome(screen.purpose, mode);
  const mediaDetail = role === "detail" && isMediaDetail(screen.purpose, mode);
  const wantsReviews = role === "detail" && detailWantsReviews(screen.purpose, mode);

  let kept = blocks.filter((b) => {
    if (!allowed.has(b.block)) return false;
    // V17: sidebar and topbar are nav metadata — always keep them through
    // enforcement; compose handles nav separately.
    if (b.block === "sidebar" || b.block === "topbar") return true;
    // V18/V21 DASHBOARD ANTIPATTERN: hero blocks are ONLY legal on genuine
    // browse/transact homes. Dashboard/workspace/feed/track/learn homes must
    // NEVER open with a marketing-shaped hero — they open with stats or the
    // product's own moment.
    if (role === "home" && b.block === "hero" && !catalogHome) return false;
    // V15 hard gate: off-mode blocks are DROPPED, not just left out — a
    // track/create/operate/learn detail can never keep a gallery the model
    // added, and a non-browse home can never keep a search toolbar.
    if (role === "home" && b.block === "search" && !catalogHome) return false;
    if (role === "detail" && b.block === "media" && !mediaDetail) return false;
    // Only the variant(s) that serve this role survive.
    // V17: non-browse home screens allow rows, sequence, and featured list
    // variants (not just catalog cards). Browse screens get cards/featured.
    if (role === "home" && b.block === "list" && b.variant && catalogHome && !["cards", "featured"].includes(b.variant)) return false;
    if (role === "home" && b.block === "list" && b.variant && !catalogHome && !["rows", "sequence", "featured"].includes(b.variant)) return false;
    if (role === "home" && b.block === "hero" && b.variant && b.variant !== "app" && !APP_HERO_VARIANTS.has(b.variant)) return false;
    if (role === "detail" && b.block === "list" && b.variant && b.variant !== "activity") return false;
    if (role === "detail" && b.block === "detail" && b.variant && !["pane", "bottom"].includes(b.variant)) return false;
    return true;
  });

  // Normalize variants to the role's surface.
  // V17: browse homes normalize list to "cards"; non-browse homes normalize to "rows".
  const homeListDefault = catalogHome ? "cards" : "rows";
  kept = kept.map((b) => {
    if (b.block === "hero" && role === "home" && b.variant && APP_HERO_VARIANTS.has(b.variant)) return b;
    if (b.block === "sidebar" || b.block === "topbar") return b;
    if (b.block === "list" && role === "home") {
      return variants[b.block] && b.variant && b.variant !== homeListDefault
        ? { ...b, variant: homeListDefault }
        : b;
    }
    return variants[b.block] && b.variant && b.variant !== variants[b.block] && !(b.block === "list" && b.variant === "featured")
      ? { ...b, variant: variants[b.block] }
      : b;
  });

  const dropped = blocks.filter((b) => !kept.includes(b));
  if (dropped.length > 0) notes.push(`dropped off-archetype blocks: ${dropped.map((b) => `${b.block}:${b.variant ?? "default"}`).join(", ")}`);

  // Canonical order: role order first, custom blocks trail, nav blocks last.
  const ordered: BlockInstance[] = [];
  const customs = kept.filter((b) => b.block === "custom");
  const navMeta = kept.filter((b) => b.block === "sidebar" || b.block === "topbar");
  for (const name of ROLE_ORDER[role]) {
    for (const b of kept) if (b.block === name && !ordered.includes(b)) ordered.push(b);
  }
  for (const b of customs) if (!ordered.includes(b)) ordered.push(b);
  for (const b of navMeta) if (!ordered.includes(b)) ordered.push(b);
  if (ordered.length !== kept.length) notes.push("reordered blocks to the canonical layout");

  // Required blocks are guaranteed by construction — but only the ones the
  // product's own purpose calls for.
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
      notes.push(`home is product-led (${(screen.purpose ?? "no purpose").slice(0, 60)}) — no forced discovery sections`);
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
  const dominantKey = dominantMomentFor(role, screen, mode);
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

  // V21 clutter cap: a screen is ONE story — at most 5 CONTENT sections on
  // home and 4 on detail (nav metadata — sidebar/topbar — is shell chrome,
  // not a section). Excess custom blocks (the "too much on the screen"
  // defect) are dropped from the TAIL, keeping the required + dominant ones.
  const contentBlocks = ordered.filter((b) => b.block !== "sidebar" && b.block !== "topbar");
  const navBlocks = ordered.filter((b) => b.block === "sidebar" || b.block === "topbar");
  const cap = role === "home" ? 5 : 4;
  if (contentBlocks.length > cap) {
    const droppedTail = contentBlocks.slice(cap);
    for (const b of droppedTail) {
      const idx = ordered.indexOf(b);
      if (idx !== -1) ordered.splice(idx, 1);
    }
    notes.push(`v21 clutter cap: dropped ${droppedTail.length} trailing section(s) on ${role} (${droppedTail.map((b) => b.block).join(", ")}) — max ${cap} per screen`);
  }
  const finalContent = ordered.filter((b) => b.block !== "sidebar" && b.block !== "topbar");
  const finalNav = ordered.filter((b) => b.block === "sidebar" || b.block === "topbar");
  ordered.length = 0;
  ordered.push(...finalContent, ...finalNav);

  return { blocks: ordered, notes };
}

function normalizeNav(role: ScreenRole, nav: WireframeScreen["nav"]): WireframeScreen["nav"] {
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
  mode?: ProductMode | string | null,
): { plan: WireframePlan; inventory: ComponentInventory; notes: string[] } {
  const notes: string[] = [];
  const { home, detail, dropped } = pickScreens(plan.screens);
  if (dropped.length > 0) notes.push(`dropped ${dropped.length} non-canonical screen(s): ${dropped.map((s) => s.id).join(", ")}`);

  const normalize = (s: WireframeScreen, role: ScreenRole): WireframeScreen => {
    // V14: product-led derivation runs on the MODEL's purpose (the screen
    // purpose is canonicalized AFTER block normalization).
    const { blocks, notes: blockNotes } = normalizeBlocks(role, s.blocks, s, mode);
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

    // V21: the mount contract counts `component` on ANY block — the
    // wireframe legitimately hints a component behind a stats/chart/detail
    // block (stats:scoreboard → SprintHealthSummary). v20 only counted
    // custom blocks, silently dropping every hinted component.
    const mounted = new Set<string>(
      normalizedPlan.screens.flatMap((s) => s.blocks.filter((b) => b.component).map((b) => b.component as string)),
    );
    const kept = mapped.filter((c) => mounted.has(c.name)).slice(0, 8);
    const unmounted = mapped.filter((c) => !kept.includes(c));
    if (unmounted.length > 0) notes.push(`dropped unmounted components: ${unmounted.map((c) => c.name).join(", ")}`);
    outInventory = { ...inventory, components: kept };
  }

  return { plan: normalizedPlan, inventory: outInventory ?? { version: "1.0.0", components: [] }, notes };
}

// ── UX design plan (default) ──────────────────────────────────────────────

const SURFACE_OF: Record<string, string> = {
  "hero:app": "tonal-band",
  "stats:scoreboard": "soft-wash",
  "search:dropdown": "plain",
  "search:filters": "plain",
  "list:cards": "card",
  "chart:band": "soft-wash",
  "media:gallery": "plain",
  "detail:pane": "inset-panel",
  "cta:band": "tonal-band",
  "list:activity": "divided-list",
  list: "divided-list",
  custom: "plain",
  hero: "tonal-band",
  stats: "plain",
  chart: "inset-panel",
  search: "plain",
  media: "plain",
  detail: "inset-panel",
  cta: "tonal-band",
  table: "inset-panel",
};

function defaultUxFor(screen: WireframeScreen, role: ScreenRole, mode?: ProductMode | string | null): UxScreenDesign {
  const dominant = screen.blocks.find((b) => b.emphasis) ?? screen.blocks[0];
  const catalogHome = role === "home" && isCatalogHome(screen.purpose, mode);
  const mediaDetail = role === "detail" && isMediaDetail(screen.purpose, mode);
  const grid = catalogHome
    ? { cols: "3" as const, pattern: "uniform" as const }
    : { cols: "3" as const, pattern: "featured-first" as const };
  return {
    screenId: screen.id,
    layout: {
      structure: role === "home" ? homeStructureFor(screen.purpose, mode) : canonicalStructure("detail", undefined),
      dominantMoment: dominant ? `${dominant.block}:${dominant.variant ?? "default"}` : dominantMomentFor(role, screen, mode),
      grid,
      sections: screen.blocks.map((b) => ({
        block: b.block,
        variant: b.variant,
        surface: (SURFACE_OF[`${b.block}:${b.variant ?? "default"}`] ?? SURFACE_OF.custom) as "band" | "card" | "rows" | "tiles" | "toolbar" | "gallery" | undefined,
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
 * model-authored plan (agents/ux.ts): surface/pair/sticky/emphasis choices
 * are accepted only for blocks that actually exist. The result is what the
 * composer consumes.
 */
export function resolveUxDesign(plan: WireframePlan, modelUx?: UxDesignPlan | null, mode?: ProductMode | string | null): UxDesignPlan {
  const defaults = plan.screens.map((s) => defaultUxFor(s, screenRoleOf(s), mode));
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
          ? canonicalStructure(role, m.layout.structure, isCatalogHome(planScreen?.purpose, mode))
          : canonicalStructure(role, m.layout.structure),
        dominantMoment: m.layout.dominantMoment ?? d.layout.dominantMoment,
        grid: m.layout.grid ?? d.layout.grid,
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

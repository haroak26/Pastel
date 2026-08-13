import { z } from "zod";
import type {
  ProductBrief, ProductMode, WireframePlan, WireframeScreen, ComponentInventory,
  UxDesignPlan, VisualIntent, CopyPlan, BlockInstance, V21LayoutPlan,
} from "../schemas";
import { enforceUxDesign, classifyMode } from "./ux-design";
import { buildLayoutPlanFromGenome } from "./layout-plan";

/**
 * Maxi Agent v23 — the layout GENOME.
 *
 * The genome replaces the prose wireframe prompt. It is the one structured
 * call that produces a compact layout genome (screens → regions → component
 * slots → dominant moment → pairing hints) from a MODE-SCOPED vocabulary.
 *
 * The core fix for wireframe quality: constraints live in the vocabulary
 * construction, not in prose the model must remember. If `hero` is illegal
 * for the current mode, it never appears as an option — the model cannot
 * emit it because the schema enum never offered it.
 *
 * Pipeline: classifyMode (deterministic) → buildModeVocabulary (deterministic)
 * → one cheap-tier call → validate → enforce → derive wireframe + UX + V21
 * placement plan deterministically (lib/layout-plan.ts is the placement
 * brain; this module feeds it the genome directly).
 */

// ── Genome schema ─────────────────────────────────────────────────────────

export const genomeRegionSchema = z.object({
  /** Block from the mode-scoped vocabulary (never anything else). */
  block: z.string(),
  /** Variant from the vocabulary entry for this block. */
  variant: z.string().optional(),
  /** Surface from the vocabulary entry for this block/variant. */
  surface: z.string().optional(),
  /** Exactly one region per screen may be the dominant moment. */
  emphasis: z.boolean().optional(),
  /** PascalCase component slot from `componentSlots` — required on custom. */
  component: z.string().optional(),
  /** One-line intent (≤80 chars) — what this region must communicate. */
  content: z.string().max(80).optional(),
});

export const genomeScreenSchema = z.object({
  id: z.enum(["home", "detail"]),
  title: z.string().max(60).optional(),
  purpose: z.string().max(160).optional(),
  nav: z.enum(["sidebar", "topbar", "sidebar+topbar"]),
  /** The screen's region stack — 3-6 regions, canonical order. */
  regions: z.array(genomeRegionSchema).min(3).max(6),
  /** Region pairs that render side-by-side as a two-up row (max 2). */
  pairHints: z.array(z.tuple([z.string(), z.string()])).max(2).optional(),
});

export const layoutGenomeSchema = z.object({
  version: z.literal("1.0.0"),
  mode: z.enum(["browse", "track", "create", "operate", "learn", "social", "transact"]),
  screens: z.array(genomeScreenSchema).length(2),
  /** Component slots — the product-specific component inventory (4-6). */
  componentSlots: z.array(z.object({
    name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/, "PascalCase name"),
    purpose: z.string().min(8).max(120),
    usedBy: z.array(z.enum(["home", "detail"])).min(1),
  })).min(4).max(6),
  rationale: z.string().max(300).optional(),
});

export type GenomeRegion = z.infer<typeof genomeRegionSchema>;
export type GenomeScreen = z.infer<typeof genomeScreenSchema>;
export type LayoutGenome = z.infer<typeof layoutGenomeSchema>;

// ── Mode-scoped vocabulary ────────────────────────────────────────────────
//
// The vocabulary is constructed from the mode: each entry lists the blocks,
// variants and surfaces LEGAL for that mode. Hero/search exist only for
// browse/transact. The dashboard antipattern (hero on track/create/operate/
// learn/social) is enforced by construction: the option does not exist.

export interface VocabularyEntry {
  block: string;
  variants: string[];
  surfaces: string[];
  /** Guidance line shown to the model for this entry. */
  note: string;
}

export interface ModeVocabulary {
  mode: ProductMode;
  home: VocabularyEntry[];
  detail: VocabularyEntry[];
}

const NO_HERO = "hero blocks do not exist for this mode — the home opens with stats:scoreboard as the dominant moment";
const NO_SEARCH = "search toolbars do not exist for this mode — homes open with the product's own moment";

const DASHBOARD_HOME: VocabularyEntry[] = [
  { block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: "SIGNATURE opening — giant tabular numbers with accent delta chips on a soft-wash band, no cards" },
  { block: "chart", variants: ["band"], surfaces: ["soft-wash"], note: "full-width trend band" },
  { block: "list", variants: ["rows", "sequence", "featured"], surfaces: ["divided-list", "editorial-tile"], note: "rows = divided list; sequence = numbered steps; featured = curated tiles" },
  { block: "custom", variants: ["default"], surfaces: ["plain", "inset-panel"], note: "product-specific component slot — REQUIRED, this is the product's signature" },
];

const DETAIL_CORE: VocabularyEntry[] = [
  { block: "detail", variants: ["pane"], surfaces: ["inset-panel"], note: "two-column info pane — content left, sticky summary right" },
  { block: "list", variants: ["activity"], surfaces: ["divided-list"], note: "activity rows — avatar feed as divided rows" },
  { block: "cta", variants: ["band"], surfaces: ["tonal-band"], note: "closing tonal-band action" },
  { block: "custom", variants: ["default"], surfaces: ["plain", "inset-panel"], note: "product-specific component slot — REQUIRED" },
];

const MEDIA_DETAIL: VocabularyEntry[] = [
  { block: "media", variants: ["gallery"], surfaces: ["plain"], note: "photo-first gallery — the detail hero for media-rich items" },
  ...DETAIL_CORE,
];

export const MODE_VOCABULARY: Record<ProductMode, ModeVocabulary> = {
  browse: {
    mode: "browse",
    home: [
      { block: "hero", variants: ["app"], surfaces: ["tonal-band"], note: "search-led hero statement — browse only" },
      { block: "search", variants: ["dropdown"], surfaces: ["plain"], note: "search/filter toolbar" },
      { block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: "optional stat cluster" },
      { block: "list", variants: ["cards", "featured"], surfaces: ["soft-wash", "editorial-tile"], note: "cards = product grid on soft-wash; featured = curated editorial tiles" },
      { block: "chart", variants: ["band"], surfaces: ["soft-wash"], note: "optional trend band" },
      { block: "custom", variants: ["default"], surfaces: ["plain", "inset-panel"], note: "product-specific component slot — REQUIRED" },
    ],
    detail: [
      { block: "media", variants: ["gallery"], surfaces: ["plain"], note: "photo-first gallery — the detail hero" },
      ...DETAIL_CORE,
    ],
  },
  transact: {
    mode: "transact",
    home: [
      { block: "hero", variants: ["app"], surfaces: ["tonal-band"], note: "search-led hero — transact only" },
      { block: "search", variants: ["dropdown"], surfaces: ["plain"], note: "search/filter toolbar" },
      { block: "list", variants: ["cards", "featured"], surfaces: ["soft-wash", "editorial-tile"], note: "cards = product grid on soft-wash; featured = curated editorial tiles" },
      { block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: "optional stat cluster" },
      { block: "custom", variants: ["default"], surfaces: ["plain", "inset-panel"], note: "product-specific component slot — REQUIRED" },
    ],
    detail: [
      { block: "media", variants: ["gallery"], surfaces: ["plain"], note: "photo-first gallery — the detail hero" },
      ...DETAIL_CORE,
    ],
  },
  track: { mode: "track", home: [{ block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: NO_HERO }, ...DASHBOARD_HOME.slice(1)], detail: [...DETAIL_CORE] },
  create: { mode: "create", home: [{ block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: NO_HERO }, ...DASHBOARD_HOME.slice(1)], detail: [...DETAIL_CORE] },
  operate: { mode: "operate", home: [{ block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: NO_HERO }, ...DASHBOARD_HOME.slice(1)], detail: [...DETAIL_CORE] },
  learn: { mode: "learn", home: [{ block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: NO_HERO }, ...DASHBOARD_HOME.slice(1)], detail: [...DETAIL_CORE] },
  social: {
    mode: "social",
    home: [
      { block: "list", variants: ["activity"], surfaces: ["divided-list"], note: "community feed — activity rows as divided list, THIS is the dominant moment" },
      { block: "stats", variants: ["scoreboard"], surfaces: ["soft-wash"], note: NO_HERO + " — optional community pulse cluster" },
      { block: "list", variants: ["featured"], surfaces: ["editorial-tile"], note: "trending topics as curated tiles" },
      { block: "custom", variants: ["default"], surfaces: ["plain", "inset-panel"], note: "product-specific component slot — REQUIRED" },
    ],
    detail: [
      { block: "detail", variants: ["pane"], surfaces: ["inset-panel"], note: "thread/record pane" },
      { block: "list", variants: ["activity"], surfaces: ["divided-list"], note: "replies as divided rows" },
      { block: "cta", variants: ["band"], surfaces: ["tonal-band"], note: "community action band" },
      { block: "custom", variants: ["default"], surfaces: ["plain", "inset-panel"], note: "product-specific component slot — REQUIRED" },
    ],
  },
};

/** Every legal block for a mode (both screens) — used by the gate. */
export function legalBlocksForMode(mode: ProductMode): Set<string> {
  const v = MODE_VOCABULARY[mode];
  return new Set([...v.home, ...v.detail].map((e) => e.block));
}

/** Every legal surface for a mode (both screens) — used by the gate. */
export function legalSurfacesForMode(mode: ProductMode): Set<string> {
  const v = MODE_VOCABULARY[mode];
  return new Set([...v.home, ...v.detail].flatMap((e) => e.surfaces));
}

/**
 * Build the mode-scoped vocabulary block for the genome prompt. The model
 * may ONLY select from what this JSON enum offers — illegal blocks do not
 * exist in the prompt, so they cannot appear in the output.
 */
export function buildModeVocabulary(mode: ProductMode): string {
  const v = MODE_VOCABULARY[mode];
  const screenBlock = (role: "home" | "detail") => {
    const entries = v[role];
    const lines = entries.map((e) => {
      const parts: string[] = [`"${e.block}"`];
      parts.push(`variants: [${e.variants.map((x) => `"${x}"`).join(", ")}]`);
      parts.push(`surfaces: [${e.surfaces.map((x) => `"${x}"`).join(", ")}]`);
      if (e.note) parts.push(`note: ${e.note}`);
      return `  { ${parts.join(", ")} }`;
    });
    return lines.join(",\n");
  };
  return [
    `MODE: ${mode} — this is a ${mode} product. Only the following regions exist for this mode.`,
    `Every region on the ${mode} home screen MUST be one of:`,
    `[\n${screenBlock("home")}\n]`,
    `Every region on the ${mode} detail screen MUST be one of:`,
    `[\n${screenBlock("detail")}\n]`,
    "Rules:",
    "- Exactly TWO screens: home + detail.",
    "- No region outside this enum. A block that is not listed does not exist for this product.",
    "- Exactly ONE dominant moment per screen (emphasis: true) — the largest, statement-scale region.",
    "- Custom regions (block: \"custom\") mount a PascalCase component from componentSlots; every componentSlots entry must be mounted by at least one custom region.",
    "- Pair hints: at most two per screen; each pair references two regions that render side-by-side (2/3 + 1/3). The dominant moment is never paired.",
  ].join("\n");
}

// ── Shell components (every run's inventory) ─────────────────────────────
//
// Every run's inventory includes the SHELL + common primitives so the
// builder produces a per-run, product-specific version of each — never the
// generic base component shipped verbatim. The composer mounts these by name.

const SHELL_COMPONENTS: Array<{ name: string; purpose: string; usedBy: string[] }> = [
  { name: "Topbar", purpose: "Product header with brand, page title, and user context", usedBy: ["home", "detail"] },
  { name: "Sidebar", purpose: "Product navigation rail with brand and destinations", usedBy: ["home", "detail"] },
  { name: "Button", purpose: "Product action button with primary/secondary/ghost variants", usedBy: ["home", "detail"] },
  { name: "Avatar", purpose: "User avatar with initials and brand hue", usedBy: ["home", "detail"] },
  { name: "Badge", purpose: "Status and notification badges", usedBy: ["home", "detail"] },
  { name: "Input", purpose: "Text and search inputs", usedBy: ["home", "detail"] },
  { name: "Select", purpose: "Dropdown select controls", usedBy: ["home", "detail"] },
  { name: "Separator", purpose: "Section and row dividers", usedBy: ["home", "detail"] },
];

export function withShellComponents(inventory: ComponentInventory): ComponentInventory {
  const names = new Set(inventory.components.map((c) => c.name));
  const added = SHELL_COMPONENTS.filter((s) => !names.has(s.name));
  if (added.length === 0) return inventory;
  return {
    version: inventory.version,
    components: [...inventory.components, ...added],
  };
}

// ── Deterministic defaults (fallback + cold start) ────────────────────────
//
// Every mode has a canonical default genome. These are the same shapes the
// old prose fallbacks produced — expressed as genomes so one mechanism
// covers every mode.

function defaultHomeRegions(mode: ProductMode, brief: ProductBrief): GenomeRegion[] {
  const title = brief.screenPurposes.find((p) => p.id === "home")?.purpose.split(" — ")[0] ?? "Home";
  const customName = defaultCustomSlot(mode, "home", brief);
  if (mode === "browse" || mode === "transact") {
    return [
      { block: "hero", variant: "app", surface: "tonal-band", emphasis: true, content: title },
      { block: "search", variant: "dropdown", surface: "plain", content: "find and filter" },
      { block: "list", variant: "cards", surface: "soft-wash", content: "product grid" },
      { block: "custom", variant: "default", surface: "plain", component: customName, content: "signature section" },
    ];
  }
  if (mode === "social") {
    return [
      { block: "list", variant: "activity", surface: "divided-list", emphasis: true, content: "community feed" },
      { block: "stats", variant: "scoreboard", surface: "soft-wash", content: "community pulse" },
      { block: "custom", variant: "default", surface: "plain", component: customName, content: "signature section" },
    ];
  }
  // track / create / operate / learn — the dashboard shape (no hero, no search).
  return [
    { block: "stats", variant: "scoreboard", surface: "soft-wash", emphasis: true, content: "today's headline metrics" },
    { block: "chart", variant: "band", surface: "soft-wash", content: "trend" },
    { block: "list", variant: mode === "learn" ? "sequence" : "rows", surface: "divided-list", content: "recent records" },
    { block: "custom", variant: "default", surface: "plain", component: customName, content: "signature section" },
  ];
}

function defaultDetailRegions(mode: ProductMode, brief: ProductBrief): GenomeRegion[] {
  const customName = defaultCustomSlot(mode, "detail", brief);
  const mediaDetail = mode === "transact" || /listing|gallery|photo|media|video|episode|stay|property|album|visual/i.test(
    brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "",
  );
  const regions: GenomeRegion[] = [];
  if (mediaDetail) regions.push({ block: "media", variant: "gallery", surface: "plain", emphasis: true, content: "gallery" });
  else regions.push({ block: "detail", variant: "pane", surface: "inset-panel", emphasis: true, content: "record detail" });
  if (mode === "social") regions.push({ block: "list", variant: "activity", surface: "divided-list", content: "replies" });
  regions.push({ block: "custom", variant: "default", surface: "plain", component: customName, content: "signature section" });
  regions.push({ block: "cta", variant: "band", surface: "tonal-band", content: "primary action" });
  return regions.slice(0, 6);
}

const CUSTOM_SLOT_NAMES = {
  home: ["GoalProgress", "InsightPanel", "ReadinessMeter", "CatalogHighlights", "QueuePanel", "PostCard"],
  detail: ["ActionPanel", "SummaryBar", "HistoryStrip", "HostTrustLegend", "TrackList", "ReplyRow"],
} as const;

function defaultCustomSlot(mode: ProductMode, role: "home" | "detail", brief: ProductBrief): string {
  const pick = (names: readonly string[]) => {
    const seed = `${brief.title} ${brief.productType}`.toLowerCase();
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return names[h % names.length];
  };
  if (mode === "browse" || mode === "transact") {
    return pick(role === "home" ? ["CatalogHighlights", "ItemCard", "AmenityGrid", "HostTrustLegend"] : ["HostTrustLegend", "AmenityGrid", "ItemCard", "CatalogHighlights"]);
  }
  if (mode === "social") return pick(role === "home" ? ["PostCard", "CommunityStats", "TopicRow"] : ["ReplyRow", "EngagementBar", "ProfileBadge"]);
  return pick(CUSTOM_SLOT_NAMES[role]);
}

export function defaultComponentSlots(mode: ProductMode, brief: ProductBrief): LayoutGenome["componentSlots"] {
  const home = defaultCustomSlot(mode, "home", brief);
  const detail = defaultCustomSlot(mode, "detail", brief);
  const slots: LayoutGenome["componentSlots"] = [
    { name: home, purpose: `${brief.productType} signature section on the home screen`, usedBy: ["home"] },
    { name: detail, purpose: `${brief.productType} signature section on the detail screen`, usedBy: ["detail"] },
  ];
  if (mode === "browse" || mode === "transact") {
    slots.push({ name: "CatalogHighlights", purpose: "Curated showcase of featured items", usedBy: ["home"] });
    slots.push({ name: "AmenityGrid", purpose: "Grid of an item's features and amenities", usedBy: ["detail"] });
  } else if (mode === "social") {
    slots.push({ name: "PostCard", purpose: "Community post with engagement counts", usedBy: ["home"] });
    slots.push({ name: "ReplyRow", purpose: "Reply rows with author avatars", usedBy: ["detail"] });
  } else if (mode === "learn") {
    slots.push({ name: "CoachInsight", purpose: "Adaptive coaching recommendation and rationale", usedBy: ["home"] });
    slots.push({ name: "ExerciseTarget", purpose: "Sets, reps, load, and rest targets", usedBy: ["detail"] });
  } else {
    slots.push({ name: "InsightPanel", purpose: "Insight card with the key metric and trend", usedBy: ["home"] });
    slots.push({ name: "SummaryBar", purpose: "Record summary metrics", usedBy: ["detail"] });
  }
  return slots.slice(0, 6);
}

export function defaultGenome(mode: ProductMode, brief: ProductBrief): LayoutGenome {
  return {
    version: "1.0.0",
    mode,
    screens: [
      {
        id: "home",
        title: "Home",
        purpose: brief.screenPurposes.find((p) => p.id === "home")?.purpose ?? "The primary workflow",
        nav: "topbar",
        regions: defaultHomeRegions(mode, brief),
        // The dominant moment is never paired — pair the secondary sections.
        // (Social homes are feed-led: the feed IS the dominant moment, so no
        // pair hint applies.)
        pairHints: mode === "browse" || mode === "transact" ? [["search", "list"]] : mode === "social" ? [] : [["chart", "list"]],
      },
      {
        id: "detail",
        title: "Detail",
        purpose: brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "The focused record view",
        nav: "topbar",
        regions: defaultDetailRegions(mode, brief),
        pairHints: [],
      },
    ],
    componentSlots: defaultComponentSlots(mode, brief),
    rationale: "Deterministic mode-default genome",
  };
}

// ── Genome → wireframe / UX / layout plan ─────────────────────────────────
//
// The placement solver in lib/layout-plan.ts is the standard path. The
// genome maps directly onto the wireframe contract (regions → blocks), so
// the existing enforcement + placement machinery consumes it unchanged.

export interface GenomeDerived {
  wireframe: WireframePlan;
  inventory: ComponentInventory;
  ux: UxDesignPlan;
  notes: string[];
}

/** Regions → blocks; then run the canonical enforcement (mode-aware). */
export function genomeToWireframe(genome: LayoutGenome, brief: ProductBrief): GenomeDerived {
  const notes: string[] = [];
  const toBlocks = (screen: GenomeScreen): BlockInstance[] =>
    screen.regions.map((r) => ({
      block: r.block,
      variant: r.variant ?? (r.block === "custom" ? "default" : ""),
      ...(r.emphasis ? { emphasis: true } : {}),
      ...(r.content ? { content: r.content } : {}),
      ...(r.component ? { component: r.component } : {}),
    }));

  const screens: WireframeScreen[] = genome.screens.map((s) => ({
    id: s.id,
    archetype: s.id === "home"
      ? (genome.mode === "browse" || genome.mode === "transact" ? "catalog" : "app-dashboard")
      : "list-detail",
    title: s.title ?? (s.id === "home" ? "Home" : "Detail"),
    purpose: s.purpose ?? brief.screenPurposes.find((p) => p.id === s.id)?.purpose ?? (s.id === "home" ? "The primary workflow" : "The focused record view"),
    nav: s.nav,
    blocks: toBlocks(s),
  }));

  const inventory: ComponentInventory = {
    version: "1.0.0",
    components: genome.componentSlots.map((c) => ({ name: c.name, purpose: c.purpose, usedBy: c.usedBy })),
  };

  // Canonical enforcement: mode-aware block discipline, inventory mount
  // contract, shell components, exactly one dominant moment per screen.
  const enforced = enforceUxDesign({ version: "1.0.0", screens, rationale: genome.rationale }, inventory, genome.mode);
  notes.push(...enforced.notes);
  const withShell = withShellComponents(enforced.inventory);
  const addedShell = withShell.components.filter((c) => !enforced.inventory.components.some((x) => x.name === c.name));
  if (addedShell.length > 0) notes.push(`shell components added: ${addedShell.map((c) => c.name).join(", ")}`);

  // Pair hints → the UX design's pairing metadata (the placement solver's
  // two-up rows). Hints must reference regions that exist.
  const ux: UxDesignPlan = {
    version: "1.0.0",
    screens: enforced.plan.screens.map((s) => {
      const genomeScreen = genome.screens.find((g) => g.id === s.id);
      const pairs = new Map<string, boolean>();
      for (const [a, b] of genomeScreen?.pairHints ?? []) {
        if (s.blocks.some((x) => x.block === a) && s.blocks.some((x) => x.block === b) && a !== b) {
          const dominant = s.blocks.find((x) => x.emphasis);
          if (dominant && (dominant.block === a || dominant.block === b)) continue;
          pairs.set(a, true);
          pairs.set(b, true);
          notes.push(`${s.id}: paired ${a} + ${b} side-by-side (genome hint)`);
        }
      }
      const dominant = s.blocks.find((x) => x.emphasis);
      return {
        screenId: s.id,
        layout: {
          structure: s.id === "home"
            ? (genome.mode === "browse" || genome.mode === "transact" ? "catalog-classic" : "dashboard-led")
            : "detail-classic",
          dominantMoment: dominant ? `${dominant.block}:${dominant.variant ?? "default"}` : undefined,
          sections: s.blocks.map((b) => ({
            block: b.block,
            variant: b.variant,
            surface: surfaceOf(b.block, b.variant, genome.mode),
            pair: pairs.get(b.block),
            sticky: s.id === "detail" && b.block === "detail" && b.variant === "pane",
            emphasis: b.emphasis,
          })),
        },
      };
    }),
  };

  return { wireframe: enforced.plan, inventory: withShell, ux, notes };
}

/** The genome's own surfaces when present; else the canonical surface map. */
function surfaceOf(block: string, variant: string | undefined, mode: ProductMode): "band" | "card" | "rows" | "tiles" | "toolbar" | "gallery" | undefined {
  const map: Record<string, "band" | "card" | "rows" | "tiles" | "toolbar" | "gallery"> = {
    "hero:app": "band",
    "stats:scoreboard": "tiles",
    "chart:band": "band",
    "list:cards": "tiles",
    "list:featured": "tiles",
    "list:activity": "rows",
    "list:rows": "rows",
    "list:sequence": "rows",
    "media:gallery": "gallery",
    "detail:pane": "card",
    "cta:band": "band",
    "search:dropdown": "toolbar",
  };
  return map[`${block}:${variant ?? "default"}`];
}

/**
 * The standard placement path: genome → enforced wireframe → UX → V21 plan.
 * The placement solver in lib/layout-plan.ts consumes the genome-derived
 * wireframe directly — there is exactly one placement system.
 */
export function buildLayoutPlanFromGenomeDerived(
  derived: GenomeDerived,
  visual: VisualIntent | null,
  copy: CopyPlan,
): V21LayoutPlan {
  return buildLayoutPlanFromGenome({ wireframe: derived.wireframe, ux: derived.ux }, visual, copy);
}

/** Deterministic mode classification first — the genome call is mode-scoped. */
export function classifyGenomeMode(brief: ProductBrief): ProductMode {
  const mode = brief.mode ?? classifyMode(`${brief.productType} ${brief.description} ${brief.features.map((f) => f.name).join(" ")}`);
  if (!(mode in MODE_VOCABULARY)) return "track";
  return mode;
}

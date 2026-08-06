import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { wireframePlanSchema, componentInventorySchema, type WireframePlan, type ComponentInventory, type ProductBrief, type BlockInstance } from "../schemas-v6";
import { loadCompany, compileCompanyBlock, megadesignBlock } from "../knowledge/index";
import { baseComponentCode, baseComponentNames } from "../base-components/index";
import { enforceUxDesign } from "../lib/ux-design";
import { pickDomain, briefText } from "../lib/domains";
import type { VisualReference } from "../types";

/**
 * V6/V9 Wireframe agent — produces page wireframes AND the component inventory
 * needed to build them. The company's screenRecipes are the strong prior: the
 * model selects and adapts them to the brief; code validates the output and a
 * deterministic fallback covers model failure.
 *
 * V9: the wireframe is ALWAYS exactly two screens — "home" (main browse/
 * catalog) and "detail" (single-item info page). `enforceUxDesign`
 * (lib/ux-design.ts) enforces the per-role block allowlist, canonical layout
 * order, one dominant moment, and the card budget — so no random elements
 * land on the wrong screen and no screen is over-stuffed or under-designed.
 */

export const BLOCK_CATALOG = `BLOCK CATALOG — compose every screen from these hand-authored blocks (each emits known-good JSX):
- topbar: marketing (brand + links + CTA) or app (title + search + user). Marketing topbar only on "none" nav screens.
- sidebar: app navigation rail (brand, nav items, active state, user). Only on sidebar or sidebar+topbar screens.
- tabbar: mobile bottom navigation. Only on "tabbar" nav screens.
- hero: variants app (app-screen moment: greeting + ONE dominant metric in a dark band + the product's real primary CTA — REQUIRED on the home screen, never marketing variants there), statement (left headline), split (copy + product visual), banded (centered band), fullbleed (edge-to-edge dramatic band — the signature moment for bold brands), map (map-like visual + overlay card). Marketing variants only on "none" nav screens.
- stats: variants row (4 metric cards), grid (2x2 metric cards), scoreboard (SIGNATURE: giant tabular numbers with unit labels and accent delta chips, no cards — use for bold/branded screens).
- chart: variants area-card, bars-card (chart in a card), band (full-width tonal band with a BIG chart — no card surface; prefer when the chart is the screen's focus), bars-band.
- table: variant panel (card with toolbar + dense data table). NEVER on the two v14 screens.
- detail: variant pane (master list + detail panel) or bottom (bottom-sheet summary card).
- form: variant cards (settings sections — NOT part of the two-screen model; never use).
- list: variants features (feature cards), activity (avatar feed as divided rows — NO card), cards (content cards — ONLY for products that genuinely browse a catalog), featured (a curated showcase strip — one wide 2-col tile + two 1-col tiles with quiet captions; home only), rows (simple divided rows — NO card), carousel (horizontal scroll strip — media products only).
- media: variant gallery (image tiles — ONLY when the detail item is photo/media-rich: a listing, episode, product, or visual item) or grid (content grid).
- search: variants bar (search + filter button), dropdown (search + ONE Select dropdown + search button), filters (search + select + apply). ONLY on the home screen AND ONLY when the product genuinely has a browse/find workflow — dashboards and workspaces must NOT get a search toolbar.
- pricing: variant cards (3 pricing cards, one highlighted) — never on the two v14 screens.
- cta: variants band (closing call-to-action band — tonal, NO card — on detail it is the quiet action band: the focused action for the record/item) or slogan (SIGNATURE: single-word statement band in accent — 'PUSH', 'FASTER').
- footer: variant columns (multi-column footer). Never on the two v14 screens.
- custom: variant default with "component" naming a component from the inventory (mounts it with title + items/metrics/people/settings props). USE custom blocks to mount any product-specific component — this is the ONLY way product components reach the screen. HARD: every custom block MUST carry "component" with an exact inventory name — a custom block without it is dropped and that component never ships (v11: the engine backfills from the inventory by name match, but plan them explicitly).
UX RULES (hard):
- EXACTLY TWO screens: "home" (the product's primary workflow) and "detail" (the focused secondary workflow). No settings, no account, no landing, no analytics.
- Home blocks are product-led (V14). A dashboard or coaching product uses hero:app → stats/custom insight → list:sequence/rows. A feed uses hero:app → list:activity/cards. A workspace uses hero:app → stats/chart → list:rows. ONLY a genuine browse/marketplace product uses search → list:cards. Search and product grids are OPTIONAL — never mandatory.
- Detail blocks are product-led (V14). A media-rich item (listing, episode, product, photo-driven) uses media:gallery → detail:pane → cta:band. A record/task/exercise uses detail:pane → cta:band (no gallery, no marketplace language unless the brief is commerce or travel).
- Cards are scarce: a catalog grid is the ONLY card cluster (≤6); the detail summary is the ONE card; everything else renders as divided rows, tonal bands, or tiles.
- Filters are Select dropdowns. NEVER multi-chip filter groups (more than 3 chips in a row).
- Set "ratio": "1:1" on a block to pair it side-by-side with the NEXT block (two-up grid row — layout variety). At most one pair per screen; never on the emphasized block.
- Every screen fills slots with PRODUCT data (the composer provides domain-relevant metrics/rows/activity); never request generic "company/amount" tables.
RULES:
- 2 screens, ids MUST be "home" and "detail". Each screen: 3-8 blocks. Vary block order across screens.
- Mark exactly ONE block per screen as the dominant moment: "emphasis": true.
- Adapt the company's recipes (provided in the prompt) — keep their flavor but fit the two-screen model and THIS product's actual workflow.
- Inventory: 6-8 components — enough for a distinctive product surface, never over-engineered (one per distinctive product element; do NOT list generic primitives like Button/Card/Input unless this product genuinely specializes them). Prefer at least one component that only THIS product would have (an amenity grid for a stay, a stat ring for a runner, a form-cue panel for a trainer). A component is ONLY worth building if a custom block mounts it — never list components without a matching custom block; blocks pull in the generic primitives automatically (they are not listed in the inventory).`;

export const SCREEN_ARCHETYPES = `SCREEN ARCHETYPES (only two are used):
- home screen: "catalog" (browse: search + product grid — ONLY for genuine browse/marketplace products) or "app-dashboard" (metrics/feed/workspace-led home — the default for most products). nav: tabbar/topbar/sidebar+topbar — never "none".
- detail screen: "list-detail" (the focused secondary workflow — gallery+summary for media-rich items, info pane+action otherwise). nav: tabbar/topbar/sidebar+topbar — never "none".
Pick the archetype that best fits each of the two screen purposes.`;

export interface WireframeInput {
  brief: ProductBrief;
  visualReference?: VisualReference;
  onUsage?: OnUsage;
}

export interface WireframeOutput {
  plan: WireframePlan;
  inventory: ComponentInventory;
  usedFallback: string[];
  /** Deterministic discipline notes (dropped unmounted components, etc.). */
  notes?: string[];
}

export async function runWireframe(input: WireframeInput): Promise<WireframeOutput> {
  const company = await loadCompany(input.brief.inspiration.primary);
  const companyBlock = await compileCompanyBlock(input.brief.inspiration.primary);
  const megadesign = await megadesignBlock();
  const names = baseComponentNames().sort().join(", ");

  const briefBlock = [
    `PRODUCT: ${input.brief.title} — ${input.brief.productType}`,
    input.brief.description,
    `Audience: ${input.brief.audience.primary}`,
    `Platform: ${input.brief.platform}`,
    "Features:",
    ...input.brief.features.map((f) => `- ${f.name} (${f.priority}): ${f.description}`),
    "Screen purposes:",
    ...input.brief.screenPurposes.map((s) => `- ${s.id}: ${s.purpose}`),
    `Design language: ${input.brief.designLanguage}`,
  ].join("\n");

  const recipeBlock = `COMPANY SCREEN RECIPES (strong prior — select and adapt, don't invent wildly):\n${Object.entries(company.screenRecipes)
    .map(([key, r]) => `- recipe "${key}" (${r.title}, ${r.nav}): blocks=[${r.blocks.map((b) => `${b.block}:${b.variant}${b.emphasis ? "*" : ""}`).join(", ")}]`)
    .join("\n")}`;

  // V11: attach the company's real UI screenshots so the planner matches the
  // brand's actual structure and surfaces — not just its token colors.
  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  let refText = "";
  try {
    const { companyRefImageBlocks } = await import("../knowledge/index");
    refImages = await companyRefImageBlocks(input.brief.inspiration.primary, 3);
    if (refImages.length > 0) {
      refText = "\n\n### COMPANY REFERENCE IMAGERY\nScreenshots of the REAL company UI are attached. Match their layout structures, surfaces, density, and component shapes when selecting blocks and recipes — but always fit the two-screen model and the brief.";
    }
  } catch {
    /* reference imagery is optional */
  }

  if (input.visualReference) {
    refImages.push(...input.visualReference.images);
    refText += `\n\n### USER FIGMA/BANANI PRODUCT TARGET\nThe attached image is the product's visual source of truth. Match its composition, hierarchy, spacing, surface treatment, density, and responsive intent. Do not copy its domain, text, brand, or page archetype. Product requirements outrank inspiration-company patterns.`;
  }

  const userText = `${briefBlock}\n\n${companyBlock}\n\n${megadesign}\n\n${recipeBlock}\n\nAvailable base components to adapt from: ${names}\n\n${refText}\n\nEmit the wireframe plan and component inventory as JSON.`;

  try {
    const output = await chatJSON<{ plan: WireframePlan; inventory: ComponentInventory }>(
      [
        { role: "system", content: `You are the Pastel wireframe planner. You turn a product brief into (1) a wireframe plan (screens + blocks) and (2) the component inventory needed to build it.
You do NOT write code. You SELECT blocks from the catalog and SPECIFY composition.
${BLOCK_CATALOG}
${SCREEN_ARCHETYPES}
OUTPUT as ONE JSON object:
{
  "plan": {
    "version": "1.0.0",
    "screens": [{ "id": "home"|"detail" (MUST match the brief purpose ids), "archetype", "title", "purpose", "nav": "sidebar"|"topbar"|"sidebar+topbar"|"tabbar" (never "none"), "blocks": [{ "block", "variant", "emphasis"? (exactly one true per screen), "content"?, "component"? (REQUIRED on every "custom" block — the PascalCase inventory name to mount; custom blocks without it are dropped and their component never built) }] }] (EXACTLY 2: home + detail),
    "rationale"?
  },
  "inventory": {
    "version": "1.0.0",
    "components": [{ "name" (PascalCase), "purpose", "basedOn" (ONE of the available names), "usedBy": [screen ids] }] (6-8)
  }
}` },
        {
          role: "user",
          content: refImages.length > 0 ? [{ type: "text", text: userText }, ...refImages] : userText,
        },
      ],
      {
        model: "wireframe",
        temperature: 0.4,
        maxTokens: MAX_TOKENS_PER_CALL.wireframe,
        validate: (v) => {
          const plan = wireframePlanSchema.parse((v as any).plan);
          const inventory = componentInventorySchema.parse((v as any).inventory);
          return { plan, inventory };
        },
        onUsage: input.onUsage,
      },
    );
    const enforced = enforceWireframeRules(output.plan, output.inventory);
    return { plan: enforced.plan, inventory: enforced.inventory, usedFallback: [], notes: enforced.notes };
  } catch (err) {
    console.warn("[pastel v6] wireframe failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    return fallbackWireframe(input.brief, company);
  }
}

/** Blocks that each count as a screen's one "heavy" data block. */
const HEAVY_BLOCKS = new Set(["table", "detail", "form", "media"]);

/**
 * V9 wireframe discipline (delegates to lib/ux-design.ts):
 * 1. Exactly TWO canonical screens (home + detail), never the same screen twice.
 * 2. Per-role block allowlist + variant normalization + canonical order —
 *    no random elements on the wrong screen.
 * 3. Required blocks guaranteed (search + grid on home; gallery + pane + cta
 *    on detail), exactly ONE dominant moment per screen.
 * 4. Inventory mount contract: only components mounted by a custom block
 *    survive (min 4 stays via the model prompt; the composer materializes
 *    base primitives either way).
 */
export function enforceWireframeRules(
  plan: WireframePlan,
  inventory: ComponentInventory,
): { plan: WireframePlan; inventory: ComponentInventory; notes: string[] } {
  const { plan: enforced, inventory: enforcedInv, notes } = enforceUxDesign(plan, inventory);
  return { plan: enforced, inventory: enforcedInv, notes };
}

export function fallbackWireframe(
  brief: ProductBrief,
  company: Awaited<ReturnType<typeof loadCompany>>,
): WireframeOutput {
  const fitnessProduct = /fitness|trainer|training|workout|strength|exercise|gym/i.test(
    `${brief.productType} ${brief.description} ${brief.features.map((f) => f.name).join(" ")}`,
  );

  // V12/V14 fallback: a failed wireframe call must still produce the
  // product's ACTUAL primary workflow. The old fallback silently rebuilt an
  // Airbnb-like catalog for every domain; v14 routes by the domain pack so a
  // dashboard product never degrades into a search + grid + listing template.
  if (fitnessProduct) {
    return fitnessFallback(brief);
  }

  const domain = pickDomain(briefText(brief)).slug;

  if (domain === "media") return mediaFallback(brief);
  if (domain === "social") return socialFallback(brief);
  if (domain === "ecommerce" || domain === "rentals" || domain === "travel") return catalogFallback(brief);

  // Productivity / finance / running-fitness / generic → product-led
  // dashboard + focused record view (no search, no gallery, no reviews).
  return dashboardFallback(brief);
}

function enforced(wireframe: WireframePlan, inventory: ComponentInventory): WireframeOutput {
  const enforced = enforceWireframeRules(wireframe, inventory);
  return { plan: enforced.plan, inventory: enforced.inventory, usedFallback: ["wireframe"], notes: enforced.notes };
}

/** V12 coaching fallback — adaptive trainer dashboard + exercise guide. */
function fitnessFallback(brief: ProductBrief): WireframeOutput {
  const screens: WireframePlan["screens"] = [
    {
      id: "home",
      archetype: "app-dashboard",
      title: "Today's session",
      purpose: "Start today's adaptive training session and review readiness",
      nav: "topbar",
      blocks: [
        { block: "hero", variant: "app", emphasis: true },
        { block: "custom", variant: "default", component: "ReadinessMeter", content: "Readiness" },
        { block: "custom", variant: "default", component: "CoachInsight", content: "Coach insight" },
        { block: "list", variant: "sequence", content: "Today's sequence" },
        { block: "custom", variant: "default", component: "RecoveryBlock", content: "After workout" },
      ],
    },
    {
      id: "detail",
      archetype: "list-detail",
      title: "Exercise guide",
      purpose: "Follow one exercise with form cues, targets, and the start action",
      nav: "topbar",
      blocks: [
        { block: "media", variant: "gallery", emphasis: true },
        { block: "detail", variant: "pane" },
        { block: "cta", variant: "band" },
        { block: "custom", variant: "default", component: "ExerciseTarget", content: "Targets" },
        { block: "custom", variant: "default", component: "FormCues", content: "Form cues" },
        { block: "custom", variant: "default", component: "SessionHistory", content: "Progress" },
      ],
    },
  ];
  const inventory: ComponentInventory = {
    version: "1.0.0",
    components: [
      { name: "CoachInsight", purpose: "Adaptive coaching recommendation and rationale", basedOn: "StatCard", usedBy: ["home"] },
      { name: "RecoveryBlock", purpose: "Post-session recovery and check-in summary", basedOn: "Card", usedBy: ["home"] },
      { name: "FormCues", purpose: "Exercise setup, execution, and common mistakes", basedOn: "MediaStrip", usedBy: ["detail"] },
      { name: "ReadinessMeter", purpose: "Readiness and training-load signal", basedOn: "Meter", usedBy: ["home"] },
      { name: "ExerciseTarget", purpose: "Sets, reps, load, and rest target", basedOn: "StatCard", usedBy: ["detail"] },
      { name: "SessionHistory", purpose: "Recent strength progression rows", basedOn: "ScheduleList", usedBy: ["detail"] },
    ],
  };
  return enforced({ version: "1.0.0", screens }, inventory);
}

/** V14 catalog fallback — ONLY for genuine browse/marketplace products
 * (ecommerce, rentals, travel): search hero + grid / gallery + pane + CTA. */
function catalogFallback(brief: ProductBrief): WireframeOutput {
  const screens: WireframePlan["screens"] = [
    {
      id: "home",
      archetype: "catalog",
      title: brief.screenPurposes.find((p) => p.id === "home")?.purpose.split(" — ")[0] ?? "Home",
      purpose: brief.screenPurposes.find((p) => p.id === "home")?.purpose ?? "Browse and explore the product catalog",
      nav: "topbar",
      blocks: [
        { block: "hero", variant: "app", emphasis: true },
        { block: "search", variant: "dropdown" },
        { block: "list", variant: "cards" },
        { block: "custom", variant: "default", component: "CatalogHighlights", content: "Curated picks" },
        { block: "custom", variant: "default", component: "ItemCard", content: "Editor's picks" },
      ],
    },
    {
      id: "detail",
      archetype: "list-detail",
      title: brief.screenPurposes.find((p) => p.id === "detail")?.purpose.split(" — ")[0] ?? "Detail",
      purpose: brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "Full item page with photos, details, and the primary action",
      nav: "topbar",
      blocks: [
        { block: "media", variant: "gallery", emphasis: true },
        { block: "detail", variant: "pane" },
        { block: "cta", variant: "band" },
        { block: "list", variant: "activity" },
        { block: "custom", variant: "default", component: "HostTrustLegend", content: "Trust signals" },
        { block: "custom", variant: "default", component: "AmenityGrid", content: "What this place offers" },
      ],
    },
  ];
  const inventory: ComponentInventory = {
    version: "1.0.0",
    components: [
      { name: "CatalogHighlights", purpose: "Curated showcase of featured items", basedOn: "MediaStrip", usedBy: ["home"] },
      { name: "ItemCard", purpose: "Photo-first product card for editorial picks", basedOn: "Card", usedBy: ["home"] },
      { name: "HostTrustLegend", purpose: "Trust and quality badges for an item", basedOn: "Badge", usedBy: ["detail"] },
      { name: "AmenityGrid", purpose: "Grid of an item's features and amenities", basedOn: "AmenityGrid", usedBy: ["detail"] },
    ],
  };
  return enforced({ version: "1.0.0", screens }, inventory);
}

/** V14 media fallback — hero + carousel home, gallery + facts detail. */
function mediaFallback(brief: ProductBrief): WireframeOutput {
  const screens: WireframePlan["screens"] = [
    {
      id: "home",
      archetype: "app-dashboard",
      title: "Home",
      purpose: brief.screenPurposes.find((p) => p.id === "home")?.purpose ?? "Discover and start the product's content",
      nav: "topbar",
      blocks: [
        { block: "hero", variant: "app", emphasis: true },
        { block: "list", variant: "carousel", content: "New releases" },
        { block: "list", variant: "rows", content: "Recently played" },
        { block: "custom", variant: "default", component: "QueuePanel", content: "Up next" },
        { block: "custom", variant: "default", component: "ReleaseCard", content: "Featured release" },
      ],
    },
    {
      id: "detail",
      archetype: "list-detail",
      title: "Release",
      purpose: brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "One album or episode with artwork, facts, and the play action",
      nav: "topbar",
      blocks: [
        { block: "media", variant: "gallery", emphasis: true },
        { block: "detail", variant: "pane" },
        { block: "cta", variant: "band" },
        { block: "custom", variant: "default", component: "TrackList", content: "Tracklist" },
        { block: "custom", variant: "default", component: "CreditsPanel", content: "Credits" },
      ],
    },
  ];
  const inventory: ComponentInventory = {
    version: "1.0.0",
    components: [
      { name: "QueuePanel", purpose: "Up-next queue with reorder controls", basedOn: "ScheduleList", usedBy: ["home"] },
      { name: "ReleaseCard", purpose: "Artwork-first card for a release", basedOn: "Card", usedBy: ["home"] },
      { name: "TrackList", purpose: "Track/segment rows with durations", basedOn: "ScheduleList", usedBy: ["detail"] },
      { name: "CreditsPanel", purpose: "Credits and release facts", basedOn: "Card", usedBy: ["detail"] },
    ],
  };
  return enforced({ version: "1.0.0", screens }, inventory);
}

/** V14 social fallback — feed home + thread view. */
function socialFallback(brief: ProductBrief): WireframeOutput {
  const screens: WireframePlan["screens"] = [
    {
      id: "home",
      archetype: "app-dashboard",
      title: "Feed",
      purpose: brief.screenPurposes.find((p) => p.id === "home")?.purpose ?? "The community feed — posts, activity, and connections",
      nav: "topbar",
      blocks: [
        { block: "hero", variant: "app", emphasis: true },
        { block: "stats", variant: "scoreboard" },
        { block: "list", variant: "activity", content: "Community activity" },
        { block: "custom", variant: "default", component: "PostCard", content: "Latest posts" },
        { block: "custom", variant: "default", component: "CommunityStats", content: "Community pulse" },
        { block: "custom", variant: "default", component: "TopicRow", content: "Trending topics" },
      ],
    },
    {
      id: "detail",
      archetype: "list-detail",
      title: "Thread",
      purpose: brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "One post or thread with replies and community actions",
      nav: "topbar",
      blocks: [
        { block: "detail", variant: "pane", emphasis: true },
        { block: "list", variant: "activity", content: "Replies" },
        { block: "cta", variant: "band" },
        { block: "custom", variant: "default", component: "ReplyRow", content: "Reply threads" },
        { block: "custom", variant: "default", component: "EngagementBar", content: "Community actions" },
        { block: "custom", variant: "default", component: "ProfileBadge", content: "Author" },
      ],
    },
  ];
  const inventory: ComponentInventory = {
    version: "1.0.0",
    components: [
      { name: "PostCard", purpose: "Community post with engagement counts", basedOn: "Card", usedBy: ["home"] },
      { name: "CommunityStats", purpose: "Members, posts, and activity metrics", basedOn: "StatCard", usedBy: ["home"] },
      { name: "TopicRow", purpose: "Trending topic rows", basedOn: "ScheduleList", usedBy: ["home"] },
      { name: "ReplyRow", purpose: "Reply rows with author avatars", basedOn: "Avatar", usedBy: ["detail"] },
      { name: "EngagementBar", purpose: "Like/share/reply action row", basedOn: "Button", usedBy: ["detail"] },
      { name: "ProfileBadge", purpose: "Author identity chip", basedOn: "Badge", usedBy: ["detail"] },
    ],
  };
  return enforced({ version: "1.0.0", screens }, inventory);
}

/** V14 dashboard fallback — the default for non-browse products: metrics-led
 * home + focused record view. No search toolbar, no gallery, no reviews. */
function dashboardFallback(brief: ProductBrief): WireframeOutput {
  const screens: WireframePlan["screens"] = [
    {
      id: "home",
      archetype: "app-dashboard",
      title: "Home",
      purpose: brief.screenPurposes.find((p) => p.id === "home")?.purpose ?? "The primary dashboard — today's metrics and the main workflow",
      nav: "topbar",
      blocks: [
        { block: "hero", variant: "app", emphasis: true },
        { block: "stats", variant: "scoreboard" },
        { block: "chart", variant: "band" },
        { block: "list", variant: "rows", content: "Recent records" },
        { block: "custom", variant: "default", component: "GoalProgress", content: "Goals" },
        { block: "custom", variant: "default", component: "InsightPanel", content: "Insight" },
        { block: "custom", variant: "default", component: "RecordRow", content: "Record history" },
      ],
    },
    {
      id: "detail",
      archetype: "list-detail",
      title: "Record",
      purpose: brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "The focused view for one item, record, or task with its primary action",
      nav: "topbar",
      blocks: [
        { block: "detail", variant: "pane", emphasis: true },
        { block: "custom", variant: "default", component: "ActionPanel", content: "Actions" },
        { block: "custom", variant: "default", component: "SummaryBar", content: "Summary" },
        { block: "custom", variant: "default", component: "HistoryStrip", content: "History" },
        { block: "cta", variant: "band" },
      ],
    },
  ];
  const inventory: ComponentInventory = {
    version: "1.0.0",
    components: [
      { name: "GoalProgress", purpose: "Goal targets with progress meters", basedOn: "Progress", usedBy: ["home"] },
      { name: "InsightPanel", purpose: "Insight card with the key metric and trend", basedOn: "StatCard", usedBy: ["home"] },
      { name: "RecordRow", purpose: "Recent record rows with values", basedOn: "ScheduleList", usedBy: ["home"] },
      { name: "ActionPanel", purpose: "Primary and secondary actions for the record", basedOn: "Card", usedBy: ["detail"] },
      { name: "SummaryBar", purpose: "Record summary metrics", basedOn: "StatCard", usedBy: ["detail"] },
      { name: "HistoryStrip", purpose: "Recent history for the record", basedOn: "ScheduleList", usedBy: ["detail"] },
    ],
  };
  return enforced({ version: "1.0.0", screens }, inventory);
}

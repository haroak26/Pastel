import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { wireframePlanSchema, componentInventorySchema, type WireframePlan, type ComponentInventory, type ProductBrief, type BlockInstance } from "../schemas";
import { loadCompany, compileCompanyBlock, megadesignBlock } from "../knowledge/index";
import { enforceUxDesign, classifyMode } from "../lib/ux-design";
import { pickDomain, briefText } from "../lib/domains";
import type { VisualReference } from "../types";

/**
 * V17 Wireframe agent — page-composition model with surface vocabulary.
 *
 * V17 replaces the block-catalog approach with a page-composition model:
 * - Shell (sidebar/topbar/header-tabs) + content frame (single, two-column,
 *   rail, split, stacked) + sections with explicit surfaces and relationships.
 * - Product context (app, workspace, dashboard, feed, editor, catalog,
 *   marketing, onboarding) drives composition intent.
 * - Brand kit drives visual language; company knowledge adapts it.
 * - Navigation is product-level (never wireframe-level default).
 * - Footer is illegal on app screens.
 * - Hand-written "card" surfaces are just one option; tonal bands, soft
 *   washes, divided lists, and inset panels are the preferred defaults.
 * - Marketing composition (centered heroes, oversized CTAs, footer links) is
 *   ILLEGAL on app screens — fall back to sidebar or topbar + content frame.
 */

export const BLOCK_CATALOG = `BLOCK CATALOG — compose every screen from these blocks. Each block renders with a SURFACE treatment that gives the screen visual variety:

SURFACES (V18 — pick deliberately, never use the same surface twice in a row):
- tonal-band: full-width muted background band — the DEFAULT for hero and CTA moments (browse/transact only)
- soft-wash: very subtle background tint — the DEFAULT for stat clusters, chart bands, and product grids (use generously)
- divided-list: clean rows with border-b separators — NO card wrapper (for activity, sequences, rows)
- inset-panel: rounded panel with light border + padding — SPARINGLY (one per detail, max one per home)
- plain: no wrapper decoration — for search toolbars, filter rows. NEVER use two in a row (white gaps are a defect)
- card: use ONLY for the detail summary card — never for grids (soft-wash replaced card as the grid default)

BLOCKS:
- topbar: app header (title). V18: search field ONLY on browse/transact products; user avatar ONLY on app products with auth context. Dashboard/workspace/feed products get a minimal topbar (title only, no search).
- sidebar: app navigation rail (brand, nav items, active state, user).
- hero: variants app (search-led hero for browse products), statement/split/banded/fullbleed (marketing/browse only). V18 CRITICAL: hero blocks are ONLY legal for browse and transact modes. Dashboard, workspace, feed, curriculum, and tracking products MUST NEVER include a hero block — they open with stats:scoreboard instead.
- stats: variants scoreboard (SIGNATURE: giant tabular numbers with unit labels and accent delta chips in a soft-wash band — no cards — THIS IS THE DEFAULT OPENING for dashboard/workspace/feed products), row (4 metric cards), grid (2x2 metric cards).
- chart: variants area-card, bars-card (chart in a card), band (full-width tonal band — BEST), bars-band.
- table: variant panel (inset-panel with toolbar + dense data table).
- detail: variant pane (two-column info layout with sticky summary inset-panel) or bottom.
- form: variant cards — settings sections. Never on the two canonical screens.
- list: variants features (feature cards), activity (avatar feed as divided rows), cards (content cards — browse products only — uses soft-wash surface, not card), featured (curated editorial-tile strip), rows (simple divided rows), carousel (horizontal scroll — media products only), sequence (numbered steps — learn/social products).
- media: variant gallery (image tiles — media-rich items only) or grid.
- search: variants bar, dropdown, filters. ONLY on browse/transact home screens. NEVER on dashboard/workspace/feed/curriculum homes.
- pricing: variant cards. Never on the two canonical screens.
- cta: variants band (closing tonal-band action) or slogan (SIGNATURE: single-word accent statement band).
- footer: variant columns. V18: ILLEGAL on all app screens (marketing only).
- custom: variant default with "component" naming a component from the inventory.

V18 COMPOSITION RULES (hard):
- EXACTLY TWO screens: "home" and "detail".
- The PRODUCT CONTEXT ("app" for most products) drives layout. Marketing composition is ILLEGAL on app screens:
  - No text-center + mx-auto hero blocks on app screens.
  - No footer blocks on app screens.
  - No "Sign in" / "Learn more" marketing CTA pairs on app screens.
  - Tabbar is mobile-only; desktop uses sidebar or topbar.
- V18 MODE RULES (mode is the layout law — these override all product defaults):
  - browse/transact: home = hero:app(search) → list:cards(soft-wash); detail = media:gallery → detail:pane → cta:band
  - track: home = stats:scoreboard → chart:band → list:rows; detail = detail:pane → cta:band
  - create: home = stats:scoreboard → list:rows; detail = detail:pane → cta:band
  - operate: home = stats:scoreboard → stats:grid → list:rows → chart:band; detail = detail:pane → cta:band
  - learn: home = stats:scoreboard → list:sequence; detail = detail:pane → cta:band
  - social: home = stats:scoreboard → list:activity; detail = detail:pane → list:activity
- DASHBOARD ANTIPATTERN (V18): track/create/operate/learn/social products must NEVER include a hero block. Their home screen opens with stats:scoreboard as the dominant moment. Including hero on these modes is a blocking defect.
- TONAL-BAND is the DEFAULT surface for heroes and CTAs (browse/transact only).
- SOFT-WASH is the DEFAULT for stat scoreboards, chart bands, AND product grids (replaces card).
- DIVIDED-LIST is the DEFAULT for activity/sequences/rows — not card.
- INSET-PANEL is for ONE sticky summary card on detail (max); never wrap every section.
- Vary surfaces. Two adjacent sections with the same surface are a defect. Alternate tonal-band → soft-wash → divided-list → plain → tonal-band.
- Exactly one dominant moment per screen. Mark it with emphasis: true.
- DETAIL = two-column (info column + sticky summary inset-panel + action band).
- Cards are SCARCE: only the detail summary card uses the "card" surface. Everything else uses soft-wash, divided-list, or tonal-band.
- Prefer side-by-side pairings (stats+custom or chart+custom as a two-up row) for layout variety.
- EXACTLY ONE screen gets a search block (the home screen, browse/transact modes only).
- Inventory: 4-6 product-specific components. At least one that ONLY this product would have. Every component must be distinct — no two components may share a purpose.

V19 DISTINCTIVENESS (hard — this is how the product avoids the "every output is the same template" defect):
- The TWO screens must NOT read as a generic SaaS template. A fitness app home reads as a TRAINING dashboard, a travel app home as a DESTINATION marketplace, a dev tool home as an ENGINEERING workspace. Choose blocks, variants, and custom components that make the product's own job obvious.
- Custom components are the signature. At least TWO inventory components must be so product-specific they could not ship in a different product: an amenity grid for a stay, a stat ring for a runner, a commit graph for a dev tool, a playlist strip for a music app. Generic primitives (Button/Card/Input) listed as "custom" are a FAILURE.
- Vary the block sequence per product. Do NOT reuse the same block order for different products — the mode rules are a minimum, not a uniform recipe.
- The shell (Topbar, Sidebar, Button, Avatar, Badge, Input, Select, Separator) is ALWAYS in the inventory — the builder adapts each per run, so no two products share a header or sidebar.
- Never include a hero block on track/create/operate/learn/social products (the DASHBOARD ANTIPATTERN above).`;

export const SCREEN_ARCHETYPES = `SCREEN ARCHETYPES (only two are used):
- home screen: "catalog" (browse: search + product grid — ONLY for genuine browse/marketplace products) or "app-dashboard" (metrics/feed/workspace-led home — the default for most products). V17: app-dashboard screens use sidebar (desktop, preferred) or topbar. NEVER "none" or "tabbar" for app-dashboard.
- detail screen: "list-detail" (the focused secondary workflow — info pane + sticky inset-panel + action band). V17: two-column layout with info column + sticky summary inset-panel + closing tonal-band CTA. nav: inherits parent or "contextual-header". NEVER "none".
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

  const userText = `${briefBlock}\n\n${companyBlock}\n\n${megadesign}\n\n${recipeBlock}\n\n${refText}\n\nEmit the wireframe plan and component inventory as JSON.`;

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
    "components": [{ "name" (PascalCase), "purpose", "usedBy": [screen ids] }] (4-6)
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
    const enforced = enforceWireframeRules(output.plan, output.inventory, input.brief.mode);
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
  mode?: ProductBrief["mode"],
): { plan: WireframePlan; inventory: ComponentInventory; notes: string[] } {
  const { plan: enforced, inventory: enforcedInv, notes } = enforceUxDesign(plan, inventory, mode);
  return { plan: enforced, inventory: withShellComponents(enforcedInv), notes };
}

/**
 * V19: every run's inventory includes the SHELL + common primitives so the
 * builder produces a per-run, product-specific version of each — never the
 * generic base component shipped verbatim. The composer mounts these by name.
 *
 * v18 shipped the fixed base Topbar/Sidebar/Button/Avatar files as the
 * silent safety net whenever the custom pipeline failed — the "same header
 * and sidebar every time" the users saw. Routing them through planner +
 * builder makes each run's chrome bespoke, and the screen composer mounts
 * the BUILT versions.
 */
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

export function fallbackWireframe(
  brief: ProductBrief,
  company: Awaited<ReturnType<typeof loadCompany>>,
): WireframeOutput {
  const fitnessProduct = /fitness|trainer|training|workout|strength|exercise|gym/i.test(
    `${brief.productType} ${brief.description} ${brief.features.map((f) => f.name).join(" ")}`,
  );

  // Legacy fallback: route by the brief's MODE and preserve the product job.
  // The domain pack only tunes CONTENT flavor inside the mode's shape.
  const mode = brief.mode ?? classifyMode(briefText(brief));

  if (fitnessProduct || mode === "track") {
    return fitnessProduct ? fitnessFallback(brief) : dashboardFallback(brief);
  }

  const domain = pickDomain(briefText(brief)).slug;

  if (mode === "browse" || mode === "transact") return catalogFallback(brief);
  if (mode === "social") return socialFallback(brief);
  if (mode === "learn") return fitnessProduct ? fitnessFallback(brief) : dashboardFallback(brief);
  if (domain === "media") return mediaFallback(brief);
  if (mode === "create" || mode === "operate") return dashboardFallback(brief);

  // Legacy briefs without a mode: keep the old domain routing as the backstop.
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
        { block: "stats", variant: "scoreboard", emphasis: true },
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
      { name: "CoachInsight", purpose: "Adaptive coaching recommendation and rationale", usedBy: ["home"] },
      { name: "RecoveryBlock", purpose: "Post-session recovery and check-in summary", usedBy: ["home"] },
      { name: "FormCues", purpose: "Exercise setup, execution, and common mistakes", usedBy: ["detail"] },
      { name: "ReadinessMeter", purpose: "Readiness and training-load signal", usedBy: ["home"] },
      { name: "ExerciseTarget", purpose: "Sets, reps, load, and rest target", usedBy: ["detail"] },
      { name: "SessionHistory", purpose: "Recent strength progression rows", usedBy: ["detail"] },
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
      { name: "CatalogHighlights", purpose: "Curated showcase of featured items", usedBy: ["home"] },
      { name: "ItemCard", purpose: "Photo-first product card for editorial picks", usedBy: ["home"] },
      { name: "HostTrustLegend", purpose: "Trust and quality badges for an item", usedBy: ["detail"] },
      { name: "AmenityGrid", purpose: "Grid of an item's features and amenities", usedBy: ["detail"] },
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
      { name: "QueuePanel", purpose: "Up-next queue with reorder controls", usedBy: ["home"] },
      { name: "ReleaseCard", purpose: "Artwork-first card for a release", usedBy: ["home"] },
      { name: "TrackList", purpose: "Track/segment rows with durations", usedBy: ["detail"] },
      { name: "CreditsPanel", purpose: "Credits and release facts", usedBy: ["detail"] },
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
        { block: "list", variant: "activity", emphasis: true, content: "Community activity" },
        { block: "stats", variant: "scoreboard" },
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
      { name: "PostCard", purpose: "Community post with engagement counts", usedBy: ["home"] },
      { name: "CommunityStats", purpose: "Members, posts, and activity metrics", usedBy: ["home"] },
      { name: "TopicRow", purpose: "Trending topic rows", usedBy: ["home"] },
      { name: "ReplyRow", purpose: "Reply rows with author avatars", usedBy: ["detail"] },
      { name: "EngagementBar", purpose: "Like/share/reply action row", usedBy: ["detail"] },
      { name: "ProfileBadge", purpose: "Author identity chip", usedBy: ["detail"] },
    ],
  };
  return enforced({ version: "1.0.0", screens }, inventory);
}

/** V14 dashboard fallback — the default for non-browse products: metrics-led
 * home + focused record view. No hero (the V18 dashboard antipattern), no
 * search toolbar, no gallery, no reviews. The scoreboard opens the home. */
function dashboardFallback(brief: ProductBrief): WireframeOutput {
  const screens: WireframePlan["screens"] = [
    {
      id: "home",
      archetype: "app-dashboard",
      title: "Home",
      purpose: brief.screenPurposes.find((p) => p.id === "home")?.purpose ?? "The primary dashboard — today's metrics and the main workflow",
      nav: "topbar",
      blocks: [
        { block: "stats", variant: "scoreboard", emphasis: true },
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
      { name: "GoalProgress", purpose: "Goal targets with progress meters", usedBy: ["home"] },
      { name: "InsightPanel", purpose: "Insight card with the key metric and trend", usedBy: ["home"] },
      { name: "RecordRow", purpose: "Recent record rows with values", usedBy: ["home"] },
      { name: "ActionPanel", purpose: "Primary and secondary actions for the record", usedBy: ["detail"] },
      { name: "SummaryBar", purpose: "Record summary metrics", usedBy: ["detail"] },
      { name: "HistoryStrip", purpose: "Recent history for the record", usedBy: ["detail"] },
    ],
  };
  return enforced({ version: "1.0.0", screens }, inventory);
}

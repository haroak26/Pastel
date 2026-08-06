import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { wireframePlanSchema, componentInventorySchema, type WireframePlan, type ComponentInventory, type ProductBrief, type BlockInstance } from "../schemas-v6";
import { loadCompany, compileCompanyBlock, megadesignBlock } from "../knowledge/index";
import { baseComponentCode, baseComponentNames } from "../base-components/index";
import { enforceUxDesign } from "../lib/ux-design";

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
- table: variant panel (card with toolbar + dense data table). NEVER on the two v9 screens.
- detail: variant pane (master list + detail panel) or bottom (bottom-sheet summary card).
- form: variant cards (settings sections — NOT part of the two-screen model; never use).
- list: variants features (feature cards), activity (avatar feed as divided rows — NO card), cards (content cards — the home screen's product grid), featured (V10: a curated showcase strip — one wide 2-col tile + two 1-col tiles with quiet captions; home only), rows (simple divided rows — NO card), carousel (horizontal scroll strip — media products only).
- media: variant gallery (image tiles — the detail screen's hero) or grid (content grid).
- search: variants bar (search + filter button), dropdown (search + ONE Select dropdown + search button — PREFERRED, simple), filters (search + select + apply). ONLY on the home screen.
- pricing: variant cards (3 pricing cards, one highlighted) — never on the two v9 screens.
- cta: variants band (closing call-to-action band — tonal, NO card — the detail screen's action band: price + primary action) or slogan (SIGNATURE: single-word statement band in accent — 'PUSH', 'FASTER').
- footer: variant columns (multi-column footer). Never on the two v9 screens.
- custom: variant default with "component" naming a component from the inventory (mounts it with title + items/metrics/people/settings props). USE custom blocks to mount any product-specific component — this is the ONLY way product components reach the screen. HARD: every custom block MUST carry "component" with an exact inventory name — a custom block without it is dropped and that component never ships (v11: the engine backfills from the inventory by name match, but plan them explicitly).
UX RULES (hard):
- EXACTLY TWO screens: "home" (main browse/catalog: toolbar + product grid + ONE dominant moment) and "detail" (single-item info page: photo gallery + summary pane + action band). No settings, no account, no landing, no analytics.
- Home blocks (canonical order): hero:app or stats:scoreboard (dominant moment, at most one) → search:dropdown → list:cards (the product grid) → chart:band or stats:scoreboard → custom. NEVER table/form/detail/media/footer/cta/pricing on home.
- Layout structure (V10): the UX agent picks the home structure — catalog-classic (hero → search → grid → bands), catalog-rail (search + stats in a sticky left rail beside the grid — pick for data-dense catalogs), or catalog-featured (a list:featured showcase strip above the grid — pick for editorial/curated products). Pick the structure that best serves the product, then pick blocks that fit it.
- Detail blocks (canonical order): media:gallery (dominant moment) → detail:pane (summary + sticky booking card) → cta:band (price + primary action) → list:activity (reviews) → custom. NEVER hero/search/stats/chart/table/form/footer/pricing on detail.
- Cards are scarce: the product grid is the ONLY card cluster (≤6); the detail summary is the ONE card; everything else renders as divided rows, tonal bands, or tiles.
- Filters are Select dropdowns. NEVER multi-chip filter groups (more than 3 chips in a row).
- Set "ratio": "1:1" on a block to pair it side-by-side with the NEXT block (two-up grid row — layout variety). At most one pair per screen; never on the emphasized block.
- Every screen fills slots with PRODUCT data (the composer provides domain-relevant metrics/rows/activity); never request generic "company/amount" tables.
RULES:
- 2 screens, ids MUST be "home" and "detail". Each screen: 3-8 blocks. Vary block order across screens.
- Mark exactly ONE block per screen as the dominant moment: "emphasis": true.
- Adapt the company's recipes (provided in the prompt) — keep their flavor but fit the two-screen model.
- Inventory: 6-8 components — enough for a distinctive product surface, never over-engineered (one per distinctive product element; do NOT list generic primitives like Button/Card/Input unless this product genuinely specializes them). Prefer at least one component that only THIS product would have (an amenity grid for a stay, a stat ring for a runner). A component is ONLY worth building if a custom block mounts it — never list components without a matching custom block; blocks pull in the generic primitives automatically (they are not listed in the inventory).`;

export const SCREEN_ARCHETYPES = `SCREEN ARCHETYPES (only two are used):
- home screen: "catalog" (browse: search + product grid) or "app-dashboard" (metrics-led home with a grid below). nav: tabbar/topbar/sidebar+topbar — never "none".
- detail screen: "list-detail" (gallery + summary pane + action band). nav: tabbar/topbar/sidebar+topbar — never "none".
Pick the archetype that best fits each of the two screen purposes.`;

export interface WireframeInput {
  brief: ProductBrief;
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
  // V9 canonical two-screen fallback: home/catalog + detail. The custom
  // blocks mount inventory components so the fallback path still exercises
  // the planner/builder and produces component proofs.
  const screens: WireframePlan["screens"] = [
    {
      id: "home",
      archetype: "catalog",
      title: brief.screenPurposes.find((p) => p.id === "home")?.purpose.split(" — ")[0] ?? "Home",
      purpose: brief.screenPurposes.find((p) => p.id === "home")?.purpose ?? "Browse the catalog",
      nav: "topbar",
      blocks: [
        { block: "hero", variant: "app", emphasis: true },
        { block: "search", variant: "dropdown" },
        { block: "list", variant: "cards" },
      ],
    },
    {
      id: "detail",
      archetype: "list-detail",
      title: brief.screenPurposes.find((p) => p.id === "detail")?.purpose.split(" — ")[0] ?? "Detail",
      purpose: brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "Item info page",
      nav: "topbar",
      blocks: [
        { block: "media", variant: "gallery", emphasis: true },
        { block: "detail", variant: "pane" },
        { block: "cta", variant: "band" },
        { block: "custom", variant: "default", component: "ReviewList" },
      ],
    },
  ];

  const inventory: ComponentInventory = {
    version: "1.0.0",
    components: [
      { name: "ReviewList", purpose: "Guest/product reviews as divided rows", basedOn: "Avatar", usedBy: ["detail"] },
    ],
  };

  const enforced = enforceWireframeRules({ version: "1.0.0", screens }, inventory);
  return { plan: enforced.plan, inventory: enforced.inventory, usedFallback: ["wireframe"], notes: enforced.notes };
}

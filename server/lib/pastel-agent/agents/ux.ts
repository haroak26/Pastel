import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { uxDesignSchema, type UxDesignPlan, type ProductBrief, type WireframePlan, type ResolvedTheme, type ComponentInventory, type VisualIntent, type BrandKit, type ProductContext } from "../schemas";
import { loadCompany, compileCompanyBlock, megadesignBlock } from "../knowledge/index";
import { resolveUxDesign, ROLE_CARD_BUDGET, classifyContext } from "../lib/ux-design";
import { datasetPrompt, type MockDataset } from "../lib/content";
import type { VisualReference } from "../types";

/**
 * V17 UX design agent — the model half of the UX component.
 *
 * Runs AFTER the wireframe plan is deterministically enforced into the
 * canonical two-screen model (home = primary workflow, detail = focused
 * secondary workflow). It makes the tasteful UX calls the templates
 * parameterize:
 *   - which moment is dominant on the home screen (hero metric band vs the
 *     product grid vs a scoreboard);
 *   - which sections pair side-by-side and which column sticks on the detail
 *     screen (gallery hero or info pane, summary card, action band);
 *   - surface choices (tonal-band/soft-wash/divided-list/inset-panel/plain/card)
 *     within the per-screen card budget.
 *
 * Every choice is validated against `lib/ux-design.ts`: blocks that don't
 * exist, surfaces that break the budget, and off-archetype layout ideas are
 * dropped by `resolveUxDesign`, so the composer always sees a lawful plan.
 */

export interface UxInput {
  brief: ProductBrief;
  wireframe: WireframePlan;
  inventory: ComponentInventory;
  theme: ResolvedTheme;
  data: MockDataset;
  visual?: VisualIntent | null;
  visualReference?: VisualReference;
  brandKit?: BrandKit | null;
  onUsage?: OnUsage;
}

export interface UxOutput {
  ux: UxDesignPlan;
  usedFallback: boolean;
}

const SYSTEM = `You are the Pastel UX designer. Your goal is to produce a DISTINCTIVE, MEMORABLE UI — not a generic template assembly. Every product you design should read as if a human designer art-directed it. The structural rules below are guardrails for legality; you have creative freedom within them.

GROUND RULES (hard — the deterministic engine enforces them, so never break them):
- The product is EXACTLY two screens: "home" (the primary workflow) and "detail" (the focused secondary workflow).
- BROWSE/TRANSACT products (marketplace, shop, booking): home leads with search hero + product grid. Detail is gallery-led with one summary card. These are the ONLY modes that get search, gallery, or marketplace structure.
- ALL OTHER MODES (track, create, operate, learn, social — dashboards, workspaces, feeds, coaching tools): home leads with its dominant moment (scoreboard, activity feed, sequence). Detail is record-focused with one primary action. NEVER give these products a search toolbar, product grid, gallery, or hero section — they are NOT marketplace products.
- Detail is PRODUCT-LED: a media-rich item leads with its gallery (browse/transact only); a record/task/exercise leads with its info pane and one primary action. Reviews render as divided rows — never cards — and only where the product has social proof.
- Card budget: home ≤ ${ROLE_CARD_BUDGET.home} card surfaces; detail ≤ ${ROLE_CARD_BUDGET.detail}. Everything else is bands/rows/tiles/toolbar.
- No off-archetype elements: no search on detail, no settings forms, no pricing tables, no marketing heroes, no tables on detail.
- Secondary actions are quiet: one outline button at most per action row.

ANTI-PATTERNS (these make the output look template-generated — avoid them):
- A dashboard/track/create/operate product with a centered heading + CTA — reads as a marketing page. Open with data instead.
- A product with 3+ identical card surfaces — reads as a template. Vary your surfaces.
- Search bar on a dashboard, feed, or curriculum product — only browse/transact products search.
- A screen where every section is "plain" — white gaps are a defect. Alternate surfaces for visual rhythm.
- Two identical adjacent surfaces — always alternate.

CREATIVE DIRECTION (how to make the UI feel designed, not generated):
- ALTERNATE surfaces for rhythm: tonal-band → soft-wash → divided-list → plain creates a page that breathes. Never stack two identical surfaces consecutively.
- The dominant moment should feel LARGE: if it's metrics, use scoreboard scale (text-5xl+). If it's a grid, use featured-first or asymmetric. If it's activity, make it avatar-led and chronological.
- When two related sections exist, consider pairing them side-by-side (pair: true) rather than stacking.
- Prefer asymmetry: a 2/3 + 1/3 split reads as more designed than centered-everything.
- Use sticky positioning on detail screens: the summary card sticks, the info scrolls.

MODE-SPECIFIC CREATIVE GUIDANCE:
- track / operate (dashboards): Lead with a scoreboard — giant tabular numbers, small unit labels, accent delta chips. Then a chart band, then activity rows. No hero, no search, no gallery.
- create / workspace: Lead with metrics + recent work. Sidebar is welcome. Compact density. No hero.
- learn (curriculum): Lead with a numbered sequence or progress ring. Clear step indicators. No hero, no search.
- social (feed): Lead with the feed — avatar-led, chronological, clean dividers. Activity first. No hero, no search.
- browse (marketplace): Search bar IS the hero. Product grid is the dominant moment. Detail gets gallery + one summary card.

PRODUCT CONTEXT (V17 — the product context defines WHAT KIND of surface experience this is):
- App screen contexts: "app" (generic product interface), "dashboard", "workspace", "editor", "feed", "catalog", "onboarding".
- Marketing contexts: "marketing" (landing pages, pricing, promotional — NEVER used for app screens).
- App screens never use marketing layouts — fullbleed centered headlines, pricing tables, and landing-page heroes are illegal on app screens.
- No footer on app screens — app chrome (sidebar/topbar/tabbar) handles navigation.
- No tabbar on desktop — tabbar is mobile-only; desktop uses sidebar, sidebar+topbar, topbar, or header-tabs.

V18 VISUAL SURFACES (the composer renders these — pick deliberately and alternately):
- "tonal-band" — the product's primary color band (default for hero/CTA moments on browse products; usable anywhere for emphasis).
- "soft-wash" — a tinted neutral band (default for stats, chart bands, and product grids — use generously to create visual rhythm).
- "divided-list" — stacked rows with a thin divider (default for activity feeds, sequences, and row lists).
- "inset-panel" — a raised panel inside a column (default for detail info panes and summary cards).
- "plain" — no visual framing, just content (SPARINGLY — only for search toolbars, galleries, and when immediately preceded/followed by a tonal band or soft-wash so sections visually connect).
- "card" — use ONLY for the detail summary card or a deliberate single-card moment. Never for a grid of items — use soft-wash instead.

V17 COLUMN LAYOUTS (the frame for each screen — single, two-column, rail, split, stacked):
- "single" — one full-width content column (simple dashboards, feeds, onboarding).
- "two-column" — a primary column + a secondary column (detail screens with sticky summary).
- "rail" — a narrow sticky left rail beside the main content (catalog-rail, workspace panels).
- "split" — two balanced columns (settings, split-pane editors).
- "stacked" — each section occupies the full width vertically (mobile-first lists).

V18 RULES (hard):
- App screens never use marketing layouts.
- Dashboard/workspace/feed products never get hero or search.
- Tonal-band is the default hero/CTA surface (not card).
- Soft-wash is the default for stats, chart bands, AND product grids (never card for grids).
- Divided-list is the default for activity/sequence/rows.
- No footer on app screens.
- No tabbar on desktop.
- Vary surface types — two identical adjacent surfaces are a defect. Every screen alternates surfaces.

LAYOUT STRUCTURE (V10/V14/V18 — pick the one that best serves the product):
- home: "dashboard-led" (scoreboard → chart band → rows — the default for track/operate/create/learn/social), "feed-led" (activity/feed led — social), "workspace-led" (tool-led — create), "editor-led" (canvas/editor first, panels in a rail), "catalog-classic" (search hero → product grid — browse/transact), "catalog-rail" (search + stats in a STICKY LEFT RAIL beside the grid — data-dense catalogs), or "catalog-featured" (a curated featured strip above the grid — editorial browse products).
- detail: "detail-classic" (media hero or info pane → two-column pane + sticky summary card → social proof when applicable) or "detail-asymmetric" (the same surfaces with the gallery running full-width and the info column offset).
- The structure only REARRANGES the same blocks — never invent blocks that are not in the wireframe, and never change the surface of a block.

GRID INTENT (V15 — make a real choice, two products should rarely share the same grid):
- "grid": { "cols": "2"|"3"|"4", "pattern": "uniform"|"featured-first"|"asymmetric" } for the home product grid.
  - "featured-first": the first item spans two columns (editorial catalogs).
  - "asymmetric": a lead tile + dense companion tiles (visual products).
  - 2 columns for large visual items; 4 for dense data rows.
- ONLY apply grid intent for browse/transact products that have a list:cards block. Non-browse products skip grid intent.

OUTPUT as ONE JSON object:
{
  "version": "1.0.0",
  "screens": [
    {
      "screenId": "home" | "detail",
      "layout": {
        "structure": "dashboard-led" | "feed-led" | "workspace-led" | "editor-led" | "catalog-classic" | "catalog-rail" | "catalog-featured" | "detail-classic" | "detail-asymmetric" (match the screen's role: home → dashboard/feed/workspace/editor/catalog-*, detail → detail-*),
        "columnLayout"?: "single" | "two-column" | "rail" | "split" | "stacked" (the V18 frame for this screen),
        "dominantMoment": "block:variant",
        "grid"?: { "cols": "2"|"3"|"4", "pattern": "uniform"|"featured-first"|"asymmetric" } (browse/transact only),
        "sections": [{ "block", "variant"?, "surface"?: "tonal-band"|"soft-wash"|"divided-list"|"inset-panel"|"plain"|"card", "pair"?: boolean, "sticky"?: boolean, "emphasis"?: boolean }]
      },
      "notes"?: "one line on the UX intent"
    }
  ],
  "rationale"?: string
}
sections must mirror the wireframe's blocks for that screen (you may only re-specify them, not invent new ones).`;

export async function runUx(input: UxInput): Promise<UxOutput> {
  const company = await loadCompany(input.brief.inspiration.primary);
  const companyBlock = await compileCompanyBlock(input.brief.inspiration.primary);
  const megadesign = await megadesignBlock();

  const wireframeBlock = input.wireframe.screens
    .map((s) => `### ${s.id} (${s.archetype}, nav ${s.nav})\nblocks: ${s.blocks.map((b) => `${b.block}:${b.variant ?? "default"}${b.emphasis ? "*" : ""}`).join(", ")}`)
    .join("\n\n");

  const productContext = classifyContext(
    `${input.brief.title} ${input.brief.productType} ${input.brief.description} ${input.brief.mode ?? ""} ${input.brief.designLanguage}`,
  );

  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  let refText = "";
  try {
    const { companyRefImageBlocks } = await import("../knowledge/index");
    refImages = await companyRefImageBlocks(input.brief.inspiration.primary, 3);
    if (refImages.length > 0) {
      refText = "\n\n### COMPANY REFERENCE IMAGERY\nScreenshots of the REAL company UI are attached — mirror their structure, density and surface choices where the two-screen model allows.";
    }
  } catch {
    /* reference imagery is optional */
  }

  if (input.visualReference) {
    refImages.push(...input.visualReference.images);
    refText += "\n\n### USER PRODUCT TARGET\nThe attached visual target defines the intended composition. Preserve its hierarchy, alignment, whitespace, surfaces, and density while adapting content to the brief.";
  }

  let brandKitBlock = "";
  if (input.brandKit) {
    brandKitBlock = `\n\nBRAND KIT (V17 — use the primary color as the tonal-band base; the neutral palette drives soft-wash and inset-panel fills):\nprimary: ${input.brandKit.primary}\nsupporting: ${input.brandKit.supporting}\naccent: ${input.brandKit.accent}\nneutralBg: ${input.brandKit.neutralBg}\nsurface: ${input.brandKit.surface}\nsurfaceRaised: ${input.brandKit.surfaceRaised}`;
  }

  const userText = `PRODUCT: ${input.brief.title} — ${input.brief.productType}\n${input.brief.description}\n\nPRODUCT CONTEXT (V17): ${productContext}\n\n${companyBlock}\n\n${megadesign}\n\nART DIRECTION (V15/V17 — the layout must serve this style; the grid/structure choices below implement it):\n${input.visual ? JSON.stringify(input.visual, null, 2) : "(none)"}${brandKitBlock}\n\nDOMAIN DATA (the sections fill these slots):\n${datasetPrompt(input.data)}\n\nENFORCED WIREFRAME (canonical two-screen model):\n${wireframeBlock}\n${refText}\n\nDesign the UX as JSON.`;

  try {
    const ux = await chatJSON<UxDesignPlan>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: refImages.length > 0 ? [{ type: "text", text: userText }, ...refImages] : userText,
        },
      ],
      {
        model: "wireframe",
        temperature: 0.3,
        maxTokens: MAX_TOKENS_PER_CALL.wireframe,
        validate: (v) => uxDesignSchema.parse(v),
        onUsage: input.onUsage,
      },
    );
    const merged = resolveUxDesign(input.wireframe, ux);
    return { ux: merged, usedFallback: false };
  } catch (err) {
    console.warn("[pastel v6] ux design failed, using canonical layout:", err instanceof Error ? err.message : err);
    return { ux: resolveUxDesign(input.wireframe, null), usedFallback: true };
  }
}

export function fallbackUx(wireframe: WireframePlan): UxDesignPlan {
  return resolveUxDesign(wireframe, null);
}

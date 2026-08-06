import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { uxDesignSchema, type UxDesignPlan, type ProductBrief, type WireframePlan, type ResolvedTheme, type ComponentInventory } from "../schemas-v6";
import { loadCompany, compileCompanyBlock, megadesignBlock } from "../knowledge/index";
import { resolveUxDesign, ROLE_CARD_BUDGET } from "../lib/ux-design";
import { datasetPrompt, type MockDataset } from "../lib/content";

/**
 * V9 UX design agent — the model half of the UX component.
 *
 * Runs AFTER the wireframe plan is deterministically enforced into the
 * canonical two-screen model (home/catalog + detail). It makes the tasteful
 * UX calls the templates parameterize:
 *   - which moment is dominant on the home screen (hero metric band vs the
 *     product grid vs a scoreboard);
 *   - which sections pair side-by-side and which column sticks on the detail
 *     screen (gallery hero, summary card, action band);
 *   - surface choices (band/card/rows/tiles/toolbar/gallery) within the
 *     per-screen card budget.
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
  onUsage?: OnUsage;
}

export interface UxOutput {
  ux: UxDesignPlan;
  usedFallback: boolean;
}

const SYSTEM = `You are the Pastel UX designer. You turn an enforced two-screen wireframe into a precise UX design plan: one dominant moment per screen, the right visual surface for every section, and the layout structure that makes the screen feel designed rather than stacked.

GROUND RULES (hard — the deterministic engine enforces them, so never break them):
- The product is EXACTLY two screens: "home" (main browse/catalog) and "detail" (single-item info page).
- Home: toolbar (search) + a product grid, plus ONE dominant moment (the app hero metric band, the scoreboard, or the grid itself — pick one). Stats and charts render as BANDS, never cards.
- Detail: photo gallery is the hero; then a summary pane (the ONE card surface, sticky on desktop) and an action band. Reviews are divided rows, never cards.
- Card budget: home ≤ ${ROLE_CARD_BUDGET.home} card surfaces (the grid is the moment); detail ≤ ${ROLE_CARD_BUDGET.detail} (the single summary card). Everything else is bands/rows/tiles/toolbar.
- No off-archetype elements: no search on detail, no settings forms, no pricing tables, no marketing heroes, no tables.
- Secondary actions are quiet: one outline button at most per action row.

LAYOUT STRUCTURE (V10 — pick the one that best serves the product):
- home: "catalog-classic" (hero band → search → product grid → band chart), "catalog-rail" (search + stats in a STICKY LEFT RAIL beside the grid — data-dense catalogs), or "catalog-featured" (a curated featured strip above the grid — editorial products).
- detail: "detail-classic" (gallery hero → two-column pane + sticky summary card → reviews) or "detail-asymmetric" (the same surfaces with the gallery running full-width and the info column offset).
- The structure only REARRANGES the same blocks — never invent blocks that are not in the wireframe, and never change the surface of a block.

OUTPUT as ONE JSON object:
{
  "version": "1.0.0",
  "screens": [
    {
      "screenId": "home" | "detail",
      "layout": {
        "structure": "catalog-classic" | "catalog-rail" | "catalog-featured" | "detail-classic" | "detail-asymmetric" (match the screen's role: home → catalog-*, detail → detail-*),
        "dominantMoment": "block:variant",
        "sections": [{ "block", "variant"?, "surface"?: "band"|"card"|"rows"|"tiles"|"toolbar"|"gallery", "pair"?: boolean, "sticky"?: boolean, "emphasis"?: boolean }]
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

  // V11: attach the company's real UI screenshots so the layout structure
  // and surface choices mirror the brand's actual composition.
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

  const userText = `PRODUCT: ${input.brief.title} — ${input.brief.productType}\n${input.brief.description}\n\n${companyBlock}\n\n${megadesign}\n\nDOMAIN DATA (the sections fill these slots):\n${datasetPrompt(input.data)}\n\nENFORCED WIREFRAME (canonical two-screen model):\n${wireframeBlock}\n${refText}\n\nDesign the UX as JSON.`;

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

/** Deterministic UX design (no model call) — the canonical two-screen plan. */
export function fallbackUx(wireframe: WireframePlan): UxDesignPlan {
  return resolveUxDesign(wireframe, null);
}

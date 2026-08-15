import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { layoutGenomeSchema, defaultGenome, buildModeVocabulary, classifyGenomeMode, type LayoutGenome } from "../lib/genome";
import { reconcileGenome } from "../lib/genome-reconcile";
import { loadCompany, compileCompanyBlock, megadesignBlock } from "../knowledge/index";
import type { ProductBrief } from "../schemas";
import type { VisualReference } from "../types";

/**
 * Maxi Agent v23 — the layout-genome agent.
 *
 * ONE schema-constrained call producing a compact layout genome. The mode is
 * classified deterministically BEFORE the call (classifyGenomeMode), and the
 * prompt's vocabulary is constructed from the mode — illegal blocks never
 * exist as options. The output is a small validated JSON document, not a
 * prose wireframe, so the call runs on the CHEAP tier: a hard schema
 * (layoutGenomeSchema) + deterministic enforcement (enforceUxDesign in
 * lib/ux-design.ts) + the layout gate (checks/layout.ts) check the output
 * downstream.
 */

export interface GenomeInput {
  brief: ProductBrief;
  visualReference?: VisualReference;
  onUsage?: OnUsage;
}

export interface GenomeOutput {
  genome: LayoutGenome;
  mode: LayoutGenome["mode"];
  usedFallback: boolean;
  notes: string[];
}

/**
 * V24 guardrail language — the company-imagery path now uses the SAME
 * correctly-worded guardrail as the user-upload path (verbatim), plus the
 * explicit reference-for-patterns-not-colors rule: a non-branded product
 * (a fitness app inspired by Nike) must NEVER reproduce Nike's literal
 * colors; the imagery is reference for typography/spacing/motion only.
 */
export const COMPANY_REFERENCE_GUIDANCE =
  "### COMPANY REFERENCE IMAGERY\nScreenshots of the real company UI are attached. Use them as reference for typography, spacing, and motion patterns — never for brand or color reproduction (unless the product IS that brand). " +
  "Match its composition, hierarchy, spacing, surface treatment, density, and responsive intent. Do not copy its domain, text, brand, or page archetype. Fit the two-screen model and the mode vocabulary exactly.";

export const USER_TARGET_GUARDRAILS =
  "\n\n### USER FIGMA/BANANI PRODUCT TARGET\nThe attached image is the product's visual source of truth. " +
  "Match its composition, hierarchy, spacing, surface treatment, density, and responsive intent. Do not copy its domain, text, brand, or page archetype. Product requirements outrank inspiration-company patterns.";

/** V24: deterministic user-prompt builder (exported for regression tests). */
export function buildBriefBlock(brief: ProductBrief): string {
  return [
    `PRODUCT: ${brief.title} — ${brief.productType}`,
    brief.description,
    `Audience: ${brief.audience.primary}`,
    `Platform: ${brief.platform}`,
    "Features:",
    ...brief.features.map((f) => `- ${f.name} (${f.priority}): ${f.description}`),
    "Screen purposes:",
    ...brief.screenPurposes.map((s) => `- ${s.id}: ${s.purpose}`),
    `Design language: ${brief.designLanguage}`,
  ].join("\n");
}

export function buildGenomeUserText(opts: {
  brief: ProductBrief;
  companyBlock: string;
  megadesign: string;
  vocabulary: string;
  companyRefText: string;
  userRefText: string;
}): string {
  const briefBlock = [
    `PRODUCT: ${opts.brief.title} — ${opts.brief.productType}`,
    opts.brief.description,
    `Audience: ${opts.brief.audience.primary}`,
    `Platform: ${opts.brief.platform}`,
    "Features:",
    ...opts.brief.features.map((f) => `- ${f.name} (${f.priority}): ${f.description}`),
    "Screen purposes:",
    ...opts.brief.screenPurposes.map((s) => `- ${s.id}: ${s.purpose}`),
    `Design language: ${opts.brief.designLanguage}`,
  ].join("\n");

  return [
    briefBlock,
    "",
    opts.companyBlock,
    "",
    opts.megadesign,
    "",
    opts.vocabulary,
    "",
    opts.companyRefText,
    opts.userRefText,
  ].join("\n\n");
}

export async function runGenomeAgent(input: GenomeInput): Promise<GenomeOutput> {
  // Deterministic mode classification FIRST — the vocabulary is mode-scoped.
  const mode = classifyGenomeMode(input.brief);
  const vocabulary = buildModeVocabulary(mode);

  let companyBlock = "";
  let megadesign = "";
  try {
    companyBlock = await compileCompanyBlock(input.brief.inspiration.primary);
    megadesign = await megadesignBlock();
  } catch (err) {
    console.warn("[maxi-agent] knowledge blocks unavailable for genome call:", err instanceof Error ? err.message : err);
  }

  const briefBlock = buildBriefBlock(input.brief);

  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  let companyRefText = "";
  try {
    const { companyRefImageBlocks } = await import("../knowledge/index");
    refImages = await companyRefImageBlocks(input.brief.inspiration.primary, 2);
    if (refImages.length > 0) {
      companyRefText = COMPANY_REFERENCE_GUIDANCE;
    }
  } catch {
    /* reference imagery is optional */
  }
  let userRefText = "";
  if (input.visualReference) {
    refImages.push(...input.visualReference.images);
    userRefText = USER_TARGET_GUARDRAILS;
  }

  const userText = buildGenomeUserText({
    brief: input.brief,
    companyBlock,
    megadesign,
    vocabulary,
    companyRefText,
    userRefText,
  });

  try {
    // V24: bounded retry at the Wave-1 call — a genome below the density
    // floors (missing minRows/primaryAction/maxEmptyViewport) is rejected
    // HERE, one corrective retry naming the exact schema violations, then
    // the deterministic default. An under-filled genome never reaches Wave 2.
    let output: { genome: LayoutGenome };
    let lastError = "";
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        output = await chatJSON<{ genome: LayoutGenome }>(
          [
            {
              role: "system",
              content: `You are the Maxi Agent layout planner. You turn a product brief into ONE compact layout genome — the smallest complete description of the product's two screens.
You do NOT write code and you do NOT write essays. You SELECT regions from the mode vocabulary and SPECIFY composition.

OUTPUT as ONE JSON object matching this shape EXACTLY:
{
  "genome": {
    "version": "1.0.0",
    "mode": "${mode}",
    "screens": [
      { "id": "home", "nav": "sidebar"|"topbar"|"sidebar+topbar", "maxEmptyViewport": <0-0.2>, "regions": [ { "block", "variant"?, "surface"?, "emphasis"?, "minRows"?, "primaryAction"?, "component"?, "content"? } ], "pairHints"? },
      { "id": "detail", "nav": "sidebar"|"topbar"|"sidebar+topbar", "maxEmptyViewport": <0-0.2>, "regions": [ ... ], "pairHints"? }
    ],
    "componentSlots": [ { "name" (PascalCase), "purpose", "usedBy": ["home"|"detail"] } ],
    "rationale"?
  }
}

Hard rules:
- Every block/variant/surface comes from the MODE vocabulary above. Nothing else exists.
- Exactly two screens: "home" and "detail". Exactly one dominant moment per screen.
- At most TWO component slots per screen and FOUR total. Each slot must be so product-specific it could not ship in a different product (a stat ring for a runner, a commit graph for a dev tool, an amenity grid for a stay). Generic primitives listed as slots are a FAILURE.
- Navigation chrome (Sidebar/Topbar) is NEVER a component slot — the screen's nav field decides the chrome. Never list them in componentSlots.
- Every componentSlots entry is mounted by at least one custom region.
- DENSITY FLOORS (hard — the schema rejects violations):
  - Every list/table region MUST declare "minRows" ≥ 3 (the populated rows it will render — 4-6 for real density).
  - Exactly ONE region per screen MUST carry "primaryAction": true — the screen's one visible primary action (the cta band on detail; on home, the region that holds the product's main action).
  - Every screen MUST declare "maxEmptyViewport" ≤ 0.2 — the fraction of the first viewport the screen may leave empty. Under-filled screens are rejected here.
- Keep the genome SMALL. Short content strings, no prose.${attempt > 1 ? `\n\n### CORRECTION REQUIRED (attempt ${attempt})\nYour previous output was rejected:\n${lastError}\nFix exactly those violations and re-emit the complete genome JSON.` : ""}`,
            },
            {
              role: "user",
              content: refImages.length > 0 ? [{ type: "text", text: userText }, ...refImages] : userText,
            },
          ],
          {
            model: "genome",
            temperature: 0.4,
            maxTokens: MAX_TOKENS_PER_CALL.genome,
            validate: (v) => {
              const genome = layoutGenomeSchema.parse((v as any).genome);
              return { genome };
            },
            onUsage: input.onUsage,
          },
        );
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`[maxi-agent] genome call rejected (attempt ${attempt}): ${lastError.slice(0, 400)}`);
        if (attempt === 2) throw err;
      }
    }

    const genome = output!.genome;
    const notes: string[] = [];
    if (genome.mode !== mode) notes.push(`model proposed mode "${genome.mode}" — run classification ("${mode}") wins`);

    // V24: deterministic reconciliation right after the call — nav chrome
    // slots are dropped, per-screen slot budget capped at 2, unmounted slots
    // dropped, and duplicate/unknown region mounts merged — all in one fixed
    // point. Nothing the model emitted that violates these floors ships.
    const reconciled = reconcileGenome(genome);
    for (const note of reconciled.notes) notes.push(note);

    // Dominant-moment discipline: enforce exactly one per screen and drop
    // pair hints involving the dominant moment or unknown regions.
    const fixed = {
      ...reconciled.genome,
      screens: reconciled.genome.screens.map((s) => {
        const regions = s.regions.map((r) => ({ ...r }));
        const dominant = regions.filter((r) => r.emphasis);
        if (dominant.length === 0 && regions.length > 0) {
          regions[0] = { ...regions[0], emphasis: true };
          notes.push(`${s.id}: no dominant region — first region emphasized`);
        } else if (dominant.length > 1) {
          const keep = dominant[0];
          for (const r of regions) {
            if (r !== keep && r.emphasis) {
              r.emphasis = undefined;
              notes.push(`${s.id}: de-emphasized ${r.block} — one dominant moment per screen`);
            }
          }
        }
        const pairHints = (s.pairHints ?? []).filter(([a, b]) => {
          const blocks = new Set(regions.map((r) => r.block));
          const dominantBlock = regions.find((r) => r.emphasis)?.block;
          return a !== b && blocks.has(a) && blocks.has(b) && a !== dominantBlock && b !== dominantBlock;
        });
        return { ...s, regions, pairHints: pairHints.length > 0 ? pairHints : undefined };
      }),
    };
    return { genome: fixed, mode, usedFallback: false, notes };
  } catch (err) {
    console.warn("[maxi-agent] genome call failed, using deterministic mode-default genome:", err instanceof Error ? err.message : err);
    const fallback = defaultGenome(mode, input.brief);
    return { genome: fallback, mode, usedFallback: true, notes: [`deterministic ${mode} default genome used`] };
  }
}

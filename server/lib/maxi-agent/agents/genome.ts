import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { layoutGenomeSchema, defaultGenome, buildModeVocabulary, classifyGenomeMode, type LayoutGenome } from "../lib/genome";
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

  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  let refText = "";
  try {
    const { companyRefImageBlocks } = await import("../knowledge/index");
    refImages = await companyRefImageBlocks(input.brief.inspiration.primary, 2);
    if (refImages.length > 0) {
      refText = "\n\n### COMPANY REFERENCE IMAGERY\nScreenshots of the real company UI are attached. Match their surfaces, density, and component shapes — never their page structure. Fit the two-screen model and the mode vocabulary exactly.";
    }
  } catch {
    /* reference imagery is optional */
  }
  if (input.visualReference) {
    refImages.push(...input.visualReference.images);
    refText += "\n\n### USER FIGMA/BANANI PRODUCT TARGET\nThe attached image is the product's visual source of truth. Match its composition, hierarchy, spacing, surface treatment, density, and responsive intent. Do not copy its domain, text, brand, or page archetype. Product requirements outrank inspiration-company patterns.";
  }

  const userText = [
    briefBlock,
    "",
    companyBlock,
    "",
    megadesign,
    "",
    vocabulary,
    "",
    refText,
  ].join("\n\n");

  try {
    const output = await chatJSON<{ genome: LayoutGenome }>(
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
      { "id": "home", "nav": "sidebar"|"topbar"|"sidebar+topbar", "regions": [ { "block", "variant"?, "surface"?, "emphasis"?, "component"?, "content"? } ], "pairHints"? },
      { "id": "detail", "nav": "sidebar"|"topbar"|"sidebar+topbar", "regions": [ ... ], "pairHints"? }
    ],
    "componentSlots": [ { "name" (PascalCase), "purpose", "usedBy": ["home"|"detail"] } ],
    "rationale"?
  }
}

Hard rules:
- Every block/variant/surface comes from the MODE vocabulary above. Nothing else exists.
- Exactly two screens: "home" and "detail". Exactly one dominant moment per screen.
- At least TWO component slots must be so product-specific they could not ship in a different product (a stat ring for a runner, a commit graph for a dev tool, an amenity grid for a stay). Generic primitives listed as slots are a FAILURE.
- Every componentSlots entry is mounted by at least one custom region.
- Keep the genome SMALL. Short content strings, no prose.`,
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

    const genome = output.genome;
    const notes: string[] = [];
    if (genome.mode !== mode) notes.push(`model proposed mode "${genome.mode}" — run classification ("${mode}") wins`);

    // Dominant-moment discipline: enforce exactly one per screen and drop
    // pair hints involving the dominant moment or unknown regions.
    const fixed = {
      ...genome,
      screens: genome.screens.map((s) => {
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

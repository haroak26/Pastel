import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { componentUISpecSchema, type ComponentUISpec, type ComponentInventory, type ResolvedTheme, type WireframePlan } from "../schemas";
import { baseComponentCode } from "../base-components/index";
import { datasetPrompt, type MockDataset } from "../lib/content";
import type { VisualReference } from "../types";

/**
 * V6/V7 Planner agent — per-component UI spec. Runs in PARALLEL across the
 * component inventory (cheap model). The company's componentGuidance for this
 * component shapes the spec; the builder turns it into code.
 *
 * V7: the spec carries the screens that mount the component and the run's
 * domain data, so the builder renders real product data instead of inventing
 * sample values.
 */

export interface PlannerInput {
  item: ComponentInventory["components"][number];
  theme: ResolvedTheme;
  wireframe?: WireframePlan;
  data?: MockDataset;
  visualReference?: VisualReference;
  onUsage?: OnUsage;
  /** V11: the inspiration company's slug — its reference imagery shapes the
   * designIntent so the spec asks for the brand's actual component style. */
  companySlug?: string;
  /** V18: screen composition summary — the full layout narrative so the
   * planner's designIntent is informed by the complete composition, not just
   * the isolated component spec. */
  compositionSummary?: string;
}

export interface PlannerOutput {
  spec: ComponentUISpec;
  usedFallback: boolean;
}

const SYSTEM = `You are a UI component planner. For ONE component, produce a precise implementation spec: purpose, props, variants, states, and a product-specific notes hint.

RULES:
- basedOn must be the provided base component name (the builder adapts it).
- props: MUST keep every prop of the reference component (same name, same type, same default). You may ADD product-specific props, but never drop or rename a reference prop — the deterministic composer passes those props with real data.
- The composer mounts this component with: title (string), items (list), metrics (list of {label, value, unit, delta, positive, note, spark}), people (list of {name, role, initials, hue}), settings (list of settings sections). ADD props with these names so the component renders the run's real product data — never invent internal sample values.
- variants: 2-5, each with a purpose. Include the company's flavor (e.g. tone, size, style).
- states: pick from default, hover, active, focus, disabled, loading, empty, error.
- designIntent (V10): ONE line of art direction — how this component should look and feel in THIS product, referencing the company's signature moves and the product data it displays (e.g. "a price card that reads like the brand's signature sticky summary — bold price, quiet meta rows, one coral pill CTA"). This is the builder's creative brief: it must ask for something more distinctive than the generic base component.
- notes: a concrete product-specific hint (how this component should feel in THIS product). Mention the product data it displays (from the provided dataset) and that every value slot renders a PROP — never hardcoded sample values.
- usedBy: copy the provided screen ids unchanged.`;

/** Extract the destructured prop names from a base component's source. */
function exemplarProps(basedOn: string): string[] {
  const code = baseComponentCode(basedOn);
  if (!code) return [];
  const match = code.match(/function\s+[A-Za-z0-9_]*\s*\(\s*\{([^}]*)\}/s);
  if (!match) return [];
  const props: string[] = [];
  for (const part of match[1].split(",")) {
    const name = part.trim().split("=")[0].trim().split(":")[0].trim();
    if (name && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) && name !== "...props") props.push(name);
  }
  return props;
}

export async function runPlanner(input: PlannerInput): Promise<PlannerOutput> {
  const guidance = input.theme.manifest.componentGuidance[input.item.basedOn]
    ?? input.theme.manifest.componentGuidance[input.item.name]
    ?? "";

  const refProps = exemplarProps(input.item.basedOn);
  const propsLine = refProps.length > 0
    ? `REFERENCE COMPONENT PROPS (MUST ALL be preserved, same names/types/defaults): ${refProps.join(", ")}`
    : "";

  const screensBlock = input.wireframe
    ? `SCREENS THAT MOUNT THIS COMPONENT:\n${input.wireframe.screens
        .filter((s) => input.item.usedBy.includes(s.id))
        .map((s) => `- ${s.id} (${s.archetype}): ${s.purpose}`)
        .join("\n")}`
    : "";

  const dataBlock = input.data ? datasetPrompt(input.data) : "";

  // V11: company reference imagery (vision) — the designIntent then describes
  // the brand's actual component style, not a generic ideal.
  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  let refText = "";
  if (input.companySlug) {
    try {
      const { companyRefImageBlocks } = await import("../knowledge/index");
      refImages = await companyRefImageBlocks(input.companySlug, 2);
      if (refImages.length > 0) {
        refText = "\n\n### COMPANY REFERENCE IMAGERY\nScreenshots of the REAL company UI are attached — the designIntent should describe components that feel like the brand's (shapes, density, mood), adapted to THIS product's data.";
      }
    } catch {
      /* reference imagery is optional */
    }
  }

  if (input.visualReference) {
    refImages.push(...input.visualReference.images);
    refText += "\n\n### USER PRODUCT REFERENCE\nAdapt component geometry, density, spacing, and surface treatment to the attached product reference. Keep the component's content and behavior faithful to the product brief.";
  }

  const compositionBlock = input.compositionSummary
    ? `SCREEN COMPOSITION CONTEXT (your component sits in this layout — the designIntent must reflect where it lives):\n${input.compositionSummary}`
    : "";

  const textPart = `COMPONENT: ${input.item.name} — ${input.item.purpose}\nBased on base component: ${input.item.basedOn}\nUsed by screens: ${input.item.usedBy.join(", ")}\n${propsLine}\n\n${screensBlock}\n\n${compositionBlock}\n\n${dataBlock}\n\nCOMPANY DESIGN GUIDANCE:\n${guidance || "Follow the company rules (below)."}\n\nCOMPANY RULES:\n${input.theme.manifest.rules.map((r) => `- ${r}`).join("\n")}\n\nCOMPANY SIGNATURE MOVES (reference for the designIntent):\n${input.theme.manifest.signatureMoves.map((s) => `- ${s}`).join("\n")}\n${refText}\n\nEmit the component UI spec as JSON matching:\n{\n  "name", "purpose", "basedOn", "usedBy": [screen ids],\n  "props": [{ "name", "type", "default"? }],\n  "variants": [{ "name", "purpose" }],\n  "states": string[],\n  "designIntent"?, "notes"?\n}`;

  try {
    const spec = await chatJSON<ComponentUISpec>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: refImages.length > 0 ? [{ type: "text", text: textPart }, ...refImages] : textPart,
        },
      ],
      {
        model: "planner",
        temperature: 0.3,
        maxTokens: MAX_TOKENS_PER_CALL.planner,
        validate: (v) => componentUISpecSchema.parse(v),
        onUsage: input.onUsage,
      },
    );
    return { spec: { ...spec, usedBy: input.item.usedBy }, usedFallback: false };
  } catch (err) {
    console.warn(`[pastel v6] planner failed for ${input.item.name}, using template:`, err instanceof Error ? err.message : err);
    return { spec: fallbackSpec(input.item, guidance), usedFallback: true };
  }
}

function fallbackSpec(item: PlannerInput["item"], guidance: string): ComponentUISpec {
  return {
    name: item.name,
    purpose: item.purpose,
    basedOn: item.basedOn,
    usedBy: item.usedBy,
    props: [
      { name: "className", type: "string", default: "" },
    ],
    variants: [
      { name: "default", purpose: item.purpose },
      { name: "compact", purpose: "Tighter spacing for dense slots" },
    ],
    states: ["default", "hover", "active", "focus", "disabled"],
    designIntent: guidance || "Distinctive product flavor: the component must look authored for this product, not like the generic base component.",
    notes: guidance ? `${guidance} Render every value slot from props — never hardcode sample values.` : "Render every value slot from props — never hardcode sample values.",
  };
}

import { z } from "zod";
import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { deltaPlanSystemPrompt, deltaPlanUserPrompt } from "../prompts/delta";
import {
  productSpecSchema,
  screenBlueprintSchema,
  componentContractSchema,
  type ScreenBlueprint,
  type SpecScreen,
  type ComponentContract,
} from "../schemas/plan-schemas";
import {
  architectureToMarkdown,
  componentContractsToMarkdown,
  screenBlueprintToMarkdown,
} from "../codegen/markdown";
import { normalizeComponentRef, screenDocPath, validateArchitecture } from "../codegen/derive";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Delta planning — plan ONLY the addition against the persistent project
 * state: new spec screens, new component contracts (only when no existing
 * contract serves), and blueprints for the new screens.
 */

export const deltaPlanSchema = z.object({
  summary: z.string().trim().min(1),
  screens: z.array(productSpecSchema.shape.screens.element).min(1).max(2),
  components: z.array(componentContractSchema).max(8),
  blueprints: z.array(screenBlueprintSchema).min(1).max(2),
});
export type DeltaPlan = z.infer<typeof deltaPlanSchema>;

/** Model-tolerant normalization of the raw delta response before zod parsing. */
function normalizeDeltaPlanRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const input = raw as Record<string, unknown>;
  const newScreenNames = Array.isArray(input.screens)
    ? input.screens.map((s: unknown) => (s && typeof s === "object" ? String((s as Record<string, unknown>).name ?? "") : "")).filter(Boolean)
    : [];
  return {
    ...input,
    blueprints: Array.isArray(input.blueprints)
      ? input.blueprints.map((bp: unknown) => {
          if (!bp || typeof bp !== "object") return bp;
          const b = bp as Record<string, unknown>;
          return {
            ...b,
            name: b.name ?? b.screen ?? b.screenName,
            responsive: b.responsive ?? { tablet: "768px: stack multi-column content", mobile: "375px: single column, primary actions visible" },
            sections: Array.isArray(b.sections)
              ? b.sections.map((sec: unknown) => {
                  if (!sec || typeof sec !== "object") return sec;
                  const s = sec as Record<string, unknown>;
                  return {
                    ...s,
                    components: Array.isArray(s.components) ? s.components.map((c) => normalizeComponentRef(String(c))) : [],
                  };
                })
              : b.sections,
          };
        })
      : input.blueprints,
    components: Array.isArray(input.components)
      ? input.components.map((c: unknown) => {
          if (!c || typeof c !== "object") return c;
          const contract = c as Record<string, unknown>;
          return {
            ...contract,
            usedBy: Array.isArray(contract.usedBy) && contract.usedBy.length > 0 ? contract.usedBy : newScreenNames,
          };
        })
      : input.components,
  };
}

export interface DeltaOutcome {
  plan: DeltaPlan;
  newScreenNames: string[];
  newComponentNames: string[];
}

export async function deltaPlanStage(ctx: StageContext, additionPrompt: string): Promise<DeltaOutcome> {
  const spec = ctx.state.productSpec;
  const architecture = ctx.state.architecture;
  if (!spec || !architecture) throw new Error("delta planning requires productSpec and architecture in state");

  ctx.activity("Planning the addition against the existing architecture");
  const sys = deltaPlanSystemPrompt();
  const user = `${deltaPlanUserPrompt(
    additionPrompt,
    JSON.stringify(spec),
    JSON.stringify(architecture.components),
    JSON.stringify(architecture.screens),
  )}\n\nEXISTING COMPONENT NAMES (reference these verbatim, or declare the missing contract in "components"):\n${architecture.components.map((c) => c.name).join(", ")}`;

  const existingScreens = new Set(spec.screens.map((s) => s.name));
  const existingContracts = new Set(architecture.components.map((c) => c.name));
  const existingLayouts = new Set(architecture.components.filter((c) => c.kind === "layout").map((c) => c.name));

  let delta: DeltaPlan;
  try {
    delta = await chatJSON<DeltaPlan>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "architecture",
        temperature: 0.4,
        maxTokens: MAX_TOKENS_PER_CALL.architecture,
        validate: (v) => {
          const parsed = deltaPlanSchema.parse(normalizeDeltaPlanRaw(v));
          const blueprintNames = new Set(parsed.blueprints.map((b) => b.name));
          const screenNames = new Set(parsed.screens.map((s) => s.name));
          for (const bp of parsed.blueprints) {
            if (!screenNames.has(bp.name)) {
              throw new Error(`blueprint ${bp.name} has no matching spec screen`);
            }
          }
          for (const screen of parsed.screens) {
            if (!blueprintNames.has(screen.name)) {
              throw new Error(`spec screen ${screen.name} has no blueprint`);
            }
          }
          if (parsed.screens.every((s) => existingScreens.has(s.name))) {
            throw new Error("delta plan re-plans only existing screens — provide at least one new screen");
          }
          const deltaLayouts = new Set(parsed.components.filter((c) => c.kind === "layout").map((c) => c.name));
          const deltaContractNames = new Set(parsed.components.map((c) => c.name));
          for (const bp of parsed.blueprints) {
            if (bp.layout && !existingLayouts.has(bp.layout) && !deltaLayouts.has(bp.layout)) {
              throw new Error(`blueprint ${bp.name} references unknown layout ${bp.layout} — use one of the existing layout contracts (${[...existingLayouts].join(", ") || "none"}), declare it in components, or omit "layout"`);
            }
            for (const section of bp.sections) {
              for (const ref of section.components) {
                if (!existingContracts.has(ref) && !deltaContractNames.has(ref)) {
                  throw new Error(`blueprint ${bp.name} section "${section.name}" references component "${ref}" which neither exists in the project nor is declared in "components" — reference an existing contract (${[...existingContracts].slice(0, 20).join(", ")}) or declare it in "components"`);
                }
              }
            }
          }
          return parsed;
        },
      },
    );
    ctx.trackCost("delta-plan", MODELS.architecture, sys.length + user.length, JSON.stringify(delta).length);
  } catch (err) {
    console.warn("[pastel-agent] delta planning failed:", err instanceof Error ? err.message : err);
    throw err;
  }

  // Merge: skip exact duplicates, replace changed contracts, append new.
  const newScreens: SpecScreen[] = delta.screens.filter((s) => !existingScreens.has(s.name));
  const deltaLayoutNames = new Set(delta.components.filter((c) => c.kind === "layout").map((c) => c.name));
  const newBlueprints: ScreenBlueprint[] = delta.blueprints
    .filter((b) => newScreens.some((s) => s.name === b.name))
    .map((b) => ({
      ...b,
      layout: b.layout && !existingLayouts.has(b.layout) && !deltaLayoutNames.has(b.layout) ? undefined : b.layout,
      sections: b.sections.map((section) => ({
        ...section,
        components: section.components.map(normalizeComponentRef),
      })),
    }));
  const newComponents: ComponentContract[] = delta.components;

  if (newScreens.length === 0) {
    throw new Error("The requested screens already exist in this project");
  }

  ctx.state.productSpec = {
    ...spec,
    screens: [...spec.screens, ...newScreens],
  };
  const mergedComponents = [
    ...architecture.components.filter((c) => !delta.components.some((d) => d.name === c.name)),
    ...delta.components,
  ];
  ctx.state.architecture = {
    ...architecture,
    fileTree: [...new Set([...architecture.fileTree, ...newScreens.map((s) => `src/screens/${s.name}.jsx`)])],
    components: mergedComponents,
    screens: [...architecture.screens, ...newBlueprints],
  };

  const structural = validateArchitecture(ctx.state.architecture, ctx.state.productSpec);
  if (structural.length > 0) {
    throw new Error(`delta merge produced an inconsistent architecture: ${structural.map((i) => i.message).join("; ")}`);
  }

  ctx.state.decisionLog = [...ctx.state.decisionLog, `Delta: added screens ${newScreens.map((s) => s.name).join(", ")} — ${delta.summary}`];
  await saveProjectState(ctx.state);

  await ctx.saveDoc({ path: "docs/02-architecture.md", title: "Architecture Plan", kind: "system", content: architectureToMarkdown(ctx.state.architecture) });
  await ctx.saveDoc({ path: "docs/02-components.md", title: "Component Specifications", kind: "component-spec", content: componentContractsToMarkdown(ctx.state.architecture.components) });
  for (const blueprint of newBlueprints) {
    await ctx.saveDoc({
      path: screenDocPath(blueprint.name),
      title: `${blueprint.name} Screen Spec`,
      kind: "screen-spec",
      content: screenBlueprintToMarkdown(blueprint, newScreens.find((s) => s.name === blueprint.name)),
    });
  }
  ctx.activity(`Delta planned — ${newScreens.map((s) => s.name).join(", ")} (+${delta.components.filter((c) => !existingContracts.has(c.name)).length} new components)`);

  return {
    plan: delta,
    newScreenNames: newScreens.map((s) => s.name),
    newComponentNames: delta.components.map((c) => c.name),
  };
}

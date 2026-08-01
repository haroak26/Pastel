import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { composeSystemPrompt, composeUserPrompt } from "../prompts/compose";
import {
  screenCompositionSetSchema,
  type ComponentContract,
  type PatternContext,
  type ProductSpec,
  type ScreenBlueprint,
} from "../schemas/plan-schemas";
import { formatImportContract, screenBlueprintToMarkdown } from "../codegen/markdown";
import { copyKnowledge } from "../knowledge";
import { normalizeComponentRef, pathForComponent, relativeImport, screenDocPath, toPascalCase, validateArchitecture } from "../codegen/derive";
import { saveProjectState } from "../state";
import { formatPatternsForCompose, staticPatternContext } from "./pattern-retrieval";
import type { StageContext } from "./context";

/**
 * Stage 12 — Screen composition. Screens are assembled strictly from the
 * brand kit, the component system, the layout plan, and the retrieved
 * patterns. No new layouts, components, or spacing are invented here.
 */

const FALLBACK_PATTERNS = ["Split Hero", "Stat Block", "Alternating Rows", "Statement + Button"] as const;

/** Deterministic copy cleanser: planner prose ("Let users inspect…") is never product copy. */
export function copyCleanser(text: string): string {
  let copy = text.trim();
  copy = copy.replace(/^(let|allow|help|enable)s? users (to )?/i, "");
  copy = copy.replace(/^users (can|are able to|should be able to) /i, "");
  if (copy) copy = copy.charAt(0).toUpperCase() + copy.slice(1);
  return copy;
}

export function fallbackComposition(screen: ProductSpec["screens"][number], contracts: ComponentContract[], patternContext: PatternContext | null): ScreenBlueprint {
  const assigned = patternContext?.assignments.find((a) => a.screen === screen.name)?.patterns ?? [];
  const layout = contracts.find((c) => c.kind === "layout")?.name ?? null;
  const usable = (wanted: string[]) => contracts.filter((c) => wanted.map(toPascalCase).includes(c.name)).map((c) => c.name);
  return {
    name: screen.name,
    layout: layout ?? undefined,
    sections: screen.sections.slice(0, 8).map((section, index) => ({
      name: section.name,
      pattern: assigned[index % Math.max(1, assigned.length)] ?? FALLBACK_PATTERNS[index % FALLBACK_PATTERNS.length],
      components: index === 0 ? usable(["Navbar", "AppShell", "Header"]).slice(0, 1) : [],
      copy: [copyCleanser(section.purpose)],
      notes: section.purpose,
    })),
    responsive: {
      tablet: "768px: reduce gutters and stack multi-column content.",
      mobile: "375px: single column, primary actions remain visible.",
    },
  };
}

/** Model-tolerant normalization of a raw composition before zod parsing. */
function normalizeCompositionRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const input = raw as Record<string, unknown>;
  const list = Array.isArray(input.screens) ? input.screens : Array.isArray(input.compositions) ? input.compositions : [];
  return {
    screens: list.map((bp: unknown) => {
      if (!bp || typeof bp !== "object") return bp;
      const b = bp as Record<string, unknown>;
      const layoutRaw = b.layout ?? b.layoutComponent ?? null;
      // Models annotate refs ("AppShell (layout)") — strip like component refs.
      const layout = typeof layoutRaw === "string" && layoutRaw.trim() ? toPascalCase(normalizeComponentRef(layoutRaw)) : null;
      return {
        ...b,
        name: b.name ?? b.screen ?? b.screenName,
        layout: layout ?? undefined,
        responsive: b.responsive ?? { tablet: "768px: stack multi-column content", mobile: "375px: single column, primary actions visible" },
        sections: Array.isArray(b.sections)
          ? b.sections.map((sec: unknown) => {
              if (!sec || typeof sec !== "object") return sec;
              const s = sec as Record<string, unknown>;
              return {
                ...s,
                components: Array.isArray(s.components) ? s.components.map((c) => normalizeComponentRef(String(c))).slice(0, 8) : [],
                copy: (Array.isArray(s.copy) ? s.copy : [s.copy].filter(Boolean)).slice(0, 24),
              };
            })
          : b.sections,
      };
    }),
  };
}

export async function screenCompositionStage(ctx: StageContext): Promise<ScreenBlueprint[]> {
  ctx.activity("Composing every screen");
  const spec = ctx.state.productSpec;
  const ds = ctx.state.designSystem;
  const screenPlan = ctx.state.screenPlan;
  const architecture = ctx.state.architecture;
  if (!spec || !ds || !screenPlan || !architecture) {
    throw new Error("composition stage requires productSpec, designSystem, screenPlan and component system in state");
  }
  const contracts = architecture.components;
  const patternContext = ctx.state.patternContext ?? staticPatternContext(screenPlan.screens.map((s) => s.name));
  ctx.state.patternContext = patternContext;

  const contractsJson = JSON.stringify(contracts.map((c) => ({ name: c.name, kind: c.kind, ownerScreen: c.ownerScreen, purpose: c.purpose, variants: c.variants.map((v) => v.name), usedBy: c.usedBy })));
  const patternsText = formatPatternsForCompose(patternContext);

  let compositions: ScreenBlueprint[];
  const sys = composeSystemPrompt();
  const user = composeUserPrompt(JSON.stringify(screenPlan), JSON.stringify(ctx.state.layoutPlan), contractsJson, patternsText, copyKnowledge(), ctx.styleDirection);
  try {
    const result = await chatJSON(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "compose",
        temperature: 0.4,
        maxTokens: MAX_TOKENS_PER_CALL.compose,
        validate: (v) => {
          const parsed = screenCompositionSetSchema.parse(normalizeCompositionRaw(v));
          const plannedNames = new Set(screenPlan.screens.map((s) => s.name));
          for (const bp of parsed.screens) {
            if (!plannedNames.has(bp.name)) throw new Error(`composition ${bp.name} is not a planned screen`);
          }
          // Loose pattern guidance (retrieval is advisory); strict component refs
          // are enforced structurally after assembly by validateArchitecture.
          return parsed;
        },
      },
    );
    ctx.trackCost("compose", MODELS.compose, sys.length + user.length, JSON.stringify(result).length);
    compositions = result.screens;
  } catch (err) {
    console.warn("[pastel-agent] screen composition failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Screen composition completed with deterministic defaults");
    compositions = spec.screens.map((screen) => fallbackComposition(screen, contracts, patternContext));
  }

  // Deterministic normalization + coverage guarantee: one composition per
  // planned screen, spec order, normalized component refs.
  compositions = spec.screens.map((specScreen) => {
    const found = compositions.find((c) => c.name === specScreen.name);
    if (!found) return fallbackComposition(specScreen, contracts, patternContext);
    return {
      ...found,
      layout: found.layout && contracts.some((c) => c.kind === "layout" && c.name === found.layout) ? found.layout : undefined,
      sections: found.sections.map((section) => ({
        ...section,
        components: section.components.map(normalizeComponentRef).filter((ref) => contracts.some((c) => c.name === ref)),
      })),
    };
  });

  // Assemble the full architecture (stages 10 + 12) and structurally validate.
  const assembled = {
    ...architecture,
    fileTree: [
      ...new Set([
        ...architecture.fileTree,
        ...compositions.map((c) => `src/screens/${c.name}.jsx`),
      ]),
    ],
    screens: compositions,
  };
  const issues = validateArchitecture(assembled, spec);
  if (issues.length > 0) {
    throw new Error(`assembled architecture failed structural validation: ${issues.map((i) => i.message).join("; ")}`);
  }
  ctx.state.architecture = assembled;
  ctx.state.decisionLog = [...ctx.state.decisionLog, `Composition: ${compositions.length} screens composed from ${contracts.length} contracts`];
  await saveProjectState(ctx.state);

  // Screen docs land here — the client lists screens from these paths.
  await Promise.all(
    compositions.map((composition) =>
      ctx.saveDoc({
        path: screenDocPath(composition.name),
        title: `${composition.name} Screen Composition`,
        kind: "screen-spec",
        content: screenBlueprintToMarkdown(composition, spec.screens.find((s) => s.name === composition.name)),
      }),
    ),
  );
  ctx.activity(`Screens composed — ${compositions.map((c) => c.name).join(", ")}`);
  return compositions;
}

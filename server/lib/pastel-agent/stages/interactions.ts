import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { interactionsSystemPrompt, interactionsUserPrompt } from "../prompts/interactions";
import { interactionPlanSchema, type InteractionPlan } from "../schemas/plan-schemas";
import { interactionPlanToMarkdown } from "../codegen/markdown";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 13 — Interaction planning. Hover, focus, keyboard shortcuts, loading,
 * transitions, error behaviour, empty states, accessibility — defined before
 * implementation so codegen never invents them.
 */

export function fallbackInteractionPlan(screenNames: string[]): InteractionPlan {
  return {
    keyboardShortcuts: [],
    focusManagement: ["Focus rings are always visible on interactive elements", "Tab order follows the visual hierarchy"],
    screens: screenNames.map((screen) => ({
      screen,
      loading: "Skeleton placeholders mirroring the final layout",
      empty: "Empty state explaining what appears here, with the primary action to create it",
      error: "Inline error surface with a retry action",
      transitions: ["Hover and focus states ease in per the motion tokens", "Interactive elements transition color and border only"],
    })),
  };
}

export async function interactionsStage(ctx: StageContext): Promise<InteractionPlan> {
  ctx.activity("Specifying interactions");
  const spec = ctx.state.productSpec;
  const ds = ctx.state.designSystem;
  const screenPlan = ctx.state.screenPlan;
  const architecture = ctx.state.architecture;
  if (!spec || !ds || !screenPlan || !architecture || architecture.screens.length === 0) {
    throw new Error("interactions stage requires productSpec, designSystem, screenPlan and composed screens in state");
  }
  const screenNames = screenPlan.screens.map((s) => s.name);

  let plan: InteractionPlan;
  const sys = interactionsSystemPrompt();
  const componentsJson = JSON.stringify(architecture.components.map((c) => ({ name: c.name, states: c.states })));
  const motionJson = JSON.stringify(ds.motion);
  const a11yJson = JSON.stringify(spec.accessibility);
  const user = interactionsUserPrompt(JSON.stringify(screenPlan), componentsJson, motionJson, a11yJson);
  try {
    plan = await chatJSON<InteractionPlan>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "interactions",
        temperature: 0.3,
        maxTokens: MAX_TOKENS_PER_CALL.interactions,
        validate: (v) => {
          const parsed = interactionPlanSchema.parse(normalizeInteractionsRaw(v));
          const known = new Set(screenNames);
          const unknown = parsed.screens.map((s) => s.screen).filter((name) => !known.has(name));
          if (unknown.length > 0) throw new Error(`interaction plan references unknown screens: ${[...new Set(unknown)].join(", ")}`);
          return parsed;
        },
      },
    );
    ctx.trackCost("interactions", MODELS.interactions, sys.length + user.length, JSON.stringify(plan).length);
  } catch (err) {
    console.warn("[pastel-agent] interaction planning failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Interaction plan completed with deterministic defaults");
    plan = fallbackInteractionPlan(screenNames);
  }

  // Coverage guarantee: one entry per planned screen.
  plan = {
    ...plan,
    screens: screenNames.map((name) => plan.screens.find((s) => s.screen === name) ?? fallbackInteractionPlan([name]).screens[0]),
  };
  ctx.state.interactionPlan = plan;
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/09-interactions.md",
    title: "Interaction Plan",
    kind: "system",
    content: interactionPlanToMarkdown(plan),
  });
  return plan;
}

/** Model-tolerant normalization: wrappers, per-screen maps, missing globals. */
function normalizeInteractionsRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  let input = raw as Record<string, unknown>;
  for (const key of ["interactionPlan", "plan", "interactions", "data"]) {
    if (input[key] && typeof input[key] === "object" && !Array.isArray(input[key])) {
      input = input[key] as Record<string, unknown>;
      break;
    }
  }
  let screens: unknown = input.screens;
  if (screens && typeof screens === "object" && !Array.isArray(screens)) {
    // { Dashboard: { loading, empty, error, transitions } } map form
    screens = Object.entries(screens as Record<string, unknown>).map(([screen, value]) =>
      value && typeof value === "object" ? { screen, ...(value as Record<string, unknown>) } : { screen },
    );
  }
  return {
    ...input,
    screens: Array.isArray(screens) ? screens : [],
    keyboardShortcuts: Array.isArray(input.keyboardShortcuts) ? input.keyboardShortcuts : [],
    focusManagement: Array.isArray(input.focusManagement) ? input.focusManagement : [],
  };
}

/** Per-screen interaction slice injected into the implementer prompt. */
export function interactionsForScreen(plan: InteractionPlan | null, screen: string) {
  return plan?.screens.find((s) => s.screen === screen) ?? null;
}

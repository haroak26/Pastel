import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { screenPlanSystemPrompt, screenPlanUserPrompt } from "../prompts/screen-plan";
import { screenPlanSchema, type InformationArchitecture, type ProductSpec, type ScreenPlan, type ScreenPlanEntry, type UserFlowPlan } from "../schemas/plan-schemas";
import { screenPlanToMarkdown } from "../codegen/markdown";
import { toPascalCase } from "../codegen/derive";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 8 — Screen planning. Every screen's goal, user, primary action,
 * secondary actions, required components and required content. No layouts.
 */

export function fallbackScreenPlanEntry(specScreen: ProductSpec["screens"][number], audience: string): ScreenPlanEntry {
  return {
    id: specScreen.id,
    name: specScreen.name,
    goal: specScreen.purpose,
    user: audience,
    primaryAction: specScreen.userGoal,
    secondaryActions: [],
    requiredComponents: specScreen.components.map(toPascalCase).slice(0, 10),
    requiredContent: specScreen.sections.map((s) => s.purpose).slice(0, 10),
  };
}

function normalizeScreenPlan(plan: ScreenPlan, spec: ProductSpec): ScreenPlan {
  const audience = spec.audience.primary;
  return {
    screens: spec.screens.map((specScreen) => {
      const found = plan.screens.find((s) => s.name === specScreen.name);
      if (!found) return fallbackScreenPlanEntry(specScreen, audience);
      return { ...found, id: specScreen.id, name: specScreen.name };
    }),
  };
}

export async function screenPlanStage(ctx: StageContext): Promise<ScreenPlan> {
  ctx.activity("Planning every screen");
  const spec = ctx.state.productSpec;
  const ia = ctx.state.informationArchitecture;
  if (!spec || !ia) throw new Error("screen-plan stage requires productSpec and informationArchitecture in state");
  const flows: UserFlowPlan = ctx.state.userFlowPlan ?? { flows: [{ name: "Primary", description: spec.screens[0].userGoal, steps: spec.screens.slice(0, 3).map((s) => ({ screen: s.name, action: s.userGoal })) }] };

  let plan: ScreenPlan;
  const sys = screenPlanSystemPrompt();
  const user = screenPlanUserPrompt(JSON.stringify(spec), JSON.stringify(ia), JSON.stringify(flows));
  try {
    plan = await chatJSON<ScreenPlan>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "screenPlan", temperature: 0.3, maxTokens: MAX_TOKENS_PER_CALL.screenPlan, validate: (v) => screenPlanSchema.parse(v) },
    );
    ctx.trackCost("screenPlan", MODELS.screenPlan, sys.length + user.length, JSON.stringify(plan).length);
  } catch (err) {
    console.warn("[pastel-agent] screen plan failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Screen plan completed with deterministic defaults");
    plan = { screens: spec.screens.map((s) => fallbackScreenPlanEntry(s, spec.audience.primary)) };
  }

  plan = normalizeScreenPlan(plan, spec);
  ctx.state.screenPlan = plan;
  ctx.state.decisionLog = [...ctx.state.decisionLog, `Screen plan: ${plan.screens.length} screens with primary actions: ${plan.screens.map((s) => `${s.name} → ${s.primaryAction}`).join("; ")}`];
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/05-screen-plan.md",
    title: "Screen Plan",
    kind: "system",
    content: screenPlanToMarkdown(plan),
  });
  return plan;
}

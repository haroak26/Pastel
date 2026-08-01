import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { userFlowsSystemPrompt, userFlowsUserPrompt } from "../prompts/flows";
import { userFlowPlanSchema, type ProductSpec, type UserFlowPlan } from "../schemas/plan-schemas";
import { userFlowsToMarkdown, informationArchitectureToMarkdown } from "../codegen/markdown";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 7 — User flow planning. Designs the journeys: every interaction is
 * intentional, from entry point to outcome.
 */

export function fallbackUserFlows(spec: ProductSpec): UserFlowPlan {
  if (spec.userFlows.length > 0) {
    const names = new Set(spec.screens.map((s) => s.name));
    const converted = spec.userFlows
      .map((flow) => ({
        name: flow.name,
        description: `The ${flow.name} journey`,
        steps: flow.steps
          .map((step) => {
            const hit = spec.screens.find((s) => step.toLowerCase().includes(s.name.toLowerCase())) ?? spec.screens[0];
            return { screen: names.has(hit.name) ? hit.name : spec.screens[0].name, action: step };
          })
          .slice(0, 10),
      }))
      .filter((flow) => flow.steps.length >= 2);
    if (converted.length > 0) return { flows: converted };
  }
  return {
    flows: [
      {
        name: "Primary journey",
        description: spec.screens[0]?.userGoal ?? "The core user journey",
        steps: spec.screens.slice(0, 3).map((screen) => ({ screen: screen.name, action: screen.userGoal })),
      },
    ],
  };
}

export async function userFlowsStage(ctx: StageContext): Promise<UserFlowPlan> {
  ctx.activity("Planning the user flows");
  const brief = ctx.state.creativeBrief;
  const spec = ctx.state.productSpec;
  if (!brief || !spec) throw new Error("flows stage requires creativeBrief and productSpec in state");
  const ia = ctx.state.informationArchitecture ?? fallbackIA(spec, ctx);

  let flows: UserFlowPlan;
  const sys = userFlowsSystemPrompt();
  const user = userFlowsUserPrompt(
    JSON.stringify(brief),
    JSON.stringify(ia),
    JSON.stringify(spec.screens.map((s) => s.name)),
  );
  try {
    flows = await chatJSON<UserFlowPlan>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "flows",
        temperature: 0.3,
        maxTokens: MAX_TOKENS_PER_CALL.flows,
        validate: (v) => {
          const parsed = userFlowPlanSchema.parse(v);
          const known = new Set(spec.screens.map((s) => s.name));
          const unknown = parsed.flows.flatMap((f) => f.steps).map((s) => s.screen).filter((name) => !known.has(name));
          if (unknown.length > 0) throw new Error(`user flows reference unknown screens: ${[...new Set(unknown)].join(", ")}`);
          return parsed;
        },
      },
    );
    ctx.trackCost("flows", MODELS.flows, sys.length + user.length, JSON.stringify(flows).length);
  } catch (err) {
    console.warn("[pastel-agent] user flows failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("User flows completed with deterministic defaults");
    flows = fallbackUserFlows(spec);
  }

  ctx.state.userFlowPlan = flows;
  await saveProjectState(ctx.state);

  // Flows doc is appended to the architecture doc so related structure reads together.
  await ctx.saveDoc({
    path: "docs/04-architecture.md",
    title: "Information Architecture",
    kind: "system",
    content: `${informationArchitectureToMarkdown(ia)}\n\n---\n\n${userFlowsToMarkdown(flows)}`,
  });
  return flows;
}

function fallbackIA(spec: ProductSpec, ctx: StageContext) {
  return ctx.state.informationArchitecture ?? {
    navigation: { type: "topbar" as const, items: spec.screens.map((s) => ({ label: s.name, screen: s.name })) },
    groups: [],
    entryScreen: spec.screens[0].name,
    contentPriority: spec.screens.map((screen) => ({ screen: screen.name, priority: [screen.userGoal] })),
  };
}

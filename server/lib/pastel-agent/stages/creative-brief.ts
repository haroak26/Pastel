import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { creativeBriefSystemPrompt, creativeBriefUserPrompt } from "../prompts/creative-brief";
import { creativeBriefSchema, type CreativeBrief } from "../schemas/plan-schemas";
import { creativeBriefToMarkdown } from "../codegen/markdown";
import { saveProjectState } from "../state";
import { fallbackIntake } from "./clarify";
import type { StageContext } from "./context";

/**
 * Stage 2 — Creative brief. Transforms the conversation into a complete
 * product brief: summary, audience, goals, requirements, success criteria,
 * constraints. No layouts, no design — planning only.
 */

export function fallbackCreativeBrief(prompt: string): CreativeBrief {
  return {
    productSummary: prompt.slice(0, 600) || "A product experience.",
    audience: { primary: "The audience implied by the request", secondary: [] },
    userGoals: ["Complete the primary task the product exists for"],
    businessGoals: ["Present the product with clarity and polish"],
    functionalRequirements: ["The core workflow described by the request is fully supported"],
    successCriteria: ["A first-time user can find the primary action within seconds"],
    constraints: [],
  };
}

export async function creativeBriefStage(ctx: StageContext): Promise<CreativeBrief> {
  ctx.activity("Writing the creative brief");
  const intake = ctx.state.intake ?? fallbackIntake(ctx.prompt);
  ctx.state.intake = intake;

  let brief: CreativeBrief;
  const sys = creativeBriefSystemPrompt();
  const user = creativeBriefUserPrompt(ctx.prompt, JSON.stringify(intake), ctx.answers);
  try {
    brief = await chatJSON<CreativeBrief>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "creativeBrief", temperature: 0.4, maxTokens: MAX_TOKENS_PER_CALL.creativeBrief, validate: (v) => creativeBriefSchema.parse(v) },
    );
    ctx.trackCost("creativeBrief", MODELS.creativeBrief, sys.length + user.length, JSON.stringify(brief).length);
  } catch (err) {
    console.warn("[pastel-agent] creative brief failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Creative brief completed with deterministic defaults");
    brief = fallbackCreativeBrief(ctx.prompt);
  }

  ctx.state.creativeBrief = brief;
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/00-creative-brief.md",
    title: "Creative Brief",
    kind: "brief",
    content: creativeBriefToMarkdown(brief, intake, ctx.answers),
  });
  return brief;
}

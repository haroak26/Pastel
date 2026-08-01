import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { brandStrategySystemPrompt, brandStrategyUserPrompt } from "../prompts/brand-strategy";
import { brandStrategySchema, type BrandStrategy } from "../schemas/plan-schemas";
import { brandStrategyToMarkdown } from "../codegen/markdown";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 4 — Brand strategy. Establishes the product's identity (personality,
 * design direction, emotional tone, visual keywords, positioning) before any
 * design artifact exists. Everything downstream references it.
 */

export function fallbackBrandStrategy(ctx: StageContext): BrandStrategy {
  return {
    personality: ctx.seed.mood.slice(0, 3).length > 0 ? ctx.seed.mood.slice(0, 3) : ["Professional", "Calm", "Modern"],
    designDirection: ctx.seed.creativeDirection,
    emotionalTone: ctx.seed.mood.slice(0, 3).length > 0 ? ctx.seed.mood.slice(0, 3) : ["Confident", "Restrained"],
    visualKeywords: [ctx.seed.colorTemperature, ctx.seed.textureApproach, ctx.seed.typographicAttitude].filter(Boolean).slice(0, 4),
    positioning: "A focused product experience that earns trust through clarity and craft.",
  };
}

export async function brandStrategyStage(ctx: StageContext): Promise<BrandStrategy> {
  ctx.activity("Establishing the brand strategy");
  const brief = ctx.state.creativeBrief;
  const spec = ctx.state.productSpec;
  if (!brief || !spec) throw new Error("brand-strategy stage requires creativeBrief and productSpec in state");

  let strategy: BrandStrategy;
  const sys = brandStrategySystemPrompt();
  const user = brandStrategyUserPrompt(
    JSON.stringify(brief),
    JSON.stringify({ title: spec.title, summary: spec.summary, goals: spec.goals, audience: spec.audience }),
    ctx.styleDirection,
  );
  try {
    strategy = await chatJSON<BrandStrategy>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "brandStrategy", temperature: 0.4, maxTokens: MAX_TOKENS_PER_CALL.brandStrategy, validate: (v) => brandStrategySchema.parse(v) },
    );
    ctx.trackCost("brandStrategy", MODELS.brandStrategy, sys.length + user.length, JSON.stringify(strategy).length);
  } catch (err) {
    console.warn("[pastel-agent] brand strategy failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Brand strategy completed with deterministic defaults");
    strategy = fallbackBrandStrategy(ctx);
  }

  ctx.state.brandStrategy = strategy;
  ctx.state.decisionLog = [...ctx.state.decisionLog, `Brand strategy: ${strategy.personality.join(", ")} — ${strategy.visualKeywords.join(", ")}`];
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/02-brand-strategy.md",
    title: "Brand Strategy",
    kind: "system",
    content: brandStrategyToMarkdown(strategy, ctx.styleDirection),
  });
  return strategy;
}

import { listScreens, screenNameFromPath } from "../sandbox";
import { mergeManifest, updateRun } from "../run-store";
import { CREDIT_PER_DOLLAR } from "../../pricing";
import type { AgentManifest, RunCostSummary } from "../types";
import type { StageContext } from "./context";

/**
 * Publish — final manifest with transparency: per-stage cost ledger, registry
 * reuse counts, repair counts, and design-gate outcome.
 */
export async function publishStage(ctx: StageContext, opts: { verifyOk: boolean; screensAdded?: string[]; repairIterations?: number }): Promise<void> {
  const state = await mergeManifest(ctx.runId, {});
  const docPaths = state.docs ?? [];

  const screens = ctx.builtScreens.length > 0
    ? [...new Set(ctx.builtScreens)]
    : listScreens(ctx.files).map(screenNameFromPath);
  const failedScreens = [...new Set(ctx.failedScreens)].filter((name) => screens.includes(name) || ctx.files[`src/screens/${name}.jsx`]);

  const totalCredits = ctx.usedCredits();
  const costs: RunCostSummary = {
    entries: ctx.ledger,
    totalCredits,
    // 1 credit = $0.01 of AI API usage (CREDIT_PER_DOLLAR in pricing.ts).
    totalDollars: Math.round((totalCredits / CREDIT_PER_DOLLAR) * 100) / 100,
  };

  const merged = await mergeManifest(ctx.runId, {
    screens,
    docs: docPaths,
    brandKit: ctx.brandKit ?? state.brandKit ?? null,
    styleSeed: ctx.seed.name,
    phases: { present: "done" } as AgentManifest["phases"],
    failedScreens,
    runKind: ctx.runKind,
    costs,
    registryStats: ctx.registryStats,
    quality: ctx.quality,
    ...(ctx.state.patternContext ? { patternRetrieval: { provider: ctx.state.patternContext.provider, count: ctx.state.patternContext.patterns.length } } : {}),
    repairLoop: { iterations: opts.repairIterations ?? 1, passed: opts.verifyOk },
    ...(opts.screensAdded ? { screensAdded: opts.screensAdded } : {}),
  });

  await updateRun(ctx.runId, {
    status: "done",
    phase: "present",
    manifest: merged as unknown as Record<string, unknown>,
  });

  ctx.emit({
    type: "done",
    result: {
      screens,
      docs: docPaths,
      brandKit: ctx.brandKit ?? state.brandKit ?? null,
      failedScreens,
    },
  });
  ctx.activity(opts.verifyOk ? "Design ready" : "Design ready — with verification warnings on some screens");
}

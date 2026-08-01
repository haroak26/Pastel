import { verifyStage } from "./verify";
import { visualQaStage } from "./visual-qa";
import type { StageContext } from "./context";

/**
 * Stage 17 — Repair loop. Runs automated QA and the visual design review in
 * a bounded loop: apply only required fixes, never redesign unaffected areas.
 * Stops when every screen verifies and the visual review passes, or when the
 * iteration ceiling (PASTEL_MAX_REPAIR_ITERS, default 2) is reached.
 */

function maxRepairIterations(): number {
  const raw = Number(process.env.PASTEL_MAX_REPAIR_ITERS);
  return Number.isFinite(raw) && raw >= 1 && raw <= 5 ? Math.floor(raw) : 2;
}

export async function repairLoopStage(ctx: StageContext, opts: { screens?: string[] } = {}): Promise<{ passed: boolean; iterations: number }> {
  const maxIterations = maxRepairIterations();

  // Round 0 — deterministic QA (compile, smoke render, contracts, anti-slop).
  await verifyStage(ctx);

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    // Stage 16 — visual design review (screenshots + multimodal review + fixes).
    const review = await visualQaStage(ctx, opts.screens);

    if (review.passes && ctx.failedScreens.length === 0) {
      ctx.activity("Quality gate passed — every screen verified and the visual review is clean");
      return { passed: true, iterations: iteration };
    }

    const budgeted = ctx.budgetAllowsModelCall();
    if (!budgeted) {
      ctx.activity("Credit budget reached — repair loop stopping");
      return { passed: ctx.failedScreens.length === 0, iterations: iteration };
    }

    // Visual fixes can break builds; re-run QA before the next review round.
    if (ctx.failedScreens.length > 0 && iteration < maxIterations) {
      ctx.activity(`Repair loop iteration ${iteration + 1}/${maxIterations} — re-verifying after corrections`);
      await verifyStage(ctx);
    }
  }

  const passed = ctx.failedScreens.length === 0;
  if (!passed) ctx.activity(`Repair loop ended with ${ctx.failedScreens.length} screen(s) still flagged`);
  return { passed, iterations: maxIterations };
}

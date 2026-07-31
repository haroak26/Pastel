import { createStageContext, type StageContext } from "./stages/context";
import { intakeStage } from "./stages/intake";
import { specStage } from "./stages/spec";
import { designSystemStage } from "./stages/design-system";
import { architectureStage } from "./stages/architecture";
import { designGateStage } from "./stages/gate";
import { implementStage } from "./stages/implement";
import { verifyStage } from "./stages/verify";
import { visualQaStage } from "./stages/visual-qa";
import { publishStage } from "./stages/publish";
import { deltaPlanStage } from "./stages/delta";
import { emptyProjectState, loadProjectState, saveProjectState } from "./state";
import { listRegistry } from "./registry";
import { selectStyleSeedByName, selectStyleSeedDeterministic, styleSeedContext } from "./style-seeds";
import { emitEvent, updateRun, mergeManifest, persistFile, getLatestCompletedFilesForProject } from "./run-store";
import * as creditService from "../credit-service";
import type { RunKind } from "./types";

/**
 * Orchestrator — runs the stage DAG. Each stage has a single responsibility,
 * consumes compact structured state, and is mapped onto the six wire phases
 * the client already understands: brief, plan, review, build, verify, present.
 */

function defaultMaxRunCredits(): number {
  const raw = Number(process.env.PASTEL_MAX_RUN_CREDITS);
  return Number.isFinite(raw) && raw > 0 ? raw : 25;
}

async function initContext(opts: {
  runKind: RunKind;
  runId: string;
  prompt: string;
  answers: Record<string, string>;
  projectId: string | null;
  userId?: string;
  holdId?: string;
  maxCredits?: number;
  forceSeed?: string;
  seedFiles?: Record<string, string>;
}): Promise<StageContext> {
  const seedName = opts.forceSeed ?? (opts.projectId ?? opts.prompt);
  const seed = selectStyleSeedByName(seedName) ?? selectStyleSeedDeterministic(seedName);
  const styleDirection = styleSeedContext(seed);

  const state = opts.projectId
    ? (await loadProjectState(opts.projectId)) ?? emptyProjectState(opts.projectId)
    : emptyProjectState("");
  if (opts.runKind === "full") {
    // A full run regenerates intake/spec/DS/architecture — but keeps nothing
    // stale: registry reuse (outside the state object) still applies.
    state.intake = null;
    state.productSpec = null;
    state.designSystem = null;
    state.architecture = null;
    state.styleSeed = seed.name;
  }

  const registry = opts.projectId ? await listRegistry(opts.projectId) : [];
  const ctx = createStageContext({
    runId: opts.runId,
    runKind: opts.runKind,
    prompt: opts.prompt,
    answers: opts.answers,
    projectId: opts.projectId,
    userId: opts.userId,
    holdId: opts.holdId,
    state,
    seed,
    styleDirection,
    files: opts.seedFiles ?? {},
    registry,
    maxCredits: opts.maxCredits ?? defaultMaxRunCredits(),
  });
  await mergeManifest(opts.runId, { styleSeed: seed.name, runKind: opts.runKind });
  return ctx;
}

async function settleCredits(ctx: StageContext): Promise<void> {
  if (!ctx.holdId || !ctx.userId) return;
  try {
    await creditService.releaseHold(ctx.holdId, ctx.usedCredits());
  } catch (err) {
    console.error("[pastel-agent] failed to release credit hold:", err);
  }
}

async function failRun(ctx: StageContext, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[pastel-agent] run failed:", message);
  await updateRun(ctx.runId, { status: "error", error: message });
  emitEvent(ctx.runId, { type: "error", message });
}

// ── Full pipeline ───────────────────────────────────────────────────────────

export async function startAgentLoop(
  runId: string,
  prompt: string,
  answers: Record<string, string>,
  projectId?: string,
  holdId?: string,
  userId?: string,
  opts?: { maxCredits?: number },
): Promise<void> {
  const ctx = await initContext({
    runKind: "full",
    runId,
    prompt,
    answers,
    projectId: projectId ?? null,
    userId,
    holdId,
    maxCredits: opts?.maxCredits,
  });

  try {
    await ctx.setPhase("brief", "running");
    await intakeStage(ctx);
    await specStage(ctx);
    await ctx.setPhase("brief", "done");

    await ctx.setPhase("plan", "running");
    await designSystemStage(ctx);
    await architectureStage(ctx);
    await ctx.setPhase("plan", "done");

    await ctx.setPhase("review", "running");
    await designGateStage(ctx);
    await ctx.setPhase("review", "done");

    await ctx.setPhase("build", "running");
    await implementStage(ctx);
    await ctx.setPhase("build", "done");

    await ctx.setPhase("verify", "running");
    await verifyStage(ctx);
    const verifyOk = ctx.failedScreens.length === 0;
    await visualQaStage(ctx);
    await ctx.setPhase("verify", verifyOk && ctx.failedScreens.length === 0 ? "done" : "error");

    await ctx.setPhase("present", "running");
    await publishStage(ctx, { verifyOk: verifyOk && ctx.failedScreens.length === 0 });
    await ctx.setPhase("present", "done");
  } catch (err) {
    await failRun(ctx, err);
  } finally {
    await settleCredits(ctx);
  }
}

// ── Delta pipeline: add screen(s) to an established project ─────────────────

export async function startScreenDeltaLoop(
  runId: string,
  projectId: string,
  additionPrompt: string,
  holdId?: string,
  userId?: string,
  opts?: { maxCredits?: number },
): Promise<void> {
  const existing = await loadProjectState(projectId);
  if (!existing || !existing.productSpec || !existing.designSystem || !existing.architecture) {
    await updateRun(runId, { status: "error", error: "This project has no established design state — run a full generation first." });
    emitEvent(runId, { type: "error", message: "This project has no established design state — run a full generation first." });
    if (holdId && userId) {
      try { await creditService.releaseHold(holdId, 0); } catch {}
    }
    return;
  }

  // Seed the virtual FS from the latest completed run so existing screens
  // keep working (and get fresh .build bundles under this runId). Seed files
  // are persisted under THIS run so the state endpoint + code view see them.
  const seedFiles = await getLatestCompletedFilesForProject(projectId, runId);
  for (const [filePath, content] of Object.entries(seedFiles)) {
    await persistFile(runId, {
      path: filePath,
      kind: filePath.startsWith("src/screens/") ? "screen" : filePath.endsWith(".css") ? "style" : "component",
      content,
    });
  }

  const ctx = await initContext({
    runKind: "delta",
    runId,
    prompt: additionPrompt,
    answers: {},
    projectId,
    userId,
    holdId,
    maxCredits: opts?.maxCredits,
    forceSeed: existing.styleSeed ?? undefined,
    seedFiles,
  });

  try {
    await ctx.setPhase("brief", "running");
    ctx.activity(`Project state loaded — ${existing.productSpec.screens.length} screens, ${existing.architecture.components.length} contracts, ${ctx.registry.length} registry components`);
    await saveProjectState(ctx.state);
    await ctx.setPhase("brief", "done");

    await ctx.setPhase("plan", "running");
    const delta = await deltaPlanStage(ctx, additionPrompt);
    await ctx.setPhase("plan", "done");

    await ctx.setPhase("review", "running");
    await designGateStage(ctx, { onlyScreens: delta.newScreenNames });
    await ctx.setPhase("review", "done");

    await ctx.setPhase("build", "running");
    await implementStage(ctx, { screens: delta.newScreenNames, components: delta.newComponentNames });
    // Re-emit reused registry sources for existing components referenced by
    // new screens (files may predate this run and must exist under it).
    await ctx.setPhase("build", "done");

    await ctx.setPhase("verify", "running");
    await verifyStage(ctx);
    const verifyOk = ctx.failedScreens.length === 0;
    await visualQaStage(ctx, delta.newScreenNames);
    await ctx.setPhase("verify", verifyOk && ctx.failedScreens.length === 0 ? "done" : "error");

    await ctx.setPhase("present", "running");
    await publishStage(ctx, { verifyOk: verifyOk && ctx.failedScreens.length === 0, screensAdded: delta.newScreenNames });
    await ctx.setPhase("present", "done");
  } catch (err) {
    await failRun(ctx, err);
  } finally {
    await settleCredits(ctx);
  }
}

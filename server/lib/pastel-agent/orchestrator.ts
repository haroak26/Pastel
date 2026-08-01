import { createStageContext, type StageContext } from "./stages/context";
import { intakeStage } from "./stages/clarify";
import { creativeBriefStage } from "./stages/creative-brief";
import { specStage } from "./stages/product-spec";
import { brandStrategyStage } from "./stages/brand-strategy";
import { brandKitStage } from "./stages/brand-kit";
import { informationArchitectureStage } from "./stages/information-architecture";
import { userFlowsStage } from "./stages/user-flows";
import { screenPlanStage } from "./stages/screen-plan";
import { layoutPlanStage } from "./stages/layout-plan";
import { componentSystemStage } from "./stages/component-system";
import { patternRetrievalStage } from "./stages/pattern-retrieval";
import { screenCompositionStage } from "./stages/screen-composition";
import { interactionsStage } from "./stages/interactions";
import { designGateStage } from "./stages/gate";
import { implementStage } from "./stages/implement";
import { repairLoopStage } from "./stages/repair-loop";
import { publishStage } from "./stages/publish";
import { deltaPlanStage } from "./stages/delta";
import { emptyProjectState, loadProjectState, saveProjectState } from "./state";
import { listRegistry } from "./registry";
import { selectPipelineSeed, styleSeedContext } from "./style-seeds";
import { emitEvent, updateRun, mergeManifest, persistFile, getLatestCompletedFilesForProject } from "./run-store";
import * as creditService from "../credit-service";
import type { RunKind } from "./types";

/**
 * Orchestrator — runs the 17-stage Pastel Agent 2 pipeline. Each stage has a
 * single responsibility, consumes compact structured state, and is mapped
 * onto the six wire phases the client already understands:
 *
 *   brief:   1 clarify → 2 creative brief → 3 product specification
 *   plan:    4 brand strategy → 5 brand kit → 6 information architecture →
 *            7 user flows → 8 screen planning → 9 layout planning →
 *            10 component system → 11 pattern retrieval → 12 screen
 *            composition → 13 interaction planning
 *   review:  composition design gate (deterministic checks + adjudication)
 *   build:   14 code generation
 *   verify:  15/16/17 repair loop (automated QA ↔ visual review ↔ repair)
 *   present: publish (manifest + done)
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
  const seed = selectPipelineSeed(opts.projectId ?? opts.prompt, opts.forceSeed);
  const styleDirection = styleSeedContext(seed);

  const state = opts.projectId
    ? (await loadProjectState(opts.projectId)) ?? emptyProjectState(opts.projectId)
    : emptyProjectState("");
  if (opts.runKind === "full") {
    // A full run regenerates every planning artifact — but registry reuse
    // (outside the state object) still applies.
    state.intake = null;
    state.creativeBrief = null;
    state.productSpec = null;
    state.brandStrategy = null;
    state.designSystem = null;
    state.informationArchitecture = null;
    state.userFlowPlan = null;
    state.screenPlan = null;
    state.layoutPlan = null;
    state.patternContext = null;
    state.interactionPlan = null;
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
    await intakeStage(ctx);                  // 1 — clarification / intake
    await creativeBriefStage(ctx);           // 2 — creative brief
    await specStage(ctx);                    // 3 — product specification
    await ctx.setPhase("brief", "done");

    await ctx.setPhase("plan", "running");
    await brandStrategyStage(ctx);           // 4 — brand strategy
    await brandKitStage(ctx);                // 5 — brand kit generation
    await informationArchitectureStage(ctx); // 6 — information architecture
    await userFlowsStage(ctx);               // 7 — user flow planning
    await screenPlanStage(ctx);              // 8 — screen planning
    await layoutPlanStage(ctx);              // 9 — layout planning
    await componentSystemStage(ctx);         // 10 — component system planning
    await patternRetrievalStage(ctx);        // 11 — design pattern retrieval
    await screenCompositionStage(ctx);       // 12 — screen composition
    await interactionsStage(ctx);            // 13 — interaction planning
    await ctx.setPhase("plan", "done");

    await ctx.setPhase("review", "running");
    await designGateStage(ctx);              // composition review gate
    await ctx.setPhase("review", "done");

    await ctx.setPhase("build", "running");
    await implementStage(ctx);               // 14 — code generation
    await ctx.setPhase("build", "done");

    await ctx.setPhase("verify", "running");
    const loop = await repairLoopStage(ctx); // 15/16/17 — QA ↔ visual review ↔ repair
    const verifyOk = loop.passed && ctx.failedScreens.length === 0;
    await ctx.setPhase("verify", verifyOk ? "done" : "error");

    await ctx.setPhase("present", "running");
    await publishStage(ctx, { verifyOk, repairIterations: loop.iterations });
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
  if (!existing || !existing.productSpec || !existing.designSystem || !existing.architecture || existing.architecture.screens.length === 0) {
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
    await ctx.setPhase("build", "done");

    await ctx.setPhase("verify", "running");
    const loop = await repairLoopStage(ctx, { screens: delta.newScreenNames });
    const verifyOk = loop.passed && ctx.failedScreens.length === 0;
    await ctx.setPhase("verify", verifyOk ? "done" : "error");

    await ctx.setPhase("present", "running");
    await publishStage(ctx, { verifyOk, screensAdded: delta.newScreenNames, repairIterations: loop.iterations });
    await ctx.setPhase("present", "done");
  } catch (err) {
    await failRun(ctx, err);
  } finally {
    await settleCredits(ctx);
  }
}

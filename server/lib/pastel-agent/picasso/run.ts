import { emitEvent, updateRun, persistFile, persistDoc, getRunState } from "../run-store";
import type { AgentManifest, PastelPhase, PhaseStatus, VisualReference } from "../types";
import { setUsageSink, type UsageRecord } from "../gateway";
import { ledgerFromUsage } from "../lib/ledger";
import * as creditService from "../../credit-service";
import type { Brief } from "./pipeline/types";
import { runPicassoPipeline } from "./pipeline/orchestrator";
import { registerPendingWireframeReview } from "./wireframe-gate";
import type { ResumeLoaders } from "./pipeline/lib/resume";
import { bundleScreenForPreview, compileStylesForRun } from "./pipeline/lib/preview";
import { clearWarmSandbox } from "./pipeline/lib/sandbox-render";
import { listCompanySlugs } from "./pipeline/knowledge";
import { detectProductContext } from "./pipeline/anti-slop";

/**
 * Picasso V6 run engine — the production entry for `/generate`, wired to the
 * run contract (run-store events, persisted docs/files, screen previews,
 * credit holds). Delegates to the orchestrator with run-store hooks.
 *
 * Pipeline: discovery → directions+tokens → wireframe → content ∥ components
 * → screens → gates → [harden: E2B visual QA] → finalize → previews
 */

export interface PicassoLoopOptions {
  maxCredits?: number;
  holdAmount?: number;
  visualReference?: VisualReference;
  /** V8 §4.3: resume a previously-killed run from its persisted artifacts. */
  resume?: boolean;
}

const NICHE_KEYWORDS: Array<[Brief["niche"], string[]]> = [
  ["fintech", ["money", "finance", "bank", "budget", "budgeting", "pay", "payment", "invest", "spend", "spending", "wallet", "accounting", "credit", "bill", "tax", "savings", "transaction"]],
  ["productivity", ["task", "project", "note", "notes", "calendar", "todo", "planner", "team", "workflow", "productivity", "sprint", "deadline"]],
  ["commerce", ["shop", "store", "ecommerce", "e-commerce", "marketplace", "checkout", "cart", "order", "sell", "selling", "inventory"]],
  ["health", ["health", "fitness", "workout", "run", "running", "sleep", "wellness", "meditation", "diet", "gym", "medical", "clinic"]],
  ["social", ["social", "community", "chat", "message", "messaging", "feed", "friend", "friends", "network", "followers", "creator"]],
  ["devtools", ["developer", "developers", "api", "sdk", "code", "deploy", "cloud", "devtool", "engineering", "infrastructure", "database"]],
  ["education", ["learn", "learning", "course", "study", "education", "school", "classroom", "tutor", "flashcard"]],
  ["travel", ["travel", "trip", "hotel", "flight", "booking", "itinerary", "adventure", "destination"]],
  ["creative", ["design", "creative", "portfolio", "gallery", "art", "media", "video", "photo", "illustration"]],
];

function detectNiche(text: string): Brief["niche"] {
  const lower = text.toLowerCase();
  let best: Brief["niche"] = "other";
  let bestScore = 0;
  for (const [niche, keywords] of NICHE_KEYWORDS) {
    const score = keywords.reduce((s, k) => s + (lower.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      best = niche;
      bestScore = score;
    }
  }
  return best;
}

function detectPlatform(text: string): Brief["platform"] {
  const lower = text.toLowerCase();
  if (/landing page|marketing|homepage|hero section|conversion/.test(lower)) return "marketing";
  if (/mobile app|mobile|iphone|android/.test(lower)) return "web+mobile";
  return "web";
}

function detectPersonality(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  if (/playful|fun|game|gamified|delight/.test(lower)) found.push("playful");
  if (/bold|energetic|vibrant|stand ?out/.test(lower)) found.push("bold");
  if (/calm|clean|minimal|simple|quiet/.test(lower)) found.push("minimal");
  if (/warm|friendly|approachable/.test(lower)) found.push("warm");
  if (/professional|technical|precise|corporate/.test(lower)) found.push("professional");
  if (found.length === 0) found.push("minimal", "bold");
  return found.slice(0, 3);
}

function productNameFromPrompt(prompt: string): string {
  const explicit = prompt.match(/(?:called|named)\s+["'`]?([A-Za-z0-9][A-Za-z0-9 _&'.-]{1,40}?)["'`]?[\s,.!?]/i)
    ?? prompt.match(/^["'`]?([A-Za-z0-9][A-Za-z0-9 _&'.-]{1,40})["'`]?[\s,:.!?]/);
  if (explicit) {
    const name = explicit[1].trim();
    if (name.length > 1 && !/^(the|a|an|my|our|build|create|make|design|app|website|product|page)$/i.test(name)) {
      return name.slice(0, 56);
    }
  }
  const firstLine = prompt.split("\n")[0]?.trim() ?? "";
  const candidate = firstLine.replace(/^["'`\s]+|["'`\s]+$/g, "");
  if (candidate.length > 0) return candidate.slice(0, 56);
  return "Untitled Product";
}

/** Deterministically build the Picasso Brief from the UI prompt + answers. */
export function buildBrief(prompt: string, answers: Record<string, string>): Brief {
  const available = new Set(listCompanySlugs());

  const refs: string[] = [];
  const inspiration = answers.inspiration ?? answers.inspirationPrimary;
  if (inspiration && available.has(inspiration)) refs.push(inspiration);
  const secondary = (answers.inspirationSecondary ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => available.has(s));
  for (const slug of secondary) {
    if (!refs.includes(slug)) refs.push(slug);
    if (refs.length >= 2) break;
  }

  const density = (answers.density as string) || "";
  const mode = (answers.mode as string) || "";

  return {
    productName: answers.productName?.trim() ? answers.productName.trim().slice(0, 56) : productNameFromPrompt(prompt),
    description: prompt.trim(),
    audience: answers.audience?.trim() || "Early adopters",
    niche: detectNiche(prompt),
    personality: answers.personality ? (answers.personality as string).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3) : detectPersonality(prompt),
    density: density === "airy" || density === "dense" ? density : "balanced",
    mode: mode === "dark" || mode === "both" ? mode : "light",
    platform: detectPlatform(prompt),
    ...(refs.length > 0 ? { companyRefs: refs } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Run-store helpers
// ═══════════════════════════════════════════════════════════════════════

function emitActivity(runId: string, message: string): void {
  emitEvent(runId, { type: "activity", message });
}

function setPhase(runId: string, phase: PastelPhase, status: PhaseStatus, message?: string): void {
  emitEvent(runId, { type: "phase", phase, status });
  if (message) emitActivity(runId, message);
}

async function persistGeneratedFile(runId: string, path: string, content: string): Promise<void> {
  const kind = path.startsWith("src/screens/") ? "screen"
    : path.startsWith("src/components/") ? "component"
    : path === "src/styles.css" || path === "src/globals.css" ? "style"
    : "build";
  try {
    await persistFile(runId, { path, kind, content });
    emitEvent(runId, { type: "file", file: { path, kind, content } });
  } catch (err) {
    console.warn(`[picasso] failed to persist file ${path}:`, err instanceof Error ? err.message : err);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// V8 §4.3: kill-handler state — the currently active run writes a partial
// summary (status "killed", furthest stage, calls, cost) and releases its
// credit hold instead of losing that data entirely.
// ═══════════════════════════════════════════════════════════════════════

interface ActiveRunRef {
  runId: string;
  usage: UsageRecord[];
  holdId?: string;
  userId?: string;
  statusRef: { status: "running" | "done" | "done_needs_review" | "error" };
}

let activeRunRef: ActiveRunRef | null = null;

function installKillHandler(): () => void {
  const handler = (signal: string) => {
    const ref = activeRunRef;
    console.warn(`[picasso] received ${signal} — writing partial run summary and releasing holds`);
    if (!ref) {
      process.exit(1);
      return;
    }
    try {
      const ledger = ledgerFromUsage(ref.usage);
      updateRun(ref.runId, {
        status: "error",
        phase: "interrupted",
        error: `Run interrupted by ${signal} — partial artifacts preserved; resume with the same runId.`,
      }).catch(() => {});
      emitEvent(ref.runId, { type: "error", message: `Run interrupted by ${signal} — partial artifacts preserved.` });
      if (ref.holdId && ref.userId) {
        creditService.releaseHold(ref.holdId, 0).catch(() => {});
      }
      console.log(`[picasso] run ${ref.runId}: killed at ${(ledger.totalDollars).toFixed(4)} spent across ${ledger.entries.length} call(s) — nothing charged to the hold`);
    } catch (err) {
      console.error("[picasso] kill handler error:", err);
    } finally {
      setUsageSink(null);
      clearWarmSandbox();
      process.exit(1);
    }
  };
  process.on("SIGTERM", handler);
  process.on("SIGINT", handler);
  return () => {
    process.off("SIGTERM", handler);
    process.off("SIGINT", handler);
  };
}

/** DB-backed resume loaders — read a run's persisted docs/files. */
function resumeLoadersFor(runId: string): ResumeLoaders {
  return {
    async loadDoc(path) {
      const state = await getRunState(runId).catch(() => null);
      const doc = state?.docs.find((d) => d.path === path);
      return doc?.content ?? null;
    },
    async loadFile(path) {
      const state = await getRunState(runId).catch(() => null);
      const file = state?.files.find((f) => f.path === path);
      return file?.content ?? null;
    },
  };
}

export async function startPicassoAgentLoop(
  runId: string,
  prompt: string,
  answers: Record<string, string>,
  projectId?: string,
  holdId?: string,
  userId?: string,
  opts?: PicassoLoopOptions,
): Promise<void> {
  const usage: UsageRecord[] = [];
  setUsageSink((rec) => usage.push(rec));

  const statusRef: { status: "running" | "done" | "done_needs_review" | "error" } = { status: "running" };
  activeRunRef = { runId, usage, holdId, userId, statusRef };
  const uninstallKillHandler = installKillHandler();

  try {
    const brief = buildBrief(prompt, answers);
    const projectKey = `${projectId ?? "run"}-${runId.slice(0, 8)}`;
    const isDraft = !!(opts && opts.maxCredits !== undefined && opts.maxCredits < 40);

    await updateRun(runId, { title: brief.productName });
    emitEvent(runId, { type: "title", title: brief.productName });

    const output = await runPicassoPipeline(brief, {
      projectId: projectKey,
      mode: isDraft ? "draft" : "harden",
      // V8 §4.3: resume the same runId from its persisted stage artifacts.
      ...(opts?.resume ? { resume: resumeLoadersFor(runId) } : {}),
      // V8 §4.4: the hard wireframe confirmation gate — the run blocks here
      // until the client posts approve/revise/cancel (or the timeout fires).
      confirmWireframes: (payload) => {
        emitEvent(runId, { type: "wireframes", wireframes: payload });
        return registerPendingWireframeReview(runId, payload);
      },
      onCheckpoint: (stats) => {
        if (stats.stageReached) updateRun(runId, { phase: stats.stageReached }).catch(() => {});
      },
      hooks: {
        emit: (type, payload) => {
          if (type === "phase") {
            const phase = payload.phase as PastelPhase;
            const status = payload.status as PhaseStatus;
            setPhase(runId, phase, status);
          } else if (type === "activity") {
            emitActivity(runId, String(payload.message ?? ""));
          } else if (type === "screens") {
            const screens = payload.screens as string[];
            emitEvent(runId, { type: "screens", screens });
          }
        },
        persistDoc: (p, title, kind, content) => persistDoc(runId, { path: p, title, kind, content }).catch(() => {}),
        persistFile: (p, kind, content) => persistGeneratedFile(runId, p, content),
      },
    });

    // ══ V8 §4.4: cancelled at the wireframe gate — refund the hold, mark the
    // run, and stop. No further spend and no screens to preview. ══
    if (output.cancelled) {
      statusRef.status = "error";
      emitActivity(runId, "Run cancelled during wireframe review — the credit hold was released, nothing was charged.");
      await updateRun(runId, { status: "error", error: "Cancelled by user during wireframe review" });
      emitEvent(runId, { type: "error", message: "Run cancelled — wireframe review declined." });
      await settleCredits(runId, "error", usage, holdId, userId, opts?.holdAmount);
      return;
    }

    // ══ PREVIEW BUNDLES (compiled CSS + per-screen JS) ══
    try {
      const compiled = await compileStylesForRun({
        globalsCSS: output.globalsCSS,
        components: output.generatedComponents,
        screens: output.screenFiles,
        support: output.supportFiles,
      });
      if (compiled) {
        await persistGeneratedFile(runId, "src/styles.css", compiled);
      }
      for (const [id, code] of Object.entries(output.screenFiles)) {
        const bundle = await bundleScreenForPreview(id, code, output.generatedComponents, output.supportFiles);
        if (bundle) {
          await persistFile(runId, { path: `.build/${id}.js`, kind: "build", content: bundle });
        }
      }
    } catch (err) {
      emitActivity(runId, `Preview bundling failed (${err instanceof Error ? err.message : String(err)})`);
    }

    // ══ DONE ══
    statusRef.status = output.passedAll && output.smokeFailures.length === 0 ? "done" : "done_needs_review";
    const ledger = ledgerFromUsage(usage);
    emitActivity(runId, `Run cost: $${ledger.totalDollars.toFixed(4)} (${ledger.totalCredits.toFixed(2)} credits) across ${ledger.entries.length} model call(s)`);
    if (statusRef.status === "done_needs_review") {
      emitActivity(runId, "Run shipped but needs review (QA did not fully pass).");
    }

    const screenIds = Object.keys(output.screenFiles);
    const manifestOut: AgentManifest & Record<string, unknown> = {
      screens: screenIds,
      docs: [
        "docs/brief/Brief.json",
        "docs/planning/Discovery.json",
        "docs/design/CreativeDirections.json",
        "docs/design/DesignTokens.json",
        "docs/design/MotionSpec.json",
        "docs/planning/WireframePlan.json",
        "docs/planning/ComponentManifest.json",
        "docs/planning/PropContract.json",
        "docs/design/BrandKit.json",
        "docs/planning/ContentData.json",
        "docs/planning/CopyPlan.json",
        "docs/review/SmokeTestResults.json",
        "docs/review/AntiSlopGate.json",
        "docs/review/ThemeGate.json",
        "docs/review/GlobalsAudit.json",
        "docs/review/CompositionGate.json",
        "docs/review/GeometryGate.json",
        "docs/review/ComponentFidelity.json",
        "docs/review/Timing.json",
        "docs/review/CritiqueResults.json",
        "docs/review/FinalReport.md",
      ],
      brandKit: {
        colors: {
          ...output.tokens.color.neutral,
          ...output.tokens.color.accent,
          ...output.tokens.color.surface,
          ...output.tokens.color.text,
          ...output.tokens.color.border,
        } as Record<string, string>,
        fonts: {
          display: output.tokens.typography.fontFamily.display,
          body: output.tokens.typography.fontFamily.body,
          mono: output.tokens.typography.fontFamily.mono,
        },
        sizes: {
          sectionPaddingY: output.tokens.space["16"] ?? output.tokens.space["8"] ?? "32px",
          sectionGap: output.tokens.space["6"] ?? output.tokens.space["4"] ?? "16px",
        },
        radius: { ...output.tokens.radius },
      },
      styleSeed: output.tokens.meta.seed,
      phases: {
        discovery: "done",
        design: "done",
        brief: "done",
        data: "done",
        wireframe: "done",
        "wireframe-review": "done",
        review: output.passedAll ? "done" : "error",
        build: "done",
        assemble: "done",
        present: "done",
      },
      failedScreens: output.smokeFailures,
      costs: ledger,
      quality: {
        passed: output.passedAll,
        score: output.averageScore,
        repairs: 0,
      },
      company: output.discovery.selectedReferences.map((r) => r.name),
      report: output.finalReport ? {
        componentCount: output.finalReport.componentCount,
        screenCount: output.finalReport.screenCount,
        designTokenCount: output.finalReport.designTokenCount,
        qualityGates: output.finalReport.qualityGates,
      } : null,
    };

    await updateRun(runId, {
      status: statusRef.status,
      title: brief.productName,
      manifest: manifestOut,
    });

    emitEvent(runId, {
      type: "done",
      result: {
        screens: screenIds,
        docs: [],
        brandKit: manifestOut.brandKit,
        failedScreens: output.smokeFailures,
      },
    });
    await settleCredits(runId, statusRef.status, usage, holdId, userId, opts?.holdAmount);
  } catch (err) {
    statusRef.status = "error";
    const message = err instanceof Error ? err.message : String(err);
    console.error("[picasso] run failed:", message);
    await updateRun(runId, { status: "error", error: message });
    emitEvent(runId, { type: "error", message });
    await settleCredits(runId, "error", usage, holdId, userId, opts?.holdAmount);
  } finally {
    setUsageSink(null);
    clearWarmSandbox();
    activeRunRef = null;
    uninstallKillHandler();
  }
}

/** Persist a JSON planning doc to the run store. */
async function settleCredits(
  runId: string,
  status: "running" | "done" | "done_needs_review" | "error",
  usage: UsageRecord[],
  holdId?: string,
  userId?: string,
  holdAmount?: number,
): Promise<void> {
  if (!holdId || !userId) return;
  try {
    if (status !== "done" && status !== "done_needs_review") {
      await creditService.releaseHold(holdId, 0);
      return;
    }
    const ledger = ledgerFromUsage(usage);
    const charge = holdAmount !== undefined ? Math.min(ledger.totalCredits, holdAmount) : ledger.totalCredits;
    await creditService.releaseHold(holdId, Math.round(charge * 100) / 100);
    console.log(`[picasso] run ${runId}: charged ${charge.toFixed(2)} credits ($${ledger.totalDollars} USD)`);
  } catch (err) {
    console.error("[picasso] failed to release credit hold:", err);
  }
}

export { detectProductContext };

/**
 * Picasso V6 — Generic E2E Acceptance Harness
 *
 * This harness is NOT product-specific: the brief comes from the environment
 * (or CLI arg), never hardcoded. Its primary role is proving the PIPELINE
 * works end-to-end: runs complete without errors, every composed screen
 * RENDERS in the E2B sandbox, gates pass, and (with a matrix) runs stay
 * structurally distinct.
 *
 * Inputs (all optional, no hardcoded briefs/keys anywhere):
 *   PASTEL_E2E_BRIEF   — JSON: { productName, description, audience?, niche?,
 *                        personality?, density?, mode?, platform?, companyRefs? }
 *   PASTEL_E2E_MATRIX  — JSON array of briefs → runs all + DISTINCTNESS GATE
 *   PASTEL_E2E_MODE    — "harden" (default, visual QA) | "draft" (fast)
 *   PASTEL_E2E_MAX_SCREENS — cap on composed screens (default 3; the harness
 *                        also writes picassotests/test6/ISSUES.md afterwards)
 *   PASTEL_E2E_OUT     — output dir (default: picassotests/test6/output)
 *   First CLI arg      — free-text prompt (converted via buildBrief)
 *
 * Required env: MERGE_GATEWAY_API_KEY, E2B_API_KEY (fail fast, never defaulted).
 *
 *   MERGE_GATEWAY_API_KEY=... E2B_API_KEY=... npx tsx picassotests/test6/e2e-run.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setUsageSink, type UsageRecord } from "../../server/lib/pastel-agent/gateway";
import { ledgerFromUsage } from "../../server/lib/pastel-agent/lib/ledger";
import { runPicassoPipeline, type PicassoPipelineOutput } from "../../server/lib/pastel-agent/picasso/pipeline/orchestrator";
import { buildBrief } from "../../server/lib/pastel-agent/picasso/run";
import { renderScreen, getWarmSandbox, clearWarmSandbox } from "../../server/lib/pastel-agent/picasso/pipeline/lib/sandbox-render";
import { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "../../server/lib/pastel-agent/picasso/pipeline/lib/preview";
import type { Brief } from "../../server/lib/pastel-agent/picasso/pipeline/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Environment guard ────────────────────────────────────────────────────

if (!process.env.MERGE_GATEWAY_API_KEY) {
  console.error("FATAL: MERGE_GATEWAY_API_KEY not set — the pipeline needs the model gateway.");
  process.exit(1);
}
if (!process.env.E2B_API_KEY) {
  console.error("FATAL: E2B_API_KEY not set — sandbox rendering is the harness's primary assertion.");
  process.exit(1);
}

const OUT_DIR = path.resolve(__dirname, "output");
const MODE: "harden" | "draft" = (process.env.PASTEL_E2E_MODE as "harden" | "draft") ?? "harden";
const MAX_SCREENS = Number(process.env.PASTEL_E2E_MAX_SCREENS ?? 3);

interface E2EBriefInput {
  productName: string;
  description: string;
  audience?: string;
  niche?: Brief["niche"];
  personality?: string[];
  density?: Brief["density"];
  mode?: Brief["mode"];
  platform?: Brief["platform"];
  companyRefs?: string[];
}

function briefFromInput(input: E2EBriefInput): Brief {
  return {
    productName: input.productName,
    description: input.description,
    audience: input.audience ?? "Early adopters",
    niche: input.niche ?? "other",
    personality: input.personality ?? ["minimal", "bold"],
    density: input.density ?? "balanced",
    mode: input.mode ?? "light",
    platform: input.platform ?? "web",
    ...(input.companyRefs && input.companyRefs.length ? { companyRefs: input.companyRefs } : {}),
  };
}

// ── Usage tracking ───────────────────────────────────────────────────────

const usageRecords: UsageRecord[] = [];
setUsageSink((rec) => usageRecords.push(rec));

// ── Run driver ───────────────────────────────────────────────────────────

interface RunOutcome {
  runId: string;
  brief: Brief;
  mode: string;
  wallMs: number;
  modelCalls: number;
  totalCredits: number;
  totalDollars: number;
  output: PicassoPipelineOutput;
  screensRendered: string[];
  renderErrors: string[];
  layoutSignature: Record<string, unknown>;
}

async function runOnce(brief: Brief, index: number): Promise<RunOutcome> {
  const runId = `e2e-${index}-${Date.now()}`;
  const runDir = path.join(OUT_DIR, runId);
  fs.mkdirSync(path.join(runDir, "docs"), { recursive: true });
  fs.mkdirSync(path.join(runDir, "screenshots"), { recursive: true });

  const started = Date.now();
  const screensRendered: string[] = [];
  const renderErrors: string[] = [];

  const output = await runPicassoPipeline(brief, {
    projectId: runId,
    mode: MODE,
    maxScreens: MAX_SCREENS,
    hooks: {
      emit: () => {},
      persistDoc: (p, _t, _k, content) => {
        const file = path.join(runDir, p);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
      },
      persistFile: (p, _k, content) => {
        const file = path.join(runDir, p);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
      },
    },
  });

  // ── PRIMARY ASSERTION: every composed screen renders in E2B ─────────────
  const compiled = await compileStylesForRun({
    globalsCSS: output.globalsCSS,
    components: output.generatedComponents,
    screens: output.screenFiles,
    support: output.supportFiles,
  });
  if (compiled) {
    const warm = await getWarmSandbox();
    const fonts = [
      output.tokens.typography.fontFamily.display,
      output.tokens.typography.fontFamily.body,
      output.tokens.typography.fontFamily.mono,
    ];
    for (const [id, code] of Object.entries(output.screenFiles)) {
      const bundle = await bundleScreenForPreview(id, code, output.generatedComponents, output.supportFiles);
      if (!bundle) {
        renderErrors.push(`${id}: bundle failed`);
        continue;
      }
      const html = buildPreviewHtml(id, bundle, compiled, fonts);
      const result = await renderScreen({ html, screenName: id, warmSandbox: warm });
      if (result.screenshot) {
        fs.writeFileSync(path.join(runDir, "screenshots", `${id}.png`), result.screenshot);
        screensRendered.push(id);
      } else {
        renderErrors.push(`${id}: ${result.errors.join("; ")}`);
      }
    }
  } else {
    renderErrors.push("styles: tailwind compilation failed");
  }

  const ledger = ledgerFromUsage(usageRecords.splice(0));
  const wallMs = Date.now() - started;

  const layoutSignature = {
    mode: brief.mode,
    screens: output.layoutPlan.screens.map((s) => ({
      id: s.id,
      regions: s.regions.map((r) => `${r.role}:${r.hierarchy}:${r.componentTypes.map((c) => c.name).join("+")}`),
      dominant: s.dominantMoment,
    })),
    accent: output.tokens.color.accent["500"],
    radius: output.tokens.radius.lg,
    seed: output.tokens.meta.seed,
  };

  fs.writeFileSync(path.join(runDir, "run-summary.json"), JSON.stringify({
    runId,
    status: output.success ? "done" : "needs_review",
    wallSeconds: wallMs / 1000,
    modelCalls: ledger.entries.length,
    totalCredits: ledger.totalCredits,
    totalDollars: ledger.totalDollars,
    screens: Object.keys(output.screenFiles),
    screensRendered,
    renderErrors,
    smokeFailures: output.smokeFailures,
    antiSlopPassed: output.antiSlopPassed,
    averageScore: output.averageScore,
    passedAll: output.passedAll,
    layoutSignature,
  }, null, 2));

  console.log(`[${runId}] ${brief.productName} — ${(wallMs / 1000).toFixed(1)}s · ${ledger.entries.length} calls · $${ledger.totalDollars.toFixed(4)} · screens=${Object.keys(output.screenFiles).length} rendered=${screensRendered.length} · QA=${output.averageScore}/10`);

  return {
    runId,
    brief,
    mode: MODE,
    wallMs,
    modelCalls: ledger.entries.length,
    totalCredits: ledger.totalCredits,
    totalDollars: ledger.totalDollars,
    output,
    screensRendered,
    renderErrors,
    layoutSignature,
  };
}

// ── Distinctness gate ────────────────────────────────────────────────────

function similarity(a: string[], b: string[]): number {
  const inter = a.filter((x) => b.includes(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function distinctnessCheck(runs: RunOutcome[], threshold = 0.7): { ok: boolean; pairs: Array<{ a: string; b: string; sim: number }> } {
  const sigs = runs.map((r) => ({
    dir: r.runId,
    regions: r.layoutSignature.screens as Array<{ regions: string[] }>,
    accent: r.layoutSignature.accent as string,
  }));
  const pairs: Array<{ a: string; b: string; sim: number }> = [];
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      const aRegions = sigs[i].regions.flatMap((s) => s.regions);
      const bRegions = sigs[j].regions.flatMap((s) => s.regions);
      let sim = similarity(aRegions, bRegions);
      if (sigs[i].accent === sigs[j].accent) sim = Math.min(1, sim + 0.15);
      if (sim >= threshold) pairs.push({ a: sigs[i].dir, b: sigs[j].dir, sim: Math.round(sim * 100) / 100 });
    }
  }
  return { ok: pairs.length === 0, pairs };
}

// ── Assertions ───────────────────────────────────────────────────────────

function runAssertions(run: RunOutcome): Array<[boolean, string]> {
  const checks: Array<[boolean, string]> = [
    [run.output.screenFiles && Object.keys(run.output.screenFiles).length >= 1, `at least 1 screen composed (got ${Object.keys(run.output.screenFiles ?? {}).length})`],
    [run.output.smokeFailures.length === 0, `no smoke failures (got ${run.output.smokeFailures.length})`],
    [run.output.antiSlopPassed, "anti-slop gate passed"],
    [run.screensRendered.length >= 1, `screens rendered in E2B (${run.screensRendered.length} of ${Object.keys(run.output.screenFiles ?? {}).length})`],
    [run.renderErrors.length === 0, `no render errors (${run.renderErrors.join("; ") || "none"})`],
    [run.output.passedAll || MODE === "draft", MODE === "draft" ? "draft mode (QA skipped)" : `visual QA passed (${run.output.averageScore}/10)`],
    [run.wallMs < 420_000, `wall time budget (${(run.wallMs / 1000).toFixed(1)}s < 420s)`],
    [run.totalCredits < 80, `credit budget (${run.totalCredits.toFixed(2)} < 80)`],
  ];
  return checks;
}

// ── Main ─────────────────────────────────────────────────────────────────

function mdEscape(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function writeIssuesMd(runs: RunOutcome[], failed: boolean, abortError?: string): void {
  const issuesPath = path.resolve(__dirname, "ISSUES.md");
  const lines: string[] = [];
  lines.push(`# Picasso V6 E2E — Issues Report`);
  lines.push("");
  lines.push(`**Date:** ${new Date().toISOString()} · **Mode:** ${MODE} · **Max screens:** ${MAX_SCREENS} · **Overall:** ${failed ? "FAILURES PRESENT" : "ALL ASSERTIONS PASSED"}`);
  lines.push("");
  lines.push(`Outputs: \`output/<runId>/\` (docs, screenshots, run-summary.json) · Screenshots are desktop viewport 1440×900.`);
  lines.push("");

  if (runs.length === 0) {
    lines.push("## Run never completed");
    lines.push("");
    lines.push("The harness aborted before any run produced output — no screens were generated, so there are no screenshots to present.");
    if (abortError) {
      lines.push("");
      lines.push("### Abort error");
      lines.push("");
      lines.push("```");
      lines.push(abortError.slice(0, 3000));
      lines.push("```");
    }
    lines.push("");
  }

  for (const run of runs) {
    lines.push(`## ${run.runId} — ${mdEscape(run.brief.productName)}`);
    lines.push("");
    lines.push(`- **Status:** ${run.output.success ? "done" : "needs_review"} · ${(run.wallMs / 1000).toFixed(1)}s · ${run.modelCalls} model calls · $${run.totalDollars.toFixed(4)} (${run.totalCredits.toFixed(2)} credits)`);
    lines.push(`- **Screens composed:** ${Object.keys(run.output.screenFiles).length} (${Object.keys(run.output.screenFiles).join(", ") || "none"})`);
    lines.push(`- **Screens rendered (E2B):** ${run.screensRendered.length} — ${run.screensRendered.join(", ") || "none"}`);
    lines.push(`- **Anti-slop gate:** ${run.output.antiSlopPassed ? "PASSED" : "FAILED"} · **Visual QA:** ${run.output.averageScore.toFixed(1)}/10 avg · **passedAll:** ${run.output.passedAll}`);
    lines.push("");

    const issues: string[] = [];
    if (run.renderErrors.length) {
      issues.push("### Render errors (E2B sandbox)");
      for (const e of run.renderErrors) issues.push(`- ${mdEscape(e)}`);
    }
    if (run.output.smokeFailures.length) {
      issues.push("### Smoke failures");
      for (const s of run.output.smokeFailures) issues.push(`- ${mdEscape(s)}`);
    }
    if (run.output.critiqueResults.length) {
      const failing = run.output.critiqueResults.filter((r) => !r.passed);
      if (failing.length) {
        issues.push("### Visual QA defects (blocking)");
        for (const r of failing) {
          issues.push(`- **${r.affectedIds[0] ?? "?"}** — ${r.average}/10 — ${mdEscape(r.diagnosis)} (failing: ${r.failingDimensions.join(", ") || "none"})`);
        }
      }
    }

    const checks = runAssertions(run);
    const failedChecks = checks.filter(([ok]) => !ok);
    if (failedChecks.length) {
      issues.push("### Assertion failures");
      for (const [, label] of failedChecks) issues.push(`- ${mdEscape(label)}`);
    }

    if (issues.length === 0) {
      lines.push("**No issues found** — all assertions passed, all composed screens rendered, QA gate passed.");
    } else {
      lines.push("## Issues");
      lines.push(...issues);
    }
    lines.push("");
  }

  fs.writeFileSync(issuesPath, lines.join("\n"));
  console.log(`Issues report written: ${issuesPath}`);
}

async function main() {
  console.log("═".repeat(64));
  console.log(`Picasso V6 E2E — ${MODE.toUpperCase()} mode · ${new Date().toISOString()}`);
  console.log("═".repeat(64));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const matrixRaw = process.env.PASTEL_E2E_MATRIX;
  const briefRaw = process.env.PASTEL_E2E_BRIEF;
  const cliPrompt = process.argv[2];

  let briefs: Brief[] = [];
  if (matrixRaw) {
    const parsed = JSON.parse(matrixRaw) as E2EBriefInput[];
    briefs = parsed.map(briefFromInput);
    console.log(`Matrix: ${briefs.length} brief(s)`);
  } else if (briefRaw) {
    briefs = [briefFromInput(JSON.parse(briefRaw))];
  } else if (cliPrompt) {
    briefs = [buildBrief(cliPrompt, {})];
  } else {
    console.error("No brief provided. Set PASTEL_E2E_BRIEF, PASTEL_E2E_MATRIX, or pass a prompt as argv[2].");
    process.exit(1);
  }

  const runs: RunOutcome[] = [];
  let exit = 0;
  let abortError: string | undefined;

  for (let i = 0; i < briefs.length; i++) {
    const b = briefs[i];
    console.log(`\n── Run ${i + 1}/${briefs.length}: ${b.productName}`);
    try {
      runs.push(await runOnce(b, i + 1));
    } catch (err) {
      abortError = err instanceof Error ? `${err.stack ?? err.message}\n\n${err.message}` : String(err);
      console.error(`  RUN FAILED: ${err instanceof Error ? err.stack : err}`);
      exit = 1;
      console.error("  ABORT: stopping after failed run — not starting another brief.");
      break;
    }
  }

  console.log("\n" + "═".repeat(64) + "\nASSERTIONS\n" + "═".repeat(64));
  for (const run of runs) {
    console.log(`\n── ${run.runId} (${run.brief.productName})`);
    const checks = runAssertions(run);
    for (const [ok, label] of checks) {
      console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
    }
    if (checks.some(([ok]) => !ok)) exit = 1;
  }

  if (runs.length > 1) {
    const dist = distinctnessCheck(runs);
    console.log("\n── DISTINCTNESS GATE");
    for (const p of dist.pairs) console.log(`  FAIL  ${p.a} ≈ ${p.b} (similarity ${p.sim})`);
    if (!dist.ok) exit = 1;
    else console.log(`  PASS  ${runs.length} runs structurally distinct`);
  }

  clearWarmSandbox();
  setUsageSink(null);
  writeIssuesMd(runs, exit !== 0, abortError);
  console.log(exit === 0 ? "\nALL ASSERTIONS PASSED" : "\nFAILURES PRESENT");
  process.exit(exit);
}

main().catch((err) => {
  console.error("e2e crashed:", err instanceof Error ? err.stack : err);
  clearWarmSandbox();
  process.exit(1);
});

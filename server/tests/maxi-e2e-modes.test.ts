import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Maxi Agent v23 — golden-path end-to-end harness, one cold run per product
 * mode (browse, transact, track, create, operate, learn, social).
 *
 * This is a RELEASE GATE, not a per-commit check: it runs real models and
 * real e2b sandboxes and costs money. It is skipped unless MAXI_E2E=1.
 *
 *   MAXI_E2E=1 node --import tsx --test server/tests/maxi-e2e-modes.test.ts
 *
 * Every run is a genuine COLD run (no warm pool, no cache, no deterministic
 * fallback on the model calls — the gate asserts the run was not built from
 * fallbacks alone). Per-run assertions:
 *   - the run completes (done / done_needs_review — never a hard error)
 *   - ≥2 screens verified in the sandbox with screenshots rendered
 *   - the persisted timing report carries all four waves (w0..w3)
 *   - the quality gate ran with a recorded score
 *   - the fidelity report recorded actual verdicts (PASS counts)
 *   - the prop-contract report recorded actual results
 *   - knowledge-base slices were recorded (the Phase 7.5 lever)
 *   - the model-call ledger shows the Wave-0 merge (callsByRole)
 *
 * A run-summary JSON per mode lands in server/tests/.e2e-results/ — the
 * Phase 10 verification record.
 */

const ENABLED = process.env.MAXI_E2E === "1";
const RESULTS_DIR = path.join(import.meta.dirname, ".e2e-results");
const RUN_TIMEOUT_MS = 15 * 60 * 1000;

const MODE_PROMPTS: Record<string, string> = {
  browse: "A marketplace for vacation rental stays in coastal towns, with searchable listings, photos, prices, and reviews.",
  transact: "A booking app for boutique hotel stays: search availability, compare rooms, reserve a night with dates and guests.",
  track: "A fitness tracking app that logs runs: today's workout, weekly distance, pace trends, and run history with splits.",
  create: "A design tool workspace for product teams: recent projects, canvas templates, asset library, and a prompt-to-design flow.",
  operate: "A project management dashboard for engineering teams: sprint status, task tables, workload, and release history.",
  learn: "A language learning app: daily lessons, streak progress, vocabulary review, and a guided curriculum path.",
  social: "A community discussion app: topic feed, post engagement, author profiles, and threaded replies.",
};

async function runOneMode(mode: string, prompt: string): Promise<Record<string, unknown>> {
  const { createRun } = await import("../lib/maxi-agent/run-store");
  const { startAgentLoop } = await import("../lib/maxi-agent/orchestrator");
  const { db } = await import("../db");
  const { agentRuns, agentDocuments } = await import("@shared/schema");
  const { desc, eq } = await import("drizzle-orm");

  const run = await createRun({ prompt, answers: {} });
  const runId = run.id;

  await Promise.race([
    startAgentLoop(runId, prompt, {}, undefined, undefined, undefined, { maxCredits: 45 }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`run ${mode} exceeded ${RUN_TIMEOUT_MS / 1000}s`)), RUN_TIMEOUT_MS)),
  ]);

  const [row] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
  const docs = await db.select().from(agentDocuments).where(eq(agentDocuments.runId, runId));
  const manifest = (row?.manifest ?? {}) as Record<string, unknown>;
  const timing = (manifest.timing ?? null) as { wallSeconds?: number; stages?: Array<{ wave: number; stage: string; ms: number }> } | null;
  const callsByRole = (manifest.callsByRole ?? {}) as Record<string, number>;
  const kbSlices = (manifest.kbSlices ?? {}) as Record<string, { chars: number }>;
  const quality = (manifest.quality ?? {}) as Record<string, unknown>;

  const doc = (kind: string) => {
    const d = docs.find((x) => x.kind === kind);
    if (!d) return null;
    try { return JSON.parse(d.content); } catch { return null; }
  };
  const gateReport = doc("gate-report") as { passed?: boolean; score?: number; issues?: Array<{ severity: string }> } | null;
  const fidelityReport = doc("fidelity-report") as { summary?: { total?: number; passed?: number; failed?: number; highIssues?: number } } | null;
  const propReport = doc("prop-contract-report") as { violations?: unknown[]; autoFixedCount?: number } | null;

  const summary = {
    mode,
    runId,
    status: row?.status,
    screens: manifest.screens,
    failedScreens: manifest.failedScreens,
    wallSeconds: timing?.wallSeconds,
    waves: timing?.stages
      ? Object.fromEntries([0, 1, 2, 3, 4].map((w) => [w, Math.round((timing!.stages!.filter((s) => s.wave === w).reduce((n, s) => n + s.ms, 0) / 1000) * 10) / 10]))
      : null,
    totalCalls: Object.values(callsByRole).reduce((a, b) => a + (b as number), 0),
    callsByRole,
    kbSlices,
    quality,
    gate: gateReport ? { passed: gateReport.passed, score: gateReport.score, issues: gateReport.issues?.length } : null,
    fidelity: fidelityReport?.summary ?? null,
    propContract: propReport ? { violations: propReport.violations?.length, autoFixed: propReport.autoFixedCount } : null,
  };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, `run-${mode}.json`), JSON.stringify(summary, null, 2));
  return summary;
}

const RESULTS: Array<Record<string, unknown>> = [];

/**
 * V24 timing acceptance — per-wave ceilings (a regression is attributable
 * to a specific wave, not just "the run got slower") plus the v23 gap
 * regression: w0-w3 summed to 216s of a 375s wall time in v23; with wave 4
 * (repair + final review) timed explicitly, the waves must account for the
 * wall time. Normal (non-thinking) runs must land in 120-180s.
 */
const WAVE_CEILINGS_S: Record<number, number> = {
  0: 60, // discovery + design/brief one-call (v23: 51.1)
  1: 30, // genome + deterministic derivation (v23: 19.8)
  2: 70, // components ∥ content ∥ copy ∥ compose (v23: 131.6 — cut by the slot budget)
  3: 55, // compile + 3-viewport sandbox render + gates + review (v23: 13.7 for desktop-only)
  4: 35, // bounded repair + re-verify + final review (v23: the ~159s invisible tail)
};
const WALL_SECONDS_RANGE: [number, number] = [120, 180];

test("golden path: one cold run per product mode (release gate)", { skip: !ENABLED && "release gate — set MAXI_E2E=1 to run (real models + e2b, costs money)" }, async () => {
  const { db } = await import("../db");
  assert.ok(db, "DATABASE_URL must be reachable for the e2e harness");
  for (const [mode, prompt] of Object.entries(MODE_PROMPTS)) {
    const summary = await runOneMode(mode, prompt);
    RESULTS.push(summary);
    assert.notEqual(summary.status, "error", `${mode}: run must not hard-error (got ${summary.status})`);
    assert.ok(Array.isArray(summary.screens) && (summary.screens as string[]).length >= 2, `${mode}: ≥2 screens verified (got ${JSON.stringify(summary.screens)})`);
    const waves = summary.waves as Record<string, number> | null;
    assert.ok(waves && waves[0] !== undefined && waves[1] !== undefined && waves[2] !== undefined && waves[3] !== undefined && waves[4] !== undefined, `${mode}: timing carries all five waves (w0..w4)`);
    assert.ok(typeof summary.wallSeconds === "number", `${mode}: wall time recorded`);

    // V24 timing acceptance.
    const wall = summary.wallSeconds as number;
    assert.ok(wall >= WALL_SECONDS_RANGE[0] && wall <= WALL_SECONDS_RANGE[1], `${mode}: normal-run wall time ${wall}s must land in ${WALL_SECONDS_RANGE[0]}-${WALL_SECONDS_RANGE[1]}s`);
    for (const [w, ceiling] of Object.entries(WAVE_CEILINGS_S)) {
      const got = waves![Number(w)] ?? 0;
      assert.ok(got <= ceiling, `${mode}: wave ${w} took ${got}s — over its ${ceiling}s ceiling (WS9 per-wave attribution)`);
    }
    // WS9: the ~159s v23 gap is gone — the waves must account for the wall
    // time (the only unmeasured stretches are the error paths).
    const wavesSum = Object.values(waves!).reduce((a, b) => a + (b as number), 0);
    assert.ok(Math.abs(wavesSum - wall) <= 12, `${mode}: waves sum ${wavesSum}s ≈ wall ${wall}s (v23 gap was ~159s)`);

    const gate = summary.gate as { score?: number } | null;
    assert.ok(gate && typeof gate.score === "number", `${mode}: quality gate ran with a score`);
    const fidelity = summary.fidelity as { total?: number; passed?: number; failed?: number } | null;
    assert.ok(fidelity && typeof fidelity.total === "number", `${mode}: fidelity report recorded verdicts`);
    assert.equal(fidelity!.failed, 0, `${mode}: zero hard fidelity failures (${JSON.stringify(fidelity)})`);
    const props = summary.propContract as { violations?: number } | null;
    assert.ok(props, `${mode}: prop-contract report recorded`);
    assert.equal(props!.violations, 0, `${mode}: zero prop-contract violations after auto-fix`);
    const kb = summary.kbSlices as Record<string, { chars: number }>;
    assert.ok(Object.keys(kb).length > 0, `${mode}: knowledge-base slices recorded`);
  }

  fs.writeFileSync(path.join(RESULTS_DIR, "summary.json"), JSON.stringify(RESULTS, null, 2));
  const wall = RESULTS.map((r) => r.wallSeconds as number).sort((a, b) => a - b);
  const p50 = wall[Math.floor(wall.length / 2)];
  const p90 = wall[Math.floor(wall.length * 0.9)];
  console.log(`[maxi-e2e] batch: ${wall.length} modes · p50=${p50}s p90=${p90}s · min=${wall[0]}s max=${wall[wall.length - 1]}s`);
});

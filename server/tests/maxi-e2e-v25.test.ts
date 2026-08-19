import test from "node:test";
import assert from "node:assert/strict";

/**
 * Maxi Agent v25 — the RELEASE GATE (real models + e2b).
 *
 *   MAXI_E2E=1 node --import tsx --test server/tests/maxi-e2e-v25.test.ts
 *
 * One real run per brief against the production gateway + the e2b sandbox
 * pool. Asserts the v25 contract:
 *   · wall time ≤ 180s (target < 120s — the Figma-Make/Framer band)
 *   · ≤ 22 model calls total
 *   · ≥ 2 verified screens
 *   · zero HARD gate failures (deterministic gates are the only blockers)
 *   · the advisory review recorded (score present, never blocking)
 *   · the uniqueness fingerprint recorded (distinct-brief regression lives
 *     in the deterministic pipeline test)
 *
 * The deterministic suite (npm test) covers everything else with stubbed
 * model calls — this file only runs when MAXI_E2E=1 is set explicitly.
 */

const E2E = process.env.MAXI_E2E === "1";
const BRIEF = process.env.MAXI_E2E_BRIEF || "A running tracker for competitive runners that logs sessions and shows coach-grade pace metrics";

test(
  "v25 e2e: one real run completes inside the speed/quality contract",
  { skip: !E2E && "MAXI_E2E=1 not set — the release gate is opt-in (real model spend)" },
  { timeout: 420_000 },
  async () => {
    process.env.MAXI_DISABLE_E2B = undefined;
    delete process.env.MAXI_DISABLE_E2B;

    const { startAgentLoop } = await import("../lib/maxi-agent/engine");
    const { subscribeToRun } = await import("../lib/maxi-agent/run-store");

    const runId = `v25-e2e-${Date.now()}`;
    const events: Array<Record<string, unknown>> = [];
    const stop = subscribeToRun(runId, (e) => events.push(e as unknown as Record<string, unknown>));

    const started = Date.now();
    await startAgentLoop(runId, BRIEF, {});
    const wallSeconds = (Date.now() - started) / 1000;
    stop();

    const messages = events.filter((e) => e.type === "activity").map((e) => String(e.message ?? ""));
    const files = new Set(events.filter((e) => e.type === "file").map((e) => String((e as { file?: { path?: string } }).file?.path ?? "")));

    // Completion.
    assert.ok(events.some((e) => e.type === "done"), "the run completed");
    assert.ok(!events.some((e) => e.type === "error"), `no fatal error: ${messages.filter((m) => m.includes("failed")).slice(0, 3).join("; ")}`);

    // Speed: the acceptance band.
    assert.ok(wallSeconds <= 180, `wall time ${wallSeconds.toFixed(1)}s exceeds the 180s ceiling (target < 120s)`);

    // Verified screens.
    const screensEvent = events.find((e) => e.type === "screens") as { screens?: string[] } | undefined;
    assert.ok((screensEvent?.screens?.length ?? 0) >= 2, "at least two verified screens");

    // Output contract.
    for (const path of ["src/lib/shell.jsx", "src/data.js", "src/styles.css", "src/App.jsx", "manifest.json", "README.md"]) {
      assert.ok(files.has(path), `export file ${path} present`);
    }

    // Hard gate: zero failures.
    const gateDoc = events.find((e) => e.type === "doc" && String((e as { doc?: { path?: string } }).doc?.path) === "docs/review/GateReport.json") as { doc?: { content?: string } } | undefined;
    assert.ok(gateDoc?.doc?.content, "gate report recorded");
    const gate = JSON.parse(gateDoc!.doc!.content!);
    assert.equal(gate.passed, true, `zero hard failures — issues: ${JSON.stringify((gate.issues ?? []).slice(0, 5))}`);

    // Model-call discipline.
    const callsDoc = events.find((e) => e.type === "doc" && String((e as { doc?: { path?: string } }).doc?.path) === "docs/timing/CallCounts.json") as { doc?: { content?: string } } | undefined;
    const calls = callsDoc ? (JSON.parse(callsDoc.doc!.content!) as { totalCalls?: number }) : null;
    assert.ok(!calls || (calls.totalCalls ?? 0) <= 22, `model-call discipline (${calls?.totalCalls} calls ≤ 22)`);

    // Advisory review present and non-blocking.
    assert.ok(messages.some((m) => m.startsWith("Advisory review:")), "the advisory scorecard is recorded");

    // Fingerprint recorded.
    assert.ok(messages.some((m) => m.startsWith("Fingerprint:")), "the uniqueness fingerprint is recorded");

    console.log(`[v25-e2e] wall=${wallSeconds.toFixed(1)}s calls=${calls?.totalCalls ?? "?"} screens=${screensEvent?.screens?.join(",")}`);
  },
);

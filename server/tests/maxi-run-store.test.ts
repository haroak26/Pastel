import test from "node:test";
import assert from "node:assert/strict";

/**
 * Maxi Agent v24 — stale-error status bug (WS8).
 *
 * v23: the dev server booted while a run was mid-flight; cleanupStaleRuns
 * stamped every `running` row with error "Run interrupted by server
 * restart". The orchestrator then finished all four waves and wrote its
 * final state — but that final updateRun did NOT clear the `error` field,
 * so the completed row misleadingly carried the interruption error (the
 * agenttests/agentv23 run-log investigation).
 *
 * Regression: simulate the stale cleanup mid-flight, then a normal
 * completion; the final row must have no `error`.
 */

test(
  "run store: a stale-cleanup error is cleared by the final completion update",
  { skip: !process.env.DATABASE_URL && "DATABASE_URL not set — DB-backed regression skipped" },
  async () => {
    const { createRun, updateRun, cleanupStaleRuns } = await import("../lib/maxi-agent/run-store");
    const { db } = await import("../db");
    const { agentRuns } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const run = await createRun({ prompt: "WS8 regression", answers: {} });
    try {
      // Simulate the dev-server boot: cleanupStaleRuns marks the running
      // row as interrupted mid-flight.
      await cleanupStaleRuns();
      const mid = await db.select().from(agentRuns).where(eq(agentRuns.id, run.id)).limit(1);
      assert.equal(mid[0]!.status, "error", "cleanupStaleRuns marked the run as interrupted");
      assert.equal(mid[0]!.error, "Run interrupted by server restart");

      // The orchestrator's final updateRun for a completed run — exactly
      // the v23 call shape (status + title + manifest) PLUS the WS8 fix
      // (error: null).
      await updateRun(run.id, {
        status: "done_needs_review",
        title: "WS8 regression",
        manifest: { screens: ["home", "detail"], phases: { present: "done" } },
        error: null,
      });

      const [row] = await db.select().from(agentRuns).where(eq(agentRuns.id, run.id)).limit(1);
      assert.equal(row!.status, "done_needs_review", "the run completed normally");
      assert.equal(row!.error, null, "the stale interruption error is cleared — no misleading error on a completed run");
      const manifest = row!.manifest as { screens?: string[] };
      assert.ok(Array.isArray(manifest.screens), "manifest survived the final update");
    } finally {
      await db.delete(agentRuns).where(eq(agentRuns.id, run.id));
    }
  },
);

test(
  "run store: an explicit completion patch carries error: null (the WS8 contract)",
  { skip: !process.env.DATABASE_URL && "DATABASE_URL not set — DB-backed regression skipped" },
  async () => {
    const { createRun, updateRun } = await import("../lib/maxi-agent/run-store");
    const { db } = await import("../db");
    const { agentRuns } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const run = await createRun({ prompt: "WS8 contract", answers: {} });
    try {
      await updateRun(run.id, { status: "error", error: "Run interrupted by server restart" });
      await updateRun(run.id, { status: "done", error: null, manifest: { screens: [] } });
      const [row] = await db.select().from(agentRuns).where(eq(agentRuns.id, run.id)).limit(1);
      assert.equal(row!.status, "done");
      assert.equal(row!.error, null);
    } finally {
      await db.delete(agentRuns).where(eq(agentRuns.id, run.id));
    }
  },
);

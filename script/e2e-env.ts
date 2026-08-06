/**
 * E2E environment guard — run FIRST (imported before any pastel-agent
 * module). The gateway snapshots MODELS at import time, so any minimax (or
 * otherwise non-default) PASTEL_MODEL_* pins must be removed before the
 * pipeline modules load. This restores the v7 two-model stack:
 *   cheap = anthropic/claude-haiku-4-5 (clarify/planner/builder/copy/repair)
 *   mid   = openai/gpt-5.4-mini     (brief/wireframe/review/visualReview)
 */
for (const key of Object.keys(process.env)) {
  if (key.startsWith("PASTEL_MODEL_")) {
    const value = process.env[key] ?? "";
    if (/minimax/i.test(value)) {
      console.log(`[e2e-env] clearing ${key}=${value} (minimax pin) — using the default two-model stack`);
      delete process.env[key];
    }
  }
}
// Known leftover pins from earlier experiments that must never reach a run.
delete process.env.PASTEL_MODEL_PLANNER;
delete process.env.PASTEL_MODEL_APPROVAL;

import type { WireframeDecision, WireframeReviewPayload } from "./pipeline/lib/wireframe-review";

/**
 * V8 wireframe confirmation gate — pending-decision registry.
 *
 * The pipeline's `confirmWireframes` callback resolves through this module:
 * run.ts registers a pending review keyed by runId, the SSE event carries the
 * payload to the client, and the client's POST to
 * `/api/pastel-agent/runs/:runId/wireframe-decision` resolves it. The run
 * blocks in the `wireframe-review` phase (SSE stays open, no `done` event)
 * until a decision arrives.
 *
 * Timeout policy: if the user never responds within
 * `PASTEL_WIREFRAME_REVIEW_TIMEOUT_MS` (default 10 minutes), the pending
 * review auto-cancels — a run never sits eternally blocked on a credit hold.
 */

export const WIREFRAME_REVIEW_TIMEOUT_MS = Number(process.env.PASTEL_WIREFRAME_REVIEW_TIMEOUT_MS) || 10 * 60 * 1000;

interface PendingReview {
  payload: WireframeReviewPayload;
  resolve: (decision: WireframeDecision) => void;
  timer: NodeJS.Timeout;
}

const pending = new Map<string, PendingReview>();

/** Register a pending wireframe review for a run. Resolves on
 *  `resolveWireframeReview` or after the timeout (auto-cancel). */
export function registerPendingWireframeReview(
  runId: string,
  payload: WireframeReviewPayload,
  timeoutMs = WIREFRAME_REVIEW_TIMEOUT_MS,
): Promise<WireframeDecision> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(runId);
      resolve({ action: "cancel" });
    }, timeoutMs);
    pending.set(runId, { payload, resolve, timer });
  });
}

/** Resolve a pending review. Returns false when nothing is pending (e.g. the
 *  run already timed out or no run matches). */
export function resolveWireframeReview(runId: string, decision: WireframeDecision): boolean {
  const review = pending.get(runId);
  if (!review) return false;
  clearTimeout(review.timer);
  pending.delete(runId);
  review.resolve(decision);
  return true;
}

/** Get the payload of a pending review (for status endpoints / re-render). */
export function getPendingWireframeReview(runId: string): WireframeReviewPayload | null {
  return pending.get(runId)?.payload ?? null;
}

/** Number of runs currently blocked at the gate (monitoring). */
export function pendingWireframeReviewCount(): number {
  return pending.size;
}

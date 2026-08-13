/**
 * Maxi Agent v23 — wireframe confirmation gate (pending-decision registry).
 *
 * Carried over from the retired Picasso pipeline (picasso/wireframe-gate.ts).
 * The v23 pipeline auto-approves wireframes (no hard blocking checkpoint —
 * the wave executor has no human-in-the-loop pause), but the registry stays
 * for the client-facing decision endpoints, which remain wired for older
 * clients. If a run ever registers a pending review, the client can still
 * post approve/revise/cancel here.
 *
 * Timeout policy: if the user never responds within
 * `MAXI_WIREFRAME_REVIEW_TIMEOUT_MS` (default 10 minutes), the pending
 * review auto-cancels — a run never sits eternally blocked on a credit hold.
 */

export const WIREFRAME_REVIEW_TIMEOUT_MS = Number(process.env.MAXI_WIREFRAME_REVIEW_TIMEOUT_MS) || 10 * 60 * 1000;

export type WireframeDecision =
  | { action: "approve" }
  | { action: "cancel" }
  | { action: "revise"; notes?: Record<string, string> };

/** Generic review payload — the v23 pipeline may emit any JSON shape. */
export type WireframeReviewPayload = Record<string, unknown> & { review?: unknown };

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

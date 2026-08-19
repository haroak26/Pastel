/**
 * Maxi Agent v25 — the retired wireframe gate, kept as a wire-compatible
 * no-op.
 *
 * v20-v24 paused the run at a wireframe confirmation checkpoint. v25 has no
 * wireframe stage (the Direction blueprint replaced it) and no blocking
 * checkpoints — so this module always reports "nothing pending". The route
 * and the client panel remain wired but inert: posting a decision returns
 * 409 ("no review pending"), exactly as a decided/timed-out gate always did.
 */

export interface WireframeDecision {
  action: "approve" | "revise" | "cancel";
  notes?: Record<string, string>;
}

export function getPendingWireframeReview(_runId: string): null {
  return null;
}

export function resolveWireframeReview(_runId: string, _decision: WireframeDecision): null {
  return null;
}

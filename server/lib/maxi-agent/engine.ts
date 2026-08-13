import type { VisualReference } from "./types";

/**
 * Maxi Agent production entry point.
 *
 * The UI runs the Maxi Agent v23 wave pipeline (discovery → design+brief →
 * layout genome → build ∥ content → compose → sandboxed render + gates →
 * bounded repair). Interim note: during the v23 rebuild the engine delegates
 * to the orchestrator; the retired Picasso pipeline is gone.
 */
export async function startAgentLoop(
  runId: string,
  prompt: string,
  answers: Record<string, string>,
  projectId?: string,
  holdId?: string,
  userId?: string,
  opts?: { maxCredits?: number; holdAmount?: number; visualReference?: VisualReference },
): Promise<void> {
  const { startAgentLoop: startMaxiAgentLoop } = await import("./orchestrator");
  await startMaxiAgentLoop(runId, prompt, answers, projectId, holdId, userId, opts);
}

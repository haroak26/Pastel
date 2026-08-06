export { startAgentLoopV6 } from "./orchestrator-v6";
import type { VisualReference } from "./types";

/**
 * v6 pipeline entry point.
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
  const { startAgentLoopV6: loop } = await import("./orchestrator-v6");
  await loop(runId, prompt, answers, projectId, holdId, userId, opts);
}

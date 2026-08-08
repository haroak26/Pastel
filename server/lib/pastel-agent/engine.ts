import type { VisualReference } from "./types";

/**
 * Pastel Agent v16 pipeline entry point.
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
  const { startAgentLoop: loop } = await import("./orchestrator");
  await loop(runId, prompt, answers, projectId, holdId, userId, opts);
}

import type { VisualReference } from "./types";

/**
 * Pastel Agent production entry point.
 *
 * The UI runs the full Picasso 8-stage pipeline (discovery → directions →
 * tokens/motion → architecture → content/components/catalog → screens →
 * smoke/lint/anti-slop gates → visual QA → finalize). The legacy in-place
 * agent loop is no longer used by the UI.
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
  const { startPicassoAgentLoop } = await import("./picasso/run");
  await startPicassoAgentLoop(runId, prompt, answers, projectId, holdId, userId, opts);
}

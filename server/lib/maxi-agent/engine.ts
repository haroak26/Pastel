import type { VisualReference } from "./types";
import type { ModelChat } from "./lib/model-chat";

/**
 * Maxi Agent production entry point.
 *
 * The UI runs the Maxi Agent v25 "Auteur" wave pipeline (direction →
 * parallel synthesis → deterministic verify → bounded polish → advisory
 * review). `chat` is the model-call injection point — production leaves it
 * undefined (the gateway is used); the deterministic test suite injects a
 * stub so the whole pipeline runs without any real model call.
 */
export async function startAgentLoop(
  runId: string,
  prompt: string,
  answers: Record<string, string>,
  projectId?: string,
  holdId?: string,
  userId?: string,
  opts?: { maxCredits?: number; holdAmount?: number; visualReference?: VisualReference; chat?: ModelChat },
): Promise<void> {
  const { startAgentLoop: startMaxiAgentLoop } = await import("./orchestrator");
  await startMaxiAgentLoop(runId, prompt, answers, projectId, holdId, userId, opts);
}

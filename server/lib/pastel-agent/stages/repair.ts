import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { patchSystemPrompt, patchUserPrompt } from "../prompts/patch";
import { generatedFilesSchema } from "../schemas/plan-schemas";
import type { LintIssue } from "../codegen/lint";
import type { StageContext } from "./context";

/**
 * Surgical repair — one call per failing artifact, carrying ONLY that artifact
 * plus its errors and contract guidance. Never a whole-project fix prompt.
 */
export async function repairArtifact(
  ctx: StageContext,
  path: string,
  content: string,
  issues: Array<Pick<LintIssue, "path" | "message"> & { line?: number }>,
  guidance?: string,
): Promise<string | null> {
  if (!ctx.budgetAllowsModelCall()) {
    ctx.activity("Credit budget reached — skipping further repairs");
    return null;
  }
  const sys = patchSystemPrompt();
  const user = patchUserPrompt(
    issues.map((i) => ({ file: i.path, line: i.line, message: i.message })),
    { [path]: content || "(this file is missing — generate it completely)" },
    guidance,
  );
  try {
    const result = await chatJSON<{ files: Array<{ path: string; content: string }> }>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "patch", temperature: 0.2, maxTokens: MAX_TOKENS_PER_CALL.patch, validate: (v) => generatedFilesSchema.parse(v) },
    );
    ctx.trackCost("repair", MODELS.patch, sys.length + user.length, JSON.stringify(result).length);
    ctx.quality.repairs++;
    const fixed = result.files.find((file) => file.path === path) ?? result.files[0];
    return fixed?.content ?? null;
  } catch (err) {
    console.warn(`[pastel-agent] repair of ${path} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

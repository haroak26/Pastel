import { chatJSON, MODELS, MAX_TOKENS_PER_CALL, type ChatMessage } from "../gateway";
import { visualReviewSystemPrompt, visualReviewUserPrompt } from "../prompts/visual";
import { visualReviewSchema, type VisualReview } from "../schemas/plan-schemas";
import { visualReviewToMarkdown } from "../codegen/markdown";
import { repairArtifact } from "./repair";
import { captureScreenshots } from "../visual-renderer";
import { persistFile } from "../run-store";
import { screenNameFromPath } from "../sandbox";
import type { StageContext } from "./context";

/**
 * Visual QA — Terra (multimodal) reviews rendered screenshots against the
 * blueprints. Only verified screens are inspected; only the specific files
 * implicated by findings are repaired.
 */
export async function visualQaStage(ctx: StageContext, screenFilter?: string[]): Promise<VisualReview> {
  const plan = ctx.state.architecture;
  let visualReview: VisualReview = { passes: true, issues: [] };
  let skippedReason: string | undefined;
  let screenshotCount = 0;

  const screensToInspect = ctx.builtScreens.filter((name) => !screenFilter || screenFilter.includes(name));

  // The visual design review is the pipeline's taste gate — it is budget-
  // reserved (15% headroom) so routine repairs can never starve it.
  if (screensToInspect.length > 0 && ctx.budgetAllowsModelCall(1.15)) {
    ctx.activity("Capturing verified screens for visual QA");
    const captured = await captureScreenshots(ctx.runId, screensToInspect, {
      includeMobile: process.env.PASTEL_VISUAL_MOBILE === "all",
    });
    skippedReason = captured.skippedReason;

    if (captured.screenshots.length > 0) {
      screenshotCount = captured.screenshots.length;
      const summaries = (plan?.screens ?? [])
        .filter((blueprint) => screensToInspect.includes(blueprint.name))
        .map((blueprint) => `SCREEN ${blueprint.name}\n${JSON.stringify(blueprint)}`)
        .join("\n\n");
      const visualText = visualReviewUserPrompt(ctx.styleDirection, summaries);
      const visualContent: Array<Record<string, unknown>> = [
        { type: "text", text: visualText },
        ...captured.screenshots.flatMap((screenshot) => [
          { type: "text", text: `SCREENSHOT: ${screenshot.screen} (${screenshot.viewport})` },
          {
            type: "image",
            source_type: "base64",
            media_type: "image/jpeg",
            data: screenshot.dataUrl.replace(/^data:image\/jpeg;base64,/, ""),
          },
        ]),
      ];
      const sys = visualReviewSystemPrompt();
      try {
        visualReview = await chatJSON<VisualReview>(
          [
            { role: "system", content: sys },
            { role: "user", content: visualContent },
          ] as ChatMessage[],
          { model: "visualQA", temperature: 0.2, maxTokens: MAX_TOKENS_PER_CALL.visualQA, validate: (v) => visualReviewSchema.parse(v) },
        );
        // Cost honesty: base64 image data is NOT text — billing it at text
        // rates inflates the ledger ~10x. Approximate vision input at
        // ~1100 tokens (≈4400 chars) per screenshot + real text chars.
        const textChars = visualContent.reduce((sum, block) => sum + (typeof block.text === "string" ? block.text.length : 0), 0);
        const imageCount = visualContent.filter((block) => block.type === "image").length;
        ctx.trackCost("visualQA", MODELS.visualQA, sys.length + textChars + imageCount * 4400, JSON.stringify(visualReview).length);
        ctx.activity(visualReview.passes ? "Visual QA passed" : `Visual QA found ${visualReview.issues.length} issue(s)`);
      } catch (err) {
        skippedReason = "Visual review model was unavailable";
        console.warn("[pastel-agent] visual review failed:", err instanceof Error ? err.message : err);
      }

      // Targeted repair: one call per implicated file, then incremental re-verify.
      if (!visualReview.passes && visualReview.issues.length > 0 && ctx.budgetAllowsModelCall()) {
        const byTarget = new Map<string, typeof visualReview.issues>();
        for (const issue of visualReview.issues) {
          const target = issue.target.startsWith("src/") ? issue.target : `src/screens/${issue.screen}.jsx`;
          byTarget.set(target, [...(byTarget.get(target) ?? []), issue]);
        }
        let touched = false;
        for (const [target, issues] of [...byTarget].slice(0, 4)) {
          const fixed = await repairArtifact(
            ctx,
            target,
            ctx.files[target] ?? "",
            issues.map((issue) => ({
              path: target,
              message: `Visual QA (${issue.viewport}, ${issue.severity}): ${issue.issue}. Evidence: ${issue.evidence}. Fix: ${issue.fix}`,
            })),
          );
          if (fixed && fixed.trim()) {
            ctx.files[target] = fixed;
            await ctx.saveFile({ path: target, kind: target.includes("/screens/") ? "screen" : target.endsWith(".css") ? "style" : "component", content: fixed });
            touched = true;
          }
        }
        if (touched) {
          const reverify = await ctx.verifier.verify(ctx.files);
          for (const [name, js] of Object.entries(reverify.bundles)) {
            if (!js) continue;
            if (!ctx.builtScreens.includes(name)) ctx.builtScreens.push(name);
            await persistFile(ctx.runId, { path: `.build/${name}.js`, kind: "build", content: js });
          }
          if (!reverify.ok) {
            ctx.activity("Visual corrections introduced a build issue; retaining verification warnings");
            const failed = [...new Set(reverify.errors.map((e) => e.file).filter((f): f is string => !!f && f.includes("/screens/")).map(screenNameFromPath))];
            ctx.failedScreens = [...new Set([...ctx.failedScreens, ...failed])];
          } else {
            ctx.activity("Applied visual QA corrections and re-verified");
          }
        }
      }
    } else {
      ctx.activity(`Visual QA skipped — ${captured.skippedReason ?? "no screenshots"}`);
    }
  } else {
    skippedReason = screensToInspect.length === 0 ? "No verified screens to inspect" : "Credit budget reached";
  }

  await ctx.saveDoc({
    path: "docs/10-visual-review.md",
    title: "Visual Design Review",
    kind: "visual-review",
    content: visualReviewToMarkdown(visualReview, screenshotCount, skippedReason),
  });
  return visualReview;
}

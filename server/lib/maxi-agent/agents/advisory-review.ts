import { z } from "zod";
import { MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import type { ChatMessage } from "../gateway";
import { callJSON, gatewayModelChat, type ModelChat } from "../lib/model-chat";

/**
 * Maxi Agent v25 — Wave 4 · ADVISORY REVIEW.
 *
 * The v24 wave-4 tail (repair → re-verify → re-review, 118s) existed because
 * the review model could block the run. In v25 the review is a scorecard,
 * not a gate: deterministic gates are the only blockers. This call runs once
 * at the very end, never triggers repair, and never fails the run — a model
 * error degrades to a deterministic estimate.
 */

export interface AdvisoryReviewInput {
  /** One-line product + concept context for the reviewer. */
  contextLine: string;
  screens: string[];
  /** Screen sources, trimmed (the reviewer judges structure, not bytes). */
  fileSummaries: Array<{ path: string; code: string }>;
  screenshotNames: string[];
  screenshots: string[];
  /** Hard-gate + advisory issue counts, for the deterministic fallback. */
  gateStats: { hard: number; advisory: number };
  chat?: ModelChat;
  onUsage?: OnUsage;
}

export interface AdvisoryReview {
  score: number;
  verdict: "ship" | "polish" | "rework";
  strengths: string[];
  improvements: string[];
  summary: string;
  /** True when the deterministic estimate ran (no model call / call failed). */
  estimated: boolean;
}

const advisorySchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(["ship", "polish", "rework"]),
  strengths: z.array(z.string().trim().min(4).max(160)).min(1).max(5),
  improvements: z.array(z.string().trim().min(4).max(160)).min(1).max(5),
  summary: z.string().trim().min(10).max(400),
});

const SYSTEM = `You are a discerning design reviewer — the kind who has shipped product at the best design-led startups. You are shown generated app screens (source code, and screenshots when available). Judge them the way you would judge a designer's work in review:

- Does the screen have a point of view, or is it template output?
- Is there ONE unmistakable dominant moment?
- Does the composition vary (rows, bands, asymmetric clusters) or is it a grid of identical cards?
- Is the content real and dense (populated rows, real units, believable copy)?
- Craft: hierarchy, spacing rhythm, restraint with the accent color.

Be honest and specific. Your score NEVER blocks the run — it informs the user. 90+ means you would ship it; 70-89 means strong with polish left; 50-69 means competent but templated; below 50 means generic output.

Output JSON only: { "score": 0-100, "verdict": "ship"|"polish"|"rework", "strengths": [1-5], "improvements": [1-5], "summary": "2-3 sentences" }`;

export async function runAdvisoryReview(input: AdvisoryReviewInput): Promise<AdvisoryReview> {
  const chatFn = input.chat ?? gatewayModelChat();
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: [
        `CONTEXT: ${input.contextLine}`,
        `Verified screens: ${input.screens.join(", ")}`,
        "",
        ...input.fileSummaries.map((f) => `── ${f.path} ──\n${f.code.slice(0, 6000)}`),
        "",
        input.gateStats.hard === 0
          ? "All hard gates passed (no overflow, no runtime failures, no contract violations)."
          : `${input.gateStats.hard} hard-gate failure(s) remain (flagged).`,
        `${input.gateStats.advisory} advisory note(s) recorded.`,
      ].join("\n"),
    },
  ];
  for (let i = 0; i < input.screenshots.length && i < input.screenshotNames.length; i++) {
    const m = input.screenshots[i]!.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
    if (!m) continue;
    messages.push({
      role: "user",
      content: [
        { type: "text", text: `Screenshot: ${input.screenshotNames[i]}` },
        { type: "image", source: { type: "base64", media_type: m[1]!, data: m[2]! } },
      ] as Array<Record<string, unknown>>,
    });
  }

  try {
    const raw = await callJSON(chatFn, messages, {
      model: "review",
      maxTokens: MAX_TOKENS_PER_CALL.review,
      temperature: 0.4,
      onUsage: input.onUsage,
      validate: (v: unknown) => advisorySchema.parse(v),
    });
    const parsed = raw as z.infer<typeof advisorySchema>;
    return { ...parsed, estimated: false };
  } catch (err) {
    console.warn("[maxi-agent] advisory review failed, using deterministic estimate:", err instanceof Error ? err.message : err);
    const base = input.gateStats.hard === 0 ? 82 : 60;
    const score = Math.max(40, Math.min(92, base - input.gateStats.advisory * 3));
    return {
      score,
      verdict: score >= 85 ? "ship" : score >= 65 ? "polish" : "rework",
      strengths: ["All deterministic gates enforced (geometry, contracts, tokens)."],
      improvements: ["Review model unavailable — deterministic estimate only."],
      summary: `Estimated from gate stats: ${input.gateStats.hard} hard failure(s), ${input.gateStats.advisory} advisory note(s).`,
      estimated: true,
    };
  }
}

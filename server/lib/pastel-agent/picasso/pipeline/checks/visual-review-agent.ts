import type { RubricScores } from "../types";
import { chat, type ChatMessage } from "../../../gateway";
import { BLOCKING_DEFECTS, computeWeightedScore, critiqueSystemPrompt } from "../rubric";
import type { ProductContext } from "../anti-slop";

export interface VisualReviewInput {
  screenshot: Buffer; // PNG image
  screenName: string;
  brief: { productName: string; niche: string; personality: string[] };
  tokens: { accentColor: string };
  productContext: ProductContext;
}

export interface VisualReviewOutput {
  scores: RubricScores;
  weightedScore: number;
  passed: boolean;
  blockingDefects: { id: string; label: string }[];
  diagnosis: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Send a screenshot to the vision model for rubric scoring.
 * Returns structured review with scores, defects, and feedback.
 */
export async function reviewScreen(input: VisualReviewInput): Promise<VisualReviewOutput> {
  const { screenshot, screenName, brief, tokens, productContext } = input;

  const systemPrompt = critiqueSystemPrompt() + `\n\nIMPORTANT: The product context is "${productContext}". Evaluate accordingly.`;

  const userPrompt = [
    {
      type: "text" as const,
      text: `Product: ${brief.productName} (${brief.niche}, ${brief.personality.join(", ")})\nAccent color: ${tokens.accentColor}\nProduct context: ${productContext}\n\nScore this screenshot of "${screenName}" against the rubric dimensions. Output ONLY valid JSON with the "scores" object, "diagnosis" string, and "affectedIds" array.`,
    },
    {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: "image/png" as const,
        data: screenshot.toString("base64"),
      },
    },
  ];

  const messages: ChatMessage[] = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt as unknown as string },
  ];

  try {
    const result = await chat(messages, {
      model: "visualReview",
      temperature: 0.3,
      maxTokens: 4000,
    });

    const parsed = parseReviewResponse(result.content);
    const scores = parsed.scores as unknown as RubricScores;
    const weightedScore = computeWeightedScore(scores);
    const blockingDefects = checkBlockingDefects(parsed.diagnosis, productContext);

    return {
      scores,
      weightedScore,
      passed: weightedScore >= 7.0 && blockingDefects.length === 0,
      blockingDefects,
      diagnosis: parsed.diagnosis,
      strengths: extractStrengths(parsed.diagnosis),
      improvements: extractImprovements(parsed.diagnosis),
    };
  } catch (err) {
    // Fallback: neutral scores when vision model unavailable
    const neutralScores: RubricScores = {
      productContext: 5, brandCoherence: 5, hierarchy: 5,
      composition: 5, spacingRhythm: 5, componentConsistency: 5,
      navigation: 5, contentCopy: 5, responsiveDesign: 5, accessibilityBaseline: 5,
    };
    return {
      scores: neutralScores,
      weightedScore: 5.0,
      passed: false,
      blockingDefects: [],
      diagnosis: `Visual review unavailable: ${err instanceof Error ? err.message : String(err)}. Manual review required.`,
      strengths: [],
      improvements: ["Visual review could not be completed — check model availability"],
    };
  }
}

interface RawReviewResponse {
  scores: Record<string, number>;
  diagnosis: string;
  affectedIds?: string[];
}

function parseReviewResponse(raw: string): RawReviewResponse {
  let text = raw.trim();
  // Extract JSON from markdown fences if present
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  
  const obj = JSON.parse(text);
  
  if (!obj.scores || typeof obj.scores !== "object") {
    throw new Error("Missing scores object in review response");
  }
  
  return {
    scores: obj.scores,
    diagnosis: typeof obj.diagnosis === "string" ? obj.diagnosis : "No diagnosis provided",
    affectedIds: Array.isArray(obj.affectedIds) ? obj.affectedIds : [],
  };
}

function checkBlockingDefects(diagnosis: string, productContext: ProductContext): { id: string; label: string }[] {
  const diag = diagnosis.toLowerCase();
  const defects: { id: string; label: string }[] = [];

  for (const defect of BLOCKING_DEFECTS) {
    if (diag.includes(defect.id) || diag.includes(defect.label.toLowerCase().slice(0, 20))) {
      defects.push({ id: defect.id, label: defect.label });
    }
  }

  return defects;
}

function extractStrengths(diagnosis: string): string[] {
  const strengths: string[] = [];
  const lines = diagnosis.split(/[.!]\s*/);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.includes("good") || lower.includes("strong") || lower.includes("excellent") ||
      lower.includes("clear") || lower.includes("consistent") || lower.includes("well") ||
      lower.includes("effective") || lower.includes("successful") || lower.includes("properly") ||
      lower.includes("correctly") || lower.includes("appropriate")
    ) {
      strengths.push(line.trim());
    }
  }
  return strengths.slice(0, 3);
}

function extractImprovements(diagnosis: string): string[] {
  const improvements: string[] = [];
  const lines = diagnosis.split(/[.!]\s*/);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.includes("missing") || lower.includes("lack") || lower.includes("need") ||
      lower.includes("should") || lower.includes("could") || lower.includes("improve") ||
      lower.includes("fix") || lower.includes("issue") || lower.includes("problem") ||
      lower.includes("inconsistent") || lower.includes("unclear") || lower.includes("weak")
    ) {
      improvements.push(line.trim());
    }
  }
  return improvements.slice(0, 3);
}

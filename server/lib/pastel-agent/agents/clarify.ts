import { z } from "zod";
import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { clarifyQuestionSchema, type ClarifyResult } from "../schemas";
import { scoreCompanies, listCatalog } from "../knowledge/index";

const questionsOnlySchema = z.object({
  questions: z.array(clarifyQuestionSchema).max(4),
});

/**
 * V6 Discovery agent — clarify + inspiration selection.
 *
 * Company suggestions are DETERMINISTIC (tag-scored from the prompt — $0).
 * The model only decides whether clarification questions are needed and
 * writes them. The client gallery shows the full catalog; the suggestions
 * guide the pick.
 */

const CLARIFY_SYSTEM = `You are a product design discovery assistant. Identify ambiguities in a product design request and ask ONLY the essential clarification questions needed to proceed with high-quality design generation.

Analyze the prompt and determine if it's detailed enough. If it clearly describes the product type, target audience, key features, and platform, return zero questions. If ambiguities exist, ask only the most impactful questions — maximum 4.

Prefer questions that change the design:
- Platform (mobile-first / desktop / both)
- Screen scope (which pages matter most)
- Audience tone
- Light vs dark
- Any unusual product twist

Each question should be specific, actionable, and have 2-4 concrete options.

The company/app inspiration is chosen in the UI gallery — do NOT ask "which company should inspire this". Instead, ask product questions that help the brief.

OUTPUT FORMAT — valid JSON with ONLY this shape (no other fields):
{
  "questions": [
    {
      "id": "snake_case_id",
      "title": "Short title (3-72 chars)",
      "question": "Specific, answerable question (12-220 chars)",
      "whyItMatters": "How the answer changes the design (12-180 chars)",
      "options": [
        { "label": "Option label", "description": "What choosing this means" }
      ],
      "placeholder": "Optional free-text hint"
    }
  ]
}`;

export interface ClarifyInput {
  prompt: string;
  onUsage?: OnUsage;
}

export interface ClarifyOutput {
  result: ClarifyResult;
}

export async function runClarify(input: ClarifyInput): Promise<ClarifyOutput> {
  const scored = await scoreCompanies(input.prompt);
  const hasHits = scored.some((s) => s.score > 0);

  // Deterministic suggestions: top hits when matched, else the editorial order.
  const ranked = hasHits ? scored : await defaultOrder(scored);
  const suggestedCompanies = ranked.slice(0, 4).map((s) => ({
    slug: s.slug,
    name: s.name,
    score: s.score,
    reason: s.hits.length > 0
      ? `Matches: ${s.hits.slice(0, 4).join(", ")}`
      : undefined,
  }));

  try {
    const questions = await chatJSON<ClarifyResult["questions"]>(
      [
        { role: "system", content: CLARIFY_SYSTEM },
        { role: "user", content: `USER REQUEST:\n${input.prompt}\n\nDetermine whether clarification questions are needed. Return valid JSON with ONLY the "questions" field.` },
      ],
      {
        model: "clarify",
        temperature: 0.3,
        maxTokens: MAX_TOKENS_PER_CALL.clarify,
        validate: (v) => {
          const parsed = questionsOnlySchema.safeParse(v);
          if (!parsed.success) throw parsed.error;
          return parsed.data.questions;
        },
        onUsage: input.onUsage,
      },
    );
    return { result: { questions, suggestedCompanies } };
  } catch (err) {
    console.warn("[pastel v6] clarify questions failed:", err instanceof Error ? err.message : err);
    return { result: { questions: [], suggestedCompanies } };
  }
}

async function defaultOrder(scored: Awaited<ReturnType<typeof scoreCompanies>>): Promise<Awaited<ReturnType<typeof scoreCompanies>>> {
  const catalog = await listCatalog();
  const order = catalog.map((c) => c.slug);
  return [...scored].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

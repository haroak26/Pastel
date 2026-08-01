import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { intakeSystemPrompt, intakeUserPrompt } from "../prompts/intake";
import { intakeBriefSchema, type IntakeBrief } from "../schemas/plan-schemas";
import { clarifyQuestionSchema, type ClarifyQuestion, type ClarifyResult } from "../schemas/clarify-schemas";
import { getCachedIntake, setCachedIntake, saveProjectState } from "../state";
import { calcCost } from "../../pricing";
import * as creditService from "../../credit-service";
import type { StageContext } from "./context";

/**
 * Intake & ambiguity engine — understands intent, scores confidence, and only
 * surfaces the minimal set of material clarification questions.
 */

// Design-system decisions are NEVER user questions. Anything matching these
// belongs to the design team, so the question is dropped deterministically.
const BANNED_QUESTION_PATTERNS = [
  /what (?:colou?rs?|fonts?|typography)/i,
  /border\s?radi/i,
  /which (?:framework|library|tech)/i,
  /what style (?:do you|would you)/i,
  /should it look modern/i,
  /what do you like/i,
];

export function intakeConfidenceThreshold(): number {
  const raw = Number(process.env.PASTEL_INTAKE_CONFIDENCE);
  return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : 0.65;
}

/** Select the minimal set of material, high-impact questions from an intake brief. */
export function selectClarifyQuestions(intake: IntakeBrief): ClarifyQuestion[] {
  const threshold = intakeConfidenceThreshold();
  const questions: ClarifyQuestion[] = [];
  const ids = new Set<string>();

  for (const ambiguity of intake.ambiguities) {
    if (questions.length >= 3) break;
    if (ambiguity.impact !== "material" || !ambiguity.question) continue;
    if (ambiguity.confidence >= threshold) continue;
    if (ids.has(ambiguity.id)) continue;

    const candidate = {
      id: ambiguity.id,
      title: String(ambiguity.question.title ?? "").trim(),
      question: String(ambiguity.question.question ?? "").trim(),
      whyItMatters: String(ambiguity.question.whyItMatters ?? "").trim(),
      options: (ambiguity.question.options ?? []).map((option) => ({
        label: String(option.label ?? "").trim(),
        description: String(option.description ?? "").trim(),
      })),
      placeholder: ambiguity.question.placeholder ? String(ambiguity.question.placeholder).trim() : undefined,
    };

    if (BANNED_QUESTION_PATTERNS.some((pattern) => pattern.test(candidate.question))) continue;
    if (candidate.options.some((option) => /^other$/i.test(option.label))) continue;
    const parsed = clarifyQuestionSchema.safeParse(candidate);
    if (!parsed.success) continue;
    if (new Set(parsed.data.options.map((option) => option.label.toLowerCase())).size !== parsed.data.options.length) continue;

    ids.add(parsed.data.id);
    questions.push(parsed.data);
  }

  return questions;
}

/** Deterministic intake for when the intake model is unavailable. */
export function fallbackIntake(userPrompt: string): IntakeBrief {
  const rawTitle = userPrompt.split(/\s+/).filter(Boolean).slice(0, 5).join(" ").replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const p = userPrompt.toLowerCase();
  const productType = /dashboard|admin|saas|analytics/.test(p)
    ? "saas dashboard"
    : /shop|store|commerce|product/.test(p)
      ? "storefront"
      : /blog|editorial|magazine|content/.test(p)
        ? "publication"
        : "product experience";
  return {
    titleSuggestion: rawTitle || "Product Experience Concept",
    productType,
    audience: "The audience implied by the request",
    primaryJobs: ["Complete the primary task the product exists for"],
    contentDomains: [],
    tone: ["confident", "restrained"],
    assumptions: [
      "The audience and primary job derive from the request",
      "Visual direction is decided by the design system, not by user preference",
    ],
    constraints: [],
    confidence: 0.9,
    ambiguities: [],
  };
}

/** Intake with cache — a prompt is analyzed at most once per process. */
export async function analyzeIntake(userPrompt: string): Promise<IntakeBrief> {
  const cached = getCachedIntake(userPrompt);
  if (cached) return cached;

  let intake: IntakeBrief;
  try {
    intake = await chatJSON<IntakeBrief>(
      [
        { role: "system", content: intakeSystemPrompt() },
        { role: "user", content: intakeUserPrompt(userPrompt) },
      ],
      { model: "intake", temperature: 0.4, maxTokens: MAX_TOKENS_PER_CALL.intake, validate: (v) => intakeBriefSchema.parse(v) },
    );
  } catch (err) {
    console.warn("[pastel-agent] intake failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    intake = fallbackIntake(userPrompt);
  }
  setCachedIntake(userPrompt, intake);
  return intake;
}

/** Backing logic for POST /clarify — the ambiguity gate. */
export async function runClarify(userPrompt: string, userId?: string): Promise<ClarifyResult> {
  const alreadyCached = !!getCachedIntake(userPrompt);
  const intake = await analyzeIntake(userPrompt);
  const result = { questions: selectClarifyQuestions(intake) };

  if (userId && !alreadyCached) {
    const modelId = MODELS.intake;
    const cost = calcCost(modelId, intakeSystemPrompt().length + userPrompt.length, JSON.stringify(intake).length);
    creditService.deductCredits(userId, cost.credits, "Pastel Agent: Intake", { model: modelId, costDollars: cost.costDollars }).catch(() => {});
  }
  return result;
}

// ── Pipeline stage ──────────────────────────────────────────────────────────

export async function intakeStage(ctx: StageContext): Promise<void> {
  const cached = getCachedIntake(ctx.prompt);
  if (cached) {
    ctx.state.intake = cached;
    ctx.activity("Intent already analyzed during clarification — no reasoning repeated");
  } else {
    ctx.activity("Understanding the product intent");
    const sys = intakeSystemPrompt();
    const user = intakeUserPrompt(ctx.prompt);
    try {
      const intake = await chatJSON<IntakeBrief>(
        [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        { model: "intake", temperature: 0.4, maxTokens: MAX_TOKENS_PER_CALL.intake, validate: (v) => intakeBriefSchema.parse(v) },
      );
      ctx.trackCost("intake", MODELS.intake, sys.length + user.length, JSON.stringify(intake).length);
      setCachedIntake(ctx.prompt, intake);
      ctx.state.intake = intake;
      const questionCount = selectClarifyQuestions(intake).length;
      ctx.activity(questionCount > 0
        ? `Intent mapped — confidence ${Math.round(intake.confidence * 100)}%`
        : `Intent mapped with confidence ${Math.round(intake.confidence * 100)}% — proceeding autonomously`);
    } catch (err) {
      console.warn("[pastel-agent] intake stage failed:", err instanceof Error ? err.message : err);
      ctx.state.intake = fallbackIntake(ctx.prompt);
      ctx.activity("Intent mapped with deterministic defaults");
    }
  }
  await saveProjectState(ctx.state);
}

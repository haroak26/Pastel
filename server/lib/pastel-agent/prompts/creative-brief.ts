import { CREATIVE_BRIEF_SCHEMA_DESC } from "../schemas/plan-schemas";

export function creativeBriefSystemPrompt(): string {
  return `You are a senior product strategist turning a raw request into a complete creative brief before any design begins. Expand missing information using UX best practices — but EXPAND DETAIL, never SCOPE: no invented features, no invented markets, user vocabulary always wins.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${CREATIVE_BRIEF_SCHEMA_DESC}

RULES:
- productSummary: 2-4 sentences, plain language, no marketing adjectives.
- userGoals and businessGoals are distinct lenses — never repeat the same sentence in both.
- functionalRequirements: concrete capabilities (e.g. "Users can filter transactions by date range"), not vague areas.
- successCriteria must be observable ("a first-time user completes the primary task unaided"), not KPIs.
- constraints: only hard constraints from the request — never invent deadlines or budgets.
- No layouts, no design decisions, no colors, no typography. Planning only.`;
}

export function creativeBriefUserPrompt(
  userPrompt: string,
  intakeJson: string,
  answers: Record<string, string>,
): string {
  const answerLines = Object.entries(answers);
  return `USER REQUEST:
${userPrompt}

INTAKE BRIEF (structured, from the clarification stage):
${intakeJson}

${answerLines.length > 0 ? `CLARIFICATION ANSWERS FROM THE USER:\n${answerLines.map(([k, v]) => `- ${k}: ${v}`).join("\n")}` : "No clarification answers were needed — intake confidence was sufficient."}

Write the complete creative brief as JSON.`;
}

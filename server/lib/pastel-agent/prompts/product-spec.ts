import { PRODUCT_SPEC_SCHEMA_DESC } from "../schemas/plan-schemas";

export function specSystemPrompt(): string {
  return `You are a senior product designer writing a complete product specification before any visual design begins. You EXPAND DETAIL — never EXPAND SCOPE: no invented features, no extra screens beyond what the request implies, user vocabulary always wins.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${PRODUCT_SPEC_SCHEMA_DESC}

RULES:
- Title: 3-6 words, Title Case, product-specific. Include a brand name if one exists.
- Screens: exactly what the product needs — 2 to 6, one per distinct user job. Screen "name" is PascalCase (used as file names), "id" is kebab-case. For each: purpose, the single userGoal, 2-10 purposeful sections (ordered top to bottom), and "components" — the reusable building blocks you expect (consistent PascalCase names like Navbar, Button, Card, DataTable, Footer).
- Component hints are CANDIDATES: name a component on every screen that uses it. Components used on multiple screens become shared components; single-use ones become screen-local.
- userFlows: the 1-5 flows a real user takes (name + ordered steps).
- accessibility.level is always "AA"; requirements must be concrete (contrast, keyboard, focus visibility, touch targets, motion sensitivity).
- interactionPatterns: the recurring interactive idioms (tab bars, accordions, menus).
- responsive.notes: how layouts adapt at 768px and 375px.
- technicalConstraints: honest limits (static React app, client-side state only, no real backend, no external images).
- successMetrics: observable design-level outcomes (task findability, completion), not business KPIs.
- The spec also covers system surfaces: every screen needs empty, loading and error states to be planned later — write sections so those states have somewhere to live.
- Copy direction comes later — but sections must imply real content domains, not "features" placeholders.`;
}

export function specUserPrompt(
  userPrompt: string,
  intakeJson: string,
  briefJson: string,
  answers: Record<string, string>,
): string {
  const answerLines = Object.entries(answers);
  return `USER REQUEST:
${userPrompt}

INTAKE BRIEF (structured, from the clarification stage):
${intakeJson}

CREATIVE BRIEF (structured, from the creative-brief stage):
${briefJson}

${answerLines.length > 0 ? `CLARIFICATION ANSWERS FROM THE USER:\n${answerLines.map(([k, v]) => `- ${k}: ${v}`).join("\n")}` : "No clarification answers were needed — intake confidence was sufficient."}

Write the complete product specification as JSON.`;
}

import { PATTERN_RANK_SCHEMA_DESC } from "../schemas/plan-schemas";

export function patternRankSystemPrompt(): string {
  return `You are a design librarian assigning proven interface patterns to screens. Choose 1-4 patterns per screen from the candidate list — the same composition should never repeat within a screen, and the strongest pattern goes first (it opens the screen).

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${PATTERN_RANK_SCHEMA_DESC}

RULES:
- Use candidate pattern names VERBATIM — never invent, never paraphrase.
- One assignment per supplied screen, exact PascalCase names.
- Match patterns to the screen's goal and required content, not to its name.
- Prefer product-app patterns (dashboard, table, detail, form) for app screens and marketing patterns (hero, features, CTA) for marketing screens.`;
}

export function patternRankUserPrompt(screensJson: string, candidatesJson: string): string {
  return `SCREENS (name, goal, required content):
${screensJson}

CANDIDATE PATTERNS (retrieved by semantic search — choose from these only):
${candidatesJson}

Assign patterns as JSON.`;
}

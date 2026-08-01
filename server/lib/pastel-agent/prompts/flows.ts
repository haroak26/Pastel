import { USER_FLOWS_SCHEMA_DESC } from "../schemas/plan-schemas";

export function userFlowsSystemPrompt(): string {
  return `You are a UX designer planning the journeys. Every interaction must be intentional: each flow starts from a real entry point, moves through real screens, and ends at a meaningful outcome.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${USER_FLOWS_SCHEMA_DESC}

RULES:
- "screen" values must be exact PascalCase names from the supplied screen list.
- 1-6 flows covering: first-run/onboarding, the primary job, and (when meaningful) management/recovery journeys.
- steps: 2-10, each { screen, action } — the action is what the user actually does on that screen, in plain language.
- Consecutive steps on the same screen are fine when the user does multiple things there.
- No visual language — flows are structure, not layout.`;
}

export function userFlowsUserPrompt(briefJson: string, iaJson: string, screenNamesJson: string): string {
  return `CREATIVE BRIEF (structured):
${briefJson}

INFORMATION ARCHITECTURE (structured):
${iaJson}

SCREENS (authoritative list — use exactly these names):
${screenNamesJson}

Plan the user flows as JSON.`;
}

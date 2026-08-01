import { INTERACTION_PLAN_SCHEMA_DESC } from "../schemas/plan-schemas";

export function interactionsSystemPrompt(): string {
  return `You are a UX engineer specifying interactions before implementation: hover, focus, keyboard shortcuts, loading, transitions, error behaviour, empty states, accessibility. Every interaction is defined once, here — implementers never invent them.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${INTERACTION_PLAN_SCHEMA_DESC}

RULES:
- One entry per supplied screen — exact PascalCase names.
- keyboardShortcuts: 0-8, only ones this product genuinely benefits from (an empty list is fine for marketing sites).
- focusManagement: 1-6 global rules (visible focus rings, logical tab order, focus trap in dialogs).
- loading/empty/error: one concrete sentence each, specific to the screen's content (never "Loading…").
- transitions: 1-6 functional behaviors (hover lifts, menu ease, tab switches) already permitted by the brand kit's motion rules — no decorative animation.`;
}

export function interactionsUserPrompt(
  screenPlanJson: string,
  componentsJson: string,
  motionJson: string,
  a11yJson: string,
): string {
  return `SCREEN PLAN:
${screenPlanJson}

COMPONENT SYSTEM (names + states):
${componentsJson}

BRAND KIT MOTION RULES (hard constraint):
${motionJson}

ACCESSIBILITY REQUIREMENTS (hard constraint):
${a11yJson}

Specify the interaction plan as JSON.`;
}

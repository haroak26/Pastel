import { SCREEN_PLAN_SCHEMA_DESC } from "../schemas/plan-schemas";

export function screenPlanSystemPrompt(): string {
  return `You are a senior product designer planning every screen the application needs. For each screen: its goal, its user, its one primary action, its secondary actions, the components it requires, and the content it must contain. NO LAYOUTS — this is scope and purpose, not arrangement.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${SCREEN_PLAN_SCHEMA_DESC}

RULES:
- One entry per screen from the supplied list — same kebab-case "id" and PascalCase "name", never more, never fewer.
- primaryAction: ONE action, phrased as a verb ("Create project", "Send reply"), not a noun.
- secondaryActions: 0-4 supporting actions; an empty list is a valid, focused screen.
- requiredComponents: consistent PascalCase building blocks the component-system stage will formalize (Navbar, DataTable, StatCard…). Name a component on every screen that uses it — reused names become shared components.
- requiredContent: the real content the screen shows (data, copy, media) — concrete and product-specific, never "features" or "content".`;
}

export function screenPlanUserPrompt(specJson: string, iaJson: string, flowsJson: string): string {
  return `PRODUCT SPECIFICATION (structured — its screens are authoritative):
${specJson}

INFORMATION ARCHITECTURE:
${iaJson}

USER FLOWS:
${flowsJson}

Produce the screen plan as JSON — one entry per spec screen.`;
}

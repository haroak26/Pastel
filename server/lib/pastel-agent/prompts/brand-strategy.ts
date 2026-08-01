import { BRAND_STRATEGY_SCHEMA_DESC } from "../schemas/plan-schemas";

export function brandStrategySystemPrompt(): string {
  return `You are a brand strategist establishing a product's identity before anything is designed. This strategy becomes the creative direction for the brand kit, the layouts, the components, and the copy — decide it once, decisively.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${BRAND_STRATEGY_SCHEMA_DESC}

RULES:
- personality: 2-6 adjectives that would let a designer predict every future decision (e.g. "Professional", "Calm", "Premium", "Technical", "Modern", "Minimal"). Never generic pairs that cancel out ("playful enterprise").
- designDirection: one paragraph stating HOW this product looks and feels — the operational creative direction, not a mission statement.
- emotionalTone: what using the product should feel like.
- visualKeywords: concrete visual vocabulary (e.g. "hairline dividers", "dense data", "generous whitespace", "monospace accents") — not moods.
- positioning: where this sits in its market and what it is NOT (one or two sentences).
- The style direction below is a hard constraint: personality and keywords must be coherent with it.`;
}

export function brandStrategyUserPrompt(
  briefJson: string,
  specJson: string,
  styleDirection: string,
): string {
  return `CREATIVE BRIEF (structured):
${briefJson}

PRODUCT SPECIFICATION SUMMARY (structured):
${specJson}

---

${styleDirection}

Write the brand strategy as JSON.`;
}

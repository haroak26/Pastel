// ── Per-token model pricing from OpenRouter ──────────────────────────────
// 1 credit = $0.01 USD of AI API usage. Credits are rounded to 2 decimal places.
// Token count is approximated from character count (~4 chars/token).

export interface ModelPricing {
  inputCostPerToken: number;
  outputCostPerToken: number;
  charsPerToken: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "google/gemma-4-31b-it": { inputCostPerToken: 0.00000010, outputCostPerToken: 0.00000034, charsPerToken: 4 },
  "mistralai/ministral-14b-2512": { inputCostPerToken: 0.00000020, outputCostPerToken: 0.00000020, charsPerToken: 4 },
  "openai/gpt-oss-20b": { inputCostPerToken: 0.00000003, outputCostPerToken: 0.00000013, charsPerToken: 4 },
  "openai/gpt-5.4-nano": { inputCostPerToken: 0.00000020, outputCostPerToken: 0.00000125, charsPerToken: 4 },
  "mistralai/mistral-small-2603": { inputCostPerToken: 0.00000015, outputCostPerToken: 0.00000060, charsPerToken: 4 },
  "openai/gpt-5.4-mini": { inputCostPerToken: 0.00000075, outputCostPerToken: 0.00000450, charsPerToken: 4 },
  "anthropic/claude-sonnet-5": { inputCostPerToken: 0.00000200, outputCostPerToken: 0.00001000, charsPerToken: 4 },
  "anthropic/claude-haiku-4-5": { inputCostPerToken: 0.00000080, outputCostPerToken: 0.00000400, charsPerToken: 4 },
  // Keep Luna explicit rather than silently charging the generic fallback.
  // Update these values when the active Merge Gateway rate card changes.
  "openai/gpt-5.6-luna": { inputCostPerToken: 0.00000050, outputCostPerToken: 0.00000150, charsPerToken: 4 },
  "openai/gpt-5.6-terra": { inputCostPerToken: 0.00000125, outputCostPerToken: 0.00000750, charsPerToken: 4 },
};

export const DEFAULT_PRICING: ModelPricing = { inputCostPerToken: 0.00000050, outputCostPerToken: 0.00000150, charsPerToken: 4 };

export const CREDIT_PER_DOLLAR = 100;

export function getModelPricing(modelId: string): ModelPricing {
  return MODEL_PRICING[modelId] ?? DEFAULT_PRICING;
}

export function calcCost(
  modelId: string,
  inputChars: number,
  outputChars: number,
): { costDollars: number; credits: number } {
  const p = getModelPricing(modelId);
  const inputTokens = Math.ceil(inputChars / p.charsPerToken);
  const outputTokens = Math.ceil(outputChars / p.charsPerToken);
  const costDollars = inputTokens * p.inputCostPerToken + outputTokens * p.outputCostPerToken;
  const credits = Math.max(0.01, Math.round((costDollars * CREDIT_PER_DOLLAR) * 100) / 100);
  return { costDollars, credits };
}

export function toCredits(costDollars: number): number {
  return Math.max(0.01, Math.round((costDollars * CREDIT_PER_DOLLAR) * 100) / 100);
}

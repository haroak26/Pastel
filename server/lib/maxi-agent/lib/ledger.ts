import type { UsageRecord } from "../gateway";
import { calcCostTokens, toCredits, IMAGE_TOKEN_ESTIMATE } from "../../pricing";

/**
 * Cost ledger — prices every model call into credits/dollars. Prefers the
 * gateway's real token counts and routing cost when available.
 */

export interface CostLedgerEntry {
  stage: string;
  modelId: string;
  inputChars: number;
  outputChars: number;
  credits: number;
}

export interface CostLedger {
  entries: CostLedgerEntry[];
  totalCredits: number;
  totalDollars: number;
}

export function ledgerFromUsage(costs: UsageRecord[]): CostLedger {
  const entries: CostLedgerEntry[] = [];
  let totalDollars = 0;
  for (const rec of costs) {
    const inputTokens = rec.inputTokens > 0
      ? rec.inputTokens
      : Math.ceil(rec.inputChars / 4) + rec.imageBlocks * IMAGE_TOKEN_ESTIMATE;
    const outputTokens = rec.outputTokens > 0
      ? rec.outputTokens
      : Math.ceil(rec.outputChars / 4);
    const costDollars = typeof rec.costUsd === "number"
      ? rec.costUsd
      : calcCostTokens(rec.modelId, inputTokens, outputTokens).costDollars;
    totalDollars += costDollars;
    entries.push({
      stage: rec.role,
      modelId: rec.modelId,
      inputChars: rec.inputChars,
      outputChars: rec.outputChars,
      credits: toCredits(costDollars),
    });
  }
  totalDollars = Math.round(totalDollars * 10000) / 10000;
  return { entries, totalCredits: toCredits(totalDollars), totalDollars };
}

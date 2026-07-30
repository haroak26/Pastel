import { storage } from "../storage";
import { PLAN_LIMITS } from "@shared/schema";
import type { PlanTier } from "@shared/schema";

export interface CreditBalance {
  balance: number;
  dailyUsed: number;
  lifetimePurchased: number;
  lifetimeUsed: number;
}

export interface AllowanceCheck {
  allowed: boolean;
  reason?: string;
  balance: CreditBalance;
  monthlyUsed: number;
  monthlyAllowance: number;
  dailyAllowance: number;
}

export async function ensureCredits(userId: string): Promise<void> {
  await storage.ensureCreditRecord(userId);
}

export async function getBalance(userId: string): Promise<CreditBalance> {
  return storage.getCredits(userId);
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  return storage.getMonthlyCreditUsage(userId);
}

export async function checkAllowance(
  userId: string,
  plan: PlanTier,
  estimatedCredits: number,
): Promise<AllowanceCheck> {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const monthlyAllowance = limits.aiCredits.monthly;
  const dailyAllowance = limits.aiCredits.daily;
  const balance = await storage.getCredits(userId);
  const monthlyUsed = await storage.getMonthlyCreditUsage(userId);

  const res: AllowanceCheck = {
    allowed: true,
    balance,
    monthlyUsed,
    monthlyAllowance,
    dailyAllowance,
  };

  if (monthlyAllowance === 0) {
    res.allowed = false;
    res.reason = "Your plan does not include AI agent credits. Upgrade to Pro to use the AI agent.";
    return res;
  }

  const monthlyRemaining = monthlyAllowance - monthlyUsed;
  const effectiveCredits = Math.max(0, estimatedCredits - Math.max(0, monthlyRemaining));
  if (monthlyUsed >= monthlyAllowance && balance.balance < estimatedCredits) {
    res.allowed = false;
    res.reason = `Monthly credit allowance used (${monthlyUsed}/${monthlyAllowance}). Buy more credits or wait until next month.`;
    return res;
  }
  if (balance.balance < effectiveCredits) {
    res.allowed = false;
    res.reason = `You don't have enough credits. Need ${estimatedCredits} credits but only have ${balance.balance + Math.max(0, monthlyRemaining)} available.`;
    return res;
  }
  if (balance.dailyUsed + estimatedCredits > dailyAllowance) {
    res.allowed = false;
    res.reason = `Daily credit limit reached (${balance.dailyUsed}/${dailyAllowance}). Try again tomorrow.`;
    return res;
  }

  return res;
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  return storage.deductCredits(userId, amount, description, metadata ?? {});
}

export async function addCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  return storage.addCredits(userId, amount, description, metadata ?? {});
}

export async function createHold(
  userId: string,
  amount: number,
  runId?: string,
): Promise<string> {
  return storage.createCreditHold(userId, amount, runId);
}

export async function releaseHold(
  holdId: string,
  actualCredits: number,
): Promise<void> {
  return storage.releaseCreditHold(holdId, actualCredits);
}

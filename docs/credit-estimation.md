# Credit Estimation for AI Agent Builds

## Overview

Every Pastel AI agent run (Build or Plane mode) consumes credits. Before starting, the system estimates the cost, checks the user's balance, and places a hold. After completion, the hold is released against the actual cost.

## Core Formula

```
1 credit = $0.20 USD of API usage
credits = costInDollars × 5
```

Minimum deduction: `0.01 credits` (2 decimal places).
Minimum balance to start a run: **5 credits** (hard floor).

## Per-Phase Cost Breakdown

Estimation is based on typical input/output character counts per phase, multiplied by the model's per-token pricing (1 token ≈ 4 chars).

### Build Mode (full pipeline, ~4 screens)

| Phase | Model | Input (chars) | Output (chars) | Est. Tokens | Est. Cost | Est. Credits |
|-------|-------|--------------|----------------|-------------|-----------|-------------|
| Clarify | gpt-5.4-nano | 500 | 2,000 | 625 | $0.0007 | 0.01 |
| Title | mistral-small-4 | 300 | 100 | 100 | $0.00002 | 0.01 |
| Brief | gpt-5.4-mini | 3,000 | 4,000 | 1,750 | $0.005 | 0.03 |
| Design System | claude-sonnet-5 | 5,000 | 4,000 | 2,250 | $0.012 | 0.06 |
| Component Spec | claude-sonnet-5 | 6,000 | 6,000 | 3,000 | $0.018 | 0.09 |
| Screen Specs (×4) | claude-sonnet-5 | 4,000×4 | 6,000×4 | 10,000 | $0.072 | 0.36 |
| Shared Code | gpt-5.6-terra | 8,000 | 12,000 | 5,000 | $0.025 | 0.13 |
| Screen Code (×4) | gpt-5.6-terra | 6,000×4 | 10,000×4 | 16,000 | $0.09 | 0.45 |
| Fix Rounds (×2) | gpt-5.6-terra | 4,000×2 | 4,000×2 | 4,000 | $0.008 | 0.04 |
| **Total** | | | | **~47,725** | **~$0.23** | **~1.15** |

### Plane Mode (lighter pipeline — fewer model calls)

Plane mode skips the code generation phases and only does clarify → title → brief → design system (no specs, no code). Estimated cost: **~$0.02 → ~0.10 credits**.

## Estimation Algorithm

```
estimateBuildCredits(prompt, screenCount = 4):
  promptChars = prompt.length

  // Phase 1: Clarify (proportional to prompt length)
  clarify = calcCost(clarifyModel, promptChars + 500, min(2000, promptChars × 2))

  // Phase 2: Title (tiny — proportional to prompt)
  title = calcCost(titleModel, 300 + promptChars, 100)

  // Phase 3-5: Plan phases (scale with screen count)
  brief = calcCost(briefModel, 3000, 4000)
  designSystem = calcCost(planModel, 5000, 4000)
  componentSpec = calcCost(planModel, 6000, 6000)
  screenSpecs = screenCount × calcCost(planModel, 4000, 6000)

  // Phase 6-8: Build phases (scale with screen count)
  sharedCode = calcCost(codeModel, 8000, 12000)
  screenCode = screenCount × calcCost(codeModel, 6000, 10000)
  fixRounds = 2 × calcCost(codeModel, 4000, 4000)

  total = sum(all phases)
  return max(0.10, round(total, 2))
```

Where `calcCost(model, inputChars, outputChars)` uses the model's per-token pricing from `server/lib/pricing.ts`:

```
inputTokens  = ceil(inputChars / model.charsPerToken)   // typically /4
outputTokens = ceil(outputChars / model.charsPerToken)
costDollars  = inputTokens × model.inputCostPerToken + outputTokens × model.outputCostPerToken
credits      = max(0.01, round(costDollars × 5, 2))
```

## Flow: User Experience

```
User clicks "Generate" in the UI
  → Client calls POST /api/pastel-agent/generate { prompt, mode: "build" }
  → Server estimates cost (~1.15 credits for a typical build)
  → Server checks: balance >= 5? (min balance check)
  → Server checks: monthlyUsed + estimate <= monthlyAllowance?
  → Server checks: dailyUsed + estimate <= dailyAllowance?
  → If any check fails: return 402 with reason + current balance
  → If all pass: create credit hold for estimated amount
  → Start agent loop (background)
  → Return { runId, holdId, estimatedCredits: 1.15 }

Agent loop completes:
  → Sum actual cost from all model calls (tracked per-phase)
  → Release hold: actualCost credits deducted
  → If actual < estimate: refund = estimate - actual (auto-added back)
  → If run failed: full refund of held credits
  → Log credit_transaction with per-phase breakdown in metadata
```

## Frontend Estimation Display

The client should show users an estimate before confirming:

```
┌──────────────────────────────────────┐
│  Estimated Credit Cost               │
│                                      │
│  Build (4 screens) .......... 1.15   │
│  ─────────────────────────           │
│  Your balance ............. 42.00    │
│  Balance after ........... 40.85    │
│                                      │
│  Min. balance required: 5 credits    │
│                                      │
│  [Cancel]    [Start Build (1.15)]    │
└──────────────────────────────────────┘
```

To support this, the server exposes:

```
GET /api/pastel-agent/estimate?prompt=...&mode=build
→ { estimatedCredits: 1.15, balance: 42.00, minRequired: 5 }
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Balance < 5 | 402 — "You need at least 5 credits to start a build" |
| Monthly allowance exceeded | 402 — "Monthly credit allowance reached (300/500)" |
| Daily cap hit | 402 — "Daily credit limit reached (48/50)" |
| Run uses less than estimated | Refund difference automatically on hold release |
| Run fails mid-way | Full refund of held credits |
| User has allowance but no purchased credits | Combination: allowance + purchased balance both available |
| Prompt is very long (4000 chars) | Estimate scales with prompt length proportionally |
| Screen count varies (1-6) | Estimate scales linearly with screen count for spec + code phases |

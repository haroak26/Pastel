# Credit Estimation for AI Agent Builds

## Overview

Every Pastel AI agent run consumes credits. Before starting, the server estimates the cost, checks the user's balance, and places a hold. After completion, the hold is released against the **actual measured cost** (tracked per stage in the run manifest's cost ledger).

## Core Formula

```
1 credit = $0.20 USD of API usage
credits = costInDollars × 5
```

Minimum deduction: `0.01 credits` (2 decimal places).
Minimum balance to start a run: **5 credits** (hard floor).

## Pastel Agent v2 — Model Routing

Reasoning/planning/verification runs on `openai/gpt-5.6-terra`; deterministic implementation (components, screens, repairs) runs on `openai/gpt-5.6-luna`. Deterministic work (styles.css codegen, sitemap derivation, lint, anti-slop checks, sandbox verification) costs **zero** model tokens.

| Stage | Role (model) | Typical calls per 4-screen run |
|-------|--------------|-------------------------------|
| Intake + ambiguity | terra (`intake`) | 1 (0 when cached from `/clarify`) |
| Product spec | terra (`spec`) | 1 |
| Design system | terra (`designSystem`) | 1 |
| Architecture + contracts + blueprints | terra (`architecture`) | 1 |
| Design gate (+ targeted fixes) | terra (`designGate`) | 1 (+0–3) |
| Components | luna (`component`) | one per new/changed component (registry-validated ones are reused) |
| Screens | luna (`screen`) | one per screen |
| Surgical repairs | luna (`patch`) | only for failing artifacts, capped rounds |
| Visual QA | terra (`visualQA`) | 1 (batched screenshots) |

**Measured production runs (4-screen product, ~12 components): ~1.3 credits (~$0.26) full run; ~0.3–0.6 credits (~$0.06–0.12) delta (add-a-screen) run.** Delta runs reuse the persistent project state, the component registry, and the previous run's sources.

## Estimation Endpoint

```
GET /api/pastel-agent/estimate?prompt=...&screens=4
→ { estimatedCredits: 2.35, balance: 42.00, minRequired: 5 }
```

(requires auth; implementation in `server/routes/pastel-agent.ts` → `estimateRunCredits`, mirroring the stage call graph above.)

## Flow

```
User clicks "Generate"
  → POST /api/pastel-agent/generate { prompt, answers?, projectId? }
  → estimate cost, check balance/monthly/daily allowances (402 on failure)
  → create credit hold for the estimate
  → start agent loop (background), return { runId, holdId, status }

Party completes:
  → releaseHold(holdId, actualCreditsFromLedger)
  → if actual < estimate: difference refunded
  → if run failed: full refund
```

A per-run budget ceiling (`PASTEL_MAX_RUN_CREDITS`, default 25; the route passes `max(2×estimate, 10)`) stops unbounded repair loops — beyond it, optional repairs are skipped and artifacts degrade gracefully.

## Delta runs (add screens)

```
POST /api/pastel-agent/projects/:projectId/screens { prompt }
```

Loads the project's persistent state + registry, plans only the delta, generates only missing components/screens, verifies incrementally, and reports `screensAdded` in the manifest. Estimated with 2 screens.

## Manifest transparency

Each run's manifest carries `costs: { entries: [{stage, modelId, inputChars, outputChars, credits}], totalCredits, totalDollars }`, `registryStats: {reused, generated, fallback}`, and `quality: {repairs, gatePassedFirstTry}` for cost/quality auditing.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Balance < 5 | 402 — "You need at least 5 credits to start a build" |
| Monthly allowance exceeded | 402 — "Monthly credit allowance reached (300/500)" |
| Daily cap hit | 402 — "Daily credit limit reached (48/50)" |
| Run uses less than estimated | Refund difference automatically on hold release |
| Run fails mid-way | Full refund of held credits |
| Intake already analyzed via `/clarify` | `/generate` reuses the cached intake brief — zero duplicate reasoning cost |
| Registry component valid from previous run | Reused with no model call; counted in `registryStats.reused` |
```

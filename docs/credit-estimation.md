# Credit Estimation for AI Agent Builds

## Overview

Every Pastel AI agent run consumes credits. Before starting, the server estimates the cost, checks the user's balance, and places a hold. After completion, the hold is released against the **actual measured cost** (tracked per stage in the run manifest's cost ledger).

## Core Formula

```
1 credit = $0.01 USD of AI API usage (CREDIT_PER_DOLLAR = 100 in server/lib/pricing.ts)
credits = costInDollars × 100
```

Minimum deduction: `0.01 credits` (2 decimal places).
Minimum balance to start a run: **5 credits** (hard floor).

## Pastel Agent V6 — Model Routing (7-phase knowledge-base pipeline)

Two models only. The **mid tier** (`openai/gpt-5.4-mini`) handles the few judgment stages
(brief, wireframe, review); the **cheap tier** (`anthropic/claude-haiku-4-5`) handles the many
parallel component calls plus clarify/copy/assemble/repair. Override per-role via
`PASTEL_MODEL_<ROLE>`. Deterministic work (knowledge compilation, styles.css codegen, deterministic
screen composition, sandbox bundles, screenshots, code/geometry gates) costs **zero model tokens**.

| Phase | What it does | Model | Calls per run |
|-------|--------------|-------|---------------|
| discovery | Clarification questions + company suggestions (tag scoring = $0) | cheap (`clarify`) | ≤1 |
| brief | Product brief + design references | mid (`brief`) | 1 |
| wireframe | Screen wireframes + component inventory | mid (`wireframe`) | 1 |
| build | Per-component plan + build, **parallel** | cheap (`planner` + `builder`) | 2/component (~10) |
| assemble | Copy + deterministic compose + sandbox verify | cheap (`copy`) + $0 | 1 |
| review | Code gate + geometry gate ($0) + static + vision review | $0 + mid (`review`) + mid (`visualReview`) | 2 (vision only when screenshots exist) |
| repair loop | Targeted file fixes + re-verify + re-review | cheap (`repair`) | ≤`PASTEL_MAX_REPAIR_CYCLES` (default 2), budget-gated |

**Settlement:** every API call records real token usage (gateway `usage` / `routing.cost_usd`) into
the run's cost ledger. Screenshots are priced as ~1100 image tokens each — never base64 text chars.
`releaseHold(holdId, min(actualCredits, holdAmount))`: the user is charged measured usage capped at
the estimate; failed runs settle the same way (usage actually consumed). Per-model rates live in
`server/lib/pricing.ts` (env-overridable — defaults are assumptions, verify against the Merge
invoice).

## Estimation Endpoint

```
GET /api/pastel-agent/estimate?prompt=...
→ { estimatedCredits: 3.20, balance: 42.00, minRequired: 5 }
```

(requires auth; implementation in `server/routes/pastel-agent.ts` → `estimateRunCredits`, mirroring
the phase call graph above.)

## Flow

```
User clicks "Generate"
  → POST /api/pastel-agent/generate { prompt, answers?, projectId? }
  → estimate cost, check balance/monthly/daily allowances (402 on failure)
  → create credit hold for the estimate
  → start agent loop (background), return { runId, holdId, status }

Run completes:
  → releaseHold(holdId, actualCreditsFromLedger)
  → if actual < estimate: difference refunded
  → if run failed: full refund
```

A per-run budget ceiling (`PASTEL_MAX_RUN_CREDITS`, default 25; the route passes `max(2×estimate,
10)`) stops unbounded repair loops — beyond it, optional repairs are skipped and artifacts degrade
gracefully.

## Manifest transparency

Each run's manifest carries `costs: { entries: [{stage, modelId, inputChars, outputChars, credits}],
totalCredits, totalDollars }` and `quality: { passed, score, repairs }` for cost/quality auditing.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Balance < 5 | 402 — "You need at least 5 credits to start a build" |
| Monthly allowance exceeded | 402 — "Monthly credit allowance reached (300/500)" |
| Daily cap hit | 402 — "Daily credit limit reached (48/50)" |
| Run uses less than estimated | Refund difference automatically on hold release |
| Run fails mid-way | Full refund of held credits |
| Intake already analyzed via `/clarify` | Answers (incl. chosen inspiration) are sent to `/generate` — no duplicate reasoning cost |
| Deterministic gates pass first try | $0 — no model repair calls |
| Repair budget exhausted | Repairs skipped; artifacts degrade gracefully |
```

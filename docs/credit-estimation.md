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

## Pastel Agent 2 — Model Routing (17-stage pipeline)

Reasoning/planning/verification runs on `openai/gpt-5.6-terra`; deterministic implementation (components, screens, repairs) runs on `openai/gpt-5.6-luna`. Light transformation roles (IA, user flows, pattern rerank, interactions) default to Terra as well but can be redirected to a cheaper model via `PASTEL_MODEL_LIGHT` (or per-role via `PASTEL_MODEL_<ROLE>`). Deterministic work (styles.css codegen, derivations, lint, anti-slop checks, sandbox verification, embeddings query for pattern retrieval) costs **zero or near-zero** model tokens.

| # | Stage | Role | Calls per run |
|---|-------|------|---------------|
| 1 | Clarification | terra (`intake`) | 1 (0 when cached from `/clarify`) |
| 2 | Creative brief | terra (`creativeBrief`) | 1 |
| 3 | Product specification | terra (`spec`) | 1 |
| 4 | Brand strategy | terra (`brandStrategy`) | 1 |
| 5 | Brand kit | terra (`designSystem`) | 1 |
| 6 | Information architecture | light (`ia`) | 1 |
| 7 | User flows | light (`flows`) | 1 |
| 8 | Screen planning | terra (`screenPlan`) | 1 |
| 9 | Layout planning | terra (`layout`) | 1 |
| 10 | Component system | terra (`componentSystem`) | 1 |
| 11 | Pattern retrieval | pgvector + light (`patternRank`) | 1 embedding + 1 rerank |
| 12 | Screen composition | terra (`compose`) | 1 |
| 13 | Interaction planning | light (`interactions`) | 1 |
| 14 | Code generation | luna (`component`/`screen`) | one per component/screen (registry reused) |
| 15 | Automated QA | deterministic + luna (`patch`) | only failing artifacts, capped rounds |
| 16 | Visual design review | terra-multimodal (`visualQA`) | 1 per repair-loop iteration |
| 17 | Repair loop | dedup of 15/16 | ≤ `PASTEL_MAX_REPAIR_ITERS` (default 2) |
| — | Composition design gate | terra (`designGate`) | 1 (+0–3 targeted fixes) |

**Measured production runs (2026-08-01): ~26 credits (~$0.26) full run (4 screens, 12 components, all planning stages on-model, visual QA executed twice); ~7.5–8.8 credits (~$0.08) delta run.** Light roles (6/7/11/13) default to `mistralai/ministral-14b-2512` (~7–60× cheaper than Terra — `gpt-oss-20b` returns empty responses on this gateway and is banned); the component system is hard-capped at 12 contracts; visual QA is budget-reserved so it always executes; screenshot base64 is priced as image tokens, not text chars.

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

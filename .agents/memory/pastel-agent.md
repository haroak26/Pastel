---
name: Pastel Agent 2 (17-stage pipeline)
description: How the rebuilt Pastel design agent works — 17 stages, state, registry, pattern retrieval, model routing, and the infra gotchas discovered during validation.
---

## Rule
The Pastel Agent (`server/lib/pastel-agent/`) is a 17-stage pipeline orchestrated by `orchestrator.ts`,
mapped onto the six wire phases the client understands:
- brief: 1 clarify → 2 creativeBrief → 3 productSpec
- plan: 4 brandStrategy → 5 brandKit (state field `designSystem`) → 6 IA → 7 userFlows →
  8 screenPlan → 9 layoutPlan → 10 componentSystem → 11 patternRetrieval → 12 screenComposition
  → 13 interactions
- review: composition design gate · build: 14 implement · verify: 15/16/17 repairLoop
  (verify ↔ visualQA, bounded by PASTEL_MAX_REPAIR_ITERS=2) · present: publish
Stages read/write persistent `ProjectState` (table `agent_project_state`, one jsonb column per
artifact) and the per-project registry (`agent_component_registry`); markdown docs are RENDERED
from state, never parsed back. Client wire contract is unchanged (6 phases, SSE types, doc kinds,
`docs/screens/<Name>.md`, `.build/<S>.js`).

## Model routing
- Terra (`openai/gpt-5.6-terra`): intake, creativeBrief, spec, brandStrategy, designSystem,
  screenPlan, layout, componentSystem, compose, architecture (delta), designGate, visualQA.
- Light roles (`mistralai/ministral-14b-2512`, ~7-60× cheaper, proven for structured JSON): ia,
  flows, patternRank, interactions. Override via `PASTEL_MODEL_LIGHT` / `PASTEL_MODEL_<ROLE>`.
- **gpt-oss-20b returns EMPTY responses on this gateway — never route roles to it** (it burned
  3+ min per stage in empty-response retries before the ministral switch).
- Luna (`openai/gpt-5.6-luna`): component, screen, patch.
- Gateway tags must come from the org-registered `betagroupa` value set (clarify, brief, plan,
  componentPlan, planFallback, code, fixSimple — **there is no "review" value**); new roles map
  onto that set. `chat()` retries once without tags on "Unknown tags" — keep that safety net.

## Style seeds — enterprise default
Default seed is `product-default` (Linear/Stripe-class: hairline borders, 4-12px radii,
professional UI fonts, restrained spacing). `PASTEL_STYLE_SEED=<name>` pins a seed;
`PASTEL_STYLE_SEED=variety` restores the creative roulette. Enterprise discipline is enforced
deterministically: brand-kit validation rejects borders >2px and radius >24px (non-pill);
anti-slop flags border-2/4/8 (high), oversized radius and padding; implement prompts forbid
label truncation ("ANNUAL REC…"), flat-at-0 chart series, and camelCase UI labels.

## Stage 11 — pattern retrieval
`design_patterns` table (pgvector, migration 0004) seeded with 46 curated patterns from
`server/lib/pastel-agent/patterns/corpus.ts` via `npx tsx script/seed-design-patterns.ts`.
Retrieval embeds brief+spec+strategy text (`getEmbedding`, text-embedding-3-small), cosine top-14,
then a light `patternRank` rerank assigns 1-4 patterns per screen. Table empty/missing → static
subset fallback (`staticPatternContext`) — never hard-fails. Re-run the seed after corpus edits.

## Infra gotchas (validated live)
- esbuild reports virtual files as `pastel:pastel:src/...` (double prefix). Always strip with
  `/^(?:pastel:)+/` — a single replace silently drops errors from per-screen attribution.
- A screen that bundles to EMPTY output must be an error, and incremental verification is only `ok`
  when EVERY screen has a bundle — otherwise broken artifacts pass silently.
- zod-less optional fields: models emit `null` for missing optionals — use `.optional().nullable()`.
- Models annotate component refs ("Card (highlighted)", "HabitList (check-in mode)") and rename keys
  ("name"→"screen"); normalization lives in `codegen/derive.ts` (`normalizeComponentRef`), applied
  in `stages/screen-composition.ts` (`normalizeCompositionRaw`), `stages/delta.ts`, AND
  `stages/gate.ts` (gate repairs re-introduce annotated refs — normalize on merge there too, or
  delta validation explodes later).
- Array caps: blueprint section components ≤8 (6 burned compose retries — models over-list),
  copy ≤24 with pre-normalization truncation (`normalizeCompositionRaw` slices). Interactions on
  the light model emits wrapper keys or screen-maps — `normalizeInteractionsRaw` unwraps.
- Visual QA cost accounting: NEVER count base64 screenshot chars at text pricing (was 10+ credits
  of phantom cost) — price each image ≈ 1100 tokens (4400 char-equivalents).
- visual QA is budget-reserved: `budgetAllowsModelCall(1.15)` — repairs must not starve the taste gate.
- Component system hard cap: `MAX_COMPONENT_CONTRACTS = 12` (16-contract sprawl doubled run cost).
- drizzle `db.execute` returns a pg `QueryResult` ({ rows }), not an array.
- Background jobs: tool-killed shells take children with them — `setsid nohup … < /dev/null & disown`
  keeps e2e runs alive; poll the log file.
- drizzle-agent_project_state has one column per planning artifact; `saveProjectState` upserts all.

## Validation tooling
- `npx tsx script/pastel-e2e.ts` — full live E2E (needs DATABASE_URL + MERGE_GATEWAY_API_KEY),
  32 assertions incl. per-artifact state persistence; followed by an auto delta run.
- `npx tsx script/pastel-delta-probe.ts "Add an X screen"` — delta-only probe.
- `npx tsx script/verify-repro.ts <runId>` — offline incremental verification of a past run's files.
- `npx tsx script/render-screens.ts [runId|latest]` — offline PNG screenshots (desktop+mobile) of a
  completed run's bundles into `screenshots/review/` — the taste-proof loop: always eyeball output.
- `npm test` — 32 pastel tests (contracts/roles/tags/schemas/derivations/sandbox/fallbacks).
- Measured cost (2026-08-01, 4 screens/12 components, ALL stages on-model, visual QA ×2): ~26
  credits (~$0.26) full run / ~8 credits delta. 1 credit = $0.01 (CREDIT_PER_DOLLAR=100) — an old
  publish.ts /5 bug overstated dollars 20×; fixed. `screenshots/review/` has eyeball-verified demos.

# Pastel Agent V6 — Design

V6 is a complete redesign of the Pastel design agent. v1–v5 and Agent Solo are
stripped out. The core idea: a **knowledge base of company design references**
(Nike, Uber, Apple, …) drives the visual quality, and a hybrid-model pipeline
turns a one-line idea into verified, on-brand screens.

## Pipeline

Seven phases, surfaced live in the redesigned agent panel:

```
discovery → brief → wireframe → build → assemble → present → review
```

| Phase | Agent | Model tier | Output |
|---|---|---|---|
| Discovery | `clarify-v6` | cheap + $0 scoring | Clarification questions + suggested companies (deterministic tag scoring) |
| Brief | `brief-v6` | mid | `ProductBrief` + attaches `megadesign.md` + company `design.md`(s) |
| Wireframe | `wireframe-v6` | mid | `WireframePlan` (screens + blocks) + `ComponentInventory` |
| Build | `planner-v6` + `builder-v6` | cheap, **parallel** | Per-component `ComponentUISpec` → JSX (pooled, bounded concurrency) |
| Assemble | `copy-v6` + deterministic `compose-v6` | cheap + $0 | Screen files, `src/data.js`, `src/styles.css`; sandbox verify + screenshots |
| Present | code | — | Screens go live in the UI (`screens` event) before review runs |
| Review | deterministic gates + `review-v6` | $0 + mid + vision | Code gate + geometry gate + visual review vs brief/design docs; bounded repair (≤2) |

## Knowledge base (`server/lib/pastel-agent/knowledge/`)

- `megadesign.md` — the universal design law: WCAG AA, token discipline,
  anti-slop, layout rhythm, component standards, copy quality, motion.
- `companies/<slug>/design.md` — a detailed, hand-authored design reference
  (personality, voice, color, type, components, signature patterns, screen
  recipes, rules, avoid-patterns).
- `companies/<slug>/manifest.ts` — the machine-readable companion, zod-validated
  at load. Compiled into compact prompt blocks (`compileCompanyBlock`) so agents
  get the distilled essence, not the whole prose document (token efficiency).
- Registry (`knowledge/index.ts`): `listCatalog` (gallery), `scoreCompanies`
  (deterministic suggestions), `resolveCompanyTheme` (manifest → CSS vars).

Shipping companies: **apple, nike, uber, airbnb, spotify, stripe, notion, netflix**
— eight distinct archetypes. Adding one = authoring `design.md` + `manifest.ts`.

## Why it's optimized

- **Deterministic composition** (`compose-v6.ts`): screens are code-composed
  from generated components — the model never draws layout. Known-good block
  recipes carry the reliability.
- **Deterministic gates** (`checks/audit.ts`, `checks/geometry.ts`): contrast,
  anti-slop, imports, overflow, overlap — $0, file-targeted fixes.
- **Parallel component work**: every component is planned and built in a
  bounded pool (`PASTEL_BUILDER_CONCURRENCY`, default 4).
- **Incremental verification**: repair rounds only re-compile screens whose
  dependency closure changed.
- **Knowledge compiled to prompt blocks**: full docs persisted, distilled rules
  injected.

## Why it's cost-effective

- **Two models only** (`gateway.ts`): `anthropic/claude-haiku-4-5` (cheap) for the
  many parallel clarify/planner/builder/copy/assemble/repair calls;
  `openai/gpt-5.4-mini` (mid) for the few judgment stages — brief, wireframe,
  review. Vision review is one pass at the end. Every role is env-overridable.
- **Credit holds**: pre-run estimate held, actual usage charged, capped.
- **Bounded repair** (`PASTEL_MAX_REPAIR_CYCLES`, default 2), budget-capped.

## Files

```
server/lib/pastel-agent/
├── engine.ts / orchestrator-v6.ts / types.ts   ← pipeline + wire contract
├── gateway.ts / run-store.ts / sandbox.ts / screenshots.ts / compile.ts
├── contract.ts / anti-slop.ts / checks/        ← shared infra + gates
├── base-components/                            ← 19 adaptation exemplars
├── knowledge/                                  ← megadesign.md + companies/
├── schemas-v6.ts                               ← all inter-agent schemas
├── compose-v6.ts                               ← deterministic screen composer
└── agents/                                     ← clarify/brief/wireframe/planner/builder/copy/review
```

Client: `use-pastel-agent.ts` (7-phase hook), `CanvasPage.tsx`, and
`components/agent/` (`AgentRunCard`, `CompanyGallery`, `DocsPanel`, …).

## API

- `GET /api/pastel-agent/knowledge` — company gallery
- `POST /api/pastel-agent/clarify` — questions + `suggestedCompanies`
- `POST /api/pastel-agent/generate` — start a run (answers carry `inspiration`)
- `GET /api/pastel-agent/runs/:runId/events` (SSE) · `projects/:id/state` · `runs/:id/preview/:screen`

## Validation

- `npm test` — v6 knowledge/schemas/compose/sandbox/review tests
- `npx tsx script/render-screens.ts [runId|latest]` — offline screenshots
- `npx tsx script/verify-repro.ts <runId>` — offline incremental verification

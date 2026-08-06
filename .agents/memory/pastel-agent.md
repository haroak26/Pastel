---
name: Pastel Agent V6 (knowledge-base pipeline)
description: How the Pastel design agent works — the v6 knowledge-base pipeline (7 phases, hybrid model tiers, company design.md + megadesign.md knowledge base, deterministic compose + gates), gateway reliability rules, cost ledger/settlement, bounded repair loop, and infra gotchas.
---

## Rule
The Pastel Agent (`server/lib/pastel-agent/`) is a **7-phase knowledge-base pipeline** orchestrated by
`orchestrator-v6.ts`: discovery → brief → wireframe → build → assemble → present → review. The visual
quality is carried by the **knowledge base** (`knowledge/`): a universal `megadesign.md` law plus
per-company `design.md` + `manifest.ts` references (apple, nike, uber, airbnb, spotify, stripe,
notion, netflix). Models select/specify/adapt; code composes, verifies, and gates. TWO models only:
cheap `anthropic/claude-haiku-4-5` for the many parallel clarify/planner/builder/copy/assemble/repair
calls, mid `openai/gpt-5.4-mini` for brief/wireframe/review/visualReview. Every role env-overridable.
The screens go live in the UI (`screens` SSE event) at the Present phase — BEFORE review runs.

## Stage → artifact contract
- **Discovery** (`agents/clarify-v6.ts`): suggestions are DETERMINISTIC tag scoring
  (`scoreCompanies`) — $0. Questions from one cheap call. The validator parses ONLY
  `{ questions: [...] }` — never the full `clarifyResultSchema`, because the model must not be asked
  to emit `suggestedCompanies` (it does, with string values, and fails zod). The panel gallery (`GET
  /api/pastel-agent/knowledge`) is where users pick the inspiration company; the answer keys are
  `inspiration` (primary slug) and `inspirationSecondary` (comma list).
- **Brief** (`agents/brief-v6.ts`, mid): → `ProductBrief` (zod `productBriefSchema`). Persists the
  brief doc plus `megadesign.md` and each attached company `design.md` under `docs/design/`. If the
  user picked no inspiration, the brief falls back to the top-scored company.
- **Wireframe** (`agents/wireframe-v6.ts`, mid): → `WireframePlan` + `ComponentInventory`. The
  company's `screenRecipes` are the strong prior; `fallbackWireframe` maps brief screen purposes to
  recipes deterministically.
- **Build** (`agents/planner-v6.ts` + `agents/builder-v6.ts`, cheap, `PASTEL_BUILDER_CONCURRENCY`=4):
  per component plan (spec) then build (JSX adapting `base-components/*` exemplars). Never ships an
  exemplar verbatim.
- **Assemble** (`agents/copy-v6.ts` + deterministic `compose-v6.ts`): screens are CODE-COMPOSED from
  wireframes + generated components + company-voiced copy + mock data. `src/data.js` +
  `src/styles.css` compiled from `resolveCompanyTheme` tokens. Sandbox verify (esbuild + SSR) and
  headless screenshots run inside this phase.
- **Review** (deterministic gates + `agents/review-v6.ts`): `checks/audit.ts` (contrast/slop/
  imports) + `checks/geometry.ts` (overflow/overlap/fonts) are $0 ground truth; `runReview` (mid,
  static) + `runVisualReview` (vision, screenshots vs brief/design docs) → `mergeReviewResults`
  (sandbox errors force RETURN_TO_BUILDER). Bounded repair ≤`PASTEL_MAX_REPAIR_CYCLES`=2.
- **Present** (before Review): after sandbox verify + screenshots, the orchestrator emits the
  `screens` SSE event and the client shows the verified screens live; then review runs. Manifest
  carries screens, docs, quality (score/repairs), company slug, cost ledger.

## Persistence + wire contract
Docs under `docs/brief|design|planning|review/*`; kinds: `brief`, `megadesign`, `company-design`,
`wireframe-plan`, `component-inventory`, `copy-plan`, `gate-report`, `review-result`. Client phases:
`discovery/brief/wireframe/build/assemble/present/review` (present BEFORE review). SSE: `phase`,
`title`, `doc`, `file`, `activity`, `screens`, `done`, `error`. Bundles at `.build/<S>.js`, previews
at `GET /api/pastel-agent/runs/:runId/preview/:screen`.

## Gateway reliability (hard-won rules)
- Transient faults (429 / 5xx / network) retry ≤2 times with backoff; content errors NEVER retry.
- `chatJSON` corrective-repairs BOTH parse and validation failures; `onRawFailure` exposes the last
  bad payload. Truncation escalates output budget ×2.5 ONCE, capped per role (`wireframe` 16000,
  default 12000).
- Thinking config skipped for all roles by default (`PASTEL_THINKING_BUDGET` enables it).
- `__setTestClient()` is the test seam for stubbing `responses.create`.

## Cost ledger + settlement
`onUsage` records every call; `lib/ledger.ts#ledgerFromUsage` prices it (real `usage`/
`routing.cost_usd` preferred; **image blocks priced at 1100 tokens each**). `releaseHold(holdId,
min(actual, holdAmount))` — charged actual usage capped at the pre-run estimate.

## Infra gotchas (validated live)
- **Manifest import depth**: company `manifest.ts` files live two levels under `knowledge/`, so they
  import `../../manifest-schema` — NOT `../manifest-schema`.
- **Runtime asset paths**: the CJS bundle (`dist/server/index.cjs`) has empty `import.meta.url`.
  Use `asset-paths.ts#pastelAssetRoot()` for any on-disk read (design.md, megadesign.md,
  base-components/*.jsx). Falls back to `process.cwd()/server/lib/pastel-agent`.
- `matchAll` requires a global regex — the audit uses `match` for HEX_RE.
- Screen default-export function is named `Screen()` to avoid colliding with lucide icons imported
  by the same name (e.g. a screen id "home" → icon `Home`).
- `auditFiles` skips `src/data.js` (row ids like "#1234" are data, not colors); HEX_RE requires a
  hex letter so digit-only ids don't match.
- Every audited color pair (fg/bg, muted, primary×2, accent, success, warning) must hit WCAG AA —
  the 8 manifests were tuned accordingly (`contrast-check` in the v6 test).
- All `screenRecipes` blocks need ≥3 entries (schema `min(3)`).
- Background jobs: `setsid nohup … & disown` keeps e2e runs alive; poll the log file.
- tsconfig incremental cache goes stale silently: `rm -f node_modules/typescript/tsbuildinfo` FIRST
  when type errors look phantom.

## Validation tooling
- `npm test` — v6 knowledge/schemas/compose/sandbox/review contracts (`server/tests/pastel-v6.test.ts`)
  plus the shared sandbox tests.
- `npx tsx script/render-screens.ts [runId|latest]` — offline PNG screenshots of a completed run.
- `npx tsx script/verify-repro.ts <runId>` — offline incremental verification of a past run's files.

## V10 (figma-level pass) — what changed
- **Layout law**: `lib/layout.ts` — section padding comes from a rhythm
  ladder (`sectionPad`/`padCls`); recipes never hardcode `py-N`; geometry gate
  now audits rhythm/flush/hero-scale and its issues flow into the gate
  (repairable), not just activity.
- **Layout structures**: `lib/ux-design.ts#canonicalStructure` — home
  `catalog-classic|catalog-rail|catalog-featured`, detail
  `detail-classic|detail-asymmetric`; `catalog-rail` renders a sticky 300px
  left rail (`lg:grid-cols-[300px_1fr]`); new `list:featured` recipe.
- **Scenes**: `lib/scenes.ts` — deterministic per-domain SVG scene art baked
  into screens as a `SCENES` const (recipes return `prelude`); picsum is gone.
- **Data isolation**: `src/data.js` emits `DATA.screens.<id>` views; screen
  files may ONLY reference their own view — content gate flags bare `DATA.*`
  (test4 "catalog on detail" root cause: gallery was `DATA.rows.slice(0,5)`
  = 5 different listings + picsum failures).
- **Knowledge**: companies auto-register by folder scan
  (`knowledge/companies/<slug>/manifest.ts`, dynamic import — works under
  tsx; bundled manifests are the prod baseline); optional `preview.png` +
  `references/*.png` shown in the gallery (`GET
  /api/pastel-agent/knowledge/:slug/image/:file`) and attached to the visual
  review as brand-fidelity ground truth.
- **Creative system**: 8 new base components (RatingStars, AmenityGrid,
  MapCard, StatRing, MediaStrip, PriceCard, ScheduleList, ToolbarFilter);
  inventory 6–8; planner spec has `designIntent`; builder first pass runs at
  temperature 0.5.
- Inventory schema requires 6–8 components; planner variants 2–5.

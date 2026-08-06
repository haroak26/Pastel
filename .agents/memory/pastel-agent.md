---
name: Pastel Agent V14 (knowledge-base pipeline)
description: How the Pastel design agent works — the v14 pipeline (design-token agent before the brief, data agent writes ALL content, brief selects references from the full catalog, product-led two-screen model, vision-first review, hybrid tiers), gateway reliability rules, cost ledger/settlement, bounded repair loop, and infra gotchas.
---

## Rule
The Pastel Agent (`server/lib/pastel-agent/`) is a **knowledge-base pipeline** orchestrated by
`orchestrator-v6.ts`: discovery → **design** → brief → **data** → wireframe → build → assemble →
present → review. The visual quality is carried by the **per-run design tokens** plus the knowledge
base (`knowledge/`): a universal `megadesign.md` law plus per-company `design.md` + `manifest.ts`
references. Models select/specify/adapt; code composes, verifies, and gates. TWO models only:
cheap `anthropic/claude-haiku-4-5` for the mechanical stages (clarify/planner/builder/repair), mid
`openai/gpt-5.6-luna` for every judgment stage (design/data/brief/wireframe/copy/review/visualReview).
Every role env-overridable. The screens go live in the UI (`screens` SSE event) at the Present
phase — BEFORE review runs.

## V14 (final — de-Airbnb, product-led, per-run content) — the critical rules
- **Design agent first** (`agents/design-v14.ts`): creates the run's OWN token system (brand colors,
  radius, type scale, control ladder, fonts) from prompt + answers + visual reference + the top-scored
  company as a HINT. Never copies a company manifest into the theme by default. Code-side
  `validateDesignTokens` enforces WCAG-AA; on failure → `designTokensFromManifest` (deterministic
  fallback). `themeFromDesignTokens` emits the same `ResolvedTheme`/`cssVars` shape —
  compile/compose/sandbox untouched. `--control-*` comes from the theme now (hardcoded block removed
  from compile.ts; resolveCompanyTheme emits 32/40/48).
- **Data agent after the brief** (`agents/data-v14.ts`, Luna): writes ALL page content — people,
  metrics (4, distinct labels), series, rows (unique names), activity, detail fields/values,
  settings, search/empty states, reviews + reviewHeading (the "Guest reviews" copy is generated per
  product now), trustItems, primaryCta/homeCta, priceSuffix. `dataPlanSchema` +
  `sanitizeDataPlan` (duplicate labels/rows fatal, currency only in finance/shopping domains).
  Deterministic fallback = the domain packs (`lib/domains.ts`), which ALSO fill `mockDataset` so the
  fallback dataset is complete. Composer reads `data.*` first, const maps only as fallbacks.
- **Brief selects from the FULL catalog** (`agents/brief-v6.ts`): the model sees every registered
  company and picks primary + secondary with rationale; user gallery pick is a strong prior. NO
  hardcoded `?? "apple"` fallback — deterministic fallback is `scoreCompanies` top. Model output is
  validated against the catalog (`availableSlugs.includes(primary)`).
- **Product-led two-screen model** (`lib/ux-design.ts`): `isCatalogHome`/`isMediaDetail`/
  `detailWantsReviews` derive requirements from the screen's OWN purpose text. Search+grid forced
  ONLY for browse/marketplace products; gallery+booking-pane+reviews ONLY for media-rich/commerce
  detail. Home structures: `dashboard-led|feed-led|workspace-led|catalog-classic|rail|featured`;
  dominant moment product-led (`dominantMomentFor`).
- **Product-led wireframe fallback** (`agents/wireframe-v6.ts`): routes by domain pack
  (fitness→coaching dashboard, ecommerce/rentals/travel→catalog, media→hero+carousel,
  social→feed+thread, everything else→dashboard+record pane). A non-browse product NEVER gets
  search/grid/gallery/reviews.
- **Composer** (`compose-v6.ts`): the Airbnb booking card (price/dates/guests + "Verified host")
  renders only for `CATALOG_DOMAINS` (rentals/travel/ecommerce); other products get a focused
  record card. `megadesign.md` §8 detail law is role-agnostic.
- **Next-gen review** (`agents/review-v14.ts`): vision-first. Static review (Luna) judges code with
  the MEASURED geometry report + per-screen block/component context baked into the prompt
  (`geometrySummary`, `screenContext`). Visual review (Luna vision) pairs each screenshot with the
  wireframe blocks it must render + the components that must be visible + its geometry, and judges
  spacing, missing components, duplicated components, and flow (`reviewV14Checklist`).
  `checks/review-v14.ts#auditScreenComposition` (→ gate) flags duplicate mounts of one component on
  a screen (HIGH) and planned-but-unmounted components. `mergeReviewResults` reused from review-v6.
- Wire contract: `PastelPhase`/client `AgentPhase` = discovery/design/brief/data/wireframe/build/
  assemble/present/review; manifest docs include DesignTokens.json + DataPlan.json; brandKit from
  tokens.

## Stage → artifact contract
- **Discovery** (`agents/clarify-v6.ts`): suggestions are DETERMINISTIC tag scoring
  (`scoreCompanies`) — $0. Questions from one cheap call. The validator parses ONLY
  `{ questions: [...] }` — never the full `clarifyResultSchema`, because the model must not be asked
  to emit `suggestedCompanies` (it does, with string values, and fails zod). The panel gallery (`GET
  /api/pastel-agent/knowledge`) is where users pick the inspiration company; the answer keys are
  `inspiration` (primary slug) and `inspirationSecondary` (comma list).
- **Design** (`agents/design-v14.ts`, mid): → `DesignTokens` (persisted
  `docs/design/DesignTokens.json`, kind `design-tokens`). WCAG-AA validated in code; manifest-derived
  deterministic fallback. Runs BEFORE the brief; theme (cssVars) is fixed here for the whole run.
- **Brief** (`agents/brief-v6.ts`, mid): → `ProductBrief` (zod `productBriefSchema`). Selects
  reference companies from the FULL catalog; persists the brief doc plus `megadesign.md` and each
  attached company `design.md` under `docs/design/`. If the model fails, the brief falls back to the
  top-scored company.
- **Data** (`agents/data-v14.ts`, mid): → the run's MockDataset (persisted `docs/planning/
  DataPlan.json`, kind `data-plan`) — ALL page content, written per run. `sanitizeDataPlan` is the
  deterministic net; the domain packs are the fallback. `s.data` is set once here and shared by
  UX/planner/builder/copy/compose/repair.
- **Wireframe** (`agents/wireframe-v6.ts`, mid): → `WireframePlan` + `ComponentInventory`. The
  company's `screenRecipes` are the strong prior; `fallbackWireframe` is domain-led (see V14 rules).
- **Build** (`agents/planner-v6.ts` + `agents/builder-v6.ts`, cheap, `PASTEL_BUILDER_CONCURRENCY`=4):
  per component plan (spec) then build (JSX adapting `base-components/*` exemplars). Never ships an
  exemplar verbatim.
- **Assemble** (`agents/copy-v6.ts` (mid) + deterministic `compose-v6.ts`): screens are
  CODE-COMPOSED from wireframes + generated components + company-voiced copy + the data agent's
  content. `src/data.js` + `src/styles.css` compiled from the design-token theme. Sandbox verify
  (esbuild + SSR) and headless screenshots run inside this phase.
- **Review** (deterministic gates + `agents/review-v14.ts`): `checks/audit.ts` (contrast/slop/
  imports) + `checks/geometry.ts` (overflow/overlap/fonts/rhythm/flush) + `checks/review-v14.ts`
  (duplicate/missing components) are $0 ground truth; `runReview` (mid, static, geometry-fed) +
  `runVisualReview` (vision, screenshots vs per-screen wireframe context) → `mergeReviewResults`
  (sandbox errors force RETURN_TO_BUILDER). Bounded repair ≤`PASTEL_MAX_REPAIR_CYCLES`=2.
- **Present** (before Review): after sandbox verify + screenshots, the orchestrator emits the
  `screens` SSE event and the client shows the verified screens live; then review runs. Manifest
  carries screens, docs, quality (score/repairs), company slug, cost ledger, brandKit (from tokens).

## Persistence + wire contract
Docs under `docs/brief|design|planning|review/*`; kinds: `brief`, `design-tokens`, `megadesign`,
`company-design`, `data-plan`, `wireframe-plan`, `component-inventory`, `copy-plan`, `gate-report`,
`review-result`. Client phases:
`discovery/design/brief/data/wireframe/build/assemble/present/review` (present BEFORE review). SSE:
`phase`, `title`, `doc`, `file`, `activity`, `screens`, `done`, `error`. Bundles at `.build/<S>.js`,
previews at `GET /api/pastel-agent/runs/:runId/preview/:screen`.

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
min(actual, holdAmount))` — charged actual usage capped at the pre-run estimate. The estimate
includes one `design` mid-tier call.

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
  the manifests were tuned accordingly (`contrast-check` in the v6 test).
- All `screenRecipes` blocks need ≥3 entries (schema `min(3)`).
- `HARDCODED_ZEROS` uses `(?<!=)` so `aria-valuemin={0}` attributes don't trip; `\bworkspace\b` is
  exempt for `productivity` domain products.
- Background jobs: `setsid nohup … & disown` keeps e2e runs alive; poll the log file.
- tsconfig incremental cache goes stale silently: `rm -f node_modules/typescript/tsbuildinfo` FIRST
  when type errors look phantom.

## Validation tooling
- `node --import tsx --test server/tests/pastel-v6.test.ts` — v14 knowledge/schemas/compose/sandbox/
  review contracts (58 tests incl. v14 de-Airbnb + v14b data/review regressions) plus the shared
  sandbox tests.
- `npx tsx script/render-screens.ts [runId|latest]` — offline PNG screenshots of a completed run.
- `npx tsx script/verify-repro.ts <runId>` — offline incremental verification of a past run's files.

# Maxi Agent Versions (formerly Pastel Agent)

This document records the agent's architecture rather than only its release
labels. Version names are historical milestones; the active implementation is
the **Maxi Agent v23 ("Endgame")** described below. Everything before v23 is
historical record — v22 and earlier pipelines were retired in the v23 rebuild.

## Maxi Agent V23 - "Endgame" (Active)

V23 retires Picasso and the sequential waterfall (`discovery → design → brief
→ data → wireframe → ux → build → assemble → present → review`, ~9 serial
network round-trips ≈ 8 minutes) in favor of a dependency-graph wave executor.
The agent lives at `server/lib/maxi-agent/`; the API moved to
`/api/maxi-agent/*` (no DB migration — the schema table names were always
generic).

### New

- **Wave executor** (`orchestrator.ts`): four waves plus bounded repair.
  Wave 0 (<20s): discovery is deterministic nearest-neighbor company scoring
  (`knowledge/index.ts::scoreCompanies`, no model call) and design tokens +
  product brief are ONE combined cheap-tier call (`agents/plan.ts`, was two
  MID calls). Wave 1 (<15s): deterministic mode classification, then ONE
  schema-constrained call producing the compact **layout genome**
  (`agents/genome.ts`, `lib/genome.ts`) — screens → regions → component
  slots → dominant moment → pairing hints; the mode-scoped vocabulary means
  illegal blocks (hero on a track product, search on a dashboard) are never
  offered, so they cannot be emitted. Wave 2 (<45s): component build fans out
  at `MAXI_COMPONENT_CONCURRENCY` (default 6); content/copy run concurrent
  with the build; each screen composes as soon as ITS components land (the
  Picasso parallelism win, implemented for real). Wave 3 (<30s): one CSS
  compile (the only serialization point), then per-screen bundle + sandboxed
  smoke + sandboxed render + geometry + gates + visual review, all concurrent
  against the warm e2b pool. Wave 4: one targeted repair pass, capped at 1
  retry; persistent failures ship FLAGGED (`done_needs_review`), never
  silently swallowed.
- **Layout genome** (`lib/genome.ts`): the wireframe prompt is gone. The
  genome is a small validated JSON document (screens → regions → component
  slots → dominant moment → pairing hints) produced by one cheap-tier call;
  the V21 deterministic placement solver (`lib/layout-plan.ts`) consumes it
  directly. `checks/layout.ts` audits composed output against the genome
  contract (mode-scoped vocabulary compliance + placement).
- **Sandboxing consolidated on e2b** (`lib/sandbox-render.ts`,
  `sandbox-image/`): generated code NEVER executes on the app server. esbuild
  compiles locally (a compiler, not execution); the smoke render and the
  Chromium screenshot + geometry render run inside e2b sandboxes from the
  `maxi-agent-v23` template, which bakes Node 20 + Chromium + the pinned JS
  toolchain. A cold sandbox boots in low seconds — the old
  `apt-get install` + `npm install puppeteer` cold-start tax is gone, and a
  warm pool (default 3, TTL 10 min) shaves the rest. Every in-sandbox command
  is logged; the cold-start regression guard is
  `server/tests/sandbox-e2b.test.ts` (an install command in the log fails
  the test). Template rebuild:
  `E2B_API_KEY=... npx tsx server/lib/maxi-agent/sandbox-image/build.ts`.
- **Fidelity + prop-contract framework wired in** (carried from the retired
  Picasso): `checks/fidelity.ts` audits every built component against the
  taxonomy-tiered contract — the from-scratch structural contract
  (self-contained, no hex, default export, slot utilities) plus the
  uniqueness ceiling vs the vendored base library, with the tier floors
  applied when a spec anchors a base (`basedOn`). Verdicts land in
  `docs/review/FidelityReport.json`. Composed screens are prop-audited and
  auto-fixed (`lib/prop-validation.ts`) before verification — crash-prone
  chrome-only mounts become safe `data-mount` wrappers —
  `docs/review/PropContractReport.json`. The base-anchored generator
  (`lib/fidelity.ts::generateComponentWithFidelity`) is the builder's repair
  fallback for transient generation failures.
- **Knowledge base rewritten** (`knowledge/`): all 28 company `design.md`
  docs follow the Picasso format (when-to-use, personality, color, type,
  spacing, radius, elevation, iconography, signature patterns, motion, voice,
  and an explicit no-reproduce clause) with ZERO page-recipe language; the
  screenshot references (`references/*`, `preview.png`, ~23MB) are deleted.
  A deterministic retrieval index (`knowledge/retrieval.ts`) serves only the
  company doc + mode-relevant law slices (bounded per file) — the genome
  stage's knowledge slice dropped from ~267K chars to ~42K chars.
- **Timing + cost instrumentation**: real per-wave wall time persists to
  `docs/timing/TimingReport.json` + the manifest (`timing`), model-call
  counts per role (`callsByRole` — the Wave-0 merge lever), and knowledge
  slice sizes (`kbSlices` — the retrieval lever).

### Acceptance

The v23 release gate is the e2e harness (`server/tests/maxi-e2e-modes.test.ts`,
`MAXI_E2E=1`): one cold run per product mode (browse, transact, track, create,
operate, learn, social) asserting ≥2 verified screens, four-wave timing, real
gate/fidelity/prop verdicts, and recorded kb-slices. The deterministic suite
(`npm test`) covers the genome schema/vocabulary, fidelity floors (both
directions), prop-contract audit + auto-fix, dependency closure, knowledge
retrieval, and the sandbox cold-start regression guard.

### Validation Standard

1. `npx tsc --noEmit` — no agent errors (the repo's other, pre-existing
   product errors are unrelated).
2. `npm test` — deterministic suite green (agent tests + the untouched
   product tests; the pre-existing Stalwart/inbound-email failures are
   environment/module issues outside the agent).
3. `MAXI_E2E=1 node --import tsx --test server/tests/maxi-e2e-modes.test.ts`
   — the release gate.

### Active Files

- `orchestrator.ts` is the wave executor; `engine.ts` the production entry.
- `agents/plan.ts` (Wave 0 merge), `agents/genome.ts` (Wave 1), `lib/genome.ts`
  (genome schema + vocabulary + deterministic derivation).
- `sandbox.ts` + `lib/sandbox-render.ts` + `sandbox-image/` (the only
  execution path), `screenshots.ts` (sandboxed capture).
- `checks/fidelity.ts`, `checks/props.ts`, `checks/layout.ts`,
  `lib/fidelity.ts`, `lib/prop-validation.ts`, `lib/base-components.ts`.
- `knowledge/retrieval.ts` + `knowledge/companies/*/design.md` +
  `knowledge/design-laws/` + `knowledge/component-law/`.

---

## V22 and earlier (Historical)

The following sections are the historical record of the retired pipelines
(Pastel Agent v6-v22, Picasso v2-v8). They describe architecture that no
longer exists in `server/lib/maxi-agent/` — notably the sequential waterfall
orchestrator, the prose wireframe stage with its fragile `BLOCK_CATALOG`, the
local unsandboxed Chromium render path, and the Picasso cold-start
install-tax sandbox. They are preserved for provenance.

## v17 - Figma-Quality Composition

### New

- **Product context classifier** (`classifyContext`): distinguishes app,
  workspace, dashboard, feed, editor, catalog, marketing, and onboarding
  contexts. Marketing composition (centered heroes, oversized CTAs, footers,
  "Sign in"/"Get started" topbar links) is ILLEGAL on app screens.

- **Navigation policy** (`lib/navigation.ts`): navigation is a product-level
  decision, never a wireframe default. Desktop app screens default to sidebar
  (dashboards/workspaces) or topbar (lightweight products). Tabbar is mobile-
  only. Footer navigation is ILLEGAL on app screens.

- **Surface vocabulary** (`lib/composition.ts`): 12 surface types replace the
  card-centric model. Tonal-band (hero/CTA default), soft-wash (stats/charts),
  divided-list (activity/rows/sequences), inset-panel (one per detail), plain,
  accent-block, split-panel, editorial-tile, metric-cluster, floating-action,
  hairline-section, and card (sparingly). "Card" is one tool among many.

- **Composition-aware layout** (`lib/layout.ts`): a full frame spec (page
  gutter, column gap, module gap, section gap, subsection gap, content width,
  padding hierarchy) replaces alternating section-padding. Spacing derives from
  frame/column/group relationships, not mechanical alternation.

- **Brand kit** (`lib/brand-kit.ts`): the design agent now produces a
  validated brand kit with primary/accent/supporting colors, corner language,
  border policy, shadow policy, accent-frequency rules, signature moves,
  forbidden accent colors, and CSS variable exports. The review board judges
  brand coherence against this kit.

- **Density contract** (`lib/density.ts`): context-aware minimums for module
  count, populated rows, metrics, custom components, surface variety, and
  viewport content fill. Prevents the "sparse placeholder" problem.

- **V17 design plan** (`contract.ts`): product context × mode determines
  structure, navigation, footer policy, and fingerprint. Zero-cost review
  board adds context gating, nav legality, marketing leakage detection,
  density gates, and brand-kit coherence.

- **Updated anti-slop** (`anti-slop.ts`): added hard rules for navigation
  (never tabbar as default, never footer on app screens), surfaces (do not
  default to bordered cards), context (app is the default, not marketing),
  and density (minimum populated content).

- **Expanded UX schema** (`schemas.ts`): `ProductContext`, `BrandKit`,
  `V17LayoutPlan`, `V17SectionPlan`, `V17ScreenLayout`, `V17NavDecision`,
  `V17SectionRelationship`, expanded surface types, column layouts.

### Changed

- `lib/layout.ts`: rewritten with V17 frame spec, `v17ScreenLayout`,
  `sectionPadV17` (relationship-aware), backward-compatible PadContext.

- `lib/ux-design.ts`: added `classifyContext` (deterministic product-context
  classification), updated `SURFACE_OF` map with v17 surface types.

- `agents/design.ts`: produces `brandKit` alongside tokens + visual intent.

- `agents/wireframe.ts`: block catalog updated with v17 surfaces, V17
  composition rules, navigation policy, marketing leakage prevention.

- `agents/ux.ts`: UX prompt updated with product context, v17 surfaces,
  column layouts, brand kit awareness.

- `agents/review.ts`: v17 rubric (9 weighted categories), v17 blocking
  defects, brand-kit coherence integration.

- `compose.ts`: uses `buildV17DesignPlan`/`enforceV17Plan`, product context
  aware, nav enforcement, footer suppression on app screens, tabbar limited
  to mobile.

- `contract.ts`: renamed v16 types to v17 with backward-compat aliases,
  added `classifyProductContext`, `auditV17Review` with context/nav/density/
  brand-kit gates.

### Files

New:
- `server/lib/pastel-agent/lib/composition.ts`
- `server/lib/pastel-agent/lib/brand-kit.ts`
- `server/lib/pastel-agent/lib/navigation.ts`
- `server/lib/pastel-agent/lib/density.ts`
- `server/tests/pastel-v17.test.ts`

Modified:
- `server/lib/pastel-agent/schemas.ts`
- `server/lib/pastel-agent/contract.ts`
- `server/lib/pastel-agent/lib/layout.ts`
- `server/lib/pastel-agent/lib/ux-design.ts`
- `server/lib/pastel-agent/anti-slop.ts`
- `server/lib/pastel-agent/agents/design.ts`
- `server/lib/pastel-agent/agents/wireframe.ts`
- `server/lib/pastel-agent/agents/ux.ts`
- `server/lib/pastel-agent/agents/review.ts`
- `server/lib/pastel-agent/compose.ts`

### Acceptance

v17 passes when:
- Test matrix produces distinct fingerprints across unrelated product types
- Desktop app screens default to sidebar or topbar (never tabbar)
- Footer only renders on marketing/onboarding contexts
- Marketing heroes are rejected on app screens
- Brand kit validates coherence and forbids default indigo/blue accents
- Density gates catch sparse composition
- Backward-compatible with all existing v16 tests

## Picasso V7 - Hardened Orchestration (picasso/pipeline)

V7 is the reliability upgrade for the Picasso agent pipeline
(`server/lib/pastel-agent/picasso/pipeline/`), built in response to a
reproduced E2E abort where `runArchitecture` dropped four trailing
`brandKit` prose fields, the corrective retry failed the same way, and the
whole run died with zero diagnostics and zero screens. The design-system
architecture (base components + manifest + customization) is unchanged —
V7 fixes the orchestration layer around it so a model occasionally
underfilling a large structured response can never kill a paid-for run.

### Changed

- **Stage 3 split into two focused calls** (`stage-3-wireframe.ts`): one
  STRUCTURE call (screens + globalRegions + component manifest, the part
  that needs the design-law/component-law context) and one smaller BRAND
  KIT + UX call (brandKit + uxDesignPlan) that receives the finished
  component manifest as grounding. Each call has its own schema, its own
  bounded corrective retry, and its own model budget (new `brandKit` role
  in `gateway.ts`).
- **Prose fields default, structural fields hard-validate**: every
  descriptive leaf in the stage-3 schemas, discovery, and directions now
  carries a deterministic `.default()` (token/seed-derived where possible);
  structural fields (screens/components arrays, refs, baseComponent names,
  taxonomy enums, accent colours) still fail loudly. The exact V6 failure
  shape — `brandKit.spacingRules.componentPadding` etc. missing — is now
  absorbed by defaults with a greppable `[pastel-agent]` warning.
- **`chatJSON` salvage phase** (`gateway.ts`): before the hard throw, a
  caller-supplied `repair` hook receives the partially-parsed payload
  (parse failures pass the raw text), fills missing fields, and
  re-validates; a `fallback` supplies a deterministic last-resort value.
  Only structural failures reach the throw.
- **Orchestrator degrades, never hard-aborts** (`orchestrator.ts`):
  discovery, design, wireframe, component generation, and screen
  composition are wrapped in try/catch. Failures emit activity, record a
  degradation, and return a valid `PicassoPipelineOutput` with
  `success: false` — partial artifacts (discovery, directions, tokens,
  motion spec, docs) are preserved. Any degradation flips `success` and is
  surfaced in `FinalReport.md` (new "Degradations" section in
  `stage-8-finalize.ts`) so a degraded run is never mistaken for a clean
  one.
- **E2E harness never loses partial-run evidence**
  (`picassotests/test6/e2e-run.ts`): `runOnce` catches pipeline throws,
  records the furthest phase reached, and always writes `run-summary.json`
  (status `aborted`, stage, error, model-call count, cost). Aborted runs
  appear in `ISSUES.md` as "reached stage X, spent $Y, failed with Z"
  instead of the opaque "Run never completed".
- **Taxonomy-aware component divergence bar** (`stage-4-build.ts`):
  molecules/organisms must be <90% similar to their base source (sampled
  non-overlapping chunk similarity) and keep theme-slot discipline;
  primitives may stay close to base. Vague `customization` instructions
  are replaced deterministically with token-derived design notes
  (`ensureCustomizationSpecificity` in stage 3) before they reach the
  builder.

### Acceptance

V7 is verified by:

- `server/tests/picasso-v7.test.ts` — 13 unit tests covering the repair
  path, prose defaulting, structural hard-fails, customization
  specificity, the taxonomy divergence bar, and the two-call stage-3 split
  against a stubbed gateway.
- The three-brief E2E protocol: `MERGE_GATEWAY_API_KEY=... E2B_API_KEY=...
  npx tsx picassotests/test6/e2e-run.ts "<brief>"` three times with three
  different briefs (or one `PASTEL_E2E_MATRIX` invocation), each ending in
  `ALL ASSERTIONS PASSED` and `ISSUES.md` reporting
  `**Overall:** ALL ASSERTIONS PASSED`.

## Picasso V8 - Parallel Framework, Wireframe Gate, Fidelity Contract

V8 is the speed + reliability + fidelity upgrade for the Picasso pipeline
(`server/lib/pastel-agent/picasso/pipeline/`), built against the reproduced
`agentv7` E2E defects (`picassotests/agentv7/DIAGNOSIS.md` +
`IMPROVEMENTS.md`). The V7 degradation machinery is kept; V8 adds:

### New

- **Parallel framework** (`orchestrator.ts`): per-screen pipelines —
  compose → smoke runs concurrently for all screens (cap 4), then
  render → visual QA concurrently for all screens (renders serialized
  through the one E2B sandbox). Component build stays capped at 6. The
  only forced serialization is the one-time Tailwind CSS compile between
  the two screen passes (the content glob needs the final screen sources).
- **Wireframe confirmation gate** (`lib/wireframe-review.ts`,
  `wireframe-gate.ts`): a hard blocking checkpoint after architecture and
  before any build work. New `wireframe-review` phase + `wireframes` SSE
  event; the client posts approve/revise/cancel to
  `POST /api/pastel-agent/runs/:runId/wireframe-decision`. Revisions are a
  bounded re-architecture call (no re-run of discovery/tokens); cancel
  refunds the credit hold; `PASTEL_WIREFRAME_REVIEW_TIMEOUT_MS` (10 min)
  auto-cancels a silent run. Approval is checkpointed so a kill/resume
  re-enters the gate without re-paying architecture model calls.
- **Enforced shadcn fidelity floors** (`stage-4-build.ts`): the
  chunk-similarity metric from COMPONENT_ANALYSIS.md is now a build-time
  gate — primitive ≥ 85% (reject → stricter retry → literal-base fallback),
  atom ≥ 65% (retry), molecule ≥ 40% (report), organism none (report).
  Env-tunable (`PASTEL_SIM_FLOOR_*`); verdicts in
  `docs/review/ComponentFidelity.json`.
- **Neutral-canvas law** (`lib/surface-policy.ts`): app/workspace/dashboard/
  utility/software contexts get deterministic near-neutral grey surfaces and
  a near-white background (`enforceNeutralSurfaces`), plus a static
  `assertNeutralCanvas` gate (chroma + luminance + input-border visibility)
  that fails the run out of range. Lifestyle/editorial/consumer-brand briefs
  keep the warm canvas as a deliberate choice.
- **Dependency closure** (`stage-4-build.ts`): generated files' relative
  sibling imports are scanned and missing bases are provisioned from the
  vendored library — the `./separator` bundle-killer that failed 100% of
  the tested v7 run's screens is fixed at the source, not by the bundler
  stub.
- **Prop-contract validation** (`lib/prop-validation.ts`): composed screens
  are checked against the manifest's declared required props before they
  are persisted; violations retry the compose, and unverifiable empty
  usages are auto-fixed to safe `data-mount` wrappers — the v7
  WeekStrip/HabitRow/LedgerSwitch runtime crashes can't ship.
- **Render diagnostics**: error boundary + `pageerror`/`console.error`
  capture in the preview bundle, forwarded through the sandbox render into
  `renderDiagnostics` (a crash is attributable, never a silent blank PNG),
  plus screenshot retry-on-blank (one re-render under the 5 KB threshold).
- **Checkpoint/resume**: `docs/checkpoints/checkpoint.json` after every
  stage; SIGTERM/SIGINT writes a partial `run-summary.json` (status
  "killed"); `resume: { loadDoc, loadFile }` skips completed stages
  (DB-backed in `run.ts`, `PASTEL_E2E_RESUME` in the harness). A fully
  checkpointed run resumes with zero model calls (unit-tested).
- **Deterministic composition gate** (`checks/composition.ts`): duplicate
  chrome mounts + duplicate literal labels in a sibling block (the
  "Today / Today" defect) and empty/placeholder sections (the empty grey
  box) — blocking. **Geometry gate** (`checks/geometry.ts`): overflow
  widths, inline fonts, rhythm uniformity — advisory until calibrated.
- **Timing**: per-stage wall time in the output, `docs/review/Timing.json`
  and `run-summary.json`; the E2E harness's fixed 420s wall assertion is
  replaced by a latency-aware budget
  (`300 + screens×120 + min(calls×15, 300)` seconds, overridable).

### Acceptance

V8 is verified by:

- `server/tests/picasso-v8.test.ts` — 27 unit tests: dependency closure,
  prop-contract audit/auto-fix, token-CSS completeness audit, surface
  policy, fidelity floors + fallback, gate approve/cancel/revision,
  checkpoint resume (0 calls; re-gate without re-pay), per-stage timing,
  end-to-end neutral-canvas + closure.
- Existing suites stay green (pastel v6/v15/v16/v17/v22/sandbox + picasso
  v7 — 166 tests). The `pastel-v6` phase-order assertion was updated for
  the deliberate `wireframe-review` wire-contract addition.
- The three-brief E2E protocol (`picassotests/test6/e2e-run.ts`): software
  context, lifestyle context, data-dense context — pending (not yet run on
  v8).

## v6 - Knowledge-Base Pipeline

- Introduced the company knowledge base under `knowledge/companies/`.
- Added hand-authored `design.md` references and validated `manifest.ts`
  companions.
- Added the hybrid model strategy: cheap mechanical work and a stronger model
  for design judgment.
- Established the stages: discovery, brief, wireframe, build, assemble,
  present, and review.
- Added deterministic code composition, sandbox verification, screenshots,
  quality gates, credit holds, and bounded repairs.
- The composer used known-good blocks so models specified composition instead
  of writing unconstrained page layout.

## v7 - Domain-Aware Content

- Added domain packs for fitness, finance, media, ecommerce, rentals, travel,
  social, and productivity.
- Added deterministic mock data and content audits.
- Added copy/data sanitization for wrong currencies, duplicate labels, finance
  vocabulary, and generic SaaS content in unrelated products.
- Added signature variants such as scoreboards, bands, charts, and dropdown
  search.

## v8 - Semantic Coherence and Mount Contracts

- Added semantic copy validation for chart units, labels, and metrics.
- Added component inventory mount contracts.
- Dropped unmounted components and invalid custom blocks deterministically.
- Added card budgets, outline-button budgets, blank-section detection, and
  page-scale component checks.
- Added model output repair for malformed or incomplete JSON.

## v9 - Canonical Screen Model

- Stabilized the two-screen contract as `home` and `detail`.
- Added UX refinement after wireframe planning.
- Added deterministic screen ordering, one dominant moment per screen, and
  screen-local data views.
- Added detail integrity rules so a detail screen renders one selected item.
- This version also introduced the marketplace-shaped defaults that later
  required correction.

## v10 - Figma-Quality Foundations

- Added the 8px rhythm ladder and geometry checks.
- Added layout structures such as catalog rail and featured layouts.
- Added more product-specific base component exemplars.
- Added per-screen data isolation and cross-screen leak checks.
- Added deterministic local SVG scene generation so sandbox screenshots did not
  depend on remote image URLs.
- Added company preview and reference imagery for brand review.

## v11 - Layout, Imagery, and Deployment Quality

- Corrected spacing, gutter, control-size, and geometry false positives.
- Added deterministic component backfill when models omitted component names.
- Added unique item seeding and detail-gallery integrity.
- Added stronger screenshot review context and reference-image wiring.
- Added regression tests for rhythm, imagery, mount contracts, and semantic
  detail data.

## v12 - Product-First Coaching Surfaces

- Added adaptive fitness data: readiness, sets, reps, load, rest, recovery,
  form cues, and progression.
- Added coaching dashboard and exercise-detail fallbacks.
- Added user-uploaded Figma/Banani visual references.
- The visual-reference upload feature is not part of v16. Internal company
  reference screenshots remain supported.

## v14 - Design Tokens, Data Agent, and Visual Review

- Added a design-system agent before the brief.
- Added per-run tokens, WCAG validation, type scale, radius scale, control
  ladder, and visual intent.
- Added a data agent after the brief so content was generated per run.
- Added vision-first review using screenshots plus geometry and component
  context.
- Reworked the brief and fallback language to make products product-led.

## v15 - Mode-Aware Correction Attempt

- Added product modes: browse, transact, track, create, operate, learn, and
  social.
- Added mode checks intended to prevent search, grids, galleries, booking
  cards, and reviews from leaking into unrelated products.
- Added visual-intent axes for spacing mood, corner language, media strategy,
  and type voice.
- This was still implemented as incremental logic around the older composer
  and fallback architecture. It did not eliminate the legacy catalog bias.

## v16 - Ground-Up In-Place Rewrite (Complete)

v16 keeps the successful v6-v11 execution architecture and rewrites its
contracts, knowledge flow, composition law, and review system in the existing
Pastel files. It does not add a parallel implementation directory. The active
production path and Pastel regression suite are complete.

### Retained

- The same high-level stages and two-model cost strategy.
- Deterministic composition and sandbox verification.
- Parallel planner/builder work.
- Company `design.md`, `manifest.ts`, preview, and reference screenshots.
- The run document system, SSE phases, credit ledger, screenshot review, and
  bounded repair loop.

### Rebuilt

- Product contract and screen-intent schemas.
- Company-reference compilation and multi-factor selection.
- Mode-aware wireframe enforcement.
- Data shapes and detail-item scoping.
- Section renderer registry and responsive composition.
- Static gates for mode leakage, duplicate structure, repeated fingerprints,
  cross-screen reads, and illegal sections.
- Visual review prompts using product intent, company visual grammar, and
  measured geometry.

### Removed

- Global catalog/detail assumptions.
- Generic search and grid injection.
- Booking vocabulary outside transaction products.
- Company screen recipes as structural templates.
- User Figma/Banani upload intake.
- Temporary `v16/` compatibility modules.

### Company Knowledge Rule

Company references determine visual language. The product contract determines
page structure. A company may influence typography, color, density, surfaces,
interaction language, media treatment, and signature moves, but it may not
force a marketplace, dashboard, gallery, or catalog shape onto an unrelated
product.

### Active Files

- `contract.ts` contains the sandbox contract and v16 product/screen contracts.
- `knowledge/index.ts` compiles company references and selects visual
  capabilities.
- `orchestrator.ts` is the active in-place v16 orchestrator.
  with the existing run and persistence wire contract.
- `compose.ts` is the active composer and enforces the v16 section contract.
  at its final composition boundary.
- `engine.ts` is the production entry point.

### Validation Standard

Every v16 change must pass:

1. Existing v6-v15 compatibility tests that remain relevant.
2. Mode-specific structural tests.
3. Company-reference selection tests.
4. Cross-product layout-fingerprint diversity tests.
5. Sandbox and geometry checks at 1440px and 375px.
6. Screenshot visual review for the test 5-11 prompt matrix.

### Completion Status

- Active production entry point: `engine.ts` -> `orchestrator.ts`.
- Temporary v16 compatibility directory: removed.
- Company visual knowledge: active through `knowledge/index.ts`.
- Deterministic v16 review board: active in `contract.ts` and the orchestrator.
- Model review repair findings: routed to targeted builder repair.
- Pastel regression suite: 81 tests passing at the time of this release.

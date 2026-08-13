---
name: Maxi Agent V23 (Endgame)
description: How the Maxi design agent works — the v23 wave executor (dependency-graph orchestration replacing the sequential waterfall), layout genome, e2b-only sandboxing, knowledge retrieval, fidelity/prop gates, gateway tiers, and infra gotchas.
---

## Rule
The Maxi Agent (`server/lib/maxi-agent/`, formerly `pastel-agent/`) is a
**wave executor** (`orchestrator.ts`): Wave 0 (deterministic discovery +
one combined design/brief call) → Wave 1 (deterministic mode classification +
one layout-genome call) → Wave 2 (parallel component build ∥ content ∥ copy,
per-screen early composition) → Wave 3 (one CSS compile, then parallel
sandboxed smoke/render/geometry/gates/review) → Wave 4 (bounded repair, cap 1
retry; persistent failures ship FLAGGED as `done_needs_review`). Client wire
contract preserved: SSE `phase` events with the same phase names, `screens`
event before review. The API is `/api/maxi-agent/*` (no DB migration — table
names were always generic).

## The four waves (and their timing lever)
- **Wave 0**: discovery = deterministic `scoreCompanies` (NO model call — was
  a MID call). Design tokens + product brief = ONE combined cheap-tier call
  (`agents/plan.ts`, role `plan`) — was two MID calls. Both outputs are
  gated downstream (WCAG contrast, brief schema, registry check) so the call
  runs cheap; on gate failure the deterministic fallbacks
  (`designTokensFromManifest` + `fallbackBrief`) take over and the run notes
  `usedFallback`.
- **Wave 1**: `classifyGenomeMode` (deterministic, `lib/ux-design.ts`) runs
  FIRST; the vocabulary (`lib/genome.ts::buildModeVocabulary`) is constructed
  from the mode — hero/search do not exist for non-browse/transact modes, so
  the model cannot emit them. `agents/genome.ts` is ONE cheap call returning
  a small validated JSON genome (screens → regions → component slots →
  dominant moment → pairing hints). `genomeToWireframe` derives the enforced
  wireframe + inventory + UX; `lib/layout-plan.ts` (the V21 placement brain)
  consumes the genome directly. Default genomes per mode are the
  deterministic fallback.
- **Wave 2**: `MAXI_COMPONENT_CONCURRENCY` (default 6, legacy
  `PASTEL_BUILDER_CONCURRENCY` honored) parallel lanes. `src/data.js` +
  `src/lib/shell.jsx` are generated ONCE via `composeSharedFiles` (the V23
  per-screen composer doesn't emit them — forgetting this fails every screen
  at bundle time). Each screen composes as soon as ITS components + the
  layout plan land (`waitForScreenComponents`). Bounded composer retry (1);
  screens still failing ship flagged in `failedScreens`.
- **Wave 3**: one `compileStylesForRun` (the only serialization point), then
  `IncrementalScreenVerifier` (esbuild browser bundle locally — a compiler,
  never executes — + e2b smoke) and `captureScreenshots` (e2b Chromium),
  concurrent against the warm pool (`MAXI_SANDBOX_POOL_SIZE`, default 3).
- **Wave 4**: `collectRepairTargets` from gate + sandbox errors + review
  issues → one targeted `repairGeneratedFile` pass → re-verify → re-gate →
  re-review. `MAX_REPAIR_CYCLES = 1`.

## Layout genome — the wireframe-quality fix
The constraint lives in the vocabulary construction, not in prose the model
must obey: `lib/genome.ts::MODE_VOCABULARY` defines legal blocks/variants/
surfaces per mode; `legalBlocksForMode`/`legalSurfacesForMode` feed
`checks/layout.ts::auditGenomeLayout` (the gate). Dominant moment: exactly one
per screen, never paired (`defaultGenome` pair hints follow this). Unmounted
component slots are dropped from the inventory by enforcement (never built);
shell components (Topbar/Sidebar/Button/Avatar/Badge/Input/Select/Separator)
are always added.

## Sandboxing — e2b is the ONLY execution path
- esbuild compiles locally (compilation only). Smoke render
  (`lib/sandbox-render.ts::smokeRenderInSandbox`) and Chromium screenshot +
  geometry (`renderScreenInSandbox`) execute inside e2b sandboxes from the
  `maxi-agent-v23` template (Node 20 + Chromium + pinned react/lucide/
  playwright-core baked in; marker `/home/user/.maxi-sandbox-ready`).
- COLD-START RULE: `createSandbox()` verifies the marker and NEVER installs
  packages. If the marker is missing, it fails loudly (template drift) —
  rebuild with `E2B_API_KEY=... npx tsx server/lib/maxi-agent/sandbox-image/build.ts`.
- The warm pool is a small latency shave ON TOP of the template fix, not the
  mitigation for an install tax. `acquireSandbox()` returns a LEASE
  `{ sandbox, release }` — concurrent jobs must never resolve their slot via
  `pool.find(p => p.inUse)` (that was a real v23 bug: shared-slot file races
  produced blank screenshots).
- Every in-sandbox command is logged; `server/tests/sandbox-e2b.test.ts`
  asserts no `apt-get`/`npm install` on cold start (the permanent regression
  guard). If e2b is unconfigured, smoke+render are SKIPPED and reported,
  never run locally.
- Template rebuild: `E2B_API_KEY=... npx tsx server/lib/maxi-agent/sandbox-image/build.ts`.

## Fidelity + prop contract (carried from Picasso, wired in)
- `checks/fidelity.ts::auditComponentFidelity` runs in the gate for every
  built component: from-scratch structural contract (self-contained
  react+lucide imports, no hex, default export, slot utilities) + uniqueness
  ceiling (<90% vs the nearest vendored base) + the taxonomy floors when a
  spec anchors a base. Verdicts → `docs/review/FidelityReport.json`; the
  batch reports actual PASS counts.
- `lib/prop-validation.ts` audits every composed screen against the planner's
  required props and AUTO-FIXES crash-prone chrome-only mounts to safe
  `data-mount` wrappers, before verification. Violations that survive →
  HIGH gate issues. `docs/review/PropContractReport.json`.
- `lib/fidelity.ts::generateComponentWithFidelity` is the builder's repair
  fallback when a from-scratch generation fails outright (base-anchored
  rewrite under the floors; guarantees a default export).
- `checks/props.ts::auditPropBindings` (V22) still flags empty/missing
  required props at mount sites.

## Knowledge base (Phase 7 rewrite)
- 28 companies (20 originals + arc, framer, headspace, mailchimp, mercury,
  slack, superhuman, webflow), each `knowledge/companies/<slug>/design.md` in
  the Picasso format: when-to-reach, personality, color, typography, spacing,
  radius, elevation, iconography, signature patterns, motion, voice, and an
  "Explicitly do not" no-reproduce clause. ZERO page-recipe language.
  `references/*` + `preview.png` deleted (the ~23MB screenshot set).
- Only companies with `manifest.ts` are selectable (`listCompanySlugs` — 11
  of 28; same as pre-v23 HEAD). Runtime never hits a manifest-less slug
  (candidates are manifest-backed by construction).
- Retrieval (`knowledge/retrieval.ts`): per mode, the company doc (full) +
  relevant design-law/component-law files, each law capped at 3500 chars —
  the wave1-genome slice went from ~267K chars to ~42K chars (~10K tokens).
  `kbSlices` in the manifest records the per-stage lever.
- `megadesign.md` is the universal law; `knowledge/component-law.ts` is the
  V21 single-file builder law (still used by planner/builder/composer).

## Gateway + models
- Two tiers: cheap `anthropic/claude-haiku-4-5` (roles: plan, genome, clarify,
  planner, builder, builderCustom, assemble, compose, data), mid
  `openai/gpt-5.6-luna` (review, visualReview, copy, repair). Env overrides
  `PASTEL_MODEL_<ROLE>` (kept for deployment compat; roles include PLAN,
  GENOME). `MAXI_COMPONENT_CONCURRENCY`, `MAXI_SANDBOX_*`, `MAXI_SIM_FLOOR_*`
  (legacy `PASTEL_SIM_FLOOR_*` honored).
- `chatJSON` corrective-repairs parse AND validation failures; on persistent
  failure the deterministic fallback runs (recorded in `usedFallback`).
  Truncation escalates output budget once (×2.5 capped per role).
- `__setTestClient()` is the test seam for stubbing `responses.create`.

## Run artifacts
`docs/brief|design|planning|review|timing/*`: ProductBrief, DesignTokens,
VisualIntent, Genome, WireframePlan, ComponentInventory, UXDesign, DataPlan,
CopyPlan, LayoutPlan, GateReport, FidelityReport, PropContractReport,
ReviewResult, TimingReport (per-wave ms), CallCounts (callsByRole + kbSlices).
Manifest carries screens, docs, brandKit, phases, quality, company, timing,
callsByRole, kbSlices, failedScreens. SSE: phase/title/doc/file/activity/
screens/done/error. Previews at `GET /api/maxi-agent/runs/:runId/preview/:screen`
(posts `maxi:mounted`/`maxi:height`/`maxi:error`/`maxi:blank` to the parent
frame; the client listens for the same).

## Infra gotchas (validated live)
- `composeSharedFiles` MUST be called once per run before per-screen
  composition — screens import `../data.js` + `../lib/shell.jsx`; missing
  them fails every screen at bundle time ("Could not resolve").
- `acquireSandbox` returns a lease; never search the pool for the in-use
  slot (shared-slot file races → blank ~90-byte PNGs).
- CJS bundle has empty `import.meta.url` — `asset-paths.ts#pastelAssetRoot()`
  for on-disk reads; falls back to `process.cwd()/server/lib/maxi-agent`.
- Background jobs: `setsid nohup … & disown` — plain `nohup &` still dies
  when the launching shell is reaped; poll the log file.
- tsconfig incremental cache goes stale: `rm -f node_modules/typescript/tsbuildinfo`
  when type errors look phantom.
- `window.__maxiMounted` is set by the entry bundle and awaited by the
  sandbox shot script + the preview route's blank check — keep the name in
  sync across sandbox.ts / sandbox-render.ts / routes/maxi-agent.ts.
- The e2b template must be rebuilt whenever the sandbox toolchain changes:
  `E2B_API_KEY=... npx tsx server/lib/maxi-agent/sandbox-image/build.ts`.

## Validation tooling
- `npm test` — deterministic suite (genome, fidelity floors both directions,
  prop-contract audit + auto-fix, dependency closure, knowledge retrieval,
  sandbox cold-start guard). Pre-existing product-test failures
  (Stalwart/unreachable, missing `server/webhooks/inbound-email` module) are
  unrelated to the agent.
- `MAXI_E2E=1 node --import tsx --test server/tests/maxi-e2e-modes.test.ts` —
  the release gate: one cold run per product mode (7), asserting ≥2 verified
  screens, four-wave timing, gate/fidelity/prop verdicts, kb-slices; writes
  per-mode summaries to `server/tests/.e2e-results/`.

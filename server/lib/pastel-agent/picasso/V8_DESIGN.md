# Picasso V8 — Parallel Framework, Wireframe Gate, Fidelity Contract

## What changed and why

V7 was hardened orchestration (degrade-don't-abort, two-call architecture,
salvage phases) but it left four user-visible failure classes standing,
reproduced in the `agentv7` E2E artifacts:

1. **Slowness** — 8 stages ran strictly sequentially; only component build
   and screen *composition* were parallel, and each was a synchronous
   stage-transition wall (1316s / 41 calls for 3 screens in the recorded
   run).
2. **Broken screens** — all 3 composed screens failed to bundle
   (`No matching export … for import "Separator"` — the manifest never
   provisioned the base's sibling imports), and even after a manual patch
   every screen crashed at runtime on prop-contract violations
   (`WeekStrip`/`HabitRow`/`LedgerSwitch` used without their required
   props → `undefined.map`).
3. **Low shadcn fidelity** — the customization contract had no enforced
   floor: primitives diverged down to 22% / 31% similarity to their bases
   inside a single run, and the anti-slop gate reported the run as PASSED.
4. **Wrong canvas** — the accent-tinted neutral scale produced a cream page
   background (`#F7F5F2`) for a software product, and the input border
   (`#E0DCD6` on that cream) read as invisible ("looks nothing like the
   shadcn base").

V8 keeps V7's degradation machinery and adds the parallel framework, the
hard wireframe confirmation gate, the enforced fidelity contract, the
neutral-canvas law, checkpoint/resume, and the deterministic composition
gates. The `agentv7/IMPROVEMENTS.md` table (checkpoint/resume, dependency
closure, prop-contract validation, error boundary + console capture,
retry-on-blank, latency-aware wall budget) is now **implemented**, not just
scoped.

## 1. Parallel framework (`orchestrator.ts`)

The stage graph is derived from data dependencies, not historical stage
order:

```
discovery → directions → tokens → architecture → [ WIREFRAME GATE ]
   → content ∥ components (parallel, capped)
   → per-screen compose+smoke (parallel, capped)
   → per-screen render+QA (parallel, capped; renders serialized on the sandbox)
   → deterministic gates → finalize
```

- **Content ∥ components** — both fan out together (was already parallel in
  V7; kept).
- **Per-screen pipelines (the biggest win)** — V7's `composeAllScreens`
  waited for ALL screens before ANY smoke test, and visual QA was a
  sequential `for` loop. V8 runs compose → smoke per screen concurrently
  (cap `screens`, default 4), then render → visual QA concurrently (renders
  serialized through the shared E2B sandbox queue at `render`, default 1 —
  one sandbox runs one browser at a time). A 2-screen run no longer pays
  2× the compose-to-render time of a 1-screen run.
- **Two-pass split explained** — the compiled Tailwind CSS must include
  every screen's classes, and the CLI content glob needs the final screen
  sources. So pass 1 (compose + smoke) completes before the one-time CSS
  compile, then pass 2 (render + QA) runs for all screens concurrently.
  This is the only serialization the dependency graph forces.
- **Concurrency caps** — `componentBuild` (default 6, env
  `PASTEL_PICASSO_COMPONENT_CONCURRENCY`), `screens` (default 4, env
  `PASTEL_PICASSO_SCREEN_CONCURRENCY`), `render` (default 1). Fan-out stages
  stay on the cheap tier (builderCustom/assemble) so concurrency doesn't
  multiply cost; judgment stages (wireframe, visual QA) stay mid-tier.
- **Wall-time by stage** — every stage records wall ms; the output carries
  `timing: { wallSeconds, stages }` and it is persisted to
  `docs/review/Timing.json` and `run-summary.json` so per-stage regressions
  are visible, not just the aggregate.

## 2. Wireframe confirmation gate (`lib/wireframe-review.ts`)

A hard blocking checkpoint immediately after architecture and **before any
component build or screen compose work** — no model call, no compute spend
past it until the user decides.

- **Payload** — built from the same layoutSignature-style data the harness
  already writes (screens → regions → planned component slots → dominant
  moment) plus accent/radius/seed. Static data; renders in seconds, zero
  model calls.
- **Wire contract** — new `wireframe-review` phase in the `PastelPhase`
  enum (client `AgentPhase` mirrors it), emitted as
  `emit("phase", { phase: "wireframe-review", status: "running" })` plus a
  `wireframes` SSE event carrying the payload. The run blocks (SSE stays
  open, no `done` event) until the client posts
  `POST /api/pastel-agent/runs/:runId/wireframe-decision`
  (`{ action: "approve" | "revise" | "cancel", notes? }`).
- **Revision round-trip** — `revise` feeds the per-screen notes into a
  bounded re-architecture call (the `revisionNotes` block in stage-3's
  structure prompt). Discovery and design tokens are never re-run. Max 2
  revisions, then the latest architecture auto-approves.
- **Cancel** — the run returns `cancelled: true` before any build work; the
  production loop refunds the credit hold (0 charged).
- **Timeout** — `PASTEL_WIREFRAME_REVIEW_TIMEOUT_MS` (default 10 min)
  auto-cancels a run nobody responds to; a run never sits eternally blocked
  on a credit hold.
- **Resume behavior** — approval is checkpointed
  (`docs/checkpoints/wireframe-approved.json`); a resumed run whose
  architecture exists but was never approved re-enters the gate **without
  re-running architecture model calls** (artifacts load from the doc
  store).

## 3. Shadcn fidelity contract (stage-4-build.ts)

The customization contract now has an enforced FLOOR per taxonomy tier
(`checkSimilarityFloor`, the same chunk-similarity metric the v7
COMPONENT_ANALYSIS used — promoted from post-hoc report to build-time gate):

| Taxonomy | Floor | Action on violation |
|---|---|---|
| primitive | ≥ 85% | reject → retry once with a stricter prompt → fall back to the literal base file (imports rewritten + branding marker only) — never ship a low-fidelity primitive |
| atom | ≥ 65% | regenerate once, warn if still under |
| molecule | ≥ 40% | report only |
| organism | — | report only |

Floors are env-tunable (`PASTEL_SIM_FLOOR_PRIMITIVE` etc.). Verdicts are
persisted to `docs/review/ComponentFidelity.json` and returned on the
output (`fidelityReport`).

## 4. Reliability fixes (IMPROVEMENTS.md #2/#3/#4/#5 + token audit)

- **Dependency closure (#2)** — after component generation, every file is
  scanned for relative sibling imports; siblings that are not manifest ids
  and not support files (`cn`, `use-mobile`) are provisioned from the
  vendored base library (literal base, imports rewritten). The
  `./separator` bundle-killer that failed 100% of the tested v7 run's
  screens cannot happen again — the bundler stub is now only a last-resort
  for bases that genuinely don't exist. Provisioned names are reported
  (`provisioned`) and persisted.
- **Prop-contract validation (#3)** — `lib/prop-validation.ts` checks every
  component usage in a composed screen against the manifest's declared
  required props (matching the composer's `pascal(id)+Export` aliasing
  scheme). Violations trigger a targeted compose retry ("pass real props or
  remove the usage"); anything still unverifiable is auto-fixed
  deterministically (empty usage → safe `data-mount` wrapper) so crash-prone
  JSX never ships. Surviving violations are flagged in
  `docs/review/PropViolations.json`, never silent.
- **Error boundary + console capture (#4)** — the preview entry bundle now
  wraps the screen in an error boundary and captures `pageerror`,
  `unhandledrejection`, and `console.error` into `window.__picassoDiagnostics`; the sandbox screenshot script forwards them
  (`__PICASSO_DIAG__` line) into `renderResult.diagnostics`. A runtime
  crash produces an attributable error instead of a blank PNG.
- **Retry-on-blank (#5)** — a rendered PNG under the blank threshold
  (5 KB) with no attributable crash triggers one re-render before being
  accepted; a still-blank result is flagged in `errors`.
- **Token-CSS audit** — `auditGlobalsCSS` diffs the generated globals CSS
  against every `--var` the base theme declares in `:root`/`.dark`; any gap
  is a degradation (the v7 invisible-input class of bug). The current
  generator already emits `--input`/`--border` from the run's palette (the
  repo state post-v7-fix); the audit makes it a gate, not a hope.

## 5. Neutral-canvas law (`lib/surface-policy.ts`)

Ports the sibling pipeline's product-context distinction
(`classifyContext`) into a surface policy:

- **neutral** (app / workspace / dashboard / utility / software) — the
  neutral scale, surfaces, and borders are enforced near-grey
  (chroma ≤ 4, and the page background near-white) **deterministically**
  (`enforceNeutralSurfaces`), not just by prompt instruction. The token
  prompt's warm-tint instruction is gated behind the policy.
- **warm** (lifestyle / editorial / consumer brand) — the accent-tinted
  canvas remains a deliberate `warm` choice.

The static gate `assertNeutralCanvas` measures the actual background hex
against the near-neutral threshold (chroma + luminance for light mode) and
checks the input border is not effectively invisible against the
background — out of range fails the run, the same way WCAG contrast is
enforced elsewhere in this codebase. Result persisted to
`docs/review/ThemeGate.json`.

## 6. Deterministic gates (`checks/composition.ts`, `checks/geometry.ts`)

- **Duplicate-mount / duplicate-label detector** — catches the
  "Today / Today" defect shape (same chrome component or same literal label
  mounted twice in one sibling block) and planned-but-unmounted components.
- **Empty/placeholder-section detector** — filled containers (bg/border/
  height classes) with no text and no mounted component, including
  self-closing empty boxes; deliberate `data-mount` wrappers from the prop
  auto-fixer are exempt.
- **Geometry checks** — overflow (fixed widths > 1440px), inline fonts,
  uniform section rhythm, absolute-overlap heuristics. Advisory in v8
  (reported, not blocking) until the heuristics are calibrated against real
  runs.
- Composition gate HIGH violations are blocking (persisted
  `docs/review/CompositionGate.json`).

## 7. Checkpoint / resume (IMPROVEMENTS.md #1)

- `docs/checkpoints/checkpoint.json` is written after every stage completes
  (stage statuses + wall ms); every stage artifact was already persisted as
  it completed.
- **Kill handler** — SIGTERM/SIGINT writes a partial summary (status
  "killed", furthest stage, calls, cost) instead of losing the data: the
  E2E harness writes a partial `run-summary.json`; the production loop
  marks the run, refunds the hold.
- **Resume** — `runPicassoPipeline` accepts `resume: { loadDoc, loadFile }`
  (DB-backed in `run.ts`, dir-backed in the harness via
  `PASTEL_E2E_RESUME`). Persisted artifacts are loaded and completed stages
  skipped; the wireframe gate re-fires if the architecture was never
  approved. A fully-checkpointed run resumes with **zero model calls**
  (verified by unit test).

## 8. Latency-aware wall budget (IMPROVEMENTS.md #6)

The E2E harness's fixed 420s assertion is replaced by a budget that scales
with the actual work: `300s + screens × 120s + min(calls × 15s, 300s)`,
overridable with `PASTEL_E2E_WALL_BUDGET_SECONDS`.

## Files

New:
- `picasso/pipeline/lib/{run-stats,resume,surface-policy,wireframe-review,prop-validation}.ts`
- `picasso/pipeline/checks/{composition,geometry}.ts`
- `picasso/wireframe-gate.ts`
- `client/src/components/agent/WireframeReviewPanel.tsx`
- `server/tests/picasso-v8.test.ts` (27 tests)

Modified:
- `picasso/pipeline/orchestrator.ts` (parallel framework, gate, resume)
- `picasso/pipeline/stage-4-build.ts` (fidelity floors, dependency closure)
- `picasso/pipeline/stage-5-assemble.ts` (`composeScreenV8` prop gating)
- `picasso/pipeline/stage-2-design-system.ts` (surface-policy gating)
- `picasso/pipeline/stage-3-wireframe.ts` (revision notes)
- `picasso/pipeline/stage-7-visual-qa.ts` (per-screen QA helper)
- `picasso/pipeline/stage-8-finalize.ts` (V8 gates + timing in report)
- `picasso/pipeline/lib/{base-components,preview,sandbox-render}.ts`
- `picassotests/test6/e2e-run.ts` (gate passthrough, resume, kill summary,
  latency-aware budget, screenshots from pipeline)
- `picasso/run.ts` (gate registry, kill handler, resume loaders)
- `server/lib/pastel-agent/types.ts` (`wireframe-review` phase,
  `wireframes` event), `server/routes/pastel-agent.ts` (decision endpoint)
- `client/src/hooks/use-pastel-agent.ts`, `client/src/pages/CanvasPage.tsx`
  (gate UI wiring)

## Tests

`server/tests/picasso-v8.test.ts` — 27 tests: dependency closure
(provisions `separator`), prop-contract audit + auto-fix, token-CSS audit,
surface-policy classification/enforcement/gate, taxonomy floors +
fallback-to-base, wireframe gate (fires before build / cancel with zero
spend / revision round-trip), checkpoint resume (0 calls on full resume;
re-gate without re-pay on unapproved resume), per-stage timing, end-to-end
neutral-canvas + closure through the stubbed pipeline. Existing suites stay
green (166 tests across pastel v6/v15/v16/v17/v22/sandbox + picasso
v7/v8).

## Open items

- E2E verification of the §8 speed targets (2-screen harden run →
  low-single-digit minutes) and §9 acceptance criteria — not yet run.
- Geometry gate is advisory pending calibration against real runs.
- The fidelity floors use the v8 brief's suggested starting points; tune
  `PASTEL_SIM_FLOOR_*` against real-run distributions.
- Per-screen CSS compilation (removing the two-pass split) is possible but
  was not worth N tailwind CLI runs; revisit if the one-time compile shows
  up in per-stage timing.

# Picasso V8 — Implementation & Verification Status (agentv8)

**Branch:** `picasso-v8` · **Date:** 2026-08-11 · **E2E:** NOT YET RUN
(`picassotests/test6/e2e-run.ts` is ready but was deliberately not executed
on v8 per the build brief — see "Pending" below)

> This report is the v8 entry in the same diagnostic lineage as
> `agentv7/DIAGNOSIS.md` and `agentv7/IMPROVEMENTS.md`. It records, factually,
> what was implemented, what was verified (and how), what was not verified
> yet, and why. Every v7 defect below is mapped to the v8 fix that closes it,
> and every fix is verified by a unit test in
> `server/tests/picasso-v8.test.ts` (27 tests) unless stated otherwise.

---

## V7 defects → V8 status

| V7 complaint / defect | Root cause (v7) | V8 fix | Verified |
|---|---|---|---|
| "took 10 minutes to generate 2 screens" | 8 stages strictly sequential; stage-4/5 parallel only within-stage; visual QA a sequential `for` loop | Per-screen pipelines (compose→smoke, then render→QA, each capped at 4 concurrent) + capped component build (6) | Unit: per-stage timing recorded and asserted; wall-time targets pending E2E |
| Cream/beige page background on a software product | `stage-2` warm neutral-scale law + `"tonal"` surfaces, no context override | `lib/surface-policy.ts`: neutral-context enforcement (`enforceNeutralSurfaces`) + static `assertNeutralCanvas` gate (chroma ≤ 4, near-white, input-border visibility) | Unit: v7's exact `#F7F5F2` cream background is grey-washed; gate fails a tinted canvas; end-to-end through the stubbed pipeline |
| "did not edit the base components very well, made them worse" (22%/31% outliers) | Similarity divergence had no enforced floor | Taxonomy-tiered floors (primitive ≥85% reject→retry→literal-base fallback; atom ≥65%; molecule ≥40%; organism none) | Unit: divergent primitive fails + falls back to the literal base; near-base primitive passes |
| "look nothing like them" + invisible text inputs | Token-CSS gaps (silent fallback to base defaults) + tinted low-contrast border on cream | `auditGlobalsCSS` gate (every base `--var` must be emitted; `--input`/`--border` present) + neutral canvas + border-visibility check | Unit: generator emits all base vars; audit catches a dropped `--input`; border==background is flagged |
| "Today / Today" duplicate tabs, unlabeled orange bar, empty grey box | No duplicate-mount / empty-section detectors in the static gates | `checks/composition.ts`: duplicate-label + duplicate-chrome-mount (sibling block) + empty-section detectors, blocking | Unit: all three shapes flagged |
| "so many issues and errors" (0/3 screens bundled, all crashed at runtime) | Missing sibling module (`./separator`); no prop-contract validation | `closeDependencyGraph` (provisions missing bases) + `composeScreenV8` prop-contract gate with auto-fix + render error boundary / console capture / retry-on-blank | Unit: closure provisions `separator`; empty usages of required-prop components flagged + auto-fixed; pipeline provisions + reports `separator` |
| Killed run re-pays everything; no cost visibility | No checkpoint/resume; summary written only at pipeline end | `docs/checkpoints/checkpoint.json` per stage; SIGTERM/SIGINT partial summary (status "killed"); `resume` loaders skip completed stages | Unit: fully-resumed run makes **0 model calls**; unapproved-architecture resume re-enters the gate with no wireframe re-pay (14 calls vs 19) |
| Fixed 420s wall assertion fails structurally-correct runs | Latency-independent budget | Latency-aware budget `300 + screens×120 + min(calls×15, 300)` s, overridable | In harness code (typechecked); behavior pending E2E |
| No user checkpoint before build spend | Architecture approved silently | Hard wireframe gate: `wireframe-review` phase + `wireframes` SSE event + decision route + timeout + refund-on-cancel | Unit: gate fires before build; cancel = 0 build calls; revision round-trip re-architects without re-running discovery/tokens |

## What was verified

- **166 unit tests pass** across the Pastel + Picasso suites
  (`pastel-v6` (57), `pastel-v15` (10), `pastel-v16` (6), `pastel-v17`
  (34), `pastel-v22` (9), `pastel-sandbox`, `picasso-v7` (15),
  `picasso-v8` (27)) — `node --import tsx --test server/tests/*.test.ts`
  (excluding the pre-existing `dns-records`/`inbound-email`/`email-threading`
  failures caused by the missing `server/lms` module, documented in
  `V21_DESIGN.md` as pre-existing).
- **Typecheck**: `npx tsc --noEmit` reports exactly the same 14 pre-existing
  errors as `main` — zero new type errors across server, client, and the
  harness.
- **Sibling pipeline untouched**: `server/lib/pastel-agent/agents/**` and
  `orchestrator.ts` were not modified. The only shared-file change is the
  deliberate wire-contract addition (`wireframe-review` in `PastelPhase`,
  `wireframes` event in `PastelEvent`), which required updating the
  `pastel-v6` phase-order assertion.
- **The v7 E2E harness protocol is preserved** and extended:
  `picassotests/test6/e2e-run.ts` now auto-drives the wireframe gate
  (`PASTEL_E2E_WIREFRAME_DECISION=approve|revise|cancel`), writes
  `wireframeGateFired`, `timing`, `fidelity`, `provisioned`,
  `renderDiagnostics` into `run-summary.json`, supports
  `PASTEL_E2E_RESUME=<runDir>`, writes a partial summary on SIGTERM/SIGINT,
  and uses the pipeline's own harden-mode screenshots instead of
  re-rendering.

## What did not verify (pending)

- **E2E runs (all three briefs)** — deliberately not executed on v8 yet.
  The §9 acceptance criteria (100% bundle/render, gate blocking + resume,
  primitive floors in real runs, neutral canvas on the software brief, no
  duplicate/empty sections, kill/resume behavior, §8 wall-time targets)
  require real model + E2B runs and are the next step.
- **§8 speed targets** — the low-single-digit-minutes 2-screen target is a
  prediction from the per-screen pipelining; measured numbers will land in
  this file after the E2E run.
- **Fidelity-floor tuning** — floors use the brief's suggested starting
  points; real-run distributions may justify tuning `PASTEL_SIM_FLOOR_*`.
- **Geometry gate calibration** — advisory in v8; may become blocking after
  real runs.
- **Screenshots + run-summary.json for agentv8** — will be written here
  (mirroring `agentv7/`) once the E2E protocol runs.

## Files changed (v8)

See `server/lib/pastel-agent/picasso/V8_DESIGN.md` for the full file map.

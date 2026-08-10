# Picasso V7 E2E — Improvements & Upgrades (agentv7)

**Applied during this session** plus **suggested** follow-ups ranked by impact. Model-tier test
artifacts (output-shape variance) are out of scope — everything here targets genuine pipeline
defects that reproduce regardless of the model.

---

## Applied fixes (verified by typecheck + re-renders)

### A. Preview bundler: stubs export the names importers actually request
The `picasso-stub` module previously exported only `default` + kebab-case name, so any named import
of a missing module (e.g. `{ Separator }` from a never-built `./separator`) failed the bundle. The
bundler now scans every source for local named imports, and each synthesized stub exports exactly
those names (rendering a passthrough `div`). Generated UI code is never modified
— `pipeline/lib/preview.ts`.

### B. Manual screen fixes (run-level, UI preserved)
For the screenshot pass the missing `separator.tsx` was injected from the base library verbatim and
three prop-contract bugs were corrected in `today.tsx` / `ledger.tsx` (pass real props / use the
composer's own `Item` wrapper). **No UI the composer created was changed** — screenshots reflect
the original design intent.

---

## Suggested improvements (not yet applied)

| # | Fix | Why | Where |
|---|-----|-----|-------|
| 1 | **Checkpoint/resume:** persist phase state (or at least the ledger) as stages complete and write `run-summary.json` immediately after the pipeline returns AND on process kill (SIGTERM handler) | A killed run currently re-pays all model costs from stage 1; this session's attempt 1 cost was lost with zero output | `e2e-run.ts`, `orchestrator.ts` |
| 2 | **Build-stage dependency closure:** after generating components, scan them for `./<sibling>` imports not in the manifest and auto-build those bases (separator, etc.) | Prevents the whole render step failing on a missing module; the bundler stub is only a band-aid | `stage-4-build.ts` |
| 3 | **Composer prop-contract validation:** before persisting a screen, check each component usage against the manifest `props` spec (required props present, correct types); auto-fix by dropping/passing defaults instead of shipping crash-prone JSX | Every composed screen in this run crashed at runtime on missing props | `stage-5-assemble.ts` / new lint gate |
| 4 | **Error boundary + console capture in the render harness** | Runtime crashes (undefined.map) currently render blank PNGs with zero diagnostics; capturing `pageerror`/console would have cut diagnosis time to seconds | `sandbox-render.ts` |
| 5 | **E2B screenshot retry-on-blank** (re-render once if PNG size < threshold) | Two of three screens rendered blank the first pass with no error surfaced | `e2e-run.ts` / `sandbox-render.ts` |
| 6 | **Make the 420s wall-time assertion latency-aware** (scale by expected call count, or make it configurable per run) | A structurally complete run fails the assertion whenever latency leaves the calibrated envelope | `e2e-run.ts` |

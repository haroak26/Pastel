# Agent v24 e2e — Test 2: Improvements & Recommendations

- **Final run:** `ad6fc0d8-fbd3-4b88-b4aa-80d1ca9504a6` — `done_needs_review` (completed, screens rendered)
- **Earlier runs this session:** `1f404657` (crash: TypeError in layout-plan.ts) → `69e8d439` (crash: NavAdapter not defined) → `cf548b5d` (crash: e2b sandbox pool exhausted) → **`ad6fc0d8` (final: pipeline completed end-to-end)**

## Progress vs the start of the session

| Metric | v23 baseline | test1 (crash) | test2 final run |
|---|---|---|---|
| Pipeline completes | yes (375s) | **no — process crash** | **yes** |
| Screens verified | 2 | 0 | **2 (detail, home)** |
| Wall time | 375s | ~30s | 320s |
| Review | 62/100 | n/a | 58/100 |
| Gate | 0/100 | n/a | 0/100 (14 issues) |
| Screenshots | 4 | 0 | **4** |

The pipeline went from crashing in Wave 1 with zero artifacts to a complete end-to-end run: both screens bundle, pass e2b smoke renders, and render at desktop + mobile. Quality gates still fail — see "Remaining issues" below.

## Fixes implemented this session (4)

### 1. Template fits/slots mismatch — `lib/layout-templates/templates.ts` (the test1 crash)
- **Bug:** all nine detail templates in the "4-5" bucket declared `fits: [4,5]` but authored only **4 slots**. A 5-region detail screen crashed `layoutForScreen` with `TypeError: Cannot read properties of undefined (reading 'placement')` at `layout-plan.ts:165`.
- **Fix:** authored the missing 5th slot (optional trailing full) in `CATALOG_DETAIL_5`, `DASH_DETAIL_5`, `SOCIAL_DETAIL_5`; 4-region behavior is unchanged (the trailing optional drops).
- **Guard:** `layoutForScreen` now throws a descriptive "fits must never exceed slots" error instead of a `TypeError` for any future authoring regression (`lib/layout-plan.ts`).
- **Regression test:** `maxi-templates-geometry.test.ts` now asserts `Math.max(...fits) <= slots.length` and that every fitted count is mappable for all 54 templates.

### 2. Composer never imported NavAdapter — `compose.ts`
- **Bug:** `composeScreenV20` mounts `<NavAdapter>` (the WS1 nav-chrome shell) but `renderFile`'s shell import omitted it (`import { TONE, signed, NAV, IconOf, SectionHeader } from "../lib/shell.jsx"`). Every composed screen failed sandbox smoke verification with `__SMOKE_FAIL__ NavAdapter is not defined`, aborting the run at `status: error`. The template fixtures passed because `fixture.ts` imports NavAdapter explicitly — the bug only affected production compositions.
- **Fix:** added `NavAdapter` to the shell import in `compose.ts`. Verified against the actual generated files: both screens now bundle + smoke-render clean in the e2b sandbox.
- **Lesson:** a WS1 workstream landed the chrome mount but missed the import site — an integration gap the unit tests couldn't see. Add a composed-output integration check (bundle + smoke) to CI that exercises the real `composeScreenV20` path.

### 3. e2b sandbox pool exhaustion — `lib/sandbox-render.ts`
- **Bug:** `captureScreenshots` fires `screens × viewports` jobs concurrently (2 × 3 = 6) against a warm pool of 3. Jobs beyond the pool capacity threw `e2b sandbox pool exhausted`, failing the whole run — latent since WS6 added per-viewport geometry.
- **Fix:** `acquireSandbox` now **waits** for a released slot (waiter queue) instead of throwing; the pool is the concurrency limit, matching the module's documented intent. `resetSandboxPool` clears waiters (test seam).
- **Regression coverage:** exercise a > pool-size concurrent render batch in `sandbox-e2b.test.ts` (currently only tests a single acquire).

### 4. e2e harness hardening — `agenttests/agentv24/run-e2e.ts`
- **Bug:** a synchronous throw inside the wave chain escapes `Promise.race` as an unhandled rejection and kills the process with **zero artifacts** and the DB run row stuck at `running` (exactly what test1 produced).
- **Fix:** `unhandledRejection`/`uncaughtException` nets write a FATAL `ISSUES_AND_ERRORS.md`/`RUN_SUMMARY.md`/`run-summary.json` before exiting; the pipeline console is teed into `run.log` (the anomaly collector now has real content).

## Remaining issues (from the final run — 25 gate/review findings)

### High severity
1. **Missing primary action on both screens** (gate #15/#16, review). WS3 schema validates that the *genome* declares a `primaryAction` region — but the *composed output* has no visible primary action ("Log a run" / "Edit run" never renders). The schema floor protects the plan, not the shipped UI. **Improvement:** extend the deterministic gate to verify the composed screen actually renders a visible primary-action affordance (button/CTA in the primaryAction slot), not just the genome field.
2. **Duplicate component mounts** — `PaceLeaderboard` planned 2× on home, `SplitChart` 2× on detail (gate #4/#5). WS1's `reconcileGenome` merges duplicate *custom slots* but not duplicate *inventory components*. **Improvement:** extend the reconcile fixed point to dedupe repeated inventory components per screen.
3. **Separator: no theme styling** (gate #14, fidelity 1 hard failure). This is v23 issue #29 verbatim — the WS7 convergence fallback ships the literal base file, which still has no token styling for `Separator`. **Improvement:** audit base-component token coverage; WS7 should converge *then verify* theme-token presence, not just similarity to base.
4. **Search field on track-mode home** (review #21) — browse/search-toolbar structure on a track home. **Improvement:** the WS5 mode contract checks units/dates but not the block vocabulary per mode-family; extend domain-contract to reject `search` regions on track-mode homes.

### Medium severity
5. **Sparse lists** — home 2 rows, detail 1 row vs min 3 (gate #6/#9, review #17/#18). The genome declared `minRows ≥ 3`, the composer under-filled. **Improvement:** make the deterministic content gate (not just the genome schema) enforce row floors against the actual rendered rows, and retry compose on violation (WS3 currently enforces at Wave 1 only).
6. **~40% empty viewport on both screens** (gate #7/#10, review #19/#20). **Improvement:** enforce `maxEmptyViewport` on the *measured DOM geometry* (already measured per viewport by WS6) at the gate, not just in the genome schema.
7. **a11y: inputs/select lack visible labels + aria contract** (gate #1/#24/#25) — a repeat of v23 #1 for the *custom* `Input`/`Select` primitives (the template a11y contract covers planned slots, but the components themselves are label-less). **Improvement:** the base `Input`/`Select` components should render an accessible label contract by construction.
8. **Detail: 4 non-dominant sections, only 2 SectionHeaders** (gate #12) — v23 #27 only partially resolved. **Improvement:** the deterministic gate should require `SectionHeader` for *every* non-dominant planned section (it currently tolerates missing one).
9. **Planned pair row renders stacked** (gate #13: cta + list planned as split, composed stacked). **Improvement:** the layout gate's two-up grid check is code-regex based; rely on the WS6 DOM geometry (sibling x-positions) to assert pairs render side-by-side.
10. **Unit mismatch** (review #22: split rows in `mile` vs km product) and hardcoded units in `SplitChart` (gate #3). The WS5 contract passed the *dataset*, but the composer hardcoded mile labels. **Improvement:** treat hardcoded unit literals in composed copy as a content-gate violation (same class as the spec-note pattern, gate #2).
11. **py-14 + drop shadow on the detail pane** (review #23) — spacing-ladder violation slipped through. **Improvement:** fold the 8px-rhythm ladder into the deterministic gate for the dominant pane.

### Process / tooling improvements
12. **Timing:** 320s wall vs the 120–180s acceptance target (Wave 2: 117s, Wave 4: 118s). Wave 4 is nearly half the run — repair + re-verify + re-review is expensive. **Improvement:** budget repair rounds (6 repair calls this run), gate repair on cheap-tier rounds only, and re-run `maxi-e2e-modes.test.ts` timing acceptance.
13. **Model validation churn:** `plan` failed JSON validation in 3 of 4 runs (stringified px values like `"9999px"`, over-240-char rationale), `genome` failed attempts (content > 80 chars, pairHints as object, empty body) and fell back to the deterministic genome. The pipeline survives, but **Improvement:** tighten prompts with explicit px-less numeric examples; the salvage/repair path (`gateway.ts` `repairJSON`) should coerce `"9999px"`-style strings — the deterministic fallbacks are doing the work the model was supposed to.
14. **Error surfacing:** `verifyScreens` collapsed the real sandbox failure into "exit status 1". **Improvement:** surface the sandbox stderr (`__SMOKE_FAIL__` line) into the run error instead of the generic exit-code message — it would have saved the entire NavAdapter debug session.

## Verification status of the v24 build plan

All nine workstreams from the v24 build plan are implemented with unit tests, and this session's four fixes are additional hardening on top. The plan's own validation standard is **not yet fully green**:
- `npx tsc --noEmit` — clean for all maxi-agent files (repo has unrelated pre-existing errors in `client/`, `server/email.ts`, `server/lib/ai.ts`, `server/vite.ts`).
- Unit suites — template/geometry/reconcile/domain/mood/convergence/run-store tests pass (static tiers).
- `MAXI_E2E=1 maxi-e2e-modes.test.ts` — not re-run this session (needs fresh runs); timing acceptance (120–180s) is currently exceeded at 320s.
- Manual screenshot check — rendered; visual QA of `home-mobile.png`/`detail-mobile.png` still pending (see remaining issues #5/#6 for what to look for: sparse rows, empty viewport).

## Artifacts in this folder

- `ISSUES_AND_ERRORS.md` — final run's 25 gate/review issues + all-37 v23 disposition + log anomalies
- `RUN_SUMMARY.md`, `run-summary.json` — timing (w0–w4), 43 model calls by role, quality metrics
- `screenshots/` — `home-desktop.png`, `home-mobile.png`, `detail-desktop.png`, `detail-mobile.png`
- `run.log`, `e2e-console-run4-final.log` — full final-run console (tee'd)
- `e2e-console-run1-crash.log` — the original crash console, kept as the regression reference

# Picasso V7 E2E — Diagnosis (agentv7)

**Run:** `e2e-1-1786397271062` — "A minimal habit tracker app for desktop web"
**Mode:** harden · **Date:** 2026-08-10 · **Cost:** $0.1028 (10.28 credits, 41 model calls)

> Scope note: this E2E pass was run as a test with a non-default model tier, and early attempts
> (2–4) degraded on model-output variance (schema shape drift at the design/wireframe stages).
> Those are model-behavior artifacts of the test, not pipeline defects, and are excluded here.
> This report covers the **genuine pipeline issues** that remain independent of the model used.

---

## 🔴 CRITICAL — the E2E run had to be stopped and restarted (data hand-off between processes)

The full E2E was **not** a single uninterrupted process. Attempts were killed and restarted, and
each restart **discarded the previous attempt's in-memory progress; persisted partial artifacts
were orphaned** under a different `runId`:

| Attempt | runId | Outcome |
|---------|-------|---------|
| 1 | `e2e-1-1786393884224` | Killed by an external 15-minute timeout **mid-component-build** (stages 1–4 had already passed). No `run-summary.json` was ever written — the process died before the harness's post-pipeline bookkeeping. |
| 2–4 | `e2e-1-1786394862225` / `e2e-1-1786395522145` / `e2e-1-1786396230010` | Completed but degraded early (stage 2/3 output variance, see scope note). |
| 5 | `e2e-1-1786397271062` | Completed (1316s, $0.103) — 3 screens composed, **0 rendered** (bundle failures). Screenshot pass done manually afterwards. |

Why this is critical:

1. **No checkpoint/resume.** A killed run cannot resume from its persisted `docs/` artifacts —
   stages 1–4 (brief, discovery, design tokens, wireframe, manifest, content, copy) are
   re-generated from scratch on restart, **re-paying the full model cost** (attempt 1 burned
   discovery→build tokens before dying; the relaunch re-bought them).
2. **`run-summary.json` is only written after the pipeline returns.** When the process is killed
   mid-run, cost/usage data for that attempt is lost — the killed attempt wrote no summary, so its
   spend is invisible.
3. **Wall-clock budget blown.** The harness asserts `wallMs < 420_000` (7 min); the completed run
   took 1316s, and the killed attempt ran 900s+ without finishing. The fixed 7-minute budget does
   not hold once latency moves outside the calibrated envelope.
4. **Manual data hand-off.** The final screenshots required a separate manual render pass
   (`screenshot-run.ts`) re-reading the run's output directory — the harness never produced them
   because rendering failed. Any "data transferred between processes" path is fragile by
   construction and was, in this session, the only path to usable output.

---

## Issues & errors

### 1. Missing module: `./separator` — ALL screens failed to bundle
The wireframe manifest never provisioned a `separator` component, but generated components
(`primary-nav`, `week-strip`, `setting-row` — all derived from the `button-group` base) kept the
base's `import { Separator } from "./separator"`. The VFS stub only exported `default` + kebab-name,
so the named import failed:

```
No matching export in "picasso-stub:picasso:src/separator" for import "Separator"
```

Result: all 3 composed screens (today, ledger, settings) failed `bundleScreenForPreview`, 0 renders.

Root cause: the build stage customizes each manifest entry against one base file but never closes
the dependency graph — sibling bases that the base source imports are not provisioned unless the
manifest happens to include them.

### 2. Screen composition prop-contract violations (runtime crashes)
Composed screens crash at runtime against the components they reference:

- `WeekStrip` requires `days`/`value`/`onChange` — the screen passed `data={weekStrip}` (today) or
  nothing (ledger) → `TypeError: Cannot read properties of undefined (reading 'map')`.
- `HabitRow` requires `habit` + `onToggle` — today's screen used it as a plain wrapper passing
  neither → 5× `Cannot read properties of undefined (reading 'done')`.
- `LedgerSwitch` requires `options`/`value`/`onChange` — used with no props → `options.map` crash.

React unmounted the whole tree on these errors (no error boundary), yielding blank white screenshots.
The correction was purely prop-level — pass the real props / use the composer's own `Item` wrapper;
**zero UI changes** — and re-render manually.

Root cause: the composer writes JSX against component names, but nothing validates the usage
against the manifest's `props` contract before the screen is persisted and rendered.

### 3. Assertion results (final run, pre-fix)
```
PASS  at least 1 screen composed (got 3)
FAIL  no smoke failures (got 3)            ← stage-2/3 degradations (scope note) + render
PASS  anti-slop gate passed
FAIL  screens rendered in E2B (0 of 3)     ← issue #1; fixed manually afterwards
FAIL  no render errors (bundle failures)   ← issue #1
FAIL  visual QA passed (0/10)
FAIL  wall time budget (1316.4s < 420s)
PASS  credit budget (10.28 < 80)
```

### 4. Positive findings
- Cost stayed tiny: **$0.10** for a full 3-screen run (41 calls).
- The V7 degradation machinery worked as designed: every non-fatal stage failure produced
  `Degradations.json` + a `run-summary.json` instead of aborting with lost state.
- Anti-slop gate passed on the full run; the visual-review stage was never reached (no renders).

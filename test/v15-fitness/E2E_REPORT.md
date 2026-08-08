# Pastel Agent v15 — E2E Test Report

**Date:** 2026-08-07 · **Runner:** `script/e2e-v6.ts` (v15 driver, live gateway)

**Prompt:**
> Design a personal running coach app — a home dashboard with this week's training plan, run streaks, and weekly mileage stats, and a workout detail page showing pace, splits, elevation, and coach notes for a single run. Make it feel motivating, clean, and athletic.

**Run:** `dc64e361-916a-4be8-a745-0a196830b685` · Title: **Pace** · Status: **done** (no pipeline error)

| Metric | Value |
|---|---|
| Wall time | 561.2s (9.4 min); first present @ 231.0s |
| Screens | `home`, `detail` (canonical pair, 0 failed) |
| Components built | 6 (all mounted by custom blocks) |
| Review score | 48/100 (needs ≥ 70) — decision `RETURN_TO_BUILDER` ×2, repairs = 2 |
| Quality gate | passed=false, score=48 |
| Cost | 51.03 credits ≈ $0.51 across 57 model calls (budget is < 30) |
| Mode / Visual intent | `track` · typeVoice `grotesque` (product-led, no forced browse) |
| Content probes | demo-content free, no broken deltas, no blank sections, no zero tiles |

---

## Screenshots

Rendered proofs of the presented UI (post-review wins) — saved to `test/v15-fitness/screenproof/`:

| Screen | PNG | Probe |
|---|---|---|
| Home (dashboard) | [home.png](screenproof/home.png) | [home.probe.json](screenproof/home.probe.json) |
| Detail (workout record) | [detail.png](screenproof/detail.png) | [detail.probe.json](screenproof/detail.probe.json) |

Every built component rendered standalone — saved to `test/v15-fitness/componentproof/`:

`Avatar` · `Badge` · `Button` · `Card` · `CoachNotesPanel` · `ElevationSummary` · `NextWorkoutCue` · `RunSplitsTable` · `RunStatusSummary` · `StreakProgress`

Full run artifact: [run-summary.json](run-summary.json)

> Note: the PNGs were generated and verified by the driver's headless-chromium probes (all clean). This session's model cannot render images inline, so byte-level verification was done via the `.probe.json` files.

---

## Assertion Results

20 PASS / **4 FAIL** (full list in the run log):

1. **FAIL — detail is the focused secondary workflow** — summary + action expected; detail lacks the sticky summary card (`lg:sticky lg:top-6` + `primaryCta` + `summary`) and gallery: `detailHasGallery=false, detailHasSummary=false, detailHasAction=true, detailHasReviews=false`.
2. **FAIL — stat label units match metrics** — `home: "km" ≠ metric "%"`, `"days" ≠ metric "sets"`, `"%" ≠ metric "days"` — copy plan units don't line up with the deterministic dataset order.
3. **FAIL — review score ≥ 70** — got 48 after two repair rounds.
4. **FAIL — cost < 30 credits** — got 51.03 (repair loop burned ~24 credits).

Passed gates: run completed, exactly 2 canonical screens, mode law (no booking language in a `track` product), card budgets (home 0 ≤ 4, detail 1 ≤ 3), outline-button cap, PNG proofs captured, demo-content free, no `+-` deltas, no blank sections, no zero tiles, all inventory components mounted, builder on cheap stack (`claude-haiku-4-5`), unique catalog rows + semantic `{label,value}` pairs, booking summary correctly skipped for non-stay mode, single conversion point (`primaryCta` ×1), visible input labels, no pipeline error event.

---

## Errors Found (pipeline)

### High severity
- **Pace chart empty on detail** — chart panel shows only a baseline + one `1km` marker, `0.0–0.0` range; fails "explain pace over time with real data".
- **RunSplitsTable shows "No splits available"** while the summary above lists splits 1–9 km — visibly contradictory.
- **Elevation inconsistency** — `RunStatusSummary` reports 64 m gain, `ElevationSummary` displays 0 m.
- **Home shows only the next workout** — the remaining weekly plan / dated sequence is missing from the dashboard.
- **Streak rings broken** — scoreboard says streak 9 days / consistency 75%, but `StreakProgress` rings render `0d` / `0%`.
- **Mount audit** — `RunStatusSummary` required on detail but not imported/rendered there.
- **Inert primary CTA** — `Start shakeout` rendered with no `onClick`/`href`/form.

### Medium severity
- **`--accent-foreground` undefined token** in `NextWorkoutCue` (also `Badge.jsx`, `Button.jsx`) — token violations on interactive surfaces.
- **Detail reads as a stack of outlined panels** — generic `Card` wrapper exceeds the scarce-card guidance.
- **No `prefers-reduced-motion`** — `animate-pulse` loading state in `CoachNotesPanel`.
- **Duplicate start actions** — "Start shakeout" and "Start workout" compete for the primary action.
- **Large empty vertical gap** on home between scoreboard and next-workout panel.
- **Missing longest-streak value** (brief requires current + longest + consistency).
- **Missing volt accent** — detail lacks the Nike-style bold athletic hierarchy.
- **Archivo display font not loaded** — headline falls back to body font (see below).

### Model / schema errors (log)
- **design agent JSON validation failed** (`expected object, received undefined`) — fell back to manifest-derived tokens (Nike hint). Cost 2×0.44c wasted.
- **planner validation failed ×3** — `designIntent` exceeded the 240-char cap for `RunSplitsTable`, `StreakProgress`, `NextWorkoutCue`; fell back to templates.
- **builder color self-check** — 1 hardcoded color still in `NextWorkoutCue` after corrective retry.
- **Geometry: font not loaded: Archivo** (home + detail) — external Google Fonts `<link>` isn't a self-contained sandbox source.

---

## Improvements / Suggestions

### Script (`script/e2e-v6.ts`)
- **BUG: exit-code gate is a no-op.** `checks.filter(([, ok]) => !ok)` destructures the label *string* (second tuple element) instead of the boolean — `ok` is always truthy, so `failed` is always empty, `ALL ASSERTIONS PASSED` prints even with FAIL rows, and the process exits 0. Fix: `checks.filter(([ok]) => !ok)`.
- Assertions reported as FAIL but the summary line still read "ALL ASSERTIONS PASSED" — same root cause.
- Consider `console.error` for the failing-checks summary (currently `console.log`).

### Pipeline
- **Unit contract between `CopyPlan` and `mockDataset`** — stat-label units must be derived from the dataset (same source of truth), not written free-form; the `km/days/%` mismatch broke the units gate.
- **Review gate not converging** — 48/100 after 2 repair rounds; repair budget should either raise per-round success (structured fixes) or lower the bar for release. Cost is dominated by repairs (57 calls, ~24 repair credits) — one more failed repair round would blow the budget further.
- **Design agent JSON reliability** — invalid `undefined` body; add stricter output shaping/retry or accept the fallback deliberately (already logged).
- **Relax or enforce `designIntent` 240-char cap** — planner output is routinely truncated by it; either truncate server-side or raise the cap.
- **Fonts in sandbox** — bundle Archivo (or fallback tokens) instead of an external Google Fonts link so the geometry gate stops flagging "font not loaded".
- **Streak/consistency values** — `StreakProgress` rings rendered `0d/0%` while the scoreboard claims 9 days/75%: data binding (or fallback props) needs one source of truth.
- **Empty-states discipline** — `RunSplitsTable` and the pace chart show placeholder/empty content even though data exists; components should consume the dataset directly instead of hardcoding "No splits available".

---

## Artifacts

```
test/v15-fitness/
├── E2E_REPORT.md            (this file)
├── run-summary.json         full run artifact + layoutSignature
├── screenproof/             home.png, detail.png (+ .html, .probe.json)
└── componentproof/          10 component PNGs (+ .html, .probe.json)
```

Run command:

```bash
PASTEL_E2E_OUT_DIR=v15-fitness npx tsx script/e2e-v6.ts "Design a personal running coach app — …"
```

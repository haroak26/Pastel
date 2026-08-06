# Pastel Agent v7 — Live E2E Test Diagnosis (`test/test2`)

**Date:** 2026-08-05 · **Run:** `dbb68177-eddd-4f48-bee6-691928a2fe91`
**Prompt:** Nike-style fitness training app (home dashboard, workout library, guided run detail, progress overview, profile settings)
**Models:** cheap = `anthropic/claude-haiku-4-5` · mid = `openai/gpt-5.4-mini`
(minimax m3 override removed — `PASTEL_MODEL_PLANNER/APPROVAL` unset)
**Result:** `done` — **5/5 screens verified**, gate 100/100, review 42/100, **2 repair cycles ran**, cost **48.62 credits**, wall **305s** (present at 148s).

> Artifacts: `run-summary.json` (full run), `screenproof/` (5 screen PNGs + HTML + text probes),
> `componentproof/` (16 component PNGs rendered standalone), `docs/…` (brief/wireframe/inventory/
> copy/gate/review persisted in the run's DB docs).

---

## What worked ✅ (the v7 redesign validated end-to-end)

- **Domain content is correct — zero finance leakage.** Every screen renders product-relevant data:
  "9-DAY STREAK", "WEEKLY DISTANCE 18.2km +4% vs last week", "Speed ladder · 7.4 km · Pacing focus ·
  4:57/km", "Set a new 10K PR", settings with "TRAINING GOALS / Weekly distance goal 30 km",
  "UNITS & PREFERENCES". No `$`, no Aperture AI, no invoices, no "deployed to production"
  (all 5 text probes `hasDemoContent:false`). The v6 failure is gone.
- **No broken deltas** (`+-` pattern absent — all probes `brokenDelta:false`; `signed()` works).
- **Scoreboard signature moment renders** (giant tabular numbers + unit labels + accent delta chips,
  no card surfaces) on home and progress screens.
- **Dropdown search, not chip groups** — workout-library uses the `Select` component ("Distance
  units / All").
- **Settings form is domain-driven** — goals/units/notifications sections with toggles + selects;
  detail pane shows real field pairs (Distance 17.7 km · Est. time ~51 min · Pace 5:20/km ·
  Difficulty Moderate · Focus Recovery). No billing/VISA/danger-zone anywhere.
- **Repair loop works on a real run** — 2 bounded cycles, 6 targeted haiku repairs; gate went
  from failing (hardcoded colors in built components) to **100/100, 0 issues**.
- **Hue fix works** — Nike's signature accent is on-brand volt `#EAFF6A` (hue = hueBase), not the
  rotated pink v6 shipped.
- **Deterministic gates caught everything mechanical**; the model review scored real rendered
  output (static + visual review, gpt-5.4-mini) instead of hallucinating truncation.

---

## Issues found (ranked)

### 1. Stat labels/units are semantically mismatched (high — the "Best 5K 18.2 km" bug)
The copy agent relabels stats without respecting what the underlying metric *is*.
`progress-overview` statLabels = `Best 5K / min·km`, `Longest run / km`, `Best week / km`,
`Total runs / count` — but the data slots are `Weekly distance 18.2 km`, `Avg pace 3:02 min/km`,
`Streak 9 days`, `Calories 1,759 kcal`. Rendered as:
`BEST 5K 18.2 min·km` · `LONGEST RUN 3:02 km` · `BEST WEEK 9 km` · `TOTAL RUNS 1,759 count`.
The composer zips copy labels to domain metrics **by position**, so invented labels corrupt
meaning. Also the unit `min·km` (mangled `min/km`) appeared twice.

### 2. Built components still hardcode zero values (high — workout-detail zero tiles)
`WorkoutSteps.jsx` (basedOn `Table`) renders **four identical tiles**: `DISTANCE 0.0 km · TIME 0
min · PACE min/km · CALORIES 0 kcal` ×4. The custom block mounts it with only a `title` prop —
the builder invented internal content with zeros despite the "render props, never hardcode
values" rule. No deterministic gate catches `0.0` literals in components today.

### 3. Chart series/unit mismatch (high — "Weekly distance" chart showing kcal data as km)
`progress-overview` chart: title "Weekly distance" + unit "km" (copy) but the `bars-card` recipe
renders `DATA.series[2]` (Calories, 500–1800) → axis ticks "617 km / 1.2k km", header "kcal".
The recipe picks the series by variant index, not by the copy's title/unit, and accepts the
copy's `chartUnit` even when it contradicts the data.

### 4. Screens are over-stuffed and inventory is half-unused (medium — "duplicated profile")
- `profile-settings` = `detail:pane` + `form:cards` + `list:rows` (three heavy blocks, two
  "Save/Cancel" areas, plus the wireframe repeated bottom-nav feel).
- `workout-library` = `search` + `list:cards` + `detail:pane`; `workout-detail` = `stats:row` +
  `custom[WorkoutSteps]` + `list:rows`.
- Of the 10 planned components, only **6 are actually mounted** by a custom block:
  `PRComparisonStrip`, `RunHistoryTable`, `WorkoutCard`, `WorkoutCaptureSummary` were built
  (and billed) but never reach a screen. The wireframe rule "every component must be used by a
  custom block" is prompt-only — nothing validates it.

### 5. Developer-note text leaks as UI copy (medium)
home-dashboard renders `"Recent run log rows: Easy 5K, Intervals 8x400, Long run 12K with pace,
time, and completion status."` as a section heading — a builder/planner spec note shipped as copy.

### 6. Cost & latency over target (48.62 cr vs ≤30; 305s)
- 10 components but **18 planner + 16 builder calls** (planner JSON retries + 6 builder
  corrective color retries) ≈ 16.4 cr just for build.
- 3 static + 3 visual review calls (2 repair cycles) ≈ 10 cr; 6 repair calls ≈ 6.2 cr.
- Build phase = **256s** of 305s (planner+builder at concurrency 4, with retries).
- Copy ran twice (0.65 + 0.85 cr) — an avoidable double call.

### 7. Minor
- Tabbar labels truncate oddly on detail screen ("Today", "Work") — nav labels derive from
  screen titles, not the brief's screen names.
- `workout-detail` hero ("Speed ladder / 7.4 km workout designed to build speed…") is good —
  but the stats:row under it is generic and redundant with the broken WorkoutSteps tiles.
- `StreakReminderToggle` and the settings form render section titles in all caps (built
  component styling choice; inconsistent with the rest).

### Tooling (fixed during this run)
- `componentproof` capture failed on the first pass (esbuild virtual-fs entry-point resolution)
  — fixed in `script/e2e-v6.ts` and re-run: all 16 components rendered.

---

## Evidence

- `screenproof/*.probe.json` — 5/5 clean (no demo content, no broken deltas, no dup labels).
- `componentproof/*.png` — 16 components; inspect `WorkoutSteps`, `PRComparisonStrip`-adjacent
  screens (`progress-overview.png`) for issues #1–#2.
- `run-summary.json` — costs (48.62 cr, 51 calls), phases, review issues (23).
- DB docs: `WireframePlan.json` (10 components, blocks above), `CopyPlan.json` (statLabels
  evidence), `GateReport.json` (100/0), `ReviewResult.json` (42, RETURN_TO_BUILDER).

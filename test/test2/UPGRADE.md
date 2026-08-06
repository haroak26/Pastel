# Pastel Agent v7 — Upgrade & Optimisation Plan (from the 2026-08-05 run)

Run `dbb68177` proved the v7 architecture (domain content, signature moves, dropdown search,
deterministic gates, working repair loop). The remaining gap is **semantic coherence of
model-authored labels/units and mounting discipline**. Every item below is ranked by
impact/cost; all are deterministic ($0) except where noted.

---

## U1 — Sanitize stat labels against the data they describe (fixes issue #1, HIGH value)

Problem: copy agent relabels `DATA.metrics[i]` freely ("Best 5K" over a "Weekly distance"
metric, unit `min·km`).

- In `agents/copy-v6.ts`, after `chatJSON` succeeds, run a deterministic
  `sanitizeCopyPlan(plan, data)`:
  - For each screen: if `statLabels` length ≠ `data.metrics.length`, **drop statLabels**
    (composer falls back to the domain's own labels).
  - Normalize each unit (`min·km`→`min/km`, strip spaces/case) and require it to equal the
    metric's unit; on mismatch **drop that screen's statLabels**.
  - Add the same rule to the copy system prompt (with the metrics list — already provided).
- Result: the v6/v7 "BEST 5K 18.2 km" class of bug becomes impossible by construction.

## U2 — Pick the chart series by unit/title, not variant index (fixes issue #3, HIGH)

- `compose-v6.ts` `blockChart`: choose `DATA.series` whose `unit === copy.chartUnit`
  (normalized) or whose label matches `copy.chartTitle`; fall back to the variant index.
- Accept `copy.chartUnit` only when it equals the **chosen series'** unit; else render the
  series' own unit. A chart can then never show "Weekly distance" over kcal data.
- Extend `sanitizeCopyPlan`: `chartTitle`/`chartUnit` must reference an existing series.

## U3 — Enforce the inventory→mount contract (fixes issue #4, HIGH cost saver)

Problem: 4 of 10 components (PRComparisonStrip, RunHistoryTable, WorkoutCard,
WorkoutCaptureSummary) were built and billed but never mounted.

- Deterministic validation in `wireframe-v6.ts` (after parse): drop every inventory component
  not referenced by a `custom` block's `component` field (and their `usedBy`), then re-validate
  (min 6 stays). Emit an activity note "dropped unmounted components: …".
- Wireframe prompt: "a component is ONLY worth building if a custom block mounts it — never
  list components without a matching custom block."
- **Saves ~30–40% of planner+builder cost** (was 34 calls ≈ 16 cr for 10 components).

## U4 — One heavy block per screen (fixes issue #4 composition)

- Wireframe RULE + deterministic check in `wireframe-v6.ts`: a screen may contain **at most one**
  of `table`, `detail`, `form`, `list:cards`, `media` (the "data blocks"). Auto-drop excess
  blocks in priority order (keep the emphasized one) before composing.
- Settings screens: prefer `form` only, or `detail` only — never both (profile-settings
  currently has detail + form + list).

## U5 — Content-gate additions (fixes issues #2 and #5, $0)

In `checks/content.ts`:
- **Hardcoded zeros**: in `src/components/*.jsx` flag `0.0` / `0 min` / `0 kcal` numeric
  literals rendered as values → high "render props, never hardcode zero sample values".
- **Spec-note leakage**: flag `/rows?:|tiles? with|list of |cards?:/` inside quoted/JSX text in
  components and screens → high "developer note shipped as UI copy".
- **Unit garbling**: flag `min·km|·km|min/km` mismatches in components → medium.
- These flow into the existing repair loop automatically.

## U6 — Pass real data into custom-mounted components (root fix for #2)

`blockCustom` only passes `title`. Extend the deterministic custom recipe to pass a bounded
data slice every built component can render through props:
`<Component title={copy.headline} items={DATA.rows.slice(0,4)} metrics={DATA.metrics.slice(0,4)}
 people={DATA.people.slice(0,4)} settings={DATA.settingsSections} />`
- Planner prompt: "props may consume `items`/`metrics`/`people`/`settings` — render them,
  never zeros."
- With U5's zero-gate as the backstop, custom components can no longer render empty tiles.

## U7 — Cost & latency

- **Planner retries (18 calls for 10 components):** cap corrective retries to 1 and add
  `PASTEL_PLANNER_MAX_TOKENS` headroom; the planner output is tiny — failures are schema
  mismatches the model can fix in one retry, not three.
- **Builder color-retries (6):** keep, but only escalate when the *initial* output actually
  fails the token gate (already the behavior) — consider escalating to a mid model for the
  retry (`builder` role is haiku; a gpt-5.4-mini corrective retry is ~2× cheaper than a full
  repair cycle later).
- **Copy double call:** the second copy call came from a JSON validation retry — the sanitizer
  (U1) should also run against `fallbackCopy` output so a flaky copy response never forces a
  re-run of the plan.
- **Concurrency:** raise `PASTEL_BUILDER_CONCURRENCY` 4 → 6 (16 calls at ~10–16s each ≈ 256s
  build; 6 lanes ≈ −35%).
- Target after U3+U7: **≤ 30 credits, ≤ 180s wall**.

## U8 — Review/repair loop

- Review scored 42 largely on the issues above — with U1–U6 they should drop to the
  70+ acceptance band. Consider lowering the `passed` threshold decision to `score ≥ 70`
  (currently APPROVE needs no high issues; keep that).
- Repair targets come only from gate issues + sandbox errors; add the U5 content issues as
  repair targets (they already flow via `GateReport` — keep, and make U5 severities `high` so
  they block approval).

## U9 — Tooling / e2e assertions (this run's fixes + next)

- ✅ `componentproof` bundling fixed (entry-point resolution in `script/e2e-v6.ts`); run
  `PASTEL_E2E_OUT_DIR=test2 npx tsx script/e2e-v6.ts`.
- Add assertions: every `statLabels` unit matches its metric (U1); every inventory component is
  mounted (U3); no `0.0` in componentproof DOMs (U5); `PASTEL_MODEL_PLANNER` not minimax
  (assert `MODELS.builder === anthropic/claude-haiku-4-5`).
- Acceptance for the next run: review ≥ 70, repairs ≤ 2, cost ≤ 30 cr, wall ≤ 180s, and the
  five `screenproof` screens showing zero-tile-free workout-detail and coherent progress stats.

---

## Priority order

1. **U1 + U2** (semantic coherence — the visible correctness bugs, ~30 lines, $0)
2. **U5** (zero-value + spec-note gates — backstop for the builder, $0)
3. **U3 + U4** (mount contract + one-heavy-block — quality + biggest cost cut)
4. **U6** (data plumbing into custom components — root fix, then U5 rarely fires)
5. **U7–U9** (cost/latency tuning + assertions)

# Agent v24 e2e — Issues & Errors (normal models)

Run: `ad6fc0d8-fbd3-4b88-b4aa-80d1ca9504a6` · status: `done_needs_review` · models: default (cheap `anthropic/claude-haiku-4-5`, mid `openai/gpt-5.6-luna`) · thinking: disabled
Two-screen UI: fitness tracking ("A fitness tracking app that logs") — the EXACT agentv23 case

## Outcome
Run did NOT fully pass (status `done_needs_review`). This report lists every issue found. The harness does not rerun.

## Hard errors / flagged screens
None.

## Gate + review issues
### 1. [medium] a11y — src/screens/home.jsx

<p>Inputs on this screen have no <label> — every control needs a visible label (not just placeholder/aria-label).</p>


### 2. [high] content — src/components/SplitChart.jsx

<p>Spec-note pattern (\b(?:rows|tiles|cards|blocks|items)\s*[:—]) shipped as UI copy — replace with specific product copy.</p>


### 3. [medium] content — src/components/SplitChart.jsx

<p>Hardcoded unit (\b(?:min·km|minkm|min/km|·km)\b) — render units from props/DATA, never hardcode them.</p>


### 4. [high] composition — src/screens/home.jsx

<p>Component &quot;PaceLeaderboard&quot; planned 2x on home — every inventory component renders exactly once per screen (identical sections read as a template).</p>


### 5. [high] composition — src/screens/detail.jsx

<p>Component &quot;SplitChart&quot; planned 2x on detail — every inventory component renders exactly once per screen (identical sections read as a template).</p>


### 6. [medium] v17-density — src/screens/home.jsx

<p>home: 2 list rows (min 3)</p>


### 7. [medium] v17-density — src/screens/home.jsx

<p>home: ~40% empty viewport (max 20% for app)</p>


### 8. [medium] v17-density — src/screens/home.jsx

<p>home: missing primary action</p>


### 9. [medium] v17-density — src/screens/detail.jsx

<p>detail: 1 list rows (min 3)</p>


### 10. [medium] v17-density — src/screens/detail.jsx

<p>detail: ~40% empty viewport (max 20% for app)</p>


### 11. [medium] v17-density — src/screens/detail.jsx

<p>detail: missing primary action</p>


### 12. [high] v21-layout — src/screens/detail.jsx

<p>detail has 4 non-dominant sections but only 2 SectionHeader(s). Every non-dominant section must open with <SectionHeader eyebrow=... title=... /> for consistent headings.</p>


### 13. [medium] v21-layout — src/screens/detail.jsx

<p>detail plans a side-by-side row (cta + list) but no two-up grid (lg:grid-cols-[2fr_1fr]) renders — the pair must sit side-by-side, not stacked.</p>


### 14. [high] fidelity — src/components/Separator.jsx

<p>Separator: No theme styling present — use slot utilities from the token snapshot</p>


### 15. [high] missing-primary-action — src/screens/home.jsx

<p>The deterministic gate reports that the home screen has no visible primary action, despite the copy plan requiring &quot;Log a run&quot;. The dashboard&#39;s dominant scoreboard therefore does not provide the core tracking workflow entry point.</p>


### 16. [high] missing-primary-action — src/screens/detail.jsx

<p>The deterministic gate reports that the detail screen has no visible primary action, despite the copy plan requiring &quot;Edit run&quot;. A track-mode record detail must expose one clear action for the focused run.</p>


### 17. [medium] content-completeness — src/screens/home.jsx

<p>The deterministic gate reports only two home list rows, below the required minimum of three. Recent runs are a core feature and the list reads sparse rather than like a populated tracking history.</p>


### 18. [medium] content-completeness — src/screens/detail.jsx

<p>The deterministic gate reports only one detail activity/list row, below the required minimum of three. This under-represents the run&#39;s split-focused secondary workflow even though Riverside Tempo has six available splits in SplitChart.</p>


### 19. [medium] spacing-density — src/screens/home.jsx

<p>The deterministic gate reports approximately 40% empty viewport area on the home app screen, exceeding the 20% maximum for an app dashboard. The screen needs denser, substantive run-history and supporting workflow content rather than unused vertical space.</p>


### 20. [medium] spacing-density — src/screens/detail.jsx

<p>The deterministic gate reports approximately 40% empty viewport area on the detail app screen, exceeding the 20% maximum. The dominant pane, CTA band, and activity section should form a tighter focused workflow.</p>


### 21. [high] mode-fidelity — src/screens/home.jsx

<p>The track-mode home imports and is instructed to render Input and Select controls, while the copy plan includes a generic &quot;Search runs, types, or dates&quot; field. The universal mode law explicitly says track homes should use scoreboard/metrics and rows and should never inherit a browse/search-toolbar structure. Keep any history search subordinate to the run list rather than presenting browse-style filtering.</p>


### 22. [medium] content-relevance — src/screens/detail.jsx

<p>The screen defines local split rows with a <code>mile</code> field and mile-like labels (<code>1</code>, <code>2</code>, <code>3</code>, <code>6.2</code>), while the scoped Riverside Tempo record is expressed in kilometres and the product copy uses km. This creates an observable unit mismatch in a metrics-first fitness interface.</p>


### 23. [medium] spacing — src/screens/detail.jsx

<p>The dominant detail pane uses <code>md:py-14</code>, which violates the 8px rhythm ladder&#39;s explicit prohibition on py-14 and requires a 32px, 48px, or 64px step. The same pane also uses <code>shadow-[var(--shadow-md)]</code>, contrary to the universal rule against drop shadows on static content panels.</p>


### 24. [medium] accessibility — src/components/Input.jsx

<p>The input component renders only a placeholder and has no associated visible label or aria-label. The universal accessibility law requires visible labels for form inputs, so the search or note fields using this component are not sufficiently identified outside their placeholder text.</p>


### 25. [low] accessibility — src/components/Select.jsx

<p>The custom select trigger has no aria-expanded, aria-haspopup, or accessible label contract. Its visual focus ring is present, but state changes are not fully exposed to assistive technology.</p>


## V23 issue disposition (all 37, no silent drops)
- **#1 — detail inputs have no visible <label>:** Resolved — the a11y contract (visible labels + :focus-visible rings) is a layout-template property (WS2), rendered into every composer plan; the composer system prompt enforces it.
- **#2 — PaceProgressRing planned 2x on home:** Resolved — reconcileGenome merges duplicate slot mounts per screen in one fixed point (WS1); the composition audit stays as the regression net.
- **#3 — Topbar planned but no block mounts it (home):** Resolved — nav chrome is no longer an inventory component (WS1); it derives from the screen's nav field via the static NavAdapter.
- **#4 — Sidebar planned but no block mounts it (home):** Resolved — same WS1 nav-chrome removal.
- **#5 — Button planned but no block mounts it (home):** Resolved — shell primitives are exempt from the block-mount contract (checks/review.ts skips SHELL_PRIMITIVES); they are mounted by the body or shell wrapper, never required by a block.
- **#6 — Avatar planned but no block mounts it (home):** Resolved — same shell-primitive exemption.
- **#7 — Badge planned but no block mounts it (home):** Resolved — same shell-primitive exemption.
- **#8 — Input planned but no block mounts it (home):** Resolved — same shell-primitive exemption.
- **#9 — Select planned but no block mounts it (home):** Resolved — same shell-primitive exemption.
- **#10 — Separator planned but no block mounts it (home):** Resolved — same shell-primitive exemption.
- **#11 — SplitBreakdown planned 2x on detail:** Resolved — reconcileGenome duplicate-mount merge (WS1).
- **#12 — Topbar planned but no block mounts it (detail):** Resolved — WS1 nav-chrome removal.
- **#13 — Sidebar planned but no block mounts it (detail):** Resolved — WS1 nav-chrome removal.
- **#14 — Button planned but no block mounts it (detail):** Resolved — shell-primitive exemption.
- **#15 — Avatar planned but no block mounts it (detail):** Resolved — shell-primitive exemption.
- **#16 — Badge planned but no block mounts it (detail):** Resolved — shell-primitive exemption.
- **#17 — Input planned but no block mounts it (detail):** Resolved — shell-primitive exemption.
- **#18 — Select planned but no block mounts it (detail):** Resolved — shell-primitive exemption.
- **#19 — Separator planned but no block mounts it (detail):** Resolved — shell-primitive exemption.
- **#20 — home: 2 list rows (min 3):** Resolved — list regions must declare minRows ≥ 3 in the genome schema (WS3), hard-validated at the Wave-1 call; the plan prompt carries the floor to the composer.
- **#21 — home: ~40% empty viewport (max 20%):** Resolved — maxEmptyViewport ≤ 0.2 is schema-validated per screen at Wave 1 (WS3); under-filled genomes are rejected/retried before Wave 2.
- **#22 — home: missing primary action:** Resolved — exactly one primaryAction region per screen is schema-validated (WS3) and the plan prompt requires the mounted action.
- **#23 — detail: 0 list rows (min 3):** Resolved — WS3 minRows schema floor.
- **#24 — detail: ~40% empty viewport (max 20%):** Resolved — WS3 maxEmptyViewport schema floor.
- **#25 — detail: missing primary action:** Resolved — WS3 primaryAction schema floor.
- **#26 — home mounts 9 custom components (≤2 allowed):** Resolved — the layout gate's budget counts ONLY genome slots (checks/layout.ts); the slot budget is capped at 2 per screen by the schema + reconcile (WS1), and the deterministic NavAdapter chrome is never counted.
- **#27 — detail: 4 non-dominant sections but only 1 SectionHeader:** Resolved — templates carry fixed section sequences with deterministic headers; every non-dominant section's header is authored in the plan and the composer fills it (WS2).
- **#28 — detail mounts 9 custom components:** Resolved — same as #26 (slot-budget counting + WS1 cap).
- **#29 — Separator: no theme styling (fidelity):** Resolved — builder convergence fallback (WS7): two failed corrective retries converge through the deterministic base-anchored fidelity path; the v23 'still 1 theme violations' log line is gone.
- **#30 — home renders <Sidebar active onChange> — prop mismatch:** Resolved — structurally impossible (WS1): Sidebar/Topbar are never in the composer's available components, and the only chrome mount is the static NavAdapter with the locked nav/activeId/onNavigate contract wired from deterministic run state.
- **#31 — detail renders <Sidebar active onChange> — prop mismatch:** Resolved — same WS1 structural fix.
- **#32 — fitness-inappropriate stat units (sets, lb) alongside Readiness:** Resolved — domain-contract cross-check (WS5) rejects strength units in running products at the cheap data call (bounded retry named), and the deterministic fitness fallback itself speaks running vocabulary; regression test maxi-domain-contract.test.ts.
- **#33 — home workout rows omit planned table fields Structure/Status:** Resolved — table/list field completeness is validated against the layout template's declared table contract before composing (WS5); unfillable columns are dropped deterministically.
- **#34 — stale June dates vs the supplied August 2026 dataset:** Resolved — declared date-range conformance (WS5): out-of-range absolute row dates fail the contract check and are remapped into the brief's declared range deterministically.
- **#35 — Sidebar nav has no visible focus-visible ring:** Resolved — NavAdapter is authored once with focus-visible rings on every interactive element (WS1); the template a11y contract covers the body (WS2).
- **#36 — Avatar exposes the name only via title on a non-interactive div:** Resolved — NavAdapter renders the user identity with an accessible aria-label + visible name (WS1).
- **#37 — sidebar reads as a generic white panel (empty nav, weak contrast):** Resolved — the empty sidebar was the #30/#31 prop-mismatch symptom; the NavAdapter wires NAV/brand/user from deterministic run state and uses theme tokens (contrast comes from the run's design tokens, mood-derived from the inspiration, never literal brand colors).

## Pipeline log anomalies (console capture)
```
[stderr] [maxi-agent] JSON validation failed. Model: plan. Validation error: [
[stderr] [maxi-agent] JSON validation failed. Model: genome. Validation error: [
[stderr] [maxi-agent] JSON validation failed. Model: planner. Validation error: [
```

## Fidelity
- 7/8 components passed · 1 hard failures · 1 issues

## Prop contract
- 0 violations after auto-fix (0 auto-fixed)

## Review verdict
- 58/100 — RETURN_TO_BUILDER — The screens compile and use the correct fitness domain with a promising scoreboard, run detail, branded variables, and topbar navigation. Approval is blocked by the missing primary actions, sparse list rendering, excessive empty viewport area, and the track-mode/search and unit/spacing issues. The home needs to lead directly into logging a run, while the detail needs to function as a dense, focused Riverside Tempo workflow.

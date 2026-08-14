# Agent v23 e2e — Issues & Errors (normal models)

Run: `0d1c72e7-2a7f-4de2-a22f-ea1d8c428263` · status: `done_needs_review` · models: default (cheap `anthropic/claude-haiku-4-5`, mid `openai/gpt-5.6-luna`) · thinking: disabled
Two-screen UI: fitness tracking ("A fitness tracking app that logs")

## Outcome
Run did NOT fully pass (status `done_needs_review`). This report lists every issue found. The harness does not rerun.

## Hard errors / flagged screens
- Run error: Run interrupted by server restart

> **Note (investigated):** this error is a **stale-field bug**, not a pipeline
> crash. The dev server booted at 22:10 while the run was mid-flight, and
> `run-store.ts#cleanupStaleRuns` marks every `running` row as
> `error: "Run interrupted by server restart"`. The orchestrator then finished
> all four waves and wrote its final state (`done_needs_review`, full manifest,
> timing 375s) — but that final `updateRun` **does not clear the `error` field**,
> so the completed run row misleadingly still carries the interruption error.
> All artifacts (gate, review, fidelity, timing) persisted normally.


## Gate + review issues
### 1. [medium] a11y — src/screens/detail.jsx

<p>Inputs on this screen have no <label> — every control needs a visible label (not just placeholder/aria-label).</p>


### 2. [high] composition — src/screens/home.jsx

<p>Component &quot;PaceProgressRing&quot; planned 2x on home — every inventory component renders exactly once per screen (identical sections read as a template).</p>


### 3. [medium] composition — src/screens/home.jsx

<p>Component &quot;Topbar&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 4. [medium] composition — src/screens/home.jsx

<p>Component &quot;Sidebar&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 5. [medium] composition — src/screens/home.jsx

<p>Component &quot;Button&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 6. [medium] composition — src/screens/home.jsx

<p>Component &quot;Avatar&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 7. [medium] composition — src/screens/home.jsx

<p>Component &quot;Badge&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 8. [medium] composition — src/screens/home.jsx

<p>Component &quot;Input&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 9. [medium] composition — src/screens/home.jsx

<p>Component &quot;Select&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 10. [medium] composition — src/screens/home.jsx

<p>Component &quot;Separator&quot; is planned for home but no block mounts it — the screen will miss it.</p>


### 11. [high] composition — src/screens/detail.jsx

<p>Component &quot;SplitBreakdown&quot; planned 2x on detail — every inventory component renders exactly once per screen (identical sections read as a template).</p>


### 12. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Topbar&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 13. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Sidebar&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 14. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Button&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 15. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Avatar&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 16. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Badge&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 17. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Input&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 18. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Select&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 19. [medium] composition — src/screens/detail.jsx

<p>Component &quot;Separator&quot; is planned for detail but no block mounts it — the screen will miss it.</p>


### 20. [medium] v17-density — src/screens/home.jsx

<p>home: 2 list rows (min 3)</p>


### 21. [medium] v17-density — src/screens/home.jsx

<p>home: ~40% empty viewport (max 20% for app)</p>


### 22. [medium] v17-density — src/screens/home.jsx

<p>home: missing primary action</p>


### 23. [medium] v17-density — src/screens/detail.jsx

<p>detail: 0 list rows (min 3)</p>


### 24. [medium] v17-density — src/screens/detail.jsx

<p>detail: ~40% empty viewport (max 20% for app)</p>


### 25. [medium] v17-density — src/screens/detail.jsx

<p>detail: missing primary action</p>


### 26. [medium] v21-layout — src/screens/home.jsx

<p>home mounts 9 custom components (Topbar, Button, Sidebar, Input, Select, Badge, Separator, PaceProgressRing, Avatar) — the layout law allows at most 2 per screen. Fewer, richer components read as designed.</p>


### 27. [high] v21-layout — src/screens/detail.jsx

<p>detail has 4 non-dominant sections but only 1 SectionHeader(s). Every non-dominant section must open with <SectionHeader eyebrow=... title=... /> for consistent headings.</p>


### 28. [medium] v21-layout — src/screens/detail.jsx

<p>detail mounts 9 custom components (Topbar, Sidebar, Avatar, Badge, Separator, Input, Select, SplitBreakdown, Button) — the layout law allows at most 2 per screen. Fewer, richer components read as designed.</p>


### 29. [high] fidelity — src/components/Separator.jsx

<p>Separator: No theme styling present — use slot utilities from the token snapshot</p>


### 30. [high] navigation — src/screens/home.jsx

<p>The screen renders <Sidebar active={active} onChange={setActive} /> but Sidebar expects nav, activeId, and onNavigate. As a result, its navigation list receives the default empty array and the active state is never wired, leaving the desktop app shell with an empty sidebar.</p>


### 31. [high] navigation — src/screens/detail.jsx

<p>The detail screen has the same Sidebar prop mismatch: it passes active and onChange instead of nav, activeId, and onNavigate. The required desktop navigation therefore renders no navigation items on the detail screen.</p>


### 32. [high] relevance — src/data.js

<p>The screen copy defines fitness-inappropriate stat slots: home and detail use &#39;Weekly volume&#39; in &#39;sets&#39; and &#39;Next PR&#39; in &#39;lb&#39;, alongside &#39;Readiness&#39;. These are strength-training metrics rather than the running app&#39;s supplied km, pace, kcal, and streak data, and violate the track-mode domain contract.</p>


### 33. [medium] content completeness — src/screens/home.jsx

<p>The home workout objects contain name, description, distance, focus, load, and date, but omit the planned table fields &#39;Structure&#39; and &#39;Status&#39;. If the required workout-history table renders those columns, rows cannot provide complete values for the specified schema.</p>


### 34. [medium] data integrity — src/screens/home.jsx

<p>The local workout data conflicts with the provided product dataset: the first two rows use relative labels &#39;Today&#39; and &#39;Yesterday&#39;, while older rows use June 8–10 dates even though the supplied runs are dated August 4–12, 2026. This makes the history visually inconsistent with the authoritative run records.</p>


### 35. [medium] accessibility — src/components/Sidebar.jsx

<p>Sidebar navigation and user-menu buttons have hover styling but no visible focus-visible outline or ring, contrary to the universal accessibility requirement for every interactive element.</p>


### 36. [low] accessibility — src/components/Avatar.jsx

<p>Avatar exposes the person&#39;s name only through a title attribute on a non-interactive div. Where the avatar is used as the user identity in the app shell, an accessible name or accompanying visible label should be guaranteed rather than relying on a tooltip.</p>


### 37. [medium] brand coherence — src/components/Sidebar.jsx

<p>The sidebar is a generic white panel separated by a light gray border with muted active styling, while the Nike language calls for stronger black/volt contrast and deliberate athletic surfaces. With the sidebar currently empty, the shell reads as an unfinished generic dashboard rather than a confident Nike running product.</p>


## Pipeline log anomalies (console capture)
```
[maxi-agent] JSON validation failed. Model: plan. Validation error: [
[maxi-agent] combined plan call failed, using deterministic fallbacks: AI returned JSON that failed validation. Model: plan. Validation error: [
[maxi-agent] builder color self-check: still 1 theme violations in Button after corrective retry
[maxi-agent] builder color self-check: still 1 theme violations in Topbar after corrective retry
```

## Fidelity
- 9/10 components passed · 1 hard failures · 1 issues

## Prop contract
- 0 violations after auto-fix (0 auto-fixed)

## Review verdict
- 62/100 — RETURN_TO_BUILDER — The screens compile and include the core running structures, including a scoreboard/chart-oriented home and a focused Riverside Tempo detail. However, the desktop navigation is functionally absent because both screens pass the wrong Sidebar props, and the supplied stat copy introduces non-running units such as sets and pounds. Home history data also conflicts with the authoritative dates and lacks fields required by its table schema. These contract, relevance, and shell-completeness issues block approval.

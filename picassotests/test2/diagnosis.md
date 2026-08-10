# Picasso V2 (New Agent) — E2E Test Findings

**Run ID:** test2-1786318120304
**Started:** 2026-08-09T23:20:30.343Z
**Completed:** 2026-08-09T23:28:40.303Z
**Duration:** 490.0s
**Overall:** PARTIAL — all 11 pipeline stages executed, but screens FAIL visual QA (avg 0/10)
**Cost:** $0.3335 (33.35 credits, 51 model calls)

## Test Brief
- **Product:** Wavelength
- **Description:** A budgeting app for Gen Z that makes tracking money feel like a game. Users see spending breakdowns, set savings goals, and earn streak rewards for hitting budgets. Core screens are a dashboard and a goals view.
- **Niche:** fintech | **Personality:** playful, bold, minimal
- **Context detected:** app

## Stage Results

### ✓ stage-1-discovery (3.8s)

### ✓ stage-2-directions (attempt 1/3) (3.6s)

### ✓ stage-2-tokens (8.7s)

### ✓ stage-3-architecture (120.2s)

### ✓ stage-4-content (76.5s)

### ✓ stage-5-components (149.8s)

### ✓ stage-5-catalog (20.2s)

### ✓ stage-6-screen-dashboard (15.7s)

### ✓ stage-6-screen-goals (14.9s)

### ✓ stage-7-visual-qa (62.0s)

### ✓ stage-8-finalize (14.6s)

## Critique Results
- **Average score:** 0/10 | **Passed all:** false
- **Blocking defects (vision model, per screenshot):**
  - dashboard: `$NaN` values in budget card, `undefined` logo, sidebar error (undefined property access), Active goals + Recent transactions sections crash with component errors
  - goals: mostly blank/error regions, `undefined` logo text, runtime errors on `startsWith`/`map`, missing currency code

## Screen Feedback

### dashboard
- **Strengths:** none (renders, but sections crash)
- **Improvements:** productContext, brandCoherence, hierarchy, composition, spacingRhythm, componentConsistency, navigation, contentCopy, responsiveDesign, accessibilityBaseline

### goals
- **Strengths:** none
- **Improvements:** productContext, brandCoherence, hierarchy, composition, spacingRhythm, componentConsistency, navigation, contentCopy, responsiveDesign, accessibilityBaseline

## Key Finding — Composed Screens Crash at Runtime

The full V2 pipeline executes end-to-end (all 11 stages pass), and screenshots are real E2B renders — **but the composed screens crash at runtime** because of data-contract mismatches between the content stage, the component builders, and the screen composer:

1. **Prop name mismatches** — the screen passes `items={budgetItems}` to `BudgetStatusList`, which declares a `budgets` prop (so `budgets.map` throws). The screen composer invents prop names the component builder never declared.
2. **Type mismatches** — components type `timestamp: Date` and call `first.timestamp.getTime()` / `Intl.DateTimeFormat().format(...)`, but the screen fills `timestamp` with display strings like `"Today, 9:42 AM"` → `Invalid time value`.
3. **Dangling imports** — components import siblings that were never generated (e.g. `./Button` with only `DeleteButton` in the manifest). The VQA bundler now stubs these so the rest of the page still renders.
4. **Format/undefined values** — `undefined` logo text, `$NaN` amounts, missing currency codes — data shapes from stage 4 don't reach the components as typed.

Screenshots (saved below) show the light-mode dashboard + goals renders with inline red "Component error" cards where these crashes occur — this is the honest state of the agent's output. **The pipeline has no runtime smoke test between stage 6 (compose) and stage 7 (critique)** — stage 7 is the first place crashes surface, and they surface as 0-score screens.

## Improvements & New Features

### High Priority
1. **Runtime smoke test before critique** (NEW, from this run) — composed screens crash at runtime (prop/type mismatches) and only surface in stage 7 as 0-score renders. Add a bundle + render smoke test in stage 6 that catches `budgets.map`-style crashes and feeds the error back into a compose retry.
2. **Shared prop contract between component builder and screen composer** (NEW) — `BudgetStatusList` declares `budgets`, the composer passes `items`; `timestamp: Date` vs `"Today, 9:42 AM"` strings. The manifest should expose typed props to the composer so it cannot invent names/shapes.
3. **E2B sandbox template fix** — `Sandbox.create({ template: "node" })` failed (404: template not found). Switched to the default `code-interpreter-v1` template which ships Node 20.
4. **E2B chromium deps** — Puppeteer in the sandbox failed to launch Chromium (missing libnspr4/libnss3/etc). Added an `apt-get install` step before puppeteer use; otherwise every E2B render falls back to local Playwright.
5. **E2B renderer was a no-op** — the old `generatePreviewHTML` never mounted the React screen (only a comment), producing blank screenshots. Stage 7 now bundles the real screen + components and passes the prebuilt HTML into the sandbox.
6. **Stage 7 bundling omitted components** — `renderScreen` bundled the screen file alone, so any `./button`-style component import failed and fell back to placeholder SVGs. The vfs now includes all generated component files, plus stub modules + per-component error boundaries so one crashing component no longer blanks the whole screenshot.
7. **Per-screen copy wiring** — content stage produces `copy.screens[screenId]` but `composeAllScreens` expects one generic `CopyPlan` for every screen. The e2e composes per-screen with its own copy; the pipeline should accept per-screen copy natively.

### Medium Priority
8. **Usage/cost tracking** — pipeline stages never pass `onUsage`, so per-run cost is invisible to callers. The e2e wraps the gateway client to record usage; the pipeline should expose a usage hook for production runs.
9. **Critique scoring fallback** — when the vision review agent fails, scores default to a flat 5.0 with ALL dimensions failing; a narrower fallback (retry once, then code-only review) would be more honest.
10. **renderAllScreens is serial** — each screen renders in its own E2B sandbox sequentially; parallelizing with p-limit would cut the QA stage roughly in half.
11. **Stage 2 directions validation resilience** — the model frequently returns a single wrapped direction object instead of a 3-item array, failing the old `arr.length !== 3` validator. Relaxed to accept 1-3 items and object wrappers (`{directions: [...]}`).

### Future Features
12. **E2B sandbox reuse** — puppeteer install (~1-2 min) repeats per sandbox. A persistent sandbox or a pre-built template with puppeteer + deps would speed up renders.
13. **Render quality gate** — `validateScreenshotSet` exists but scores are still attempted on blank/placeholder screenshots; gate should short-circuit scoring when a render falls back to SVG.

## Issues Found

- No stage errors — the pipeline runs end-to-end. The failures are in the generated OUTPUT, not the harness:
  - ⚠ Composed screens crash at runtime (dashboard + goals): prop-name mismatches (`items` vs `budgets`), string-vs-Date timestamps, dangling sibling imports, `$NaN` amounts, `undefined` logo/currency — see "Key Finding" above.
  - ⚠ Content coherence: Generic placeholder content detected: "Description"
  - ⚠ Vision critique scored both screens 0/10 (correctly rejecting crash-ridden renders).
  - ⚠ Final quality gates: `screenGatePassed: false`, `antiSlopGatePassed: false` (brief/token/component gates passed).

## Run Details (Cost)

| Model | Calls | Cost (USD) |
|-------|-------|------------|
| openai/gpt-5.6-luna | 48 | $0.3 |
| anthropic/claude-haiku-4-5-20251001 | 3 | $0.0335 |
| **Total** | **51** | **$0.3335** |
- **Tokens:** 379059 (33.35 credits)

## Artifacts

| File | Type | Size |
|------|------|------|
| discovery.json | json | 1521 bytes |
| creative-directions.json | json | 1067 bytes |
| tokens.json | json | 2713 bytes |
| tokens.css | css | 2910 bytes |
| tailwind.config.ts | ts | 4188 bytes |
| layout-plan.json | json | 5254 bytes |
| components-manifest.json | json | 40989 bytes |
| brand-kit.json | json | 6961 bytes |
| content-data.json | json | 24394 bytes |
| content-copy.json | json | 7690 bytes |
| components | dir | 1264 bytes |
| catalog-page.tsx | tsx | 17946 bytes |
| screen-dashboard.tsx | tsx | 10258 bytes |
| screen-goals.tsx | tsx | 9270 bytes |
| screenshot-dashboard.png | png | 98856 bytes |
| screenshot-goals.png | png | 48291 bytes |
| critique-results.json | json | 2468 bytes |
| visual-qa-feedback.json | json | 644 bytes |
| final-report.md | md | 1339 bytes |
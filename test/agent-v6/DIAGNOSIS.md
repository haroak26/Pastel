# Agent v6 — Live E2E Test Diagnosis

**Date:** 2026-08-04 · **Run:** `2bf28bf8-7ea1-49d3-b031-78088eeaca5c` (reproducible via `npx tsx script/e2e-v6.ts`)
**Prompt:** Nike-style fitness training app for runners (home dashboard, workout library, guided run, performance history, profile)
**Clarify answers:** Mobile-first · Light theme · Solo-focused · Summary-only metrics · inspiration=nike
**Result:** `done` but **FAILED QUALITY** — 0/5 screens verified, gate 0/100, review 18/100, repairs skipped.

> **PNG deliverable:** the `pre-review/` and `post-review/` folders are EMPTY because the pipeline
> produced **zero verified screen bundles** (see Root Cause #1). There was no UI to present or
> screenshot. The capture code is in place in `script/e2e-v6.ts` and will emit PNGs the moment a
> run verifies screens.

---

## What worked ✅

- **Clarify JSON fix validated.** `runClarify` returned 4 well-formed questions + 5 suggestions
  (`nike(18)`, `strava(12)`, `apple(9)`, `nike`-adjacent picks) — no validation failure, no
  corrective-retry spam. Answers mapped to real options.
- **Present → review ordering works.** `present` fired at 127.0s, review at 127.7s; the run's
  screens would have gone live to the client before the review model ran.
- **Wireframe plan quality is high.** Screens/blocks are on-brief and on-brand ("TODAY 8K TEMPO ·
  Start at 6:30 PM · Target 4:35/km", "Streak 11 days · PRs 3 this month").
- **Deterministic gates work.** `auditFiles` caught every hardcoded color in 14/16 components
  (gate 0/100, 40 issues). Sandbox errors were surfaced. All model-independent $0 machinery
  behaved.
- **Files were never actually truncated.** Every component and screen ends in a complete `);` `}`
  — the review model's "truncated file" claims were hallucinations (see #4).

## Root causes (blocking)

### 1. Component contract break — composer ignores the inventory (THE blocker)
The model-generated inventory renames every component (`ScoreboardHero` basedOn=`Card`,
`WorkoutStatRow` basedOn=`StatCard`, `RecentPrFeed` basedOn=`Avatar`, `WorkoutSearchBar`
basedOn=`Input`, `PerformanceRunsTable` basedOn=`Table`, `TabbarNav` basedOn=`Tabs`, … 16 total),
and the builder correctly built those 16 files. But `compose-v6.ts` emits hardcoded imports of the
**generic base names** (`Avatar.jsx`, `Button.jsx`, `Card.jsx`, `Chart.jsx`, `Input.jsx`,
`Progress.jsx`, `StatCard.jsx`, `Table.jsx`) via its block recipes' `comps` sets — it never reads
`wireframe.inventory`. Result: every screen fails esbuild resolution → **0 bundles** → no
screenshots → present shows nothing → review has no ground truth → cascade.

Evidence: `src/screens/*.jsx` import `../components/Avatar.jsx` etc.; those files don't exist.
`compose-v6.ts:846-848` hardcodes `import … from "../components/${c}.jsx"`.

### 2. Token discipline violations in built components (blocking)
14/16 components hardcode hex (`#ff6b75`, `#FFD700`, `#ff9500`) or Tailwind literals
(`bg-orange-500`, `bg-pink-500`) instead of theme tokens. The gate catches all of them (high
severity) — the builder prompt is not strict enough for haiku-4.5.

### 3. Repair loop can never run on real runs (systemic money leak)
Repair was skipped: `37.48 credits spent > 25 maxCredits`. The API sets `maxCredits =
max(est×2, 10)` ≈ 13–26 for a run like this, while a full run costs ~37 credits — so the budget
ceiling **always** fires before repair on full-length runs. Worse: `settleCredits` charges
`min(actual, hold)` → the user pays the estimate (~13) while the platform eats the delta (~24).
Every failed run both fails to repair AND loses money.

### 4. Review model hallucination
`gpt-5.4-mini` flagged ~10 files as "truncated" and invented code-level claims; all files are
complete. When nothing verifies, the model invents problems because it can't see the output. The
`verified`/`unverified` split must be ground truth, and the static review should be constrained or
skipped when the sandbox rejects everything.

## Optimization opportunities

| # | Area | Finding | Est. impact |
|---|------|---------|-------------|
| O1 | Cost | 54 calls / $0.375 / 37.5 credits for a FAILED run. Planner+builder = 34+16 calls (16 components). 2 planner corrective retries, wireframe ×2 + copy ×2 (truncation escalations at 6000/3000 tokens). | −30–50% |
| O2 | Latency | 138s wall: build 77s (27.7→105s), assemble+verify 22s, wireframe 20s (27.7−7.4, includes double-call). Review is only ~10s. | −25–40% |
| O3 | Model fit | `basedOn` field in the inventory is dead data — designed for exactly this resolution but never wired up. | fixes #1 |
| O4 | UI truth | Client "screens" = verified bundles only; spec'd screens (docs/screens) are the only thing available mid-run pre-verify — could render unverified screens with a warning to keep the user engaged. | UX |
| O5 | Pricing | `estimateRunCredits` underestimates (37.5 actual vs ~13 est). Credit cap vs actual spend mismatch. | business-critical |
| O6 | Truncation | Builder budget 5000 tokens, wireframe 6000 — escalation retries double the calls. Haiku emits long components (10–15k chars). | cost + latency |

## Files

- `run-summary.json` — full run artifact (phases, activity, costs per call, review issues).
- `pre-review/`, `post-review/` — empty; see note above.
- `script/e2e-v6.ts` — the driver (clarify → answers → run → PNG capture at present → summary).

# Picasso V6 E2E — Issues Report

**Date:** 2026-08-10T17:47:04.549Z · **Mode:** harden · **Max screens:** 2 · **Overall:** FAILURES PRESENT

Outputs: `output/<runId>/` (docs, screenshots, run-summary.json) · Screenshots are desktop viewport 1440×900.

## Run never completed

The harness aborted before any run produced output — no screens were generated, so there are no screenshots to present.

### Abort error

```
AI returned JSON that failed validation. Model: wireframe. Validation error: [
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["brandKit","spacingRules","componentPadding"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["brandKit","spacingRules","rhythmDescription"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["brandKit","motionRules","transitions"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["brandKit","motionRules","easing"], "message": "Required" }
]
    at chatJSON (/home/runner/workspace/server/lib/pastel-agent/gateway.ts:487:11)
    at async runArchitecture (/home/runner/workspace/server/lib/pastel-agent/picasso/pipeline/stage-3-wireframe.ts:305:18)
    at async runPicassoPipeline (/home/runner/workspace/server/lib/pastel-agent/picasso/pipeline/orchestrator.ts:160:24)
```

---

# Full diagnosis

## What failed ❌

**Stage 3 (wireframe) — `runArchitecture` validation failure.** The wireframe model returned a
`brandKit` object missing four required string fields: `spacingRules.componentPadding`,
`spacingRules.rhythmDescription`, `motionRules.transitions`, `motionRules.easing`. The corrective
retry (`chatJSON` second attempt, gateway.ts:455-477) also failed schema validation, so
`chatJSON` threw at gateway.ts:487 and the whole pipeline aborted.

## Where it failed

- `server/lib/pastel-agent/gateway.ts:487` — validation failure throw (after 1 corrective retry)
- `server/lib/pastel-agent/picasso/pipeline/stage-3-wireframe.ts:305` — `chatJSON` call for wireframe+brandKit
- `server/lib/pastel-agent/picasso/pipeline/orchestrator.ts:160` — `runArchitecture` invocation

## What actually ran (partial artifacts in `output/e2e-1-1786383871111/`)

| Phase | Artifact | Status |
|-------|----------|--------|
| Stage 1 discovery | `docs/planning/Discovery.json` | ✅ done |
| Stage 2 directions | `docs/design/CreativeDirections.json` | ✅ done |
| Stage 2 tokens | `docs/design/DesignTokens.json`, `MotionSpec.json`, `src/globals.css`, `tokens/tokens.css` | ✅ done |
| Stage 3 wireframe | `docs/planning/WireframePlan.json` | ❌ FAILED — brandKit JSON incomplete |
| Stage 4-8 (content, components, screens, QA) | — | ⛔ never reached |

**Screens composed:** 0 · **Screens rendered (E2B):** 0 · **Screenshots:** none.

## Root cause

1. **Schema strictness vs. model output.** The `wireframeSchema.brandKit` contract requires
   `spacingRules.componentPadding`, `spacingRules.rhythmDescription`, `motionRules.transitions`
   and `motionRules.easing` as required strings. The wireframe model (likely a small/cheap model
   on the gateway tag `wireframe`) emitted a brandKit with other fields present but omitted these
   four. 
2. **Corrective retry is insufficient.** `chatJSON` retries exactly once with the validation error
   as an assistant turn. That retry also failed, so no salvage path existed — the pipeline has no
   fallback to fill defaults or re-run with a stronger model.
3. **No partial recovery.** Because `runArchitecture` throws, everything downstream (content,
   components, screen composition, E2B renders, screenshots) is skipped. The run aborts with zero
   screens — no `run-summary.json` is written either (that only happens inside `runOnce` after the
   pipeline returns).

## Severity / impact

- **Blocker:** any brief can hit this — it is a model-output lottery, not a brief-specific issue.
  This run produced **0 screens and 0 screenshots**, so the "2 screens, desktop UI" deliverable
  could not be produced.
- Cost: the run consumed model calls for discovery + directions + tokens (+ a corrective retry)
  before dying — money spent with no UI to show.

## Suggested fixes (not applied — report only)

| # | Fix | File |
|---|-----|------|
| F1 | Make brandKit fields optional with sensible defaults, or coerce missing fields post-parse instead of throwing. | `stage-3-wireframe.ts` (schema) |
| F2 | Add a second corrective retry or an `onRawFailure` salvage hook that fills defaults and returns a usable wireframe. | `gateway.ts` / `stage-3-wireframe.ts` |
| F3 | Wrap `runArchitecture` in try/catch in the orchestrator so the run degrades to "needs_review" with a persisted diagnostic instead of aborting everything. | `orchestrator.ts` |
| F4 | Write `run-summary.json` even on pipeline throw so partial-stage failures are auditable. | `picassotests/test6/e2e-run.ts` (`runOnce`) |

## E2E harness behavior (verified)

- `PASTEL_E2E_MAX_SCREENS=2` correctly caps composed screens (would have been enforced in Stage 3+).
- On run failure the harness **aborted** — it did not start another brief ("ABORT: stopping after failed run").
- `ISSUES.md` written to `picassotests/test6/ISSUES.md`.
- Desktop UI requested: brief `platform: "web"` (desktop) — E2B screenshots would render at 1440×900.

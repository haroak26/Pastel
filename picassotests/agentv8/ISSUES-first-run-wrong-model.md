# Picasso V7 E2E — Issues Report

**Date:** 2026-08-11T18:31:43.028Z · **Mode:** harden · **Max screens:** 3 · **Overall:** FAILURES PRESENT

Outputs: `output/<runId>/` (docs, screenshots, run-summary.json) · Screenshots are desktop viewport 1440×900.

## e2e-1-1786473035034 — Meridian Inbox

- **Status:** needs_review · 68.0s · 0 model calls · $0.0000 (0.01 credits)
- **Screens composed:** 0 (none)
- **Screens rendered (E2B):** 0 — none
- **Anti-slop gate:** FAILED · **Visual QA:** 0.0/10 avg · **passedAll:** false
- **Degradations:** discovery (Model 'opencode-go/deepseek-v4-flash' is not supported. Check /v1/models for available models.)

## Issues
### Render errors (E2B sandbox)
- styles: tailwind compilation failed
### Smoke failures
- discovery
### Assertion failures
- at least 1 screen composed (got 0)
- no smoke failures (got 1)
- anti-slop gate passed
- neutral-canvas gate FAILED (Model 'opencode-go/deepseek-v4-flash' is not supported. Check /v1/models for available models.)
- screens rendered in E2B (0 of 0)
- no render errors (styles: tailwind compilation failed)
- visual QA passed (0/10)

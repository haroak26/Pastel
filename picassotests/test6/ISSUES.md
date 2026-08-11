# Picasso V7 E2E — Issues Report

**Date:** 2026-08-11T18:51:20.202Z · **Mode:** harden · **Max screens:** 3 · **Overall:** FAILURES PRESENT

Outputs: `output/<runId>/` (docs, screenshots, run-summary.json) · Screenshots are desktop viewport 1440×900.

## e2e-1-1786473149059 — Meridian Inbox

- **Status:** needs_review · 1131.1s · 40 model calls · $0.0805 (8.05 credits)
- **Screens composed:** 3 (conversation-detail, analytics, triage-board)
- **Screens rendered (E2B):** 0 — none
- **Anti-slop gate:** FAILED · **Visual QA:** 0.0/10 avg · **passedAll:** false

## Issues
### Render errors (E2B sandbox)
- conversation-detail: bundle failed
- analytics: bundle failed
- triage-board: bundle failed
### Smoke failures
- conversation-detail
- analytics
- triage-board
### Assertion failures
- no smoke failures (got 3)
- anti-slop gate passed
- composition gate FAILED
- screens rendered in E2B (0 of 3)
- no render errors (conversation-detail: bundle failed; analytics: bundle failed; triage-board: bundle failed)
- visual QA passed (0/10)
- wall time budget (1131.1s < 960s — latency-aware: 960 = 300 + screens×120 + min(calls×15, 300))

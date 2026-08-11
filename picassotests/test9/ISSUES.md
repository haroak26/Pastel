# Picasso V7 E2E — Issues Report

**Date:** 2026-08-11T20:20:31.381Z · **Mode:** harden · **Max screens:** 3 · **Overall:** FAILURES PRESENT

Outputs: `output/<runId>/` (docs, screenshots, run-summary.json) · Screenshots are desktop viewport 1440×900.

## e2e-1-1786478365746 — Meridian Inbox

- **Status:** needs_review · 1265.6s · 47 model calls · $0.1096 (10.96 credits)
- **Screens composed:** 2 (conversation-detail, triage-queue)
- **Screens rendered (E2B):** 0 — none
- **Anti-slop gate:** FAILED · **Visual QA:** 0.0/10 avg · **passedAll:** false

## Issues
### Render errors (E2B sandbox)
- conversation-detail: bundle failed
- triage-queue: bundle failed
### Smoke failures
- conversation-detail
- triage-queue
### Assertion failures
- no smoke failures (got 2)
- anti-slop gate passed
- composition gate FAILED
- screens rendered in E2B (0 of 2)
- no render errors (conversation-detail: bundle failed; triage-queue: bundle failed)
- visual QA passed (0/10)

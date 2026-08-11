# Picasso V7 E2E — Issues Report

**Date:** 2026-08-10T21:49:47.482Z · **Mode:** harden · **Max screens:** 3 · **Overall:** FAILURES PRESENT

Outputs: `output/<runId>/` (docs, screenshots, run-summary.json) · Screenshots are desktop viewport 1440×900.

## e2e-1-1786397271062 — A minimal habit tracker app for desktop

- **Status:** needs_review · 1316.4s · 41 model calls · $0.1028 (10.28 credits)
- **Screens composed:** 3 (ledger, settings, today)
- **Screens rendered (E2B):** 0 — none
- **Anti-slop gate:** PASSED · **Visual QA:** 0.0/10 avg · **passedAll:** false

## Issues
### Render errors (E2B sandbox)
- ledger: bundle failed
- settings: bundle failed
- today: bundle failed
### Smoke failures
- today
- ledger
- settings
### Visual QA defects (blocking)
- **ledger** — 0/10 — Screen "ledger" did not render in the sandbox (failing: none)
- **settings** — 0/10 — Screen "settings" did not render in the sandbox (failing: none)
- **today** — 0/10 — Screen "today" did not render in the sandbox (failing: none)
### Assertion failures
- no smoke failures (got 3)
- screens rendered in E2B (0 of 3)
- no render errors (ledger: bundle failed; settings: bundle failed; today: bundle failed)
- visual QA passed (0/10)
- wall time budget (1316.4s < 420s)

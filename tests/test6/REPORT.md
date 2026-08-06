# E2E Test 6 Report

**Date:** 2026-08-06  
**Prompt:** Design a simple neighborhood bakery ordering app with a warm, modern feel. Let customers browse pastries, open an item for details, and place an order.  
**Result:** Partial pass. Clarification passed; agent pipeline setup failed at database persistence. Browser smoke test passed against the development server.

## Evidence

![Rendered landing page](./app-home.png)

- `app-home.png`: Chromium screenshot of `http://127.0.0.1:5055/` at 1440x900.
- `browser-smoke.json`: URL, HTTP status, heading, body text, and browser console findings.
- The live-agent attempt was run with `npx tsx script/e2e-v6.ts`.

## Test Output

```text
[09:40:34] clarify    running runClarify on prompt (151 chars)…
[09:40:41] clarify    done in 6.7s — 3 question(s), 4 suggestion(s)
[09:40:41] answer       platform_scope: "Primary platform" → "Mobile-first"
[09:40:41] answer       color_theme: "Light or dark mode" → "Light theme only"
[09:40:41] answer       checkout_scope: "Checkout flow included" → "Full checkout"
e2e-v6 crashed: Failed query: insert into "agent_runs" (...)
```

The clarification model call worked and returned three questions plus four company suggestions. The run failed when `createRun` attempted to insert into `agent_runs`, so no agent screens or agent-run screenshot proofs were produced.

## Issues

### High: Agent E2E cannot create a run

The live E2E fails at the first `agent_runs` insert. The development server also logs that stale-run cleanup cannot select from `agent_runs`. This indicates the required database table/schema is unavailable or out of sync in the test environment.

**Impact:** The full agent pipeline cannot reach discovery, build, review, or screenshot capture.

### High: Production bundle does not start

`npm start` exits immediately with `ERR_INVALID_ARG_TYPE` because the bundled server passes `undefined` to `fileURLToPath` (`dist/server/index.cjs`). The development server works, so this appears to be a build/runtime handling issue around `import.meta.url`.

### Medium: React Fragment console warning

The browser smoke test reported repeated warnings that `data-replit-metadata` is being passed to `React.Fragment` in `PricingSection.tsx`. Fragment only accepts `key` and `children`; the metadata prop should be removed or attached to a valid DOM element.

### Medium: Unauthorized API request on the public landing page

The smoke test recorded a `401 Unauthorized` resource response while the page still rendered successfully. Identify the request and either avoid it for anonymous landing-page loads or handle the expected unauthenticated response without logging it as an application error.

### Low: Excessive empty space in the captured landing page

The full-page screenshot renders the visible landing content near the top, followed by a very large blank region. The cookie banner also sits across the lower edge of the initial content. Confirm whether the blank region is intentional responsive spacing; otherwise constrain the page's minimum height/content spacing and make the consent banner dismissible before visual assertions.

## Improvements

1. Apply or verify the database migration that creates `agent_runs` before running `script/e2e-v6.ts`; add a clear preflight check that names the missing table.
2. Add a deterministic E2E fixture/database mode so the pipeline can be tested without depending on a shared remote schema.
3. Fix the production `import.meta.url` bundling path and add a startup smoke test for `npm run build && npm start`.
4. Remove the invalid Fragment prop and deduplicate the warning so console-error assertions are actionable.
5. Capture and classify expected anonymous `401` responses separately from unexpected browser errors.
6. Add a visual check for unexpected blank vertical regions and automatically dismiss consent UI when it is not the subject of the test.

## Acceptance Summary

| Check | Result |
|---|---|
| Clarification request | PASS |
| Agent run creation | FAIL: `agent_runs` insert |
| Development server page load | PASS: HTTP 200 |
| Landing page rendered | PASS |
| Browser console clean | FAIL: Fragment warnings and 401 |
| Production server startup | FAIL: `fileURLToPath(undefined)` |
| Agent screen proofs | NOT PRODUCED because the run stopped before pipeline execution |

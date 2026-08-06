# Agent v6 — Recovery Plan (after the 2026-08-04 fitness-app e2e test)

Context: run `2bf28bf8` — 0/5 screens verified, gate 0/100, review 18/100, repairs never ran.
Priority ordering: P0 unblocks verification (screens exist → PNGs → review has ground truth),
P1 stops the money leak, P2 squeezes cost/latency.

---

## P0 — Fix the component contract (the run is dead without this)

**P0.1 Resolve composer imports through the inventory.**
`compose-v6.ts` block recipes declare generic `comps` sets (`Card`, `StatCard`, `Avatar`, …).
Emit imports via `wireframe.inventory.components`, matching `basedOn` → built file name:

```
recipe "stats" needs { StatCard } → inventory.find(c => c.basedOn === "StatCard").name → WorkoutStatRow.jsx
```

- Fallback to the generic name when no inventory match (keeps fallback-wireframe path and tests green).
- Mount `custom` blocks (component-mounting blocks from the wireframe prompt) the same way.
- Verify with the existing `pastel-v6.test.ts` deterministic path + a new test that uses a
  **model-style renamed inventory** (assert every screen's imports resolve to built files).

**P0.2 Pre-verify imports in the gate.** Add a cheap static check to `checks/audit.ts`: every
`../components/X.jsx` import must exist in `generatedFiles`, so the gate catches the contract
break at gate time (cost $0) instead of only at sandbox time.

**P0.3 Re-run the e2e** (`npx tsx script/e2e-v6.ts`) — expect: 5/5 screens verified, `pre-review/`
PNGs captured at present, review scoring on real output. This is the acceptance test.

## P0 — Make review trustworthy

**P0.4 Ground the review.** Pass the verified/unverified file split into `runReview`; instruct the
model it may only comment on verified files and must ignore unverified ones (they're gated by
sandbox). When nothing verifies, skip the static review call entirely — the gate + sandbox issues
are sufficient and honest. Kills the hallucinated "truncated" issues and saves a model call on
failed runs.

## P1 — Stop the money leak (repair + settlement)

**P1.1 Repair budget = allowance, not a hard ceiling.**
In `orchestrator-v6.ts` change the repair guard from `ledger.totalCredits > maxCredits` to
something like `holdAmount !== undefined ? ledger.totalCredits > holdAmount : ledger.totalCredits > maxCredits`
— i.e., repair as long as we're inside the chargeable hold. Repair is cheap (haiku, targeted) and
is the only thing that can turn a 18/100 run into a pass.

**P1.2 Close the estimate/actual gap.**
`estimateRunCredits` must reflect the real cost model (16 components × plan+build ≈ 34 calls).
Either raise the estimator or pass `maxCredits = max(est×3, 15)`. Charge must never exceed spend,
and spend must never exceed hold silently — add a hard stop (skip next planner/builder batch) when
`ledger.totalCredits > holdAmount` even outside repair.

## P2 — Cost & latency optimization

**P2.1 Bound the inventory size.** 16 components for 5 screens is over-engineering (the model
loves to invent). Cap `ComponentInventory` to 8–12 and merge trivial pairs (e.g., the two
`basedOn=Chart` bars → one chart component used twice). Saves ~20–40% of the 34 planner + 16
builder calls.

**P2.2 Fix double-calls from truncation escalation.**
- wireframe maxTokens 6000 → 9000 (it escalated 6000→15000 anyway → 2 calls).
- builder maxTokens 5000 → 6500; keep the ×2.5 escalation but only when the first call actually
  truncated (>90% budget consumed), not on `incomplete` flags.

**P2.3 Enforce tokens in the builder prompt** (blocks #2): explicit "no hex, no `bg-orange-500`
literals — only `var(--token)` + the theme's tailwind palette"; append the gate's token issues as
a corrective retry (bounded to 1) before the sandbox round. Cheaper than a full repair round later.

**P2.4 Reduce review cost on success:** keep static review (gpt-5.4-mini, 1 call ≈ 2.2 credits)
but skip the visual review when screenshots fail to render (already the behavior).

## P2 — Test infrastructure

**P2.5 Promote the e2e driver.** Keep `script/e2e-v6.ts` as the regression gate; add assertions
(status done, ≥1 verified screen, PNGs exist in `pre-review/`, repair runs when score < pass,
cost < 30 credits). Wire into `npm test` as an opt-in env-gated suite (`E2E=1`).

---

### Acceptance criteria for the next test run
1. `screens ≥ 5` and `failedScreens = []` in the manifest.
2. `test/agent-v6/pre-review/*.png` non-empty (captured before the review call).
3. Review score ≥ 70 with no hallucinated truncation issues.
4. Repair actually runs when the gate fails (repairs ≥ 1 on a deliberately broken case).
5. Total cost ≤ 25 credits / $0.25 for the fitness prompt.

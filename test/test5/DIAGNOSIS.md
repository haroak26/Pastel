# Pastel Agent v10 — Airbnb E2E Test Diagnosis (`test/test5`)

**Date:** 2026-08-05 · **Run:** `5a3fd171-a773-4d21-9429-29bb975b2e6b`
**Prompt:** Airbnb-style vacation rental booking app (browse stays, filter by price/rating, listing with photos/amenities/reviews/booking)
**Models:** cheap = `anthropic/claude-haiku-4-5` (clarify/planner/builder/copy/repair) · mid = `openai/gpt-5.6-luna` (brief/wireframe/review/visualReview)
**Result:** `done` — **2/2 screens verified**, gate **60/100 FAIL**, visual review 48, static review **58/100 RETURN_TO_BUILDER**, 2 repair cycles, cost **23.01 cr ≈ $0.23**, wall **520s** (present at 128s).

> Artifacts: `run-summary.json` (full run), `screenproof/` (2 full-page screen PNGs @2880px + HTML + text probes),
> `componentproof/` (6 component PNGs rendered standalone). DB docs: brief / wireframe / inventory / copy / gate / review.
> **Note:** this model cannot view images — findings below were verified against the rendered HTML bundles,
> the source files, the gate/review reports, and the screen text probes instead of the PNG pixels.

---

## What worked ✅ (v10 validated end-to-end)

- **Pipeline completes without errors.** 18 model calls, no pipeline failure, no failed screens, sandbox-verified
  builds, `present@128s` screenshot flow works (screens captured live at Present and again post-review).
- **W4 data isolation holds.** Every screen reads only its own scoped view (`DATA.screens.home.*` /
  `DATA.screens.detail.*`) — the test4 "catalog grid on the detail page" bug is gone by construction. The content
  gate is silent on it.
- **No content leakage, no broken UI.** All 2 screen probes + 6 component probes clean: no off-domain demo
  content, no `+-` deltas, 0 blank sections, no hardcoded zero tiles.
- **Two-screen canonical model respected.** home + detail only; card budgets respected (home 1 ≤ 4, detail 1 ≤ 3);
  no outline-button stacks; builder stayed on the cheap stack.
- **Cost under budget.** 23.01 cr < 30 cr, down from test2's 48.6 cr, though up from test4's 8.06 cr (repairs
  actually did work this time).
- **Repair loop fired and improved scores.** Gate 55 → 55 → 60; static review 46 → 53 → 58. The gate's own
  issues (overlap/flush) were *not* fixable by repair (see #6).

---

## Issues found (ranked, with root causes)

### 1. HIGH — Imagery is still flat/abstract, and the gallery shows five different "houses"
The rendered tiles are the W5 generative scenes, but they read as **flat chart-colored SVG illustrations, not
photography** ("abstract, token-colored SVG house illustration", "flat abstract illustrations" — both reviewers,
home + detail). Two concrete defects:

- **Not one property's gallery.** The detail mosaic shows 5 *different* house silhouettes/colors (the model review:
  "five gallery tiles show visibly different house designs … do not convincingly read as one property's gallery").
  Root cause: `scenePrelude` bakes **9 scenes seeded by slot index**, and both the home grid (`compose-v6.ts:1104`)
  and the detail gallery (`compose-v6.ts:1176`) render `SCENES[i % SCENES.length]` — the `i` of the tile, not the
  item. `DATA.screens.detail.images = [0,1,2,3,4]` (`compose-v6.ts:225`) is decorative: `.map((n, i) => …)` uses
  only `i` as the key. `sceneSvg(domain, seed, n)` (`scenes.ts:258`) seeds by slot `n`, so tiles 0-4 are five
  unrelated scenes. The comment at `compose-v6.ts:1164-1168` ("THE SAME item's scenes") contradicts the code.
- **Cross-screen imagery reuse.** Home tile `i` and detail tile `i` are the *same image* — the "same abstract
  scene illustrations used by the catalog" complaint. W5's "seeded per item" goal is not met; it's seeded per slot.

### 2. HIGH — Booking summary / fact-row data is semantically mismatched ("Dates: Apartment")
The reviewer: "Dates displays Apartment, Guests displays 2 guests, Host name displays Oaxaca, Mexico,
Verification status displays Loft, response/cancellation values are bare numbers."

- **`summary.dates = data.detailValues[1]`** (`compose-v6.ts:195`) — `detailValues[1]` is the *property type*
  (`domains.ts:596` picks `["Villa","Casa","Apartment","Chalet"]`). `guests: "2 guests"` is hardcoded
  (`compose-v6.ts:196`), not derived from the item.
- **Field labels are zipped to values by position.** The copy agent invented rental-trust labels
  ("Host name / Verification status / Response time / Cancellation policy / House rules") while the item's
  `fields` array is `[place, type, beds, baths, host]` (`domains.ts:583`) — so `fields[0]` = "Oaxaca, Mexico"
  renders under "Host name". Two sources of truth for detail labels (domain pack `detailFields()` vs. copy-plan
  `detailFields`) with **no semantic pairing** — the exact test2 stat-label class of bug, and it survived the W4
  fix (test4's "Dates → Casa" was the same positional zip).
- The W4 isolation fix made the *containers* right but not the *content contract*: the per-screen view still
  carries bare positional value arrays instead of `{label, value}` pairs.

### 3. HIGH — Duplicate listings in the catalog ("Sunset Terrace Flat" ×4)
"Sunset Terrace Flat appears multiple times … with different destinations and prices, which reads as duplicated
or corrupted listing data." Root cause: `rentals.items` (`domains.ts:565-585`) generates 9 rows picking names,
places, and hosts **with replacement** from 9-element pools — duplicates are near-certain (birthday problem).
Names are also independent of destination (same name + different city reads as corruption).

### 4. HIGH — Two "Reserve" buttons in the summary card
The detail summary renders `DATA.screens.detail.primaryCta` ("Reserve") **plus** a second hardcoded
`<Button variant="outline">Reserve</Button>` — the builder added its own secondary CTA on top of the recipe's
primary action. Duplicate conversion point; reviewer flagged it high.

### 5. MEDIUM — Token discipline + interaction states still fail in shared components
Button (`rounded-md` not pill, `h-9/h-10/h-11/px-3/px-4/px-6`, hover color identical to base, no active state),
Card (`rounded-xl`, `p-6`), Input (`h-10 rounded-md px-3 py-2 pl-9`), Select (`h-10 rounded-md px-3 pr-9`) —
all hardcode raw utilities instead of theme radius/rhythm tokens. This was also medium/high in test4; the gate
does not check for raw spacing/radius utilities, so nothing caught it.

### 6. MEDIUM — Planned components all dropped: "Built 0 components"
The wireframe planned 6 custom components (StayComparisonStrip, LocalStayGuide, HostTrustLegend, AmenityGrid,
HostProfile, PolicyTrustRows) — the very amenity/host/trust features the review says are missing. But the
wireframe model emitted its custom blocks **without the `component` field** (verified: zero `"component"` keys
in `WireframePlan.json`), so the mount contract (`ux-design.ts:368-374`) dropped the *entire* inventory, the
planner built 0 components, and screens fell back to base components. The "every inventory component must be
mounted" e2e assertion **passes vacuously on an empty inventory** ("0 components, all mounted"). No deterministic
backfill or hard-fail exists for this non-compliance — a silent total-feature loss.

### 7. MEDIUM — Review summary is one dense hardcoded paragraph
The reviews section heading is a concatenated blob: "What guests say: 4.92 from 118 reviews. Elena M., June 2026:
…" with hardcoded values that contradict the data (`reviews[0].rating` is 4.0; the summary card shows 4.8).
Should be divided rows (the `reviews.map` list below it is fine); the header shouldn't be model-written prose.

### 8. MEDIUM — Layout: dead gap + flush sections + the "5 overlapping elements" ghost
- Large empty interval between the booking area and reviews (flagged medium).
- Home hero (`-mx-6 md:-mx-8` full-bleed dark band) sits flush against the grid section below — the gate's
  "flush sections" finding (`w-full bg-foreground … / w-full -mx-6 …`), repeated on both repair cycles.
- **"5 overlapping element(s)" is reported identically on both screens, every run, and is never fixed by
  repairs — because the overlap scan (`geometry.ts:82-102`) does not skip ancestor/descendant pairs.** Any
  `rounded-*`/`bg-card` child fully contained inside a `section` (the search panel, every Card tile) is counted
  as overlapping its parent at 100% intersection. Same count (5) appeared in test2/test3/test4 runs with entirely
  different layouts → it is a checker artifact, yet it costs ~30 gate points (55-60/100).

### 9. OBSERVED — Search controls still have no visible labels
Destination/Check-in/Check-out/Guests render with `placeholder` + `aria-label` only (test4's high
accessibility issue). Not re-flagged this run (reviewer variance), but the source still relies on
placeholders instead of visible labels. Heart/save buttons do have focus-visible + active states this time.

---

## Diagnosis (summary)

| # | Symptom | Root cause | Location |
|---|---------|-----------|----------|
| 1 | Gallery = 5 different houses; home/detail reuse the same art | Scenes seeded by **slot index**, not item; `images` list decorative | `compose-v6.ts:225,1173-1176` · `scenes.ts:258` |
| 2 | "Dates: Apartment", label/value chaos | Positional zip of copy labels ↔ bare value array; `dates` fed from `detailValues[1]` | `compose-v6.ts:195-196,226` · `domains.ts:583,596` |
| 3 | Duplicate listing names | `pick(rnd, names)` with replacement over 9 rows | `domains.ts:565-585` |
| 4 | Two Reserve buttons | Builder stacked its own CTA on the recipe's `primaryCta` | `compose-v6.ts:866-910` recipe + builder |
| 5 | Raw spacing/radius in components | No gate check for utility-class tokens (only hardcoded colors are checked) | `checks/` |
| 6 | 0 components built | Wireframe model omitted `component` on custom blocks → mount contract drops all; passes vacuously | `ux-design.ts:368-374` |
| 7 | Review blob | Copy agent writes the review intro as prose; hardcoded, contradicts data | built `detail.jsx` |
| 8 | Persistent "5 overlaps" + flush | Geometry checker counts ancestor/descendant containment; flush check reads section rects not padding boxes | `geometry.ts:82-102` |
| 9 | No visible labels | Inputs/Selects rely on aria-label/placeholder; no label rendering | built `home.jsx` |

**Tooling finding — 2 of the 3 e2e assertion failures are stale regexes, not product bugs.** The assertions in
`script/e2e-v6.ts` still match the **v9** data contract: `DATA.rows.slice(0, 6)` / `DATA.primaryCta` /
`DATA.summary` / `DATA.reviews.map` / `min-h-56 sm:min-h-full` (`e2e-v6.ts:501,504-507`). The v10 output correctly
uses `DATA.screens.*` and `min-h-80 sm:min-h-96`, so `homeIsCatalog` and `detailIsInfoPage` fail on *every* v10
run even with a perfect product. The 3rd failure (review score 58 < 70) is genuine.

**Cost/latency:** 23.01 cr; the 4 haiku repair calls cost ~13.5 cr (58% of the run) with ~40k chars of output
each (one hit the 5,000→12,000 char budget escalation), and moved the gate only 55→60 — repairs cannot fix the
geometry artifact or the abstract-imagery class, so they mostly burned budget on review-listed issues.

---

## Improvements (recommended next steps)

1. **Scene seeding per item (fixes #1).** Change `scenePrelude`/`sceneSvg` to seed from `hash(seed, item.id)`:
   one property's 5 tiles become the same house in different crops/angles; the home grid gets per-item art. Make
   `DATA.screens.detail.images` the actual per-item scene indices and have the gallery map over `n`, not `i`.
   Raise `sceneStay`'s fidelity (window panes, landscape sky, softer gradients) toward "photoreal" before
   re-running, since both reviewers scored imagery against the photo-first brief.
2. **Semantic detail data (fixes #2).** Emit the detail view as `{label, value}` field pairs and a proper
   `summary { checkIn, checkOut, guests, nights, price, fees, total }` derived from the item (dates from the
   listing's date range). Delete the positional `fields`/`detailValues` zip. Add a gate rule: label arrays must
   be consumed as pairs, never positionally.
3. **Dedupe catalog data (fixes #3).** Shuffle the name/place/host pools (Fisher-Yates) instead of
   `pick`-with-replacement in `domains.ts` items generators; force unique names per run.
4. **Single conversion point (fixes #4).** In the detail summary recipe, render `primaryCta` only; add a gate
   check for duplicate same-label primary CTAs in one card.
5. **Component-mount hard contract (fixes #6).** If the wireframe omits `component` on custom blocks, backfill
   deterministically from the inventory (match by name inside the block content, as the blocks here literally
   say "Mount StayComparisonStrip"), or fail the wireframe for re-ask. The e2e mount assertion should fail when
   inventory is empty but the brief asked for components (budget ≥ 1).
6. **Geometry checker fixes (fixes #8).** Skip ancestor/descendant pairs in the overlap scan; measure flush-ness
   from the sections' effective padding boxes (inner `pastel-frame` divs / `-mx` full-bleed sections). Re-run —
   gate should jump well past 70/100 on the same build.
7. **Token audit for components (fixes #5).** Extend the existing hardcoded-color check to flag raw
   spacing/radius utilities (`h-9|h-10|px-3|rounded-md|rounded-xl|p-6`) in shared components.
8. **Update the e2e assertions to the v10 contract** (`DATA.screens.home.rows`, `DATA.screens.detail.summary`,
   `DATA.screens.detail.reviews`, `min-h-80 sm:min-h-96`), and treat the review-score threshold as the only
   quality gate.
9. **Visible labels (fixes #9).** The search recipe should render real `<label>`s above the controls; the
   review prompts were inconsistent run-to-run on this, so make it a gate rule instead of review discretion.
10. **Repair targeting.** Only run repair on issues the deterministic layers can move (gate items), and cap
    repair budget when gate issues are artifact-class (overlap/flush) — e.g. 2 cycles of review-only when the
    gate delta is known-zero.

## Evidence

- `screenproof/home.png`, `screenproof/detail.png` (2880px full-page PNGs) + `.html` bundles + `.probe.json` (all clean).
- `componentproof/*.png` (Avatar, Badge, Button, Card, Input, Select).
- `run-summary.json` — costs (23.01 cr / 18 calls), phases, 18 review issues, activity (incl. "dropped unmounted
  components: …", "Built 0 components", gate 55/55/60).
- DB docs for run `5a3fd171-a773-4d21-9429-29bb975b2e6b`: `WireframePlan.json` (custom blocks without
  `component`), `GateReport.json` (4 issues: overlaps + flush), `ReviewResult.json` (RETURN_TO_BUILDER).
- Source files as built: `src/screens/home.jsx`, `src/screens/detail.jsx`, `src/data.js` (duplicate rows,
  `summary.dates: "Apartment"`, `fields` positional arrays).

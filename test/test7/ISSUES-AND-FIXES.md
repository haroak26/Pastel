# Pastel Agent v11 — Airbnb E2E Issues & Fixes (`test/test7`)

**Run:** `1030362e-f5a3-408c-acda-a5e8130ee6d2` · **Title:** StayFinder · 2026-08-06
**Prompt:** Airbnb-style vacation rental booking app (browse by destination, filter by price/rating, listing with photos/amenities/reviews/booking)
**Result:** `done` — 2/2 screens verified, gate **60/100 FAIL**, visual review 61→48→48, static review **55/100 RETURN_TO_BUILDER**, 2 repair cycles, **39.47 cr ≈ $0.39** (budget 30 cr), wall 432s.
**Outcome:** 20/23 e2e assertions passed; 3 failed → **blank section** on detail, **review score 55 < 70**, **cost 39.47 ≥ 30**.

---

## A. Gate failures (deterministic checks) — the 4 gate issues

| # | Severity | Target | Issue | Fix |
|---|----------|--------|-------|-----|
| A1 | high | `StaySearchSummary.jsx` | Hardcoded zero sample value rendered as data (gate regex `\b0…\b(km\|min\|count…)`). The expandable summary renders a literal zero placeholder slot. | Render every value from props/DATA; the component should not carry a `0` default that renders. |
| A2 | high | `StayAmenityGrid.jsx` | Spec-note pattern (`rows:`, `tiles:`, `cards:`) shipped as UI copy. The amenity grid emits planning notes instead of product copy. | Replace spec notes with real amenity strings ("Wi-Fi", "Washer/dryer", "Free street parking", …) or render from the detail `fields`/feature rows. |
| A3 | medium | `detail.jsx` | 1 blank `section` on the rendered detail screen (probe: `blankSections: 1`). | Remove the empty section / ensure every section has content or is dropped at assemble. |
| A4 | medium | `detail.jsx` | Uneven vertical rhythm: `"w-full " (48px → 0px); "pastel-frame py-12" (0px → 48px)`. | Normalize section padding (drop the 0px `w-full` band), use one spacing token rhythm. |

**Why repairs didn't fix them:** the two repair cycles rewrote `StaySearchSummary.jsx`, `StayAmenityGrid.jsx` and `detail.jsx` but the gate stayed **60/100 every run** (60 → 60 → 60). The blank-section/rhythm findings were re-reported verbatim, and each "detail.jsx" repair call escalated output budget 5,000 → 12,000 tokens (2 × ~4.96 cr). Repairs can't move issues the checker computes from the *rendered* page while the same composition persists.

---

## B. Static review issues (20 issues, RETURN_TO_BUILDER) — grouped by root cause

### B1. Imagery is not photo-first and the gallery shows five different "houses" (HIGH ×4)
- `home.jsx` + `detail.jsx`: "The visible listing imagery is stylized generated scene art rather than photo-first rental photography."
- `home`: "colorful vector illustrations instead of the brief's photo-first, human, trust-building rental imagery."
- `detail`: "gallery is made from repeated crops of a generic illustration rather than a convincing 4–5 image gallery of one real stay."

**Root cause:** `compose-v6.ts` renders `SCENES[i % SCENES.length]` (home) and `SCENES[n % SCENES.length]` (detail) — the scenes are seeded by **slot index**, so gallery tiles 0–4 are five unrelated houses and home/detail reuse the same art. `DATA.screens.detail.images = [0,1,2,3,4]` is decorative.
**Fix:** seed scenes per item (`hash(seed, item.id)`) so all tiles of one listing are the same property; raise `sceneStay` fidelity toward photoreal; if real photography assets exist in the reference bundle, ship those instead of SVG scenes.

### B2. Gradients are prohibited by the universal law (HIGH ×2)
- `home.jsx` / `detail.jsx`: "The visible SCENES SVG contains a linearGradient… prohibited unless explicitly permitted by the company language."
**Root cause:** `scenes.ts` emits `<defs><linearGradient>` (two stops of the same `--chart-4`).
**Fix:** emit flat token-based fills only; strip `linearGradient`/`<defs>` from the generated SVG.

### B3. Custom components mounted with the wrong props → missing detail content (HIGH, spans 3 findings)
- `detail`: "omits most required detail information: amenities, sleeping arrangements, house rules, cancellation policy, and meaningful host response/review trust signals."
- `detail`: "Large blank areas and duplicated StayFinder/footer blocks below the review list make the page look broken or partially rendered."

**Root cause:** assemble mounts `HostTrustProfile`, `StayAmenityGrid`, `StayPolicies` with screen-level props (`items={DATA.screens.detail.rows.slice(0,4)}`, `metrics`, `people`, `settings`) instead of the components' declared props (`name`, `initials`, `isSuperhost`, `responseTime`, `reviewCount`, `averageRating`, `isVerified`). They render with defaults (`name=""`, "0 years hosting", no badges) and repeat the same `StayFinder · …` title in every band.
**Fix:** map inventory `usedBy` + wireframe block content to the component's actual prop contract in the assemble layer; verify with a prop-usage check per mounted component.

### B4. Accessibility: expandable summary is not a real button (HIGH)
- `StaySearchSummary.jsx`: "implemented as a div with role=button… no visible focus ring or aria-expanded state."
**Fix:** render a real `<button>` (or add `focus-visible` ring + `aria-expanded` + `aria-controls` + complete keyboard behavior, and a visible pressed state).

### B5. Undefined tokens / raw radius in shared components (MEDIUM ×3)
- `HostTrustProfile.jsx`: references `--card-foreground` (not in the approved token set).
- `StayPolicies.jsx`: compact variant uses undefined `--color-secondary`, `--color-muted`, `--color-primary`, `--color-foreground`.
- `Card.jsx`: hardcodes `rounded-xl` instead of the theme radius scale.

**Fix:** swap to approved tokens (`--foreground`, `--primary`, `--muted-foreground`, `--success`, …) and use the theme radius token (`var(--radius-*)`); extend the existing token/radius audit to cover `--card-foreground` and raw `rounded-*` in shared components.

### B6. Generic, non-domain copy (MEDIUM ×2 + driver of B7)
- `src/data.js`: "Both screens use the generic Get started / Learn more CTA pair" (home shows `Get started`, detail's booking card shows `Reserve` but the Badge/overline still say "Mobile vacation rental booking app").
- `detail`: "copy is mostly generic product scaffolding such as 'Full info page for one item'…"

**Root cause:** the **copy agent's JSON failed validation** (`screens[].statLabels[]` emitted as `string` instead of `object`) → **the entire copy plan fell back to the template**, which uses scaffolding text (`"Browse and explore the product's main catalog — the primary screen"`, `"Full info page for one item"`).
**Fix:** retry copy once on schema failure before template fallback; tighten the schema prompt with a `statLabels: [{label, unit}]` example; make the template fallback emit the brief's copy direction ("Search stays", "Reserve", "Entire home · 2 beds · 4.91 rating", "Free cancellation before 12 May") instead of pipeline scaffolding.

### B7. Planner validation failure silently degraded a component (OBSERVED)
- Logged: `planner failed for StaySearchSummary … "String must contain at most 240 character(s)"` at `path: ["designIntent"]` → fell back to template.
**Fix:** validate `designIntent` (≤240) in the planner prompt; add one retry before template fallback.

### B8. Composition / cross-screen contract risks (HIGH ×2, flagged defensively)
- `home.jsx`: "must have one dominant browse moment" — no chart/metric/custom band competing with the catalog.
- `detail.jsx`: "must be scoped to one stay only" — no catalog/search/stats/chart on detail.
**Status:** the rendered screens currently comply (the chart/metric blocks were **not** mounted — only the hero band, grid, and StaySearchSummary on home; gallery, summary, reviews, and the three custom bands on detail). Reviewer raised them as contract checks. **Fix:** keep them as gate invariants so future runs that mount a chart/band on these screens fail deterministically.

### B9. Mobile-first not honored at 375px (MEDIUM)
- `home`: "desktop grid is a three-column set of uniform cards rather than the brief's comfortable single-column mobile-first catalog… should be verified at 375px."
**Fix:** make the grid single-column on mobile (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` is currently used — verify with a 375px screenshot probe).

### B10. Layout quality (MEDIUM ×2 + LOW ×1)
- `home`: "oversized 'Find an affordable stay' headline and substantial whitespace… more like a marketing landing page."
- `detail`: "dominant gallery followed by a sparse summary/details area with excessive vertical separation."
- `home`: "header and search controls feel closer to a generic dashboard than a warm Airbnb-style search hero."
**Fix:** compact the home hero, tighten spacing around the summary card, and apply the Airbnb search-pill/topbar treatment from the company design language.

### B11. Dropped planned components (OBSERVED)
- Activity: `dropped unmounted components: BookingSummary, StayPhotoMosaic`. The wireframe planned 6 custom blocks but only 4 carried a `component` field; the two most product-critical ones (`BookingSummary`, `StayPhotoMosaic`) were dropped, which is exactly the gallery + booking card that the review says is weak.
**Fix:** backfill deterministically when a custom block's `component` matches an inventory name, or hard-fail the wireframe for re-ask (same recommendation as test5 #6).

---

## C. Cost / latency (over budget)

- **39.47 cr ≈ $0.39** across 31 calls (budget 30 cr). Breakdown: ~9.9 cr on the two 12k-token repair calls (output-escaped 5,000 → 12,000), ~2.3 cr visual review per call on ~1.76 M input chars each (screenshot base64), and ~5.2 cr wireframe (4 calls × ~1.0 M input chars).
- **Wall 432s, present at 130s** — the screens are ready in ~2 min; the remaining ~5 min is review + 2 repair cycles that didn't move the gate.
- **Fix:** cap repair output budget / skip repair when gate issues are artifact-class; trim the wireframe/visual-review context to the needed knowledge slices; consider 1 repair cycle cap when the gate delta is 0.

---

## D. E2E assertion summary

- **20 PASS** — run done, 2 canonical screens, home catalog + detail info-page shape, card budgets, outline cap, PNG proofs (2 screens, 11 components), no demo-content leaks, no broken deltas, no zero tiles, all 4 components mounted, stat-label units match, cheap builder stack, unique rows + semantic detail pairs, sane summary (`Apr 4 – Apr 7` / `3 guests`), single Reserve CTA, visible labels, no pipeline error.
- **3 FAIL**
  1. `no blank sections` — 1 blank section on detail (`screenproof/detail.probe.json`).
  2. `review score >= 70` — got 55 (RETURN_TO_BUILDER).
  3. `cost under 30 credits` — got 39.47.

---

## Evidence

- `test/test7/run-summary.json` (full run: 20 issues, 31 cost entries, activity incl. planner/copy JSON-validation failures and "dropped unmounted components: BookingSummary, StayPhotoMosaic").
- `test/test7/screenproof/home.png`, `detail.png` (2880px full-page post-review captures) + `.html` + `.probe.json` (`detail` shows `blankSections: 1`).
- `test/test7/componentproof/*.png` (Avatar, Badge, Button, Card, HostTrustProfile, Input, Select, StayAmenityGrid, StayPolicies, StaySearchSummary, Topbar).
- DB docs: `GateReport.json` (4 issues, score 60), `ReviewResult.json` (RETURN_TO_BUILDER, 20 issues), `WireframePlan.json` / `ComponentInventory.json` (6 planned / 4 mounted), `ProductBrief.json` (photo-first + copy direction).
- Source as built (from run state): `home.jsx`, `detail.jsx` (slot-index scenes + `linearGradient` defs, generic CTA badges), `StaySearchSummary.jsx` (zero placeholder + non-button expander), `HostTrustProfile.jsx`/`StayPolicies.jsx` (undefined tokens), `Card.jsx` (`rounded-xl`), `data.js` (semantic V11 summary — the test5 data bugs are fixed).

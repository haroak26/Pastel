# Pastel Agent v11 — Airbnb E2E Improvements (`test/test7`)

**Run:** `1030362e-f5a3-408c-acda-a5e8130ee6d2` · **Title:** StayFinder · 2026-08-06
**Prompt:** Airbnb-style vacation rental booking app (browse stays by destination, filter by price/rating, listing with photos/amenities/reviews/booking)
**Result:** `done` — 2/2 screens verified, gate **60/100 FAIL** (stuck across all 3 gates), visual review 61→48→48, static review **55/100 RETURN_TO_BUILDER**, 2 repair cycles, cost **39.47 cr ≈ $0.39** (over the 30 cr budget), wall **432s** (present at 130s).

> Screenshots: `test/test7/screenproof/home.png` + `detail.png` (2880px full-page PNGs, post-review)
> plus `.html` bundles, `.probe.json` text probes, `componentproof/` (11 component PNGs) and `run-summary.json`.

---

## What the run already proves (keep these gains)

1. **The V11 semantic data contract now holds.** `src/data.js` emits 9 **unique** rows, detail fields are real `{label, value}` pairs, and `summary.dates = "Apr 4 – Apr 7"` — the test5-era "Dates: Apartment" leak is **gone**. All V11 e2e checks passed: unique rows, semantic pairs, item-derived summary, single conversion point (`primaryCta` rendered exactly once), and visible input labels on home.
2. **Components actually get built and mounted.** Unlike test5's "Built 0 components", this run planned 6, built 4 (`StaySearchSummary`, `StayAmenityGrid`, `HostTrustProfile`, `StayPolicies`) and all 4 were mounted by custom blocks. The e2e mount assertion passed with a non-empty inventory.
3. **Two-screen canonical model is stable.** Exactly `home` + `detail`, card budgets respected (home 1 ≤ 4, detail 1 ≤ 3), no outline-button stacks, no off-domain content leaks, no zero tiles, clean `+-` deltas. 20/23 e2e assertions passed.
4. **Cheap/mid model stack and repair loop work.** Builder stayed on haiku; 2 repair cycles executed and moved static review 52 → 50 → 55.
5. **Search controls now have real `<label>`s** above Where/Check-in/Check-out/Guests (test5 flagged the placeholder-only version).

---

## Improvements to make (ranked)

### 1. Scene imagery: seed per item AND drop the gradient
`compose-v6.ts` still renders `SCENES[i % SCENES.length]` for the home grid and `SCENES[n % SCENES.length]` for the detail gallery, where `DATA.screens.detail.images = [0,1,2,3,4]` is decorative — so the 5 gallery tiles are 5 **different** houses, and home tile `i` reuses the same art as the detail tile. Both reviewers hammered this ("stylized generated scene art", "repeated crops of a generic illustration"). Fix: seed `sceneSvg(domain, seed, itemId)` from a per-item hash so one property's tiles are the same house in different crops, and make `images` the real per-item scene list. Also raise `sceneStay` fidelity toward photoreal (this is the #1 score drag).

### 2. Remove `linearGradient` from the generated SCENES SVG
The universal design law forbids gradients unless the company language permits them; Airbnb's brief does not. `scenes.ts` emits `<defs><linearGradient>` with two stops of the same `--chart-4` color — both screens were flagged **high** for it. Either emit flat fills (delete the defs entirely) or block gradient strings in the generated SVG.

### 3. Mount custom components with their declared props (prop-mapping gap)
`detail.jsx` mounts `HostTrustProfile`, `StayAmenityGrid`, `StayPolicies` with **screen-level** props (`items={rows.slice(0,4)}`, `metrics`, `people`, `settings`) instead of the props each component declares (`name`, `initials`, `isSuperhost`, `responseTime`, `reviewCount`, …). So the host card renders with defaults (`""` name, "0 years hosting", no badges) — the direct cause of the "omits host trust signals" and "repeated generic sections below reviews" findings. The assemble step must map inventory `usedBy` + block content to each component's actual prop contract.

### 4. Fix the two JSON-validation fallbacks that degraded output
- **planner:** `designIntent` exceeded 240 chars → `StaySearchSummary` fell back to a template.
- **copy:** `screens[].statLabels[]` was emitted as `string` not `object` → **entire copy plan fell back to template**, which is why both screens ended up with generic "Get started / Learn more" CTAs and "Mobile vacation rental booking app" overline despite the brief asking for "Search stays"/"Reserve" and warm specific copy.
Add a deterministic retry (1 re-ask) on schema failure before falling back, and extend the copy schema prompt with a concrete `statLabels: [{label, unit}]` example.

### 5. Stop the gate from being stuck at 60 with repairs burning budget
The gate's 4 issues (2 high content, 2 medium layout) were **not moved by two repair cycles** (60→60→60), yet the two "detail.jsx" repair calls each escalated 5,000→12,000 tokens and cost ~9.9 cr combined (~25% of the run). Add: (a) a repair-budget cap when gate issues are known-static, (b) a checker that can *verify* the fix (hardcoded zero + spec-note regex) and only re-run gate when the target file changed.

### 6. Enforce the mobile-first contract at 375px
The brief is mobile-first, but home renders `grid sm:grid-cols-2 xl:grid-cols-3` and the reviewer had to ask for a 375px verification. Assert a single-column mobile layout (and run one 375px screenshot probe) as part of the UX-contract check.

### 7. Stop screen-scaffold text from leaking into UI copy
`data.copy.home.headline = "StayFinder · Find an affordable stay"` and `description = "Browse and explore the product's main catalog — the primary screen"`, and the Badge in the booking card shows "Mobile vacation rental booking app". These are template strings, not product copy. The copy fallback should emit the brief's own voice sample ("Entire home · 2 beds · 4.91 rating", "Free cancellation before 12 May") rather than pipeline scaffolding.

### 8. Fix the "blank section + uneven rhythm" on detail
Gate (medium ×2): 1 blank `section` and `"w-full " (48px → 0px); "pastel-frame py-12" (0px → 48px)`. The detail page also shows "large blank areas and duplicated StayFinder/footer blocks below the review list". Tighten section padding and remove the redundant trust-band/footer repetition once #3 (prop mapping) is fixed.

### 9. Repair targeting should only touch deterministic layers
Review issues the deterministic stack cannot move (imagery class, copy tone, layout composition) were fed to the repair model verbatim, producing 27k-char rewrites that didn't move the gate. Restrict repair to gate-verifiable targets (hardcoded zeros, spec-note text, token/radius violations) and keep review-only feedback out of the repair prompt.

### 10. Cost: 39.47 cr is over the 30 cr e2e budget
The two 12k-token repair calls (~9.9 cr) plus the visual-review image base64 (≈1.76 M input chars each call) drive this. Applying #5/#9 caps repair spend; the wireframe step also sent ~1.0 M input chars per call (the knowledge/design-language context) — worth trimming the context that is not strictly needed for wireframing.

---

## Evidence
- `run-summary.json` — 31 calls / 39.47 cr, phases, 20 review issues, activity ("dropped unmounted components: BookingSummary, StayPhotoMosaic", gate 60/60/60, planner+copy JSON validation failures).
- DB docs: `ProductBrief.json` (explicit photo-first + "Search stays"/"Reserve" copy direction), `WireframePlan.json` (6 custom blocks, only 4 with components), `ComponentInventory.json` (4 mounted), `GateReport.json` (4 issues), `ReviewResult.json` (RETURN_TO_BUILDER, 20 issues).
- Source as built: `home.jsx`/`detail.jsx` (slot-index scenes + gradient defs), `HostTrustProfile.jsx`/`StayPolicies.jsx` (undefined tokens), `Card.jsx` (`rounded-xl`), `data.js` (generic CTAs, correct V11 summary).
- `screenproof/home.png`, `screenproof/detail.png` + probes (1 blank section on detail), `componentproof/*.png`.

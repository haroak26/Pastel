# Pastel Agent v11 — Figma-Artist Quality Upgrade

v11 builds on v10 (layout law, structures, creative system, per-screen data
isolation, local scenes, knowledge auto-registration + reference imagery
wiring) and v6–v9. The goal: screens that read as designed by a professional
Figma art-director — real, deployable UIs — with spacing/sizing that is
correct by construction, product-specific components that actually ship, and
brand fidelity judged against the real company's UI.

---

## W1 — Spacing & sizing foundations (code, $0, every run) ✅

- **One true rhythm ladder** (`lib/layout.ts`): the 8px ladder is exactly
  `py-8` (32px) / `py-12` (48px) alternating, dominant moments and full-bleed
  accent bands take `py-16` (64px). `megadesign.md` §4 updated to name the
  actual ladder. The old `py-10`/`py-6`/`py-14` mix (three scales in play,
  doc contradicting code) is gone; every recipe's section padding now routes
  through `sectionPad`/`padCls` (fullbleed hero, slogan CTA, map hero fixed —
  the map variant gained its missing frame wrapper).
- **No more `-mx-6` full-bleed escape hack** (`compose-v6.ts`): `main` is
  now plain `w-full min-w-0`; every section self-frames with `pastel-frame`,
  so full-bleed bands are genuinely edge-to-edge and framed sections center
  on the same law. `pastel-frame` gutter floor is `clamp(16px, 4vw, 48px)`
  — on the 8px grid at every viewport (the old 20px floor was off-grid at
  mobile). Topbar now aligns to the frame.
- **Geometry gate is truthful** (`checks/geometry.ts`):
  - Overlap scan skips ancestor/descendant pairs — the phantom "5
    overlapping elements" that appeared identically on every run since test2
    (~30 gate points, never repairable) is gone by construction.
  - Flush check measures VISIBLE separation = previous section's bottom
    content padding + next section's top content padding (full-bleed bands
    carry their padding on the inner frame div), so bands no longer read as
    "touching".
  - Rhythm check uses effective paddings (inner `pastel-frame` for bands).
  - Hero-scale floor is the theme's 4xl size (Linear's small type is legal).
- **Tokenized controls** (`compile.ts` + `base-components/*`): the
  `--control-sm/md/lg` (32/40/48px) scale ships in every theme; Button,
  Input, Select, Table, Topbar use it — never raw 36px/44px heights. The
  audit gate flags off-rhythm control heights in shared components and
  unlabeled inputs on screens (both were review-discretion before).
- `text-5xl` is now legal (compile.ts caps it at the theme's 4xl); `py-16`
  is the band step, not slop.

**Measured result** (offline render of airbnb/nike/linear compositions):
gate PASS 0 issues on all three; geometry `overflow=false · overlaps=0 ·
blanks=0 · rhythm=[] · flush=[] · heroScale=true` on every screen.

## W2 — Uniqueness (the differentiator now ships) ✅

- **Component-mount bug fixed** (`agents/wireframe-v6.ts`,
  `lib/ux-design.ts`): the wireframe JSON spec omitted `component` on custom
  blocks, so the mount contract silently dropped the ENTIRE inventory —
  test5 shipped **0 components** and every product rendered the same 6
  generic primitives. The prompt now requires `component` on custom blocks
  AND `enforceUxDesign` backfills deterministically (name/purpose keyword
  match on block content, then by role) with notes.
- **Company reference imagery shipped** (`script/capture-company-shots.ts`
  + `knowledge/companies/*`): every company now has `preview.png` +
  `references/*.jpg` captured from the real site (1280×900 preview, full-page
  references). The gallery, visual review, and prompt blocks were already
  wired — the content was the missing piece.
- **Vision-aware planning** (`gateway.ts` image blocks already supported):
  wireframe, UX, planner, and builder prompts attach the company's real
  screenshots (1–3, ≤1.5MB each) so structure, surfaces, and components
  adapt to the brand's actual look — not just its token colors.
- **4 new companies** (12 total): `linear` (crisp dense dev-tool), `strava`
  (athletic orange), `duolingo` (feather-green learning), `figma`
  (canvas+panels design tool) — each with manifest + design.md + captured
  imagery, all WCAG AA-validated (light+dark), auto-registered.

## W3 — Deployable data/content (the test5 bug class) ✅

- **Semantic detail contract** (`compose-v6.ts`, `lib/domains.ts`):
  `DATA.screens.detail.fields` is now `{label, value}` PAIRS from the same
  pack — "Dates: Apartment" / "Host name: Oaxaca" positional-zip bugs are
  impossible by construction. The booking summary (price, dates, guests,
  total) derives from the item itself (per-item `dates`/`guests`), not
  hardcoded or slot-indexed values.
- **Catalog rows deduped** (all packs): Fisher–Yates-shuffled pools — no
  more "Sunset Terrace Flat ×4 with different prices". Rentals pairs each
  name with a unique place/type/host.
- **Single conversion point**: the detail summary's outline action is
  literally "Save" — the double-"Reserve" defect is gone; the review heading
  is deterministic and data-derived, never a contradictory copy blob.
- **Visible labels**: the search pill renders Airbnb-style labels above
  Where/Check-in/Check-out/Guests; plain search variants use the `label`
  prop; the gate enforces inputs-with-labels as a rule, not review
  discretion.

## W4 — Imagery (photo-first, per item) ✅

- **Per-item scene seeding** (`lib/scenes.ts`, `compose-v6.ts`): scenes are
  seeded from the item's id (`hashSeed(row.id)`), never slot index — a
  listing shows the same art everywhere, and no two catalog cards share
  artwork. The detail gallery renders ONE property's five angle/crop
  variants (a new `crop` transform parameter) — "five different houses in
  one gallery" is impossible.
- **Photoreal-upgraded stays**: gradient sky (scenes are imagery — the UI
  no-gradient rule doesn't apply inside tiles), sun glow, clouds, layered
  hills, window grids, doors, chimneys, fences, ground shadows; product/
  track/media/card scenes gained shadow grounding.

## W5 — Validation ✅

- `script/e2e-v6.ts` assertions updated to the v10/v11 data contract
  (`DATA.screens.*`, `{label,value}` pairs, `min-h-80` gallery) + new V11
  assertions: inventory must be non-empty AND fully mounted (fails on the
  0-components run class), unique catalog rows, item-derived summary,
  single primary CTA, visible labels.
- 6 new unit tests (44 total, all green): rhythm ladder (no stale paddings,
  no `-mx` hack, main unconstrained), component backfill, semantic data
  contract, labels + per-item gallery indexing, scene determinism/crops,
  gate flagging (off-rhythm sizes, unlabeled inputs, `py-16` legal).
- `script/validate-geometry.ts`: offline compose → sandbox → headless render
  → REAL geometry gate, no model calls or DB.

## Status

Unit suite: 44/44 green. Offline geometry validation: gate PASS + clean
geometry on airbnb/nike/linear compositions. **Next step: a live E2E run**
(`npx tsx script/e2e-v6.ts`) against the real gateway to confirm the review
scores reflect the fixed gate (expect the phantom-overlap gate penalty gone
and a higher score ceiling).

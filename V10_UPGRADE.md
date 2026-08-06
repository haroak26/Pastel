# Pastel Agent v10 — Figma-level Upgrade Plan & Status

v10 builds on v6 (knowledge-base pipeline), v7 (domain content), v8 (copy
sanitizer, mount contract), and v9 (canonical two-screen model). The goal:
screens that look designed by a professional Figma art-director — better
spacing/sizing/location, more unique layouts, distinctive product components,
photoreal imagery that always renders, and zero cross-screen contamination.

---

## W1 — Layout law (spacing / sizing / location) ✅ implemented

- `megadesign.md` §4: the 8px rhythm ladder, alternating section padding
  steps, type ladder, container law, gutters, sizing, alignment.
- `lib/layout.ts`: `sectionPad(emphasis, index)` + `padCls(inst)` — every
  composer recipe now takes its padding from the rhythm, never an ad hoc
  `py-N` (the old `py-4`…`py-16` mix and the `pt-8 pb-2` hero are gone).
- `checks/geometry.ts` now audits **vertical rhythm** (adjacent sections may
  not jump more than one 32px step), **flush sections** (< 16px whitespace),
  and **hero-scale hierarchy** (the page's largest type must be ≥ 36px).
- Geometry is wired into the **gate** (was activity-only), so layout defects
  are file-targeted and flow into the repair loop.

## W2 — Layout structures (unique layouts, still 2 screens) ✅ implemented

- New structure vocabulary validated per role in `lib/ux-design.ts`:
  home `catalog-classic` / `catalog-rail` / `catalog-featured`;
  detail `detail-classic` / `detail-asymmetric`.
- `catalog-rail`: search + stats render in a **sticky left rail** beside the
  product grid on desktop (`lg:grid-cols-[300px_1fr]`).
- `list:featured`: a curated showcase strip (one wide 2-col tile + two
  1-col tiles) for editorial products.
- The UX agent picks the structure; `resolveUxDesign` normalizes illegal
  choices deterministically. Wireframe catalog + UX prompts updated.

## W3 — Creative system (more components, "more but not weird") ✅ implemented

- 8 new base-component exemplars: `RatingStars`, `AmenityGrid`, `MapCard`,
  `StatRing`, `MediaStrip`, `PriceCard`, `ScheduleList`, `ToolbarFilter`.
- Inventory budget 4–6 → **6–8** (schema + wireframe prompt); prompt now asks
  for at least one component only THIS product would have.
- Planner spec gains `designIntent` — one line of art direction; the builder
  treats it as a creative brief (system prompt) and its first pass runs at
  temperature 0.5 so output is a distinctive product component, not a
  re-skinned exemplar. The hardcoded-color self-check still guards the gate.

## W4 — Data isolation (cross-screen contamination — the test4 bug) ✅ implemented

Root cause: the detail `media:gallery` rendered `DATA.rows.slice(0,5)` —
FIVE different listings with name labels — plus picsum.photos failed in the
sandbox, leaving chart-colored blocks with letters.

- `src/data.js` now emits **per-screen views**: `DATA.screens.home.{rows,
  metrics, series, activity, …}` and `DATA.screens.detail.{item, rows:[item],
  images, fields, reviews, summary, primaryCta}`.
- Every recipe reads only its own screen's view (`blockCustom` included);
  the detail gallery renders **the same item's** scenes, no name labels.
- New content-gate rule: a screen file referencing bare global `DATA.*`
  (other than screens/copy/people/productTitle/…) is flagged HIGH —
  the bug class is impossible by construction.
- `navFor` detail tab label stays item-derived.

## W5 — Imagery (local generative SVG scenes) ✅ implemented

- `lib/scenes.ts`: deterministic per-domain scene generator (stay/product/
  track/album/chat/board/card/geometric) — flat fills, theme CSS-vars, seeded
  per item, inline SVG via a baked `SCENES` const. No network, no picsum,
  nothing can fail to load; sandbox screenshots and the visual review now
  judge real artwork.

## W6.1 — megadesign.md beef-up ✅ implemented

New/upgraded sections: §4 Layout & spacing law, §4b per-surface guide,
§6e creative direction, §8 cross-screen integrity & detail-page law,
§9 self-sufficiency. Still injected into every agent prompt.

## W6.2 — Knowledge auto-registration + reference imagery ✅ implemented

- **Companies auto-register**: `knowledge/index.ts` scans
  `knowledge/companies/` at runtime — drop in a folder (`manifest.ts` +
  `design.md`) and the gallery, scoring, brief, and docs pick it up. No index
  edit. (Bundled manifests remain the production baseline.) Scoring tags
  (`bestFor`) are still recommended — they drive the "suggested" ordering.
- **Reference images**: `preview.png` + `references/*.png` per company →
  shown in the company picker gallery, attached to the visual review as
  brand-fidelity ground truth, and listed in `compileCompanyBlock` + the
  company `design.md` ("## Reference imagery" section added to all 8).

## W7 — Review, gates, tests ✅ implemented

- Static + visual review prompts judge the layout law, cross-screen
  integrity, and brand fidelity vs. reference imagery.
- New tests (38 total, all green): rhythm/layout, structure normalization,
  catalog-rail compose + sandbox verify, featured strip, cross-screen leak
  gate, scene tiles, auto-registration, image helpers + path safety.

---

## Status

Everything above is implemented and the unit suite passes
(`npx tsx --test server/tests/pastel-v6.test.ts`, 38/38; sandbox verification
included). **E2E runs have not been executed yet** — next step is a live run
(e.g. rerun the test4 Airbnb prompt) to validate the full pipeline with
screenshots and the visual review.

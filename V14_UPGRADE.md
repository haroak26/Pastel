# Pastel Agent v14 — Final: De-Airbnb, Design-Token Agent, Product-Led UI

v14 is the final pipeline pass. It fixes the critical defect that v10–v12
introduced: the canonical two-screen model was hardcoded to an **Airbnb
shape** — every product got a search toolbar + product grid + photo gallery +
booking pane + "Guest reviews", regardless of what the product actually is.
A coaching app, a workspace, and a feed all rendered as a vacation-rental
marketplace.

v14 makes the pipeline **product-led** and gives every run its **own design
system** and **its own content**.

## The defect (what was hardcoded)

- `lib/ux-design.ts` — `CANONICAL_SCREENS` forced "browse the catalog" +
  "photos, details, primary action"; `HOME_REQUIRED=["search","list"]`,
  `DETAIL_REQUIRED=["media","detail","cta","list"]` with hardcoded
  `"Guest reviews"`; every home structure was `catalog-*`; the dominant
  moment was always `list:cards` / `media:gallery`.
- `agents/wireframe-v6.ts` — search was "PREFERRED"; the deterministic
  fallback rebuilt the Airbnb catalog for every non-fitness domain
  (hero → search → grid / gallery → pane → CTA → ReviewList).
- `agents/brief-v6.ts` — fallback purposes were "main browse/catalog screen"
  and "single-item info page"; the inspiration fell back to a hardcoded
  company (`?? "apple"`).
- `knowledge/megadesign.md` §8 — a "Detail-page law" that was literally an
  Airbnb listing (gallery → price/dates summary → reviews → trust band).
- `orchestrator-v6.ts` — a hardcoded `manifest.name === "Spotify"` dark-mode
  check, and the theme was copy-pasted from the selected company manifest.

## V14 changes

### 1. New design agent — `agents/design-v14.ts` (BEFORE the brief)

Pipeline: `discovery → design → brief → wireframe → build → assemble →
present → review`.

- Produces the run's own **design tokens** (`DesignTokens`, persisted as
  `docs/design/DesignTokens.json`): brand colors, radius scale, type scale,
  control sizing (32/40/48px ladder), section rhythm, and fonts.
- Inputs: prompt + clarify answers + user visual reference + the
  **top-scored company as a HINT** (`scoreCompanies` — adapt, never copy).
- Code-side **WCAG-AA validation** (`validateDesignTokens`) rejects any
  palette that fails contrast — a "dark navy on airbnb white" default can
  never ship.
- Deterministic fallback (`designTokensFromManifest`): derive tokens from
  the hint company manifest — the pre-v14 behavior is now the safety net,
  not the default.
- `themeFromDesignTokens` builds the same `ResolvedTheme`/`cssVars` shape,
  so `compile.ts`, the composer, sandbox, and preview are untouched. The
  `--control-*` scale now comes from the theme (removed the hardcoded block
  in `compile.ts`; `resolveCompanyTheme` emits the standard ladder).
- `brandKit` in the run manifest is real for the first time (colors, fonts,
  radius, sizes from the tokens).

### 2. Brief agent — reference companies selected from the FULL catalog

`agents/brief-v6.ts`:

- The model sees **every registered company** (slug, name, description,
  tags) and selects primary + secondary references **with a rationale**.
- The user's gallery pick is a strong prior, never a requirement.
- The hardcoded `?? "apple"` fallback is gone; the deterministic fallback is
  the top-scored company.
- Screen purposes are product-led in the SYSTEM prompt, JSON example, and
  fallback: home = the product's primary workflow (dashboard / feed /
  workspace / coaching / catalog), detail = its focused secondary workflow.

### 3. Product-led enforcement — `lib/ux-design.ts`

- New role derivation: `isCatalogHome` / `isMediaDetail` /
  `detailWantsReviews` read the **screen's own purpose text**. Search +
  grid are forced ONLY for genuine browse/marketplace products; gallery +
  booking pane + reviews ONLY for media-rich/commerce detail.
- New home structures: `dashboard-led`, `feed-led`, `workspace-led`
  (catalog-* remain legal, resolved via `homeStructureFor`).
- Dominant moments are product-led (`dominantMomentFor`): a dashboard home
  emphasizes its hero, not the product grid.
- Hardcoded "Guest reviews" content removed; the composer's review heading
  is domain-aware (`Guest reviews` stays / `Customer reviews` /
  `From the community` / …).

### 4. Product-led wireframe fallback — `agents/wireframe-v6.ts`

The deterministic fallback now routes by **domain pack**:

- fitness → the v12 coaching dashboard (kept);
- ecommerce/rentals/travel → catalog: search hero + grid / gallery + pane +
  CTA + social proof (the only place the marketplace shape is legal);
- media → hero + carousel home, gallery + facts detail;
- social → feed home + thread view;
- everything else → dashboard: hero + scoreboard + chart + rows home,
  info pane + action band detail — **no search, no gallery, no reviews**.

`BLOCK_CATALOG` / `SCREEN_ARCHETYPES` guidance de-biased (search optional,
gallery only for media-rich items).

### 5. Composer — `compose-v6.ts`

- `blockDetail` renders the Airbnb booking card (price/dates/guests/total +
  "Verified host") **only for commerce/travel domains**; every other product
  gets a focused record card (value + status + date + one primary action).
- Reviews heading domain-aware (see §3).

### 6. Design law — `knowledge/megadesign.md`

- §8 rewritten: the detail screen serves the brief's focused secondary
  workflow; booking language is only legal for commerce/travel.
- §4b toolbar/gallery language qualified (only for browse/media-rich).

### 7. Wire contract + client

- `types.ts` / `use-pastel-agent.ts` / `AgentRunCard.tsx` / `DocsPanel.tsx`:
  new `design` phase between discovery and brief ("Design System").
- `server/routes/pastel-agent.ts`: cost estimate includes the design call.
- `.env.example`: `DESIGN` role added (`PASTEL_MODEL_DESIGN`,
  `PASTEL_MAX_TOKENS_DESIGN`).

### 8. Content gate fixes (false positives exposed by product-led fallbacks)

- `HARDCODED_ZEROS` no longer flags attribute positions
  (`aria-valuemin={0}` is legal markup).
- `\bworkspace\b` is not flagged as B2B language in `productivity` products.

## Validation

- Unit suite: **52/52 pastel tests green** (`node --import tsx --test
  server/tests/pastel-v6.test.ts`), including 7 new v14 tests:
  token fallback validates + compiles, WCAG rejection, product-led
  structures, dashboard-never-degrades (compose + sandbox + gates),
  catalog-keeps-browse, full-catalog scoring, wire-contract phase.
- The 9 failing tests in the full `npm test` run are pre-existing and
  unrelated (missing `server/lms` / `server/webhooks/inbound-email`
  modules on this checkout).

## Next step

A live E2E run against the real gateway (e.g. a non-catalog prompt like
"a habit tracker for night-shift nurses") to confirm the design agent
produces a distinct token system and the screens render product-led, then
rerun the same prompt with a second product to prove outputs are no longer
Airbnb-shaped by default.
## Part 2 — model tiers, design-data agent, next-gen review

### 9. Model allocation (final)

Pipeline: `discovery → design → brief → data → wireframe → build → assemble →
present → review`.

- **Haiku (cheap)**: `clarify`, `planner`, `builder`, `repair` — the mechanical
  stages (per the requirement: planner/builder stay on Haiku).
- **Luna (mid)**: `design`, `data` (new), `brief`, `wireframe`, `copy` (moved
  from Haiku — the product voice is a judgment task), `review`,
  `visualReview`.
- `assemble` role remains registered but is unused by any agent.

### 10. New design-data agent — `agents/data-v14.ts` (Luna, after the brief)

All page content is now **written per run**, not pre-baked:

- People, metrics (4, distinct labels), series, rows (unique names,
  per-item fields/dates/guests), activity, detail fields+values, settings,
  search/empty states.
- **Social proof**: reviews (4–8) + `reviewHeading` — the "Guest reviews"
  copy is now generated for the product (a workspace gets team feedback, not
  Airbnb wording).
- **Trust items**, **primaryCta**/**homeCta**, **priceSuffix** — no more
  baked `DOMAIN_PRIMARY_CTA`/`TRUST_ITEMS`/`REVIEW_PHRASES` defaults in the
  composer.
- The content consts moved to `lib/domains.ts` as the deterministic
  **fallback** (also filled into `mockDataset`, so the fallback dataset is
  complete); `compose-v6.ts` reads `data.*` first and only falls back to the
  maps.
- `dataPlanSchema` + `sanitizeDataPlan` (distinct metric labels, unique row
  names, no currency/off-domain content in non-finance products, review
  avatars derived deterministically). Gateway failure → domain-pack fallback
  (tested via the `__setTestClient` seam).
- New `data` phase in the timeline ("Content & Data") + `docs/planning/
  DataPlan.json` + one Luna call in the cost estimate.

### 11. Next-gen review agent — `agents/review-v14.ts` (vision-first)

The review now looks at the **rendered screenshots** and judges spacing,
missing components, duplicated components, and flow:

- **Measured ground truth**: the DOM-geometry report (rhythm, flush,
  overflow, overlaps, blanks, hero-scale) and the mount audit are passed
  INTO the model prompts (`geometrySummary`, `screenContext`) — the model
  judges with real numbers, not guesswork.
- **Deterministic checks** (`checks/review-v14.ts` → gate):
  duplicate components mounted twice on one screen (HIGH) and components
  planned for a screen that no custom block mounts.
- **Static review** (Luna): judges code with geometry + screen context +
  the `reviewV14Checklist` (spacing / missing components / duplicates /
  flow).
- **Visual review** (Luna, vision): each screenshot is paired with the
  wireframe blocks it must render, the components that must be visible, and
  its measured geometry; the model verifies presence, flags visual
  duplicates, and judges flow + purpose fit. Rejects any screen that reads
  as an unrelated template (especially a generic marketplace).
- `mergeReviewResults` is reused from `review-v6`.

## Validation

- Unit suite: **58/58 pastel tests green** (`node --import tsx --test
  server/tests/pastel-v6.test.ts`) — the v14 suite plus 6 new v14b tests:
  fallback dataset content, sanitizer (duplicates/currency), runData
  fallback, composer reads dataset content, composition audit, review
  context builders.
- The 9 failing tests in the full `npm test` run are pre-existing and
  unrelated (missing `server/lms` / `server/webhooks/inbound-email`
  modules on this checkout).

## Next step

A live E2E run against the real gateway (e.g. a non-catalog prompt like
"a habit tracker for night-shift nurses") to confirm the design agent
produces a distinct token system, the data agent writes fresh content, and
the screens render product-led, then rerun the same prompt with a second
product to prove outputs are no longer Airbnb-shaped by default.

---

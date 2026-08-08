# Pastel Agent Versions

This document records the Pastel Agent architecture rather than only its
release labels. Version names are historical milestones; the active
implementation is the in-place v17 rewrite in this directory.

## v17 - Figma-Quality Composition (Active)

v17 is the quality upgrade that closes the gap with professional design tools.
It replaces the "valid blocks -> stacked output" mental model with product
context, surface vocabulary, brand coherence, composition-aware layout, and
design-quality review.

### New

- **Product context classifier** (`classifyContext`): distinguishes app,
  workspace, dashboard, feed, editor, catalog, marketing, and onboarding
  contexts. Marketing composition (centered heroes, oversized CTAs, footers,
  "Sign in"/"Get started" topbar links) is ILLEGAL on app screens.

- **Navigation policy** (`lib/navigation.ts`): navigation is a product-level
  decision, never a wireframe default. Desktop app screens default to sidebar
  (dashboards/workspaces) or topbar (lightweight products). Tabbar is mobile-
  only. Footer navigation is ILLEGAL on app screens.

- **Surface vocabulary** (`lib/composition.ts`): 12 surface types replace the
  card-centric model. Tonal-band (hero/CTA default), soft-wash (stats/charts),
  divided-list (activity/rows/sequences), inset-panel (one per detail), plain,
  accent-block, split-panel, editorial-tile, metric-cluster, floating-action,
  hairline-section, and card (sparingly). "Card" is one tool among many.

- **Composition-aware layout** (`lib/layout.ts`): a full frame spec (page
  gutter, column gap, module gap, section gap, subsection gap, content width,
  padding hierarchy) replaces alternating section-padding. Spacing derives from
  frame/column/group relationships, not mechanical alternation.

- **Brand kit** (`lib/brand-kit.ts`): the design agent now produces a
  validated brand kit with primary/accent/supporting colors, corner language,
  border policy, shadow policy, accent-frequency rules, signature moves,
  forbidden accent colors, and CSS variable exports. The review board judges
  brand coherence against this kit.

- **Density contract** (`lib/density.ts`): context-aware minimums for module
  count, populated rows, metrics, custom components, surface variety, and
  viewport content fill. Prevents the "sparse placeholder" problem.

- **V17 design plan** (`contract.ts`): product context × mode determines
  structure, navigation, footer policy, and fingerprint. Zero-cost review
  board adds context gating, nav legality, marketing leakage detection,
  density gates, and brand-kit coherence.

- **Updated anti-slop** (`anti-slop.ts`): added hard rules for navigation
  (never tabbar as default, never footer on app screens), surfaces (do not
  default to bordered cards), context (app is the default, not marketing),
  and density (minimum populated content).

- **Expanded UX schema** (`schemas.ts`): `ProductContext`, `BrandKit`,
  `V17LayoutPlan`, `V17SectionPlan`, `V17ScreenLayout`, `V17NavDecision`,
  `V17SectionRelationship`, expanded surface types, column layouts.

### Changed

- `lib/layout.ts`: rewritten with V17 frame spec, `v17ScreenLayout`,
  `sectionPadV17` (relationship-aware), backward-compatible PadContext.

- `lib/ux-design.ts`: added `classifyContext` (deterministic product-context
  classification), updated `SURFACE_OF` map with v17 surface types.

- `agents/design.ts`: produces `brandKit` alongside tokens + visual intent.

- `agents/wireframe.ts`: block catalog updated with v17 surfaces, V17
  composition rules, navigation policy, marketing leakage prevention.

- `agents/ux.ts`: UX prompt updated with product context, v17 surfaces,
  column layouts, brand kit awareness.

- `agents/review.ts`: v17 rubric (9 weighted categories), v17 blocking
  defects, brand-kit coherence integration.

- `compose.ts`: uses `buildV17DesignPlan`/`enforceV17Plan`, product context
  aware, nav enforcement, footer suppression on app screens, tabbar limited
  to mobile.

- `contract.ts`: renamed v16 types to v17 with backward-compat aliases,
  added `classifyProductContext`, `auditV17Review` with context/nav/density/
  brand-kit gates.

### Files

New:
- `server/lib/pastel-agent/lib/composition.ts`
- `server/lib/pastel-agent/lib/brand-kit.ts`
- `server/lib/pastel-agent/lib/navigation.ts`
- `server/lib/pastel-agent/lib/density.ts`
- `server/tests/pastel-v17.test.ts`

Modified:
- `server/lib/pastel-agent/schemas.ts`
- `server/lib/pastel-agent/contract.ts`
- `server/lib/pastel-agent/lib/layout.ts`
- `server/lib/pastel-agent/lib/ux-design.ts`
- `server/lib/pastel-agent/anti-slop.ts`
- `server/lib/pastel-agent/agents/design.ts`
- `server/lib/pastel-agent/agents/wireframe.ts`
- `server/lib/pastel-agent/agents/ux.ts`
- `server/lib/pastel-agent/agents/review.ts`
- `server/lib/pastel-agent/compose.ts`

### Acceptance

v17 passes when:
- Test matrix produces distinct fingerprints across unrelated product types
- Desktop app screens default to sidebar or topbar (never tabbar)
- Footer only renders on marketing/onboarding contexts
- Marketing heroes are rejected on app screens
- Brand kit validates coherence and forbids default indigo/blue accents
- Density gates catch sparse composition
- Backward-compatible with all existing v16 tests

## v6 - Knowledge-Base Pipeline

- Introduced the company knowledge base under `knowledge/companies/`.
- Added hand-authored `design.md` references and validated `manifest.ts`
  companions.
- Added the hybrid model strategy: cheap mechanical work and a stronger model
  for design judgment.
- Established the stages: discovery, brief, wireframe, build, assemble,
  present, and review.
- Added deterministic code composition, sandbox verification, screenshots,
  quality gates, credit holds, and bounded repairs.
- The composer used known-good blocks so models specified composition instead
  of writing unconstrained page layout.

## v7 - Domain-Aware Content

- Added domain packs for fitness, finance, media, ecommerce, rentals, travel,
  social, and productivity.
- Added deterministic mock data and content audits.
- Added copy/data sanitization for wrong currencies, duplicate labels, finance
  vocabulary, and generic SaaS content in unrelated products.
- Added signature variants such as scoreboards, bands, charts, and dropdown
  search.

## v8 - Semantic Coherence and Mount Contracts

- Added semantic copy validation for chart units, labels, and metrics.
- Added component inventory mount contracts.
- Dropped unmounted components and invalid custom blocks deterministically.
- Added card budgets, outline-button budgets, blank-section detection, and
  page-scale component checks.
- Added model output repair for malformed or incomplete JSON.

## v9 - Canonical Screen Model

- Stabilized the two-screen contract as `home` and `detail`.
- Added UX refinement after wireframe planning.
- Added deterministic screen ordering, one dominant moment per screen, and
  screen-local data views.
- Added detail integrity rules so a detail screen renders one selected item.
- This version also introduced the marketplace-shaped defaults that later
  required correction.

## v10 - Figma-Quality Foundations

- Added the 8px rhythm ladder and geometry checks.
- Added layout structures such as catalog rail and featured layouts.
- Added more product-specific base component exemplars.
- Added per-screen data isolation and cross-screen leak checks.
- Added deterministic local SVG scene generation so sandbox screenshots did not
  depend on remote image URLs.
- Added company preview and reference imagery for brand review.

## v11 - Layout, Imagery, and Deployment Quality

- Corrected spacing, gutter, control-size, and geometry false positives.
- Added deterministic component backfill when models omitted component names.
- Added unique item seeding and detail-gallery integrity.
- Added stronger screenshot review context and reference-image wiring.
- Added regression tests for rhythm, imagery, mount contracts, and semantic
  detail data.

## v12 - Product-First Coaching Surfaces

- Added adaptive fitness data: readiness, sets, reps, load, rest, recovery,
  form cues, and progression.
- Added coaching dashboard and exercise-detail fallbacks.
- Added user-uploaded Figma/Banani visual references.
- The visual-reference upload feature is not part of v16. Internal company
  reference screenshots remain supported.

## v14 - Design Tokens, Data Agent, and Visual Review

- Added a design-system agent before the brief.
- Added per-run tokens, WCAG validation, type scale, radius scale, control
  ladder, and visual intent.
- Added a data agent after the brief so content was generated per run.
- Added vision-first review using screenshots plus geometry and component
  context.
- Reworked the brief and fallback language to make products product-led.

## v15 - Mode-Aware Correction Attempt

- Added product modes: browse, transact, track, create, operate, learn, and
  social.
- Added mode checks intended to prevent search, grids, galleries, booking
  cards, and reviews from leaking into unrelated products.
- Added visual-intent axes for spacing mood, corner language, media strategy,
  and type voice.
- This was still implemented as incremental logic around the older composer
  and fallback architecture. It did not eliminate the legacy catalog bias.

## v16 - Ground-Up In-Place Rewrite (Complete)

v16 keeps the successful v6-v11 execution architecture and rewrites its
contracts, knowledge flow, composition law, and review system in the existing
Pastel files. It does not add a parallel implementation directory. The active
production path and Pastel regression suite are complete.

### Retained

- The same high-level stages and two-model cost strategy.
- Deterministic composition and sandbox verification.
- Parallel planner/builder work.
- Company `design.md`, `manifest.ts`, preview, and reference screenshots.
- The run document system, SSE phases, credit ledger, screenshot review, and
  bounded repair loop.

### Rebuilt

- Product contract and screen-intent schemas.
- Company-reference compilation and multi-factor selection.
- Mode-aware wireframe enforcement.
- Data shapes and detail-item scoping.
- Section renderer registry and responsive composition.
- Static gates for mode leakage, duplicate structure, repeated fingerprints,
  cross-screen reads, and illegal sections.
- Visual review prompts using product intent, company visual grammar, and
  measured geometry.

### Removed

- Global catalog/detail assumptions.
- Generic search and grid injection.
- Booking vocabulary outside transaction products.
- Company screen recipes as structural templates.
- User Figma/Banani upload intake.
- Temporary `v16/` compatibility modules.

### Company Knowledge Rule

Company references determine visual language. The product contract determines
page structure. A company may influence typography, color, density, surfaces,
interaction language, media treatment, and signature moves, but it may not
force a marketplace, dashboard, gallery, or catalog shape onto an unrelated
product.

### Active Files

- `contract.ts` contains the sandbox contract and v16 product/screen contracts.
- `knowledge/index.ts` compiles company references and selects visual
  capabilities.
- `orchestrator.ts` is the active in-place v16 orchestrator.
  with the existing run and persistence wire contract.
- `compose.ts` is the active composer and enforces the v16 section contract.
  at its final composition boundary.
- `engine.ts` is the production entry point.

### Validation Standard

Every v16 change must pass:

1. Existing v6-v15 compatibility tests that remain relevant.
2. Mode-specific structural tests.
3. Company-reference selection tests.
4. Cross-product layout-fingerprint diversity tests.
5. Sandbox and geometry checks at 1440px and 375px.
6. Screenshot visual review for the test 5-11 prompt matrix.

### Completion Status

- Active production entry point: `engine.ts` -> `orchestrator.ts`.
- Temporary v16 compatibility directory: removed.
- Company visual knowledge: active through `knowledge/index.ts`.
- Deterministic v16 review board: active in `contract.ts` and the orchestrator.
- Model review repair findings: routed to targeted builder repair.
- Pastel regression suite: 81 tests passing at the time of this release.

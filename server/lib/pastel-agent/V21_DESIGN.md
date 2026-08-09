# Pastel Agent v21 — Design Upgrade + Cost Reduction

## What changed and why

v20 eliminated silent fallback but kept four defects users could see:

1. **Placement** — the composer invented section placement, producing sparse
   unbalanced screens (900px empty gaps, boards with one card per column).
2. **Section headers** — no heading system; headers came out inconsistent.
3. **Clutter** — every screen mounted every component (12 in a v20 run) and
   density rules pushed "fill 50%+ viewport", so screens were packed with
   small, weak sections.
4. **Components** — built by the cheapest model in the pipeline from a shared
   base-component anchor, so they were weird, inconsistent, and never rounded.

v21 fixes these and cuts cost: the v20 e2e run spent 66.41 credits across 66
model calls with ~45 calls shipping 800K–2M input chars each (base64 images +
full megadesign repeated on every mechanical call).

## 1. Base components removed (user-requested)

`server/lib/pastel-agent/base-components/*` is deleted. There is no
`basedOn` anchor anywhere: no reference file reaches a prompt. The builder
writes components from the **Component Design Law**
(`knowledge/component-law.ts`): one visual idea per component, spacing from
the token scale, surface rules, "would this ship in a different product
unchanged?" self-check. No code anchor → no shared skeleton → distinct UIs.

- `schemas.ts`: `basedOn` dropped from inventory + spec (kept optional for
  persisted-run compatibility).
- `checks/audit.ts` `isVerbatimBaseCopy` → flags components that use NO theme
  token at all (the bare-template signature).
- `checks/content.ts` `isMaterializedPrimitive` → no-op (nothing is
  materialized from a base file anymore).

## 2. Deterministic placement plan (the placement fix)

`lib/layout-plan.ts` derives a **V21 Layout Plan** per screen after the UX
stage (zero model cost):

- one dominant moment — full-width, display-scale, NO header;
- every other section gets a deterministic header (eyebrow + title +
  optional action) from the copy plan;
- UX `pair` sections become a two-up split row (2/3 + 1/3);
- every section carries placement / width / heightIntent / surface;
- `checks/layout.ts` verifies the composed output: section count cap,
  SectionHeader presence, ≤2 custom components per screen, split rows render
  side-by-side.

The composer prompt (`agents/screen-composer.ts`) is now structural: render
EXACTLY the planned sections in order with the planned placements and
headers; every section is `<section>`-wrapped; every non-dominant section
opens with `<SectionHeader>` (deterministic component in `compose.ts`'s
shell).

## 3. Clutter caps

- `lib/ux-design.ts`: home ≤ 5 sections, detail ≤ 4 (trailing excess dropped
  deterministically); hero blocks are ILLEGAL on non-browse homes (the v18
  dashboard antipattern is now enforced, and the dashboard/social/fitness
  wireframe fallbacks no longer emit marketing heroes).
- `checks/layout.ts` enforces ≤ 2 custom components mounted per screen.

## 4. Component quality

- **Model split** (`gateway.ts`): custom product components build on the MID
  tier (`builderCustom`, gpt-5.6-luna); shell chrome stays cheap.
- **Radius floor** (`agents/design.ts` `enforceRadiusFloor`): soft corners →
  radius-lg ≥ 8px; pill → ≥ 16px. `checks/lint.ts` maps `rounded-xl` →
  `radius-xl` (v20 collapsed it onto radius-lg, which read as "not rounded").

## 5. Cost reduction

| Driver | Fix |
|---|---|
| Base64 company images on ~45 mechanical calls (800K-2M chars each) | planner/builder/compose attach NO company imagery; `companyRefImageBlocks` picks smallest files ≤ 500KB; design/wireframe/ux keep a bounded cue |
| Full megadesign (14KB) repeated per call | mechanical stages get the compact `agentStageLaw`; full law stays for design/wireframe/review |
| 25 planner calls (shell planned by model + truncation retries) | shell components get deterministic specs (8 calls → 0); planner max tokens 4000→6000; designIntent truncated at the 240-char cap instead of failing |
| Wireframe truncation re-runs (4 calls) | wireframe max tokens 9000→16000 |
| Budget ceiling cut off repair at 25 credits | default `PASTEL_MAX_RUN_CREDITS` 25→45; estimate endpoint reflects the v21 call graph |
| User visual target | still attached to design/wireframe/UX/compose + custom-component builds (it IS the art direction) |

Expected: ~35-45 credits/run (was 66+) with fewer, higher-quality calls.

## 6. Pipeline changes (`orchestrator.ts`)

- Layout plan built after UX, persisted as `docs/planning/LayoutPlan.json`,
  passed to both composer calls, and audited by `runGate`.
- Planner stage: shell components skip the model entirely.
- Builder stage: no company images; visual reference for custom only.
- Compose stage: layout plan + compact law instead of megadesign.

## Files

New: `knowledge/component-law.ts`, `lib/layout-plan.ts`, `checks/layout.ts`.
Modified: `agents/{planner,builder,wireframe,design,screen-composer}.ts`,
`compose.ts`, `orchestrator.ts`, `gateway.ts`, `schemas.ts`,
`lib/ux-design.ts`, `checks/{audit,content,lint}.ts`, `knowledge/index.ts`,
`server/routes/pastel-agent.ts` (estimate), `.env.example`.
Deleted: `base-components/*`.

## Tests

`server/tests/pastel-v6.test.ts` (57 tests) and `pastel-v15.test.ts` (10)
updated to drive the real v21 path (`composeScreenV20` + SectionHeader
bodies) and assert: layout plan placements/headers/caps, radius law,
component design law, name-based mount contract, no booking shape for
non-transact products. The dns-records/inbound-email failures are
pre-existing (`server/lms` module missing — unrelated to Pastel).

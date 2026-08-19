# Maxi Agent v25 — "Auteur"

## Purpose

v25 is the speed + taste rebuild of v24. v24 proved the verification stack
works (e2b-only execution, esbuild bundling, 3-viewport geometry gates,
prop-contract auto-fix) but exposed two structural failures the test runs
quantified:

1. **Too slow.** 43 model calls, 7 sequential JSON handoffs, 320s wall for a
   two-screen app (agentv24: w2=117s, w4=118s). Figma Make / Framer land in
   120–180s with a plain strong-model harness.
2. **Too generic.** The pipeline's scaffolding — 54 hand-authored layout
   templates, a 2-custom-component cap, mandatory SectionHeaders, accent
   quotas, surface laws, spacing alternation — boxed the model into a house
   style. Uniqueness was literally against the rules. Review scores (58–62)
   and the "reads as a template" findings were *caused* by the constraints.

v25 inverts the architecture: **the strong model is the designer; the engine
is the QA department.** Freedom in generation, determinism in verification.
This is the shape Framer/banani use — a strong model with a point of view and
a standard harness — with our hard-won verification stack underneath it.

## Thesis

> v20–v24: deterministic framework, model fills the blanks.
> v25: model designs, framework verifies and repairs.

Everything the model is good at — having a taste-level point of view, writing
whole files of real product UI, seeing a screenshot and fixing the overflow —
becomes the model's job. Everything code is better at — data density, token
math (WCAG), bundling, rendering at 375px, counting rows, prop contracts —
stays deterministic.

## Pipeline — 4 waves, ~10–18 calls, 80–150s wall

```
WAVE 0 · DIRECTION          1 call · strong model (~15s)
  in:  prompt + answers + inspiration mood block + bounded knowledge slice
  out: DesignBlueprint (one JSON):
       · brief (title, productType, mode, audience, copyDirection)
       · THREE concepts — each a named POV: name, thesis, palette (hex),
         font pairing (real Google Fonts), density, corner language, motion
         character, 2–3 signature moves
       · chosenConcept (self-picked) — vetted by the deterministic
         divergence scorer
       · screens (2–4): id, intent paragraph, nav, dominant moment
       · componentManifest: name, kind (primitive|component), props with
         types/required, one-line design intent, usedBy — the API contract
       · dataSchema: currency, units, dateRange, people, metrics,
         list exemplar rows (2–3), detail fields, activity
  deterministic post-pass (ZERO calls): concept palettes WCAG-fixed,
  sibling-similarity veto, chosen concept expanded to full DesignTokens
  (secondary/muted/popover/status/chart ramps derived via HSL math),
  manifest linted (identifiers, dupes, usedBy reconciliation, primitive
  floors), theme built. Density is solved HERE, at the data source: the
  dataset generator expands the exemplar rows to 6–8 full rows.

WAVE 1 · SYNTHESIS          N components + M screens, ALL PARALLEL (~35–60s)
  Screens start IMMEDIATELY — they code against the manifest APIs, not
  against built code — so components and screens run in one parallel batch
  (concurrency 8, strong model):
    · authorComponent → src/components/<Name>.jsx (complete, self-contained)
    · authorScreen    → src/screens/<id>.jsx (complete file; mounts NavAdapter
      with the locked chrome contract; content rendered from src/data.js)
  Deterministic shared files generated alongside (zero calls):
  src/lib/shell.jsx (NavAdapter + IconOf), src/data.js, src/App.jsx,
  src/styles.css (token sheet), package.json.
  Post-pass (zero calls): anti-slop lint auto-fix + prop-contract audit and
  auto-fix against the manifest's declared props.

WAVE 2 · VERIFY             deterministic (~15–30s, warm e2b pool)
  esbuild bundle → e2b smoke → render at 375/768/1440 → geometry (overflow
  is HARD) → hard-gate classifier splits every issue into hard (crash,
  overflow, prop violation, illegal imports/hex, missing export) vs advisory
  (density, rhythm, hero-scale, a11y polish).

WAVE 3 · POLISH             0–3 repair calls TOTAL, hard failures only
  One repair call per failing FILE with the file + the exact gate errors +
  the rendered screenshot when available. Re-verify only the affected
  screens (incremental verifier). Cap reached → ship flagged
  (done_needs_review). Components with persistent failures converge through
  the deterministic fidelity fallback — the v24 lesson, kept.

WAVE 4 · ADVISORY REVIEW    1 call · NON-BLOCKING
  Vision review → score + strengths + improvements, surfaced in the UI and
  persisted (docs/review/AdvisoryReview.json). It NEVER triggers a repair
  loop and NEVER gates the run — the 118s wave-4 re-review tail of v24 is
  structurally gone. Deterministic gates are the only blockers.
```

## The anti-genericness system (the banani gap)

1. **Named concept thesis.** Every run commits to a named point of view
   ("ink-and-air pace journalism"), and every Wave-1 prompt opens with it.
   The single biggest uniqueness lever — components stop being "a stat card"
   and become "the pace wall".
2. **Best-of-3, auto-picked.** The Direction call produces three concepts
   that MUST differ across hue family, type voice, density, and corner
   language. A deterministic divergence scorer vetoes a chosen concept that
   is a near-sibling of another; distinctness is enforced, not hoped for.
3. **The sameness rules are deleted.** 54 layout templates, the 2-component
   cap, the SectionHeader mandate, accent-count quotas, surface vocabulary
   laws, spacing alternation — all gone. Replaced by craft principles in the
   author prompts: one visual idea per component, a display-scale dominant
   moment per screen, asymmetry welcome, real data only, the concept's
   signature moves.
4. **Primitives are authored per-run.** Buttons, inputs, avatars are part of
   the concept — a pill-shaped editorial concept gets pill primitives; a
   technical mono concept gets squared 2px primitives. The vendored shadcn
   library becomes fallback material only (the fidelity path), never shipped
   by default.
5. **Content is design.** The Direction call writes real-feeling exemplar
   content (names, units, statuses, dates); the deterministic generator
   expands it to dense rows. The v24 "2 list rows rendered" failure class is
   solved by generating 6–8 rows up front, not by a schema floor the
   composer ignores.

## What v24 taught us — kept / deleted

**Kept (the verification stack):**
- e2b-only execution with the warm sandbox pool and waiter queue
- esbuild local bundling (compiler, not execution); IncrementalScreenVerifier
- 3-viewport geometry gate — overflow at ANY width is blocking
- Prop-contract audit + deterministic auto-fix (`lib/prop-validation.ts`)
- Anti-slop lint with auto-fix tier (`checks/lint.ts`)
- Code gate: hex literals, illegal imports, missing default export
  (`checks/audit.ts`)
- Builder convergence fallback → deterministic fidelity path
  (`lib/fidelity.ts`, ported into `agents/repair.ts`)
- Deterministic nav chrome via the static NavAdapter with a locked prop
  contract (v24 WS1 — the model can never break chrome)
- Inspiration as MOOD, never literal brand colors (`knowledge/index.ts`)
- Domain units/dates/currency conformance — moved into the deterministic
  data generator (by construction, not post-hoc)
- Run-store/SSE/credits wire contract, timing + callsByRole instrumentation,
  stale-error clear, unhandled-rejection harness hardening

**Deleted (the scaffolding that caused the sameness and the 320s):**
- Genome agent + schema + reconcile, layout templates + select-and-fill,
  planner, data agent, copy agent, screen composer, wireframe/inventory/UX
  derivation, v16/v17 contract/brand-kit/composition/navigation/density
  modules, blocking model-review repair loop.

## Output contract (reuse + copy-paste)

```
src/components/*.jsx   one file per component — self-contained
                       (imports only react + lucide-react)
src/screens/*.jsx      one file per screen — imports components + shell + DATA
src/lib/shell.jsx      NavAdapter + IconOf (deterministic chrome)
src/data.js            the run's dataset (deterministic expansion)
src/styles.css         the full token sheet (WCAG-validated)
src/App.jsx            tiny screen switcher for local dev
package.json           react + lucide-react + tailwind, fonts listed
README.md              what was built + how to run + file map
manifest.json          per-file API + dependency graph (drives the client's
                       per-file copy buttons and dependency chips)
```

The client export UX reads manifest.json: every file is individually
copyable, and component files carry "copy with dependencies" chips computed
from the dependency closure.

## Model routing (v25 decision: strong model everywhere)

The design tier (Direction) and the synthesis tier (components, screens,
repair) all run on the STRONG default (`openai/gpt-5.6-luna`). The cheap
tier remains only for `clarify` (pre-run Q&A). Rationale: ~10–15 strong
calls cost no more than v24's 43 mixed calls, and components are where the
visible design quality lives. Roles: `direction`, `author` (new),
`repair`, `review` (advisory). Overrides via `PASTEL_MODEL_{ROLE}` as before.

## Failure-mode map

| Failure | v24 behavior | v25 behavior |
|---|---|---|
| Direction JSON invalid | (n/a — many stages) | 1 corrective retry in-call, then deterministic fallback blueprint (single concept from the inspiration manifest) |
| Component authoring fails | repairWithFidelity per component | 1 corrective retry in-call, then the deterministic fidelity fallback |
| Screen authoring fails | composer retry x1, flag | 1 corrective retry in-call, then flag; Wave 3 repair may re-author via repair call |
| Broken JSX | sandbox smoke fails → repair round | esbuild + smoke fail → Wave 3 repair call with error + screenshot → re-verify |
| Overflow at 375px | geometry gate → repair round | same, but repair sees the SCREENSHOT (strong models fix overflow instantly when shown the render) |
| Missing rows / sparse screen | schema floor the composer ignored | 6–8 rows generated up front; sparse render surfaces as advisory + repair input |
| Concept convergence (same-y runs) | (undetected) | divergence axes + deterministic sibling-similarity veto + uniqueness fingerprint recorded per run |
| Review model unhappy | blocking → 118s re-review tail | advisory only — never blocks, never repairs |

## Cost + latency budget

- Model calls: 1 (direction) + components (≤12) + screens (≤4) + repairs
  (≤3) + 1 (advisory) ≈ 10–21; target ≤18.
- Wall time: direction ~15s; synthesis ≈ slowest author call (~45–60s,
  parallel); verify ~20s (warm pool); polish 0–40s; advisory ~10s.
  Target 80–150s, regression-gated by the e2e harness at ≤180s hard ceiling.
- Cost: fewer calls + no base64 company imagery in author prompts ≈ at or
  below v24 per run.

## Acceptance

The v25 release gate is the e2e harness (`server/tests/maxi-e2e-v25.test.ts`,
`MAXI_E2E=1`): wall ≤180s (target <120s), ≤22 model calls, ≥2 verified
screens, zero hard-gate failures, three distinct briefs → three distinct
uniqueness fingerprints, every file self-contained, advisory score recorded
but non-blocking. The deterministic suite (no model calls — the gateway is
injected and stubbed) covers: blueprint schema + derive (WCAG repair,
divergence veto, manifest lint, fallback), data generation (row floors,
unit/date/currency conformance, determinism), authoring against a stubbed
chat (contract violations retried, fallback convergence), and the full
pipeline end-to-end with esbuild-only verification (smoke/screenshots skip
cleanly when e2b is not configured).

## Validation standard

1. `npx tsc --noEmit` — no agent errors.
2. `npm test` — deterministic suite green (all v25 tests stub the model
   chat; no network, no keys).
3. `MAXI_E2E=1 node --import tsx --test server/tests/maxi-e2e-v25.test.ts`
   — the release gate (real models + e2b).

# Pastel Agent v20 Design

## Purpose

Pastel v20 eliminates the silent-degradation problem that made every run
produce generic template output regardless of model quality. v17-v19 added
explicit product contracts, surface vocabulary, brand coherence, and
model-composed screens, but kept four independent fallback paths that
silently substituted generic output whenever the custom pipeline failed.

v20 removes every silent fallback. The model screen composer is the **only**
layout path. The builder produces **every** component — base JSX files are
reference templates only, never shipped verbatim. Pipeline stages are merged
to eliminate redundant JSON-schema handoffs. Post-generation linting catches
anti-slop violations before they reach the sandbox. On failure, the
orchestrator retries with improved context before hard-failing — no silent
degradation.

The quality target is unchanged from v16: every screen should look like a
senior product designer built it. v20 ensures that a run either meets that
bar or fails outright — it never degrades to generic SaaS template output.

## Problem: Four Silent Fallbacks

The sameness reported in test5, test7, and agent-v6 is caused by four
independent fallback mechanisms that cascade:

| Failover | Trigger | What Happens | Impact |
|---|---|---|---|
| Wireframe fallback | JSON validation fail | `fallbackWireframe()` returns hardcoded block recipes | Every run gets the same screen structure |
| Builder materialization | Custom component not built | `composeScreens()` loads raw `base-components/*.jsx` verbatim | Topbar/Sidebar identical across runs |
| Copy fallback | Schema validation fail | `fallbackCopy()` returns "Get started"/"Learn more" | Brand voice replaced with scaffolding |
| Composer fallback | Screen composer model fails | Recipe path builds `blockAppTopbar()`/`blockSidebar()` | Same skeleton regardless of product |

When any one fires, the output degrades. When 3-4 fire together (which happens
frequently), the output is 100% generic template — regardless of model quality.

## Non-Negotiable Principles

1. Product mode decides structure. (unchanged)
2. Company knowledge decides visual language. (unchanged)
3. The data contract decides what content exists. (unchanged)
4. Screen intent decides what can be rendered. (unchanged)
5. The model screen composer is the **only** layout path — no recipe fallback. **(new)**
6. Every component is builder-produced — base files are reference only. **(new)**
7. Any stage failure retries with improved context, then hard-fails. **(new)**
8. Runs below quality floor are rejected, not silently degraded. **(new)**
9. Every generated screen must pass sandbox, geometry, accessibility, and
   visual review gates. (unchanged)

## Pipeline

```text
discovery
  -> design system
  -> brief + reference selection
  -> data + copy (merged — single model call, no handoff failure)
  -> wireframe + UX + copy (merged — wireframe-dependent stages in one phase)
  -> parallel component planning/building
  -> model screen composer (ONLY path — retry on failure, hard-fail after 2)
  -> post-generation lint pass (auto-fix radius/height/color violations)
  -> sandbox + screenshots
  -> quality floor gate (reject if < 4 custom components or < 2 screens)
  -> present
  -> static/visual review
  -> bounded repair
```

### V20 Pipeline vs V16-V19

| Stage | V16-V19 | V20 |
|---|---|---|
| Content + Copy | Two stages (independent JSON handoffs) | One stage merged into data |
| Wireframe + UX | Two stages | One stage merged |
| Assembly | Recipe fallback + model try | Model composer only, retry on fail |
| Base components | Shipped verbatim on failure | Builder reference only, never shipped |
| Quality floor | None — run could "succeed" at 20/100 | Hard-fail below threshold |

## Stage Contracts

### Data + Copy (Merged)

The copy agent now runs immediately after the data agent produces content,
before the builder stage. This eliminates the historical issue where
copy-plans failed schema validation silently and the entire screen's copy
reverted to template scaffolding.

Input: product brief, wireframe, design tokens, data
Output: MockDataset + CopyPlan (deterministic fallback for both)

Cost: one MID model call for data + one CHEAP model call for copy

### Wireframe + UX + Copy (Merged)

The wireframe produces the block plan and component inventory. The UX agent
refines layouts, surfaces, and interaction flow. The copy agent writes the
copy plan. All three run within the same pipeline phase to eliminate
sequential JSON-handoff failures.

Input: product brief, design tokens, data, visual reference
Output: WireframePlan, ComponentInventory, UxDesignPlan, CopyPlan

### Model Screen Composer (Only Path)

The screen composer model (`runScreenComposer`) writes each screen's layout
body with full creative control — no recipe backup exists. The system prompt
includes:

- A **self-critique** instruction: the model must list 3 ways this screen
  could become generic, then explicitly avoid them
- Product-specific anti-patterns derived from the brief mode
- Anti-slop design law
- Full component specs with declared props
- Company design language and megadesign reference

On failure:
1. **Retry 1**: Re-run with a more directive prompt listing exact blocks
   and the previous failure reason
2. **Retry 2**: Re-run with the validation error + expected schema shape
3. **Hard-fail**: Return `failedScreens` — the orchestrator fails the run

### Quality Floor Gate

Before screens are presented to the user, a deterministic floor check runs:

- Minimum 4 custom components produced by the builder
- Minimum 2 screens pass sandbox verification

Failure means the run is rejected with a clear error message. This prevents
the "20/100 gate score but user still receives output" problem from v16-v19.

### Post-Generation Lint Pass

After composition and before sandbox verification, `checks/lint.ts` scans
every generated JSX file for anti-slop violations:

| Check | Auto-fix? |
|---|---|
| Hardcoded hex colors (`#xxx`) | No — flags as high severity |
| Raw Tailwind radius (`rounded-xl`) | Yes — replaces with `var(--radius-*)` |
| Raw Tailwind heights (`h-10`) | Yes — replaces with `var(--control-*)` |
| Blue/purple/indigo color classes | No — flags as medium severity |
| Gradient utilities | No — flags as high severity |
| Floating blob/dot decorations | No — flags as high severity |
| AI-slop copy phrases | No — flags as medium severity |

Auto-fixed files are written back to `generatedFiles` before sandbox
verification, so the sandbox tests the cleaned code.

## Files Changed

### `compose.ts` — Complete Rewrite

**Removed** (1100+ lines):
- All block recipe functions: `blockHero`, `blockStats`, `blockChart`,
  `blockTable`, `blockDetail`, `blockForm`, `blockList`, `blockMedia`,
  `blockSearch`, `blockPricing`, `blockCta`, `blockFooter`, `blockCustom`
- `blockAppTopbar`, `blockSidebar`, `blockTabbar`, `blockMarketingHeader`
- `BLOCK_DEFS` registry
- `composeScreen` (recipe-based)
- `composeScreens` (base-component materialization)
- `composeAll` (old non-model path)

**Added**:
- `composeScreenV20` — renders model-composed body in a shell with **built**
  Topbar/Sidebar components (never the generic base files)
- `composeAllV20` — async, model-only composition with `failedScreens` return
- `composeAll` — synchronous wrapper for tests (data.js + shell.jsx only)

**Preserved**:
- `composeDataFile` — deterministic data.js generation
- `composeShell` — shared shell with nav, icons, tone map
- `composeScreenFromBody` → renamed to `composeScreenV20`
- `generateCompositionSummary` — fed to builder for context

### `orchestrator.ts` — Pipeline Restructured

- Merged DATA+COPY: copy runs in the wireframe phase, not assembly
- Merged WIREFRAME+UX: UX runs directly after wireframe
- Retry loop: up to 2 retries for failed composer screens
- Quality floor: hard-fail if < 4 custom components or < 2 verified screens
- Lint pass: runs after composition, auto-fixes reach sandbox
- Tracked `composerRetries` per screen in run state

### `agents/screen-composer.ts` — Hard-Fail, No Fallback

- Removed `fallbackBody()` function entirely
- Added self-critique step: "list 3 ways this screen could become generic"
- On failure: returns error description, never substitutes recipe skeleton
- Enhanced system prompt with product-specific anti-pattern guidance

### `checks/lint.ts` — New File

Scans generated JSX files for anti-slop violations. Runs after composition,
before sandbox verification. Auto-fixes unambiguous violations (radius,
heights). Flags the rest as gate issues.

### `base-components/index.ts` — Updated Documentation

Explicitly marks base component files as **BUILDER REFERENCE ONLY**.
Removes the implicit contract that allowed them to be shipped verbatim
when the builder failed.

## Failure Mode Map (V20 vs V19)

| Failure | V19 Behavior | V20 Behavior |
|---|---|---|
| Wireframe model fails | `fallbackWireframe()` — hardcoded block plan | Retry x1, then hard-fail if still invalid |
| Builder fails on component | `baseComponentCode()` — ships generic BaseComp.jsx | Retry builder x2 with targeted prompts, then hard-fail |
| Copy model fails schema | `fallbackCopy()` — "Get started"/"Learn more" | `salvageCopyPlan` salvages model output; retry x1 if nothing salvageable |
| Screen composer fails | Recipe fallback — generic skeleton | Retry x2 with directive context, then hard-fail |
| Every screen fails sandbox | Gate catches it at review (score ~20) | Hard-fail in quality floor before present |
| < 4 custom components | Ships with generic primitives | Hard-fail in quality floor before present |
| Hardcoded `rounded-xl` | Survives to gate, flagged as medium | Auto-fixed by lint pass before sandbox |

## Expected Cost

- No additional model calls for successful runs (copy+data stages merged)
- Up to 2 additional composer calls per failed screen (retries)
- Up to 2 additional builder calls per failed component (retries)
- Lint pass is zero-cost (deterministic)

## Completion

The v20 implementation is active in the existing Pastel files. There is no
parallel v20 directory or wrapper. The model composer is the only layout path;
the builder is the only component source; base files are reference-only; and
any degradation below the quality floor is a hard failure rather than silent
substitution.

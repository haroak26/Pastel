# Pastel Agent v16 Design (Complete)

## Purpose

Pastel v16 is the in-place rewrite of the Pastel Agent. It keeps the proven
v6-v11 execution architecture and model economics, but replaces the patched
layout assumptions with explicit product contracts, screen intent, visual
knowledge, and mode-aware composition.

The quality target is a senior Figma product designer: every screen should
have a clear job, a dominant moment, authored hierarchy, meaningful data,
responsive intent, and a visual language that is adapted from the selected
company references rather than copied as a page template.

## Non-Negotiable Principles

1. Product mode decides structure.
2. Company knowledge decides visual language.
3. The data contract decides what content exists.
4. Screen intent decides what can be rendered.
5. The composer may only render validated sections.
6. A model cannot add an unplanned page archetype during assembly.
7. Every generated screen must be useful at 1440px and 375px.
8. Every generated screen must pass sandbox, geometry, accessibility, and
   visual review gates.

## Pipeline

```text
discovery
  -> design system
  -> brief + reference selection
  -> product data
  -> wireframe + component inventory
  -> UX intent
  -> parallel component planning/building
  -> copy
  -> deterministic assembly
  -> sandbox + screenshots
  -> present
  -> static/visual review
  -> bounded repair
```

## Stage Contracts

### Discovery

Input: the user's prompt.

Output:

- Ambiguity questions, maximum four.
- Deterministic company suggestions.
- User-selected primary and secondary reference companies.

Cost: one cheap model call plus zero-cost knowledge scoring.

Discovery does not choose a layout. It only improves product understanding and
reference selection.

### Design System

Input:

- Prompt and clarification answers.
- Primary company reference pack.
- Secondary reference packs.
- Universal design law.

Output:

- Per-run color tokens.
- Type scale and font pairing.
- Radius and control scale.
- Section rhythm and container rules.
- Surface hierarchy.
- Density and responsive intent.
- Media direction.
- A product-specific visual signature.

The company palette is a reference, not an automatic theme copy. WCAG checks
remain deterministic and invalid model output falls back to valid tokens.

### Brief

Output:

- Product identity.
- Primary product mode.
- Primary and secondary jobs.
- Audience and goals.
- Two canonical screen purposes.
- Feature priorities.
- Copy direction.
- Company reference rationale.

The mode is one of:

```text
browse, transact, track, create, operate, learn, social
```

The brief must explain why the mode is correct. A keyword match alone is not
enough.

### Product Data

Data is generated after the brief and is mode-aware.

Examples:

- Track: readiness, sessions, goals, progress, history.
- Create: projects, documents, drafts, collaborators.
- Operate: records, owners, statuses, queues, timelines.
- Learn: lessons, curriculum sequence, progress, exercises.
- Social: posts, authors, replies, reactions.
- Browse: items, categories, filters, comparisons.
- Transact: listings, availability, pricing, booking facts.

The detail view always references one selected object through a typed identity;
positional label/value zipping is not permitted.

### Wireframe

The wireframe agent receives:

- Product brief.
- Product contract.
- Company visual knowledge.
- Universal design law.
- Available component exemplars.

It returns:

- Two screen plans.
- Explicit section types.
- Exactly one dominant block per screen.
- A component inventory where every custom component is mounted.

Wireframe enforcement removes sections not allowed by the product contract.
For example, a track product cannot retain a search toolbar or catalog-card
list merely because the model emitted one.

### UX Intent

The UX stage refines the legal wireframe without inventing sections.

It chooses:

- Layout structure.
- Surface hierarchy.
- Pairing and column relationships.
- Sticky behavior.
- Density.
- Dominant moment.
- Mobile collapse behavior.

It cannot change a dashboard into a catalog or introduce a gallery into a
record detail screen.

### Build

Planner and builder remain parallel and cheap-model stages.

Each component receives:

- Product-specific purpose.
- Screen intent.
- Data fields it may consume.
- Company visual language.
- Token system.
- Responsive requirements.
- Accessibility requirements.

Generated components are never copied blindly from base exemplars. Exemplars
provide reliable React/sandbox patterns; the builder adapts their visual and
content behavior.

### Assemble

Assembly is deterministic. It receives:

- Product contract.
- Screen intent.
- Validated wireframe.
- UX layout.
- Generated components.
- Per-run tokens.
- Per-run data.
- Per-run copy.

The composer is the final structural authority. It does not infer a page shape
from a domain keyword and does not inject a global search/grid/detail recipe.

### Review

Review combines zero-cost gates with Luna static and visual judgment.

The reviewer receives:

- Product contract.
- Screen intent.
- Company visual reference pack.
- Design tokens.
- Data contract.
- Wireframe and component inventory.
- Geometry measurements.
- Rendered screenshots.

Blocking defects include:

- Wrong page archetype.
- Catalog/detail repetition across unrelated prompts.
- Mode vocabulary leakage.
- Duplicate dominant actions.
- Missing product-specific sections.
- Unmounted components.
- Cross-screen data contamination.
- Geometry failures.
- Accessibility failures.
- Generic or placeholder content.

## Company Knowledge

Company folders remain the reusable visual library. v16 expands their machine
contract with optional fields for:

- Suitable product modes.
- Layout moves.
- Interaction moves.
- Media direction.
- Density.

The compiler produces a compact `CompanyReferencePack` containing the manifest,
compiled prompt block, shipped reference-image paths, capability fit, and
selection rationale.

Selection uses:

- Explicit user preference.
- Prompt relevance.
- Product mode compatibility.
- Audience fit.
- Signature/avoid-pattern compatibility.
- Secondary-reference diversity.

The selected company remains visible in run documents and is included in static
and visual review context.

## Layout Families

v16 supports multiple families instead of one universal catalog:

- Dashboard: hero, metrics, progress, activity, record detail.
- Workspace: tools, recent work, inspector, focused configuration.
- Feed: activity stream, author context, thread detail.
- Sequence: curriculum/session progression and continuation.
- Catalog: discovery toolbar, item comparison, item detail.
- Media detail: media-led content with facts and one action.
- Record detail: one record/task/exercise with facts and one action.
- Thread: one social object and replies.

These families are selected by the product contract and visually adapted using
company knowledge.

## Cost and Reliability

v16 retains:

- Two model tiers.
- Per-role environment overrides.
- Gateway retries for transient failures.
- JSON corrective retries.
- Output truncation escalation.
- Per-run credit holds.
- Actual usage charging capped by the hold.
- Parallel build concurrency.
- Incremental verification.
- Maximum repair cycles.

The rewrite should reduce cost by preventing unnecessary component calls for
sections that the product contract has already excluded.

## Test Requirements

The v16 suite must cover:

- Company manifest validation.
- Company-reference selection.
- Product-mode classification.
- Screen-intent legality.
- Component mount integrity.
- Mode-specific data contracts.
- Cross-screen isolation.
- Layout fingerprint diversity.
- Sandbox compilation.
- Geometry at desktop and mobile widths.
- Visual screenshot review context.

The prompt matrix must include tests 5-11 plus unrelated dashboard, workspace,
feed, learning, media, and operations products. Test 11 must be added because
no test 11 fixture exists in the current checkout.

## Completion

The v16 implementation is active in the existing Pastel files. There is no
parallel v16 directory or wrapper. The final review board runs deterministic
contract checks before model review, includes geometry/content/mount evidence,
and routes both gate findings and model findings into targeted repair.

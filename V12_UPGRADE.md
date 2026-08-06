# Pastel Agent v12 — Product-First Coaching Surfaces

v12 keeps the existing two-screen compatibility contract but removes the
assumption that every product is a catalog or marketplace. Visual references
are now first-class per-run inputs, so the same system works for any niche.

## User visual references

- The prompt composer accepts PNG, JPEG, and WebP Figma/Banani screenshots.
- The image is sent with the run and attached to brief, wireframe, UX,
  planner, builder, and visual-review prompts.
- The reference controls composition, hierarchy, spacing, density, surfaces,
  and responsive intent; it does not force the reference product's niche,
  content, branding, or page archetype onto the new product.
- Inspiration-company imagery remains a secondary style cue rather than the
  primary layout authority.

## Product-first workflow

- Brief guidance now describes `home` as the product's primary workflow and
  `detail` as its focused secondary workflow.
- Search, catalog grids, galleries, booking summaries, and marketplace copy are
  optional. They are no longer the default shape of every generated product.
- The deterministic wireframe fallback recognizes fitness/coaching products and
  emits a dashboard path even when the model wireframe call fails.

## Adaptive fitness pack

Fitness data now supports strength coaching by construction:

- readiness and recovery
- working sets and rep ranges
- suggested load and rest
- form cues and adaptive coaching copy
- progression, streaks, and personal-record signals

The existing running vocabulary remains available for older running prompts and
persisted fixtures.

## Coaching dashboard composition

Adaptive trainer runs now receive deterministic sections for:

- a pale tonal session hero with one primary action
- readiness status
- coach insight with useful secondary actions
- exercise sequence rows with swap controls and form cues
- after-workout recovery
- exercise targets and form guidance on the detail screen

These sections render through the composer when model-generated component
planning fails, preventing the previous `0 components` degradation into a
generic Airbnb catalog.

## Validation

The existing regression suite remains green:

```text
44/44 tests passing
```

The v12 path is deterministic and sandbox-safe; a live generation should be
rerun with an adaptive trainer prompt to refresh the screenshot proof.

# Stripe — Design Reference

## Overview

Stripe's design language is **professional, dense, and trustworthy**. It is ink-on-white clarity
with the signature indigo/violet accent and high information density done correctly. For a
fintech/payments/SaaS/admin product "inspired by Stripe," the goal is a UI that feels like a precise,
reliable working tool — every number exact, every status explicit.

**Archetypes:** payments · fintech · SaaS · admin · professional · data-dense

## Brand Personality

- Precise and reliable
- Professional without being stuffy
- Developer-and-business friendly
- Confident through clarity

## Voice & Tone

- Terse, precise, trustworthy.
- Money and numbers are exact: "$1,204.50", "May 12", "net 30".
- Status is explicit: "Succeeded", "Requires action", "Refunded".
- No fluff, no hype — confidence through clarity.

## Visual Language

### Color System

| Token | Light | Usage |
|---|---|---|
| background | `#FFFFFF` | Canvas |
| foreground | `#0A2540` | Ink — navy |
| primary | `#635BFF` | The indigo — actions, data marks |
| secondary | `#F6F9FC` | Subtle fills |
| mutedForeground | `#425466` | Secondary text |
| border | `#E3E8EF` | Hairlines |
| destructive | `#EB5757` | Errors |
| success | `#00C48C` | Succeeded |

Rules:
- Indigo is the single accent — actions, links, active nav, chart series.
- Everything else is navy ink on white with hairline borders.
- Status colors only for real status.

### Typography

- **Display:** Outfit — clean geometric, medium weights.
- **Body:** DM Sans — 14–16px, precise, tight tracking.
- Money always in tabular numerals, right-aligned.

### Spacing, Radius, Elevation, Motion

- Spacing: 8px rhythm, professional density (information-dense but never cramped).
- Radius: sharp-ish — 4–6px fields/buttons, 10px cards.
- Elevation: flat with hairlines. Rare, soft shadows only for floating menus.
- Motion: quick, utilitarian, 150ms.

### Iconography

- Clean functional line icons (1.5–2px). Money, status, and data glyphs prominent.

### Imagery

- Abstract gradient-on-navy brand imagery for marketing; product UIs are clean and literal.

## Component Language

- **Button** — compact; primary indigo-filled, secondary white with navy border.
- **Card** — white, hairline, 10px radius, sectioned headers with hairline dividers.
- **Input** — hairline, 6px radius, tight indigo focus ring, small precise labels.
- **Navigation** — white rail; active item indigo with a 2px indigo left indicator.
- **Table** — dense rows (40–48px), hairline dividers, right-aligned money, status badges.
- **StatCard** — small muted uppercase label, big tabular value, delta chip.
- **Badge** — flat: green Succeeded / amber Pending / red Failed / neutral.
- **EmptyState** — compact, one line, one primary action.

## Signature Patterns

1. **KPI stat row** above dense data tables.
2. **Toolbar + hairline data table** — search, filters, primary action.
3. **Settings** — sectioned cards with forms, two-column on desktop.
4. **Invoice-like detail** — clear line items, right-aligned money, status badges.
5. **Indigo-on-navy dark mode** that stays professional.

## Screen Recipes

See `manifest.screenRecipes`. The recurring thread: KPI rows + dense tables on dashboards,
master-detail customer views, and sectioned settings forms.

## Rules

- Professional density with clear hierarchy; information-rich, never sparse.
- Ink-on-white clarity; indigo accents only for actions and data.
- Precise typography with tabular numerals for money.
- Hairline border language across cards, tables, forms.
- Terse, explicit copy.

## Avoid

- Playful illustration and pill-heavy friendly UI
- Low information density
- Centered marketing heroes on app screens
- Bright saturated color blocks
- Emoji and casual tone in product copy

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company's knowledge folder. The visual review attaches them to judge
screenshots against the real brand — colors, type, spacing, component shapes,
and mood. Add a `preview.png` (wide shot of the brand's signature interface)
and up to three `references/` screenshots when tuning this company's fidelity.

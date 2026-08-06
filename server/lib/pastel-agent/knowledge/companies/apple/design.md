# Apple — Design Reference

## Overview

Apple is the benchmark for clean, minimal, premium product design. The design language
prioritizes **whitespace, typography, and the product itself**. Nothing decorative is added;
every element earns its place. For a new product "inspired by Apple," the goal is a UI that
feels calm, expensive, and effortless — where the content (not the chrome) is the hero.

**Archetypes:** minimal · premium · consumer-tech · product-first · clean

## Brand Personality

- Confident and quiet — never loud or playful
- Precise and considered — everything is intentional
- Premium without arrogance
- Warm minimalism (not cold corporate)

## Voice & Tone

- Short, declarative sentences. "Thinner. Lighter. Faster."
- Calm and factual. No exclamation marks, no hype, no superlatives.
- Name the benefit plainly; let the product speak for itself.
- Numeric precision feels Apple-like: "Up to 30 hours of battery life."

## Visual Language

### Color System

| Token | Light | Usage |
|---|---|---|
| background | `#FFFFFF` | Page canvas — always white/black, never tinted |
| foreground | `#1D1D1F` | Primary ink |
| primary | `#0071E3` | Links, key CTAs, active states (sparingly) |
| secondary | `#F5F5F7` | Soft group fills |
| muted | `#F5F5F7` | Subtle panels |
| mutedForeground | `#6E6E73` | Secondary text |
| border | `#D2D2D7` | Hairline dividers |
| destructive | `#FF3B30` | Errors only |
| success | `#34C759` | Positive states |
| warning | `#FF9500` | Attention states |

Rules:
- The blue primary appears **≤ 4 times per screen** — it's an accent, not a theme.
- Surfaces are white-on-white separated by hairlines. Never stacked colored bands.
- Semantic colors appear only where status is genuinely communicated.

### Typography

- **Display:** Sora — used at large sizes with **light weights (300–500)**, tight tracking.
- **Body:** DM Sans — 17px base, 1.5 line-height, calm readability.
- Headlines can be very large (34–44px) with generous line-height; they are the screen's voice.
- Never bold-italicize; weight goes 300 → 400 → 500 → 600 max.

### Spacing, Radius, Elevation, Motion

- Spacing: 8px rhythm with a bias toward **generous** gaps (24–72px sections).
- Radius: small (6–10px) on inputs, capsule (full) on buttons, 18px on cards.
- Elevation: hairline borders only. **No drop shadows.**
- Motion: slow, gentle, 200ms ease-outs. Nothing bounces.

### Iconography

- Thin (1.5 stroke), 24×24, lucide-style line icons. Rounded caps.

### Imagery

- One product, centered, on a clean background. Photography is soft and luminous.
- Never cluttered collage; never a busy screenshot of the product.

## Component Language

- **Button** — capsule (rounded-full), solid `primary` or hairline-bordered neutral. Medium weight.
- **Card** — white with hairline border, 24–32px padding, radius-lg. Never shadowed.
- **Input** — hairline, radius-md, focus ring in blue. Label above, quiet.
- **Navigation** — quiet links with subtle hover; the active item is blue text on accent/10.
- **Table** — airy: generous row padding, hairline dividers, right-aligned numerics.
- **StatCard** — muted label, huge light value, tiny delta chip.
- **Badge** — muted neutral pill by default; status tones only when real.

## Signature Patterns

1. **Full-width hero** — one product image + a very large light headline + a single primary CTA.
2. **Feature rows** — alternating image/text in a clean 2-column grid, section after section.
3. **Quiet footer** — many columns of tiny links, no logo masthead.

## Screen Recipes

See `manifest.screenRecipes` for exact block sequences per archetype. The recurring thread:
one dominant product moment, restrained type, and white space everywhere.

## Rules

- Whitespace is the design. If a screen feels dense, remove elements.
- One hero moment per page. Everything else recedes.
- Large light display type for headlines; left-aligned, never centered body.
- Blue primary ≤ 4 appearances per screen.
- No gradients, no blobs, no playful illustration, no emoji.

## Avoid

- Colorful gradients and colorful backgrounds
- Bordered card grids of equal cards
- Bold black uppercase headlines
- Crowded density, multiple competing CTAs
- Hype copy, exclamation marks, "revolutionary" claims

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company's knowledge folder. The visual review attaches them to judge
screenshots against the real brand — colors, type, spacing, component shapes,
and mood. Add a `preview.png` (wide shot of the brand's signature interface)
and up to three `references/` screenshots when tuning this company's fidelity.

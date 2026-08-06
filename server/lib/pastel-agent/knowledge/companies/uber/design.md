# Uber — Design Reference

## Overview

Uber's design language is **utilitarian, bold, and built for effortless movement**. It is
map-first, high-contrast (black + green), and famous for the bottom-sheet interaction pattern.
For a mobility/transport/location product "inspired by Uber," the goal is a UI that feels fast,
transactional, and reassuringly clear.

**Archetypes:** mobility · ride-hailing · delivery · map-first · transactional

## Brand Personality

- Utilitarian and confident
- Effortless — the interface gets out of the way
- Reassuring and trustworthy (you always know where your ride is)
- Bold without being flashy

## Voice & Tone

- Terse and functional: "Arriving in 3 min", "$14.20", "PICKUP".
- Time and money are always concrete. Never vague.
- Address the user by destination, not identity. Zero marketing fluff.

## Visual Language

### Color System

| Token | Light | Usage |
|---|---|---|
| background | `#FFFFFF` | Canvas |
| foreground | `#000000` | Ink — pure black |
| primary | `#000000` | Primary CTAs |
| accent | `#06C167` | The ONE green primary action |
| secondary | `#F6F6F6` | Subtle fills |
| mutedForeground | `#545454` | Secondary text |
| destructive | `#DA291C` | Errors |
| success | `#06C167` | Live/confirmed states |

Rules:
- Green is reserved for the **single primary action** per screen. Everything else is black/white/gray.
- High contrast always. Never gray-on-gray.
- Status is always legible: green = live/confirmed, red = failed.

### Typography

- **Display/Body:** Space Grotesk — clean, geometric, contemporary.
- Labels are terse and uppercase where functional ("PICKUP", "ETA").
- Prices and times are large, readable, tabular-nums.

### Spacing, Radius, Elevation, Motion

- Spacing: 8px rhythm, functional density.
- Radius: generous on interactive surfaces (bottom sheets, cards = 14–20px), small on fields.
- Elevation: flat with hairlines. Bottom sheets cast a soft shadow to lift off the map.
- Motion: quick, 150–200ms, nothing decorative.

### Iconography

- Minimal functional line icons, 1.5–2px stroke. Map pins and status glyphs prominent.

### Imagery

- Real locations, maps, vehicles, food photography. Functional, not decorative.

## Component Language

- **Button** — solid black with white label; the green variant is the one primary action.
- **Card** — flat white, hairline border; bottom-sheet cards have rounded top corners.
- **Input** — contained, subtle border; search bars are rounded-full with icon.
- **Navigation** — topbar/tabbar. Terse: status left, profile right.
- **Table** — dense readable rows: destination, fare, ETA, status; right-aligned prices.
- **StatCard** — big bold number, terse label.
- **Badge** — flat pills in black/white/green; status only when meaningful.

## Signature Patterns

1. **Map-first home** — full-bleed map + floating search bar + bottom summary card.
2. **Bottom sheet** — rounded-top card docked at screen bottom with options + one green CTA.
3. **Trip/order cards** — destination, price, ETA, status in one readable row.
4. **Live status timeline** — requested → driver assigned → arriving → picked up.

## Screen Recipes

See `manifest.screenRecipes`. The recurring thread: map hero with a bottom action sheet, activity
lists with trip detail panes, and payment/preferences forms.

## Rules

- High contrast black/white with ONE green primary action.
- Map is the hero for location products; info lives in floating cards and bottom sheets.
- Time and money are always concrete.
- No decorative illustration; icons are minimal and functional.

## Avoid

- Playful colorful illustrations and soft pastels
- Heavy marketing copy
- Gradients and decorative flourish
- Ambiguous pricing or ETA
- Cluttered dense tables without hierarchy

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company's knowledge folder. The visual review attaches them to judge
screenshots against the real brand — colors, type, spacing, component shapes,
and mood. Add a `preview.png` (wide shot of the brand's signature interface)
and up to three `references/` screenshots when tuning this company's fidelity.

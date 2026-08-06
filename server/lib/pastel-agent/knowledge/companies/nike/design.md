# Nike — Design Reference

## Overview

Nike's design language is **bold, athletic, and energizing**. It's high-contrast, uses confident
condensed type, and always shows products and people in motion. For a fitness/training product
"inspired by Nike," the goal is a UI that feels like a scoreboard and a coach at once — measurable,
motivational, and unmistakably energetic.

**Archetypes:** athletic · sport · fitness · training · bold · high-energy

## Brand Personality

- Confident, direct, unapologetic
- Performance-obsessed and measurable
- Motivational without being cheesy
- Youthful and energetic

## Voice & Tone

- Short, punchy sentences. "Just do it."
- Motivational but **concrete**: distance, reps, pace, calories, streaks — numbers prove the point.
- Commands and imperatives ("Push", "Go faster", "Keep the streak") are welcome.
- Never empty hype; never corporate speak.

## Visual Language

### Color System

| Token | Light | Usage |
|---|---|---|
| background | `#FFFFFF` | Canvas |
| foreground | `#111111` | Ink — pure black energy |
| primary | `#111111` | Primary CTAs, bold statements |
| accent | `#EAFF6A` (Volt) | Hero accents, deltas, highlights |
| secondary | `#F4F4F4` | Subtle fills |
| mutedForeground | `#6B6B6B` | Secondary text |
| destructive | `#E5383B` | Errors |
| success | `#00B662` | Streaks / complete |
| warning | `#FF6D00` | At-risk / pace off |

Rules:
- High contrast is the identity. Black on white, volt accents, **no gray mush**.
- One bold accent per screen (volt, orange, or pink) — use it for the hero moment and CTAs.
- Secondary colors appear as small status chips, never large fills.

### Typography

- **Display:** Archivo — **heavy weights (700–900)**, can be uppercase for statements.
- **Body:** DM Sans — 16px, confident readability.
- Headlines are large and condensed-heavy. Giant tabular numbers for metrics feel like a scoreboard.
- Weight goes up, never down: this brand is bold, not airy.

### Spacing, Radius, Elevation, Motion

- Spacing: 8px rhythm, energetic density — content can be tight, but sections breathe.
- Radius: sharp-ish (4–8px) on most surfaces; 12–16px on media cards; full pills on badges.
- Elevation: hairline borders and hard contrast — **no soft shadows**.
- Motion: quick and snappy (120–180ms) with a slight bounce on emphasis moments.

### Iconography

- Bold line icons (2px stroke), 24×24. Playful fills only for achievements/medals.

### Imagery

- People in motion, products angled dynamically, full-bleed hero images.
- High-energy photography with strong contrast; never flat product-on-white only.

## Component Language

- **Button** — bold and chunky: filled black or accent, heavy-weight uppercase label. Never ghost-gray.
- **Card** — hairline border, media-first (product image), bold name + price.
- **Input** — sharp radius, 1.5px border, bold labels.
- **Navigation** — high-contrast rail; active item inverted (white on accent).
- **Table** — scoreboard numerics: big tabular numbers, right-aligned, accent delta chips.
- **StatCard** — giant value (700 weight), muted unit label, accent delta.
- **Badge** — flat pills in black/white or accent; status tones for streaks/PRs.
- **EmptyState** — a statement ("No runs yet") + one bold start CTA.

## Signature Patterns

1. **Full-bleed athletic hero** — person mid-motion + huge condensed headline + one CTA.
2. **Scoreboard stat row** — giant metrics (km, pace, streak) with accent deltas.
3. **Challenge/streak cards** — progress rings/bars in accent.
4. **Single-word slogans** as section headings ("PUSH", "FASTER").

## Screen Recipes

See `manifest.screenRecipes`. The recurring thread: a tab-bar mobile-first app shell, scoreboard
stats, workout lists with start CTAs, and a bold single-accent color story.

## Rules

- High contrast everywhere; no gray-on-gray low-contrast sections.
- One bold accent color per screen.
- Products and people in motion; images bleed to edges on heroes.
- Buttons are filled and bold, never ghost.
- Stats are giant tabular numbers with unit labels.

## Avoid

- Soft pastels and gentle gradients
- Rounded friendly cutesy cards
- Light-weight thin type
- Low-contrast corporate palettes
- Empty marketing clichés without numbers

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company's knowledge folder. The visual review attaches them to judge
screenshots against the real brand — colors, type, spacing, component shapes,
and mood. Add a `preview.png` (wide shot of the brand's signature interface)
and up to three `references/` screenshots when tuning this company's fidelity.

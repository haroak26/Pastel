# Spotify — Design Reference

## Overview

Spotify's design language is **bold, dark, and immersive**. Dark-first surfaces, the signature
green accent, and media-forward content in rows and carousels. For a music/audio/entertainment
product "inspired by Spotify," the goal is a UI that feels like a dark, comfortable club where the
content is always the star.

**Archetypes:** music · audio · streaming · entertainment · dark · media-forward

## Brand Personality

- Confident and immersive
- Casual and warm
- Content-obsessed — the media is the hero
- Bold but not loud

## Voice & Tone

- Short, confident labels: "Made for you", "Discover weekly".
- Bold section headers, minimal prose.
- Green is the action color; the music does the talking.

## Visual Language

### Color System

| Token | Dark | Usage |
|---|---|---|
| background | `#121212` | Base — near-black |
| foreground | `#FFFFFF` | Text |
| card | `#181818` | Surface |
| primary | `#1DB954` | The green — play, primary actions |
| secondary | `#242424` | Elevated surfaces |
| mutedForeground | `#B3B3B3` | Secondary text |
| destructive | `#F15E6C` | Errors |
| border | `#2E2E2E` | Hairlines |

Rules:
- Dark-first is the identity. Light themes are the exception, never the default.
- Green appears surgically: play buttons, active states, one primary action per screen.
- Never use a second bright accent — green is it.

### Typography

- **Display/Body:** Manrope — clean, geometric, and available in heavy weights.
- Section titles are bold (600–800). Metadata is small and muted.
- Type stays crisp on dark: white primary, muted secondary.

### Spacing, Radius, Elevation, Motion

- Spacing: 8px rhythm; media grids are compact (cards close together), sections breathe.
- Radius: 10–14px cards, 18px featured, full pills for buttons.
- Elevation: dark-on-dark separation via subtle raised surfaces; hover lifts cards slightly.
- Motion: quick hover reveals (play buttons fade in), 150ms transitions.

### Iconography

- Bold, friendly line icons. The play icon is the brand's signature.

### Imagery

- Album artwork, artist photography, podcast covers — square tiles are the primary unit.
- Gradients from artwork colors into dark are welcome (a Spotify signature).

## Component Language

- **Button** — rounded-full pills: green filled for play/primary, border-only for ghost.
- **Card** — dark surface, radius-lg; media cards are square artwork tiles with a hover play button.
- **Input** — rounded-full dark field, subtle border, prominent search.
- **Navigation** — left sidebar library rail + topbar; active highlighted on muted.
- **Table** — track-list style: index/artwork, bold name, muted artist, duration, right actions.
- **StatCard** — bold value, muted label, used sparingly.
- **Badge** — green pill for premium/active; muted neutral otherwise.
- **EmptyState** — "Nothing here yet" + a green CTA.

## Signature Patterns

1. **Left sidebar + content rows** — playlists nav, then horizontal carousel rows in the main pane.
2. **Carousel rows** — "Made For You", "Recently Played"; each tile a square artwork card.
3. **Now-playing bar** — artwork + track + playback controls docked at the bottom.
4. **Giant green circular play button** on featured/hero content.
5. **Dark hero with artwork-color gradient** washing into the dark background.

## Screen Recipes

See `manifest.screenRecipes`. The recurring thread: dark home with carousel rows, playlist detail
with a hero band + track list, and clean settings forms.

## Rules

- Dark-first surfaces; green is the single brand accent.
- Media tiles are the unit of content — square artwork cards in labeled rows.
- Bold typography, clean sans, generous dark breathing room.
- Play is always one obvious action.

## Avoid

- Light-first busy layouts
- Coral/red accents or multiple bright colors
- Bordered gray card grids (that's SaaS, not media)
- Tiny thin type
- Centered everything with no hierarchy
- Multiple competing CTAs on one screen

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company's knowledge folder. The visual review attaches them to judge
screenshots against the real brand — colors, type, spacing, component shapes,
and mood. Add a `preview.png` (wide shot of the brand's signature interface)
and up to three `references/` screenshots when tuning this company's fidelity.

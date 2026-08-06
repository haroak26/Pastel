# Netflix — Design Reference

## Overview

Netflix's design language is **cinematic, immersive, and bold**. Dark-first surfaces, the signature
red, carousel rows of content, and drama at every scale. For a movie/video/streaming product
"inspired by Netflix," the goal is a UI that feels like a dark theater where the artwork and the
scale do the talking.

**Archetypes:** streaming · movie · video · entertainment · cinematic · dark

## Brand Personality

- Cinematic and confident
- Immersive — the interface recedes into the dark
- Bold and dramatic
- Content-obsessed

## Voice & Tone

- Titles are the voice: "Trending Now", "Only on Netflix".
- Short, bold, suggestive. Let the artwork and scale speak.
- The red is the action; the darkness is the mood.

## Visual Language

### Color System

| Token | Dark | Usage |
|---|---|---|
| background | `#141414` | Base — near-black |
| foreground | `#F5F5F5` | Text |
| card | `#1F1F1F` | Surface |
| primary | `#E50914` | The red — Play, primary actions |
| secondary | `#2A2A2A` | Elevated surfaces |
| mutedForeground | `#8C8C8C` | Secondary text |
| destructive | `#E50914` | Errors |
| border | `#333333` | Hairlines |

Rules:
- The red is reserved for logo, primary CTAs, and rare active states. Never paint whole sections red.
- Dark-first always. Drama comes from scale, not color.

### Typography

- **Display:** Archivo — heavy weights, tight tracking, cinematic titles.
- **Body:** DM Sans — clean and readable.
- Hero titles are massive (40px+); section titles are bold white.

### Spacing, Radius, Elevation, Motion

- Spacing: 8px rhythm; carousels are tight rows, sections breathe.
- Radius: small (2–8px). Netflix is sharp and cinematic, not rounded-friendly.
- Elevation: darkness and scale, not borders. Poster tiles have hover scale.
- Motion: 150ms hovers; poster tiles scale slightly and reveal info.

### Iconography

- Bold, minimal line icons. The red play glyph is iconic.

### Imagery

- 2:3 poster artwork tiles and 16:9 backdrops are the content units.
- Hero backdrops carry a dark gradient for text legibility.

## Component Language

- **Button** — red filled for primary; dark secondary with white border. Bold label.
- **Card** — dark poster tiles (2:3), hover scale + info overlay, no borders.
- **Input** — dark on dark, minimal; search is large and prominent.
- **Navigation** — dark topbar, logo left, nav + profile right.
- **Table** — episode lists: number, thumbnail, title, duration, play on hover.
- **Badge** — flat red for Top 10/new; neutral on dark for metadata.
- **EmptyState** — "Start watching" + a red Play CTA.

## Signature Patterns

1. **Full-bleed hero** — backdrop + dark gradient + huge title + Play/More Info.
2. **Carousel rows** — "Trending Now", "Top 10", "New Releases": horizontal strips of poster tiles.
3. **Continue Watching** — artwork tiles with thin red progress bars.
4. **Profile select** — large avatar tiles to choose who's watching.

## Screen Recipes

See `manifest.screenRecipes`. The recurring thread: dark home with carousel rows, a full-bleed
detail hero with synopsis + episodes + "More Like This", and dark profile/settings forms.

## Rules

- Dark-first surfaces; red reserved for action.
- Carousel rows of poster tiles are the primary content pattern.
- Hero titles are massive; bold cinematic type.
- Hover reveals info on tiles; progress bars are thin and red.

## Avoid

- Light-first layouts
- Blue accents or any second bright color
- Rounded friendly cutesy cards
- Gradient color washes outside hero backdrops
- Busy colorful grids and small timid type

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company's knowledge folder. The visual review attaches them to judge
screenshots against the real brand — colors, type, spacing, component shapes,
and mood. Add a `preview.png` (wide shot of the brand's signature interface)
and up to three `references/` screenshots when tuning this company's fidelity.

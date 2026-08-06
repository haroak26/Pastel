# Notion — Design Reference

## Overview

Notion's design language is **calm, editorial, and focused**. It is warm monochrome with clean
typography, generous whitespace, and quiet, flexible structure. For a productivity/docs/workspace
product "inspired by Notion," the goal is a UI that feels like a calm, blank page where the content
— not the chrome — leads.

**Archetypes:** productivity · notes · docs · workspace · editorial · minimal

## Brand Personality

- Calm and focused
- Flexible and unopinionated (you make it yours)
- Editorial — content is the interface
- Quietly confident

## Voice & Tone

- Plain-spoken, calm, useful.
- Direct and unpretentious. The interface disappears.
- Invite action quietly: "New page", "Add a comment", "Start writing".
- No marketing tone inside the product.

## Visual Language

### Color System

| Token | Light | Usage |
|---|---|---|
| background | `#FFFFFF` | Paper |
| foreground | `#37352F` | Ink |
| card | `#FFFFFF` | Paper surfaces |
| primary | `#37352F` | Ink actions |
| accent | `#2383E2` | Blue — links, active states |
| secondary | `#F7F6F3` | Muted fills |
| mutedForeground | `#6E6B66` | Secondary text |
| border | `#E9E9E7` | Hairlines |

Rules:
- Warm monochrome first. One restrained blue accent for interactive highlights.
- Ink-on-paper; nothing shouts. Structure via hairlines, not color blocks.

### Typography

- **Display/Body:** Figtree — clean, readable, unpretentious.
- Comfortable leading, generous margins. Text-heavy screens are normal.
- Headings are bold but not huge; the title is the anchor.

### Spacing, Radius, Elevation, Motion

- Spacing: 8px rhythm, generous paper-like whitespace.
- Radius: tiny (2–8px). Notion is nearly squared.
- Elevation: hairline borders and hover reveals. No drop shadows.
- Motion: subtle 150ms fades; controls appear on hover.

### Iconography

- Simple, thin line icons. Minimal decoration.

### Imagery

- Documents, screenshots, and calm photography. Never loud.

## Component Language

- **Button** — quiet: white/muted with ink text; primary uses ink fill rarely.
- **Card** — paper-like, hairline border, tiny radius, generous padding.
- **Input** — bare, ink-on-paper, light border on focus.
- **Navigation** — left page-tree sidebar + minimal topbar with breadcrumbs.
- **Table** — database style: clean rows, muted metadata, inline edit on hover.
- **StatCard** — quiet, used sparingly.
- **Badge** — neutral text pill; color only for real status.
- **EmptyState** — "+ New page" style invitation.

## Signature Patterns

1. **Left sidebar + long calm document** — pages nav tree, main pane is the content.
2. **Document pages** — big title, breadcrumb, blocks, toggles, quiet metadata.
3. **Database views** — table/list/board with inline edit affordances.
4. **Empty states that invite creation** — "+ New page".
5. **Hairline-divided workspaces** with generous whitespace.

## Screen Recipes

See `manifest.screenRecipes`. The recurring thread: workspace home with recent pages + database
views, document pages as the core unit, and quiet settings forms.

## Rules

- Calm monochrome with one restrained blue accent.
- Editorial typography and generous whitespace; content is the interface.
- Quiet structure — hairlines, collapsibles, hover reveals.
- Paper-like surfaces with minimal borders.

## Avoid

- Loud gradients and saturated color blocks
- Dense card grids
- Overwrought buttons and playful illustrations
- Centered marketing type inside the product
- Cramped density

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company's knowledge folder. The visual review attaches them to judge
screenshots against the real brand — colors, type, spacing, component shapes,
and mood. Add a `preview.png` (wide shot of the brand's signature interface)
and up to three `references/` screenshots when tuning this company's fidelity.

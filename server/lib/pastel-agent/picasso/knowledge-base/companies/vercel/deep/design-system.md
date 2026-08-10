# Vercel — Design System

## Color Tokens

### Neutral Palette (Dark Mode — Primary)

| Token | Value | Usage |
|-------|-------|-------|
| bg-base | `#0A0A0A` | Page background, deepest level |
| bg-surface | `#111111` | Sidebar, secondary surfaces |
| bg-raised | `#1A1A1A` | Cards, elevated containers |
| bg-hover | `#222222` | Hover states on cards, rows, list items |
| bg-active | `#2A2A2A` | Active/pressed states, selected items |
| bg-input | `#1A1A1A` | Input fields, selects, textareas |
| bg-code | `#0A0A0A` | Code blocks, terminal backgrounds |
| text-primary | `#FFFFFF` | Headings, primary text |
| text-body | `#EDEDED` | Body text, labels |
| text-secondary | `#888888` | Captions, metadata, secondary labels |
| text-tertiary | `#666666` | Disabled text, placeholder |
| border-primary | `rgba(255,255,255,0.08)` | Card borders, section dividers |
| border-secondary | `rgba(255,255,255,0.05)` | Subtle dividers, input borders |
| border-focus | `#FFFFFF` | Focus rings (white, 1-2px) |

### Neutral Palette (Light Mode — Derived)

| Token | Value | Usage |
|-------|-------|-------|
| bg-base | `#FFFFFF` | Page background |
| bg-surface | `#FAFAFA` | Sidebar, secondary surfaces |
| bg-raised | `#F5F5F5` | Cards |
| bg-hover | `#EBEBEB` | Hover states |
| text-primary | `#0A0A0A` | Headings |
| text-body | `#333333` | Body text |
| text-secondary | `#666666` | Captions |
| border-primary | `rgba(0,0,0,0.08)` | Card borders |

### Accent

| Token | Value | Usage |
|-------|-------|-------|
| accent-primary | `#FFFFFF` (dark mode) / `#0A0A0A` (light mode) | Primary CTAs, active states |
| accent-highlight | Brand purple/pink (e.g., `#FF0080`) | Links, focus rings, selected states, brand moments |
| accent-focus | `#FFFFFF` (dark) / `#0A0A0A` (light) | Focus ring (high contrast) |

Accent usage rule: accent-highlight appears on exactly 3-5 elements per screen maximum. Everything else is neutral.

### Semantic

| Token | Value | Usage |
|-------|-------|-------|
| success | Muted green (`#0F9D58` at 70% saturation) | Ready, deployed, active |
| warning | Muted amber (`#F4B400` at 70% saturation) | Building, in progress, pending |
| error | Muted red (`#DB4437` at 70% saturation) | Failed, error, canceled |
| info | Muted blue (`#2684FF` at 70% saturation) | Informational badges |

Semantic colors appear as small filled circles (8px) next to labels, or as very subtle 10% background tints on status badges. Never at full saturation. Never as large color blocks.

## Typography

### Typefaces

- **UI:** Geist (sans-serif) — Vercel's custom typeface
- **Code:** Geist Mono (monospace) — companion mono typeface
- **Fallbacks:** Inter, system-ui, -apple-system

### Type Scale

| Token | Size | Weight | Line-height | Letter-spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| heading-xl | 24px | 600 | 1.3 | -0.03em | Page titles, hero headings |
| heading-lg | 20px | 600 | 1.3 | -0.02em | Section headings |
| heading-md | 16px | 600 | 1.3 | -0.01em | Card titles, subsection headings |
| body-lg | 16px | 400 | 1.5 | 0 | Large body, descriptions |
| body | 14px | 400 | 1.4 | 0 | Body text, labels, menu items |
| body-sm | 13px | 400 | 1.4 | 0 | Compact body, table cells |
| caption | 12px | 400 | 1.3 | 0 | Captions, metadata, timestamps |
| code | 13px | 400 | 1.5 | 0 | Code blocks, inline code |
| code-sm | 12px | 400 | 1.4 | 0 | Inline code in dense contexts |
| kbd | 11px | 500 | 1 | 0 | Keyboard shortcut badges |

### Weight Usage
- **400** (Regular): Body text, labels, metadata, code
- **500** (Medium): Button text, emphasis, nav items
- **600** (Semibold): Headings, card titles, section headers

Weight 700+ used only in rare brand hero moments. Never in functional UI.

### Tabular Numbers
All data tables, metrics displays, and numeric columns use tabular figures (`.tabular-nums`). Each digit occupies equal width for clean vertical scanning.

## Spacing System

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Icon-to-text, tight inline, kbd internals |
| space-2 | 8px | Input padding, compact grouping, label-to-input |
| space-3 | 12px | Component internal padding |
| space-4 | 16px | Card padding, list item spacing, grid gaps |
| space-5 | 24px | Page gutters, section internal gaps |
| space-6 | 32px | Section margins (compact) |
| space-7 | 48px | Section margins (standard) |
| space-8 | 64px | Section margins (generous), hero padding |

### Layout Rules
- Page content max-width: 1200px (centered, with 24px gutters on each side at smaller viewports)
- Dashboard cards: 3-4 column grid at 16px gap
- Sidebar: 220-240px, dark background (`#111111`), with 1px right border
- Top nav: 48px height, background matches sidebar
- Data table row height: 32-36px
- Form width: 400-480px max for dedicated form views, full-width for inline
- Use a 4px baseline grid implicitly

## Corner Radius

Vercel uses small, controlled radii. The design language is architectural, not soft.

| Element | Radius | Notes |
|---------|--------|-------|
| Buttons | 4px | All buttons, CTAs |
| Inputs, selects, textareas | 4px | Form elements |
| Cards | 6px | Dashboard cards, panels |
| Modals | 8px | Dialogs, overlays |
| Tags/badges | 4px | Status badges, framework tags |
| Kbd badges | 4px | Keyboard shortcut hints |
| Code blocks | 6px | Code display areas |
| Tooltips | 4px | Compact floating info |
| Status dots | 100% (circle) | Small 8px indicators |
| Avatars | 100% (circle) | User/organization avatars |

No pill shapes. No rounded-full containers except status dots and avatars. Nothing exceeds 8px radius. The default radius for a new element should be 4px unless it specifically fits a larger category.

## Elevation & Shadows

Minimal shadows, maximum restraint. Elevation is communicated primarily through borders and subtle background-color layering.

| Level | Shadow (Dark) | Shadow (Light) | Usage |
|-------|---------------|----------------|-------|
| 0 | none | none | Base surface |
| 1 | `0 1px 2px rgba(0,0,0,0.30)` | `0 1px 2px rgba(0,0,0,0.06)` | Cards (subtle) |
| 2 | `0 2px 4px rgba(0,0,0,0.40)` | `0 2px 4px rgba(0,0,0,0.08)` | Dropdowns, tooltips |
| 3 | `0 4px 8px rgba(0,0,0,0.50)` | `0 4px 8px rgba(0,0,0,0.12)` | Modals |

Borders are the primary depth cue:
- Cards: 1px `border-primary` (semi-transparent white at 8%)
- Between sections: subtle border or background shift
- Inputs: 1px `border-secondary`

Shadows never spread wide, never use saturated color, never feel "glowy." Overlays and modals use a semi-transparent backdrop (`rgba(0,0,0,0.60)`) without blur. Z-index hierarchy is flat — two or three levels maximum.

## Surface Treatments

- **Page background:** Deep near-black (`#0A0A0A`), no texture, no gradient
- **Sidebar:** Slightly raised (`#111111`), separated by 1px right border, compact navigation items
- **Cards:** `#1A1A1A` background, 1px border (`rgba(255,255,255,0.08)`), 6px radius, tight 16px padding
- **Code blocks / Terminal:** `#0A0A0A` background (darker than cards), 1px border, 6px radius, monospace, colored log levels
- **Inputs:** `#1A1A1A` background, 1px border, 4px radius, white text, focus ring in white/highlight
- **Table rows:** Alternating backgrounds at 2% brightness difference (zebra striping), no cell borders
- **Modals:** `#1A1A1A` background, 1px border, 8px radius, semi-transparent backdrop

## Component Patterns

### Navigation
- **Sidebar:** Darkest surface (`#111111`). Logo/workspace at top, nav items (5-7 max) with icons + labels. Active item: subtle background highlight (`#222222`) + left-edge accent border (2px, white or highlight). Collapsible sections with disclosure triangles.
- **Top bar:** 48px height, matches sidebar background. Contains search/command palette trigger, notification bell, user avatar. Lightweight.
- **Command palette (`CMD+K`):** Dark overlay panel, search input at top (monospace placeholder), categorized results below, keyboard shortcut hints as small kbd badges.

### Dashboard Cards
- Grid: 3-4 columns, 16px gap, responsive
- Structure: Preview image (full-bleed, rounded top corners 6px, 16:9 aspect ratio), card body below with project name (16px semibold), deployment status indicator (8px circle + label), last deployed timestamp (12px caption)
- Hover: Subtle background lighten, border slightly more visible
- Click: Navigates to project overview

### Data Display
- **Tables:** Compact rows (32-36px), right-aligned numbers (tabular figures), monospace for IDs/codes/commit hashes, zebra striping at 2% brightness difference, sortable column headers
- **Metrics cards:** Large number (24-32px semibold), label below (12px caption), optional trend indicator (small green/red arrow + percentage)
- **Status indicators:** 8px filled circles — green (ready/deployed), amber (building/in progress), red (failed/error), gray (canceled/disabled)
- **Build logs:** Terminal-style: dark background, monospace font, timestamp prefix in secondary, colored log levels, auto-scroll to bottom

### Forms
- **Layout:** Single-column, max-width 480px for dedicated form pages
- **Labels:** Above inputs, 13px medium, 8px gap to input
- **Inputs:** 36px height, 4px radius, 1px border, 8-12px horizontal padding, white text on `#1A1A1A`
- **Focus:** White or highlight ring (1-2px), clean and sharp
- **Selects:** Same styling as inputs, custom dropdown (not native)
- **Toggle switches:** 20px wide, 12px tall, white accent when on, gray when off
- **Buttons:** Primary (white bg, black text in dark mode; black bg, white text in light mode), Secondary (transparent bg, 1px border), Ghost (no border, hover highlight). 4px radius, 8px 16px padding, 14px medium text.

## Motion

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Hover state | 0ms | — | Instant (perceived speed) |
| Focus ring appear | 100ms | ease-out | Quick, barely visible |
| Dropdown open | 150ms | ease-out | Fade + slight slide |
| Modal open | 200ms | ease-out | Fade backdrop, scale content 0.97→1 |
| Page transition | Instant to 150ms | ease-out | Near-instant, no dramatic transitions |
| Loading (skeleton) | N/A | — | Pulsing monochrome bars, 1.5s loop |
| Chart animation | 300ms | ease-out | Simple enter animation for charts |
| Toast/notification | 200ms in, 150ms out | ease-out, ease-in | Slide from top-right |

No spring physics. No bounce. No overshoot. Motion is mechanical, predictable, and fast. Nothing should wait on animation to complete before the user can act. Loading states use skeleton screens (pulsing monochrome bars) rather than spinners. The goal is perceived speed.

## Iconography

- **Source:** Geist Icons (Vercel's custom icon set) or Lucide/Feather as alternatives
- **Style:** Geometric, monoline, 1.5-2px stroke weight
- **Sizes:** 16px (inline, labels), 20px (nav items, buttons), 24px (feature icons)
- **Color:** Inherits text color — monochrome, always stroke-based
- **Filled icons:** Only for micro-indicators (status dot, badge count, checkmark)
- **No multi-color icons in UI chrome**
- **Framework logos:** Small (20px), monochrome or original color, used sparingly in ecosystem contexts

## Imagery

- **Deployment previews:** Live screenshots of deployed applications. Crisp, full-bleed within card, rounded top corners. No overlays, no filters.
- **Framework logos:** Small, clean, used in compatibility grids and template selectors.
- **Background textures:** When used (rarely), subtle grid patterns or geometric noise at very low opacity. Never distracting.
- **Hero visuals:** Geometric brand language — intersecting planes, wireframe globes, layered translucent shapes — rendered in the accent color over black.
- **No stock photography.** No illustrations inside the product. No decorative graphics.

# Stripe — Design System

## Color Tokens

### Neutral Scale (Cool Gray)

Neutrals do the heavy lifting. The scale is cool-toned to pair with the indigo accent.

| Token | Value | Usage |
|-------|-------|-------|
| Neutral 0 | `#FFFFFF` | Page background, card surfaces |
| Neutral 50 | `#F6F9FC` | Band background (alternating sections) |
| Neutral 100 | `#F0F4F8` | Hover states, selected rows |
| Neutral 200 | `#E6EBF1` | Borders, dividers, input strokes |
| Neutral 300 | `#D9E2EC` | Disabled input backgrounds |
| Neutral 400 | `#A0AEC0` | Placeholder text, disabled text |
| Neutral 500 | `#7A828F` | Secondary text, captions, metadata |
| Neutral 600 | `#5A6577` | Body text (muted) |
| Neutral 700 | `#425466` | Body text (default) |
| Neutral 800 | `#2D3748` | Subheadings |
| Neutral 900 | `#0A2540` | Headings, dark surfaces (topbar) |

### Accent Scale (Indigo/Blue)

| Token | Value | Usage |
|-------|-------|-------|
| Accent 400 | `#8A8FFF` | Accent on dark backgrounds |
| Accent 500 | `#635BFF` | **Primary accent** — buttons, links, focus rings |
| Accent 600 | `#4F46E5` | Hover/active states on accent |
| Accent 700 | `#3B33D1` | Active/pressed states |

### Semantic Colors

Muted, not bright. These signal state without alarming.

| Token | Value | Usage |
|-------|-------|-------|
| Success | `#09825D` | Confirmation, success badges, positive metrics |
| Success BG | `#E6F7ED` | Success banners, green badges |
| Danger | `#CD3D64` | Errors, destructive actions |
| Danger BG | `#FDE8ED` | Error banners |
| Warning | `#D97706` | Warnings, pending states |
| Warning BG | `#FEF3C7` | Warning banners |
| Info | `#3B82F6` | Informational badges (rare) |

### Dark Mode Tints

Dark topbar (`#0A2540`): text is white (`#FFFFFF`), secondary text is `#8898AA`, borders are `#2D3748`, accent is `#8A8FFF` (lighter for contrast on dark).

## Typography Tokens

### Font Families

```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-brand: 'Tiempos Text', 'Georgia', serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Menlo', monospace;
```

### Type Scale

| Token | Size | Weight | Line | Usage |
|-------|------|--------|------|-------|
| text-xs | 12px | 400 | 1.4 | Labels, badges, tabular data |
| text-sm | 14px | 400 | 1.4 | Metadata, secondary text, table cells |
| text-base | 16px | 400 | 1.5 | Body text, form inputs |
| text-lg | 18px | 400 | 1.5 | Lead paragraphs |
| text-xl | 20px | 600 | 1.4 | Card headings |
| text-2xl | 24px | 600 | 1.3 | Section headings |
| text-3xl | 32px | 700 | 1.2 | Page headings, hero subheads |
| text-4xl | 40px | 700 | 1.1 | Hero headlines (sans) |
| text-5xl | 48px | 700 | 1.1 | Hero metrics, brand headlines (serif) |

### Typography Rules

- All body text is `Inter`, 16px, weight 400, color Neutral 700
- All headings are `Inter`, weight 600-700, color Neutral 900
- Tabular numbers (`font-variant-numeric: tabular-nums`) on any column of numbers
- Code is `JetBrains Mono`, 14px (inline: 85% size)
- Serif is reserved for brand moments at 40px+ only
- Line-height never exceeds 1.5; clamp at 1.2 for headings

## Spacing Scale

Base unit: 4px. All spacing is multiples of 4.

```
1   = 4px    (inline gaps, icon padding)
2   = 8px    (tight grouping)
3   = 12px   (input internal, compact padding)
4   = 16px   (component padding, related items)
6   = 24px   (card padding, list spacing)
8   = 32px   (section internal)
12  = 48px   (section margin compact)
16  = 64px   (section margin standard)
24  = 96px   (section margin generous, hero block)
```

Usage:
- Component internal padding: 16-24px
- Card padding: 24px all sides
- Between card header and body: 16px
- Between form fields: 24px
- Between sections: 64-96px
- Between related sections: 48px

## Radius

Sharp to crisp. Never soft, never pill-shaped. Never fully rounded.

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 2px | Checkboxes, code blocks, inline elements |
| radius-md | 4px | Buttons, inputs, cards (default) |
| radius-lg | 6px | Modals, panels, large containers |

Rules:
- Buttons: 4px (or sharp for text buttons)
- Inputs: 4px
- Cards: 4px
- Modals: 6px
- Never use `border-radius: 50%` or pill shapes
- Never use radius above 6px on UI elements

## Shadow

Minimal. Only used to indicate elevation on overlapping surfaces.

| Token | Value | Usage |
|-------|-------|-------|
| none | `none` | Cards, sections, buttons, nav (default) |
| sm | `0 1px 3px rgba(0,0,0,0.08)` | Dropdown menus |
| md | `0 4px 12px rgba(0,0,0,0.1)` | Modals, popovers |
| lg | `0 8px 24px rgba(0,0,0,0.12)` | Modal on mobile, large overlays |

Rules:
- **Never use shadows on cards.** Stripe cards are flat rectangles.
- **Never use shadows on buttons.** Buttons are solid color.
- Dropdowns get `shadow-sm` (subtle, just enough to float).
- Modals get `shadow-md` (layer separation from page).
- No decorative shadows. No "elevation" as visual style.

## Surface Treatments

### Bands (Section Backgrounds)

Horizontal stripes alternating between Neutral 0 (white) and Neutral 50 (light gray). This creates page structure without borders or cards. Bands are full-width, edge to edge.

Typical: white → light gray → white → light gray. Band height is content-driven, usually 200-600px.

### Cards

Used sparingly, primarily for data display. Flat background (white), no shadow, no border (or 1px Neutral 200 if needed against a white band). Content + spacing = the card. If a card needs a shadow to "feel like a card," it should not exist.

### Panels

For forms and focused task areas. White background, 1px Neutral 200 border, 24-32px padding. Used for login, signup, settings forms, and configuration screens. The border provides just enough edge definition without decoration.

### Code Blocks

Dark background (`#011627` or `#0A2540`), light text, syntax highlighting, 1px border, 4px radius. Copy button in top-right corner. Generous internal padding (24px).

## Component Patterns

### Buttons

Three tiers, descending visual weight:

| Variant | Background | Text | Border | Radius | Padding |
|---------|------------|------|--------|--------|---------|
| Primary | Accent 500 | White | None | 4px | 12px 24px |
| Secondary | Transparent | Accent 500 | None | 4px | 12px 24px |
| Tertiary | Transparent | Neutral 700 | None | 4px | 8px 16px |

- Primary: exactly one per screen (or one per distinct action group)
- Secondary: for alternative actions (ghost style, no border)
- Tertiary: text-only, for low-priority actions, inline links
- Hover: primary darkens to Accent 600, secondary gets `background: rgba(99,91,255,0.05)`
- Focus: 3px Accent 500 ring, offset 2px from element edge
- Disabled: Neutral 300 background, Neutral 400 text
- Button text: 14-16px, weight 500-600, active verbs

### Inputs

Clean and minimal. Two styles:

**Border-bottom:** for forms embedded in content (product integration feel). Neutral 200 bottom border only, accent on focus.
**Full-border:** for standalone forms (login, signup). Neutral 200 border all sides, slight background tint on focus.

Label: 14px, Neutral 700, above input (not placeholder-only). Placeholder: Neutral 400. Focus ring: accent, same as buttons.

### Tables

Data-first, minimal styling. No zebra striping, no vertical borders. Row dividers: 1px Neutral 200. Headers: 12-13px, Neutral 500, uppercase tracking. Cells: 14px, Neutral 700, with generous padding (12-16px vertical, 16-24px horizontal). Numeric columns: tabular-nums, right-aligned. Hover: Neutral 100 background on row.

### Navigation

**Dashboard sidebar:** Left column (240-280px), dark background (Neutral 900), white/dim text, accent indicator on active item. Compact but readable (14px items, 8px between).

**Marketing topbar:** Full-width, dark (Neutral 900), white links, positioned sticky. Minimal: logo + 5-7 links + CTA. Height: 60-64px. Link hover: subtle opacity change (no underline, no background).

**Secondary nav (tabs):** Underline indicator (Accent 500, 2px thick). Tab text: Neutral 700, active tab: Neutral 900.

## Motion

Fast, functional, no decoration.

- Duration: 120-200ms for all transitions
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (standard material easing, crisp)
- Page transitions: instant (no fade, no slide)
- Dropdown/modal enter: 150ms, slight fade + scale (0.98 → 1)
- Hover transitions: 80-120ms (near-instant color shifts)
- No decorative animations (no floating elements, no parallax, no scroll-triggered reveals)
- Loading states: skeleton screens (pulsing Neutral 100, no spinners unless under 500ms)

## Iconography

Custom Stripe icon set. 24px grid, stroke-width 2, consistent optical weight. Style: geometric, precise, no rounded terminals.

- Navigation icons: 20px, Neutral 500 (active: near-white)
- UI icons (chevrons, close, copy): 16-20px, Neutral 500
- Action icons inside buttons: 16px, inherit text color
- Never use icons as decoration — only when they convey information

## States

Every interactive element must account for:

| State | Behavior |
|-------|----------|
| Default | Resting state |
| Hover | Subtle color shift, 120ms transition |
| Focus | 3px Accent 500 ring, 2px offset from element |
| Active/Pressed | Darkened variant of hover |
| Disabled | Neutral 300 background, Neutral 400 text, no pointer events |
| Loading | Skeleton or subtle pulsing overlay, never blocks interaction unnecessarily |

Focus rings are **mandatory and prominent**. They are a brand signal — Stripe's accessibility is deliberate and visible. Focus rings are the one place accent color is used liberally.

## Dark Mode

Essential to the brand, not an afterthought. Used even on light pages (dark topbar). Key applications:

- **Navigation is always dark** — sidebar in dashboards, topbar in marketing
- **Code blocks are always dark** — regardless of surrounding page mode
- **Dark mode toggle** offered on dashboard, smooth transition (200ms)

Dark mode values: backgrounds `#0A2540` → `#1A1F36`, text white/gray, accent lighter (`#8A8FFF`), borders `#2D3748`.

## Grid

12-column grid, 1080px max-width for marketing, full-width for dashboards. Gutters: 24px. Marketing pages use the grid for section alignment; dashboards use it internally within the content area.

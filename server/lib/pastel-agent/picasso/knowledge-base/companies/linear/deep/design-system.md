# Linear — Design System

## Color Tokens

### Neutral Scale (Slate/Cool Gray — Dark Mode Default)

Dark mode is the base. Light mode values are derivations. The scale is cool to contrast with the warm accent.

| Token | Value (Dark) | Value (Light) | Usage |
|-------|-------------|---------------|-------|
| Neutral 0 | `#0D0F12` | `#FFFFFF` | Root background |
| Neutral 50 | `#16181C` | `#F7F8F9` | Slightly elevated |
| Neutral 100 | `#1C2024` | `#F0F2F4` | Sidebar background |
| Neutral 200 | `#212529` | `#E6E9EC` | Content background |
| Neutral 300 | `#2A2F35` | `#DCE0E5` | Elevated surface (panels) |
| Neutral 400 | `#2E3338` | `#CED3D9` | Borders, dividers |
| Neutral 500 | `#646B74` | `#8F96A0` | Tertiary text, disabled |
| Neutral 600 | `#8F96A0` | `#646B74` | Secondary text, metadata |
| Neutral 700 | `#B4BBC3` | `#4A5259` | Body text |
| Neutral 800 | `#D7DCE1` | `#2D343A` | Subheadings |
| Neutral 900 | `#E6E8EB` | `#1A1F24` | Headings, primary text |

### Accent Scale (Warm Coral/Rose)

| Token | Value | Usage |
|-------|-------|-------|
| Accent 400 | `#E04F37` | Subtle accent moments, small indicators |
| Accent 500 | `#E04F37` | **Primary accent** — buttons, active states, CMD+K highlight |
| Accent 600 | `#C9442F` | Hover on accent buttons |
| Accent 700 | `#AF3A28` | Active/pressed on accent |

The accent is warm — this is intentional and unusual. Most dev tools use blue. Linear uses coral. It stands out and humanizes.

### Semantic Colors (Dark Mode)

| Token | Value (Dark) | Usage |
|-------|-------------|-------|
| Done / Success | `#46A758` | Completed status, success toasts |
| Done BG | `rgba(70,167,88,0.15)` | Done status bar on issues |
| In Progress | `#D9A34A` | Active issues, processing states |
| In Progress BG | `rgba(217,163,74,0.15)` | In-progress bar |
| Urgent / Danger | `#E5484D` | Urgent priority, destructive actions, errors |
| Urgent BG | `rgba(229,72,77,0.15)` | Urgent highlight |
| High Priority | `#D9A34A` | High-priority indicator |
| Medium Priority | `#8F96A0` | Medium priority (neutral) |
| Low Priority | `#646B74` | Low priority (subtle) |

### Priority Color Coding

Priority is the one place Linear allows expressive color:
- **Urgent:** Red (`#E5484D`) — small colored bar on left side of issue row, or small dot
- **High:** Amber/orange (`#D9A34A`) — same treatment
- **Medium:** Neutral gray — same treatment, barely noticeable
- **Low:** Lighter gray — same treatment, intentionally subdued
- **No priority:** No indicator

The priority indicator is a colored 3px left-border on the issue row OR a colored dot next to the issue ID — not a full background badge. Restraint even where color is deployed.

## Typography Tokens

### Font Family

One family, everywhere:

```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

No serif. No monospace except in code blocks. No display faces.

### Type Scale

Compact. Linear uses smaller sizes than most products because density is a feature.

| Token | Size | Weight | Line | Usage |
|-------|------|--------|------|-------|
| text-2xs | 10px | 500 | 1.2 | Keyboard shortcut hints |
| text-xs | 12px | 400 | 1.3 | Metadata, timestamps, captions, table headers |
| text-sm | 13px | 400 | 1.4 | Secondary UI text, sidebar items, filters |
| text-base | 14px | 400 | 1.45 | **Body text (default)**, issue titles, form fields |
| text-lg | 16px | 500 | 1.4 | Card headings, detail panel titles |
| text-xl | 18px | 600 | 1.3 | Page headings, board column headers |
| text-2xl | 20px | 600 | 1.25 | Major section titles |
| text-3xl | 24px | 700 | 1.2 | App-level titles (rare) |

### Typography Rules

- Default body: 14px, weight 400, Neutral 700 (dark mode)
- Issue IDs: 12px, weight 500, Neutral 500, tabular-nums (e.g., `LIN-1234`)
- Timestamps: 12px, weight 400, Neutral 500, tabular-nums
- Keyboard shortcuts: 10px, weight 500, Neutral 500, inside a subtle keycap-style container
- Headings: 16-20px, weight 500-600, Neutral 900
- No uppercase usage except keyboard hints (and even those are lowercase usually)
- Line-height is tight: 1.2-1.45 across the scale

## Spacing Scale

Base unit: 4px. Tighter than Stripe's at the low end.

```
0.5 = 2px   (tight inline gaps, icon-to-text)
1   = 4px   (inline spacing, badge padding)
2   = 8px   (component internal, related grouping)
3   = 12px  (compact padding, list item internal)
4   = 16px  (component padding, sidebar items)
6   = 24px  (panel padding)
8   = 32px  (section internal, detail panel padding)
12  = 48px  (section margins)
```

Usage:
- Issue row height: 36-40px (compact, scannable)
- Issue row internal padding: 8px vertical, 12px horizontal
- Sidebar item spacing: 6-8px between items
- Content area padding: 24px sides, 32px top/bottom
- Between sections in settings: 32px
- Detail panel width: 400-480px

## Radius

Sharp, consistent everywhere.

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 2px | Checkboxes, inline code, tags |
| radius-md | 4px | Buttons, inputs, panels, modals (default) |

Rules:
- Everything is 4px radius unless it's tiny (then 2px)
- Never use `border-radius: 50%` on UI elements (avatars are the exception)
- Never use pill shapes
- Never use radius above 4px
- Consistency of radius is more important than the exact value — pick one and use it everywhere

## Shadow

Minimal. Only for overlapping surfaces. Never for decoration on flat elements.

| Token | Value | Usage |
|-------|-------|-------|
| none | — | Default for all elements |
| sm | `0 1px 3px rgba(0,0,0,0.2)` | Dropdown menus |
| md | `0 4px 12px rgba(0,0,0,0.3)` | Command palette, modals |
| lg | `0 8px 24px rgba(0,0,0,0.4)` | Major modals, detail panel overlay (mobile) |

Rules:
- **No shadows on issue rows, boards, cards, or sections.**
- The CMD+K palette uses shadow-md to float above content.
- Modals use shadow-md or shadow-lg for layer separation.
- In dark mode, shadows feel heavier (higher opacity) because the background is already dark.

## Surface Treatments

### Sidebar (Navigation)

Left sidebar, fixed width 220-260px, darker background than content area (Neutral 100 vs Neutral 200). This creates layered depth without shadows. Sidebar items: compact (8-12px padding), icon + label, active item gets accent text color (not background highlight). Collapsible sections for teams/projects.

### Content Area (Main)

Slightly lighter background than sidebar (Neutral 200). This is where issue lists, boards, and views live. Full remaining width. Scrollable. No border between sidebar and content — the color difference is the separator.

### Issue Rows

The fundamental unit of Linear's UI. Each row: 36-40px height, full-width, 1px Neutral 400 bottom border (divider). Layout (left to right): checkbox → priority color indicator (3px bar or small dot) → issue ID (LIN-1234) → title (14px, Neutral 900) → right-side metadata (assignee avatar 20px, status icon, due date if set). Hover: Neutral 100 background on row (subtle). Selected: accent left-border.

### Detail Panel

Slides in from right (overlay or push). Width: 400-480px. Neutral 300 background (elevated). Contains: issue title (20px), description (rich text 14px), properties sidebar (assignee, status, priority, labels, etc.), activity feed below. Properties displayed as compact label-value pairs.

### Command Palette (CMD+K)

Overlay, centered vertically, 560-640px max-width. Dark background (Neutral 300 or 200), shadow-md. Search input at top (full-width, no border, prominent). Results list below: grouped by category (Recent, Issues, Projects, Actions). Each item: icon + title + shortcut hint. Active item: accent background highlight. Keyboard navigation: arrow keys, Enter to select, Escape to close.

### Modals

For create/edit flows. Centered, 480-560px width, shadow-lg. Neutral 300 background. Compact padding (24px). Title + form fields + action buttons. Escape to close. Click outside to close (configurable).

## Component Patterns

### Buttons

Minimal, functional, two tiers:

| Variant | Background | Text | Radius | Padding | Usage |
|---------|------------|------|--------|---------|-------|
| Primary | Accent 500 | White | 4px | 8px 16px | Primary action (one per screen) |
| Secondary/ghost | Transparent | Neutral 700 | 4px | 8px 16px | Alternative actions |
| Subtle | Transparent | Neutral 600 | 4px | 6px 12px | Inline actions, icon buttons |

- Primary: compact padding, no minimum width beyond content + padding
- All buttons: 13-14px font, weight 500
- Hover: primary darkens (Accent 600), secondary gets transparent background (Neutral 300)
- Focus: 2px accent ring, offset 1px
- Disabled: transparency (opacity 0.4), no pointer events
- Keyboard shortcuts shown next to button text: 10px, Neutral 500, monospace-inside-keycap style

### Inputs (CMD+K Style)

Inputs feel like the command palette — dark background, subtle border, focused on function.

- Default: Neutral 200 background, 1px Neutral 400 border, 4px radius, 14px text
- Focus: accent border (1px), subtle glow (0 0 0 1px accent)
- Placeholder: Neutral 500, 14px
- Label: 12px, Neutral 600, above input
- Compact: 32px height for toolbar inputs, 40px for form inputs

### Issue Row (Detail)

```
[checkbox] [PRIORITY|] LIN-1234  Issue title text here...     [assignee] [status] [date]
```

- Checkbox: 16px, Neutral 400, accent on hover/check
- Priority bar: 3px wide, full row height, colored by priority (red/amber/gray)
- ID: 12px, Neutral 500, monospace-ish
- Title: 14px, Neutral 900 (dark mode), weight 400, truncates with ellipsis
- Assignee: 20px circle avatar, grayscale or user color
- Status: 8px colored circle (green=done, amber=in-progress, gray=todo, no outline)
- Due date: 12px, Neutral 500, tabular-nums

### Lists (Virtualized)

Long lists (100+ issues) are virtualized for performance. Row height is fixed at 36-40px. Keyboard navigation: j/k for up/down, arrow keys within rows. Space to select. Enter to open. Right-click for context menu (native or custom).

### Navigation

**Sidebar:** Teams → Projects → Views hierarchy. Collapsible sections. Active item: accent text color. Icons: 18-20px, Neutral 500 (inherit accent on active). Compact: 8-12px vertical padding per item.

**Topbar (minimal):** Breadcrumb path (e.g., "Engineering / Backend / Active Issues") + view options (filters, sort, display mode) + search input or CMD+K trigger.

**No tabs in main navigation** — sidebar replaces tabs.

## Motion

Fast, crisp, purposeful. Linear feels like a native app because transitions are near-instant.

- Duration: 100-150ms for all transitions
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` or spring-based for detail panel
- Page/view transitions: instant (no crossfade, no slide)
- Detail panel open: 150ms, slides in from right
- Command palette open: 100ms, fade + slight scale (0.97 → 1)
- Dropdown: 80ms, immediate
- Issue reorder drag: realtime, no animation delay
- Loading: skeleton screen with subtle shimmer (Neutral 400 on Neutral 200)

No decorative motion. No page transitions. No scroll animations. Motion exists only to connect states.

## Iconography

Geometric, consistent stroke, 20-24px grid. Linear uses a custom icon set (or heavily customized Phosphor/Heroicons). Style: outline/fill mix, stroke-width 1.5-2, sharp corners, compact.

- Status icons: filled circles (solid color, 8-12px)
- Navigation icons: 18-20px, inherit text color
- Action icons: 16-20px, Neutral 600, inherit accent on hover
- Checkbox: square, 4px radius, outline → filled with check on select

## States

| State | Behavior |
|-------|----------|
| Default | Resting state, minimal visual weight |
| Hover | Subtle background shift (Neutral 300 or Neutral 100 depending on context) |
| Focus | 2px accent ring, offset 1px from element |
| Active | Darkened or filled variation of hover |
| Selected | Accent-colored left-border or background tint |
| Disabled | Opacity 0.4, no interaction |
| Loading | Skeleton shimmer, never blocking spinners |

Focus rings: prominent but not Stripe-level prominent (2px instead of 3px, offset 1px instead of 2px). Still clearly visible.

## Dark Mode (Default)

Linear is designed dark-first. Light mode is a variant, not the default.

Dark mode values are the canonical tokens documented above. Light mode inverts:
- Backgrounds: `#FFFFFF`, `#F7F8F9`, `#F0F2F4`
- Text: `#1A1F24` headings, `#4A5259` body
- Borders: `#E6E9EC`
- Accent: same coral values (brand consistency)
- Semantic: same values, adjusted backgrounds

The light mode preserves the same spacing, radius, and layout. Only color values change.

## Grid

No strict grid. The layout is:
- Sidebar: fixed 220-260px
- Content: remaining width (flex: 1)
- Detail panel: 400-480px, slides over or pushes content

Content area internally uses consistent spacing (24px padding) but no column grid. Lists fill available width. Boards use column layout with 24px gaps between columns.

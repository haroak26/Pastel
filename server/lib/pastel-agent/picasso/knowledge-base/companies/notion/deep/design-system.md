# Notion — Design System

## Color Tokens

### Neutral Palette (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | `#FFFCF7` (warm off-white) | Page canvas, main content area |
| bg-secondary | `#F7F6F3` | Sidebar, secondary panels |
| bg-tertiary | `#F1F1F0` | Toolbar, menus, dropdowns |
| bg-hover | `#EAE9E6` | Hover states on lists, sidebar items |
| text-primary | `#37352F` | Body text, headings |
| text-secondary | `#6B6966` | Captions, metadata, labels |
| text-tertiary | `#9B9996` | Placeholder text, disabled states |
| border-primary | `#E8E7E4` | Dividers, hairline separators |
| border-secondary | `#DEDDDA` | Input borders, card edges |

### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | `#191919` | Page canvas |
| bg-secondary | `#202020` | Sidebar |
| bg-tertiary | `#2A2A2A` | Toolbar, menus |
| text-primary | `#E8E7E4` | Body text |
| text-secondary | `#9B9996` | Captions |
| border-primary | `#333333` | Dividers |

### Accent Palette

A single accent color is used per workspace. Default: `#2383E2` (blue). Users choose from:

- Blue: `#2383E2`
- Pink: `#D44C7E`
- Orange: `#D9730D`
- Yellow: `#DFAB01`
- Green: `#0F7B6C`
- Purple: `#6940A5`
- Gray: `#787774`

Accent appears on: links, buttons (primary only), focus rings, selected states, page property tags. Accent backgrounds are never full-opacity; they are 10-15% opacity tinted backgrounds in callouts and tags.

### Semantic Colors

Used sparingly, never at full saturation:

- **Success:** Green checkmark `#0F7B6C`, 10% background tint
- **Error:** Red exclamation `#E03E3E`, 10% background tint
- **Warning:** Amber `#DFAB01`, 10% background tint

## Typography

### Typefaces

- **UI:** Inter (or system sans-serif fallback)
- **Code:** SF Mono, JetBrains Mono, or system monospace
- **Serif option:** Optional serif for headings (editorial feel)

### Type Scale

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| page-title | 40px | 700 | 1.2 | Page title (H1) |
| heading-1 | 24px | 600 | 1.3 | H2 equivalent |
| heading-2 | 20px | 600 | 1.3 | H3 equivalent |
| heading-3 | 18px | 600 | 1.3 | H4 equivalent |
| body | 16px | 400 | 1.5 | Body text, lists, to-dos |
| caption | 14px | 400 | 1.4 | Captions, metadata, timestamps |
| code | 14px | 400 | 1.5 | Inline code, code blocks |
| small | 12px | 400 | 1.3 | Status labels, footnotes |

### Weight Usage

- **400** (Regular): Body text, captions, metadata, labels
- **500** (Medium): Button text, nav items, emphasis
- **600** (Semibold): Headings, strong emphasis
- **700** (Bold): Page titles only

Never use weights 800+. Never use font-style italic except in inline emphasis (which uses the system italic).

## Spacing System

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| space-xs | 4px | Icon-to-text gap, tight inline spacing |
| space-sm | 8px | Toolbar padding, input internals, list markers |
| space-md | 16px | Component padding, related element grouping |
| space-lg | 24px | Paragraph spacing, section internal gaps |
| space-xl | 32px | Block-to-block spacing |
| space-2xl | 48px | Content section margins |
| space-3xl | 64px | Left/right page margins |
| space-4xl | 96px | Wide viewport page margins |

### Layout Rules

- Content column max-width: 700-800px for prose pages (readability-optimized)
- Full-width: 100% for database views (bypasses column constraint)
- Sidebar: 220-240px fixed width, collapsible
- Page margins: 64px min, expanding to 96px at wide viewports
- Database table cell padding: 8px horizontal, 6px vertical

## Corner Radius

Notion uses minimal, consistent rounding. The shape language is rectangular with edges eased just enough to remove sharpness.

| Element | Radius | Notes |
|---------|--------|-------|
| Content blocks | 0px (no visible border) | Defined by whitespace, not containers |
| Sidebar items | 4px | Subtle hover highlight |
| Buttons | 4px | Primary and secondary |
| Callout blocks | 4px | Tinted background, emoji-leading |
| Inputs, selects | 4px | Form elements |
| Dropdowns, tooltips | 6px | Floating UI |
| Modals | 8px | Dialog containers |
| Database cards (board view) | 6px | Kanban cards |
| Gallery cards | 8px | Image-leading cards |

No pill shapes. No circular elements except emoji and user avatars. No decorative rounded bounding boxes.

## Elevation & Shadows

Nearly flat. Depth is created through background contrast and hairline borders, not shadows.

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 (surface) | none | Content area, blocks |
| 1 (raised) | `0 1px 2px rgba(0,0,0,0.06)` | Board view cards |
| 2 (overlay) | `0 2px 8px rgba(0,0,0,0.10)` | Tooltips, slash menu |
| 3 (modal) | `0 4px 16px rgba(0,0,0,0.12)` | Modals, dialogs |
| backdrop | rgba(0,0,0,0.20) `+blur` | Modal backdrop |

Dark mode shadows: use white at 4-8% opacity instead of black.

Borders (1px, `#E8E7E4`) separate sidebar from canvas, input fields from background, and modal from backdrop. Cards in gallery/board views use minimal borders only when grouping needs clarification.

## Surface Treatments

- **Page:** Clean off-white, no border, no shadow
- **Sidebar:** Slightly darker than page (`#F7F6F3`), separated by 1px border
- **Toolbar:** Floating, transparent background with subtle blur, appears on hover
- **Callout block:** 10% accent tint background, emoji icon, 4px radius
- **Code block:** Very subtle gray background (`#F1F1F0`), 4px radius, monospace
- **Quote block:** 2px left border in `#E8E7E4`, no background
- **Database table:** No cell borders, zebra striping via alternating row backgrounds (2% difference), column headers slightly darker
- **Database board:** Cards with 1px border, subtle shadow, column background in light gray

## Component Patterns

### Navigation
- **Sidebar:** Workspace name at top, collapsible page tree below, drag-and-drop reordering, emoji page icons, indent guides
- **Breadcrumbs:** Top of page, showing page hierarchy, `/` separated
- **Quick Find:** `CMD+P` opens universal search, filters by recent, pages, and database entries

### Page Components
- **Block menu (`/`):** Context-aware dropdown, searchable, categorized (Basic, Database, Media, Embeds, Advanced)
- **Page properties panel:** Right side-peek, shows status, tags, dates, custom properties
- **Floating toolbar:** Appears on text selection (bold, italic, link, comment), on block hover (drag handle, add below, more menu)
- **AI toolbar:** Inline AI actions — "Continue writing," "Summarize," "Translate" — appearing contextually

### Database Views
- **Table:** Sortable columns, filterable, row hover highlight, inline editing, property type icons
- **Board:** Kanban columns by any Select property, drag-and-drop cards, card preview with 2-3 properties
- **Calendar:** Month/week view, cards by date property, drag-to-reschedule
- **Gallery:** Image-leading cards, metadata below, responsive grid
- **Timeline:** Gantt-chart style, horizontal scrolling, dependency arrows
- **List:** Compact row view, minimal metadata, dense for scanning

## Motion

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Page transition | 100-150ms | ease-out | Cross-fade or gentle slide |
| Sidebar toggle | 200ms | ease-in-out | Smooth width transition |
| Slash menu open | 150ms | ease-out | Fade in + slight upward slide (4px) |
| Tooltip appear | 100ms | ease-out | Instant feel |
| Dropdown open | 150ms | ease-out | Fade + slide |
| Modal open | 200ms | ease-out | Fade backdrop + scale content (0.97→1) |
| Block drag placeholder | 150ms | ease-in-out | Translucent placeholder appears at drop target |
| Block reflow | 200ms | ease-in-out | Content rearranges around drag |
| Peek panel | 250ms | ease-out | Slides in from right |

No spring physics. No bounce. No overshoot. Everything is tuned for frequent, prolonged use: motion is subtle to the point of being subliminal.

## Iconography

- **UI chrome icons:** 16x16px, geometric stroke icons, 1.5px stroke weight, rounded caps, `#6B6966` color
- **Page icons:** Emoji-style at 48-72px, flat, slightly organic rendering
- **Database property icons:** 14x14px, inheriting property type color
- **Status indicators:** Small filled circles (8px), green/amber/red, next to labels

## State & Interaction Patterns

### Hover States
- **Sidebar items:** Background shifts from `#F7F6F3` to `#EAE9E6`, subtle and instantaneous (0ms transition)
- **Content blocks:** Six-dot drag handle fades in on the left margin (100ms fade), "+" add-below button appears below the block
- **Card (gallery/board view):** Subtle border darkening + shadow increase, gentle transition (150ms)
- **Button (secondary):** 1px border darkens from `#DEDDDA` to `#C0BEB8`
- **Table row:** Full-width background highlight at 2% darker than alternating background

### Focus States
- **Input focus:** 2px accent-colored ring (e.g., `#2383E2`), no offset, smooth transition (150ms)
- **Button focus:** Same 2px accent ring around the button perimeter
- **Keyboard navigation:** All interactive elements get visible focus rings — including sidebar items, block handles, and database cells
- **Focus ring is the accent color** — it's one of the few places accent color appears outside of links and primary buttons

### Active/Pressed States
- **Button press:** Background darkens 5-10%, slight scale (0.98) on click, 100ms
- **Sidebar item active:** Subtle accent tint background (10% opacity) + 2px left-edge accent indicator
- **Tab active (view switcher):** 2px bottom border in accent color, text darkens to primary

### Disabled States
- **Disabled input:** Gray background (`#F1F1F0`), text in tertiary (`#9B9996`), reduced opacity (40-50%)
- **Disabled button:** Reduced opacity (40%), cursor set to default (not pointer)
- **Disabled menu item:** Secondary text (`#6B6966`), no hover effect, cursor default
- All disabled states remain readable — Notion never drops opacity low enough to compromise legibility

### Loading States
- **Page load:** Skeleton content — gray bars pulsing subtly (1.5s loop, `#E8E7E4` to `#F1F1F0`). Page title appears first (immediately), content blocks skeleton-fill below
- **Database query:** Skeleton rows matching the view type. Table: 36px bars. Board: card-shaped skeletons. Gallery: image + text skeletons
- **Image load:** Low-resolution placeholder or gray fill (`#F1F1F0`) with subtle pulse. Transitions to full image on load (300ms cross-fade)
- **Embed load:** Branded placeholder with service logo (Figma, YouTube, etc.), subtle background pulse until embed renders

### Empty States
- **Empty page:** Centered emoji icon (48px, clickable, faint opacity), "This page is empty. Start writing or drag in some content." below (16px, secondary). Cursor blinks on an empty line below.
- **Empty database:** Column headers visible, "Add a new row to get started" in the first row. No alarming empty-state visuals.
- **Empty sidebar section:** "Add a page" link, subtle, at the bottom of the section. No aggressive prompts.
- **Empty search results:** "No results for '[query]'." with "Try a different search" suggestion. No illustration.

### Error States
- **Connection error:** Subtle amber banner at top of page: "Connection lost. Changes will sync when you reconnect." (13px, amber tint background)
- **Save error:** Inline error near the affected content: "This change couldn't be saved. Try again." (12px, red text)
- **Permission error:** "You don't have access to this page. Request access from the owner." Centered, clean typography, no alarming visuals
- **404 (page not found):** "This page doesn't exist or you don't have access." With link back to workspace home. Simple, unemotional.

## Responsive Behavior

- **Desktop (1024px+):** Full experience. Sidebar visible (220px). Content centered at 740px. Side peek available.
- **Tablet (768-1023px):** Sidebar collapsible (closed by default, hamburger toggle). Content column narrows to fit. Database views remain full-width.
- **Mobile (<768px):** Sidebar hidden (accessible via hamburger menu as overlay). Content column fills viewport width with 16px margins. Block toolbar simplified. Side peek unavailable — page properties accessed via modal instead.
- Font sizes remain consistent across breakpoints — 16px body is always 16px

## Dark/Light Mode Transition

- Toggle between modes uses a 200ms ease-in-out transition on background-color, text-color, and border-color properties
- All other properties (spacing, radii, shadows) remain unchanged between modes
- System preference respected by default
- Manual override stored in user preferences
- Individual elements do NOT animate independently during the transition — the entire page transitions uniformly


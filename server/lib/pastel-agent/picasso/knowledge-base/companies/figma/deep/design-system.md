# Figma — Design System

## Color Tokens

### Neutral Palette (UI Chrome)

| Token | Value | Usage |
|-------|-------|-------|
| bg-canvas | `#2C2C2C` (default, user-adjustable) | Infinite canvas background |
| bg-panel | `#FFFFFF` | Right panel, left panel backgrounds |
| bg-toolbar | `#F5F5F5` | Top toolbar, secondary panels |
| bg-hover | `#EDEDED` | Hover state on list items, buttons |
| bg-active | `#E0E0E0` | Active/pressed states |
| bg-selected | `#DAE3FC` (light blue tint) | Selected list items |
| text-primary | `#333333` | Panel headings, labels, body text |
| text-secondary | `#888888` | Metadata, captions, helper text |
| text-disabled | `#BBBBBB` | Disabled controls |
| icon-primary | `#2C2C2C` | Toolbar and panel icons |
| icon-secondary | `#888888` | Subdued icons, disclosure triangles |
| border-primary | `#E5E5E5` | Panel separators, dividers, 1px |
| border-input | `#D5D5D5` | Input field borders |
| canvas-grid | `#444444` | Canvas grid dots/lines |
| overlay | `rgba(0,0,0,0.30)` | Modal backdrop |

### Accent & Semantic

| Token | Value | Usage |
|-------|-------|-------|
| accent-primary | `#9747FF` (purple) | Primary CTA, active states, brand |
| accent-selection | `#2684FF` (blue) | Selection outlines on canvas |
| accent-focus | `#2684FF` | Focus rings, input focus |
| success | `#0F9D58` | Success indicators |
| warning | `#F4B400` | Warning states |
| error | `#DB4437` | Error states, destructive actions |
| multiplayer-1 | `#E03E3E` (red) | Collaborator cursor 1 |
| multiplayer-2 | `#2684FF` (blue) | Collaborator cursor 2 |
| multiplayer-3 | `#0F9D58` (green) | Collaborator cursor 3 |
| multiplayer-4 | `#F4B400` (orange) | Collaborator cursor 4 |
| multiplayer-5 | `#9747FF` (purple) | Collaborator cursor 5 |
| multiplayer-6 | `#E03E9F` (pink) | Collaborator cursor 6 |

Auto-layout handles on canvas:
- **Direction:** Blue (`#2684FF`)
- **Alignment/gap:** Pink (`#E03E9F`)

## Typography

### Typeface
Inter (or system sans-serif) for all UI. Monospace (`SF Mono` / `JetBrains Mono`) for code in Dev Mode.

### Type Scale (UI Chrome)

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| ui-heading | 13px | 600 | 1.3 | Panel section headings, active tool name |
| ui-body | 12px | 400 | 1.4 | Panel content, labels, menu items |
| ui-caption | 11px | 400 | 1.3 | Metadata, timestamps, helper text |
| ui-small | 10px | 500 | 1.2 | Keyboard shortcuts, badges |
| toolbar-label | 12px | 500 | 1.3 | Active tool label in toolbar |
| code | 12px | 400 | 1.5 | Dev Mode code panel, property values |

### Weight Usage
- **400:** Body, labels, metadata, menu items
- **500:** Toolbar labels, button text, emphasis
- **600:** Section headings, active states

No weight 700+ in UI chrome. No italic. No all-caps for navigation or labels.

## Spacing System

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Icon-to-text, inline gaps, tight grouping |
| space-2 | 8px | Standard panel padding, item gaps |
| space-3 | 12px | Section internal padding |
| space-4 | 16px | Panel section gaps, card padding |
| space-5 | 24px | Panel-to-panel separation | 
| space-6 | 32px | Large section breaks |

### Layout Rules
- All panel interiors use an 8px grid (implicit)
- Toolbar icons: 32px center-to-center
- Left panel: 240px default, resizable 180-400px
- Right panel: 240px default, resizable 200-400px
- Toolbar height: 40px
- Canvas grid: 8px or 10px (user-adjustable, displayed as dots or lines)
- Component spacing: tight, no wasted pixels

## Corner Radius

| Element | Radius | Notes |
|---------|--------|-------|
| Canvas frames/rectangles | 0px | User places these; Figma's own chrome uses following |
| Buttons | 4px | All toolbar and panel buttons |
| Inputs, selects | 4px | Form fields in panels |
| Tooltips | 2px | Compact, sharp |
| Dropdown menus | 6px | Context menus, select dropdowns |
| Modals | 8px | Dialogs and larger overlays |
| Color swatches | 100% (circle) | Small color swatch indicators |
| Avatars | 100% (circle) | User avatars in multiplayer cursors |
| Badges | 2px | Status badges, notification counts |

No pill shapes. No decorative rounding beyond the functional minimum. Shapes are architectural: right angles eased only enough to feel precise, not harsh.

## Elevation & Shadows

Figma uses a nearly flat hierarchy. Elevation is communicated through 1px borders and background contrast, not shadows.

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 (surface) | none | Panels, canvas, toolbars |
| 1 (raised) | `0 2px 8px rgba(0,0,0,0.10)` | Floating toolbar (only when detatched) |
| 2 (overlay) | `0 4px 12px rgba(0,0,0,0.15)` | Dropdowns, context menus |
| 3 (modal) | `0 8px 24px rgba(0,0,0,0.20)` | Dialogs, modals |
| backdrop | `rgba(0,0,0,0.30)` | Modal backdrop, no blur |

The toolbar normally sits flush against the canvas border. When detached (floating mode), it receives a subtle shadow. This is the only place shadows appear in the primary chrome.

## Surface Treatments

- **Canvas:** Dark gray background with subtle grid pattern (dots or lines at 8-10px intervals, low opacity). No decorations. Infinite, zoomable.
- **Left panel (layers):** White background, flush against canvas with 1px right border. No shadow. Compact tree view with indent guides (faint vertical lines at each depth level).
- **Right panel (properties):** White background, flush against canvas with 1px left border. No shadow. Section groupings with expand/collapse toggles.
- **Top toolbar:** Light gray (`#F5F5F5`), flush to top of viewport. Contains tool icons, project name, share button. 1px bottom border.
- **Bottom status bar:** Compact (24px), light gray, zoom level + view options.
- **Canvas frames:** Rendered with the user's own fill/stroke properties. Figma never imposes stylistic treatment on frames.

## Component Patterns

### Canvas Interaction
- **Infinite pan:** Click-drag on empty canvas, or scroll-wheel (horizontal: Shift + scroll)
- **Smooth zoom:** Scroll-wheel (Cmd + scroll), continuous (no stepped zoom levels), centered on cursor position
- **Frame selection:** Click frame name in layers panel, or click on canvas. Selected frame shows blue outline + resize handles
- **Object selection:** Click to select, double-click to enter group/frame, Escape to exit
- **Multi-select:** Shift + click for range, Cmd + click for individual, drag-select rectangle

### Auto-Layout
- Visual indicators on canvas: blue handles for direction, pink handles for gap/alignment
- Constraints communicate physically: horizontal/vertical anchor points on the selected object edges
- Auto-layout can be applied to any frame, transforming it into a flexbox-like container

### Component System
- Component instances marked with diamond icon in layers panel
- Detached instances show in layers with generic icon
- Variant controls appear in right panel as toggle or dropdown
- Component libraries accessible from a dedicated panel (Assets)

### Multiplayer Features
- Colored cursor ring with user avatar (full color, bright)
- Collaborator viewport as subtle colored rectangle on canvas
- Cursor labels: name + avatar on hover
- Comment pins: numbered circles on canvas, open as threaded side panel
- Audio/video chat: face pile at top of canvas (minimal, not a full sidebar)

### Dev Mode
- Toggle in toolbar: switches right panel from "Design" to "Dev" mode
- Code panel: shows CSS, SwiftUI, or Compose code for the selected element
- Measurements: spacing indicators between selected element and neighbors
- Section-level annotations: developer notes attached to frames
- Color tokens, typography tokens, and spacing tokens displayed in developer-friendly format

## Motion

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Dropdown open | 150ms | ease-out | Fade + 4px slide |
| Modal open | 200ms | ease-out | Fade backdrop, scale content 0.97→1 |
| Panel resize | 0ms | — | Instant, no animation (raw performance) |
| Canvas zoom | Real-time | — | Continuous, smooth, no stepped zoom |
| Multiplayer cursor move | ~100ms lerp | — | Smooth interpolation, not instant, not laggy |
| Selection outline | Continuous | linear | Marching ants (dashed stroke offset animation) |
| Tooltip appear | 100ms | ease-out | Instant feel |
| Comment pin | 150ms | ease-out | Bounce on drop (subtle) |
| Component drag from library | 100ms delay | — | Preview appears at cursor |

No decorative animations. Every motion answers a functional question: "where did this come from?" or "what just changed?" Motion is brief, responsive, and physically motivated without being literal.

## Iconography

All icons are geometric — circles, rectangles, lines, polygons — drawn at 16px with 1.5px strokes in `#2C2C2C`. They feel like they could have been made in Figma itself.

- **Tool icons:** 16px, stroke-based, monochrome
- **Property icons:** 16px, may be filled for specific concepts (fill bucket, text "T")
- **Status indicators:** 8px filled circles (green/amber/red)
- **Component icons:** Diamond shape for instances, four-diamond for main components
- **Layer type icons:** Distinct shapes per type (frame = hash, group = folder, text = "T", rectangle = square, etc.)
- **No multi-color icons in UI chrome.** Colors on canvas (user content) are unrestricted.

## State & Interaction Patterns

### Hover States
- **Panel buttons:** Background shifts from transparent to `#EDEDED`, instant (0ms transition). The button's icon and label remain readable.
- **Layer list items:** Row background highlights to `#EDEDED`. Quick actions (lock, visibility, more menu) appear on hover.
- **Toolbar icons:** Tooltip appears (2px radius, dark background, white text, 11px) after 500ms hover delay. No immediate reaction on hover — the active tool state is shown via selected styling, not hover.
- **Frame/object on canvas:** Selection outline appears in a lighter blue on hover (preview of selection). If auto-layout, blue/pink handles appear.
- **Property input hover:** Input border darkens from `#D5D5D5` to `#AAAAAA`. No background change.

### Focus States
- **Input focus:** Blue focus ring (`#2684FF`), 2px, consistent across all inputs and selects. 4px radius matches the input's radius.
- **Panel button focus:** Same blue ring, offset slightly so it's visible on the button's background.
- **Canvas object focus:** The selected object's outline serves as the focus indicator. No additional ring.
- **Keyboard navigation:** Full keyboard accessibility. Focus follows the layers panel, properties panel, and toolbar in a logical tab order.

### Active/Selected States
- **Toolbar tool active:** Icon background darkens to `#E0E0E0`, icon color shifts from `#2C2C2C` to `#333333`. The active tool name appears in the toolbar center at 13px medium.
- **Layer selected:** Row gets blue tint background (`#DAE3FC`). The corresponding object on canvas gets the blue selection outline + marching ants.
- **Tab active (Design/Prototype):** Underlined with a 2px blue bar. Text darkens to primary.
- **Component variant selected:** Toggle fills with purple accent. Dropdown shows checkmark next to active value.

### Disabled States
- **Disabled toolbar tool:** Grayed out icon (opacity 30%), cursor shows "unavailable" on hover, tooltip explains why it's disabled.
- **Disabled panel input:** Gray background (`#F5F5F5`), text in tertiary (`#BBBBBB`), no focus ring on click.
- **Locked layer:** Properties panel shows values as read-only, small lock icon next to affected properties. The object on canvas can be selected but shows no resize handles.

### Loading States
- **File loading:** Canvas shows loading indicator (subtle Figma logo animation or progress bar). Layers panel and properties panel show skeleton placeholders until the file data is available.
- **Font loading:** Text layers using web fonts show a fallback system font briefly. Transitions to the correct font when loaded (no visual flash — the fallback matches metrics).
- **Image fill loading:** Shows a subtle checkerboard or solid gray. Transitions to the actual image on load.
- **Plugin loading:** Plugin panel shows a loading spinner or skeleton. Plugin UI loads within the Figma sandbox.

### Empty States
- **Empty file (new):** A single "Page 1" in the layers panel. Canvas shows a blank dark gray surface with the grid. No "start here" prompts.
- **Empty layers panel (all objects deleted):** Shows only "Page 1" with a disclosure triangle. No "No layers" message — the page itself is a layer.
- **Empty properties panel (nothing selected):** Shows file-level options: page background color, export settings. No "Select an object to edit" message.
- **Empty component library (first use):** "No components yet. Create one from any frame, group, or layer." with a link to documentation.

### Error States
- **Connection lost:** Banner at top of canvas: "Connection lost. Trying to reconnect..." (amber, subtle). Figma continues to function locally — changes are queued.
- **Save conflict:** Rare, but when it occurs: "This file has been modified by another user. Your changes have been saved as a separate version." No conflict resolution UI — automatic versioning.
- **Plugin error:** Inline error in the plugin panel: "Plugin '[name]' encountered an error. Reload plugin." With "Reload" button.
- **Font missing:** Text layer shows a warning icon (small triangle) in the properties panel next to the font name. "Font not available. [font name] will be used instead."
- **Export error:** Toast notification: "Export failed. Check your file and try again." (red, briefly visible, auto-dismisses).

## Responsive Behavior

- **Desktop (1200px+):** Full layout. Both side panels visible at 240px each. Canvas occupies the majority of the viewport.
- **Laptop (900-1199px):** Panels shrink to 200px minimum. Canvas adjusts. No functional changes.
- **Small screen (<900px):** Panels overlay the canvas (slide in/out from sides — 200ms). Canvas occupies full width. Toolbar remains visible at top.
- **Touch device:** Larger hit targets (32px minimum for icons). No hover-dependent interactions (drag handle for layers, auto-layout indicators). Gesture support: pinch to zoom, two-finger pan.
- Canvas zoom and pan are responsive regardless of viewport — the design tool works on any screen size.

## Dark/Light Mode

Figma does not have a traditional light/dark mode toggle for the UI chrome. The UI chrome is always light, and the canvas is always user-adjustable (dark by default). However, the canvas brightness can be adjusted:
- Canvas background: configurable from near-black (`#1A1A1A`) to near-white (`#F5F5F5`)
- Grid appearance adapts to canvas brightness
- UI chrome (panels, toolbar) remains consistently light regardless of canvas setting

This creates the signature Figma contrast: light chrome + dark canvas. The user can soften or intensify this contrast by adjusting canvas brightness, but the polarity is fixed.


# Figma — Case Studies

## Screen 1: Figma File Editor

**Context:** The primary workspace. User is designing a screen inside a Figma file with full tool suite available. This is where designers spend 90% of their time — the editor must support deep focus, rapid iteration, and seamless collaboration.

**Layout:**
- Left panel (240px default, resizable 180-400px): Layers panel. Hierarchical tree showing pages, frames, groups, and objects. Each item: type icon (16px), name (12px, `#333333`), lock/visibility toggles (16px icons, `#888888`, toggle on click). Indent depth at 16px per level with subtle vertical connection lines. Component instances marked with filled purple diamond icon. Active selection highlighted with blue background (`#DAE3FC`).
- Right panel (240px default, resizable 200-400px): Properties panel. Two tabs at top: Design | Prototype. Design tab shows context-aware properties for the selected object — grouped in collapsible sections with section headers (11px medium, `#888888`, uppercase or sentence case depending on context). Prototype tab shows interaction triggers, actions, and animation settings.
- Top toolbar (40px): Main menu behind Figma logo (far left), tool icons grouped logically (move/scale, region tools, shape tools, pen/pencil, text, resources, hand/comment), active tool label in center (12px medium), project/file name (left of center region), then right-aligned: share button (purple primary, "Share"), Dev Mode toggle, presentation/play button. Background: `#F5F5F5`, 1px bottom border (`#E5E5E5`).
- Center canvas: Dark gray (`#2C2C2C`) with subtle dot grid (8px spacing, `#444444` dots at 1px). Infinite pannable/zoomable surface. Frames rendered in user-defined colors (default white). Selected object shows blue (`#2684FF`) outline with 8 resize handles. Multiplayer cursors visible as colored rings.
- Bottom bar (24px): File name (left), zoom percentage (center — click to open zoom input), view options toggle (grid, multiplayer cursors, rulers), page selector dropdown (right). Background: `#F5F5F5`.

**Key interaction details:**
- Selection: single click selects (shows blue outline + handles). Double-click enters group/frame. Escape exits to parent. This click-depth model is universal across the canvas.
- Multi-select: Shift+click (range), Cmd+click (individual), drag-select (rubber band rectangle — transparent blue fill, blue outline). Selected objects get individual selection outlines within the group.
- Resize handles: 8 handles (corners + edge midpoints). 8px size. White fill, blue border. Cursor changes based on handle (n-resize, ne-resize, etc.). Hold Shift for proportional resize. Hold Alt to resize from center.
- Auto-layout frames: direction handles in blue (`#2684FF`) — horizontal/vertical arrow indicators. Gap handles in pink (`#E03E9F`) — small diamond shapes between child elements. Alignment handles in pink — edge/corner indicators. Handles are interactive: drag to adjust values, click to cycle alignment options. Handles appear on hover + selection.
- Marching ants: selected objects show an animated dashed stroke offset (continuous animation, linear, 1px blue stroke). This is the key visual signal that something is "selected but not finalized."
- Frame titles: displayed above each frame on the canvas — 11px, `#888888`, centered. Tappable to rename. Disappears at very low zoom levels to avoid clutter.
- Multiplayer cursors: colored ring (20px diameter, 2px stroke, fully saturated color) with user avatar filling the ring. Name label appears above on hover or persistently if spacing allows. Cursor position updates with ~100ms smooth lerp — natural movement, not instant teleportation.
- Viewport sharing: each collaborator's viewport shown as a subtle colored rectangle (same color as their cursor, 5% opacity) on the canvas. This shows what portion of the design they're viewing.
- Comment pins: numbered circles (20px, white fill, colored border matching the commenter, sequential number center) anchored to canvas positions. Click to open threaded comment panel on the right. Comment panel slides from right (200ms).

**Properties panel sections (Design tab, typical for a selected frame):**
- Alignment: distribute and align controls — 6 icon buttons (align left, center, right, top, middle, bottom) + distribute horizontal/vertical and tidy up
- Position: X, Y, Width, Height — 4 input fields in a 2x2 grid. Values in pixels. Chain-link icon for aspect ratio lock.
- Constraints: Horizontal (Left, Right, Left & Right, Center, Scale) and Vertical (Top, Bottom, Top & Bottom, Center, Scale) — dropdown selectors with visual indicators.
- Layer: Opacity slider (0-100%), Blend mode dropdown (Pass through, Normal, Darken, Multiply, etc.) — compact controls.
- Auto layout: "+" button to add. When active, shows: Direction (horizontal/vertical toggle), Gap (input), Padding (4 inputs or unified), Alignment (dropdowns).
- Fill: List of fills (color, gradient, image). Each fill: color swatch (20px, circle) + hex value input (monospace) + opacity slider + "..." menu. "Add fill" button below.
- Stroke: List of strokes. Each stroke: color swatch + hex value + opacity + weight (input) + stroke style (solid/dashed/dotted/custom) + "..." menu.
- Effects: List of effects (drop shadow, inner shadow, layer blur, background blur). Each effect: type icon + settings (X, Y, blur, spread, color) + visibility toggle.
- Export: List of export presets. Each preset: format dropdown (PNG, JPG, SVG, PDF) + scale input or suffix. "Export [frame name]" button. Preview button.

**Toolbar tool groups:**
- Move/Scale: Move (V), Scale (K) — the primary navigation tools
- Region: Frame (F), Slice (S) — container tools
- Shape: Rectangle (R), Line (L), Arrow, Ellipse (O), Polygon, Star — creation tools
- Drawing: Pen (P), Pencil (Shift+P) — vector tools
- Text: Text (T) — text creation tool
- Resources: Assets panel, Components panel — library tools
- Utility: Hand (H), Comment (C) — navigation and feedback

**Keyboard shortcuts visible in menus:**
- All menu items show their keyboard shortcut right-aligned in the dropdown. This teaches shortcuts passively over time.
- Shortcut display: small text (11px), `#888888`, monospace styling. Example: "⌘D" for Duplicate.

**States:**
- Nothing selected: Properties panel shows file-level properties (page background, export). Canvas shows no selection outlines.
- Single object selected: Full properties panel. Selection outline with marching ants and 8 handles.
- Multiple objects selected: Properties panel shows shared properties only (position, size may be "Mixed"). Each object has its own selection outline.
- Object locked: Selection possible but no resize handles. Properties panel shows values as read-only with lock indicator. "Unlock" button prominent.
- Object hidden: Visible on canvas as a translucent ghost (only when "Show hidden layers" is toggled). Layers panel shows visibility toggle off (eye icon struck through).
- Component instance: Layers panel shows purple diamond icon. Properties panel shows component name + "Go to main component" link + variant controls (if applicable). Instance overrides highlighted.
- Group: Selection shows group bounding box. Layers panel shows folder icon. Double-click to enter.

## Screen 2: File Browser (Dashboard)

**Context:** User is browsing projects and files within a team or their own drafts. This is the organizational hub where users find, create, and manage design files.

**Layout:**
- Left sidebar (200px): Team name at top (14px medium). Team members face pile (small avatars, overlapping, max 5 + "+N" count). Navigation items (14px medium, `#333333`): Recents, Drafts, Projects. Below: team/project hierarchy with disclosure triangles and folder icons. Active item: light blue background highlight (`#DAE3FC`).
- Top bar (48px): Search field (full-width, 36px height, 6px radius, `#F5F5F5` background): placeholder "Search files and projects..." with magnifying glass icon. "New file" dropdown button (purple primary, right-aligned) — options: New design file, New FigJam file, Import file. Filter dropdown (recent, alphabetical, last modified). View toggle (grid/list).
- Main content: Section heading (16px semibold) — "Projects" or "Recent files". Below: grid of file cards (3-4 columns, 260-320px card width, 16px gap).
  - File card: Preview thumbnail (16:9 aspect ratio, full card width, shows live preview of file content) with rounded top corners (6px). Card body below: file name (14px medium, 1-2 lines), last-edited timestamp (12px secondary) + "by [name]" or collaborator avatar (16px). Hover: subtle shadow appears (`0 2px 8px rgba(0,0,0,0.10)`), name highlights in blue (`#2684FF`), quick actions appear (context menu dots in top-right corner of thumbnail).
  - Empty file card (new file): Dotted border, centered "+" icon, "New design file" label. Different visual treatment from populated files.
- Bottom of content area: "Show more" link for paginated results.

**File card details:**
- Thumbnails are live previews — they update as the file content changes
- Long file names truncated with ellipsis after 2 lines
- Card width responsive: 320px ideal, shrinks to 260px on medium screens, stacks to 2 columns on narrow
- Right-click context menu on card: Open, Open in new tab, Duplicate, Rename, Move to project, Add to favorites, Delete

**Search behavior:**
- Type-ahead filtering as the user types
- Searches file names, project names, and within file content
- Results grouped: "Files" section, "Projects" section
- Recent searches shown when search field is focused but empty
- No results: "No results for '[query]'. Try a different search term." with a simple illustration

**Project view (when clicked into a project):**
- Project header: Project name (20px semibold) + description (14px secondary) + team members with access + "Share" button
- Tabs: Files | Settings — horizontal row below header
- File grid: same card layout as main browser, filtered to this project
- "+" button or "Add file" CTA to create a new file within the project
- "Add to project" to move existing files in

**States:**
- No files yet (new team): Empty state illustration (simple geometric shapes in Figma purple), "No files yet. Create your first design file to get started." with "New file" button
- All files loaded: Pagination or infinite scroll with "Show more"
- Loading: Skeleton cards (gray pulsing rectangles matching card layout)

## Screen 3: Figma Community

**Context:** User is browsing community files, plugins, and widgets. This is where Figma transitions from "tool" to "platform" — the community is a product surface, not a separate website.

**Layout:**
- Top: Community header with prominent search bar (full-width, 48px height, dark background or distinct style to separate from content). Category tabs: Files | Plugins | Widgets. "Create plugin" CTA button (right-aligned, secondary style).
- Hero area (when no search active): Featured carousel or static grid — larger cards for editor-picked files/plugins. Large preview image, title (20px semibold), creator name + avatar, short description (14px secondary). Navigation arrows if carousel.
- Category filter chips: Horizontal scrollable row — "UI Kits," "Wireframes," "Icons," "Design Systems," "Mobile," "Web," "Illustrations," "Templates," "All." Active chip: purple fill, white text. Inactive: light gray fill, dark text.
- Sort selector: "Most popular" | "Trending" | "Most recent" — dropdown, right-aligned
- Main grid: 3-4 column card grid
  - File cards: Cover image (full card width, 16:9, could be custom banner or file preview), rounded top 8px corners. Below: file/plugin name (16px medium), creator name + avatar (14px, `#888888`), likes count with heart icon + downloads/installs count (12px secondary, monochrome icons).
  - Plugin cards: Same layout but with "Install" button (purple primary if not installed, green "Installed" label + checkmark if installed). Install count + rating displayed.
  - Widget cards: Similar. "Add to file" action.
- Card interactions: Hover — subtle shadow lift, creator name becomes link-colored, quick actions appear. Click — opens detail page.
- Pagination: "Load more" button at grid bottom or infinite scroll.

**Detail page (file/plugin):**
- Large header with preview/cover. File/plugin name (24px semibold). Creator info (avatar + name, clickable). Action buttons: "Open in Figma" / "Install" (primary purple). Stats row: likes, downloads, views (14px secondary).
- Description: Rich text, formatted. Can include images, links, code blocks.
- Comments/Reviews section: Threaded, similar to file comments. User avatars, formatted text, timestamps.
- "More from this creator" section: horizontal row of small cards.
- "Similar files/plugins" section: grid of cards.

**Key details:**
- Creator attribution is always visible — the community is built on attribution and recognition
- File cards in community have a distinct visual treatment from file browser cards (larger, more emphasis on cover image)
- "Installed" badge uses green (`#0F9D58`) — the only use of this semantic color in this context
- Empty search: "No results for '[query]'. Try adjusting your search or browse categories." with an illustration
- Transition between browser and community feels seamless — unified UI patterns, same typography, same spacing, different content type
- Community content feels like it lives inside Figma, not on a separate marketplace website

## Screen 4: FigJam (Whiteboard)

**Context:** User is in FigJam, Figma's whiteboarding tool. Lighter, more playful than the core editor but still precise and Figma-familiar. Used for brainstorms, flows, retros, and workshops.

**Layout (same architecture as editor, different visual treatment):**
- Left panel (240px): Simplified — sections and objects list. Less hierarchy depth, fewer object types. Section-based organization instead of frame-based.
- Right panel (240px): Simplified properties. Color picker, line style, text settings. No auto-layout, no constraints, no complex effects. Deliberately simpler.
- Top toolbar (40px): Different tool set. Marker (freehand drawing), sticky note, shapes (rectangle, circle, diamond, etc.), connector lines, stamps/reactions, text, timer, cursor chat, media embed. Tool icons are slightly larger (20px vs 16px) for more comfortable use in a collaborative setting.
- Center canvas: White (`#FFFFFF`) with subtle dot grid (10px spacing, `#E5E5E5`). Bright, open, inviting. No dark mode canvas — FigJam is always light.
- Bottom bar: Same zoom + view controls as editor. Section/page selector.

**Key visual differences from the design editor:**
- Canvas is white, not dark — creeps the tool into "meeting space" territory rather than "design tool" territory. Whiteboards are traditionally white.
- Sticky notes: 4 standard colors (yellow `#FFF3B0`, pink `#FFD6E0`, blue `#D6E6FF`, green `#D6FFE0`) — pastel, warm, inviting. Slightly irregular borders (hand-drawn micro-variation). Default size ~200x200px. Resizable. Font size slightly larger for readability in group settings.
- Marker/Drawing: Variable stroke width based on speed (slower = thicker, faster = thinner). Slightly organic line quality — not perfect vectors. Colors from the bright palette.
- Connector lines: Auto-routing between connected objects. Drag from one object's connector dot to another's. Lines can be straight, curved, or stepped. Arrowheads available.
- Stamps and reactions: Emoji-style visuals at larger sizes (32-48px). Click/drag to place on canvas. Used for voting, reactions, and quick visual marking.
- Cursor: Larger (24px ring) and more visible than in the editor. Cursor chat: click on canvas and type — text appears above your cursor in a small speech bubble. Disappears after a few seconds. Playful and ephemeral.
- Timer: Small countdown timer in the top toolbar. Set duration, visual ring counts down. Gentle chime at end. Used for timed activities in workshops.
- Music player: Optional integration. Minimal, in toolbar. Ambient music for group sessions.

**Interaction philosophy:**
- FigJam is intentionally simpler — no component system, no auto-layout, no advanced properties
- The tool encourages fluidity over precision — sticky notes can be slightly crooked, markers slightly rough
- Multiplayer is more prominent — everyone's cursors are always visible, face piles are larger, cursor chat makes the collaboration feel alive
- Sections replace frames — large colored background areas that group related content. Less structural than frames, more organizational

## Screen 5: Dev Mode

**Context:** Developer has toggled Dev Mode in the editor. The interface shifts completely to serve a different persona — the developer who needs code, measurements, and design tokens, not design editing controls.

**Layout:**
- Canvas: Same — designs remain exactly as in Design Mode. No visual change to the user's work. Selection behavior changes: clicking selects entire sections or frames rather than individual layers (navigation optimized for reading designs, not editing them).
- Right panel (240px): Completely transformed. Tabs: Code | Assets.
  - Code tab: Primary view. Shows syntax-highlighted code for the selected element: CSS (web), SwiftUI (iOS), or Compose (Android) — determined by the file's platform setting or user preference. Dark background for code area, monospace font (JetBrains Mono or similar), syntax highlighting with a recognizable theme (not Figma-branded colors). "Copy" button at top-right of code block.
  - Below code: Measurements section — spacing values between the selected element and its nearest neighbors, shown as red dimension lines rendered directly on the canvas with pixel value labels (e.g., "16px", "24px"). These measurements update live as the developer moves their cursor across the canvas.
  - Color tokens: Extracted from the design file. Each token: color name (e.g., "primary/500"), hex value (`#9747FF`), small circle color swatch (16px). Displayed in a list grouped by token category.
  - Typography tokens: Font family, size, weight, line-height for text in the selection. Similar list format to color tokens.
  - Asset download section: Export-ready assets. Format picker (PNG, SVG, PDF, JPG). Scale options. "Export" button.
- Left panel: Layers panel remains but objects are grouped by section (based on "Ready for development" markers set by designers). Sections marked with status indicators.
- Top bar: "Dev Mode" indicator highlighted in the toolbar next to the toggle. Designers can mark sections as "Ready for dev" — these appear as labeled markers on the canvas (small green/gray/red flags or labels). Section status legend at top of canvas.

**Key interaction details:**
- Hovering anywhere on the canvas shows measurements from the hover point to the nearest element boundaries — precise red dimension lines with floating pixel value labels. No click needed. This is the Dev Mode "killer feature."
- Clicking a element selects it and locks the code panel to that element. The code updates to show that element's properties.
- "Compare changes" feature: if designs have been updated since the developer last viewed them, a diff-style view shows what changed (before/after). Colored indicators: green for added, red for removed, amber for modified.
- Design tokens link to documentation: if the design system is connected to a documentation platform (like Storybook or Zeroheight), token names become clickable links.
- No editing controls: Dev Mode is entirely read-only for the design. The developer cannot accidentally move, resize, or modify any design element.
- Toggle back to Design Mode: persistent button in the left side of the toolbar. Click to instantly return to design editing. No transition animation — the panel swap should feel instantaneous.

**States:**
- No element selected: Code panel shows instructions: "Select a frame or element to view code and measurements." Canvas shows hover measurements.
- Element selected: Code panel shows full details. Measurements show on canvas.
- Section not marked "Ready for dev": shown in the layers panel with a "In progress" indicator. Developer can still view but there's a visual cue that changes may occur.
- Design updated since last visit: notification banner: "Designs have been updated since your last visit. Compare changes." Option to dismiss or view diff.

## Screen 6: Team Library & Design System Management

**Context:** Design system manager is viewing and managing published components, styles, and variables across the team's library.

**Layout:**
- Left panel: Library navigation — shows all published libraries this team has access to. Each library: team name, library name (14px medium), component count ("32 components"), disclosure triangle. Active library highlighted.
- Main content area (library detail view):
  - Library header: Library name (20px semibold), description (14px secondary), team name + avatar, "Last published [date]" (12px secondary).
  - Tabs: Components | Styles | Variables — horizontal row.
  - Components tab: Grid of component preview cards (2-3 columns). Each card: component preview rendering (live Figma render, not static image), component name (14px medium), description (12px secondary), variant count ("4 variants"). Click opens component detail.
  - Styles tab: Categorized list of color styles, text styles, effect styles. Each style: color swatch or text preview + style name + style value. Grid or list view toggle.
  - Variables tab: Table view of design tokens. Columns: Name, Value, Type (Color, Number, String, Boolean), Group. Hierarchical display with indent for nested token groups. "Add variable" button.
- Right panel (when a component is selected): Component detail — larger preview, name, description, status (Ready, In progress, Deprecated), "Insert" button, "Edit main component" link, usage count ("Used in 47 files"). Variant table showing all variants and their property values.
- Top toolbar: "Publish" button (purple primary) — publishes library changes for the team. Unpublished changes indicator: small amber dot + "3 unpublished changes" label next to the Publish button.

**Key interaction details:**
- Components can be dragged from the library directly onto the canvas — this is the primary insertion method
- "Use count" shows how many team files use each component — helps prioritize which components need updates
- Publish workflow: review changes dialog showing which components/styles/variables have been added, modified, or removed. Version notes input (markdown). "Publish" button with confirmation.
- Component statuses: Ready (green dot), In progress (amber dot), Deprecated (red dot). Displayed in the component list and detail view.
- Library updates propagate to files automatically — users get a notification in-file: "Library updates available. Review changes." (small banner at top of canvas). They can accept or review.

**States:**
- No libraries published: "No libraries yet. Publish your first library from any file." with "Learn more" link.
- Unpublished changes: Amber indicator in both the library view and any file using the library.
- Library update available (in a design file): Subtle notification at top of canvas. "Library '[name]' has been updated. Review [N] changes." Options: "Update all" (accept all changes), "Review" (open diff view), "Dismiss" (ignore for now).


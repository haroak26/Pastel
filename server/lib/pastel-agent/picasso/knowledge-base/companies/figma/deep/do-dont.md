# Figma — Do / Don't

## Color

### Canvas vs. Chrome

**Do:** Use a dark canvas (`#2C2C2C` default, user-adjustable) as the unlimited design surface. Surround it with light UI chrome (`#FFFFFF` panels, `#F5F5F5` toolbar). This polarity — dark canvas, light chrome — is Figma's most distinctive visual trait. The canvas is the user's domain; the chrome is the tool's domain. Keep them visually distinct at all times.

**Don't:** Use light mode for the canvas — the dark canvas anchors the experience and makes designs pop. Use the same background for canvas and chrome — they must be distinguishable at a glance. Add gradients or textures to the canvas background — it should be a completely neutral backdrop.

### Accent Colors

**Do:** Use purple (`#9747FF` territory) as the primary brand accent — for the Figma logo, primary CTA buttons, and active/selected states in the UI chrome. Use blue (`#2684FF`) strictly for canvas selection outlines and focus rings. Keep both accents sparing: purple appears 3-5 times per screen maximum, blue appears only on the selected element or active input.

**Don't:** Use multiple competing brand accent colors — one brand color, one selection color. Use purple on the canvas (it's exclusively a UI chrome color). Use blue in the UI chrome (it's exclusively a canvas selection color). Allow the two accents to overlap or appear in the same visual zone. Use accent as a decorative fill, wash, or background tint.

### Multiplayer Cursor Colors

**Do:** Assign each collaborator a distinct color from a fixed 6-color palette: red (`#E03E3E`), blue (`#2684FF`), green (`#0F9D58`), orange (`#F4B400`), purple (`#9747FF`), pink (`#E03E9F`). Make cursors bright and fully saturated — they must be visible against any canvas content regardless of background. Display the assigned color consistently for the entire session duration.

**Don't:** Assign the same color to two collaborators in the same file — color is their identity. Use muted or desaturated cursor colors — they must stand out against any canvas content. Change a collaborator's assigned color mid-session unless there is a direct palette conflict. Use colors outside the defined 6-color palette — the palette is fixed for recognition.

### Semantic Colors

**Do:** Use restrained semantic indicators: green (`#0F9D58`) for success/completion/ready states, amber (`#F4B400`) for warnings/in-progress, red (`#DB4437`) for errors/destructive actions. Apply at full saturation only for small status dots (8px). For backgrounds, reduce to 10-15% opacity. Keep semantic colors confined to the UI chrome — never use them on the canvas.

**Don't:** Use bright, saturated backgrounds for semantic states. Let semantic colors visually compete with the accent color. Apply semantic colors to large UI areas — they should be small indicators. Use the same red for error states that's used for the red multiplayer cursor — while they share the hex value, context distinguishes them; never display both near each other.

### Gradients

**Do:** Use gradients only in user-generated canvas content — they are a design tool the user wields. The UI chrome must never contain gradients: not in buttons, not in backgrounds, not in panels, not in borders, not in scrollbars. Figma's own interface is flat, precise, and unapologetically gradient-free.

**Don't:** Apply gradients to any UI chrome element under any circumstance. Use gradient buttons, gradient panel backgrounds, gradient borders, or gradient hover states. Add gradient overlays to toolbars, modals, or dropdowns. Use gradients decoratively in the product interface — the canvas is for decoration, the chrome is for function.

## Typography

### Type Scale

**Do:** Use 11-13px as the workhorse range for all UI chrome text. 11px for metadata, labels, helper text, and keyboard shortcuts. 12px for body text and panel content (the most common and important size). 13px for panel section headings, active tool labels, and emphasis within panels. Keep line-height tight at 1.3-1.4 — every pixel of panel space is precious real estate.

**Don't:** Use body text larger than 13px in UI chrome — the canvas gets the large type, the tool gets the small and efficient type. Use line-height below 1.3 — text at 11-12px becomes cramped and unreadable. Mix sizes arbitrarily or add intermediate sizes — every size must correspond to a specific and well-defined hierarchy level.

### Weight Discipline

**Do:** Use weight 400 (Regular) for body text, labels, metadata, and menu items. Use weight 500 (Medium) for toolbar labels, button text, navigation items, and active tool names. Use weight 600 (Semibold) for panel section headings and modal titles. That's exactly three weights covering the entire UI. No exceptions.

**Don't:** Use weight 700+ anywhere in the UI chrome — it is too heavy for small UI text sizes. Use Semibold (600) for body text — it reads as bold at 11-12px. Mix Regular and Medium weights within the same text block or component. Use weight alone as the differentiator between hierarchy levels — size and color should lead, weight should support.

### Canvas Typography

**Do:** Let the canvas have no typographic opinion of its own. The text the user places on the canvas is the user's typography, not Figma's. Provide excellent text rendering and comprehensive font management, but keep the tool's typographic identity strictly in the chrome, never bleeding onto the canvas.

**Don't:** Apply the UI type scale or conventions to canvas text. Restrict, override, or style user-created text to match the Figma brand. Use system fonts as defaults on the canvas — start with Inter (or the user's selected default) and let users choose freely. Let canvas typography visual language bleed into the UI chrome.

### Case and Formatting

**Do:** Use sentence case for all UI labels, menu items, button text, and panel headings. "Create component" not "Create Component." Sentence case reads faster at small UI sizes and avoids the visual aggression of title case. Use consistent formatting across all UI surfaces.

**Don't:** Use title case, all-caps, or small-caps for UI labels — they read slower and feel like shouting. Mix cases between similar elements (e.g., one menu item in title case, another in sentence case). Use all-caps for navigation categories or labels. Use different case conventions in different parts of the UI.

## Spacing & Layout

### Panel Density

**Do:** Embrace density in panels. Use an 8px implicit spacing grid for all panel interiors. Keep toolbar icons at exactly 32px center-to-center. Make list items 28-32px tall in the layers panel — deep hierarchies need efficient vertical space. The left and right panels must be information-dense to justify the screen footprint they consume. Every pixel of chrome must be working and justified.

**Don't:** Add generous padding to panel interiors — 8px is the standard. Make panel items tall or spacious — they need to accommodate deep layer hierarchies and extensive property lists. Use spacing that feels "airy" or "breathable" in chrome — air and breathing room belong on the canvas exclusively. Waste vertical space in the properties panel.

### Panel Widths

**Do:** Set left panel (layers) to 240px default width, resizable within 180-400px range. Set right panel (properties) to 240px default width, resizable within 200-400px range. Use exactly 0px gap between panels and canvas — panels should be flush against the canvas with a single 1px border as the sole separator. The canvas surface gets all remaining viewport space.

**Don't:** Make default panel widths wider than 280px — extra width comes directly from canvas space. Add padding or gaps between panels and canvas — they should abut directly with a border seam. Leave significant empty gaps between panels — screen real estate is at a premium. Allow panels to overlap the canvas.

### Canvas Spacing

**Do:** Make the canvas infinite and completely unconstrained — no fixed dimensions, no page boundaries, no scroll limits. Provide a subtle dot or line grid (8px or 10px default spacing) for spatial orientation — always visible but never distracting at standard zoom levels. Allow smooth, continuous zoom from approximately 1% to 64,000%. Center zoom transforms on the cursor position, not the viewport center.

**Don't:** Constrain the canvas to fixed dimensions or paginated layouts. Hide the grid by default — users need spatial orientation to navigate the infinite canvas. Use stepped zoom levels or discrete zoom stops — continuous zoom is the navigational signature. Zoom to the viewport center — zoom-to-cursor is the deeply expected behavior.

### Toolbar Layout

**Do:** Place the main toolbar at the top of the viewport at 40px height, spanning the full width. Group tools logically: selection and navigation tools first (left), then creation tools (shapes, pen, text) in the center, then utility tools (hand, comment) to the right. Show the active tool name prominently in the toolbar center. Right-align: project/file name, share button (primary CTA), Dev Mode toggle, and presentation button.

**Don't:** Make the toolbar taller than 40px — extra height is wasted space. Scatter tools across multiple disconnected bars or floating palettes. Hide the active tool name — users need constant confirmation of which tool is currently active. Place the share button, Dev Mode toggle, or presentation button in unexpected or inconsistent locations across the interface.

## Corner Radius & Shape

### UI Chrome Elements

**Do:** Use 4px radius on all buttons and form elements (inputs, selects, toggles, checkboxes). Use 6px radius on dropdown menus and context menus. Use 8px on modals and dialogs — this is the maximum radius in the UI. Use 2px on tooltips — they should feel sharp, precise, and utilitarian. Keep radii absolutely consistent across all instances of the same element type.

**Don't:** Use pill shapes (fully rounded containers, circular buttons). Use radii larger than 8px on any functional UI element. Mix radii on the same element type (e.g., some buttons at 4px, other buttons at 6px). Use 0px sharp corners on interactive elements — they need minimal softening to feel precise rather than harsh.

### Canvas Shapes

**Do:** Let the canvas be the unrestricted domain for any shape language the user wants — rounded rectangles, perfect circles, organic bezier paths, complex polygons, stars, arcs. The canvas has no shape opinion and imposes no constraints. Frame outlines: show as a rectilinear dashed or solid hairline stroke in the selection blue — the universal signal for "selected but not yet finalized."

**Don't:** Restrict canvas shape language to match the UI chrome conventions. Apply the UI's corner radius rules to canvas objects. Use shapes or styling in the UI that feel like they belong on the canvas instead. Blur the visual boundary between the tool (chrome) and the content (canvas).

### Avatars and Special Shapes

**Do:** Use circles exclusively for: color swatches in the fill/stroke picker (small, filled), user avatars in multiplayer cursors and face piles, status indicator dots (8px), and comment pin markers. These are the only fully rounded elements in the entire UI — they carry specific information, not decoration.

**Don't:** Use circles for buttons, containers, or any functional interactive UI element. Create circular badges, tags, or indicators beyond the four defined uses. Use rounded rectangles in contexts where a circle is the universally expected pattern (user avatars must be circular — a square avatar reads as broken or incomplete).

## Elevation & Shadows

### Flat Hierarchy

**Do:** Separate panels from the canvas using only 1px borders and background-color contrast — no shadows, no gradients, no blur. The left panel, right panel, and toolbar should feel like flat planes precisely adjacent to the canvas, not like floating panels hovering above or casting shadows onto it. Borders do all the structural work.

**Don't:** Add drop shadows to panel edges or canvas borders. Make panels feel like floating windows detached from the canvas surface. Use elevation or z-height to communicate panel hierarchy — background contrast between chrome and canvas is entirely sufficient. Create a layered interface that suggests depth and materiality — depth is the user's domain on the canvas, not the tool's.

### Floating Elements

**Do:** Use shadows exclusively and precisely on: the toolbar when explicitly detached from its top position (floating mode), dropdown menus and context menus, tooltips, and modals/dialogs. Keep shadows tight: 2-8px blur radius at very low opacity (10-15%). Shadows should be subtle enough to be functional cues without becoming visual features.

**Don't:** Use wide, diffused shadows that spread far from their source. Add colored or saturated shadows — all shadows should be black at low opacity. Display shadows on more than one floating element at a time — avoid shadow stacking. Make shadows prominent enough to be a consciously noticeable visual element.

### Modal Backdrop

**Do:** Use a flat, semi-transparent dark backdrop (`rgba(0,0,0,0.30)`) behind all modals and dialogs. No backdrop-filter blur — no blur, period. No gradient. No texture. No pattern. The backdrop should dim the interface behind the modal without drawing any attention to itself. The modal itself then sits above with an 8px radius and a subtle shadow.

**Don't:** Use backdrop-blur on modal overlays — it's trendy but unnecessary. Add gradient fades or patterned/textured backdrops. Make the backdrop too dark (>50% opacity) — the user should still vaguely perceive that their work exists behind the modal. Use the modal backdrop as a design surface or brand expression opportunity.

### Z-Index Discipline

**Do:** Use exactly three elevation levels across the entire product: Level 0 (flat panels and canvas — the base surface), Level 1 (dropdowns, tooltips, the floating toolbar when detached), Level 2 (modals and dialogs — topmost). No exceptions, no additions. This discipline keeps the UI mentally predictable and prevents the z-index conflicts that plague complex applications.

**Don't:** Create ad-hoc elevation levels for specific components that don't clearly fit levels 0-2. Use z-index values that are not clearly and consistently mapped to one of the three levels. Allow modals to open dropdowns that open tooltips — nesting UI at Level 2 creates unsolvable z-index stacking problems.

## Canvas & Interaction

### Selection Behavior

**Do:** Implement the click-depth pattern consistently everywhere: click once to select (shows blue outline with eight resize handles), double-click to enter (descend into a group or frame), Escape to exit (ascend back up to the parent context). This click-depth model is the primary navigation paradigm for the canvas — it must behave identically in every context.

**Don't:** Use single-click to enter groups — the two-level click model is deeply ingrained in user muscle memory. Auto-enter groups or frames on first selection. Make the Escape key behavior inconsistent (sometimes exiting one level, sometimes deselecting entirely). Bypass the depth navigation model with keyboard shortcuts that produce unexpected state changes.

### Zoom and Pan

**Do:** Pan the canvas by click-dragging on any empty canvas area (not on a frame or object). Zoom with Cmd/Ctrl + scroll wheel, using smooth continuous zoom with no discrete steps. Always center the zoom transform at the cursor position — the point under the cursor must remain under the cursor throughout the zoom operation. Display the current zoom percentage in the bottom status bar at all times. Make zoom feel buttery smooth at all speeds.

**Don't:** Use stepped zoom levels or discrete zoom increments. Zoom toward the viewport center — zoom-to-cursor is the expected and correct behavior. Make zoom feel sluggish, choppy, or computationally heavy — zoom is the most frequent navigational action. Hide the zoom percentage — users need to know their current scale for precise work.

### Auto-Layout Indicators

**Do:** Display direction handles in blue (`#2684FF`) — horizontal or vertical arrows indicating the primary layout axis and direction. Display gap and alignment handles in pink (`#E03E9F`) — small diamond or line indicators positioned between and around child elements. Make all auto-layout handles interactive: drag to adjust spacing values directly, click to cycle through alignment options. Handles appear on hover and persist while interacting.

**Don't:** Use the same color for direction handles and gap/alignment handles — they control fundamentally different properties and must be visually distinguishable. Hide auto-layout indicators until active interaction — they provide critical information at rest. Make handles too small to click, drag, or accurately target with a cursor. Display conflicting or overlapping handles.

### Right-Click Menu

**Do:** Surface the most common canvas operations in the right-click context menu: cut/copy/paste, duplicate, delete, group/ungroup, bring to front/send to back, lock/unlock, create component. Mirror the toolbar's logical grouping in the menu structure. Position the menu at the cursor — no travel distance. Make submenus (like "Bring to front") expand instantly to the side.

**Don't:** Show a different set of actions in the right-click menu than what's available in the toolbar. Include actions that are rarely performed or require confirmation — the context menu is for speed. Animate the menu appearance with delay or bounce — it should appear instantly. Position the menu far from the cursor.

## Multiplayer & Collaboration

### Cursor Display

**Do:** Render each collaborator's cursor as a filled-color ring (20px diameter) with a small downward-pointing pointer. Place the collaborator's avatar image inside the ring. Show the collaborator's name as a small label above the cursor on hover or persistent if space allows. Move cursors smoothly with a subtle lerp (approximately 100ms) — not instant, not laggy, just right.

**Don't:** Render cursors without avatars — the face is the primary identifier, not the color. Make cursors smaller than 20px — they become invisible on large or complex canvases. Update cursor positions with teleportation (jarring) or with excessive lag (disorienting). Show only the cursor position without indicating which collaborator's viewport is visible.

### Viewport Sharing

**Do:** Display each collaborator's viewport as a subtle colored rectangle on the canvas — showing exactly what portion of the design they're currently looking at. Use the same color as their cursor at very low opacity (5-10%). This answers "what can they see?" without requiring verbal coordination.

**Don't:** Hide collaborator viewports — they are essential spatial awareness in multiplayer contexts. Make viewport rectangles opaque or highly visible — they should be background-level subliminal. Use a different color for viewports than for cursors — they represent the same collaborator.

### Comments and Feedback

**Do:** Anchor comments to specific canvas positions — a numbered circle pin on the canvas, connected to a threaded conversation in the right panel. Show comment pins at all times (not just on hover) — they are part of the design's state. Use a sequential numbering system within each file. Highlight the canvas pin when the corresponding comment thread is active.

**Don't:** Show comments in a disconnected feed without canvas context. Hide comment pins behind a toggle or hover state — they are information, not decoration. Use randomness (non-sequential IDs like GUIDs) for comment pin labels. Place comments that cannot be visually connected to their canvas subject.

### Face Piles

**Do:** Show a face pile (overlapping user avatars) in the top bar to indicate who is currently viewing the file. Stack avatars with a slight negative overlap (-4px to -6px). Show a count badge ("+3") when there are more collaborators than display slots. Make avatars clickable to show the full collaborator list.

**Don't:** Show face piles for single-user files. Use large avatars that consume toolbar space. Hide the face pile behind an interaction — it should be persistently visible. Show only a count number without avatars — faces communicate identity far better than numbers.

## Component System

### Component Indicators

**Do:** Mark component instances in the layers panel with a distinct filled-diamond icon (purple or brand-color). Mark main (master) components with a four-diamond icon. Show component names in the layers panel in a slightly different text treatment (medium weight vs. regular). Display the component library name as a subtle prefix or tooltip.

**Don't:** Use the same icon for instances and main components — they have fundamentally different behaviors. Make the component indicator so subtle it's difficult to spot in a deep layer list. Overload the layers panel with verbose component metadata — keep the identifier simple and scannable.

### Variant Controls

**Do:** Render component variant properties as interactive controls in the right properties panel: toggles for boolean properties (on/off switches), segmented controls for small enumerated sets (2-4 options), dropdowns for larger enumerated sets (5+ options). Controls should feel physical and satisfying to interact with — like switches, not data entry.

**Don't:** Use free-text input for variant selection — it should be a constrained choice. Render variant controls as a generic form — they should feel specific to component configuration. Hide variant controls behind an expand/collapse that's collapsed by default — they are primary selection controls.

## Dev Mode

### Mode Transition

**Do:** Toggle between Design and Dev Mode with a prominent, persistent switch in the top toolbar. Make the transition instant — no animation, no loading spinner. Transform the right panel from design properties to developer-focused information. Keep the canvas content identical — the designs do not change between modes.

**Don't:** Animate the transition between Design and Dev Mode — it should feel like a layer switch, not a navigation. Reload or re-render the canvas. Change the left panel behavior significantly — the layers panel should remain familiar. Hide the toggle behind a menu or settings panel.

### Code Panel

**Do:** Display syntax-highlighted code (CSS, SwiftUI, or Compose depending on context) for the currently selected element. Use a dark background for the code display. Make all code selectable and copyable with a single "Copy" button. Show variable/token names instead of raw values when design tokens are connected. Format code cleanly with proper indentation.

**Don't:** Show unformatted or compressed code. Display code in the same view style as design properties — it should feel like a developer tool, distinct from the design panel. Use system default colors for syntax highlighting — match a recognizable code theme. Mix design and development information in the same panel section.

### Measurements

**Do:** Display spacing measurements as red dimension lines rendered directly on the canvas — lines connecting the selected element to its nearest neighbors, with pixel values floating alongside. Show measurements automatically on selection (no toggle needed). Use clear, readable number formatting — no decimals for whole pixels.

**Don't:** Show measurements only as text values in a panel — the visual red lines on canvas are the signature that makes Dev Mode useful. Require the user to activate a measurement tool separately. Display imprecise or rounded measurements — developers need exact values.

## Motion

### Timing

**Do:** Use 150ms for dropdowns, context menus, and tooltips. Use 200ms for modal open/close. Use 100ms for hover transitions (if animated at all). Make panel resize instant (0ms) — raw performance feel. Keep all transitions short and consistent. Motion should never be the slowest part of an interaction.

**Don't:** Use transitions longer than 250ms anywhere. Vary timing for similar interactions — consistency builds muscle memory. Make motion the user waits on before they can act. Use slow, deliberate animations that call attention to themselves.

### Easing

**Do:** Use ease-out for elements appearing (entrances). Use ease-in for elements disappearing (exits). Use standard CSS easing functions — no custom cubic-bezier curves. Make canvas zoom use a direct, linear response — no smoothing, no easing.

**Don't:** Use linear easing for anything interactive — it feels mechanical and unpolished. Use spring physics or bounce easings (the subtle comment pin drop bounce is the one permitted exception). Create custom easing curves that feel unique but inconsistent with the rest of the UI.

### Canvas Animations

**Do:** Animate the marching ants on selection outlines continuously — a subtle dashed-stroke-offset animation that cycles smoothly. Animate the canvas grid dots/lines subtly as the user zooms — the grid density changes should feel fluid. These are the only canvas-level animations.

**Don't:** Animate anything on the user's canvas content — the designs must render exactly as created. Add motion to frame borders, object positions, or canvas panning. Animate zoom transitions with ease curves — zoom should be a direct 1:1 mouse response.

## Voice & Copy

### Tool Language

**Do:** Use concise, verb-noun patterns for all commands and menus: "Create component," "Copy properties," "Paste to replace," "Group selection." Make tooltips instructional and specific: "Draw a rectangle" not "Rectangle tool" or "Create a shape." Use active, imperative language everywhere in the tool interface.

**Don't:** Write tooltips that are generic or circular ("Create" for the create button). Use marketing language in tool copy. Write menu items as noun-only labels without the action — "Rectangle" tells you what, "Draw rectangle" tells you what and how. Make the user interpret or guess what a tool does.

### Error and Empty States

**Do:** Keep error messages neutral, specific, and actionable: "The file couldn't be saved. Check your connection and try again." Show error states with a clear path forward — never leave the user stranded. Use empty states to suggest the next action: "No components yet. Create one from any frame, group, or layer."

**Don't:** Write error messages that sound alarmist or catastrophic. Blame the user for errors. Leave empty states without a suggested next action. Use cutesy or overly casual language in error states — the user is likely frustrated, and whimsy doesn't help.

### Brand Voice

**Do:** Maintain a professional, confident, capable voice in all product copy. Let playful moments appear only in designated brand spaces: release notes, community interactions, the "?" help menu, onboarding welcome screens. The ratio should be approximately 95% utilitarian tool language to 5% brand warmth.

**Don't:** Inject brand playfulness into critical UI copy. Write tooltips with personality that distracts from their instructional purpose. Make the product voice feel like marketing copy. Use exclamation marks anywhere in the functional UI.

### Case and Grammar

**Do:** Use sentence case for everything: labels, headings, menu items, button text, and tooltips. "Create component" not "Create Component." Always write in complete, grammatically standard English. Keep tooltips to one line when possible. Match the Figma tone: concise, helpful, confident.

**Don't:** Use title case or all-caps for any UI text. Mix case styles between related elements. Write in sentence fragments when a full thought is clearer. Use non-standard grammar or "designer slang" in tool text. Make the copy feel written by a different team from the one that built the tool.

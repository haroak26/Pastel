# Figma design language

## When to reach for this reference
Use this reference when designing creative tools, collaboration platforms, whiteboarding interfaces, or any product where the UI must disappear so the user's work takes center stage. Figma's language is ideal for canvas-based applications, design systems, and multiplayer experiences where visual cues for collaboration are as important as the editing tools themselves.

## Brand personality
Playful precision — the rare combination of a tool that feels both serious about craft and genuinely fun to use. Figma's personality is that of a skilled collaborator: competent but not cold, opinionated but not rigid, social but not distracting. There is an undercurrent of delight (the cursor chat bubbles, the avatar rings, the toolbar micro-interactions) that signals this is a tool made by people who love making tools for people who make things.

## Color philosophy
Color is used with exceptional discipline. The UI chrome sits in a neutral gray range (warm grays, not cool) that recedes completely — `#FFFFFF` for the canvas, `#F5F5F5` for panels, `#E5E5E5` for borders, `#2C2C2C` for icons. Color enters only where it carries meaning: component selection outlines, multiplayer cursor markers, frame highlighting. The palette feel is synthetic and precise, like pigment straight from a tube — primaries, secondaries, and carefully chosen accent hues that are fully saturated without being garish. Never use gradients in chrome. Never introduce decorative color.

## Typography approach
Figma uses Inter (or a similar geometric sans) as its UI typeface — chosen for its excellent legibility at small sizes and neutrality. UI text runs at 11px–13px as the workhorse size, with 11px for labels and metadata, 12px for body and panel content, 13px for headings. Line-height is tight (1.3–1.4) to maximize panel space. The font-weight range is narrow: Regular (400) and Medium/Semibold (500–600) cover nearly everything. Bold is reserved for active tool states. The canvas itself has no typographic opinion — it defers entirely to whatever the user places on it.

## Spacing & density
The UI is dense by necessity — toolbars, layer panels, and property inspectors all compete for screen real estate — but the density feels organized, not cluttered, because of rigid alignment. Panel interiors use 8px spacing grids. Toolbar icons sit on a 32px center-to-center rhythm. The left and right panels use 240px–280px widths. Between-panel gaps are 0px (flush-seamed with a 1px border). Canvas area gets everything that remains. The message: every pixel of UI is intentional and justified.

## Corner radius & shape language
Goometric purity: 6px rounding on panels and modals, 4px on buttons and inputs, 2px on tooltips and badges. Shape language is rectilinear and efficient — circles for avatars and color swatches are the only fully rounded elements. Frames and selection outlines on the canvas use a distinct dashed or solid hairline stroke in a single accent color, creating the visual signature of "selected but not committed." This tension between precise UI rectangles and the freeform canvas is the core shape dynamic.

## Elevation & depth
Flat hierarchy with 1px borders doing all the structural work. Drop shadows appear in exactly one place: the toolbar floating above the canvas, using a tight 0px-2px-8px shadow at low opacity. Modals use a full-canvas overlay at 30% black. There is no layered elevation, no nested cards, no z-depth games. The interface is a set of panels arranged in a flat plane around the infinite canvas — depth is the user's domain, not the chrome's.

## Iconography & imagery
Icons are entirely geometric — circles, rectangles, lines, polygons — drawn at 16px with 1.5px strokes in the #2C2C2C icon color. They feel like they could have been made in Figma itself. The icon set is consistent and restrained: tool icons, property icons, and action icons share the same visual language. Imagery outside the canvas is non-existent. No photography, no illustration, no decorative graphics. The canvas is where imagery belongs; the UI is purely instrumental.

## Signature patterns
The multiplayer cursor — colored rings with user avatars that follow real-time collaborators — is Figma's most distinctive pattern. The floating toolbar that auto-repositions relative to the selection. The right-click canvas menu that mirrors the toolbar layout. Component variant toggles that feel like physical switches. The undo-redo friendliness expressed through granular history visible in the UI. The "click-once-to-select, double-click-to-enter" nesting pattern. The auto-layout constraints that communicate physically through blue/pink interface handles.

## Motion philosophy
Motion is brief, responsive, and physically motivated without being literal. Toolbar dropdowns use 150ms ease-out with a subtle 4px vertical slide. Selection outlines animate with marching ants (dashed stroke offset). Canvas zoom is buttery smooth and continuous — no stepped zoom levels — because smooth zoom is the core navigational motion. Cursor movements from collaborators animate with a gentle lerp (not instant, not laggy). Panel resize is live and responsive with no animation, just raw performance. No decorative motion exists; every animation answers a functional question ("where did this come from?" or "what just changed?").

## Voice & copy tone
Concise and utilitarian with moments of warmth. Tooltips are instructional and specific: "Draw a rectangle" not "Create a shape." Menu items use verb-noun patterns: "Create component," "Copy properties." Error states and empty states are neutral and helpful, never cute. The occasional playful flourish (the "?" help menu, release-notes copy) adds personality without compromising the tool's professional credibility. Sentence case everywhere, even in headings.

## Explicitly do not
- Do not reproduce Figma's logo, wordmark, or any trademarked assets.
- Do not copy Figma's UI copy, taglines, or branded messaging verbatim.
- This reference describes a design language to draw inspiration from, not a license to clone Figma's product or visual identity.

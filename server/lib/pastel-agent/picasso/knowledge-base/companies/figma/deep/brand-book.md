# Figma — Brand Book

## Brand Personality

Figma feels like a **creative playground that's also serious about craft**. It balances playful precision with professional capability. The tool is made by designers for designers — and that insider understanding shows in every interaction.

Three words: **Playful. Precise. Collaborative.**

The personality is that of a skilled collaborator: competent but not cold, opinionated but not rigid, social but not distracting. There is an undercurrent of delight (the cursor chat bubbles, the avatar rings, the toolbar micro-interactions) that signals this is a tool made by people who love making tools. Yet it never slips into whimsy at the expense of productivity.

The brand co-exists comfortably with the creative community it serves. Figma doesn't just host community content — it treats community as a first-class citizen of the product itself, blurring the line between tool and platform.

## Tone of Voice

Friendly, inclusive, and empowering. The copy speaks to a global design community and makes everyone feel welcome.

- **Do:** "Nothing great is made alone." "Create a team." "Explore the community."
- **Don't:** "Start designing now!" "Build your dream UI."

Playful moments appear in product copy — release notes, empty states, tooltips — but never at the expense of clarity. The occasional "wink" is earned by the tool's otherwise impeccable professionalism.

Instructions use verb-noun patterns: "Create component," "Copy properties," "Publish library." Sentence case everywhere. No exclamation marks in functional UI. Developer-speak (Dev Mode) is precise and technical, matching the audience shift without breaking the overall brand voice.

## Visual Identity

### Dark Canvas + Light Chrome

The signature contrast: a dark gray canvas (`#2C2C2C` or `#E5E5E5`, user-adjustable) where designs live, surrounded by light gray UI chrome (`#FFFFFF` panels, `#F5F5F5` toolbars). This is Figma's most distinctive visual trait — the canvas is infinite, dark, and the user's domain; the chrome is bounded, light, and the tool's domain.

### Purple as Identity Anchor

The primary brand accent is a distinctive purple (historically near `#9747FF` or a vibrant violet). It appears in:
- The Figma logo
- Primary CTA buttons
- Active/selected states
- Focus rings
- Brand marketing moments

Purple says "creative" without saying "artsy." It's the color of imagination but with a professional edge — not pastel lavender, not corporate blue.

### Geometric Precision

Shapes are rectilinear and efficient. The UI is built from rectangles with clean corners. The canvas is an infinite grid. Selection outlines use precise hairline strokes. The overall aesthetic is precise without being cold — warm grays in the chrome prevent a clinical feel.

## Typography

Inter (or similar geometric sans) for all UI. Chosen for its excellent legibility at small sizes and complete neutrality — it doesn't compete with whatever the user puts on the canvas.

- **UI workhorse:** 11-13px. 11px for labels and metadata, 12px for body and panel content, 13px for headings and active tool states.
- **Line-height:** Tight at 1.3-1.4 — every pixel of panel space is precious.
- **Weight range:** 400 (Regular) and 500-600 (Medium/Semibold) cover nearly everything. Bold (700) is reserved for active tool states only.
- **Canvas:** Has no typographic opinion — it defers entirely to whatever the user places on it. This is the fundamental distinction: UI type is Figma's voice; canvas type is the user's voice.

## Spacing

The UI is dense by necessity — toolbars, layer panels, and property inspectors all compete for screen real estate — but the density feels organized, not cluttered, because of rigid alignment.

- **Panel interiors:** 8px spacing grid
- **Toolbar icons:** 32px center-to-center
- **Left panel (layers):** 240px default width
- **Right panel (properties):** 240-280px default width
- **Between panels and canvas:** 0px gap, flush-seamed with a 1px border
- **Canvas:** Everything that remains

The message: every pixel of UI is intentional and justified. Nothing is decorative padding.

## Color Philosophy

Color is used with exceptional discipline. The UI chrome sits in a neutral gray range that recedes completely. Color enters only where it carries meaning.

- **Canvas:** `#2C2C2C` (dark gray, user-adjustable)
- **Panel backgrounds:** `#FFFFFF` or `#F5F5F5`
- **Borders:** `#E5E5E5` (1px)
- **Icons:** `#2C2C2C` (match canvas for consistency)
- **Text:** `#333333` primary, `#888888` secondary
- **Accent:** Purple (`#9747FF` territory) — used only on primary actions, active states, selection outlines, focus rings
- **Multiplayer cursors:** Assigned colors from a fixed palette (red, blue, green, orange, pink, purple) — saturated but not garish
- **Selection:** Distinct blue outline (`#2684FF` or similar)

No gradients in chrome. No decorative color. No accent backgrounds or washes. Color carries information or it doesn't appear.

## Key Patterns

### Infinite Canvas
The design area has no fixed boundaries. Pan, zoom, and scroll are the primary navigation motions. The canvas is a grid (`#444444` on `#2C2C2C2`), subtly present to provide spatial orientation without distraction.

### Floating Toolbar
The main toolbar floats at the top of the screen, separated from panels by background contrast. It auto-repositions relative to the selection context. It's always accessible but never imposing.

### Properties Panel (Right)
Context-aware, showing properties relevant to the current selection: position, size, rotation, constraints, auto-layout, fill, stroke, effects, export. The panel scrolls independently from the canvas.

### Layers Panel (Left)
Hierarchical tree view of all frames, groups, and objects on the current page. Depth is indicated by indent (16px per level) with disclosure triangles. Drag-and-drop reordering. Lock/visibility toggles. Component instances are marked with a distinct diamond icon.

### Multiplayer Cursors
The most iconic Figma pattern: colored cursor rings with user avatars that track real-time collaborators. Each collaborator gets an assigned color. Their viewport is visible as a subtle colored rectangle. This makes collaboration feel tangible and social without being intrusive.

## What Makes Figma Figma

1. **The dark canvas / light chrome contrast.** No other tool commits to this specific visual polarity so thoroughly.
2. **Purple as the creative signifier.** It's not corporate blue, not generic gray — purple says "design tool" in a single color.
3. **Multiplayer DNA.** The colored cursors, avatar rings, and collaboration features aren't add-ons — they are the foundation. Figma is multiplayer-first.
4. **Community as product surface.** Community files, plugins, and templates are browsable from within the tool itself. The line between "using Figma" and "being in the Figma community" doesn't exist.
5. **Dev Mode as a first-class mode.** A complete toggle that transforms the interface for a different persona — developers — with code inspection, measurements, and CSS output.

## Signature Moves

- **Dark canvas with light UI** — the immediate visual signature
- **Purple accent** — appears in the logo, CTAs, selected states, and nowhere else
- **Floating toolbar** — always present, context-aware, minimal
- **Multiplayer cursors with avatars** — colored rings showing exactly who is where
- **Dev Mode toggle** — switches the entire right panel to code inspection, measurements, section-level annotations
- **Component variant toggles** — property controls that feel like physical switches
- **Auto-layout handles** — blue (direction) and pink (gap/alignment) interface indicators on the canvas
- **Right-click canvas menu** — mirrors the toolbar layout for efficiency

## Design Principles

### The Canvas Is Sacred
The canvas is the user's domain — Figma never imposes itself there. The canvas background is dark and neutral, the grid is subtle, and Figma's own UI chrome never encroaches into the canvas space. Frames and objects are rendered exactly as the user designed them. There are no Figma-branded watermarks, no "Made with Figma" badges, no UI elements floating over the user's work. The tool serves the canvas; the canvas never serves the tool.

### Multiplayer First, Not Multiplayer Added
Collaboration is not a feature bolted onto a single-player tool — it is the foundational assumption. Every design decision considers the multiplayer context: can two people edit the same property simultaneously? Can cursors coexist without visual chaos? Can comments anchor precisely to canvas positions? The colored cursors, viewport indicators, and face piles are not decorative — they are essential infrastructure for a tool where being alone in a file is the exception, not the rule.

### Tools That Feel Physical
Figma's tools have a tangible quality. The selection rectangle snaps with a subtle resistance. Auto-layout handles feel like rubber bands. Component variants toggle like physical switches. Vector points have weight and magnetism. This physicality makes the abstract canvas feel concrete — you are not manipulating data; you are moving objects in space.

### The Right Panel Is Context
The properties panel is the most important UI surface after the canvas. It is ruthlessly context-aware: select a rectangle and see fill/stroke/corner radius; select text and see font/weight/line-height; select a frame and see auto-layout/constraints. There is no generic "inspector" — the panel transforms completely based on what is selected. This means every pixel of the panel is relevant to the current task. Nothing is shown "just in case."

### The Browser Changes Everything
Figma is a web application that feels native. This shapes every design decision: loading must be instant because it's a URL click away, not an app launch. Sharing is a link, not a file. Version history is automatic, not "Save As." The browser constraint (no local file system, URL-based navigation, tab-based multitasking) becomes a design advantage — it forces simplicity and speed.

## User Experience Philosophy

### Zero Friction Start
Go to figma.com, click "New file," start designing. No install. No splash screen. No project creation wizard. No template picker (unless you want one). The default new file is a blank canvas with a single "Page 1" — and you are already in it, ready to draw. This is the opposite of tools that require you to choose a document type, a template, a canvas size, and a color profile before you can begin.

### The File as a URL
Every Figma file has a URL. Sharing is copying that URL. Permissions are set on the URL. Embedding is an iframe with that URL. This is so obvious to web-native users that it barely registers as a design decision — but it fundamentally shapes the product architecture. The file is not a file; it is a place on the internet.

### Undo Is Infinite and Reliable
Figma's undo is legendary among design tools. It goes back beyond the current session — all the way to the beginning of the file's history. You can undo someone else's changes. You can undo an undo. The undo stack is visible and navigable. This creates psychological safety: nothing is permanent, nothing is risky, experiment freely.

### The Menu Bar Is Hiding in Plain Sight
Figma's main menu (File, Edit, View, etc.) is hidden behind the Figma logo in the top-left corner — a single hamburger-style interaction that reveals the full menu. This saves valuable toolbar space while keeping every command accessible. Power users learn keyboard shortcuts; new users discover the menu by clicking the logo — a natural exploration path.

### Components Are the Language
Figma treats components not as a feature but as the primary way objects communicate their nature. A component instance looks different in the layers panel (diamond icon). Component variants surface their properties as interactive controls in the right panel. Published components propagate updates across files. The component model teaches users to think systematically — a design tool that trains designers to be design systems thinkers.

## Dark Canvas Philosophy

The dark canvas is Figma's most distinctive visual decision. Why?

**Makes designs pop.** User-created frames are typically light (white, off-white, light gray) — mimicking the screens and surfaces they represent. A dark canvas makes these frames glow, creating a natural focal point. On a light canvas, white frames would blend into the background; on a dark canvas, they read as objects in space.

**Reduces eye fatigue.** Designers spend 6-10 hours per day looking at the canvas. A dark background emits less light, reducing cumulative eye strain. The light UI chrome provides sufficient contrast for reading text and identifying tools, while the dark canvas provides rest for the eyes during the primary activity (looking at designs).

**Creates spatial orientation.** The dark canvas + light frames pattern teaches the eye where designs begin and end. The canvas is infinite, but the frames are bounded and visible. The subtle grid provides a spatial reference — you always know where you are in the infinite plane.

**Signals "creative tool."** Dark backgrounds with colorful, luminous content are the visual language of creative tools — think Adobe Premiere, Ableton Live, Blender. Figma uses this association to say "this is a tool for making things" without saying a word.

## Accessibility Commitments

- High contrast UI text (dark gray on white panels passes WCAG AA)
- Canvas zoom allows magnification up to 64,000% — supporting low-vision designers
- Keyboard shortcuts for every action — supporting designers who cannot use a mouse
- Multiplayer cursors with distinct colors — helping color-blind collaborators (the palette is chosen for CVD distinguishability)
- Focus indicators on all interactive elements
- Screen reader support for the layers panel and properties panel
- Color blindness simulation mode (available via community plugins)

## Content Strategy

Figma's content strategy blurs the line between product and community:
- **In-product education:** The "?" help menu links to documentation, but also to community files that teach Figma techniques
- **Community as content:** Templates, UI kits, icon sets, and design systems created by the community are browsable from within the product — they are content, not just features
- **YouTube and social:** Figma's video content is tutorial-first, feature-announcement-second. "How to use auto-layout" videos outnumber "What's new in Figma" videos 10:1.
- **Release notes:** Written with personality — playful, insider, acknowledging the community. This is the one place Figma allows itself to be informal.
- **Config (conference):** The annual conference extends the brand into physical/digital space — the same purple accent, the same typography, the same tone of voice, but with the energy turned up for a live audience.

## Brand Moments

Figma's brand expression lives in specific, contained moments:
- **The Figma logo:** Purple, geometric, the triangle-and-circle mark. Appears in the toolbar, on the website, in the favicon. Never on the canvas.
- **Config and events:** Purple dominates — stage design, presentation slides, swag. The playful side of the brand comes out: brighter colors, bolder typography, community celebration.
- **Blog and social:** Clean typography on white, purple accent sparingly, screenshots and GIFs showing product features. Voice is warm but professional.
- **Community showcase:** Featured plugins and files get editorial treatment — larger preview images, creator attribution, curated collections. This is Figma celebrating its users' work.
- **Error pages (404):** One of the few places Figma uses illustration — geometric shapes and simple characters in the purple palette. Playful but not silly.

In all cases, the brand stays true to the core tension: playful precision. The tool is serious; the community is joyful. Figma is both.

## What Makes Figma Figma (Expanded)

Beyond the five signature characteristics:

6. **The collapse of tool and platform.** Figma is the design tool AND the place where design files live AND the place where the design community gathers. These are not separate products — they are layers of the same experience. You can go from editing a component to browsing community remixes of that component to watching a tutorial about that component — all without leaving Figma.

7. **The respect for the user's work.** Figma never brands the user's output. No "Exported from Figma" watermarks. No Figma-branded share pages. The user's designs belong to the user. This respect extends to data portability — .fig files can be exported, APIs provide full access.

8. **The teaching through interface.** Auto-layout handles teach CSS flexbox. Constraints teach responsive design. Component variants teach design tokens. Dev Mode teaches the handoff. Figma's interface doesn't just enable design — it educates designers about systematic thinking.

9. **The continuous, not disruptive, evolution.** Figma introduces major features (auto-layout, components, Dev Mode) without breaking existing workflows. The interface adapts — a new panel section appears, a toggle is added to the toolbar — but the fundamental experience (canvas, left panel, right panel, toolbar) remains stable. Users are never forced to re-learn the tool.

10. **The browser as a superpower.** Because Figma runs in the browser, it can do things native apps cannot: embed in any webpage, share with a URL, run on any OS, update silently, and achieve zero-friction collaboration. What started as a technical constraint became the product's defining advantage.


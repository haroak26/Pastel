# Vercel — Do / Don't

## Color

### Dark Mode First

**Do:** Design every screen, component, and state in dark mode first. Use near-black backgrounds as the foundation: `#0A0A0A` for the deepest page backgrounds, `#111111` for surfaces like sidebars, `#1A1A1A` for raised cards and containers, `#222222` for hover states, `#2A2A2A` for active/pressed states. Derive light mode as a cautious inversion — light mode is secondary, dark mode is the source of truth.

**Don't:** Design light-mode-first and then invert to dark mode — the product was conceived in the dark. Use pure black (`#000000`) anywhere — the subtle near-black (starting at `#0A0A0A`) is intentional and prevents OLED crushing on dark-mode displays. Use blue-ish or green-ish dark grays — the palette should be strictly neutral with no color undertone.

### Accent Discipline

**Do:** Use a single sharp accent across the entire product. In dark mode, this accent is typically white (`#FFFFFF`) for the highest-priority interactive element — primary CTA buttons and the main action per screen. Use a distinctive highlight color (Vercel's signature purple/pink, roughly `#FF0080`) for links, focus rings, selected states, and secondary interactive emphasis. This accent should appear on exactly 3-5 elements per screen maximum.

**Don't:** Use multiple competing accent colors — one accent, period. Add a secondary accent palette. Apply the accent color decoratively as a background tint, section divider, or card border. Let the accent appear on more than 5 elements per screen — it should be a laser, not a floodlight. Use the accent without deliberate intentionality — every appearance should be justified.

### Monochrome Foundation

**Do:** Carry 95% of the interface with the monochrome neutral palette — near-blacks for backgrounds, whites-to-light-grays for text, semi-transparent whites for borders. The monochrome structure should be so complete that the interface is fully usable and readable even with all accent color removed. Text hierarchy, spacing, and typography do the heavy lifting.

**Don't:** Rely on color to communicate structure, hierarchy, or meaning. Use the accent color as a structural element (colored section backgrounds, colored cards). Add a "pop of color" just to make the interface feel less monochrome — the restraint is intentional and deliberate. Let the interface feel like it's missing something without color.

### Semantic Colors

**Do:** Use muted, desaturated semantic indicators: a subdued green for success/ready/deployed states, a subdued amber for building/in-progress/pending states, a subdued red for failed/error/canceled states. Render semantic colors as small filled status circles (8px) next to labels, or as very subtle 10-15% background tints on status badges. Semantic colors should never compete with the monochrome structure or the single accent.

**Don't:** Use bright, saturated red, green, or amber — they feel like alarms on a dark interface. Apply semantic colors to large surface areas. Use semantic colors without an accompanying text label — color is never the sole information carrier. Create a colorful badge or tag system — status badges should be monochrome with only the 8px dot carrying color.

### Gradients in Dark Mode

**Do:** Use gradients only in carefully chosen brand moments: hero sections on the marketing site, loading state backgrounds, or geometric brand visuals. When gradients appear, use the accent color as a sharp point and transition to near-black — never to another color. Keep gradient usage extremely rare: one gradient per page, and only on designated brand pages.

**Don't:** Apply gradients to functional UI elements — no gradient buttons, no gradient cards, no gradient inputs, no gradient borders. Use gradients as a background treatment for dashboards. Create multi-stop gradients that cycle through colors. Let gradients become a recurring visual signature in the product — they are a spice, not a staple.

### Light Mode Derivation

**Do:** Derive light mode by inverting the dark palette: `#FFFFFF` for page background, `#FAFAFA` for surfaces, `#F5F5F5` for raised cards, `#EBEBEB` for hover, `#E5E5E5` for active. Text inverts from white-to-gray to black-to-dark-gray. Borders go from semi-transparent white to semi-transparent black. Keep the same relative contrast ratios between elements.

**Don't:** Create a new palette for light mode — it must be the mathematical inversion of dark mode. Change the saturation or tone of colors between modes. Make light mode feel like a fundamentally different product. Use different accent colors in light mode — the accent should be the same hex value (or a close equivalent if contrast demands).

## Typography

### The Geist Identity

**Do:** Use Geist (sans-serif) as the primary UI typeface on all surfaces — product, documentation, and marketing. Geist is Vercel's custom typeface and the single most distinctive visual element of the brand. Use Geist Mono for all code, terminal output, commit hashes, log entries, and technical data displays. The Geist family is the typographic backbone — it should be present on every surface.

**Don't:** Substitute another sans-serif for Geist in production — while Inter or similar geometric sans can serve as fallbacks, the brand identity depends on Geist being the primary face. Use a different monospace font for code unless Geist Mono is unavailable. Mix serif or display typefaces with Geist — the system should be pure Geist + Geist Mono.

### Type Scale

**Do:** Use a compact scale: 24px (weight 600) for page titles and hero headlines, 20px (weight 600) for section headings, 16px (weight 600) for card titles and subsection headings, 16px (weight 400) for large body text, 14px (weight 400) for standard body and navigation, 13px (weight 400) for compact body and table cells, 12px (weight 400) for captions and metadata. Add subtle negative letter-spacing to headings: -0.03em at 24px, -0.02em at 20px, -0.01em at 16px.

**Don't:** Use body text at sizes below 13px — legibility demands minimum readable sizes. Use heading sizes below 16px — they lose their hierarchy role. Skip the negative letter-spacing on headings — it's a subtle but important refinement. Add intermediate sizes between the defined scale stops.

### Weight Usage

**Do:** Stay within weights 400-600 in functional UI. Use 400 (Regular) for body text, labels, metadata, table cells. Use 500 (Medium) for button text, navigation items, and emphasis within body. Use 600 (Semibold) for all headings, card titles, and section headers. This narrow weight range creates a technical, precise typographic voice.

**Don't:** Use weight 700+ in functional UI — it reads as bold and aggressive in a dark interface. Use 400 for headings — they need more presence. Use 600 for body text — it reads as bold, not body. Introduce weight 300 or lighter — thin weights are illegible on dark backgrounds at UI sizes.

### Code Typography

**Do:** Use Geist Mono at 13px for code blocks and inline code. Set code line-height to 1.5 for readability. Apply a subtle background highlight (`#1A1A1A` or the code background token) to inline code spans to distinguish them from body text. Show code block backgrounds slightly darker (`#0A0A0A`) than the surrounding surface for clear visual separation.

**Don't:** Use proportional fonts for any code or technical data display — monospace is the expectation. Make code blocks the same background as the surrounding content — they need visual distinction. Use code styling without syntax highlighting when language context is available.

### Tabular Numbers

**Do:** Enable tabular figures (each digit occupies equal width) for all data tables, numeric columns, metric displays, deployment durations, and any context where numbers are vertically aligned. This is critical for scannable data reading — proportional numbers misalign when stacked in columns.

**Don't:** Use proportional figures in data tables — the misalignment makes scanning difficult. Forget to enable tabular numbers on the body font when displaying numeric data. Mix proportional and tabular figures in the same data view.

### Text Color Hierarchy

**Do:** Use a 4-tier text hierarchy in dark mode: primary (`#FFFFFF`) for headings and most body text, body (`#EDEDED`) for standard content, secondary (`#888888`) for captions and metadata, tertiary (`#666666`) for disabled text and placeholders. The tiers should be immediately distinguishable. In light mode, invert the scale.

**Don't:** Use only two text colors — the information density of dashboards requires more granular hierarchy. Make secondary text too light in dark mode — it must remain readable. Use pure white as the only text color — it flattens the information hierarchy entirely.

## Spacing & Layout

### The Compact Philosophy

**Do:** Use tight, economical spacing as the default. Core scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px. Component internal padding defaults to 8px or 12px. Card padding is 16px. Page gutters are 24px. Section gaps are 32-48px. Data table rows are 32-36px tall with 8px internal vertical padding. Every pixel of padding must justify its existence.

**Don't:** Use loose, airy layouts that waste screen space. Default to large padding values — start compact and expand only when content demands it. Create layouts with generous whitespace that feels luxurious but wastes density. Use padding as a design statement rather than a functional spacing decision.

### Dashboard Grids

**Do:** Use 3-4 column card grids with 16px gaps. Cards should be responsive: 4 columns at wide viewports (1440px+), 3 columns at standard (1024-1439px), 2 columns at tablet (768-1023px). Content max-width: 1200px centered, with 24px gutters maintaining breathing room at the edges.

**Don't:** Use variable or decorative gap sizes in card grids — 16px is consistent. Make cards too wide or too narrow — aim for card widths between 280-400px. Center the content area without gutters — the 24px edge breathing room is essential at all viewports.

### Data Density

**Do:** Embrace density in data displays. Tables, logs, metrics, and deployment lists should be compact and scannable. Use 32-36px row heights. Stack information efficiently: commit hash, message, branch, status, and timestamp can all live in a single table row. The dashboard should reward scanning with high information density.

**Don't:** Make data rows tall and spacious — they should be dense enough to show 15-20 rows in a viewport. Truncate data prematurely to maintain spaciousness — show the data and manage density. Add decorative whitespace to data displays — every pixel should carry information or aid scanning.

### Sidebar

**Do:** Keep the sidebar at 220-240px width. Use the darkest surface background (`#111111`). Position navigation items with 20px icons + 14px medium labels, 8px internal padding, and 36-40px item height. Separate the sidebar from the main content with a single 1px semi-transparent white border on the right edge.

**Don't:** Widen the sidebar beyond 240px — it is navigation, not content. Make sidebar items tall and airy — density allows showing all nav items without scrolling. Use a different background color for the sidebar than the defined surface token. Remove the border — it's the primary visual separator between navigation and content.

### Form Layout

**Do:** Use single-column form layouts, max-width 480px for dedicated form pages. Position labels above inputs (not beside them) with exactly 8px gap. Make inputs 36px tall, 4px radius, 1px border, 8-12px horizontal padding. Group related fields with section headings (16px semibold, 16px gap above, 8px gap below).

**Don't:** Use multi-column form layouts — they disrupt vertical scanning. Place labels to the left of inputs — top-aligned labels are faster to scan. Make input fields different heights for different contexts — 36px should be the standard. Use forms wider than 480px for dedicated form views — narrower forms are faster to complete.

## Corner Radius & Shape

### The Sharp Default

**Do:** Default to 4px radius for all elements: buttons, inputs, selects, textareas, tags, badges, kbd badges, and tooltips. Use 6px radius for cards, panels, and code blocks. Use 8px radius for modals and dialogs — this is the absolute maximum. The shape language is architectural — right angles eased just enough to feel precise without feeling harsh.

**Don't:** Exceed 8px radius on any functional element anywhere in the product. Use pill shapes (fully rounded containers, circular buttons). Default to 6px or 8px for generic elements — 4px should be the first choice. Add radii that make the interface feel soft, consumer-grade, or playful.

### Status Dots and Avatars

**Do:** Use circles exclusively for status indicator dots (8px, filled, muted green/amber/red) and user/organization avatars. These are the only fully rounded elements in the entire interface — their circularity signals information, not decoration.

**Don't:** Use circles for functional UI elements. Create circular buttons, circular badges, or circular icon containers. Use rounded rectangles with large radii where a circle is the expected pattern (avatars read as broken if they are not circular).

### Card Architecture

**Do:** Make cards flat and architectural: `#1A1A1A` background, 1px border (`rgba(255,255,255,0.08)`), 6px radius, 16px internal padding. No shadows on cards at rest. Do not add accent-colored borders or edges. Cards should feel like precise containers — engineered, not decorated.

**Don't:** Add shadows to cards as a primary visual treatment. Use gradient backgrounds or accent-colored borders on cards. Round card corners beyond 6px. Add decorative internal elements to cards. Make cards feel like marketing tiles — they should feel like functional infrastructure containers.

### Terminal and Code Blocks

**Do:** Render terminals and code blocks with a `#0A0A0A` background (darker than cards) and 6px radius. Add a subtle 1px border. Use internal padding of 16px. Show a minimal header bar (fileName, language label, copy button) at the top, visually separated from the code by a subtle border or spacing.

**Don't:** Style terminals to look like decorative UI elements — authenticity matters to developers. Use the same background as cards — terminals should be darker and more "behind" the interface. Add terminal chrome (green text, blinking cursors) unless it's a real-time log. Use rounded corners larger than 6px on code displays.

## Elevation & Shadows

### Borders Over Shadows

**Do:** Communicate elevation and separation primarily through borders (1px, semi-transparent white) and subtle background-color layering in the monochrome scale. A card is distinguished from the page by its slightly lighter background and its 1px border — not by a shadow. This is the primary structural approach.

**Don't:** Use box shadows on cards, containers, or panels as the primary means of visual separation. Layer multiple cards with increasing shadow depth. Create a material-design-style elevation hierarchy — Vercel is flat, structured, and architectural, not layered and physical.

### When Shadows Are Used

**Do:** Apply shadows precisely and minimally on: dropdowns (0px 2px 4px at very low opacity), tooltips (same), and modals (0px 4px 8px at very low opacity). Shadows in dark mode use black at higher opacity than in light mode since dark backgrounds absorb shadow. All shadows are tight, never spread wide, and never use saturated color.

**Don't:** Use shadows on cards, panels, sidebars, or any persistent surface. Make shadows wide, diffused, or "glowy." Apply colored or saturated shadows. Use shadows as a visual feature rather than a subtle functional cue.

### Modal Overlays

**Do:** Use a semi-transparent backdrop (`rgba(0,0,0,0.60)`) behind all modals and dialogs. No backdrop-filter blur. No gradient. The backdrop should significantly dim the interface behind the modal without entirely obscuring it. The modal itself uses an 8px radius and a subtle shadow.

**Don't:** Use backdrop-blur — it's computationally expensive and visually inconsistent with the architectural flatness of the interface. Make the overlay too light (<40%) — the modal should command attention. Make the overlay so dark (>80%) that the user loses all context of where they are.

### Z-Index Simplicity

**Do:** Maintain exactly three elevation levels in the interface: Level 0 (base surfaces: page, sidebar, cards, tables), Level 1 (floating elements: dropdowns, tooltips, popovers), Level 2 (overlays: modals, command palette, dialogs). No ad-hoc levels, no exceptions.

**Don't:** Create additional elevation levels for specific components. Let UI elements nest at the top level (modals should not open modals within them). Use z-index values that are not clearly mapped to one of the three defined levels.

## Cards & Data Display

### Project Cards

**Do:** Structure project cards with: a preview image (16:9 aspect ratio, live deployment screenshot, full card width, rounded top corners at 6px), followed by a card body with: project name (16px semibold), status indicator (8px dot + text label), last deployed timestamp (12px secondary), domain name (12px mono, secondary). Cards use `#1A1A1A` background, 1px border, 6px radius, 16px padding, and no shadow at rest.

**Don't:** Use generic or placeholder thumbnail images — live deployment screenshots are a Vercel signature. Show project cards without preview images — the visual preview is essential context. Add shadow or elevation to cards at rest. Overload cards with information — 4-5 data points maximum.

### Metrics Display

**Do:** Show large numbers (24-32px semibold, Geist, tabular figures enabled). Place the metric label below the number (12px secondary). Optionally include a trend indicator: small green (up) or red (down) arrow with a percentage change value — both in 12px. Group 3-4 metrics in a horizontal row.

**Don't:** Place labels above numbers — the number should be the first thing the eye reads. Use proportional figures for metric numbers — tabular figures are essential. Show numbers without context (e.g., absolute values without a trend or comparison). Use large, decorative typography for metrics.

### Tables

**Do:** Use compact row heights (32-36px). Apply subtle zebra striping — 2% brightness difference between alternating rows. Right-align all numeric values. Use monospace for technical identifiers (commit hashes, IDs, domains). Enable tabular figures on numeric columns. Make column headers 12px medium with sort indicators. Add a subtle 1px bottom border on header rows.

**Don't:** Add cell borders or heavy grid lines — zebra striping is sufficient. Left-align numbers — they must be right-aligned for vertical scanning. Make table rows tall (>40px) — density enables scanning. Use proportional font for typeface in data tables. Display IDs or hashes in proportional font.

### Build Logs (Terminal)

**Do:** Render build logs in a terminal-style display: `#0A0A0A` background, Geist Mono at 13px, colored log levels (white for info, muted green for success, muted amber for warning, muted red for error), timestamp prefix in secondary gray. Auto-scroll to the latest output during active builds. Include a "Copy" button in the terminal header bar.

**Don't:** Style the terminal to look like a designed UI widget — developer authenticity matters. Use proportional font for log output. Show raw, unformatted output — parse and format log lines with at minimum: timestamp, level indicator, message. Add decorative borders, backgrounds, or gradients to the terminal area.

### Status Indicators

**Do:** Render deployment and system status as an 8px filled circle next to a 12px or 13px text label: green circle + "Ready" (or "Deployed"), amber circle + "Building" (or "In Progress"), red circle + "Failed" (or "Error"), gray circle + "Canceled" (or "Disabled"). Keep colors muted — never saturated.

**Don't:** Use text-only status labels without the color dot — the dot enables ultra-fast scanning. Make status dots larger than 8px — they are micro-indicators. Use bright, saturated colors — they feel like alarms. Create multiple status indicator styles — one consistent pattern across all contexts.

## Motion

### Speed Above All

**Do:** Use extremely fast motion: hover states at 0ms (instant), focus rings at 100ms, dropdowns and tooltips at 150ms, modals at 200ms. Page transitions should be instant or near-instant (sub-150ms). The goal is perceived speed: nothing should wait on animation to complete before the user can act.

**Don't:** Use transitions longer than 300ms anywhere in the product. Make the user wait for an animation to finish before they can interact. Add loading states that are animated for decorative reasons rather than functional ones. Use motion that feels deliberate or dramatic.

### Easing

**Do:** Use ease-out for elements entering (accelerate into position, feel fast). Use ease-in for elements exiting (decelerate away, leave cleanly). Use standard CSS easing functions — no custom curves. Motion should feel mechanical and predictable — it is a tool, not a performance.

**Don't:** Use spring physics, bounce, or overshoot anywhere. Create custom easing curves. Use linear easing for interactive transitions — it feels unfinished. Make motion that calls attention to its smoothness or sophistication — motion serves data and function, not aesthetics.

### Loading States

**Do:** Use skeleton loaders: pulsing monochrome bars (1.5s loop, subtle brightness oscillation) that match the approximate layout of the eventual content. For active deployments, use a minimal determinate progress bar rather than a spinner. Loading states should communicate that work is happening without feeling slow.

**Don't:** Use animated spinners for page or data loading. Use colorful skeleton loaders or gradient pulse animations. Show loading states that don't resemble the eventual content layout — they should create a smooth transition. Make users stare at loading indicators longer than the data actually takes to load.

### Hover States

**Do:** Make hover state changes instant — 0ms transition. A card background shifting from `#1A1A1A` to `#222222` should happen in a single frame. This creates the perception of extreme responsiveness. The interface should feel like it reacts before you finish moving your cursor.

**Don't:** Animate hover state transitions — even a 100ms transition adds a subtle feeling of lag on a 60Hz display. Use different hover transition timing for different components. Make hover states that require the user to "wait and see" what happens.

### Chart Animations

**Do:** Apply a simple, single entrance animation to charts on first render: 300ms ease-out, data series draw in or fade in. After the initial render, data updates should be instant — no re-animation. Charts should feel informative, not performative.

**Don't:** Re-animate entire charts when data updates. Use elaborate chart entrance animations. Make chart animations the slowest part of the page load. Apply spring or bounce physics to data visualization.

## Iconography & Imagery

### UI Icons

**Do:** Use geometric, monoline, stroke-based icons at 16px, 20px, and 24px sizes. Stroke weight: 1.5-2px. Icons inherit the text color of their context — they should be monochrome and visually subordinate to the text they accompany. Use a consistent icon set: Geist Icons (Vercel's custom set) or Lucide/Feather as alternatives.

**Don't:** Use multi-color icons in UI chrome. Apply filled icons except for micro-indicators (status dots, notification badges, checkmarks). Mix icon sets — pick one and use it consistently. Use icons at sizes outside the 16/20/24px standard.

### Framework Logos

**Do:** Display framework logos at small sizes (20px) in ecosystem contexts: compatibility grids, template selectors, framework picker dropdowns. Logos should be monochrome (white in dark mode, black in light mode) or use their original brand color — both approaches are acceptable, but be consistent within a single view. Never larger than 24px.

**Don't:** Display framework logos at large sizes or as decorative elements. Use inconsistent logo treatments (some monochrome, some color, some outlined) in the same view. Let framework logos become prominent visual features — they are informational, not decorative.

### Preview Images

**Do:** Use live deployment screenshots as preview images on project cards and deployment lists. Images should be crisp, full-bleed within the card width, and updated on each deployment. The preview shows the actual deployed application — not a template, not a placeholder, not a gradient.

**Don't:** Use generic thumbnail images or placeholder gradients. Show stale screenshots that don't reflect the current deployment. Apply filters, overlays, or treatments to preview images. Show previews without updating them after redeployment.

### Hero and Brand Imagery

**Do:** Use abstract geometric visuals for brand moments: intersecting planes, wireframe globes, layered translucent shapes — all rendered in the accent color over near-black. These appear in hero sections, loading states, and brand-focused landing pages. The triangle/geometric motif is the visual anchor but should appear sparingly.

**Don't:** Use photography, stock imagery, or illustrations anywhere in the product or marketing site. Add decorative textures, patterns, or gradients as background treatments in functional UI. Let geometric brand visuals appear in the product interface — they belong on marketing surfaces only.

## Voice & Copy

### Developer-First Language

**Do:** Write terse, confident, technically precise copy. Use sentence case everywhere — no title case, no all-caps. Use imperative mood for all actions: "Deploy," "Create project," "View logs," "Configure domain." Descriptive labels use noun phrases: "Deployment status," "Environment variables," "Build logs." The voice assumes the user is competent and needs clarity, not persuasion.

**Don't:** Use exclamation marks anywhere in the product. Add marketing adjectives ("amazing," "beautiful," "powerful," "incredible"). Write copy with "please," "sorry," or other softening language. Use idioms, wordplay, cultural references, or humor in functional UI copy. Make the user feel marketed to or persuaded.

### Error Messages

**Do:** State what happened in plain, technical-but-accessible language. Provide a clear next action: "The deployment failed. View the build logs for details." or "Environment variable 'DATABASE_URL' is missing. Add it in Project Settings." Keep error messages brief — one to two sentences maximum. Never blame the user.

**Don't:** Write error messages that are vague ("Something went wrong"), alarming ("Critical failure!"), or technical-jargon-heavy without explanation. Leave the user without a clear path to resolution. Make error messages accusatory ("You entered an invalid value") — state what the system needs, not what the user did wrong.

### Empty States

**Do:** Be direct and actionable: "No deployments yet. Push a commit to your repository to get started." or "No projects found. Import a Git repository to create your first project." Provide the exact next action — a button, a command, a link. Keep empty states compact and unapologetic.

**Don't:** Use lengthy, marketing-flavored empty state copy. Write empty states that don't offer a clear next step. Decorate empty states with illustrations or decorative elements — a short message and a CTA button is sufficient. Make the user feel like emptiness is a problem — it's a starting state.

### Brand Triad

**Do:** Use the "Develop. Preview. Ship." triad sparingly — at the brand level (homepage hero, about page, key marketing moments). In the product, refer to the workflow in plain language: "Push to deploy," "Preview your changes," "Ship to production." The triad is a brand message, not UI copy.

**Don't:** Pepper "Develop. Preview. Ship." throughout the product interface. Use the triad in tooltips, empty states, or error messages. Let the phrase become a crutch that replaces clear, specific language. Overexpose the signature brand message until it loses meaning.

### Terminal and Code Language

**Do:** Use standard conventions: "Deploy," "Build," "Logs," "Output," "Commit," "Branch." Write command-line examples in code blocks with proper syntax highlighting. Use standard Git and terminal terminology accurately — the audience knows these terms and expects them to be used correctly.

**Don't:** Simplify or dumb down technical terminology. Use non-standard terms for standard concepts. Write fake or pseudo command-line examples. Assume the audience needs terminal concepts explained — they are the audience.

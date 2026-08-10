# Linear — Do / Don't

## DO

### Keep It Dense But Readable — Every Pixel Must Earn Its Place

Linear's density is a feature, not an accident. 14px body text, 38px row heights, 8-12px component padding. Users see 25-30 issues without scrolling. But density never becomes clutter: generous line-height (1.4-1.5), clear typographic hierarchy, and consistent spacing prevent visual chaos.

Before adding padding, ask: "Does this space help the user parse information?" If not, remove it. Every pixel of whitespace must have a functional justification — separating groups, creating hierarchy, or improving scanability.

### Use Dark Mode as Default

Linear's brand identity is inseparable from dark mode. The dark slate backgrounds, the way the sidebar is darker than content, the warm accent glowing against cool neutrals — all of this is dark-mode-native. Light mode exists but is secondary. The canonical screenshots, the marketing, the brand memory — all dark.

If you're designing something Linear-inspired, start in dark mode. Design the light variant afterward, not concurrently.

### Show Keyboard Shortcut Hints on Hover

This is a signature Linear interaction pattern. Buttons and interactive elements reveal their keyboard shortcuts on hover (or optionally, always-on for power users). The hint is 10px text in a subtle keycap-style container, positioned next to or below the element.

This pattern:
- Teaches keyboard shortcuts progressively (no tutorial needed)
- Rewards power users without overwhelming new users
- Communicates "this is a tool, not a website"
- Makes the app feel native (OS apps show keyboard shortcuts)

### Use Warm Accent Against Cool Neutrals

The coral/rose accent (`#E04F37`) is the single most distinctive design choice in Linear. It is warm where everything else is cool. It humanizes the interface. It appears sparingly — 2-4 times per screen — and only on actionable elements.

Do not use a cool blue accent. Do not use multiple accent colors. The warm accent's power comes from its isolation against the neutral field. If you dilute it, you lose the signature.

### Keep Corners Sharp (2-4px Max)

Consistency is the rule. 4px on all containers, buttons, inputs, and modals. 2px on small elements (checkboxes, tags, keyboard hints). Never deviate. The sharp geometry says "precision instrument" — every rounded corner above 4px makes the product feel softer and slower.

### Use Border-Bottom Dividers for Lists (Not Card Grids)

Lists are displayed as rows separated by 1px bottom borders (Neutral 400), not as cards in a grid. Each row is full-width. This maximizes information density and scanability. Cards imply isolated, self-contained units; rows imply a continuous, scannable dataset.

The only exception is the board view, where issues become compact cards for drag-and-drop — but even those cards are minimal (no shadow, no border, 4px radius, less than 100px height).

### Display Data with Tabular Precision

Issue IDs (LIN-1234), timestamps, dates, and numeric values use tabular numbers. Columns align precisely. This communicates attention to detail and makes data comparison effortless. The precision is not decorative — it's functional. When you scan a column of issue IDs, your eye should not have to adjust for varying digit widths.

## DON'T

### Don't Use Light Mode as Default

Linear is dark. If you're building a Linear-inspired design, light mode is a secondary theme. The sidebar-must-be-darker-than-content layering system, the warm accent glow, the overall calm-focus feel — these are designed for dark mode first. Light mode can exist, but it should not be the first impression.

### Don't Use Soft/Rounded Corners Above 4px

No pill buttons. No 8px or 12px radius cards. No circular containers (except avatars). No fully rounded inputs. Every corner is 4px (default) or 2px (small elements). Deviating even to 6px breaks the precision-tool feel. The sharpness is part of the identity.

### Don't Use Card Grids for Data — Use Lists and Rows

Issues, projects, settings items, search results — all are displayed as rows in a list, not as cards in a grid. Cards create visual weight and separation that slows scanning. Rows are lean, consistent, and keyboard-navigable. Reserve card-like containers for:
- Board view (drag-and-drop requires bounded hit areas)
- Rich content blocks (issue descriptions, wiki-like content)
- Modals and detail panels

### Don't Use Shadows on Static Elements

Shadows are for overlapping surfaces only: command palette, dropdowns, modals, tooltips. Never on:
- Issue rows
- Board columns
- Sidebar
- Cards within the board view
- Setting panels
- Navigation elements

In dark mode, shadows must have higher opacity (0.2-0.4) to register against dark backgrounds. But the rule holds: static elements are flat.

### Don't Use Decorative Typography — One Font Family, Clean Weights

Linear uses exactly one typeface (Inter or custom geometric sans). No serif. No monospace (except code blocks). No display faces for headings. No thin or black weights. The typography is disciplined to the point of austerity: regular (400) + medium/semibold (500-600). This forces hierarchy to be expressed through size and spacing, not through typographic variety.

### Don't Use More Than 3 Accent Appearances per Screen

The warm coral accent is precious. Reserve it for:
1. The primary action button
2. The active/selected state (sidebar item, focused input)
3. Priority indicators (if urgent issues are present)

That's it. Not on icons. Not on badges. Not on section headlines. Not on links (use a subtle text treatment instead). Not on hover backgrounds (use neutral). The accent's impact is inversely proportional to its frequency.

### Don't Add Padding Without Purpose — Linear Is Dense on Purpose

Resist the urge to "give things room to breathe." Linear prioritizes information density over visual generosity. Padding should be the minimum needed for readability and interaction accuracy. If 8px padding works, don't use 16px. If a 38px row height fits, don't use 48px. Every extra pixel of padding removes an issue from the visible viewport.

Valid padding increases:
- When readability degrades (text too tight, needs more line-height or spacing)
- When interaction accuracy suffers (touch targets too small)
- When hierarchy is unclear (groups need more separation)

Invalid padding increases:
- "It looks nicer" (Linear prioritizes function over aesthetics)
- "More modern/airy" (Linear is not airy)
- "Competitor X does it" (Linear is defined by what it rejects)

### Don't Use Colorful Status Badges — Use Minimal Indicators

Status is communicated through small colored circles (8-12px) and text, not through background-filled badges with white text. Priority is a 3px colored bar on the left edge of an issue row, not a colored tag.

The discipline: color signals state, but it does not occupy the user's attention. You register a red priority bar peripherally; you don't "read" it. This preserves focus on the issue title — the most important content on the row.

### Don't Use Flat/Nested Navigation Breadcrumbs in the Main UI

Linear's navigation is the sidebar, not a breadcrumb trail in the topbar. The topbar shows context (e.g., "Engineering / Backend / Active Issues") but is not the primary navigation mechanism. Don't build a UI where users navigate by clicking breadcrumb segments — the sidebar handles hierarchy; the topbar shows where you are.

### Don't Sacrifice Keyboard Accessibility for Visual Polish

Every interactive element must be reachable via keyboard. Every list must support j/k navigation or arrow keys. CMD+K must open the command palette. Escape must dismiss overlays. Enter must submit forms. If a visual treatment prevents keyboard access (e.g., a custom select that doesn't support arrow keys), redesign the treatment, not the keyboard behavior.

### Don't Use Bright or Saturated Semantic Colors

Linear's green (Done) is `#46A758`, not `#00FF00`. Amber (In Progress) is `#D9A34A`, not `#FFA500`. Red (Urgent) is `#E5484D`, not `#FF0000`. All semantic colors are slightly muted — visible but calm. Bright saturated colors fight with the dark background and create visual fatigue. Muted tones integrate into the calm focus of the interface.

### Don't Use Multiple Accent Colors for Different Features

Some products assign different colors to different features (blue for issues, green for docs, purple for settings). Linear does not do this. The accent is one color (coral/rose) for everything. Semantic colors handle state (done, in progress, urgent). The accent handles action. No feature-level color coding.

### Don't Center or Hero-Layout Any Functional View

Issue lists, boards, settings, detail panels — all are left-aligned, filling available width. No max-width-centered content areas. No "hero sections." Functional views use the full viewport. The only centered component is the command palette (a floating overlay, not a page layout). The sidebar + content layout is the universal structure.

---

## ANTI-PATTERNS: Common Mistakes When Designing "Linear-Like" Interfaces

### Making Everything a Card

**Wrong:** Issue rows as Material Design cards with shadow, border-radius, white background, and padding.
**Why it fails:** Cards create visual weight. A list of 20 cards is visually heavy and slow to scan. Cards also imply independence — rows imply continuity.
**Fix:** Use a flat list with 1px bottom-border dividers. Each row is full-width, 38px height, compact internal padding.

### Using Blue as the Accent Color

**Wrong:** Defaulting to a blue accent "because it's a tech product." Navy, sky blue, indigo.
**Why it fails:** The warm coral accent is Linear's single most recognizable brand choice. Blue makes it look like every other dev tool. The warmth of coral against cool slate is what makes Linear feel human and distinct.
**Fix:** Use a warm accent: coral (`#E04F37`), rose, warm terracotta, or warm orange. Must be warmer than the neutral field around it.

### Adding Padding "to Make It Feel Premium"

**Wrong:** 24px row padding, 48px section margins, 64px between groups.
**Why it fails:** Linear is not premium-spacious. It is tool-dense. Extra padding reduces visible issue count and makes the tool feel slower and less capable.
**Fix:** Start with the minimum: 8-12px component padding, 16-24px section padding. Increase only when readability or interaction accuracy fail at the minimum.

### Using Colorful Background-Filled Status Badges

**Wrong:** Green background pills with white "DONE" text, amber pills for "IN PROGRESS," red pills for "URGENT."
**Why it fails:** Filled badges are loud. They compete with issue titles for attention. Linear's status dots (8px filled circles) register peripherally without demanding focus.
**Fix:** Use small colored circles (8-12px) for status, 3px colored bars for priority. No background fills. No white text on colored backgrounds for status.

### Building Light-Mode-First and Then "Adding Dark Mode"

**Wrong:** Designing all screens in light mode, then running an "invert colors" pass for dark mode.
**Why it fails:** Linear's visual identity IS dark mode. The layered sidebar (darker than content), the way accent glows against dark backgrounds, the calm-focus atmosphere — these don't translate from light-first design. Dark mode designed as an afterthought feels inverted, not native.
**Fix:** Design every screen in dark mode first. Approve it. Then create the light variant. Dark mode is the default; light mode is the alternative.

### Using Large, Bold Typography for Headings

**Wrong:** 32-48px headings, extra-bold weights, display faces.
**Why it fails:** Large headings eat vertical space and reduce density. Linear's largest heading is 24px (weight 600-700). Headings guide the eye, not dominate the screen.
**Fix:** 16-20px for most headings, 24px for page-level titles. Weight 500-600, never bold or extra-bold. The hierarchy comes from position, not size.

### Using Horizontal Card Layouts Instead of Lists

**Wrong:** Dashboard-style metric cards in a 3-column grid showing project stats, issue counts, cycle time.
**Why it fails:** Cards imply marketing or dashboard mentality. Linear is a working tool — data is consumed as lists, not as glanceable metrics. A grid of cards feels like a report, not an interface you work in.
**Fix:** Use the sidebar for project/team hierarchy. Show data in list form: issue rows, project rows, timeline views. If summary metrics are needed, display them inline in the sidebar or as a compact stats bar above the list — never as a card grid.

### Ignoring the Right-Click Context Menu

**Wrong:** Performing actions only through buttons, dropdowns, and the command palette.
**Why it fails:** Linear feels like a native app. Native apps have right-click context menus. Power users expect to right-click an issue and get "Assign," "Set Priority," "Move to Project," etc.
**Fix:** Implement context menus on issue rows, board cards, and sidebar items. Mirror the command palette options in a right-click menu. This is part of the "keyboard + mouse power user" experience.

### Using Light or Transparent Sidebars on Dark Pages

**Wrong:** Sidebar with the same background color as the content area, or a sidebar that's lighter than content on a dark page.
**Why it fails:** The sidebar-must-be-darker-than-content rule creates spatial depth without shadows. A same-color sidebar feels like a flat split-view, not a navigation frame.
**Fix:** Sidebar background: Neutral 100 (darker). Content background: Neutral 200 (slightly lighter). The difference is subtle (one step on the scale) but creates clear spatial hierarchy.

### Over-Explaining in Empty States

**Wrong:** Empty state with a large illustration, a friendly headline, a paragraph of explanation, and a CTA button.
**Why it fails:** Linear respects the user's time and intelligence. An empty state should tell you what's empty and how to fill it — in one line. Illustrations and explanations are noise.
**Fix:** One line of text: "No issues match your filters." Or "No active issues — create one." That's it. The command palette or a compact button provides the action.

---

## QUICK REFERENCE: Before/After

| Scenario | Don't (Linear would never) | Do (Linear would) |
|----------|---------------------------|-------------------|
| Issue display | Card grid with shadows, colored borders, cover images | Flat list rows with 1px dividers, checkbox + ID + title |
| Status indicator | "DONE" in a green pill badge | 8px green filled circle + "Done" text in neutral gray |
| Priority | Red/amber/gray tag badges | 3px colored left-border bar on issue row |
| Navigation | Top navbar with dropdown menus, breadcrumbs | Dark sidebar with collapsible sections, CMD+K for search |
| Command palette | Slow-opening modal with category tabs | Instant 100ms overlay with grouped results, keyboard-nav |
| Settings | Bordered cards with shadow, colorful icons per section | Grouped panels with headings, no borders, compact forms |
| Empty state | Illustration + "Welcome to your workspace!" paragraph | "No issues yet. Press CMD+K to create one." — one line |
| Buttons | Rounded pills, multiple colors, large padding | Sharp 4px, accent only on primary, compact 8px padding |
| Detail view | Full page navigation away from list | Right panel slides in, list still visible on left |
| Typography | 16px+ body, 28px+ headings, multiple weights | 14px body, 16-24px headings, weight 400-600 only |

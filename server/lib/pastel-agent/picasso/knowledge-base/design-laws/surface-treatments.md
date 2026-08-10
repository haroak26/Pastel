# Picasso Surface Treatments Law

## 1. Surface Taxonomy

Every area of visible UI is a surface. The choice of surface type determines how the user perceives hierarchy, containment, and interactivity. Picasso must select from exactly six surface types. No new types may be invented.

### 1.1 The Six Surface Types

| Surface | Definition | Visual Signature | Primary Use |
|---------|-----------|-----------------|-------------|
| **Card** | Raised surface with border and/or shadow. Visibly separate from the background. | Background color elevated from page, 1 px border (neutral-200), subtle shadow (0-4 px blur) | Discrete content blocks: articles, products, features, settings groups |
| **Band** | Tonal wash background spanning full section width. No border, no shadow. | Background color = bg-muted at 50% opacity or dedicated tint token | Section grouping: feature sections, testimonial rows, CTA sections, page-level content organization |
| **Panel** | Inset surface, recessed feeling. Darker or lighter than the background. No shadow. | Background color darker/lighter than page background, 1 px border (neutral-300), inner shadow or reduced lightness | Forms, settings panels, focused interaction zones, data filters, configuration areas |
| **Inset** | A panel nested within another surface. Recessed appearance within a card or panel. | Background slightly darker/lighter than parent surface, 1 px border (neutral-200) | Input groups within cards, code blocks within articles, data displays within panels |
| **Full-Bleed** | Edge-to-edge background spanning the full viewport width. No border, no shadow. | Solid color or image filling entire horizontal space, no border-radius, no containment | Hero sections, accent bands, brand statements, immersive imagery |
| **Glass** | Translucent surface with backdrop-blur effect. Sits above underlying content. | Semi-transparent background (white at 70-80% opacity in light mode, dark at 60-70% in dark mode), backdrop-blur: 12-20 px, 1 px subtle border | Navigation bars, tab bars, floating action bars, overlays, command palettes |

### 1.2 Surface Decision Tree

When choosing a surface type, ask in order:

1. **Does this content need to sit above the page background?** If yes: Card, Panel, or Glass.
2. **Is this content a form or input-heavy area?** If yes: Panel or Inset.
3. **Does this content span the full viewport width?** If yes: Full-Bleed (hero/statement) or Band (section grouping).
4. **Is this a floating UI element that overlays content?** If yes: Glass.
5. **Does this content need to be visibly grouped without elevation?** If yes: Band.

---

## 2. Card

### 2.1 Definition and Visual Signature

A Card is a raised surface that is visibly distinct from the page background. It signals "this is a self-contained unit of content." Cards are the primary content-delivery surface in most products.

**Visual signature in light mode:**
- Background: #FFFFFF (card sits on off-white page background; the contrast between pure white card and near-white page creates the elevation effect)
- Border: 1 px, neutral-200 (subtle enough to not dominate, visible enough to define the card edge)
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.08) (ambient light, barely perceptible) or 0 0 0 1px rgba(0, 0, 0, 0.04) (borderless card elevation)
- Border-radius: 8-12 px (rounded enough to feel contained, not so rounded as to feel like a pill)
- Padding: 24 px (space-5) for default, 16 px (space-4) for compact

**Visual signature in dark mode:**
- Background: neutral-dark-2 (one step lighter than page background)
- Border: 1 px, neutral-dark-4 (slightly more visible than light mode; dark mode needs more surface differentiation)
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.3) (shadows are more visible in dark mode; the contrast ratio works differently)
- Border-radius: Same as light mode

### 2.2 When to Use Cards

- **Article/product listings:** Each item is a self-contained unit that could be rearranged or removed independently.
- **Dashboard widgets:** Each widget displays a discrete data set or tool.
- **Settings groups:** Each card groups related settings fields (e.g., "Profile Information" card, "Notification Preferences" card).
- **Feature showcases:** Each feature is described in a card that can be scanned independently.
- **Pricing tiers:** Each tier is a card, with one highlighted.

### 2.3 When NOT to Use Cards

- **Body text:** A paragraph of prose in a card is unnecessary framing. Cards are for content blocks, not prose flow.
- **Entire page layouts:** A page that is entirely cards (header card, sidebar card, content card, footer card) has no surface variation and reads as a wireframe. See Section 7.
- **Single items:** A single item in a viewport should not be a card unless it is the only content on an otherwise-empty page. If the page has one item, display it without a card container.

### 2.4 Card Count Maximum

A screen must contain no more than 3 cards. This is a visual-weight constraint. More than 3 cards creates a "grid of boxes" that overwhelms the eye and eliminates the surface variation that makes cards meaningful. If a screen needs more than 3 content blocks, use a Band with a list layout, or alternate card rows with plain text rows.

**Counting method:** A card grid of 3 columns counts as 3 cards. A dashboard with 6 widgets is unacceptable -- the widgets must become a Band-ed section with minimal borders, or the dashboard must be redesigned to use Panels or Insets for secondary widgets.

### 2.5 Card Variations

**Default Card:** Border + subtle shadow. Used for standard content blocks.
```
border: 1px solid neutral-200;
box-shadow: 0 1px 3px rgba(0,0,0,0.08);
border-radius: 12px;
padding: 24px;
background: #FFFFFF;
```

**Borderless Card:** Shadow only, no border. Used when cards sit on a colored background (Band) where a border would create visual clutter.
```
box-shadow: 0 2px 8px rgba(0,0,0,0.06);
border-radius: 12px;
padding: 24px;
background: #FFFFFF;
```

**Interactive Card:** Hover state with elevated shadow and optional border color change. This signals the card is clickable.
```
hover: box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: neutral-300;
```
Or for accent-branded cards:
```
hover: border-color: accent-300; box-shadow: 0 4px 12px rgba(accent, 0.15);
```

**Selected Card:** Accent border, slight accent background tint.
```
border: 2px solid accent-500;
background: accent-50;
box-shadow: 0 2px 8px rgba(accent, 0.12);
```

---

## 3. Band

### 3.1 Definition and Visual Signature

A Band is a full-width section with a tonal wash background. It groups content into visual sections without the containment feel of a card. Bands are the primary page-structuring surface.

**Visual signature:**
- Background: bg-muted (neutral step 1, the lightest tint above page background) -- e.g., #F1F3F5 (cool) or #F2F0ED (warm)
- Alternatively: bg-muted/50 for a very subtle tonal shift that is almost imperceptible but provides surface variation
- No border (the tonal shift is the boundary)
- No shadow
- No border-radius (full-width surfaces do not have rounded corners)
- Full viewport width, content constrained by container max-width
- Vertical padding: 64-96 px (space-8 to space-9)

### 3.2 When to Use Bands

- **Section alternation:** Alternating between plain (page background) sections and Band sections creates visual rhythm without introducing heavy borders or shadows.
- **Related content grouping:** A set of features, testimonials, or benefits that belong to the same conceptual category.
- **CTA sections:** A full-width band with a centered CTA creates visual weight and importance without feeling like a popup.
- **Footer prelude:** The section just before the footer is often a Band to create a visual "closing" gesture.
- **Dashboard sections:** Grouping related widgets in a Band rather than a Card reduces the "box within a box" problem.

### 3.3 When NOT to Use Bands

- **For a single content item:** A Band for one testimonial is an over-allocation of visual weight. A Band implies "this section contains multiple related items."
- **Adjacent to the same color Band:** Two Bands in a row using the same background color merge into one band. Either alternate with a plain section between them, or vary the Band tint (see Section 7).
- **As a card substitute:** If the content needs to be independently scannable, repositionable, or interactive, use a Card. Bands are for content that flows as a section, not content that stands as a unit.

### 3.4 Band Variations

**Standard Band:** background: neutral-1; -- the default tonal wash. Subtle enough to not distract, present enough to separate sections.

**Accent-Tinted Band:** background: accent-50; -- a very subtle accent tint (10% saturation, 90% lighter than the base accent). Use for featured sections, testimonial highlights, and hero-preceding sections. Used sparingly -- one per page maximum.

**Dark Band:** background: neutral-10; color: neutral-1; -- an inverted band with dark background and light text. Use for dramatic section breaks, "dark mode" marketing sections, and footer preludes. One per page maximum.

**Image Band:** background: url(...); background-size: cover; with an overlay gradient for text legibility. Use for hero sections and immersive brand statements. Ensure text passes 4.5:1 contrast against the darkest part of the image (use a linear-gradient overlay to guarantee contrast).

---

## 4. Panel

### 4.1 Definition and Visual Signature

A Panel is an inset surface -- it feels recessed into the page rather than raised above it. Panels signal "this area is for focused interaction." They are the primary surface for forms, settings, filters, and data configuration.

**Visual signature in light mode:**
- Background: neutral-1 (page-muted level, one step darker than page background) or neutral-0 if the page background is already neutral-1. The key is that the Panel is slightly darker than its parent surface.
- Border: 1 px, neutral-300 (slightly more visible than a card border; panels feel enclosed)
- No shadow (inset surfaces do not cast shadows -- they receive them in the form of a darker background)
- Border-radius: 6-8 px (slightly tighter than cards; panels feel more contained)
- Padding: 16-24 px (space-4 to space-5)

**Visual signature in dark mode:**
- Background: neutral-dark-1 (one step darker than the dark page background -- inset reverses in dark mode)
- Border: 1 px, neutral-dark-5
- No shadow

### 4.2 When to Use Panels

- **Forms:** A form with multiple input fields should sit within a Panel. The Panel signals "this is an input zone -- your focus should be here."
- **Settings pages:** Groups of configuration options (toggles, selects, inputs) should be Panel-enclosed.
- **Filter bars:** Search + filter controls in a data view sit in a Panel at the top of the content area.
- **Code blocks:** A code block within an article is an Inset (nested Panel) -- it is recessed within the article surface.
- **Data summaries:** A key-metrics summary bar (e.g., "Total Revenue | Active Users | Conversion Rate") sits in a Panel -- it is information, not action, and the recessed feel makes it secondary to the primary content.

### 4.3 When NOT to Use Panels

- **For primary CTAs:** A primary action button in a Panel loses visual prominence because the Panel itself recedes. Primary CTAs should sit on the page background, in a Card, or in a hero section.
- **For entire pages:** A page that is one large Panel feels like a form, even when it contains non-form content. Panels are for interaction zones, not page layouts.
- **For content cards:** A Panel containing an article excerpt feels wrong -- the content is being presented as a data entry area. Use a Card for content presentation.

### 4.4 Panel Variation: Inset

An Inset is a Panel nested inside another surface (Card, Panel, or even a Band). It feels doubly recessed.

**Visual signature:**
- Background: One neutral step darker than the parent surface
- Border: 1 px, neutral-200
- Border-radius: 4-6 px (tighter than Panel -- it is a detail within a surface)
- Padding: 12-16 px (space-3 to space-4, tighter than Panel)

**Use for:** Code blocks within articles, input groups within cards, data summaries within panels, "note" or "info" callouts within body text.

---

## 5. Full-Bleed

### 5.1 Definition and Visual Signature

A Full-Bleed surface spans the entire viewport width without any containment. It does not respect the container max-width. It is the most visually dominant surface type.

**Visual signature:**
- Width: 100vw (edge to edge)
- No border
- No border-radius (rounded full-bleed sections make no visual sense -- what are they rounding relative to?)
- No shadow
- May contain a contained inner grid for content (the full-bleed is the background, not the content layout)
- Content within a Full-Bleed may be centered with a max-width container -- the bleed is the background, not the content width

### 5.2 When to Use Full-Bleed

- **Hero sections:** The top section of a page, often with an image, gradient, or video background. The full-bleed signals "this is the beginning of the experience."
- **Accent statement bands:** A single, powerful statement (tagline, mission, value proposition) that spans the full width with an accent background. One per page maximum.
- **Immersive imagery:** A full-width photograph or illustration that tells a brand story. Must have a text overlay with guaranteed contrast.
- **Data visualizations:** A full-width chart or map that benefits from maximum horizontal space.

### 5.3 When NOT to Use Full-Bleed

- **For standard content sections:** Features, testimonials, pricing -- these should be Bands or plain sections with container max-width. Full-bleed for every section is overwhelming.
- **For forms:** Full-bleed forms stretch inputs to absurd widths. Forms need constrained width (typically 480-640 px) for legibility.
- **For cards:** Full-bleed cards are a contradiction -- cards are defined by their containment. A card at 100vw is a Band with a border.
- **For standard product UI:** Product dashboards and tools should almost never use Full-Bleed. The product chrome (sidebar, nav) constrains the viewport. Full-Bleed is for marketing, not product.

### 5.4 Full-Bleed Variations

**Solid Color Full-Bleed:** background: accent-600; color: #FFFFFF; -- the most common Full-Bleed. A dark accent color with white text. The accent must be dark enough for 4.5:1 contrast with white text.

**Gradient Full-Bleed:** A tonal wash gradient (same hue, varying lightness). E.g., linear-gradient(135deg, accent-700, accent-500). Direction gradients within the same hue are acceptable here because the Full-Bleed is a decorative surface, not a functional element. Rainbow gradients remain forbidden.

**Image Full-Bleed:** A background image with an overlay. background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url(...); background-size: cover; background-position: center; The gradient overlay ensures text contrast regardless of the underlying image.

**Pattern Full-Bleed:** A subtle geometric pattern (dots, grid, noise) over a solid color. The pattern must be extremely low contrast (opacity 3-8%) -- it should be felt, not seen. Pattern overlays are the most luxurious Full-Bleed treatment and should be reserved for premium brands.

---

## 6. Glass

### 6.1 Definition and Visual Signature

A Glass surface is translucent with a backdrop-blur effect. It sits above the page content and partially reveals what is behind it. Glass is the most specialized surface type and must be used with extreme restraint.

**Visual signature:**
- Background: rgba(255, 255, 255, 0.72) in light mode, rgba(20, 22, 25, 0.72) in dark mode (the exact opacity may vary, but 70-80% is the range; below 70% text becomes illegible, above 85% there is no glass effect)
- Backdrop blur: backdrop-filter: blur(16px) (12-20 px range; 16 is the sweet spot -- visible blur without smearing)
- Border: 1 px, rgba(255, 255, 255, 0.1) in light mode, rgba(255, 255, 255, 0.05) in dark mode (subtle definition of the glass edge)
- Border-radius: 12-16 px (glass panels feel modern and slightly soft)
- No shadow (glass floats on the blur layer; shadow would create double depth -- the blur IS the depth)

### 6.2 When to Use Glass

- **Sticky navigation bars:** A nav bar that scrolls with the user. Glass lets the user see content through the nav, maintaining spatial context while keeping navigation accessible.
- **Tab bars (mobile):** A bottom tab bar in an iOS-style mobile layout. Glass makes the tab bar feel integrated rather than bolted-on.
- **Command palettes / Search overlays:** The Cmd+K command palette. Glass signals "this is a temporary layer above your content."
- **Notification toasts:** A floating notification that sits above content without completely obscuring it.
- **Media controls:** Playback controls overlaid on a video or audio visualization.

### 6.3 When NOT to Use Glass

- **Content areas:** Never put body text, forms, or primary content in a Glass surface. The translucent background reduces contrast and makes reading difficult. Glass is for chrome, not content.
- **Cards:** Glass cards (translucent cards over a colorful background) are a Dribbble trend from 2020. They fail contrast requirements and are impossible to maintain across varying background content.
- **Entire pages:** A Glass page (body text over a blurred background) is illegible and technically inaccessible. Never.
- **Modals:** Standard modals should be opaque with a dark scrim backdrop. Glass modals blur the page content and overlay text -- this creates visual confusion about what is foreground vs background. Opaque modals are clear; glass modals are ambiguous.

### 6.4 Glass Anti-Slop

- **No glass in light mode with a white page background:** Glass over white looks like a smudge, not glass. Glass requires content behind it to be visually interesting -- colorful, varied, or textured. Glass over a plain white page is just a gray rectangle.
- **No glass without backdrop-filter fallback:** If backdrop-filter is not supported, the glass surface becomes a translucent rectangle with NO blur -- completely illegible. Provide a solid fallback: background: rgba(255, 255, 255, 0.95) for light mode.
- **No glass with text below 16 px:** Small text over glass is illegible because the blurred background introduces visual noise beneath the text. Glass surfaces should contain only navigation items, icons, and short labels -- never body text.

---

## 7. Surface Variation Rule

### 7.1 The Rule

No two adjacent sections on a page may use the same surface type. Surface variation is the primary tool for creating visual rhythm and page-level hierarchy. A page where every section is a Card (or every section is a Band, or every section is plain) reads as monotonous and undifferentiated.

### 7.2 Why Surface Variation Matters

The human eye perceives surfaces before content. When scrolling, the user's peripheral vision registers surface changes (color shifts, border appearances, elevation changes) as section boundaries. Without surface variation, the page becomes a single undifferentiated scroll of content -- the user cannot tell where one idea ends and another begins without reading every heading.

Surface variation creates "visual chapters" -- the design equivalent of paragraph breaks. Each surface change tells the user "you are now entering a new conceptual space."

### 7.3 Section Alternation Patterns

Acceptable surface sequences (reading top-to-bottom):

**Standard SaaS Landing Page:**
```
Full-Bleed (Hero)
-> Plain (Value Proposition)
-> Band (Features)
-> Plain (How It Works)
-> Card Grid (Use Cases)
-> Band (Testimonials)
-> Plain (Pricing -- with Card highlights)
-> Band/Accent-Tinted (CTA)
-> Plain (Footer)
```

**Dashboard Layout:**
```
Plain (Top Nav)
-> Panel (Filters Bar)
-> Plain (Data Summary Bar -- could be an Inset within a Panel)
-> Card Grid (Widgets) -- but see rule: max 3 cards. For 6 widgets, use:
  -> Band (Widget Group A: 3 Cards)
  -> Band or Plain (Widget Group B: 3 Cards)
-> Plain (Footer/Status Bar)
```

**Article/Blog Post:**
```
Plain (Header/Nav)
-> Full-Bleed (Hero Image -- optional)
-> Plain (Article Body -- prose in constrained width, no surface needed)
-> Band (Related Articles)
-> Plain (Comments)
-> Plain (Footer)
```

### 7.4 Alternation Pattern Rules

1. **A Band must be separated from another Band by at least one Plain section.** Two Bands in a row merge visually. If you need two Band sections consecutively, vary the Band tint (neutral-1 for one, neutral-2 or accent-50 for the other -- though accent-tinted Bands count as a different surface for alternation purposes).

2. **A Card section must be separated from another Card section by at least one non-Card section.** Card -> Card creates a grid-of-boxes effect that eliminates the visual rhythm.

3. **Full-Bleed must appear at most twice per page:** once at the top (hero), optionally once near the bottom (CTA/statement). More than two Full-Bleed sections creates visual exhaustion -- the user has no place to rest their eyes.

4. **The same surface type may repeat if at least two different surfaces intervene.** E.g., Band -> Plain -> Card -> Band is acceptable because Plain and Card separate the two Bands.

---

## 8. Border Treatments

### 8.1 Border Taxonomy

| Token | Width | Color | Use |
|-------|-------|-------|-----|
| border-subtle | 1 px | neutral-200 | Card borders, default input borders, dropdown borders, default table cell borders |
| border-default | 1 px | neutral-300 | Panel borders, active input borders, section dividers, image borders |
| border-strong | 1 px | neutral-400 | Strong section dividers, emphasized separators, drawer/panel edges |
| border-accent | 2 px | accent-500 | Selected card borders, active tab indicators, focus rings (use box-shadow for focus rings, but accent border is acceptable for selected states) |
| border-error | 2 px | danger-500 | Invalid input borders. Must be 2 px to be visually distinct from 1 px default borders -- 1 px error borders are easy to miss. |
| border-success | 2 px | success-500 | Validated input borders (used sparingly -- only when showing a "confirmed valid" state, not as the default validation indicator) |

### 8.2 Border Rules

- **Borders are structural, not decorative.** A border must serve a purpose: defining an edge, indicating state, or separating content. A decorative border around a text block is a design error -- remove it.
- **Borders should not compete with content.** A 2 px accent border on a card draws the eye to the container edge, not the content. Use accent borders only when the container's state (selected, featured) is the information being communicated.
- **Borders should not be the only differentiator between surfaces.** A Card with only a border (no background elevation, no shadow, no padding change) is invisible against a white page background. Borders alone cannot create surface hierarchy -- they must be combined with background color differences.
- **Dark mode borders are lighter:** In dark mode, borders should be neutral-dark-5 or higher (lighter in dark mode). A neutral-200 border in light mode maps to neutral-dark-5 in dark mode. Dark mode borders need to be more visible because the background colors between surfaces are closer together.

### 8.3 Dividers vs Borders

A divider is a border used to separate sibling content within a surface. A border is a boundary around a surface.

- **Divider:** border-bottom: 1px solid neutral-200 on list items, menu items, or section splits. Dividers are the last resort after whitespace has been exhausted -- see Section 8.4.
- **Border:** The perimeter edge of a Card, Panel, Inset, Input, or Button.

### 8.4 The Whitespace-First Rule

Before adding a divider, double the gap. If the gap is 16 px, try 32 px. If the content reads cleanly with the larger gap, the divider was unnecessary. Dividers exist because whitespace was insufficient, not because content inherently needs lines between it.

**Divider usage hierarchy:**
1. Whitespace alone (preferred)
2. Whitespace + subtle background shift (alternating row colors in tables)
3. Whitespace + subtle divider (neutral-200, 1 px)
4. Strong divider (neutral-300, 1 px -- last resort, almost never necessary)

---

## 9. Shadow Assignment

### 9.1 The Shadow Law

Shadows are reserved for elements that exist on a higher elevation plane than their surroundings. Only Cards, Dropdowns, Modals, Sticky Navigation, and Tooltips receive shadows. Static text, body sections, forms, images, and icons never receive shadows.

### 9.2 Elements That Get Shadows

- **Cards:** Ambient shadow only -- 0 1px 3px rgba(0,0,0,0.08). The shadow should be felt, not seen. If the user consciously notices the shadow, it is too heavy.
- **Interactive Card (hover):** Elevated shadow -- 0 4px 12px rgba(0,0,0,0.1). The shadow rise signals the card has lifted toward the user.
- **Dropdowns / Popovers / Menus:** 0 4px 16px rgba(0,0,0,0.12) -- these elements sit above all content and need clear elevation.
- **Modals:** 0 8px 30px rgba(0,0,0,0.15) -- modals are the highest elevation in the UI hierarchy. The shadow must be heavy enough to separate the modal from a dark scrim backdrop.
- **Sticky Navigation (scrolling):** 0 2px 8px rgba(0,0,0,0.08) -- the shadow appears only when the nav has scrolled past the top of the page. At rest (page top), the nav has no shadow.
- **Tooltips:** 0 2px 8px rgba(0,0,0,0.15) -- tooltips are small but must separate from the content they annotate.

### 9.3 Elements That NEVER Get Shadows

- **Static text** -- body copy, headings, labels. Text does not float above the page.
- **Body sections** -- Bands, plain sections. Sections are the page itself, not elements above it.
- **Forms and inputs** -- inputs sit within the page surface. A shadow on an input suggests it is floating, which is incorrect.
- **Images** -- images are content, not containers. An image with a drop-shadow looks like a physical photograph on a desk -- a skeuomorphic effect that conflicts with modern digital design language.
- **Icons** -- icons are typographic elements. A drop-shadow on an icon is a decorative crime.
- **Buttons (static state)** -- a button with a permanent shadow reads as a physical 3D button from the iOS 6 era. Buttons may have shadows on hover (to signal elevation), but not in their resting state.
- **Dividers** -- a divider casting a shadow is philosophically absurd. Dividers are flat separators.

### 9.4 The Shadow Test

If an element would look correct in a flat-design version of the interface (no shadows anywhere), it should not have a shadow. Shadows are only for elements that are genuinely layered above other content. This test eliminates 90% of shadow misuse.

---

## 10. Elevation Scale

The elevation scale defines the z-axis ordering of the UI. It combines z-index, shadow, and background color to create a perceptible depth system.

### 10.1 The Four Elevation Levels

| Level | Name | Z-Index Range | Shadow | Use |
|-------|------|--------------|--------|-----|
| 0 | Flat | auto or 0 | None | Page background, Bands, Plain sections, Body text, Images, Icons |
| 1 | Raised | 1-100 | 0 1px 3px rgba(0,0,0,0.08) | Cards, Panels (border creates elevation, not shadow), Inset surfaces |
| 2 | Overlay | 200-500 | 0 4px 16px rgba(0,0,0,0.12) | Dropdowns, Popovers, Menus, Tooltips, Sticky nav (scrolling state), Glass nav bars |
| 3 | Modal | 1000-2000 | 0 8px 30px rgba(0,0,0,0.15) | Modals, Dialogs, Drawers, Command Palettes, Full-screen overlays, Toast notifications |

### 10.2 Elevation Behavior

- **Elevation 0:** The page itself. Content at this level is the ground truth of the UI. Everything else floats above it.
- **Elevation 1:** Cards and interactive surfaces that sit slightly above the page. These elements are part of the page layout -- they scroll with the page and remain within the document flow. Cards are raised but not detached.
- **Elevation 2:** Elements that float above the document flow. Dropdowns, popovers, and tooltips appear in response to user interaction and are positioned absolutely. They are conceptually layered above the page but below modals. Sticky navigation sits at elevation 2 when the user has scrolled -- it is detached from the document flow and hovers above content.
- **Elevation 3:** Elements that take over the entire viewport or a major portion of it. Modals, dialogs, and full-screen overlays sit above everything, including sticky navigation. Nothing is more elevated than a modal.

### 10.3 Elevation Anti-Slop

- **Never use z-index values above 2000:** If an element needs z-index higher than 2000, the stacking context is broken. Refactor the DOM structure rather than competing in a z-index arms race.
- **Never shadow a Flat (level 0) element:** If it doesn't float, it doesn't cast a shadow.
- **Never have elevation gaps:** If a Card (level 1) contains a Dropdown (level 2), the Dropdown naturally sits above the Card. But a Card should never wrap a Modal (level 3) -- modals are rendered at the document root (portal) to avoid stacking context limitations.

---

## 11. Surface Color Tokens

### 11.1 The Token System

Every surface must use a dedicated token, not an ad-hoc color value.

| Token | Light Mode | Dark Mode | Surface Type |
|-------|-----------|-----------|-------------|
| surface-bg | neutral-0 (off-white page) | neutral-dark-0 (near-black page) | Page background |
| surface-bg-muted | neutral-1 (subtle tint) | neutral-dark-1 | Bands |
| surface-raised | #FFFFFF (card white) | neutral-dark-2 | Cards |
| surface-raised-hover | neutral-1 (card hover state) | neutral-dark-3 | Interactive Card hover |
| surface-overlay | #FFFFFF | neutral-dark-3 | Dropdowns, Popovers |
| surface-modal | #FFFFFF | neutral-dark-2 | Modals, Dialogs |
| surface-glass | rgba(255,255,255,0.72) | rgba(20,22,25,0.72) | Glass surfaces |
| surface-inset | neutral-1 (darker than parent) | neutral-dark-1 (darker than dark page) | Panels, Insets |
| surface-accent | accent-500 | accent-400 (lightened for dark mode) | Full-Bleed accent sections |
| surface-accent-muted | accent-50 | accent-900 (dark mode: accent is very dark/subtle) | Accent-tinted Bands |
| surface-danger | danger-50 (10% red tint) | danger-900/20 | Error banners, destructive action confirmations |
| surface-success | success-50 | success-900/20 | Success banners |
| surface-warning | warning-50 | warning-900/20 | Warning banners |

### 11.2 Token Usage Rules

- Every surface uses exactly one background token. A Card uses surface-raised. A Band uses surface-bg-muted. A Modal uses surface-modal.
- Never use a raw hex value for a surface background. Tokens ensure consistency across light/dark modes and prevent accidental color divergence.
- Tokens are immutable within a project. If surface-raised is #FFFFFF in light mode, no element may use #FAFAFA as a substitute. Create a new token (surface-raised-alt) only if there is a genuine, documented need for a second raised surface variant -- and justify it in the design system documentation.

---

## 12. Common Surface Mistakes and Their Fixes

### Mistake 1 -- All-Cards Layout
**Problem:** Every section on the page is a card. Features are cards, testimonials are cards, pricing is a card. The page is a grid of boxes with no variation.

**Fix:** Keep the most important content blocks as cards (pricing tiers, feature highlights). Convert secondary content to Bands or Plain sections. Use Cards for at most 3 discrete blocks per screen.

### Mistake 2 -- Drop-Shadow on Non-Interactive Static Content
**Problem:** A static heading, body text block, or image has a box-shadow. The shadow suggests the element is clickable or floating -- it is neither.

**Fix:** Remove the shadow. If the element needs visual separation from its surroundings, use whitespace, a background tint (convert to a Band), or a subtle border.

### Mistake 3 -- Defaulting to Bordered Cards as the Only Surface
**Problem:** Every content block is a border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; card. This is the Bootstrap 4 default card pattern. It looks like a template from 2016.

**Fix:** Remove borders from cards that don't need them. Use borderless cards with subtle shadows. Use Bands for section grouping. Use Panels for forms. Surface variety is a design quality signal -- a page using all six surface types is more visually intelligent than a page using only bordered cards.

### Mistake 4 -- Mixing Surface Types Within a Section
**Problem:** A section contains a Card next to a Panel at the same hierarchical level. The user perceives these as different surface types and wonders why -- is the Card more important? Is the Panel interactive? The distinction creates unnecessary cognitive load.

**Fix:** All sibling elements within a section must use the same surface type. If a section contains Cards, every direct child is a Card. If a Panel is needed (e.g., a filter bar next to a card grid), the Panel is a section-level element that spans the content area, and the Cards sit below it -- they are not siblings.

### Mistake 5 -- Forgetting Background Color on Cards
**Problem:** A Card with a shadow but no explicit background color. On a white page, this works (the Card inherits white). On a dark mode page or a Band section, the Card is transparent and the shadow appears on the underlying color -- broken.

**Fix:** Every Card, Panel, Modal, and Glass surface must have an explicit background property using a surface token. Never rely on background inheritance for surfaces that are visually distinct from their parent.

### Mistake 6 -- Shadows on Every Element
**Problem:** Buttons have shadows, inputs have shadows, headings have shadows, icons have shadows. Every element is fighting for z-space. The page looks like a physical bulletin board with items pinned at different depths.

**Fix:** Remove all shadows except those on elements at elevation 1 or higher (Cards, Dropdowns, Modals, Sticky Nav, Tooltips). The majority of the page should be at elevation 0 -- flat, content-focused, shadow-free.

### Mistake 7 -- Using Glass for Content Areas
**Problem:** A Glass panel containing body text, form inputs, and a submit button. The translucent background reduces text contrast. The blurred content behind the text is visually distracting. The form is harder to read than if it were on an opaque surface.

**Fix:** Move body text and forms to opaque surfaces (Cards, Panels). Reserve Glass for navigation chrome, overlays, and floating UI elements that have minimal text content.

### Mistake 8 -- Full-Bleed Overuse
**Problem:** Every section is Full-Bleed -- hero, features, testimonials, pricing, CTA, footer. The page has no breathing room. Every section screams for attention. The user cannot find visual rest.

**Fix:** Limit Full-Bleed to hero sections and at most one additional accent statement band. Convert the remaining sections to Bands, Plain sections, or Card grids within a container.

### Mistake 9 -- Inconsistent Border-Radius Across Surface Types
**Problem:** Cards have border-radius: 12px, panels have border-radius: 4px, buttons have border-radius: 8px, modals have border-radius: 16px. The radii appear to have been selected randomly.

**Fix:** Define a border-radius scale and apply it consistently:
- Full-Bleed sections: 0 px (they are edge-to-edge)
- Bands: 0 px (they span full width)
- Cards: 8-12 px
- Panels: 6-8 px (slightly tighter than Cards -- they feel more enclosed)
- Insets: 4-6 px (tight, nested within another surface)
- Glass: 12-16 px (slightly softer -- the blur effect works better with slightly rounder corners)
- Modals: 12-16 px
- Buttons: 6-8 px
- Inputs: 6-8 px

### Mistake 10 -- Using the Wrong Surface for the Content Type
**Problem:** A settings form is in a Card instead of a Panel. The Card's elevation suggests the settings are a discrete content block, not an interaction zone. The user hesitates to interact because Cards are for viewing, Panels are for editing.

**Fix:** Match surface type to user intent:
- **Viewing/reading content** -> Card, Band, or Plain section
- **Inputting/editing data** -> Panel or Inset
- **Navigating** -> Glass (nav bars) or Plain (sidebars)
- **Being impressed/engaged** -> Full-Bleed (hero)
- **Taking a single clear action** -> Modal or Card (depending on whether the action is in-page or interruptive)

---

## 13. Surface Composition -- Page-Level Examples

### 13.1 Standard SaaS Product Page

```
1. Navigation: Glass (sticky, backdrop-blur, height 56 px)
2. Hero: Full-Bleed (accent gradient background, 128 px vertical padding, centered headline + CTA)
3. Value Prop: Plain (white section bg, 96 px padding, 2-column text + image layout)
4. Features: Band (neutral-1 band, 96 px padding, 3-column card grid with borderless cards)
5. How It Works: Plain (white section bg, 96 px padding, 3-step numbered list)
6. Use Cases: Card Grid (3 interactive cards with hover shadow, 24 px gap, within a Plain section at 96 px padding)
7. Testimonials: Band (neutral-1 band, 96 px padding, horizontal scroll testimonial cards)
8. Pricing: Plain (white section bg, 96 px padding, 3 pricing cards with one Selected Card variation)
9. CTA: Band (accent-50 accent-tinted band, 96 px padding, centered heading + CTA button)
10. Footer: Plain (neutral-10 dark background, 64 px padding, multi-column link grid)

Surface sequence: Glass -> Full-Bleed -> Plain -> Band -> Plain -> Card Grid -> Band -> Plain -> Band -> Plain
Verify: No two adjacent surfaces are the same type. Correct.
```

### 13.2 Dashboard / Admin Panel

```
1. Top Nav: Glass or Plain (full-width, height 56 px, fixed position)
2. Sidebar: Plain (neutral-1 background, 240 px width, fixed position)
3. Main Content Area: Plain (white background, padding 32 px)
  3a. Filters Bar: Panel (neutral-1, padding 16 px, full content width)
  3b. Data Summary: Plain (key metrics in a horizontal row -- no surface needed, just text + data)
  3c. Widgets: Band (neutral-1 band within content area to group 3 cards)
    3c-i. Card 1: Revenue Chart
    3c-ii. Card 2: Active Users
    3c-iii. Card 3: Conversion Rate
  3d. Table: Plain (data table -- the table itself is not a surface; it sits on the plain content background)
4. Status Bar: Plain (neutral-1 thin strip at bottom, 32 px height)

Surface sequence (main area): Panel -> Plain -> Band (containing Cards) -> Plain
Verify: Panel -> Plain (different), Plain -> Band (different), Band -> Plain (different). Correct.
```

### 13.3 Content Article Page

```
1. Navigation: Glass (sticky, 56 px)
2. Hero: Full-Bleed (feature image with gradient overlay, 480 px height, article title + author + date overlaid)
3. Article Body: Plain (white background, 65 ch max-width container, padding 64 px 0)
  3a. Code Block: Inset (neutral-2 background within the article prose, 1 px border, 12 px padding)
  3b. Pull Quote: Plain (no surface -- treated as a typographic element with larger text and left border accent)
  3c. Info Callout: Inset (neutral-1 background, 1 px neutral-200 border, icon + text)
4. Related Articles: Band (neutral-1 band, 96 px padding, 3 related article cards)
5. Comments: Plain (white section bg, 96 px padding, comment thread)
6. Footer: Plain (neutral-10 dark background, 64 px padding)
```

### 13.4 Mobile App Screen (Settings)

```
1. Navigation Bar: Glass (iOS-style, bottom tab or top nav)
2. Page Title: Plain (background inherits from parent, heading + description, 16 px horizontal padding)
3. Profile Section: Panel (neutral-1, border-radius: 12 px, margin: 0 16 px, padding: 16 px)
  3a. Avatar + Name + Email: Plain (within Panel -- no additional surface needed)
4. Settings Group A (Account): Card (borderless, but with inset-style internal dividers between settings rows)
5. Settings Group B (Notifications): Card (same style as above, 16 px margin-top separation)
6. Settings Group C (Privacy): Card (same style)
7. Danger Zone: Panel (danger-50 tinted background, danger border, destructive action button -- visually distinct to signal danger)
8. Logout Button: Plain (full-width button on page background, 16 px horizontal margin)

Surface sequence: Glass -> Plain -> Panel -> Card -> Card -> Card -> Panel -> Plain
Verify: Glass -> Plain (different), Plain -> Panel (different), Panel -> Card (different -- Panel to Card is acceptable because they serve different roles: form zone vs content group), Card -> Panel (different), Panel -> Plain (different). Correct.
```

---

## 14. Surface Hierarchy Within a Single Viewport

### 14.1 The Nesting Rule

Surfaces nest in a specific hierarchy:

```
Page Background (Plain)
  -> Band (fills full width)
    -> Cards (sit within Band or Plain section)
      -> Inset (sits within Card or Panel)
  -> Panel (sits within Plain section)
    -> Inset (sits within Panel)
```

**Invalid nesting patterns:**
- Band inside a Card (Band is full-width; a Card is constrained -- the Band would overflow the Card)
- Card inside a Card (a contained surface containing a contained surface -- what is the hierarchy?)
- Full-Bleed inside anything (Full-Bleed is always the root surface for its section)
- Glass as a section-level surface (Glass is for chrome overlays, not content sections)

### 14.2 Maximum Nesting Depth

Maximum 3 levels of surface nesting: Page -> Card -> Inset. Never go deeper. A Card containing an Inset containing another Inset is over-nested -- the content and its surface are having an existential crisis about who contains whom.

---

## 15. Implementation Checklist

Before considering surface treatments complete, verify:

- [ ] Exactly six surface types defined and used: Card, Band, Panel, Inset, Full-Bleed, Glass
- [ ] No two adjacent sections use the same surface type (verify by listing the surface sequence top-to-bottom)
- [ ] Maximum 3 cards per screen (count individually)
- [ ] Cards always have an explicit background color (never inherited)
- [ ] Shadows only on: Cards, Dropdowns, Modals, Sticky Nav, Tooltips -- never on static content
- [ ] No Glass surfaces containing body text, forms, or primary content
- [ ] Full-Bleed appears at most twice per page (hero + one accent band)
- [ ] No all-cards layouts (surface variation is present)
- [ ] Border-radius is consistent per surface type (Card 8-12px, Panel 6-8px, Inset 4-6px, etc.)
- [ ] Dividers are replaced by whitespace wherever possible (whitespace-first rule)
- [ ] Elevation scale is correctly mapped: z-index values match elevation levels
- [ ] All surface backgrounds use tokens, not raw hex values
- [ ] Dark mode surface tokens defined with correct inversion
- [ ] No surface nesting deeper than 3 levels (Page -> Card -> Inset max)
- [ ] Surface type matches user intent (Card for viewing, Panel for editing, Glass for navigation)
- [ ] Panel and Inset surfaces feel recessed (darker than parent), Cards feel raised (lighter than page)
- [ ] Glass has a solid background fallback for browsers without backdrop-filter support
- [ ] No decorative borders -- every border serves a structural purpose

# Picasso Spacing Rhythm Law

## 1. The Base Grid Unit

All spacing, padding, margin, gap, and sizing values must be multiples of the base grid unit. There is no exception to this rule. A design that contains `margin-top: 37px` has a fundamental structural error.

### 1.1 Base Unit: 4 px

The 4 px grid is the universal standard for digital product design. It derives from the smallest addressable unit that is perceptible, and it divides evenly into every common screen width and component dimension. Every value in the design must be divisible by 4.

**Rationale:** 4 px is small enough to provide fine-grained control over spacing relationships, large enough to be practically meaningful (2 px differences are imperceptible in most contexts), and compatible with the 8 px grid common in native mobile platforms. A 4 px base means every value is also valid on an 8 px grid.

### 1.2 Alternative: 8 px Base (Enterprise/Large-Scale)

For enterprise products with large information displays, dashboard grids, and data tables that span wide viewports, an 8 px base is acceptable. This reduces the number of spacing tokens in the system (fewer decisions, more consistency) and aligns with native mobile platform defaults.

**When to choose 8 px:**
- The product is primarily data tables, dashboards, or dense list views
- The design system will be consumed by multiple teams who need a simpler spacing model
- The product targets both desktop and mobile, and aligning with 8 px mobile conventions reduces platform divergence

**When to stay with 4 px:**
- The product has rich, varied layouts (marketing pages, onboarding, card-based feeds)
- Fine typographic control is needed (4 px allows more precise heading-to-body spacing)
- The brand values polish and refinement over absolute system simplicity

This document assumes a 4 px base. Multiply all values by 2 for an 8 px base.

---

## 2. The Complete Spacing Scale

Every spacing value must come from this scale. New values are not invented per-component. The scale is finite and closed.

### 2.1 The Scale

| Token | Value (px) | Use |
|-------|-----------|-----|
| `space-0` | 0 | Deliberate removal of space. Used when elements must touch or when a component has no internal padding in a specific variant. |
| `space-1` | 4 | Micro-spacing: icon-to-label gaps, input inner padding (tight), chip/badge internal padding, nested list item spacing, tooltip padding, focus-ring offset. |
| `space-2` | 8 | Tight spacing: list item gaps, inline form element gaps, button icon-to-text gap, compact component padding, tag/badge margin between siblings, checkbox-to-label gap. |
| `space-3` | 12 | Standard small spacing: compact card padding, inline group separation, tab gaps, pagination item spacing, table cell padding (compact). |
| `space-4` | 16 | Default spacing: standard component padding, card padding (default), form field margin-bottom, paragraph spacing, section-within-card gaps, avatar stack offset. |
| `space-5` | 24 | Generous spacing: card padding (relaxed), section gutters, modal body padding, list item spacing (default), sidebar nav item gaps, heading-to-content gap. |
| `space-6` | 32 | Section separation: top/bottom padding for page sections, hero section padding, modal header/footer padding, major content block separation, drawer padding. |
| `space-7` | 48 | Large section separation: page-level section breaks, hero padding on wide viewports, major layout transitions (e.g., testimonials section to pricing section). |
| `space-8` | 64 | Extra-large spacing: page gutters on wide viewports (1440 px+), section breaks in marketing layouts, dense-layout row gaps for card grids, footer padding. |
| `space-9` | 96 | Maximum spacing: full-bleed hero padding, ultra-minimal marketing layouts, deliberate dramatic whitespace for luxury/brand-forward experiences. |
| `space-10` | 128 | Reserve: used only for full-viewport hero sections in luxury or editorial layouts. Never in product UI. Never more than once per page. |
| `space-11` | 160 | Absolute reserve: used only when a single element (headline, illustration) is the sole occupant of a viewport section. Almost never the right answer. |

### 2.2 Anti-Slop: Arbitrary Gaps

Any margin, padding, or gap that does not divide evenly by 4 must be corrected. Common offenders:

- **37 px:** A designer eyeballed "a little more than 32" and typed a random number. Replace with 36 px (space-5 + space-3) or 40 px (if the system allows a custom compound — but it should not; use 36).
- **21 px:** A designer wanted "a little more than 16." Replace with 20 px (not on scale) or, correctly, 24 px. The scale provides 16 and 24 — if 16 is too small and 24 too large, the layout problem is not the gap but the surrounding element sizes.
- **7 px:** A designer typed "a little more than 4." Replace with 8 px.
- **13 px:** A designer typed "a little less than 16." Replace with 12 px.
- **50 px:** The designer meant 48 px but hit 5-0. Correct to 48 px.

If no scale value works, the problem is in the layout composition, not the spacing system. Adjust element sizes, not the gap.

---

## 3. Vertical Rhythm Law

### 3.1 The Law

Every vertical margin and padding value must come from the spacing scale. Vertical rhythm is the single most important factor in perceived design quality. A layout where vertical spacing is inconsistent reads as sloppy even if the typography, color, and surface treatments are flawless.

### 3.2 How Vertical Rhythm Breaks

**Break pattern 1 — Accumulated padding:** A section has `padding: 48px` (correct), inside which a card has `padding: 24px` (correct), inside which a heading has `margin-bottom: 16px` (correct). But the designer, seeing the heading too far from the card edge, adds `margin-top: -8px` to pull it up. This breaks rhythm because the heading now has a 40 px gap to the card edge, which is not on the scale. Fix: reduce the card padding to 16 px, keeping the heading's 16 px bottom margin. Total gap: 32 px. On scale.

**Break pattern 2 — Auto margins:** `margin: 0 auto` for horizontal centering is acceptable. `margin-top: auto` inside a flex container to push content to the bottom is acceptable because it fills available space rather than defining a specific value. But `margin-top: auto` plus `padding-bottom: 20px` is a break — the 20 px is not on the scale. Fix: use a scale value for the fixed padding, or use `gap` on the flex parent.

**Break pattern 3 — Typography spacing inconsistency:** Heading-bottom margin is 16 px, but paragraph spacing is 20 px. The heading and paragraph use different spacing values for equivalent structural roles. Fix: paragraph spacing must be a scale value. Use 16 px.

### 3.3 Vertical Rhythm in Components

Every component must define its internal vertical spacing using scale values:

- **Button:** `padding: 8px 16px` (space-2 vertical, space-4 horizontal) for default size. `padding: 6px 12px` for small (if 6 is not on 4 px scale, use 8 px or 4 px — but 6 px is acceptable on a 2 px grid for UI micro-elements; see Section 9 for density modes).
- **Input:** `padding: 8px 12px` (space-2 vertical, space-3 horizontal) with `height: 40px` total (divisible by 4).
- **Card:** `padding: 24px` (space-5) for default. `padding: 16px` (space-4) for compact.
- **Modal:** `padding: 32px` (space-6) for body. `padding: 24px 32px` (space-5 vertical, space-6 horizontal) for header/footer.
- **Table cell:** `padding: 12px 16px` (space-3 vertical, space-4 horizontal). Row height: 48 px (divisible by 4).
- **List item:** `padding: 12px 16px` with 8 px gap between items. Total item height: 44–48 px.

---

## 4. Section Breathing Room

### 4.1 The Section Separation Rule

Every section on a page must be separated from the next section by 32–96 px of vertical space. This is the "breathing room" that prevents sections from merging visually.

**32 px (space-6):** Minimum section separation. Use for related sections that form a logical group (e.g., a features section with three feature cards followed by a CTAs section). The proximity signals that these sections belong to the same parent concept.

**48 px (space-7):** Default section separation. Use for standard page-level breaks between unrelated sections (e.g., testimonials section to pricing section). This is the workhorse section gap.

**64 px (space-8):** Generous section separation. Use for major content transitions (e.g., hero section to features section, or the final section to footer).

**96 px (space-9):** Dramatic section separation. Use for luxury/editorial layouts where whitespace is an intentional brand signal. Never in product UI.

**128 px (space-10):** Reserved. Use only when the section separation is itself a design statement (e.g., a single quote between two massive content blocks on a luxury landing page).

### 4.2 Anti-Slop: Cramped Sections

Never place two sections with only 16–24 px between them unless one is a subsection of the other. If two sections are siblings in the page hierarchy, they need minimum 32 px of breathing room. A page where every section is crammed up against the next one feels claustrophobic and unprofessional.

### 4.3 Section Padding vs Section Margin

Sections carry their own internal padding. The gap between sections is margin, not padding. Do not double-count: if section A has `padding-bottom: 48px` and section B has `padding-top: 48px`, the visual gap is 96 px, which exceeds the maximum. Fix: sections carry equal top and bottom padding (or margin), and the gap between them is the sum — but this is wrong. Sections should carry padding for their internal content, and the gap between sections should be a single margin value.

**Correct pattern:** Each section has `padding: 64px 0` (64 px top and bottom). The margin between sections is 0 because padding provides the breathing room. Total visual gap between section content: 128 px (64 + 64). This is acceptable for generous layouts but often too much. Better: sections have asymmetric padding — `padding: 64px 0 32px` (more on top, less on bottom), creating a 64+32=96 px gap. This works because the top of a section is visually heavier (headings) than the bottom (trailing whitespace).

**Preferred pattern:** Define section spacing as a property of the section container, not individual sections. A `section + section` CSS rule with `margin-top: 48px` is cleaner than managing individual section padding.

---

## 5. Component Internal Spacing

### 5.1 Padding Scales by Component Size

Components have three size variants that govern their internal padding:

| Variant | Vertical Padding | Horizontal Padding | Use |
|---------|-----------------|-------------------|-----|
| Compact | 8 px (`space-2`) | 12 px (`space-3`) | Data tables, dense lists, inline controls, toolbar buttons, filter chips |
| Default | 12–16 px (`space-3`–`space-4`) | 16 px (`space-4`) | Standard buttons, inputs, dropdowns, cards, list items |
| Generous | 24 px (`space-5`) | 24 px (`space-5`) | Large cards, onboarding cards, empty states, feature highlights, pricing cards |

### 5.2 The Button Padding Rule

Buttons are the most common component and the most prone to spacing errors.

- **Default button:** `padding: 10px 20px` (vertical: on scale? 10 px is not divisible by 4, but it is a standard for optical centering of 14–16 px text within a 40 px button. Adjust: use 8 px vertical for 32 px height button, 12 px vertical for 40 px height button, or 16 px vertical for 48 px height button. Buttons are the one place where optical correction slightly outweighs strict grid adherence. Default to 12 px vertical for standard 40 px buttons.)
- **Small button:** `padding: 6px 12px` for 32 px height. (6 is not on the 4 px scale. Acceptable as the single exception — see Section 9.)
- **Large button:** `padding: 16px 24px` for 48–56 px height.
- **Icon button (square):** `padding: 8px` for 32×32, `padding: 12px` for 40×40, `padding: 16px` for 48×48.

### 5.3 The Card Padding Rule

Cards have a single internal padding value applied uniformly to all four sides. Top/bottom padding may differ from left/right, but all cards of the same variant must use the same values.

- **Default card:** `padding: 24px` (space-5). This provides generous breathing room for card content and works at all breakpoints.
- **Compact card:** `padding: 16px` (space-4). Use for data-dense card grids where information density is prioritized over breathing room.
- **Relaxed card:** `padding: 32px` (space-6). Use for hero cards, onboarding cards, and cards that display single pieces of content with significant whitespace.

**Card padding is never zero.** A card with `padding: 0` is not a card — it is a border with content touching the edges. This is anti-slop.

---

## 6. Heading-to-Content Spacing

### 6.1 The Proximity Formula

A heading must be visually closer to the content it introduces than to the content that precedes it. This is the gestalt law of proximity applied to typography.

**Formula:** `heading-margin-bottom = heading-margin-top × 0.5`

### 6.2 Default Values

| Heading Level | Margin-Top | Margin-Bottom | Rationale |
|--------------|-----------|---------------|-----------|
| H1 (page title) | 64 px (space-8) | 16 px (space-4) | The page title has the most headroom. It sits close to its subtitle/introduction. |
| H2 (section heading) | 48 px (space-7) | 24 px (space-5) | Section headings need breathing room from the previous section, but bind tightly to their content. |
| H3 (subsection heading) | 32 px (space-6) | 16 px (space-4) | Subsection headings sit comfortably within a section and bind to their content block. |
| H4 (card heading) | 24 px (space-5) | 12 px (space-3) | Card headings sit at the top of a card with tight proximity to their body. |
| H5 (inline/label) | 16 px (space-4) | 8 px (space-2) | Small headings act as labels and sit very close to their content. |

### 6.3 Heading Spacing Crimes

**Crime 1 — Equal top and bottom margins:** `h2 { margin: 32px 0 }` makes the heading float equidistant between the preceding and following content. The user cannot tell which content the heading belongs to.

**Crime 2 — Larger bottom than top margin:** `h2 { margin-top: 16px; margin-bottom: 32px }` actively attaches the heading to the preceding content and divorces it from its own content. This is the worst possible arrangement.

**Crime 3 — Heading with no bottom margin:** `h2 { margin-bottom: 0 }` causes the heading to touch its content. Text touching text is illegible and visually uncomfortable.

---

## 7. Card Padding vs Section Padding

### 7.1 The Distinction

Section padding is the space between the section boundary and its children (which may be cards, text blocks, or other elements). Card padding is the space between the card boundary and the card's children.

These are independent values. A section with `padding: 64px` containing a card with `padding: 24px` creates a total of 88 px from the section edge to the card's content. This is correct — the section breathes generously, and the card contains its content comfortably.

### 7.2 Relationship Rule

Section padding must be larger than card padding. If section padding is 24 px and card padding is 24 px, the card's content is visually flush with section-level elements, destroying hierarchy.

**Minimum ratio:** Section padding ≥ 1.5 × card padding. If card padding is 16 px (compact), section padding is at least 24 px. If card padding is 24 px (default), section padding is at least 48 px.

### 7.3 Nested Card Padding

When a card contains another card (e.g., a card within a card within a dashboard panel), inner card padding should be equal to or less than outer card padding. Never increase padding as you go deeper — this suggests the inner element is more important than the outer container, which contradicts the visual hierarchy of containment.

---

## 8. White Space as a Design Element

### 8.1 When Generous White Space Communicates Luxury

Generous whitespace — section gaps of 96–128 px, card padding of 32–48 px, paragraph spacing of 24 px — signals that the product is premium, unhurried, and confident. Luxury brands use whitespace the way a gallery uses wall space around a painting: it tells you "this is important enough to deserve this much room."

**Use generous whitespace when:**
- The product is luxury ecommerce, high-end hospitality, or premium services
- The brand identity is minimalist, editorial, or Japanese-design-influenced
- Each section contains exactly one idea or focal point
- The pricing model supports low information density (high-ticket items, not feeds)
- The primary emotion is calm, focus, or aspiration

**Example:** A luxury watch brand's product page: 128 px hero padding, 96 px section gaps, 48 px card padding, 32 px paragraph spacing. Each watch is presented alone with massive surrounding whitespace. The whitespace says: "this object is worthy of your undivided attention."

### 8.2 When Tight Spacing Communicates Density

Tight spacing — section gaps of 32 px, card padding of 16 px, list item heights of 40 px — signals that the product is efficient, powerful, and respects the user's time. Power tools use density the way a cockpit uses instrumentation: every pixel carries information.

**Use tight spacing when:**
- The product is a productivity tool, dashboard, admin panel, or developer tool
- The user needs to see maximum information in a single viewport
- Speed and efficiency are the primary emotional values
- The user is an expert who will spend hours in the interface
- Information density is a feature, not a bug

**Example:** A database management tool: 32 px section gaps, 16 px card padding, 8 px list item gaps, 12 px table cell padding. Every row shows 8 columns of data. The density says: "we trust you to handle information complexity."

### 8.3 The Middle Ground

Most products fall between luxury and density. The default is: 48 px section gaps, 24 px card padding, 16 px paragraph spacing. This is the "professional but not austere" setting. Use it when the product is a standard SaaS tool that doesn't need to make an extreme spacing statement.

---

## 9. Spacing Density Modes

### 9.1 Default Mode

The standard spacing scale as defined in Section 2. This is the baseline for all designs.

**Key values:** 4, 8, 12, 16, 24, 32, 48, 64, 96 px.

### 9.2 Compact Mode

For data-dense views, tables, and power-user interfaces. Compact mode shifts all spacing values down by one step on the scale.

| Token | Default | Compact | Use in Compact |
|-------|---------|---------|----------------|
| Component padding | 16 px | 12 px | Card padding, button padding, input padding |
| Section gap | 48 px | 32 px | Section separation |
| Card padding | 24 px | 16 px | Internal card space |
| List item gap | 12–16 px | 8 px | Between list items |
| Paragraph gap | 16 px | 12 px | Between paragraphs |
| Heading-bottom margin | 24 px | 16 px | H2-to-content gap |
| Table cell padding | 12–16 px | 8 px | Table density |

**Compact mode triggers:** Views that display 20+ rows of data, views where the primary task is scanning/comparing, views where the user is a repeat expert.

**Compact mode anti-slop:** Never apply compact mode to onboarding, empty states, or marketing pages. Density in a welcome screen says "this product will be exhausting."

### 9.3 Relaxed Mode

For brand-forward experiences, onboarding, and consumer products. Relaxed mode shifts all spacing values up by one step.

| Token | Default | Relaxed | Use in Relaxed |
|-------|---------|---------|----------------|
| Component padding | 16 px | 24 px | Button padding, card padding |
| Section gap | 48 px | 64 px | Section separation |
| Card padding | 24 px | 32 px | Internal card space |
| Paragraph gap | 16 px | 24 px | Between paragraphs |
| Heading-bottom margin | 24 px | 32 px | H2-to-content gap |

**Relaxed mode triggers:** Onboarding flows, empty states, feature showcases, pricing pages, consumer-facing product pages.

---

## 10. Container Max-Widths

### 10.1 Standard Maximum Widths

Containers constrain content to readable, scannable widths. Every width must be divisible by 4.

| Container | Max-Width | Use |
|-----------|----------|-----|
| `prose` | 680 px (≈65 ch at 16 px) | Long-form text, articles, documentation, blog posts |
| `content` | 880 px | Standard content pages, marketing sections, feature descriptions |
| `wide` | 1120 px | Card grids, feature matrices, comparison tables |
| `dashboard` | 1280 px | Dashboards, data views, admin panels, multi-column layouts |
| `full` | 1440 px | Maximum content width on wide displays; backgrounds bleed beyond |
| `edge` | 100% | Full-bleed sections where content is controlled by grid columns, not container width |

### 10.2 Container Spacing Relationship

Container max-width and section padding are related. A section with `padding: 64px` and a container with `max-width: 1120px` creates:
- Content area: 1120 px
- Section area: 1120 + 128 = 1248 px (content + left padding + right padding)
- This fits within a 1440 px viewport with 96 px remaining on each side — comfortable.

**Rule:** `section-horizontal-padding × 2 + container-max-width ≤ viewport-width - 64px`. The 64 px buffer ensures content never touches the viewport edge.

### 10.3 Responsive Container Sizing

Containers should not use fixed `max-width` values exclusively. Use relative units for intermediate viewports:
- `max-width: min(100% - 32px, 1120px)` for content containers with a 16 px safety margin on each side on small screens.

---

## 11. Responsive Spacing

### 11.1 The Compression Rule

As the viewport shrinks, spacing values compress. At mobile widths (below 768 px), spacing values reduce by approximately 1.5×. This is not a mathematical function applied to every value — it is a selective compression that preserves critical spacing relationships while tightening secondary ones.

### 11.2 Breakpoint-Specific Scale

| Token | Desktop (≥1024px) | Tablet (768–1023px) | Mobile (<768px) |
|-------|-------------------|---------------------|-----------------|
| Section gap | 48 px | 40 px | 32 px |
| Section horizontal padding | 64 px | 32 px | 16 px |
| Card padding | 24 px | 20 px | 16 px |
| Card grid gap | 24 px | 16 px | 16 px |
| Paragraph spacing | 16 px | 16 px | 16 px (do not compress — reading ergonomics must be preserved) |
| Heading-bottom margin | 24 px | 20 px | 16 px |
| Button padding (vertical) | 12 px | 10 px | 10 px |
| Input height | 40 px | 40 px | 44 px (touch targets must grow, not shrink, on mobile — minimum 44 px for touch) |

### 11.3 The Mobile Paradox

Some spacing values increase on mobile. Touch targets (buttons, inputs, list items) must be at least 44 px tall on touch devices. A 32 px button on desktop grows to 44 px on mobile. A 40 px input grows to 48 px. This is correct — the spacing scale adapts to the interaction model, not just the screen size.

### 11.4 Anti-Slop: Consistent Section Padding at All Breakpoints

Never set `padding: 64px` on desktop and `padding: 64px` on mobile. At 375 px viewport width, 64 px padding on each side consumes 128 px — over a third of the screen. Content gets 247 px of actual width. This is not spacious — it is broken.

**Fix:** Mobile section horizontal padding is 16 px. This gives 375 − 32 = 343 px of content width, which is sufficient for single-column layouts.

---

## 12. Common Spacing Crimes and Their Fixes

### Crime 1 — Zero-Margin Content Areas
**Problem:** Content areas with no internal padding or margin. Text touches the edges of cards, buttons, or sections. The content feels claustrophobic.

**Fix:** Every content area must have at minimum 16 px of internal padding. The only exception is a full-bleed image that is intentionally edge-to-edge.

### Crime 2 — Negative Margins to Pull Elements Between Sections
**Problem:** A designer uses `margin-top: -48px` to pull an element up into the previous section, creating a visual overlap. This breaks vertical rhythm and makes the layout impossible to maintain.

**Fix:** If an element needs to sit between sections, redefine the sections. Make the element a child of the previous section with a negative bottom offset (better: use CSS Grid or absolute positioning with explicit control), or create a new section that spans the boundary. Negative margins are a symptom of incorrect section architecture.

### Crime 3 — Inconsistent Card Padding Within a Grid
**Problem:** A card grid where Card A has `padding: 24px`, Card B has `padding: 16px` (because the designer wanted to fit more content), and Card C has `padding: 32px` (because the designer thought it looked better). The card grid looks like it was built by three different teams.

**Fix:** All cards in a grid must use identical padding. If cards need different internal space, the content is not suited to a uniform card layout — use a different surface type (see Surface Treatments Law) or a different layout pattern entirely.

### Crime 4 — Oversized Section Gaps on Mobile
**Problem:** A 48 px section gap on a 375 px mobile viewport consumes 12.8% of the vertical height between sections. On a phone screen, this forces excessive scrolling and makes the page feel empty.

**Fix:** Compress section gaps to 32 px on mobile. The proportional relationship to content remains intact, and vertical scrolling is not punitive.

### Crime 5 — Horizontal Scrolling on Mobile Due to Container Padding
**Problem:** A container with `max-width: 1120px; padding: 0 64px` on a 375 px viewport creates `1120 + 128 = 1248px` of required width. The viewport is 375 px. The page scrolls horizontally.

**Fix:** Use `padding: 0 max(16px, calc((100vw - 1120px) / 2))` or, more simply, `padding: 0 16px` on mobile with a media query. Never use fixed pixel padding on responsive containers without breakpoint overrides.

### Crime 6 — Text Touching Images
**Problem:** An image followed or preceded by text with no gap. The text visually attaches to the image edge, creating tension.

**Fix:** Minimum 16 px gap between images and adjacent text. If the image is inline with text (icon, avatar), minimum 8 px gap. Text touching an image is the typographic equivalent of overlapping elements.

---

## 13. Spacing in Practice — Screen-Level Examples

### 13.1 Standard SaaS Dashboard

```
Page padding: 0 (dashboard uses full viewport)
Sidebar: 240 px wide, padding 16 px
Main content area: flex-grow, padding 32 px horizontal, 24 px vertical
Top nav: 56 px height, padding 0 24 px
Card grid: 3 columns, gap 24 px
Card padding: 24 px
Section within the main area: margin-bottom 32 px
Table row height: 48 px, cell padding 12 px 16 px
```

### 13.2 Marketing Landing Page

```
Hero section: padding 128 px 64 px (vertical, horizontal)
Hero heading-bottom margin: 16 px
Hero paragraph-bottom margin: 32 px (space before CTA)
Section (features): padding 96 px 64 px
Section (testimonials): padding 96 px 64 px
Section (pricing): padding 96 px 64 px
Section (CTA): padding 96 px 64 px
Footer: padding 64 px (reduced because footer is terminal)
Section gap: 0 (padding handles separation)
Card grid gap: 32 px
Card padding: 32 px (relaxed mode for marketing cards)
```

### 13.3 Mobile Product Detail Page

```
Section padding: 48 px 16 px (vertical, horizontal)
Heading: margin-bottom 16 px
Paragraph spacing: 16 px
Image: full-width, margin-bottom 24 px
CTA button: full-width, height 48 px, margin-top 24 px
Section gap: 0 (padding handles separation)
Card padding: 16 px (compact on mobile)
```

---

## 14. Implementation Checklist

Before considering spacing rhythm complete, verify:

- [ ] Every margin, padding, and gap value is divisible by 4 (or 8 if using 8 px base)
- [ ] No arbitrary gaps (37 px, 21 px, 7 px, 13 px, 50 px) exist in the design
- [ ] Section separation is 32–96 px, never less than 32 px
- [ ] Heading-bottom margins follow the 0.5× proximity formula
- [ ] Card padding is consistent across all cards in the same grid
- [ ] No zero-margin content areas (minimum 16 px internal padding)
- [ ] No negative margins used to pull elements across section boundaries
- [ ] Container max-widths are applied to all text blocks (65 ch for prose)
- [ ] Responsive spacing compresses by approximately 1.5× on mobile
- [ ] Touch targets are minimum 44 px on mobile (inputs, buttons, list items)
- [ ] Horizontal section padding reduces to 16 px on mobile (from 64 px desktop)
- [ ] No horizontal scrolling at any breakpoint
- [ ] Text never touches images — minimum 8–16 px gap
- [ ] Component internal padding matches the component's density mode (compact/default/relaxed)
- [ ] All elements on the page snap to the base grid when measured from top to bottom

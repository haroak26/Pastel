# Layout & Grids — Picasso Design Law §5.3

This document defines the canonical layout systems and grid patterns for every screen Picasso can generate. Every layout must conform to the rules herein. Layouts that violate column span rules, container constraints, or archetype selection are rejected output.

---

## 1. Column Grid System

### 1.1 The 12-Column Standard

Picasso uses a **12-column grid** as the universal layout structure. This is the default for all screens and should be overridden only for specific use cases documented below.

The 12-column grid provides:
- Clean division into halves (6+6), thirds (4+4+4), quarters (3+3+3+3)
- Common asymmetric splits: 8+4, 9+3, 5+7
- Math that aligns to the 4px base unit

### 1.2 Grid Anatomy

```
| margin | col | gutter | col | gutter | ... | margin |
```

- **Columns:** Flexible-width fraction units (CSS `fr`). 12 equal columns.
- **Gutters:** Fixed-width gaps between columns. 16px desktop, 12px tablet, 8px mobile.
- **Margins:** Outer padding of the viewport or container. 16–24px on mobile, 32–48px on tablet, auto-centered on desktop (via container max-width).

### 1.3 Column Spans That Work

**Allowed spans (multiples of 2 or 3):** 2, 3, 4, 6, 8, 12.

| Span    | Fraction | Common Use                                              |
|---------|----------|--------------------------------------------------------|
| 2       | 1/6      | Narrow sidebar, metadata column, label column          |
| 3       | 1/4      | Standard sidebar, filter panel, card in 4-col grid    |
| 4       | 1/3      | Content panel, card in 3-col grid, form in 2-col      |
| 6       | 1/2      | Half-width section, two-column content                 |
| 8       | 2/3      | Main content area (paired with 4-col sidebar)         |
| 9       | 3/4      | Wide content area (paired with 3-col sidebar)         |
| 12      | Full     | Full-width section, hero area, single-column content  |

**Forbidden spans:** 1, 5, 7, 9*, 10, 11.

> *Note: 9-col span is the one exception — it is permitted ONLY in the classic 9+3 (sidebar+content) layout, which is widely established. But 9 should never appear in other contexts (e.g., 9+1+2 = bad).*

**Why these rules exist:** Odd-numbered column spans create fractional math that doesn't align to the 4px grid. A 5-column span in a 12-column grid = 41.666...% width. These fractional percentages produce sub-pixel rendering artefacts across browsers and look unintentional. Even-numbered spans produce clean percentages: 2 col = 16.667%, 4 col = 33.333%, 6 col = 50%, 8 col = 66.667%.

### 1.4 Alternative Grid Systems

| Grid      | When to Use                                                              |
|-----------|--------------------------------------------------------------------------|
| 12-column | **Default.** All general screens, dashboards, settings, forms, details. |
| 6-column  | Simple layouts where 12-column is overly granular. Landing page sections, feature grids with 2–3 items. |
| 4-column  | Gallery/masonry layouts on wide viewports. Card grids with exactly 4 items. Marketing feature comparisons. |

**6-column grid rules:**
- Gutters: same as 12-column (16/12/8 px).
- Allowed spans: 2, 3, 4, 6.
- Use when: the screen has ≤4 content zones and 12 columns would produce excessive unused columns.

**4-column grid rules:**
- Gutters: same.
- Allowed spans: 1, 2, 3, 4 (all spans are valid on a 4-col grid).
- Use when: the content is a flat list of 4 equal items (features grid, pricing tiers, gallery). Never use 4-column grid for primary app layouts.

---

## 2. Layout Archetypes

### 2.1 Single Column

**Span: 1 × 12col (full width) or centered ~700px (prose)**

| Context                        | Width            | Typical Content                                     |
|--------------------------------|------------------|-----------------------------------------------------|
| Content page / reading view    | 700–720 px centered | Long-form article, documentation, blog post       |
| Legal / terms / privacy        | 680–720 px centered | Dense text, no sidebars                            |
| Onboarding / wizard            | 560–640 px centered | Step-by-step form, single focus                    |
| Full-width single column       | 100% (in container) | Data table, wide chart, calendar                    |

```html
<!-- Centered prose layout -->
<div class="max-w-[720px] mx-auto px-6 py-16">
  <article class="prose">...</article>
</div>

<!-- Full-width data layout -->
<div class="max-w-[1280px] mx-auto px-8 py-6">
  <div class="col-span-12">...</div>
</div>
```

**Rules:**
- Prose content max-width: 65–72 characters per line (≈700–720 px at 16 px font).
- Never center-align body text over 3 lines within single-column layouts — left-align (or justified with good hyphenation).
- Full-width single-column layouts still need a container max-width. Never let content stretch to the full viewport width on a 2560 px monitor.

### 2.2 Two Column

**Spans: 3+9, 4+8, 5+7, 6+6**

| Span Pair | Ratio   | Common Use                                              |
|-----------|---------|--------------------------------------------------------|
| 3+9       | 25/75   | Filter sidebar + content, nav rail + main              |
| 4+8       | 33/67   | Standard sidebar + content, form + preview              |
| 5+7       | 42/58   | Wide sidebar (settings nav) + detail panel             |
| 6+6       | 50/50   | Side-by-side comparison, split form, dual-pane editor  |

**Example: 4+8 Sidebar + Content (Dashboard)**

```html
<div class="max-w-[1440px] mx-auto grid grid-cols-12 gap-4 px-8 py-6">
  <!-- Sidebar: 4 columns -->
  <aside class="col-span-3"> <!-- 3 = 4/12 simplified -->
    <nav>...</nav>
  </aside>
  <!-- Main content: 8 columns -->
  <main class="col-span-9"> <!-- 9 = 8/12 simplified -->
    <div class="grid grid-cols-8 gap-4">
      <!-- 2 × 4-col cards inside the 8-col content area -->
      <div class="col-span-4">...</div>
      <div class="col-span-4">...</div>
    </div>
  </main>
</div>
```

**Example: 6+6 Side-by-Side (Settings with Preview)**

```html
<div class="max-w-[1280px] mx-auto grid grid-cols-12 gap-6 px-8 py-8">
  <section class="col-span-6">
    <h2>Customize profile</h2>
    <form>...</form>
  </section>
  <section class="col-span-6">
    <h2>Live preview</h2>
    <div class="preview-card">...</div>
  </section>
</div>
```

### 2.3 Three Column

**Spans: 3+6+3, 2+8+2, 4+4+4**

| Span Triple   | Ratio       | Common Use                                          |
|---------------|-------------|-----------------------------------------------------|
| 3+6+3         | 25/50/25    | Sidebar + feed + activity panel (social, inbox)     |
| 2+8+2         | 17/66/17    | Narrow context panels flanking main workspace       |
| 4+4+4         | 33/33/33    | Equal-weight comparison, 3 feature cards, kanban    |

**Example: 3+6+3 Social Feed**

```html
<div class="max-w-[1440px] mx-auto grid grid-cols-12 gap-4 px-8 py-6">
  <!-- Left sidebar: nav + filters -->
  <aside class="col-span-3">...</aside>
  <!-- Center: main feed -->
  <main class="col-span-6">...</main>
  <!-- Right sidebar: activity, suggestions -->
  <aside class="col-span-3">...</aside>
</div>
```

**Rules for three-column:**
- The center column is the primary focus. Side columns are supplementary — never put critical actions exclusively in side columns.
- On tablet (768–1024 px), collapse to two-column by stacking the right sidebar below or hiding it.
- Never use 4+4+4 for app navigation — equal thirds implies there is no content hierarchy, which is wrong for apps.

### 2.4 Asymmetric Split

**Spans: 5+7, 7+5, 8+4, 4+8 (with visual weighting)**

Asymmetric splits are used on marketing pages, feature sections, and landing pages where visual weight matters more than data density.

| Span Pair | Use                                              |
|-----------|--------------------------------------------------|
| 5+7       | Image/content-heavy left, text/copy right        |
| 7+5       | Text/copy left, image/content-heavy right        |
| 8+4       | Hero: text + CTA (left), illustration (right)    |
| 4+8       | Hero: illustration (left), text + CTA (right)    |

**Example: Landing Hero (8+4)**

```html
<section class="max-w-[1280px] mx-auto grid grid-cols-12 gap-8 px-8 py-24">
  <div class="col-span-7 flex flex-col justify-center">
    <h1>...</h1>
    <p>...</p>
    <div class="flex gap-3">...</div> <!-- CTAs -->
  </div>
  <div class="col-span-5 flex items-center justify-center">
    <img ... />
  </div>
</section>
```

**Rules:**
- Asymmetric splits are for **marketing pages** only, not app screens. App screens use functional splits (sidebar+content).
- The wider side always contains the primary content. The narrower side is supportive.
- On tablet, collapse to single column. The visually "heavier" content (usually the text/CTA side) appears first.

### 2.5 Four Column Grid

**Span: 3+3+3+3**

Used for:
- Feature grids (landing pages: 4 feature highlights)
- Pricing tables (4 tiers)
- Stats/dashboards (4 KPI cards)
- Gallery on wide viewports

```html
<div class="max-w-[1280px] mx-auto grid grid-cols-12 gap-6 px-8 py-16">
  <div class="col-span-3">Feature 1</div>
  <div class="col-span-3">Feature 2</div>
  <div class="col-span-3">Feature 3</div>
  <div class="col-span-3">Feature 4</div>
</div>
```

**Rules:**
- 4-column layout collapses to 2-column at tablet (2 items per row) and 1-column at mobile.
- All 4 items must share the same visual structure (same card/panel type) but vary in CONTENT. Never have 4 identical cards with the same icon size, same title length, and same description pattern.
- Maximum 4 cards per row. Never 5. Never 6. If you have 5+ items, use a 3-column layout with wrapping, or switch to a list/table.

### 2.6 Gallery / Masonry

**Spans: Variable**

Used for:
- Portfolio showcases
- Media-heavy feeds (photo sharing, design gallery)
- Content-rich exploration pages (Pinterest-style)

```html
<!-- CSS columns approach for true masonry -->
<div class="columns-3 gap-4 max-w-[1440px] mx-auto px-8">
  <div class="break-inside-avoid mb-4">...</div>
  <div class="break-inside-avoid mb-4">...</div>
  ...
</div>

<!-- CSS grid approach for gallery (fixed rows) -->
<div class="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-8">
  <div class="aspect-square">...</div>
  ...
</div>
```

**Rules:**
- Gallery grids may use 2, 3, or 4 columns depending on image aspect ratios and viewport width.
- Gallery is for images/media only. Never use gallery/masonry for text-heavy or functional content.
- Each media item must display a label (title, caption, or alt text). Never show unlabeled placeholder images.

---

## 3. When to Use Each Layout Archetype

### Decision Matrix by Product Context

| Context                             | Recommended Archetype            | Container Width | Note                                 |
|-------------------------------------|----------------------------------|-----------------|--------------------------------------|
| Dashboard / workspace               | Two-col (3+9 or 4+8)             | 1440 px         | Sidebar always visible on desktop    |
| Settings / preferences              | Two-col (3+9 or 4+8)             | 1280 px         | Narrow sidebar for section nav       |
| Inbox / messaging                   | Three-col (3+6+3)                | 1440 px         | Thread list + message + details      |
| Form (create/edit)                  | Two-col (4+8 or 5+7) or single   | 960–1280 px     | Form + optional preview/summary      |
| Detail page                         | Single-col (full) or two-col (8+4)| 1280 px         | Full-width main content, sidebar for metadata |
| Analytics / reports                 | Two-col (3+9) with nested grids  | 1440 px         | Filter sidebar + chart grid          |
| Landing page hero                   | Asymmetric (7+5 or 5+7)          | 1280 px         | Marketing context only               |
| Landing page features               | Four-col (3+3+3+3)               | 1280 px         | 4 feature highlights                 |
| Landing page testimonials           | Three-col (4+4+4) or single      | 1280 px         | Customer quotes — use rows, not carousels |
| Documentation / knowledge base      | Two-col (3+9 or 4+8) or single   | 1280 px         | Sticky sidebar nav + prose content   |
| Pricing                             | Four-col (3+3+3+3) or three-col  | 1280 px         | 3–4 tiers                            |
| Feed / timeline                     | Single-col with fixed width      | 600–680 px      | Centered content feed                |
| Gallery / portfolio                 | Gallery (2–4 col)                | 1440 px         | Variable image sizes                 |
| Data table                          | Single-col (full)                | 1440 px         | Full-width table with horizontal scroll |

---

## 4. Container Rules

### 4.1 Max-Width by Content Type

| Content Type                | Max-Width | Rationale                                         |
|-----------------------------|-----------|----------------------------------------------------|
| Reading / prose / docs      | 1280 px   | Optimal line length (65–72 chars)                  |
| Dashboards / data-dense     | 1440 px   | More screen real estate for complex data           |
| Forms (simple)              | 560–640 px| Focused, single-purpose form (login, signup)       |
| Forms (complex)             | 960 px    | Multi-section forms with inline help               |
| Landing pages               | 1280 px   | Hero and feature sections                          |
| Marketing pages (general)   | 1280 px   | Standard web content width                         |
| Email templates             | 600 px    | Email client compatibility                         |

### 4.2 Centering

Every container must be centered:

```css
.container {
  max-width: var(--container-max-width, 1280px);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--container-px, 32px);
  padding-right: var(--container-px, 32px);
}
```

- `padding-left`/`padding-right` (container margin): 32 px on desktop, 24 px on tablet, 16 px on mobile.
- Never use `width: 100%` without a max-width on a container. Full-width content on a 2560 px monitor is a failed layout.

### 4.3 Background Bleed

Full-bleed backgrounds behind centered containers:

```html
<!-- Full-bleed accent band behind centered content -->
<section class="bg-muted/50"> <!-- full width -->
  <div class="max-w-[1280px] mx-auto px-8 py-24"> <!-- centered content -->
    ...
  </div>
</section>
```

The outer `<section>` bleeds edge-to-edge. The inner `<div>` constrains the content to the container max-width. This is the correct pattern. Never make the content itself full-bleed unless it's:
- A data table that genuinely needs the full width
- A deliberate edge-to-edge image or hero visual
- A full-bleed accent band (as above)

---

## 5. Responsive Column Behavior

### 5.1 Breakpoint Map

| Breakpoint | Min-Width | Grid Behavior                                                    |
|------------|-----------|------------------------------------------------------------------|
| Mobile S   | 320 px    | All columns stack. Single-column layout. Gutters: 8 px.          |
| Mobile L   | 480 px    | Single column. Some two-column forms may work. Gutters: 8 px.    |
| Tablet     | 768 px    | Two-column possible. 3-col collapses to 2-col or 1-col. Gutters: 12 px. |
| Desktop S  | 1024 px   | Full grid active. 3-col possible. Sidebar possible. Gutters: 16 px. |
| Desktop M  | 1280 px   | Default target. All archetypes available. Gutters: 16 px.        |
| Desktop L  | 1440 px   | Wide dashboards. Extra space for data-dense views. Gutters: 16 px. |

### 5.2 How Layouts Collapse

| Desktop Layout      | Tablet (768–1023 px)                     | Mobile (<768 px)                          |
|---------------------|------------------------------------------|-------------------------------------------|
| 3+9 (sidebar+main)  | Sidebar collapses to hamburger or top tabs | Sidebar hidden behind hamburger menu    |
| 4+8 (sidebar+main)  | Sidebar collapses to top tabs or hamburger | Single column, nav at top              |
| 5+7 (asymmetric)    | Both columns stack, 5-col first           | Single column                             |
| 4+4+4 (3 equal)     | 2 columns (first 2 in row 1, third below)  | Single column                             |
| 3+6+3 (3-col app)   | Hide right sidebar. Keep left sidebar tabs.| Single column. Sidebar behind hamburger. |
| 3+3+3+3 (4 equal)   | 2 columns × 2 rows                        | Single column                             |
| Gallery 4-col        | 3 columns or 2 columns                    | 2 columns or 1 column                     |

### 5.3 Navigation Collapse Rules

- **Sidebar → Hamburger drawer:** On tablet/mobile, persistent sidebars become off-screen drawers triggered by a hamburger menu button (top-left of the screen). The drawer slides in from the left, overlaying content. Width: 280–320 px.
- **Sidebar → Top tabs:** For settings and section navigation, the sidebar may become a horizontal scrollable tab row at the top of the content area (below the main topbar).
- **Tabbar:** Only appears on mobile (<768 px) and only when there are 3–5 peer destinations (Home, Search, Notifications, Profile). Never on tablet or desktop. Never on app screens without a mobile context.

### 5.4 Content Responsive Rules

- **Tables:** On narrow viewports (<768 px), tables either (a) become horizontal-scrollable containers with a visual scroll affordance, or (b) collapse into card/list views where each row becomes a card.
- **Forms:** Full-width on mobile. Labels sit above inputs (never side-by-side on mobile unless the input is <120 px wide).
- **Cards grids:** 4-col → 2-col → 1-col as viewport narrows.

---

## 6. Grid Gutters

### 6.1 Gutter Scale

| Viewport | Column Gutter | Section Gap (Y) | Container Padding (X) |
|----------|--------------|------------------|------------------------|
| Mobile   | 8 px         | 24 px            | 16 px                  |
| Tablet   | 12 px        | 32 px            | 24 px                  |
| Desktop  | 16 px        | 40–64 px         | 32 px                  |

### 6.2 Row Gap vs Column Gap

- **Section-level Y gaps:** 40–64 px between major sections on desktop. 32 px on tablet. 24 px on mobile.
- **Content-level Y gaps (within sections):** 16–24 px between paragraphs, form groups, card rows.
- **Component-level Y gaps:** 8–16 px between closely related elements (label+input, heading+description).

### 6.3 Gutter Anti-Patterns

- **NEVER** use gutters wider than 32 px on desktop. If you need more white space, use a narrower column span, not a wider gutter.
- **NEVER** use inconsistent gutters within the same layout. All gutters in a grid must be equal.
- **NEVER** use negative margins to pull content out of the grid. If content needs to break the grid, it should be full-bleed at the section level.

---

## 7. Layout Anti-Slop

### 7.1 Forbidden Layout Patterns

- **Centered 12-column layouts:** A layout where everything is `col-span-12` with `text-center` and `mx-auto` = template slop. Apps have hierarchy, which means asymmetric column usage. Marketing pages have narrative flow, which means intentional column variation. If every section is a centered single column, the layout has no point of view.

- **5-column or 7-column spans:** These produce fractional widths (41.666...% or 58.333...%) that can't snap to the 4px grid. They look like measurement errors, not intentional design.

- **Full-width content without max-width container:** Text stretching 2000 px across a wide monitor is unreadable. All content must sit inside a max-width container.

- **Uniform section heights:** When every section on a page has the same vertical height, the page looks like a template. Vary section heights intentionally — a hero might be 500 px, a feature section 400 px, testimonials 300 px, CTA 250 px. Rhythm, not repetition.

- **Center-aligned body text over 3 lines:** Text that runs more than 3 lines and is center-aligned is harder to read than left-aligned text. The eye loses the line-start anchor point. Exceptions: CTAs, empty states, and pull quotes (where it's a deliberate stylistic choice).

- **Overflow hidden without scroll affordance:** If you clip content with `overflow: hidden`, the user must be able to see that there is more content. Add a visual cue: a fade gradient at the edge, a "Show more" button, a scrollbar, or an arrow indicator. Hidden overflow without any affordance is a content trap.

- **No visual hierarchy in the grid:** If the grid has the same column span for every section (all 12-col, or all 6+6, or all 4+4+4), the layout has no focal point. Vary column usage to create visual emphasis — some sections wide, some narrow. This communicates importance.

### 7.2 App Screens vs Marketing Screens — Grid Usage

| Concern        | App Screen                                    | Marketing Screen                             |
|----------------|-----------------------------------------------|----------------------------------------------|
| Purpose        | Functional — help users DO work               | Narrative — convince visitors to act         |
| Primary grid   | Sidebar + content (functional split)          | Asymmetric hero, feature rows, CTA sections  |
| Navigation     | Persistent sidebar or topbar                  | Header nav bar (scroll-away allowed)         |
| Hero           | NEVER. Replace with the primary workspace.    | ALWAYS. First thing the visitor sees.        |
| Footer         | NEVER on desktop. Optional on mobile web app. | ALWAYS. Links, legal, social proof.          |
| Content density | High — fill the viewport with data/actions.  | Medium — breathing room for persuasion.      |
| Column variety | Functional: sidebar is narrow, content is wide | Narrative: alternating wide/narrow sections  |
| Scroll behavior | Infinite scroll or paginated (functional)    | Full-page sections, scroll-triggered reveals |
| Container      | 1440 px (dashboards), 1280 px (general)      | 1280 px                                       |

---

## 8. Layout Examples (Specification Format)

### 8.1 Dashboard Layout (App)

```
PAGE: Project Dashboard
MODE: app
CONTAINER: max-w-[1440px] mx-auto

GRID: 12-col, gap-4, px-8
├── TOPBAR: col-span-12, h-16, fixed top-0
│   ├── Breadcrumbs (left)
│   ├── Search (center)
│   └── User menu (right)
├── SIDEBAR: col-span-3, fixed left, top-16, bottom-0
│   ├── Nav items (icon + label)
│   └── Workspace switcher (bottom)
└── MAIN: col-span-9, col-start-4, pt-16
    ├── Page header: col-span-9, pb-6
    │   ├── Title (left, h1, 24px, weight-600)
    │   └── Primary CTA button (right)
    ├── KPI row: grid grid-cols-9 gap-4
    │   ├── Stat card: col-span-3
    │   ├── Stat card: col-span-3
    │   └── Stat card: col-span-3
    ├── Chart section: grid grid-cols-9 gap-4
    │   ├── Main chart: col-span-6, h-80
    │   └── Activity feed: col-span-3, h-80
    └── Data table: col-span-9
```

### 8.2 Landing Page Layout (Marketing)

```
PAGE: Product Landing
MODE: landing
CONTAINER: max-w-[1280px] mx-auto

├── NAV: full-bleed bg-white, border-b
│   └── Container: max-w-[1280px] mx-auto px-8, flex justify-between
│       ├── Logo (left)
│       └── Nav links + CTA (right)
├── HERO: full-bleed bg-muted/30, py-28
│   └── Container: max-w-[1280px] mx-auto px-8, grid grid-cols-12 gap-8
│       ├── Text: col-span-7
│       │   ├── h1 (48px, weight-700, text-balance)
│       │   ├── p (18px, neutral-600, max-w-prose)
│       │   └── CTA buttons (flex gap-3, mt-8)
│       └── Image: col-span-5, aspect-[4/3]
├── FEATURES: py-24
│   └── Container: max-w-[1280px] mx-auto px-8
│       ├── Section header: text-center, max-w-[600px] mx-auto, mb-16
│       └── Grid: grid-cols-12 gap-6
│           ├── Feature card: col-span-4
│           ├── Feature card: col-span-4
│           └── Feature card: col-span-4
├── TESTIMONIALS: full-bleed bg-muted/50, py-24
│   └── Container: max-w-[1280px] mx-auto px-8
│       ├── Section header: text-left, mb-12
│       └── Grid: grid-cols-12 gap-6
│           ├── Testimonial row: col-span-4 (NO circular avatar, NO centered quote)
│           ├── Testimonial row: col-span-4
│           └── Testimonial row: col-span-4
├── CTA: py-24
│   └── Container: max-w-[640px] mx-auto text-center
│       ├── h2 (36px, weight-700)
│       ├── p (16px, neutral-600)
│       └── Primary button (lg)
└── FOOTER: full-bleed bg-neutral-950, py-16
    └── Container: max-w-[1280px] mx-auto px-8
        └── Footer links grid + copyright
```

### 8.3 Documentation Layout (Docs)

```
PAGE: API Reference
MODE: docs
CONTAINER: max-w-[1280px] mx-auto

├── TOPBAR: full-bleed bg-white, border-b, sticky top-0, z-20
│   └── Container: max-w-[1280px] mx-auto px-8, flex items-center
│       ├── Logo (left)
│       ├── Search bar (center, flex-1, max-w-[480px])
│       └── Theme toggle + GitHub link (right)
├── CONTENT GRID: grid grid-cols-12 gap-0
│   ├── SIDEBAR: col-span-3, sticky top-16, h-[calc(100vh-4rem)], overflow-y-auto, py-8 pr-6
│   │   └── Nav tree (multi-level, collapsible sections)
│   ├── MAIN CONTENT: col-span-7, py-8 px-8
│   │   └── Prose container: max-w-[720px] (matches ~65ch)
│   │       ├── h1, h2, h3 hierarchy
│   │       ├── Code blocks with copy button
│   │       └── Tables, callouts, examples
│   └── TOC (right): col-span-2, sticky top-16, py-8 pl-4
│       └── On-this-page links (h2, h3 anchors)
```

---

## 9. Quick Reference: Layout Rules Checklist

Before marking any screen layout complete, verify:

- [ ] Grid uses 12-column system (or justified 6-column / 4-column alternative)
- [ ] All column spans are multiples of 2 or 3 (2, 3, 4, 6, 8, 12 — 9 permitted only in 9+3)
- [ ] No 5-column, 7-column, 10-column, or 11-column spans
- [ ] Container has a max-width (1280 px or 1440 px) and is centered with mx-auto
- [ ] Full-bleed backgrounds use section wrapping, not content stretching
- [ ] Gutters are consistent: 16 px desktop, 12 px tablet, 8 px mobile
- [ ] Layout archetype matches product context (app = sidebar+content, landing = narrative, docs = sidebar+prose)
- [ ] Responsive collapse behavior is defined for each breakpoint
- [ ] Navigation pattern matches screen type (sidebar for apps, header for marketing, sticky sidebar for docs)
- [ ] No centered 12-column layout on app screens
- [ ] No footer on desktop app screens
- [ ] No tabbar on desktop
- [ ] Section heights intentionally varied (no uniform heights)
- [ ] No center-aligned body text over 3 lines
- [ ] Overflow hidden elements have scroll affordance

---

*This document is §5.3 of the Picasso agent specification. Any layout output that violates column span rules, container constraints, or archetype selection is rejected.*

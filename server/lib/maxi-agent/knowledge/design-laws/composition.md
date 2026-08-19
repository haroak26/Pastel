# Visual Composition Law

> This document governs how components are arranged into screens. Component
> laws tell you what to build; composition law tells you how to arrange what
> you built. A screen of perfect components can still read as a template if
> the composition is wrong.

## 1. The Focal Hierarchy

Every screen has exactly ONE dominant moment — the largest, most visually
weighted element. Everything else is subordinate. The dominant moment is the
screen's reason to exist.

- The dominant moment occupies the largest visual area and carries the
  largest type on the screen (text-4xl, font-black, tracking-tight).
- It sits above the fold on desktop (within the first 600px of viewport).
- On mobile, it is the first content element after chrome.
- Supporting content never competes: if two elements are the same size,
  neither is dominant.

**The test:** Cover everything except the dominant moment. Can you tell what
this screen is about? If yes, the hierarchy works. If no, the screen has no
point of view.

## 2. Visual Flow

The eye moves through a screen in a predictable path. Design for this path;
never fight it.

**Desktop flow (LTR):**
1. **Anchor** — top-left of the content area (the first heading or primary metric)
2. **Dominant moment** — the largest element, which pulls the eye regardless of position
3. **Supporting content** — flows downward from the dominant moment
4. **Actions** — bottom of the section or right-aligned in the dominant moment's row

**Mobile flow:**
1. **Chrome** — nav/tabbar (dismissed mentally)
2. **Dominant moment** — same as desktop, now full-width
3. **Supporting content** — stacked vertically, each section a distinct surface
4. **Actions** — sticky bottom or inline after the last content section

**How to guide flow without decoration:**
- **Size** — larger elements are seen first
- **Position** — top-left is seen before bottom-right (in LTR)
- **Contrast** — high-contrast elements pull attention (accent on muted)
- **Whitespace** — an element surrounded by whitespace is more prominent than one surrounded by content

Never use decorative elements (blobs, lines, gradients) to "guide the eye."
Size, position, and contrast do this work.

## 3. Surface Variety

Never two identical adjacent sections. This is the single most effective
composition technique, and the most commonly violated.

**Legal adjacent pairs:**
- tonal band → divided rows
- divided rows → card cluster
- card cluster → tonal band
- full-bleed hero → inset content
- table → tonal band
- feed → card cluster

**Illegal adjacent pairs:**
- card → card (two card sections in a row)
- rows → rows (two divided-list sections in a row)
- band → band (two tonal-band sections with the same treatment)
- table → table (two table sections in a row)

**Surface palette:**
| Surface | CSS Pattern | Use For |
|---------|-------------|---------|
| Tonal band | `bg-muted/50 py-8` | Hero metrics, scoreboards, stat strips |
| Divided rows | `divide-y border-t` | Lists, activity feeds, record rows |
| Card | `rounded-[var(--radius-lg)] border bg-card p-5` | Isolated summaries (max 4/screen) |
| Table | `w-full` with `thead`/`tbody` | Dense data with 3+ columns |
| Full-bleed | `-mx-6 md:-mx-8 px-6 md:px-8 bg-foreground text-background` | Hero statement, inverted accent |
| Inset | `px-6 md:px-8` (default content padding) | Standard content sections |

## 4. Asymmetric Balance

Intentional imbalance reads as designed. Perfect symmetry reads as a template.

**The 2/3 + 1/3 rule:** When a screen has two columns, make one larger:
- Primary content: `col-span-2` (66%)
- Secondary content: `col-span-1` (33%)

**Never 50/50 on desktop.** Two equal columns with equal content density is
the hallmark of template output. If the content genuinely needs equal space
(e.g., a comparison), use a different layout entirely (stacked sections with
alternating surfaces).

**Exception:** A 4-column grid of small items (metrics, icons) is fine because
the items are uniform and the grid IS the design.

**Mobile:** All columns stack to full-width. The asymmetry manifests as
ordering — the primary content appears first.

## 5. Density as Craft

Empty space is intentional, not default. A screen that looks "clean" often
reads as unfinished.

**Density rules:**
- A list with fewer than 4 rows reads as broken. The data generator produces
  7 rows — render all of them.
- A metric section with fewer than 3 metrics reads as a stub. Show at least
  3 metrics in a scoreboard.
- A detail screen should have at least 4 field rows plus a title and status.
- An activity feed should show at least 3 events.

**Whitespace is earned:**
- Whitespace above and below the dominant moment: intentional, creates focus.
- Whitespace inside a component with no content: bug.
- Whitespace between sections: use the theme's section-gap, never invent
  arbitrary values.

**The density test:** Remove all whitespace from the screen mentally. Is there
enough content to fill the space? If not, add content before adding padding.

## 6. The One-Sentence Test

Can you describe what the screen is ABOUT in one sentence?

- "This screen shows my weekly running stats and recent sessions."
- "This screen shows one invoice's line items and payment status."
- "This screen shows my recipe collection with search and categories."

If you can't describe it in one sentence, the screen has no point of view.
Every element on the screen should serve that sentence. Elements that don't
serve it should be removed.

**Common failures:**
- "This screen shows metrics AND a list AND an activity feed AND a chart AND
  recent items AND..." — too many stories. Pick one; subordinate the rest.
- "This screen shows some data." — too vague. What data? For whom?

## 7. Component Composition Patterns

These are the proven patterns for arranging common component types. They are
starting points, not templates — adapt them to the product's concept.

### Pattern: Metric + List (track / operate products)
```
[Hero metric band — 3-4 large stats in a row]
[Divided row list — primary records with status badges]
[Optional: quiet activity feed at bottom]
```
Best for: project trackers, fitness apps, inventory management, task tools.

### Pattern: Hero + Detail (detail screens)
```
[Title block — large title + status badge + primary action]
[Field grid — 4-8 key-value pairs, 2-column on desktop]
[Supporting section — one of: timeline, comments, related items]
```
Best for: record details, order views, profile pages.

### Pattern: Grid + Feed (browse / social products)
```
[Search/filter toolbar — search input + one dropdown + primary action]
[Card grid — 3-4 columns on desktop, 1 on mobile]
[OR: mosaic gallery for media-rich items]
```
Best for: marketplaces, catalogs, social feeds, media libraries.

### Pattern: Table + Toolbar (data-dense products)
```
[Toolbar — search + filter dropdowns + action button]
[Dense data table — hairline dividers, right-aligned numerics]
[Pagination or "show more" at bottom]
```
Best for: admin panels, financial tools, analytics dashboards.

### Pattern: Statement + Sections (editorial / landing-style)
```
[Full-width statement band — inverted, one bold headline]
[2-column feature strip — asymmetric 2/3 + 1/3]
[Divided rows — supporting content or testimonials]
```
Best for: product marketing pages, portfolio showcases.

## 8. Mobile Composition

Desktop compositions must collapse gracefully. The dominant moment survives;
supporting content folds.

**Collapse rules:**
- 2/3 + 1/3 columns → stacked, primary first
- Sidebar nav → bottom tabbar or hidden hamburger
- Horizontal metric strip → 2-column grid
- Wide table → card-per-row (each row becomes a mini-card)
- Multi-column grid → single column

**Mobile-specific patterns:**
- Swipeable cards for horizontal content (use overflow-x-auto + snap-x)
- Sticky action bar at bottom for the primary CTA
- Collapsible sections for long content (disclosure pattern)
- Pull-to-refresh for feed content

**What NOT to do on mobile:**
- Don't hide the dominant moment behind a fold
- Don't show the same content as desktop but smaller — restructure
- Don't use horizontal scroll for tables without snap points
- Don't stack two full-width cards with identical structure

## 9. Section Rhythm

Sections alternate in surface type AND padding to create vertical rhythm.

**Padding ladder (from theme):**
- `sm`: 24px (`py-6`)
- `md`: 32px (`py-8`)
- `lg`: 40px (`py-10`) — standard section
- `xl`: 48px (`py-12`) — hero/dominant moment
- `2xl`: 64px (`py-16`) — full-bleed statement

**Rules:**
- Adjacent sections use different padding steps (never two `lg` in a row).
- The dominant moment gets `xl` or `2xl`. Everything else gets `lg` or `md`.
- Full-bleed sections use `2xl` padding to justify their edge-to-edge treatment.
- Never use padding smaller than `sm` between sections — content needs room to breathe.

## 10. Composition Anti-Patterns

These are the signs of template output. If you see them, redesign:

1. **The Card Grid of Doom** — 3+ identical cards in a row with the same structure. Use rows, bands, or varied card sizes instead.
2. **The Centered Everything** — every section centered, every heading centered. Use left-alignment for content; center only hero moments.
3. **The Feature Dump** — 5+ feature cards below the hero. Pick 2-3; make them different surfaces.
4. **The Footer Before Content** — a thin hero followed by 400px of whitespace and a footer. Fill the screen.
5. **The Identical Sibling Screens** — home and detail look the same except for the content. Differentiate their composition.
6. **The Kitchen Sink Screen** — metrics + list + feed + chart + activity + recent + trending on one screen. Pick a story; subordinate the rest.

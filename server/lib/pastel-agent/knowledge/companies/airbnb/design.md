# Airbnb UI — Design Replication Specification

> **Purpose of this document:** This is a complete, standalone build specification for replicating the Airbnb web UI (homepage, listing detail page, search/map results page, and auth modal) pixel-for-pixel. It is written for an AI coding agent to consume directly — every value is explicit, no value should need to be "guessed" or "interpreted." Colors were extracted via pixel-sampling of real screenshots. Where a sampled screenshot value was softened by compression/anti-aliasing, the value has been reconciled against Airbnb's known production design tokens (DLS / "Design Language System") so the output is accurate, not just visually close.
>
> **Scope covered:** 4 page states — (1) Homepage / logged-out home feed, (2) Listing Detail Page (PDP), (3) Search Results page (split list+map view), (4) "Log in or sign up" auth modal (two variants: fresh page load, and triggered-over-content with scrim).

---

## 0. Tech Stack Recommendation

Build this with:
- **Framework:** React (Next.js App Router preferred, but plain React + Vite is fine)
- **Styling:** Tailwind CSS (utility classes map cleanly to the tokens below) — OR plain CSS using the custom properties in §1
- **Icons:** `lucide-react` for generic icons (heart, search, X, chevron, sliders). For the Airbnb bug/glyph, hand-draw the SVG path given in §2.1 — do not substitute a generic house icon.
- **Fonts:** See §1.4 — self-host or use a very close system-font fallback stack, because the true font (Airbnb Cereal) is proprietary and not on Google Fonts.
- **Maps:** Google Maps JS API or MapLibre GL with a light/"silver"-style basemap (see §6.4) for the search page.

Directory structure to generate:
```
/src
  /components
    /layout
      NavBar.jsx
      SearchPillExpanded.jsx      # homepage 4-segment pill
      SearchPillCompact.jsx       # PDP/search-page 3-segment pill
      Footer.jsx
    /cards
      ListingCardVertical.jsx     # homepage grid card
      ListingCardHorizontal.jsx   # search-page split-view card
      BadgePill.jsx               # "Guest favourite" / "Guest favorite" reusable badge
      NewFeatureBadge.jsx         # dark "NEW" pill used in nav
    /modal
      AuthModal.jsx
      SocialAuthButton.jsx
    /pdp
      PhotoGrid.jsx
      GuestFavouriteBox.jsx
      PriceCalloutTag.jsx
      BookingBox.jsx
      DateInputPair.jsx
    /search
      FilterChipsRow.jsx
      MapView.jsx
      MapPricePin.jsx
      MapCenterMarker.jsx
    /ui
      Button.jsx
      IconCircleButton.jsx        # the gray circular globe/menu buttons
      HeartToggle.jsx
  /pages (or /app routes)
    index.jsx                     # Homepage
    listing/[id].jsx               # PDP
    search.jsx                    # Search results
  /styles
    tokens.css                    # all custom properties from §1
  /assets
    airbnb-logo.svg
    airbnb-glyph.svg
```

---

## 1. Design Tokens

Declare these as CSS custom properties (or a Tailwind theme extension) **once**, globally, and reference them everywhere. Do not hardcode hex values inline in components.

### 1.1 Color Tokens

```css
:root {
  /* ---- Brand / Primary ---- */
  --color-brand-rausch: #FF385C;        /* primary Airbnb "Rausch" red — logo, links, primary actions */
  --color-brand-rausch-dark: #E31C5F;   /* pressed/darker state, mid-gradient stop */
  --color-brand-babu: #00A699;          /* teal accent (rarely used in this UI, kept for completeness) */
  --color-brand-arches: #FC642D;        /* orange accent (rarely used) */

  /* ---- Primary Button Gradient (the "Continue" button + main CTA) ---- */
  --gradient-primary-start: #E61E4D;    /* left stop */
  --gradient-primary-mid:   #E31C5F;    /* middle stop */
  --gradient-primary-end:   #D70466;    /* right stop, magenta-leaning */
  --gradient-primary: linear-gradient(to right, var(--gradient-primary-start), var(--gradient-primary-mid) 50%, var(--gradient-primary-end));
  /* Sampled from screenshots: gradient runs approx #d33851 -> #c62b66 at rendered opacity.
     Use the token above for true/undimmed brand values. */

  /* ---- Small solid pink (search magnifier circle button, uses flat fill not gradient) ---- */
  --color-search-btn: #E9435F;          /* pixel-sampled: rgb(234,68,97) / #ea4461, rounds to this */

  /* ---- Text ---- */
  --color-text-primary: #222222;        /* headings, titles, primary body text */
  --color-text-secondary: #6A6A6A;      /* subtext, meta rows (e.g. "$358 for 2 nights") */
  --color-text-placeholder: #717171;    /* input placeholders, nav "Where/Search destinations" 2nd line */
  --color-text-disabled: #B0B0B0;
  --color-text-on-dark: #FFFFFF;
  --color-text-link: #222222;           /* Airbnb underlines links but keeps them same color as body, not blue */

  /* ---- Backgrounds ---- */
  --color-bg-page: #FFFFFF;             /* main page background is pure white */
  --color-bg-subtle: #F7F7F7;           /* thin strip directly under nav search pill on homepage */
  --color-bg-card-hover: #F7F7F7;
  --color-bg-modal-scrim: rgba(0, 0, 0, 0.6); /* dark overlay behind auth modal (image 4) */
  --color-bg-input: #FFFFFF;
  --color-bg-icon-circle: #F2F2F2;      /* the gray circle behind globe icon / hamburger icon */

  /* ---- Borders / Dividers ---- */
  --color-border-default: #DDDDDD;      /* search pill outline, input outline, card outline boxes */
  --color-border-subtle: #EBEBEB;       /* hairline dividers, "or" divider line in modal */
  --color-border-strong: #B0B0B0;       /* input border on focus/hover */
  --color-divider-nav: #F0F0F0;         /* thin line under sticky nav on PDP */

  /* ---- Badges ---- */
  --color-badge-new-bg: #4A5A78;        /* dark navy-slate "NEW" pill background (nav Experiences/Services) */
  --color-badge-new-bg-shadow: #2E3A52; /* subtle inner-shadow/bottom-edge tone for the 3D pill effect */
  --color-badge-favourite-bg: #FFFFFF;  /* "Guest favourite/favorite" white pill */
  --color-badge-favourite-text: #222222;

  /* ---- Semantic / Utility ---- */
  --color-success-tag: #7CBE6D;         /* green price-comparison luggage-tag icon on PDP */
  --color-star-rating: #222222;         /* rating star glyph is solid black/near-black, NOT yellow/gold */
  --color-heart-outline: #FFFFFF;       /* heart icon stroke on image overlays */
  --color-heart-icon-scrim: rgba(0,0,0,0.5); /* translucent dark circle some heart buttons sit on (search page grid) */
  --color-map-pin-bg: #FFFFFF;
  --color-map-pin-text: #222222;
  --color-map-pin-shadow: rgba(0,0,0,0.18);
  --color-map-road-badge-green: #6B8E3D; /* UK "A-road" style green badge seen on map */
  --color-map-road-badge-blue: #4C6FA5;  /* motorway "M1" blue badge */

  /* ---- Shadows ---- */
  --shadow-pill: 0 1px 2px rgba(0,0,0,0.08), 0 3px 12px rgba(0,0,0,0.08);
  --shadow-card: 0 6px 16px rgba(0,0,0,0.12);
  --shadow-card-hover: 0 6px 20px rgba(0,0,0,0.18);
  --shadow-modal: 0 8px 28px rgba(0,0,0,0.28);
  --shadow-map-pin: 0 2px 4px rgba(0,0,0,0.18);
  --shadow-icon-btn: 0 1px 4px rgba(0,0,0,0.1);
}
```

### 1.2 Spacing Scale (4px base unit)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

### 1.3 Radius Scale

```css
:root {
  --radius-sm: 4px;     /* small chips, checkbox-like elements */
  --radius-md: 8px;     /* social auth square buttons */
  --radius-lg: 12px;    /* input fields, guest-favourite info box, image corners inside cards */
  --radius-xl: 16px;    /* listing card image container, PDP photo grid outer corners */
  --radius-2xl: 24px;   /* auth modal container */
  --radius-full: 9999px; /* search pill, filter chips, avatar circles, icon-circle buttons, badges, buttons */
}
```

### 1.4 Typography

Airbnb's real typeface is **"Airbnb Cereal"** (proprietary, licensed — not legally distributable/embeddable in a clone). Use this fallback stack, which is metrically closest and shares Cereal's geometric-humanist, rounded-terminal character:

```css
:root {
  --font-family-base: "Circular", "Airbnb Cereal", -apple-system, BlinkMacSystemFont,
    "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
```

If self-hosting a lookalike is desired, **"Inter"** or **"Sofia Pro"** are the two nearest free/licensable geometric sans substitutes; Inter is recommended for an AI agent build since it's freely available via Google Fonts / `next/font`.

Type scale (all `font-family: var(--font-family-base)`):

| Token | Size | Weight | Line-height | Letter-spacing | Used for |
|---|---|---|---|---|---|
| `--text-display` | 32px | 700 (Bold) | 1.2 | -0.02em | "Log in or sign up" modal heading, PDP listing title |
| `--text-h1` | 26px | 700 | 1.25 | -0.01em | Section headings ("Popular homes in Paris") |
| `--text-h2` | 22px | 600 (Semibold) | 1.3 | normal | Card group sub-headers |
| `--text-body-lg` | 18px | 600 | 1.4 | normal | Card titles ("Apartment in Paris"), price total |
| `--text-body` | 16px | 400 | 1.5 | normal | Standard paragraph/meta text |
| `--text-body-medium` | 16px | 500 | 1.5 | normal | Nav links, input labels |
| `--text-sm` | 14px | 400 | 1.4 | normal | Card meta line ("$358 for 2 nights · ★4.92") |
| `--text-xs` | 12px | 600 | 1.3 | 0.02em uppercase optional | "NEW" badge text, small tags |

Font weight tokens: `400` (Book/Regular), `500` (Medium), `600` (Semibold/Bold-ish for card titles), `700` (Bold, for headings).

### 1.5 Breakpoints

```css
:root {
  --bp-sm: 744px;
  --bp-md: 1024px;
  --bp-lg: 1280px;
  --bp-xl: 1440px;
}
```
Max content width on desktop: `1760px`, centered, with `80px` side gutters at `--bp-xl` and up, scaling down to `24px` gutters below `--bp-md`.

---

## 2. Brand Assets

### 2.1 Logo (glyph + wordmark)

The Airbnb "Bélo" symbol is a rounded-triangle/teardrop shape formed from a loop, a circle, and a point — do not approximate with a generic house/pin icon. Use this SVG path (scaled to a 32×32 viewBox, stroke-based rendering matching the outline/stroke style seen in the login modal and outline-only variant seen in the nav):

```html
<!-- Airbnb glyph, outline style (used standalone, e.g. modal header) -->
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 2C11 2 4 12 4 18.5C4 23.5 8.5 27 12.5 27C14 27 15 26.3 16 25C17 26.3 18 27 19.5 27C23.5 27 28 23.5 28 18.5C28 12 21 2 16 2Z"
    stroke="#FF385C" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="12.5" cy="19" r="3" stroke="#FF385C" stroke-width="2"/>
  <circle cx="19.5" cy="19" r="3" stroke="#FF385C" stroke-width="2"/>
</svg>
```

- **Solid/filled variant** (used at small nav sizes, top-left corner): same silhouette, `fill="#FF385C"`, no stroke.
- **Color:** exactly `--color-brand-rausch` (`#FF385C`).
- **Nav placement:** glyph is ~24–28px square, immediately followed (no gap larger than 6px) by the wordmark.

### 2.2 Wordmark

- Text: `airbnb`, all lowercase, always.
- Weight: 700 (Bold/Extra-bold — noticeably heavier than body text).
- Color: `--color-brand-rausch` (`#FF385C`).
- Size: `24px` in the main nav; scales down proportionally with the glyph on mobile.
- Letter-spacing: -0.01em (very slightly tight).

### 2.3 Favicon / App Icon
Use the solid glyph only (§2.1 filled variant) on a white or transparent background, 32×32 and 16×16 exports.

---

## 3. Global Layout — Navigation Bar

There are **two nav-bar states** across the screenshots. Build both as one `<NavBar variant="expanded" | "compact">` component.

### 3.1 Shared structure (all pages)

```
[Logo+Wordmark]   [Center: Nav Tabs OR Search Pill]   [Become a host] [Globe icon] [Menu icon]
```
- Height: `80px` fixed.
- Background: `#FFFFFF`, no shadow by default; add `box-shadow: 0 1px 0 var(--color-divider-nav)` OR a `1px solid var(--color-divider-nav)` bottom border when the pill is in compact/scrolled state (this is visible as a thin hairline under the nav on the PDP screenshot).
- Horizontal padding: `80px` on desktop (`24px` on mobile).
- `position: sticky; top: 0; z-index: 50;`

### 3.2 Left: Logo block
- Flex row, `align-items: center`, `gap: 8px`.
- Glyph 32px, wordmark 24px/700 weight, color `--color-brand-rausch`.
- Entire block is a link to `/`.

### 3.3 Center — Tab variant (Homepage only, Image 1)

Three tab items, horizontally centered as a group:

| Tab | Icon | Badge | State |
|---|---|---|---|
| Homes | small house-with-tree pictogram (full-color mini illustration, not a line icon) | none | **active** — bold black text `#222222`, `2px` solid black underline positioned `12px` below text, offset to match text width |
| Experiences | hot-air-balloon pictogram (full-color) | "NEW" pill, positioned top-right of icon, overlapping | inactive — text color `--color-text-secondary` (#6A6A6A), weight 500, no underline |
| Services | concierge-bell pictogram (full-color) | "NEW" pill | inactive, same style as Experiences |

- Gap between the 3 tab items: `32px`.
- Each tab item is icon (28px) stacked/inline-left of label with `8px` gap, `label` at `16px/600`.
- **"NEW" badge spec:** background `--color-badge-new-bg` (#4A5A78), fully rounded pill (`border-radius: full`), text `#FFFFFF` `10px/700` uppercase, padding `2px 8px`, positioned `absolute`, `top: -8px; right: -18px` relative to the icon, with a subtle bottom-edge darker shading (`box-shadow: inset 0 -2px 0 var(--color-badge-new-bg-shadow)`) to create a light 3D/glossy pill look as seen in the screenshot.

### 3.4 Center — Search Pill variant (all pages, two sub-states)

**3.4.a Expanded / 4-segment (Homepage default state, Image 1):**

A single pill-shaped container, `height: 66px`, `border-radius: full`, `border: 1px solid var(--color-border-default)`, `box-shadow: var(--shadow-pill)`, `background: #FFFFFF`, containing 4 unequal-width segments separated by `1px` vertical dividers (`background: var(--color-border-subtle)`, height `32px`, centered vertically):

| Segment | Width (approx) | Label (bold, 14px/600, `#222`) | Placeholder/value (14px/400, `--color-text-placeholder`) |
|---|---|---|---|
| Where | ~340px, flush-left, extra left padding `32px` for the pill's rounded cap | `Where` | `Search destinations` |
| Check in | ~180px | `Check in` | `Add dates` |
| Check out | ~180px | `Check out` | `Add dates` |
| Who | ~180px, contains the search button at its right edge | `Who` | `Add guests` |

- Each segment: `display:flex; flex-direction:column; justify-content:center; padding: 0 24px;`, clickable, `cursor:pointer`, `hover: background var(--color-bg-icon-circle)` with matching corner radius on outer segments only.
- **Search button:** perfect circle, `48px × 48px`, `background: var(--color-search-btn)` solid fill (flat, not gradient, at this small size), positioned at the pill's right end with `8px` margin from the pill's inner edge, centered vertically. Contains a white magnifying-glass icon (Lucide `Search`, `20px`, `stroke-width: 2.5`, `color:#FFFFFF`). On hover, button may grow slightly and reveal the word "Search" in white text next to the icon (optional enhancement, not required for pixel match of the static screenshot).

**3.4.b Compact / 3-segment (PDP + Search Results pages, Images 2 & 5):**

Same pill container styling, but much narrower (`~420px` wide, `height: 56px`), no bold "label above placeholder" — instead single-line text per segment, separated by thin `1px` vertical dividers with `20px` height:

- Image 2 (PDP) reads: `🏠 Anywhere` | `Anytime` | `Add guests` `[🔍]`
- Image 5 (Search results) reads: `🏠 Homes in London` | `Any weekend` | `Add guests` `[🔍]`

Text: `15px/500`, color `#222222` (all segments equal weight here — no gray placeholder distinction since these reflect an active/default search context, not empty state). Small house pictogram icon (`20px`) precedes only the first segment. Search circle button same spec as 3.4.a but `40px` diameter.

> **Agent implementation note:** Use one `<SearchPill>` component accepting a `segments` prop array (each `{icon?, label?, value, divider}`) and a `size: "expanded" | "compact"` prop, rather than duplicating markup.

### 3.5 Right side controls

Flex row, `gap: 12px`, `align-items:center`:

1. **"Become a host"** — text link, `15px/500`, color `#222222`, no underline by default, underline on hover, `padding: 12px`, fully-rounded hover background `--color-bg-icon-circle`.
2. **Globe icon button** — `40px × 40px` circle, `background: transparent`, `border: none` default; icon is a globe/language-switcher glyph (Lucide `Globe`), `20px`, `color:#222222`. On its own it has no background fill in the screenshots (transparent), but wrap in a `40px` circular hit-area with hover-state `background: var(--color-bg-icon-circle)`.
3. **Menu/hamburger button** — `40px × 40px` **filled** circle, `background: var(--color-bg-icon-circle)` (#F2F2F2) at rest — this one DOES have a visible gray circle background always-on (distinguishing it from the globe button which is transparent-until-hover). Contains a 3-line hamburger icon, `18px`, `color:#222222`, centered. `box-shadow: var(--shadow-icon-btn)`.

---

## 4. Homepage (`/`) — Image 1

### 4.1 Page structure top-to-bottom
```
<NavBar variant="expanded" />
<main>
  <SectionRow title="Popular homes in Paris" cards={7} />
  <SectionRow title="Available next month in San Juan" cards={7} />
  <SectionRow title="Stay in Miami" cards={7} />
  ...additional SectionRows (infinite pattern)
</main>
<Footer />
```
Background is `--color-bg-page` (#FFFFFF) throughout; there is a very subtle `#F7F7F7` tint visible immediately below the nav pill before the first section starts — implement as a `~24px` tall spacer div with that background, or simply treat as page background variation and ignore if using pure white (difference is <5% luminance, not critical).

### 4.2 SectionRow component

- Top padding above each section: `40px`. Bottom padding: `8px`.
- **Header row:** flex, `justify-content: space-between`, `align-items:center`, bottom margin `24px`.
  - Title: `26px/700`, color `#222222`, e.g. "Popular homes in Paris", followed immediately by a small chevron-right (`›`) glyph inline (same color, `20px`), the whole title+chevron is clickable → navigates to a filtered listing view.
  - Right side: two circular nav-arrow buttons (`‹` `›`), `40px` each, `border: 1px solid var(--color-border-default)`, `background:#FFFFFF`, `box-shadow: var(--shadow-icon-btn)`, `border-radius: full`, gap `8px` between them. Left arrow is visually disabled/lighter (`opacity:0.4`) when at scroll-start (matches screenshot where left chevron on section 1 is faint).
- **Card row:** horizontal flex, `gap: 24px`, `overflow-x: auto` (hidden scrollbar, this is a carousel), snapping to show exactly 7 cards at desktop `1760px` container width → each card is `~208px` wide.

### 4.3 ListingCardVertical (homepage grid card)

```
┌─────────────────────────┐
│  [image, 1:1 aspect]     │  ← rounded-xl (16px) on ALL 4 corners
│  ⬤Guest favorite    ♡    │  ← badge top-left, heart top-right, both overlaid on image
└─────────────────────────┘
Apartment in Paris              ← 15px/600, color #222222, margin-top 12px
$358 for 2 nights · ★ 4.92      ← 14px/400, color #6A6A6A, margin-top 4px
```

Detailed specs:
- **Image container:** `aspect-ratio: 1/1`, `border-radius: 16px`, `overflow:hidden`, `position:relative`. Image itself `object-fit:cover`, subtle `transform: scale(1.03)` on card hover with `transition: transform 300ms ease`.
- **"Guest favorite" badge:** positioned `absolute; top:12px; left:12px;`. `background:#FFFFFF`, `border-radius: full`, `padding: 6px 12px`, `font: 12px/600`, `color:#222222`, `box-shadow: 0 1px 3px rgba(0,0,0,0.15)`. Text exactly `Guest favorite` (US spelling on homepage/grid cards) — note the search-results page trophy variant uses `Guest favourite` (UK spelling) with a 🏆 emoji prefix; keep both variants available via a `spelling: "us" | "uk"` and `icon?: "trophy"` prop.
- **Heart/save button:** `absolute; top:12px; right:12px;`. `28px` heart-outline icon, `color:#FFFFFF`, `stroke-width:2`, with a drop-shadow filter (`filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4))`) instead of a background circle on the homepage variant — the heart sits directly on the photo with just a shadow for contrast (no gray circle backing, unlike the search-results variant in §6.3). On click, fills solid `--color-brand-rausch` with a small scale-bounce animation.
- **Title:** `margin-top: 12px`, `font: 15px/600`, `color: #222222`, single line, `text-overflow: ellipsis; white-space: nowrap; overflow:hidden`.
- **Meta line:** `margin-top: 2px`, `font: 14px/400`, `color: #6A6A6A`. Structure: `{price} for {n} nights · ★ {rating}`. The `·` is a middle-dot `\u00B7` with `4px` space each side. The star is a **solid filled black star glyph** (Unicode `★` or an SVG filled star, color `#222222` — matches the title text color, it is emphatically NOT gold/yellow) immediately followed by the numeric rating with one space.
- Entire card is a single `<a>`/`<Link>` wrapping image+text, `cursor:pointer`.

### 4.4 Section titles observed in screenshot (use as sample/seed content)
1. "Popular homes in Paris"
2. "Available next month in San Juan"
3. "Stay in Miami"
(Pattern continues with more city-based rows on scroll — an agent populating placeholder content should generate additional rows following this "Popular homes in {City}" / "Available next month in {City}" / "Stay in {City}" naming convention.)

### 4.5 Floating info toast ("Prices include all fees")
A small transient pill visible mid-page in the screenshot: `position: fixed` (or sticky within viewport), centered horizontally over the card grid, `background:#FFFFFF`, `border-radius:12px`, `padding:12px 16px`, `box-shadow: var(--shadow-card)`, containing a small pink price-tag icon (`20px`, color `--color-brand-rausch`) + text `Prices include all fees` (`14px/500`, `#222222`). This is a dismissible toast that appears once per session on scroll — implement with a `useState` dismiss flag, auto-hide after ~4s or on scroll-past.

---

## 5. Listing Detail Page (PDP) — Image 2

Route: `/listing/[id]`

### 5.1 Page structure
```
<NavBar variant="compact" />              ← thin bottom border-divider visible here
<div class="pdp-header">
  <h1>{listing.title}</h1>
  <div class="share-save-row">Share · Save</div>
</div>
<PhotoGrid images={listing.photos} />
<div class="pdp-body-grid">                ← 2-column: left ~60%, right ~40%
  <div class="left-col">
    <ListingSummary />
    <GuestFavouriteBox />
    ...(amenities, description, reviews sections continue below fold)
  </div>
  <div class="right-col">
    <PriceCalloutTag />
    <BookingBox />                          ← sticky, follows scroll
  </div>
</div>
```
Max content width: `1760px` (aligns with global container), centered.

### 5.2 Header block
- `<h1>` title: exactly `32px/700`, color `#222222`, `margin: 24px 0 16px 0`. Example content: "Stylish Kensington Studio with French window views".
- Share/Save row: `position:absolute; top: {aligned with h1}; right: 0;` flex `gap:24px`.
  - `Share` — underlined text, small up-arrow-from-box icon (Lucide `Share`) `16px` left of text, `15px/600`, color `#222222`.
  - `Save` — underlined text, heart-outline icon `16px` left of text, same text style. Fills red on click like the card heart.

### 5.3 PhotoGrid

CSS Grid, 5 cells in a "hero-left, 4-small-right" bento layout:
```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  height: 480px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}
.photo-grid .hero { grid-column: 1 / 3; grid-row: 1 / 3; }         /* large left image, occupies left half, full height */
.photo-grid .small { grid-column: span 1; grid-row: span 1; }      /* 4 remaining images, 2x2 on the right half */
```
- Each `img`: `object-fit: cover; width:100%; height:100%;`.
- Only the **outer 4 corners** of the whole grid are rounded (`16px`); internal seams stay square, consistent with the screenshot (top-left, top-right, bottom-left, bottom-right of the *whole group* are rounded — individual inner tiles are not).
- **"Show all photos" button:** `position:absolute; bottom:16px; right:16px;`. `background:#FFFFFF`, `border:1px solid #222222`, `border-radius:8px`, `padding:8px 16px`, `font:14px/600`, `color:#222222`, small grid/`⊞` icon left of text, `box-shadow: var(--shadow-icon-btn)`. Opens a full photo lightbox modal on click.
- Grid collapses to a single full-width swipeable carousel below `--bp-sm`.

### 5.4 ListingSummary (left column, below photo grid)
```
Entire rental unit in Greater London, United Kingdom     ← 22px/600, #222222
2 guests · 1 bedroom · 1 bed · 1 bathroom                 ← 16px/400, #6A6A6A, margin-top 8px
```
`margin: 24px 0`. Below this is where a `<hr>` divider (`1px solid var(--color-border-subtle)`) would separate into host-info/amenities sections in a full build (not shown in provided screenshot crop, but standard PDP pattern — include the divider even if content below is placeholder).

### 5.5 GuestFavouriteBox

A bordered info card:
```css
.guest-fav-box {
  display: flex;
  align-items: center;
  gap: 24px;
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 16px;
}
```
Contents, left to right:
1. **Laurel icon pair + label:** two mirrored laurel-wreath SVG glyphs (`24px` each, `color:#222222`, `stroke-width:1.5`) flanking a 2-line centered label `Guest\nfavourite` (`13px/700`, `#222222`, `text-align:center`, `line-height:1.2`). This mimics an "award medal" visual treatment.
2. **Vertical divider** `1px solid var(--color-border-subtle)`, height `40px`.
3. **Description text:** `One of the most loved homes on Airbnb, according to guests` — `15px/400`, `#222222`, max-width `~240px`, wraps to 2 lines.
4. **Rating block:** `5.0` (`22px/600`, `#222222`) stacked above 5 small solid black star glyphs (`12px` each, tightly spaced, no gaps).
5. **Vertical divider** (same as #2).
6. **Review count block:** `10` (`22px/600`, `#222222`) stacked above `Reviews` label (`13px/400`, `#6A6A6A`).

Items 4–6 are evenly spaced with `margin-left: auto`-style right-alignment within the box, i.e. the box is `justify-content: space-between` across its 3 logical groups (icon+label / description / stats).

### 5.6 PriceCalloutTag (right column, top)
```css
.price-callout {
  display:flex; align-items:center; gap:12px;
  background:#FFFFFF; border:1px solid var(--color-border-default);
  border-radius:12px; padding:16px 20px; box-shadow: var(--shadow-icon-btn);
  margin-bottom:16px;
}
```
- Icon: a green price/luggage-tag glyph, `20px`, `color: var(--color-success-tag)` (#7CBE6D), filled style with a small circular "hole" cutout near the top-left (like a real price tag).
- Text: `Your price is below the 60-day average` — `14px/500`, `#222222`.

### 5.7 BookingBox (sticky sidebar card)
```css
.booking-box {
  position: sticky; top: 100px;
  border: 1px solid var(--color-border-default);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-card);
}
```
- **Price line:** `£264 total` — `22px/700`, `#222222`, with a `text-decoration: underline` applied ONLY to the numeric+currency portion (`£264`), NOT to the word "total" — replicate this exact partial-underline treatment by wrapping just the amount in its own `<span style="text-decoration:underline">`.
- `margin-bottom: 20px` below price line.
- **Date grid:** 2-column grid, `border: 1px solid var(--color-border-default)`, `border-radius: 12px`, `overflow:hidden`. Each cell:
  ```
  CHECK-IN          |  CHECKOUT
  07/08/2026        |  09/08/2026
  ```
  - Cell padding `12px 16px`. Label: `10px/700`, uppercase, letter-spacing `0.04em`, `#222222`. Value below: `14px/400`, `#222222`, `margin-top:2px`.
  - `1px solid var(--color-border-default)` vertical divider between the two cells.
- Below the date grid (not visible in crop but standard pattern — include as placeholder): a full-width "Reserve" button using `--gradient-primary`, white bold text, `border-radius:12px`, `height:48px`, `margin-top:16px`.

---

## 6. Search Results Page — Image 5

Route: `/search?location=London`

### 6.1 Page structure
```
<NavBar variant="compact" showFilterChips={true} />
<div class="search-layout">                 ← flex row, no gap, full-bleed
  <div class="results-col">                  ← ~55% width, scrollable, white bg
    <h1>Over 1,000 homes in London</h1>
    <ListingCardHorizontal ... />            ← 1 large featured card first
    <div class="grid-2col">                  ← then 2-column grid of vertical cards
      <ListingCardVertical /> × N
    </div>
  </div>
  <div class="map-col">                      ← ~45% width, sticky, full-viewport-height
    <MapView />
  </div>
</div>
```
- `.results-col`: `padding: 0 40px`, independently vertically scrollable (`overflow-y:auto`), white background.
- `.map-col`: `position: sticky; top: 0; height: calc(100vh - 80px);`, no padding (map bleeds to the page's right edge).
- Thin `1px solid var(--color-divider-nav)` full-width divider directly under the nav bar (visible as the horizontal line right below the filter-chips row in the screenshot).

### 6.2 FilterChipsRow
Sits directly below the compact search pill, horizontally centered under it or left-aligned to the results column — per screenshot it's left-aligned starting at the same x-position as page content, `padding: 16px 0`.

Three pill buttons, `gap:12px`:
1. **Filters** — `border:1px solid #222222` (slightly darker/heavier border than default to stand out as the primary filter trigger), `border-radius:full`, `padding:10px 16px`, icon (Lucide `SlidersHorizontal`, `16px`) + text `Filters` (`14px/600`), `gap:8px` between icon and text.
2. **Price ⌄** — `border:1px solid var(--color-border-default)`, same pill shape/padding, text `Price` + chevron-down icon (`14px`) with `4px` gap, `14px/600` text.
3. **Type of place ⌄** — identical style to Price chip, text `Type of place`.

All three: `background:#FFFFFF`, `color:#222222`, hover → `border-color:#222222`.

### 6.3 ListingCardHorizontal (featured card, top of results list)

This is a **distinct component** from the grid card — do not reuse `ListingCardVertical` here.

```css
.card-horizontal {
  display:flex; gap:24px;
  border-radius:20px;
  padding:16px;
  box-shadow: var(--shadow-card);   /* the whole row has a card-level elevated shadow, unlike the flat grid cards */
  margin-bottom:24px;
}
```
- **Image:** fixed `width:220px; height:220px;` (square), `border-radius:16px`, `overflow:hidden`, `flex-shrink:0`. Carousel dots overlay at bottom-center (5 small white/translucent dots, active one fully opaque, `6px` diameter, `4px` gap).
- **"Guest favourite" badge:** same white pill as §4.3 but this row uses the **UK spelling + no special icon** version: `Guest favourite`, positioned `absolute; top:12px; left:12px;` on the image.
- **Content column:** `flex:1`, `display:flex; flex-direction:column; padding:8px 0;`
  - Row 1 (space-between): Title `Flat in London` (`18px/700`, `#222222`) ... Heart button (`44px` circle, `background: var(--color-bg-icon-circle)` #F2F2F2 SOLID gray fill — this variant DOES have a visible circular backing, unlike the homepage card's shadow-only heart) containing a `20px` heart-outline icon `color:#222222`.
  - Row 2: Listing name `Stylish Kensington Studio with French...` — `16px/400`, `#6A6A6A`, truncated with `…`, `margin-top:8px`.
  - Row 3: `1 bedroom · 1 bed · 1 private bathroom` — `16px/400`, `#6A6A6A`, `margin-top:4px`.
  - Row 4: `7–9 Aug · Individual host` — `16px/400`, `#6A6A6A`, `margin-top:4px`. (En-dash between dates, not hyphen.)
  - Bottom row (pushed to bottom via `margin-top:auto`): `£264 total` (underlined, `16px/700`, `#222222`) `·` `★ 5.0 (10)` (`16px/400`, `#222222`, solid black star, review count in parentheses with `4px` gap before it, lighter gray `#6A6A6A` for just the `(10)` portion).

### 6.4 Grid cards below the featured card
Standard `ListingCardVertical` (§4.3) in a `grid-template-columns: repeat(2, 1fr); gap: 24px 16px;` layout, EXCEPT the heart button here uses the **translucent dark-circle backing** variant: `36px` circle, `background: var(--color-heart-icon-scrim)` (rgba(0,0,0,0.5)), heart icon `18px` white outline centered — because these thumbnails sit over highly varied photo brightness and need guaranteed contrast. Also note the trophy-emoji badge variant appears here: `🏆 Guest favourite` — include the trophy emoji (`U+1F3C6`) directly before the text with `4px` gap, same white pill container otherwise.

Card meta row example from screenshot: `★ 5.0 (10)` and separately `★ New` (for listings without enough reviews yet — literal text "New" replaces the numeric rating + count when `reviewCount === 0`).

### 6.5 MapView

- Base map style: light/desaturated "silver" theme — muted grays/creams for land, soft green for parks (`#D4E7C5`-ish), soft blue for water (`#AADAFF`-ish), white/light-gray roads with **yellow-bordered green pills for A-roads** (`background:#6B8E3D` or similar olive-green, `border:2px solid #E8D468` yellow, `border-radius:4px`, tiny `10px/700` white text, e.g. "A406", "A1") and a **blue rounded-square pill for motorways** (`background:#4C6FA5`, white border, same text style, e.g. "M1").
- **Zoom controls:** `position:absolute; top:16px; right:16px;` — a rounded-rect white control cluster (`border-radius:8px`, `box-shadow: var(--shadow-card)`) containing a `⤢` expand-to-fullscreen button on top, then a `+`/`−` zoom stepper below with a `1px` divider between `+` and `−`. Each button `40px` square tap target.
- **Price pins:** see exact spec below — this is the single most important visual element to nail.

#### MapPricePin (critical component)
```css
.map-price-pin {
  background: #FFFFFF;
  border-radius: 9999px;
  padding: 8px 14px;
  font: 15px/700 var(--font-family-base);
  color: #222222;
  box-shadow: var(--shadow-map-pin);   /* 0 2px 4px rgba(0,0,0,0.18) */
  white-space: nowrap;
  cursor: pointer;
  transition: transform 150ms ease;
}
.map-price-pin:hover, .map-price-pin.active {
  background: #222222;
  color: #FFFFFF;
  transform: scale(1.05);
  z-index: 10;
}
```
- Text content is currency-formatted price only, no decimals: `£588`, `£745`, `£130`, etc.
- Pins overlap naturally based on geographic density (do not manually prevent overlap — this matches the cluttered/overlapping look in the screenshot where e.g. `£270` sits partially over another pin).
- **Center marker:** a distinct black teardrop/pin shape (Lucide `MapPin`, filled `#222222`, `24px`) with a small white pill label to its right reading the location name, e.g. `📍 London` — `background:#FFFFFF`, `border-radius:full`, `padding:8px 16px`, `box-shadow: var(--shadow-map-pin)`, `font:15px/600`.

---

## 7. Auth Modal — "Log in or sign up" (Images 3 & 4)

Two trigger contexts, same modal component:
- **Image 3:** modal appears centered over the full unauthenticated landing/homepage background (colorful destination-poster illustrations tiled behind it, no visible scrim darkening — background is at full brightness).
- **Image 4:** modal appears triggered from within an already-scrolled page (search results), WITH a dark scrim overlay dimming the page content behind it, and includes a visible close (`✕`) button + extra legal helper text not present in Image 3.

Build one `<AuthModal open={bool} variant="landing" | "triggered" onClose={fn} />`.

### 7.1 Overlay/Scrim
- `variant="triggered"` only: `position:fixed; inset:0; background: var(--color-bg-modal-scrim);` (rgba(0,0,0,0.6)), `z-index:100`.
- `variant="landing"`: no scrim div at all — page background shows at full opacity around the modal (the tiled destination-poster background pattern is the "logged out homepage" hero itself, not dimmed).

### 7.2 Modal container
```css
.auth-modal {
  background: #FFFFFF;
  border-radius: 24px;
  width: 480px;
  max-width: 90vw;
  padding: 40px;
  box-shadow: var(--shadow-modal);
  position: relative;   /* for close button positioning */
}
```
Centered via flex on a fixed-position wrapper (`display:flex; align-items:center; justify-content:center;`), vertically the modal sits slightly above true-center (approx `42%` from top) matching both screenshots.

### 7.3 Close button (`variant="triggered"` only)
`position:absolute; top:20px; right:20px;`. `32px` tap target, no background/border, `✕` icon (Lucide `X`), `20px`, `stroke-width:2`, `color:#222222`.

### 7.4 Modal content (both variants identical from here down)

1. **Logo glyph** — centered, outline style (§2.1 stroke variant), `48px × 48px`, `color:#FF385C`, `margin-bottom:24px`.
2. **Heading** — `Log in or sign up`, centered, `28px/700`, `color:#222222`, `margin-bottom:32px`.
3. **Input field:**
   ```css
   .auth-input {
     width:100%; height:56px;
     border:1px solid var(--color-border-strong);  /* #B0B0B0, slightly darker than default card borders — this is a form input so uses the "strong" border token */
     border-radius:12px;
     padding:0 16px;
     font:16px/400;
     color:#222222;
   }
   .auth-input::placeholder { color: var(--color-text-placeholder); }
   .auth-input:focus { border:2px solid #222222; outline:none; }
   ```
   Placeholder text: `Phone number or email`.
4. **Helper text** (`variant="triggered"` shows this; `variant="landing"` in the provided screenshot does not display it before the button, though production Airbnb always shows it post-input-focus — implement it as always-visible for simplicity and closer real-world fidelity):
   ```
   We'll send a confirmation code by text or email. Message and data rates apply.
   Privacy Policy
   ```
   - First line: `14px/400`, `color:#6A6A6A`, `margin-top:12px`.
   - "Privacy Policy": same line-height, `color:#222222`, `text-decoration:underline`, `font-weight:600`, on its own visual line directly below (no gap, reads as a continuation).
5. **Continue button:**
   ```css
   .btn-continue {
     width:100%; height:56px;
     background: var(--gradient-primary);
     border:none; border-radius:12px;
     color:#FFFFFF; font:17px/600;
     margin-top:20px;
     cursor:pointer;
     transition: filter 150ms ease;
   }
   .btn-continue:hover { filter: brightness(0.95); }
   ```
6. **"or" divider:**
   ```css
   .or-divider {
     display:flex; align-items:center; gap:16px;
     margin: 24px 0;
     color:#717171; font:15px/400;
   }
   .or-divider::before, .or-divider::after {
     content:''; flex:1; height:1px; background: var(--color-border-subtle);
   }
   ```
7. **Social auth buttons row:** `display:flex; gap:16px;`
   ```css
   .social-btn {
     flex:1; height:56px;
     border:1px solid var(--color-border-default);
     border-radius:12px;
     display:flex; align-items:center; justify-content:center;
     background:#FFFFFF;
     transition: background 150ms;
   }
   .social-btn:hover { background: var(--color-bg-icon-circle); }
   ```
   - Two square-ish buttons side by side: **Google** (full-color "G" logomark, `20px`) and **Apple** (black Apple logomark, `20px`). No text labels visible in these particular crops (icon-only) — but note full Airbnb production also has a Facebook option and text labels ("Continue with Google"); since the screenshots show only 2 icon-only buttons, replicate exactly what's shown: 2 buttons, icons only, equal width, no visible text.

### 7.5 Background décor (`variant="landing"` only, Image 3)
Behind the modal, a tiled grid of colorful destination poster illustrations (travel-poster art style — bold flat-color scenes for cities like "Toronto", "Medellín", "Paris", "Ciudad México", "Miami/Perth", "Budapest", "Montréal", "Edinburgh", "San Diego"), each poster is a rounded-rect card (`border-radius:16px`) tiled edge-to-edge in a masonry-like grid filling the entire viewport behind the modal. This is decorative marketing content — an agent may substitute any set of colorful illustrated city-poster placeholder images in a CSS grid; exact poster art is not critical to functional replication, but the **overall effect** (saturated, editorial-illustration style, warm & varied palette, city name in bold display type overlaid at the bottom of each poster) should be preserved. Suggested grid: `grid-template-columns: repeat(7, 1fr); gap:8px;` with each poster `aspect-ratio: 3/4`.

---

## 8. Interaction & State Specs

| Element | Default | Hover | Active/Pressed | Focus (keyboard) |
|---|---|---|---|---|
| Nav tab (Homes) | bold+underline if active page | `color:#222222` if was gray | — | `outline:2px solid #222222; outline-offset:2px` |
| Search pill segment | white bg | `background: var(--color-bg-icon-circle)`, radius matches segment position | `box-shadow:0 0 0 2px #222 inset` | same as hover + outline ring |
| Search circle button | solid pink | `filter:brightness(1.08)`, slight `scale(1.04)` | `scale(0.97)` | outline ring, `2px #FF385C offset 2px` |
| Listing card | flat | image `scale(1.03)`, title gains underline optionally | — | outline ring around whole card |
| Heart icon (unsaved) | outline white/black per variant | `scale(1.1)` | `scale(0.9)` bounce then settle | outline ring |
| Heart icon (saved) | filled `--color-brand-rausch`, small pop-in keyframe animation (`scale 0→1.2→1` over 300ms) on the toggle event | `scale(1.1)` | — | — |
| Filter chip | outline style | `border-color:#222222` | `background:#F7F7F7` | outline ring |
| Continue button (gradient) | gradient | `brightness(0.95)` | `brightness(0.9) scale(0.99)` | outline ring `2px #222 offset 2px` |
| Map price pin | white/black text | invert to `background:#222; color:#fff;` + `scale(1.05)` | — | same as hover |
| Social auth button | white, bordered | `background:#F7F7F7` | `background:#EBEBEB` | outline ring |

---

## 9. Responsive Behavior Summary

- **≥1280px:** Full multi-column layouts as specified above.
- **744–1279px:** Homepage grid cards shrink but maintain 1:1 aspect; PDP switches to single-column (`right-col` booking box moves below content, un-stickied, full-width); Search results: map collapses to a toggleable full-screen overlay triggered by a "Show map" floating pill button instead of permanent split-view.
- **<744px:** Nav collapses — search pill becomes a single tappable bar reading just `Where to?` that opens a full-screen search flow; hamburger menu becomes primary navigation; card grids go single-column (2-column grid on search page becomes 1-column); auth modal becomes a full-screen sheet (`border-radius:0`, `width:100vw; height:100vh;`) sliding up from the bottom instead of a centered floating card.

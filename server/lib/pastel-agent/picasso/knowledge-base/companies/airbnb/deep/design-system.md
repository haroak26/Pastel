# Airbnb Design System — Deep Reference

## Core Design Tokens

### Color Palette

#### Primary Accent
| Token | Value | Usage |
|-------|-------|-------|
| `color-accent` | `#FF5A5F` | Primary CTAs, hearts, active states, badges, links |
| `color-accent-hover` | `#E54A4F` | Button hover, link hover |
| `color-accent-light` | `#FFF2F2` | Accent background, selected states, badges |

#### Secondary Accent
| Token | Value | Usage |
|-------|-------|-------|
| `color-secondary` | `#00A699` | Success states, host badges, special categories |
| `color-secondary-hover` | `#008A80` | Hover variant |
| `color-secondary-light` | `#F0FFFE` | Light background variant |

#### Neutrals (Warm Grays)
| Token | Value | Usage |
|-------|-------|-------|
| `color-bg-primary` | `#FFFFFF` | Page background, cards |
| `color-bg-secondary` | `#F7F7F7` | Section backgrounds, hover states |
| `color-bg-tertiary` | `#EBEBEB` | Disabled states, subtle borders |
| `color-text-primary` | `#222222` | Headings, body text |
| `color-text-secondary` | `#717171` | Labels, captions, metadata |
| `color-text-tertiary` | `#B0B0B0` | Placeholder text, disabled text |
| `color-border` | `#DDDDDD` | Dividers, card borders |
| `color-border-light` | `#EBEBEB` | Subtle separators |

#### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `color-success` | `#00A699` | Confirmation, success toasts |
| `color-warning` | `#FFB400` | Warnings, pending states |
| `color-error` | `#FF5A5F` | Error states, destructive actions (same as accent — intentional) |
| `color-info` | `#006C70` | Information banners |

### Photography as Color

Airbnb's actual color richness comes from photography. The UI palette is intentionally restrained to let listing photos provide the visual variety. Design rule: **If a screen looks colorful, the color should come from photography, not UI chrome.**

---

## Typography System

### Font Stack

```css
font-family: 'Airbnb Cereal', 'Circular', -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

### Type Scale

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-4xl` | 48px | 56px | Book (300) | Marketing hero |
| `text-3xl` | 36px | 44px | Book (300) | Page headings |
| `text-2xl` | 28px | 36px | Medium (500) | Section headings |
| `text-xl` | 22px | 28px | Medium (500) | Card headlines |
| `text-lg` | 18px | 26px | Book (400) | Large body, prices |
| `text-base` | 16px | 24px | Book (400) | Body text |
| `text-sm` | 14px | 20px | Book (400) | Labels, metadata |
| `text-xs` | 12px | 16px | Book (400) | Captions, legal |
| `text-2xs` | 10px | 12px | Medium (500) | Overline, badges |

### Typography Rules

1. Headings use **Book (300)** for large sizes — light, airy, aspirational
2. Body always uses **Book (400)** — comfortable, legible
3. Emphasis uses **Medium (500)** — never Bold (too heavy for the brand)
4. Price displays use **Medium (500)** at `text-lg` — prominent but not aggressive
5. All caps only on overlines at `text-2xs` — never for headings
6. Letter-spacing: `-0.3px` on headings, `0` on body, `0.5px` on overlines

---

## Spacing Scale

Airbnb uses a generous exponential-like scale. Everything gets more space than seems necessary — that's the point.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon-inline-text gap |
| `space-2` | 8px | Tight inline spacing, icon-button padding |
| `space-3` | 12px | Button inner padding vertical |
| `space-4` | 16px | Standard inline, card padding, input padding |
| `space-5` | 20px | Medium component gaps |
| `space-6` | 24px | Section internal spacing, grid gaps |
| `space-8` | 32px | Card stack gaps, content block separation |
| `space-10` | 40px | Section internal padding top/bottom |
| `space-12` | 48px | Section separation |
| `space-16` | 64px | Section margin top/bottom |
| `space-20` | 80px | Major section separation |
| `space-24` | 96px | Hero section padding |
| `space-32` | 128px | Full page section padding |

### Spacing Rules

- Card grids: 16px column gap, 24px row gap
- Content sections: 48-64px top padding, 48-64px bottom padding
- Never stack elements closer than 16px unless it's a list item
- Hero sections always have at least 96px of content padding

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Buttons, inputs, chips, small elements |
| `radius-md` | 12px | Cards, modals, dropdowns, image containers |
| `radius-lg` | 16px | Large cards, hero containers, feature tiles |
| `radius-full` | 9999px | Pills, avatars, badges |

### Radius Rules

- Cards ALWAYS use 12px (`radius-md`) - this is a signature Airbnb trait
- Buttons use 8px - friendly but not pill-shaped (too playful for the brand)
- Images inside cards inherit the card's border-radius
- Modals/dialogs use 12px
- Never use 0px radius for any visible container

---

## Shadow System

Airbnb shadows are subtle and warm. They suggest depth without being dramatic or harsh.

| Token | Usage | CSS |
|-------|-------|-----|
| `shadow-card` | Listing cards (default) | `0 2px 8px rgba(0,0,0,0.08)` |
| `shadow-card-hover` | Cards on hover | `0 4px 16px rgba(0,0,0,0.12)` |
| `shadow-elevated` | Sticky headers, modals | `0 6px 20px rgba(0,0,0,0.10)` |
| `shadow-overlay` | Dropdowns, popovers | `0 8px 24px rgba(0,0,0,0.12)` |
| `shadow-fab` | Floating action button | `0 4px 12px rgba(0,0,0,0.15)` |

### Shadow Rules

- Cards get shadow by default, not just on hover (gives subtle depth)
- Use shadows sparingly — photography already provides depth
- Never use colored shadows
- Never use heavy/dramatic shadows (nothing above 0.15 opacity)
- Inset shadows are never used

---

## Component Patterns

### Listing Card

```
+----------------------------------+
|                                  |
|           PHOTOGRAPH             |
|        (aspect-ratio 4:3)        |
|       border-radius: 12px        |
|                                  |
|  [heart icon - top right]        |
|  [carousel dots - bottom center]  |
+----------------------------------+
| Title                 ★ 4.92    |
| Neighborhood, City              |
| Date range                      |
| $125 / night                    |
+----------------------------------+
```

**Key specs:**
- Image: 65% of card height, rounded 12px top corners
- Content area: 16px padding all sides
- Title: 16px Medium, single line, ellipsis overflow
- Rating: star icon + number, aligned right of title
- Price: 16px Medium, right-aligned at bottom
- Hover: scale(1.02) with shadow-card-hover transition
- Width: responsive, typically 280-320px

### Search Bar (Homepage)

```
+--------------------------------------------------+
|  Where to?  |  Check in  |  Check out  |  Who?  [🔍] |
+--------------------------------------------------+
```

**Key specs:**
- Centered on homepage, ~800px max-width
- White background with shadow-elevated
- Rounded 32px (pill shape)
- Segments separated by thin vertical dividers
- Coral search icon button on the right
- Expands into a dropdown with recent searches, categories
- On scroll: shrinks and sticks to top as a condensed version

### Hero Section (Homepage)

- Full-bleed background image (video on some occasions)
- 96-128px padding top and bottom
- Centered headline (48px Book, white text)
- Search bar centered below headline
- Overlay gradient: subtle darkening gradient for text legibility
- Image changes based on categories, season, or user history

### Date Picker

- Custom calendar component, not native browser picker
- Two-month side-by-side view on desktop
- Single month scrollable on mobile
- Selected range highlighted with accent-light background
- Start/end dates circled in accent color
- Dates with photography preview (destination images behind valid dates)
- Clear/reset at bottom

### Review Display

```
[Avatar 40px]  First Name
               Date of Stay
               ★★★★★
               Review text...
               [Helpful?] [Report]
```

- Avatar is circular, 40px
- Name is 14px Medium
- Date is 12px Book in secondary gray
- Stars use accent color, 16px icons
- Review text is 16px Book, full width, infinite scroll
- Host response is indented with subtle left border

### Map Pin

- Custom pin: small white rounded rectangle with price inside
- Coral border on selected/hovered pins
- Clustering at low zoom levels
- Tap/click shows card preview (mini listing card overlaid on map)

### Navigation Bar (Marketing/Web)

```
[Airbnb logo]  [Stays] [Experiences] [Online Experiences]  [Host] [Globe] [Profile]
```

- Logo centered for marketing pages
- Navigation links in warm gray (Book, 14px)
- Active state: accent color underline or color shift
- Right side: globe (language) + profile/menu
- On scroll: background transitions from transparent to white with shadow

### Tabbar (Mobile App)

```
[Explore 🔍]  [Wishlists ❤]  [Trips ✈]  [Inbox 💬]  [Profile 👤]
```

- Bottom-fixed bar with 5 icons
- Active icon: coral fill
- Inactive icons: warm gray
- Labels: 10px Book below icons

---

## Motion & Animation

### Principles

Airbnb motion is **subtle, warm, and meaningful**. It never feels like a tech product showing off — it feels like a natural, human-paced interaction.

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `motion-fast` | 150ms | Micro-interactions, hover states |
| `motion-normal` | 250ms | Card hover lifts, page transitions |
| `motion-slow` | 350ms | Modal opens, panel slides |
| `motion-gentle` | 500ms | Hero transitions, category changes |

### Easing

- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)` — smooth, quick start, gentle end
- **Entry**: `cubic-bezier(0, 0, 0.2, 1)` — decelerating into position
- **Exit**: `cubic-bezier(0.4, 0, 1, 1)` — accelerating away
- **Spring**: Used only for the heart/favorite animation — quick bounce

### Key Animations

1. **Heart save**: Scale from 1 → 1.3 → 1 with spring physics (300ms). Heart fills with coral from white outline.
2. **Card hover**: Subtle translateY(-2px) + shadow increase over 250ms.
3. **Page transitions**: Fade (200ms) + subtle slide (300ms).
4. **Map/card toggle**: Cards fade out, map scales in. Smooth 350ms.
5. **Filter chips**: Ripple effect on select/deselect. 200ms.
6. **Image carousel dots**: Smooth slide between images on listing card. 300ms.
7. **Date picker**: Months slide horizontally, selected dates "pop" with subtle scale.

---

## Accessibility

### Standards
- WCAG 2.1 AA minimum
- All interactive elements keyboard accessible
- Focus indicators: coral ring (2px offset, 2px width)
- Focus order matches visual order

### Color Contrast
- Body text (#222222 on #FFFFFF): 15.6:1 AAA
- Secondary text (#717171 on #FFFFFF): 5.5:1 AA
- Coral accent (#FF5A5F on #FFFFFF): 4.5:1 AA (just meets threshold — intentional tradeoff for brand warmth)
- Coral on white is tested extensively; never used on dark backgrounds

### Screen Reader
- All images have meaningful alt text (descriptive of listing content)
- Price announced clearly
- Rating stars have text fallback
- Map pins have aria-labels with price
- Search bar announces as "Search destinations, dates, and guests"

---

## Grid System

### Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | 0-743px | Single column cards, full-width search |
| Tablet | 744-1023px | 2-column card grid |
| Desktop | 1024-1439px | 3-4 column card grid |
| Large | 1440px+ | Max content width 1280px, centered |

### Content Max-Width
- Marketing content: 1440px max, centered
- Listing cards grid: 1280px max, centered
- Search results content: 1280px max
- Single column content (listing detail, booking): 1280px max

### Card Grid Logic
- Cards auto-fill with min-width 280px
- Column gap: 16px
- Row gap: 24px
- Each card is the same width — never stretched
- Last row items align left (not centered)

---

## Form & Input Patterns

### Input Fields

- Height: 56px (generous tap target)
- Border: 1px solid `color-border` (#DDDDDD)
- Border-radius: 8px
- Label: 12px Book above the input, warm gray
- Focus: border turns `color-text-primary` (#222222), subtle shadow appears
- Error: border turns `color-accent` (#FF5A5F), error text below in 12px
- Placeholder: 16px Book in `color-text-tertiary`

### Buttons

| Variant | Background | Text | Border | States |
|---------|-----------|------|--------|--------|
| Primary | `#FF5A5F` | White, 16px Medium | None | Hover: `#E54A4F`, Active: `#D04246` |
| Secondary | White | `#222222`, 16px Book | 1px `#DDDDDD` | Hover: `#F7F7F7` bg |
| Ghost | Transparent | `#FF5A5F` | None | Hover: `#FFF2F2` bg |
| Disabled | `#EBEBEB` | `#B0B0B0` | None | Cursor: not-allowed |

- Minimum height: 48px
- Padding: 16px horizontal, 12px vertical
- Border-radius: 8px
- Loading state: coral spinner replaces text

---

## Icon System

- Custom icon set (200+ icons)
- Style: 2px stroke weight, rounded caps and joins
- 24x24 default size, occasionally 16x16 for inline
- Default color: `#222222` (primary text)
- Active/accent color: `#FF5A5F`
- Icons never replace text labels on primary actions

---

## States & Feedback

### Loading States
- Skeleton screens: gray placeholders with subtle pulse animation
- Skeleton matches the shape of content (image rectangle, text lines)
- Image loading: low-res placeholder → blur-up to full resolution
- Never shows a blank screen or lone spinner

### Empty States
- Large illustration (line-art style, warm tone)
- Friendly heading: "Start your search"
- Descriptive subtext: "Explore stays, experiences, and more"
- CTA button to begin
- Background illustrations related to travel

### Error States
- Clear heading: "Something went wrong"
- Human, apologetic copy
- Retry button with accent color
- Never shows raw error codes to users
- Network errors: persistent banner at top, not blocking

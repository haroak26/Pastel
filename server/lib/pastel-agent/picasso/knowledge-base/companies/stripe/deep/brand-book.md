# Stripe — Brand Book

## Brand Personality

Stripe designs feel like **financial infrastructure** — serious but not cold, technically elegant without being sterile. The brand communicates precision, trust, and quiet confidence. There is no shouting, no decoration, no filler.

Three words: **Technical. Precise. Invisible.**

Stripe wins trust by getting out of the way. The UI never celebrates itself; it celebrates the work the user is doing.

## Tone of Voice

Active, imperative, and direct. Stripe speaks like a developer tool but remains accessible to non-technical users.

- **Do:** "Make money move." "Start building in minutes."
- **Don't:** "Get started with payments." "Learn more about our platform."

Every heading earns its place. No marketing superlatives. No exclamation marks. Instructions use active verbs: "Create an account" not "Account creation."

Developer-first but never exclusionary. Code snippets appear alongside plain-English explanations. The voice is the same whether addressing engineers or business operators — clear, confident, helpful.

## Visual Identity

### Core Palette

- **Accent:** `#635BFF` (Stripe Blue/Indigo) — used ONLY on primary CTAs, active states, focus rings, and links. Appears 3-5 times per screen maximum.
- **Backgrounds:** Neutral white (`#FFFFFF`) and cool gray (`#F6F9FC`, `#F0F4F8`). Bands alternate between white and light gray to create section separation without borders.
- **Text:** Near-black (`#0A2540`) for headings, dark gray (`#425466`) for body, lighter gray (`#7A828F`) for secondary/tertiary text.
- **Borders/Dividers:** Subtle gray (`#E6EBF1`), thin (1px). Only when structurally necessary.

The accent is a laser, not a floodlight. It highlights exactly one thing at a time. The eye always knows where to go next.

### Dark Topbar

Signature move: the navigation bar is dark (`#0A2540` or near-black) even when the rest of the page is light. This creates a distinctive frame that anchors the experience and signals "this is a Stripe product" without needing a logo.

### Generous Whitespace

Section margins: 48-96px vertical. Component padding: 24-32px. Content max-width: 1080px (centered in viewport). Breathing room communicates confidence — Stripe is not afraid of empty space.

### Content-First Minimalism

Chrome is removed until only the essential remains. If something can be inferred, it is not shown. Labels are omitted when context makes them redundant. Icons are used sparingly — typography carries the primary communication load.

## Core Philosophy

**"The best UI is invisible."**

Stripe designs recede. The goal is not to impress with design but to make the user feel capable. Every visual decision is tested against one question: "Does this help the user complete their task, or does it make the designer look good?"

This manifests as:
- Removing borders, backgrounds, and dividers that don't add information
- Letting content breathe instead of cramming features
- Using typography as the primary structural element
- Reserving color for moments that demand attention

## Typography

### UI Typeface: Inter

Sans-serif, clean, neutral. Inter is the workhorse — used for navigation, forms, data tables, labels, buttons, and all functional UI text. Its neutrality lets the content speak without the typeface asserting personality.

- Body: 16px / 1.5 line-height
- Small UI: 13-14px / 1.4 line-height (labels, metadata, table cells)
- Headings: 20-40px, weight 600-700
- Tabular numbers enabled for all data displays (`.tabular-nums`)

### Brand Moments: Serif

Select moments use a serif typeface (historically Tiempos Text or similar editorial serif) for contrast and warmth. These appear on:
- Hero headlines on marketing pages
- Large pull-quote metrics ("120+ countries")
- Brand-focused landing sections

The serif creates an editorial, trustworthy warmth that the sans-serif UI cannot. These moments are rare — one or two per page — and always at large sizes (32px+).

### Code: JetBrains Mono

Monospaced, crisp, used in code blocks, inline code, API references, and technical documentation.

## Spacing System

Spacing communicates hierarchy. Larger gaps separate sections; tighter gaps group related content.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-text, inline gaps |
| sm | 8px | Tight grouping, input internals |
| md | 16px | Component padding, related items |
| lg | 24px | Card padding, list item spacing |
| xl | 32px | Section internal padding |
| 2xl | 48px | Section margins (compact) |
| 3xl | 64px | Section margins (standard) |
| 4xl | 96px | Section margins (generous), hero padding |

## Color Usage Rules

1. **One accent appearance per interactive moment.** If a button is accent, nothing else on screen shares that color.
2. **Neutrals carry 95% of the interface.** Gray scale, white, and near-black handle structure, hierarchy, and separation.
3. **No accent backgrounds, no accent washes, no accent borders.** Accent is solid fill on buttons and links only.
4. **Semantic colors (green/red/amber) are muted** — never bright or saturated. Stripe's red is a restrained `#CD3D64`, not `#FF0000`.

## Key Patterns

### Docs-as-Product Feel

Stripe's product interfaces borrow from their documentation aesthetic: clean typography, code blocks, side-by-side code-and-preview, copy buttons, clear heading hierarchy. The line between "product" and "docs" is deliberately blurred — building on Stripe should feel the same as reading about building on Stripe.

### Technical Precision in Data Display

Numbers are the product. Revenue, volume, fees — these are displayed with typographic precision:
- Tabular numbers (each digit occupies equal width)
- Right-aligned in table columns
- Monospace or semi-monospace for IDs and codes
- Large, confident hero numbers on dashboards

### Separation of Concerns

UI elements and brand moments never compete. Brand expression (serif headlines, accent color, dark topbar) happens in designated zones. Functional UI stays clean, neutral, Inter-only, no color. The result: brand feels considered, UI feels native.

### Minimal Chrome

Navigation is compact. Dividers are thin and gray. Cards have no shadows. Forms have minimal borders. Every visible line is interrogated: "Does this help, or is it habit?"

## What Makes Stripe Stripe

1. **The confidence to use white space.** Most products fear empty space; Stripe weaponizes it.
2. **Dark navigation bars on light pages.** A signature that no one else does consistently.
3. **Accent reserved for primary actions only.** There is never ambiguity about what to click next.
4. **Data displayed with typographic precision.** Numbers are the hero, and they look like it.
5. **Invisible design.** The best thing you can say about Stripe's UI is that you didn't notice it.

## Signature Moves

- **Dark topbar on light pages** — instant brand recognition
- **Accent only on CTAs and active states** — no decorative color
- **Large hero numbers/metrics** — "Millions of businesses" in 48px+ serif
- **Side-by-side code and preview** — shows the API call and the result simultaneously
- **Content-band layout** — alternating white/light-gray horizontal bands for page structure
- **Invisible cards** — flat rectangles with no shadow, no border, just typography and spacing
- **Footer as sitemap** — comprehensive, organized, but quiet and low-contrast

---

## Comparative Positioning: Stripe vs. Peers

Understanding Stripe's design by contrast:

| Dimension | Stripe | Typical SaaS | Typical Bank/Fintech |
|-----------|--------|-------------|---------------------|
| Color usage | 1 accent, 95% neutral | Multi-color palette, feature-colored sections | Blue-dominant, trust-colored |
| Typography | Inter (UI) + serif (brand moments) | Single typeface, one weight range | System fonts, inconsistent |
| Spacing | Generous (64-96px sections) | Moderate (32-48px) | Cramped (16-24px) |
| Cards | Flat, no shadow, no border, rare | Shadowed, bordered, abundant | Heavy borders, colored headers |
| Navigation | Dark topbar on light pages | Light nav, matches page | Sticky header with logo |
| Motion | Fast, functional, no decoration | Scroll animations, reveals, hover effects | No motion strategy |
| Data display | Typographic precision, large hero numbers | Standard tables, basic charts | Dense tables, minimal hierarchy |
| Brand expression | Isolated moments (serif headlines, accent CTAs) | Distributed throughout UI | Logo + color everywhere |

### What Stripe Borrows From

- **Editorial design:** The serif brand moments, generous margins, and content-first layout come from magazine and book design — not from software conventions.
- **Code editors:** The syntax highlighting, monospace, dark code blocks, and copy buttons come from developer tools (VS Code, Sublime Text).
- **Swiss/International Style:** The grid, left-alignment, minimal color, and typographic hierarchy are rooted in mid-century modernist graphic design.
- **Apple's product design:** The invisible-chrome philosophy, the confidence of white space, and the reduction-to-essentials approach share DNA with Apple's hardware and software ethos.

### What Stripe Deliberately Rejects

- **Material Design:** Shadows as elevation, card-heavy layouts, bright accent colors, rounded geometry, floating action buttons. Stripe is flat, sharp, and shadow-free.
- **"SaaS happy":** Bright gradients, colorful illustrations, cartoon characters, emoji in UI, celebratory animations. Stripe is serious and precise.
- **Banking UI conventions:** Padlock icons, "Secure" badges, trust seals, excessive form fields, multi-step wizards. Stripe communicates trust through simplicity, not security theater.
- **Dashboard maximalism:** 12 metric cards, 4 charts, recent activity, notifications, quick actions, all on one screen. Stripe shows 3-4 metrics and a table — that's it.

---

## The Stripe Design Test

A heuristic for evaluating whether a design "feels like Stripe." Score each question 0-2:

1. **Is the accent color used more than 5 times?** (0 points for >5, 1 for 3-5, 2 for ≤3)
2. **Is the navigation bar dark even on light pages?** (2 for yes, 0 for no)
3. **Are there shadows on cards or static elements?** (0 for yes, 2 for no)
4. **Is body text left-aligned?** (2 for yes, 0 for centered)
5. **Are there gradients on any UI element?** (0 for yes, 2 for no)
6. **Is the corner radius ≤6px on all elements?** (2 for yes, 0 for anything above)
7. **Are there decorative illustrations?** (0 for yes, 2 for no)
8. **Is there generous whitespace (≥64px between major sections)?** (2 for yes, 1 for moderate, 0 for tight)
9. **Is a serif typeface used for at least one brand moment?** (2 for yes, 0 for sans-only)
10. **Are numbers displayed with tabular alignment and typographic precision?** (2 for yes, 0 for no)

**Scoring:** 16-20 = Authentically Stripe. 11-15 = Influenced but not fully committed. 6-10 = Generic SaaS. 0-5 = Not remotely Stripe.

---

## Applying Stripe Design Principles to New Products

### When to Use Stripe as a Reference

Stripe's design language works best for products that:
- Handle serious tasks (finance, data, infrastructure, developer tools)
- Need to communicate trust and precision
- Have technically sophisticated users who appreciate restraint
- Benefit from feeling "invisible" — where the UI shouldn't be the experience
- Have complex data that benefits from typographic hierarchy

### When to Divert from Stripe

Stripe's approach is less suitable for:
- Consumer social products (too serious, needs warmth and play)
- Creative tools (needs expressive color and visual richness)
- Entertainment and gaming (needs energy and emotion)
- Products for children or non-technical audiences
- Products where brand expression should permeate the UI (fashion, lifestyle)

### Adapting, Not Copying

The goal is not to clone Stripe but to understand WHY each decision was made:
- Dark topbar = instant brand recognition + frame for content
- Generous whitespace = confidence signal + readability
- Single accent = unambiguous action path + reduced cognitive load
- Minimal chrome = respect for user's intelligence + focus on content
- Flat cards = typography-first information design

When you understand the "why," you can adapt the principle to your context rather than copying the surface.

# Picasso Megadesign — Design Constitution §5.1

## 1. Core Philosophy — Confident Restraint

Every design decision must survive the question *“Does removing this make it worse?”*. If a border, gradient, shadow, divider, or extra label does not earn its place in the hierarchy, it gets deleted. Ships with the minimum viable aesthetic. Ornament is not personality; clear intent is. The best UI is the one the user does not notice.

Operational principles:
- Start every layout with grayscale rectangles. Introduce color only when it communicates meaning.
- Prefer whitespace over dividers. If you reach for a `<hr>` or a border, first try doubling the gap.
- Every element on screen must have a discoverable purpose. If you cannot name its job in four words, remove it.
- Design in text first, then add chrome. Headings, labels, body copy, and CTAs must work at 1x scale before any visual treatment is applied.

---

## 2. Hierarchy & Focus

A screen must have exactly one primary action or focal point. Users scan in Z-patterns or F-patterns; the layout must guide that scan path deliberately.

Rules:
- **One hero per screen.** The dominant element (headline, illustration, form, or CTA) occupies the top-left or center-top visual-weight hotspot.
- **Size = importance.** If two elements compete, the less important one shrinks or dims. Do not use color alone to establish rank — combine size, weight, and position.
- **Proximity = relationship.** Related controls sit closer to each other than to unrelated controls. Group spacing is half the section spacing.
- **Visual-weight budget:** Each screen has a finite attention budget. Assign weight to elements in order of user-task priority: primary CTA > key data > secondary actions > chrome.
- **Empty state hierarchy:** Even when there is no data, the empty-state illustration + heading + CTA must follow the same dominance rules as a populated screen.

---

## 3. Grid & Spacing

### 3.1 Base Unit
All spacing and sizing snaps to a **4 px base grid**. No hard-coded values outside the scale.

### 3.2 Spacing Scale (in px)
`4 → 8 → 12 → 16 → 24 → 32 → 48 → 64 → 96`

- **4, 8:** Internal padding of compact components (badges, chips, icon buttons, input inner padding).
- **12:** Tight sibling spacing; inline form groups.
- **16:** Default component padding; text–control spacing; card padding (compact variant).
- **24:** Standard section gutters; card padding (default); list-item spacing.
- **32:** Major section separation; modal/panel padding.
- **48:** Page-level section breaks; hero padding.
- **64:** Full-page gutters on wide viewports; dense layout row gaps.
- **96:** Extra-large negative space for marketing/onboarding layouts.

### 3.3 Layout Grid
- **12-column grid** as the universal structure. Column gutters: 16 px on desktop, 12 px on tablet, 8 px on mobile.
- **Max content width:** 1280 px for reading-heavy layouts, 1440 px for dashboards and data-dense views. Content is centered; backgrounds may bleed edge-to-edge.
- **Breakpoints:** 320 (small phone), 480 (large phone), 768 (tablet), 1024 (small desktop), 1280 (default desktop), 1440+ (wide).
- **Column spans are multiples of 2 or 3.** Avoid 5-column or 7-column spans unless mathematically unavoidable.

---

## 4. Typography

### 4.1 Typeface Limit
Maximum **two type families** per project — one for headings (may be a display face), one for body and UI. A single family with sufficient weight range is always preferred.

### 4.2 Modular Scale
All font sizes derive from a single ratio applied to the 16 px body base.

**Scale A (Minor Third, 1.200):** `12 — 14 — 16 — 19 — 23 — 28 — 33 — 40 — 48`
Use for data-dense dashboards, admin panels, and tools where information density matters.

**Scale B (Major Third, 1.250):** `12 — 15 — 16 — 20 — 25 — 31 — 39 — 49 — 61`
Default scale for general SaaS and B2B products.

**Scale C (Perfect Fourth, 1.333):** `12 — 16 — 16 — 21 — 28 — 37 — 50 — 67 — 89`
Use for marketing sites, onboarding flows, and brand-forward experiences.

### 4.3 Line-Height Rules
- **Body text (≤16 px):** line-height 1.5–1.6.
- **Body text (>16 px):** line-height 1.4–1.5.
- **Headings:** line-height 1.1–1.3. Tighten as size increases.
- **UI labels, buttons, captions:** line-height 1.2–1.3.
- **Minimum body font-size is 16 px.** Captions and legal text may go to 12 px but must pass 4.5:1 contrast.

### 4.4 Weight Palette
Limit to **four weights** from the family: Regular (400), Medium (500), Semi-Bold (600), Bold (700). Additional weights require explicit justification.
- **Body:** Regular.
- **Strong emphasis in body:** Medium or Semi-Bold.
- **Headings:** Semi-Bold or Bold.
- **UI labels and buttons:** Medium or Semi-Bold.

### 4.5 Paragraph & Readability
- Maximum line length: **65 characters** for prose, **80 characters** for UI descriptions.
- Paragraph spacing equals one body line-height.
- Headings are closer to the content they introduce than to the content above them (heading-bottom margin ≈ 0.5× heading-top margin).

---

## 5. Color

### 5.1 Neutral-First Architecture
**Neutrals carry the UI.** 80%+ of the visible interface is neutral tones. The palette includes at minimum:
- `neutral-50` (near-white background) through `neutral-950` (near-black text).
- Cool-gray or warm-gray undertone selected once per project and applied consistently.

### 5.2 Accent Strategy
**One accent color** (plus a variant for hover/pressed states). The accent is reserved for:
- Primary CTAs.
- Focus rings.
- Active/selected states.
- Links in body text.
- Critical interactive signifiers.

Accent must never be used as decoration, background wash, or divider color.

### 5.3 Semantic Colors
- **Red:** Destructive actions, error states, critical alerts. Never for non-destructive CTAs.
- **Green:** Success confirmations, positive trends. Never for primary CTAs (unless the brand is green).
- **Amber/Orange:** Warnings, pending states, items needing attention.
- **Blue (if not the accent):** Informational alerts, help tooltips, link defaults.

Each semantic color has at minimum a surface tint, a border, and a text variant — never rely on a single hex value.

### 5.4 Light & Dark Mode
- Every color token exists in both light and dark variants as a single source of truth.
- Dark-mode backgrounds: `neutral-900` minimum for main surfaces, `neutral-800` for elevated cards.
- Dark-mode text: `neutral-100` for primary, `neutral-300` for secondary, `neutral-500` for tertiary.
- Inverted accent may be lightened by 10–15% in dark mode to maintain perceived brightness parity.

### 5.5 Contrast (WCAG AA as Floor)
- **4.5:1 minimum** for all body text and UI controls under 18 px (non-bold) or 24 px (bold).
- **3:1 minimum** for large text (≥18 px non-bold or ≥24 px bold), icons, and UI-component boundaries.
- Check contrast in situ, not in isolation — real content over real backgrounds.

---

## 6. Elevation & Depth

### 6.1 Philosophy
**Flat by default.** Elevation is a communication tool, not a stylistic choice. Add a shadow or raised surface only when it clarifies z-order, indicates interactivity (hover card), or separates a modal from the page.

### 6.2 Shadow Scale
Use a consistent shadow scale with increasing blur and spread. A representative scale:

| Level | Use case                         | Y-offset | Blur | Spread | Opacity |
|-------|----------------------------------|----------|------|--------|---------|
| 0     | Flat content, body               | 0        | 0    | 0      | —       |
| 1     | Subtle card, table row hover     | 1        | 3    | 0      | 0.08    |
| 2     | Card (default), dropdown         | 2        | 6    | 0      | 0.10    |
| 3     | Sticky header, raised card       | 4        | 12   | 0      | 0.12    |
| 4     | Modal, drawer, tooltip           | 8        | 24   | -2     | 0.16    |
| 5     | Toast, notification, popover     | 12       | 36   | -4     | 0.20    |

Shadows are single-color black (`#000`) with RGBA transparency. No colored shadows.

### 6.3 Implementation
- Use `box-shadow` over `filter: drop-shadow` for performance.
- Shadows increase in both offset and blur as elevation rises — never blur alone.
- In dark mode, shadows are replaced or supplemented by a 1 px lighter border on the elevated surface.

---

## 7. Corner Radius

### 7.1 One Philosophy Per Project
Pick one of the following and apply it everywhere — cards, buttons, inputs, modals, checkboxes, tags.

| Philosophy        | Radius   | Vibe                 | Best for                         |
|-------------------|----------|----------------------|----------------------------------|
| Sharp             | 0–2 px   | Technical, precise   | Code editors, terminals, CAD     |
| Crisp             | 4–6 px   | Modern, professional | SaaS, B2B dashboards, admin      |
| Soft              | 8–12 px  | Approachable, warm   | Consumer apps, social, health    |
| Pill              | 9999 px  | Playful, friendly    | Onboarding, games, children's UI |

### 7.2 Nesting Rule
When a rounded element is placed inside another rounded element, the inner radius = outer radius − padding. If outer = 8 px and inner padding = 16 px, inner radius = max(0, 8 − 16) = 0 — switch to a smaller inner radius deliberately or unify the family.

---

## 8. Motion

### 8.1 Philosophy
Motion exists for **feedback, not decoration.** Every animation answers a specific question: *where did this come from, where is it going, or what just happened?*

### 8.2 Acceptable Uses
- **Page transitions:** Fade + subtle Y-shift (≤16 px) for route changes. Duration 150–250 ms.
- **Hover/press feedback:** Scale 0.97–0.98 on press, background-color shift on hover. Duration 100–150 ms.
- **Presence animations:** Elements entering the DOM (modal open, toast arrival) get a single entrance. Elements leaving (dismiss, delete) get a shorter exit.
- **Skeleton screens:** Pulse or shimmer while loading. No layout jump when content replaces skeleton.
- **Drag-and-drop:** Live preview follows cursor at 1:1, drop target highlights with scale or border change.
- **Scroll-triggered reveals:** Permitted only for marketing/onboarding pages. Disabled if `prefers-reduced-motion`.

### 8.3 Forbidden
- Spinners that rotate endlessly for operations under 300 ms.
- Bounce easing on UI elements.
- Animations longer than 400 ms for interactive elements.
- Entry animations on every route — first paint should be immediate with no blocking animation.
- Marquee, auto-scroll carousels, parallax over 1.2× scroll speed.

### 8.4 `prefers-reduced-motion`
Always wrap motion in `@media (prefers-reduced-motion: no-preference)`. When the user requests reduced motion, collapse all durations to 0 ms except opacity fades, which become 50 ms.

---

## 9. Imagery & Iconography

### 9.1 Icon Set
**One icon set per project** from a single library (Lucide, Phosphor, or Heroicons). No mixing libraries. All icons use 24×24 px viewBox, stroke-width 2 (or 1.5 for Heroicons Outline). Icons inherit currentColor.

### 9.2 Icon Sizing
- **16 px:** Badges, inline text, tight spots.
- **20 px:** Button icons, form fields, compact UI.
- **24 px:** Standalone icons, nav, empty states.
- **32+ px:** Feature illustrations, hero icons.

### 9.3 Photography & Illustration
- **No placeholder images without label.** Every placeholder must display its intended dimensions and a content description (e.g., “800×400 — Hero illustration: person using dashboard”).
- **Real content over lorem ipsum.** Design with domain-realistic copy. Placeholder names come from a diverse set of realistic personas, never “John Doe” or “Test User”.
- **Avatar fallback:** Initials on a tinted background. No generic silhouette icons.
- **Image aspect ratios:** Lock to a set — 1:1, 4:3, 16:9, 3:2. No arbitrary ratios.

---

## 10. States Are Not Optional

Every interactive element must be designed in all applicable states **before** it is considered complete.

### 10.1 Mandatory States (per element type)
- **Buttons & links:** Default, hover, pressed/active, focus-visible (ring), disabled, loading.
- **Inputs:** Default, placeholder, focused, filled, error, disabled, read-only.
- **Checkboxes, radios, toggles:** Unchecked, checked, indeterminate (checkbox), focused, disabled.
- **Dropdowns & selects:** Closed, open, option-hover, selected, disabled.
- **Cards (interactive):** Default, hover, pressed.

### 10.2 Screen-Level States
- **Loading:** Skeleton or shimmer matching the layout shape. No blank screens. Show partial UI (nav, shell) even during auth checks.
- **Empty (first use):** Illustration + heading + descriptive paragraph + single CTA. No empty tables with zero explanation.
- **Empty (no results):** Search/filter state with clear message and a reset/clear-filters action.
- **Error (recoverable):** Inline error message near the problem. Global toasts only for non-field errors.
- **Error (unrecoverable):** Full-page error with explanation, retry action, and escape hatch to home/support.
- **404:** Friendly heading, brief description, link to home + search bar if applicable.

---

## 11. Accessibility Is Baseline

Accessibility is not a separate feature. Every screen ships accessible.

### 11.1 Non-Negotiable Requirements
- **Contrast:** WCAG AA across all text and interactive controls (see §5.5).
- **Keyboard:** Every interactive element reachable and operable via Tab/Shift+Tab/Enter/Escape/Arrow keys. Focus order follows visual order.
- **Focus indicators:** Visible focus ring (2–3 px, accent color, offset by 2 px from element edge) on every focusable element. `:focus-visible`, never plain `:focus` for mouse users.
- **Labels:** Every form input has an associated `<label>`. Every icon-only button has an `aria-label`. Every image has meaningful `alt` text (or `alt=""` if decorative).
- **Heading levels:** H1–H6 in logical document outline order with no skipped levels.
- **Touch targets:** Minimum 44×44 px for all interactive elements on touch-capable screens.
- **Zoom:** Layout must not break or truncate content at 200% browser zoom.
- **Screen-reader announcements:** Live regions for async updates (form submission, new messages, route changes).

### 11.2 Testing Gate
Before marking any screen complete, verify: (a) Tab through every interactive element, (b) run an automated contrast check, (c) inspect the heading outline, (d) confirm all images have alt text.

---

## 12. Responsive & Density

### 12.1 Adaptive Layout Strategy
- **Mobile-first:** Start at 320 px. Every component works as a single-column block before any side-by-side logic is added.
- **Breakpoint behavior:** Columns stack, navigation collapses to hamburger or bottom-tab bar, modals become full-screen sheets, tables become cards or horizontally scroll.
- **Fluid over fixed:** Use `%`, `fr`, `clamp()`, and `min()`/`max()` before media queries. Media queries are for layout restructuring, not smoothing.
- **Minimum content width:** No element narrower than 72 px except icons and badges.

### 12.2 Density Modes
Every data-dense screen supports two density modes:

| Property           | Default | Compact       |
|--------------------|---------|---------------|
| Row height         | 48 px   | 36 px         |
| Cell padding (Y)   | 12 px   | 6 px          |
| Font size (table)  | 14 px   | 13 px         |
| Icon size (table)  | 20 px   | 16 px         |

The user can toggle density; never hard-code only one spacing set for data-heavy views.

---

## 13. Anti-Patterns Checklist

Before shipping any screen, audit against this checklist. Any “yes” is a red flag:

- [ ] Pure-black (`#000`) or pure-white (`#fff`) used anywhere except as a deliberate design token? **Fix:** Use `neutral-50`/`neutral-950`.
- [ ] More than 3 font sizes on one screen outside the modular scale? **Fix:** Collapse to nearest scale step.
- [ ] Shadow and border used simultaneously on the same element? **Fix:** Pick one.
- [ ] Centered text for >3 lines of body copy? **Fix:** Left-align for readability.
- [ ] Skeleton and final content have different layout shape? **Fix:** Match the skeleton to the loaded layout.
- [ ] Color alone conveys information (red/green for status without an icon or label)? **Fix:** Add a text label or icon.
- [ ] Disabled button with no explanation of *why* it is disabled? **Fix:** Add a tooltip, helper text, or inline message.
- [ ] Overflow hidden on a content area without a scroll affordance? **Fix:** Ensure scrollbar or overflow indicator is visible.
- [ ] A modal that opens on page load? **Fix:** Trigger modals only from user action.
- [ ] `z-index` above 50? **Fix:** Reconcile stacking contexts; use a `z-index` scale (0, 10, 20, 30, 40, 50) and stay within it.
- [ ] Absolute positioning for primary layout? **Fix:** Use grid or flexbox.
- [ ] `!important` in CSS? **Fix:** Resolve specificity at the source.

---

## 14. Final Gut Check

When the screen is visually complete, step back and run these five questions before marking it done:

1. **Remove test.** Pick three elements at random. If you delete each one, does the screen still communicate its purpose? If yes, consider permanently removing the weakest.
2. **Scan-path test.** Blur your eyes. Can you still identify the primary CTA within one second?
3. **No-surprises test.** Hand the screen to someone unfamiliar with the product. Ask them “what does this screen do?” If they cannot answer in under five seconds, the hierarchy has failed.
4. **Keyboard test.** Complete the primary task using only the keyboard. If any step stalls, navigation or focus management is broken.
5. **Zero-data test.** Remove all dynamic content. Does the empty/loading skeleton look intentional, or does the screen look broken?

---

*This constitution is §5.1 of the Picasso agent specification. Every design output produced by Picasso must conform to every rule herein. Amendments require a new megadesign version and review against all existing generated outputs.*

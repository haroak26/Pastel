# Stripe — Do / Don't

## DO

### Use Generous Whitespace to Communicate Confidence

Let content breathe. 64-96px between major sections, 24-32px component padding. Empty space signals that the product is considered, not crammed. When in doubt, add space — Stripe errs on the side of too much rather than too little.

Example: Dashboard metric cards have only 3-4 data points each, surrounded by ample padding. Compare to competitors who pack 8-10 metrics into the same space.

### Reserve Accent for Primary Actions Only

The accent color (`#635BFF`) should appear 3-5 times per screen maximum. It marks exactly one thing: the primary action path. Every other element uses the neutral scale. If you're tempted to add accent to a secondary element, ask: "Am I competing with the primary action?"

Valid accent locations: primary CTA button, active navigation item, focus rings, links within body text, active tab indicator. Invalid: section backgrounds, dividers, icons (unless actionable), badge backgrounds, decorative elements.

### Use Dark Topbar/Nav Even on Light Pages

The dark navigation (`#0A2540`) is Stripe's single most recognizable design signature. Sidebar in dashboards, topbar on marketing pages — always dark, always full-width, always framing the page. Even on fully white screens, the dark bar at top or side says "Stripe."

This applies to: product dashboard, API reference, docs, marketing pages. The only exception: Checkout and Elements (hosted/integrated surfaces where Stripe recedes).

### Display Data with Typographic Precision

Numbers are the product. Display them with:
- Tabular numbers (`font-variant-numeric: tabular-nums`) so digits align
- Right-alignment in table columns
- Clear visual hierarchy (metric value large, label small, trend indicator subtle)
- Monospace for IDs, codes, API keys
- Large hero numbers (48px+) when celebrating scale or performance

Never use a visual treatment (color, icon, badge) where typography alone will suffice.

### Keep Chrome Minimal — Remove Before Adding

Before adding any UI element, strip away everything that isn't strictly necessary. Start with plain text on a white background. Add back only: structure (spacing), hierarchy (size/weight), and interaction cues (color/hover). The goal is not "clean design" — it's "the minimum visual language the user needs."

This means:
- No card borders unless the card needs visual separation from a white background
- No section dividers — use alternating band colors or spacing
- No labels on obvious information (do you need "Amount:" before "$49.00"?)
- No icons next to text that's already clear

### Use Serif Font for Brand Moments, Sans for UI

Serif (Tiempos Text or similar) for hero headlines, pull-quote metrics, and brand-focused sections. Sans (Inter) for all functional UI: navigation, forms, tables, buttons, labels, body text. The serif creates editorial warmth in designated "brand zones" — never bleed it into the functional UI.

A serif headline at 48px on a marketing hero is Stripe. A serif label on a form field is not.

### Make Focus States Prominent and Clear

Focus rings are mandatory: 3px, accent color (`#635BFF` or `#8A8FFF` on dark), 2px offset from the element edge. This is an accessibility requirement AND a brand signal. Stripe's prominent focus rings communicate: "We thought about every state, every user, every device."

## DON'T

### Don't Use Accent as Decoration

The accent is for action, not atmosphere. Never use:
- Accent-colored section backgrounds or washes
- Accent dividers or borders
- Accent icon containers (an icon inside a blue circle)
- Accent badges or tags
- Accent hover states on non-interactive elements
- Accent as a "brand pop" in illustrations or empty states

If it doesn't help the user take an action, it's not accent-colored.

### Don't Use Gradients on Any UI Element

Flat color only. No gradient buttons, no gradient backgrounds, no gradient overlays on images, no gradient text. Stripe is digitally precise, not atmospherically rich. The sole possible exception is a subtle dark-to-darker gradient on the hero's dark background — and even that is rare and barely perceptible.

### Don't Use Shadows on Cards

Cards are flat rectangles defined by content + spacing, not by elevation. If a card needs a shadow to "pop," it should not exist. Shadows are for overlapping surfaces only: dropdowns (subtle, 1-3px blur), modals (stronger, 4-12px blur), tooltips. Never on static page elements.

### Don't Use Rounded Corners Above 6px

Stripe's geometry is sharp and precise. Buttons: 4px. Inputs: 4px. Cards: 4px. Modals: 6px. Never use `border-radius` above 6px. Never use pill shapes (`border-radius: 999px`). Never use fully circular containers except for avatars. The sharpness communicates precision; the consistency communicates system.

### Don't Center Text

Stripe left-aligns everything. Headlines, body text, metrics, CTAs — all flush left. Centered text is for ceremonial occasions (and Stripe doesn't do ceremony). Left-alignment creates a strong vertical axis, which pairs with generous whitespace to create structure without borders or boxes.

Possible exceptions: footer headings (in multi-column layouts), empty states (rare, and even then left-aligned to a centered container).

### Don't Use More Than 3 Cards per Screen

Cards are for data display, not page structure. Three is the practical maximum (e.g., metric cards on dashboard, feature highlights on marketing). If you need four or more equal-weight containers, use a table or list instead. Cards competing for attention defeat the purpose of cards.

### Don't Use Decorative Illustrations

Product screenshots, code examples, and data visualizations only. No spot illustrations, no abstract shapes, no "characters," no decorative iconography. Stripe communicates through its product, not through artistic embellishment. An empty state shows a minimal textual prompt, not an illustration.

### Don't Use Colorful Backgrounds

Backgrounds are white (`#FFFFFF`), light gray (`#F6F9FC`), or dark (`#0A2540`). No tinted sections (no light blue bands, no warm gray). No gradient sections. No pattern backgrounds. The neutral palette is absolute — deviation reads as "not Stripe" immediately.

### Don't Use Multi-Colored Icons or Embellishments

Icons are monochrome, Neutral 500 by default, inherit text color when interactive. No two-tone icons. No gradient icons. No colored icons used decoratively. An icon's job is to identify, not to decorate. If an icon adds visual noise without adding meaning, remove it.

### Don't Use Animations for Visual Flair

Motion exists only to connect states, soften transitions, and provide feedback. No scroll-triggered reveals, no floating elements, no parallax, no animated illustrations, no hover animations on static content. The only acceptable motion: hover color shifts (80-120ms), dropdown/modal enter (150ms), focus ring transitions, and loading skeleton pulses.

### Don't Mix Typefaces Within a Single View

UI views (dashboards, forms, settings, docs) use Inter exclusively — no serif. Brand views (marketing pages, landing sections) use serif only in designated brand zones (hero headlines, large metrics). Never blend serif and sans within the same visual group. The boundary is absolute: a serif headline sits above Inter body text, never beside or intertwined.

---

## ANTI-PATTERNS: Common Mistakes When Designing "Stripe-Like" Interfaces

### Using Accent as a "Brand Color" Everywhere

**Wrong:** Accent-colored section headers, accent icons throughout the page, accent borders on cards, accent-tinted backgrounds.
**Why it fails:** Dilutes the accent's power. When accent appears everywhere, the user cannot identify the primary action path.
**Fix:** Audit the screen. Count accent appearances. If more than 5, reduce. Start by removing accent from non-interactive elements.

### Filling Empty Space with Decoration

**Wrong:** Adding illustrations, decorative patterns, colorful dividers, or stock photography to "make the page more interesting."
**Why it fails:** Stripe's power is in its restraint. Empty space is not a problem to solve — it's the design.
**Fix:** Let the empty space stand. If the page feels bare, the content or hierarchy is the issue, not the decoration budget.

### Over-Designing Cards

**Wrong:** Cards with box-shadow, colored top borders, accent header backgrounds, icon containers, hover lift effects.
**Why it fails:** Stripe cards are invisible. The user should perceive information, not containers. A shadowed card draws attention to the card itself, not the content.
**Fix:** Remove shadow. Remove border (or use 1px Neutral 200 if absolutely necessary). Remove colored accents from the card chrome. Check: can you describe the card's content without mentioning the card?

### Using Large, Bold Typography Everywhere

**Wrong:** 32px bold headings, 18px body text, heavy weight emphasis throughout.
**Why it fails:** Stripe uses one or two large headings per page at most. Overuse of large type flattens hierarchy and makes everything feel like marketing.
**Fix:** Body text at 16px, headings at 20-32px. Reserve 40px+ for hero moments only. Use weight to differentiate, not size alone.

### Adding "Helpful" Labels and Explanations

**Wrong:** "Amount: $49.00" instead of "$49.00." "Recent activity:" above a table that's obviously recent activity. Tooltips on every icon explaining what it does.
**Why it fails:** Stripe trusts the user's intelligence. Redundant labels and explanations are visual noise.
**Fix:** Remove every label. Then add back only the ones where user testing shows confusion without them.

### Using Cheerful or Casual Language

**Wrong:** "Awesome, you're all set!" "Let's get you started!" "Oops, something went wrong!"
**Why it fails:** Stripe is professional and precise. Casual language undermines the trust and seriousness of financial infrastructure.
**Fix:** Use direct, neutral language: "Account created." "Get started." "Payment failed — [reason]." No exclamation marks. No emotional words.

---

## QUICK REFERENCE: Before/After

| Scenario | Don't (Stripe would never) | Do (Stripe would) |
|----------|---------------------------|-------------------|
| Dashboard header | Blue gradient bar with white title | Plain white background, dark title, accent only on CTA |
| Pricing cards | 4 cards with shadows, colored headers, "Popular" badge | Simple comparison table, flat rows, no cards |
| Login page | Centered card with blue header, lock icon, "Welcome back" | Left-aligned form on white background, email + password, "Sign in" button |
| Feature section | Icons in colored circles, 3-column card grid | Alternating text + screenshot bands, left-aligned |
| Error state | Red banner with "Oops!" and illustration | Red text below the offending field: "Card number is invalid" |
| Success message | Green checkmark animation, "Congratulations!" toast | Brief green text: "Payment confirmed" — no animation |
| Navigation | Colorful mega-menu with icons, descriptions, CTAs | Compact dropdown: 5-7 text links, no icons, no decoration |
| Footer | Multi-colored sections, large logo, social icons prominent | Dark footer, organized sitemap columns, small text, no color |

---

## HIERARCHY OF PRINCIPLES: Priority Order When Making Trade-Off Decisions

When two Stripe principles conflict, use this priority order to resolve:

1. **Content over chrome.** If choosing between adding a visual element and letting content speak, let content speak.
2. **Typography over decoration.** If choosing between a type treatment and a visual treatment (color, icon, border), choose type.
3. **Whitespace over dividers.** If choosing between spacing and a line/box to separate elements, choose spacing.
4. **One accent over many.** If tempted to add a second accent color, don't. Find a way to use the first.
5. **Left-alignment over centering.** In ambiguous cases, left-align.
6. **Flat over elevated.** If considering a shadow, re-evaluate whether the element should exist.
7. **Sans over serif in functional UI.** Serif is for brand moments only. If the element is functional, it's sans.

### Example Trade-Offs

**Trade-off: "The dashboard needs more visual hierarchy between sections."**
- Don't: Add colored section headers, card borders, or background tints.
- Do: Increase the whitespace between sections. Let the spacing create the hierarchy.

**Trade-off: "The table feels plain without visual separation."**
- Don't: Add zebra striping, colored headers, or card borders around rows.
- Do: Adjust row height, increase cell padding, or add a subtle 1px Neutral 200 bottom border to each row.

**Trade-off: "The CTA button needs to stand out more."**
- Don't: Make it larger, add a glow, use a gradient, or add an arrow icon.
- Do: Remove competing visual elements from the area around it. The button stands out by being the only thing with color in a neutral zone.

---

## DESIGN VOCABULARY: Dos and Don'ts by Element Type

### Navigation

- DO: Dark background (`#0A2540`), compact height (60-64px), 5-7 links, one accent CTA
- DO: Use subtle opacity shifts for hover states (white text at 100% → 80% on hover)
- DO: Sticky positioning for long pages
- DON'T: Light background, mega-menus, dropdowns with icons/descriptions, multiple CTAs
- DON'T: Underline hover effects, background-color hover effects, animated dropdowns

### Hero Sections

- DO: Dark background or white with product screenshot, serif headline (48-64px), Inter subtitle
- DO: One primary CTA (accent button) + one secondary (ghost white or text link)
- DO: Show the product immediately (browser-frame mockup, embedded demo, code snippet)
- DON'T: Gradient backgrounds, abstract illustrations, multiple competing CTAs, carousels
- DON'T: Animated hero text, particle effects, auto-playing video without user control

### Cards (When Necessary)

- DO: White background, 4px radius, NO shadow, NO border (or 1px Neutral 200 if needed)
- DO: 24px internal padding, typographic hierarchy (heading → body → metadata)
- DO: Maximum 3 per screen, equal visual weight
- DON'T: Hover lift effects, colored top borders, icon containers, "Learn more" links on every card
- DON'T: Unequal card heights, mixed content types in the same card row

### Forms

- DO: Left-aligned labels above inputs, 14-16px input text, border-bottom or full-border style
- DO: Single-column layout, generous vertical spacing (24px between fields)
- DO: Prominent focus rings (3px accent, offset 2px)
- DON'T: Placeholder-only labels (label must remain visible), inline validation that shifts layout
- DON'T: Multi-column form layouts, "required" asterisks on every field (assume all are required, mark optional)

### Tables

- DO: Minimal styling — 1px bottom border on rows, 12px header text (uppercase, Neutral 500), 14px cell text
- DO: Right-aligned numeric columns with tabular numbers, generous cell padding (12-16px vertical)
- DO: Hover state: Neutral 100 background on row
- DON'T: Zebra striping, vertical borders, colored headers, bold cell text
- DON'T: Cards as an alternative to tables (if it's tabular data, use a table)

### Code Blocks

- DO: Dark background (`#011627`), syntax highlighting (cool palette), 24px padding, 4px radius, copy button
- DO: JetBrains Mono, 14px, generous line-height (1.6)
- DON'T: Light-background code blocks (unless in a light-mode-only context), decorative code window chrome (traffic light dots)

### Empty States

- DO: Minimal text: one heading, one description sentence, one CTA
- DO: Left-aligned within the content area
- DON'T: Illustrations, "welcome" messaging, multiple paragraphs, decorative icons
- DON'T: Centered layout, cheerful tone, emoji

### Footers

- DO: Dark background (`#0A2540`), multi-column sitemap, 12-14px text, organized by category
- DO: Subtle link colors (Neutral 400), quiet typography
- DON'T: Bright colors, large logos, social media icon grids, "Back to top" buttons
- DON'T: Copyright as primary element (it's at the very bottom, smallest text)

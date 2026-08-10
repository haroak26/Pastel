# Mercury Design — Do & Don't Reference

## Core Principle

Mercury is banking for startups — financial data presented with trust, precision, and
clarity. Every design choice either reinforces that this is a competent, secure, modern
financial platform, or undermines it. When in doubt, choose cleaner, simpler, and more
precise. This is money. The design should feel safe, not playful.

---

## Color

### DO

- ✅ Use clean white (`#FFFFFF`) as the primary surface — bright, fresh, trustworthy
- ✅ Use blue (`#3B82F6` or similar) as the single accent color — sparingly, functionally
- ✅ Use clear semantic colors: green (`#059669`) for credits/money in, red (`#DC2626`) for debits/money out
- ✅ Use amber (`#D97706`) for pending states and warnings
- ✅ Use neutral grays (`#6B7280`, `#374151`, `#111827`) for text hierarchy
- ✅ Use light gray backgrounds (`#F9FAFB`, `#F3F4F6`) for secondary surfaces, hover states, table headers
- ✅ Keep the accent color exclusively for interactive/functional purposes — links, buttons, focus rings, active states

### DON'T

- ❌ Never use warm colors (orange, coral, yellow, pink) as primary UI colors — they undermine financial seriousness
- ❌ Never use decorative gradients as background treatments for cards or pages
- ❌ Never mute semantic colors to the point of ambiguity — green must clearly mean credit, red must clearly mean debit
- ❌ Never use pastel or "soft" versions of functional UI colors
- ❌ Never use off-white, cream, or warm gray as the primary page background
- ❌ Never use multiple competing accent colors — one accent, used sparingly
- ❌ Never use color alone to convey critical information — always pair with icons, labels, or text

---

## Shape & Border Radius

### DO

- ✅ Use crisp border radius: 4-6px for nearly all components (buttons, inputs, cards, modals)
- ✅ Keep radius consistent across all similar components — no mixing 4px and 6px
- ✅ Use 8px radius sparingly for featured marketing CTAs or large containers
- ✅ Use circular shapes only for avatars and small status indicators (dot states)
- ✅ Use 0px radius for table edges where borders handle spacing
- ✅ Maintain a professional, geometric feel — everything is intentionally positioned

### DON'T

- ❌ Never use border radius above 8px for functional UI components
- ❌ Never use pill-shaped buttons (border-radius: 9999px) — too playful for financial UI
- ❌ Never use organic, blob-like, or irregular shapes outside of illustrations
- ❌ Never use 0px radius on interactive elements (buttons, inputs) — always at least 4px
- ❌ Never vary radius within the same component hierarchy (a card with 6px and its inner button with 4px)
- ❌ Never use decorative, asymmetric, or experimental shapes in the core UI

---

## Spacing & Layout

### DO

- ✅ Use moderate, consistent spacing throughout: 8-12px for dense data areas, 16-24px for standard UI
- ✅ Apply 8-12px cell padding in transaction tables — data density is functional
- ✅ Use 24px card padding for dashboard cards — balanced and clean
- ✅ Maintain 16-24px between form fields with clear visual grouping
- ✅ Give marketing pages generous breathing room (64-96px section margins)
- ✅ Use consistent 4px baseline grid for all spacing decisions
- ✅ Align elements to a clear grid — nothing should feel randomly placed

### DON'T

- ❌ Never use excessive padding in data displays — "breathing room" wastes screen real estate in financial contexts
- ❌ Never let content touch screen edges — maintain at least 16px buffer on mobile, 24px on desktop
- ❌ Never create crowded, cluttered layouts where multiple CTAs compete for attention
- ❌ Never use asymmetrical or irregular spacing that feels decorative rather than functional
- ❌ Never center-align large blocks of text — left-aligned for readability and precision
- ❌ Never use multi-column form layouts — single-column, top-to-bottom only
- ❌ Never use decorative whitespace that separates related content (headings should be closer to their content than to the previous section)

---

## Typography

### DO

- ✅ Use clean, modern sans-serif typefaces — Inter, SF Pro, or system equivalent
- ✅ Enable tabular figures (`font-variant-numeric: tabular-nums`) on ALL numeric data displays
- ✅ Use weight hierarchy: Regular (400) body, Medium (500) emphasis, Semi-bold (600) headings
- ✅ Set body text at 14-16px with readable line height (1.4-1.5x)
- ✅ Make hero numbers the largest text on screen (36-56px, semi-bold or bold)
- ✅ Right-align all financial amounts in table columns with tabular figures
- ✅ Use monospace only for code, API keys, routing numbers, and IBAN codes
- ✅ Use sentence case for headings and labels — Title Case adds unnecessary formality
- ✅ Set table header labels in uppercase, 12px, gray-500 — small, clear, scannable

### DON'T

- ❌ Never use serif typefaces — they feel institutional and traditional
- ❌ Never use rounded, humanist, or friendly sans-serif typefaces — too soft for financial precision
- ❌ Never use display, decorative, or handwriting typefaces
- ❌ Never use light weights (300) — they lack the precision financial data demands
- ❌ Never center-align numbers — they must be right-aligned for column scanning
- ❌ Never use proportional figures for financial data — tabular figures are non-negotiable
- ❌ Never use italic for emphasis — use weight or color instead
- ❌ Never use multiple typefaces — one family, multiple weights
- ❌ Never set body text below 14px on any viewport

---

## Shadows & Elevation

### DO

- ✅ Use minimal, neutral shadows (black at low opacity: 0.05-0.10)
- ✅ Default to no shadow — add subtle shadow only when elevation is needed
- ✅ Use `shadow-sm` (0 1px 2px) for subtle card elevation
- ✅ Use `shadow-md` (0 4px 6px) for modals, dropdowns, and elevated panels
- ✅ Use clean, crisp shadow rendering — small blur radius, low opacity
- ✅ Use borders as an elevation alternative (1px solid `--gray-200`)

### DON'T

- ❌ Never use warm-toned shadows — shadows should be neutral black with low opacity
- ❌ Never use large, soft, "floating" shadows (16px+ blur) — too decorative
- ❌ Never use colored shadows (blue glow, green glow) for elevation
- ❌ Never use layered or stacked multiple shadows on a single element
- ❌ Never use shadows as decoration — they exist only to communicate elevation
- ❌ Never use dramatic drop shadows that make the UI feel theatrical
- ❌ Never use box-shadow on text elements

---

## Animation & Motion

### DO

- ✅ Use fast, precise animations: 120-200ms for UI elements
- ✅ Use `ease-out` and `ease` as the default easing curves — functional, not expressive
- ✅ Animate hover states at 120ms — nearly instant, feels responsive
- ✅ Use smooth numerical transitions for balance updates (150-200ms count-up effect)
- ✅ Animate chart elements with draw-in effects (400-600ms, ease-out)
- ✅ Respect `prefers-reduced-motion` — make all animations instant (0ms) when set
- ✅ Keep modals and dropdowns at 150-200ms — fast enough to feel immediate, slow enough to register
- ✅ Use subtle opacity transitions for state changes (active/inactive, enabled/disabled)

### DON'T

- ❌ Never use slow animations (300ms+) for functional UI elements — speed communicates reliability
- ❌ Never use spring physics, bouncy easings, or elastic effects — money is not playful
- ❌ Never use decorative animations — if it doesn't communicate a state change, it shouldn't animate
- ❌ Never animate page or section backgrounds with gradients or color shifts
- ❌ Never use scroll-triggered reveal animations on dashboards or data views
- ❌ Never animate financial data with dramatic effects (no popping, bouncing, or sliding numbers)
- ❌ Never use loading spinners that spin fast — use subtle pulse animations instead
- ❌ Never use parallax scrolling or any animation that separates user action from screen response

---

## UI Components

### DO

- ✅ Design buttons with crisp 4-6px border radius, clear labels, and visible states (default, hover, active, disabled)
- ✅ Use full-width primary CTAs on forms for clarity
- ✅ Make form inputs with clear borders (`--gray-200`), focus rings (`--accent`), and visible labels above
- ✅ Use clean, minimal table designs with subtle zebra striping or row borders
- ✅ Design dropdown menus with clean borders, crisp shadows (`shadow-md`), and grouped items
- ✅ Show confirmation steps for all financial actions (transfers, card freeze, settings changes)
- ✅ Use descriptive button labels: "Review Transfer" not "Submit," "Freeze Card" not "Toggle"
- ✅ Display clear empty states: "No transactions yet" with a gentle prompt, never blank screens

### DON'T

- ❌ Never use pill-shaped buttons — too playful and informal
- ❌ Never use ghost buttons (border-only) as primary actions — they lack the weight a financial CTA needs
- ❌ Never design multi-step wizards or steppers for simple financial actions
- ❌ Never use decorative illustrations inside functional UI components
- ❌ Never use emoji in financial interfaces (transaction lists, dashboards, forms)
- ❌ Never use icon-only buttons without labels for financial actions — ambiguity is dangerous
- ❌ Never hide important financial information in tooltips or expandable sections
- ❌ Never use skeleton loaders with jerky or flashing animations — keep loading states minimal

---

## Data Visualization

### DO

- ✅ Use bar charts and tables as the primary data visualization — they're precise and scannable
- ✅ Use muted, distinct colors for chart categories — no rainbow palettes
- ✅ Sort chart data meaningfully (by amount: largest to smallest)
- ✅ Display both absolute values ($) and relative values (%) for all chart data points
- ✅ Keep chart axes labeled clearly with unambiguous scale
- ✅ Use consistent chart types across the product — don't switch between pie, donut, and bar for the same data
- ✅ Make charts interactive — hover for exact values, tap/click for drill-down

### DON'T

- ❌ Never use 3D charts or isometric visualizations — they distort data accuracy
- ❌ Never use donut or pie charts for more than 6 categories
- ❌ Never use radial, bubble, or other non-standard chart types — they reduce precision
- ❌ Never use animated chart reveals that delay data comprehension
- ❌ Never use gradient-filled bars or decorative chart backgrounds
- ❌ Never truncate chart axes to exaggerate differences
- ❌ Never use charts as decoration — they exist to communicate data, not to look impressive

---

## Tone & Copy

### DO

- ✅ Write clearly, directly, and simply — explain financial concepts without jargon
- ✅ Use confident, declarative language: "Transfer complete," "Card frozen," "Balance updated"
- ✅ Be transparent about fees, timing, and processing details
- ✅ Use the user's language: "money in" not "credits," "money out" not "debits," when appropriate
- ✅ Keep labels, CTAs, and statuses short and scannable
- ✅ Use sentence case for nearly everything — Title Case adds formality
- ✅ Make confirmation and error messages specific: "Transfer of $2,500.00 to Stripe Inc. was successful"
- ✅ Speak like a startup-native tool, not a bank: modern, clear, respectful of intelligence

### DON'T

- ❌ Never use banking jargon ("ACH debit origination," "RTN," "OCT") without clear explanation
- ❌ Never use marketing fluff, superlatives, or hyperbolic language
- ❌ Never use uncertain language: "we try to," "we aim to," "hopefully," "should be"
- ❌ Never use overly casual or playful language about money ("cha-ching," "woohoo," "nice!")
- ❌ Never use fear-based messaging about security or fraud
- ❌ Never use "Lorem ipsum" or placeholder copy in production interfaces
- ❌ Never use all-caps in body copy or labels (small-caps for table headers is acceptable)
- ❌ Never write error messages that blame the user: "Invalid input" → "Please enter a valid account number"

---

## Navigation & Architecture

### DO

- ✅ Use sidebar navigation on desktop — SaaS pattern, familiar to startup users
- ✅ Keep primary navigation items to 5-7 maximum: Dashboard, Transactions, Transfers, Cards, Settings, Team
- ✅ Highlight the active page clearly with accent color and subtle background
- ✅ Use breadcrumbs or clear back navigation on detail pages
- ✅ Surface common actions (Send Money, Invite Team) from the dashboard
- ✅ Group settings logically: Team, Account, Billing, Security, Developer (API)

### DON'T

- ❌ Never use hamburger menus as the only navigation on desktop
- ❌ Never create deep navigation hierarchies that bury frequent actions
- ❌ Never use horizontal top navigation with dropdown menus — too complex, too bank-like
- ❌ Never use tab bars (iOS/Android style) on desktop — mobile pattern only
- ❌ Never change the navigation layout between pages — consistency builds confidence
- ❌ Never hide account balances or critical financial data behind extra clicks or taps

---

## The Golden Rule

Money is serious. The design should feel like a precision instrument, not a toy.

If a design choice could be described with words like:
- "Playful" → wrong
- "Decorative" → wrong
- "Cute" → wrong
- "Experimental" → wrong
- "Artistic" → wrong
- "Theatrical" → wrong
- "Warm and fuzzy" → wrong
- "Delightful animation" → probably wrong

Instead, aim for:
- "Clean" → right
- "Precise" → right
- "Trustworthy" → right
- "Professional" → right
- "Clear" → right
- "Simple" → right
- "Responsive" → right
- "Functional" → right

When a user looks at a Mercury screen, they should feel confident that their money
is in capable, competent hands. Not excited. Not delighted. Not relaxed. Confident
and in control. That's the bar.

# Stripe — Case Studies

## Case Study 1: Stripe Dashboard

### Layout Structure

Three-column shell:
1. **Left sidebar** (240px, fixed): Dark background (`#0A2540`), white/dim text. Logo at top, nav sections (Payments, Balances, Customers, Connect, etc.) with icons. Active state: accent text + subtle left-border indicator (3px `#635BFF`). Separator between sections. User avatar at bottom with account switcher.
2. **Main content** (flex 1): White background, scrollable. Content organized in horizontal sections.
3. **No right sidebar** — content is full remaining width, usually with max-width constraints on data tables.

### Surface Treatments

- **Metric cards row** (top): 4 cards across, flat white, no shadow, no border. Each card: label (12px, Neutral 500, uppercase), value (32px, Neutral 900, weight 700, tabular-nums), trend indicator (green/red small text). Cards are separated by 24px gaps.
- **Recent activity table** (middle): Full-width, header row (Neutral 500, 12px), data rows (14px). Alternating band backgrounds not zebra stripes — group-related rows with subtle Neutral 50 background blocks. Right-aligned amounts.
- **Quick actions panel** (if present): Sits as a contrasting band, Neutral 50 background, containing 2-3 ghost buttons.

### Typography Choices

- Page title: 24px, weight 600, Neutral 900
- Metric values: 32px, weight 700, `tabular-nums`, Neutral 900
- Metric labels: 12px, weight 400, uppercase, tracking 0.5px, Neutral 500
- Table headers: 12px, weight 500, uppercase, Neutral 500
- Table data: 14px, weight 400, Neutral 700; amounts in tabular-nums
- Time filter: 14px, Neutral 700, dropdown

No serif on dashboard — pure functional UI. The "brand moment" is the dark sidebar, not decorative type.

### Color Application

- Accent appears on: active nav item, "View all" link in table header, filter dropdown active state
- Green appears on: positive trend indicators, "Succeeded" badge
- Red appears on: negative trends, "Failed" badge (rare)
- Rest is Neutral scale

### Spacing

- Sidebar-to-content: 0px (sidebar butts against content)
- Content padding: 32px top/sides, 64px bottom
- Between metric cards: 24px gap
- Metric card internal padding: 16px vertical, 20px horizontal
- Between sections: 48px

### What Makes It Distinctively Stripe

The confidence to show 4 large numbers at the top with no decoration — pure typography as interface. The dark sidebar creates the brand frame. The absence of color, shadow, and ornament forces the data to carry the experience. The metric cards feel like a cockpit for money, not a marketing dashboard.

---

## Case Study 2: Stripe Checkout

### Layout Structure

Single-column centered flow, 480px max-width card on a Neutral 50 background.

1. **Header**: Merchant logo (if configured) + "Pay [Merchant Name]" in Neutral 700
2. **Order summary**: Right-aligned in some variants, shows item + amount
3. **Payment method selection**: Tabs or segmented control (Card, Link, etc.). Active tab: accent underline.
4. **Card input form**: Stripe Elements embedded input — clean, single border-bottom style, label above, minimal chrome
5. **Pay button**: Full-width primary accent, 48px height
6. **Footer**: "Powered by Stripe" + terms links, 12px, Neutral 400

### Surface Treatments

- **Page background**: Neutral 50 — provides subtle separation from the white card
- **Checkout card**: White, 4px radius, 1px Neutral 200 border, no shadow. 32px internal padding.
- **Inputs**: Border-bottom style (Neutral 200), no background. Accent bottom border on focus. This keeps the form feeling light.
- **Order summary**: If present, right-side panel or top-of-form summary with Neutral 50 background, subtle border.
- **No cards within cards** — the entire form is one surface.

### Typography Choices

- Merchant display name: 16-20px, weight 500, Neutral 900
- Order amount: 28px, weight 700, Neutral 900, tabular-nums
- Input labels: 14px, weight 500, Neutral 700
- Input text: 16px, weight 400, Neutral 900
- Pay button: 16px, weight 600, white
- Footer: 12px, Neutral 400

### Color Application

- Exactly one accent element: the Pay button. Nothing else on screen uses `#635BFF`.
- Input focus ring: accent (3px ring), the only other accent appearance.
- Errors: Danger red (`#CD3D64`), appearing below the offending input.
- No decorative color anywhere on screen.

### Spacing

- Card margin from viewport edge: auto-centered, 48px from top
- Card padding: 32px
- Between form fields: 24px
- Between last field and button: 32px
- Button-to-footer: 24px

### What Makes It Distinctively Stripe

The checkout is aggressively minimal. No header image, no color band, no "secure checkout" badges or lock icons (trust is communicated through simplicity, not security theater). The single accent button is the only thing that feels "designed." Everything else is typography and inputs, as if the browser itself rendered them. Stripe Checkout proves that payment forms don't need visual reassurance — they need clarity.

---

## Case Study 3: Stripe API Reference

### Layout Structure

Three-column reference layout:
1. **Dark sidebar** (280px): Full-height, dark (`#0A2540`), scrollable. API endpoint tree: collapsible sections (Core, Payments, Customers, etc.), method indicator (GET/POST/DELETE in colored badges), active endpoint highlighted in accent.
2. **Content area** (flex 1): White background, scrollable. API endpoint documentation. Heading, description paragraph, parameters table, code examples, response object reference.
3. **Right column** (0-400px): Optional. When present, shows the request builder or code preview in context.

### Surface Treatments

- **Sidebar**: Dark, same as dashboard sidebar. This reinforces "this is a technical Stripe surface."
- **Code blocks**: Dark background (#011627), syntax-highlighted with greens/blues/ambers, 4px radius, 24px padding. Copy button top-right (Neutral 500, hover Neutral 300).
- **Parameters table**: Full-width, clean: Parameter | Type | Required | Description. Minimal borders, alternating row backgrounds not used — hover state only.
- **Request/Response panels**: Side-by-side or tabbed. JSON code blocks with collapsible objects.

### Typography Choices

- API method (GET/POST): 14px, weight 600, colored badge (green=GET, blue=POST, red=DELETE)
- Endpoint path: 20px, weight 600, Neutral 900, monospace
- Documentation body: 16px, Neutral 700, Inter
- Inline code: 14px, JetBrains Mono, Neutral 900 on Neutral 50 background
- Code blocks: 14px, JetBrains Mono, light-on-dark with syntax colors
- Parameters table: 14px body, 12px headers (uppercase, Neutral 500)

### Color Application

- Sidebar: dark (brand anchor)
- Method badges: muted semantic colors (green for GET, amber for POST, red for DELETE)
- Headings: Neutral 900 (no color)
- Links within docs: Accent 500 (the standard link color)
- Code syntax highlighting: cool palette (blues, teals, ambers, not warm)
- Accent on: sidebar active state, links, copy button hover

### Spacing

- Sidebar width: 280px
- Content max-width: 780px (readable line length for docs)
- Content padding: 48px
- Between sections: 48px
- Code block margin: 24px vertical
- Table cell padding: 12px vertical, 16px horizontal

### What Makes It Distinctively Stripe

Stripe's API reference is the best-in-class example of "docs as product." The dark sidebar signals technical depth. The content is generous with whitespace and code examples. Copy buttons on every code block. The overall feel is: "This documentation is as polished as the dashboard" — there is no quality gap between product and documentation. The side-by-side code-and-response pattern is a Stripe signature.

---

## Case Study 4: Stripe Homepage

### Layout Structure

Full-width sections, stacked vertically. No sidebar. Dark topbar (fixed, edge-to-edge).

1. **Dark hero** (full viewport height): Gradient or dark solid (`#0A2540`). Product demo — typically an animated Stripe Dashboard or code editor embedded in a browser frame mockup. Hero headline in serif, white. CTA buttons: primary accent + secondary (ghost white).
2. **Social proof logos**: Light gray band, row of company logos (monochrome, Neutral 400). No text, no carousel — just silent credibility.
3. **Feature sections** (4-6): Alternating white/light-gray bands. Each section: headline (32px, Neutral 900) + description (18px, Neutral 700) + screenshot or illustration (product UI, never decorative). Left/right alternation for visual rhythm.
4. **Metrics band**: Dark background, 3-4 large serif numbers ("250M+ API requests per day"), white text.
5. **CTA section**: White background, centered headline, primary button, "or talk to sales" secondary link.
6. **Footer**: Comprehensive sitemap (6-8 columns), dark background, organized by product/category. Small links, quiet typography.

### Surface Treatments

- **Hero**: Dark background, no borders. Browser-frame mockup as the visual centerpiece.
- **Feature bands**: Alternating white (`#FFFFFF`) and gray (`#F6F9FC`). No borders between bands — the color change IS the separator.
- **Metrics band**: Dark (`#0A2540`), white text.
- **Footer**: Dark (`#0A2540`), compact links, small text.

### Typography Choices

- Hero headline: 48-64px, serif (Tiempos), weight 400 (editorial, not bold), white
- Hero subtitle: 20px, Inter, weight 400, Neutral 400 (on dark)
- Section headlines: 32-40px, Inter, weight 700, Neutral 900
- Body: 18px, Inter, weight 400, Neutral 700
- Metrics numbers: 48px+, serif, white, large
- Footer headings: 14px, weight 600, white
- Footer links: 14px, weight 400, Neutral 400

### Color Application

- Accent ONLY on: primary CTA buttons, primary links
- Dark sections: hero, metrics band, footer, topbar
- Light sections: alternating white/light gray
- Zero decorative color — no colored icons, no section tinting, no gradient overlays

### Spacing

- Hero: viewport-filling height (80-100vh), generous internal padding
- Section vertical padding: 96-128px
- Between sections: 0px (bands touch edge-to-edge)
- Content max-width: 1080px, centered
- Footer: 64px vertical padding, compact link spacing

### What Makes It Distinctively Stripe

The homepage is the purest expression of "confidence through simplicity." The dark hero with a product screenshot (not an illustration) says: "Our product is impressive enough to show immediately." The serif headline provides editorial warmth. No animation for animation's sake. No gradient richness. No decorative patterns. Just alternating bands of content, immaculate typography, and a single accent color used 3-5 times total.

---

## Case Study 5: Stripe Elements

### Layout Structure

Embedded within host websites, so Stripe Elements must adapt to any surrounding context. Components are designed as "headless" UI — they carry minimal default styles and inherit the host site's look.

Three primary embedded components:
1. **Card Element**: Single input container. Placeholder text. Icon for card type (auto-detected). Error state.
2. **Payment Request Button**: Apple Pay / Google Pay button rendered inside an iframe or container.
3. **Address Element**: Multi-field form for billing/shipping, optionally with autocomplete.

### Surface Treatments

- **Card input**: By default, 1px border (Neutral 200), white background, 4px radius. Designed to be overridden by host CSS. Focus: blue accent border + glow (subtle box-shadow).
- **Container**: The Element mounts in a host-provided `<div>`. Stripe imposes minimal structure — just enough to function.
- **No padding, no margin** — all spacing is inherited from the host page's form layout.
- **Error state**: Red text below input, input border turns Danger red. Clears on next keystroke.

### Typography Choices

- Designed to inherit host page's font family, size, and color.
- Default: 16px, weight 400, Inter (or system sans-serif)
- Placeholder: lighter color, inherited size
- Error text: 13px, Danger red
- Card brand icon: 24px, inline with input text

### Color Application

- Default input border: Neutral 200
- Focus: `#635BFF` (Stripe blue), 1px border + subtle 0 0 0 1px spread
- Invalid: `#CD3D64` (Stripe red)
- Placeholder: inherited, typically lighter gray
- Text: inherited from host (default Neutral 900)
- All colors are overridable via Stripe Elements CSS API

### Spacing

- Card input height: 40-48px (adjustable)
- Input internal padding: inherit from host
- Error text margin-top: 8px below input
- Minimal intrinsic spacing — Elements are designed to slot into existing forms

### What Makes It Distinctively Stripe

Stripe Elements are remarkable for what they DON'T do: they don't impose a Stripe look. The design philosophy is "be invisible in the host UI." The default styles are clean and neutral enough to work anywhere, but every visible attribute can be customized. The auto-detection of card brand (showing the Visa/Mastercard logo as the user types) is a delight that feels like Stripe's intelligence surfacing at the right moment. The validation is immediate and clear but never aggressive. This is Stripe at its most self-effacing: putting the host's brand first, even at the cost of its own identity.

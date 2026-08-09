# Shopify design language

## When to reach for this reference
Use this reference when designing commerce platforms, marketplace dashboards, point-of-sale systems, inventory management tools, or any product that serves merchants and business operators. Shopify's language is the benchmark for making commerce tools feel confident, capable, and growth-oriented — apply it when the product exists to help users build and run their own businesses.

## Brand personality
Shopify projects confident commerce — the assured, capable partner that empowers entrepreneurs to build businesses. The personality is decidedly grown-up: serious about results, direct about value, and unwavering in support of the merchant's success. It avoids startup whimsy entirely; there is no mascot, no jokes, no decorative flair. Instead, it communicates competence through clarity — every design decision serves the merchant's ability to understand their business and take action. The personality says "we've built the infrastructure; you build the business."

## Color philosophy
Green (`#95BF47` or a similar rich, slightly muted green) is the brand anchor — it signals growth, money, and momentum. Black (`#000000` or `#121212`) serves as the structural neutral for type, icons, and primary UI elements. White is the dominant surface color. The green is deployed strategically and narrowly: the primary CTA button, the selected state, key data highlights (positive revenue, growth indicators), and the admin sidebar's active indicator. Outside of these moments, the interface is near-monochrome — black, white, and a tight range of cool grays (`#6D7175` for secondary text, `#8C9196` for subtle borders, `#F6F6F7` for surface variations). The restraint makes the green more powerful when it appears. Never introduce additional accent colors without a clear functional purpose.

## Typography approach
Shopify uses a custom or carefully selected sans-serif (Shopify's Polaris design system uses Inter or a bespoke geometric sans) that is clean, efficient, and highly legible. The type is deliberately neutral — it does not call attention to itself. Body text runs at 14px, labels at 12–13px, headings at 16–20px with tight but comfortable line-height (1.4–1.5). Weight hierarchy is minimal but clear: Regular (400) for body, Medium (500) for emphasis and labels, Semibold (600) for headings. Bold is rare. The type system supports dense data displays (order tables, product lists, analytics dashboards) without fatigue. Tabular figures are used for financial and numerical data.

## Spacing & density
Shopify balances information density with clarity. Admin screens — order lists, product catalogs, customer tables — are dense with data but scannable due to tight, consistent spacing. Cards and panels use 16–20px padding. Table rows are compact (36–40px) with 12px horizontal padding. Section breaks use 24–32px. The density communicates that this is a tool for doing work, not browsing. At the same time, critical actions (primary CTAs, key metrics) are given generous breathing room. The spacing strategy: pack related data tightly, separate logical sections clearly, and give high-priority actions room to stand out.

## Corner radius & shape language
Clean and efficient: 8px on cards and panels, 4–6px on buttons and inputs, 0px (sharp) on table borders and data containers. The slight rounding on interactive elements tempers the otherwise utilitarian shape language. Overall, the shape language is rectilinear and efficient — rectangles and squares dominate. The product image is the one place where shape can be more expressive: product thumbnails use soft 4px rounding or are displayed against white backgrounds that bleed to the card edge. The contrast is deliberate: the UI is all business; the product is the star.

## Elevation & depth
Flat and practical. Shopify uses 1px borders for structural separation — the admin sidebar, the card edges, the table dividers. Drop shadows are used minimally: modals and popovers get a restrained 0px-2px-8px shadow, and the primary navigation draws a subtle border-bottom. Cards on the dashboard (analytics widgets, quick-action tiles) sit flat against the background with no shadow — only a 1px border. The admin environment should feel like a well-organized desk, not a 3D environment. Depth is communicated through layout and typography, not elevation.

## Iconography & imagery
Icons are functional, precise, and from a consistent outlined icon set (Polaris icons or a similar set like Phosphor). Drawn at 20px with 1.5px strokes. They are purely instrumental — no decorative flourishes, no rounded terminals, no personality plays. Imagery is product photography only: product images, storefront previews, and theme thumbnails. Photography is high-quality, well-lit, and presented cleanly on white or neutral backgrounds. No illustration, no mascots, no abstract decorative graphics. The visual richness comes from the merchants' own products and brands, not from the admin interface.

## Signature patterns
The two-panel admin layout: persistent left navigation sidebar (dark or light, brand-colored active state) paired with a wide content area that uses a full-width, top-down page structure. The merchant dashboard with oversized metric cards (revenue, orders, visitors) that are the largest visual elements on the page. The resource list pattern — a paginated, filterable, searchable table of orders, products, customers, etc. — that appears in dozens of admin screens and is the workhorse of the interface. The in-context help system: small "Learn more" links and tooltip icons that provide guidance without leaving the page. The setup guide / getting-started checklist with progress tracking that transforms complex onboarding into a clear sequence.

## Motion philosophy
Motion is fast, functional, and restrained — matching the "get business done" attitude. Transitions are brief (150–200ms) with ease-out curves. Dropdowns, menus, and popovers appear instantly with a subtle opacity fade. Page transitions are simple cross-fades. Button states transition between default, hover, active, and loading with clean, no-nonsense timing. Loading states use skeleton screens with a subtle shimmer — they communicate progress without distracting. There is no decorative animation, no spring bounces, no celebratory effects. Motion exists to smooth state changes, not to entertain. If it doesn't help the merchant work faster, it doesn't belong.

## Voice & copy tone
Direct, confident, and merchant-obsessed. Shopify's copy treats the user as a business owner — it is professional, respectful, and free of condescension. Instructional copy is clear and action-oriented: "Add product," "Create discount," "View orders." Descriptions are concise and factual. Success messages are straightforward: "Product saved" rather than "Great job! Your product has been saved!" Error messages explain what happened and what to do in plain terms. The tone is consistent: Shopify is the capable partner providing clear direction, not the cheerleader or the entertainer. Sentence case throughout the interface. Title case for page headings only.

## Explicitly do not
- Do not reproduce Shopify's logo, wordmark, or any trademarked assets.
- Do not copy Shopify's UI copy, taglines, or branded messaging verbatim.
- This reference describes a design language to draw inspiration from, not a license to clone Shopify's product or visual identity.

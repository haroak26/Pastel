# Stripe design language

## When to reach for this reference
Use Stripe's design language when building developer-facing products, API documentation, fintech dashboards, or any tool where technical credibility and trust must coexist. It works especially well for B2B SaaS where the user is sophisticated and values clarity over hand-holding. The language scales from marketing pages to deeply nested configuration UIs — it's a docs-as-product philosophy applied end-to-end.

## Brand personality
Technically elegant and quietly playful. Stripe feels like it was designed by engineers who have great taste — it values substance over decoration but isn't afraid of a clever gradient or a wry code example. The personality is helpful without being subservient: it treats the user as a peer. There is a sense of craftsmanship that mirrors the developer audience's own values.

## Color philosophy
The foundation is a cool, dark blue-gray (`#0A2540` / `#1A1F36` on marketing surfaces) with crisp white content areas. The signature indigo accent (`#635BFF`) is the one color you cannot ignore — it appears on primary CTAs, selected states, and key interactive elements, always at full saturation. Beyond the indigo, color is restrained: a small extended palette of teal, cyan, amber, and coral exists for data visualization and status indicators, but these colors never compete with the indigo. Soft radial gradients (indigo-to-cyan or indigo-to-violet) appear on hero sections of marketing pages as an occasional signature — never as a default background treatment. Code blocks use semi-transparent indigo-tinted backgrounds rather than stark white or black.

## Typography approach
Stripe's type is clean, performant, and engineered for the web. Historically, the brand has moved between system fonts and custom typefaces; the current approach favours well-tuned system stacks (Inter, SF Pro, or equivalent metric-compatible families). Marketing headings may use a bespoke display face with high x-height and tight spacing. Code samples are set in a legible monospace (typically Source Code Pro or a system mono stack) with syntax highlighting that mirrors the indigo accent palette. Tabular data and numbers always use tabular-nums for alignment. Type hierarchy is flat — usually three levels max: display heading, section heading, body.

## Spacing & density
Generous spacing with purpose. Marketing pages use wide 80–120 px outer gutters and 40–60 px vertical gaps between sections. Product UI is denser but never cramped — card grids use 16–24 px gaps, form fields get 12–16 px of vertical separation, and sidebar navigation uses comfortable 8–12 px padding within items. The overall rhythm aims for scanning comfort. Code-heavy layouts get extra horizontal breathing room so line length stays readable (60–80 characters for prose, ~100 for code).

## Corner radius & shape language
Crisp but not sharp. Buttons and form inputs use 4–6 px border-radius — tight enough to feel precise, rounded enough to feel approachable. Cards and panels use 8–12 px. The overall geometry leans rectangular with subtly eased corners; there are no squircle or pill-shaped elements at the product level. Code blocks and pre-formatted areas stay sharp-edged or near-sharp for fidelity to the editor paradigm.

## Elevation & depth
Stripe's depth model is restrained. Cards rest on very subtle box-shadows — often just 1–2 px blur with low opacity — and primary CTAs get a gentle glow in their hover/active states. The marketing site uses layered content bands with alternating background tints to create depth without shadows. Modals and dropdowns use a single elevated layer with a soft diffuse shadow (0–4 px blur). Nothing floats or casts dramatic shadows; the philosophy is "enough depth to understand hierarchy, no more."

## Iconography & imagery
Icons are outlined, 1.5–2 px stroke weight, drawn on a 24×24 canvas. The style is geometric and consistent — no filled variants except for very small badges or status indicators. Custom illustrations are occasional and technical in nature (abstract network graphs, isometric payment flows, geometric patterns built from the brand's own product shapes). Photography is editorial: clean corporate settings, developer workspaces, and product screens shown on real devices. The imagery always feels intentional, never stock.

## Signature patterns
- **The indigo gradient hover state** — primary buttons shift from flat indigo to a subtle indigo-to-violet gradient on hover
- **Code-as-content sections** — marketing pages intersperse live code snippets with explanatory prose, blending documentation into the narrative
- **Background grid dots** — a very faint dot-grid pattern on dark marketing backgrounds, evoking graph paper or an IDE canvas
- **Inline code blocks with styled syntax highlighting** even outside formal docs sections
- **Data tables with alternating row transparency** (not zebra striping) for readability
- **Terminal-styled UI components** — dark panels with green/white monospace text for showing API responses or CLI output

## Motion philosophy
Motion is crisp and functional. Page transitions use short fades (150–200 ms). Interactive elements respond instantly with scale changes (0.97x on button press) and subtle color shifts. Scroll-triggered reveals are used sparingly on marketing pages — elements fade-up and slide in with 300–400 ms ease-out curves. Never uses gratuitous animation in product UI. Loading states use subtle skeleton screens that match the content layout rather than spinners. Focus rings are clean 2 px indigo outlines that appear instantly.

## Voice & copy tone
Precise, helpful, and lightly witty. Copy explains complex financial and technical concepts without dumbing them down. Sentences are active and direct. Documentation reads like a conversation with a knowledgeable colleague — it anticipates questions and answers them in order. Marketing copy is confident but measured; it lets the product's capabilities do the selling. Error messages are clear about what happened and what to do next. The occasional clever code comment or playful API response body adds personality without undermining trust.

## Explicitly do not
- Do not reproduce Stripe logos, wordmarks, or trademarked assets
- Do not copy Stripes's UI copy, taglines, or documentation text verbatim
- Do not build a payment UI that could be mistaken for Stripe's own hosted interfaces
- This reference describes a design language to draw from — it is not a license to clone any specific Stripe interface

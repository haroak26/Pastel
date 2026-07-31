# Layout Pattern Library

Use these concrete composition strategies when translating screen specs into JSX. Choose the pattern variant that matches the style seed and the section's purpose. Treat these as reference — adapt, don't copy verbatim.

---

## Hero Patterns

### Split Hero (editorial, swiss, dieter-rams, scandinavian)
Asymmetric two-column split. Left column (55-65% width): large display heading + lead paragraph + CTA button group. Right column (35-45%): visual element (CSS illustration, geometric shapes, typographic composition). The split creates dynamic tension through unequal visual weight. Headline aligned left, generous whitespace between text layers. No image placeholder.

### Full-Bleed Statement (monumental, luxury-fashion, zen, motion-first)
Single column, center or left-anchored. Display-size headline occupies 60-80% of hero height. Minimal supporting text — one line max. No CTA above the fold for luxury/zen variants. Background is either solid color, subtle texture, or gradient wash (if seed permits). The statement IS the hero.

### Type-Only Hero (editorial, brutalist, constructivist, high-contrast)
No visual element. Typography does all the work. Massive display headline, one stark paragraph, one CTA. Generous whitespace around the type block. The composition feels architectural — type as structure. Left-aligned or deliberately offset from center.

### Cinematic Hero (motion-first, retro-futurist, luxury-fashion)
Full viewport. Content layers progressively: background color/gradient → large headline → subtitle → CTA. Each layer has independent opacity/position. Meant to animate with scroll but code should show the final state. Rich atmospheric feeling.

### Geometric Hero (bauhaus, constructivist, memphis, neo-brutalist)
Primary shapes (circles, squares, triangles) anchor the composition. Typography interacts with the shapes — text may overlap, cut through, or sit alongside geometric elements. Bold, structural, unapologetic.

---

## Feature Section Patterns

### Alternating Rows (swiss, scandinavian, dieter-rams)
Two-column alternating: feature 1 text-left visual-right, feature 2 visual-left text-right, etc. Each row has generous vertical padding (96-128px). Text side: small overline → heading → paragraph. Visual side: CSS illustration or geometric composition. 64-80px gap between columns.

### Staggered Grid (editorial, organic, wabi-sabi)
Features arranged in a 2-3 column grid with uneven item sizes. Some items span 2 columns, some are tall, some are wide. Creates visual interest through irregularity. Each item: small icon/shape → heading → 1-2 line description.

### Bento Grid (swiss, data-dense, neo-brutalist, glassmorphic)
Apple-style bento layout. Features in a 3-4 column grid where items span different column/row combinations. Some items are cards, some are full-width dividers, some are stats. Rounded corners with subtle borders (or glass effect if seed permits). High information density with clear hierarchy.

### Single-Column Statement (zen, monumental, wabi-sabi, editorial)
One feature at a time, full width, centered or offset. Each feature gets a whole viewport section. Massive heading, generous paragraph, no visual clutter. The feature IS the section — nothing competes for attention.

### Card Row (scandinavian, glassmorphic, organic, art-deco)
Equal-width cards in a horizontal row (3-4 across). Each card: icon/shape top → heading → description. Cards separated by equal gap, not borders. Subtle background shift or hairline border on each card. Rounded corners if seed style supports it.

---

## Card & Collection Patterns

### Divider Row (editorial, swiss, zen)
Items separated by 1px hairline borders — not card containers. Each item: left-aligned content with generous horizontal padding. The divider IS the structure. No background shift on items.

### Media Card (editorial, scandinavian, organic, motion-first)
Full-bleed background area + floating content overlay. The "media" is CSS-drawn: solid color blocks, geometric shapes, typographic art. Content overlay: heading + 1-2 line description + link. Works for product cards, portfolio items, case studies.

### Stat Block (data-dense, swiss, dieter-rams, monumental)
Number + label pair. Numbers are large display-size (48-64px) with the label in small/caption below. Arranged in a row (3-4 stats). No card containers — just the numbers, separated by space or subtle dividers. Color accent on the numbers only.

### Pricing Card (scandinavian, dieter-rams, swiss)
Equal-width columns (3 across). Each column: plan name → price (display-size) → feature list → CTA button. One column highlighted: subtle background shift or slightly larger. No shadows. Hairline border on highlighted column only.

---

## Testimonial & Social Proof Patterns

### Pull Quote (editorial, zen, monumental, luxury-fashion)
Large quote mark (CSS-drawn or typographic), then the quote in display/h1 size, then attribution in small below. Full width, generous whitespace. The quote IS the section. No card, no avatar. One quote per section.

### Quote Grid (scandinavian, swiss, dieter-rams)
2-3 quotes side by side. Each quote: small leading mark → quote text (body size, italic or regular) → name + role below. Separated by subtle dividers or borders. No avatars, no quote marks beyond the leading element.

---

## CTA & Conversion Patterns

### Statement + Button (all seeds)
Full-width section, generous vertical padding. One compelling heading (h1 or h2), one supporting sentence, one prominent CTA button. Everything centered or offset. Background is either the main background or a subtle surface shift. No more than 3 elements total.

### Split CTA (editorial, motion-first, constructivist)
Two columns: text (60%) + form or button group (40%). Text side: heading + body paragraph. Action side: input fields, button, or single large CTA. Gap 64-80px. Visually balanced despite column width difference.

### Bottom Bar (data-dense, neo-brutalist, swiss)
Full-width horizontal strip, fixed or sticky. Short heading + CTA button. Thin border top. Minimal elements, maximum clarity. Used for page-bottom conversion or announcement.

---

## Navigation Patterns

### Minimal Top Bar (zen, editorial, luxury-fashion, swiss)
Brand name left, 3-5 links right. Hairline bottom border. Transparent or subtle background. Links in small size, muted color. Active state: text color shift to accent. 16-24px vertical padding.

### Expanded Nav (scandinavian, organic, motion-first)
Brand name + 4-6 links + CTA button. Links spaced generously (24-32px gap). CTA in accent color. Background surface color. Subtle bottom border or none.

### Bold Nav (neo-brutalist, constructivist, memphis)
Thick bottom border (2-3px). Bold typography. Active link has underline or background shift. Unapologetic visual weight. The nav is a design statement.

---

## Footer Patterns

### Minimal Footer (zen, swiss, dieter-rams, editorial)
Single row: brand name left, 2-3 links right. Hairline top border. Small/caption typography. Muted colors. Nothing else.

### Brand Statement Footer (monumental, luxury-fashion, motion-first)
Large brand name or logo mark centered. Tagline below. 3-4 link columns below that (4-5 links each). Generous vertical spacing between tiers. Caption typography for links, body for tagline.

### Link-Dense Footer (data-dense, scandinavian)
4-5 columns of links. Column headers in small/bold. Links in caption/muted. Top border. Each column: header + 4-6 links. Copyright line below all columns in caption/muted.

---

## Section Transition Guidelines

- **Space-only transition** (zen, editorial, wabi-sabi): No border, no background shift. Pure whitespace between sections.
- **Border transition** (swiss, dieter-rams, data-dense): 1px hairline border in border color token between sections.
- **Background banding** (scandinavian, organic, motion-first): Alternating background/surface colors every other section.
- **Bold border transition** (neo-brutalist, constructivist): 2-3px solid border, often black or accent, between sections as a design statement.

---

## Image & Visual Element Strategies

In the sandbox (no external images), create visual interest through:
- **Color blocks**: Large geometric color areas that act as "images". Solid rectangles, circles, or organic shapes in accent or surface colors.
- **Typographic art**: Single characters or short words at massive sizes (120-200px), treated as visual elements, not readable text.
- **Geometric compositions**: Circles, lines, grids, and shapes arranged as abstract illustrations.
- **Pattern repeats**: Simple repeating geometric patterns (dots, lines, grids) as background textures.
- **Data-vis as decoration**: Charts, numbers, and graphs as visual elements — even when not real data.
- **Border art**: Elaborate border treatments — stepped borders, double borders, asymmetric borders.

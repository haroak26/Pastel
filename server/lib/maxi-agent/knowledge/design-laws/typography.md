# Picasso Typography Law

## 1. The Two-Family Rule

A project shall use exactly one or two type families — never more. One family is always preferred. When two families are used, they serve distinct roles: one for headings (may be a display face with personality), one for body and all UI elements. A single family with sufficient weight range (at minimum Regular, Medium, Semi-Bold, Bold) is the ideal arrangement.

**Single-family projects:** When the brand personality can be adequately expressed through color, spacing, and surface treatment alone, use one high-quality family. This is the default for SaaS tools, dashboards, admin panels, and developer-facing products.

**Two-family projects:** When the product needs editorial flavor, luxury positioning, or a distinctive brand voice that a single workhorse family cannot carry alone.

---

## 2. Font Pairing — Canonical Pairings

Every pairing below has been battle-tested. Each specifies the heading font (H) and body/UI font (B). The pairing rationale is included so Picasso can select the correct pairing for the product's personality.

### 2.1 Editorial & Literary

**DM Sans + Source Serif 4**
- H: DM Sans (headings, labels) | B: Source Serif 4 (body)
- Use for: long-form reading experiences, blogs, newsletters, publishing platforms, literary journals
- Why it works: DM Sans provides neutral geometric structure for headings without competing with the warm, humanist serif body. Source Serif 4's generous x-height and open apertures make it readable at body sizes. The contrast between sans headings and serif body is the classic editorial rhythm.
- Weight distribution: DM Sans at 700 for H1–H2, 500 for labels. Source Serif 4 at 400 for body, 600 for emphasis.

**Newsreader + Inter**
- H: Newsreader (serif display) | B: Inter (body, UI)
- Use for: news platforms, media sites, content-heavy reading experiences
- Why it works: Newsreader's high-contrast serifs establish traditional editorial gravitas. Inter's familiar, highly-readable forms disappear into the background for UI chrome. The reader's attention stays on the content.
- Weight distribution: Newsreader at 500–600 for headings (its optical sizes handle display well). Inter at 400 for body, 500 for UI labels.

### 2.2 Modern SaaS & Tools

**Geist + Manrope**
- H: Geist | B: Manrope
- Use for: developer tools, API platforms, CLI tools, technical SaaS, Vercel-adjacent products
- Why it works: Geist's technical, slightly condensed forms project engineering precision. Manrope's geometric warmth softens the experience for reading. Both are sans-serif, so the contrast comes from proportion, not classification.
- Weight distribution: Geist at 600–700 for headings. Manrope at 400 for body, 500 for emphasis, 600 for UI labels.
- Anti-slop: Do not use Geist for body text. Its condensed proportions strain readability at paragraph scale.

**Inter Display + IBM Plex Sans**
- H: Inter Display | B: IBM Plex Sans
- Use for: enterprise SaaS, analytics dashboards, internal tools at scale
- Why it works: Inter Display's tight spacing and tall x-height create concise, scannable headings. IBM Plex Sans carries the engineering-company DNA — it feels rational, trustworthy, and unpretentious. This pairing says "we did the math."
- Weight distribution: Inter Display at 600 for headings. IBM Plex Sans at 400 for body, 500 for labels, 600 for data.

### 2.3 Brand-Forward & Creative

**Cabinet Grotesk + Inter Display**
- H: Cabinet Grotesk (bold, heavy display) | B: Inter Display (clean body)
- Use for: creative agencies, design tools, portfolio platforms, design-forward SaaS
- Why it works: Cabinet Grotesk's exaggerated weight contrast and distinctive terminals create instant brand recognition in headings. Inter Display underneath is invisible — it does not compete. The result is headings that punch and body text that reads.
- Weight distribution: Cabinet Grotesk at 700–800 for headings (its bold weights are the whole point of selecting it). Inter Display at 400 for body.
- Warning: Cabinet Grotesk's heavier weights can overwhelm at small sizes. Use it only above 24 px. Below 24 px, switch to Inter Display for headings.

**Sora + Satoshi**
- H: Sora | B: Satoshi
- Use for: fintech, Web3, crypto, modern consumer apps with technical edge
- Why it works: Sora's geometric purity and slightly squared counters read as forward-looking and technical. Satoshi is the workhorse — clean, open, highly legible. The pairing feels contemporary without trying too hard.
- Weight distribution: Sora at 600–700 for headings. Satoshi at 400 for body, 500 for emphasis, 600 for navigation.

**Clash Display + Switzer**
- H: Clash Display | B: Switzer
- Use for: bold consumer brands, lifestyle apps, music platforms, youth-focused products
- Why it works: Clash Display's sharp angles and distinctive character shapes inject personality into headlines. Switzer's neutral grotesque forms provide a calm counterbalance. The pairing is energetic but not chaotic.
- Weight distribution: Clash Display at 500–600 (its medium weights carry the most character). Switzer at 400 for body, 500 for UI.
- Warning: Clash Display must be used at 28 px minimum. Its personality degrades at small sizes.

### 2.4 Playful & Warm

**Fredoka + Nunito**
- H: Fredoka | B: Nunito
- Use for: children's products, educational apps, wellness, food & beverage, community platforms
- Why it works: Fredoka's rounded, friendly letterforms set a warm tone in headings. Nunito's matching rounded terminals carry the same personality into body text. The pairing is cohesive but differentiated by weight and proportion.
- Weight distribution: Fredoka at 600 for headings. Nunito at 400 for body, 600 for emphasis, 700 for buttons.

**Quicksand + Nunito Sans**
- H: Quicksand | B: Nunito Sans
- Use for: health apps, meditation, lifestyle, soft consumer brands
- Why it works: Quicksand's rounded geometric forms and soft edges read as gentle and approachable. Nunito Sans provides a matching soft sans-serif for body. The overall effect is calming and human.
- Weight distribution: Quicksand at 500–600 for headings. Nunito Sans at 400 for body.

### 2.5 Luxury & Fashion

**Playfair Display + Lato**
- H: Playfair Display | B: Lato
- Use for: luxury ecommerce, fashion brands, high-end hospitality, art galleries
- Why it works: Playfair Display's high-contrast didone strokes and elegant serifs signal luxury and tradition. Lato's humanist sans-serif body provides modern readability without disrupting the aspirational tone. The classing serif-heading/sans-body split.
- Weight distribution: Playfair Display at 400–700 (its variable optical axis handles display sizes beautifully). Lato at 400 for body, 700 for labels.
- Anti-slop: Never use Playfair Display in all-caps at body sizes. It becomes illegible. Headings only, 28 px minimum.

**Cormorant Garamond + Proza Libre**
- H: Cormorant Garamond | B: Proza Libre
- Use for: literary brands, premium editorial, subscription publications, wine & spirits
- Why it works: Cormorant's refined old-style serifs evoke centuries of print tradition. Proza Libre is a humanist sans that feels hand-drawn enough to pair with a serif without the sterile contrast of a pure geometric sans.
- Weight distribution: Cormorant at 500–600 for headings. Proza Libre at 400 for body.

### 2.6 Technical & Data-Dense

**JetBrains Mono + IBM Plex Sans**
- H: IBM Plex Sans | Data/Mono: JetBrains Mono
- Use for: developer tools, API documentation, data platforms, CLI tools, technical dashboards
- Why it works: JetBrains Mono's coding-specific design (ligatures, distinct character shapes, comfortable reading at small sizes) serves inline code, code blocks, and data tables. IBM Plex Sans handles the rest of the UI with engineering credibility.
- Weight distribution: IBM Plex Sans at 400 for body, 500 for UI, 600 for headings. JetBrains Mono at 400 for code.

---

## 3. Serif vs Sans — When to Break the Default

The default is sans-serif. It is legible, modern, and safe. Serifs must be justified.

### 3.1 Use a Serif Display When

- The product is an editorial publication, literary journal, or long-form reading platform
- The brand identity is rooted in tradition, craftsmanship, or heritage (wineries, watchmakers, tailoring)
- The product sells luxury goods where the purchase decision is emotional, not functional (fashion, jewelry, premium hospitality)
- The brand voice is warm, human, and narrative — storytelling is core to the experience
- The visual identity deliberately references print-era design language (masthead logos, newspaper layouts, book typography)

### 3.2 Stay Sans-Serif When

- The product is a SaaS tool, dashboard, admin panel, or internal tool
- The primary user task is scanning, filtering, or manipulating data
- The UI has dense information displays where serif glyphs would add visual noise
- The product must feel fast, efficient, and unbranded (developer tools, API platforms)
- The user base is global and serif legibility at small CJK or Arabic sizes is not guaranteed

### 3.3 The Hybrid Rule

If a product needs both (e.g., a SaaS tool with a marketing site): the product UI stays sans-serif, the marketing site may use a serif display for hero headings. Never mix within a single interface. The boundary is the navigation event — marketing page vs. app shell.

---

## 4. Weight Discipline

### 4.1 The Standard Weight Palette

| Weight | Numeric | Role |
|--------|---------|------|
| Regular | 400 | All body text, form inputs, table data, captions |
| Medium | 500 | Labels, metadata, secondary navigation, muted emphasis in body |
| Semi-Bold | 600 | Primary navigation, button text, strong emphasis in body, small headings (H4–H5) |
| Bold | 700 | Headings (H1–H3), primary CTAs, key data points, active states |

### 4.2 Weight Rationale

**Body at 400 (Regular):** Regular weight is the optimal text-rendering weight for continuous reading at 14–18 px. Lighter weights (300) lose contrast against backgrounds, especially in light mode. Heavier weights (500) create a dense, newspaper-like texture that feels fatiguing in digital contexts. Regular provides the smoothest paragraph block and the best legibility-to-density ratio.

**Emphasis at 500–600 (Medium to Semi-Bold):** Weight contrast is the most effective emphasis strategy. Italics are secondary — they should indicate a different voice (quotes, titles, foreign terms), not structural emphasis within a paragraph. Medium-weight emphasis creates a ~12% increase in stem thickness, which is perceptible without disrupting the paragraph's typographic color. Semi-Bold creates a ~20% increase and is appropriate for strong emphasis, key terms, and inline code references.

**Headings at 700 max (Bold):** Bold creates clear hierarchy without triggering the "alarm" response of black weights. At 700, the stem typically reaches 18–22% of the x-height, which separates headings from body while remaining legible at display sizes. Black weights (800–900) at heading sizes create unbalanced typographic color — the glyphs dominate the layout and the page feels top-heavy.

### 4.3 Weight Crimes

**Crime 1 — Thin weights (200–300) in UI:** Thin fonts fail at small sizes. At 12–14 px, thin stems (often 1 physical pixel on standard-DPI screens) break anti-aliasing, creating shimmer and illegibility. Thin labels are unreadable. Thin headings feel fragile, not elegant. The floor is 400. If you want lightness, use gray text on a white background — never a thin font weight.

**Exception:** Thin weights are acceptable at 48 px+ in hero marketing headings where the display intent is purely aesthetic, and legibility is supported by size. Even then, verify on a 1x display at the target viewport width.

**Crime 2 — Black weights (800–900) in body text:** Black weights in paragraph text create a wall of ink. Counters (the enclosed spaces in letters like 'a', 'e', 'o') collapse, reducing letter recognition. The paragraph block becomes a uniform gray mass. Reading speed drops measurably. Black weights are reserved for hero headlines above 40 px where they create deliberate typographic drama.

**Crime 3 — Bold entire paragraphs:** Bold body text is never acceptable. If a paragraph is important enough to be bold, it should be a callout, a pull quote, or a summary — a structurally different element. The reader cannot distinguish emphasis within a fully-bold paragraph because there is no weight contrast remaining. Bold paragraphs also consume disproportionate visual weight, stealing hierarchy from headings.

**Crime 4 — All-caps body text:** Uppercase text lacks the ascender/descender rhythm that makes lowercase legible. Readers recognize words by their shape (bouma), and all-caps eliminates shape variation. Capitals increase reading time by 13–18% and are perceived as shouting. Reserved for short labels (2–3 words), badges, and status indicators only.

---

## 5. Modular Scale

All font sizes derive from the base body size (16 px) multiplied by a consistent ratio. The scale must be used strictly — no sizes outside the scale.

### 5.1 Scale Selection

Select one scale for the entire project. The choice is permanent and governs every font-size declaration.

**Minor Third (1.200):** `11 — 13 — 16 — 19 — 23 — 28 — 33 — 40 — 48 — 58 — 69 — 83`

Use for: data-dense dashboards, admin panels, developer tools, analytics platforms, internal enterprise tools. This scale compresses the jumps between sizes, allowing more steps in less visual space. It is ideal when you need to differentiate multiple heading levels (H1 through H5) within a constrained UI.

Tradeoffs: Less dramatic hierarchy. Users scan by position, not size difference. H1 and H3 are closer together than in other scales.

**Major Third (1.250):** `11 — 14 — 16 — 20 — 25 — 31 — 39 — 49 — 61 — 76 — 95 — 119`

Use for: general SaaS products, B2B platforms, consumer tools, productivity apps. This is the default scale. The jumps are large enough to create clear hierarchy but small enough to avoid wasted space. Most products ship on this scale.

Tradeoffs: Balanced. No dramatic strengths or weaknesses. This is the safe choice.

**Perfect Fourth (1.333):** `11 — 15 — 16 — 21 — 28 — 37 — 50 — 67 — 89 — 119 — 158 — 211`

Use for: marketing sites, onboarding flows, brand-forward experiences, landing pages, consumer apps where visual impression matters more than information density.

Tradeoffs: Large jumps between sizes. H1 can feel enormous on desktop. The scale provides strong, dramatic hierarchy at the cost of density. Not suitable for data-heavy views.

**Augmented Fourth (1.414):** `11 — 16 — 16 — 23 — 32 — 45 — 64 — 90 — 128 — 181 — 256 — 362`

Use for: hero-only typography. This scale is too aggressive for product UI. Reserve it for marketing hero sections, billboard-style typography, and brand microsites where a single headline dominates the viewport.

Tradeoffs: Massive size jumps. Four or fewer levels are usable in practice. Do not use for any interface with more than one content level.

### 5.2 Base Size Rules

- **Body:** 16 px or 18 px. Never 14 px for paragraph text — it is too small for comfortable continuous reading at typical viewing distances.
- **UI labels, metadata, captions:** 12–14 px. Must still pass 4.5:1 contrast ratio.
- **Fine print (legal, footnotes):** 12 px minimum. Never 10 px or 11 px — these fail legibility standards for any text the user is expected to read.

---

## 6. Line-Height Rules

Line-height is measured as a unitless multiplier of font-size. Every element type has a prescribed range.

### 6.1 By Element Type

**Body text (paragraphs, ≤18 px): 1.5**
Rationale: Continuous reading requires generous inter-line spacing. At 1.5, the eye can track from the end of one line to the beginning of the next without losing position. Below 1.4, lines merge visually at typical reading distances and reading speed drops. Above 1.6, lines disconnect and the paragraph loses coherence.

**Body text (>18 px): 1.4–1.5**
Rationale: Larger text requires proportionally less line-height because the absolute pixel gap between lines is already larger. At 20 px with 1.4 line-height, the gap is 8 px — equivalent to a full grid unit and sufficient for line tracking.

**Headings (all sizes): 1.1–1.3**
Rationale: Headings are read in a single fixation, not scanned line-by-line. Tight line-height prevents multi-line headings from looking like separate statements. As heading size increases, tighten toward 1.1. At 60 px+, even 1.0 may be appropriate for single-line headings. Never exceed 1.3 — headings with body-level line-height look amateurish and waste vertical space.

**UI labels, buttons, chips: 1.2**
Rationale: These elements are single-line by design. Line-height exists only to vertically center the text within the component and to provide padding for the rare multi-line label. At 1.2, the text sits comfortably within standard component heights (32–48 px).

**Captions, metadata, footnotes: 1.2–1.3**
Rationale: Captions are short and rarely wrap beyond two lines. Tight line-height keeps the caption visually bound to its associated content (image, figure, data point) rather than floating independently.

**Form inputs: 1.2–1.3**
Rationale: Input text must align with placeholder text and maintain consistent vertical rhythm within the input field. At 1.2–1.3, text sits at the optical center of standard 40–48 px input heights.

### 6.2 Line-Height Crimes

**Crime 1 — Line-height 1.0 for body text:** Text lines touch the descenders of the line above. Illegible. Never.

**Crime 2 — Line-height 1.8+ for body text:** The paragraph disintegrates into individual lines. Reading flow is destroyed. The text looks like a list, not prose.

**Crime 3 — Inconsistent line-height within a component:** A card with a heading at 1.1, body at 1.5, and a caption at 1.3 is correct. A card with heading at 1.3, body at 1.3, and caption at 1.3 is flat and unprofessional — the heading has no tightness, the body has no breath.

---

## 7. Paragraph & Block Spacing

### 7.1 Heading-to-Body Gap

The margin below a heading must be smaller than the margin above it. This is the proximity principle: headings belong to the content they introduce, not the content that precedes them.

Formula: `heading-margin-bottom = heading-margin-top × 0.5`

Example: If an H2 has 48 px margin-top (section separation from previous section), its margin-bottom is 24 px (proximity to the paragraph it introduces).

Implementation: `margin-top: 48px; margin-bottom: 24px;`

For H1 (page-level heading): `margin-top: 64px; margin-bottom: 16px;` — the H1 is the page title and sits close to its subtitle/introduction.

### 7.2 Body Paragraph Spacing

Paragraphs within the same section: `margin-bottom: 16 px` (one grid unit above the base). This creates visible separation without breaking the section into fragments.

At 16 px paragraph spacing with 1.5 line-height on 16 px body, the inter-paragraph whitespace (16 px) is smaller than the inter-line whitespace (8 px × line count) plus paragraph gap. This correctly signals that a new paragraph is closer to the previous one than to unrelated content in the next section.

### 7.3 List Item Spacing

- **Bulleted/numbered list items:** 8 px between items. List items are siblings within a parent concept and should read as a unit.
- **Nested list:** 4 px between sub-items. The density signals subordination.
- **List-to-paragraph transition:** 16 px gap — same as paragraph spacing. The list is treated as a paragraph-equivalent for spacing purposes.

### 7.4 Label-to-Input Spacing

Form labels must sit closer to their inputs than to the preceding field. `label-margin-bottom: 4 px, field-margin-bottom: 16 px`. This creates visual grouping: label+input as a unit, units separated by larger gaps.

---

## 8. Maximum Line Lengths

Measure is expressed in characters (`ch`) — the width of the '0' glyph in the current font and size. Character-based measures adapt to font-size changes automatically.

### 8.1 Prescribed Measures

**Prose (articles, documentation, long-form): 60–65 ch**
Rationale: The human eye's optimal horizontal scanning range at reading distance is approximately 60–65 characters. Beyond this, the eye struggles to find the beginning of the next line on the return sweep. Below 45 ch, the text feels choppy and fragmented. At 65 ch with 16 px body, a line is approximately 520 px wide, which fits comfortably in a standard content column.

**UI text (dashboards, panels, cards): 70–80 ch**
Rationale: UI text is scanned, not read continuously. Users jump between labels, values, and statuses. Wider measures accommodate data tables, key-value pairs, and card layouts where horizontal density carries information value. Beyond 80 ch, the text column becomes too wide to scan in one fixation and the UI feels directionless.

**Captions, tooltips, small text: 35–40 ch**
Rationale: Short text at small sizes benefits from narrow measures. At 35–40 ch, a caption reads in 2–3 lines maximum, maintaining a compact, contained block. Wider captions look like abandoned paragraphs.

### 8.2 Anti-Slop: Variable Line Lengths

Never allow text to span the full viewport width. Full-width text (1920 px of prose) is a typographic war crime. Every text block must be constrained by its container. If a section has no natural container, create one — set a max-width or use a grid column.

---

## 9. Common Typography Crimes and Their Fixes

### Crime 1 — Centered Body Text
**Problem:** Centered body text over 2 lines forces the eye to find a different horizontal starting position on each line. Reading speed drops by 20–30%. It looks like a wedding invitation, not a product.

**Fix:** Left-align all body text. Center headings only when they are short (6 words or fewer), hero-level, and intentionally decorative. Right-align nothing except data in table columns with numeric alignment conventions.

### Crime 2 — Orphaned Headings
**Problem:** A heading at the bottom of a column or card, with its associated content starting on the next page/scroll position. The heading is visually separated from what it introduces.

**Fix:** Headings must have at least one full line of body text visible below them in the same container. If a heading would be the last element in a scroll viewport, push it to the next viewport. For cards: a heading with only 8 px of content below it is an orphan — increase the card height or move the heading.

### Crime 3 — Underlining Body Text
**Problem:** Underlines intersect ascenders and descenders (g, j, p, q, y), reducing legibility. Underlined text in digital contexts reads as a hyperlink — non-linked underlined text is a cognitive false positive.

**Fix:** Remove underlines from static text. Links may be underlined or color-differentiated. Never underline headings — they have sufficient hierarchy from size and weight alone.

### Crime 4 — Stacked All-Caps Labels
**Problem:** Multiple all-caps labels in a row (e.g., "ASSIGNED TO — DUE DATE — PRIORITY — STATUS") create visual noise and compete for attention. All-caps text reads as shouting and has poor legibility.

**Fix:** Sentence-case or title-case labels. Reserve all-caps for 1–2 word badges, status indicators, and short navigation labels where they serve as typographic micro-contrast, not primary information carriers.

### Crime 5 — Low-Contrast Captions on Photographs
**Problem:** 14 px gray captions overlaid on a photograph with variable luminance underneath. Some letters disappear into the image; others pop unnaturally. The text is illegible and looks amateurish.

**Fix:** Captions over images must sit on a semi-transparent background (`rgba(0,0,0,0.5)` for light text) with at least 4 px of padding, or the caption must be placed outside the image boundary entirely. Pure text-on-image is never acceptable for body-length content.

### Crime 6 — Monospaced Body Text
**Problem:** Using a monospace font for body paragraphs because it "looks technical." Monospaced fonts are designed so every glyph occupies identical horizontal space — this destroys the natural word-shape recognition that makes proportional fonts readable.

**Fix:** Monospace fonts are for code blocks, inline code, terminal output, and data tables that benefit from aligned characters. Never for prose. If you want a technical feel, use a workhorse sans-serif like IBM Plex Sans.

---

## 10. Distinctive Font Recommendations by Personality

Picasso must select fonts that express brand personality while maintaining readability. The following are specific, quality type families organized by the emotional and functional dimension they convey. Recommendations exclude system fonts (Inter, Roboto, system-ui) except where noted.

### 10.1 Professional / Trustworthy
- **IBM Plex Sans** — engineered, rational, corporate but warm. Best weight range for UI.
- **Source Sans 3** — Adobe's open-source workhorse. Newsroom-tested legibility.
- **Work Sans** — Grotesque with slightly wide proportions. Comfortable at all sizes.
- **Spline Sans** — Geometric with visible ink traps. Modern and precise.
- **DM Sans** — Geometric but softer than Inter. Used by Stripe-level products.

### 10.2 Playful / Friendly
- **Fredoka** — Rounded, bouncy, warm. Perfect for children's products and casual brands.
- **Nunito / Nunito Sans** — Rounded terminals, full weight range. The definitive friendly sans.
- **Quicksand** — Rounded geometric. Soft, approachable, gender-neutral.
- **Baloo 2** — Chunky, playful, Indian-design-origin. Unique personality.
- **Outfit** — Geometric with rounded details. Youthful but not childish.
- **Varela Round** — Rounded humanist. Less sweet than Nunito, more professional.

### 10.3 Technical / Developer-Facing
- **Geist** — Vercel's technical grotesque. Condensed, precise, coding-adjacent.
- **JetBrains Mono** — The definitive code font. Excellent for inline code and monospace data.
- **Fira Code / Fira Sans** — Mozilla's technical family. Fira Code for code, Fira Sans for UI.
- **Space Grotesk** — Geometric with distinctive details. Feels intentionally designed.
- **Archivo** — Grotesque designed for digital. High x-height, open apertures.

### 10.4 Luxury / Aspirational
- **Playfair Display** — High-contrast didone serif. The luxury serif of the decade.
- **Cormorant Garamond** — Refined old-style serif. Cinematic, romantic, premium.
- **Bodoni Moda** — Modern didone with optical sizing. Fashion and editorial.
- **Cinzel** — Classical uppercase serif. Luxury hospitality and heritage brands.
- **Cormorant** — Wide, generous old-style. Pairs beautifully with minimalist sans bodies.
- **Editorial New** — Condensed serif. Literary gravitas without nostalgia.

### 10.5 Warm / Human
- **Lato** — Humanist sans with visible warmth in terminals. Approachable but professional.
- **Libre Franklin** — American gothic with humanist touches. The "nicer Inter."
- **Public Sans** — US government-designed sans. Neutral but not cold.
- **Proza Libre** — Soft, slightly calligraphic sans. Feels handwritten.
- **Atkinson Hyperlegible** — Designed for maximum legibility. Kind, inclusive, warm.
- **Commissioner** — Low-contrast humanist sans. Quietly confident, not assertive.

### 10.6 Bold / Disruptive
- **Cabinet Grotesk** — Aggressive weight contrast. Needs large sizes to work.
- **Clash Display** — Sharp, angular display. Memorable but requires restraint.
- **Sora** — Geometric with squared counters. Technical-brutalist.
- **Archivo Black** — Extremely heavy grotesque. One weight, massive impact.
- **Syne** — Wide geometric display. Avant-garde, gallery-ready.
- **Anton** — Condensed sans-serif. Impactful at display sizes. Web-safe.

---

## 11. Anti-Slop — What Picasso Must Never Do

These rules are non-negotiable. Violating any of them produces result that looks like it was generated by a generic template.

### Never Use System-Font Stacks as the Primary Choice

`font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` is a fallback, not a design choice. If Picasso outputs Inter as the primary heading/body font, the result is indistinguishable from a thousand boilerplate startups. Inter is acceptable only as a deliberate, defensible choice for technical tools where font personality is intentionally absent. In all other contexts, select a distinctive type family.

**Exception:** The body/UI font may be Inter when the heading font carries sufficient personality (e.g., Playfair Display + Inter). The contrast between a distinctive heading font and an invisible body font is a valid design strategy. But both heading and body being Inter is laziness.

**Exception:** Developer tools, CLI docs, and API reference pages may use system fonts intentionally to mirror the terminal/editor experience. This is a conscious decision, not a default.

### Never Use Roboto as a Primary Font

Roboto is the Android system font. It carries zero brand personality. If Picasso suggests Roboto, it has failed to make a design decision. Roboto may appear in a fallback stack, never as the primary family.

### Never Use More Than Two Type Families

Three or more families in a project is incoherence. The user cannot tell what the third font is doing that the first two couldn't. Every additional family adds visual noise, increases page weight, and signals indecision. If you cannot achieve your typographic goals with two families, the problem is not the number of fonts — it is the hierarchy design.

### Never Bold Entire Paragraphs

Addressed in Section 4.3. Reiterated here as a cardinal rule. Bold is emphasis within regular text, not a paragraph-level style.

### Never Center Body Text

Addressed in Section 9. Reiterated here. Centered body text is the calling card of a template that did not consider reading ergonomics.

### Never Use Decorative/Fantasy Fonts for Functional UI

Display faces (Clash Display, Cabinet Grotesk, Syne) are for headings above 28 px. Never use them for buttons, labels, form inputs, navigation, or any UI element the user must read to complete a task. Display fonts in UI chrome are unreadable, unprofessional, and violate the principle that chrome must be invisible.

### Never Skip the Weight Palette Check

Before shipping a design, verify that every text element uses a weight from the defined palette (400, 500, 600, 700). If a 300, 800, or 900 appears, fix it. If an element uses a weight that does not match its role (e.g., labels at 400 instead of 500), fix it.

---

## 12. Implementation Checklist

Before considering a typography design complete, verify:

- [ ] Exactly 1 or 2 type families selected
- [ ] Distinct roles: heading family vs. body/UI family (if 2 families)
- [ ] All font sizes come from the chosen modular scale
- [ ] No font sizes outside the scale exist in the design
- [ ] Line-height rules applied per element type (body 1.5, headings 1.1-1.3, UI 1.2)
- [ ] Heading-bottom margins use the 0.5x proximity formula
- [ ] Paragraph spacing is exactly 16 px
- [ ] Maximum line lengths respected (65 ch prose, 80 ch UI, 40 ch captions)
- [ ] No thin weights (200–300) in the UI
- [ ] No black weights (800–900) in body text
- [ ] No bold entire paragraphs
- [ ] No centered body text
- [ ] No all-caps body text
- [ ] No decorative fonts in functional UI elements
- [ ] Italics used for voice shifts only (quotes, titles, foreign terms), not structural emphasis
- [ ] Every text element passes 4.5:1 contrast against its background (for body size) or 3:1 (for large text)
- [ ] Fallback font stack specified (including generic family: serif, sans-serif, or monospace)

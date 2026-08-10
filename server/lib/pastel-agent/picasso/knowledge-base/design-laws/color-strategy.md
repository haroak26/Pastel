# Picasso Color Strategy Law

## 1. Neutral-First Architecture

Color strategy begins with restraint. A screen rendered entirely in grayscale must be fully functional before any hue is introduced. The absolute rule: 80% or more of the visible UI surface area must be neutral tones — grays, off-whites, off-blacks. Accent color is a seasoning, not an ingredient.

### 1.1 The 80/15/5 Rule

- **80% — Neutrals:** Backgrounds, card surfaces, borders, dividers, disabled states, body text, secondary text. The structural skeleton of the interface.
- **15% — Semantic colors (muted):** Success green, warning amber, danger red, info blue — each appearing only when its meaning is active and relevant. These are not decoration; they communicate system state.
- **5% — Accent color:** Primary CTAs, focus rings, active navigation indicators, selected states, links. The accent appears sparingly and only where the user needs to take action or understand what is currently selected.

### 1.2 Why Neutral-First

Color is the most attention-grabbing visual property. When everything is colored, nothing is. A screen with blue headings, green cards, purple buttons, and orange badges forces the user to process color conflicts before they can parse information hierarchy. A neutral-first interface lets the user's attention flow to content first, color second. The accent then acts as a precise visual signpost — "click here," "you are here," "this has changed."

---

## 2. Neutral Scale Construction

### 2.1 Cool-Gray vs Warm-Gray Undertones

Every neutral gray has an undertone — a microscopic hue bias that influences the entire interface personality.

**Cool-Gray (blue undertone):**
- Hex signature: Slight blue channel elevation (e.g., `#F5F6F8` reads as blue-gray, not pure gray)
- Use for: developer tools, technical SaaS, analytics, engineering products, fintech, sci-med platforms
- Psychological read: Precise, technical, clean, clinical, rational, modern
- Example spectrum: `#FAFBFC` → `#F1F3F5` → `#E9EBED` → `#DEE1E5` → `#CED2D6` → `#ADB3BA` → `#868D95` → `#646B73` → `#495057` → `#343A40` → `#212529` → `#141619`

**Warm-Gray (yellow/red undertone):**
- Hex signature: Slight red/green channel elevation (e.g., `#F6F5F4` reads as warm-gray)
- Use for: editorial, lifestyle, wellness, luxury, hospitality, food, fashion, creative tools
- Psychological read: Human, approachable, organic, crafted, editorial, timeless
- Example spectrum: `#FAF9F7` → `#F2F0ED` → `#E8E4DE` → `#DDD8D1` → `#CEC8BF` → `#AFA89D` → `#8F887D` → `#6E6760` → `#504B46` → `#3A3531` → `#262320` → `#171513`

**When to choose cool-gray:** The product is informational, technical, or data-driven. The user's emotional state should be focused, analytical, efficient. The brand promise is competence and clarity.

**When to choose warm-gray:** The product is emotional, creative, or human-centered. The user's emotional state should be relaxed, inspired, or trusting. The brand promise is empathy and craftsmanship.

**Never mix undertones:** A cool-gray card on a warm-gray background, or vice versa, creates visual dissonance — the eye detects the temperature mismatch even if the user cannot articulate it. Choose one undertone family per project and apply it consistently across every neutral in the design system.

### 2.2 The 12-Step Neutral Scale

Every project needs exactly 12 neutral steps, numbered from 0 (lightest) to 11 (darkest) for light mode, and inverted for dark mode. The steps are not mathematical multipliers — they are perceptually even steps adjusted by a designer's eye.

| Step | Light Mode Role | Dark Mode Role |
|------|----------------|----------------|
| 0 | Page background (`bg`) | Deepest shadow text |
| 1 | Subtle section alt (`bg-muted`) | — |
| 2 | Card background (`bg-card`) | Page background (`bg`) |
| 3 | Hover state on bg | Card background (`bg-card`) |
| 4 | Border (subtle) | Hover state |
| 5 | Border (default) | Border (subtle) |
| 6 | Disabled text / icons | Border (default) |
| 7 | Secondary text | Disabled text / icons |
| 8 | Body text | Secondary text |
| 9 | Heading text | Body text |
| 10 | Heavy emphasis | Heading text |
| 11 | Near-black (never pure #000) | Near-white (never pure #FFF) |

### 2.3 Building the Scale

Start at the extremes and work inward:

1. **Step 0 (page bg):** Light mode: near-white with undertone. E.g., `#FBFCFD` (cool) or `#FBFAF8` (warm). Never pure `#FFFFFF` — see Section 9.
2. **Step 11 (near-black):** Light mode: dark gray with undertone. E.g., `#141619` (cool) or `#171513` (warm). Never pure `#000000` — see Section 9.
3. **Step 2 (card bg):** Identifiable as a surface distinct from the page. In light mode, cards are typically white (`#FFFFFF`), but this is acceptable because the white card sits against the off-white page background. The contrast between `#FFFFFF` card and `#FBFCFD` page is sufficient.
4. **Step 8 (body text):** In light mode, approximately `#3A3D42` (cool) or `#3D3935` (warm). Body text should not be pure dark — it should feel like ink on paper, softened slightly.
5. Fill remaining steps by interpolating perceptually. Test at each step: can you clearly distinguish step N from step N+1 on a calibrated display? If two adjacent steps look identical, one is unnecessary.

---

## 3. Accent Strategy

### 3.1 One Accent, No Exceptions

A project has exactly one accent color. This is the hardest rule in color strategy and the most frequently broken. The accent is the brand's chromatic identity. Two accents create ambiguity — the user cannot tell which color signals "primary action" and which signals "secondary action." Three accents is chaos.

### 3.2 Where the Accent Appears

**Mandatory appearances:**
- Primary button backgrounds (solid fills)
- Primary button hover states (10–15% darker than base)
- Focus rings on interactive elements (`box-shadow: 0 0 0 3px accent/30`)
- Active navigation indicators (left border, underline, or background tint)
- Text links within body copy
- Selected/checked states (radio buttons, checkboxes, toggle switches, selected list items)
- Progress indicators and loading bars
- Brand logo or wordmark (if monochrome is not specified)

**Optional appearances (use sparingly):**
- Section accent bars (thin 3–4 px top border on cards denoting featured content)
- Hover backgrounds on interactive rows (10% opacity accent tint)
- Data visualization accent (single series in a chart; multi-series charts use semantic colors)
- Notification badges (small, contained)

### 3.3 Where the Accent NEVER Appears

This list is enforced absolutely:

- **Decorative backgrounds:** Never fill a section background with the accent color. Accent backgrounds steal attention from content and burn the user's retina.
- **Dividers and borders:** Never use the accent color for structural dividers. Dividers are neutral infrastructure, not branding opportunities.
- **Body text:** Never set paragraphs in the accent color. Body text is neutral. The accent is for interactive guidance, not reading.
- **Headings (general):** Never set standard page headings in the accent. Headings are neutral hierarchy. Exception: a hero headline may use the accent if it is the single focal point of a marketing page, and only at display sizes (40 px+).
- **Icons (general):** Never fill every icon with the accent. Icons are neutral unless they are interactive and currently selected. An icon grid where every icon is the accent color looks like a unicorn sneezed on the screen.
- **Disabled states:** Never use the accent color for disabled buttons or controls. Disabled states are gray, receding into the background.
- **Error states:** Never use the accent for error messaging. Errors have their own semantic color — danger red.

### 3.4 Accent Appearance Frequency

Count accent occurrences on every screen. The count must be 3–7. Below 3: the product is colorless and the brand is absent. Above 7: the product is garish and the accent loses meaning.

A single primary button (1), an active nav item (1), a focus ring (1), and three links in body text (3) = 7. Acceptable for a content page.

A primary button (1), an active nav item (1), and a selected filter chip (1) = 3. Acceptable for a data view.

### 3.5 The 9-Step Accent Scale

Like neutrals, accents need a scale for hover, active, and muted states.

| Step | Role | Lightness shift (from base) |
|------|------|----------------------------|
| 50 | Subtle background tint (selected rows, badges) | 90% lighter than base, 10% base saturation |
| 100 | Light background tint (hover states on light bg) | 80% lighter, 20% saturation |
| 200 | Muted tint (disabled accent buttons, subtle indicators) | 60% lighter, 40% saturation |
| 300 | Light accent (secondary accent elements) | 35% lighter, 70% saturation |
| 400 | Lighter base (hover on white bg buttons) | 15% lighter, 90% saturation |
| 500 | **Base accent** — primary buttons, links, focus rings | 100% base |
| 600 | Darker base (hover on solid accent buttons) | 15% darker, 95% saturation |
| 700 | Deep accent (pressed states, active) | 30% darker, 90% saturation |
| 800 | Dark accent (text on accent backgrounds) | 50% darker, 80% saturation |
| 900 | Deepest accent (reserved for dark mode accent) | 65% darker, 60% saturation |

The base accent (500) must pass 4.5:1 contrast against white background for text usage (if the accent is used for link text). If it does not pass, the accent is too light for text-links — use it only for solid button backgrounds and push link text to a darker step (600 or 700).

---

## 4. Accent Personality Guide

The accent color communicates personality before the user reads a word. Select it deliberately.

### 4.1 Fintech / Banking / Finance

**Deep Teal** (`#0D9488` base, shifted slightly darker for authority): Signals stability, growth, trust. Teal sits between blue (trust) and green (money), making it the unambiguous color of financial services. Shift toward green for wealth management, toward blue for banking.

**Navy** (`#1E3A5F` adjusted to brand saturation): Traditional, established, institutional. Signals "we have been here for 100 years." Use for institutional banking, insurance, wealth management. Too dark? Shift to a slightly brighter slate-blue.

**Sage Green** (`#4A7C59` base): Modern, ethical, sustainable. Signals ESG investing, green finance, ethical banking. Softer and more approachable than traditional finance blues.

Anti-slop for fintech: Never use gold/yellow as a primary accent. It reads as cheap, not valuable. Gold is for secondary decorative elements, never for the primary CTA color.

### 4.2 SaaS / B2B / Productivity

**Slate-Indigo** (`#4F5BD5` shifted darker and desaturated from Tailwind indigo): Professional, capable, focused. The iconic SaaS accent — Stripe, Linear, and Notion all exist in this chromatic neighborhood. The key is to avoid Tailwind default indigo (`#4F46E5`) — push 5-10 points darker and slightly toward blue or violet for distinction.

**Plum** (`#7C3AED` shifted darker): Creative SaaS, design tools, collaboration platforms. More distinctive than indigo, less corporate. Works well for products that compete on design quality.

**Deep Cyan** (`#0891B2` base): Technical SaaS, developer platforms, API products. Clean, precise, engineering-forward. Pairs exceptionally well with cool-gray neutrals.

### 4.3 Creative Tools / Design / Media

**Bright Coral** (`#FF6B6B` base, possibly shifted slightly warmer): Energetic, creative, bold. The signature color of Figma-adjacent creative tools. Works because it is warm, human, and unmistakable against neutral backgrounds.

**Electric Blue** (`#2563EB` shifted slightly brighter): Digital-native, creative, modern. Works for platforms whose product is creativity itself (asset libraries, creative marketplaces). Must be bright enough to feel energetic, not corporate.

**Lime Green** (`#84CC16` shifted toward chartreuse): Disruptive, unconventional, confident. Use when the product's value proposition is "we do things differently." High risk, high reward — lime is polarizing.

### 4.4 Wellness / Health / Mindfulness

**Soft Green** (`#4ADE80` desaturated 20%): Healing, growth, nature. The universal health color. Avoid pure emerald — it reads as financial. Shift toward sage or mint for wellness-specific connotations.

**Lavender** (`#A78BFA` shifted lighter and softer): Calming, spiritual, mindful. Works for meditation apps, mental health platforms, and sleep products. Must be distinctly lavender (blue-violet), not purple (red-violet), which reads as royal/luxury.

**Warm Peach** (`#FB923C` shifted toward pink-coral): Nurturing, gentle, human. Works for women's health, fertility, and care-giving platforms. The warmth is approachable without being infantilizing.

### 4.5 Consumer / Social / Community

**Vibrant Orange** (`#F97316` saturated): Energetic, friendly, attention-grabbing. The color of social engagement. Works for community platforms, event apps, and social products targeting younger demographics.

**Magenta** (`#EC4899` saturated): Bold, expressive, unapologetic. Works for creator platforms, social audio, and community products aimed at creative demographics. Polarizing but memorable.

**Warm Amber** (`#F59E0B` shifted toward gold): Premium, warm, inviting. Works for marketplace platforms, hospitality booking, and premium consumer services. Must be distinctly amber (yellow-orange), not yellow (cheap) or orange (aggressive).

---

## 5. Semantic Color Construction

Semantic colors communicate system state. They are not decorative and never appear without meaning.

### 5.1 The Four Semantic Hues

Each semantic color requires three variants: a surface tint (background), a border, and text.

**Success (Green):**
- Surface tint: 10% opacity green, used for success banners and confirmed-state backgrounds
- Border: 30% opacity green, used for success-outlined badges and input borders on valid fields
- Text: 100% opacity green, used for success messages and confirmed-status text — must pass 4.5:1 on white
- Base hue: Green in the `#16A34A` to `#15803D` range (avoid `#22C55E` — too bright, fails contrast for text)
- Example system: Surface `#DCFCE7`, Border `#86EFAC`, Text `#166534`

**Warning (Amber/Orange):**
- Surface tint: 10% opacity amber, used for warning banners and caution backgrounds
- Border: 30% opacity amber, used for warning badges
- Text: 100% opacity amber-orange, used for warning messages — must pass 4.5:1 on white
- Base hue: Amber in the `#D97706` to `#B45309` range (avoid `#F59E0B` — too light for text)
- Example system: Surface `#FEF3C7`, Border `#FCD34D`, Text `#92400E`

**Danger (Red):**
- Surface tint: 10% opacity red, used for error banners, destructive action confirmations
- Border: 30% opacity red, used for error-outlined inputs and destructive badges
- Text: 100% opacity red, used for error messages — must pass 4.5:1 on white
- Base hue: Red in the `#DC2626` to `#B91C1C` range (avoid `#EF4444` — too bright, fails contrast)
- Example system: Surface `#FEE2E2`, Border `#FCA5A5`, Text `#991B1B`

**Info (Blue):**
- Surface tint: 10% opacity blue, used for info banners and tooltip backgrounds
- Border: 30% opacity blue, used for info badges
- Text: 100% opacity blue, used for info messages — must pass 4.5:1 on white
- Base hue: Blue in the `#2563EB` to `#1D4ED8` range (avoid `#3B82F6` — Tailwind default, too bright)
- Example system: Surface `#DBEAFE`, Border `#93C5FD`, Text `#1E40AF`

### 5.2 Semantic Color Rules

- Semantic colors appear only as backgrounds, borders, or text — never as solid button fills (except destructive actions, which use danger red).
- Semantic colors never overlap: a success banner does not contain a warning badge. The most severe semantic state wins.
- Semantic colors recede when inactive: disabled buttons do not carry semantic color — they drop to neutral-300.

---

## 6. Color Ratio Rules

### 6.1 Accent Frequency

The accent color must appear 3–7 times per screen. This is not a suggestion — it is a structural constraint enforced by audit.

**Counting method:** Count every visually distinct accent occurrence. A solid button = 1. A text link = 1. An active nav indicator = 1. A focus ring (visible) = 1. A selected checkbox = 1. A progress bar = 1. A notification badge = 1. Multiple links in the same paragraph count individually if they are visually distinct (separated by body text).

**Under 3:** Add accent where appropriate — consider whether primary actions exist, whether the active navigation state is visible, whether links are distinguishable.

**Over 7:** Reduce accent — convert some accent elements to neutral. Links in secondary content may become underlined neutral text. Decorative accent elements (colored icons, accent dividers) must be removed.

### 6.2 Semantic Color Frequency

Semantic colors must appear on fewer than 5% of screens at any time, because their presence means something is wrong, changing, or needs attention. If every screen shows a warning banner, something is broken in the product, not the design. Semantic colors on screen trigger cognitive load — the user's brain enters "what happened?" mode.

### 6.3 Neutral Dominance Confirmation

Open any screen in grayscale mode (browser DevTools rendering option). If the screen is still fully navigable and all hierarchy is clear, the color strategy is correct. If any interactive or informational element depends on color to be understood (e.g., "click the blue button" with no other signifier), the design fails.

---

## 7. Light Mode and Dark Mode Token Pairing

### 7.1 Background Inversion

| Light Mode Token | Dark Mode Token | Hex Direction |
|-----------------|-----------------|---------------|
| `bg` (step 0, near-white) | `bg-dark` (step 0, near-black) | Flip: `#FBFCFD` → `#0D0E10` |
| `bg-muted` (step 1) | `bg-muted-dark` (step 1) | Flip: `#F1F3F5` → `#141619` |
| `bg-card` (step 2, usually white) | `bg-card-dark` (step 2) | Darkened: `#FFFFFF` → `#1A1C1F` |

### 7.2 Text Inversion

| Light Mode Token | Dark Mode Token | Hex Direction |
|-----------------|-----------------|---------------|
| `text-body` (step 8) | `text-body-dark` (step 8 from dark end) | Flip: `#3A3D42` → `#D1D5DB` |
| `text-secondary` (step 7) | `text-secondary-dark` (step 7 from dark end) | Flip: `#646B73` → `#9CA3AF` |
| `text-heading` (step 10) | `text-heading-dark` (step 10 from dark end) | Flip: `#141619` → `#F9FAFB` |

### 7.3 Accent Lightening

The accent color that passes 4.5:1 on white will typically fail on dark backgrounds because it is too dark to contrast against near-black.

**Rule:** Lighten the accent by 2–3 steps on the accent scale for dark mode. If the base accent is step 500, dark mode uses step 300 or 400. The accent must feel like the same color, just brighter. Test: show a user both modes and ask if the accent is "the same blue" — if they hesitate, the lightening is too aggressive or not aggressive enough.

---

## 8. WCAG AA Contrast Requirements

### 8.1 The Standards

- **Body text (below 18 px, or below 14 pt bold):** 4.5:1 minimum contrast ratio against background
- **Large text (18 px+ or 14 pt+ bold):** 3:1 minimum contrast ratio against background
- **UI components and graphical objects:** 3:1 minimum (for boundaries that convey meaning — input borders, icon shapes)

### 8.2 Passing Examples (Light Mode, White Background)

| Text Color | Background | Ratio | Pass/Fail |
|-----------|------------|-------|-----------|
| `#3A3D42` (cool body text) | `#FFFFFF` (white card) | 7.2:1 | Pass AAA |
| `#646B73` (secondary text) | `#FFFFFF` | 5.1:1 | Pass AA |
| `#868D95` (disabled text) | `#FFFFFF` | 3.2:1 | Fail AA — too light for body. Acceptable for disabled/placeholder only. |
| `#4F5BD5` (accent link text) | `#FFFFFF` | 4.6:1 | Pass AA (barely — do not go lighter) |
| `#166534` (success text) | `#FFFFFF` | 10.2:1 | Pass AAA |
| `#0D9488` (teal accent button text) | `#FFFFFF` | 4.5:1 | Pass AA (barely) |

### 8.3 Failing Examples (Light Mode, White Background)

| Text Color | Background | Ratio | Problem |
|-----------|------------|-------|---------|
| `#9CA3AF` (light gray) | `#FFFFFF` | 2.8:1 | Fails AA for any text. Too light. |
| `#F59E0B` (amber) | `#FFFFFF` | 2.1:1 | Fails AA by a mile. Amber text on white is invisible. |
| `#3B82F6` (Tailwind blue links) | `#FFFFFF` | 4.0:1 | Fails AA for body text (below 18 px). Use darker blue. |
| `#A78BFA` (Tailwind purple) | `#FFFFFF` | 2.6:1 | Fails AA. Light purple is decorative, never informational. |
| `#22C55E` (bright green) | `#FFFFFF` | 3.5:1 | Fails AA for body text. Passes for large text only (18 px+). |

### 8.4 Dark Mode Specifics

| Text Color | Background | Ratio | Pass/Fail |
|-----------|------------|-------|-----------|
| `#D1D5DB` (body text) | `#0D0E10` (dark bg) | 9.8:1 | Pass AAA |
| `#9CA3AF` (secondary) | `#0D0E10` | 5.6:1 | Pass AA |
| `#6B7280` (disabled) | `#0D0E10` | 3.1:1 | Borderline — careful |
| `#818CF8` (accent) | `#0D0E10` | 4.7:1 | Pass AA |

---

## 9. Anti-Slop — Forbidden Colors

Picasso must never use these specific hex values or their near-equivalents. These are the "template defaults" that signal zero design effort.

### 9.1 The Forbidden Triangle

- **NEVER `#3B82F6` (Tailwind blue-500):** This is the default blue of every unconfigured Tailwind project. It says "I installed Tailwind and stopped thinking." Use `#2563EB` (blue-600), `#1D4ED8` (blue-700), or generate a custom blue that is not on the Tailwind default palette.

- **NEVER `#4F46E5` (Tailwind indigo-600):** The default indigo of every Vercel template. It says "I used `create-next-app` and changed nothing." Use `#4338CA` (indigo-700), `#3730A3` (indigo-800), or shift 10 points toward violet or blue for distinction.

- **NEVER `#A78BFA` (Tailwind purple-400):** The default decorative purple. It is simultaneously too light to be useful (fails contrast for text) and too saturated to be neutral. It says "I wanted a 'creative' color but didn't think about legibility."

### 9.2 Pure Black and Pure White

- **NEVER `#000000`:** Pure black does not exist in the natural world. It creates maximum contrast with everything, which is visually aggressive and fatiguing. Use the darkest step of the neutral scale (near-black with undertone: `#141619`, `#0D0E10`, `#171513`).

- **NEVER `#FFFFFF` as page background:** Pure white page backgrounds cause glare, especially on bright displays. Off-white with undertone (`#FBFCFD`, `#FBFAF8`, `#FAF9F7`) reduces eye strain and adds a microscopic warmth that users feel but don't notice. Exception: `#FFFFFF` is acceptable for cards, modals, and elevated surfaces that need to separate from an off-white page background. The contrast between `#FFFFFF` card and `#FBFCFD` page is the mechanism that creates surface hierarchy.

### 9.3 Overly Saturated Primaries

- **NEVER pure red `#FF0000`:** Use danger-red from the semantic scale. Pure red is the browser's default error color and reads as unstyled.
- **NEVER pure green `#00FF00`:** Use success-green from the semantic scale. Pure green is the terminal's default success color and reads as unstyled.
- **NEVER pure blue `#0000FF`:** This is the default hyperlink color from 1995. It signals "this page has no CSS."

---

## 10. Gradient Rules

### 10.1 Tonal Washes — Allowed

A tonal wash is a gradient where both stops are the same hue, varying only in lightness. These are acceptable as section backgrounds, hero accents, and card treatments.

**Allowed:** `background: linear-gradient(135deg, #E0E7FF, #C7D2FE)` — both stops are indigo tones, varying in lightness. The effect is a subtle light wash that adds depth without calling attention to itself.

**Allowed:** `background: linear-gradient(180deg, #F0FDF4, #DCFCE7)` — both stops are green tones. A subtle green wash for a success section.

### 10.2 Direction Gradients — Forbidden

A direction gradient is one where the stops are different hues. These are unacceptable in product UI.

**Forbidden:** `linear-gradient(135deg, #3B82F6, #8B5CF6)` — blue to purple. This is the gradient of every Gradient Button Dribbble shot from 2018.

**Forbidden:** `linear-gradient(90deg, #F97316, #EF4444)` — orange to red. Looks like a sunset. A product is not a sunset.

### 10.3 Rainbow Gradients — Forbidden

**Forbidden:** Any gradient with 3+ hue stops. `linear-gradient(135deg, red, yellow, green, blue, purple)` — this should never appear in product design. It is acceptable only in deliberately psychedelic brand identities (music festivals, edgy streetwear), and even then, it is almost certainly the wrong choice.

### 10.4 Gradient Usage Locations

Acceptable locations for tonal washes:
- Hero section backgrounds (marketing pages only, not product UI)
- Feature card backgrounds (when alternating with plain white cards)
- Pricing tier highlights (the "recommended" tier may have a subtle accent wash)
- Empty state illustrations (as background shapes, never as foreground elements)

Unacceptable locations for any gradient:
- Button backgrounds (solid colors only — gradients on buttons reduce legibility of the button text)
- Form inputs
- Navigation bars
- Body text (text gradients are illegible and technically inaccessible)
- Modal backdrops

---

## 11. Color Psychology Quick Reference

Use this table when the product niche influences accent selection:

| Product Niche | Primary Accent | Rationale |
|--------------|---------------|-----------|
| Banking / Finance | Deep Teal, Navy | Stability, trust, institutional weight |
| Fintech / Neobank | Vibrant Coral, Warm Amber | Modern, approachable, disrupts traditional finance |
| Healthcare | Soft Green, Calm Blue | Healing, trust, cleanliness, clinical safety |
| Mental Health | Lavender, Soft Green | Calming, non-clinical, warm |
| Education / EdTech | Warm Orange, Soft Green | Energetic, growth-oriented, optimistic |
| Developer Tools | Slate-Indigo, Deep Cyan | Technical, precise, neutral enough for code context |
| Creative Tools | Coral, Electric Blue, Lime | Energetic, inspiring, distinctive |
| Ecommerce / Retail | Warm Amber, Deep Teal | Premium without luxury intimidation |
| Social Media | Vibrant Orange, Magenta | Energetic, engaging, attention-grabbing |
| Enterprise SaaS | Slate-Indigo, Navy | Professional, serious, trustworthy |
| Gaming | Electric Blue, Magenta, Lime | Immersive, high-energy, distinctive |
| Food & Beverage | Warm Orange, Sage Green, Warm Amber | Appetite-stimulating (warm tones), fresh (green) |
| Real Estate | Deep Teal, Navy | Trust, investment security |
| Non-Profit | Sage Green, Warm Amber | Earth-conscious, trustworthy, warm |
| Legal / Compliance | Navy, Deep Teal | Authority, tradition, trust |

---

## 12. Building Scales — Step-by-Step

### 12.1 Building a 12-Step Neutral Scale

1. **Choose undertone:** Cool-gray or warm-gray based on product personality (Section 2.1).
2. **Set step 0 (page bg):** Perceptually near-white with undertone. Target L* (CIELAB lightness) ≈ 98.
3. **Set step 11 (near-black):** Perceptually near-black with undertone. Target L* ≈ 8–12.
4. **Set step 2 (card bg):** Pure white (`#FFFFFF`) or equivalent in dark mode.
5. **Set step 8 (body text):** In light mode, L* ≈ 28–35. This is dark gray, not black.
6. **Fill steps 3–7 and 9–10:** Evenly distribute perceptually between the anchors. Use CIELAB or OKLCH interpolation, not RGB linear interpolation (which produces uneven steps perceptually).
7. **Test adjacency:** Each pair of adjacent steps must be distinguishable at a glance. If steps 6 and 7 look identical on a standard display, merge them and redistribute.
8. **Dark mode inversion:** Invert the scale. Step 0 light becomes step 11 dark. Step 11 light becomes step 0 dark. Adjust middle steps for the different perception of lightness on dark backgrounds (dark mode needs slightly more contrast between surfaces than light mode).

### 12.2 Building a 9-Step Accent Scale

1. **Choose the base hue:** Select the accent hue based on personality guide (Section 4).
2. **Set step 500 (base):** The accent at full saturation, tuned to pass 4.5:1 contrast on white for text use, or adjusted slightly lighter if used only for solid button backgrounds.
3. **Generate lighter steps (50–400):** Reduce saturation and increase lightness simultaneously. Step 50 should be nearly imperceptible as the accent — just a tint that warms a neutral background.
4. **Generate darker steps (600–900):** Reduce lightness while preserving saturation. Step 900 approaches near-black while retaining the hue identity. Dark accent steps are used for text-on-accent contrast and dark mode accents.
5. **Test the full scale:** Every step must look like the same color at a different intensity. If step 300 looks like a different hue from step 500, the saturation/lightness curve needs adjustment.
6. **Contrast check:** Steps 50–200 must provide enough contrast for text when used as backgrounds. Steps 600–900 must provide enough contrast for white text when used as solid backgrounds. Step 500 must pass 4.5:1 on white for text-link usage.

---

## 13. Implementation Checklist

Before considering a color strategy complete, verify:

- [ ] Neutral scale has exactly 12 steps with consistent undertone (cool or warm, not mixed)
- [ ] 80%+ of screen surface area is neutral tones (verify by squinting: accent should be barely visible)
- [ ] Exactly one accent color selected (no secondary accents, no "brand palette" with multiple hues)
- [ ] Accent appears 3–7 times per screen (count manually on every screen)
- [ ] Accent never appears in: decorative backgrounds, dividers, body text, error states
- [ ] Semantic colors (success, warning, danger, info) each have surface/border/text variants
- [ ] All body text passes 4.5:1 contrast against its background
- [ ] All large text passes 3:1 contrast
- [ ] No forbidden colors: no `#3B82F6`, `#4F46E5`, `#A78BFA`, `#000000` page bg, `#FFFFFF` page bg
- [ ] No direction gradients (blue-to-purple, orange-to-red)
- [ ] No rainbow gradients (3+ hue stops)
- [ ] Dark mode tokens defined with accent lightened by 2–3 steps
- [ ] Screen is fully functional in grayscale rendering mode
- [ ] Semantic colors appear only when their meaning is active (no decorative green checkmarks)

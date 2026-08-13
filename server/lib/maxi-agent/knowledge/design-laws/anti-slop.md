# Anti-Slop Constitution — Picasso Design Law §5.4

This document is the complete anti-slop rule set for Picasso. It integrates Pastel's existing ANTI_SLOP rules (§5.1 supplement) and the new Picasso V2 anti-slop rules. **Every rule herein is non-negotiable.** Output that violates any rule is rejected. This constitution is enforced before any other design evaluation.

---

## TYPOGRAPHY ANTI-SLOP

### Forbidden Fonts

The following fonts are **banned** as display (heading) fonts. Any screen using them as a primary display face is rejected:

| Banned Font              | Why It's Banned                                              |
|--------------------------|--------------------------------------------------------------|
| Inter                    | Overused. Every AI-generated UI defaults to Inter. It signals "no-design." |
| Roboto                   | Android default. Ubiquitous, characterless.                  |
| system-ui / -apple-system| Browser default. The designer abdicated font choice.         |
| Arial                    | Helvetica's bland cousin. Defaults to "I didn't pick a font."|
| Helvetica                | Better than Arial, but still a default that signals laziness.|
| Times New Roman          | Browser default serif. Inappropriate for UI.                 |

**ALWAYS use a distinctive display font.** A distinctive font is one of the strongest signals of design intentionality. The display font should be visually memorable — a user should be able to recognize the product by its type alone.

### Required Distinctive Fonts

Picasso must select from (or equivalent to) this set for display type. These are not the only options, but they establish the expected bar for distinctiveness:

| Font               | Character                                               | Best For                          |
|--------------------|---------------------------------------------------------|-----------------------------------|
| DM Sans            | Geometric, clean, modern. Slightly condensed.           | SaaS, dashboards, general apps    |
| Geist              | Vercel's brand font. Sharp, technical, opinionated.     | Developer tools, technical products |
| Cabinet Grotesk    | Bold, playful grotesque. High x-height, friendly.       | Consumer apps, social, branding   |
| Sora               | Elegant geometric. Used by Linear for inspiration.      | Premium SaaS, design-forward tools |
| Clash Display      | Punchy, editorial display face. Strong personality.     | Landing pages, marketing, branding |
| Fredoka            | Rounded, soft, approachable. Child-friendly.            | Education, health, wellness       |
| Switzer            | Neo-grotesque. Clean, neutral but distinctive.          | General purpose, professional     |
| Satoshi            | Modern geometric sans. Sharp terminals.                 | SaaS, fintech, modern products    |
| Manrope            | Modern geometric. Open apertures, highly legible.       | Documentation, reading-heavy apps |

**Body font complement:** If the display font works well at 14–16 px, it may also serve as the body font (single-family project). If the display font is too stylized for body text (Clash Display, Fredoka), pair it with a clean workhorse: DM Sans, Inter (body only! not display), or Switzer for body text. Max 2 type families per project total.

### Typography Hard Rules

1. **NEVER more than 2 font families per project.** One display + one body, or one family for both. Three or more = slop.

2. **NEVER bold entire paragraphs or sentences.** Bold is for keywords, labels, and UI emphasis. At most 2 short bolded keywords per paragraph. An entire bold paragraph reads as screaming.

3. **NEVER all-caps body copy.** All-caps is for badges, labels, and short UI elements (max 3 words). All-caps body text is unreadable and aggressive. Even headings should avoid all-caps unless it's a deliberate brand choice for a single-word heading.

4. **NEVER underline headings.** Underlines on headings read as hyperlinks. Use weight, size, and color to differentiate heading levels. Underlines are reserved for text links only.

5. **NEVER font sizes below 12 px.** 12 px is the absolute floor, and only for captions, legal text, and metadata. Body copy min is 16 px. UI labels may be 13–14 px. Never 10 px or 11 px text — it fails accessibility and looks like a mistake.

6. **NEVER variable line lengths across the same content type.** If one paragraph in a section is 65 characters wide, all paragraphs in that section must be 65 characters wide. Inconsistent line lengths break the reading rhythm and look accidental.

7. **NEVER body copy weight below 400 or above 500.** Body text weight 400. Emphasis within body: weight 500 or 600 (not both — pick one emphasis weight and stick to it). Headings: weight 600 or 700. UI labels: weight 500.

8. **NEVER justify body text** on screen (left-align only). Justified text creates rivers of white space and is for print, not screens. Exception: documentation with hyphenation support may use left-align with rag.

9. **NEVER use more than one modular type scale per project.** Pick Scale A, B, or C (see megadesign §4.2) and use it everywhere. Don't mix scales — it produces fractional font sizes that look inconsistent.

10. **NEVER italic body text** as the default body style. Italic is for emphasis, quotes, and metadata only. An entire paragraph of italic is hard to read.

---

## COLOR ANTI-SLOP

### Forbidden Colors

The following hex values are **banned as primary accent colors.** Any screen using them as the dominant accent is rejected:

| Banned Hex     | Tailwind Token     | Why It's Banned                                        |
|----------------|--------------------|--------------------------------------------------------|
| `#3B82F6`      | blue-500           | Tailwind default blue. Every AI output uses it.        |
| `#4F46E5`      | indigo-600         | Tailwind default indigo. The "I didn't customize" color.|
| `#A78BFA`      | purple-400         | Tailwind default purple. Template-landing-page slop.   |
| `#8B5CF6`      | violet-500         | Same tier as purple-400 — generic "tech" accent.       |
| `#6366F1`      | indigo-500         | Indigo variant — also banned.                          |
| `#EC4899`      | pink-500           | Default "startup pink." Overused in template UIs.      |
| `#000000`      | pure black         | Pure black does not exist in the physical world. Use neutral-950. |
| `#FFFFFF`      | pure white         | Pure white creates harsh contrast. Use neutral-50 for backgrounds. |

**ALWAYS use a distinctive accent color.** The accent is the most recognizable color signal in the interface. It must feel intentional and specific to the product.

### Required Distinctive Accents

| Accent            | Hex Example    | Character                                              | Best For                          |
|-------------------|----------------|--------------------------------------------------------|-----------------------------------|
| Deep teal         | `#0D9488`      | Calm, trustworthy, healthcare-adjacent                 | Fintech, health, enterprise       |
| Warm amber        | `#D97706`      | Energetic, warm, human                                 | Creative tools, social, education |
| Rich burgundy     | `#BE123C`      | Bold, sophisticated, editorial                         | Media, publishing, luxury         |
| Muted olive       | `#65A30D`      | Natural, grounded, organic                             | Sustainability, wellness, food    |
| Rust              | `#C2410C`      | Earthy, warm, distinctive                              | Outdoor, crafts, artisans         |
| Plum              | `#7E22CE`      | Premium, creative, unexpected                          | Design tools, creative platforms  |
| Sage              | `#84CC16`      | Fresh, calm, health-oriented                           | Health, wellness, gardening       |
| Warm green (deep) | `#15803D`      | Growth, prosperity, stable                             | Finance, education, analytics     |

### Color Hard Rules

1. **NEVER pure black `#000000` or pure white `#FFFFFF`.** Use `neutral-950` (`#0A0A0B` or similar near-black) and `neutral-50` (`#FAFAFA` or similar warm off-white). Pure black is unnatural. Pure white is harsh. Neither appears in mature design systems.

2. **NEVER gradient backgrounds on cards or sections.** A gradient background on a card or content section is a cheap attempt to create visual interest. Use solid neutrals, tonal washes, or subtle texture. Gradient backgrounds are permitted ONLY for: (a) hero sections on marketing pages, (b) brand-specific expressive moments, (c) decorative accent bands used sparingly. Otherwise: flat color.

3. **NEVER rainbow or blue-to-purple gradients.** Blue-to-purple (`blue-500 → purple-600`, `indigo → violet`) is the universal signal of template-generated design. Even if the brand uses a gradient as its visual identity, it must be a specific, intentional color pair — never the default blue-purple rainbow. Any blue-to-purple gradient = instant rejection.

4. **NEVER accent color as background wash or divider.** The accent color appears 3–7 times per screen maximum: primary CTA, focus rings, active states, links, selected items, one brand decorative element. If the accent is the background of a section, a divider line, or a decorative shape, it's diluted and meaning collapses. Accent is a signal, not a paint bucket.

5. **NEVER more than 1 accent color per project.** One accent. One hue family. Variants within that family (lighter/darker) are fine. But do not have a teal accent for buttons and an amber accent for links. Pick one. If the product genuinely needs a secondary accent (e.g., a marketplace with buyers and sellers as separate colors), that's two accents maximum and must be justified in the design spec.

6. **NEVER use green for non-success CTAs.** Green means success, confirmation, growth. If the product accent is green, that's fine — but then success states need a different treatment (e.g., a checkmark icon, a different green shade, or a border change). Green for a "Create" button when the accent is teal = confusing.

7. **NEVER use red for non-destructive actions.** Red means danger, deletion, error. Never make a "Save" or "Submit" button red. Never use red as a decorative color.

8. **NEVER rely on color alone to communicate information.** Red/green status indicators must include an icon or text label. Every color distinction must have a non-color backup for color-blind users and screen readers.

9. **NEVER more than one neutral palette undertone.** Pick cool-gray or warm-gray at project start. All neutrals (backgrounds, borders, text, surfaces) derive from that single palette. Mixing cool and warm grays produces visual disharmony.

10. **NEVER use opacity to create color variants instead of proper tokens.** `bg-accent/10` is lazy. Define `accent-50`, `accent-100`, `accent-200` etc. as real color tokens. Opacity over varying backgrounds produces unpredictable colors.

---

## LAYOUT ANTI-SLOP

### Forbidden Layout Patterns

1. **NEVER centered hero on app screens.** A hero section (large centered heading + centered CTA + large illustration) is for marketing pages. App screens are functional surfaces. The "home screen" of an app is a dashboard, a workspace, a feed, or an inbox — not a hero section. If Picasso generates an app screen with a text-center hero, the output is rejected.

2. **NEVER footer on app screens (desktop).** Footers are for marketing pages (links, legal, social proof) and mobile web views. Desktop app screens do not have footers. The bottom of the screen is content that scrolls, not a static footer bar. Exception: a minimal status bar (last synced, connection status) is acceptable at 32 px height, but it must not contain nav links or marketing content.

3. **NEVER tabbar on desktop screens.** Bottom tab bars are for mobile (<768 px) only. On desktop, use sidebar, topbar, or header tabs. A tabbar on a 1440 px desktop screen is a mobile-first design that was never adapted — instant rejection.

4. **NEVER full-width content without max-width container.** Content that stretches to the viewport edge on a wide monitor is unreadable. Every content block must sit inside a max-width container (1280 px default, 1440 px for dashboards). The only exceptions: (a) data tables that genuinely need the width, (b) deliberate full-bleed accent bands or hero visuals where the content inside is still max-width constrained.

5. **NEVER uniform section heights.** If every section on a page has the same vertical height, the page looks like it was filled by a template, not composed by a designer. Vary section heights intentionally. A hero at 560 px, features at 400 px, testimonials at 320 px, CTA at 280 px = rhythm. All at 400 px = template.

6. **NEVER center-aligned body text over 3 lines.** One or two centered lines (headings, taglines, CTAs) is fine. Three or more centered lines is harder to read than left-aligned text. The eye loses its anchor. Left-align all body copy. Exception: empty states, CTAs, and pull quotes.

7. **NEVER overflow hidden without scroll affordance.** If content is clipped, there must be a visible indicator. A fade gradient at the clipped edge, a scrollbar, a "Show more" button, or a horizontal scroll indicator. Hidden overflow with no affordance traps content and makes users think the product is broken.

8. **NEVER "floating" layouts with excessive negative space.** A screen with one small component floating in the center of a vast white void is not minimalism — it's an incomplete layout. Content should fill the available space. Empty states are the exception, but even empty states have a full visual composition (illustration + heading + description + CTA).

9. **NEVER absolute positioning for primary layout.** Use CSS Grid and Flexbox for layout. Absolute positioning is for tooltips, dropdowns, modals, and small UI overlays. If the main content area uses `position: absolute`, the layout is fragile and will break.

10. **NEVER `z-index` above 50.** Use the z-index scale: 0 (default), 10 (dropdowns, sticky headers), 20 (modals, drawers), 30 (toasts, notifications), 40 (tooltips), 50 (debug/override only). If you need `z-index: 9999`, you have a stacking context problem, not a z-index problem.

### Layout Affirmative Rules

- **ALWAYS function-first layout on app screens.** App screens are tools. The layout must prioritize task completion: sidebar for navigation, content area for data, toolbar for actions.
- **ALWAYS max-width container.** 1280 px for general content, 1440 px for dashboards and data-dense views. Centered with `mx-auto`.
- **ALWAYS sidebar for dashboards and workspaces.** Persistent left sidebar with icon+label nav items. The sidebar is the user's orientation anchor in the app.
- **ALWAYS asymmetric interest in marketing layouts.** Alternate wide and narrow sections. A hero with text (7 col) + image (5 col). Then full-width features (4+4+4). Then a single-column testimonial section. Then CTA (centered, narrow). Variation = intentional.
- **ALWAYS generous but intentional padding.** Sections get `py-24` to `py-36` on desktop. Content gets `px-8`. Components get `p-6`. Never cramped, never wasted. Every pixel of padding must serve grouping or breathing room.

---

## COMPONENT ANTI-SLOP

### Forbidden Component Patterns

1. **NEVER testimonial carousels with circular avatars and centered quotes.** The circular-avatar + centered-italic-quote + carousel-dots testimonial pattern is the single most recognizable slop pattern on the web. It appears in every starter template. Instead: (a) use a grid of testimonial cards in rows with left-aligned text, square or rounded-rect avatars, and company logos, (b) use a single featured testimonial with pull-quote styling, or (c) use a logo cloud of customer brands without individual quotes.

2. **NEVER floating geometric blobs, dots, or abstract shapes as decoration.** Floating decorative shapes (circles, blobs, gradient orbs) in the background of a hero section scream "I couldn't think of real content." Replace decorative blobs with: (a) a real product screenshot, (b) real UI elements from the product, (c) nothing — negative space is better than fake decoration.

3. **NEVER "Get started" + "Learn more" default CTA pairs.** The primary/secondary CTA pair "Get started" (accent button) + "Learn more" (ghost/link button) is the default template CTA. It's never been chosen intentionally. If the CTA pair is generic, the whole hero section is generic. Write specific CTAs: "Create free account", "View pricing", "See how it works", "Book a demo", "Start building" — anything but the default pair. EXCEPTION: if the user's prompt explicitly requests those exact labels, use them. But Picasso must never generate them unprompted.

4. **NEVER more than 3 cards per screen (desktop).** A screen with 4, 5, or 6 cards is a grid with no hierarchy. Prefer tables, lists, rows, divided sections, and custom compositions over card grids. Cards are ONE rendering option, not the default. A screen with more than 3 cards must justify each card's existence — if two cards could be a table row, make them table rows.

5. **NEVER identical card grids.** When cards DO appear, they must not all have the same structure: same icon size, same title length, same description pattern, same metadata type. Vary content across the grid. One card might have a chart. Another might have a list. Another might have a single stat. Identical cards = template.

6. **NEVER drop-shadow on non-interactive static content.** Shadows communicate elevation and clickability. If a content panel is not interactive, do not add a drop-shadow. Static cards with shadows confuse users — they look clickable but aren't. Use borders, background fills, or dividers for static content panels.

7. **NEVER disabled buttons without explaining why.** A disabled button must include: (a) a tooltip on hover explaining why it's disabled, (b) helper text nearby, or (c) an inline message below the button. Example: "Complete all required fields to continue." A disabled button with no explanation is a dead end — the user doesn't know what to do next.

8. **NEVER placeholder images without labels.** Every image placeholder must display its intended dimensions and a content description. Format: "800×400 — Hero illustration: person using dashboard visualization." Never show a gray box with just "800×400" and no description. Never show an empty `<img>` tag with `alt=""` and no visible label.

9. **NEVER "John Doe" or "Test User" as persona names.** Persona names must be diverse and realistic. Use names from a broad cross-section of cultures: "Amara Okafor", "Marcus Chen", "Sofia Reyes", "Yuki Tanaka", "Olivia Kowalski", "Ravi Patel", "Fatima Al-Mansour". "John Doe" and "Test User" are slop.

10. **NEVER a modal that opens on page load.** Modals must be triggered by user action (click, keyboard shortcut). A modal that appears the moment a page loads is an interruption, not a design pattern.

### Component Affirmative Rules

- **ALWAYS prefer tables, lists, rows, and custom compositions over card grids.** Cards are ONE option in the surface toolkit, alongside: tonal bands (`bg-muted/50`), divided lists (`border-b` dividers), inset panels (`rounded-xl border bg-card`), and plain surfaces (no wrapper). Vary surface types across sections.
- **ALWAYS provide hover, focus, and active states on every interactive element.** If an element is clickable/focusable and does not have all three states, the component is incomplete.
- **ALWAYS use the component composition taxonomy:** Primitives → Atoms → Molecules → Organisms. Atoms never contain atoms directly. Molecules serve exactly one function. Organisms are reorderable across templates.
- **ALWAYS check the surface type mix on each screen.** A screen with only bordered cards reads as a template. Mix surface types: tonal bands for dominant blocks, divided lists for rows, inset panels sparingly.

---

## CONTENT ANTI-SLOP

### Forbidden Content & Copy

The following phrases are banned from all Picasso-generated content. They are the textual equivalent of Inter + blue-500.

| Banned Phrase                      | Why It's Slop                                              |
|------------------------------------|------------------------------------------------------------|
| "Unlock your potential"            | Generic self-help. Every life-coach app says this.         |
| "Seamless experience"              | Meaningless. What does "seamless" mean functionally?       |
| "Innovative solution"              | Says nothing. Innovation is demonstrated, not claimed.     |
| "Next-generation platform"         | Corporate word salad. Next-gen what?                       |
| "Empowering teams to"              | Every SaaS since 2015 says this. Be specific.              |
| "Revolutionize your workflow"      | Nobody talks like this. Workflows evolve, they don't revolutionize. |
| "Cutting-edge technology"          | Empty. What technology? How is it cutting-edge?            |
| "Leverage the power of"            | AI-generated slop gold. "Use" is shorter and better.       |
| "World-class"                      | Claims world-class without evidence.                       |
| "Best-in-class"                    | Same. Claims superiority without proof.                    |
| "Game-changer" / "Game-changing"   | Hype with no substance.                                    |
| "All-in-one platform"              | Overpromise. Be specific about what's included.            |
| "Streamline your"                  | Bland verb. What does streamlining look like?              |
| "Take [thing] to the next level"   | Vague. Next level = ???                                     |
| "Harness the power of"             | AI slop. "Use" is sufficient.                              |
| "Designed for the modern [noun]"   | The modern what? Modern is not a feature.                  |
| "Robust" (as a standalone adjective) | Robust how? Reliable? Scalable? Be specific.             |
| "Scalable" (without explanation)   | All software claims to scale. How?                         |
| "Enterprise-grade"                 | What makes it enterprise-grade? SOC2? SSO? Say that.       |
| "State-of-the-art"                 | Says nothing. Describe the actual technology or approach.  |

### Content Hard Rules

1. **NEVER sparse data rendering.** Every screen must be populated with meaningful, realistic data. Lists must have at least 4 items. Tables must have at least 4 rows. Dashboards must fill at least 50% of the viewport with content. A table with 1–2 rows and vast empty space below it is incomplete. A dashboard with one stat and white space = instant rejection.

2. **NEVER use placeholder copy that isn't domain-specific.** If designing a project management tool, the placeholder projects should be named things like "Q4 Website Redesign", "Mobile App v2.1", "HR Onboarding Flow", "API Migration". Not "Project 1", "Project 2", "Test Project".

3. **NEVER use lorem ipsum.** Every text string in a Picasso output must be real, domain-appropriate content. Lorem ipsum signals placeholder thinking. If you don't know what the text should say, the design isn't finished.

4. **NEVER use generic labels on UI elements.** Button text "Submit" is better than "Click here". But "Create project", "Send message", "Save changes" is better than "Submit". Be specific about what action the button performs.

5. **NEVER write feature descriptions longer than 2 lines.** A feature description in a card or landing section is 1–2 sentences, 50–100 characters. If you need more, the feature is too complex for a card — use a dedicated section.

6. **NEVER use exclamation marks in UI copy.** "Welcome!" "You're all set!" "Let's go!" — these are marketing copy, not UI copy. UI is calm and professional. Exclamation marks are for celebrations only (onboarding completion, major milestone). Limit to 1 per flow.

7. **NEVER use passive voice in CTAs and instructions.** "The form will be submitted" → "Submit the form." "Changes have been saved" → "Changes saved." Active voice is clearer.

### Content Affirmative Rules

- **ALWAYS specific product copy.** "Track your team's tasks across 12 integrated views" is better than "Powerful project management." Specificity = credibility.
- **ALWAYS action-oriented language.** CTAs describe what happens next: "Start free trial", "View documentation", "Download report", "Add team member." Not "Submit" or "Continue" unless the context makes the action obvious.
- **ALWAYS real data quantities.** "12 views", "47 integrations", "10,000+ teams", "99.9% uptime" — specific numbers. Not "Many integrations" or "Thousands of teams."

---

## NAVIGATION ANTI-SLOP

### Forbidden Navigation Patterns

1. **NEVER bottom navigation (tabbar) on desktop screens.** Tabbar is for mobile only (<768 px viewport width). On desktop, use sidebar (recommended for dashboards/workspaces), topbar (for lightweight apps), or header-tabs (for detail screens).

2. **NEVER footer as primary app navigation on desktop.** A footer with "Home | Settings | Profile | Logout" links at the bottom of an app screen is wrong. Primary navigation belongs at the top (topbar) or left (sidebar). Footer nav on desktop apps = the designer couldn't decide where to put things.

3. **NEVER "Sign in" / "Get started" marketing topbar links on app screens.** Marketing conversion topbars (Logo left, "Sign in" + "Get started" right) are for landing pages. App screens show the authenticated user's avatar, workspace name, or a hamburger menu. If you see "Sign in" on an app screen, the mode is wrong.

4. **NEVER a hamburger menu on desktop app screens.** Hamburger menus hide navigation. On mobile, this is necessary (limited space). On desktop, it's lazy — the navigation should be visible. Use a persistent sidebar or topbar.

5. **NEVER nested drawers or multiple layers of off-screen navigation.** One level of off-screen nav (hamburger drawer on mobile) is acceptable. A drawer that opens another drawer = the information architecture is broken.

6. **NEVER tabbar with more than 5 items.** Mobile tabbar: 3–5 peer destinations. If you have 6+ destinations, use a "More" item (ellipsis or hamburger) that opens a menu.

### Navigation Pattern Decision Tree

```
Is this a MOBILE screen (<768px)?
├── YES: Does it have 3–5 peer destinations?
│   ├── YES: Use BOTTOM TABBAR
│   └── NO: Use TOPBAR with hamburger menu
└── NO (desktop/tablet): What type of product?
    ├── Dashboard / workspace / multi-destination tool:
    │   └── Use SIDEBAR (left, persistent, icon+label)
    ├── Lightweight single-workflow product:
    │   └── Use TOPBAR (horizontal nav, 3–6 links)
    ├── Detail screen (within a larger app):
    │   └── Use CONTEXTUAL HEADER (back button + title + actions)
    ├── Documentation / knowledge base:
    │   └── Use STICKY SIDEBAR (left) + optional TOC (right)
    ├── Landing page / marketing:
    │   └── Use HEADER NAV BAR (logo left, links right, CTA button)
    └── Social / feed / messaging:
        ├── Use SIDEBAR (left, destinations) + optional RIGHT PANEL
        └── OR: TOPBAR + full-width feed (simpler products)
```

### Navigation Affirmative Rules

- **ALWAYS sidebar for dashboards and workspaces.** Persistent, left-positioned, `width: 240–280 px`. Contains: logo/workspace name (top), nav items with icons + labels (middle), user/settings section (bottom). Collapses to hamburger drawer on mobile.
- **ALWAYS topbar for lightweight or single-workflow products.** Horizontal bar, `height: 56–64 px`. Contains: logo (left), nav links (center or left), actions/search/user menu (right). Fixed to top (`sticky top-0`).
- **ALWAYS contextual header for detail screens.** Breadcrumb or back button (left), page title (left or center), primary action buttons (right). Height: 56–64 px. May be sticky or scroll-away depending on content length.
- **ALWAYS highlight the current/active nav item.** The active nav item must be visually distinct: accent background highlight, accent left-border, accent text, or bolder weight. Users must always know where they are in the app.

---

## CONTEXT / MODE ANTI-SLOP

### Context Detection Failures

A fundamental category of slop is applying the wrong product mode patterns to a screen. These are the cardinal sins of context detection:

1. **Marketing hero on an app screen:** The most common and most serious slop. A screen described as a "dashboard" or "workspace" or "primary screen" produces a centered hero with a heading, subheading, and CTA button. This is a landing page, not an app. INSTANT REJECTION.

2. **Footer on a desktop app screen:** A footer with links on a "settings" screen or "dashboard." INSTANT REJECTION.

3. **Tabbar on a desktop app screen:** A bottom tab bar on a 1440 px "workspace." INSTANT REJECTION.

4. **"Sign in" / "Get started" links in the topbar of an app screen:** Marketing conversion links in an authenticated product context. INSTANT REJECTION.

5. **Sparse, centered content on a data-dense product:** A "dashboard" with one welcome message and nothing else. Dashboards are data-dense. INSTANT REJECTION.

6. **A sidebar on a landing page:** App-style persistent navigation on a marketing page. Revise to header nav or none. INSTANT REJECTION.

7. **Empty state as the primary screen content:** The home screen of an app shows an empty state illustration with "Welcome to [App]! Get started by..." — valid only for FIRST USE. If the user has data (and app screens imply they do), this is wrong.

---

## STYLE SEED ANTI-SLOP

Picasso must enforce ONE style seed per project. Mixing style seeds produces incoherent output.

| Style Seed           | Allowed                              | Forbidden                                       |
|----------------------|--------------------------------------|-------------------------------------------------|
| minimal/serious      | Flat color, 2–4 px radius, no shadows, no gradients, left-align | Centered layouts, gradients, thick borders, shadows |
| minimal/warm         | Subtle wash gradients, centered allowed for marketing, soft radius | Dark mode, heavy shadows, sharp corners |
| expressive/serious   | Dark backgrounds, shadows permitted, sharp corners, bold typography | Pill shapes, playful illustrations, rounded everything |
| expressive/warm      | Gradients, pill shapes, thick borders, playful illustrations | Flat design, sharp corners, minimal decoration |
| luxury/minimal       | Dark mode required, no shadows, no gradients, 2px max radius, generous whitespace | Bright colors, shadows, gradients, thick borders, >2px radius |

**Mixing is rejected.** If a project starts as `minimal/serious` and produces a screen with pill-shaped buttons and a gradient hero, it's failed the style seed.

---

## THE 25 RULES OF ANTI-SLOP — QUICK-LOOKUP

Before marking ANY screen complete, verify against all 25. A single violation = rejection.

### Typography (Rules 1–5)
1. Display font is NOT Inter, Roboto, system-ui, Arial, or Helvetica.
2. Maximum 2 font families per project. No 3+.
3. No bold entire paragraphs. No all-caps body copy. No underline on headings.
4. No font sizes below 12 px. Body copy minimum 16 px.
5. No variable line lengths across same content type.

### Color (Rules 6–10)
6. Accent is NOT `#3B82F6`, `#4F46E5`, `#A78BFA`, or other Tailwind defaults.
7. No pure black `#000000` or pure white `#FFFFFF`.
8. No gradient backgrounds on cards or sections. No blue-to-purple gradients.
9. No accent color used as background wash or divider.
10. Maximum 1 accent color per project.

### Layout (Rules 11–15)
11. No centered hero on app screens.
12. No footer on desktop app screens.
13. No tabbar on desktop screens.
14. All content within max-width container (1280/1440 px). No full-width content.
15. No uniform section heights. Vary intentionally.

### Components (Rules 16–20)
16. No testimonial carousels with circular avatars + centered quotes.
17. No floating geometric blobs, dots, or abstract shapes as decoration.
18. No "Get started" + "Learn more" CTA pairs (unless user explicitly requests).
19. Maximum 3 cards per screen. No identical card grids.
20. No disabled buttons without explaining why. No placeholder images without labels.

### Content (Rules 21–23)
21. No banned phrases ("unlock your potential", "seamless experience", "innovative solution", "next-generation platform", "empowering teams", "revolutionize your workflow", "cutting-edge", "leverage the power of").
22. No sparse data rendering. 4+ rows in lists/tables. 50%+ viewport filled on dashboards.
23. No "John Doe" / "Test User" as persona names. No lorem ipsum. No generic UI labels.

### Navigation & Context (Rules 24–25)
24. No tabbar on desktop, no footer as app nav, no "Sign in"/"Get started" on app screens.
25. App mode = functional-first layout. Landing mode = narrative flow. No mode confusion.

---

*This document is §5.4 of the Picasso agent specification. It integrates Pastel ANTI_SLOP v17 and Picasso V2 anti-slop rules. Every output is evaluated against all 25 rules before any other design review. A single violation is grounds for rejection.*

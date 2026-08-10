# Picasso Product Mode: Landing Page

## Mode Definition

**Landing Page** — A marketing website designed to convert visitors into users or customers. The landing page tells a compelling narrative about a product, builds trust through social proof, and drives visitors toward a single, clear call to action. Unlike dashboards or transactional apps, the landing page is read-only; users scroll, absorb, and click — they don't interact with complex UI.

---

## Core Principles

| Principle | Definition |
|---|---|
| Narrative-driven | Every section advances a story. Sections are ordered to build conviction: problem, then solution, then proof, then action |
| One primary CTA | The entire page funnels toward one action: sign up, start trial, book demo, download |
| Scannable | Users skim, they don't read. Headlines must convey value in 2 seconds |
| Social proof | Trust is earned, not claimed. Show logos, testimonials, numbers |
| Visual variety | No two consecutive sections should look identical. Alternate layouts, backgrounds, and visual treatments |
| Performance-first | Absolute minimum load time. Hero text renders first. Above-fold content has no layout shift |

---

## Narrative Flow Structure

The landing page follows a specific narrative arc from top to bottom. Each section has a distinct job.

```
1.  Navigation (sticky topbar)
2.  Hero Section --------,
3.  Social Proof Bar      |  <- Above the fold = must convert
4.  Features/Benefits ----'
5.  How It Works
6.  Testimonials
7.  Pricing (optional)
8.  FAQ (optional)
9.  Final CTA Section
10. Footer
```

---

## 1. Navigation (Topbar)

```
+----------------------------------------------------------+
|  [Logo]     Product  Features  Pricing  Docs     [CTA ->] |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Height | 56-64px desktop, 52-56px mobile |
| Position | Sticky (position: sticky; top: 0). Always visible as user scrolls |
| Background | Transparent or semi-transparent at hero, transitions to solid white (or dark) on scroll. backdrop-filter: blur(8px) for glass effect |
| Border | None at top. Bottom border appears on scroll (1px solid neutral-200) |
| Logo | Left-aligned, 28-36px height (wordmark or icon + name) |
| Nav links | 4-6 links. Center or right-aligned. 14-15px, weight 500. neutral-600 default, neutral-900 hover |
| Active link | accent-500 text color. Only for current page section (not for external pages) |
| CTA button | Right-aligned. accent-500 filled, 36-44px height, 14-15px font. Sign Up, Get Started, Try Free |
| Mobile hamburger | Appears below 768px. Hamburger icon (right) opens full-screen or slide-out menu |

**Navigation background behavior:**

```
At top of page:     [transparent bg, white text if hero is dark]
After scrolling:    [solid white bg, dark text, subtle shadow]
```

### Navigation Anti-Patterns

- **DO NOT** use 8+ nav links. 4-6 maximum. More than 6 overwhelms the user.
- **DO NOT** use dropdown mega-menus. They signal enterprise bloatware. If you have many pages, use a docs-style sidebar on inner pages, not the main nav.
- **DO NOT** include Home in the nav. The logo already links to home.
- **DO NOT** make the CTA button Login. Login is a secondary action, not the primary conversion goal. Use a text link for Sign In.

---

## 2. Hero Section

The hero is the most critical section of the page. It must communicate the product's value proposition and drive action within 5 seconds of arrival.

### Layout Options

#### Option A: Two-Column (Text + Visual)

```
+----------------------------------------------------------+
|                                                          |
|  The best way to manage                    +----------+  |
|  your team's workflow.                     |          |  |
|                                            |  Product |  |
|  Ship faster with fewer meetings           |  Mockup  |  |
|  and more clarity.                         |  or      |  |
|                                            |  Illust. |  |
|  +------------------+  +----------------+  |          |  |
|  |  Start for free  |  |  See how ->   |  |          |  |
|  +------------------+  +----------------+  +----------+  |
|                                                          |
|  No credit card required - Free 14-day trial             |
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Layout | Two columns: left 50% (text), right 50% (visual). On mobile: single column, text first |
| Headline | 48-64px desktop, 32-40px mobile. Display font (weight 700-800). Max 2 lines. neutral-900 (light bg) or white (dark bg) |
| Subheadline | 20-24px desktop, 16-18px mobile. Body font. Max 2 lines. neutral-500 |
| Primary CTA | accent-500 filled button, 48-56px height, min-width: 180px, 16-18px font, weight 600. Start for free, Get started, Try [Product] free |
| Secondary CTA | Ghost or outlined button, same height, min-width: 140px. See how it works, Book a demo, View pricing |
| Button gap | 12-16px between primary and secondary CTA buttons |
| Trust text | 12-13px, neutral-400, below CTAs. No credit card required, Free forever, Join 100,000+ teams |
| Hero visual | Right side. Options (in priority order): (1) product screenshot with UI detail, (2) custom illustration showing product value, (3) abstract visual representing the category, (4) NO stock photo |
| Padding | 80-120px top, 80-120px bottom. Hero fills 70-90% of initial viewport |

#### Option B: Full-Bleed Centered (Text + Visual Below)

```
+----------------------------------------------------------+
|                                                          |
|                                                          |
|          Build products your users will love             |
|                                                          |
|     The all-in-one platform for product teams to          |
|     design, build, and ship better software.              |
|                                                          |
|          +------------------+  +----------------+       |
|          |  Start building  |  |  See demo ->   |       |
|          +------------------+  +----------------+       |
|                                                          |
|          +--------------------------------------+        |
|          |                                      |        |
|          |         Product Screenshot            |        |
|          |         (full-width, contained)       |        |
|          |                                      |        |
|          +--------------------------------------+        |
|                                                          |
+----------------------------------------------------------+
```

This layout works well for products with a visually impressive UI (design tools, dashboards, creative apps). The screenshot is the hero.

### Hero Anti-Patterns

| Pattern | Why It is Bad |
|---|---|
| Centered hero with text only, no visual | Boring. Looks like a template. No product personality |
| Welcome to ProductName | Nobody cares about the product name. They care what it DOES |
| The best/most powerful/easiest way to... | Generic. Every product says this. Be specific |
| Gradient backgrounds (blue to purple) | Overused. Cliche. Signals generic SaaS |
| Stock photography | Inauthentic. Shows the product does not exist or is not ready to show |
| Autoplay video with sound | Interruptive. Annoys users. If video, muted + click to enable sound |
| Rotating carousel in hero | Nobody waits for slide 3. Static content converts better |
| Small CTA buttons (< 44px) | Hard to click, low visual priority, cheap feel |

---

## 3. Social Proof Bar

Immediately after the hero — before features — establish credibility.

```
+----------------------------------------------------------+
|                                                          |
|     Trusted by teams at                                   |
|                                                          |
|  [LOGO]  [LOGO]  [LOGO]  [LOGO]  [LOGO]  [LOGO]        |
|                                                          |
|     ProductName has transformed how our team works.       |
|     -- Jane Smith, CTO at TechCorp                       |
|                                                          |
|              Star 4.9 / 5 from 2,000+ reviews            |
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Section heading | 14-16px, weight 500, neutral-400. Trusted by teams at, Used by, Loved by developers at |
| Logo grid | 5-8 logos. Grayscale (opacity 0.5-0.7 on white bg). Same height (24-36px), variable widths. Evenly spaced grid |
| Testimonial | One featured quote (not a carousel). 18-22px, neutral-600, italic optional. Attribution below: name + title + company |
| Star rating | 5 stars (accent-500 or yellow-500) + rating score + review count. 14px |
| Padding | 40-64px vertical. Subtle but present |
| Background | White or neutral-50 |

**Logo sourcing:** Use real company names, not placeholder logos. If the product is new and has no customers, skip the logo bar entirely — a fake logo section is worse than no logo section.

---

## 4. Features / Benefits

Do not list features. Describe benefits. Each section answers What does the user get? not What does the product have?

### Option A: Alternating Rows (Image + Text)

```
+----------------------------------------------------------+
|                                                          |
|  +-------------------------+ +--------------------------+|
|  |                         | |                          ||
|  |  [Screenshot or         | |  Collaborate in          ||
|  |   Illustration]         | |  real-time               ||
|  |                         | |                          ||
|  |                         | |  Work together on         ||
|  |                         | |  documents with your      ||
|  |                         | |  team, seeing changes     ||
|  |                         | |  as they happen.          ||
|  |                         | |                          ||
|  |                         | |  - Live cursors           ||
|  |                         | |  - Version history        ||
|  |                         | |  - Comments and threads   ||
|  |                         | |                          ||
|  +-------------------------+ +--------------------------+|
|                                                          |
|  +-------------------------+ +--------------------------+|
|  |                         | |                          ||
|  |  Ship with confidence   | |  [Screenshot or         ||
|  |                         | |   Illustration]         ||
|  |  Preview changes, run   | |                         ||
|  |  automated tests, and   | |                         ||
|  |  deploy to production   | |                         ||
|  |  with a single click.   | |                         ||
|  |                         | |                         ||
|  |  - Preview deployments   | |                         ||
|  |  - Automated rollbacks   | |                         ||
|  |  - Performance budgets   | |                         ||
|  |                         | |                         ||
|  +-------------------------+ +--------------------------+|
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Row layout | Alternating: image-left/text-right, then text-left/image-right |
| Image side | 50% width. Product screenshot with UI zoom (not full-screen — focused on the feature). Or custom illustration |
| Text side | 50% width (padding 48-64px). Heading (28-36px, weight 700). Description (16-18px, neutral-500). Bullet points (3 max, 14-16px) |
| Alternation | Image sides alternate each row to create visual rhythm |
| Gap between rows | 80-120px vertical. Each row is a distinct visual beat |

### Option B: 3-Column Card Grid

```
+----------------------------------------------------------+
|                                                          |
|     Everything you need to ship great products            |
|                                                          |
|  +-----------+  +-----------+  +-----------+           |
|  |   [Icon]  |  |   [Icon]  |  |   [Icon]  |           |
|  |           |  |           |  |           |           |
|  | Real-time |  | Version   |  | Automated |           |
|  | Collab    |  | Control   |  | Deploys   |           |
|  |           |  |           |  |           |           |
|  | Work with |  | Track     |  | Push to   |           |
|  | your team |  | every     |  | production|           |
|  | in real   |  | change    |  | with one  |           |
|  | time.     |  | made.     |  | click.    |           |
|  +-----------+  +-----------+  +-----------+           |
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Columns | 3 (desktop), 2 (tablet), 1 (mobile) |
| Card style | Minimal card. Subtle border or shadow. Or no card at all (icon + text only) |
| Icon | 32-48px, accent-500 or neutral-500 |
| Title | 18-20px, weight 600, neutral-900 |
| Description | 14-16px, neutral-500, 2-3 lines |
| CTA | Optional per-card Learn more link, 13px, accent-500 |

**IMPORTANT: Do NOT use identical feature cards in a perfect 3x2 grid.** This is the most overused template in SaaS landing pages. Vary the layout: first section = 3-column grid, next section = alternating rows, next section = single featured benefit with a large visual. Never: two card grids back to back.

---

## 5. How It Works

A simple 3-step numbered flow. Keep it light and clear.

```
+----------------------------------------------------------+
|                                                          |
|     Start shipping in minutes                             |
|                                                          |
|  +-------+      +-------+      +-------+               |
|  |       |      |       |      |       |               |
|  |   1   | ---- |   2   | ---- |   3   |               |
|  |       |      |       |      |       |               |
|  +-------+      +-------+      +-------+               |
|                                                          |
|  Connect your   Configure      Ship to                  |
|  repository     your build     production                |
|                                                          |
|  Link your Git  Set up your    Deploy with a             |
|  provider and   build and      single click or           |
|  import your    deployment     automated via              |
|  projects.      settings.      git push.                 |
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Step numbers | Large circles (56-72px), accent-500 filled, white number (28-32px, weight 700) |
| Connector lines | 2px solid neutral-200 or accent-200 between steps |
| Step title | Below or beside the number. 18-22px, weight 600-700 |
| Step description | 14-16px, neutral-500, 1-2 lines |
| Visual | Optional: small screenshot or illustration per step |

### How It Works Anti-Patterns
- **DO NOT** make it 5+ steps. 3 is the magic number. 4 if truly necessary. More than 4 = the product seems complicated.
- **DO NOT** use a vertical timeline with alternating left/right cards (this is for case studies, not how-it-works)
- **DO NOT** make the steps too detailed. This is a high-level overview, not documentation

---

## 6. Testimonials

Testimonials build emotional trust. Quality over quantity.

### Best Pattern: Deep Testimonial (1-3 max)

```
+----------------------------------------------------------+
|                                                          |
|  +------------------------------------------------------+|
|  |                                                      ||
|  |  ProductName has completely transformed how our       ||
|  |   engineering team works. Before, we were spending    ||
|  |   20+ hours per week on manual deploys. Now it takes  ||
|  |   3 minutes. Our team velocity has doubled and we     ||
|  |   finally have the time to focus on what matters --   ||
|  |   building features our users love.                   ||
|  |                                                      ||
|  |  +----+                                              ||
|  |  |    |  Sarah Chen                                  ||
|  |  +----+  VP of Engineering, TechGrowth               ||
|  |          500+ employees - 3x faster deploys           ||
|  |                                                      ||
|  +------------------------------------------------------+|
|                                                          |
|  +------------------+  +------------------+             |
|  | Incredible...    |  | A game changer   |             |
|  | -- Mark T., CTO  |  | -- Lisa R., PM  |             |
|  +------------------+  +------------------+             |
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Featured testimonial | 1 large card. Quote (20-24px, neutral-700, styled with quotation marks). Photo (48-56px), name (16-18px, weight 600), role + company (14px, neutral-400) |
| Result/stat | Below attribution: quantified result (3x faster deploys, Saved 0K/year) |
| Secondary testimonials | 1-2 smaller cards or text quotes below the featured one. Lower visual priority |
| Background | White card with subtle shadow, or neutral-50 band |

### Testimonial Anti-Patterns

| Pattern | Why It is Bad |
|---|---|
| Circular avatar carousel | Dated, overused, low trust. The carousel pattern hides content (only one visible at a time) and circular avatars feel inauthentic |
| 6+ shallow testimonials | 6 one-line quotes feel fake. One deep, specific quote is worth more |
| This product is great! | Worthless. Testimonials must be specific: what was the problem, what changed, what was the result |
| Stock photo headshots | Immediately signals fake testimonials. Use real photos of real people |
| No attribution | Anonymous quotes are not trustworthy. Full name + role + company is required |

---

## 7. Pricing (Optional)

```
+----------------------------------------------------------+
|                                                          |
|     Simple, transparent pricing                           |
|                                                          |
|  +----------+  +----------+  +----------+              |
|  | Starter  |  |   Pro    |  | Enterprise|              |
|  |          |  | Popular  |  |          |              |
|  |  9/mo  |  |  9/mo  |  |  Custom  |              |
|  |          |  |          |  |          |              |
|  | - 5 proj |  | - Unlim  |  | - SSO    |              |
|  | - Basic  |  | - API    |  | - SLA    |              |
|  | - Email  |  | - Priori |  | - Custom |              |
|  |          |  |          |  |          |              |
|  |[Start ->]|  |[Start ->]|  |[Contact] |              |
|  +----------+  +----------+  +----------+              |
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Tiers | 3-4 cards. 3 is optimal. 4 if you need a free tier |
| Popular tier | Accent-500 border (2px) or raised card with shadow. Most popular or Popular badge (accent-500 pill, top-right) |
| Price | 36-48px, weight 700. /mo or /year in 14px, neutral-400 |
| Feature list | 4-6 features per tier. Checkmark (green-500) before each |
| CTA per tier | Filled button for popular, outline for others |
| Toggle | Monthly/Annual toggle above cards. Annual shows discount (Save 20%) |
| Below cards | Feature comparison table (optional). Detailed breakdown of all features across tiers |

### Pricing Anti-Patterns
- **DO NOT** show every possible feature in the pricing cards. 4-6 key features per tier. Full comparison below
- **DO NOT** use vague pricing: Starting at or Contact us for every tier. At least one tier should have a clear, published price
- **DO NOT** hide pricing behind a See pricing link or require email to view prices

---

## 8. FAQ (Optional)

```
+----------------------------------------------------------+
|                                                          |
|     Frequently asked questions                            |
|                                                          |
|  +------------------------------------------------------+|
|  | How does the free trial work?                        ||
|  |   You get full access to all Pro features for 14     ||
|  |   days. No credit card required. Cancel anytime.      ||
|  +------------------------------------------------------+|
|  | Can I change my plan later?                          ||
|  +------------------------------------------------------+|
|  | Do you offer refunds?                                 ||
|  +------------------------------------------------------+|
|  | What payment methods do you accept?                  ||
|  +------------------------------------------------------+|
|  | Is my data secure?                                   ||
|  +------------------------------------------------------+|
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Max questions | 10. More than 10 = too many. Move detailed questions to a dedicated FAQ/Help page |
| Grouping | Optional: group by topic (Billing, Features, Security) with subheadings |
| Accordion behavior | Click to expand. Smooth height transition (300ms). Only one open at a time (or multiple — either is fine, but be consistent) |
| Question style | 16-18px, weight 500-600, neutral-800. Chevron or +/- icon right |
| Answer style | 15-16px, neutral-600. Padding below question: 16-20px |

---

## 9. Final CTA Section

The closing argument. This section must be visually distinct from the rest of the page.

```
+----------------------------------------------------------+
|                                                          |
|  +------------------------------------------------------+|
|  |  (Full-bleed accent band -- accent-600 background)   ||
|  |                                                      ||
|  |                                                      ||
|  |            Ready to ship faster?                     ||
|  |                                                      ||
|  |     Join 100,000+ developers who use ProductName     ||
|  |          to deploy with confidence.                   ||
|  |                                                      ||
|  |        +----------------------+                      ||
|  |        |  Start building free |                      ||
|  |        +----------------------+                      ||
|  |                                                      ||
|  |           No credit card required                     ||
|  |                                                      ||
|  +------------------------------------------------------+|
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Background | Full-bleed accent-500 or accent-600 band. Or neutral-900 dark band. Must contrast sharply with the rest of the page (which is mostly white/neutral) |
| Heading | 36-48px, weight 700-800, white text |
| Subheading | 18-22px, white (opacity 0.85), 1-2 lines |
| CTA button | White background, accent-600 text (or dark text). 48-56px height. Contrasts with the band. Start building free, Get started, Try [Product] |
| Trust text | Below button: 13-14px, white (opacity 0.7) |
| Padding | 80-120px vertical. Generous breathing room |
| Section purpose | This is the closer. It is a departure from the rest of the page tone — bold, direct, urgent |

### Final CTA Anti-Patterns
- **DO NOT** use the same background color as the rest of the page. This section must feel different
- **DO NOT** use two competing CTAs here. One button, one action
- **DO NOT** make the text subtle or small. This is the loudest section on the page

---

## 10. Footer

```
+----------------------------------------------------------+
|                                                          |
|  +----------+  +----------+  +----------+  +----------+|
|  |          |  | Product  |  | Company  |  | Resources||
|  | [Logo]   |  |          |  |          |  |          ||
|  |          |  | Features |  | About    |  | Docs     ||
|  | Build    |  | Pricing  |  | Blog     |  | API      ||
|  | faster   |  | Changelog|  | Careers  |  | Guides   ||
|  |          |  | Integrat.|  | Contact  |  | Status   ||
|  |          |  |          |  |          |  |          ||
|  +----------+  +----------+  +----------+  +----------+|
|                                                          |
|  ------------------------------------------------------ |
|                                                          |
|  (c) 2024 ProductName, Inc. - Privacy - Terms - Cookies  |
|                                                          |
+----------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Columns | 4-5 columns desktop. 2 columns tablet. 1 column mobile (accordion) |
| First column | Logo + tagline. Slightly wider than other columns |
| Column headings | 12-14px, weight 600, neutral-400, text-transform uppercase, letter-spacing 0.5px |
| Footer links | 13-14px, neutral-500, stack vertically with 8-12px gap. Hover: neutral-900 or accent-500 |
| Bottom bar | Copyright left, legal links right. 12-13px, neutral-400 |
| Background | neutral-50 or neutral-900 (dark footer). Contrast with page background |

### Footer Anti-Patterns
- **DO NOT** use small, cramped text. Footer is low-priority but should still be readable
- **DO NOT** put social media icons as the primary footer content (they go in a subtle row at the bottom or in the first column)
- **DO NOT** make the footer a different background color than the page body unless it is dark (neutral-900) for a bold finish

---

## Typography System for Landing Pages

| Element | Font | Size (Desktop) | Weight | Color | Line Height |
|---|---|---|---|---|---|
| Hero headline | Display font (e.g., Sohne, Inter Display, Switzer) | 48-64px | 700-800 | neutral-900 | 1.1-1.2 |
| Section heading | Display or heading font | 32-40px | 700-800 | neutral-900 | 1.2-1.3 |
| Subsection heading | Body or heading font | 24-28px | 600-700 | neutral-800 | 1.3 |
| Card title | Body font | 18-22px | 600 | neutral-800 | 1.3 |
| Body text | Body font (e.g., Inter, SF Pro Text) | 16-18px | 400 | neutral-600 | 1.6-1.7 |
| Small body | Body font | 14-15px | 400 | neutral-500 | 1.5 |
| Caption / label | Body font | 12-13px | 500 | neutral-400 | 1.4 |
| Button text | Body font | 15-17px | 600 | White or accent | -- |

**Font pairing rules:**
- 1 display font + 1 body font. Never 3+ font families
- Display font used ONLY for major headings (hero, section headings). Never for body text
- Body font used for everything else: subheadings, paragraphs, CTAs, captions, links
- Code font (JetBrains Mono, Fira Code) used only for inline code or code blocks

---

## Section Spacing System

| Between... | Vertical Spacing |
|---|---|
| Hero -> Social Proof | 64-80px |
| Social Proof -> Features | 80-96px |
| Between feature rows | 64-80px |
| Features -> How It Works | 96-120px |
| How It Works -> Testimonials | 96-120px |
| Testimonials -> Pricing | 96-120px |
| Pricing -> FAQ | 80-96px |
| FAQ -> Final CTA | 96-120px |
| Final CTA -> Footer | 0px (CTA band flows into footer or has small gap) |

**Spacing principles:**
- Major sections: 96-128px (clear visual separation)
- Sub-sections: 64-80px (related content, softer separation)
- Within sections: 24-48px (content grouping)
- Never use equal spacing between all sections. Vary spacing to create visual rhythm

---

## CTA Strategy

### Button Size Hierarchy

| Context | Height | Font Size | Min Width |
|---|---|---|---|
| Hero primary CTA | 48-56px | 16-18px | 180px |
| Hero secondary CTA | 48-56px | 16-18px | 140px |
| Section CTA | 40-48px | 15-16px | 140px |
| Card CTA (link) | N/A (text link) | 14-15px | N/A |
| Nav CTA | 36-44px | 14-15px | 100px |
| Footer CTA | 36-40px | 14px | 100px |

### CTA Copy Guidelines

| Context | Good Examples | Bad Examples |
|---|---|---|
| Hero | Start building free, Try [Product] free, Deploy your first project | Get started, Learn more, Sign up now |
| Mid-page | See how it works, Explore features, View all integrations | Click here, Read more, Submit |
| Pricing | Start with Starter, Go Pro, Talk to sales | Buy now, Purchase, Select plan |
| Final CTA | Start building free, Join 100,000+ developers | Contact us, Book a demo (unless enterprise) |

**CTA rules:**
- One primary CTA per section. Max one secondary
- All primary CTAs lead to the SAME destination (signup/demo/trial). Consistent throughout the page
- Primary CTAs are always accent-500 filled buttons. Secondary CTAs are ghost/outline
- CTA text is action-oriented and specific: Start building is better than Get started

---

## Visual Variety Rules

A common failure of landing page designs is monotony — every section looks the same.

| Rule | Implementation |
|---|---|
| Alternate visual layouts | Image-left/text-right -> text-left/image-right -> centered -> card grid. Never: 3 card grids in a row |
| Alternate backgrounds | White -> neutral-50 -> white -> accent band -> white |
| Vary section heights | Some sections are tall and airy (hero, final CTA). Some are compact (social proof, features) |
| Use bands strategically | Only 2-3 bands per page. Overusing bands = visual noise |
| Intentional asymmetry | Not every section needs to be perfectly symmetrical. Asymmetric layouts (60/40 split, offset cards) feel more designed |
| Break the grid occasionally | A full-bleed image, a horizontal scroll section, or a testimonial that spans wider than the content max-width adds visual interest |

---

## Anti-Patterns for Landing Pages

### 1. Generic Hero

**WRONG:**
```
+----------------------------------------------------------+
|                                                          |
|         Welcome to ProductName                           |
|   The best way to manage your workflow. Get started       |
|                  today.                                   |
|                                                          |
|              [Get Started] [Learn More]                   |
|                                                          |
+----------------------------------------------------------+
```

**Why it is wrong:** Generic. Uses Welcome to [Name], a super-positive claim (the best), and generic CTAs (Get Started + Learn More). No visual. No differentiation. No personality.

**CORRECT:** Specific headline solving a real problem. Product screenshot or custom illustration. Single clear CTA with specific action. Distinct visual treatment.

### 2. Centered Hero with No Visual Interest

**WRONG:** Text-only hero centered in the page. No image, no illustration, no screenshot, no background treatment. Just words.

**Why it is wrong:** Looks unfinished. Appears like a wireframe, not a designed page. The hero is the most valuable real estate on the page — it MUST include a visual.

**CORRECT:** Always pair hero text with a visual element: product screenshot, custom illustration, code snippet (for dev tools), abstract 3D visual, or interactive demo embed.

### 3. Testimonial Carousels with Circular Avatars

**WRONG:** A carousel showing one testimonial at a time, with circular avatar photos, centered quotes, and auto-rotating slides.

**Why it is wrong:** This is the single most cliched landing page pattern. It signals generic template. Auto-rotating hides content. Circular avatars trigger uncanny valley. Centered quotes look like a graduation yearbook.

**CORRECT:** Static testimonial cards (1-3 visible at once). Square or rounded-rect photos (not circles). Left-aligned text. No auto-rotation. If multiple testimonials, show them in a grid or horizontal scroll, not a carousel.

### 4. Stock Photography

**WRONG:** Generic stock photos of smiling people in an office, handshakes, or abstract 3D renderings of globes/networks.

**Why it is wrong:** Stock photography signals fake. Users have seen these images a thousand times. They convey zero information about the product. They erode trust.

**CORRECT:** Product screenshots (zoomed into actual UI), custom illustrations that show product value, or code snippets for developer tools. Real photos of the actual team (for About pages, not heroes).

### 5. Learn More + Get Started as Every CTA Pair

**WRONG:** Every section ends with [Get Started] + [Learn More] buttons. The page has 6+ CTAs, all saying the same thing.

**Why it is wrong:** Redundant. Wastes user attention. No CTA feels special if every section has one. Variable CTAs create better flow: some sections inform without CTAs, others drive action.

**CORRECT:** Hero: one primary CTA. Features sections: no CTAs (they inform, not convert). Testimonials: no CTAs. Pricing: per-tier CTAs. Final section: one primary CTA. Total: 3-4 CTAs across the entire page.

### 6. Feature Cards All Same Size and Style

**WRONG:** A perfect 3x2 or 4x2 grid of identical cards. Every card has: icon (top-center), title (center), description (center), Learn more link (bottom-center). Every card is the same height.

**Why it is wrong:** This is the default landing page template. It screams I used a template. It makes every feature feel equally important (which means none feel important). It is boring to scroll through.

**CORRECT:** Vary feature presentation. Use an alternating image+text layout for the top 2-3 features. Use a grid for secondary features. Vary card heights naturally (let content determine height). Feature cards should not all look identical.

### 7. Gradient Hero Backgrounds (Blue to Purple)

**WRONG:** Hero section with a linear-gradient(135deg, #667eea 0%, #764ba2 100%) background.

**Why it is wrong:** This exact gradient (and its cousins: blue-to-teal, purple-to-pink) is the most overused background in SaaS. It appeared on every Stripe-clone landing page from 2018-2021. It signals derivative and date-stamped.

**CORRECT:** Use product-native colors. If the product has a distinct brand color, use it. White/neutral hero backgrounds with the product screenshot as the main visual element. Dark backgrounds for developer tools. Subtle texture or grid patterns instead of gradients.

---

## Brand Personality in Landing Pages

### Technical / Dark (Developer Tools, APIs, Infrastructure)

| Attribute | Specification |
|---|---|
| Color palette | Dark backgrounds (neutral-900, #0d1117, black), sharp accent (neon green, cyan, or bright blue), white text |
| Typography | Inter or system fonts for headings. Monospace for code snippets. Clean, sharp |
| Tone | Direct, technical, confident. No hype. Facts over fluff |
| Visual style | Product screenshots (dark mode), code snippets with syntax highlighting, terminal-style UI elements, grid/dot pattern backgrounds |
| Hero style | Code snippet or terminal mockup paired with headline. Or product screenshot in dark mode |
| Reference | Stripe (original dark hero), Vercel, Railway, PlanetScale, Neon |

### Minimal / Clean (Productivity, Design Tools, SaaS)

| Attribute | Specification |
|---|---|
| Color palette | White backgrounds, neutral grays, single accent color (blue, muted purple, or teal) |
| Typography | Inter, SF Pro. Clean, modern. High readability |
| Tone | Calm, confident, crisp. Product speaks for itself |
| Visual style | Product screenshots (light mode), clean illustrations, generous whitespace, subtle animations on scroll |
| Hero style | Large product screenshot with minimalist headline. Whitespace is the primary design element |
| Reference | Linear, Notion, Figma, Raycast |

### Warm / Friendly (Consumer Apps, Education, Community)

| Attribute | Specification |
|---|---|
| Color palette | Warm neutrals, soft pastels, friendly accent (coral, warm orange, soft green) |
| Typography | Rounded sans-serif or friendly serif. Playful but readable |
| Tone | Warm, inviting, human, encouraging. Uses you and your |
| Visual style | Custom illustrations (character-based), soft shadows, rounded corners, warm photography, playful micro-interactions |
| Hero style | Illustration-heavy. Character illustrations showing product value. Warm background colors |
| Reference | Notion (illustrations), Duolingo, Headspace, Pitch |

---

## Real-World Reference Landing Pages

### Stripe Homepage
- **Mode:** Technical/dark
- **Signature traits:** Dark background (near-black), sharp accent colors, product screenshots embedded in devices, code snippets as visual elements, minimal navigation, benefit-driven headlines, alternating image+text sections, gradient accent band for final CTA
- **Key takeaway:** Show the product, not marketing fluff. Code is a visual element. Dark mode signals developer focus. Every section has one clear message.

### Linear Homepage
- **Mode:** Minimal/clean
- **Signature traits:** Extremely minimal. White background. Small, precise headlines. Product screenshots dominate. Subtle scroll animations. Keyboard shortcut hints embedded in UI. No marketing language — product features speak for themselves. Small, understated CTA.
- **Key takeaway:** Remove everything that is not essential. Let the product UI be the hero. Trust the user to understand value without being told.

### Vercel Homepage
- **Mode:** Technical/dark
- **Signature traits:** Dark background. Terminal-style UI elements. Code snippets with syntax highlighting. Sharp typography. Product screenshots in dark mode. Deployment metrics as visual elements. Clean, fast feel.
- **Key takeaway:** Developer tools should look like developer tools. Dark mode, code, and terminal aesthetics build trust with the target audience.

### Notion Homepage
- **Mode:** Warm/friendly
- **Signature traits:** Character illustrations throughout. Warm, approachable color palette. Product screenshots showing real Notion pages. Friendly, conversational copy. Generous whitespace. Playful animations. Clean, icon-heavy feature sections.
- **Key takeaway:** Illustrations and warm colors make complex software feel approachable. Show the product being used for real work, not abstract concepts.

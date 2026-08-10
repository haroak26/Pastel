# Mercury Brand Book — Deep Dive

## Overview

Mercury is "banking for startups" — a financial operating system purpose-built for
founders and startup teams. The brand bridges two worlds: the trust and precision
expected of financial services, and the speed and clarity expected of modern
software tools. It feels like a financial terminal designed by Stripe, not a bank
website designed in 2005.

---

## Brand Personality

Mercury occupies a unique space in fintech: professional but never stuffy, precise
but never cold, technical but never intimidating. The personality can be understood
through four dimensions:

- **Trustworthy** — This is someone's money. Every detail communicates security, stability,
  and reliability. The brand never takes trust lightly.
- **Precise** — Financial data demands accuracy. Numbers align perfectly. Tables are
  crisp. Nothing is ambiguous or fuzzy. This precision itself builds confidence.
- **Modern** — Mercury is for startups, by people who understand startups. The brand
  speaks the language of founders: direct, clear, no unnecessary ceremony.
- **Approachable** — Despite handling serious financial matters, the brand never feels
  cold or institutional. It's a partner, not a gatekeeper.

The net effect: Mercury feels like a well-engineered API that happens to have a UI.
It's bank-grade infrastructure with developer-tool polish.

---

## Tone of Voice

Mercury speaks clearly, confidently, and simply. Financial concepts are explained
without jargon. The voice respects the user's intelligence while never assuming
they have a banking background.

### Character
- Clear and direct — says what it means, means what it says
- Confident — not apologetic, not hedging, not uncertain
- Simple — explains complex financial ideas in plain language
- Friendly but professional — warm enough to feel human, precise enough to feel reliable
- Startup-native — understands the founder mindset and speaks accordingly

### Sentence-Level Patterns
- "Built for startups" — declarative, confident, positioning
- "Your cash balance" — plain language for financial terms
- "Money in. Money out. Simple." — rhythmic clarity, breaking down complexity
- "You're all set" — affirmative completion, reassuring
- Short sentences. Periods over semicolons. Active voice.

### Anti-Patterns
- Never uses banking jargon ("ACH debit origination")
- Never uses marketing fluff ("revolutionary," "game-changing")
- Never uses uncertain language ("we try to," "we aim to," "hopefully")
- Never uses overly casual or playful language ("cha-ching!")
- Never uses fear-based messaging about money or security

---

## Visual Identity

### Philosophy
The Mercury visual language is built on a foundation of clarity and restraint. Nothing
is decorative. Every element serves a functional purpose — to make financial data
understandable, actionable, and trustworthy. The design disappears so the numbers can
speak.

### Core Elements

**Color: Clean White with Purposeful Accent**
Mercury is predominantly white. Not warm-cream, not off-white — clean, bright white
that signals freshness and clarity. The accent color (a refined blue-teal) appears
sparingly: active states, primary CTAs, selected rows, links. This restraint makes
the accent meaningful when it appears. Semantic colors (green for credits, red for
debits) are the secondary color system — they tell the money story at a glance.

**Typography: Precision First**
Numbers are the most important content on screen. Tabular figures (monospaced numerals
within proportional type) ensure that financial data aligns perfectly in tables and
columns. Type hierarchy is achieved through weight and scale, never color or decoration.
Body text uses Inter or a similar clean sans-serif optimized for screen readability.

**Space: Clarity in Density**
Financial dashboards are inherently data-dense. Mercury manages this through careful
information architecture rather than excessive padding. Transaction tables use tight
but readable spacing. Dashboards use cards to group related information. Marketing
pages get more breathing room. The space always serves clarity — never decoration.

**Imagery: Minimal and Intentional**
Marketing pages use clean, abstract imagery — geometric patterns, subtle gradients,
product screenshots. There are no stock photos of people shaking hands or smiling
at laptops. The product is the hero. Illustrations, when used, are geometric and
precise, matching the brand's technical character.

**Motion: Fast and Functional**
Animations serve purpose: confirming a transfer, updating a balance, transitioning
between views. They are fast (120-200ms) and precise — no bouncing, no overshooting,
no decorative flourishes. Money should feel responsive, not playful.

---

## Typography

Mercury uses clean, modern sans-serif type — Inter or an equivalent:

- **Primary typeface**: Inter, system sans-serif stack (SF Pro on iOS/macOS, Roboto on Android)
- **Weights**: Regular (400), Medium (500), Semi-bold (600) — clean progression
- **Body text**: 14-16px, tight but readable line height (1.4-1.5x)
- **Headings**: 18-24px, weight-driven hierarchy
- **Hero numbers**: 36-56px, semi-bold or bold, the most prominent text on a dashboard
- **Tabular figures**: Essential — all number displays use `font-variant-numeric: tabular-nums`

### Type Rules
- Never use serif typefaces — they feel institutional and traditional
- Never use rounded or humanist sans — too soft for financial precision
- Never use display or decorative typefaces
- Never center-align large blocks of text — left-aligned for readability
- Numerals are always tabular — columns must align perfectly
- Monospace is reserved for code, API keys, and routing numbers

---

## Spacing Philosophy

Mercury balances information density with readability:

- **Dashboard cards**: 24px padding, moderate density
- **Transaction tables**: 8-12px cell padding — tight enough to see many rows, loose enough to read
- **Section margins**: 32-48px on dashboards, 64-96px on marketing pages
- **Form spacing**: 16-24px between fields, clear visual grouping
- **Sidebar**: 16px item spacing, compact but clear
- **Never**: Oversized padding in data displays (wastes screen real estate), content touching edges, inconsistent spacing between similar elements

---

## Color Philosophy In Depth

### Primary Palette

| Role | Color | Usage |
|---|---|---|
| Background | `#FFFFFF` | Primary surface — clean, bright, trustworthy |
| Accent | `#3B82F6` (or teal-blue) | Primary actions, active states, links, selected rows |
| Text Primary | `#111827` | Headings, body text, high-emphasis data |
| Text Secondary | `#6B7280` | Labels, metadata, supporting information |
| Text Tertiary | `#9CA3AF` | Placeholders, disabled states, very low emphasis |
| Border | `#E5E7EB` | Card borders, table borders, input borders |
| Background Alt | `#F9FAFB` | Secondary surfaces, table headers, sidebar |

### Semantic Colors (Financial)

| Role | Color | Usage |
|---|---|---|
| Positive / Credit | `#059669` | Incoming money, positive balances, growth |
| Negative / Debit | `#DC2626` | Outgoing money, negative balances, declined |
| Pending / Warning | `#D97706` | Pending transactions, attention needed |
| Info | `#2563EB` | Informational states, tips, documentation links |

### The Rules
- Clean white backgrounds dominate — this is non-negotiable
- Accent color is used sparingly — only where it adds meaning
- Semantic colors are unambiguous — green always means incoming/good, red always means outgoing/bad
- Never use warm tones (orange, coral, yellow) as primary colors — they undermine financial seriousness
- Never use decorative gradients for backgrounds or cards
- Never use pastel or muted versions of semantic colors — clarity over aesthetics
- Dark backgrounds (charcoal, navy) are reserved for very specific contexts (code blocks, API docs)

---

## Key Design Patterns

### Cash Balance Hero
The most prominent element on the dashboard. The current cash balance is displayed as
the largest text on screen. It's a single number with currency symbol, updated in
real-time. Nothing competes with it visually. It anchors the entire financial
experience.

### Transaction Table
A clean, minimal table with columns for date, description, category, and amount.
Amounts are right-aligned with tabular figures for perfect column scanning. Credits
get a subtle green tint; debits get a subtle red tint. Rows have hover states with a
light gray background. The table is filterable and searchable, with clear empty states
("No transactions yet" with a gentle prompt).

### Transfer Flow
A simple, linear form: source account, destination, amount, and optional memo. Each
field is clearly labeled. The amount field is prominently sized. A review step
confirms all details before final submission. The confirmation screen shows a clean
receipt with the transfer details and a reassuring "Money is on its way" message.

### Card Management
Virtual and physical debit cards are managed from a single screen. Cards display
with the last four digits and card network logo. Active cards show spend limits and
recent transactions. Cards can be frozen instantly (with a clear toggle and
confirmation). Virtual cards can be created on-demand with custom spend limits.

### Spending Dashboard
Categorized spending visualized as a clean bar chart or donut chart. Categories are
listed with amounts and percentages. The chart uses subtle, distinct colors (never a
rainbow — 6-8 distinct muted tones). The visualization is precise and readable, not
decorative. Tapping a category reveals filtered transactions.

---

## What Makes Mercury Mercury

Mercury stands apart from traditional banks (Chase, Wells Fargo) and neo-banks (Chime,
Varo) in several critical ways:

- **Startup-native UX**: Mercury understands that its users are technical founders who
  value efficiency and clarity. The UI assumes intelligence while reducing cognitive
  load.
- **Financial data as product**: The numbers aren't dressed up with gradients and
  illustrations. They are presented with precision and clarity because they are the
  product.
- **Professional but not institutional**: It has the reliability of a bank with the
  design quality of a well-funded SaaS product.
- **Trust through transparency**: Clear fees, clear balances, clear transaction
  histories. Nothing hidden, nothing confusing.
- **API-first thinking**: Even the UI feels like it was designed by people who think
  in APIs — structured, consistent, predictable.

When someone sees a Mercury screen, they should feel that their money is in capable,
professional hands. Not warm and fuzzy — clear and precise.

---

## Signature Moves Checklist

If you're designing something "Mercury-inspired," these are the non-negotiables:

1.  Clean white backgrounds — the canvas is neutral so the data speaks
2.  Hero balance number — the cash position is always the biggest text on the dashboard
3.  Tabular figures for all numbers — columns must align perfectly
4.  Clear semantic colors — green = credit/money in, red = debit/money out
5.  Minimal accent usage — accent color appears only where it adds functional meaning
6.  Crisp border radius (4-6px) — professional, not playful
7.  Fast, functional animations (120-200ms) — responsive, not decorative
8.  Clean sans-serif typography — Inter-style, data-optimized
9.  Transaction tables as the primary data visualization
10. Startup-friendly copy — direct, clear, no banking jargon

---

## Emotional Experience Map

1.  **Arrival** — Dashboard loads. Cash balance is immediately visible. Trust is
    established through clarity.
2.  **Scanning** — Recent transactions are readable at a glance. No hunting through
    menus. The financial picture is complete.
3.  **Action** — Making a transfer or freezing a card is fast and confident. Forms are
    simple. Confirmation is clear.
4.  **Understanding** — Spending categories and trends are visible. The user feels in
    control of their finances, not lost in them.
5.  **Confidence** — Every interaction reinforces that Mercury is competent, secure,
    and built for them. No anxiety, no confusion.

---

## Competitive Context

Mercury competes with Brex (more corporate, rewards-focused), Ramp (expense management
emphasis), and traditional banks (slow, legacy UX). Mercury's differentiator is its
pure focus on *being a great bank* for startups — not a rewards program, not an expense
tool, not a corporate travel platform. The design reflects this focus: clean, functional,
and built for people who value their time.

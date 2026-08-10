# Airbnb Brand Book — Deep Reference

## Brand Personality

**Warm. Human. Aspirational.**

Airbnb doesn't sell rooms — it sells belonging. The brand promise "Belong Anywhere" is the emotional core that drives every design decision. The product feels like browsing a travel magazine, not querying a hotel database. Every pixel is designed to inspire wanderlust and make travel feel personal, intimate, and accessible.

The brand has two emotional layers:
1. **Aspiration**: Stunning photography of extraordinary places. The dream of travel.
2. **Trust**: Real human faces, verified reviews, host profiles. The safety of community.

These layers work together — you dream of the destination, then you trust the platform to get you there.

### Emotional Spectrum

- **Before booking**: Excitement, inspiration, possibility
- **During booking**: Clarity, confidence, ease
- **After booking**: Anticipation, connection, belonging
- **During stay**: Comfort, wonder, local authenticity

### Brand Attributes (In Priority Order)

1. **Human** — Real people, real places, real stories. No stock photography. Ever.
2. **Warm** — Inviting, approachable, generous. Coral is warm. Photography is warm.
3. **Inspiring** — Aspirational without being exclusive. You can do this too.
4. **Trustworthy** — Reviews, verification, host profiles. Safety through transparency.
5. **Cultured** — Local, authentic, not touristy. "Live like a local."

---

## Tone of Voice

### Core Principles

- **Warm and inviting**, never cold or transactional
- **Personal**, like a friend recommending a trip
- **Storytelling-driven** — describe experiences, not just features
- **Human language** — no corporate jargon, no "solutions" or "offerings"
- **Inclusive and global** — speaks to everyone, everywhere

### Copy Patterns

| Context | Tone | Example |
|---------|------|---------|
| Hero headings | Aspirational, short, emotive | "Find places to stay on Airbnb" |
| Listing titles | Descriptive, specific | "Cozy cabin with mountain views" |
| CTAs | Warm, inviting | "Show all" not "View more" |
| Empty states | Encouraging, helpful | "Start exploring" with beautiful illustration |
| Error states | Human, apologetic | "Something went wrong on our end" |
| Host messages | Personal, conversational | "Hi! Great to hear from you." |
| Reviews | Authentic, varied voices | Real user-generated content |
| Emails/notifications | Friendly, excited for you | "You're going to Tokyo!" |

### Words They Use

"home" "host" "stay" "experience" "adventure" "trip" "explore" "discover"
"welcome" "belong" "local" "neighborhood" "guide" "journey" "getaway"

### Words They Avoid

"property" "unit" "listing" (internally, not user-facing) "customer" "vendor"
"inventory" "book now" (too transactional) "best deal" (too price-focused)

---

## Visual Identity

### The Photography-First Approach

Airbnb's visual identity is built on photography. Unlike most tech products where UI dominates, Airbnb's interface is a canvas for images. The photography IS the design. UI chrome is intentionally minimal and neutral — it's there to frame the photography, not compete with it.

**Photography guidelines:**
- Real photos of real listings (no staged hotel photography)
- Warm lighting, natural settings
- People shown in context (hosts, guests enjoying spaces)
- Landscape orientation for cards, portrait for mobile hero
- No filters that feel synthetic or heavily edited

### The Color Strategy

Airbnb uses color sparingly in the UI. The palette is intentionally restrained:
- **Coral red (#FF5A5F)**: The only accent. Used for primary CTAs, hearts, badges. Appears ~5% of the time.
- **White/off-white backgrounds**: ~80% of the interface
- **Warm grays**: For text, borders, subtle UI elements
- **Photography**: Provides all the visual richness. This is the real "color palette."

The coral accent is so iconic that it's trademarked in certain contexts. It's never used as a background — always as a foreground accent on white.

### Warmth as a Design Material

"Warmth" isn't just copy — it's visual:
- Rounded corners on cards (12px), buttons (8px), and containers
- Warm-toned photography curation
- Generous white space — breathing room = luxury
- Subtle shadows (never harsh dropshadows)
- Human faces, real smiles, natural settings
- Coral accent color (warm red-orange, not clinical red)

### Signature Design Elements

1. **Large hero search** — Homepage opens with full-width hero image and centered search bar. This is the primary interaction.
2. **Card grids** — Listings displayed as image-dominant cards in a responsive grid. 3-4 columns desktop, 2 tablet, 1 mobile.
3. **Map/list toggle** — Search results can switch between card grid and map overlay. Map pins show prices.
4. **Heart/favorite** — Coral heart icon for wishlist. Animates on tap (scale bounce).
5. **Review system** — Avatar + name + date + 5-star rating + review text. Human-centric, not statistical.
6. **Category tabs** — Horizontal scrollable tabs for property types (Amazing pools, Beachfront, Cabins, etc.)

---

## Typography

Airbnb created a custom typeface: **Cereal** (formerly known as "Airbnb Cereal").

### Cereal Characteristics

- Geometric sans-serif with warm, rounded terminals
- 6 weights: Light, Book, Medium, Bold, Extra Bold, Black
- Optimized for both display (large hero text) and body (small listing details)
- Features: slightly rounded corners, open apertures, friendly personality
- Designed in partnership with Dalton Maag

### Typographic Hierarchy

| Element | Weight | Size | Notes |
|---------|--------|------|-------|
| Hero heading | Book/Medium | 48-64px | Airy, not shouting |
| Section heading | Medium | 28-36px | Warm, inviting |
| Card title | Book/Medium | 16-18px | Clean, legible |
| Body text | Book | 14-16px | Generous line-height (1.5) |
| Price | Medium | 16-18px | Prominent, not bold |
| Labels/captions | Book | 12-14px | Warm gray color |
| Buttons | Medium | 14-16px | Ever so slightly rounded |

### Typography Principles

- **Legibility first** — body text is always comfortable to read
- **Personality in headings** — display text has character but stays clean
- **Consistent weight usage** — Medium for emphasis, Book for body, never jumps randomly
- **Generous line-height** — 1.4-1.6 for body, 1.2 for headings
- **Letter-spacing**: -0.5px on headings, 0 on body

---

## Spacing Philosophy

Space communicates aspiration. Crowded = budget. Airy = luxury.

### Section Margins

| Context | Spacing |
|---------|---------|
| Hero section top/bottom | 96-128px |
| Content section margin | 64-80px |
| Card grid gaps | 16-24px |
| Card inner padding | 16px |
| Input/button spacing | 8-16px |
| Icon spacing | 8px |
| Divider spacing | 24px above, 24px below |

### The Breathing Room Principle

Every element gets more space than it needs. If a heading could be 32px from the content above, make it 48px. The generosity communicates: "We thought about this. We care about your experience."

This is the exact opposite of a data-dense dashboard. Airbnb is not about efficiency — it's about experience and aspiration.

---

## Key Interaction Patterns

### Search Bar
The search bar is the primary call-to-action. It's large, centered, and prominent on the homepage. It opens a multi-step search flow (Where → When → Who) with visual, human-friendly inputs. The date picker is a custom calendar with photography behind selected dates.

### Card Grids
Listing cards are image-first. The photo occupies ~65% of the card, with title, price, and rating below. Images use lazy loading with a blur-up technique. Hover on desktop shows a subtle scale and shadow lift.

### Map/List Toggle
In search results, users can toggle between a card grid and a full-screen map. The map shows listings as price pins. Selecting a pin shows a card preview. This dual-view pattern is core to the browse experience.

### Booking Flow
The booking experience is designed to feel like a conversation, not a transaction. Steps are progressive: select dates → select guests → review price → confirm → message host. Each step feels intentional and guided.

### Reviews
Reviews are human-first: avatar photo, real name, date of stay, star rating, and free-text review. The design trusts the user to evaluate reviews themselves rather than computing aggregate stats.

---

## What Makes Airbnb, Airbnb

- **Photography-first design** — images are not decoration, they ARE the interface
- **Warmth as a system** — from colors to corners to copy, everything feels human
- **Coral accent** — iconic, restrained, instantly recognizable
- **Travel magazine browsing experience** — inspiration over transaction
- **Human faces** — hosts, guests, real people build trust
- **White space luxury** — breathing room communicates quality
- **Roundness** — soft corners, friendly geometry, nothing sharp or aggressive

### Anti-Patterns (What Airbnb Is NOT)

- NOT data-dense or table-heavy
- NOT corporate or blue-toned (like Booking.com)
- NOT dark mode (always light, airy)
- NOT price-aggressive (never screams "DEAL!")
- NOT sterile or minimalist to the point of cold
- NOT animation-heavy (motion is subtle and warm)

---

## Signature Moves

1. **Coral accent on white** — the pop of warmth that makes every screen recognizable
2. **Full-bleed photography** — hero images that fill the viewport
3. **Card grids with generous rounded corners** — 12px radius, soft shadows
4. **Centered search bar on homepage** — the singular CTA
5. **Heart animation on save** — a micro-interaction that feels rewarding
6. **Human-centric everything** — faces, names, stories, reviews
7. **Map/list dual view** — spatial + list browsing in harmonious toggle

---

## Brand Evolution Notes

- **2014 redesign** ("Bélo" symbol): Introduced the now-iconic symbol representing people, places, love, and the "A" in Airbnb. Controversial at launch, now beloved.
- **2016-2018**: Shift toward "Experiences" and "Trips" — expanding from stays to full travel.
- **2021+**: Post-pandemic redesign emphasizing flexible dates, categories, and "I'm Flexible" — responding to remote work and longer stays.
- **Key principle**: Every redesign returns to the core: warmth, photography, human connection.

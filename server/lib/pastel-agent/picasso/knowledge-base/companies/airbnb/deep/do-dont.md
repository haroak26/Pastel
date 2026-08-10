# Airbnb — Do This, Not That

## Photography & Imagery

### DO
- Use real, human photography of actual listings and destinations
- Let photography be the dominant visual element (not UI chrome)
- Show warm, naturally-lit photos
- Include photos of hosts as real people (not models or stock)
- Show photos with people in context (enjoying the space, local activities)
- Use landscape orientation (4:3) for listing cards
- Apply a subtle dark gradient overlay ONLY on hero images with white text
- Curate photos that feel aspirational but attainable
- Show room details (kitchen, bathroom, views, workspace)
- Use blur-up technique for progressive image loading

### DON'T
- Use stock photography — EVER. This breaks the core brand promise of authenticity
- Use heavily edited, oversaturated, or HDR-heavy photos
- Place UI elements on top of photo details (faces, key features)
- Use dark mode or dark backgrounds (the brand IS light and airy)
- Apply filters that make spaces look artificial
- Use cold/blue-toned photography — always warm
- Show empty, sterile, or staged hotel-style photos
- Use low-resolution or pixelated imagery
- Overlay text directly on listing photos (use card content area)
- Use illustrations INSTEAD of photography for destinations

---

## Color & Atmosphere

### DO
- Use coral (#FF5A5F) as the ONLY accent color — sparingly
- Keep 80%+ of the interface white or near-white
- Let photography provide the visual variety and color
- Use warm grays (#222222, #717171) for text — never pure black
- Use #F7F7F7 as secondary background (subtle section differentiation)
- Use the coral-light (#FFF2F2) for selected states, badges, highlights
- Keep the interface neutral so destinations shine
- Use green (#00A699) ONLY for success states and host badges
- Test all coral usage against WCAG AA at minimum

### DON'T
- Use coral as a background color (accent only — foreground elements)
- Introduce additional accent colors beyond coral + blue-green
- Use pure black (#000000) for any text
- Use dark mode as the primary theme
- Create colorful UI chrome — it competes with photography
- Use cold/blue grays — always use warm-toned grays
- Apply colorful gradients to UI elements
- Overuse the coral accent — restraint is the signature
- Use coral on dark backgrounds (fails accessibility)
- Add "fun" or "funky" colors that break the warm, sophisticated tone

---

## Typography

### DO
- Use Cereal (or fallback to a warm geometric sans)
- Use Book weight for headings at large sizes (light = aspirational)
- Use Book weight for body text (comfortable reading)
- Use Medium weight for emphasis — never Bold
- Give headings generous line-height (1.2-1.3)
- Give body text comfortable line-height (1.5-1.6)
- Keep text levels to a minimum — 3-4 sizes per screen max
- Use subtle negative letter-spacing on large headings (-0.3px to -0.5px)
- Left-align text for readability (center only for hero headings)
- Use warm gray for secondary/label text

### DON'T
- Use Bold or Extra Bold weights (too aggressive for the brand)
- Use all-caps for headings (too shouty)
- Condense text or reduce line-height for density (feels budget)
- Use more than 4 text sizes on a single screen
- Mix multiple type families — Cereal only
- Use italic for emphasis (the brand is warm, not literary)
- Use serif fonts (feels traditional/hotel, not modern Airbnb)
- Create text-heavy layouts — let photography breathe
- Justify text — natural rag is more human
- Use tiny text (<12px) except for legal copy

---

## Spacing & Layout

### DO
- Use generous section margins (64px+ between content sections)
- Give hero sections 96-128px padding
- Use 16px gap between card columns
- Use 24px gap between card rows
- Keep content max-width at 1280px (centered)
- Give every element more space than seems necessary
- Let white space be a luxury signal
- Use 3-4 columns for card grids on desktop
- Keep cards at consistent widths — never stretch
- Maintain generous padding inside cards (16px)

### DON'T
- Cram content to fit more on screen (this signals "budget hotel")
- Use tight spacing (8px or less) between unrelated elements
- Create data-dense grids or tables (not a hotel database)
- Use 5+ card columns (cards become too small to read)
- Make cards different heights in the same row (masonry feels chaotic)
- Stretch cards to fill empty space in rows
- Use narrow content columns (<600px for text)
- Let content run full-width on large screens (1380px+)
- Squeeze margins on mobile to fit more (keep breathing room)
- Stack sections without clear visual separation (use generous padding)

---

## Cards & Containers

### DO
- Use 12px border-radius on all cards (signature Airbnb roundness)
- Place photography in the top 65% of a card
- Keep card content area minimal: title, rating, price
- Use subtle shadows (0 2px 8px rgba(0,0,0,0.08)) on cards
- Add hover lift effect (+ translateY(-2px), + shadow depth)
- Use 16px padding for card content
- Show heart icon in top-right of cards for wishlist
- Add "Guest favorite" or "Superhost" badges on relevant cards
- Use consistent card widths within the grid
- Show carousel dots on image when multiple photos exist

### DON'T
- Use sharp/0px corners on cards (feels aggressive, not Airbnb)
- Overload card content with metadata (keep it scanning-friendly)
- Use heavy shadows (starts to feel like Material Design, not Airbnb)
- Make cards wider than 360px (loses the friendly proportion)
- Show too much text on cards — photo should dominate
- Use cards without imagery (a listing IS its photo)
- Make all cards the same width but different content heights
- Place the heart icon in a spot that covers photo content
- Use dark cards or colored card backgrounds (keeps the canvas neutral)
- Add too many badges to a single card (max 2 — "New" + "Guest favorite")

---

## Buttons & CTAs

### DO
- Use coral (#FF5A5F) for primary buttons — always, consistently
- Use secondary buttons (white + border) for non-primary actions
- Use ghost buttons (transparent + coral text) for tertiary actions
- Keep button border-radius at 8px
- Minimum button height of 48px (finger-friendly)
- Use 16px Medium for button text
- Show loading spinner in the same color on wait states
- Place one clear primary CTA per view
- Use the "Show all" pattern for progressive disclosure

### DON'T
- Use coral for secondary/tertiary actions (dilutes the accent)
- Create multiple competing primary CTAs on one screen
- Use different accent colors for buttons in different contexts
- Make buttons smaller than 48px for primary actions
- Use text-only links for primary CTAs (needs the button presence)
- Create buttons with square/sharp corners
- Use gradient buttons (too trendy, not timeless)
- Stack more than two buttons in a group
- Make disabled buttons the same color as active (confusing)
- Use the "Book Now" language (too transactional — "Reserve" or "Check availability")

---

## Forms & Inputs

### DO
- Use 56px height for input fields (generous touch target)
- Place labels ABOVE inputs (12px, warm gray)
- Use 8px border-radius on inputs
- Show clear, human-focused placeholder text
- Use coral for error states on inputs (border + message)
- Group related inputs (dates side-by-side, guest counters)
- Show inline validation as users complete fields
- Use warm, conversational error messages ("Please enter a valid date")
- Show password visibility toggle

### DON'T
- Use standard 40px input height (feels cramped, not premium)
- Place labels inside inputs (disappears on focus — accessibility issue)
- Use aggressive red (#FF0000) for errors (coral is warm enough to signal error)
- Show all errors at once on submit (show inline as they're discovered)
- Use cold/clinical error language ("Validation error #405")
- Create multi-column forms (single column is more scannable)
- Require unnecessary fields (every field costs conversion)
- Use dropdown menus for small option sets (use radio buttons or chips)

---

## Icons & Symbols

### DO
- Use custom icons with 2px stroke weight
- Keep icons at 24x24 default, 16x16 for inline
- Color icons in #222222 (primary text) by default
- Color active/selected icons in coral (#FF5A5F)
- Use rounded caps and joins (matches the brand warmth)
- Always pair icons with text labels on primary navigation
- Use distinct, recognizable metaphors (house = home type, star = rating)

### DON'T
- Use Material Design icons (feels like Google, not Airbnb)
- Use filled/3D icon styles (outline style is more sophisticated)
- Color icons in any accent other than coral
- Use icons without text labels for primary actions
- Make icons the primary visual on cards (photos should dominate)
- Create overly detailed or complex icons
- Use the same icon for different meanings across screens

---

## Reviews & Social Proof

### DO
- Show real names and avatars for reviews
- Display star ratings prominently (16px stars, coral)
- Show the date of stay on each review
- Show rating distribution bar chart on listing detail
- Allow scroll through all reviews inline
- Show host responses indented with a subtle left border
- Highlight frequently mentioned keywords ("clean," "view," "location")
- Show aggregate rating at the top of the review section

### DON'T
- Show anonymous reviews or "Verified Guest" without names
- Use rating sliders or overly complex review UIs
- Filter or curate reviews to show only positive ones
- Hide the date of stay (recency matters for trust)
- Use small or low-contrast stars (rating is critical trust signal)
- Show a "score" without the distribution breakdown
- Bury reviews deep in the page (they're central to the listing)
- Use algorithmic "guest score" — show real human reviews only

---

## Trust & Transparency

### DO
- Show full price early, with fee breakdown before payment
- Display cancellation policy BEFORE the confirm button
- Show host response rate and response time
- Display Superhost badge prominently when applicable
- Show that "You won't be charged yet" on the Reserve button
- Include clear confirmation screens with trip summary
- Provide host message prompt after booking
- Show the neighborhood map (approximate, not exact, for privacy)

### DON'T
- Hide fees until the final payment screen
- Bury cancellation policy in a collapsible drawer
- Use aggressive scarcity tactics ("Only 1 left!" "12 people are looking!")
- Show exact host address before booking is confirmed
- Make cancellation or refund policies hard to find
- Fail to confirm booking with a clear success screen
- Skip the host introduction/personalization step
- Show cryptic error messages that scare users about their payment

---

## Motion & Animation

### DO
- Use 250ms as the default transition duration
- Use 350ms for modals, panels, and larger transitions
- Apply subtle lift on card hover (translateY(-2px))
- Animate the heart icon with a scale bounce (300ms spring)
- Fade-in new content as it enters the viewport
- Smooth horizontal slide for date picker months
- Use `cubic-bezier(0.4, 0, 0.2, 1)` as the default easing

### DON'T
- Use animations faster than 150ms (feels jumpy, cheap)
- Use animations slower than 500ms (feels sluggish)
- Scroll-jack or override native scroll behavior
- Animate EVERYTHING (motion should be purposeful, not decorative)
- Use bouncy/spring animations on functional elements (only on hearts)
- Auto-play carousels without user control
- Flash or blink elements for attention
- Use parallax effects that cause layout shift or jank

---

## Mobile-Specific

### DO
- Use full-width cards in a single column
- Make search the primary home screen interaction
- Keep the map/list toggle accessible at bottom
- Use large touch targets (min 48px for interactive elements)
- Bottom tabbar for primary navigation
- Sticky booking card at bottom of listing detail
- Horizontal scroll for category tabs (not grid)
- Date picker as single month, vertically scrollable

### DON'T
- Force the map view on mobile (cards first, map toggle)
- Shrink content padding to fit more (keep 16px body padding)
- Use hover states as the only interaction cue
- Create horizontally scrollable cards (single vertical scroll is better)
- Hide the search bar on scroll away from home
- Use desktop modals on mobile — use bottom sheets
- Put primary actions in the header (use thumb zone at bottom)

---

## What Makes Something Feel "Non-Airbnb"

These are the telltale signals that a design has drifted from the Airbnb brand. If you see any of these, fix them:

1. **Stock photography** — the single biggest violation. Airbnb = real.
2. **Dark backgrounds** — Airbnb is light, airy, aspirational. Dark mode is not the brand.
3. **Blue accent instead of coral** — coral IS Airbnb. Any other accent color feels wrong.
4. **Sharp/border-radius-0 corners** — Airbnb's warmth comes from soft geometry.
5. **Data-dense tables or grids** — Airbnb is browsing, not data analysis.
6. **Cold/blue-tinted grays** — warm grays are subtle but critical to the feel.
7. **Multiple competing accent colors** — one accent: coral. That's the system.
8. **Aggressive sales language** — "DEAL!" "Only 1 left!" "ACT NOW!" — this is not the voice.
9. **Corporate jargon in copy** — "solutions," "offerings," "leverage" — no.
10. **Tiny, cramped typography** — generous text = generous brand.
11. **Heavy/oversaturated UI colors** — the interface should be neutral; photography provides color.
12. **Auto-playing video with sound** — intrusive, not warm and inviting.

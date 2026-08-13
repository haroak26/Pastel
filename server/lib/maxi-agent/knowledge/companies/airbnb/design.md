# Airbnb design language

## When to reach for this reference
Use Airbnb's design language when building marketplaces, community platforms, travel or hospitality products, or any consumer-facing service that needs to feel warm, human, and globally inclusive. It is the right reference for products where trust between strangers is the core value proposition, and where emotional warmth must be balanced with clarity of information (pricing, dates, reviews).

## Brand personality
Warm, open, and inviting — like a well-traveled friend recommending their favorite neighborhood. Airbnb projects a sense of belonging. The brand personality is simultaneously cosmopolitan and intimate: it speaks to both the thrill of discovering a new city and the comfort of settling into a home. There is earnestness in the mission-driven copy and a softness in the visual language that makes the product feel generous rather than transactional.

## Color philosophy
The signature coral accent (`#FF385C`) is the heartbeat of the palette — warm, energetic, and unmistakable. It appears on the primary CTA, the logo mark, favorite hearts, and key interactive highlights. The background palette is dominated by crisp whites (`#FFFFFF`) and warm off-whites (`#F7F7F7`) that echo the feeling of clean linens and sunlit interiors. Supporting neutrals are warm gray, never cool. The extended palette includes muted earth tones (terracotta, sage, warm ochre) used sparingly in illustrations and category icons. Dark mode shifts to deep warm grays, with the coral remaining vibrant against darker surfaces.

## Typography approach
Friendly, readable, and globally aware. Airbnb historically used Circular (a geometric sans-serif by Lineto) for headings — a typeface that feels modern but approachable with its round, humanist letterforms. Body text uses a well-tuned system font stack or Cereal, their custom typeface designed specifically for on-screen legibility across dozens of languages. Weights stay within a narrow band (regular to bold). Nothing is ever set in light or thin weights, which would undercut the warmth. The hierarchy uses size more than weight for differentiation. All-caps appears only in very small UI labels and never in headings. Multilingual considerations are first-class: CJK fallback stacks are carefully specified, and type sizes account for non-Latin script legibility.

## Spacing & density
Breathing room is essential. Cards and content blocks are separated by 16–24 px gutters. The search results grid uses generous image-led cards with 24–32 px padding inside. On mobile, content is predominantly single-column with full-bleed imagery and comfortable touch targets (48+ px). The overall density is light — the UI feels curated, not crammed. Negative space around listing photos gives them gallery-like presentation. Forms (booking, messaging) get ample vertical rhythm (16–20 px between fields) to feel unhurried.

## Corner radius & shape language
Soft and consistently rounded. Cards and image containers use 12–16 px border-radius. Buttons and pills use 8–10 px fully rounded ends (not pills, but generously rounded rectangles). The search bar is famously a fully rounded capsule, making it feel like a friendly invitation rather than a cold input field. Category icon circles are perfectly round. Map pins are soft teardrop shapes. The overall geometry avoids sharp corners entirely — even the smallest interactive elements (tags, chips) receive at least 4 px of rounding. This softness reinforces approachability and safety.

## Elevation & depth
Subtle and atmospheric. Cards on the search results page float on very soft shadows (0–6 px blur, very low opacity) that suggest a gentle lift rather than dramatic depth. The primary navigation bar uses a slight translucent blur over content, similar to iOS patterns. Modals and sheets rise with a slightly more pronounced shadow and a dimmed backdrop. The overall depth model is flat enough to feel modern but layered enough to communicate information hierarchy. Drop shadows are always warm-tinted (never pure black) to match the palette.

## Iconography & imagery
Icons are hand-drawn in spirit if not in execution — they favour slightly organic shapes over geometric precision. Stroke weights are light (1–1.5 px), end caps are rounded, and filled variants are rare. Category illustrations are playful, colored in the muted earth-tone palette with soft gradients and textured finishes. Photography is the absolute hero of the product: listing photos are displayed large, uncropped when possible, and rendered at high resolution. The product treats photos as the user's primary decision-making tool and gives them as much real estate as the layout allows. Human presence is ubiquitous — hosts, guests, and community members appear throughout the UI to reinforce the people-to-people nature of the platform.

## Signature patterns
- **The hero search bar** — a prominent, pill-shaped, shadow-casting input that anchors every landing experience
- **Category icon strip** — a horizontally scrollable row of illustrated icons that makes browsing feel exploratory rather than parametric
- **Host and guest profiles with verified badges** — identity cues that build trust: photos, reviews, response rates, and verification indicators
- **Saved/favorited items with heart animations** — the coral heart fills with a brief micro-animation that feels rewarding
- **Split-layout listing pages** — photo gallery dominates the top, structured info below, map sidebar on desktop
- **Trust-building interstitial prompts** — modals and tooltips that explain safety features, cancellation policies, and review processes without feeling legalistic

## Motion philosophy
Smooth, reassuring, and grounded. Page transitions use 250–350 ms ease-out curves. The heart/favorite animation is a satisfying pop that scales from 0.8 to 1.1 to 1.0 with a spring — quick enough to feel responsive, bouncy enough to feel delightful. Scroll behavior on listing pages uses sticky headers that slide in smoothly. Map interactions (pin drops, area highlights) use subtle fades. Loading states use shimmer skeletons that match the content shape and feel polished. The overall motion personality is unhurried confidence — nothing jerks, nothing races.

## Voice & copy tone
Conversational, optimistic, and community-centered. Copy addresses the user directly as "you" and speaks about hosts and guests with warmth and respect. Sentences are short and rhythmic. Headlines on marketing and landing pages are aspirational but grounded — "Belong anywhere" level of sentiment, executed through specific, relatable stories. Transactional copy (confirmations, receipts, policies) is clear and friendly. Error messages are empathetic and solution-oriented: "We couldn't complete that booking. Let's find another place to stay." The copy never feels corporate, legalistic, or cold.

## Explicitly do not
- Do not reproduce Airbnb logos, the Bélo symbol, wordmarks, or trademarked assets
- Do not copy Airbnb's UI copy, taglines, or marketing headlines verbatim
- Do not build interfaces that replicate Airbnb's unique search, booking, or review workflows
- This reference describes a design language to draw from — it is not a license to clone any specific Airbnb interface

# Mercury design language

## When to reach for this reference
Use this reference when building fintech dashboards, banking interfaces, investment tools, or any financial product that needs to convey precision, trust, and clarity. Mercury's language works especially well for data-heavy screens, transaction flows, and analytics panels where users need to scan numbers quickly and act without hesitation.

## Brand personality
Mercury projects quiet confidence and technical competence without feeling cold. It is the design equivalent of a well-cut suit — tailored, precise, and serious about the work but never ostentatious. The personality avoids both startup-playful and legacy-bank-stodgy, landing instead on a restrained, modern professionalism that appeals to founders, CFOs, and finance teams who value clarity over decoration.

## Color philosophy
Build from a crisp white or deep navy base — these are your structural anchors, never both at the same prominence in one surface. White-background surfaces dominate for reading-heavy screens (tables, forms, statements), while navy works as a grounding backdrop for dashboards and overviews. Introduce a single restrained accent color — a specific teal, a muted gold, or a cool mint — and deploy it sparingly: one interactive element per view, one data-series highlight, one status indicator. Avoid accent-on-accent. Neutral grays serve the information hierarchy; they should recede, not compete. Avoid warm grays in favor of cool, blue-leaning neutrals that reinforce the financial, analytical tone.

## Typography approach
Type is the primary tool for building trust here. Use a clean, neutral sans-serif for UI — Inter, SF Pro, or a custom geometric sans with tall x-height — at tight line-heights (1.2–1.4 for data, 1.4–1.5 for prose). The defining move is monospace for numerals: tabular figures in tables, transaction amounts, account numbers, and any place where numbers must align for scanning. This is not a decorative choice; it is a functional signal that says "we take your numbers seriously." Weight hierarchy is minimal — regular and semibold are enough; bold is reserved for totals and page titles. Never use italic for financial data.

## Spacing & density
Information density is high by necessity but never crowded. Generous padding on cards and containers (24px minimum) offsets the density within tables and lists. Table rows use 40–48px heights with 12–16px horizontal cell padding. Vertical rhythm matters: group related metrics with 8px gaps, separate sections with 32px. White space is a deliberate framing device, not an absence of content — use it to create breathing room around key numbers and CTAs.

## Corner radius & shape language
Tight, near-sharp corners: 4–6px on cards, 4px on inputs and buttons, 2px on tables. The slight rounding softens without feeling playful. Containers are rectangular and efficient. Data visualizations use clean, hard-edged bars or crisp line charts — no unnecessary curvature that could be read as imprecise. Icon buttons and floating actions can use a pill shape (fully rounded ends) as the one concession to soft geometry, but sparingly.

## Elevation & depth
Depth is flat-to-minimal. Prefer 1px hairline borders over drop shadows for card separation on white backgrounds. On navy backgrounds, use subtle 2–4px blurred shadows to lift cards just enough that they read as distinct surfaces without calling attention to the effect. Avoid layered elevation (cards on cards). The goal is to feel like a crisp printed statement, not a physical object.

## Iconography & imagery
Icons are functional and precise, drawn at 20px or 24px with 1.5px–2px stroke weights. Use a consistent outlined style from a single icon set (Phosphor or Lucide). Imagery is abstained from almost entirely; when a visual is necessary — onboarding illustrations, empty states — use geometric, single-accent-color line art with generous negative space. Never use photography. Brand illustrations should feel like technical diagrams that happen to be friendly.

## Signature patterns
Tabular-data-first layouts with monospace numerals locked in fixed-width columns; the single-accent data-series highlight in otherwise grayscale charts; the navy sidebar + white content area split; status badges with the accent color on a barely-tinted background; inline transaction rows that expand inline for detail rather than opening modals; a persistent "balance" or "summary" bar that follows the user down the page.

## Motion philosophy
Motion is utilitarian: 150–200ms ease-out transitions on hover states, 250ms on page transitions, and no bounce or overshoot. Components appear and disappear with subtle opacity fades. Use motion to direct attention when something changes (a new transaction appears, a balance updates) but never for decoration. The test: if a user with motion sensitivity turns on `prefers-reduced-motion`, the interface should lose nothing functional.

## Voice & copy tone
Direct, clear, and impersonal in the best way. No exclamation marks. No "Hey there!" greetings. Use sentence case for labels, title case for page headings. Numbers are presented without flourish — "Balance: $42,831.12" not "Your current balance is $42,831.12!" Error messages explain what happened and what to do next in plain language. The copy treats the user as a competent professional.

## Explicitly do not
- Do not reproduce Mercury's logo, wordmark, or any trademarked assets.
- Do not copy Mercury's UI copy, taglines, or branded messaging verbatim.
- This reference describes a design language to draw inspiration from, not a license to clone Mercury's product or visual identity.

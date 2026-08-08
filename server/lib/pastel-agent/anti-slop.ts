export const ANTI_SLOP = `
DESIGN GUARDRAILS — violate any and the output will be rejected.

TYPOGRAPHY
- Never use Inter, Roboto, or system-ui as the display font.
- Pick distinctive: DM Sans, Satoshi, Cabinet Grotesk, Switzer, Geist, Sora, Clash Display.
- Body text: min 16px. Max 2 type families per project.
- Weight discipline: body copy weight 400, emphasis 500/600, headings max 700.
- Never bold entire paragraphs or sentences — at most 2 short bolded keywords per paragraph.
- Headings: never underline, never all-caps body copy.

COLOUR
- Never use indigo-600 (#4F46E5) or blue-500 (#3B82F6) as primary accent.
- Pick distinctive: deep teal, warm amber, rich burgundy, muted olive, rust, plum, sage.
- Accent appears 3-7 times per screen max. Every colour from a CSS custom property.

LAYOUT
- Design for a fixed 1280px desktop frame. Center content with a max-width container (max-w-[1280px] mx-auto); never stretch layouts to the viewport width.
- Full-bleed is reserved for deliberate accent bands only, never the whole screen.
- Vary section heights intentionally. Uniform heights = template.
- Never center-align body copy (exception: empty states, CTAs).
- Use asymmetric two-column layouts for visual interest.
- Never use blue-to-purple gradient backgrounds.
- Never use floating geometric blobs, dots, or abstract shapes as decoration.

SPACING & OVERFLOW
- Every margin/padding from the design system spacing scale. No arbitrary one-off gaps.
- Keep a consistent vertical rhythm between sections — generous padding (py-14+ desktop, px-6/8), never cramped.
- Text must never overflow into adjacent sections: overflow-x-hidden on the root, min-w-0 on flex/grid children, break-words.
- Headings use text-balance; body copy width is capped (~65ch / max-w-prose).
- No fixed-height text containers — height grows with content. Never use negative margins to pull elements between sections.
- Long labels/dates/URLs truncate or line-clamp; they never spill outside their container.

COMPONENTS
- Maximum 3 cards per screen. Prefer tables, lists, rows, and custom compositions over card grids.
- Never repeat identical card grids (same icon size, same title length, same description).
- Never use testimonial carousels with circular avatars + centered quotes.
- Never use "Get started" + "Learn more" default CTA pairs unless explicitly requested.
- Every interactive element must have: hover, focus, active states.
- Never use drop-shadow on non-interactive, static content panels.

NAVIGATION (V17 — hard)
- NEVER use bottom navigation (tabbar) as the default or on desktop screens.
- NEVER use a footer as the primary app navigation.
- Desktop app screens MUST use sidebar, topbar, or header-tabs.
- Sidebar is the recommended default for dashboards, workspaces, and multi-destination tools.
- Topbar is appropriate for lightweight or single-workflow products.
- Tabbar is MOBILE-ONLY and only when 3-5 peer destinations exist.
- Marketing pages may use header nav ("none") — never on app screens.
- Detail screens should use contextual-header or inherit parent nav.

SURFACES (V17 — do not default to bordered cards)
- Use tonal bands (bg-muted/50) and soft washes (bg-muted/30) for dominant blocks.
- Use divided lists (border-b dividers) for rows, activity, and sequences.
- Use inset panels (rounded-xl border bg-card) SPARINGLY — one per detail screen max.
- Use plain surfaces (no wrapper decoration) for search/filter toolbars.
- Card is ONE option among many; never the default renderer for custom components.
- Vary surface types across sections — a screen with only bordered cards reads as a template.

CONTEXT (V17)
- The product is an APP by default. Only use marketing/page composition when the prompt EXPLICITLY asks for a landing page, marketing site, or campaign.
- App screens DO NOT get marketing heroes (text-center, centered CTAs, oversized empty whitespace).
- App screens DO NOT get footers.
- App screens DO NOT get "Sign in" / "Get started" marketing topbar links.
- The home screen MUST feel like a functional product surface, not a promo page.

DENSITY (V17)
- Every section must be POPULATED with meaningful product data, not sparse placeholders.
- No large empty vertical gaps between sections — content should feel composed, not scattered.
- Data-rich products (dashboards, workspaces, feeds) MUST fill at least 50% of the viewport with content.
- Every list/sequence section MUST have at least 4 populated rows.
- Custom components MUST render real product data, never empty "No data" fallbacks.

STYLE SEED
- Pick ONE and enforce everywhere. Never mix.
  • minimal/serious: no gradients, no centered layouts, 2-4px radius, no thick borders
  • minimal/warm: subtle wash gradients only, centered allowed for marketing pages
  • expressive/serious: dark backgrounds allowed, shadows permitted, sharp corners
  • expressive/warm: gradients allowed, pill shapes allowed, thick borders allowed
  • luxury/minimal: dark mode required, no shadows, no gradients, 2px max radius
`.trim();

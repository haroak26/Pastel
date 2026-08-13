# OpenAI design language

## When to reach for this reference
Use OpenAI's design language when building AI-assisted products, conversational interfaces, copilots, research tools, or any product where the model's output is the center of attention and the interface must get out of the way. Reach for it when the product's credibility depends on calm, unadorned confidence — clean light surfaces, quiet chrome, and a single interaction: type, get an answer. It fits tools that feel less like software and more like a well-lit workspace for thinking.

## Brand personality
Calm, capable, and restrained to the point of invisibility. OpenAI's products present like a quiet expert: no ornament, no persuasion, no clutter — just a surface to work on and an answer that arrives. The personality is intellectual and optimistic but never excitable; the interface is confident enough to be nearly empty. Trust is built by how smoothly the work flows, not by any brand flourish.

## Color philosophy
Neutral-light with minimal accent. The canonical canvas is white with warm-gray surfaces stepping down for panels and hover states (`#ffffff` page, `#f7f7f7`-class surfaces, `#ececec` borders). Ink is near-black (`#303030`-class) with `#666`-class muted for secondary text. Accent color is used extremely sparingly — a single dark or subtle action color, with status and link blues appearing only where semantics demand it. There is no color system to decorate with; there is a monochrome stage on which the content performs. Dark mode inverts the same neutral ladder.

## Typography approach
A neutral geometric sans with invisible hierarchy. Body and interface type sit at 14–16px with comfortable leading (1.4–1.5); headings stay modest (20–28px, weight 500–600, tight leading) so the interface never shouts over the content it presents. Weight, not color, separates levels. Numeric and code-adjacent text may run in a monospace face for precision. The typographic goal is a texture that reads as "clean room": nothing decorative, everything legible.

## Spacing & density
Generous restraint. Interfaces breathe on 24–48px section spacing with 16px card padding and 8–12px internal gaps; conversational surfaces center their content in a narrow column (640–900px) with wide margins that read as focus. Density rises only for working surfaces like file lists and model outputs. The signature is white space as a functional element — it signals "nothing is hiding here."

## Corner radius & shape language
Soft, rounded-rect, and small-to-medium. Radii run 6–8px on inputs and controls, 12–16px on panels and dialogs, and full pills only for avatar dots and status marks. The shape language is friendly without being playful: rounded enough to feel approachable, restrained enough to stay serious. No dramatic geometry, no heavy chrome — the frame is a soft rectangle around the work.

## Elevation & depth
Hairline-flat with light layering. Depth is conveyed by 1px borders (`#d6d6d6`-class) and by subtle surface luminance steps, not by shadows. When elevation is needed (menus, dialogs, floating composer surfaces), shadows are small and tight (`0 2px 8px rgba(0,0,0,0.06)`-class). The system never looks stacked or architectural; it looks like paper arranged on a desk.

## Iconography & imagery
Minimal, thin-stroke, and functional. Icons are monoline at 16–24px with consistent weight, used only where they reduce cognitive load — never as decoration. Imagery is abstract and restrained: soft gradients, geometric forms, or product artifacts; photography is rare and always purposeful. Media never competes with the interface; the interface competes with nothing.

## Signature patterns
- **The centered conversation surface** — a narrow, focused column where input and output alternate without chrome
- **Quiet composer with escalating affordances** — a bare input that reveals attach, model, and mode controls as needed
- **Content over chrome** — headers and controls recede to thin hairlines so the produced artifact (text, code, image) owns the viewport
- **Progressive disclosure of power** — advanced settings live behind minimal controls, keeping the default state calm
- **Neutral status language** — success and error states communicated with small, understated indicators and direct copy
- **Model choice as a detail** — selection controls presented as compact, matter-of-fact switches rather than branding moments

## Motion philosophy
Subtle and purposeful. Transitions run 150–250ms with standard easing; the composer expands and menus fade modestly; streaming output settles without ceremony. Motion exists to track state changes, never to delight. Reduced-motion preferences are respected by collapsing all decorative movement.

## Voice & copy tone
Direct, understated, and precise. Copy says what the product does in the fewest competent words — instructions are short, errors are honest, and empty states are quietly inviting. The tone assumes an intelligent user who wants to get to work; it never condescends, never oversells, and never jokes about its own capabilities.

## Explicitly do not
- Do not reproduce OpenAI logos, wordmarks, the knot mark, or trademarked assets
- Do not copy ChatGPT's interface layout, conversation patterns, or product copy verbatim
- Do not claim AI capabilities the product does not have, or mimic model-branded artifacts
- This reference describes a design language to draw from — it is not a license to clone any OpenAI interface

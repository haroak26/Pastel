# Arc design language

## When to reach for this reference
Use this reference when building products that want to feel unexpected, aesthetic-forward, and opinionated. Arc's language applies to browsers, creative tools, media apps, and any interface where the chrome should feel like a curated experience rather than a generic utility. It is especially relevant when gradients can serve as a core brand signature rather than a decorative afterthought.

## Brand personality
Arc carries a rebellious, taste-driven personality — the browser that treats the web as a canvas rather than a filing cabinet. It is expressive without being chaotic, modern without being cold, and playful without being childish. There is an editorial sensibility at work: every surface feels intentional, every color choice feels curated, every animation feels choreographed. Arc presents itself as the more interesting, more thoughtful alternative — and the design language works hard to earn that positioning at every touchpoint.

## Color philosophy
Gradients are the brand signature and the primary differentiator. Arc deploys rich, multi-stop gradients — pink-to-purple-to-blue, coral-to-orange-to-yellow, teal-to-mint-to-cyan — as full-surface treatments on backgrounds, headers, and feature panels. These are not subtle. They are bold, saturated, and unmistakably intentional. The key discipline: gradients always feel smooth, high-quality, and atmospheric — never garish or clipped. Outside of gradient surfaces, the UI drops to a near-monochrome palette: dark grays and off-whites that frame the color rather than compete with it. One gradient per view. Supporting neutrals are warm-toned.

## Typography approach
UI type is clean and contemporary — Inter, SF Pro Rounded, or a similar geometric sans — typically at 13–15px with slightly looser line-height (1.5) than utilitarian tools, which gives the interface a more editorial, breathable feel. Headlines in marketing surfaces or onboarding screens may use a display weight (bold or black) with tight tracking. The typography mix should feel considered rather than default: perhaps a distinctive sans for headings and a neutral workhorse for body. Type reinforces the curated, taste-driven positioning — do not use system defaults without refinement.

## Spacing & density
Arc is notably less dense than productivity tools. It trades information density for visual calm. Generous 16–24px padding on cards and panels. Sidebars and toolbars are wider and more open (280–320px). Lists of tabs, spaces, or bookmarks use 40–48px row heights with visible spacing between items. The overall feel is airy, curated, and slightly magazine-like — content is framed rather than crammed. Empty space is a design element, not an inefficiency.

## Corner radius & shape language
Soft rounding is a defining characteristic: 12–16px on major containers and panels, 8–10px on buttons and inputs, 20px+ on pill-shaped elements and floating actions. The softness signals approachability and modernity — these are friendly shapes, not industrial ones. Cards and panels often use a continuous or "squircle" corner profile (like iOS app icons) that feels more organic than simple border-radius. The sidebar/tab containers often use asymmetric rounding — rounded on one edge, flush on another — to create a sense of the interface being carved from a single surface.

## Elevation & depth
Depth is atmospheric rather than structural. Arc uses glass-like translucency (backdrop-filter blur) extensively — the sidebar, the toolbar, the peek panels — creating a sense of layered frosted glass rather than stacked cards. Shadows are diffuse and tinted (colored shadows that match the gradient palette) rather than neutral gray. The built-in "Boost" and "Easel" surfaces use a distinct elevated panel with extra shadow and rounding that signals "this is a different kind of space." Depth is emotional and spatial, not just organizational.

## Iconography & imagery
Icons are refined, slightly rounded, and consistent — a custom or carefully selected icon set (SF Symbols rounded variant, or custom line icons with rounded caps and joins) drawn at 18–20px with 1.5px–2px strokes. The rounded stroke terminals contribute to the overall softness. Imagery is rich and editorial: high-quality photography, atmospheric gradient backgrounds, and custom illustrations that match the gradient color palette. Screenshots and previews are framed with soft shadows and rounded corners, presented like gallery pieces rather than documentation.

## Signature patterns
The gradient sidebar that transitions smoothly between hue zones as the user navigates between spaces. The split-view interface with a drag handle styled as a subtle gradient-line. The Command Bar (⌘T) that opens with a backdrop-blur overlay and presents a centered, rounded search palette. The "peek" interaction — a temporary panel that slides in from the side with translucency. The space-switching animation that cross-fades between gradient environments. Tab management reimagined as spatial organization rather than a horizontal row.

## Motion philosophy
Motion is a core differentiator for Arc — it is expressive, polished, and generous. Page transitions use 300–400ms spring animations with gentle overshoot. The sidebar expand/collapse uses an elastic ease-out that feels physical and satisfying. The command palette animates in with a scale-and-fade (0.95 → 1.0) that makes it feel like it materializes. Scroll-based gradient shifts (parallax-like hue transitions in the background as content scrolls) create a sense of depth and responsiveness. Every motion feels tuned, not default. Use spring physics, not linear easings.

## Voice & copy tone
Confident, opinionated, and slightly irreverent. Arc's copy has a point of view — it refers to features as "powers," describes the product as "the browser that doesn't just browse," and isn't afraid of personality. Release notes and onboarding flows use warm, human language that treats the reader like a co-conspirator in a better way of doing things. Error messages are friendly and helpful. Marketing and product copy share the same voice — there is no tonal split between brand and interface. Sentence case is used throughout.

## Explicitly do not
- Do not reproduce Arc's logo, wordmark, or any trademarked assets.
- Do not copy Arc's UI copy, taglines, or branded messaging verbatim.
- This reference describes a design language to draw inspiration from, not a license to clone Arc's product or visual identity.

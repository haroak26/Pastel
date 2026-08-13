# GitHub design language

## When to reach for this reference
Use GitHub's design language when building developer platforms, code-hosting and collaboration tools, CI/CD products, engineering analytics, or any technical product where credibility and trust come before decoration. It fits dark-first developer marketing surfaces, product docs, and dense tools serving engineers who judge software by how fast it feels. Reach for it when the audience is technical, the palette should stay near-monochrome, and a single accent color is expected to carry the interactive identity.

## Brand personality
Quietly monumental. GitHub speaks like the infrastructure the world's code runs on: serious, collaborative, and precise — "the future of building happens together" without needing to shout. The personality is technical and warm at once: crisp, confident copy that treats the reader as competent, with a cooperative undertone (building together, open source, community). There is no playfulness, no hype, and no marketing gloss — the brand earns conviction through function.

## Color philosophy
Near-black-first with color used as a functional signal, never decoration. The canonical canvas is deep black (`#000000` to `#11151f` surfaces), with white (`#f0f0f0`) as the primary ink and gray (`#9a9a9a`) for muted text and metadata. A single green (`#3fb950`) carries the primary interactive identity — buttons, active states, success and focus accents. Purple (`#8250df`) and blue (`#2f81f7`) belong to media, illustrations, and branded artwork rather than functional UI. Borders are hairline grays (`#242424`) that separate without elevating. The system is monochrome by default, with color reserved for the few places that must attract the eye.

## Typography approach
A system sans stack (`-apple-system, BlinkMacSystemFont, Segoe UI`) with no display face. Headlines are modest — 28–34px at weight 600 with tight leading (1.05) — so the strongest statement stays understated. Section headings run 20–24px at weight 500. Body copy is small (13–15px) with 1.35 line-height, and dense code-adjacent detail (monospace where needed) reads at 12–13px. Hierarchy is built from weight and scale rather than color: white for primary copy, gray for secondary, green only for action. Centered type is reserved for moments of announcement; working copy stays left-aligned and dense.

## Spacing & density
Spatial discipline with generous vertical rhythm and compact working rows. Sections breathe on 72–128px vertical padding; the content rail caps near 1160px. Cards and lists compress to 16px padding with tight internal gaps, because the product's working surfaces are dense by nature. The system alternates expansive announcement sections with dense, left-aligned working blocks — the contrast between breathing room and information density is itself a signature.

## Corner radius & shape language
Small and rectilinear. Radii run 4px (buttons, inputs, small chips) to 6–8px (cards, panels); pills exist only for status badges. The geometry is architectural — the platform's shape language is the rectangle, the grid, and the hairline divider. Nothing bubbles, nothing floats in organic curves; even media frames are clean rectangles with 1px borders.

## Elevation & depth
Flat, border-defined elevation. Depth comes from 1px strokes (`#242424` on black, subtle grays on light) and from luminance steps between surfaces (`#000` → `#11151f` → `#1c2128`-style raises) rather than from shadows. Glow is allowed in exactly one place: a soft blurred color bloom behind hero media — the single permitted atmospheric effect. Hover states brighten borders or introduce a faint fill; focus is a 2px offset outline in the accent green.

## Iconography & imagery
Geometric, monoline icons at 16–24px with consistent stroke weight, drawn on grid. Octicons-style marks are simple, functional, and never decorative. Imagery is photography of people building or abstract dark media frames with color glows — no cartoons, no 3D renders, no stocky gradients. Media placeholders are legitimate design elements: dark rectangles with 1px borders that frame product shots or remain intentionally empty. Illustrative color (purple/blue) lives inside media, not in the UI chrome.

## Signature patterns
- **The mono-accent action system** — exactly one green action per view; everything else is outlined or ghost
- **Hairline-divided dense lists** — repository-style rows and feature grids separated by 1px strokes
- **Media frames as design elements** — dark bordered rectangles that hold product imagery or sit empty with intent
- **Centered announcement moments** — headline + subline + two compact actions over media, used sparingly between working sections
- **Utility-first chrome** — tiny top navigation with bare links and compact controls; the interface stays out of the way
- **Status as color** — green/amber/red reserved for build and state signals, never used for branding

## Motion philosophy
Fast, functional, and barely perceptible. Hover transitions run 100–150ms (border brightening, faint glow intensification); focus rings appear instantly. Media glows fade in over 200–300ms. Motion respects reduced-motion preferences by disabling glow and brightness transitions entirely. Nothing slides, bounces, or announces itself — movement exists only to confirm state.

## Voice & copy tone
Collaborative, concrete, and terse. Copy speaks to builders: "Build together", "Automate", "Ready to get started?" Labels name things plainly; headings describe outcomes, not feelings. The tone is confident without arrogance, technical without jargon walls, and consistently plural — the reader is part of a building community, not a customer being sold to.

## Explicitly do not
- Do not reproduce GitHub logos, wordmarks, the octocat mark, or trademarked assets
- Do not clone GitHub's repository, issue, or code-review UI structure or data models
- Do not copy GitHub's product copy, documentation structure, or icon set verbatim
- This reference describes a design language to draw from — it is not a license to clone any GitHub interface

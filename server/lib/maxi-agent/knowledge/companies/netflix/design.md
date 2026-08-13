# Netflix design language

## When to reach for this reference
Use Netflix's design language when building entertainment products, streaming apps, media-browsing experiences, subscription services, or any dark-first consumer product where content is the star. Reach for it when the goal is cinematic immersion: near-black canvases, poster-scale imagery, bold red action moments, and a conversion or acquisition flow that must feel effortless. It fits products whose primary job is getting someone to press play — or to sign up to press play.

## Brand personality
Bold, cinematic, and utterly confident. Netflix behaves like a premium entertainment brand: it announces with scale (giant typography, full-bleed imagery), then gets out of the way so the content can perform. The personality is passionate but never jokey — "cancel anytime" is reassurance, not comedy. It is the brand of a night in: dramatic, warm, and quietly irresistible, promising immersion before explanation.

## Color philosophy
Black-first with a single red accent that owns the brand's interactive moments. The canvas is true black (`#000000`), with surfaces layered at `#181818` and panels at `#232323`. Ink is white (`#f5f5f5`) with gray (`#b3b3b3`) for metadata — never gray for primary copy. The signature red (`#e50914`, hover `#b20710`) is reserved for the primary action: sign-in, get-started, play. Violet and pink tints appear in supporting surfaces (benefit cards, transition bands) as atmospheric color, not as competing accents. The rule is absolute hierarchy: black carries, red acts, content shines.

## Typography approach
A neutral sans (Arial/Helvetica-class) with aggressive scale used as the loudest brand instrument. Hero statements run 48px at weight 700 with 1.1 leading; section headings are 24px bold; body is 16px with 1.4 leading; metadata sits at 14px. Weight is the hierarchy — Netflix's headlines are heavy, centered, and unmissable. In a two-screen app context the lesson is scale discipline: the dominant moment is genuinely dominant, and everything else steps back to 16px-or-under so the hero alone commands the viewport.

## Spacing & density
Cinematic spacing with rail-capped sections. Content rails cap near 1120px; vertical rhythm runs 48–64px on announcement sections and 32px in working regions. Poster rails are deliberately horizontal — the one dimension of overflow the brand embraces — while every vertical surface stays disciplined. Cards carry 16px padding; rows of metadata breathe at 8–12px gaps. The mix of full-bleed hero space and dense horizontal content rails is the signature rhythm.

## Corner radius & shape language
Small, quiet corners on a dramatic stage. Radii are minimal: 2–4px on buttons and inputs, 4px on cards. Shape language is rectangular and poster-driven — content is the geometry, and the UI chrome exists to frame it. No pill buttons, no floating shapes, no bubbly widgets; even benefit cards are straight-edged rectangles whose color and illustration carry the character.

## Elevation & depth
Shadow is reserved for the star. Surfaces differentiate by luminance (`#000` → `#181818` → `#232323`) with hairlines (`#333`) between panels. Deep soft shadows (`0 8px 24px rgba(0,0,0,0.45)`) appear under posters and hero media — the one place the brand wants real depth — so hovered content visibly floats above the black. Overlays are gradient scrims (black fading to transparent) rather than solid panels, preserving the cinematic feel.

## Iconography & imagery
Imagery is everything; iconography is minimal. The icon language is thin, neutral, and utilitarian — chevrons, plus, play, and control glyphs at 16–24px that never compete with artwork. Posters and hero collage are the visual system: dark crops, 2:3 composition, loaded imagery with rank numerals behind rows. Illustrations are small, playful, and anchored to supporting cards. The imagery rule: content is king, chrome is invisible.

## Signature patterns
- **The single red action** — one primary red button per view; every other control is neutral
- **Horizontal poster rails** — numbered, arrowed content rows that overflow horizontally by design
- **The full-bleed hero** — edge-to-edge media with a black gradient scrim and centered announcement
- **Reassurance copy near commitment** — "Cancel anytime" adjacent to sign-up moments
- **Atmospheric transition bands** — curved, colored gradient strips that bridge hero and content sections
- **Dense, quiet supporting grids** — benefit and feature cards in muted violet-black that recede from the hero

## Motion philosophy
Slow-ish, confident, and content-focused. Poster hovers scale gently to 1.04 with a deep shadow — never changing rail height — announcing "this is playable." Red actions darken on hover. Accordions and expansions animate height over ~150ms. Motion respects reduced-motion preferences by disabling scale and height animation. The rule: motion says "this is interactive content," and the page itself stays still.

## Voice & copy tone
Bold, reassuring, and plain-spoken. Copy promises outcomes in the fewest words: "Ready to watch?", "Cancel anytime", "Get Started". The tone is confident without hype and warm without jokes. Every label states the benefit or the action plainly. It is the voice of a service that knows it must make the decision feel easy — so the copy removes friction rather than adding personality.

## Explicitly do not
- Do not reproduce Netflix logos, wordmarks, or trademarked assets
- Do not copy Netflix's product copy, subscription language, or interface text verbatim
- Do not clone the streaming app's row/billboard structure, playback UI, or content catalog models
- This reference describes a design language to draw from — it is not a license to clone any Netflix interface

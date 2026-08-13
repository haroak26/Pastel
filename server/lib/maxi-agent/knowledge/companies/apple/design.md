# Apple design language

## When to reach for this reference
Use Apple's design language when you want a product to feel premium, trustworthy, and intentionally minimal. It suits platforms where the content or hardware is the differentiator — SaaS tools targeting creative professionals, health apps that prioritize clarity, or any interface that benefits from conveying weightlessness, precision, and quiet confidence. It is also the right reference for design systems that need to feel native on Apple platforms (iOS, macOS, watchOS, visionOS) without copying them.

## Brand personality
Restrained, confident, and material-obsessed. Apple doesn't shout — it removes until only the essential remains. The personality is calm and self-assured, as if every decision has been argued over for weeks and the right answer won. There is warmth in the tactility (glass, metal, soft shadows) but never sentimentality. The brand feels earned, not claimed.

## Color philosophy
Color is used sparingly and almost never decoratively. The baseline is cool neutral grays — warm grays on devices with True Tone-aware rendering — and vast stretches of `#FFFFFF` or near-white backgrounds. Vibrant color appears only in UI controls where it has functional meaning (system blue for links, red for destructive actions, green for success). Product imagery provides the real palette; the chrome recedes so the content sings. Dark mode is a first-class citizen, not an afterthought, favoring true black `#000000` backgrounds on OLED devices.

## Typography approach
Type is engineered, not styled. Apple uses SF Pro (system) and SF Display at large sizes — typefaces built in-house for maximum legibility across every screen density. Weight is the primary differentiator: regular for body, semibold for emphasis, bold for headings. Optical sizing is automatic. Tracking is adjusted per-weight for reading comfort. Numbers in tabular contexts use monospaced figures. Nothing is ever tracked-out for decoration, and all-caps is reserved exclusively for hardware labeling and system-level UI components.

## Spacing & density
Enormous whitespace margins. Content blocks breathe inside 16–24 px outer padding with generous internal gutters. The density target is roughly 40–48 dp touch targets minimum. Nothing crowds the edges; the grid reinforces horizontality. Vertical rhythm is loose and relaxed — sections are separated by more space than the eye expects. This creates a sense of luxury and reduces cognitive load. Grouped table views and card patterns are separated by 8–10 px gaps with rounded outer containers.

## Corner radius & shape language
Subtly rounded rectangles dominate. iOS uses a continuous curve (squircle) for app icons; UI elements borrow the same spirit at smaller scale. Cards, buttons, and sheets use tight corner radii (10–20 px on iOS, 6–10 px on macOS) — enough to feel soft but never blobby. The device itself shapes the canvas: the notch, Dynamic Island, and RoundedCorners display mask mean the UI must respect safe areas and embrace the organic shape of the hardware.

## Elevation & depth
Depth is conveyed through translucency and blur, not hard shadows. Backgrounds behind sheets and modals are blurred rather than dimmed, preserving context. Vibrancy effects pull color from underlying content into overlays. Light-mode shadows are soft, tinted with ambient color, and rarely exceed 20 px blur radius. Dark-mode elevation uses fill color changes instead of shadows, since shadows don't read on black backgrounds.

## Iconography & system imagery
SF Symbols provides a unified, weight-and-scale-adjustable icon library of thousands of glyphs that all share optical consistency. Custom icons follow the same template-driven approach: 1–2 px strokes, filled variants for selected states, no gratuitous detail. Product photography is the hero — shot on black or white seamless backgrounds with dramatic, single-source lighting that sculpts the object. Portrait photography is avoided; the device is the protagonist.

## Signature patterns
- **Translucent navigation bars and toolbars** that tint with the content behind them
- **Haptic feedback** tied to every meaningful interaction (not just a buzz — distinct haptic profiles for different actions)
- **The "rubber-band" scroll physics** and momentum decay that feel physically modeled
- **Progressive disclosure via chevron navigation** — settings or sub-sections always push rightward
- **Gallery-style horizontal scrolls** for content collections that imply breadth without clutter
- **Content-first launch screens** — a bare glyph or the app's core canvas, never a marketing splash

## Motion philosophy
Every animation is a physical simulation with mass, damping, and a spring curve — nothing moves without a reason. Transitions maintain continuity; elements don't pop in and out, they morph or slide from their origin. Default timing curves are ease-in-out with a bias toward deceleration (ease-out). Large-scale transitions (open/close apps, modal presentation) use IOS-spring. Subtle micro-interactions — button depressions, toggle snaps — happen under 200 ms. Parallax and depth effects respond to device motion or pointer position.

## Voice & copy tone
Confident, concise, and conversational without being chummy. Sentences are short. Adjectives are earned. Copy avoids exclamation marks, marketing superlatives, and phrases like "unprecedented" or "revolutionary." Unmatched trademarks ("the new iPad Pro is like a magic slate") are the exception, not the rule. Instructional copy is brief and assumes intelligence. Error messages are polite and precise, never blame the user.

## Explicitly do not
- Do not reproduce Apple logos, wordmarks, or trademarked product names as design assets
- Do not copy Apple UI copy or taglines verbatim
- Do not use SF Symbols or SF Pro without proper licensing (they are Apple-platform-restricted)
- This reference describes a design language to draw from — it is not a license to clone any specific Apple interface

# Superhuman design language

## When to reach for this reference
Use this reference when designing premium productivity tools, keyboard-driven applications, professional communication interfaces, or any product where speed and efficiency are the primary value proposition. Superhuman's language is ideal for power-user tools where the UI must get out of the way, where every interaction is measured in milliseconds, and where the design's job is to make the user feel fast and in control.

## Brand personality
Superhuman embodies premium minimalism — the design language of "the best email experience ever made." The personality is elite, focused, and performance-obsessed. There is no whimsy, no decoration, no hand-holding. It assumes the user is competent, ambitious, and values their time above all else. The brand personality communicates exclusivity and quality through restraint — like a precision instrument or a high-end mechanical keyboard, every detail is considered and nothing is extraneous. The promise is not delight; it is velocity.

## Color philosophy
Near-monochrome with a single, unmistakable accent. The base palette is almost entirely achromatic: a range of warm grays and near-blacks that create a dark-but-warm interface. The signature accent — a specific, rich, slightly warm blue or electric indigo — is used with extreme restraint: selected states, the compose button, the split-second "command mode" cursor flash, and the Superhuman logo. This single accent carries enormous weight because nothing else competes with it. The dark-mode-first approach (charcoal `#1A1B1E` background, `#E8E8E8` text) is the default; light mode exists but feels like the alternate. Surfaces use subtle warm-gray variations (`#2A2B2E` for elevated cards) that maintain legibility without introducing chromatic color. The monochrome discipline is the core color strategy.

## Typography approach
Type is performance-tuned. A single high-performance sans-serif (custom or highly optimized — SF Mono for code-like elements, a crisp geometric sans for UI) is used at small, tight sizes: 13px for the email list, 11–12px for metadata and timestamps, 14px for the reading pane. Line-height is compact (1.3–1.4) to maximize vertical information density. The type system uses a narrow weight range — Regular (400) and Semibold (600) cover virtually everything. Bold exists only for the unread state in the inbox list. Monospace is used selectively for keyboard shortcuts displayed inline, command palette entries, and technical data — it signals "this is a tool for people who type." Tabular figures for dates, times, and counts.

## Spacing & density
Extremely high information density — Superhuman embodies the "less is more" philosophy in reverse: more information per pixel, fewer pixels between information. The email list uses 32–36px row heights with 8px horizontal padding on each side. The reading pane maintains comfortable line-length (65–75 characters) but eliminates all non-functional vertical space. Padding on panels is minimal (12–16px). There are no section breaks with decorative spacing; separation is achieved through subtle 1px dividers and the tight-but-structured grid. The spacing strategy: strip away every pixel that does not serve navigation or comprehension.

## Corner radius & shape language
Minimal to near-zero: 4–6px on buttons, 4px on the command palette, 0–2px on panels and containers. The shape language is rectilinear, efficient, and deliberately unadorned. Rounded corners are tolerated only where they aid usability (click targets, selection highlights). The one exception: the command palette (Cmd+K) uses a slightly more rounded 8px container that visually distinguishes it as a special, temporary surface. Overall, the shape language says "this is a precision instrument, not a friendly toy."

## Elevation & depth
Flat by design. The interface uses hairline borders (1px, warm gray) for structural separation rather than shadows. The command palette is the only element that receives a true shadow treatment — a soft 0px-4px-16px shadow that signals a temporary overlay mode. The email list uses alternating subtle background tints (2–3% brightness difference) rather than traditional zebra striping. There is no layered elevation, no card-within-card patterns. The flatness reduces visual noise and lets the content — the emails, the names, the subject lines — command all attention.

## Iconography & imagery
Icons are minimal, functional, and drawn from a consistent outlined set at 16px with 1.5px strokes. They are purely instrumental — reply, forward, archive, star — with no decorative qualities. Rounded caps are acceptable but the style leans precise and efficient. There is no imagery in the core product. The avatar system uses simple colored circles with initials (a la Google's default avatars) — clean, functional, and data-dense. No illustration, no photography, no decorative graphics of any kind. The visual interest comes entirely from typography, the strategic accent color, and the satisfying rhythm of the keyboard-driven interface.

## Signature patterns
The command palette (Cmd+K) as the central interaction hub — it is not a settings panel buried in a menu; it is the primary way to navigate, act, and configure. The invisible UI: keyboard shortcuts are the primary interaction model, and the interface teaches them through inline hints, tooltips, and the command palette itself. The split-second inbox triage flow (j/k navigation, auto-advance, keyboard-only archive/reply/snooze) that makes processing email feel like playing a musical instrument. The "snippets" system — templated responses that insert with a keystroke. The inline command mode where typing certain characters triggers immediate actions. The status bar / keyboard shortcut reference that users can toggle at the bottom of the screen.

## Motion philosophy
Motion is measured in milliseconds — it exists to eliminate the perception of waiting, not to entertain. Transitions are 100–150ms maximum. Page transitions are instant. Hover states are immediate (no transition delay). The command palette opens with a 100ms scale-and-fade (0.98 → 1.0). The compose window slides up from the bottom in 150ms. Loading is communicated through a thin, accent-colored progress bar at the top of the screen, not spinners or skeleton screens. Prefers-reduced-motion collapses all animations to instant. The motion philosophy: if you notice the animation, it is too slow. The goal is that the interface feels like it responds at the speed of thought.

## Voice & copy tone
Premium, direct, and unapologetically elite. Superhuman's copy treats the user as a high-performer — it is concise and assumes competence. Interface copy is minimal: icons replace labels where possible; single-word commands replace sentences. The onboarding experience is the notable exception — it is famously high-touch (the "concierge onboarding" model), and the in-product copy during setup is warm, personal, and encouraging before it steps back into minimalism once the user is trained. Error messages are brief and useful. Tone: "You are a professional. We built this for you. Let's move." Sentence case throughout. No exclamation marks.

## Explicitly do not
- Do not reproduce Superhuman's logo, wordmark, or any trademarked assets.
- Do not copy Superhuman's UI copy, taglines, or branded messaging verbatim.
- This reference describes a design language to draw inspiration from, not a license to clone Superhuman's product or visual identity.

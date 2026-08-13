# Slack design language

## When to reach for this reference
Use this reference when designing communication tools, team collaboration products, social platforms, or any multi-user application where warmth, approachability, and clarity must coexist with professional utility. Slack's language is the benchmark for making enterprise software feel human — apply it when you need a UI that users want to spend all day in.

## Brand personality
Slack carries a rare "friendly professional" personality that has become its brand signature. It is competent enough for serious work but warm enough that it never feels like work. The personality blends three tones seamlessly: the reliable colleague (clear, direct, helpful), the creative partner (colorful, expressive, customizable), and the welcoming host (inclusive, approachable, reassuring). This balance — never tipping too far into playful or too far into sterile — is Slack's core design achievement.

## Color philosophy
Start from a neutral, restrained base — warm grays (`#F6F6F6`, `#F0F0F0`) for sidebars and backgrounds, white for the main content area — that creates a calm, unopinionated canvas. Color enters through a carefully orchestrated system of accents: the iconic four-color palette (a specific blue, green, red, and yellow) is deployed sparingly and meaningfully — online status dots, notification badges, sidebar unread indicators, and interactive states. Beyond the core accents, Slack allows user-generated color (custom sidebar themes, emoji reactions, user avatars) to bring energy and variety. The architecture is neutral; the life comes from people. Never use bright backgrounds; let color live in small, purposeful elements.

## Typography approach
Slack uses Lato (or a humanist sans-serif) for UI — chosen for its warmth and readability at small sizes. Body text runs at 15px in message threads — unusually large for a productivity tool, which makes reading long conversations comfortable. UI labels sit at 13px. Line-height is generous at 1.5 for messages, promoting readability during extended use. Weight variety is minimal: Regular (400) for most text, Bold (700) for channel names and timestamps. The type never feels mechanical; the humanist letterforms contribute subtle warmth even when the user is not consciously aware of it.

## Spacing & density
Slack's density is moderate and tuned for reading comfort over information maximization. Message threads use 12–16px vertical spacing between messages, with denser (4px) grouping within a single user's consecutive messages. The left sidebar is a comfortable 220–260px with 28px row heights for channel names. Input areas are generous — 44px+ height for the message composer with ample internal padding. The layout breathes. Empty states and onboarding flows use hero-level spacing (80px+ padding) to feel welcoming rather than sparse.

## Corner radius & shape language
Soft but structured: 8px on cards and message containers, 6px on buttons, 4px on inputs, and 12–16px on menus and popovers. Message hover states and reactions use pill-shaped containers (fully rounded) that feel friendly and tap-target-appropriate. Avatar shapes are rounded rectangles with 3–4px radius — a Slack signature that is friendlier than a circle but more distinctive than a square. The overall shape language suggests "we've softened the edges of work."

## Elevation & depth
Subtle and functional. The main content area uses a flat layout with 1px borders. Menus, popovers, and modals use a gentle 0px-4px-12px shadow at 10–15% opacity — enough to feel elevated without feeling heavy. The compose view and thread sidebar slide in with a distinct surface treatment (slightly lighter shadow, full-height border) that signals a secondary plane. Depth is used to manage focus, not to create spatial drama. The goal is soft distinction, not dimensional realism.

## Iconography & imagery
Icons are approachable and friendly — drawn with rounded caps and joins at 20px with 1.5px–2px strokes. They lean slightly larger and softer than purely functional icon sets. Slack's custom emoji system is itself a design feature: the emoji picker, reaction buttons, and custom emoji upload all contribute to a visual language that is user-populated and expressive. Illustration style is distinctive: thick-lined, colorful, character-driven illustrations with a hand-drawn quality. These appear in empty states, loading screens, onboarding, and error pages. The illustrations have a consistent voice — diverse characters, warm color palettes, gentle humor — that reinforces the brand personality at every touchpoint. Never use generic stock illustration; custom illustration is central to the language.

## Signature patterns
The threaded message view as a slide-in panel rather than an inline expansion. The reaction picker that opens with a playful scale animation. The customizable sidebar theme system that gives users agency over their environment. The slash-command and shortcut system that teaches itself through inline suggestions. The "someone is typing" three-dot animation that makes the product feel alive and inhabited. The compose box that expands vertically with content rather than scrolling internally. Channel naming conventions and the sidebar's unread/mention badge system that balances information with calm.

## Motion philosophy
Motion is warm, responsive, and communicative. Transitions use 200–300ms ease-out curves with slight overshoot on interactive elements (buttons scale to 97% on press, then spring back). The reaction picker animates in with a burst. Typing indicators use a gentle bounce. Sidebar transitions for opening threads or panels use a 250ms slide with a decelerating ease. Notifications and badges appear with a subtle pulse. Motion feels alive without demanding attention — it communicates state changes and relationships between elements rather than showing off. The `prefers-reduced-motion` fallback is well-considered: all animations collapse to simple opacity fades.

## Voice & copy tone
Friendly, inclusive, and lightly playful without being unprofessional. Slack's copy is known for its warm welcome messages ("You're all set! Time to get your team on board"), its human error messages ("Something's not working. We're on it."), and its delightful loading messages that rotate through a deep pool of quips. The tone is consistently second-person, using "you" and "your team." Commands use friendly imperative: "Send a message," "Invite your teammates." Exclamation marks appear sparingly — one per screen at most. The copy strategy is to reduce the psychological distance between "work" and "human."

## Explicitly do not
- Do not reproduce Slack's logo, wordmark, or any trademarked assets.
- Do not copy Slack's UI copy, taglines, or branded messaging verbatim.
- This reference describes a design language to draw inspiration from, not a license to clone Slack's product or visual identity.

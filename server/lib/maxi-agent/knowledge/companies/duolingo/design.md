# Duolingo design language

## When to reach for this reference
Use Duolingo's design language when building consumer apps centered on habit formation, education, wellness gamification, or any experience that transforms a chore into a daily ritual. It is the reference for making a product feel alive — energetic, encouraging, and impossible to ignore. Also ideal for products targeting a broad age range where visual clarity and emotional feedback matter more than sophistication.

## Brand personality
Playful, hyper-energetic, and relentlessly supportive. Duolingo has the personality of an enthusiastic coach who high-fives you for showing up and gently teases you when you skip a day. The mascot, Duo the owl, is the emotional center of the brand — a character who celebrates your progress, mourns your lapses, and occasionally pops up to remind you to do your lesson. The brand never takes itself too seriously but is deeply serious about the user's outcomes.

## Color philosophy
Unashamedly saturated. The primary green (`#58CC02`) is bright, loud, and energizing — it's the color of the main CTA, progress bars, success states, and the owl mascot himself. The supporting palette is equally vibrant: bold blues, oranges, purples, and pinks that differentiate lesson types, skill categories, and gamified reward tiers. Backgrounds are predominantly clean white for content areas, which makes the saturated colors pop even more. Darker UI chrome uses a deep green or graphite to anchor the interface. Color is used as a reward mechanism — completing a lesson triggers explosions of confetti-like shapes in the brand palette. There is no muted, neutral, or "tasteful" version of this palette; it leans fully into joy-maximization.

## Typography approach
Round, bold, and full of personality. Duolingo uses a custom rounded typeface (Feather Bold or a proprietary variant) for headings that features soft, blob-like letterforms with minimal contrast between strokes. Body text is set in a clean, highly legible geometric sans at generous sizes (16–18 px minimum for lesson content). The type never feels small or cramped — large x-heights, open counters, and relaxed tracking make even dense vocabulary tables approachable. Non-Latin scripts (Cyrillic, Japanese, Arabic, Hindi) receive careful optical sizing tuned for learners who are seeing these characters for the first time.

## Spacing & density
Generous and chunky. Lesson screens use large tap targets (56+ px) for answer buttons, which are stacked with 12–16 px vertical gaps. Content is single-column with wide outer margins (20–24 px on mobile). The space between elements feels padded and safe — like a children's book layout where everything has room to be itself. Density increases slightly in the skill tree and leaderboard views but never drops below 44 px tap targets. Empty space is used actively as a design element, framing the content like a stage.

## Corner radius & shape language
Chunky and heavily rounded. Buttons are pill-shaped or near-pill (16–24 px border-radius). Cards and lesson tiles use 14–18 px rounding. Character and mascot silhouettes are built from overlapping rounded shapes — circles, blobs, rounded rectangles. Answer-choice buttons are fully rounded capsules. Icons and badges live inside circles. The shape language is soft, friendly, and vaguely toy-like. There is not a single sharp corner in the entire interface. Even progress bars have rounded ends.

## Elevation & depth
Flat and graphic, with depth created by color contrast rather than shadows. Lesson tiles on the skill tree have a slight 2D offset effect (a darker colored strip at the bottom edge) that suggests layering without atmospheric shadow. The mascot and character illustrations are rendered as flat vector art with occasional soft highlight/shadow shapes for dimension. Pop-up modals for rewards and achievements use a subtle drop shadow (4–8 px blur) and a darkened overlay. The overall approach is inspired by game UI rather than operating system chrome.

## Iconography & imagery
Icons are bold, filled, and chunky — thick strokes (2–3 px) with rounded caps, drawn at 24×24 or larger. The style is approachable and unmistakable at small sizes. Illustrations are everywhere: the owl mascot appears in dozens of poses and emotional states, characters represent different cultures and languages, and achievement badges are elaborate vector illustrations. Empty states and error screens feature the mascot looking appropriately sad or encouraging. Photography is nearly absent — the entire visual world is built in illustration and vector art, which gives the product a cohesive, storybook quality.

## Signature patterns
- **The lesson progress bar with treasure-chest checkpoints** — a visual countdown that makes progress feel inevitable and rewarding
- **Streak flame counter** — a gamified streak indicator that burns brighter (and looks more anxious) as the streak grows, tapping into loss aversion
- **Duo mascot notifications** — the owl appears in push notifications, in-app modals, and empty states with emotionally expressive poses and copy
- **Skill tree with Crown levels** — a visual representation of progress through a topic that encourages repeated practice
- **Gems/Lingots virtual currency** — earned through achievement, spent on cosmetic upgrades, reinforcing positive behavior
- **Leaderboard with league tiers** — bronze/silver/gold progression that taps into competitive motivation
- **XP celebration animations** — screen-filling bursts of color and motion on lesson completion and level-ups

## Motion philosophy
Exaggerated, frequent, and delightful. Every correct answer triggers a micro-celebration — a bounce, a sparkle, a color burst. Buttons depress with a 0.9x scale bounce. The mascot bounces, flutters, and glides across the screen with squash-and-stretch physics that evoke classic animation. Transitions between screens use confident 300–400 ms animations with overshoot. Loading states feature the owl walking or flying in place. The overall motion model says "learning is fun and you are doing great." Accessibility: motion can be reduced, and the app respects system-level reduce-motion preferences.

## Voice & copy tone
Cheerful, motivating, and slightly goofy. Copy uses exclamation marks liberally and without shame. The owl speaks in short, punchy bursts of encouragement: "You're on fire!" "Don't lose your streak!" Incorrect answers are met with gentle correction, never frustration. Push notifications are lightly guilt-inducing but in a way that reads as playful rather than manipulative. Instructional copy within lessons is clear and direct, avoiding ambiguous grammar. The tone walks a careful line between childish and childlike — it is appropriate for both an 8-year-old learner and a 40-year-old professional.

## Explicitly do not
- Do not reproduce Duolingo logos, the Duo owl character, wordmarks, or trademarked assets
- Do not copy Duolingo's UI copy, lesson content, gamification mechanics, or notification text verbatim
- Do not build language-learning interfaces that mimic Duolingo's specific exercise formats or skill tree structure
- This reference describes a design language to draw from — it is not a license to clone any specific Duolingo interface

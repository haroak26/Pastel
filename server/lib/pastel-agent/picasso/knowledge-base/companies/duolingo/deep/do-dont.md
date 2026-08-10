# Duolingo — Do This, Not That

## Brand & Personality

### DO
- Make Duo the emotional center of every screen
- Use playful, encouraging language ("You're on fire!", "Great job!", "Nice work!")
- Let the owl express disappointment when users miss days (this drives retention)
- Create shareable moments (streak milestones, achievements, level-ups)
- Give Duo a full range of emotions (happy, sad, excited, pleading, proud)
- Keep the tone optimistic — even failure is framed as "Almost! Try again!"
- Reference popular culture and memes (the owl IS a meme)
- Use exclamation marks generously — energy is the default state
- Make interactions feel like a game, never like a quiz or test

### DON'T
- Design a screen where Duo isn't present
- Use academic, formal, or teacher-like language ("Incorrect. The proper conjugation is...")
- Make Duo angry, mean, or genuinely upset (passive-aggressive is the limit)
- Use negative reinforcement — even "wrong" should feel encouraging
- Take yourself too seriously — Duolingo is not a "serious learning platform"
- Use cold, clinical, or professional tone anywhere in the product
- Show Duo ignoring the user (the owl should always react)
- Under-celebrate achievements (every lesson completion deserves a moment)
- Make the brand feel like "education" — it should feel like "entertainment"

---

## Color

### DO
- Use green (#58CC02) everywhere — navigation, buttons, progress bars, links, system UI
- Let green be the first thing users see and the primary brand signal
- Use skill colors (blue, purple, orange, pink, teal) for skill node differentiation
- Use gold (#FFD900) for XP, rewards, premium indicators — it signals value
- Use red (#FF4B4B) sparingly — only for errors, heart loss, destructive actions
- Keep the background bright and saturated (white or light gray, never dark)
- Use a vibrant, saturated palette — this is a game, not a professional tool
- Create high contrast between green and white for readability
- Ensure white text on green backgrounds is always legible

### DON'T
- Use green as just an "accent" — green IS the canvas, not the highlight
- Introduce a secondary brand color that competes with green
- Use dark mode as the primary theme (bright = energetic = Duolingo)
- Desaturate or mute the palette (saturation = energy = engagement)
- Use green for error states (green = correct = good)
- Mix red and green for decorative purposes (red/green = right/wrong = game meaning)
- Apply pastels or muted tones as primary colors (feels adult, not playful)
- Use gradients for UI backgrounds (solid, bold colors are more game-like)
- Create low-contrast designs (visibility = speed = game flow)

---

## Typography

### DO
- Use rounded, friendly sans-serif (Feijoa / Din Rounded)
- Use Bold weight for celebrations (XP earned, streak milestones, level-ups)
- Use Medium weight for interactive elements (answer buttons, CTAs, lesson questions)
- Use Regular weight for instruction text and body copy
- Make lesson question text large (20-24px) for easy reading at mobile distance
- Keep answer option text clean and centered
- Use all-caps ONLY for achievement badge labels (10px, tracking +0.5px)
- Scale text for emotional impact — celebration text should be LARGE (36-48px)
- Always use rounded typefaces (sharp terminals feel academic/unfriendly)

### DON'T
- Use serif fonts — feels like a textbook, not a game
- Use italic for emphasis — academic, not playful
- Use thin/light font weights — low energy, hard to read on mobile
- Make body text smaller than 16px on mobile
- Use all-caps for headings, labels, or buttons (shouting, not cheering)
- Mix multiple type families
- Use sharp/geometric sans-serif (feels tech, not playful)
- Justify text — casual ragged-right is more game-like
- Use tiny achievement badge text (<8px)

---

## Motion & Animation

### DO
- Animate EVERYTHING — correct answers, wrong answers, XP gain, streak updates, level-ups
- Use bouncy/spring easing for celebrations (cubic-bezier(0.68, -0.55, 0.265, 1.55))
- Animate Duo's expressions in response to user actions
- Make XP count up with animation (rapid digit flip, gold glow)
- Apply a shake animation to wrong answers (3 oscillations, 300ms)
- Fill progress bars smoothly forward (never backward)
- Use confetti particles for major achievements
- Include sound effects (correct = ding, wrong = buzz, complete = fanfare)
- Respect prefers-reduced-motion by simplifying animations to fades

### DON'T
- Create a static or motionless screen — this is NOT a professional tool
- Use linear easing (robotic, not playful)
- Animate progress bars backward (progress is never lost)
- Flash or blink elements faster than 3 times per second
- Use subtle or barely-perceptible motion (Duolingo animation should be theatrical)
- Skip the celebration animation after lesson completion (this is THE payoff)
- Use full-screen video or auto-playing audio without user consent
- Create animations that delay the user's next action (celebrations should be skippable)
- Use animation styles that feel professional or corporate (Duolingo = game, not SaaS)

---

## Gamification & Rewards

### DO
- Give XP for every positive action (correct answer, lesson completion, streak extension)
- Display XP prominently and animate it dramatically
- Make streaks sacred — the streak flame is the most important visual element after Duo
- Create escalating celebrations for streak milestones (7, 30, 50, 100, 365, 1000 days)
- Use lives/hearts to create stakes and tension (borrowed from mobile games)
- Show leaderboards with friends to create social competition
- Award achievement badges for everything (streaks, perfection, volume, social, time-based)
- Make daily quests visible and trackable
- Use Duo's emotional reactions as reward currency (the owl's happiness is a reward)

### DON'T
- Give XP for logging in without doing a lesson (cheapens the reward)
- Display XP as a static number (always animate changes)
- Let streaks break silently (Duo should be VERY sad)
- Make streak repair too cheap or easy (diminishes the value of maintaining streaks)
- Create achievements that feel unattainable or obscure
- Use leaderboards without friend context (stranger-only leaderboards are less motivating)
- Make gamification elements optional or hidden (they ARE the product)
- Penalize mistakes harshly (it's a game, not an exam)
- Create a "pay to win" feeling (free users should feel they can succeed)

---

## Buttons & CTAs

### DO
- Make primary CTAs green (#58CC02) with white text, always
- Use pill-shaped buttons (16px-9999px border-radius)
- Make answer option buttons full-width pills with 3D press effect (bottom border shadow)
- Keep button height at least 56px for lesson answer options
- Animate button press: scale(0.96) + inset shadow on press
- Provide immediate visual feedback on answer selection (green = correct, red = wrong)
- Use a single primary CTA per screen (avoid competing actions)
- Place primary CTA at the bottom of the screen (thumb zone)
- Make "Continue" the default post-lesson action (prominent, green, bottom)

### DON'T
- Use any color other than green for primary CTAs (brand dilution)
- Create square or sharp-cornered buttons (unfriendly, un-game-like)
- Make buttons smaller than 48px (mobile tap targets)
- Stack more than one primary CTA (confusing in a game context)
- Disable buttons without explanation (say why — "Complete previous lesson first")
- Use text-only CTAs without button containers (too subtle for a game)
- Place primary CTAs in the header or corners (use the thumb zone at the bottom)
- Create hover-dependent interactions (this is mobile-first, tap-first)
- Use different button styles for the same action in different contexts

---

## Progress & Feedback

### DO
- Show a progress bar on EVERY screen that involves forward movement
- Make progress bars thick (8px), green fill, rounded ends
- Animate progress forward smoothly — this is the satisfaction loop
- Show question count ("Question 4 of 10") alongside the bar
- Provide immediate feedback after every answer (correct/wrong)
- Show the correct answer after a wrong attempt
- Give XP for partial progress (you don't need to complete a lesson to earn)
- Display streak status prominently in the top bar
- Celebrate every milestone, even small ones

### DON'T
- Skip the progress bar on any lesson or quest screen
- Make progress bars thin (<4px) or hard to see
- Animate progress backward (progress is cumulative, never lost)
- Delay feedback after an answer (feedback must be IMMEDIATE)
- Show only "correct/incorrect" without showing the right answer
- Make streak information hard to find or secondary
- Under-celebrate small wins (every lesson deserves the full treatment)
- Use percentage-only progress (absolute counts feel more game-like: "4 of 10")

---

## Characters & Illustrations

### DO
- Use flat, bold illustration style (thick outlines, solid colors, no gradients)
- Make character expressions clear and exaggerated (big eyes, obvious emotions)
- Design characters to be animation-friendly (simple shapes, clear silhouettes)
- Use Duo as the primary character but include the extended cast for variety
- Give each character a distinct personality and visual treatment
- Use character reactions as the primary emotional feedback mechanism
- Design illustrations that scale to small sizes (32-64px for skill icons)

### DON'T
- Use realistic or 3D-rendered characters (breaks the game aesthetic)
- Make Duo look different across screens (consistency is critical for the character)
- Introduce new character styles that clash with the established Duolingo character universe
- Use stock illustrations or clip art (everything should feel custom and Duolingo-owned)
- Make characters too detailed for small sizes
- Use gradients or realistic shading on characters (flat design only)
- Let characters feel like clip art or stickers (they should feel alive and reactive)

---

## Mobile & Platform

### DO
- Design mobile-first — this is where 90%+ of usage happens
- Use large touch targets (48px minimum, 56px recommended)
- Place primary actions in the thumb zone (bottom half of screen)
- Stack answer options vertically (horizontal layout is harder on mobile)
- Keep lessons to 3-5 minutes (optimized for micro-sessions)
- Use bottom tabbar for primary navigation
- Support offline mode for downloaded lessons
- Design for one-handed use (critical interactions reachable by thumb)

### DON'T
- Design for desktop first and adapt to mobile (start with 375px wide)
- Use hover states as the only interaction cue
- Create horizontally-scrolling answer options
- Make lessons longer than 5 minutes without clear break points
- Place critical buttons in the top corners (hardest to reach one-handed)
- Use tiny icons without labels in navigation
- Require always-online connectivity (users practice on subways, planes, etc.)
- Use desktop-style modals and tooltips on mobile (use bottom sheets)

---

## What Makes Something Feel "Non-Duolingo"

These are the telltale signals that a design has drifted from the Duolingo brand:

1. **Missing or static Duo** — the owl should be on every screen, reacting
2. **Muted, desaturated colors** — energy comes from saturation
3. **Sharp corners** — everything should be rounded/pill-shaped
4. **Academic or formal language** — "Incorrect" instead of "Almost!"
5. **No celebration after lesson completion** — this is THE reward moment
6. **Thin, small progress bars** — progress should be impossible to miss
7. **Dark mode as primary** — the energy is bright, light, and saturated
8. **No sound effects** — audio feedback is integral to the game feel
9. **Static XP display** — XP should always animate on change
10. **No streak visibility** — the streak should be omnipresent in the top bar
11. **Corporate/professional visual style** — it should feel like a game, always
12. **Slow, subtle animations** — Duolingo animation is fast, bouncy, and theatrical

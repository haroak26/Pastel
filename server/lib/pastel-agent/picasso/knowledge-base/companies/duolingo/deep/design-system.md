# Duolingo Design System — Deep Reference

## Core Design Tokens

### Color Palette

#### Brand Primary (The Green)

| Token | Value | Usage |
|-------|-------|-------|
| `color-green` | `#58CC02` | Primary brand color — navigation bars, primary buttons, progress bars, links, active states, system UI |
| `color-green-dark` | `#4AAE00` | Pressed/hover states, darker green accents |
| `color-green-light` | `#E5F6D3` | Selected backgrounds, highlighted rows, subtle green accents |
| `color-green-pale` | `#F4FBE8` | Very light green backgrounds |

#### Skill Colors (Learning Path Nodes)

| Token | Value | Skill Type |
|-------|-------|------------|
| `color-skill-blue` | `#1CB0F6` | Grammar, listening |
| `color-skill-purple` | `#CE82FF` | Vocabulary, phrases |
| `color-skill-orange` | `#FF9600` | Speaking, pronunciation |
| `color-skill-pink` | `#FF4B4B` | Review, hard mode |
| `color-skill-teal` | `#2CE0C8` | Stories, reading |
| `color-skill-yellow` | `#FFD900` | Bonus, special events |
| `color-skill-red` | `#E53E3E` | Legendary challenges |

#### Neutrals

| Token | Value | Usage |
|-------|-------|-------|
| `color-bg-primary` | `#FFFFFF` | Page backgrounds, cards, sheets |
| `color-bg-secondary` | `#F7F7F7` | Subtle section differentiation |
| `color-text-primary` | `#3C3C3C` | Body text, headings, labels (warm dark gray, never pure black) |
| `color-text-secondary` | `#777777` | Secondary labels, metadata, hints |
| `color-text-tertiary` | `#AFAFAF` | Placeholder text, disabled text |
| `color-border` | `#E5E5E5` | Card borders, dividers, input borders |
| `color-border-focus` | `#58CC02` | Input focus, active borders |

#### Semantic & Gamification

| Token | Value | Usage |
|-------|-------|-------|
| `color-success` | `#58CC02` | Correct answers, achievements (same as brand green) |
| `color-error` | `#FF4B4B` | Wrong answers, hearts depleted, destructive actions |
| `color-warning` | `#FF9600` | Streak freeze warning, time-sensitive actions |
| `color-xp` | `#FFD900` | XP icons, gold elements, premium indicators |
| `color-gems` | `#1CB0F6` | Virtual currency (blue gems) |
| `color-heart` | `#FF4B4B` | Lives/hearts system |
| `color-streak` | `#FF9600` | Streak flame icon |
| `color-premium` | `#FFD900` | Super Duolingo / Max premium indicators |

---

## Typography System

### Font Stack

```css
font-family: 'Feijoa', 'Din Rounded', 'Nunito', -apple-system,
             BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-5xl` | 48px | 56px | Bold (800) | Major celebrations, streak milestones |
| `text-4xl` | 36px | 44px | Bold (800) | Lesson complete XP earned |
| `text-3xl` | 28px | 36px | Bold (700) | Section achievements, level up |
| `text-2xl` | 24px | 32px | Medium (600) | Lesson question text, challenge prompts |
| `text-xl` | 20px | 28px | Medium (600) | Lesson prompts, skill titles |
| `text-lg` | 18px | 26px | Medium (500) | Answer option text, card titles |
| `text-base` | 16px | 24px | Regular (400) | Body copy, instruction text, leaderboard |
| `text-sm` | 14px | 20px | Medium (500) | Labels, stats, XP counter, badge text |
| `text-xs` | 12px | 16px | Medium (500) | Small labels, timers, captions |
| `text-2xs` | 10px | 14px | Bold (700) | Badges, indicators, overline |

### Typography Rules

1. **Bold for celebration** — Large text (28px+) uses Bold weight. XP earned, streak milestones, level-up announcements.
2. **Medium for interaction** — Answer buttons, CTAs, lesson questions. Clear and inviting without shouting.
3. **Regular for instruction** — Body copy and guidance use Regular. Not the "voice" of authority but of friendly guidance.
4. **Rounded terminals are the personality** — The rounded quality of Feijoa/Din is what makes the app feel playful instead of clinical.
5. **Never italic** — Italic feels academic. Duolingo never uses it.
6. **All caps only for badges** — 10px Bold, uppercase, tracking 0.5px.
7. **Letter-spacing**: 0 by default. Only all-caps badges get +0.5px.

---

## Spacing Scale

Duolingo operates at mobile density — everything is optimized for a 375-414px wide screen.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon-text gap, tight inline |
| `space-2` | 8px | Button gaps, icon padding, list item gaps |
| `space-3` | 12px | Answer option stack gap, card internal gaps |
| `space-4` | 16px | Standard padding, section padding, content area |
| `space-5` | 20px | Medium section gaps |
| `space-6` | 24px | Section separation, header padding |
| `space-8` | 32px | Screen section padding, skill tree spacing |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Page header bottom margin |
| `space-16` | 64px | Bottom padding before tabbar (safe area) |

### Spacing Rules

- **Lesson mode**: Compact. Answer options stack with 12px gaps. Content padding is 16px.
- **Browse mode**: Medium. Sections separated by 24-32px. Cards have 16px internal padding.
- **Skill tree**: Nodes spaced 24-32px apart on the scrollable path.
- **Leaderboard**: Rows 12px apart, avatar + name + XP inline.
- **Bottom tabbar**: Always 16px safe area padding above it.

---

## Border Radius

Duolingo LOVES rounded corners. Everything is friendly. Nothing is sharp.

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Small cards, input fields, small buttons |
| `radius-md` | 12px | Lesson cards, skill nodes, achievement cards |
| `radius-lg` | 16px | Buttons, answer pills, CTA buttons |
| `radius-xl` | 20px | Large cards, feature containers |
| `radius-full` | 9999px | Pills, chips, avatars, progress bar ends, Duo icon |

### Radius Rules

- **Buttons are pill-shaped**: 16px-9999px radius. Full-width buttons use 16px; small chips/pills use 9999px.
- **Cards are rounded**: 12-20px radius depending on size.
- **Answer options**: Pill-shaped (9999px) — signature Duolingo pattern.
- **Progress bars**: Rounded ends (9999px).
- **Skill icons**: Circular or rounded-square containers with 12-16px radius.
- **Never 0px**: Sharp corners feel aggressive and un-Duolingo.

---

## Shadow System

Shadows are playful and light — they suggest pop-ups and game elements, not formal elevation.

| Token | Usage | CSS |
|-------|-------|-----|
| `shadow-card` | Lesson cards, skill nodes | `0 2px 8px rgba(0,0,0,0.08)` |
| `shadow-button` | Answer option pills | `0 2px 0 #CCCCCC` (bottom border effect, 3D feel) |
| `shadow-elevated` | Bottom sheets, modals | `0 -4px 16px rgba(0,0,0,0.10)` |
| `shadow-popup` | Celebration overlays, tooltips | `0 4px 20px rgba(0,0,0,0.12)` |
| `shadow-pressed` | Button press state | `inset 0 2px 4px rgba(0,0,0,0.10)` |

### Shadow Rules

- Answer buttons have a **bottom border shadow** (0 2px 0 #CCC) giving them a 3D, pressable feel — this is a key game UI pattern.
- Pressed state uses **inset shadow** to show the button being pushed down.
- Celebration overlays use soft, diffused shadows.
- Never use Material Design's 5-layer elevation system — Duolingo has its own lighter, more playful approach.

---

## Component Patterns

### Answer Option Button (The Most Important Component)

```
+-----------------------------------------------+
|                                               |
|             ¿Cómo estás?                      |
|                                               |
+-----------------------------------------------+
|  +------------------------------------------+ |
|  |            How are you?                  | |  <-- pill button, default
|  +------------------------------------------+ |
|  +------------------------------------------+ |
|  |            What is your name?            | |  <-- pill button, default
|  +------------------------------------------+ |
|  +------------------------------------------+ |
|  |  ✓         I am fine, thanks            | |  <-- correct answer, green bg
|  +------------------------------------------+ |
+-----------------------------------------------+
```

**Key specs:**
- Shape: Full-width pill (16px border-radius, or 9999px)
- Default state: White background, 2px border in #E5E5E5, text in #3C3C3C
- Hover/Tap: Border darkens to #B0B0B0, subtle scale(0.98)
- Selected correct: Background turns green (#58CC02), text white, border green, checkmark appends with animation
- Selected wrong: Background turns red (#FF4B4B), text white, border red, subtle shake animation
- Disabled: After answer selection, all other options dim to 50% opacity
- Height: 56px (generous tap target for mobile)
- Text: 18px Medium, centered
- Bottom shadow: `0 2px 0 #CCCCCC` (3D pressable effect)

### Skill Node (Tree Path)

```
    +----+
    |    |  Circle container (64px)
    | ⭐ |  Skill icon inside (colored per skill type)
    |    |
    +----+
      |
 [==========]  Progress bar (thick, 8px, green fill)
      |
    +----+
    |    |
    | 📖 |  Next skill node
    |    |
    +----+
```

**Key specs:**
- Node shape: Circular container, 64x64px, 12px border-radius if square variant
- Icon: 32px, colored per skill category
- Progress bar: 4px thick (completed) or 8px thick (current), green fill, gray track, rounded ends
- Connecting lines: 2px solid #E5E5E5 between nodes
- Completed node: Full color background, white icon, green checkmark badge
- Current node: Pulsing ring animation, full green background, white icon
- Locked node: Grayed out, lock icon overlay, 50% opacity
- Legendary node: Purple/gold gradient background, white icon, sparkle animation

### Streak Counter

```
    🔥  42
```

**Key specs:**
- Flame icon: 20px, orange (#FF9600)
- Number: 16px Bold, primary text color (#3C3C3C)
- Position: Top bar, left of center
- Animation: Flame flickers/grows when streak increases
- Milestone: At 7, 30, 50, 100, 365, 1000 — special animation with Duo celebration

### XP Counter

```
    ⚡  1,250 XP
```

**Key specs:**
- Lightning icon: 18px, gold (#FFD900)
- Number: 16px Bold, primary text
- Position: Top bar, right of center
- Animation: Counts up with rapid digit flip on earn
- Color shifts to gold during XP Boost

### Progress Bar (Multiple Variants)

**Lesson Progress Bar**
```
+--------------------------------------------------+
|  [███████████████████░░░░░░░░░░░░░░░░░░░]  6/10  |
+--------------------------------------------------+
```
- Full-width, 8px thick, rounded ends
- Green fill (#58CC02), gray track (#E5E5E5)
- Counter shows "Question X of Y"
- Animates forward smoothly on correct answer
- No backward animation (wrong answers don't move the bar back on standard lessons)

**Daily Goal Ring**
```
    +-----------+
   /    ████      \
  |   ██    ██     |
  |  █        █    |
  |   ██    ██     |
   \    ████      /
    +-----------+
         50 XP
```
- Circular progress ring around the streak flame
- Completing the daily goal fills the ring
- Color: green fill, light green (#E5F6D3) track
- Animated fill with celebration on completion

**Skill Progress Bar**
```
[████████░░░░░░░░░░░░]  42%
```
- 4px thick under each skill node
- Shows progress toward next crown level
- Green completed, gray remaining
- Up to 6 crown levels per skill (legendary = purple/gold)

### Heart/Lives Display

```
    ❤️  ❤️  ❤️  🖤  🖤
```

**Key specs:**
- 5 hearts max: filled = red (#FF4B4B), empty = gray (#E5E5E5)
- Position: Top right, prominent during lessons
- Animation: Heart breaks (shatters) when lost; refills with glow on gain/refill
- "0 hearts" state: All gray hearts, lesson cannot continue, refill prompt appears
- Hearts refill over time (1 every ~4 hours) or instantly via gems or practice

### Leaderboard Entry

```
+--------------------------------------------------+
|  #1  [Avatar 48px]  Sarah J.         2,450 XP 🔥 |
|       [============== Progress bar ========]      |
+--------------------------------------------------+
|  #2  [Avatar 48px]  You               1,980 XP    |
|       [============= Progress bar ============]   |
+--------------------------------------------------+
|  #3  [Avatar 48px]  Mike T.           1,750 XP    |
|       [============ Progress bar ========]        |
+--------------------------------------------------+
```

**Key specs:**
- Rank number: 20px Bold, left
- Avatar: 48px circle, character or photo
- Name: 16px Medium
- XP: 16px Bold, right-aligned
- Current user row: Highlighted with light green (#E5F6D3) background
- Progress bar: Full-width within row, green fill
- Promotion zone: Top 3 highlighted with subtle gradient background
- Demotion zone: Bottom 3-5 with subtle red tint

### Bottom Sheet / Modal

```
+--------------------------------------------------+
|  ────────  (drag handle, 32px wide, 4px thick)    |
|                                                  |
|  Title                                     [X]   |
|                                                  |
|  Content area...                                  |
|                                                  |
|  +----------------------------------------------+|
|  |              Primary CTA (green)             ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

**Key specs:**
- Top: Drag handle indicator, 32px wide, 4px thick, light gray
- Corners: 20px top-left, 20px top-right only (bottom extends to screen edge)
- Background: White
- Shadow: `0 -4px 16px rgba(0,0,0,0.10)` (elevated from bottom)
- Close button: Top right, 24px circular hit area
- Bottom CTA: Full-width green pill button, 56px height, 16px bottom margin

### Celebration Overlay

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|              🎉  GREAT JOB!  🎉                 |
|                                                  |
|                +50 XP                            |
|                                                  |
|           [Duo character animation]              |
|                                                  |
|                                                  |
|          +--------------------------------+      |
|          |          CONTINUE              |      |
|          +--------------------------------+      |
+--------------------------------------------------+
```

**Key specs:**
- Full-screen overlay with semi-transparent green/white background
- XP earned: 48px Bold, gold color, scales in with bounce animation
- Encouragement text: 28px Bold
- Duo animation: Character celebrates (confetti, dancing, thumbs up)
- Continue button: Green pill, full-width, 56px
- Optional: Confetti particle animation, star burst effects
- Exit: Tapping Continue or swipe down

---

## Navigation

### Bottom Tabbar

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|                                                  |
|                                                  |
+--------------------------------------------------+
|   🏠      🏆      📋      👤      🛒         |
|  Learn  Leader-  Quests  Profile   Shop          |
|         board                                    |
+--------------------------------------------------+
```

**Key specs:**
- Fixed bottom, full-width
- Background: White with subtle top border/shadow
- 5 tabs: Learn (home icon), Leaderboard (trophy), Quests (clipboard), Profile (person), Shop (bag/cart)
- Active tab: Green icon + green label
- Inactive tabs: Gray icon + gray label
- Labels: 10px Medium below icon
- Icons: 24px
- Badge indicator: Small green dot or number on tabs with new content

### Top Bar (Lesson Mode)

```
+--------------------------------------------------+
|  [X Close]    🔥 42    ⚡ 1,250 XP    ❤️❤️❤️🖤🖤  |
+--------------------------------------------------+
```

### Top Bar (Home/Browse Mode)

```
+--------------------------------------------------+
|  [Flag icon]  [Course name ▼]    🔥 42  ⚡ 1,250 |
+--------------------------------------------------+
```

**Key specs:**
- Background: Green (#58CC02)
- Height: 56px
- Left: Course flag icon + language name with dropdown to switch courses
- Right: Streak flame + XP counter
- Text color: White
- Icons: 20px, white

---

## Motion & Animation

### Principles

Duolingo's motion is **energetic, celebratory, and game-like**. This is NOT a professional tool where motion should be subtle — animation IS the experience. It IS the reward.

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `motion-instant` | 100ms | Button press feedback, toggle states |
| `motion-fast` | 200ms | Answer feedback, correct/incorrect highlight |
| `motion-normal` | 350ms | Progress bar fill, transitions between screens |
| `motion-celebration` | 500ms | XP earned, achievement pop-ups |
| `motion-grand` | 800ms | Streak milestones, level-up sequences |

### Easing

- **Bouncy/Spring**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` — for celebrations, XP popups, Duo reactions. This is the Duolingo signature easing.
- **Smooth**: `cubic-bezier(0.4, 0, 0.2, 1)` — for transitions, progress bars
- **Bounce**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — for button interactions, heart refills

### Key Animations

1. **Correct answer**: Button turns green (200ms) → checkmark appears → subtle scale pulse → proceed
2. **Wrong answer**: Button turns red → shakes horizontally (3 oscillations, 300ms) → correct answer highlights green → proceed
3. **XP earned**: Number counts up rapidly (500ms, spring easing) → gold glow → scale bounce
4. **Streak increment**: Flame icon grows/shrinks (spring, 350ms) → sparkle particles → number updates
5. **Level up**: Full screen overlay → Duo appears → "Level Up!" text with scale entrance → XP summary → confetti
6. **Heart break**: Heart cracks and shatters into particles (300ms) → vibration on device
7. **Heart refill**: Heart glows and fills from gray to red (400ms, spring)
8. **Progress bar**: Smooth forward fill (350ms, smooth easing) — never animates backward
9. **Duo reactions**: Character expression changes with exaggerated transitions between states
10. **Answer button press**: Scale(0.96) + inset shadow on press (100ms), scale(1.0) on release
11. **Crown earned**: Crown icon drops from top with bounce, sparkle particles

### Sound Design

- Correct answer: Pleasant "ding" (ascending tone)
- Wrong answer: Gentle "buzz" (descending tone)
- Lesson complete: Celebratory fanfare (longer, musical)
- XP earned: Coin/clink sound
- Streak milestone: Special fanfare with extra musical flourish
- Heart break: Low, sad tone
- All sounds are optional (mutable) but ON by default

---

## Accessibility

### Standards
- WCAG 2.1 AA minimum
- Large touch targets: minimum 48px (answer buttons are 56px)
- All interactive elements have visible focus states

### Color Contrast
- #58CC02 on white: 2.9:1 (fails AA for text) → green is NEVER used as background for body text; white text on green passes
- #3C3C3C on white: 9.3:1 AAA
- #777777 on white: 4.5:1 AA
- Answer feedback does not rely solely on color (icons + text + animation)

### Screen Reader
- All answer options have clear text alternatives
- Progress announced: "Question 3 of 10"
- "Correct!" or "Incorrect" announced with answer feedback
- Duo character is decorative (hidden from screen readers)
- Timer countdown is announced at intervals

### Motion Sensitivity
- Respects `prefers-reduced-motion` — reduces animations to simple fades
- No seizure-inducing flashes
- Sound effects respect device mute state

---

## Grid & Layout

### Screen Structure (Mobile First)

```
+--------------------------------------------------+
| Top Bar (green, 56px height)                      |
|  [Course] [Streak] [XP]                           |
+--------------------------------------------------+
|                                                  |
|                                                  |
|          Content Area                             |
|    (scrollable, white or light background)       |
|                                                  |
|                                                  |
+--------------------------------------------------+
| Bottom Tabbar (white, 56px + safe area)           |
|  [Learn] [Leaderboard] [Quests] [Profile] [Shop] |
+--------------------------------------------------+
```

### Lesson Layout

```
+--------------------------------------------------+
| Top Bar (compact)                                 |
+--------------------------------------------------+
| Progress Bar (8px, full width)          4/10     |
+--------------------------------------------------+
|                                                  |
|                                                  |
|          Question / Prompt                        |
|          (24px Medium, centered)                  |
|                                                  |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  +----------------------------------------------+|
|  |          Answer Option 1                      ||
|  +----------------------------------------------+|
|  +----------------------------------------------+|
|  |          Answer Option 2                      ||
|  +----------------------------------------------+|
|  +----------------------------------------------+|
|  |          Answer Option 3                      ||
|  +----------------------------------------------+|
|                                                  |
|          [Skip] [Can't listen now]                |
|                                                  |
+--------------------------------------------------+
```

---

## Icon System

- Custom character-based icons (Duo and friends extensively)
- Skill icons: Distinct, thematic, colorful (40+ unique skill icons)
- UI icons: Simple, 2px stroke, consistent with game aesthetic
- Default size: 24px for UI, 32-48px for skills
- Icons always accompanied by text in navigation
- Achievement badges: Custom, chunky, detailed designs (not just simple icons)

---

## States & Feedback

### Loading States
- Duo character with "thinking" or "waiting" expression
- Skeleton screens with green shimmer animation
- Progress bars for loading (download percentage for lessons)
- Never show a blank screen

### Empty States
- Duo with encouraging expression
- Action prompt: "Start your first lesson!" or "No friends on leaderboard yet"
- Direct CTA to begin
- Bright, colorful backgrounds with illustrations

### Error States
- Duo with sympathetic or slightly embarrassed expression
- Friendly message: "Oops! Something went wrong. Try again?"
- Retry button (green, prominent)
- Offline: "You're offline! Practice downloaded lessons?"
- Never show raw error codes
- Never blame the user

### Success/Completion States
- Full celebration mode (see Celebration Overlay component)
- Confetti, animations, sound effects
- XP summary, streak update, gems earned
- Clear "Continue" or "Next lesson" CTA
- This is the MOST important state — it's the payoff for the user's effort

---

## Gamification Layer Design Tokens

### XP System
- Correct answer: 10 XP
- Lesson completion bonus: 5 XP
- Perfect lesson (no mistakes): 2x XP bonus + "Perfect!" badge
- XP Boost (15 min): 2x all XP earned
- Daily quest completion: 20-40 XP bonus

### Streak System
- 1 day streak: Silver flame, basic celebration
- 7 day streak: Flame grows, weekly badge
- 30 day streak: Golden flame effect, special achievement
- 50 day streak: Major celebration, shareable card
- 100 day streak: Duo "epic" celebration animation
- 365 day streak: Full-screen special, "You've been learning for a year!" celebration
- Streak freeze: Ice icon overlay on flame, can purchase with gems
- Streak repair: Special animation when restoring a lost streak

### Crown / Level System
- 6 crown levels per skill
- Levels 1-5: Increasing difficulty, gold crown at level 5
- Legendary (6): Purple/gold crown with special effects
- Each level: Differentiated by crown color and animation

### Gems & Virtual Currency
- Gem icon: Blue diamond (#1CB0F6)
- Earned: Lesson completion, quest completion, streak milestones
- Spent: Streak freezes, timer boosts, hearts refill, legendary challenges, cosmetic items
- Balance displayed: Top bar in shop, profile screen
- Animation: Gems fly into counter with "clink" sound on earn

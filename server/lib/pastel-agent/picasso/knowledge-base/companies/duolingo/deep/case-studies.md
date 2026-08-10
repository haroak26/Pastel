# Duolingo Case Studies — Deep Reference

## Screen 1: Home / Learn Screen (The Path)

### Purpose
The primary screen where users see their language learning progress. This is the "game map" — the spatial representation of the entire learning journey. It must make progress visible, incentivize continuation, and make the next step obvious.

### Layout

```
+--------------------------------------------------+
| [🇪🇸 Spanish ▼]                  🔥 142  ⚡ 5,240 |
+--------------------------------------------------+
|                                                  |
|    Daily Quest                                    |
|  +----------------------------------------------+|
|  |  🎯 Complete 3 lessons         2/3           ||
|  |  [===================================░░░░░░]  ||
|  |                     +20 XP chest              ||
|  +----------------------------------------------+|
|                                                  |
|    +----+     (completed, gold)                  |
|    | ⭐ |     Intro to Spanish                   |
|    +----+                                        |
|      |  (connecting line)                        |
|    +----+     (completed, gold)                  |
|    | 📖 |     Basic Phrases                      |
|    +----+                                        |
|      |                                           |
|    +----+     (CURRENT — pulsing ring)            |
|    | 🗣 |     Greetings                          |
|    +----+                                        |
| [███░░░░░░░░░░░]  35%                            |
|      |                                           |
|    +----+     (locked, gray)                     |
|    | 🔒 |     Food & Drink                       |
|    +----+                                        |
|      |                                           |
|    +----+     (locked, gray)                     |
|    | 🔒 |     Travel                             |
|    +----+                                        |
|                                                  |
+--------------------------------------------------+
|  🏠      🏆      📋      👤      🛒             |
+--------------------------------------------------+
```

### Path Structure (The "Skill Tree")

- Vertical scrolling path of interconnected skill nodes
- Nodes are connected by lines showing the learning sequence
- Completed skills: Gold background, white icon, green checkmark badge
- Current skill: Pulsing ring animation, green background, white icon
- Locked skills: Gray background, gray icon, lock overlay, 50% opacity
- Legendary skills: Purple/gold gradient background, sparkle animation

### Progress Indicators on the Path

- **Skill progress bar**: Below each skill icon. Green fraction showing completion to next crown level.
- **Crown count**: Small crown icon with level number (1-6) above each skill node.
- **Path scroll position**: The view auto-scrolls to the current/next skill on load.
- **Overall progress**: Duo sometimes shows "You're 24% through the Spanish course!"

### Daily Quest Card

```
+--------------------------------------------------+
|  Daily Quests                                     |
|  +----------------------------------------------+|
|  | 🎯 Complete 3 lessons    2/3    +20 XP      ||
|  | 🕐 Spend 15 minutes     12/15   +30 XP      ||
|  | 💯 Earn 50 XP          45/50   +40 XP      ||
|  +----------------------------------------------+|
|  Monthly Challenge                                |
|  [████████████░░░░░░░░░░░░░░] 12/30 quests       |
+--------------------------------------------------+
```
- Displayed as a card section above the skill path
- Shows 3 daily quests with progress bars
- Monthly challenge shows cumulative progress across all days
- Completing all 3 daily quests → special chest with bonus gems
- Quest cards are colorful, chunky, and game-like

### Top Bar Details

- Course flag + language name with dropdown to switch courses
- Duo occasionally pops in from the top with a speech bubble encouraging you
- Streak flame: Orange, animated flicker. Shows freeze icon if streak freeze is active.
- XP counter: Gold lightning bolt + total XP

### Interaction Flow

1. User opens app → auto-scrolls to current skill
2. Taps current skill → transitions into a lesson
3. Swipes up to scroll through the path (past skills, future skills)
4. Taps a completed skill → opens review/practice options
5. Taps a locked skill → shows "Complete previous lessons to unlock"
6. Taps daily quest → expands to show full quest details

### Design Notes

- This screen must feel like a GAME MAP, not a curriculum
- The path encourages progression through connectedness (you see what's next)
- Completed skills give satisfaction — you can scroll back and see how far you've come
- The visual weight is on the NEXT step — always making it clear what to do
- Seasonal themes: The path gets special decorations for holidays, events, and Duolingo events (e.g., Halloween path has pumpkins, Winter has snow)

---

## Screen 2: Lesson Exercise

### Purpose
The core game loop. Users answer questions to progress through the lesson. The interface must support rapid interaction, provide clear feedback, and maintain the game feel during moments of success and failure.

### Layout

```
+--------------------------------------------------+
| [X Close]                         ❤️❤️❤️🖤🖤      |
+--------------------------------------------------+
| [███████████████░░░░░░░░░░░░░░░░░]  6/10          |
+--------------------------------------------------+
|                                                  |
|                                                  |
|     Translate this sentence:                      |
|                                                  |
|     "I want to eat breakfast"                     |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  +----------------------------------------------+|
|  |          Quiero desayunar                    ||
|  +----------------------------------------------+|
|  +----------------------------------------------+|
|  |          Quiero comer desayuno               ||
|  +----------------------------------------------+|
|  +----------------------------------------------+|
|  |          Quiero beber leche                  ||
|  +----------------------------------------------+|
|                                                  |
|              [Check]                              |
|                                                  |
+--------------------------------------------------+
```

### Exercise Types

**Multiple Choice (Translation)**
- Question text at top (24px Medium)
- 3 answer options as pill buttons
- User taps one option → immediate feedback
- Can also type answer via keyboard for "hard mode"

**Word Bank (Sentence Building)**
```
+--------------------------------------------------+
|                                                  |
|     Build the sentence:                           |
|                                                  |
|  +------+  +------+  +------+  +------+          |
|  |  Yo  |  | como |  | pan  |  | bebo |          |
|  +------+  +------+  +------+  +------+          |
|                                                  |
|  +------+  +------+  +------+  +------+          |
|  |      |  |      |  |      |  |      |          |
|  +------+  +------+  +------+  +------+          |
|     (constructed answer area)                     |
|                                                  |
+--------------------------------------------------+
```
- Word tiles at the top (shuffled)
- User drags or taps tiles to the answer area
- Selected tiles appear in order
- User can tap a selected tile to remove it

**Listening Exercise**
- Audio plays automatically (or tap speaker to replay)
- 3 answer options as pill buttons
- Speaker icon: prominent, green, with sound wave animation during playback
- "Can't listen now" link at bottom for accessibility

**Speaking Exercise**
- Microphone icon centered (large, 64px)
- Tap to start recording, speaks back to confirm
- Waveform animation during recording
- Feedback: "Nice pronunciation!" or "Try again" with correct pronunciation playback
- "Can't speak now" link for accessibility

**Fill in the Blank**
- Sentence with missing word
- Multiple choice or type-in
- Blank is visually distinct (underline or dashed box)

**Matching Pairs**
- Two columns of items to match
- User draws lines or selects pairs
- Matched pairs turn green and move out of the way

### Feedback States

**Correct Answer**
- Selected button: Background turns green (#58CC02), text white, border green
- Checkmark icon animates in on the right side
- Subtle scale pulse (1.0 → 1.05 → 1.0)
- Sound: Pleasant "ding" (ascending tone)
- "Nice!" or "Correct!" text briefly appears
- Auto-advance after 800ms (or tap to advance faster)

**Wrong Answer**
- Selected button: Background turns red (#FF4B4B), shake animation (3 horizontal oscillations, 300ms)
- Correct answer: Highlights in green with checkmark
- Sound: Gentle "buzz" (descending tone)
- Heart flies off screen and breaks (if lives system active)
- "Almost! The correct answer is..." text appears
- Auto-advance after 1200ms (slightly longer to read correct answer)

### Lesson Flow

1. Question displayed → user reads/listens
2. User selects/taps answer
3. Immediate feedback (correct/wrong)
4. Brief pause to process feedback
5. Next question auto-loads
6. Progress bar advances
7. Repeat 10-20 times
8. Lesson complete → transitions to completion screen

### Lesson UI Details

- Progress bar: Always visible at top, thick (8px), green fill, rounded ends
- Timer: Not shown by default (too stressful). Optional timed challenges have a countdown.
- Hearts: Top right, visible during lesson. Animates on heart loss.
- Close button: Top left. Exiting mid-lesson triggers "You'll lose your progress!" warning.
- "Skip" option: Available for some exercise types (speaking, listening)

### Interaction Design for Speed

- Answer buttons are large (56px tall) and stacked vertically with 12px gaps
- Buttons respond to tap on RELEASE (not press) — allows cancellation by sliding off
- Single tap is the only gesture needed (no swiping, no long-press)
- The Check/Submit button only exists for type-in exercises (multiple choice auto-submits)
- Rapid-fire question flow: target 5-15 seconds per question

---

## Screen 3: Lesson Complete

### Purpose
The reward screen. This is the dopamine delivery system of Duolingo. Every lesson completion triggers a mini-celebration that reinforces the habit loop. The design must feel like winning.

### Layout (Standard Completion)

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|               🎉  GREAT JOB!  🎉                 |
|                                                  |
|                 +15 XP                            |
|                                                  |
|            [Duo celebrating — animated]           |
|                                                  |
|  +----------------------------------------------+|
|  |           Daily Quest Progress               ||
|  |  🎯 Complete 3 lessons         3/3 ✓         ||
|  |  Complete! +20 XP earned!                    ||
|  +----------------------------------------------+|
|                                                  |
|  +----------------------------------------------+|
|  |             CONTINUE                         ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

### Completion Variants

**Perfect Lesson (No Mistakes)**
```
+--------------------------------------------------+
|                                                  |
|              ⭐  PERFECT!  ⭐                     |
|                                                  |
|                +30 XP                             |
|            (2x bonus for no mistakes)             |
|                                                  |
|     [Duo with sunglasses — "Smooth!" animation]   |
|                                                  |
+--------------------------------------------------+
```
- Extra celebration for zero mistakes
- 2x XP bonus
- Duo wears sunglasses
- Special sound fanfare
- "Perfect" badge earned

**Streak Milestone (7, 30, 50, 100, 365, 1000 days)**
```
+--------------------------------------------------+
|                                                  |
|           🔥  100 DAY STREAK!  🔥                |
|                                                  |
|          You've been learning for                 |
|              100 days in a row!                   |
|                                                  |
|     [Duo with party hat, confetti everywhere]     |
|                                                  |
|         [Share achievement]                       |
+--------------------------------------------------+
```
- Streak number prominently displayed
- Special animation for each milestone tier
- Shareable card generation
- Bonus gems or XP
- Duo's expressions escalate with milestone significance

**Level Up**
```
+--------------------------------------------------+
|                                                  |
|             LEVEL UP! 🆙                         |
|                                                  |
|          You reached Crown Level 3               |
|                                                 |
|     [Skill icon transforming — crown animation]   |
|                                                  |
|                +50 XP                             |
|              +25 Gems 💎                          |
|                                                  |
+--------------------------------------------------+
```

### Completion Screen Components

1. **XP earned**: Large, bold, gold-colored number that counts up with animation
2. **Encouragement text**: "Great job!" "Awesome!" "You crushed it!" — varied to avoid repetition
3. **Duo animation**: Character celebrates. Expressions vary based on performance:
   - Normal: Happy, cheering
   - Perfect: Over-the-top celebration, sunglasses
   - Slow/bad: Encouraging, "You'll get it next time!"
4. **Quest progress**: If quests were completed, shown with checkmarks and bonus
5. **Continue button**: Green pill, full-width, prominent. Leads to next lesson or back to path.
6. **Ad display** (free tier): Brief ad shown before completion screen, skippable
7. **Streak update**: "Day 142!" with flame animation (always, unless streak freeze used)

### Sound Design on Completion
- Ascending musical fanfare (3 seconds)
- XP "coin" sound as the number counts up
- Duo voice line: "Great job!" or "You're on fire!" (in target language)
- Quest completion: Special jingle
- Streak milestone: Extended fanfare with extra musical flourishes

---

## Screen 4: Leaderboard

### Purpose
Social competitive motivation. Weekly leaderboards create urgency and FOMO, encouraging daily practice to maintain or improve rank. The design borrows heavily from competitive gaming (promotion/relegation leagues).

### Layout

```
+--------------------------------------------------+
|  Leaderboard               [Week] 3d 12h left    |
+--------------------------------------------------+
|  League: Diamond                                  |
+--------------------------------------------------+
|                                                  |
|  +--------------------------------------------------+|
|  |  👑 #1  [Avatar]  Sarah J.        2,450 XP 🔥  ||
|  |       [=============== Progress ==============]  ||
|  +--------------------------------------------------+|
|                                                  |
|  +--------------------------------------------------+|
|  |      #2  [Avatar]  Alex M.         2,100 XP     ||
|  |       [============ Progress ============]       ||
|  +--------------------------------------------------+|
|                                                  |
|  +==================================================+|
|  | 👈  #3  [Avatar]  YOU             1,980 XP     ||
|  |       [============ Progress ============]       ||
|  +==================================================+|
|                                                  |
|  +--------------------------------------------------+|
|  |     #4  [Avatar]  Mike T.         1,750 XP     ||
|  |      [=========== Progress =========]            ||
|  +--------------------------------------------------+|
|                                                  |
|  +--------------------------------------------------+|
|  |     #5  [Avatar]  Emma W.         1,620 XP     ||
|  |      [========== Progress ==========]            ||
|  +--------------------------------------------------+|
|                                                  |
|  ────────────────  Demotion Zone  ────────────────  |
|                                                  |
|  +--------------------------------------------------+|
|  |     #26 [Avatar]  Linda K.          320 XP     ||
|  |      [== Progress ==========================]    ||
|  +--------------------------------------------------+|
|                                                  |
+--------------------------------------------------+
```

### League Tiers (Bottom to Top)

| League | Color | Promotion | Demotion |
|--------|-------|-----------|----------|
| Bronze | Bronze gradient | Top 7 | Bottom 5 |
| Silver | Silver gradient | Top 7 | Bottom 5 |
| Gold | Gold gradient | Top 7 | Bottom 5 |
| Sapphire | Blue gradient | Top 7 | Bottom 5 |
| Ruby | Red gradient | Top 7 | Bottom 5 |
| Emerald | Green gradient | Top 7 | Bottom 5 |
| Amethyst | Purple gradient | Top 7 | Bottom 5 |
| Pearl | Pearl/white gradient | Top 7 | Bottom 5 |
| Obsidian | Dark/black gradient | Top 5 | Bottom 5 |
| Diamond | Brilliant diamond gradient | Top 5 | Bottom 5 (and final) |

### Leaderboard Entry (Detailed)

```
+==================================================+
| 👈  #3  [Avatar]  YOU             1,980 XP 🔥   |
|       [============ Progress ============]       |
+==================================================+
```
- Current user highlighted with light green (#E5F6D3) background and "YOU" indicator
- Promotion zone entries: Subtle green gradient on left edge
- Demotion zone entries: Subtle red gradient on left edge
- Rank number: Large (20px), bold, left
- Avatar: 48px circular, with league badge overlay in corner
- Name: 16px Medium. Current user shown as "YOU"
- XP: Right-aligned, 16px Bold
- Streak flame if user is on a streak
- Progress bar: Visual representation of XP relative to others
- Friend indicator: Small friend icon if user is a contact

### League Header

```
+--------------------------------------------------+
|  Diamond League                                   |
|  +----------------------------------------------+|
|  |  🏆  #3  Top 5 promote to next league        ||
|  +----------------------------------------------+|
|  Ends in: 3 days 12 hours                        |
+--------------------------------------------------+
```
- League name with corresponding color gradient
- User's current rank displayed with trophy icon
- Promotion/demotion criteria shown
- Countdown timer to end of weekly competition

### Tournament Mode (Special Events)

- Multi-week tournaments with elimination rounds
- Special tournament badge/icon
- Higher stakes (must place top 10 for 3 consecutive weeks)
- Special rewards (exclusive badges, gem bonuses)
- Tournament leaderboard has special visual treatment (podium, special colors)

### Social Integration

- Friends list filter (toggle between "All" and "Friends")
- "Nudge" feature: Send a playful notification to a friend to remind them to practice
- Friend request: Link to add more friends (boosts engagement through social accountability)
- Friend activity feed: "Sarah just completed a lesson!" — shown as ephemeral notifications in the app

### Interaction Flow

1. User taps Leaderboard tab
2. Sees current week's standings with countdown timer
3. Scrolls through all 30 participants
4. Sees promotion and demotion zones clearly marked
5. "Nudge" button on friend entries
6. At end of week: "Results" screen showing promotion/demotion with animation

---

## Screen 5: Profile

### Purpose
Identity, achievements, and stats. The profile is the user's trophy case — a showcase of everything they've earned. It's also the settings and account hub, but the emphasis is on achievements.

### Layout

```
+--------------------------------------------------+
|  Profile                                          |
+--------------------------------------------------+
|                                                  |
|  +--+                                            |
|  |  |  [Avatar / Duolingo character]              |
|  +--+                                            |
|     Sarah J.                                     |
|     @sarah_learns_spanish                        |
|     Learning Spanish · 142 day streak             |
|                                                  |
|  +--------------------------------------------------+|
|  |  🔥 142      👑 1,250      💎 2,340              ||
|  |  Streak       Total XP       Gems                ||
|  +--------------------------------------------------+|
|                                                  |
|  Statistics                                       |
|  +--------------------------------------------------+|
|  |  📚  245 lessons completed                       ||
|  |  📖  3,420 words learned                          ||
|  |  ⏱  84 hours spent learning                      ||
|  |  🗣  1,250 sentences spoken                      ||
|  +--------------------------------------------------+|
|                                                  |
|  Achievements                                     |
|  +------+  +------+  +------+  +------+          |
|  | 🏆    |  | 🔥    |  | ⭐    |  | 🎯    |          |
|  | 7-day |  | 100   |  |Perfect|  | Quest |          |
|  |Streak |  | Streak|  |Lesson |  |  King |          |
|  +------+  +------+  +------+  +------+          |
|  +------+  +------+  +------+  +------+          |
|  | 📚    |  | 🎉    |  | 🌙    |  | 🔒   |          |
|  |Scholar|  | Social|  | Night |  |Locked|          |
|  |       |  |Butterf|  |  Owl  |  |      |          |
|  +------+  +------+  +------+  +------+          |
|                                                  |
|  Friends                                          |
|  [Friend 1]  [Friend 2]  [Friend 3]  [+ Add]      |
|                                                  |
|  Settings                                         |
|  +--------------------------------------------------+|
|  | ⚙️ Profile settings                               ||
|  | 🔔 Notifications                                  ||
|  | 🌐 Language settings                              ||
|  | 👥 Friends & contacts                             ||
|  | 💳 Super Duolingo subscription                    ||
|  | 🛠 Help & feedback                                ||
|  | 🚪 Sign out                                      ||
|  +--------------------------------------------------+|
|                                                  |
+--------------------------------------------------+
```

### Profile Header

- **Avatar**: Can be a Duolingo character (selected from a cast) or a photo. Rounded, 80-100px.
- **Name + username**: 20px Bold name, 14px username in gray
- **Status line**: "Learning Spanish · 142 day streak" in green
- **Edit profile button**: Ghost button, subtle

### Stats Row (Three Key Metrics)

```
+--------------------------------------------------+
|  🔥 142      👑 1,250      💎 2,340              |
|  Streak       Total XP       Gems                |
+--------------------------------------------------+
```
- Three cards in a horizontal row
- Each has an icon, a large number, and a label
- Colors: Streak = orange, XP = gold, Gems = blue
- Tap to expand (streak calendar, XP history, gem transaction history)

### Statistics Section

```
+--------------------------------------------------+
|  📚  245 lessons completed                       |
|  📖  3,420 words learned                          |
|  ⏱  84 hours spent learning                      |
|  🗣  1,250 sentences spoken                      |
+--------------------------------------------------+
```
- List-style rows with icons
- Number is prominent, label is secondary
- Updates in real-time (new numbers animate in after each lesson)

### Achievements Grid

```
+------+  +------+  +------+  +------+
| 🏆    |  | 🔥    |  | ⭐    |  | 🎯    |
| 7-day |  | 100   |  |Perfect|  | Quest |
|Streak |  | Streak|  |Lesson |  |  King |
+------+  +------+  +------+  +------+
```
- Grid of achievement badges (3-4 columns)
- Earned badges: Full color, with icon and name
- Locked badges: Grayed out, lock icon overlay, "???" name for mystery
- Tap earned badge to view description and date earned
- Tap locked badge to see unlock criteria
- New badge notification: Badge glows/pulses, "NEW" ribbon overlay

### Achievement Badge System (Examples)

| Badge | Name | Criteria |
|-------|------|----------|
| 🏆 | 7-Day Streak | Practice 7 days in a row |
| 🔥 | 100-Day Streak | Practice 100 days in a row |
| ⭐ | Perfect Lesson | Complete a lesson with no mistakes |
| 🎯 | Quest King | Complete all 3 daily quests X times |
| 📚 | Scholar | Learn 1000 words |
| 🎉 | Social Butterfly | Make 5 friends on Duolingo |
| 🌙 | Night Owl | Complete lessons after 10 PM X times |
| 🎂 | Duo's Birthday | Practice on Duolingo's launch anniversary |
| 🗣 | Chatterbox | Speak 1000 sentences |
| 📖 | Page Turner | Complete 10 stories |

### Settings Section

- Clean list with icons, chevron right indicators
- Green toggle switches for binary settings
- "Super Duolingo" banner with upgrade prompt (for free users)
- "Sign out" in red (#FF4B4B) at the bottom — prominent enough to find, not prominent enough to accidentally tap

### Interaction Flow

1. User taps Profile tab
2. Views stats, achievements, and settings
3. Taps achievement to learn more
4. Taps settings item to navigate to sub-screen
5. Edits avatar/name at top
6. Adds friends from friends row

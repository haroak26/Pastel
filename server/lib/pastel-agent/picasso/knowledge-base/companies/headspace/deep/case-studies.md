# Headspace Case Studies — Screen-by-Screen Deep Dive

## Overview

Five key screens that define the Headspace experience. Each demonstrates how the design
system comes together to create a therapeutic, calming interaction from first launch
through daily use.

---

## Screen 1: Home

### Layout Structure
```
┌──────────────────────────────┐
│  ☰  Good morning, [name]  👤 │  ← greeting header
│                              │
│  ┌──────────────────────────┐│
│  │                          ││
│  │   [Illustration: warm    ││  ← daily meditation pick
│  │    morning scene, blob    ││     large featured card
│  │    shapes, soft colors]   ││
│  │                          ││
│  │  Today's meditation       ││
│  │  Finding Calm             ││
│  │  10 min  ·  Andy         ││
│  │                  [▶︎ Start]││
│  └──────────────────────────┘│
│                              │
│  🔥 42 days    ⏱ 1,284 min  │  ← stats row (subtle, encouraging)
│  Nice work!                  │
│                              │
│  Continue your journey →     │  ← section header
│                              │
│  ┌─────┐ ┌─────┐ ┌─────┐    │
│  │     │ │     │ │     │    │  ← horizontally scrolling
│  │ img │ │ img │ │ img │    │     course cards
│  │     │ │     │ │     │    │
│  │ 40% │ │  new│ │  ✓  │    │
│  └─────┘ └─────┘ └─────┘    │
│                              │
│  How are you feeling?        │  ← mood check-in
│  🟡 🟡 🟡 🟡 🟡              │     emoji grid
│                              │
│  [  Today  Meditate  Sleep   ]  ← bottom tab bar
└──────────────────────────────┘
```

### Key Design Decisions

**The Greeting**: Simple, warm, with the user's name. Sets a personal, welcoming tone
immediately. The hamburger menu and profile avatar frame the top without crowding it.

**The Daily Pick**: The dominant element. It occupies significant vertical space —
roughly 40% of the viewport before scrolling. The illustration is the emotional anchor,
setting the mood before the user reads anything. Title, duration, and instructor are
subordinate to the visual. The "Start" button is a warm pill that feels like an
invitation, not a command.

**Stats Row**: Fire emoji for streak keeps it playful and human. "Nice work!" is
encouragement, not a metric. The minutes counter is secondary — Headspace celebrates
consistency over volume. Both stats are compact and don't compete with the daily pick.

**Course Progress**: Horizontally scrolling cards keep the home screen from becoming a
vertical scroll-fest. Each card is around 140-160px wide with a small illustration,
title, and progress indicator. "40%" shows on in-progress courses. "New" badge on
unstarted ones. "✓" on completed. This section invites continuation without pressure.

**Mood Check-In**: At the bottom, deliberately. It's optional, not a gate. The emoji
grid is fast — one tap, instant feedback. No typing, no form. The design reduces
friction to zero so users actually engage.

---

## Screen 2: Meditate (Browse)

### Layout Structure
```
┌──────────────────────────────┐
│  Meditate                    │  ← simple page title
│                              │
│  🔍 Search meditations...    │  ← rounded search input
│                              │
│  For you    Stress    Sleep   │  ← horizontally scrolling
│  [active]   Anxiety   Focus   │     category chips
│                              │
│  Featured collections        │  ← section header
│                              │
│  ┌──────────────────────────┐│
│  │ [Illustration]           ││  ← full-width collection
│  │                          ││     hero card
│  │  Basics of Meditation    ││
│  │  10 sessions · Free      ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────┐ ┌──────────┐   │
│  │ [Illus.] │ │ [Illus.] │   │  ← 2-column course grid
│  │          │ │          │   │
│  │ Course   │ │ Course   │   │
│  │ 8 sess. │ │ 12 sess.│   │
│  └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐   │
│  │ [Illus.] │ │ [Illus.] │   │
│  │          │ │          │   │
│  │ Course   │ │ Course   │   │
│  │ 5 sess. │ │ 6 sess. │   │
│  └──────────┘ └──────────┘   │
└──────────────────────────────┘
```

### Key Design Decisions

**Category Chips**: Pill-shaped, horizontally scrolling, warm tones. The active chip
gets the warm orange fill; others are outlined or use a lighter warm gray. "For you"
is the default active — the gentle personalization that makes browsing feel curated
rather than overwhelming.

**Featured Collection**: A larger hero card that showcases a curated collection (like
"Basics of Meditation" for new users). Always positioned at the top of the browse
feed. Uses a distinct warm background or gradient to differentiate from the standard
course cards below.

**Course Grid**: 2-column layout with equal-height cards. Each card has a warm-toned
illustration taking the top 55-60%, course title below, and session count. Cards are
generously rounded (16-20px) with soft shadows. The grid has 16px gaps, giving each
card room to breathe.

**Absence of Filters**: Notably, there's no complex filtering UI. The category chips +
search is the entire navigation. This is intentional — too many filtering options
creates decision fatigue, which works against the meditative experience.

---

## Screen 3: Meditation Player

### Layout Structure
```
┌──────────────────────────────┐
│                              │
│                              │
│        ┌───────────┐         │
│       │             │        │
│      │  [Animated    │       │
│     │   illustration  │      │  ← immersive illustration
│     │   or ambient     │      │     or ambient scene
│      │   scene]       │       │
│       │             │        │
│        └───────────┘         │
│                              │
│   Finding Calm                │  ← session title
│   Day 2 of Basics Course      │  ← context
│                              │
│   ──────────────────────     │  ← progress bar (played vs. remaining)
│   04:12 / 10:00              │  ← timer
│                              │
│   🎤       ⏸       🌙        │  ← controls: voice toggle,
│                              │     play/pause, background sounds
│   [        ●        ]       &│  ← large play/pause circle
│                              │
└──────────────────────────────┘
```

### Key Design Decisions

**Immersive Visual**: The top ~50% of the screen is devoted to an illustration or
ambient scene. This might be a gently animated landscape, a blob-like character
meditating, or abstract organic shapes slowly shifting colors. The visual is not just
decoration — it gives the mind something calm to rest on during the session, similar
to a focal point in meditation practice.

**Minimal Chrome**: During a session, the standard app chrome (tab bar, header) is
hidden or significantly reduced. The player is nearly full-screen. This reduces visual
noise when the user is trying to focus.

**Progress Bar**: A subtle, thin progress line — not a dominant element. Shows elapsed
time in a gentle, non-anxiety-inducing way. The remaining time is equally emphasized
(instead of only showing elapsed) so the user isn't counting down.

**Controls**: Three small, subtly styled buttons in a row: voice guidance toggle
(microphone icon), play/pause (larger, central, warm orange circle), background sounds
(crescent moon for sleep sounds or music icon). The icons are soft — thin strokes,
warm grays when inactive, warm orange when active.

**Background Sounds Toggle**: Opens a bottom sheet with a grid of ambient sounds
(rain, ocean, forest, white noise, etc.). Each is a small rounded card with an icon
or small illustration. Tapping one adds it to the session audio mix. The volume
slider is a single horizontal bar — minimal, unobtrusive.

**Session End**: When the timer completes, the screen transitions to a gentle completion
state: a subtle warm glow animation, "Session complete" text, and three gentle prompts —
"Reflect" (mood check-in), "Share" (optional), and "Done" (primary, returns to home).
No jarring celebration, no gamification. Just quiet acknowledgment.

---

## Screen 4: Sleep

### Layout Structure
```
┌──────────────────────────────┐
│  Sleep                       │
│                              │
│  ┌──────────────────────────┐│
│  │                          ││
│  │   [Night illustration:    ││  ← sleep pick / featured
│  │    stars, moon, soft      ││     sleep story or sound
│  │    dark warm colors]      ││
│  │                          ││
│  │  Tonight's Sleep Story    ││
│  │  Moonlit Garden           ││
│  │  25 min                   ││
│  └──────────────────────────┘│
│                              │
│  Wind-down                   │  ← section header
│                              │
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 🌙   │ │ 📖   │ │ 🧘   │  │  ← wind-down options:
│  │ Body │ │Night │ │Sleep │  │     body scan, nighttime
│  │ Scan │ │Notes │ │Moves │  │     SOS, sleep exercises
│  └──────┘ └──────┘ └──────┘  │
│                              │
│  Sleep Sounds                │  ← section header
│                              │
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 🌧️   │ │ 🌊   │ │ 🌲   │  │  ← soundscape grid
│  │ Rain │ │Ocean │ │Forest│  │
│  └──────┘ └──────┘ └──────┘  │
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 🔥   │ │ ☕   │ │ 🎵   │  │
│  │ Fire │ │Café  │ │Drone│  │
│  └──────┘ └──────┘ └──────┘  │
│                              │
│  Sleep Stories                │  ← section header
│                              │
│  [Horizontally scrolling      │
│   collection of story cards]  │
└──────────────────────────────┘
```

### Key Design Decisions

**Night Mode UI**: The sleep section uses a distinct warm-dark color scheme even during
daytime. Backgrounds shift to deep warm tones, text is cream-colored, and the overall
brightness is reduced. This is an intentional circadian-friendly design — blue light
suppression through warm-toned UI.

**Featured Sleep Pick**: Similar prominence to the home screen's daily pick, but with a
nighttime illustration. Stars, moon, soft glowing elements. The card may use a slight
gradient toward deep warm blue-purple (never cold blue).

**Wind-Down Section**: Short (1-5 minute) pre-sleep exercises. Displayed as compact
cards in a horizontal row. These are the "just getting into bed" content — body scans,
nighttime journaling prompts, gentle sleep movements. Each card is small (100-120px wide)
with a minimal icon or small illustration.

**Sleep Sounds Grid**: A dense grid of ambient soundscapes. Each is a small rounded
card with a simple icon (or small illustration) and a one-word label. These launch
a timer-based playback (you set how long the sound plays) rather than a full session.
The player for sleep sounds is even more minimal than the meditation player — just a
timer selector (30min, 1hr, 2hr, "Until I wake") and a stop button.

**Sleep Stories**: A horizontally scrolling collection similar to course cards. Each
card features a dreamy, nighttime-themed illustration. Stories are narrated — the
title, narrator name, and duration are shown. These are longer-form (20-45 minutes).

---

## Screen 5: Profile

### Layout Structure
```
┌──────────────────────────────┐
│  Profile                     │
│                              │
│        [Avatar Photo]        │  ← circular, warm border
│        Alex Chen             │
│        Member since 2019     │
│                              │
│  ┌──────────────────────────┐│
│  │          Stats            ││
│  │                          ││
│  │  🔥     ⏱     🧘         ││  ← stat cards in a row
│  │  42    1,284   312        ││
│  │ days   mins  sessions     ││
│  └──────────────────────────┘│
│                              │
│  Mood History                │  ← section header
│                              │
│  ┌──────────────────────────┐│
│  │  [Color-coded mood        ││  ← calendar-style mood
│  │   calendar — each day     ││     visualization
│  │   tinted by mood emoji]   ││
│  │                          ││
│  └──────────────────────────┘│
│                              │
│  Achievements                │  ← section header
│                              │
│  ┌───────────┐ ┌───────────┐ │
│  │  🏆       │ │  ⭐       │ │
│  │ 7-day     │ │ 50        │ │  ← achievement cards
│  │ streak    │ │ sessions  │ │
│  └───────────┘ └───────────┘ │
│                              │
│  Settings                    │  ← list-style settings
│  > Notifications             │
│  > Sleep Settings            │
│  > Account                   │
│  > Help                      │
└──────────────────────────────┘
```

### Key Design Decisions

**Gentle Self-Reflection**: The profile is designed as a personal journal, not a public
profile or leaderboard. There's zero social comparison. The focus is on the user's own
journey — their stats, their moods, their achievements. The tone is reflective and
encouraging.

**Avatar and Identity**: A circular photo with a soft warm border (subtle glow effect).
Name displayed prominently. "Member since" shows longevity without creating pressure —
it's about the journey, not the count.

**Stats Summary**: Three compact stat cards in a row: streak (fire emoji, days), total
minutes (clock emoji), total sessions (lotus/meditation emoji). The numbers are large
but the overall feel is compact and informational, not braggy. These are the user's
private milestones.

**Mood History**: A color-coded calendar view. Each day shows a small colored dot or
cell corresponding to the mood emoji selected. Warm yellows, greens, and oranges for
positive moods; soft blues and purples for lower moods (but never alarming reds). This
visualization helps users see patterns over time — it's a tool for self-awareness, not
a performance metric.

**Achievements**: Small, warm-toned badge cards. Each has a subtle illustration or icon,
a short name ("7-day streak", "50 sessions", "Explored 5 courses"), and no complex
gamification. Achievements are milestones, not levels or points. They celebrate the
journey quietly.

**Settings**: A simple, clean list at the bottom. Minimalist with right-facing chevrons.
The settings section is intentionally plain — it's functional, not decorative. The calm
design language continues (rounded separators, warm gray text), but settings are where
the user goes to manage, not to be inspired.

---

## Summary — The Pattern Across All Screens

1.  **Warmth is everywhere**: backgrounds, text, accents, illustrations — never a cold pixel
2.  **One primary focus per screen**: daily pick (home), player (meditate), sound grid (sleep)
3.  **Illustration as emotional anchor**: every key screen has a visual that sets the mood
4.  **Stats are encouraging, not evaluative**: "Nice work!" not "You're behind"
5.  **Generous white space**: breathing room is non-negotiable, even in data displays
6.  **Gentle motion**: every transition, scroll, and reveal is slow and calming
7.  **Optional interactions**: mood check-in, sleep sounds, course browsing — nothing is forced
8.  **Dark mode in context**: sleep screen is always warm-dark; meditation player can be dark

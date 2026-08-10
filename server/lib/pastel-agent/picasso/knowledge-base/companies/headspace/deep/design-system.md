# Headspace Design System — Deep Dive

## Overview

This document specifies the design tokens and component patterns that define Headspace's
visual language. Every value here supports the therapeutic design philosophy: reduce
anxiety, promote calm, feel warm. When in doubt, lean softer.

---

## Color System

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--warm-orange` | `#FF7D4F` | Primary accent, buttons, progress rings, active states |
| `--warm-coral` | `#FF8E7A` | Secondary accent, highlights, illustration fills |
| `--warm-yellow` | `#FFE4B5` | Soft backgrounds, glow effects, accent washes |
| `--blush-pink` | `#FFD1C1` | Emotional warmth, self-care contexts, gentle cards |
| `--soft-peach` | `#FFE8D6` | Page backgrounds, section washes |

### Neutrals

| Token | Hex | Usage |
|---|---|---|
| `--cream` | `#FFF8F0` | Primary page background (warm, not sterile white) |
| `--warm-gray-100` | `#F5F0EB` | Card backgrounds, elevated surfaces |
| `--warm-gray-200` | `#E8E3DD` | Borders (subtle), dividers (gentle) |
| `--warm-gray-400` | `#B8B2AB` | Secondary text, icons, metadata |
| `--warm-gray-600` | `#7A7570` | Body text, labels |
| `--warm-gray-800` | `#3D3A37` | Headings, primary text |
| `--warm-charcoal` | `#2C2926` | Darkest text, highest emphasis |

### Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `--dark-bg` | `#2C2824` | Page background (warm brown-black) |
| `--dark-surface` | `#3D3733` | Card backgrounds, elevated surfaces |
| `--dark-border` | `#4A4440` | Subtle borders, separators |
| `--dark-text` | `#E8E3DD` | Primary text on dark |
| `--dark-text-muted` | `#A8A29E` | Secondary text on dark |

### Semantic Colors (Minimal Use)

| Token | Hex | Usage |
|---|---|---|
| `--positive` | `#7BC89C` | Completion states, success (muted green, warm-toned) |
| `--caution` | `#FFB74D` | Gentle warnings (warm amber, not alarming) |
| `--negative` | `#FF8A80` | Errors (warm red, not harsh) |

### The Rules
- Never use pure black (`#000`) or pure white (`#FFF`) as a background
- Never use saturated primary colors — always tone toward warmth
- Gradients must transition between two warm colors only
- Cold blues, cool grays, and mint greens are prohibited from the core palette
- Dark mode is warm-toned — never cold, never pure black

---

## Typography Scale

### Typeface
Rounded, humanist sans-serif — Nunito, Varela Round, or similar with:
- Rounded terminals
- Generous x-height
- Open apertures
- Single-story 'a' and 'g' (friendly letterforms)

### Scale

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-xs` | 12px | 400 | 1.5 | Timestamps, metadata, fine print |
| `--text-sm` | 14px | 400 | 1.5 | Supporting text, labels, captions |
| `--text-base` | 16px | 400 | 1.6 | Body text, descriptions, session info |
| `--text-md` | 18px | 400 | 1.6 | Lead body text, card titles |
| `--text-lg` | 20px | 500 | 1.4 | Section headings, card headers |
| `--text-xl` | 24px | 500 | 1.3 | Page headings, hero titles |
| `--text-2xl` | 32px | 600 | 1.2 | Screen titles, main headings |
| `--text-3xl` | 40px | 600 | 1.1 | Timers, meditation duration display |
| `--text-4xl` | 56px | 300 | 1.0 | Hero numbers (streak, minutes) |

### Weight Rules
- Light (300): Only for hero numbers — the large "cushion" numbers feel soft
- Regular (400): All body text, most UI
- Medium (500): Emphasis, section headings, active states
- Semi-bold (600): Page titles, primary headings — used sparingly
- Never use bold (700+) — too harsh for the calm aesthetic
- Never use thin/hairline (100) — feels anxiety-inducing, fragile

---

## Spacing Scale

### Core Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | Icon padding, tight inline spacing |
| `--space-sm` | 8px | Inline gaps, chip padding, icon-to-text |
| `--space-md` | 16px | Standard gap between related elements |
| `--space-lg` | 24px | Component padding, card content padding |
| `--space-xl` | 32px | Section padding, card margin |
| `--space-2xl` | 48px | Large section gaps, screen padding |
| `--space-3xl` | 64px | Hero section margins, major content breaks |
| `--space-4xl` | 96px | Page-level breathing room |
| `--space-5xl` | 128px | Maximum separation, landing section breaks |

### Density Rules
- Mobile screens: minimum 24px horizontal padding
- Cards: minimum 24px internal padding on all sides
- Between cards in a list: 16-24px gap
- Between sections: 64-128px — each section is its own "moment"
- Text blocks: never exceed 72 characters per line for readability at calm reading speed
- Content never touches screen edges — always buffered by at least 24px

---

## Radius System

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Subtle rounding, small controls, chips |
| `--radius-md` | 12px | Standard cards, containers, inputs |
| `--radius-lg` | 16px | Featured cards, modal dialogs |
| `--radius-xl` | 20px | Hero cards, meditation cards |
| `--radius-full` | 9999px | Pill buttons, tags, avatars |

### Shape Rules
- Nothing is perfectly square — every container has at least 8px radius
- Buttons are always pill-shaped (`radius-full`) or minimally `radius-lg`
- Cards use `radius-lg` (16px+) — the "blob" effect is essential
- Illustrations use organic blob shapes — irregular, undulating curves
- Profile avatars are circular
- Never use 0px, 2px, or 4px radius — those feel sharp and tense

---

## Shadow System

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 2px 12px rgba(60, 45, 30, 0.06)` | Standard cards |
| `--shadow-elevated` | `0 4px 20px rgba(60, 45, 30, 0.08)` | Modals, overlays, player |
| `--shadow-float` | `0 8px 32px rgba(60, 45, 30, 0.10)` | Floating elements, tooltips |

### Shadow Rules
- Shadows are always warm-toned (use warm brown, not black or cool gray)
- Shadows are subtle — `.06` to `.10` opacity, never darker
- Shadows are used sparingly — only to create depth, never for decoration
- No hard edge shadows — generous blur (12-32px)
- No colored glow shadows — only warm-toned depth shadows
- Dark mode shadows are nearly invisible — depth is created through surface lightness

---

## Surface Treatments

### Cards
- Very rounded (`--radius-lg` or higher)
- Warm background (`--cream` or `--warm-gray-100`)
- Subtle shadow (`--shadow-card`)
- 24px+ internal padding
- Content is never dense — one primary idea per card

### Bands / Sections
- Soft pastel washes for alternating sections
- Large vertical margins (64-128px)
- Background alternates between `--cream` and `--soft-peach` / `--warm-yellow`
- Never use harsh color breaks between sections

### Panels
- Warm white or very light warm gray
- Rounded corners
- May contain grouped content (settings, lists)
- Generous internal padding

### Dividers
- Light warm gray (`--warm-gray-200`)
- 1px height
- Full-width or inset
- Used minimally — space should do the separating whenever possible

---

## Component Patterns

### Meditation Card
```
┌─────────────────────────┐
│                         │
│    [Illustration]       │
│    Blob shape, warm     │
│    theme illustration    │
│                         │
│  Title                   │
│  Duration  ·  Instructor │
│                         │
│  [────○────────────────]│  ← progress bar (if in progress)
│                         │
│         [ Start ]        │  ← pill button, warm accent
└─────────────────────────┘
```
- Radius: `--radius-xl` (20px)
- Background: `--cream` or soft pastel wash
- Illustration fills ~60% of card height
- Button: pill shape, warm orange, soft shadow
- Card width: flexible, typically fills column in 2-col grid

### Progress Ring
```
     ┌──────────┐
    ╱            ╲
   │   12 min     │   ← current value (large text)
   │   ───────    │
   │   of 15 min  │   ← goal (smaller, muted)
    ╲            ╱
     └──────────┘
```
- Circular progress: SVG arc with `--warm-orange` stroke
- Track: `--warm-gray-200` subtle background arc
- Text centered: big number on top, small label below
- Animation: smooth fill on load (800ms+, ease-out)
- Size: 120-180px diameter

### Mood Check-In
```
┌──────────┐
│ How are  │   ← gentle question, not a demand
│ you?     │
│          │
│ 🟡 🟡 🟡 │   ← emoji grid, 1 tap each
│ 🟡 🟡 🟡 │
└──────────┘
```
- Grid of 5-6 emoji options
- Each emoji: large (32-36px), soft circular background
- Selected: warm orange ring or filled background
- Single tap to select — no confirmation needed
- Transitions to recommendation immediately

### Breathing Exercise
```
         (animated circle expands gently)
                ╭─────────╮
               │           │
               │   Breathe  │
               │     in     │
               │           │
                ╰─────────╯
         (circle contracts gently)

```
- Full-screen experience — all chrome removed
- Circle: warm orange/coral, slightly glowing, semi-transparent
- Animation: 4 seconds inhale, 4 seconds exhale (configurable)
- Text: "Breathe in" / "Breathe out" — gentle, centered, warm gray
- Background: deep warm color or dark mode
- Exit: subtle X in corner, fades in after 3 seconds

### Streak Counter
```
  🔥  42 days
  Nice work!
```
- Fire emoji (or custom icon): 24-32px
- Number: `--text-2xl`, warm weight
- Message: `--text-sm`, warm gray, encouraging tone
- Displayed as subtle badge, not a dominant callout
- Never shows negative messaging on missed days
- "Start again" tone when there's a gap

---

## Navigation

### Bottom Tab Bar
- Mobile-first (primary navigation)
- 4-5 tabs: Today, Meditate, Sleep, Move, Profile
- Warm white/cream background
- Active tab: warm orange icon + label
- Inactive tab: warm gray icon, no label (or smaller)
- Rounded top corners on the bar container
- Subtle top border (warm gray, 0.5px)
- No harsh separators between tabs

### Top Navigation
- Simple, minimal header
- Greeting text ("Good morning") top-left
- Profile avatar top-right
- No back button in main tabs (tab-based navigation)
- Smooth, slow transition between tabs (cross-fade)

---

## Motion System

### Durations
| Context | Duration | Easing |
|---|---|---|
| Page transitions | 400-500ms | `cubic-bezier(0.4, 0, 0.2, 1)` (gentle fade) |
| Component appear | 300-400ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Hover/active | 200-300ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Breathing animation | 4000ms inhale, 4000ms exhale | `ease-in-out` |
| Progress ring fill | 800-1200ms | `cubic-bezier(0.4, 0, 0.8, 0.4)` (slow deceleration) |
| Scroll-triggered reveal | 500-700ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |

### Easing
- All easings are smooth — never linear, never bouncy
- `ease-out` and `ease-in-out` are the defaults
- Never use spring physics or elastic easings — they feel jarring
- Breathing animations are the slowest — 4-8 second cycles

### Principles
- Motion supports calm — it never creates urgency
- All animations are slow and deliberate
- No sudden movements, no popping, no bouncing
- Respect `prefers-reduced-motion` — when set, transitions become even slower (800ms+)
  or become instant with a gentle cross-fade

---

## Dark Mode Adaptations

- Background shifts to warm charcoal (`#2C2824`), never pure black
- Card surfaces lift to warm dark gray (`#3D3733`)
- Text remains warm-toned (cream to light gray range)
- Accent colors shift slightly warmer
- Shadows are nearly invisible — elevation is communicated through surface lightness
- Breathing exercise backgrounds become deep indigo-warm (not harsh black)
- All warm pastels retain their character on dark backgrounds

---

## Responsive Behavior

### Mobile-First
- Single column layout as default
- Bottom tab bar for primary navigation
- Cards stack vertically with 24px gaps
- Horizontal scroll for course paths, category chips

### Tablet / Desktop
- 2-3 column grids for cards
- Section margins increase (up to 128px)
- Breathing exercise remains full-screen and centered
- Tab bar transitions to sidebar or remains bottom-justified
- Content never exceeds 1200px max width

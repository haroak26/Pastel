# Duolingo UI — Design Replication Specification

> **Purpose:** This document is the build spec for reproducing the Duolingo
> visual language — the language-learning app and its marketing site. It is
> written for an AI coding agent to consume directly: tokens are exact and
> the signature moves are the ground truth for what makes Duolingo feel like
> Duolingo.

---

## 1. Design Tokens

Declare these once, globally, and reference everywhere.

### 1.1 Color tokens

```css
:root {
  --color-bg-app: #FFFFFF;            /* bright white surfaces */
  --color-bg-muted: #F4F4F0;
  --color-text-primary: #3C3C3C;
  --color-text-secondary: #777777;
  --color-text-inverse: #FFFFFF;
  --color-primary: #58CC02;           /* feather green — THE brand color */
  --color-primary-hover: #46A302;
  --color-success: #58A700;
  --color-warning: #FF9600;
  --color-danger: #EA2B2B;
  --color-border: #E5E5E0;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
}
```

### 1.2 Type scale

| Token | Size | Weight | Used for |
|---|---|---|---|
| display | 42px | 800 | Hero claims, big moments |
| title | 28px | 800 | Section titles |
| body | 16px | 500 | Body copy |
| body-medium | 16px | 600 | Rows, buttons |
| small | 14px | 500 | Meta |
| caption | 12px | 700 | Labels, overlines |

Nunito (or a rounded geometric sans) for everything — bold, friendly, never
formal.

### 1.3 Spacing & radius

- 8px rhythm; chunky controls (48px+); radius 12–20px; soft card shadows.
- White light surfaces; dark mode is deep green-tinted slate (`#131F24`).

---

## 2. Signature moves (the Duolingo "tells")

1. **The giant green button.** One loud `#58CC02` "START"-style primary per
   screen — the biggest, boldest element.
2. **Streak + XP scoreboard.** Bold tabular counts with green checkmarks —
   progress is celebrated constantly.
3. **Lesson path units.** Rounded progress tiles on a light track; each
   completed unit earns a green check.
4. **Celebration bands.** Green tonal bands with a big check and
   "Lesson complete" — success is always visible.
5. **Soft white cards with green accents** on a bright page.

---

## 3. Layout law (Duolingo-specific)

- **One strong CTA per screen**, always green; secondary actions are white
  buttons with green text.
- **Playful but clean:** bold rounded shapes and generous spacing, never
  clutter or gradients.
- **Progress everywhere:** streaks, XP, and checkmarks in green with bold
  numbers.
- **Short, cheerful copy:** "5 min a day", "Streak: 12 days".

---

## 4. Avoid (hard)

- Serious corporate SaaS looks, dark moody themes, tiny buttons, muted
  desaturated greens, dense data tables, formal typography, flat gray
  dashboards.

---

## 5. Voice

Cheerful, short, specific. "You're 5 min away from your daily goal!"
Encouraging but factual — no empty hype, no guilt.

---

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company folder — use them as ground truth for brand fidelity (feather
green, rounded chunky controls, streak/XP scoreboards, celebration bands).

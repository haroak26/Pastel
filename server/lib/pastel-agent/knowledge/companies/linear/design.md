# Linear UI — Design Replication Specification

> **Purpose:** This document is the build spec for reproducing the Linear visual
> language — the app and marketing site for a developer-grade issue tracker.
> It is written for an AI coding agent to consume directly: every value is
> explicit, tokens are exact, and the signature moves are the ground truth for
> what makes Linear feel like Linear.

---

## 1. Design Tokens

Declare these once, globally, and reference everywhere. Never hardcode values
inline.

### 1.1 Color tokens

```css
:root {
  --color-bg-app: #FFFFFF;            /* app + marketing background */
  --color-bg-elevated: #FFFFFF;       /* popovers, sheets */
  --color-bg-secondary: #F7F8F9;      /* hover, secondary surfaces */
  --color-bg-overlay: rgba(0, 0, 0, 0.5);
  --color-text-primary: #1A1C1E;      /* near-black ink */
  --color-text-secondary: #6E7074;    /* muted meta */
  --color-text-tertiary: #9A9CA0;     /* faint hints */
  --color-text-inverse: #FFFFFF;
  --color-primary: #5E6AD2;           /* Linear indigo — the ONLY accent */
  --color-primary-hover: #525DC4;
  --color-success: #46A758;
  --color-warning: #FFB224;
  --color-danger: #E5484D;
  --color-border: #E7E8EA;            /* hairline dividers */
  --color-border-strong: #D4D6D8;
  --border-radius: 6px;               /* buttons, inputs, small panels */
  --border-radius-lg: 10px;           /* sheets, dropdowns */
}
```

Dark mode: background `#0E0F11`, elevated `#17181A`, text `#E9EAEC`,
secondary text `#8C8F94`, borders `#2A2C30`, primary stays `#5E6AD2`.

### 1.2 Type scale

| Token | Size | Weight | Used for |
|---|---|---|---|
| display | 32–40px | 700 | Page title ("Issues", "My work") |
| title | 20–23px | 600 | Section titles, dialogs |
| body | 14px | 400 | App body text |
| body-medium | 14px | 500 | Rows, buttons |
| small | 13px | 400 | Meta, table cells |
| caption | 11.5px | 500 | Labels, shortcuts, overlines |
| mono | 12px | 500 | Issue IDs, numbers (`JetBrains Mono`) |

Body copy is **14px** — Linear is dense by design. Never inflate app type.

### 1.3 Spacing & radius

- Base unit **4px**; hairline grid; rows 32–40px tall in lists.
- Panel padding 16px; section gap 24–48px; no giant whitespace.
- Radius: 6px controls, 10px overlays. Sharp over round.

---

## 2. Signature moves (the Linear "tells")

1. **The indigo primary on white.** One `#5E6AD2` button per screen
   ("Create issue", "Update"). Everything else is ink/ghost.
2. **Dense divided issue lists.** Rows with ID (`ENG-123`, mono), title,
   status pill, assignee avatar, and priority icon — separated by 1px
   hairlines, never cards.
3. **Keyboard-first affordances.** The topbar search placeholder says
   "Search or jump to…" with a `⌘K` hint; sidebar rows show shortcut hints.
4. **Status pills with precise tones** (success/warning/destructive),
   small, tight, capitalized.
5. **Hairline border language.** Flat surfaces, zero shadows in the app;
   dividers are 1px `--color-border`.

---

## 3. Layout law (Linear-specific)

- **Density is the brand.** Lists and tables use 32–40px rows with 13–14px
  type. Never add gratuitous padding to "breathe".
- **Cards are rare.** Lists divide with hairlines; surfaces are flat. A card
  appears only for a single focused object (issue detail, sheet).
- **One accent.** Indigo only for the primary action, active nav, and links.
  Status colors are semantic, never decorative.
- **Sidebar + topbar shell.** Left rail (nav rows with shortcut hints) +
  dense topbar (search left, actions right, hairline bottom border).
- **Tabular numerics** for all counts (story points, counts, dates).
- **Empty states are useful:** one sentence, one indigo action, no art.

---

## 4. Interaction & state

| Element | Default | Hover | Active/Focus |
|---|---|---|---|
| Primary button | indigo fill | `#525DC4` | pressed `#464FAE`, focus ring indigo |
| Ghost/outline | hairline border | muted fill `#F7F8F9` | ink text |
| List row | white | `#F7F8F9` fill | indigo left rail highlight |
| Status pill | tone fill | 5% darken | — |
| Input | hairline border | `--color-border-strong` | 2px indigo ring |

Transitions 100–150ms; no bouncy animation; no gradients.

---

## 5. Avoid (hard)

- Rounded "friendly" cards, gradients, big marketing headlines in the app.
- Warm colors anywhere; the palette is cool monochrome + indigo.
- Centered layouts; everything is left-aligned and dense.
- Cute empty-state illustrations; oversized empty whitespace.

---

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company folder — use them as ground truth for brand fidelity (density,
hairlines, the indigo accent, the sidebar+topbar shell).

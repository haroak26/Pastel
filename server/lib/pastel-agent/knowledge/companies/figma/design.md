# Figma UI — Design Replication Specification

> **Purpose:** This document is the build spec for reproducing the Figma visual
> language — the design tool's workspace shell and its marketing site. It is
> written for an AI coding agent to consume directly: tokens are exact and the
> signature moves are the ground truth for what makes Figma feel like Figma.

---

## 1. Design Tokens

Declare these once, globally, and reference everywhere.

### 1.1 Color tokens

```css
:root {
  --color-bg-workspace: #E6E6E6;      /* the gray CANVAS behind panels */
  --color-bg-panel: #FFFFFF;          /* white floating panels */
  --color-bg-hover: #F0F0F0;
  --color-bg-selected: #E5F3FF;
  --color-text-primary: #242424;
  --color-text-secondary: #7A7A7A;
  --color-text-tertiary: #B3B3B3;
  --color-text-inverse: #FFFFFF;
  --color-primary: #0D99FF;           /* Figma blue */
  --color-primary-hover: #007BE6;
  --color-success: #1BC47D;
  --color-warning: #FFCD29;
  --color-danger: #F24822;
  --color-border: #E2E2E2;            /* hairline dividers */
  --color-border-strong: #CCCCCC;
  --radius-sm: 6px;                   /* buttons, inputs */
  --radius-md: 10px;                  /* panels, cards */
  --shadow-panel: 0 1px 4px rgba(0, 0, 0, 0.08);
}
```

### 1.2 Type scale

| Token | Size | Weight | Used for |
|---|---|---|---|
| display | 36px | 700 | Marketing headlines |
| title | 24px | 600 | Panel/file titles |
| body | 15px | 400 | App body |
| body-medium | 15px | 500 | Rows, buttons |
| small | 13.5px | 400 | Meta, table cells |
| caption | 12px | 500 | Labels, shortcuts |
| mono | 12px | 500 | Values, counts |

### 1.3 Spacing & radius

- 8px rhythm; 40px controls; panel padding 16–24px; hairlines everywhere.
- Radius: 6px controls, 10px panels. Elevation comes from LAYERS (white on
  gray), not shadows — shadows stay subtle.

---

## 2. Signature moves (the Figma "tells")

1. **Panels on a gray canvas.** The shell is `#E6E6E6` workspace with white
   floating panels — the single most recognizable Figma cue.
2. **Figma blue as the interaction color.** Links, primary buttons, active
   tabs, and selection all use `#0D99FF`.
3. **Presence avatars on the topbar.** Collaborators stack as small colored
   circles near the Share button — collaboration is always visible.
4. **Inspect-style stat rows.** Dense divided rows: muted label left,
   value right (mono for coordinates/counts).
5. **Hairline precision.** 1px `--color-border` dividers, exact alignment,
   small type — the interface disappears into the work.

---

## 3. Layout law (Figma-specific)

- **Workspace shell:** gray canvas fills the page; a white topbar (file
  name, presence, Share) and white panels float above it. Never render
  content cards directly on white.
- **Toolbar discipline:** one search, one filter Select, one blue primary
  ("Share", "New file"). Never chip groups.
- **Density:** comfortable but exact — 40px controls, 15px body, clear 8px
  rhythm. No cramped SaaS tables, no huge marketing padding in-app.
- **One blue moment per screen.** Everything else is ink on white.

---

## 4. Avoid (hard)

- Warm palettes, heavy shadows, playful illustrations, gradient buttons,
  oversized marketing type in-app, cards-on-white (no canvas separation),
  dark canvases.

---

## 5. Voice

Precise and functional: "Share", "Add comment", "New file". Exact counts,
short labels. The tool stays out of the way.

---

## Reference imagery

Reference images for this brand live in `preview.png` and `references/` inside
this company folder — use them as ground truth for brand fidelity (the gray
canvas + white panels, Figma blue, presence avatars, hairline precision).

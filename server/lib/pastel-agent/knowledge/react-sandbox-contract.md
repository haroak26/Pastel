# React Sandbox Contract

Every Pastel project is a real React application built as a virtual file system. The sandbox compiles your files with esbuild (JSX automatic runtime — you never import React) and server-renders each screen as a smoke test. Code that violates this contract fails verification.

## File structure

```
src/styles.css              ← design tokens as CSS custom properties + base styles (provided to you)
src/components/<Name>.jsx   ← reusable components (default export)
src/screens/<Screen>.jsx    ← one full page per file (default export)
```

## Hard rules

1. **Default exports.** Every screen and component file ends with `export default function Name() { ... }`.
2. **Imports between files only.** `import Button from "../components/Button.jsx"` — always with the `.jsx` extension, always relative paths.
3. **Never import React.** The JSX runtime is automatic. You MAY import hooks: `import { useState } from "react"` is allowed.
4. **No external packages.** Only `react` and `react-dom` exist. No router, no icon libraries, no fetch libraries.
5. **No network, no storage, no timers at module scope.** No `fetch`, `localStorage`, `sessionStorage`, `window.location` navigation. Event handlers may use `useState` for local interactivity (toggles, tabs, accordions, mobile menu open/close) — that is encouraged for believable UI.
6. **No images from the web.** Use CSS-only visuals: solid blocks, borders, typographic compositions, simple inline SVG shapes you write yourself.
7. **Icons:** write small inline SVGs (stroke="currentColor", strokeWidth 1.5–2, 24×24 viewBox) directly in components. Keep them minimal and geometric.
8. **Links:** use `<a href="#">` with `onClick={(e) => e.preventDefault()}` for navigation placeholders.
9. **Every screen is self-sufficient at 1440px wide** and responsive down to 375px via Tailwind responsive prefixes (`sm:`, `md:`, `lg:`).
10. **Root element of every screen:** `<div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]" style={{ fontFamily: "var(--font-body)" }}>`.

## Styling contract

- Style with **Tailwind utility classes** + **CSS custom properties from `src/styles.css`** (via arbitrary values: `bg-[var(--color-surface)]`, `text-[var(--color-accent)]`, `rounded-[var(--radius-md)]`).
- Never hardcode hex colors in components/screens — always reference the token vars. The only exception is inline SVG illustrations where a token var is also preferred.
- Font families: `style={{ fontFamily: "var(--font-display)" }}` for headlines, body inherits `var(--font-body)` from the screen root.
- No `<style>` tags, no CSS files beyond the provided `styles.css`, no `styled-components`.
- Spacing uses the 8px rhythm scale (p-2, p-4, p-6, p-8, p-12, p-16, p-24, p-32 or matching arbitrary values).

## Quality bar

- Screens compose the shared components — never duplicate a navbar or button inline when a component exists.
- All interactive elements have hover states (`hover:` transitions, `transition-colors`).
- Real, specific copy everywhere (see copywriting.md). No placeholder text.
- Every screen is a complete page: navigation header, main content, footer — unless the spec explicitly says otherwise.

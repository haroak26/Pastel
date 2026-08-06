export const SANDBOX_CONTRACT = `
REACT SANDBOX CONTRACT — code that violates these rules fails verification.

FILE STRUCTURE
  src/styles.css                      ← CSS custom properties + base styles (provided)
  src/components/<Name>.jsx           ← default export per component
  src/screens/<Screen>.jsx            ← default export per screen

HARD RULES
  1. Default exports: export default function Name() { ... }
  2. Relative imports with .jsx extension: import Button from "../components/Button.jsx"
  3. Never import React (JSX automatic runtime). Hooks allowed: import { useState } from "react"
  4. No external packages. Only react and react-dom exist.
  5. No fetch, localStorage, window.location at module scope.
     Use useState for local interactivity (toggles, tabs, accordions, mobile menus).
  6. No external images. Use inline SVGs with stroke="currentColor",
     strokeWidth 1.5-2, 24x24 viewBox. CSS-only visuals for decoration.
  7. Links: <a href="#" onClick={(e) => e.preventDefault()}>
  8. Every screen is self-sufficient at 1440px, responsive down to 375px
     via Tailwind prefixes (sm:, md:, lg:).
  9. Root element of every screen:
     <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]" style={{ fontFamily: "var(--font-body)" }}>

STYLING
  - Tailwind utility classes + CSS custom properties via arbitrary values.
    bg-[var(--color-surface)], text-[var(--color-accent)], rounded-[var(--radius-md)]
  - Never hardcode hex colours. Always reference CSS custom property tokens.
  - Font families: style={{ fontFamily: "var(--font-display)" }} for headlines.
    Body inherits var(--font-body) from the screen root.
  - No <style> tags, no CSS files beyond styles.css, no styled-components.
  - Spacing: 8px rhythm scale (p-2, p-4, p-6, p-8, p-12, p-16, p-24, p-32).

QUALITY
  - Screens compose shared components. Never duplicate navbar/button inline.
  - All interactive elements have hover states (hover: + transition-colors).
  - Real, specific copy everywhere. No lorem ipsum. No placeholder text.
  - Every screen is a complete page: header, main content, footer.
`.trim();

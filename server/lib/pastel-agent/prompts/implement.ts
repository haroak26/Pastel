export function componentCodeSystemPrompt(): string {
  return `You are a senior React engineer implementing ONE reusable UI component for a design system. Output format: JSON only — {"files": [{"path": "<exact requested path>", "content": "<complete file source>"}]}.

HARD RULES:
- Exactly one file at the exact requested path, with \`export default function <Name>(...) { ... }\`.
- Implement EVERY prop, variant, and interaction state from the supplied contract. Props are the stable public API — screens depend on them.
- Presentational and reusable: never hardcode one screen's content when a prop exists for it. Local useState only for self-contained interactivity (menus, tabs, accordions).
- Style with Tailwind classes + the CSS custom properties listed (arbitrary values: bg-[var(--color-accent)], rounded-[var(--radius-md)]). Never hardcode hex colors.
- Icons: minimal inline SVG (stroke="currentColor", strokeWidth 1.5-2, 24x24 viewBox). No icon libraries. No external packages — react/react-dom only.
- Interactive elements: hover/focus states with transition-colors (or the provided motion tokens).
- Honor the style direction's permission guardrails (shadows, gradients, borders).
- No prose, no markdown fences — JSON only.`;
}

export function componentCodeUserPrompt(
  contractText: string,
  tokensText: string,
  knowledge: string,
  styleDirection: string,
): string {
  return `${contractText}

---

${tokensText}

---

SANDBOX CONTRACT (violations fail verification):
${knowledge}

---

${styleDirection}

Implement the component now. JSON only.`;
}

export function screenCodeSystemPrompt(): string {
  return `You are a senior React engineer composing ONE screen from validated, reusable components. Output format: JSON only — {"files": [{"path": "src/screens/<ScreenName>.jsx", "content": "<complete file source>"}]}.

HARD RULES:
- Exactly one file: src/screens/<ScreenName>.jsx with \`export default function <ScreenName>() { ... }\`.
- COMPOSE, never recreate: import every referenced component from its exact import path (supplied import contracts are authoritative — props and variants in them are guaranteed correct). Never inline-reimplement a navbar, button, card, or any component that exists.
- Root element exactly: <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]" style={{ fontFamily: "var(--font-body)" }}>
- Implement the blueprint's sections in order, using its patterns and its exact copy strings verbatim.
- Style with Tailwind + CSS var tokens. Never hardcode hex. Display font only via style={{ fontFamily: "var(--font-display)" }} on headlines.
- Responsive per the blueprint via Tailwind prefixes (sm:/md:/lg:) — self-sufficient at 1440px, complete at 375px.
- Local useState for believable interactivity (mobile menu, tabs, accordions). Links: <a href="#" onClick={(e) => e.preventDefault()}>.
- Complete page: navigation, main content, footer — via the blueprint's layout/components.
- No prose, no markdown fences — JSON only.`;
}

export function screenCodeUserPrompt(
  screenName: string,
  blueprintJson: string,
  importContracts: string,
  tokensText: string,
  knowledge: string,
  styleDirection: string,
): string {
  return `SCREEN: ${screenName}

SCREEN BLUEPRINT — implement exactly (sections in order, copy verbatim):
${blueprintJson}

---

SHARED COMPONENT IMPORT CONTRACTS (authoritative props and paths — import from these, never recreate):
${importContracts}

---

${tokensText}

---

SANDBOX CONTRACT (violations fail verification):
${knowledge}

---

${styleDirection}

Write src/screens/${screenName}.jsx now. Every component used by the blueprint must be imported from its exact file path listed in the import contracts. JSON only.`;
}

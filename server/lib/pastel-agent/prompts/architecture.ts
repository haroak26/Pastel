import { ARCHITECTURE_SCHEMA_DESC } from "../schemas/plan-schemas";

export function architectureSystemPrompt(): string {
  return `You are a front-end architect and senior product designer. Plan the complete React architecture for this product ONCE: the component contracts every screen will reuse, and a compact composition blueprint per screen. Components are independent, reusable modules — screens are assembled from them, never written as monoliths.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${ARCHITECTURE_SCHEMA_DESC}

COMPONENT OWNERSHIP:
- kind "shared": used by 2+ screens → src/components/<Name>.jsx. Navbars, buttons, cards, inputs, footers, tables, modals.
- kind "layout": screen chrome wrapping pages (e.g. an AppShell with nav + footer slots) → src/layouts/<Name>.jsx. Use 0-2, only when it genuinely reduces duplication.
- kind "screen": used by exactly one screen → src/features/<Screen>/<Name>.jsx (ownerScreen required).
- Every component: props with TS types and defaults, 1+ variants, interaction states it supports, the design tokens it consumes ("color.accent", "size.body", "radius.md", "font.display"), and usedBy (screen names).
- Components are presentational; local interactivity (useState) belongs inside them when self-contained (menus, tabs, accordions).
- Keep the inventory tight: 4-14 components total. No one-off wrappers. No icon components (icons are inline SVG).

SCREEN BLUEPRINTS:
- One blueprint per product-spec screen — same names, same section order as the spec.
- Each section: name, a composition "pattern" chosen from the pattern library below (name it precisely, e.g. "Split Hero", "Bento Grid", "Stat Block", "Divider Row", "Pull Quote", "Statement + Button"), the components it uses, and "copy": the FINAL verbatim copy strings for that section (headlines, labels, CTAs — specific to this product, no lorem ipsum, no marketing platitudes).
- In "components" arrays, list component NAMES ONLY — exactly as declared (e.g. "Navbar", "Card"). Never annotations or parentheticals like "Card (highlighted variant)". Variants belong in the contract's "variants" field.
- Vary patterns across sections. Never the same card-grid composition twice. The first section of every screen carries the focal point.
- Buttons name the action. Overlines/labels are short and structural.
- responsive: one line each for 768px and 375px behavior.

FILE TREE: list every planned file: src/styles.css, every component path per its kind, src/screens/<Name>.jsx per screen, plus optional src/hooks/use<Name>.js / src/lib/<name>.js when a real shared need exists (optional keys "hooks"/"lib"). No assets directory — visuals are CSS and inline SVG.`;
}

export function architectureUserPrompt(
  specJson: string,
  tokensText: string,
  styleDirection: string,
  patternsKnowledge: string,
): string {
  return `PRODUCT SPECIFICATION (structured — screens, sections, component hints are authoritative):
${specJson}

---

DESIGN SYSTEM TOKENS (compact):
${tokensText}

---

${styleDirection}

---

COMPOSITION PATTERN LIBRARY (choose from these, adapt — do not copy verbatim):
${patternsKnowledge}

---

Produce the architecture plan as JSON. Components first (contracts), then one blueprint per screen with final copy.`;
}

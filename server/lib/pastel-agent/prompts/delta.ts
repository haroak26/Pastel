import { ARCHITECTURE_SCHEMA_DESC } from "../schemas/plan-schemas";

export function deltaPlanSystemPrompt(): string {
  return `You are a front-end architect extending an EXISTING product with new screens. The design system, component contracts, and architecture already exist and are authoritative — you reuse them, and only plan the delta.

OUTPUT FORMAT (JSON ONLY):
{
  "summary": "One sentence: what is being added.",
  "screens": [ product-spec screen objects: { "id": "kebab-case", "name": "PascalCase", "purpose": "...", "userGoal": "...", "sections": [{ "name": "...", "purpose": "..." }], "components": ["ExistingOrNewComponent"] } ],
  "components": [ only NEW component contracts needed, same shape as: ${ARCHITECTURE_SCHEMA_DESC} ],
  "blueprints": [ one blueprint per new screen, same shape as screens in ${ARCHITECTURE_SCHEMA_DESC} ]
}

RULES:
- 1-2 new screens maximum, exactly what the request asks for. Never re-plan existing screens.
- Prefer existing contracts: reference existing component names in blueprint sections before inventing new ones. Only emit a new contract when no existing component can serve.
- In blueprint "components" arrays, list component NAMES ONLY — exactly as declared (e.g. "Navbar", "Card"). Never annotations, descriptions, or parentheticals like "Card (highlighted variant)". Variants belong in the contract's "variants" field, not in references.
- Field names are exact: blueprints have "name", "sections", "responsive"; contracts have "usedBy". Do not rename them.
- New contracts follow the same ownership rules: "shared" when used by 2+ screens, "screen" when used by exactly one (ownerScreen = the new screen).
- Blueprints reuse the established naming, patterns, and copy style of the existing screens.
- Final verbatim copy in blueprint "copy" arrays — real, product-specific, no placeholders.`;
}

export function deltaPlanUserPrompt(
  additionPrompt: string,
  existingSpecJson: string,
  existingContractsJson: string,
  existingBlueprintsJson: string,
): string {
  return `ADDITION REQUEST:
${additionPrompt}

---

EXISTING PRODUCT SPEC (authoritative):
${existingSpecJson}

---

EXISTING COMPONENT CONTRACTS (reuse these before inventing new ones):
${existingContractsJson}

---

EXISTING SCREEN BLUEPRINTS (style reference):
${existingBlueprintsJson}

---

Plan the delta as JSON.`;
}

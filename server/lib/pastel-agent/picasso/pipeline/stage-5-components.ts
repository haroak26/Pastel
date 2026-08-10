import type {
  Tokens,
  ComponentsManifest,
  ComponentManifestEntry,
  Brief,
  LayoutPlan,
} from "./types";
import {
  chatText,
  MODELS,
  MAX_TOKENS_PER_CALL,
  type ChatMessage,
} from "../../gateway";
import { componentDesignLaw } from "../../knowledge/component-law";
import { antiSlopSystemPrompt } from "./anti-slop";
import pLimit from "p-limit";

// ── Radix primitive → import statement ──────────────────────────────────

const RADIX_IMPORT: Record<string, string> = {
  Dialog:       `import * as Dialog from "@radix-ui/react-dialog"`,
  Popover:      `import * as Popover from "@radix-ui/react-popover"`,
  DropdownMenu: `import * as DropdownMenu from "@radix-ui/react-dropdown-menu"`,
  Tooltip:      `import * as Tooltip from "@radix-ui/react-tooltip"`,
  Tabs:         `import * as Tabs from "@radix-ui/react-tabs"`,
  Select:       `import * as Select from "@radix-ui/react-select"`,
  Checkbox:     `import * as Checkbox from "@radix-ui/react-checkbox"`,
  RadioGroup:   `import * as RadioGroup from "@radix-ui/react-radio-group"`,
  Switch:       `import * as Switch from "@radix-ui/react-switch"`,
  Slider:       `import * as Slider from "@radix-ui/react-slider"`,
  Accordion:    `import * as Accordion from "@radix-ui/react-accordion"`,
  Toast:        `import * as Toast from "@radix-ui/react-toast"`,
};

// ── Shell chrome: built on the cheap model ──────────────────────────────

const SHELL_CHROME = new Set([
  "Button",
  "Input",
  "Textarea",
  "Badge",
  "Avatar",
  "Label",
  "Icon",
  "Spinner",
  "Divider",
]);

function isShellChrome(entry: ComponentManifestEntry): boolean {
  return SHELL_CHROME.has(entry.name) || entry.taxonomy === "primitive";
}

function resolveModel(entry: ComponentManifestEntry): "builder" | "builderCustom" {
  return isShellChrome(entry) ? "builder" : "builderCustom";
}

// ── Token snapshot for the prompt ───────────────────────────────────────

function tokenSnapshot(tokens: Tokens): string {
  const c = tokens.color;

  const accentKeys = Object.keys(c.accent).sort();
  const neutralKeys = Object.keys(c.neutral).sort();

  return [
    "AVAILABLE CSS CUSTOM PROPERTIES (reference ONLY these — never raw hex/px):",
    "",
    "Color — Accent:",
    ...accentKeys.map((k) => `  --color-accent-${k}: ${(c.accent as Record<string, string>)[k]}`),
    "",
    "Color — Neutral:",
    ...neutralKeys.map((k) => `  --color-neutral-${k}: ${(c.neutral as Record<string, string>)[k]}`),
    "",
    "Color — Semantic:",
    `  --color-success-50: ${c.semantic.success["50"]}`,
    `  --color-success-500: ${c.semantic.success["500"]}`,
    `  --color-success-900: ${c.semantic.success["900"]}`,
    `  --color-warning-50: ${c.semantic.warning["50"]}`,
    `  --color-warning-500: ${c.semantic.warning["500"]}`,
    `  --color-warning-900: ${c.semantic.warning["900"]}`,
    `  --color-danger-50: ${c.semantic.danger["50"]}`,
    `  --color-danger-500: ${c.semantic.danger["500"]}`,
    `  --color-danger-900: ${c.semantic.danger["900"]}`,
    `  --color-info-50: ${c.semantic.info["50"]}`,
    `  --color-info-500: ${c.semantic.info["500"]}`,
    `  --color-info-900: ${c.semantic.info["900"]}`,
    "",
    "Surface / Text / Border:",
    `  --color-surface-background: ${c.surface.background}`,
    `  --color-surface-raised: ${c.surface.raised}`,
    `  --color-surface-overlay: ${c.surface.overlay}`,
    `  --color-text-primary: ${c.text.primary}`,
    `  --color-text-secondary: ${c.text.secondary}`,
    `  --color-text-muted: ${c.text.muted}`,
    `  --color-text-inverse: ${c.text.inverse}`,
    `  --color-border-default: ${c.border.default}`,
    `  --color-border-subtle: ${c.border.subtle}`,
    `  --color-border-focus: ${c.border.focus}`,
    "",
    "Typography:",
    `  --font-display: ${tokens.typography.fontFamily.display}`,
    `  --font-body: ${tokens.typography.fontFamily.body}`,
    `  --font-mono: ${tokens.typography.fontFamily.mono}`,
    ...Object.entries(tokens.typography.scale).map(([k, v]) => `  --text-${k}: ${v}`),
    ...Object.entries(tokens.typography.weight).map(([k, v]) => `  --weight-${k}: ${v}`),
    "",
    "Radius:",
    ...Object.entries(tokens.radius).map(([k, v]) => `  --radius-${k}: ${v}`),
    "",
    "Shadow:",
    ...Object.entries(tokens.shadow).map(([k, v]) => `  --shadow-${k}: ${v}`),
    "",
    "Motion:",
    `  --duration-fast: ${tokens.motion.duration.fast}`,
    `  --duration-base: ${tokens.motion.duration.base}`,
    `  --duration-slow: ${tokens.motion.duration.slow}`,
    `  --easing-standard: ${tokens.motion.easing.standard}`,
    "",
    "Space:",
    ...Object.entries(tokens.space).map(([k, v]) => `  --space-${k}: ${v}`),
    "",
    "Control height scale:",
    "  --control-sm: 32px",
    "  --control-md: 40px",
    "  --control-lg: 48px",
    "",
    "HARD RULES:",
    "- Every color uses var(--color-*). No hex, rgb(), hsl(), or Tailwind color literals (bg-blue-500, text-gray-400, etc.).",
    "- Every radius uses var(--radius-*). No raw rounded-md/xl/lg.",
    "- Every interactive height uses var(--control-*). No raw h-9/h-10/h-11.",
    "- Fonts use var(--font-*) or fontFamily inline style.",
    "- Shadows use var(--shadow-*). Reserved for floating/overlay elements and the ONE dominant surface — never on static panels.",
  ].join("\n");
}

// ── Brand kit summary for the prompt ────────────────────────────────────

function brandKitSummary(tokens: Tokens): string {
  const t = tokens.typography;
  const c = tokens.color;

  return [
    "BRAND KIT:",
    `  Accent primary: --color-accent-500 (${(c.accent as Record<string, string>)["500"]})`,
    `  Accent hover: --color-accent-600 (${(c.accent as Record<string, string>)["600"] ?? (c.accent as Record<string, string>)["500"]})`,
    `  Display font: ${t.fontFamily.display}`,
    `  Body font: ${t.fontFamily.body}`,
    `  Mono font: ${t.fontFamily.mono}`,
    `  Space scale: ${Object.entries(tokens.space).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    `  Radius scale: ${Object.entries(tokens.radius).map(([k, v]) => `${k}=${v}`).join(", ")}`,
  ].join("\n");
}

// ── Button pattern — the literal template for all interactive components

function buttonPatternTemplate(): string {
  return `// Button.tsx — Primary action trigger with variant and size controls. Use for all call-to-action, form submission, and interactive triggers.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-700)]",
        secondary:
          "bg-[var(--color-neutral-100)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)] border border-[var(--color-border-default)]",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
      },
      size: {
        sm: "h-[var(--control-sm)] px-3 text-sm",
        md: "h-[var(--control-md)] px-4 text-base",
        lg: "h-[var(--control-lg)] px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export default function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}`;
}

// ── System prompts ──────────────────────────────────────────────────────

const COMPONENT_SYSTEM = `You are a senior product designer + React/TypeScript developer generating production-grade design system components. Every component you write is token-grounded, accessible, brand-aware, and follows the Button pattern template exactly.

## CRITICAL — THE BUTTON PATTERN IS THE LITERAL TEMPLATE

Every interactive component you generate MUST follow this exact structure:
- cva() with typed variants
- cn() for className merging (import { cn } from "../lib/cn")
- Typed props interface extending VariantProps<typeof variants>
- All applicable states: default, hover, focus-visible (ring-2 + offset), active, disabled (opacity-50 + pointer-events-none), loading (aria-busy=true, spinner)
- Default export function

## TOKEN DISCIPLINE (HARD — any violation is rejected)

Every visual property MUST reference a CSS custom property from the token snapshot:
- Colors: var(--color-accent-500), var(--color-neutral-100), var(--color-success-500), var(--color-text-primary), var(--color-surface-raised), etc.
- Radii: var(--radius-sm), var(--radius-md), var(--radius-lg), var(--radius-xl), var(--radius-full)
- Control heights: var(--control-sm), var(--control-md), var(--control-lg) — NEVER raw h-9/h-10/h-11
- Spacing: var(--space-*) where appropriate (gap, padding)
- Shadows: var(--shadow-sm), var(--shadow-md), var(--shadow-lg), var(--shadow-xl), var(--shadow-none) — ONLY on floating/overlay elements and the ONE dominant surface
- Motion: var(--duration-fast), var(--duration-base), var(--duration-slow), var(--easing-standard)
- Fonts: var(--font-display), var(--font-body), var(--font-mono)
- Weights: var(--weight-regular), var(--weight-medium), var(--weight-semibold), var(--weight-bold)

NEVER use: raw hex codes (#fff, #000000), rgb()/rgba()/hsl(), Tailwind color literals (bg-blue-500), raw pixel values for radii/heights, or hardcoded font stacks.

## ACCESSIBILITY

- Semantic HTML elements (button, input, nav, table, etc.)
- Correct ARIA: aria-busy for loading, aria-expanded for toggles, aria-label where needed, role where appropriate
- Visible focus rings on all interactive elements: focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2
- Labels linked to inputs via htmlFor/id
- Keyboard-navigable

## FILE STRUCTURE

1. File header comment: one line — what the component is for, when to use it
2. Imports (react, class-variance-authority, ../lib/cn, Radix primitives if specified, sibling components if composing)
3. cva variant definition
4. Typed props interface
5. Default export function

## VARIANT PATTERN

When the spec provides variants, use cva with VariantProps exactly like the Button pattern. When the spec provides no variants, still use a typed props interface — just without VariantProps.

## RADIX WRAPPING

If the spec lists a radixPrimitive, import and compose on top of it. The Radix primitive provides the accessible shell; you provide the token-grounded styling.

## COMPOSITION

- Import sibling components when composing (e.g., FormField imports Label, Input).
- Do NOT import components that aren't needed.
- Do NOT create null/empty sample data — all display values come from props.

## BRAND FIDELITY

- The brand kit defines the visual personality. Use the accent sparingly (0-2 occurrences per component). The accent never paints the whole component.
- Every component must feel specific to THIS product — not generic. Ask: "could this ship in a different product unchanged?" If yes, redesign it.
- No placeholder text. No "Title", "Description", "Click here". All copy from props.

## OUTPUT

Output ONLY the complete component file. No markdown fences, no explanations, no surrounding prose.`;

const CATALOG_SYSTEM = `You are a senior frontend engineer building a component catalog (living style guide) for a design system. You produce a Next.js page that imports and renders every component in every variant.

## REQUIREMENTS

- Default export page component
- Import every component from "../components/[Name]"
- Each component gets its own section: heading, description, then demo blocks for every variant
- Each variant is rendered in a labeled demo block showing all states (default, hover, focus, disabled, loading)
- Demo blocks are visually separated — clear labeling per variant
- The catalog serves as a visual reference for the design team

## STYLING

- Use only the token CSS custom properties (var(--color-*), var(--radius-*), etc.)
- Demo blocks have a clear label (variant name) and a visual wrapper
- Layout: vertical sections, one per component, with subsections per variant

## OUTPUT

Output ONLY the page file. No markdown fences.`;

const SCREEN_SYSTEM = `You are a senior frontend engineer composing application screens from a library of pre-built components. You write layout-only screen files — no new styling, no new color decisions, no new components.

## CRITICAL RULES

1. IMPORT existing components — never redefine or restyle them.
2. LAYOUT ONLY: grid, flex, spacing — using token values (var(--space-*), var(--radius-*)). No new colors, no new visual styling.
3. CONTENT comes from the brief description and layout plan — write real-looking copy, labels, and data.
4. ARRANGE components according to the layout plan's region structure — put components in the correct regions.
5. No inline style blocks. All layout uses Tailwind utility classes + token references.

## OUTPUT

Output ONLY the complete screen file. Default export. No markdown fences.`;

// ── Prompt builders ─────────────────────────────────────────────────────

function componentPrompt(
  entry: ComponentManifestEntry,
  tokens: Tokens,
  briefContext: string,
): string {
  const variantLines = entry.variants
    ? Object.entries(entry.variants)
        .map(([name, values]) => `  - ${name}: ${values.join(" | ")}`)
        .join("\n")
    : "  (none — no variants)";

  const statesList = entry.states.join(", ");

  const radixLine = entry.radixPrimitive
    ? `\nRadix primitive: ${entry.radixPrimitive}\nImport: ${RADIX_IMPORT[entry.radixPrimitive]}`
    : "";

  const propsLines = Object.entries(entry.props)
    .map(([name, spec]) => `  - ${name}: ${spec.type} ${spec.required ? "(required)" : "(optional)"} — ${spec.description}`)
    .join("\n");

  return [
    `### BRAND TOKENS`,
    brandKitSummary(tokens),
    "",
    `### DESIGN GUARDRAILS`,
    antiSlopSystemPrompt(),
    "",
    `### COMPONENT SPEC`,
    `Name: ${entry.name}`,
    `ID: ${entry.id}`,
    `Taxonomy: ${entry.taxonomy}`,
    `Description: ${entry.description}`,
    `States: ${statesList}`,
    `Variants:`,
    variantLines,
    `Props:`,
    propsLines || "  (none specified)",
    radixLine,
    "",
    `### PRODUCT BRIEF CONTEXT`,
    briefContext,
    "",
    `### BUTTON PATTERN (literal template — follow this structure exactly)`,
    "```tsx",
    buttonPatternTemplate(),
    "```",
    "",
    `### DESIGN TOKENS — use ONLY the CSS custom properties listed below. Never hardcode values.`,
    tokenSnapshot(tokens),
    "",
    componentDesignLaw(),
    "",
    `RULES:`,
    `1. Use ONLY CSS custom properties for colors/spacing/radius (var(--xxx))`,
    `2. Implement ALL required states: default, hover, focus-visible, active, disabled, loading`,
    `3. Export as default function`,
    `4. Include TypeScript props interface`,
    `5. NO placeholder text — use realistic product data from props`,
    `6. NO hardcoded hex colors`,
    `7. Include hover, focus-visible, active, disabled states`,
    "",
    `Generate the ${entry.name} component now. Follow the Button pattern template. Output ONLY the complete component file.`,
  ].join("\n");
}

function catalogPrompt(
  manifest: ComponentsManifest,
  tokens: Tokens,
): string {
  const componentList = manifest.entries
    .map((e) => {
      const variantDetail = e.variants
        ? ` | variants: ${Object.entries(e.variants).map(([k, vs]) => `${k}=[${vs.join(", ")}]`).join("; ")}`
        : "";
      return `- ${e.name} (${e.taxonomy}): ${e.description}${variantDetail}`;
    })
    .join("\n");

  const importList = manifest.entries
    .map((e) => `import { default as ${e.name} } from "../components/${e.name}";`)
    .join("\n");

  return [
    `### COMPONENTS TO CATALOG`,
    componentList,
    "",
    `### IMPORT STATEMENTS (use these)`,
    importList,
    "",
    `### DESIGN TOKENS`,
    tokenSnapshot(tokens),
    "",
    `Generate the catalog page at \`src/pages/catalog.tsx\`. Each component gets its own section showing all variants. Demo each variant with a label, rendered in its default state. The catalog should be a living style guide.`,
  ].join("\n");
}

function screenPrompt(
  brief: Brief,
  layoutPlan: LayoutPlan,
  tokens: Tokens,
  manifest: ComponentsManifest,
  generatedComponents: Record<string, string>,
): string {
  const screensBlock = layoutPlan.screens
    .map((s) => {
      const regions = s.regions
        .map((r) => {
          const slots = r.componentTypes
            .map((cs) => `    - ${cs.name} (${cs.taxonomy}): ${cs.description}`)
            .join("\n");
          return `  Region "${r.name}" (role: ${r.role}):\n${slots}`;
        })
        .join("\n");
      return `### Screen: ${s.name} (${s.id})\nRoute: ${s.route}\nDescription: ${s.description}\nGrid: ${s.gridColumns} columns\nRegions:\n${regions}`;
    })
    .join("\n\n");

  const globalBlock = layoutPlan.globalRegions
    .map((r) => {
      const slots = r.componentTypes
        .map((cs) => `    - ${cs.name} (${cs.taxonomy}): ${cs.description}`)
        .join("\n");
      return `Region "${r.name}" (role: ${r.role}):\n${slots}`;
    })
    .join("\n");

  const availableComponents = Object.entries(generatedComponents)
    .map(([id, code]) => `### ${id}\n\`\`\`tsx\n${code.slice(0, 400)}\n\`\`\``)
    .join("\n\n");

  const importSuggestion = Object.keys(generatedComponents)
    .map((id) => `import { default as ${id} } from "../components/${id}";`)
    .join("\n");

  return [
    `### PRODUCT BRIEF`,
    `Name: ${brief.productName}`,
    `Description: ${brief.description}`,
    `Audience: ${brief.audience}`,
    `Personality: ${(brief.personality as string[]).join(", ")}`,
    `Platform: ${brief.platform}`,
    `Mode: ${brief.mode}`,
    "",
    `### DESIGN GUARDRAILS`,
    antiSlopSystemPrompt(),
    "",
    `### LAYOUT PLAN`,
    `### Global Regions (shared across screens — nav, sidebar, footer)`,
    globalBlock,
    "",
    screensBlock,
    "",
    `### AVAILABLE COMPONENTS`,
    availableComponents,
    "",
    `### SUGGESTED IMPORTS`,
    importSuggestion,
    "",
    `### DESIGN TOKENS`,
    tokenSnapshot(tokens),
    "",
    `### INSTRUCTIONS`,
    `Generate a screen file for EACH screen in the layout plan. Each screen file:`,
    `1. Is a default export React component.`,
    `2. Imports components from "../components/[Name]".`,
    `3. Lays them out in the regions specified by the layout plan (grid, flex, arrange).`,
    `4. Contains real-looking copy and content matching the product brief.`,
    `5. Contains NO new styling beyond layout (position, grid, flex, gap, padding).`,
    `6. All visual styling comes from the components themselves — screens are layout only.`,
    "",
    `Output the screen files one per code fence, labeled with the filename. Use \`\`\`filename.tsx ... \`\`\` for each.`,
  ].join("\n");
}

// ── Code validation ─────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateComponentCode(
  code: string,
  entry: ComponentManifestEntry,
): ValidationResult {
  const errors: string[] = [];

  if (!/\bexport\s+default\s+(?:async\s+)?function\s+\w/.test(code)) {
    errors.push(`Missing default export function`);
  }

  const hasPropsInterface = /\binterface\s+\w*Props\b/.test(code) || /\w+:\s*\w*Props\b/.test(code);
  if (!hasPropsInterface) {
    errors.push(`Missing TypeScript props interface or typed props parameter`);
  }

  if (!/var\(--color-/.test(code) && !/var\(--space-/.test(code) && !/var\(--radius-/.test(code)) {
    errors.push(`No CSS custom properties used — must reference var(--color-*), var(--space-*), or var(--radius-*)`);
  }

  const isInteractive = entry.states.some((s) =>
    ["hover", "focus", "active"].includes(s),
  );

  if (isInteractive) {
    if (!/hover:/.test(code)) {
      errors.push(`Interactive component missing hover state`);
    }
    if (!/focus-visible:/.test(code) && !/focus:/.test(code)) {
      errors.push(`Interactive component missing focus state (use focus-visible:ring-2)`);
    }
  }

  if (!code.includes("import") && !code.includes("require")) {
    errors.push(`Missing module imports`);
  }

  const needsReact = /React\.|\buse[A-Z]\w+\(|createElement|\.createElement/.test(code) ||
    /\bexport\s+default\s+(?:async\s+)?function\s+\w+/.test(code);
  const needsLucide = code.includes("lucide-react");
  const needsRadix = entry.radixPrimitive != null;

  if (needsReact && !code.includes(`from "react"`) && !code.includes(`from 'react'`)) {
    errors.push(`Component uses React but is missing react import`);
  }
  if (needsLucide && !code.includes(`lucide-react`)) {
    errors.push(`Component uses lucide-react but is missing import`);
  }
  if (needsRadix && !code.includes(`@radix-ui`)) {
    errors.push(`Component uses Radix primitive but is missing @radix-ui import`);
  }

  const hardcodedHex = code.match(/#[0-9a-fA-F]{6}(?!\s*[;,\s])/g);
  if (hardcodedHex && hardcodedHex.length > 1) {
    errors.push(`Hardcoded hex colors detected (${hardcodedHex.length}) — replace with CSS custom properties`);
  }

  return { valid: errors.length === 0, errors };
}

// ── Minimal fallback stub ───────────────────────────────────────────────

function fallbackStub(entry: ComponentManifestEntry): string {
  const hasVariants = entry.variants && Object.keys(entry.variants).length > 0;

  if (entry.radixPrimitive) {
    const importLine = RADIX_IMPORT[entry.radixPrimitive] ?? "";
    return `${importLine}
import React from "react";

export interface ${entry.name}Props {
  className?: string;
  children?: React.ReactNode;
}

export default function ${entry.name}({ className, children }: ${entry.name}Props) {
  return (
    <div className={className} style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
      {children}
    </div>
  );
}`;
  }

  if (hasVariants) {
    return `import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const ${entry.name.toLowerCase()}Variants = cva(
  "rounded-[var(--radius-md)] transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
  {
    variants: {},
    defaultVariants: {},
  }
);

export interface ${entry.name}Props extends VariantProps<typeof ${entry.name.toLowerCase()}Variants> {
  className?: string;
}

export default function ${entry.name}({ className, ...props }: ${entry.name}Props) {
  return (
    <div className={cn(${entry.name.toLowerCase()}Variants({}), className)} {...props}>
      {/* ${entry.name} — ${entry.description} */}
    </div>
  );
}`;
  }

  return `import React from "react";

export interface ${entry.name}Props {
  className?: string;
}

export default function ${entry.name}({ className }: ${entry.name}Props) {
  return (
    <div
      className={className}
      style={{
        color: "var(--color-text-primary)",
        background: "var(--color-surface-raised)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
      }}
    >
      {/* ${entry.name} — ${entry.description} */}
    </div>
  );
}`;
}

// ── Clean output ────────────────────────────────────────────────────────

function cleanComponentOutput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:tsx|typescript|jsx|javascript)?\s*\n?/, "");
  s = s.replace(/\n?```\s*$/, "");
  return s.trim();
}

// ── Public API ──────────────────────────────────────────────────────────

export interface GenerateComponentInput {
  entry: ComponentManifestEntry;
  tokens: Tokens;
  tokensCSS: string;
  briefContext: string;
}

export async function generateComponent(
  input: GenerateComponentInput,
): Promise<string> {
  const { entry, tokens, briefContext } = input;
  const model = resolveModel(entry);

  const attemptGeneration = async (extraContext?: string): Promise<string> => {
    const prompt = componentPrompt(entry, tokens, briefContext);

    const messages: ChatMessage[] = [
      { role: "system", content: COMPONENT_SYSTEM },
      { role: "user", content: prompt },
    ];

    if (extraContext) {
      messages.push(
        { role: "assistant", content: "[Previous generation failed — regenerating with corrections]" },
        { role: "user", content: `The previous generation failed validation. ${extraContext} Please regenerate the ${entry.name} component. Output ONLY the complete component file.` },
      );
    }

    const raw = await chatText(messages, {
      model,
      temperature: 0.5,
      maxTokens: MAX_TOKENS_PER_CALL[model],
    });

    return cleanComponentOutput(raw);
  };

  let code = await attemptGeneration();

  const validation = validateComponentCode(code, entry);
  if (!validation.valid) {
    console.warn(
      `[stage-5] ${entry.name} validation failed: ${validation.errors.join("; ")}. Retrying...`,
    );
    try {
      const errorContext = validation.errors.map((e) => `- ${e}`).join("\n");
      code = await attemptGeneration(
        `The following issues must be fixed:\n${errorContext}`,
      );

      const reValidation = validateComponentCode(code, entry);
      if (!reValidation.valid) {
        console.warn(
          `[stage-5] ${entry.name} retry validation also failed: ${reValidation.errors.join("; ")}. Using fallback stub.`,
        );
        return fallbackStub(entry);
      }
    } catch (err) {
      console.error(
        `[stage-5] ${entry.name} retry errored: ${err instanceof Error ? err.message : err}. Using fallback stub.`,
      );
      return fallbackStub(entry);
    }
  }

  return code;
}

export async function generateAllComponents(
  manifest: ComponentsManifest,
  tokens: Tokens,
  tokensCSS: string,
  brief: Brief,
  concurrency = 4,
): Promise<Record<string, string>> {
  const briefContext = [
    `Product: ${brief.productName}`,
    `Description: ${brief.description}`,
    `Audience: ${brief.audience}`,
    `Niche: ${brief.niche}`,
    `Personality: ${(brief.personality as string[]).join(", ")}`,
    `Density: ${brief.density}`,
    `Mode: ${brief.mode}`,
    `Platform: ${brief.platform}`,
  ].join("\n");

  const limit = pLimit(concurrency);

  const tasks = manifest.entries.map((entry) =>
    limit(async () => {
      const code = await generateComponent({
        entry,
        tokens,
        tokensCSS,
        briefContext,
      });
      return { id: entry.id, code };
    }),
  );

  const results = await Promise.all(tasks);

  const components: Record<string, string> = {};
  for (const { id, code } of results) {
    if (code) {
      components[id] = code;
    }
  }

  return components;
}

export async function generateCatalogPage(
  manifest: ComponentsManifest,
  tokens: Tokens,
): Promise<string> {
  const prompt = catalogPrompt(manifest, tokens);

  const messages: ChatMessage[] = [
    { role: "system", content: CATALOG_SYSTEM },
    { role: "user", content: prompt },
  ];

  const raw = await chatText(messages, {
    model: "compose",
    temperature: 0.4,
    maxTokens: MAX_TOKENS_PER_CALL.compose,
  });

  return cleanComponentOutput(raw);
}

export async function composeScreens(
  brief: Brief,
  layoutPlan: LayoutPlan,
  tokens: Tokens,
  manifest: ComponentsManifest,
  generatedComponents: Record<string, string>,
): Promise<Record<string, string>> {
  const prompt = screenPrompt(brief, layoutPlan, tokens, manifest, generatedComponents);

  const messages: ChatMessage[] = [
    { role: "system", content: SCREEN_SYSTEM },
    { role: "user", content: prompt },
  ];

  const raw = await chatText(messages, {
    model: "compose",
    temperature: 0.5,
    maxTokens: MAX_TOKENS_PER_CALL.compose,
  });

  const screens: Record<string, string> = {};
  const fenceRe = /```(?:tsx|typescript|jsx|javascript)?\s*\n?([\s\S]*?)```/g;

  console.log(`[composeScreens] Raw output: ${raw.length} chars. First 200: ${raw.slice(0, 200)}`);

  const namedRe = /```(?:\w+\/)?(\S+\.(?:tsx|jsx))\s*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = namedRe.exec(raw)) !== null) {
    const filename = m[1] as string;
    const code = (m[2] as string).trim();
    if (code.length > 40 && code.includes("export")) {
      screens[filename] = code;
    }
  }

  if (Object.keys(screens).length === 0) {
    const unnamed: string[] = [];
    let um: RegExpExecArray | null;
    fenceRe.lastIndex = 0;
    while ((um = fenceRe.exec(raw)) !== null) {
      const code = (um[1] as string).trim();
      if (code.length > 40 && (code.includes("export default") || code.includes("export function"))) {
        unnamed.push(code);
      }
    }
    for (let i = 0; i < unnamed.length && i < layoutPlan.screens.length; i++) {
      const screenId = layoutPlan.screens[i].id;
      screens[screenId] = unnamed[i];
    }
  }

  if (Object.keys(screens).length === 0) {
    const exportBlocks = raw.split(/(?=export\s+(?:default\s+)?function\s+)/g);
    for (let i = 1; i < exportBlocks.length && i <= layoutPlan.screens.length; i++) {
      if (exportBlocks[i].length > 60) {
        const screenId = layoutPlan.screens[i - 1].id;
        screens[screenId] = `import React from "react";\n\n${exportBlocks[i].trim()}`;
      }
    }
  }

  console.log(`[composeScreens] Extracted ${Object.keys(screens).length} screens`);
  return screens;
}

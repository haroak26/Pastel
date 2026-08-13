import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { componentUISpecSchema, type ComponentUISpec, type ComponentInventory, type ResolvedTheme, type WireframePlan } from "../schemas";
import { componentDesignLaw } from "../knowledge/component-law";
import { datasetPrompt, type MockDataset } from "../lib/content";

/**
 * V21 Planner agent — per-component UI spec, written from the Component
 * Design Law (there is NO base-component reference to adapt; the deleted
 * base library was the "same skeleton every run" anchor).
 *
 * V21 cost rule: SHELL components (Topbar/Sidebar/Button/Avatar/Badge/Input/
 * Select/Separator) get a deterministic spec — zero model calls. Only the
 * product's custom components are planned by the model.
 *
 * V21 cost rule 2: no company reference imagery in the planner (images were
 * the dominant token cost; the design law + tokens carry the style).
 */

/** Shell components whose specs are deterministic (no model call). */
export const SHELL_COMPONENT_NAMES = new Set([
  "Topbar", "Sidebar", "Button", "Avatar", "Badge", "Input", "Select", "Separator",
]);

export interface PlannerInput {
  item: ComponentInventory["components"][number];
  theme: ResolvedTheme;
  wireframe?: WireframePlan;
  data?: MockDataset;
  onUsage?: OnUsage;
  /** V18: screen composition summary — the full layout narrative so the
   * planner's designIntent is informed by the complete composition, not just
   * the isolated component spec. */
  compositionSummary?: string;
}

export interface PlannerOutput {
  spec: ComponentUISpec;
  usedFallback: boolean;
}

export function isShellComponent(name: string): boolean {
  return SHELL_COMPONENT_NAMES.has(name);
}

/** Deterministic spec for the run's chrome components — no model call. */
function shellSpec(item: PlannerInput["item"]): ComponentUISpec {
  const name = item.name;
  const purpose = item.purpose;
  const commonProps = [
    { name: "className", type: "string", default: '""' },
  ];
  const byName: Record<string, ComponentUISpec> = {
    Topbar: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "title", type: "string", default: '""' },
        { name: "subtitle", type: "string", default: '""' },
        { name: "search", type: "boolean", default: "false" },
        { name: "user", type: "object", default: "null" },
        { name: "actions", type: "node", default: "null" },
        ...commonProps,
      ],
      variants: [
        { name: "default", purpose: "Standard product header" },
        { name: "minimal", purpose: "Title only, no user context" },
      ],
      states: ["default", "hover", "focus"],
      designIntent: "A product-grade header: the brand and title read instantly, the user chip is quiet, search sits centered-right. Sticky with a hairline border. Rounded search input from the theme radius. This product's data never appears in the header except the user chip.",
      notes: "Render title, optional subtitle, optional search field, optional actions slot, and the user chip from props. Use var(--control-*) heights and var(--radius-md) for the search input. No hardcoded colors.",
    },
    Sidebar: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "brand", type: "string", default: '""' },
        { name: "nav", type: "array", default: "[]" },
        { name: "activeId", type: "string", default: '""' },
        { name: "onNavigate", type: "function", default: "() => {}" },
        { name: "user", type: "object", default: "null" },
        ...commonProps,
      ],
      variants: [
        { name: "default", purpose: "Standard navigation rail" },
        { name: "compact", purpose: "Icon-first narrow rail" },
      ],
      states: ["default", "hover", "active", "focus"],
      designIntent: "A real product nav rail: the brand wordmark at top, grouped destinations with an unmistakable active state (soft-wash pill + primary text, never a blue underline), the user card pinned at the bottom. Fixed width, hairline right border.",
      notes: "Render brand, nav items (id/label/icon from props), activeId highlight, user card. Active item = bg-muted/50 rounded-[var(--radius-md)] pill with font-medium. No hardcoded colors.",
    },
    Button: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "children", type: "node", default: "null" },
        { name: "variant", type: "string", default: '"primary"' },
        { name: "size", type: "string", default: '"md"' },
        { name: "disabled", type: "boolean", default: "false" },
        { name: "onClick", type: "function", default: "() => {}" },
        ...commonProps,
      ],
      variants: [
        { name: "primary", purpose: "The primary action" },
        { name: "secondary", purpose: "Quiet secondary action" },
        { name: "ghost", purpose: "Bare text action" },
      ],
      states: ["default", "hover", "active", "focus", "disabled"],
      designIntent: "A crisp, on-brand button: primary fills with the theme primary token, secondary is a hairline-outlined quiet action, ghost is text-only. Heights from the control scale, radius from the theme, focus-visible ring. Never gradient, never an accent-color flood.",
      notes: "variant: primary/secondary/ghost; size: sm/md/lg mapping to h-[var(--control-sm/md/lg)]. Rounded-[var(--radius-md)]. Hover/active/focus states required.",
    },
    Avatar: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "name", type: "string", default: '""' },
        { name: "initials", type: "string", default: '""' },
        { name: "hue", type: "number", default: "0" },
        { name: "size", type: "number", default: "32" },
        ...commonProps,
      ],
      variants: [
        { name: "default", purpose: "Standard avatar" },
        { name: "stack", purpose: "Overlapping avatar row" },
      ],
      states: ["default"],
      designIntent: "A clean initials avatar: one or two letters on a muted tint derived from the hue prop, fully rounded, no border, no emoji. Sizes come from props.",
      notes: "Use style={{ backgroundColor: `hsl(${hue} 30% 92%)`, color: `hsl(${hue} 45% 35%)` }} from props only. rounded-full.",
    },
    Badge: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "children", type: "node", default: "null" },
        { name: "tone", type: "string", default: '"muted"' },
        ...commonProps,
      ],
      variants: [
        { name: "default", purpose: "Status badge" },
        { name: "dot", purpose: "Indicator dot with label" },
      ],
      states: ["default"],
      designIntent: "A compact status chip: rounded-[var(--radius-full)], tinted fill with matching text (success/warning/destructive/muted from theme tokens), 12px type. Quiet — never a colored block.",
      notes: "tone: success/warning/destructive/muted. bg-success/15 text-success etc. rounded-full.",
    },
    Input: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "placeholder", type: "string", default: '""' },
        { name: "icon", type: "node", default: "null" },
        { name: "value", type: "string", default: '""' },
        { name: "onChange", type: "function", default: "() => {}" },
        ...commonProps,
      ],
      variants: [
        { name: "default", purpose: "Standard input" },
        { name: "search", purpose: "Search field with icon" },
      ],
      states: ["default", "hover", "focus", "disabled"],
      designIntent: "A calm, theme-correct input: border-input hairline, bg-card, focus ring in the theme ring color, rounded-[var(--radius-md)], control-scale height, placeholder in muted.",
      notes: "Use border-input bg-card rounded-[var(--radius-md)] h-[var(--control-md)] focus-visible:ring-2 ring-ring.",
    },
    Select: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "options", type: "array", default: "[]" },
        { name: "value", type: "string", default: '""' },
        { name: "onChange", type: "function", default: "() => {}" },
        { name: "placeholder", type: "string", default: '""' },
        ...commonProps,
      ],
      variants: [
        { name: "default", purpose: "Standard select" },
      ],
      states: ["default", "hover", "focus", "disabled"],
      designIntent: "A native-styled select that matches the Input: same height, radius, border, and focus ring, with a chevron icon on the right.",
      notes: "Native <select> styled with theme tokens. h-[var(--control-md)] rounded-[var(--radius-md)] border-input bg-card.",
    },
    Separator: {
      name, purpose, usedBy: item.usedBy,
      props: [
        { name: "orientation", type: "string", default: '"horizontal"' },
        ...commonProps,
      ],
      variants: [
        { name: "horizontal", purpose: "Row divider" },
        { name: "vertical", purpose: "Column divider" },
      ],
      states: ["default"],
      designIntent: "A hairline divider using the border token; vertical mode is self-height, horizontal is self-width. Nothing else.",
      notes: "bg-border. Horizontal: h-px w-full. Vertical: w-px h-full.",
    },
  };
  const spec = byName[name];
  if (spec) return spec;
  return {
    name, purpose, usedBy: item.usedBy,
    props: [
      { name: "className", type: "string", default: '""' },
      { name: "items", type: "array", default: "[]" },
    ],
    variants: [
      { name: "default", purpose },
    ],
    states: ["default", "hover", "focus"],
    designIntent: "Chrome component for this product's shell — quiet, token-correct, no decoration.",
    notes: "Render every value from props. Token colors only.",
  };
}

const SYSTEM = `You are a UI component planner. For ONE product component, produce a precise implementation spec: purpose, props, variants, states, and art direction. The builder writes the component from your spec + the Component Design Law — there is NO reference code anywhere, so your spec must describe the design so concretely that two builders would produce the same component.

RULES:
- props: keep them simple and product-shaped (title, items, metrics, people, progress...). The composer passes real data through these props.
- variants: 2-5, each with a purpose.
- states: pick from default, hover, active, focus, disabled, loading, empty, error.
- designIntent (ONE line, ≤ 240 chars): the art direction — what the component IS visually in this product, what its ONE visual idea is, which surface it lives on. Must reference the product data it displays.
- notes: a concrete product-specific hint — which of the provided dataset fields it renders, and that every value slot renders a PROP (never hardcoded sample values).
- usedBy: copy the provided screen ids unchanged.`;

export async function runPlanner(input: PlannerInput): Promise<PlannerOutput> {
  // V21: shell components are planned deterministically — zero model calls.
  if (isShellComponent(input.item.name)) {
    return { spec: shellSpec(input.item), usedFallback: false };
  }

  const law = componentDesignLaw();
  const screensBlock = input.wireframe
    ? `SCREENS THAT MOUNT THIS COMPONENT:\n${input.wireframe.screens
        .filter((s) => input.item.usedBy.includes(s.id))
        .map((s) => `- ${s.id} (${s.archetype}): ${s.purpose}`)
        .join("\n")}`
    : "";

  const dataBlock = input.data ? datasetPrompt(input.data) : "";

  const compositionBlock = input.compositionSummary
    ? `SCREEN COMPOSITION CONTEXT (your component sits in this layout — the designIntent must reflect where it lives):\n${input.compositionSummary}`
    : "";

  const textPart = `COMPONENT: ${input.item.name} — ${input.item.purpose}\nUsed by screens: ${input.item.usedBy.join(", ")}\n\n${screensBlock}\n\n${compositionBlock}\n\n${dataBlock}\n\n${law}\n\nCOMPANY RULES:\n${input.theme.manifest.rules.map((r) => `- ${r}`).join("\n")}\n\nCOMPANY SIGNATURE MOVES (reference for the designIntent):\n${input.theme.manifest.signatureMoves.map((s) => `- ${s}`).join("\n")}\n\nEmit the component UI spec as JSON matching:\n{\n  "name", "purpose", "usedBy": [screen ids],\n  "props": [{ "name", "type", "default"? }],\n  "variants": [{ "name", "purpose" }],\n  "states": string[],\n  "designIntent"?, "notes"?\n}`;

  try {
    const spec = await chatJSON<ComponentUISpec>(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: textPart },
      ],
      {
        model: "planner",
        temperature: 0.3,
        maxTokens: MAX_TOKENS_PER_CALL.planner,
        validate: (v) => componentUISpecSchema.parse(v),
        onUsage: input.onUsage,
      },
    );
    return {
      spec: {
        ...spec,
        usedBy: input.item.usedBy,
        // V21: schema caps designIntent at 240 chars — truncate instead of
        // failing validation (a too-long intent caused planner retry storms).
        designIntent: spec.designIntent ? spec.designIntent.slice(0, 240) : undefined,
      },
      usedFallback: false,
    };
  } catch (err) {
    console.warn(`[pastel v21] planner failed for ${input.item.name}, using template:`, err instanceof Error ? err.message : err);
    return { spec: fallbackSpec(input.item), usedFallback: true };
  }
}

function fallbackSpec(item: PlannerInput["item"]): ComponentUISpec {
  return {
    name: item.name,
    purpose: item.purpose,
    usedBy: item.usedBy,
    props: [
      { name: "className", type: "string", default: '""' },
    ],
    variants: [
      { name: "default", purpose: item.purpose },
      { name: "compact", purpose: "Tighter spacing for dense slots" },
    ],
    states: ["default", "hover", "active", "focus", "disabled"],
    designIntent: "Distinctive product flavor: the component must look authored for this product — one clear visual idea, real data through props, token colors only.",
    notes: "Render every value slot from props — never hardcode sample values. Token colors only.",
  };
}

import type { Brief, Tokens, LayoutPlan, ComponentsManifest, ComponentManifestEntry } from "./types";
import type { BrandKit } from "./stage-3-wireframe";
import { chatText, chatJSON, MAX_TOKENS_PER_CALL, type ChatMessage } from "../../gateway";
import { antiSlopSystemPrompt } from "./anti-slop";
import { loadBaseComponent, rewriteBaseImports, tokenSnapshot, kebab, type BaseComponentInfo } from "./lib/base-components";
import pLimit from "p-limit";
import { z } from "zod";

// ── Content generation ─────────────────────────────────────────────────

export interface MockDataset {
  itemCount: number;
  metrics: Array<{ label: string; value: string; unit?: string; delta?: string }>;
  items: Array<Record<string, unknown>>;
  screens: Record<string, Record<string, unknown>>;
}

export interface CopyPlan {
  screens: Record<string, {
    heading: string;
    subheading: string;
    ctas: Array<{ label: string; variant?: string }>;
    labels: Record<string, string>;
  }>;
}

export interface ContentOutput {
  data: MockDataset;
  copy: CopyPlan;
  coherenceReport: { valid: boolean; issues: string[] };
}

const contentSchema = z.object({
  data: z.object({
    itemCount: z.number().min(1),
    metrics: z.array(z.object({
      label: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      delta: z.string().optional(),
    })).max(8).default([]),
    items: z.array(z.record(z.unknown())).max(12).default([]),
    screens: z.record(z.record(z.unknown())).default({}),
  }),
  copy: z.object({
    screens: z.record(z.object({
      heading: z.string(),
      subheading: z.string(),
      ctas: z.array(z.object({ label: z.string(), variant: z.string().optional() })).default([]),
      labels: z.record(z.string()).default({}),
    })),
  }),
});

const CONTENT_SYSTEM = `You are the content strategist + data engineer for a product design studio. You write the REAL copy and REAL-looking data for every screen of a product, from its brief and wireframe.

## Copy laws
- Every word must be specific to THIS product and its users. Never generic SaaS filler ("Seamless", "Empower your team", "Get started today").
- Voice matches the product personality (playful → witty but useful; professional → precise and calm; minimal → short and confident).
- Headings are concrete and benefit-led. Subheadings explain in one line. CTAs use real action verbs tied to the workflow ("Plan my trip", "Split this bill", "Start a sprint").
- No placeholder names ("John Doe"), no fake companies ("Acme"), no Lorem ipsum.
- Every screen in the wireframe gets copy: heading, subheading, 1-2 CTAs (label + variant: default/outline/ghost), and labels for its key controls.

## Data laws
- data.metrics: 2-6 headline numbers the screen actually shows (label, value with realistic formatting, optional unit and delta like "+12%"). Values must be concrete and believable for the domain — never "0" unless a zero state is the point.
- data.items: 3-8 concrete domain records (e.g. transactions, goals, courses, flights) each with 3-8 fields. Every item needs a name/title and enough fields for list + detail views. Use dates as ISO strings ("2025-03-14").
- data.screens: per-screen keyed data objects for anything structured (rows, charts, lists) keyed by the wireframe screen id.
- itemCount: total items across the product.
- Coherence: numbers must agree across screens (a budget total must equal the sum of its rows, etc.).

Output ONLY the JSON.`;

export interface ContentInput {
  brief: Brief;
  layoutPlan: LayoutPlan;
  brandKit: BrandKit;
  creativeSeed: string;
}

export async function runContentGeneration(input: ContentInput): Promise<ContentOutput> {
  const { brief, layoutPlan, brandKit, creativeSeed } = input;

  const screensBlock = layoutPlan.screens.map((s) => {
    const regions = s.regions.map((r) => `  [${r.name} / ${r.role}] ${r.purpose} → ${r.componentTypes.map((c) => c.name).join(", ")}`).join("\n");
    return `- ${s.id} ("${s.name}", ${s.route}) — ${s.description}\n  Dominant moment: ${s.dominantMoment}\n${regions}`;
  }).join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: CONTENT_SYSTEM },
    {
      role: "user",
      content: [
        `## PRODUCT`,
        `Name: ${brief.productName}`,
        `Description: ${brief.description}`,
        `Audience: ${brief.audience}`,
        `Personality: ${brief.personality.join(", ")}`,
        `Niche: ${brief.niche}`,
        `Creative seed: ${creativeSeed}`,
        `Brand signature moves: ${brandKit.signatureMoves.join("; ")}`,
        "",
        `## WIREFRAME (screens + regions)`,
        screensBlock,
        "",
        `## OUTPUT CONTRACT`,
        `data: { itemCount, metrics[{label,value,unit?,delta?}] ≤6, items[≤8 domain records with name + fields, ISO date strings], screens{<id>: {…}} }`,
        `copy: { screens{ <id>: { heading, subheading, ctas[{label, variant?}] ≤2, labels{key: label} } } }`,
        `Generate the content JSON now.`,
      ].join("\n"),
    },
  ];

  const result = await chatJSON(messages, {
    model: "data",
    temperature: 0.8,
    maxTokens: MAX_TOKENS_PER_CALL.data,
    validate: (v) => contentSchema.parse(v),
  });

  const copy: CopyPlan = { screens: {} };
  for (const [id, c] of Object.entries(result.copy.screens)) {
    copy.screens[id] = c;
  }

  const issues: string[] = [];
  const ids = new Set(layoutPlan.screens.map((s) => s.id));
  for (const id of Object.keys(copy.screens)) {
    if (!ids.has(id)) issues.push(`copy for unknown screen "${id}"`);
  }

  return {
    data: result.data as MockDataset,
    copy,
    coherenceReport: { valid: issues.length === 0, issues },
  };
}

// ── Component generation: edit the base shadcn source ───────────────────

export interface GenerateComponentInput {
  entry: ComponentManifestEntry;
  tokens: Tokens;
  brief: Brief;
  creativeSeed: string;
  baseSources: Record<string, BaseComponentInfo>;
  extraContext?: string;
}

const COMPONENT_SYSTEM = `You are a senior product engineer editing production shadcn components for a specific product. You receive the COMPLETE source of a base shadcn component and you REWRITE it into a custom component for this product. The user gets the code you write — it must be complete, correct, and unmistakably this product's.

## Rules
1. START from the provided base source. Keep its structure, accessibility, exports and API. Change what the customization instructions demand.
2. Output the COMPLETE file — the user does not see any other file. Never output "…rest unchanged".
3. Self-contained: imports may only be npm packages (react, radix-ui, lucide-react, class-variance-authority, clsx, tailwind-merge, cmdk, input-otp, vaul, sonner, embla-carousel-react, next-themes, recharts, react-day-picker, date-fns, react-resizable-panels, @base-ui/react) or relative siblings (./cn, ./button, ./use-mobile). NEVER "@/" aliases, NEVER imports from "shadcn" packages.
4. Styling: use ONLY the theme slot utilities and token values from the token snapshot (bg-primary, text-muted-foreground, rounded-lg, h-9…). NO raw hex/rgb/hsl/oklch, NO default Tailwind palette colours (gray/blue/etc.), NO gradients.
5. Customization MUST be visible: remap colours to the product slots, adjust sizes/heights and rounding per the instructions, use the accent where the instructions say, tune density and padding. If the output is byte-identical to the base, it is a failure.
6. Keep all exports the base file exported (same names) so existing importers keep working.
7. Props: keep the base props and add/adjust per the manifest spec. Dates are typed as string (ISO). No placeholder or sample data — values come from props.
8. Every interactive element keeps hover, focus-visible ring, active and disabled states (the base already has them — don't remove).
9. Data from props: always guard optional data with fallbacks. Never render "undefined" or "NaN".`;

export function validateComponentCode(code: string, entry: ComponentManifestEntry, base: BaseComponentInfo): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!code.trim()) {
    errors.push("Empty component file");
    return { valid: false, errors };
  }

  if (/from\s+["']@\//.test(code)) {
    errors.push('"@/" alias import found — file must be self-contained (use ./cn, ./button)');
  }
  if (/from\s+["'](?:shadcn|@shadcn\/[a-z-]+)["']/.test(code)) {
    errors.push("Import from the shadcn package — component source must be inlined");
  }
  if (/#[0-9a-fA-F]{3,8}\b/.test(code)) {
    errors.push("Raw hex colour literal — use theme slot utilities");
  }

  // Export preservation: every export the base had must still exist.
  const baseExports = extractExports(base.source);
  const codeExports = extractExports(code);
  const missing = baseExports.filter((e) => !codeExports.includes(e));
  if (missing.length > 0) {
    errors.push(`Missing exports from base: ${missing.join(", ")}`);
  }

  // Must actually differ from base (uniqueness).
  if (code.trim() === base.source.trim()) {
    errors.push("Byte-identical to the base shadcn component — customize sizing, colours, rounding for this product");
  }

  // Minimal customisation signal: at least one product slot utility present.
  if (!/(?:bg-primary|text-primary|bg-muted|bg-accent|text-muted-foreground|bg-card|bg-secondary|border-border|ring-ring|rounded|h-8|h-9|h-10|h-11)/.test(code)) {
    errors.push("No theme styling present — use slot utilities from the token snapshot");
  }

  return { valid: errors.length === 0, errors };
}

function extractExports(code: string): string[] {
  const out: string[] = [];
  const named = code.match(/export \{\s*([^}]+)\s*\}/g) ?? [];
  for (const block of named) {
    const inner = block.replace(/export \{/, "").replace(/\}/, "");
    for (const part of inner.split(",")) {
      const name = part.trim().split(/\s+as\s+/)[1]?.trim() ?? part.trim();
      if (name) out.push(name.replace(/,/g, "").trim());
    }
  }
  const direct = code.match(/export\s+(?:function|const)\s+([A-Za-z_$][\w$]*)/g) ?? [];
  for (const d of direct) out.push(d.split(/\s+/).pop() ?? "");
  return [...new Set(out.filter(Boolean))];
}

function componentPrompt(
  entry: ComponentManifestEntry,
  tokens: Tokens,
  brief: Brief,
  creativeSeed: string,
  base: BaseComponentInfo,
  extraContext?: string,
): string {
  const variantsBlock = entry.variants
    ? Object.entries(entry.variants).map(([k, vs]) => `  - ${k}: ${vs.join(" | ")}`).join("\n")
    : "  (none)";

  const propsBlock = Object.entries(entry.props)
    .map(([name, spec]) => `  - ${name}: ${spec.type}${spec.required ? " (required)" : ""} — ${spec.description}`)
    .join("\n") || "  (keep base props)";

  return [
    `## PRODUCT`,
    `Name: ${brief.productName}`,
    `Description: ${brief.description}`,
    `Audience: ${brief.audience}`,
    `Personality: ${brief.personality.join(", ")}`,
    `Creative seed: ${creativeSeed}`,
    "",
    `## COMPONENT SPEC`,
    `Name: ${entry.name} (id: ${entry.id})`,
    `Taxonomy: ${entry.taxonomy}`,
    `Description: ${entry.description}`,
    `Base component to edit: ${entry.baseComponent}`,
    `States: ${entry.states.join(", ")}`,
    `Variants:`,
    variantsBlock,
    `Props:`,
    propsBlock,
    "",
    `## CUSTOMIZATION INSTRUCTIONS (follow exactly)`,
    entry.customization,
    "",
    `## BASE SOURCE (the complete file to edit — this is the starting point)`,
    "```tsx",
    base.source,
    "```",
    "",
    tokenSnapshot(tokens),
    "",
    antiSlopSystemPrompt(),
    "",
    extraContext ? `## REGENERATION NOTES\n${extraContext}` : "",
    "",
    `Rewrite the component now. Output ONLY the complete .tsx file.`,
  ].join("\n");
}

export async function generateComponent(input: GenerateComponentInput): Promise<string> {
  const { entry, tokens, brief, creativeSeed, baseSources, extraContext } = input;
  const base = baseSources[entry.baseComponent] ?? loadBaseComponent(entry.baseComponent);
  if (!base) {
    return fallbackStub(entry);
  }

  const model = "builderCustom" as const;
  const attempt = async (ctx?: string): Promise<string> => {
    const messages: ChatMessage[] = [
      { role: "system", content: COMPONENT_SYSTEM },
      { role: "user", content: componentPrompt(entry, tokens, brief, creativeSeed, base, ctx) },
    ];
    if (ctx) {
      messages.splice(1, 0, { role: "assistant", content: "[Previous generation failed validation]" });
    }
    const raw = await chatText(messages, {
      model,
      temperature: 0.5,
      maxTokens: MAX_TOKENS_PER_CALL.builderCustom,
    });
    return rewriteBaseImports(cleanComponentOutput(raw));
  };

  let code = await attempt();
  const validation = validateComponentCode(code, entry, base);
  if (!validation.valid) {
    const errorContext = validation.errors.map((e) => `- ${e}`).join("\n");
    console.warn(`[stage-4] ${entry.name} validation failed: ${validation.errors.join("; ")}. Retrying…`);
    try {
      code = await attempt(`The previous generation failed. Fix these issues:\n${errorContext}`);
      const re = validateComponentCode(code, entry, base);
      if (!re.valid) {
        console.warn(`[stage-4] ${entry.name} retry failed: ${re.errors.join("; ")}. Falling back to customized base.`);
        return customizeBaseFallback(base.source, entry);
      }
    } catch (err) {
      console.error(`[stage-4] ${entry.name} retry errored: ${err instanceof Error ? err.message : err}`);
      return customizeBaseFallback(base.source, entry);
    }
  }
  return code;
}

/** Last-resort: emit the base source with imports rewritten + an accent touch,
 * so screens still compose. Never a broken stub. */
function customizeBaseFallback(source: string, entry: ComponentManifestEntry): string {
  let code = rewriteBaseImports(source);
  if (!code.includes(entry.name)) {
    // add a data-slot branding marker without breaking the API
    code = code.replace(/(data-slot="[^"]*")/, `$1 data-product="${entry.id}"`);
  }
  return code;
}

function fallbackStub(entry: ComponentManifestEntry): string {
  return `import * as React from "react"
import { cn } from "./cn"

function ${entry.name}({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="${entry.id}" className={cn("rounded-lg bg-card p-4 text-foreground", className)} {...props} />
}

export { ${entry.name} }
`;
}

export async function generateAllComponents(
  manifest: ComponentsManifest,
  tokens: Tokens,
  brief: Brief,
  creativeSeed: string,
  concurrency = 4,
): Promise<Record<string, string>> {
  const baseSources: Record<string, BaseComponentInfo> = {};
  for (const e of manifest.entries) {
    if (!baseSources[e.baseComponent]) {
      const info = loadBaseComponent(e.baseComponent);
      if (info) baseSources[e.baseComponent] = info;
    }
  }

  const limit = pLimit(concurrency);
  const tasks = manifest.entries.map((entry) =>
    limit(async () => {
      const code = await generateComponent({ entry, tokens, brief, creativeSeed, baseSources });
      return { id: entry.id, code };
    }),
  );

  const results = await Promise.all(tasks);
  const components: Record<string, string> = {};
  for (const { id, code } of results) {
    if (code) components[id] = code;
  }
  return components;
}

/** Support files the generated code may reference (cn, use-mobile). */
export function supportFiles(components: Record<string, string>, screens: Record<string, string>): Record<string, string> {
  const files: Record<string, string> = {
    "cn": `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
  };
  const all = { ...components, ...screens };
  const needsMobile = Object.values(all).some((code) => /from\s+["']\.\/use-mobile["']/.test(code));
  if (needsMobile) {
    files["use-mobile"] = `import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(\`(max-width: \${MOBILE_BREAKPOINT - 1}px)\`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
`;
  }
  return files;
}

function cleanComponentOutput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:tsx|typescript|jsx|javascript)?\s*\n?/, "");
  s = s.replace(/\n?```\s*$/, "");
  return s.trim();
}

export { kebab };

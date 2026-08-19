import { chatText, MAX_TOKENS_PER_CALL, type ChatMessage } from "../gateway";
import { ANTI_SLOP } from "../anti-slop";
import { loadBaseComponent, rewriteBaseImports, tokenSnapshot, type BaseComponentInfo, type MaxiTokens } from "./base-components";

/**
 * Maxi Agent v23 — taxonomy-tiered fidelity floors + base-modification gate.
 *
 * Extracted from the retired Picasso pipeline (stage-4-build.ts). The
 * customization contract has a FLOOR per taxonomy tier (never a
 * scored-after-the-fact report): a primitive that comes out 22% similar to
 * its base is a build failure, not a creative choice. Floors are env-tunable
 * (MAXI_SIM_FLOOR_* — legacy PASTEL_SIM_FLOOR_* env vars are also honored).
 */

export type ComponentTaxonomy = "primitive" | "atom" | "molecule" | "organism";

export interface SimilarityFloor {
  /** Minimum chunk similarity to the base source (0..1). null = no floor. */
  floor: number | null;
  /** Action when a component lands under the floor. */
  action: "reject" | "retry" | "report";
}

function floorFromEnv(primary: string, legacy: string, fallback: number): number {
  const raw = Number(process.env[primary] ?? process.env[legacy]);
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : fallback;
}

export const TAXONOMY_SIMILARITY_FLOORS: Record<ComponentTaxonomy, SimilarityFloor> = {
  primitive: { floor: floorFromEnv("MAXI_SIM_FLOOR_PRIMITIVE", "PASTEL_SIM_FLOOR_PRIMITIVE", 0.85), action: "reject" },
  atom: { floor: floorFromEnv("MAXI_SIM_FLOOR_ATOM", "PASTEL_SIM_FLOOR_ATOM", 0.65), action: "retry" },
  molecule: { floor: floorFromEnv("MAXI_SIM_FLOOR_MOLECULE", "PASTEL_SIM_FLOOR_MOLECULE", 0.40), action: "report" },
  organism: { floor: null, action: "report" },
};

/** Non-overlapping chunk similarity (0..1). Sampling step === chunk length
 *  keeps matches bounded by the shorter file so the ratio never exceeds 1. */
export function sourceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (longer.length === 0) return 0;
  const CHUNK = 32;
  let matches = 0;
  let sampled = 0;
  const seen = new Set<number>();
  for (let i = 0; i + CHUNK <= shorter.length; i += CHUNK) {
    const chunk = shorter.slice(i, i + CHUNK);
    if (chunk.length < 16) continue;
    sampled += chunk.length;
    const idx = longer.indexOf(chunk);
    if (idx >= 0 && !seen.has(idx)) {
      matches += chunk.length;
      seen.add(idx);
    }
  }
  if (sampled === 0) return 0;
  return matches / Math.max(sampled, longer.length);
}

/** Distinct theme slot utilities (bg-primary, text-muted-foreground, …). */
export function distinctSlotUtilities(code: string): number {
  return new Set(
    code.match(/(?:bg|text|border|ring|fill|stroke)-(?:primary|accent|muted|secondary|card|destructive|input|popover|background|foreground)\b/g) ?? [],
  ).size;
}

export interface FidelityVerdict {
  componentId: string;
  componentName: string;
  taxonomy: ComponentTaxonomy;
  baseComponent: string;
  similarity: number;
  floor: number | null;
  passed: boolean;
  /** What happened when the floor was violated. */
  action: "pass" | "retried" | "fell-back-to-base" | "warning" | "report" | "reject" | "retry";
  message?: string;
}

/** Chunk-similarity gate against the taxonomy floor table. */
export function checkSimilarityFloor(
  code: string,
  entry: { id: string; name: string; taxonomy: ComponentTaxonomy },
  base: BaseComponentInfo,
): FidelityVerdict {
  const rule = TAXONOMY_SIMILARITY_FLOORS[entry.taxonomy] ?? { floor: null, action: "report" as const };
  const similarity = sourceSimilarity(code, base.source);
  if (rule.floor === null || similarity >= rule.floor) {
    return {
      componentId: entry.id,
      componentName: entry.name,
      taxonomy: entry.taxonomy,
      baseComponent: base.name,
      similarity: Math.round(similarity * 100) / 100,
      floor: rule.floor,
      passed: true,
      action: "pass",
    };
  }
  return {
    componentId: entry.id,
    componentName: entry.name,
    taxonomy: entry.taxonomy,
    baseComponent: base.name,
    similarity: Math.round(similarity * 100) / 100,
    floor: rule.floor,
    passed: false,
    action: rule.action,
    message: `${entry.name} (${entry.taxonomy}) is ${(similarity * 100).toFixed(0)}% similar to its base — below the ${(rule.floor * 100).toFixed(0)}% floor.`,
  };
}

// ── Component validation (static code contract) ─────────────────────────

export interface ComponentBuildSpec {
  id: string;
  name: string;
  taxonomy: ComponentTaxonomy;
  baseComponent: string;
  description: string;
  props: Array<{ name: string; type: string; required?: boolean; description?: string }>;
  variants?: Record<string, string[]> | string[];
  states: string[];
  /** One line of art direction — the builder's creative brief. */
  customization: string;
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

export function validateComponentCode(code: string, entry: ComponentBuildSpec, base: BaseComponentInfo): { valid: boolean; errors: string[] } {
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
  if (/from\s+["']@base-ui\//.test(code)) {
    errors.push("Import from @base-ui — component source must be inlined");
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
    errors.push("Byte-identical to the base component — customize sizing, colours, rounding for this product");
  }

  // Divergence bar: primitives may stay close to base — generic chrome is
  // correct. Product-specific molecules/organisms must visibly diverge.
  if (entry.taxonomy === "molecule" || entry.taxonomy === "organism") {
    const similarity = sourceSimilarity(code, base.source);
    if (similarity >= 0.9) {
      errors.push(`Too close to the base source (${Math.round(similarity * 100)}% similar) — ${entry.taxonomy} components must be visibly customized (sizing, rounding, colour, density)`);
    }
    const baseSlots = distinctSlotUtilities(base.source);
    if (baseSlots >= 2) {
      const codeSlots = distinctSlotUtilities(code);
      if (codeSlots < Math.min(2, baseSlots)) {
        errors.push(`Uses too few theme slot utilities (${codeSlots}) for a product-specific ${entry.taxonomy} component`);
      }
    }
  }

  // Minimal customisation signal: at least one product slot utility present.
  if (!/(?:bg-primary|text-primary|bg-muted|bg-accent|text-muted-foreground|bg-card|bg-secondary|border-border|ring-ring|rounded|h-8|h-9|h-10|h-11)/.test(code)) {
    errors.push("No theme styling present — use slot utilities from the token snapshot");
  }

  return { valid: errors.length === 0, errors };
}

// ── Generation with the fidelity gate ───────────────────────────────────

const COMPONENT_SYSTEM = `You are a senior product engineer editing production shadcn components for a specific product. You receive the COMPLETE source of a base component and you REWRITE it into a custom component for this product. The user gets the code you write — it must be complete, correct, and unmistakably this product's.

## Rules
1. START from the provided base source. Keep its structure, accessibility, exports and API. Change what the customization instructions demand.
2. Output the COMPLETE file — the user does not see any other file. Never output "…rest unchanged".
3. Self-contained: imports may only be npm packages (react, radix-ui, lucide-react, class-variance-authority, clsx, tailwind-merge, cmdk, input-otp, vaul, sonner, embla-carousel-react, next-themes, recharts, react-day-picker, date-fns, react-resizable-panels) or relative siblings (./cn, ./button, ./use-mobile). NEVER "@/" aliases, NEVER imports from "shadcn" packages, NEVER "@base-ui" or "@shadcn" imports.
4. Styling: use ONLY the theme slot utilities and token values from the token snapshot (bg-primary, text-muted-foreground, rounded-lg, h-9…). NO raw hex/rgb/hsl/oklch, NO default Tailwind palette colours (gray/blue/etc.), NO gradients.
5. Customization MUST be visible: remap colours to the product slots, adjust sizes/heights and rounding per the instructions, use the accent where the instructions say, tune density and padding. If the output is byte-identical to the base, it is a failure.
6. Keep all exports the base file exported (same names) so existing importers keep working.
7. Props: keep the base props and add/adjust per the manifest spec. Dates are typed as string (ISO). No placeholder or sample data — values come from props.
8. Every interactive element keeps hover, focus-visible ring, active and disabled states (the base already has them — don't remove).
9. Data from props: always guard optional data with fallbacks. Never render "undefined" or "NaN".`;

export interface GenerateComponentInput {
  entry: ComponentBuildSpec;
  tokens: MaxiTokens;
  productContext: string;
  creativeSeed: string;
  baseSources?: Record<string, BaseComponentInfo>;
  extraContext?: string;
  /** Gateway role for the generation calls (v25: the strong author tier). */
  model?: "author";
  onUsage?: (rec: import("../gateway").UsageRecord) => void;
}

export interface GenerateComponentResult {
  code: string;
  fidelity: FidelityVerdict;
}

export async function generateComponentWithFidelity(input: GenerateComponentInput): Promise<GenerateComponentResult> {
  const { entry, tokens, productContext, creativeSeed, baseSources, extraContext } = input;
  const model = input.model ?? "author";
  const base = baseSources?.[entry.baseComponent] ?? loadBaseComponent(entry.baseComponent);
  if (!base) {
    return { code: fallbackStub(entry), fidelity: {
      componentId: entry.id, componentName: entry.name, taxonomy: entry.taxonomy,
      baseComponent: entry.baseComponent, similarity: 0, floor: null, passed: false,
      action: "fell-back-to-base", message: `Base component "${entry.baseComponent}" not found — stub emitted`,
    } };
  }

  const attempt = async (ctx?: string): Promise<string> => {
    const messages: ChatMessage[] = [
      { role: "system", content: COMPONENT_SYSTEM },
      { role: "user", content: componentPrompt(entry, tokens, productContext, creativeSeed, base, ctx) },
    ];
    if (ctx) {
      messages.splice(1, 0, { role: "assistant", content: "[Previous generation failed validation]" });
    }
    const raw = await chatText(messages, {
      model,
      temperature: 0.5,
      maxTokens: MAX_TOKENS_PER_CALL[model],
      onUsage: input.onUsage,
    });
    return rewriteBaseImports(cleanComponentOutput(raw));
  };

  const stricterPrompt = `The previous generation diverged too far from the base file. For a ${entry.taxonomy} component you must preserve the base's DOM structure and Tailwind utility classes BYTE-FOR-BYTE — change ONLY the CSS custom-property values (theme slot utilities like bg-primary, text-muted-foreground, border-input, rounded-*, h-*) that the customization demands. Do not restructure the JSX, do not rename classes, do not rewrite the component.`;

  let code = await attempt(extraContext);
  let validation = validateComponentCode(code, entry, base);
  let floor = checkSimilarityFloor(code, entry, base);
  let fellBack = false;

  const gate = (): boolean => validation.valid && floor.passed;
  if (!gate()) {
    const errorContext = [
      ...(validation.valid ? [] : validation.errors),
      ...(floor.passed ? [] : [floor.message ?? ""]),
    ].filter(Boolean).map((e) => `- ${e}`).join("\n");
    console.warn(`[fidelity] ${entry.name} failed validation/fidelity (${(floor.similarity * 100).toFixed(0)}% vs base): ${validation.errors.join("; ") || floor.message}. Retrying…`);
    try {
      code = await attempt(
        `${errorContext ? `Fix these issues:\n${errorContext}\n` : ""}${floor.passed ? "" : `${stricterPrompt}\n`}`,
      );
      validation = validateComponentCode(code, entry, base);
      const reFloor = checkSimilarityFloor(code, entry, base);
      floor = reFloor;
      if (!validation.valid) {
        console.warn(`[fidelity] ${entry.name} retry failed: ${validation.errors.join("; ")}. Falling back to customized base.`);
        code = customizeBaseFallback(base.source, entry);
        fellBack = true;
        floor = checkSimilarityFloor(code, entry, base);
      } else if (!reFloor.passed && reFloor.action === "reject") {
        console.warn(`[fidelity] ${entry.name} retry still below the ${entry.taxonomy} floor (${(reFloor.similarity * 100).toFixed(0)}%) — shipping the literal base file with token substitution only.`);
        code = customizeBaseFallback(base.source, entry);
        fellBack = true;
        floor = checkSimilarityFloor(code, entry, base);
      }
    } catch (err) {
      console.error(`[fidelity] ${entry.name} retry errored: ${err instanceof Error ? err.message : err}`);
      code = customizeBaseFallback(base.source, entry);
      fellBack = true;
      floor = checkSimilarityFloor(code, entry, base);
    }
  }

  return {
    code,
    fidelity: {
      ...floor,
      action: fellBack ? "fell-back-to-base" : gate() ? "pass" : floor.action === "reject" ? "fell-back-to-base" : floor.action === "retry" ? "warning" : "report",
      message: fellBack ? `${floor.message ?? ""} — shipped the literal base file with token substitution.` : floor.message,
    },
  };
}

function componentPrompt(
  entry: ComponentBuildSpec,
  tokens: MaxiTokens,
  productContext: string,
  creativeSeed: string,
  base: BaseComponentInfo,
  extraContext?: string,
): string {
  const variantsBlock = Array.isArray(entry.variants)
    ? entry.variants.join(" | ")
    : entry.variants
      ? Object.entries(entry.variants).map(([k, vs]) => `  - ${k}: ${vs.join(" | ")}`).join("\n")
      : "  (none)";

  const propsBlock = entry.props
    .map((p) => `  - ${p.name}: ${p.type}${p.required ? " (required)" : ""} — ${p.description ?? ""}`)
    .join("\n") || "  (keep base props)";

  return [
    `## PRODUCT`,
    `Product context: ${productContext}`,
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
    ANTI_SLOP,
    "",
    extraContext ? `## REGENERATION NOTES\n${extraContext}` : "",
    "",
    `Rewrite the component now. Output ONLY the complete .tsx file.`,
  ].join("\n");
}

/** Last-resort: emit the base source with imports rewritten + an accent touch,
 *  so screens still compose. Never a broken stub. */
function customizeBaseFallback(source: string, entry: ComponentBuildSpec): string {
  let code = rewriteBaseImports(source);
  if (!code.includes(entry.name)) {
    code = code.replace(/(data-slot="[^"]*")/, `$1 data-product="${entry.id}"`);
  }
  return code;
}

function fallbackStub(entry: ComponentBuildSpec): string {
  return `import * as React from "react"
import { cn } from "./cn"

function ${entry.name}({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="${entry.id}" className={cn("rounded-lg bg-card p-4 text-foreground", className)} {...props} />
}

export { ${entry.name} }
`;
}

function cleanComponentOutput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:tsx|typescript|jsx|javascript)?\s*\n?/, "");
  s = s.replace(/\n?```\s*$/, "");
  return s.trim();
}

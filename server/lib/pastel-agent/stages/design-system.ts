import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { designSystemSystemPrompt, designSystemUserPrompt } from "../prompts/design-system";
import {
  designSystemSpecSchema,
  FIXED_BREAKPOINTS,
  type DesignSystemSpec,
} from "../schemas/plan-schemas";
import { designSystemKnowledge } from "../knowledge";
import { designSystemToMarkdown } from "../codegen/markdown";
import { failingContrastPairs } from "../codegen/contrast";
import { mergeManifest } from "../run-store";
import { saveProjectState } from "../state";
import type { BrandKit } from "../types";
import type { StageContext } from "./context";

/**
 * Design system — generated once, persisted, and inherited by every screen,
 * component, repair, and future run of the project.
 */

/** Deterministic quality gates on the model's design system. */
export function validateDesignSystemQuality(spec: DesignSystemSpec, seedName: string): DesignSystemSpec {
  const relaxedSeeds = new Set(["luxury-fashion", "monumental", "motion-first"]);
  if (!relaxedSeeds.has(seedName) && (spec.spacing.sectionGap > 96 || spec.spacing.verticalSectionPadding > 128)) {
    throw new Error("design system uses excessive spacing for its style seed");
  }
  const forbiddenColors = new Set(["#808080", "#808080ff", "#0000ff", "#0000ffff", "#800080", "#800080ff"]);
  if (Object.values(spec.colors).some((color) => forbiddenColors.has(color.hex.toLowerCase()))) {
    throw new Error("design system contains a forbidden default color");
  }
  if (spec.fonts.display.trim().toLowerCase() === "arial" || spec.fonts.display.trim().toLowerCase() === "roboto") {
    throw new Error("design system uses a generic display font");
  }
  const contrastFailures = failingContrastPairs(spec);
  if (contrastFailures.length > 0) {
    throw new Error(
      `design tokens fail WCAG AA contrast: ${contrastFailures.map((f) => `${f.pair} ${f.ratio}:1 < ${f.minimum}:1`).join("; ")}`,
    );
  }
  return spec;
}

/** Deterministic normalization — nothing here is model-decided. */
export function normalizeDesignSystem(spec: DesignSystemSpec): DesignSystemSpec {
  const normalized = { ...spec };
  normalized.breakpoints = { ...FIXED_BREAKPOINTS };
  if (!normalized.shadows || Object.keys(normalized.shadows).length === 0) {
    normalized.shadows = {
      sm: { value: "none", usage: "Not used" },
      md: { value: "none", usage: "Not used" },
      lg: { value: "none", usage: "Not used" },
    };
  }
  if (!normalized.tokens.shadows) {
    normalized.tokens.shadows = Object.fromEntries(Object.entries(normalized.shadows).map(([k, v]) => [k, v.value]));
  }
  return normalized;
}

export function extractBrandKit(spec: DesignSystemSpec): BrandKit {
  return {
    colors: spec.tokens.colors ?? {},
    fonts: spec.tokens.fonts ?? {},
    sizes: spec.tokens.sizes ?? {},
    radius: spec.tokens.radius ?? {},
    shadows: spec.tokens.shadows ?? {},
  };
}

export function fallbackDesignSystem(): DesignSystemSpec {
  return {
    concept: "A restrained, editorial product interface with crisp ink contrast, a warm neutral canvas, and one confident accent.",
    colors: {
      background: { hex: "#F7F6F2", usage: "Primary page canvas", contrastRatio: 15.2 },
      surface: { hex: "#FFFFFF", usage: "Raised content surfaces", contrastRatio: 16.8 },
      text: { hex: "#1D1B18", usage: "Primary text", contrastRatio: 15.2 },
      textMuted: { hex: "#625E56", usage: "Secondary text", contrastRatio: 6.4 },
      border: { hex: "#DEDAD2", usage: "Hairline structural borders" },
      accent: { hex: "#B5523C", usage: "Primary actions and key emphasis", contrastRatio: 4.7 },
      accentForeground: { hex: "#FFFFFF", usage: "Text on accent", contrastRatio: 4.7 },
    },
    fonts: { display: "Space Grotesk", body: "DM Sans" },
    typeScale: {
      display: { px: 64, weight: 700, lineHeight: 1.05, tracking: "-0.03em", usage: "Hero statements" },
      h1: { px: 48, weight: 700, lineHeight: 1.1, tracking: "-0.03em", usage: "Page titles" },
      h2: { px: 36, weight: 650, lineHeight: 1.15, tracking: "-0.02em", usage: "Section titles" },
      h3: { px: 24, weight: 600, lineHeight: 1.25, tracking: "-0.01em", usage: "Subsection titles" },
      lead: { px: 20, weight: 400, lineHeight: 1.5, tracking: "0", usage: "Introductory copy" },
      body: { px: 16, weight: 400, lineHeight: 1.55, tracking: "0", usage: "Body copy" },
      small: { px: 14, weight: 500, lineHeight: 1.45, tracking: "0", usage: "Supporting labels" },
      caption: { px: 12, weight: 500, lineHeight: 1.4, tracking: "0.01em", usage: "Metadata" },
      overline: { px: 10, weight: 700, lineHeight: 1.3, tracking: "0.08em", usage: "Section markers" },
    },
    radius: {
      sm: { px: 4, usage: "Compact controls" },
      md: { px: 8, usage: "Buttons and cards" },
      lg: { px: 16, usage: "Large surfaces" },
      full: { px: 9999, usage: "Pills and badges" },
    },
    shadows: {
      sm: { value: "none", usage: "Not used" },
      md: { value: "none", usage: "Not used" },
      lg: { value: "none", usage: "Not used" },
    },
    spacing: { base: 8, sectionGap: 72, containerWidth: 1280, gutter: 32, verticalSectionPadding: 72 },
    breakpoints: { ...FIXED_BREAKPOINTS },
    grid: { columns: 12, gapPx: 32, marginPx: 32 },
    motion: {
      durationFastMs: 150,
      durationBaseMs: 250,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      principles: ["Transitions are short and functional", "Hover states ease in, never bounce"],
    },
    componentStandards: {
      fileLayout: "src/components/<Name>.jsx for shared, src/layouts/<Name>.jsx for chrome, src/features/<Screen>/<Name>.jsx for screen-local",
      naming: "PascalCase component names matching their file names",
      propConventions: ["children: ReactNode for slot content", "className: string escape hatch, defaults to empty string"],
    },
    tokens: {
      colors: { background: "#F7F6F2", surface: "#FFFFFF", text: "#1D1B18", textMuted: "#625E56", border: "#DEDAD2", accent: "#B5523C", accentForeground: "#FFFFFF" },
      fonts: { display: "Space Grotesk", body: "DM Sans" },
      sizes: { display: "64px", h1: "48px", h2: "36px", h3: "24px", lead: "20px", body: "16px", small: "14px", caption: "12px", overline: "10px" },
      radius: { sm: "4px", md: "8px", lg: "16px", full: "9999px" },
      shadows: { sm: "none", md: "none", lg: "none" },
    },
  };
}

export async function designSystemStage(ctx: StageContext): Promise<DesignSystemSpec> {
  ctx.activity("Defining the design system");

  const spec = ctx.state.productSpec;
  if (!spec) throw new Error("design-system stage requires productSpec in state");

  let designSystem: DesignSystemSpec;
  const sys = designSystemSystemPrompt();
  const user = designSystemUserPrompt(JSON.stringify(spec), designSystemKnowledge(), ctx.styleDirection);
  try {
    const result = await chatJSON<DesignSystemSpec>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "designSystem",
        temperature: 0.4,
        maxTokens: MAX_TOKENS_PER_CALL.designSystem,
        validate: (v) => validateDesignSystemQuality(designSystemSpecSchema.parse(v), ctx.seed.name),
      },
    );
    designSystem = result;
    ctx.trackCost("designSystem", MODELS.designSystem, sys.length + user.length, JSON.stringify(result).length);
  } catch (err) {
    console.warn("[pastel-agent] design system failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Design system completed with deterministic defaults");
    designSystem = fallbackDesignSystem();
  }

  designSystem = normalizeDesignSystem(designSystem);
  ctx.state.designSystem = designSystem;
  await saveProjectState(ctx.state);

  ctx.brandKit = extractBrandKit(designSystem);
  await mergeManifest(ctx.runId, { brandKit: ctx.brandKit });

  await ctx.saveDoc({
    path: "docs/01-design-system.md",
    title: "Design System",
    kind: "system",
    content: designSystemToMarkdown(designSystem, ctx.styleDirection),
  });
  return designSystem;
}

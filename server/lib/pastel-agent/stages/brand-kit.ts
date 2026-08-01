import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { brandKitSystemPrompt, brandKitUserPrompt } from "../prompts/brand-kit";
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
 * Stage 5 — Brand kit generation. The complete visual identity system:
 * colour (incl. semantic + neutral scale), typography, radius, spacing scale,
 * elevation, borders, icons, logo direction and motion. Generated once,
 * persisted, and inherited by every screen, component, repair, and future run.
 */

/** Deterministic quality gates on the model's brand kit. */
export function validateDesignSystemQuality(spec: DesignSystemSpec, seedName: string): DesignSystemSpec {
  const relaxedSeeds = new Set(["luxury-fashion", "monumental", "motion-first"]);
  if (!relaxedSeeds.has(seedName) && (spec.spacing.sectionGap > 96 || spec.spacing.verticalSectionPadding > 128)) {
    throw new Error("design system uses excessive spacing for its style seed");
  }
  const forbiddenColors = new Set(["#808080", "#808080ff", "#0000ff", "#0000ffff", "#800080", "#800080ff"]);
  const allColors = [
    ...Object.values(spec.colors),
    ...Object.values(spec.semanticColors ?? {}).filter((c) => !!c),
  ];
  if (allColors.some((color) => forbiddenColors.has(color.hex.toLowerCase()))) {
    throw new Error("design system contains a forbidden default color");
  }
  if (spec.fonts.display.trim().toLowerCase() === "arial" || spec.fonts.display.trim().toLowerCase() === "roboto") {
    throw new Error("design system uses a generic display font");
  }
  // Enterprise discipline: hairline borders and sane radii are enforced.
  if (spec.borders && spec.borders.widthPx > 2) {
    throw new Error("brand kit permits borders thicker than 2px — enterprise surfaces use 1px hairlines");
  }
  const fatRadius = Object.entries(spec.radius).filter(([token, entry]) => token !== "full" && entry.px > 24);
  if (fatRadius.length > 0) {
    throw new Error(`brand kit radius exceeds 24px (non-pill): ${fatRadius.map(([t]) => t).join(", ")}`);
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
  // Semantic status colors merge into the flat token map so components can
  // always reference --color-success / --color-warning / --color-error.
  for (const [status, entry] of Object.entries(normalized.semanticColors ?? {})) {
    if (entry?.hex && !normalized.tokens.colors[status]) {
      normalized.tokens.colors[status] = entry.hex;
    }
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
    semanticColors: {
      success: { hex: "#3E7B4F", usage: "Success and confirmation" },
      warning: { hex: "#A8701B", usage: "Warnings and pending states" },
      error: { hex: "#B5382E", usage: "Errors and destructive actions" },
    },
    neutralScale: {
      "50": "#FAF9F6",
      "100": "#F3F1EC",
      "200": "#E7E4DD",
      "300": "#D6D2C9",
      "500": "#8A857A",
      "700": "#4A463E",
      "900": "#1D1B18",
    },
    logoDirection: {
      style: "Minimal wordmark with a single geometric mark",
      geometry: "Rounded square container, centered glyph",
      iconApproach: "Abstract monogram, no literal illustration",
      wordmarkStyle: "Display font, sentence case, tight tracking",
    },
    icons: { library: "inline SVG (stroke)", strokeWeight: "1.5", cornerStyle: "round" },
    borders: { widthPx: 1, color: "border", opacityPct: 100 },
    spacingScale: [4, 8, 12, 16, 24, 32, 48, 64],
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
      colors: { background: "#F7F6F2", surface: "#FFFFFF", text: "#1D1B18", textMuted: "#625E56", border: "#DEDAD2", accent: "#B5523C", accentForeground: "#FFFFFF", success: "#3E7B4F", warning: "#A8701B", error: "#B5382E" },
      fonts: { display: "Space Grotesk", body: "DM Sans" },
      sizes: { display: "64px", h1: "48px", h2: "36px", h3: "24px", lead: "20px", body: "16px", small: "14px", caption: "12px", overline: "10px" },
      radius: { sm: "4px", md: "8px", lg: "16px", full: "9999px" },
      shadows: { sm: "none", md: "none", lg: "none" },
    },
  };
}

export async function brandKitStage(ctx: StageContext): Promise<DesignSystemSpec> {
  ctx.activity("Generating the brand kit");

  const brief = ctx.state.creativeBrief;
  const spec = ctx.state.productSpec;
  const strategy = ctx.state.brandStrategy;
  if (!brief || !spec || !strategy) throw new Error("brand-kit stage requires creativeBrief, productSpec and brandStrategy in state");

  let designSystem: DesignSystemSpec;
  const sys = brandKitSystemPrompt();
  const user = brandKitUserPrompt(JSON.stringify(brief), JSON.stringify(spec), JSON.stringify(strategy), designSystemKnowledge(), ctx.styleDirection);
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
    console.warn("[pastel-agent] brand kit failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Brand kit completed with deterministic defaults");
    designSystem = fallbackDesignSystem();
  }

  designSystem = normalizeDesignSystem(designSystem);
  ctx.state.designSystem = designSystem;
  await saveProjectState(ctx.state);

  ctx.brandKit = extractBrandKit(designSystem);
  await mergeManifest(ctx.runId, { brandKit: ctx.brandKit });

  await ctx.saveDoc({
    path: "docs/03-brand-kit.md",
    title: "Brand Kit",
    kind: "system",
    content: designSystemToMarkdown(designSystem, ctx.styleDirection),
  });
  return designSystem;
}

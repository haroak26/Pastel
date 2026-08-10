import { chatJSON, type ChatMessage, MODELS } from "../../gateway";
import type { Brief, CreativeDirection, Tokens } from "./types";
import { tokensSchema } from "./types";
import { antiSlopSystemPrompt } from "./anti-slop";
import { FORBIDDEN_ACCENT_COLORS, FORBIDDEN_DISPLAY_FONTS } from "./anti-slop";

// ── Input types ────────────────────────────────────────────────────────────

export interface GenerateTokensInput {
  brief: Brief;
  direction: CreativeDirection;
  megadesignContent: string;
  companyContents: Record<string, string>;
}

export interface Stage2CreativeDirection {
  name: string;
  summary: string;
  accentColor: string;
  accentRationale: string;
  typography: { display: string; body: string; mono: string };
  surfaces: string;
  spacing: string;
  radius: string;
  motion: string;
  visualKeywords: string[];
}

export interface EnhancedTokensInput {
  brief: Brief;
  direction: CreativeDirection;
  stage2Directions: Stage2CreativeDirection[];
  megadesignContent: string;
  companyContents: Record<string, string>;
  contextDescription?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  issues: string[];
  tokenCount: number;
}

// ── Token validation ──────────────────────────────────────────────────────

function countLeafTokens(obj: unknown): number {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== "object") return 1;
  if (Array.isArray(obj)) {
    let total = 0;
    for (const v of obj) total += countLeafTokens(v);
    return total;
  }
  let total = 0;
  for (const v of Object.values(obj as Record<string, unknown>)) {
    total += countLeafTokens(v);
  }
  return total;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function wcagContrast(hex1: string, hex2: string): number | null {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return null;
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function validateTypeScale(scale: Record<string, string>): string[] {
  const issues: string[] = [];
  const keys = Object.keys(scale);
  const requiredKeys = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] as const;
  for (const k of requiredKeys) {
    if (!keys.includes(k)) {
      issues.push(`Missing typography scale key: "${k}"`);
    }
  }
  const sizes: number[] = [];
  for (const key of requiredKeys) {
    const val = scale[key];
    if (!val) continue;
    const sizeMatch = val.match(/^(\d+(?:\.\d+)?)px/);
    if (sizeMatch) {
      sizes.push(parseFloat(sizeMatch[1]));
    }
  }
  for (let i = 1; i < sizes.length; i++) {
    if (sizes[i] <= sizes[i - 1]) {
      issues.push(`Typography scale is not monotonically increasing: ${sizes[i - 1]}px → ${sizes[i]}px`);
    }
  }
  return issues;
}

export function validateTokens(tokens: Tokens): TokenValidationResult {
  const issues: string[] = [];

  const result = tokensSchema.safeParse(tokens);
  if (!result.success) {
    for (const err of result.error.issues) {
      issues.push(`Schema: ${err.path.join(".")} — ${err.message}`);
    }
    return { valid: false, issues, tokenCount: 0 };
  }

  const tokenCount = countLeafTokens(tokens);
  if (tokenCount < 50) {
    issues.push(`Insufficient tokens: ${tokenCount} found, minimum 50 required`);
  }

  const displayFont = tokens.typography.fontFamily.display;
  if (FORBIDDEN_DISPLAY_FONTS.some((f) => displayFont.toLowerCase().includes(f.toLowerCase()))) {
    issues.push(`Forbidden display font: "${displayFont}". Use distinctive fonts like DM Sans, Geist, Cabinet Grotesk, etc.`);
  }

  const accentHex = tokens.color.accent["500"];
  if (accentHex && FORBIDDEN_ACCENT_COLORS.some((c) => c.hex.toUpperCase() === accentHex.toUpperCase())) {
    issues.push(`Forbidden accent color: ${accentHex}. Avoid Tailwind blues/indigos/purples.`);
  }

  const scaleIssues = validateTypeScale(tokens.typography.scale);
  issues.push(...scaleIssues);

  const bodySizeMatch = tokens.typography.scale["base"]?.match(/^(\d+)px/);
  if (bodySizeMatch && parseInt(bodySizeMatch[1]) < 16) {
    issues.push(`Body text is ${bodySizeMatch[1]}px — minimum 16px required`);
  }

  const bg = tokens.color.surface.background;
  const textPrimary = tokens.color.text.primary;
  if (bg && textPrimary) {
    const contrast = wcagContrast(bg, textPrimary);
    if (contrast !== null && contrast < 4.5) {
      issues.push(`WCAG AA fail: text-primary (${textPrimary}) against background (${bg}) has contrast ${contrast.toFixed(2)}:1 — need 4.5:1 minimum`);
    }
  }

  const textMuted = tokens.color.text.muted;
  if (bg && textMuted) {
    const contrast = wcagContrast(bg, textMuted);
    if (contrast !== null && contrast < 3.0) {
      issues.push(`Low contrast: text-muted (${textMuted}) against background (${bg}) has contrast ${contrast.toFixed(2)}:1`);
    }
  }

  return { valid: issues.length === 0, issues, tokenCount };
}

// ── Creative directions (Stage 2 V2) ───────────────────────────────────────

export interface GenerateStage2DirectionsInput {
  brief: Brief;
  references: { name: string; rationale: string }[];
  megadesignContent: string;
  companyContents: Record<string, string>;
}

export async function generateCreativeDirections(
  input: GenerateStage2DirectionsInput,
): Promise<Stage2CreativeDirection[]> {
  const { brief, references, megadesignContent, companyContents } = input;

  const companyBlocks = Object.entries(companyContents)
    .map(([slug, content]) => `## Design reference: ${slug}\n\n${content}`)
    .join("\n\n---\n\n");

  const refList = references.map((r) => r.name).join(", ");
  const ref1 = references[0]?.name ?? "stripe";
  const ref2 = references[1]?.name ?? references[0]?.name ?? "linear";

  const systemPrompt = `You are a senior design director generating concrete visual directions for a design system.

${megadesignContent}

${companyBlocks}

${antiSlopSystemPrompt()}

RULES — violate any and the output will be rejected:
- NO #3B82F6, #4F46E5, #A78BFA, #6366F1, #8B5CF6 as accent colors
- NO Inter, Roboto, system-ui as display font
- Max 2 font families per direction
- Accent appears 3-7 times per screen max — pick ONE accent and commit
- Surfaces must be distinct: background, raised, overlay

You have ${refList.length} reference companies: ${refList}. Produce EXACTLY 3 visual directions:

1. **Direction 1** — based primarily on ${ref1}'s design language
2. **Direction 2** — based primarily on ${ref2}'s design language
3. **Direction 3** — a "wildcard" hybrid that takes the strongest move from each reference and combines them into something new

For EACH direction provide:
- name: A memorable 2-4 word label
- summary: 1-2 sentences capturing the feel
- accentColor: A 6-digit hex (#RRGGBB) — must be distinctive, NOT a forbidden color
- accentRationale: Why this accent fits the brand direction
- typography: { display, body, mono } — real Google Fonts, no Inter/Roboto/system-ui as display
- surfaces: Description of the surface palette (background, raised, overlay — light or dark posture)
- spacing: One word — "airy", "balanced", or "dense"
- radius: One word — "sharp", "rounded", or "pill"
- motion: One word — "snappy", "smooth", or "dramatic"
- visualKeywords: Array of 4-6 string keywords that define the visual aesthetic

Output ONLY a JSON array of 3 objects. No markdown, no code fences, no explanations.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Product: ${brief.productName}
Description: ${brief.description}
Audience: ${brief.audience}
Niche: ${brief.niche}
Personality: ${brief.personality.join(", ")}
Mode: ${brief.mode}
Density: ${brief.density}
Platform: ${brief.platform}

Generate 3 distinct visual directions. Reference 1: ${ref1}. Reference 2: ${ref2}. Direction 3 should be a wildcard hybrid.`,
    },
  ];

  const validate = (v: unknown): Stage2CreativeDirection[] => {
    let arr = v as unknown;
    // Tolerate the model wrapping the array (e.g. {"directions": [...]}) or
    // returning a single object instead of a 3-element array.
    if (arr && typeof arr === "object" && !Array.isArray(arr)) {
      const obj = arr as Record<string, unknown>;
      if (Array.isArray(obj.directions)) arr = obj.directions;
      else if (Array.isArray(obj.creativeDirections)) arr = obj.creativeDirections;
      else if (typeof obj.name === "string") arr = [obj];
      else throw new Error("Expected an array of creative directions");
    }
    const list = arr as Record<string, unknown>[];
    if (!Array.isArray(list)) throw new Error("Expected an array of creative directions");
    if (list.length < 1 || list.length > 3) throw new Error(`Expected 1-3 directions, got ${list.length}`);
    for (let i = 0; i < list.length; i++) {
      const d = list[i];
      if (typeof d.name !== "string" || !d.name.trim()) throw new Error(`direction[${i}].name required`);
      if (typeof d.summary !== "string" || !d.summary.trim()) throw new Error(`direction[${i}].summary required`);
      if (typeof d.accentColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(d.accentColor)) throw new Error(`direction[${i}].accentColor must be 6-digit hex`);
      if (typeof d.accentRationale !== "string" || !d.accentRationale.trim()) throw new Error(`direction[${i}].accentRationale required`);
      if (typeof d.typography !== "object" || !d.typography) throw new Error(`direction[${i}].typography required`);
      const t = d.typography as Record<string, unknown>;
      if (typeof t.display !== "string" || typeof t.body !== "string" || typeof t.mono !== "string") {
        throw new Error(`direction[${i}].typography needs display, body, mono`);
      }
      if (typeof d.surfaces !== "string") throw new Error(`direction[${i}].surfaces required`);
      if (typeof d.spacing !== "string") throw new Error(`direction[${i}].spacing required`);
      if (typeof d.radius !== "string") throw new Error(`direction[${i}].radius required`);
      if (typeof d.motion !== "string") throw new Error(`direction[${i}].motion required`);
      if (!Array.isArray(d.visualKeywords) || d.visualKeywords.length < 3) throw new Error(`direction[${i}].visualKeywords needs 3+ strings`);
    }
    return list as unknown as Stage2CreativeDirection[];
  };

  return chatJSON<Stage2CreativeDirection[]>(messages, {
    model: "design",
    temperature: 0.7,
    maxTokens: 6000,
    validate,
  });
}

// ── Enhanced token generation (V2) ─────────────────────────────────────────

function buildEnhancedSystemPrompt(input: EnhancedTokensInput): string {
  const { brief, direction, stage2Directions, megadesignContent, companyContents, contextDescription } = input;

  const companyBlocks = Object.entries(companyContents)
    .map(([slug, content]) => `## Design reference: ${slug}\n\n${content}`)
    .join("\n\n---\n\n");

  const dirsBlock = stage2Directions
    .map((d, i) =>
      `### Direction ${i + 1}: ${d.name}
- Summary: ${d.summary}
- Accent: ${d.accentColor} — ${d.accentRationale}
- Typography: Display=${d.typography.display}, Body=${d.typography.body}, Mono=${d.typography.mono}
- Surfaces: ${d.surfaces}
- Spacing: ${d.spacing}
- Radius: ${d.radius}
- Motion: ${d.motion}
- Keywords: ${d.visualKeywords.join(", ")}`,
    )
    .join("\n\n");

  return `You are a design-token architect. Your output is a machine-readable design token specification that drives every visual decision in a generated UI. You work from a core design constitution (megadesign.md), selected brand reference files, and 3 concrete visual directions.

${antiSlopSystemPrompt()}

${megadesignContent}

${companyBlocks}

## Visual Directions (3 options explored)

${dirsBlock}

## Product Context

Product: ${brief.productName}
Context: ${contextDescription ?? `${brief.niche} product, ${brief.mode} mode`}
Audience: ${brief.audience}
Niche: ${brief.niche}
Personality: ${brief.personality.join(", ")}
Density: ${brief.density}
Mode: ${brief.mode}
Platform: ${brief.platform}

Chosen creative direction:
- Name: ${direction.name}
- Summary: ${direction.summary}
- Influences: ${direction.influences.join(", ")}
- Palette direction: ${direction.paletteDirection}
- Density fit: ${direction.densityFit}

## TOKEN DESIGN RULES — follow these exactly

1. ONE accent color per project. Choose the accent from one of the 3 visual directions, adapting it to fit the palette direction. Semantic colors (success/warning/danger/info) are separate.
2. Neutral scale: 12 stops from 0 (white/lightest) to 950 (near-black/darkest).
3. Accent: include at minimum stops 50, 100, 500 (primary), 600 (hover), 900.
4. All colors must be 6-digit hex (#RRGGBB). NO opacity suffixes, NO rgba, NO hsl.
5. WCAG AA contrast: body text >= 4.5:1 against background, large text >= 3:1.
6. Font families: pick the fonts from the chosen visual direction. NO Inter, NO Roboto, NO system-ui as display.
7. Type scale: modular ratio (1.25 or 1.333). Values as "Npx/Npx" (size/line-height). Body minimum 16px.
8. Space scale: 4px base — 0, 4, 8, 12, 16, 24, 32, 48, 64, 96.
9. Radius scale: none=0, sm=4-8, md=8-12, lg=14-20, xl=22-28, full=9999.
10. Shadows: sm (subtle elevation), md (card/raised), lg (dropdown/popover), xl (modal).
11. Motion: fast=120ms, base=200ms, slow=320ms. Standard easing: cubic-bezier(0.2, 0, 0, 1).
12. Breakpoints: sm=640px, md=768px, lg=1024px, xl=1280px.
13. Every token value must be meaningful — no placeholders, no defaults, no copy-pasted values.
14. Make this design system feel genuinely distinct — not a generic Tailwind starter.
15. Surface tokens must work together: background < raised < overlay (increasing contrast/depth).
16. Text tokens: primary (highest contrast), secondary (reduced), muted (lowest), inverse (on dark/colored backgrounds).

Output VALID JSON matching this exact structure:
{
  "meta": { "brand": "string", "version": "1.0.0", "generatedAt": "ISO-8601" },
  "color": {
    "neutral": { "0": "#...", "50": "#...", "100": "#...", "200": "#...", "300": "#...", "400": "#...", "500": "#...", "600": "#...", "700": "#...", "800": "#...", "900": "#...", "950": "#..." },
    "accent": { "50": "#...", "100": "#...", "500": "#...", "600": "#...", "900": "#..." },
    "semantic": {
      "success": { "50": "#...", "500": "#...", "900": "#..." },
      "warning": { "50": "#...", "500": "#...", "900": "#..." },
      "danger": { "50": "#...", "500": "#...", "900": "#..." },
      "info": { "50": "#...", "500": "#...", "900": "#..." }
    },
    "surface": { "background": "#...", "raised": "#...", "overlay": "#..." },
    "text": { "primary": "#...", "secondary": "#...", "muted": "#...", "inverse": "#..." },
    "border": { "default": "#...", "subtle": "#...", "focus": "#..." }
  },
  "typography": {
    "fontFamily": { "display": "Name", "body": "Name", "mono": "Name" },
    "scale": { "xs": "12px/16px", "sm": "14px/20px", "base": "16px/24px", "lg": "18px/28px", "xl": "20px/28px", "2xl": "24px/32px", "3xl": "30px/36px", "4xl": "36px/40px", "5xl": "48px/52px" },
    "weight": { "regular": 400, "medium": 500, "semibold": 600, "bold": 700 }
  },
  "space": { "0": "0px", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px", "12": "48px", "16": "64px", "24": "96px" },
  "radius": { "none": "0px", "sm": "6px", "md": "10px", "lg": "16px", "xl": "24px", "full": "9999px" },
  "shadow": { "sm": "0 1px 2px rgba(0,0,0,0.06)", "md": "0 4px 6px rgba(0,0,0,0.07)", "lg": "0 10px 15px rgba(0,0,0,0.10)", "xl": "0 20px 25px rgba(0,0,0,0.15)" },
  "motion": { "duration": { "fast": "120ms", "base": "200ms", "slow": "320ms" }, "easing": { "standard": "cubic-bezier(0.2, 0, 0, 1)" } },
  "breakpoints": { "sm": "640px", "md": "768px", "lg": "1024px", "xl": "1280px" }
}`;
}

export async function generateEnhancedTokens(input: EnhancedTokensInput): Promise<Tokens> {
  const systemPrompt = buildEnhancedSystemPrompt(input);
  const { brief, direction } = input;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Generate the complete design tokens JSON for "${brief.productName}" (${brief.niche}, ${brief.mode} mode, density: ${brief.density}). Follow the creative direction "${direction.name}" — ${direction.summary}. Make the tokens feel genuinely different from run to run — do not reuse the same palette. Output ONLY the JSON object, no markdown, no explanation.`,
    },
  ];

  const validate = (v: unknown): Tokens => {
    const result = tokensSchema.safeParse(v);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Token validation failed: ${issues}`);
    }
    return result.data;
  };

  return chatJSON<Tokens>(messages, {
    model: "design",
    temperature: 0.6,
    maxTokens: 8000,
    validate,
  });
}

// ── Backward-compatible generateTokens (delegates to enhanced) ─────────────

export async function generateTokens(input: GenerateTokensInput): Promise<Tokens> {
  const { brief, direction, megadesignContent, companyContents } = input;

  const refs = direction.influences.map((slug) => ({ name: slug, rationale: `${slug} as reference for ${brief.niche}` }));

  const stage2Directions: Stage2CreativeDirection[] = [
    {
      name: direction.name,
      summary: direction.summary,
      accentColor: "#0F766E",
      accentRationale: `Derived from ${direction.paletteDirection}`,
      typography: { display: "DM Sans", body: "DM Sans", mono: "JetBrains Mono" },
      surfaces: "Clean neutral palette matching palette direction",
      spacing: direction.densityFit === "low" ? "airy" : direction.densityFit === "high" ? "dense" : "balanced",
      radius: "rounded",
      motion: "smooth",
      visualKeywords: ["clean", "professional", "focused", "restrained"],
    },
    {
      name: `${brief.productName} — Alternative`,
      summary: `A bolder take on ${brief.niche} — ${direction.influences[1] ?? direction.influences[0] ?? "linear"}-inspired`,
      accentColor: "#D97706",
      accentRationale: "Warm, energetic alternative to the primary direction",
      typography: { display: "Cabinet Grotesk", body: "DM Sans", mono: "JetBrains Mono" },
      surfaces: "Neutral white base with warmer raised surfaces",
      spacing: "balanced",
      radius: "rounded",
      motion: "smooth",
      visualKeywords: ["warm", "bold", "energetic", "modern"],
    },
    {
      name: `${brief.productName} — Dark`,
      summary: `Dark-mode-first variant of ${direction.name}`,
      accentColor: "#0F766E",
      accentRationale: `Luminous accent against dark backgrounds`,
      typography: { display: "DM Sans", body: "DM Sans", mono: "JetBrains Mono" },
      surfaces: "Dark base with deep, layered raised surfaces",
      spacing: "balanced",
      radius: "rounded",
      motion: "smooth",
      visualKeywords: ["dark", "premium", "sharp", "focused"],
    },
  ];

  return generateEnhancedTokens({
    brief,
    direction,
    stage2Directions,
    megadesignContent,
    companyContents,
  });
}

// ── CSS custom property generation ─────────────────────────────────────────

export function generateTokensCSS(tokens: Tokens): string {
  const { color, typography, space, radius, shadow, motion } = tokens;

  const lightVars: string[] = [
    `  --font-display: "${typography.fontFamily.display}", sans-serif;`,
    `  --font-body: "${typography.fontFamily.body}", sans-serif;`,
    `  --font-mono: "${typography.fontFamily.mono}", monospace;`,
  ];

  for (const [k, v] of Object.entries(color.neutral)) {
    lightVars.push(`  --color-neutral-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(color.accent)) {
    lightVars.push(`  --color-accent-${k}: ${v};`);
  }
  for (const [sem, stops] of Object.entries(color.semantic)) {
    for (const [k, v] of Object.entries(stops)) {
      lightVars.push(`  --color-${sem}-${k}: ${v};`);
    }
  }
  for (const [k, v] of Object.entries(color.surface)) {
    lightVars.push(`  --color-surface-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(color.text)) {
    lightVars.push(`  --color-text-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(color.border)) {
    lightVars.push(`  --color-border-${k}: ${v};`);
  }

  for (const [k, v] of Object.entries(typography.scale)) {
    const [size, lh] = v.split("/");
    lightVars.push(`  --text-${k}-size: ${size};`);
    lightVars.push(`  --text-${k}-line-height: ${lh};`);
  }
  for (const [k, v] of Object.entries(typography.weight)) {
    lightVars.push(`  --weight-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(space)) {
    lightVars.push(`  --space-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(radius)) {
    lightVars.push(`  --radius-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(shadow)) {
    lightVars.push(`  --shadow-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(motion.duration)) {
    lightVars.push(`  --motion-duration-${k}: ${v};`);
  }
  lightVars.push(`  --motion-easing-standard: ${motion.easing.standard};`);

  let css = ":root {\n" + lightVars.join("\n") + "\n}\n";

  if (tokens.meta.brand.toLowerCase().includes("dark") || tokens.color.surface.background === tokens.color.neutral["950"]) {
    css += "\n";
  }

  css += `
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 0ms;
    --motion-duration-base: 0ms;
    --motion-duration-slow: 0ms;
  }
}
`;

  return css;
}

// ── Tailwind config generation ─────────────────────────────────────────────

export function generateTailwindConfig(tokens: Tokens): string {
  const { color, typography, space, radius, shadow, motion, breakpoints } = tokens;

  const colorEntries = [
    ...Object.entries(color.neutral).map(([k, v]) => `"color-neutral-${k}": "var(--color-neutral-${k})"`),
    ...Object.entries(color.accent).map(([k, v]) => `"color-accent-${k}": "var(--color-accent-${k})"`),
    `"success-50": "var(--color-success-50)"`,
    `"success-500": "var(--color-success-500)"`,
    `"success-900": "var(--color-success-900)"`,
    `"warning-50": "var(--color-warning-50)"`,
    `"warning-500": "var(--color-warning-500)"`,
    `"warning-900": "var(--color-warning-900)"`,
    `"danger-50": "var(--color-danger-50)"`,
    `"danger-500": "var(--color-danger-500)"`,
    `"danger-900": "var(--color-danger-900)"`,
    `"info-50": "var(--color-info-50)"`,
    `"info-500": "var(--color-info-500)"`,
    `"info-900": "var(--color-info-900)"`,
    `"surface-background": "var(--color-surface-background)"`,
    `"surface-raised": "var(--color-surface-raised)"`,
    `"surface-overlay": "var(--color-surface-overlay)"`,
    `"text-primary": "var(--color-text-primary)"`,
    `"text-secondary": "var(--color-text-secondary)"`,
    `"text-muted": "var(--color-text-muted)"`,
    `"text-inverse": "var(--color-text-inverse)"`,
    `"border-default": "var(--color-border-default)"`,
    `"border-subtle": "var(--color-border-subtle)"`,
    `"border-focus": "var(--color-border-focus)"`,
  ];

  const spaceEntries = Object.entries(space).map(([k, v]) => `"${k}": "${v}"`);
  const radiusEntries = Object.entries(radius).map(([k, v]) => `"${k}": "${v}"`);

  const shadowEntries = Object.entries(shadow).map(([k, v]) => {
    const escaped = v.replace(/"/g, '\\"');
    return `"${k}": "${escaped}"`;
  });

  return `import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
${colorEntries.map((e) => `        ${e},`).join("\n")}
      },
      spacing: {
${spaceEntries.map((e) => `        ${e},`).join("\n")}
      },
      borderRadius: {
${radiusEntries.map((e) => `        ${e},`).join("\n")}
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
${Object.entries(typography.scale).map(([k, v]) => {
  const [size, lh] = v.split("/");
  return `        "${k}": ["${size}", { lineHeight: "${lh}" }],`;
}).join("\n")}
      },
      fontWeight: {
${Object.entries(typography.weight).map(([k, v]) => `        "${k}": "${v}",`).join("\n")}
      },
      boxShadow: {
${shadowEntries.map((e) => `        ${e},`).join("\n")}
      },
      transitionDuration: {
${Object.entries(motion.duration).map(([k, v]) => `        "${k}": "${v}",`).join("\n")}
      },
      screens: {
${Object.entries(breakpoints).map(([k, v]) => `        "${k}": "${v}",`).join("\n")}
      },
    },
  },
  plugins: [],
} satisfies Config;
`;
}

// ── Token registry (for injecting into prompts) ────────────────────────────

export interface TokenRegistry {
  cssProperties: string[];
  colorTokens: Record<string, string>;
  spacingTokens: Record<string, string>;
  radiusTokens: Record<string, string>;
  shadowTokens: Record<string, string>;
  motionTokens: Record<string, string>;
  typographyTokens: Record<string, string>;
}

export function generateTokenRegistry(tokens: Tokens): TokenRegistry {
  const cssProperties: string[] = [];
  const colorTokens: Record<string, string> = {};
  const spacingTokens: Record<string, string> = {};
  const radiusTokens: Record<string, string> = {};
  const shadowTokens: Record<string, string> = {};
  const motionTokens: Record<string, string> = {};
  const typographyTokens: Record<string, string> = {};

  for (const [k, v] of Object.entries(tokens.color.neutral)) {
    const prop = `--color-neutral-${k}`;
    cssProperties.push(prop);
    colorTokens[prop] = v;
  }
  for (const [k, v] of Object.entries(tokens.color.accent)) {
    const prop = `--color-accent-${k}`;
    cssProperties.push(prop);
    colorTokens[prop] = v;
  }
  for (const [sem, stops] of Object.entries(tokens.color.semantic)) {
    for (const [k, v] of Object.entries(stops)) {
      const prop = `--color-${sem}-${k}`;
      cssProperties.push(prop);
      colorTokens[prop] = v;
    }
  }
  for (const [k, v] of Object.entries(tokens.color.surface)) {
    const prop = `--color-surface-${k}`;
    cssProperties.push(prop);
    colorTokens[prop] = v;
  }
  for (const [k, v] of Object.entries(tokens.color.text)) {
    const prop = `--color-text-${k}`;
    cssProperties.push(prop);
    colorTokens[prop] = v;
  }
  for (const [k, v] of Object.entries(tokens.color.border)) {
    const prop = `--color-border-${k}`;
    cssProperties.push(prop);
    colorTokens[prop] = v;
  }
  for (const [k, v] of Object.entries(tokens.space)) {
    const prop = `--space-${k}`;
    cssProperties.push(prop);
    spacingTokens[prop] = v;
  }
  for (const [k, v] of Object.entries(tokens.radius)) {
    const prop = `--radius-${k}`;
    cssProperties.push(prop);
    radiusTokens[prop] = v;
  }
  for (const [k, v] of Object.entries(tokens.shadow)) {
    const prop = `--shadow-${k}`;
    cssProperties.push(prop);
    shadowTokens[prop] = `${v} (shadow)`;
  }
  for (const [k, v] of Object.entries(tokens.motion.duration)) {
    const prop = `--motion-duration-${k}`;
    cssProperties.push(prop);
    motionTokens[prop] = v;
  }
  motionTokens["--motion-easing-standard"] = tokens.motion.easing.standard;
  cssProperties.push("--motion-easing-standard");

  for (const [k, v] of Object.entries(tokens.typography.fontFamily)) {
    const prop = `--font-${k}`;
    cssProperties.push(prop);
    typographyTokens[prop] = `"${v}", ${k === "mono" ? "monospace" : "sans-serif"}`;
  }

  return { cssProperties, colorTokens, spacingTokens, radiusTokens, shadowTokens, motionTokens, typographyTokens };
}

export function tokenRegistryBlock(registry: TokenRegistry): string {
  return [
    "## CSS Custom Property Registry — USE EXACTLY THESE NAMES",
    "",
    "### Colors",
    ...Object.entries(registry.colorTokens).map(([k, v]) => `  ${k}: ${v}`),
    "### Spacing",
    ...Object.entries(registry.spacingTokens).map(([k, v]) => `  ${k}: ${v}`),
    "### Radius",
    ...Object.entries(registry.radiusTokens).map(([k, v]) => `  ${k}: ${v}`),
    "### Shadows",
    ...Object.entries(registry.shadowTokens).map(([k, v]) => `  ${k}: ${v}`),
    "### Motion",
    ...Object.entries(registry.motionTokens).map(([k, v]) => `  ${k}: ${v}`),
    "### Typography",
    ...Object.entries(registry.typographyTokens).map(([k, v]) => `  ${k}: ${v}`),
    "",
    "CRITICAL: When referencing tokens in components, use ONLY these exact CSS custom property names. Never invent names like --duration-fast (use --motion-duration-fast) or --control-sm (use exact token names from this registry).",
  ].join("\n");
}

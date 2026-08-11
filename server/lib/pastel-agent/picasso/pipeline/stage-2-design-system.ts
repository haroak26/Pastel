import { z } from "zod";
import type { Brief, CreativeDirection, Tokens } from "./types";
import { tokensSchema } from "./types";
import { loadMegadesign, loadCompanyDoc } from "./knowledge";
import { antiSlopSystemPrompt } from "./anti-slop";
import { chatJSON, type ChatMessage } from "../../gateway";
import { MAX_TOKENS_PER_CALL } from "../../gateway";
import { generateGlobalsCSS, tokenSnapshot, onColor, relativeLuminance } from "./lib/base-components";

// ── Stage 2a: divergent creative directions ─────────────────────────────

export interface Stage2Direction {
  name: string;
  summary: string;
  accentColor: string;
  surfaces: string;
  radius: string;
  spacing: "airy" | "balanced" | "dense";
  motion: string;
  typographyVoice: string;
  signatureMoves: string[];
}

// V7: descriptive fields carry defaults (a dropped prose field must never
// abort the pipeline); accentColor/spacing stay structural — divergence and
// selection logic depends on them being real.
const directionSchema = z.object({
  name: z.string(),
  summary: z.string().default("A distinctive visual direction for this product."),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  surfaces: z.string().default("paper"),
  radius: z.string().default("soft"),
  spacing: z.enum(["airy", "balanced", "dense"]),
  motion: z.string().default("swift"),
  typographyVoice: z.string().default("a distinctive display face paired with a readable body face"),
  signatureMoves: z.array(z.string()).min(2).max(5).default(["a memorable signature gesture", "a distinctive data treatment"]),
});

const directionsSchema = z.object({
  directions: z.array(directionSchema).min(3).max(3),
});

export interface DirectionsInput {
  brief: Brief;
  references: Array<{ slug: string; name: string; tagline: string }>;
  megadesignContent: string;
  companyContents: Record<string, string>;
  creativeSeed: string;
}

const DIRECTIONS_SYSTEM = `You are a creative director generating THREE radically different design directions for a new product. Each direction is a complete visual identity: colour, surfaces, radius, spacing, motion, and typography voice.

## Non-negotiables
- Each direction must be VISIBLY different from the other two — different accent hue family, different surface treatment, different radius language (one sharp and editorial, one pillowy, one somewhere between).
- Accent colours must be distinctive and NOT the classic AI defaults (no #3B82F6 blue, no #6366F1 indigo, no #8B5CF6 violet, no #4F46E5, no #A78BFA, no #2563EB, no pure black/white accents).
- Surfaces: "paper" (flat, near-white, hairline borders), "layered" (raised cards, subtle elevation), "tonal" (tinted surfaces, colour washes without gradients).
- radius ∈ {"sharp" (2-4px corners), "soft" (8-12px), "pill" (16-24px + full-pill chips)}.
- Motion ∈ {"swift" (120ms snaps, minimal), "springy" (200ms bouncy), "stately" (300ms glides)}.
- Typography voice: pair a display font family (be specific — from lists like Space Grotesk, Manrope, Sora, Cabinet Grotesk, Instrument Sans, Bricolage Grotesque, Onest, Gabarito, Zodiak, Chillax, Outfit, Satoshi, DM Sans, General Sans — never Inter/Roboto/serif defaults) with a body family.
- signatureMoves: 2-5 distinctive, concrete patterns that would make a designer say "I know that product" (e.g. "oversized tabular numerals with hairline rules", "hand-rolled data chips in the accent at 50% tint", "left rail with dot-nav and active page marker"). No generic "smooth animations" or "clean cards".

Use the creative seed as inspiration — each direction should feel like a different answer to that seed.`;

export async function generateDirectionsWithRetry(
  input: DirectionsInput,
): Promise<Stage2Direction[]> {
  const { brief, references, megadesignContent, companyContents, creativeSeed } = input;

  const refBlocks = references
    .map((r) => {
      const doc = companyContents[r.slug] ?? "";
      return `### Reference: ${r.name}\n${doc.slice(0, 1800)}`;
    })
    .join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: DIRECTIONS_SYSTEM },
    {
      role: "user",
      content: [
        `## PRODUCT BRIEF`,
        `Name: ${brief.productName}`,
        `Description: ${brief.description}`,
        `Audience: ${brief.audience}`,
        `Niche: ${brief.niche}`,
        `Personality: ${brief.personality.join(", ")}`,
        `Mode: ${brief.mode}`,
        `Platform: ${brief.platform}`,
        `Creative seed: ${creativeSeed}`,
        "",
        `## MEGA-DESIGN LAW (abridged)`,
        megadesignContent.slice(0, 2500),
        "",
        refBlocks || "(no reference companies selected)",
        "",
        `## DESIGN GUARDRAILS`,
        antiSlopSystemPrompt(),
        "",
        `Output exactly 3 directions as JSON: { directions: [ { name, summary, accentColor, surfaces, radius, spacing, motion, typographyVoice, signatureMoves } ] }`,
        `- name: a short evocative name ("Railroad Timetable", "Midnight Arcade", "Library Card")`,
        `- summary: 1-2 sentences on the feeling and who it serves`,
      ].join("\n"),
    },
  ];

  const result = await chatJSON<z.infer<typeof directionsSchema>>(messages, {
    model: "design",
    temperature: 0.85,
    maxTokens: MAX_TOKENS_PER_CALL.design,
    validate: (v) => directionsSchema.parse(v),
  });

  return result.directions;
}

// ── Divergence + selection (deterministic — no extra model calls) ───────

export interface DivergenceResult {
  valid: boolean;
  divergenceScore: number; // 0..6
  issues: string[];
}

export function validateDivergence(directions: Stage2Direction[]): DivergenceResult {
  const issues: string[] = [];
  let score = 0;

  const accents = directions.map((d) => d.accentColor.toLowerCase());
  const uniqueAccents = new Set(accents);
  if (uniqueAccents.size === 3) score += 2;
  else issues.push("At least two directions share an accent colour");

  const radiusKinds = new Set(directions.map((d) => d.radius.toLowerCase()));
  if (radiusKinds.size === 3) score += 2;
  else if (radiusKinds.size >= 2) score += 1;
  else issues.push("All directions share the same radius language");

  const spacingKinds = new Set(directions.map((d) => d.spacing));
  if (spacingKinds.size >= 2) score += 1;
  if (spacingKinds.size === 3) score += 1;

  const motionKinds = new Set(directions.map((d) => d.motion.split(" ")[0].toLowerCase()));
  if (motionKinds.size >= 2) score += 1;

  // Distinctive accent check — reject AI-default accents entirely.
  const FORBIDDEN = new Set(["#3b82f6", "#6366f1", "#8b5cf6", "#4f46e5", "#a78bfa", "#2563eb", "#000000", "#ffffff"]);
  for (const d of directions) {
    if (FORBIDDEN.has(d.accentColor.toLowerCase())) {
      issues.push(`Direction "${d.name}" uses a banned default accent ${d.accentColor}`);
    }
  }

  return { valid: score >= 4 && issues.length === 0, divergenceScore: score, issues };
}

/** Deterministic selection: prefer distinctive accents + personality fit. */
export function selectBestDirection(
  directions: Stage2Direction[],
  brief: Brief,
): { chosen: Stage2Direction; chosenIndex: number; rationale: string } {
  const scored = directions.map((d, i) => {
    let score = 0;
    const lum = relativeLuminance(d.accentColor);
    // Personality fit heuristics
    const lower = `${brief.description} ${brief.personality.join(" ")}`.toLowerCase();
    if (d.spacing === "dense" && /dense|data|power|pro|analytics|dev|dashboard/.test(lower)) score += 2;
    if (d.spacing === "airy" && /playful|calm|simple|family|learn|kids/.test(lower)) score += 2;
    if (/playful|fun|game|delight/.test(lower) && d.motion.startsWith("springy")) score += 2;
    if (/warm|friendly|approachable/.test(lower) && d.surfaces === "tonal") score += 2;
    if (/professional|precise|corporate|technical/.test(lower) && d.surfaces === "paper") score += 2;
    if (/bold|energetic|vibrant/.test(lower) && d.radius === "sharp") score += 1;
    // Distinctive accent bonus
    if (d.accentColor.length === 7) score += Math.min(2, Math.round(Math.abs(lum - 0.5) * 4));
    // Name length — evocative names are usually 2-3 words
    if (d.name.split(" ").length >= 2) score += 1;
    return { d, i, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  return {
    chosen: best.d,
    chosenIndex: best.i,
    rationale: `Scored ${best.score} points — accent ${best.d.accentColor} (luminance ${relativeLuminance(best.d.accentColor).toFixed(2)}), ${best.d.spacing} spacing, ${best.d.surfaces} surfaces, "${best.d.name}".`,
  };
}

// ── Stage 2b: tokens ────────────────────────────────────────────────────

export interface EnhancedTokensInput {
  brief: Brief;
  direction: CreativeDirection;
  stage2Directions: Stage2Direction[];
  megadesignContent: string;
  companyContents: Record<string, string>;
  contextDescription: string;
  creativeSeed: string;
}

const FORBIDDEN_ACCENTS = new Set(["#3b82f6", "#6366f1", "#8b5cf6", "#4f46e5", "#a78bfa", "#2563eb", "#000000", "#ffffff"]);

const TOKENS_SYSTEM = `You are a design-tokens engineer. You produce the COMPLETE token set for a product's design system — colour scales, typography, spacing, radius, shadow, motion — that will be mapped onto a shadcn theme.

## Colour laws
- accent: a full 50→900 scale built around the chosen direction's accent hue. 500 is the brand colour; 600 is the interactive/primary shade; 50 is a pale tint; 900 a deep shade. Never use forbidden default accents (#3B82F6, #6366F1, #8B5CF6, #4F46E5, #A78BFA, #2563EB) or pure black/white.
- neutral: a 0→950 near-neutral scale with a hint of the accent's temperature (warm/cool) — not pure grey.
- semantic: success/warning/danger/info each with 50/500/900 stops that harmonize with the palette.
- surface: background (page), raised (cards), overlay (popovers). text: primary (near-black w/ temperature), secondary, muted, inverse. border: default, subtle, focus (focus = accent 500 usually).
- All values must be #hex.

## Typography laws
- fontFamily.display and .body from the direction's voice; mono for code/numbers (e.g. "JetBrains Mono", "IBM Plex Mono", "Geist Mono", "Spline Sans Mono").
- scale: {xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl} → px sizes that make a clear 4px hierarchy.
- weight: {regular: 400, medium: 500, semibold: 600, bold: 700}.

## Space / radius / shadow / motion
- space: {0..16} in a 4px-base scale (0,2,4,6,8,12,16,24,32,40,48,64,80,96,128,160).
- radius: none 0 · sm/md/lg/xl/full — one radius language per the direction (sharp ≈ 2-6px, soft ≈ 8-16px, pill ≈ 16-24px, full 9999px). radius.lg is the THEME base radius.
- shadow: sm/md/lg/xl — subtle, layered shadows (soft, low-opacity black, sized to density).
- motion.duration: fast ≤120ms, base ≤220ms, slow ≤400ms. easing.standard: a cubic-bezier.
- motion.character: one word from the direction's motion ("swift" | "springy" | "stately").

## Breakpoints
- sm 640px, md 768px, lg 1024px, xl 1280px.

## meta
- brand: the product name. seed: the creative seed. character: motion character.
- mode: "light" | "dark" | "both" — MUST match the Mode field in the PRODUCT BRIEF below.

Return ONLY the complete tokens JSON. Every field required.`;

export async function generateEnhancedTokens(
  input: EnhancedTokensInput,
): Promise<Tokens> {
  const { brief, direction, stage2Directions, megadesignContent, companyContents, contextDescription, creativeSeed } = input;

  const chosen = stage2Directions.find((d) => d.name === direction.name) ?? stage2Directions[0];

  const companyBlocks = Object.entries(companyContents)
    .map(([slug, content]) => `### ${slug}\n${content.slice(0, 1200)}`)
    .join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: TOKENS_SYSTEM },
    {
      role: "user",
      content: [
        `## PRODUCT BRIEF`,
        `Name: ${brief.productName}`,
        `Description: ${brief.description}`,
        `Audience: ${brief.audience}`,
        `Niche: ${brief.niche}`,
        `Personality: ${brief.personality.join(", ")}`,
        `Mode: ${brief.mode}`,
        `Platform: ${brief.platform}`,
        `Creative seed: ${creativeSeed}`,
        `Context: ${contextDescription}`,
        "",
        `## CHOSEN DIRECTION`,
        `Name: ${chosen.name}`,
        `Summary: ${chosen.summary}`,
        `Accent: ${chosen.accentColor}`,
        `Surfaces: ${chosen.surfaces}`,
        `Radius language: ${chosen.radius}`,
        `Spacing: ${chosen.spacing}`,
        `Motion: ${chosen.motion}`,
        `Typography voice: ${chosen.typographyVoice}`,
        `Signature moves: ${chosen.signatureMoves.join("; ")}`,
        "",
        `## MEGA-DESIGN LAW (abridged)`,
        megadesignContent.slice(0, 2200),
        "",
        companyBlocks.slice(0, 6000),
        "",
        `Generate the complete tokens JSON now.`,
      ].join("\n"),
    },
  ];

  const result = await chatJSON<Tokens>(messages, {
    model: "design",
    temperature: 0.6,
    maxTokens: MAX_TOKENS_PER_CALL.design,
    validate: (v) => {
      const parsed = tokensSchema.parse(v);
      const issues: string[] = [];
      const accent = parsed.color.accent as Record<string, string>;
      if (FORBIDDEN_ACCENTS.has(accent["500"]?.toLowerCase())) issues.push("accent-500 is a forbidden default accent");
      if (accent["600"] && FORBIDDEN_ACCENTS.has(accent["600"].toLowerCase())) issues.push("accent-600 is a forbidden default accent");
      if (issues.length > 0) throw new Error(issues.join("; "));
      return parsed;
    },
  });

  return result;
}

/** Legacy-compatible wrapper — v6 CSS is shadcn globals. */
export function generateTokensCSS(tokens: Tokens): string {
  return generateGlobalsCSS(tokens);
}

export function generateTailwindConfig(): string {
  return `// Tailwind v4 — no config file required. Theme lives in globals.css (@theme inline).`;
}

export function validateTokens(tokens: Tokens): { valid: boolean; errors: string[] } {
  const parsed = tokensSchema.safeParse(tokens);
  if (!parsed.success) return { valid: false, errors: [parsed.error.message] };
  return { valid: true, errors: [] };
}

// ── Motion spec (deterministic, from tokens) ────────────────────────────

export interface MotionSpec {
  character: string;
  durations: { fast: string; base: string; slow: string };
  easing: string;
  interactionRules: {
    hover: { enabled: boolean; duration: string };
    focus: { enabled: boolean; ring: string };
    enter: { enabled: boolean; style: string };
    press: { enabled: boolean; translate: string };
  };
}

export function generateMotionSpec(
  direction: CreativeDirection,
  brief: Brief,
  tokens: Tokens,
): MotionSpec {
  const character = tokens.motion.character;
  const springy = character === "springy";
  const stately = character === "stately";
  return {
    character,
    durations: tokens.motion.duration,
    easing: tokens.motion.easing.standard,
    interactionRules: {
      hover: { enabled: true, duration: tokens.motion.duration.fast },
      focus: { enabled: true, ring: tokens.color.border.focus },
      enter: { enabled: true, style: stately ? "fade + slide-up 8px" : springy ? "scale-in 0.98" : "fade" },
      press: { enabled: true, translate: "translate-y-px" },
    },
  };
}

export function generateMotionCSS(motion: MotionSpec): string {
  return [
    `  --motion-character: ${motion.character};`,
    `  --duration-fast: ${motion.durations.fast};`,
    `  --duration-base: ${motion.durations.base};`,
    `  --duration-slow: ${motion.durations.slow};`,
    `  --easing-standard: ${motion.easing};`,
  ].join("\n");
}

export { onColor, tokenSnapshot };

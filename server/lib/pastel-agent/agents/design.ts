import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { designTokensSchema, visualIntentSchema, DESIGN_TOKEN_CONTRAST_PAIRS, type DesignTokens, type ResolvedTheme, type VisualIntent, type BrandKit } from "../schemas";
import { contrastRatio } from "../lib/colors";
import { themeFromDesignTokens, megadesignBlock, compileCompanyBlock } from "../knowledge/index";
import type { CompanyManifest } from "../knowledge/manifest-schema";
import type { VisualReference } from "../types";
import { buildBrandKit } from "../lib/brand-kit";

/**
 * V17 Design agent — creates the run's DESIGN SYSTEM + BRAND KIT before the
 * brief: (1) the token system (brand colors, radius scale, type scale, control
 * sizing, section rhythm, fonts), (2) the VISUAL INTENT — the art-direction
 * axes, and (3) the BRAND KIT — the complete, validated, deterministic brand
 * coherence ruleset used by the review board.
 *
 * V17: the brand kit is validated deterministically after the model call and
 * attached to every downstream artifact. The review board uses it to judge
 * brand coherence, accent frequency, border/shadow policy, and forbidden
 * color patterns.
 */

export interface DesignInput {
  prompt: string;
  answers: Record<string, string>;
  /** Top-scored company for the prompt (best-effort hint, never the law). */
  hintManifest?: CompanyManifest | null;
  visualReference?: VisualReference;
  onUsage?: OnUsage;
}

export interface DesignOutput {
  tokens: DesignTokens;
  theme: ResolvedTheme;
  visual: VisualIntent;
  /** V17: validated brand-kit for coherence review. */
  brandKit: BrandKit;
  usedFallback: boolean;
  notes: string[];
}

const SYSTEM = `You are the Pastel design-system architect. You design TWO things for one product: (1) the TOKEN SYSTEM (brand colors, radius scale, type scale, control sizing, section rhythm, fonts) and (2) the VISUAL INTENT — the art-direction axes that make this product's UI STRUCTURALLY distinct from every other product.

Your visual choices have CONCRETE consequences — the composer, the surface system, and every component all render differently based on your axes. Pick deliberately and make every product look different.

RULES:
- The product is described in the user request; its audience, mood, and niche drive the tokens AND the visual intent. A running app, a developer tool, a travel marketplace, and a kids' learning app each deserve a DIFFERENT system.
- A company design language may be attached as a HINT. Treat it as a starting point to ADAPT — never copy its palette wholesale.
- VISUAL INTENT — think like an art director, and pick deliberately (these axes change the actual screen structure):

  typeVoice (determines font feel + heading character):
  - "condensed": heavy tight display — athletic/editorial products. Headings are dramatic, compact. Use narrow type scales.
  - "grotesque": clean neutral — productivity/social tools. Headings are clean, readable. Use standard type scales.
  - "serif": elegant editorial — lifestyle/culture products. Headings have character. Pair with a clean body font.
  - "mono": technical data — developer tools. Headings are precise. Metrics use monospace where appropriate.
  - "rounded": friendly playful — learning/consumer products. Headings feel approachable. Softer type rhythm.

  spacingMood (determines density and whitespace — the composer adjusts section gaps and grid spacing):
  - "compact": dense, data-rich — dashboards, ops tools, data tables. 24px sections, 12px gaps. Smaller type.
  - "standard": balanced — most products. 32px sections, 16px gaps. Mid-range type.
  - "generous": airy, premium — lifestyle, editorial, luxury. 48px sections, 24px gaps. Larger type.

  cornerLanguage (determines card, button, and container radii throughout):
  - "sharp": 2-4px — engineering, dev tools, finance. Everything is crisp and squared.
  - "soft": 8-12px — friendly products, most consumer apps. Rounded but professional.
  - "pill": 16px+ — lifestyle, creative, kids. Everything reads as soft and approachable.

  surfaceTreatment (determines whether elements are flat, bordered, or layered):
  - "flat": color-only separation — no borders, no shadows. Surfaces distinguished by tone only. Clean, minimal.
  - "hairline": thin borders — subtle framing. Cards have quiet outlines. More structured than flat.
  - "layered": raised depth — shadows on cards. Elements float above the background. Premium, dimensional.

  accentBehavior (determines how the accent color is used — the MOST visible axis):
  - "electric": accent DOMINATES — CTA buttons are accent, hero bands use accent, chart lines are accent. The page reads as energetic and bold.
  - "monochrome": accent is QUIET — only the primary CTA and selected states use accent. Everything else is neutral. The page reads as calm and professional.
  - "duotone": accent tints imagery — images/media use accent overlay. The page reads as editorial.
  - "pastel": accent is SOFT — used in backgrounds, subtle highlights, badge fills. No bold accent bands. The page reads as gentle.
  - "warm": earthy accent — warm tones (amber, terracotta, olive). The page reads as organic and human.

  mediaStrategy (determines image/scene rendering):
  - "photo-mosaic": realistic layered scenes.
  - "flat-illustration": flat vector shapes.
  - "duotone-art": two-tone art treatments.
  - "data-as-art": charts/geometry as imagery.
  - "minimal": sparse, quiet tiles — no decorative imagery.

  mediaSubject: the imagery subject — "runner", "dumbbell", "house", "graph" (nodes/networks), "product", "album", "doc", "chat", "board", or "generic". Pick the one the product's content is ABOUT.

- Colors: every pair listed in the contrast requirements must pass WCAG AA (≥4.5:1 body text on its surface, ≥4.5:1 for primary/accent foreground pairs). Choose 3-6 chart colors that harmonize with the palette and are visually distinct from each other.
- Light mode: background near-white/off-white, foreground near-black, muted backgrounds slightly tinted. Dark mode (only when the request or answers ask for it): background near-black, foreground near-white.
- Radius: match the brand's character (sharp 2-4px for engineering tools, 8-12px medium for friendly products, generous 12-20px for consumer/lifestyle brands). full is always 9999. V21 floors (enforced): cornerLanguage soft → radius.lg ≥ 8px and radius.xl ≥ 12px; pill → radius.lg ≥ 16px and radius.xl ≥ 20px. Products aimed at consumers read as "unfinished" with sub-8px corners.
- Type scale: display font for headings, body font for text. Pick real fonts from Google Fonts (e.g. Inter, Archivo, Space Grotesk, DM Sans, Sora, Manrope, Lexend, IBM Plex Sans, JetBrains Mono). Never use "system-ui" as display.
- Control sizes: the 8px ladder — sm 28-36, md 40-44, lg 48-56 (interactive elements must stay ≥32px).
- Section rhythm: sectionPaddingY 48-88, sectionGap 24-48. Tie these to spacingMood — compact gets lower values, generous gets higher.
- Never invent marketspeak; the rationale is one quiet line about the design intent.
- MAKE EACH PRODUCT DISTINCT: if you're designing a fitness app, it should NOT look like a travel marketplace or a dev tool. Push the visual intent axes in different directions for different products.

OUTPUT — valid JSON ONLY (no markdown, no prose):
{
  "version": "1.0.0",
  "mode": "light" | "dark",
  "colors": { "background", "foreground", "card", "cardForeground", "popover", "popoverForeground", "primary", "primaryForeground", "secondary", "secondaryForeground", "muted", "mutedForeground", "accent", "accentForeground", "destructive", "destructiveForeground", "success", "successSubtle", "warning", "warningSubtle", "border", "input", "ring", "chart": [3-6 hex colors] },
  "radius": { "sm", "md", "lg", "xl", "full": 9999 },
  "typeScale": { "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl" },
  "control": { "sm", "md", "lg" },
  "sectionPaddingY", "sectionGap",
  "fonts": { "display", "body", "mono"? },
  "visual": {
    "version": "1.0.0",
    "typeVoice": "condensed"|"grotesque"|"serif"|"mono"|"rounded",
    "spacingMood": "compact"|"standard"|"generous",
    "cornerLanguage": "sharp"|"soft"|"pill",
    "surfaceTreatment": "flat"|"hairline"|"layered",
    "accentBehavior": "duotone"|"monochrome"|"electric"|"pastel"|"warm",
    "mediaStrategy": "photo-mosaic"|"flat-illustration"|"duotone-art"|"data-as-art"|"minimal",
    "mediaSubject": "runner"|"dumbbell"|"house"|"graph"|"product"|"album"|"doc"|"chat"|"board"|"generic",
    "rationale"?
  },
  "rationale"?
}
Every color is 6-digit hex like "#0F172A".`;

/** WCAG-AA validation — the deterministic gate on the model's palette. */
export function validateDesignTokens(tokens: DesignTokens): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const pair of DESIGN_TOKEN_CONTRAST_PAIRS) {
    const fg = tokens.colors[pair.fg];
    const bg = tokens.colors[pair.bg];
    const ratio = contrastRatio(fg, bg);
    if (ratio < pair.min) {
      errors.push(`${pair.label}: contrast ${ratio.toFixed(2)} < ${pair.min}`);
    }
  }
  for (const [name, r] of Object.entries(tokens.radius) as Array<[string, number]>) {
    if (r !== 9999 && r < 0) errors.push(`radius.${name} must be ≥ 0`);
  }
  if (tokens.radius.sm > tokens.radius.md || tokens.radius.md > tokens.radius.lg || tokens.radius.lg > tokens.radius.xl) {
    errors.push("radius scale must be monotonic (sm ≤ md ≤ lg ≤ xl)");
  }
  const xs = tokens.typeScale;
  if (!(xs.xs < xs.sm && xs.sm < xs.base && xs.base < xs.lg && xs.lg < xs.xl && xs.xl < xs["2xl"] && xs["2xl"] < xs["3xl"] && xs["3xl"] < xs["4xl"])) {
    errors.push("type scale must be strictly increasing");
  }
  return { ok: errors.length === 0, errors };
}

/** V21 radius floor — components read as "not rounded" when the theme's
 * corner radius is tiny. The corner language sets the floor; tokens below
 * the floor are bumped up deterministically (never rejected). */
export function enforceRadiusFloor(tokens: DesignTokens, visual: VisualIntent): DesignTokens {
  const floor = visual.cornerLanguage === "pill" ? { lg: 16, xl: 20 }
    : visual.cornerLanguage === "soft" ? { lg: 8, xl: 12 }
    : { lg: 2, xl: 4 };
  const radius = { ...tokens.radius };
  let changed = false;
  if (radius.lg < floor.lg) { radius.lg = floor.lg; changed = true; }
  if (radius.xl < floor.xl) { radius.xl = floor.xl; changed = true; }
  if (radius.md >= radius.lg) { radius.md = Math.max(4, radius.lg - 2); changed = true; }
  if (radius.sm >= radius.md) { radius.sm = Math.max(2, radius.md - 2); changed = true; }
  if (!changed) return tokens;
  return { ...tokens, radius, rationale: `${tokens.rationale ?? ""} Radius raised to the ${visual.cornerLanguage} corner floor (lg ≥ ${floor.lg}px).`.trim() };
}

/** Deterministic fallback: derive a token system from a company manifest
 * (the pre-v14 behavior — now the safety net, never the default). */
export function designTokensFromManifest(manifest: CompanyManifest, mode: "light" | "dark"): DesignTokens {
  const t = mode === "dark" ? manifest.dark : manifest.light;
  return {
    version: "1.0.0",
    mode,
    colors: {
      background: t.background,
      foreground: t.foreground,
      card: t.card,
      cardForeground: t.cardForeground,
      popover: t.popover,
      popoverForeground: t.popoverForeground,
      primary: t.primary,
      primaryForeground: t.primaryForeground,
      secondary: t.secondary,
      secondaryForeground: t.secondaryForeground,
      muted: t.muted,
      mutedForeground: t.mutedForeground,
      accent: t.accent,
      accentForeground: t.accentForeground,
      destructive: t.destructive,
      destructiveForeground: t.destructiveForeground,
      success: t.success,
      successSubtle: t.successSubtle,
      warning: t.warning,
      warningSubtle: t.warningSubtle,
      border: t.border,
      input: t.input,
      ring: t.ring,
      chart: t.chart,
    },
    radius: { ...manifest.radius, full: 9999 as const },
    typeScale: { ...manifest.typeScale },
    control: { sm: 32, md: 40, lg: 48 },
    sectionPaddingY: manifest.sectionPaddingY,
    sectionGap: manifest.sectionGap,
    fonts: { ...manifest.fonts },
    rationale: `Derived from the ${manifest.name} reference (deterministic fallback).`,
  };
}

/** V15 deterministic VisualIntent — derived from the validated tokens so the
 * fallback always exists (radius → corners, fonts → type voice, mood from
 * section rhythm). Subject defaults to a neutral "generic". */
export function visualIntentFromTokens(tokens: DesignTokens, hintSlug?: string): VisualIntent {
  const avgRadius = (tokens.radius.sm + tokens.radius.md + tokens.radius.lg) / 3;
  const typeVoice: VisualIntent["typeVoice"] = /mono|jetbrains|roboto mono/i.test(tokens.fonts.display)
    ? "mono"
    : /serif|playfair|georgia|merriweather/i.test(tokens.fonts.display)
      ? "serif"
      : /nunito|baloo|quicksand|rounded|fredoka/i.test(tokens.fonts.display)
        ? "rounded"
        : /condensed|archivo narrow|oswald|bebas/i.test(tokens.fonts.display)
          ? "condensed"
          : "grotesque";
  const cornerLanguage: VisualIntent["cornerLanguage"] = avgRadius <= 4 ? "sharp" : avgRadius >= 14 ? "pill" : "soft";
  const spacingMood: VisualIntent["spacingMood"] = tokens.sectionPaddingY <= 56 ? "compact" : tokens.sectionPaddingY >= 80 ? "generous" : "standard";
  const dark = tokens.mode === "dark";
  return {
    version: "1.0.0",
    typeVoice,
    spacingMood,
    cornerLanguage,
    surfaceTreatment: "hairline",
    accentBehavior: dark ? "electric" : "warm",
    mediaStrategy: "flat-illustration",
    mediaSubject: "generic",
    rationale: `Derived from the ${hintSlug ?? "run"} token system (deterministic fallback).`,
  };
}

export async function runDesign(input: DesignInput): Promise<DesignOutput> {
  const mode: "light" | "dark" = input.answers["mode"]?.toLowerCase() === "dark" ? "dark" : "light";
  const notes: string[] = [];

  if (!input.hintManifest) {
    throw new Error("design agent requires a hint company manifest (scoreCompanies top hit)");
  }

  const megadesign = await megadesignBlock();
  const hintBlock = await compileCompanyBlock(input.hintManifest.slug);
  const answersBlock = Object.keys(input.answers).length > 0
    ? `\nCLARIFICATION ANSWERS:\n${Object.entries(input.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
    : "";

  const contrastRule = DESIGN_TOKEN_CONTRAST_PAIRS
    .map((p) => `${p.fg} on ${p.bg} ≥ ${p.min}:1`)
    .join(", ");

  try {
    const out = await chatJSON<{ tokens: DesignTokens; visual?: VisualIntent }>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `PRODUCT REQUEST:\n${input.prompt}${answersBlock}\n\nREFERENCE COMPANY (hint — adapt, never copy):\n${hintBlock}\n\nUNIVERSAL DESIGN LAW (token rules):\n${megadesign}\n\nCONTRAST REQUIREMENTS (hard — every pair must pass):\n${contrastRule}\n\nEmit the design tokens AND the visual intent as JSON.`,
        },
        ...(input.visualReference
          ? [{ role: "user" as const, content: [{ type: "text" as const, text: "PRODUCT VISUAL TARGET: use this image to inform the palette, mood, surfaces, and art direction of the token system and visual intent. Do not copy its branding." }, ...input.visualReference.images] }]
          : []),
      ],
      {
        model: "design",
        temperature: 0.5,
        maxTokens: MAX_TOKENS_PER_CALL.design,
        validate: (v: unknown) => {
          const raw = v as { tokens?: unknown; visual?: unknown };
          const tokens = designTokensSchema.parse(raw.tokens);
          const visual = raw.visual ? visualIntentSchema.parse(raw.visual) : undefined;
          return { tokens, visual };
        },
        onUsage: input.onUsage,
      },
    );

    const { ok, errors } = validateDesignTokens(out.tokens);
    if (!ok) {
      // WCAG/scale violations are NOT acceptable — fall back to the
      // (already-validated) hint manifest tokens.
      notes.push(`design tokens failed validation: ${errors.join("; ")}`);
      throw new Error(`Design tokens failed WCAG validation: ${errors.join("; ")}`);
    }
    const visual = out.visual ?? visualIntentFromTokens(out.tokens, input.hintManifest.slug);
    const floored = enforceRadiusFloor(out.tokens, visual);
    if (floored !== out.tokens) notes.push("radius raised to the corner-language floor (components read as rounded)");
    const brandKit = buildBrandKit(floored, visual, input.hintManifest.slug);
    return {
      tokens: floored,
      theme: themeFromDesignTokens(floored, input.hintManifest),
      visual,
      brandKit,
      usedFallback: false,
      notes,
    };
  } catch (err) {
    console.warn("[pastel v15] design agent failed, using manifest-derived tokens:", err instanceof Error ? err.message : err);
    const fallback = designTokensFromManifest(input.hintManifest, mode);
    const fallbackVisual = visualIntentFromTokens(fallback, input.hintManifest.slug);
    const floored = enforceRadiusFloor(fallback, fallbackVisual);
    if (floored !== fallback) notes.push("radius raised to the corner-language floor (components read as rounded)");
    return {
      tokens: floored,
      theme: themeFromDesignTokens(floored, input.hintManifest),
      visual: fallbackVisual,
      brandKit: buildBrandKit(floored, fallbackVisual, input.hintManifest.slug),
      usedFallback: true,
      notes: [...notes, "deterministic token + visual-intent + brand-kit fallback used (design model unavailable/invalid)"],
    };
  }
}

import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { designTokensSchema, DESIGN_TOKEN_CONTRAST_PAIRS, type DesignTokens, type ResolvedTheme } from "../schemas-v6";
import { contrastRatio } from "../lib/colors";
import { themeFromDesignTokens, megadesignBlock, compileCompanyBlock } from "../knowledge/index";
import type { CompanyManifest } from "../knowledge/manifest-schema";
import type { VisualReference } from "../types";

/**
 * V14 Design agent — creates the run's DESIGN SYSTEM before the brief.
 *
 * This is the de-Airbnb fix at the root: every run now gets an explicit,
 * product-driven token system (brand colors, radius scale, type scale,
 * control sizing, section rhythm, fonts). No company manifest is copied
 * into the theme by default anymore — the top-scored company is only a HINT
 * (a starting palette and voice), and the model adapts it to the product.
 *
 * Code-side WCAG-AA validation rejects any color pair that fails contrast,
 * so a "dark navy text on airbnb white" default can never ship.
 *
 * Deterministic fallback (model fail / invalid tokens): derive the tokens
 * from the hint company's manifest — the pre-v14 behavior becomes the
 * safety net, not the default.
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
  usedFallback: boolean;
  notes: string[];
}

const SYSTEM = `You are the Pastel design-system architect. You design the TOKEN SYSTEM for one product: brand colors, radius scale, type scale, control sizing, section rhythm, and fonts. You define the design language — the product does not inherit one from a company.

RULES:
- The product is described in the user request; its audience, mood, and niche drive the tokens. A running app, a developer tool, a travel marketplace, and a kids' learning app each deserve a DIFFERENT system.
- A company design language may be attached as a HINT. Treat it as a starting point to ADAPT — never copy its palette wholesale. The tokens must feel native to THIS product, not to the reference company.
- Colors: every pair listed in the contrast requirements must pass WCAG AA (≥4.5:1 body text on its surface, ≥4.5:1 for primary/accent foreground pairs). Choose 3-6 chart colors that harmonize with the palette.
- Light mode: background near-white/off-white, foreground near-black, muted backgrounds slightly tinted. Dark mode (only when the request or answers ask for it): background near-black, foreground near-white.
- Radius: match the brand's character (sharp 2-4px for engineering tools, 8-12px medium for friendly products, generous 12-20px for consumer/lifestyle brands). full is always 9999.
- Type scale: display font for headings, body font for text. Pick real fonts from Google Fonts (e.g. Inter, Archivo, Space Grotesk, DM Sans, Sora, Manrope, Lexend, IBM Plex Sans, JetBrains Mono). Never use "system-ui" as display.
- Control sizes: the 8px ladder — sm 28-36, md 40-44, lg 48-56 (interactive elements must stay ≥32px).
- Section rhythm: sectionPaddingY 48-88, sectionGap 24-48.
- Never invent marketspeak; the rationale is one quiet line about the design intent.

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
    const tokens = await chatJSON<DesignTokens>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `PRODUCT REQUEST:\n${input.prompt}${answersBlock}\n\nREFERENCE COMPANY (hint — adapt, never copy):\n${hintBlock}\n\nUNIVERSAL DESIGN LAW (token rules):\n${megadesign}\n\nCONTRAST REQUIREMENTS (hard — every pair must pass):\n${contrastRule}\n\nEmit the design tokens as JSON.`,
        },
        ...(input.visualReference
          ? [{ role: "user" as const, content: [{ type: "text" as const, text: "PRODUCT VISUAL TARGET: use this image to inform the palette, mood, and surfaces of the token system. Do not copy its branding." }, ...input.visualReference.images] }]
          : []),
      ],
      {
        model: "design",
        temperature: 0.5,
        maxTokens: MAX_TOKENS_PER_CALL.design,
        validate: (v) => designTokensSchema.parse(v),
        onUsage: input.onUsage,
      },
    );

    const { ok, errors } = validateDesignTokens(tokens);
    if (!ok) {
      // WCAG/scale violations are NOT acceptable — fall back to the
      // (already-validated) hint manifest tokens.
      notes.push(`design tokens failed validation: ${errors.join("; ")}`);
      throw new Error(`Design tokens failed WCAG validation: ${errors.join("; ")}`);
    }
    return {
      tokens,
      theme: themeFromDesignTokens(tokens, input.hintManifest),
      usedFallback: false,
      notes,
    };
  } catch (err) {
    console.warn("[pastel v14] design agent failed, using manifest-derived tokens:", err instanceof Error ? err.message : err);
    const fallback = designTokensFromManifest(input.hintManifest, mode);
    return {
      tokens: fallback,
      theme: themeFromDesignTokens(fallback, input.hintManifest),
      usedFallback: true,
      notes: [...notes, "deterministic token fallback used (design model unavailable/invalid)"],
    };
  }
}

import { designTokensSchema, visualIntentSchema, DESIGN_TOKEN_CONTRAST_PAIRS, type DesignTokens, type VisualIntent } from "../schemas";
import { contrastRatio, hexToHsl, hslToHex } from "../lib/colors";
import type { CompanyManifest } from "../knowledge/manifest-schema";

/**
 * Maxi Agent v25 — deterministic design-token helpers.
 *
 * The v14-v17 design AGENT (a model call producing tokens + visual intent +
 * brand kit) is retired: in v25 the strong Direction call carries the
 * concept palette, and lib/blueprint-derive.ts expands it into tokens.
 * What survives here are the pure deterministic helpers the derive pass and
 * the fallback blueprint use — validation floors and manifest-derived
 * tokens. Zero model calls.
 */

// ── Validation floors ──────────────────────────────────────────────────────

export function validateDesignTokens(tokens: DesignTokens): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const c = tokens.colors;

  for (const pair of DESIGN_TOKEN_CONTRAST_PAIRS) {
    const fg = c[pair.fg];
    const bg = c[pair.bg];
    if (contrastRatio(fg, bg) < pair.min) {
      errors.push(`${pair.label} contrast ${contrastRatio(fg, bg).toFixed(2)}:1 < ${pair.min}:1`);
    }
  }

  if (tokens.radius.md < 2) errors.push("radius.md below the 2px floor (components read unfinished)");
  if (tokens.typeScale.base < 14) errors.push("typeScale.base below 14px (unreadable body)");
  if (tokens.control.md < 36) errors.push("control.md below the 36px floor (unclickable controls)");
  return { ok: errors.length === 0, errors };
}

/** Raise radii to the corner-language floor so components read as rounded. */
export function enforceRadiusFloor(tokens: DesignTokens, visual: VisualIntent): DesignTokens {
  const floor = visual.cornerLanguage === "sharp" ? 2 : visual.cornerLanguage === "soft" ? 8 : 16;
  const max = (v: number, f: number) => Math.max(v, f);
  return {
    ...tokens,
    radius: {
      ...tokens.radius,
      sm: max(tokens.radius.sm, Math.round(floor / 2)),
      md: max(tokens.radius.md, floor),
      lg: max(tokens.radius.lg, floor * 2),
    },
  };
}

/** Separate the card color from the background — surfaces must read as surfaces. */
export function enforceCardContrast(tokens: DesignTokens): DesignTokens {
  const { card, background } = tokens.colors;
  const cardHsl = hexToHsl(card);
  const bgL = hexToHsl(background).l;
  const tooClose = Math.abs(cardHsl.l - bgL) < 3;
  if (!tooClose) return tokens;
  const lighter = bgL > 50;
  const l = lighter ? Math.min(100, cardHsl.l + 4) : Math.max(0, cardHsl.l - 4);
  return { ...tokens, colors: { ...tokens.colors, card: hslToHex(cardHsl.h, Math.min(20, cardHsl.s), l) } };
}

// ── Manifest-derived fallback ──────────────────────────────────────────────

/** Deterministic fallback: derive a token system from a company manifest. */
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

/** Deterministic VisualIntent from tokens (kept for the run manifest's
 * visual-intent doc — v25 no longer prompts for it). */
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
  return visualIntentSchema.parse({
    version: "1.0.0",
    typeVoice,
    spacingMood,
    cornerLanguage,
    surfaceTreatment: "hairline",
    accentBehavior: dark ? "electric" : "warm",
    mediaStrategy: "flat-illustration",
    mediaSubject: "generic",
    rationale: `Derived from the ${hintSlug ?? "run"} token system (deterministic fallback).`,
  });
}

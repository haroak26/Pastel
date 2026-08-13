import type { DesignTokens, VisualIntent } from "../schemas";
import { contrastRatio, hexToRgb } from "./colors";

/**
 * V17 Brand Kit — the deterministic brand-coherence engine.
 *
 * V17 transforms the design agent's token system into an explicit brand kit
 * with signature moves, color rules, and forbidden patterns. The kit becomes
 * the review board's reference for "does this look like one product?"
 */

export interface BrandKitColorRule {
  fg: string;
  bg: string;
  min: number;
  label: string;
}

export interface BrandKitSignature {
  name: string;
  description: string;
  appliesTo: string[];
  variant: string;
}

export interface BrandKit {
  version: "1.0.0";
  company: string;
  primary: string;
  primaryHover: string;
  supporting: string;
  accent: string;
  accentHover: string;
  neutralBg: string;
  neutralFg: string;
  neutralMuted: string;
  neutralBorder: string;
  surface: string;
  surfaceRaised: string;
  interactive: string;
  interactiveHover: string;
  statusSuccess: string;
  statusWarning: string;
  statusError: string;
  chartColors: string[];
  fontDisplay: string;
  fontBody: string;
  fontMono?: string;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
  cornerLanguage: "sharp" | "soft" | "pill";
  borderPolicy: "hairline" | "subtle" | "none";
  shadowPolicy: "never" | "rare" | "sparing";
  accentFrequency: "minimal" | "moderate" | "generous";
  signatures: BrandKitSignature[];
  /** Colors that must NEVER appear as accents in this brand. */
  forbiddenAccents: string[];
  /** CSS variable export block. */
  cssVars: Record<string, string>;
}

/** Derive a complete brand kit from validated design tokens + visual intent. */
export function buildBrandKit(
  tokens: DesignTokens,
  visual: VisualIntent,
  companySlug: string,
): BrandKit {
  const dark = tokens.mode === "dark";
  const c = tokens.colors;

  return {
    version: "1.0.0",
    company: companySlug,
    primary: c.primary,
    primaryHover: dark ? lighten(c.primary, 10) : darken(c.primary, 10),
    supporting: c.secondary,
    accent: c.accent,
    accentHover: dark ? lighten(c.accent, 10) : darken(c.accent, 10),
    neutralBg: c.background,
    neutralFg: c.foreground,
    neutralMuted: c.muted,
    neutralBorder: c.border,
    surface: c.card,
    surfaceRaised: c.popover,
    interactive: c.accent,
    interactiveHover: c.accent,
    statusSuccess: c.success,
    statusWarning: c.warning,
    statusError: c.destructive,
    chartColors: c.chart,
    fontDisplay: tokens.fonts.display,
    fontBody: tokens.fonts.body,
    fontMono: tokens.fonts.mono,
    radiusSm: tokens.radius.sm,
    radiusMd: tokens.radius.md,
    radiusLg: tokens.radius.lg,
    radiusXl: tokens.radius.xl,
    cornerLanguage: visual.cornerLanguage,
    borderPolicy: visual.surfaceTreatment === "hairline" ? "hairline" : visual.surfaceTreatment === "flat" ? "none" : "subtle",
    shadowPolicy: visual.surfaceTreatment === "layered" ? "sparing" : "never",
    accentFrequency: visual.accentBehavior === "electric" ? "generous" : visual.accentBehavior === "pastel" ? "moderate" : "minimal",
    signatures: deriveSignatures(tokens, visual, companySlug),
    forbiddenAccents: deriveForbiddenAccents(c.primary, c.accent),
    cssVars: buildCssVars(tokens),
  };
}

function deriveSignatures(tokens: DesignTokens, visual: VisualIntent, slug: string): BrandKitSignature[] {
  const signatures: BrandKitSignature[] = [];

  if (["nike", "strava", "under-armour"].includes(slug)) {
    signatures.push({
      name: "bold-scoreboard",
      description: "Giant tabular numbers with unit labels and accent delta chips, no card surfaces",
      appliesTo: ["home"],
      variant: "scoreboard",
    });
    signatures.push({
      name: "accent-hero-band",
      description: "Full-width dark metric band with oversized headline and a single bright CTA",
      appliesTo: ["home"],
      variant: "fullbleed",
    });
  }

  if (["stripe", "vercel", "github", "linear", "notion"].includes(slug)) {
    signatures.push({
      name: "monochrome-metric-typography",
      description: "Clean lightweight numbers on a neutral ground with minimal decoration",
      appliesTo: ["home", "detail"],
      variant: "monochrome",
    });
  }

  if (["apple", "spotify", "netflix", "duolingo"].includes(slug)) {
    signatures.push({
      name: "dark-utility-header",
      description: "A compact utility bar or prominent dark navigation header",
      appliesTo: ["home"],
      variant: "dark-header",
    });
  }

  if (["airbnb", "uber", "shopify"].includes(slug)) {
    signatures.push({
      name: "editorial-image-strip",
      description: "A curated horizontal strip of editorial imagery tiles with captions",
      appliesTo: ["home"],
      variant: "featured",
    });
  }

  if (signatures.length === 0) {
    signatures.push({
      name: "clean-minimal",
      description: "Quiet, well-spaced content with restrained accent use and clear hierarchy",
      appliesTo: ["home", "detail"],
      variant: "minimal",
    });
  }

  return signatures;
}

function deriveForbiddenAccents(primary: string, accent: string): string[] {
  const forbidden: string[] = [];
  const primaryRgb = hexToRgb(primary);
  if (primaryRgb) {
    const { r, g, b } = primaryRgb;
    if (b > r && b > g + 30) {
      forbidden.push("#4F46E5", "#3B82F6", "#6366F1");
    }
  }
  return forbidden;
}

function buildCssVars(tokens: DesignTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  vars["--background"] = tokens.colors.background;
  vars["--foreground"] = tokens.colors.foreground;
  vars["--card"] = tokens.colors.card;
  vars["--muted"] = tokens.colors.muted;
  vars["--muted-foreground"] = tokens.colors.mutedForeground;
  vars["--primary"] = tokens.colors.primary;
  vars["--primary-foreground"] = tokens.colors.primaryForeground;
  vars["--accent"] = tokens.colors.accent;
  vars["--accent-foreground"] = tokens.colors.accentForeground;
  vars["--border"] = tokens.colors.border;
  vars["--input"] = tokens.colors.input;
  vars["--ring"] = tokens.colors.ring;
  vars["--radius"] = `${tokens.radius.md}px`;
  vars["--radius-sm"] = `${tokens.radius.sm}px`;
  vars["--radius-md"] = `${tokens.radius.md}px`;
  vars["--radius-lg"] = `${tokens.radius.lg}px`;
  vars["--radius-xl"] = `${tokens.radius.xl}px`;
  // V22: minimal elevation tokens — floating/overlay + one dominant surface only.
  vars["--shadow-sm"] = "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10)";
  vars["--shadow-md"] = "0 4px 6px rgba(16, 24, 40, 0.04), 0 10px 20px rgba(16, 24, 40, 0.10)";
  vars["--font-display"] = tokens.fonts.display;
  vars["--font-body"] = tokens.fonts.body;
  if (tokens.fonts.mono) vars["--font-mono"] = tokens.fonts.mono;
  for (let i = 0; i < tokens.colors.chart.length; i++) {
    vars[`--chart-${i + 1}`] = tokens.colors.chart[i];
  }
  return vars;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Audit a kit against a rendered screen for brand coherence. */
export function auditBrandCoherence(
  kit: BrandKit,
  screenCode: string,
): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  // Accent frequency check
  const accentMatches = (screenCode.match(new RegExp(kit.accent.replace("#", "#?"), "gi")) || []).length;
  const bgAccentMatches = (screenCode.match(/bg-accent/g) || []).length;
  const totalAccent = accentMatches + bgAccentMatches;
  if (kit.accentFrequency === "minimal" && totalAccent > 4) {
    issues.push(`Accent appears ${totalAccent} times; minimal frequency allows at most 4 instances`);
  }
  if (kit.accentFrequency === "moderate" && totalAccent > 8) {
    issues.push(`Accent appears ${totalAccent} times; moderate frequency allows at most 8 instances`);
  }

  // Forbidden color check
  for (const forbidden of kit.forbiddenAccents) {
    const re = new RegExp(forbidden.replace("#", "#?"), "gi");
    if (re.test(screenCode)) {
      issues.push(`Forbidden accent color ${forbidden} detected in output`);
    }
  }

  // Border policy check
  if (kit.borderPolicy === "none") {
    const borderCount = (screenCode.match(/border-[a-z]/g) || []).length;
    if (borderCount > 4) {
      issues.push(`Border policy "none" violated: ${borderCount} border utilities found`);
    }
  }

  // Shadow policy check
  if (kit.shadowPolicy === "never") {
    const shadowCount = (screenCode.match(/shadow-/g) || []).length;
    if (shadowCount > 0) {
      issues.push(`Shadow policy "never" violated: ${shadowCount} shadows found`);
    }
  }

  return { ok: issues.length === 0, issues };
}

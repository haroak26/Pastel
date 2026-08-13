import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/**
 * Maxi Agent v23 — extracted "base component modification framework".
 *
 * Carried over from the retired Picasso pipeline (picasso/pipeline/lib/
 * base-components.ts, picasso/base-components/): the vendored radix-nova
 * component library is the modification anchor — generated components are
 * REWRITES of a base file (structure + API preserved, theme/customization
 * applied), never bespoke from scratch. This module owns:
 *
 *   - loading the vendored base library (ui/*.tsx, theme/, manifest.json)
 *   - import rewriting so generated files are self-contained
 *   - the dependency-closure system (sibling imports provisioned from the
 *     vendored bases)
 *   - the theme-slot → CSS pipeline (auditGlobalsCSS + generateGlobalsCSS)
 *
 * The v23 orchestrator builds a MaxiTokens value from the run's own design
 * tokens (see tokensFromV6) so no Picasso-era artifact is required.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, "../base-components");
const UI_DIR = path.join(BASE_DIR, "ui");

// ── MaxiTokens (structural mirror of the retired Picasso Tokens) ────────

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const maxiTokensSchema = z.object({
  meta: z.object({
    brand: z.string(),
    version: z.literal("1.0.0"),
    generatedAt: z.string(),
    seed: z.string(),
    character: z.string(),
    mode: z.enum(["light", "dark", "both"]).default("light"),
  }),
  color: z.object({
    neutral: z.record(z.string(), hexColor),
    accent: z.record(z.string(), hexColor),
    semantic: z.object({
      success: z.record(z.string(), hexColor),
      warning: z.record(z.string(), hexColor),
      danger: z.record(z.string(), hexColor),
      info: z.record(z.string(), hexColor),
    }),
    surface: z.object({
      background: z.string(),
      raised: z.string(),
      overlay: z.string(),
    }),
    text: z.object({
      primary: z.string(),
      secondary: z.string(),
      muted: z.string(),
      inverse: z.string(),
    }),
    border: z.object({
      default: z.string(),
      subtle: z.string(),
      focus: z.string(),
    }),
  }),
  typography: z.object({
    fontFamily: z.object({
      display: z.string(),
      body: z.string(),
      mono: z.string(),
    }),
    scale: z.record(z.string()),
    weight: z.object({
      regular: z.number(),
      medium: z.number(),
      semibold: z.number(),
      bold: z.number(),
    }),
  }),
  space: z.record(z.string()),
  radius: z.object({
    none: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
    full: z.string(),
  }),
  shadow: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
  }),
  motion: z.object({
    duration: z.object({
      fast: z.string(),
      base: z.string(),
      slow: z.string(),
    }),
    easing: z.object({
      standard: z.string(),
    }),
    character: z.string(),
  }),
  breakpoints: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
  }),
});

export type MaxiTokens = z.infer<typeof maxiTokensSchema>;

/** V23 default tokens — the deterministic fallback when a run's design
 *  system is unavailable (degraded stages still produce valid renders). */
export function fallbackMaxiTokens(brand: string, mode: "light" | "dark" = "light"): MaxiTokens {
  const neutral = {
    "0": "#ffffff", "50": "#fafafa", "100": "#f5f5f5", "200": "#e5e5e5", "300": "#d4d4d4",
    "400": "#a3a3a3", "500": "#737373", "600": "#525252", "700": "#404040", "800": "#262626",
    "900": "#171717", "950": "#0a0a0a",
  } as const;
  const accent = {
    "50": "#f0fdfa", "100": "#ccfbf1", "200": "#99f6e4", "300": "#5eead4", "400": "#2dd4bf",
    "500": "#14b8a6", "600": "#0d9488", "700": "#0f766e", "800": "#115e59", "900": "#134e4a",
  } as const;
  const semantic = (s: string) => ({ "50": s, "500": s, "900": s });

  return {
    meta: {
      brand,
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      seed: "degraded-fallback",
      character: "swift",
      mode,
    },
    color: {
      neutral,
      accent,
      semantic: {
        success: semantic("#16a34a"),
        warning: semantic("#d97706"),
        danger: semantic("#dc2626"),
        info: semantic("#0ea5e9"),
      },
      surface: { background: "#ffffff", raised: "#ffffff", overlay: "#ffffff" },
      text: { primary: "#171717", secondary: "#525252", muted: "#a3a3a3", inverse: "#ffffff" },
      border: { default: "#e5e5e5", subtle: "#f5f5f5", focus: "#0d9488" },
    },
    typography: {
      fontFamily: { display: "Manrope", body: "DM Sans", mono: "IBM Plex Mono" },
      scale: { xs: "12px", sm: "14px", base: "16px", lg: "18px", xl: "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px", "5xl": "48px" },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    },
    space: {
      "0": "0px", "2": "2px", "4": "4px", "6": "6px", "8": "8px", "12": "12px", "16": "16px",
      "24": "24px", "32": "32px", "40": "40px", "48": "48px", "64": "64px", "80": "80px",
      "96": "96px", "128": "128px", "160": "160px",
    },
    radius: { none: "0px", sm: "4px", md: "6px", lg: "8px", xl: "12px", full: "9999px" },
    shadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
    motion: {
      duration: { fast: "120ms", base: "200ms", slow: "300ms" },
      easing: { standard: "cubic-bezier(0.4, 0, 0.2, 1)" },
      character: "swift",
    },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
  };
}

/** Build MaxiTokens from a run's v6 design artifacts (DesignTokens +
 *  ResolvedTheme + VisualIntent) — the v23 bridge so the base library works
 *  off the existing per-run design system. */
export function tokensFromV6(input: {
  brand: string;
  seed: string;
  tokens: {
    mode: "light" | "dark";
    colors: Record<string, string>;
    radius: Record<string, number>;
    typeScale: Record<string, number>;
    fonts: { display: string; body: string; mono?: string };
    sectionPaddingY: number;
    sectionGap: number;
  };
  visual?: { typeVoice?: string; cornerLanguage?: string; surfaceTreatment?: string } | null;
}): MaxiTokens {
  const { brand, seed, tokens } = input;
  const c = tokens.colors;
  const toScale = (name: string, value: string) => {
    const idx = Object.keys(tokens.radius).indexOf(name);
    return { [name]: value } as Record<string, string>;
  };

  const accent: Record<string, string> = {};
  const neutral: Record<string, string> = {};
  const luma = (hex: string) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const isLight = luma(c.primary ?? "#111111") > 0.45;
  // The neutral ladder must be HEX (the token schema requires 6-digit hex).
  const grayHex = (pct: number): string => {
    const v = Math.round((pct / 100) * 255);
    return `#${[v, v, v].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  };
  for (let i = 0; i <= 950; i += 50) {
    neutral[String(i)] =
      i === 0 ? (isLight ? "#ffffff" : "#0a0a0a")
      : i === 950 ? (isLight ? "#0a0a0a" : "#ffffff")
      : isLight ? grayHex(Math.max(4, 100 - i / 10))
      : grayHex(Math.min(96, i / 10));
  }
  for (let i = 50; i <= 900; i += 50) {
    accent[String(i)] = c.primary ?? "#14b8a6";
  }

  const radius = tokens.radius;
  return {
    meta: {
      brand,
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      seed,
      character: "swift",
      mode: tokens.mode,
    },
    color: {
      neutral,
      accent,
      semantic: {
        success: { "50": c.successSubtle ?? "#eff6ef", "500": c.success ?? "#16a34a", "900": c.success ?? "#16a34a" },
        warning: { "50": c.warningSubtle ?? "#fff7e5", "500": c.warning ?? "#d97706", "900": c.warning ?? "#d97706" },
        danger: { "50": c.destructive ?? "#fef2f2", "500": c.destructive ?? "#dc2626", "900": c.destructive ?? "#dc2626" },
        info: { "50": c.primary ?? "#eff6ff", "500": c.ring ?? "#0ea5e9", "900": c.ring ?? "#0ea5e9" },
      },
      surface: { background: c.background ?? "#ffffff", raised: c.card ?? "#ffffff", overlay: c.popover ?? "#ffffff" },
      text: {
        primary: c.foreground ?? "#171717",
        secondary: c.secondaryForeground ?? "#525252",
        muted: c.mutedForeground ?? "#a3a3a3",
        inverse: c.primaryForeground ?? "#ffffff",
      },
      border: { default: c.border ?? "#e5e5e5", subtle: c.muted ?? "#f5f5f5", focus: c.ring ?? "#0d9488" },
    },
    typography: {
      fontFamily: { display: tokens.fonts.display, body: tokens.fonts.body, mono: tokens.fonts.mono ?? "IBM Plex Mono" },
      scale: Object.fromEntries(Object.entries(tokens.typeScale).map(([k, v]) => [k, `${v}px`])),
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    },
    space: {
      "0": "0px", "2": "2px", "4": "4px", "6": "6px", "8": "8px", "12": "12px", "16": "16px",
      "24": "24px", "32": "32px", "40": "40px", "48": "48px", "64": "64px", "80": "80px",
      "96": "96px", "128": "128px", "160": "160px",
    },
    radius: {
      none: "0px",
      sm: `${radius.sm ?? 4}px`,
      md: `${radius.md ?? 6}px`,
      lg: `${radius.lg ?? 8}px`,
      xl: `${radius.xl ?? 12}px`,
      full: "9999px",
    },
    shadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
    motion: {
      duration: { fast: "120ms", base: "200ms", slow: "300ms" },
      easing: { standard: "cubic-bezier(0.4, 0, 0.2, 1)" },
      character: "swift",
    },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
  };
}

/** Build MaxiTokens from a resolved v23 run theme (the bridge used by the
 *  fidelity path — base-anchored generation needs the token snapshot). */
export function maxiTokensFromTheme(theme: {
  tokens: ThemeTokensShape;
  mode: "light" | "dark";
  manifest: { fonts: { display: string; body: string; mono?: string } };
  colors: { chart: string[] };
}): MaxiTokens {
  const t = theme.tokens;
  const neutral: Record<string, string> = {};
  const accent: Record<string, string> = {};
  const luma = (hex: string) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const grayHex = (pct: number): string => {
    const v = Math.round((pct / 100) * 255);
    return `#${[v, v, v].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  };
  const isLight = luma(t.primary ?? "#111111") > 0.45;
  for (let i = 0; i <= 950; i += 50) {
    neutral[String(i)] =
      i === 0 ? (isLight ? "#ffffff" : "#0a0a0a")
      : i === 950 ? (isLight ? "#0a0a0a" : "#ffffff")
      : isLight ? grayHex(Math.max(4, 100 - i / 10))
      : grayHex(Math.min(96, i / 10));
  }
  for (let i = 50; i <= 900; i += 50) accent[String(i)] = t.primary;
  return {
    meta: { brand: theme.manifest.fonts.display, version: "1.0.0", generatedAt: new Date().toISOString(), seed: "theme-bridge", character: "swift", mode: theme.mode },
    color: {
      neutral,
      accent,
      semantic: {
        success: { "50": t.successSubtle, "500": t.success, "900": t.success },
        warning: { "50": t.warningSubtle, "500": t.warning, "900": t.warning },
        danger: { "50": t.destructive, "500": t.destructive, "900": t.destructive },
        info: { "50": t.ring, "500": t.ring, "900": t.ring },
      },
      surface: { background: t.background, raised: t.card, overlay: t.popover },
      text: { primary: t.foreground, secondary: t.secondaryForeground, muted: t.mutedForeground, inverse: t.primaryForeground },
      border: { default: t.border, subtle: t.muted, focus: t.ring },
    },
    typography: {
      fontFamily: { display: theme.manifest.fonts.display, body: theme.manifest.fonts.body, mono: theme.manifest.fonts.mono ?? "IBM Plex Mono" },
      scale: { xs: "12px", sm: "14px", base: "16px", lg: "18px", xl: "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px", "5xl": "48px" },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    },
    space: {
      "0": "0px", "2": "2px", "4": "4px", "6": "6px", "8": "8px", "12": "12px", "16": "16px",
      "24": "24px", "32": "32px", "40": "40px", "48": "48px", "64": "64px", "80": "80px",
      "96": "96px", "128": "128px", "160": "160px",
    },
    radius: { none: "0px", sm: "4px", md: "6px", lg: "8px", xl: "12px", full: "9999px" },
    shadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
    motion: {
      duration: { fast: "120ms", base: "200ms", slow: "300ms" },
      easing: { standard: "cubic-bezier(0.4, 0, 0.2, 1)" },
      character: "swift",
    },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
  };
}

type ThemeTokensShape = {
  background: string; foreground: string; card: string; cardForeground: string;
  popover: string; popoverForeground: string; primary: string; primaryForeground: string;
  secondary: string; secondaryForeground: string; muted: string; mutedForeground: string;
  accent: string; accentForeground: string; destructive: string; destructiveForeground: string;
  success: string; successSubtle: string; warning: string; warningSubtle: string;
  border: string; input: string; ring: string; chart: string[];
};

// ── Loading ──────────────────────────────────────────────────────────────
let namesCache: string[] | null = null;

/** Every vendored base component name (without extension). */
export function baseComponentNames(): string[] {
  if (namesCache) return namesCache;
  namesCache = fs
    .readdirSync(UI_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""))
    .sort();
  return namesCache;
}

export interface BaseComponentInfo {
  name: string;
  source: string;
  /** External packages this base component imports. */
  externalImports: string[];
  /** Other base components it imports (rewritten to sibling paths at build). */
  siblingImports: string[];
}

/** Full source of a vendored base component — the code that CREATES it. */
export function loadBaseComponent(name: string): BaseComponentInfo | null {
  const safe = name.replace(/[^a-zA-Z0-9-]/g, "");
  const file = path.join(UI_DIR, `${safe}.tsx`);
  if (!fs.existsSync(file)) return null;
  const source = fs.readFileSync(file, "utf8");
  const imports = [...source.matchAll(/^import[^\n]*/gm)].map((m) => m[0].trim());
  const externalImports: string[] = [];
  const siblingImports: string[] = [];
  for (const imp of imports) {
    const m = imp.match(/from ["']([^"']+)["']/);
    if (!m) continue;
    const spec = m[1];
    if (spec.startsWith("@/components/ui")) siblingImports.push(path.basename(spec));
    else if (spec.startsWith("@/")) {
      const leaf = path.basename(spec);
      siblingImports.push(leaf === "utils" ? "cn" : leaf);
    } else if (spec.startsWith(".")) {
      siblingImports.push(path.basename(spec));
    } else {
      externalImports.push(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
    }
  }
  return { name: safe, source, externalImports, siblingImports };
}

/** Rewrite base-component imports so generated files are fully self-contained
 *  (flat sibling layout — no "@/..." aliases, no shadcn package imports). */
export function rewriteBaseImports(code: string): string {
  return code
    .replace(/from\s+["']@\/lib\/utils["']/g, 'from "./cn"')
    .replace(/from\s+["']@\/lib\/cn["']/g, 'from "./cn"')
    .replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, (_m, name: string) => `from "./${kebab(name)}"`)
    .replace(/from\s+["']@\/hooks\/([^"']+)["']/g, (_m, name: string) => `from "./${kebab(name)}"`);
}

export function kebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

// ── Colour helpers ──────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG-ish relative luminance 0..1. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white, whichever reads better on the given colour. */
export function onColor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#111111" : "#ffffff";
}

export function mixWhite(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = (v: number) => Math.round(v + (255 - v) * amount);
  return `#${[t(r), t(g), t(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// ── Theme slots (tokens → shadcn CSS variables) ──────────────────────────

export interface ThemeSlots {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart: [string, string, string, string, string];
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export function deriveSlots(tokens: MaxiTokens, dark: boolean): ThemeSlots {
  const c = tokens.color;
  const accent = c.accent as Record<string, string>;
  const neutral = c.neutral as Record<string, string>;
  const sem = c.semantic;

  if (dark) {
    const primary = accent["400"] ?? accent["500"];
    const destructive = sem.danger["500"] ?? sem.danger["900"];
    const bg = neutral["950"] ?? "#0a0a0a";
    const fg = neutral["50"] ?? "#fafafa";
    return {
      background: bg,
      foreground: fg,
      card: neutral["900"] ?? "#171717",
      cardForeground: fg,
      popover: neutral["900"] ?? "#171717",
      popoverForeground: fg,
      primary,
      primaryForeground: onColor(primary),
      secondary: neutral["800"] ?? "#262626",
      secondaryForeground: neutral["100"] ?? "#f5f5f5",
      muted: neutral["800"] ?? "#262626",
      mutedForeground: neutral["400"] ?? "#a3a3a3",
      accent: neutral["800"] ?? "#262626",
      accentForeground: neutral["100"] ?? "#f5f5f5",
      destructive,
      destructiveForeground: onColor(destructive),
      border: neutral["800"] ?? "#262626",
      input: neutral["800"] ?? "#262626",
      ring: primary,
      chart: [primary, accent["500"] ?? primary, accent["300"] ?? primary, sem.info["500"], sem.success["500"]],
      sidebar: neutral["900"] ?? "#171717",
      sidebarForeground: fg,
      sidebarPrimary: primary,
      sidebarPrimaryForeground: onColor(primary),
      sidebarAccent: neutral["800"] ?? "#262626",
      sidebarAccentForeground: neutral["100"] ?? "#f5f5f5",
      sidebarBorder: neutral["800"] ?? "#262626",
      sidebarRing: primary,
    };
  }

  const primary = accent["600"] ?? accent["500"];
  const destructive = sem.danger["500"];
  return {
    background: c.surface.background,
    foreground: c.text.primary,
    card: c.surface.raised,
    cardForeground: c.text.primary,
    popover: c.surface.overlay,
    popoverForeground: c.text.primary,
    primary,
    primaryForeground: onColor(primary),
    secondary: neutral["100"] ?? "#f5f5f5",
    secondaryForeground: neutral["900"] ?? "#171717",
    muted: neutral["100"] ?? "#f5f5f5",
    mutedForeground: neutral["500"] ?? "#737373",
    accent: neutral["100"] ?? "#f5f5f5",
    accentForeground: neutral["900"] ?? "#171717",
    destructive,
    destructiveForeground: onColor(destructive),
    border: c.border.default,
    input: c.border.default,
    ring: accent["500"],
    chart: [accent["500"], accent["300"], neutral["600"] ?? "#525252", sem.info["500"], sem.success["500"]],
    sidebar: mixWhite(c.surface.background, 0.3),
    sidebarForeground: c.text.primary,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: onColor(primary),
    sidebarAccent: neutral["100"] ?? "#f5f5f5",
    sidebarAccentForeground: c.text.primary,
    sidebarBorder: c.border.subtle,
    sidebarRing: accent["500"],
  };
}

// ── CSS generation ──────────────────────────────────────────────────────

const THEME_MAPPING = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted",
  "muted-foreground", "accent", "accent-foreground", "destructive", "border", "input",
  "ring", "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
] as const;

function slotVars(slots: ThemeSlots): string {
  const map: Record<string, string> = {
    background: slots.background,
    foreground: slots.foreground,
    card: slots.card,
    "card-foreground": slots.cardForeground,
    popover: slots.popover,
    "popover-foreground": slots.popoverForeground,
    primary: slots.primary,
    "primary-foreground": slots.primaryForeground,
    secondary: slots.secondary,
    "secondary-foreground": slots.secondaryForeground,
    muted: slots.muted,
    "muted-foreground": slots.mutedForeground,
    accent: slots.accent,
    "accent-foreground": slots.accentForeground,
    destructive: slots.destructive,
    border: slots.border,
    input: slots.input,
    ring: slots.ring,
    sidebar: slots.sidebar,
    "sidebar-foreground": slots.sidebarForeground,
    "sidebar-primary": slots.sidebarPrimary,
    "sidebar-primary-foreground": slots.sidebarPrimaryForeground,
    "sidebar-accent": slots.sidebarAccent,
    "sidebar-accent-foreground": slots.sidebarAccentForeground,
    "sidebar-border": slots.sidebarBorder,
    "sidebar-ring": slots.sidebarRing,
  };
  const lines: string[] = [];
  for (const key of THEME_MAPPING) {
    lines.push(`    --${key}: ${map[key]};`);
  }
  slots.chart.forEach((v, i) => lines.push(`    --chart-${i + 1}: ${v};`));
  return lines.join("\n");
}

function readUtilities(): string {
  const file = path.join(BASE_DIR, "theme", "utilities.css");
  return fs.readFileSync(file, "utf8");
}

/**
 * Full shadcn v4 globals.css for a product: utilities + @theme inline mapping
 * + per-product :root/.dark slots. Compiles with the Tailwind v4 CLI (used by
 * the sandboxed render path when Tailwind compilation is enabled).
 */
export function generateGlobalsCSS(tokens: MaxiTokens): string {
  const light = deriveSlots(tokens, false);
  const dark = tokens.meta.mode === "both" || tokens.meta.mode === "dark" ? deriveSlots(tokens, true) : null;
  const radiusBase = tokens.radius.lg ?? "0.75rem";
  const display = tokens.typography.fontFamily.display;
  const body = tokens.typography.fontFamily.body;
  const mono = tokens.typography.fontFamily.mono;
  const fontStack = `'${display}', '${body}', ui-sans-serif, system-ui, sans-serif`;

  const css = [
    `@import "tailwindcss";`,
    `@import "tw-animate-css";`,
    ``,
    readUtilities(),
    ``,
    `@custom-variant dark (&:is(.dark *));`,
    ``,
    `@theme inline {`,
    `  --font-sans: ${fontStack};`,
    `  --font-heading: '${display}', ${fontStack};`,
    `  --font-mono: '${mono}', ui-monospace, SFMono-Regular, Menlo, monospace;`,
    `  --color-sidebar-ring: var(--sidebar-ring);`,
    `  --color-sidebar-border: var(--sidebar-border);`,
    `  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);`,
    `  --color-sidebar-accent: var(--sidebar-accent);`,
    `  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);`,
    `  --color-sidebar-primary: var(--sidebar-primary);`,
    `  --color-sidebar-foreground: var(--sidebar-foreground);`,
    `  --color-sidebar: var(--sidebar);`,
    `  --color-chart-5: var(--chart-5);`,
    `  --color-chart-4: var(--chart-4);`,
    `  --color-chart-3: var(--chart-3);`,
    `  --color-chart-2: var(--chart-2);`,
    `  --color-chart-1: var(--chart-1);`,
    `  --color-ring: var(--ring);`,
    `  --color-input: var(--input);`,
    `  --color-border: var(--border);`,
    `  --color-destructive: var(--destructive);`,
    `  --color-accent-foreground: var(--accent-foreground);`,
    `  --color-accent: var(--accent);`,
    `  --color-muted-foreground: var(--muted-foreground);`,
    `  --color-muted: var(--muted);`,
    `  --color-secondary-foreground: var(--secondary-foreground);`,
    `  --color-secondary: var(--secondary);`,
    `  --color-primary-foreground: var(--primary-foreground);`,
    `  --color-primary: var(--primary);`,
    `  --color-popover-foreground: var(--popover-foreground);`,
    `  --color-popover: var(--popover);`,
    `  --color-card-foreground: var(--card-foreground);`,
    `  --color-card: var(--card);`,
    `  --color-foreground: var(--foreground);`,
    `  --color-background: var(--background);`,
    `  --radius-sm: calc(var(--radius) * 0.6);`,
    `  --radius-md: calc(var(--radius) * 0.8);`,
    `  --radius-lg: var(--radius);`,
    `  --radius-xl: calc(var(--radius) * 1.4);`,
    `  --radius-2xl: calc(var(--radius) * 1.8);`,
    `  --radius-3xl: calc(var(--radius) * 2.2);`,
    `  --radius-4xl: calc(var(--radius) * 2.6);`,
    `  --duration-fast: ${tokens.motion.duration.fast};`,
    `  --duration-base: ${tokens.motion.duration.base};`,
    `  --duration-slow: ${tokens.motion.duration.slow};`,
    `  --easing-standard: ${tokens.motion.easing.standard};`,
    `}`,
    ``,
    `:root {`,
    `  --radius: ${radiusBase};`,
    slotVars(light),
    `}`,
  ];

  if (dark) {
    css.push(``, `.dark {`, `  --radius: ${radiusBase};`, slotVars(dark), `}`);
  }

  css.push(
    ``,
    `@layer base {`,
    `  * {`,
    `    @apply border-border outline-ring/50;`,
    `  }`,
    `  body {`,
    `    @apply bg-background text-foreground;`,
    `  }`,
    `  html {`,
    `    @apply font-sans;`,
    `  }`,
    `}`,
  );

  return css.join("\n");
}

// ── Prompt snapshot (what agents see) ──────────────────────────────────

/** The shadcn utility vocabulary + product slot values for agent prompts. */
export function tokenSnapshot(tokens: MaxiTokens): string {
  const light = deriveSlots(tokens, false);
  const slot = (label: string, value: string) => `  ${label.padEnd(22)} ${value}`;
  const lines: string[] = [
    "## THEME TOKENS (shadcn slots — use these UTILITY CLASSES, never raw hex)",
    "",
    "Color utilities: bg-background · text-foreground · bg-card · text-card-foreground · bg-popover · bg-primary · text-primary-foreground · bg-secondary · text-secondary-foreground · bg-muted · text-muted-foreground · bg-accent · text-accent-foreground · bg-destructive · text-destructive-foreground · border-border · bg-border · ring-ring · ring-offset-background · border-input",
    "",
    "This product's slot values:",
    slot("background", light.background),
    slot("foreground", light.foreground),
    slot("card", light.card),
    slot("primary", light.primary),
    slot("primary-foreground", light.primaryForeground),
    slot("secondary", light.secondary),
    slot("muted", light.muted),
    slot("muted-foreground", light.mutedForeground),
    slot("accent", light.accent),
    slot("destructive", light.destructive),
    slot("border", light.border),
    slot("ring", light.ring),
    slot("chart-1..5", light.chart.join(" · ")),
    "",
    `Radius base: ${tokens.radius.lg} → rounded-sm/md/lg/xl/2xl/3xl · full: ${tokens.radius.full}`,
    `Fonts: display="${tokens.typography.fontFamily.display}" · body="${tokens.typography.fontFamily.body}" · mono="${tokens.typography.fontFamily.mono}"`,
    `Motion: ${tokens.motion.character} (fast ${tokens.motion.duration.fast}, base ${tokens.motion.duration.base}, slow ${tokens.motion.duration.slow})`,
    `Space scale: ${Object.entries(tokens.space).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    `Shadows: ${Object.entries(tokens.shadow).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    "",
    "HARD RULES:",
    "- Every colour must come from the shadcn slot utilities above (bg-primary, text-muted-foreground, border-border…). NO raw hex, NO rgb()/hsl()/oklch() literals in JSX.",
    "- Never use default Tailwind palette colours (text-gray-400, bg-blue-500, etc.) — they are not part of this theme.",
    "- Radius via rounded-* utilities or var(--radius-*). Heights via h-8/h-9/h-10/h-11 standard utilities.",
    "- Fonts: font-sans / font-heading / font-mono (mapped in the theme). Never set font-family inline.",
    "- Shadows: shadow-sm/md/lg/xl only on floating/overlay elements and ONE dominant surface.",
  ];
  return lines.join("\n");
}

// ── Token-CSS audit ─────────────────────────────────────────────────────

const SLOT_BLOCK_RE = /\{\s*((?:--[a-z0-9-]+\s*:\s*[^;}]+;?\s*)+)\}/g;
const CUSTOM_PROP_RE = /--([a-z0-9-]+)\s*:/g;

/** Every `--var:` the base theme declares inside its :root / .dark blocks. */
export function baseThemeVars(): string[] {
  const file = path.join(BASE_DIR, "theme", "globals.css");
  const css = fs.readFileSync(file, "utf8");
  const vars = new Set<string>();
  const rootIdx = css.indexOf(":root");
  const darkIdx = css.indexOf(".dark");
  const segments = [rootIdx, darkIdx].filter((i) => i >= 0);
  if (segments.length === 0) return [...vars];
  const start = Math.min(...segments);
  let m: RegExpExecArray | null;
  SLOT_BLOCK_RE.lastIndex = start;
  while ((m = SLOT_BLOCK_RE.exec(css))) {
    if (m.index < start) continue;
    if (m.index > css.length) break;
    const block = m[1];
    let v: RegExpExecArray | null;
    CUSTOM_PROP_RE.lastIndex = 0;
    while ((v = CUSTOM_PROP_RE.exec(block))) vars.add(v[1]);
  }
  return [...vars].sort();
}

export interface GlobalsAuditResult {
  passed: boolean;
  /** Theme variables the base declares but the generated CSS omits. */
  missing: string[];
  /** Theme variables the generated CSS declares. */
  present: string[];
}

/** Diff the generated globals CSS against the base theme's variable set.
 *  Any gap is a bug — components would silently fall back to base defaults. */
export function auditGlobalsCSS(globalsCSS: string): GlobalsAuditResult {
  const expected = baseThemeVars();
  const present = new Set<string>();
  let m: RegExpExecArray | null;
  CUSTOM_PROP_RE.lastIndex = 0;
  while ((m = CUSTOM_PROP_RE.exec(globalsCSS))) present.add(m[1]);

  const missing = expected.filter((v) => !present.has(v));
  return {
    passed: missing.length === 0,
    missing,
    present: [...present].sort(),
  };
}

// ── Dependency closure ──────────────────────────────────────────────────

/** Relative sibling imports ("from "./x"") a file requests, without extensions. */
export function scanSiblingImports(code: string): string[] {
  const out: string[] = [];
  const re = /from\s+["']\.\/([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const name = m[1].replace(/\.(?:tsx|ts|jsx|js)$/, "").trim();
    if (!name || name === ".") continue;
    out.push(name);
  }
  return out;
}

export const SUPPORT_SIBLINGS = new Set(["cn", "use-mobile"]);

export interface DependencyClosureResult {
  components: Record<string, string>;
  /** Manifest ids of the base files provisioned to close the graph. */
  provisioned: string[];
}

/** Close the sibling-import graph: every "./x" a generated file imports that
 *  is neither a generated component nor a support file is provisioned as a
 *  literal base file (imports rewritten). */
export function closeDependencyGraph(
  components: Record<string, string>,
  manifestIds: Iterable<string>,
): DependencyClosureResult {
  const result: Record<string, string> = { ...components };
  const provisioned: string[] = [];
  const ids = new Set(manifestIds);
  const baseNames = new Set(baseComponentNames());

  let changed = true;
  while (changed) {
    changed = false;
    for (const code of Object.values(result)) {
      for (const sibling of scanSiblingImports(code)) {
        if (SUPPORT_SIBLINGS.has(sibling)) continue;
        if (ids.has(sibling)) continue;
        if (result[sibling] !== undefined) continue;
        if (!baseNames.has(sibling)) continue;
        const base = loadBaseComponent(sibling);
        if (!base) continue;
        result[sibling] = rewriteBaseImports(base.source);
        provisioned.push(sibling);
        changed = true;
      }
    }
  }
  return { components: result, provisioned };
}

/** Support files the generated code may reference (cn, use-mobile). */
export function supportFiles(): Record<string, string> {
  return {
    "cn": `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
    "use-mobile": `import * as React from "react"

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
`,
  };
}

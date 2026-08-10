import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Tokens } from "../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, "../../base-components");
const UI_DIR = path.join(BASE_DIR, "ui");

// ── Loading ──────────────────────────────────────────────────────────────

let namesCache: string[] | null = null;

/** Every vendored base shadcn component name (without extension). */
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
    else if (spec.startsWith("@/") ) {
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
 * (flat sibling layout — no "@/..." aliases, no shadcn package imports). */
export function rewriteBaseImports(code: string): string {
  return code
    .replace(/from\s+["']@\/lib\/utils["']/g, 'from "./cn"')
    .replace(/from\s+["']@\/lib\/cn["']/g, 'from "./cn"')
    .replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, (_m, name: string) => `from "./${kebab(name)}"`)
    .replace(/from\s+["']@\/hooks\/([^"']+)["']/g, (_m, name: string) => `from "./${kebab(name)}"`);
}

function kebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export { kebab };

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

export function deriveSlots(tokens: Tokens, dark: boolean): ThemeSlots {
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
 * + per-product :root/.dark slots. Compiles with the Tailwind v4 CLI.
 */
export function generateGlobalsCSS(tokens: Tokens): string {
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
export function tokenSnapshot(tokens: Tokens): string {
  const light = deriveSlots(tokens, false);
  const slot = (label: string, value: string) => `  ${label.padEnd(22)} ${value}`;
  const lines: string[] = [    "## THEME TOKENS (shadcn slots — use these UTILITY CLASSES, never raw hex)",
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
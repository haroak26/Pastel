import fs from "node:fs";
import path from "node:path";
import { chatJSON, type ChatMessage, MODELS } from "../../gateway";
import type { Brief, CreativeDirection, Tokens } from "./types";

export interface GenerateTokensInput {
  brief: Brief;
  direction: CreativeDirection;
  megadesignContent: string;
  companyContents: Record<string, string>;
}

export async function generateTokens(input: GenerateTokensInput): Promise<Tokens> {
  const { brief, direction, megadesignContent, companyContents } = input;

  const companyBlocks = Object.entries(companyContents)
    .map(([slug, content]) => `## Design reference: ${slug}\n\n${content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a design-token architect. Your output is a machine-readable design token specification that drives every visual decision in a generated UI. You work from a core design constitution (megadesign.md) and selected brand reference files.

${megadesignContent}

${companyBlocks}

Produce a COMPLETE design tokens JSON object for the following product:
- Product: ${brief.productName}
- Description: ${brief.description}
- Audience: ${brief.audience}
- Niche: ${brief.niche}
- Personality: ${brief.personality.join(", ")}
- Density: ${brief.density}
- Mode: ${brief.mode}

Chosen creative direction:
- Name: ${direction.name}
- Summary: ${direction.summary}
- Influences: ${direction.influences.join(", ")}
- Palette direction: ${direction.paletteDirection}
- Density fit: ${direction.densityFit}

RULES — follow these exactly:
1. ONE accent color per project. Semantic colors (success/warning/danger/info) are separate.
2. Neutral scale: 12 stops from 0 (white/lightest) to 950 (near-black/darkest). For dark mode, invert the scale (0 = near-black, 950 = near-white).
3. Accent: include at minimum stops 50, 100, 500 (the primary), 600 (hover), 900.
4. All colors must be 6-digit hex (#RRGGBB). NO opacity suffixes, NO rgba, NO hsl.
5. WCAG AA contrast: body text ≥ 4.5:1 against background, large text ≥ 3:1.
6. Font families: pick real, high-quality fonts available on Google Fonts. One display, one body, one mono. No Inter as display. Prefer fonts that match the brand direction.
7. Type scale: use a modular scale (1.25 or 1.333 ratio). Values in format "Npx/Npx" (size/line-height). Body never smaller than 16px.
8. Space scale: 4px base — values 4, 8, 12, 16, 24, 32, 48, 64, 96.
9. Radius scale: none=0, sm=4-8, md=8-12, lg=14-20, xl=22-28, full=9999.
10. Shadows: sm (subtle, hover), md (card/raised), lg (dropdown/popover), xl (modal).
11. Motion: fast=120ms, base=200ms, slow=320ms. Standard easing.
12. Breakpoints: sm=640, md=768, lg=1024, xl=1280.

Output VALID JSON matching this exact structure:
{
  "meta": { "brand": "string", "version": "1.0.0", "generatedAt": "ISO-8601" },
  "color": {
    "neutral": { "0": "#...", "50": "#...", ..., "950": "#..." },
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

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Generate the complete design tokens JSON for "${brief.productName}" (${brief.niche}, ${brief.mode} mode, density: ${brief.density}). Follow the creative direction "${direction.name}" — ${direction.summary}. Make the tokens feel genuinely different from run to run — don't reuse the same palette. Output ONLY the JSON object, no markdown, no explanation.`,
    },
  ];

  const tokens = await chatJSON<Tokens>(messages, {
    model: "design",
    temperature: 0.6,
    maxTokens: 6000,
    validate: (v: unknown) => v as Tokens,
  });

  return tokens;
}

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

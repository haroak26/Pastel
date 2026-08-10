import type {
  Tokens,
  ScreenPlan,
  LayoutPlan,
  ComponentManifestEntry,
} from "./types";
import {
  chatText,
  MODELS,
  MAX_TOKENS_PER_CALL,
  type ChatMessage,
} from "../../gateway";
import {
  detectSlopViolations,
  filterBlockingViolations,
  hasBlockingViolations,
  antiSlopSystemPrompt,
  contextCompositionRules,
  type ProductContext,
  type SlopViolation,
} from "./anti-slop";

// ── Local types ─────────────────────────────────────────────────────────

export interface BrandKit {
  accent: string;
  displayFont: string;
  bodyFont: string;
  monoFont: string;
  spacing: Record<string, string>;
  radius: Record<string, string>;
}

export interface CopyPlan {
  heading: string;
  subheading: string;
  ctas: { label: string; variant?: string }[];
  labels: Record<string, string>;
}

export type MockDataset = Record<string, unknown>;

export interface ComposeAllScreensInput {
  layoutPlan: LayoutPlan;
  components: Record<string, string>;
  tokens: Tokens;
  data: MockDataset;
  copy: CopyPlan;
  productContext: ProductContext;
  onProgress?: (screenName: string, index: number, total: number) => void;
}

// ── Helper: extract brand kit from tokens ───────────────────────────────

function extractBrandKit(tokens: Tokens): BrandKit {
  const accent = tokens.color.accent as Record<string, string>;
  return {
    accent: accent["500"] ?? Object.values(accent)[0] ?? "#3B82F6",
    displayFont: tokens.typography.fontFamily.display,
    bodyFont: tokens.typography.fontFamily.body,
    monoFont: tokens.typography.fontFamily.mono,
    spacing: tokens.space,
    radius: tokens.radius,
  };
}

// ── Token reference block ───────────────────────────────────────────────

function tokenReferenceBlock(tokens: Tokens): string {
  const c = tokens.color;
  const accent = c.accent as Record<string, string>;

  return [
    "DESIGN TOKENS REFERENCE:",
    `  Accent palette: ${Object.entries(accent).map(([k, v]) => `--color-accent-${k}=${v}`).join(", ")}`,
    `  Neutral palette: ${Object.entries(c.neutral).map(([k, v]) => `--color-neutral-${k}=${v}`).join(", ")}`,
    `  Surface: ${Object.entries(c.surface).map(([k, v]) => `--color-surface-${k}=${v}`).join(", ")}`,
    `  Text: ${Object.entries(c.text).map(([k, v]) => `--color-text-${k}=${v}`).join(", ")}`,
    `  Border: ${Object.entries(c.border).map(([k, v]) => `--color-border-${k}=${v}`).join(", ")}`,
    `  Typography: display=${tokens.typography.fontFamily.display}, body=${tokens.typography.fontFamily.body}, mono=${tokens.typography.fontFamily.mono}`,
    `  Space scale: ${Object.entries(tokens.space).map(([k, v]) => `--space-${k}=${v}`).join(", ")}`,
    `  Radius scale: ${Object.entries(tokens.radius).map(([k, v]) => `--radius-${k}=${v}`).join(", ")}`,
  ].join("\n");
}

// ── Path helper ─────────────────────────────────────────────────────────

function componentPath(name: string): string {
  return `../components/${name}`;
}

// ── composeScreen (single screen) ───────────────────────────────────────

export async function composeScreen(
  screenPlan: ScreenPlan,
  components: Record<string, string>,
  brandKit: BrandKit,
  data: MockDataset,
  copy: CopyPlan,
  tokens: Tokens,
  productContext: ProductContext,
  errorContext?: string | null,
): Promise<string> {
  const componentList = Object.entries(components)
    .map(([id, code]) => {
      const shortCode = code.length > 500 ? code.slice(0, 500) + "\n// ..." : code;
      return `#### ${id}\n\`\`\`tsx\n${shortCode}\n\`\`\``;
    })
    .join("\n\n");

  const regionBlock = screenPlan.regions
    .map((r) => {
      const slots = r.componentTypes
        .map((cs) => `  - ${cs.name} (${cs.taxonomy}): ${cs.description}`)
        .join("\n");
      return `### Region "${r.name}" [role: ${r.role}]\n${slots}`;
    })
    .join("\n\n");

  const availableExports = Object.entries(components)
    .map(([id]) => `  - ${id} (exported as default)`)
    .join("\n");

  const importSuggestion = Object.keys(components)
    .map((name) => `import ${name} from "${componentPath(name)}";`)
    .join("\n");

  const dataExcerpt = JSON.stringify(data, null, 2).slice(0, 3000);

  let prompt = [
    "You are a senior UI engineer composing a product screen.",
    "",
    `PRODUCT: ${copy.heading} — ${screenPlan.description}`,
    `CONTEXT: ${productContext.toUpperCase()}`,
    "",
    "BRAND DESIGN SYSTEM:",
    `  Accent: var(--color-accent-500) ≈ ${brandKit.accent}`,
    `  Display font: ${brandKit.displayFont}`,
    `  Body font: ${brandKit.bodyFont}`,
    `  Mono font: ${brandKit.monoFont}`,
    `  Spacing scale: ${Object.entries(brandKit.spacing).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    `  Radius scale: ${Object.entries(brandKit.radius).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    "",
    "AVAILABLE COMPONENTS (import from ./components/):",
    availableExports,
    "",
    "COMPONENT SOURCE (for props reference):",
    componentList,
    "",
    "MOCK DATA FOR THIS SCREEN:",
    "```json",
    dataExcerpt,
    "```",
    "",
    "COPY FOR THIS SCREEN:",
    `  Heading: "${copy.heading}"`,
    `  Subheading: "${copy.subheading}"`,
    `  CTAs: ${copy.ctas.map((c) => `"${c.label}"${c.variant ? ` (${c.variant})` : ""}`).join(", ")}`,
    `  Labels: ${Object.entries(copy.labels).map(([k, v]) => `${k}="${v}"`).join(", ")}`,
    "",
    "SCREEN PLAN:",
    `  Name: ${screenPlan.name}`,
    `  Route: ${screenPlan.route}`,
    `  Description: ${screenPlan.description}`,
    `  Grid: ${screenPlan.gridColumns}-column`,
    `  Regions:`,
    regionBlock,
    "",
    `SUGGESTED IMPORTS (use these exact paths):`,
    importSuggestion,
    "",
    "COMPOSITION RULES:",
    contextCompositionRules(productContext),
    "",
    antiSlopSystemPrompt(),
    "",
    tokenReferenceBlock(tokens),
    "",
    "CRITICAL:",
    `This is a ${productContext.toUpperCase()} screen. Compose accordingly.`,
    productContext === "app"
      ? "APP: NO centered hero, NO footer, function-first layout, sidebar or topbar nav"
      : productContext === "landing"
        ? "LANDING: Hero section with headline + subheadline + CTA, feature sections, footer"
        : productContext === "docs"
          ? "DOCS: Content-first with sidebar + search, no marketing CTAs, no decorative elements"
          : "DEFAULT: Function-first layout, no marketing heroes, no footers",
    "- Use surface variety: alternate Band -> Plain -> Card -> Band",
    "- Mount components with REAL data from the dataset (not placeholder values)",
    "- Every section must be populated (no empty gaps)",
    "- ONE clear primary action per screen",
    "- Write specific, on-brand copy (not AI-slop)",
  ].join("\n");

  if (errorContext) {
    prompt += `\n\n## PREVIOUS ATTEMPT FAILED\n\nThe previous generation was rejected with the following issues:\n${errorContext}\n\nPlease fix ALL of these issues in this regeneration. Output ONLY the complete screen file.`;
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a senior UI engineer composing product screens. You write layout-only screen files — importing pre-built components, passing real data, arranging them in grid/flex layouts using token values. You never define new components or new visual styling. Every screen is a default-export React TSX component. Output ONLY the complete file — no markdown fences, no explanations.`,
    },
    { role: "user", content: prompt },
  ];

  const raw = await chatText(messages, {
    model: "compose",
    temperature: 0.4,
    maxTokens: MAX_TOKENS_PER_CALL.compose,
  });

  let code = raw.trim();
  code = code.replace(/^```(?:tsx|typescript|jsx|javascript)?\s*\n?/, "");
  code = code.replace(/\n?```\s*$/, "");
  return code.trim();
}

// ── composeScreenWithRetry ──────────────────────────────────────────────

export async function composeScreenWithRetry(
  screenPlan: ScreenPlan,
  components: Record<string, string>,
  tokens: Tokens,
  data: MockDataset,
  copy: CopyPlan,
  productContext: ProductContext,
  maxRetries: number = 2,
): Promise<{ screen: string; retries: number }> {
  const brandKit = extractBrandKit(tokens);
  let attempts = 0;
  let lastError: string | null = null;

  while (attempts < maxRetries + 1) {
    try {
      const code = await composeScreen(
        screenPlan,
        components,
        brandKit,
        data,
        copy,
        tokens,
        productContext,
        lastError,
      );

      const lintResult = lintScreen(code, productContext);
      if (hasBlockingViolations(lintResult.violations)) {
        const fixed = autoFixViolations(code, lintResult.violations);
        const reLint = lintScreen(fixed, productContext);
        if (!hasBlockingViolations(reLint.violations)) {
          return { screen: fixed, retries: attempts };
        }
        throw new Error(
          `Anti-slop violations: ${filterBlockingViolations(lintResult.violations)
            .map((v) => v.description)
            .join("; ")}`,
        );
      }

      return { screen: code, retries: attempts };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      attempts++;
      if (attempts > maxRetries) {
        throw new Error(
          `Screen composition failed after ${maxRetries} retries: ${lastError}`,
        );
      }
    }
  }

  throw new Error(`Unreachable: composition retry loop exhausted`);
}

// ── composeAllScreens ───────────────────────────────────────────────────

export async function composeAllScreens(
  input: ComposeAllScreensInput,
): Promise<Record<string, string>> {
  const { layoutPlan, components, tokens, data, copy, productContext, onProgress } = input;
  const screens: Record<string, string> = {};

  for (let i = 0; i < layoutPlan.screens.length; i++) {
    const screenPlan = layoutPlan.screens[i];
    onProgress?.(screenPlan.name, i + 1, layoutPlan.screens.length);

    try {
      const result = await composeScreenWithRetry(
        screenPlan,
        components,
        tokens,
        data,
        copy,
        productContext,
      );
      screens[screenPlan.id] = result.screen;
    } catch (err) {
      console.error(
        `[composeAllScreens] Failed to compose screen "${screenPlan.name}": ${err instanceof Error ? err.message : err}`,
      );
      screens[screenPlan.id] = `import React from "react";

export default function ${screenPlan.name.replace(/[^a-zA-Z0-9]/g, "")}Screen() {
  return (
    <div style={{ padding: "var(--space-8)", color: "var(--color-text-primary)" }}>
      <h1 style={{ fontFamily: "var(--font-display)" }}>${screenPlan.name}</h1>
      <p style={{ color: "var(--color-text-muted)" }}>${screenPlan.description}</p>
    </div>
  );
}`;
    }
  }

  return screens;
}

// ── Anti-slop lint pass ─────────────────────────────────────────────────

export interface LintResult {
  passed: boolean;
  violations: SlopViolation[];
  score: number;
}

export function lintScreen(
  screenCode: string,
  productContext: ProductContext,
): LintResult {
  const violations = detectSlopViolations(screenCode);

  // Context-specific violations
  if (productContext === "app") {
    if (/<footer\b/i.test(screenCode)) {
      violations.push({
        id: "app-footer-detected",
        category: "navigation",
        severity: "high",
        description: "Footer element found on an APP screen — apps don't use footers",
        fix: "Remove the footer element from the screen",
      });
    }

    const centeredHeroApp = /text-center[\s\S]{0,300}text-[45]xl/;
    if (centeredHeroApp.test(screenCode)) {
      violations.push({
        id: "app-centered-hero",
        category: "layout",
        severity: "high",
        description: "Centered hero text (text-4xl+) detected on an APP screen",
        fix: "Use left-aligned headings in a function-first layout",
      });
    }

    if (/Get started/i.test(screenCode)) {
      violations.push({
        id: "app-marketing-cta",
        category: "content",
        severity: "high",
        description: "Marketing copy 'Get started' found on an APP screen",
        fix: "Replace with app-specific action label (e.g., 'Create project', 'Add transaction')",
      });
    }
  }

  if (productContext === "landing") {
    const hasHero = /text-[45]xl/.test(screenCode) || /hero/i.test(screenCode);
    if (!hasHero) {
      violations.push({
        id: "landing-no-hero",
        category: "layout",
        severity: "high",
        description: "LANDING screen missing a hero section",
        fix: "Add a hero section with headline (text-4xl+), subheadline, and primary CTA",
      });
    }

    const ctaButtons = screenCode.match(/<Button[\s>]/g);
    if (!ctaButtons || ctaButtons.length === 0) {
      violations.push({
        id: "landing-no-ctas",
        category: "components",
        severity: "high",
        description: "LANDING screen has no CTA buttons",
        fix: "Add primary and secondary CTA buttons to the hero and bottom sections",
      });
    }
  }

  // Compute score: start at 10, subtract per violation
  let score = 10;
  for (const v of violations) {
    if (v.severity === "high") {
      score -= 1;
    } else if (v.severity === "medium") {
      score -= 0.5;
    }
  }
  score = Math.max(0, score);

  return {
    passed: !hasBlockingViolations(violations),
    violations,
    score,
  };
}

// ── Auto-fix violations ─────────────────────────────────────────────────

export function autoFixViolations(
  screenCode: string,
  violations: SlopViolation[],
): string {
  let fixed = screenCode;

  for (const v of violations) {
    switch (v.id) {
      case "app-footer-detected":
        fixed = fixed.replace(
          /<footer\b[\s\S]*?<\/footer>/gi,
          "<!-- [REMOVED: footer not appropriate for app screens] -->",
        );
        break;

      case "app-centered-hero":
        fixed = fixed.replace(
          /text-center/g,
          "text-left",
        );
        break;

      case "app-marketing-cta":
        fixed = fixed.replace(
          /Get started/g,
          "[NEEDS COPY]",
        );
        break;

      case "forbidden-accent-3B82F6":
      case "forbidden-accent-4F46E5":
      case "forbidden-accent-A78BFA":
      case "forbidden-accent-6366F1":
      case "forbidden-accent-8B5CF6":
      case "forbidden-accent-2563EB":
        fixed = fixed.replace(
          /#3B82F6|#4F46E5|#A78BFA|#6366F1|#8B5CF6|#2563EB/gi,
          "var(--color-accent-500)",
        );
        break;

      case "forbidden-accent-000000":
        fixed = fixed.replace(
          /(?<!var\(--)color\s*:\s*#000(?:000)?\b/gi,
          "color: var(--color-neutral-950)",
        );
        break;

      case "forbidden-accent-FFFFFF":
        fixed = fixed.replace(
          /(?<!var\(--)color\s*:\s*#FFF(?:FFF)?\b/gi,
          "color: var(--color-neutral-0)",
        );
        break;

      case "gradient-detected":
        fixed = fixed.replace(
          /bg-\[linear-gradient\([\s\S]*?\)\]/g,
          "bg-[var(--color-surface-background)]",
        );
        break;

      default:
        // AI-slop phrases and content violations
        if (v.id.startsWith("ai-slop-") || v.id.startsWith("placeholder-")) {
          if (v.id.startsWith("ai-slop-")) {
            for (const line of fixed.split("\n")) {
              for (const bad of AI_SLOP_PHRASES) {
                if (line.toLowerCase().includes(bad.toLowerCase())) {
                  fixed = fixed.replace(
                    new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
                    "[NEEDS COPY]",
                  );
                }
              }
            }
          }
        }

        if (v.id === "generic-cta-pair") {
          fixed = fixed.replace(/Get started/g, "[NEEDS COPY]");
          fixed = fixed.replace(/Learn more/g, "[NEEDS COPY]");
        }

        break;
    }
  }

  // Add missing focus rings to interactive elements that don't have them
  const interactiveWithoutFocus =
    /<(?:button|a|input|select|textarea|\[role="button"\])\b(?![\s\S]*?focus-visible:ring)[\s\S]*?>/g;
  if (interactiveWithoutFocus.test(fixed)) {
    fixed = fixed.replace(
      /className="([^"]*)"/g,
      (_match, classes: string) => {
        if (
          /<(?:button|a|input|select|textarea)\b/.test(fixed.slice(0, fixed.indexOf(classes) - 10)) &&
          !classes.includes("focus-visible:ring")
        ) {
          return `className="${classes} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"`;
        }
        return _match;
      },
    );
  }

  return fixed;
}

// ── AI slop phrases (mirror of anti-slop.ts for inline auto-fix) ────────

const AI_SLOP_PHRASES = [
  "Unlock your potential",
  "seamless experience",
  "innovative solution",
  "next-generation platform",
  "Empowering teams to",
  "Revolutionize your workflow",
  "Cutting-edge technology",
  "Leverage the power of",
  "Transform the way you",
  "Unleash the power of",
  "Streamline your operations",
  "Elevate your experience",
  "state-of-the-art",
  "best-in-class",
  "world-class",
  "game-changing",
  "disruptive",
  "paradigm shift",
  "synergy",
  "holistic approach",
  "robust",
  "scalable",
  "intuitive interface",
  "user-friendly",
  "effortless",
  "frictionless",
  "seamlessly integrate",
  "data-driven insights",
  "actionable",
  "enterprise-grade",
] as const;

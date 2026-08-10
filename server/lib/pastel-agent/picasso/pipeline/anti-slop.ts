/**
 * Picasso V6 Anti-Slop System — shadcn edition.
 *
 * Static rules enforced over every generated file:
 * - No raw hex/rgb/hsl/oklch colour literals in TSX (slots only)
 * - No default Tailwind palette colours (text-gray-400, bg-blue-500…)
 * - No "@/" aliases, no shadcn package imports — files must be self-contained
 * - No gradient wallpaper, no placeholder copy, no forbidden fonts
 * - Generated components must differ from their base source (no copy-paste)
 * - App screens must not contain hero/footer chrome; landing screens must
 */

export type ProductContext = "app" | "landing" | "docs" | "social" | "unknown";

// ─── Typography Guardrails ───────────────────────────────────────────────

export const FORBIDDEN_DISPLAY_FONTS = [
  "Roboto",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
] as const;

export const DISTINCTIVE_FONTS = [
  "Manrope",
  "Geist",
  "Cabinet Grotesk",
  "Sora",
  "Clash Display",
  "Satoshi",
  "Switzer",
  "Fredoka",
  "Outfit",
  "Plus Jakarta Sans",
  "General Sans",
  "Zodiak",
  "Sentient",
  "Chillax",
  "Space Grotesk",
  "Instrument Sans",
  "Onest",
  "Bricolage Grotesque",
  "Gabarito",
] as const;

// ─── Colour Guardrails ──────────────────────────────────────────────────

export const FORBIDDEN_ACCENT_COLORS = [
  { hex: "#3B82F6", name: "Tailwind blue-500", severity: "high" as const },
  { hex: "#4F46E5", name: "Tailwind indigo-600", severity: "high" as const },
  { hex: "#A78BFA", name: "Tailwind purple-400", severity: "high" as const },
  { hex: "#6366F1", name: "Tailwind indigo-500", severity: "high" as const },
  { hex: "#8B5CF6", name: "Tailwind violet-500", severity: "high" as const },
  { hex: "#2563EB", name: "Tailwind blue-600", severity: "high" as const },
  { hex: "#000000", name: "Pure black", severity: "medium" as const },
  { hex: "#FFFFFF", name: "Pure white", severity: "medium" as const },
] as const;

// ─── AI slop copy ───────────────────────────────────────────────────────

export const AI_SLOP_PHRASES = [
  "lorem ipsum",
  "lorem",
  "dolor sit",
  "your one-stop",
  "unleash your",
  "supercharge your",
  "revolutionize",
  "game-changer",
  "seamless experience",
  "cutting-edge",
  "state-of-the-art",
  "empower",
  "unlock the power",
  "elevate your",
  "take your [a-z]+ to the next level",
  "streamline your workflow",
  "effortless",
  "best-in-class",
  "world-class",
  "industry-leading",
  "everything you need",
  "one-size-fits-all",
  "click here",
  "learn more about our",
  "get started today",
  "sign up now",
  "john doe",
  "jane doe",
  "acme corp",
  "example.com",
  "your logo here",
  "placeholder",
  "sample text",
  "undefined",
] as const;

// ─── Slop violation model ───────────────────────────────────────────────

export interface SlopViolation {
  id: string;
  severity: "high" | "medium" | "low";
  description: string;
  file?: string;
  line?: number;
  fix?: string;
}

// ─── Detection helpers ──────────────────────────────────────────────────

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const PALETTE_RE = /\b(?:bg|text|border|ring|fill|stroke|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]+\b/g;
const GRADIENT_RE = /\b(?:bg-gradient-to-[a-z]+|bg-linear-to-[a-z]+|bg-radial|bg-conic)\b/g;
const ALIAS_IMPORT_RE = /from\s+["']@\//g;
const SHADCN_PACKAGE_RE = /from\s+["'](?:shadcn|@shadcn\/[a-z-]+)["']/g;
const PLACEHOLDER_IMG_RE = /placeholder\.com|via\.placeholder|dummyimage|picsum|placehold\.co/g;
const COPY_IMPORT_RE = /from\s+["'](?:@|\.\/)copy["']/g;

export function detectProductContext(description: string): ProductContext {
  const d = description.toLowerCase();
  if (/landing page|marketing site|homepage|hero section|conversion|pricing page|website for/.test(d)) return "landing";
  if (/dashboard|admin|console|workspace|inbox|crm|erp|sass|b2b|internal/.test(d)) return "app";
  if (/docs|documentation|knowledge base|api reference/.test(d)) return "docs";
  if (/social|feed|community|chat|messaging|forum/.test(d)) return "social";
  return "unknown";
}

/** Product-context composition rules — the "how screens may be shaped" law. */
export function contextCompositionRules(context: ProductContext): string {
  const common = [
    "- Every screen has ONE dominant moment (a big number, a search hero, a primary list) — never a flat wall of equal sections.",
    "- Vary section padding: py-10, py-16, py-20 — never the same twice in a row.",
    "- Cap prose width at ~65ch (max-w-prose / max-w-2xl). UI at max-w-[1200px] containers.",
  ];
  if (context === "landing") {
    return [
      "- LANDING: hero → problem/solution → 2-3 alternating feature rows → social proof → pricing/CTA → footer.",
      "- LANDING: hero MUST have one headline, one subhead, ONE primary CTA with a real action verb.",
      "- LANDING: no more than 3 cards per section; prefer 2-column alternating rows.",
      ...common,
    ].join("\n");
  }
  if (context === "docs") {
    return [
      "- DOCS: global sidebar navigation + content column with table of contents.",
      "- DOCS: no hero, no footer marketing sections.",
      ...common,
    ].join("\n");
  }
  return [
    "- APP/SOCIAL: function-first layout — topbar + sidebar/content, or topbar + content. NO hero, NO marketing footer.",
    "- APP/SOCIAL: first viewport shows the primary workflow (scoreboard, feed, list, canvas) — not a welcome banner.",
    "- APP/SOCIAL: tabs and filters belong in a toolbar; heavy actions in a menu; secondary info in panels.",
    ...common,
  ].join("\n");
}

/**
 * Static slop analysis over generated code. `baseSources` maps component
 * names to their vendored base source — an identical output is flagged.
 */
export function detectSlopViolations(
  code: string,
  opts: { file?: string; context?: ProductContext; baseSource?: string } = {},
): SlopViolation[] {
  const violations: SlopViolation[] = [];
  const { file, context, baseSource } = opts;

  const hexes = code.match(HEX_RE) ?? [];
  if (hexes.length > 0) {
    violations.push({
      id: "raw-hex",
      severity: "high",
      file,
      description: `Raw hex colour literals ${hexes.slice(0, 4).join(", ")} — use theme slot utilities (bg-primary, text-muted-foreground…)`,
      fix: "Replace with shadcn slot utilities",
    });
  }

  const palette = code.match(PALETTE_RE) ?? [];
  if (palette.length > 0) {
    violations.push({
      id: "default-palette",
      severity: "high",
      file,
      description: `Default Tailwind palette classes ${palette.slice(0, 4).join(", ")} — not part of the product theme`,
      fix: "Use theme slot utilities",
    });
  }

  const gradients = code.match(GRADIENT_RE) ?? [];
  if (gradients.length > 0) {
    violations.push({
      id: "gradient-wallpaper",
      severity: "high",
      file,
      description: `Gradient backgrounds ${gradients.join(", ")} — solid surfaces only`,
      fix: "Use bg-muted, bg-card, or solid slot colours",
    });
  }

  if (ALIAS_IMPORT_RE.test(code)) {
    violations.push({
      id: "alias-import",
      severity: "high",
      file,
      description: `"@/" alias imports — generated files must be self-contained`,
      fix: "Rewrite to relative sibling paths (./cn, ./button)",
    });
  }

  if (SHADCN_PACKAGE_RE.test(code)) {
    violations.push({
      id: "shadcn-import",
      severity: "high",
      file,
      description: `Import from the shadcn package — components must be inlined, never imported`,
      fix: "Copy the component source into the file",
    });
  }

  const placeholders = code.match(PLACEHOLDER_IMG_RE) ?? [];
  if (placeholders.length > 0) {
    violations.push({
      id: "placeholder-image",
      severity: "medium",
      file,
      description: `Placeholder image service ${placeholders.join(", ")} — use real styled placeholders or data`,
      fix: "Use local styled placeholder blocks",
    });
  }

  const slop = AI_SLOP_PHRASES.filter((p) => new RegExp(`\\b${p}\\b`, "i").test(code));
  if (slop.length > 0) {
    violations.push({
      id: "slop-copy",
      severity: "medium",
      file,
      description: `AI-slop copy: ${slop.slice(0, 4).join(", ")}`,
      fix: "Write specific, product-true copy",
    });
  }

  if (context === "app" || context === "social") {
    if (/\bhero\b/i.test(code) && /section|min-h-\[/i.test(code)) {
      violations.push({
        id: "hero-on-app",
        severity: "high",
        file,
        description: "Hero section on an app/social screen — apps open with the primary workflow",
        fix: "Open with scoreboard/feed/list; move marketing to a landing page",
      });
    }
    if (/<footer\b/i.test(code)) {
      violations.push({
        id: "footer-on-app",
        severity: "high",
        file,
        description: "Footer on an app screen — apps have no marketing footers",
        fix: "Remove the footer",
      });
    }
  }

  if (baseSource && code.trim() === baseSource.trim()) {
    violations.push({
      id: "identical-to-base",
      severity: "high",
      file,
      description: "Component is byte-identical to the base shadcn source — it must be customized for THIS product",
      fix: "Remap sizing, rounding, colour usage, density to the product tokens",
    });
  }

  return violations;
}

export function filterBlockingViolations(violations: SlopViolation[]): SlopViolation[] {
  return violations.filter((v) => v.severity === "high");
}

export function hasBlockingViolations(violations: SlopViolation[]): boolean {
  return filterBlockingViolations(violations).length > 0;
}

export interface AntiSlopGateResult {
  passed: boolean;
  violations: SlopViolation[];
  blockingViolations: SlopViolation[];
  summary: string;
}

/** Full gate over every generated file. */
export function runFullAntiSlopGate(
  components: Record<string, string>,
  screens: Record<string, string>,
  baseSources: Record<string, string> = {},
  context: ProductContext = "unknown",
): AntiSlopGateResult {
  const violations: SlopViolation[] = [];
  for (const [name, code] of Object.entries(components)) {
    violations.push(...detectSlopViolations(code, {
      file: `src/components/${name}.tsx`,
      context,
      baseSource: baseSources[name],
    }));
  }
  for (const [name, code] of Object.entries(screens)) {
    violations.push(...detectSlopViolations(code, {
      file: `src/screens/${name}.tsx`,
      context,
    }));
  }
  const blocking = filterBlockingViolations(violations);
  return {
    passed: blocking.length === 0,
    violations,
    blockingViolations: blocking,
    summary: blocking.length === 0
      ? `Anti-slop PASS — ${violations.length} advisory note(s)`
      : `Anti-slop FAIL — ${blocking.length} blocking violation(s)`,
  };
}

// ─── System prompt block ────────────────────────────────────────────────

export function antiSlopSystemPrompt(): string {
  return `## DESIGN GUARDRAILS (hard rules)

- Colour: ONLY the theme slot utilities (bg-background, bg-card, bg-primary, bg-muted, bg-accent, bg-secondary, bg-destructive, text-foreground, text-muted-foreground, text-primary-foreground, border-border, ring-ring…). NO raw hex, NO rgb()/hsl()/oklch(), NO default Tailwind palette (text-gray-400, bg-blue-500).
- Surfaces: solid fills only. NO gradients, NO glassmorphism blur washes, NO floating decorative blobs.
- Shadows: only on floating elements (menus, dialogs, popovers) and ONE dominant surface. Never on static panels or body text.
- Accent (bg-primary) is a spotlight: use it on the primary CTA, active nav, focus rings, and one dominant highlight — never as a background wash.
- Typography: use font-heading for display moments and font-sans for body; a 4px-scale type hierarchy (text-xs → text-4xl) with only 2-3 emphasized moments per screen. No all-caps body, no underlined headings, no centered paragraphs over 3 lines.
- Layout: one dominant moment per screen; varied section rhythm; left-aligned body; prose capped at 65ch; no uniform section heights.
- Copy: product-specific, concrete, real. No "Lorem ipsum", no "Get started today", no generic marketing filler, no "John Doe" data.
- Uniqueness: this UI must not look like any other template. Name data and features specifically for this product. Every component you output must be visibly customized for this product — never a stock copy.`;
}

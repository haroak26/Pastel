/**
 * Picasso V2 Anti-Slop System
 *
 * Integrates Pastel's ANTI_SLOP guardrails with Picasso V2-specific rules.
 * Enforced at: token generation, component generation, screen composition, and visual QA.
 *
 * Severity levels:
 * - high: Auto-reject — halts pipeline, output cannot ship with this violation
 * - medium: Auto-fix if possible, flag in lint report if not
 * - low: Warning only, logged for review
 */

// ─── Typography Guardrails ─────────────────────────────────────────────────

export const FORBIDDEN_DISPLAY_FONTS = [
  "Inter",
  "Roboto",
  "system-ui",
  "-apple-system",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "BlinkMacSystemFont",
  "Segoe UI",
  "sans-serif", // as a standalone, not as fallback
] as const;

export const DISTINCTIVE_FONTS = [
  "DM Sans",
  "Geist",
  "Cabinet Grotesk",
  "Sora",
  "Clash Display",
  "Manrope",
  "Satoshi",
  "Switzer",
  "Fredoka",
  "Outfit",
  "Plus Jakarta Sans",
  "General Sans",
  "Author",
  "Clash Grotesk",
  "Supreme",
  "Zodiak",
  "Sentient",
  "Chillax",
  "Boska",
  "Ranade",
] as const;

export const BANNED_TYPOGRAPHY_PATTERNS = [
  { pattern: "bold entire paragraphs", severity: "high" as const, fix: "Use bold only for 1-2 keywords per paragraph" },
  { pattern: "all-caps body copy", severity: "high" as const, fix: "Use sentence case or title case for headings only" },
  { pattern: "underline headings", severity: "medium" as const, fix: "Remove underlines — use weight and size for hierarchy" },
  { pattern: "font-size below 12px", severity: "medium" as const, fix: "Minimum 12px for captions, 16px for body" },
  { pattern: "more than 2 font families", severity: "high" as const, fix: "Limit to 1 display + 1 body (max 2 total)" },
  { pattern: "thin weights (200, 300) in UI", severity: "medium" as const, fix: "Use only 400, 500, 600, 700" },
  { pattern: "black weights (800, 900) in body", severity: "medium" as const, fix: "Max weight 700 for body emphasis" },
  { pattern: "centered body text over 3 lines", severity: "medium" as const, fix: "Left-align body copy for readability" },
  { pattern: "variable line lengths", severity: "low" as const, fix: "Cap all prose at 65ch, UI at 80ch" },
];

// ─── Color Guardrails ──────────────────────────────────────────────────────

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

export const DISTINCTIVE_ACCENT_COLORS = {
  fintech: ["#0F766E", "#1E3A5F", "#166534", "#075985", "#0D3B66"],
  saas: ["#4338CA", "#7C3AED", "#0F766E", "#831843", "#1E3A5F"],
  creative: ["#E11D48", "#EA580C", "#16A34A", "#7C3AED", "#DB2777"],
  consumer: ["#EA580C", "#16A34A", "#E11D48", "#2563EB", "#D97706"],
  health: ["#059669", "#0F766E", "#6366F1", "#D97706", "#7C3AED"],
  social: ["#E11D48", "#7C3AED", "#EA580C", "#16A34A", "#DB2777"],
  devtools: ["#3B82F6", "#7C3AED", "#059669", "#E11D48", "#EA580C"],
} satisfies Record<string, string[]>;

export const BANNED_COLOR_PATTERNS = [
  { pattern: "gradient backgrounds on cards/sections", severity: "high" as const, fix: "Use solid surfaces or tonal washes (bg-muted/50)" },
  { pattern: "blue-to-purple gradient hero", severity: "high" as const, fix: "Use solid background + typography, or tonal brand color" },
  { pattern: "accent as background wash/decorative", severity: "high" as const, fix: "Accent only on interactive elements (CTAs, focus rings, active states)" },
  { pattern: "more than 1 accent color per project", severity: "high" as const, fix: "Pick ONE accent and use it consistently" },
  { pattern: "rainbow or multi-hue gradients", severity: "high" as const, fix: "Monochromatic or tonal gradients only, if any" },
  { pattern: "drop-shadow on static content", severity: "medium" as const, fix: "Shadows only on interactive/floating elements" },
  { pattern: "color alone conveying meaning", severity: "medium" as const, fix: "Always pair color with icon or text label" },
];

// ─── Layout Guardrails ─────────────────────────────────────────────────────

export const BANNED_LAYOUT_PATTERNS = [
  { pattern: "centered hero on app screens", severity: "high" as const, fix: "App screens use function-first layout: sidebar/topbar + content" },
  { pattern: "footer on app screens", severity: "high" as const, fix: "Remove footer — apps don't have footers (landing pages do)" },
  { pattern: "tabbar on desktop screens", severity: "high" as const, fix: "Desktop uses sidebar or topbar. Tabbar is MOBILE ONLY." },
  { pattern: "full-width content without max-width container", severity: "high" as const, fix: "Wrap content in max-w-[1280px] mx-auto" },
  { pattern: "uniform section heights throughout page", severity: "medium" as const, fix: "Vary section padding: py-12, py-16, py-24, py-32 — never the same twice" },
  { pattern: "hamburger-only nav on desktop", severity: "medium" as const, fix: "Show 3+ nav items on desktop. Hamburger is mobile-only fallback." },
  { pattern: "overflow hidden without scroll affordance", severity: "medium" as const, fix: "Show scrollbar or overflow indicator" },
  { pattern: "absolute positioning for primary layout", severity: "medium" as const, fix: "Use grid or flexbox" },
];

// ─── Component Guardrails ──────────────────────────────────────────────────

export const BANNED_COMPONENT_PATTERNS = [
  { pattern: "testimonial carousels with circular avatars + centered quotes", severity: "high" as const, fix: "Use 1-3 static testimonial cards, or single featured testimonial" },
  { pattern: "floating geometric blobs, dots, abstract shapes as decoration", severity: "high" as const, fix: "Remove decorative blobs — let content and surfaces provide visual interest" },
  { pattern: "\"Get started\" + \"Learn more\" button pairs", severity: "high" as const, fix: "One primary CTA with clear action verb specific to product" },
  { pattern: "more than 3 cards per screen", severity: "high" as const, fix: "Use tables, divided lists, rows, or custom compositions instead of card grids" },
  { pattern: "identical card grids (same icon size, title length, description)", severity: "high" as const, fix: "Vary card content, use different layouts per section" },
  { pattern: "placeholder images without label", severity: "medium" as const, fix: "Every placeholder must show dimensions + content description" },
  { pattern: "disabled buttons without explanation", severity: "medium" as const, fix: "Add tooltip, helper text, or inline message explaining WHY" },
  { pattern: "missing hover/focus/active states", severity: "high" as const, fix: "Every interactive element needs: hover, focus-visible ring, active/pressed, disabled states" },
  { pattern: "drop-shadow on static, non-interactive panels", severity: "medium" as const, fix: "Shadows reserved for cards, dropdowns, modals — not body text or sections" },
  { pattern: "circular avatars in non-social contexts", severity: "medium" as const, fix: "Use initials on tinted background; circle avatars only for social/person-centered UIs" },
  { pattern: "z-index above 50", severity: "low" as const, fix: "Use z-index scale: 0, 10, 20, 30, 40, 50 maximum" },
  { pattern: "!important in CSS", severity: "medium" as const, fix: "Resolve specificity at source. !important is a design failure." },
];

// ─── Content & Copy Guardrails ─────────────────────────────────────────────

export const AI_SLOP_PHRASES = [
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

export const BANNED_CONTENT_PATTERNS = [
  { pattern: "AI-slop phrases in copy", severity: "high" as const, fix: "Write specific, product-appropriate copy. No generic self-help or corporate buzzwords." },
  { pattern: "sparse data rendering (1-2 rows)", severity: "high" as const, fix: "Lists need 4+ rows, tables need 3+ rows. Populate with realistic data." },
  { pattern: "placeholder copy (\"Title\", \"Description\", \"Click here\")", severity: "high" as const, fix: "Use specific, product-domain copy throughout" },
  { pattern: "\"John Doe\" or \"Test User\" personas", severity: "medium" as const, fix: "Use realistic, diverse persona names appropriate to the product niche" },
  { pattern: "\"No data\" empty table with zero context", severity: "medium" as const, fix: "Empty states need illustration + heading + description + CTA" },
];

// ─── Navigation Guardrails ─────────────────────────────────────────────────

export const BANNED_NAVIGATION_PATTERNS = [
  { pattern: "\"Sign in\" / \"Get started\" marketing topbar links on app screens", severity: "high" as const, fix: "App screens have app navigation, not marketing CTAs" },
  { pattern: "footer as primary app navigation on desktop", severity: "high" as const, fix: "Desktop apps use sidebar, topbar, or contextual-header" },
  { pattern: "tabbar on desktop viewport", severity: "high" as const, fix: "Tabbar is MOBILE-ONLY. Desktop gets sidebar or topbar." },
  { pattern: "hamburger as only navigation on tablet+", severity: "high" as const, fix: "Show 3+ nav items inline at 768px+" },
];

// ─── Anti-Slop Severity Map ────────────────────────────────────────────────

export interface SlopViolation {
  id: string;
  category: "typography" | "color" | "layout" | "components" | "content" | "navigation";
  severity: "high" | "medium" | "low";
  description: string;
  fix: string;
  autoFix?: string;
}

export function detectSlopViolations(code: string, tokens?: Record<string, string>): SlopViolation[] {
  const violations: SlopViolation[] = [];

  // Check for forbidden fonts
  for (const font of FORBIDDEN_DISPLAY_FONTS) {
    if (code.includes(`fontFamily: '${font}'`) || code.includes(`font-family: ${font}`) || code.includes(`"${font}"`)) {
      if (font !== "sans-serif") {
        violations.push({
          id: `forbidden-font-${font.toLowerCase()}`,
          category: "typography",
          severity: "high",
          description: `Forbidden font "${font}" used as display type`,
          fix: `Replace with a distinctive font (DM Sans, Geist, Cabinet Grotesk, etc.)`,
        });
      }
    }
  }

  // Check for forbidden accent colors (hardcoded hex)
  for (const color of FORBIDDEN_ACCENT_COLORS) {
    if (code.includes(color.hex) || code.includes(color.hex.toLowerCase())) {
      violations.push({
        id: `forbidden-accent-${color.hex.replace("#", "")}`,
        category: "color",
        severity: color.severity,
        description: `Forbidden accent "${color.name}" (${color.hex}) used`,
        fix: `Replace with brand token var(--color-accent-500) or a distinctive accent`,
        autoFix: tokens?.["accent.500"]
          ? `var(--color-accent-500)`
          : undefined,
      });
    }
  }

  // Check for gradient backgrounds
  if (/\blinear-gradient\(/.test(code) || /\bradial-gradient\(/.test(code)) {
    // Allow gradients only on specific exceptions (hero images, brand moments in marketing)
    if (!code.includes("/* allow-gradient */")) {
      violations.push({
        id: "gradient-detected",
        category: "color",
        severity: "high",
        description: "Gradient background detected",
        fix: "Replace with solid surface or tonal wash (bg-muted/50). Gradients only allowed with explicit /* allow-gradient */ comment.",
      });
    }
  }

  // Check for testimonial carousels
  if ((code.includes("testimonial") && code.includes("carousel")) ||
      (code.includes("avatar") && code.includes("rounded-full") && code.includes("quote"))) {
    violations.push({
      id: "testimonial-carousel",
      category: "components",
      severity: "high",
      description: "Testimonial carousel pattern detected (circular avatars + centered quotes)",
      fix: "Replace with 1-3 static testimonial cards or a single featured testimonial",
    });
  }

  // Check for generic CTA pairs
  if (code.includes("Get started") && code.includes("Learn more")) {
    violations.push({
      id: "generic-cta-pair",
      category: "components",
      severity: "high",
      description: "Generic 'Get started' + 'Learn more' CTA pair detected",
      fix: "Use one specific primary CTA: action verb + product-specific outcome",
    });
  }

  // Check for hero-centric layout on app screens (centered text-4xl+)
  const centeredHeroPattern = /text-center[\s\S]{0,200}text-[45]xl/;
  if (centeredHeroPattern.test(code)) {
    violations.push({
      id: "centered-hero-on-app",
      category: "layout",
      severity: "high",
      description: "Centered hero text on what appears to be an app screen",
      fix: "App screens use function-first layouts with left-aligned headings",
    });
  }

  // Check for footer on app screens
  if (code.includes("<footer") || code.includes('className="footer"')) {
    violations.push({
      id: "footer-on-app",
      category: "navigation",
      severity: "high",
      description: "Footer element detected on an app screen",
      fix: "Remove footer — apps don't use footers (only marketing/landing pages do)",
    });
  }

  // Check for tabbar on desktop
  if (code.includes("tabbar") || code.includes("TabBar") || code.includes("bottom-nav")) {
    violations.push({
      id: "tabbar-detected",
      category: "navigation",
      severity: "high",
      description: "Tabbar/bottom navigation detected — may be inappropriate for desktop",
      fix: "Use sidebar or topbar for desktop. Tabbar is MOBILE ONLY.",
    });
  }

  // Check for AI-slop phrases
  for (const phrase of AI_SLOP_PHRASES) {
    if (code.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push({
        id: `ai-slop-${phrase.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`,
        category: "content",
        severity: "high",
        description: `AI-slop phrase detected: "${phrase}"`,
        fix: "Replace with specific, product-appropriate copy that a human would write",
      });
      break; // One violation per file is enough — don't spam
    }
  }

  // Check for placeholder content
  const placeholderPatterns = [
    { label: '"Title"', pattern: />Title</ },
    { label: '"Description"', pattern: />Description</ },
    { label: '"Click here"', pattern: /Click here/ },
    { label: '"Your name"', pattern: /Your name/ },
    { label: '"Choose an option"', pattern: /Choose an option/ },
  ];
  for (const { label, pattern } of placeholderPatterns) {
    if (pattern.test(code)) {
      violations.push({
        id: `placeholder-${label.toLowerCase().replace(/\s+/g, "-").replace(/"/g, "")}`,
        category: "content",
        severity: "medium",
        description: `Placeholder content "${label}" detected`,
        fix: "Replace with specific, product-domain content that would appear in production",
      });
      break;
    }
  }

  // Check for more than 3 Card components on a screen
  const cardMatches = code.match(/<Card|Card variant|card-/g);
  if (cardMatches && cardMatches.length > 6) { // >3 opening Card tags (with closing tags roughly doubled match count)
    violations.push({
      id: "too-many-cards",
      category: "components",
      severity: "high",
      description: "Too many Card components detected (>3 per screen)",
      fix: "Replace card grids with tables, lists, rows, or custom compositions. Max 3 cards per screen.",
    });
  }

  // Check for floating/decorative blobs
  if ((code.includes("blur-") && code.includes("absolute") && code.includes("rounded-full")) ||
      code.includes("floating-blob") || code.includes("decorative-blob")) {
    violations.push({
      id: "floating-blobs",
      category: "components",
      severity: "high",
      description: "Floating geometric blobs or decorative shapes detected",
      fix: "Remove decorative blobs. Visual interest comes from content and surface variety.",
    });
  }

  return violations;
}

// ─── Anti-Slop Filter for Lint Pass ────────────────────────────────────────

export function filterBlockingViolations(violations: SlopViolation[]): SlopViolation[] {
  return violations.filter((v) => v.severity === "high");
}

export function hasBlockingViolations(violations: SlopViolation[]): boolean {
  return violations.some((v) => v.severity === "high");
}

// ─── System Prompt Injection for Model Guidance ────────────────────────────

export function antiSlopSystemPrompt(): string {
  return `DESIGN GUARDRAILS — violate any and the output will be rejected.

TYPOGRAPHY
- Never use Inter, Roboto, system-ui, Arial, or Helvetica as the display font.
- Pick distinctive: DM Sans, Geist, Cabinet Grotesk, Sora, Clash Display, Fredoka, Satoshi, Switzer, Manrope.
- Max 2 type families per project. Body text: min 16px.
- Weight discipline: body 400, emphasis 500/600, headings max 700.
- Never bold entire paragraphs, never underline headings, never all-caps body copy.

COLOUR
- Never use #3B82F6 (Tailwind blue), #4F46E5 (Indigo), #A78BFA (Purple), #6366F1 as accent.
- Pick distinctive: deep teal, warm amber, rich burgundy, muted olive, rust, plum, sage, warm green.
- One accent per project. Accent appears 3-7 times per screen max.
- Never use pure black (#000) or pure white (#fff) — use neutral-950 and neutral-50.
- No gradients on cards, sections, or surfaces. Tonal washes only.
- Every color from a CSS custom property. No hex/rgb/hsl hardcoded.

LAYOUT
- Design for 1280px container, centered with mx-auto.
- App screens use FUNCTION-FIRST layout: sidebar + content. NO centered heroes, NO footers.
- Landing pages use NARRATIVE flow: hero → features → testimonials → CTA → footer.
- Vary section heights intentionally. Uniform = template.
- Never center-align body copy over 3 lines.
- No full-width content without max-width container.

COMPONENTS
- Maximum 3 cards per screen. Prefer tables, lists, rows over card grids.
- Never testimonial carousels with circular avatars + centered quotes.
- Never "Get started" + "Learn more" button pairs.
- Every interactive element needs: hover, focus-visible ring, active, disabled states.
- Never floating blobs, dots, or abstract decorative shapes.

NAVIGATION
- Desktop apps: Sidebar (default) or Topbar. NEVER tabbar. NEVER footer nav.
- Mobile apps: Tabbar (3-5 destinations) is appropriate.
- Marketing pages: Header nav (logo + links + CTA). May use footer.

CONTENT
- No AI-slop phrases: "Unlock your potential", "seamless experience", "innovative solution", etc.
- No placeholder text: "Title", "Description", "Click here", "Your name".
- Real product data: lists 4+ rows, tables 3+ rows, no sparse sections.
- Specific, human copy that a real person would write.`;
}

// ─── Product Context Detection ─────────────────────────────────────────────

export type ProductContext = "app" | "landing" | "docs" | "social" | "unknown";

export function detectProductContext(brief: {
  productName: string;
  description: string;
  platform: string;
  niche: string;
}): ProductContext {
  const desc = brief.description.toLowerCase();
  const platform = brief.platform.toLowerCase();

  if (platform === "mobile" && !desc.includes("landing") && !desc.includes("marketing")) {
    return "app";
  }

  if (desc.includes("dashboard") || desc.includes("workflow") || desc.includes("primary screen") ||
      desc.includes("app screen") || desc.includes("tool") || desc.includes("platform") && desc.includes("log in")) {
    return "app";
  }

  if (desc.includes("hero section") || desc.includes("conversion") || desc.includes("cta") ||
      desc.includes("landing page") || desc.includes("marketing") || desc.includes("homepage")) {
    return "landing";
  }

  if (desc.includes("api") || desc.includes("reference") || desc.includes("documentation") ||
      desc.includes("guide") || desc.includes("tutorial") && desc.includes("search")) {
    return "docs";
  }

  if (desc.includes("feed") || desc.includes("messaging") || desc.includes("social") ||
      desc.includes("connections") || desc.includes("community")) {
    return "social";
  }

  if (brief.platform === "marketing") return "landing";
  if (brief.platform === "web+mobile" && !desc.includes("hero")) return "app";

  return "unknown";
}

// ─── Anti-Slop Composition Rules by Product Context ────────────────────────

export function contextCompositionRules(context: ProductContext): string {
  switch (context) {
    case "app":
      return `APP MODE RULES:
- Layout: Sidebar (240-280px fixed left) + Content area (flex-1). OR Topbar for lightweight apps.
- NO centered hero text. NO marketing CTAs. NO footers.
- Home screen must feel like a functional product surface.
- Data-dense: lists 4+ rows, tables 3+ rows. Fill 50%+ of viewport.
- Navigation: Active state visible. Section groups collapsible.
- Surfaces: Band (overview) → Plain (data) → Card (quick actions) → Band (activity).
- Buttons: Specific action labels ("Create project", "Add transaction", "Send message").`;
    case "landing":
      return `LANDING MODE RULES:
- Layout: Narrative flow. Hero → Features → Social Proof → Pricing → CTA → Footer.
- Hero: Headline (48-64px, display font, 2 lines max) + Subheadline (20-24px) + Primary CTA (48-56px).
- Features: 3-4 columns OR alternating 2-column rows. Benefit-focused, not feature-spec.
- Testimonials: 1-3 static cards, deep quotes. NO carousels with circular avatars.
- Footer: Multi-column (product, company, resources, legal). Logo + tagline.
- CTA: One primary per section. Consistent destination. "Start free trial", "Get a demo".`;
    case "docs":
      return `DOCS MODE RULES:
- Layout: Sticky sidebar (240-280px) + Content (max-w-prose, ~700px) + Optional TOC right.
- Sidebar: Search bar prominent at top. Collapsible section groups. Active page highlighted.
- Content: Left-aligned. max-w-prose. Code blocks with syntax highlighting + copy button.
- Typography: Body 16-18px, generous line-height (1.6-1.75), code 14px mono.
- Search: Full-site, CMD+K, results grouped by type.
- NO marketing CTAs. NO decorative elements. NO centered text in reading areas.`;
    case "social":
      return `SOCIAL MODE RULES:
- Layout: 2-3 column (sidebar + feed center 600-680px + optional secondary sidebar).
- Content cards: Avatar (32-40px) + Name + Timestamp + Body + Media + Interaction bar.
- Real-time: Online dots, typing indicators, new message badges, read receipts.
- Empty states: "Follow people to see posts" + suggestions. Never blank feed.
- Navigation: Sidebar (desktop) or Tabbar (mobile — 5 tabs: feed, search, compose, notifications, profile).
- Engagement: Like animation (scale pop + color fill, 200ms). Comment inline expansion.`;
    default:
      return `DEFAULT MODE RULES:
- Assume APP context unless explicitly landing/marketing.
- Use sidebar + content layout. NO marketing heroes. NO footers.
- Data-rich, function-first. Populate with realistic content.`;
  }
}

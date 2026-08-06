import { z } from "zod";
import type { CompanyManifest } from "./knowledge/manifest-schema";

/**
 * V6 pipeline schemas.
 *
 * Every artifact flowing between agents is zod-validated here. Versioned so a
 * schema change never silently corrupts a persisted run.
 */

// ── Design configuration (from the brief) ────────────────────────────────

export const v6SelectionSchema = z.object({
  companySlug: z.string(),
  secondaryInspiration: z.array(z.string()).optional(),
  mode: z.enum(["light", "dark"]),
  hue: z.number().int().min(0).max(359),
  productTitle: z.string(),
  productType: z.string(),
  description: z.string(),
});

export type V6Selection = z.infer<typeof v6SelectionSchema>;

export const themeTokensSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  card: z.string(),
  cardForeground: z.string(),
  popover: z.string(),
  popoverForeground: z.string(),
  primary: z.string(),
  primaryForeground: z.string(),
  secondary: z.string(),
  secondaryForeground: z.string(),
  muted: z.string(),
  mutedForeground: z.string(),
  accent: z.string(),
  accentForeground: z.string(),
  destructive: z.string(),
  destructiveForeground: z.string(),
  success: z.string(),
  successSubtle: z.string(),
  warning: z.string(),
  warningSubtle: z.string(),
  border: z.string(),
  input: z.string(),
  ring: z.string(),
  chart: z.array(z.string()).min(3).max(6),
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;

export interface ResolvedTheme {
  manifest: CompanyManifest;
  tokens: ThemeTokens;
  mode: "light" | "dark";
  selection: Pick<V6Selection, "mode" | "hue">;
  cssVars: Record<string, string>;
  fontFamilies: string[];
  colors: {
    primary: string;
    primaryHover: string;
    accent: string;
    accentHover: string;
    destructive: string;
    destructiveHover: string;
    success: string;
    warning: string;
    chart: string[];
  };
}

// ── Design tokens (V14 design agent — before the brief) ─────────────────
//
// V14: every run's design system is an explicit artifact produced by the
// design agent BEFORE the brief: brand colors, radius scale, type scale,
// control sizing, section rhythm, and fonts. Nothing about the design is
// hardcoded to a company — the company manifests become *hints* (prompt
// scoring) and reference imagery, never the default theme.

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "colors must be 6-digit hex (#RRGGBB)");

export const designTokensSchema = z.object({
  version: z.literal("1.0.0"),
  mode: z.enum(["light", "dark"]),
  colors: z.object({
    background: hexColorSchema,
    foreground: hexColorSchema,
    card: hexColorSchema,
    cardForeground: hexColorSchema,
    popover: hexColorSchema,
    popoverForeground: hexColorSchema,
    primary: hexColorSchema,
    primaryForeground: hexColorSchema,
    secondary: hexColorSchema,
    secondaryForeground: hexColorSchema,
    muted: hexColorSchema,
    mutedForeground: hexColorSchema,
    accent: hexColorSchema,
    accentForeground: hexColorSchema,
    destructive: hexColorSchema,
    destructiveForeground: hexColorSchema,
    success: hexColorSchema,
    successSubtle: hexColorSchema,
    warning: hexColorSchema,
    warningSubtle: hexColorSchema,
    border: hexColorSchema,
    input: hexColorSchema,
    ring: hexColorSchema,
    chart: z.array(hexColorSchema).min(3).max(6),
  }),
  radius: z.object({
    sm: z.number().int().min(0).max(24),
    md: z.number().int().min(0).max(32),
    lg: z.number().int().min(0).max(48),
    xl: z.number().int().min(0).max(64),
    full: z.literal(9999),
  }),
  typeScale: z.object({
    xs: z.number().min(10).max(14),
    sm: z.number().min(12).max(16),
    base: z.number().min(14).max(18),
    lg: z.number().min(16).max(22),
    xl: z.number().min(18).max(26),
    "2xl": z.number().min(20).max(34),
    "3xl": z.number().min(24).max(42),
    "4xl": z.number().min(28).max(52),
  }),
  /** Control-height scale in px — the interactive element ladder (8px grid). */
  control: z.object({
    sm: z.number().int().min(28).max(40),
    md: z.number().int().min(36).max(48),
    lg: z.number().int().min(44).max(60),
  }),
  sectionPaddingY: z.number().int().min(32).max(96),
  sectionGap: z.number().int().min(16).max(64),
  fonts: z.object({
    display: z.string().min(1).max(64),
    body: z.string().min(1).max(64),
    mono: z.string().min(1).max(64).optional(),
  }),
  rationale: z.string().max(240).optional(),
});

export type DesignTokens = z.infer<typeof designTokensSchema>;

/** WCAG-AA pair requirements the design agent's colors must satisfy
 * deterministically after the model call (body text ≥4.5:1). */
export const DESIGN_TOKEN_CONTRAST_PAIRS: Array<{ label: string; fg: Exclude<keyof DesignTokens["colors"], "chart">; bg: Exclude<keyof DesignTokens["colors"], "chart">; min: number }> = [
  { label: "foreground/background", fg: "foreground", bg: "background", min: 4.5 },
  { label: "muted/background", fg: "mutedForeground", bg: "background", min: 4.5 },
  { label: "primary/primary-foreground", fg: "primaryForeground", bg: "primary", min: 4.5 },
  { label: "primary/background", fg: "primary", bg: "background", min: 4.5 },
  { label: "accent/accent-foreground", fg: "accentForeground", bg: "accent", min: 4.5 },
  { label: "success/success-subtle", fg: "success", bg: "successSubtle", min: 4.5 },
  { label: "warning/warning-subtle", fg: "warning", bg: "warningSubtle", min: 4.5 },
];

// ── Data plan (V14 design-data agent — after the brief) ──────────────────
//
// V14: ALL page content is generated per run by the data agent (mid-tier
// Luna) — people, metrics, series, rows, activity, detail fields, settings,
// search/empty states, social proof (reviews + heading), trust items, and
// CTAs. Nothing about the page's content is pre-baked anymore; the domain
// packs in `lib/domains.ts` are the deterministic FALLBACK only.

export const dataPersonSchema = z.object({
  name: z.string().trim().min(1).max(48),
  role: z.string().trim().min(1).max(40),
  email: z.string().trim().min(3).max(64),
  initials: z.string().max(4).optional(),
  hue: z.number().int().min(0).max(359).optional(),
});

export const dataMetricSchema = z.object({
  label: z.string().trim().min(1).max(32),
  unit: z.string().trim().max(12),
  value: z.string().trim().min(1).max(16),
  delta: z.number(),
  positive: z.boolean(),
  note: z.string().trim().min(1).max(60),
  spark: z.array(z.number()).min(4).max(20),
});

export const dataSeriesSchema = z.object({
  label: z.string().trim().min(1).max(40),
  unit: z.string().trim().max(12),
  points: z.array(z.object({ x: z.string().min(1).max(8), y: z.number() })).min(4).max(16),
});

export const dataRowSchema = z.object({
  id: z.string().trim().min(1).max(24),
  name: z.string().trim().min(1).max(48),
  detail: z.string().trim().min(1).max(80),
  amount: z.string().trim().min(1).max(24),
  status: z.string().trim().min(1).max(24),
  date: z.string().trim().min(1).max(24),
  owner: z.string().trim().max(48).optional(),
  fields: z.array(z.string()).max(8).optional(),
  dates: z.string().max(32).optional(),
  guests: z.string().max(24).optional(),
});

export const dataReviewSchema = z.object({
  name: z.string().trim().min(1).max(48),
  rating: z.number().min(1).max(5),
  text: z.string().trim().min(8).max(200),
});

export const dataPlanSchema = z.object({
  version: z.literal("1.0.0"),
  people: z.array(dataPersonSchema).min(6).max(12),
  metrics: z.array(dataMetricSchema).length(4),
  series: z.array(dataSeriesSchema).min(2).max(5),
  rows: z.array(dataRowSchema).min(6).max(12),
  activity: z.array(z.string().trim().min(4)).min(4).max(12),
  detailFields: z.array(z.string().trim().min(1)).min(4).max(8),
  detailValues: z.array(z.string().trim().min(1)).min(4).max(8),
  settingsSections: z.array(z.object({
    title: z.string().trim().min(1).max(40),
    items: z.array(z.object({
      label: z.string().trim().min(1).max(48),
      value: z.string().trim().min(1).max(32),
      control: z.enum(["toggle", "select", "text"]),
    })).min(2).max(6),
  })).min(2).max(3),
  searchPlaceholder: z.string().trim().min(1).max(48),
  emptyTitle: z.string().trim().min(1).max(48),
  emptyBody: z.string().trim().min(1).max(120),
  reviews: z.array(dataReviewSchema).min(4).max(8),
  reviewHeading: z.string().trim().min(1).max(60),
  trustItems: z.array(z.string().trim().min(1).max(48)).min(3).max(5),
  primaryCta: z.string().trim().min(1).max(24),
  homeCta: z.string().trim().min(1).max(24),
  priceSuffix: z.string().trim().max(12).optional(),
});

export type DataPlan = z.infer<typeof dataPlanSchema>;

// ── Clarify ──────────────────────────────────────────────────────────────

export const clarifyOptionSchema = z.object({
  label: z.string().trim().min(1).max(48),
  description: z.string().trim().min(1).max(140),
});

export const clarifyQuestionSchema = z.object({
  id: z.string().trim().regex(/^[a-z][a-z0-9_]{1,40}$/),
  title: z.string().trim().min(3).max(72),
  question: z.string().trim().min(12).max(220),
  whyItMatters: z.string().trim().min(12).max(180),
  options: z.array(clarifyOptionSchema).min(2).max(4),
  placeholder: z.string().trim().min(3).max(100).optional(),
});

export const suggestedCompanySchema = z.object({
  slug: z.string(),
  name: z.string(),
  score: z.number().int().min(0),
  reason: z.string().max(180).optional(),
});

export const clarifyResultSchema = z.object({
  questions: z.array(clarifyQuestionSchema).max(4),
  suggestedCompanies: z.array(suggestedCompanySchema).max(4),
});

export type ClarifyQuestion = z.infer<typeof clarifyQuestionSchema>;
export type ClarifyResult = z.infer<typeof clarifyResultSchema>;

// ── Product brief ────────────────────────────────────────────────────────

export const productBriefSchema = z.object({
  version: z.literal("1.0.0"),
  title: z.string().trim().min(1),
  productType: z.string().trim().min(1),
  description: z.string().trim().min(1),
  audience: z.object({
    primary: z.string().trim().min(1),
    needs: z.array(z.string().trim().min(1)).min(1),
  }),
  goals: z.array(z.string().trim().min(1)).min(1).max(8),
  features: z.array(z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    priority: z.enum(["critical", "high", "medium", "low"]),
  })).min(1).max(20),
  platform: z.enum(["mobile", "desktop", "all"]),
  screenPurposes: z.array(z.object({
    id: z.string().trim().min(1),
    purpose: z.string().trim().min(1),
  })).min(2).max(6),
  copyDirection: z.string().trim().min(1).optional(),
  designLanguage: z.string().trim().min(1),
  inspiration: z.object({
    primary: z.string().trim().min(1),
    secondary: z.array(z.string()).optional(),
    rationale: z.string().max(240).optional(),
  }),
});

export type ProductBrief = z.infer<typeof productBriefSchema>;

// ── Wireframe ────────────────────────────────────────────────────────────

export const blockInstanceSchema = z.object({
  block: z.string(),
  variant: z.string(),
  ratio: z.string().optional(),
  emphasis: z.boolean().optional(),
  content: z.string().optional(),
  component: z.string().optional(),
});

export type BlockInstance = z.infer<typeof blockInstanceSchema>;

export const wireframeScreenSchema = z.object({
  id: z.string(),
  archetype: z.enum(["app-dashboard", "list-detail", "settings-forms", "landing", "catalog", "article"]),
  title: z.string(),
  purpose: z.string(),
  nav: z.enum(["sidebar", "topbar", "sidebar+topbar", "none", "tabbar"]),
  blocks: z.array(blockInstanceSchema).min(3).max(8),
});

export type WireframeScreen = z.infer<typeof wireframeScreenSchema>;

export const wireframePlanSchema = z.object({
  version: z.literal("1.0.0"),
  screens: z.array(wireframeScreenSchema).min(2).max(6),
  rationale: z.string().max(300).optional(),
});

export type WireframePlan = z.infer<typeof wireframePlanSchema>;

// ── UX design (wireframe + UX agent → composer input) ────────────────────
//
// V9: the UX design plan describes HOW the wireframe renders — one dominant
// moment per screen, which sections use which visual surface (band/card/rows/
// tiles/toolbar/gallery), which sections pair into a two-up grid row, and
// which column sticks. The composer consumes it; `enforceUxDesign` in
// lib/ux-design.ts guarantees it matches the canonical two-screen model.

export const uxSectionSchema = z.object({
  /** Block catalog name ("list", "detail", "cta", …). */
  block: z.string(),
  variant: z.string().optional(),
  /** Visual surface the composer renders this section on. */
  surface: z.enum(["band", "card", "rows", "tiles", "toolbar", "gallery"]).optional(),
  /** Pair this section side-by-side with the next block (two-up grid row). */
  pair: z.boolean().optional(),
  /** Render as a sticky column (detail summary cards). */
  sticky: z.boolean().optional(),
  emphasis: z.boolean().optional(),
});

export const uxScreenSchema = z.object({
  screenId: z.string(),
  layout: z.object({
    /** V10/V14 layout structure per screen role:
     * home: "dashboard-led" | "feed-led" | "workspace-led" |
     * "catalog-classic" | "catalog-rail" | "catalog-featured"
     * detail: "detail-classic" (legacy values stay valid). */
    structure: z.enum(["dashboard-led", "feed-led", "workspace-led", "catalog-classic", "catalog-rail", "catalog-featured", "detail-classic", "detail-asymmetric", "single-column", "two-column", "split"]),
    /** The one dominant moment — "block:variant" ("list:cards", "media:gallery"). */
    dominantMoment: z.string().optional(),
    sections: z.array(uxSectionSchema).min(1).max(10),
  }),
  notes: z.string().max(240).optional(),
});

export const uxDesignSchema = z.object({
  version: z.literal("1.0.0"),
  screens: z.array(uxScreenSchema).min(2).max(6),
  rationale: z.string().max(300).optional(),
});

export type UxDesignPlan = z.infer<typeof uxDesignSchema>;
export type UxScreenDesign = z.infer<typeof uxScreenSchema>;
export type UxSectionDesign = z.infer<typeof uxSectionSchema>;

// ── Component inventory (wireframe output → planner input) ───────────────

export const componentInventorySchema = z.object({
  version: z.literal("1.0.0"),
  components: z.array(z.object({
    name: z.string().trim().min(1),
    purpose: z.string().trim().min(1),
    basedOn: z.string().trim().min(1),
    usedBy: z.array(z.string()).min(1),
  })).min(6).max(8),
});

export type ComponentInventory = z.infer<typeof componentInventorySchema>;

// ── Per-component UI spec (planner output → builder input) ───────────────

export const componentUISpecSchema = z.object({
  name: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  basedOn: z.string().trim().min(1),
  /** Screen ids that mount this component (from the inventory). */
  usedBy: z.array(z.string()).optional(),
  props: z.array(z.object({
    name: z.string().trim().min(1),
    type: z.string().trim().min(1),
    default: z.string().optional(),
  })),
  variants: z.array(z.object({
    name: z.string().trim().min(1),
    purpose: z.string().trim().min(1),
  })).min(2).max(5),
  states: z.array(z.enum(["default", "hover", "active", "focus", "disabled", "loading", "empty", "error"])),
  /** V10: one line of art direction — how this component should feel in THIS
   * product (the builder's creative brief). */
  designIntent: z.string().max(240).optional(),
  notes: z.string().optional(),
});

export type ComponentUISpec = z.infer<typeof componentUISpecSchema>;

// ── Copy plan ────────────────────────────────────────────────────────────

export const copyScreenSchema = z.object({
  screenId: z.string(),
  headline: z.string(),
  overline: z.string().optional(),
  description: z.string().optional(),
  primaryCta: z.string().optional(),
  secondaryCta: z.string().optional(),
  tableColumns: z.array(z.string()).optional(),
  tableTitle: z.string().optional(),
  emptyTitle: z.string().optional(),
  emptyBody: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  /** Label + unit for each stat slot (must be distinct labels). */
  statLabels: z.array(z.object({
    label: z.string(),
    unit: z.string().optional(),
  })).optional(),
  chartTitle: z.string().optional(),
  chartSubtitle: z.string().optional(),
  chartUnit: z.string().optional(),
  /** Label rows for the detail pane (Amount/Date/Owner → product fields). */
  detailFields: z.array(z.string()).optional(),
  /** Settings sections for settings screens (goals/units/notifications…). */
  settingsSections: z.array(z.object({
    title: z.string(),
    items: z.array(z.object({
      label: z.string(),
      value: z.string(),
      control: z.enum(["toggle", "select", "text"]),
    })),
  })).optional(),
  /** Single-word slogan for statement bands ("PUSH", "FASTER"). */
  slogan: z.string().optional(),
  searchPlaceholder: z.string().optional(),
});

export const copyPlanSchema = z.object({
  productTitle: z.string(),
  tagline: z.string().optional(),
  screens: z.array(copyScreenSchema).min(2).max(6),
});

export type CopyPlan = z.infer<typeof copyPlanSchema>;

// ── Review ───────────────────────────────────────────────────────────────

export const reviewIssueSchema = z.object({
  target: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  category: z.string(),
  description: z.string(),
});

export const reviewResultSchema = z.object({
  passed: z.boolean(),
  score: z.number().int().min(0).max(100),
  decision: z.enum(["APPROVE", "RETURN_TO_BUILDER"]),
  requiredFixes: z.array(z.string()),
  issues: z.array(reviewIssueSchema),
  summary: z.string().optional(),
});

export type V6ReviewResult = z.infer<typeof reviewResultSchema>;

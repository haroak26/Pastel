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
    /** V10 layout structure per screen role:
     * home: "catalog-classic" | "catalog-rail" | "catalog-featured"
     * detail: "detail-classic" (legacy values stay valid). */
    structure: z.enum(["catalog-classic", "catalog-rail", "catalog-featured", "detail-classic", "detail-asymmetric", "single-column", "two-column", "split"]),
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

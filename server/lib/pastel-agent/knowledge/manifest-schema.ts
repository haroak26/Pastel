import { z } from "zod";

/**
 * V6 knowledge base — company manifest schema.
 *
 * Every company in `knowledge/companies/<slug>/` pairs a detailed human
 * `design.md` (persisted as a run doc and used by the review agent) with a
 * structured `manifest.ts` compiled into compact prompt blocks. Manifests
 * are zod-validated at load time so a malformed company fails loudly.
 */

export const companyTokensSchema = z.object({
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

export type CompanyTokens = z.infer<typeof companyTokensSchema>;

export const blockRecipeSchema = z.object({
  block: z.string(),
  variant: z.string(),
  /** Column ratio hint for split blocks ("7/5", "1/1"). */
  ratio: z.string().optional(),
  /** This block is the screen's dominant moment. */
  emphasis: z.boolean().optional(),
  /** Content hint: which copy/data slots this block needs. */
  content: z.string().optional(),
  /** For the "custom" block: the generated component to mount. */
  component: z.string().optional(),
});

export type BlockRecipe = z.infer<typeof blockRecipeSchema>;

export const screenRecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  purpose: z.string(),
  nav: z.enum(["sidebar", "topbar", "sidebar+topbar", "none", "tabbar"]),
  blocks: z.array(blockRecipeSchema).min(3).max(8),
  /** When to reach for this recipe (the wireframe agent's selection hint). */
  guidance: z.string().optional(),
});

export type ScreenRecipe = z.infer<typeof screenRecipeSchema>;

export const companyManifestSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  tagline: z.string(),
  /** Scoring tags — a prompt containing these words suggests this company. */
  bestFor: z.array(z.string()),
  /** Hue of the primary/accent (degrees) — reference point for hue rotation. */
  hueBase: z.number().min(0).max(359),
  radius: z.object({ sm: z.number(), md: z.number(), lg: z.number(), xl: z.number(), full: z.number() }),
  typeScale: z.object({
    xs: z.number(), sm: z.number(), base: z.number(), lg: z.number(),
    xl: z.number(), "2xl": z.number(), "3xl": z.number(), "4xl": z.number(),
  }),
  sectionPaddingY: z.number(),
  sectionGap: z.number(),
  fonts: z.object({ display: z.string(), body: z.string(), mono: z.string().optional() }),
  light: companyTokensSchema,
  dark: companyTokensSchema,
  /** Composition rules injected into planner/builder/assemble/review prompts. */
  rules: z.array(z.string()),
  /** Signature moves for this look. */
  signatureMoves: z.array(z.string()),
  /** Patterns the brand never uses. */
  avoidPatterns: z.array(z.string()),
  /** v16: product jobs this visual language adapts to well. */
  suitableModes: z.array(z.string()).optional(),
  /** v16: visual moves independent of any one page archetype. */
  layoutMoves: z.array(z.string()).optional(),
  interactionMoves: z.array(z.string()).optional(),
  mediaDirection: z.string().optional(),
  density: z.enum(["quiet", "balanced", "dense"]).optional(),
  /** Voice & tone guidance for copy. */
  voiceAndTone: z.string(),
  /** Per-archetype screen recipes — the wireframe agent's strong prior. */
  screenRecipes: z.record(z.string(), screenRecipeSchema),
  /** Component-name → guidance for planner + builder prompts. */
  componentGuidance: z.record(z.string(), z.string()),
});

export type CompanyManifest = z.infer<typeof companyManifestSchema>;

export const companyCatalogSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  swatches: z.array(z.string()).min(2).max(6),
  /** V10: auth'd URL to the company's preview.png (when shipped). */
  imageUrl: z.string().optional(),
});

export type CompanyCatalog = z.infer<typeof companyCatalogSchema>;

import { z } from "zod";

/**
 * Maxi Agent v25 — the DesignBlueprint.
 *
 * ONE structured document from ONE strong-model call (Wave 0 · Direction)
 * that replaces v24's plan → genome → planner → data → copy chain:
 *
 *   · brief        — what the product is
 *   · concepts[3]  — three DISTINCT named design POVs; one is chosen
 *   · screens      — 2-4 screen intents (the model decides the set)
 *   · componentManifest — the API contract Wave-1 authors code against
 *                    (screens start before components finish, so the
 *                    manifest — not built code — is the interface)
 *   · dataSchema   — currency/units/dateRange + exemplar content the
 *                    deterministic generator expands into a dense dataset
 *
 * Everything downstream is deterministic: WCAG repair, divergence veto,
 * token expansion, manifest lint, dataset generation.
 */

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be 6-digit hex (#RRGGBB)");

const slug = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9-]*$/, "must be a lowercase slug (a-z, 0-9, -)");

const componentId = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Za-z0-9]*$/, "must be a PascalCase identifier");

// ── Concepts ───────────────────────────────────────────────────────────────

export const CONCEPT_DENSITY = ["compact", "balanced", "airy"] as const;
export const CONCEPT_CORNER = ["sharp", "soft", "pill"] as const;
export const CONCEPT_MOTION = ["still", "subtle", "lively"] as const;

export const conceptPaletteSchema = z.object({
  background: hexColor,
  foreground: hexColor,
  card: hexColor,
  primary: hexColor,
  primaryForeground: hexColor,
  accent: hexColor,
  accentForeground: hexColor,
  muted: hexColor,
  mutedForeground: hexColor,
  border: hexColor,
  ring: hexColor,
});

export const conceptSchema = z.object({
  /** 2-4 evocative words — the concept's name ("ink-and-air pace journalism"). */
  name: z.string().trim().min(2).max(48),
  /** The POV paragraph: what this design believes, 2-3 sentences. */
  thesis: z.string().trim().min(40).max(600),
  palette: conceptPaletteSchema,
  /** Real Google Fonts — the pairing IS the voice. */
  fonts: z.object({
    display: z.string().trim().min(2).max(48),
    body: z.string().trim().min(2).max(48),
  }),
  density: z.enum(CONCEPT_DENSITY),
  cornerLanguage: z.enum(CONCEPT_CORNER),
  motion: z.enum(CONCEPT_MOTION),
  /** 2-3 concrete signature moves that make this concept recognizable. */
  signatureMoves: z.array(z.string().trim().min(8).max(160)).min(2).max(3),
});

export type Concept = z.infer<typeof conceptSchema>;

// ── Brief ──────────────────────────────────────────────────────────────────

export const PRODUCT_MODES = ["browse", "transact", "track", "create", "operate", "learn", "social"] as const;

export const blueprintBriefSchema = z.object({
  title: z.string().trim().min(1).max(48),
  productType: z.string().trim().min(3).max(80),
  mode: z.enum(PRODUCT_MODES),
  description: z.string().trim().min(10).max(400),
  audience: z.string().trim().min(3).max(160),
  /** The product voice — one directive sentence the authors write under. */
  copyDirection: z.string().trim().min(10).max(240),
  inspiration: z.object({
    primary: slug,
    secondary: z.array(slug).max(2).optional(),
  }),
});

// ── Screens ────────────────────────────────────────────────────────────────

export const SCREEN_NAV = ["sidebar", "topbar", "sidebar+topbar", "none"] as const;

export const blueprintScreenSchema = z.object({
  id: slug,
  /** What this screen is for — the intent paragraph the author designs against. */
  intent: z.string().trim().min(20).max(400),
  nav: z.enum(SCREEN_NAV),
  /** The ONE display-scale moment this screen is built around. */
  dominantMoment: z.string().trim().min(8).max(240),
});

export type BlueprintScreen = z.infer<typeof blueprintScreenSchema>;

// ── Component manifest — the Wave-1 API contract ──────────────────────────

export const propTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "array",
  "object",
  "node",
  "func",
]);

export const manifestPropSchema = z.object({
  name: z.string().trim().regex(/^[a-z][A-Za-z0-9]*$/, "must be a camelCase prop name"),
  type: propTypeSchema,
  required: z.boolean(),
  description: z.string().trim().max(120).optional(),
});

export const manifestComponentSchema = z.object({
  name: componentId,
  /** primitive = Button/Input/Avatar-class; component = product-specific. */
  kind: z.enum(["primitive", "component"]),
  /** The props contract — screens code against this, components implement it. */
  props: z.array(manifestPropSchema).max(10),
  /** One line of art direction for the author. */
  intent: z.string().trim().min(5).max(240),
  usedBy: z.array(slug).min(1),
});

export type ManifestComponent = z.infer<typeof manifestComponentSchema>;

// ── Data schema — exemplars the generator expands ─────────────────────────

export const exemplarRowSchema = z.object({
  title: z.string().trim().min(2).max(48),
  subtitle: z.string().trim().min(2).max(80),
  meta: z.string().trim().min(1).max(48),
  status: z.string().trim().min(1).max(24),
  amount: z.string().trim().max(24).optional(),
});

export const exemplarMetricSchema = z.object({
  label: z.string().trim().min(2).max(32),
  value: z.string().trim().min(1).max(16),
  unit: z.string().trim().max(12),
  delta: z.number().min(-99).max(99),
  positive: z.boolean(),
});

export const dataSchemaSchema = z.object({
  /** ISO currency code when amounts exist (USD, EUR…). */
  currency: z.string().trim().length(3).optional(),
  /** Every unit string allowed anywhere in the UI (km, min, %, pts…). */
  units: z.array(z.string().trim().min(1).max(12)).min(1).max(8),
  dateRange: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  }),
  people: z.array(z.object({ name: z.string().trim().min(2).max(48), role: z.string().trim().min(2).max(40) })).min(1).max(3),
  metrics: z.array(exemplarMetricSchema).min(3).max(6),
  /** The primary list — 2-3 exemplar rows expanded to 6-8 by the generator. */
  list: z.object({
    name: z.string().trim().min(2).max(48),
    rows: z.array(exemplarRowSchema).min(2).max(3),
  }),
  detail: z.object({
    title: z.string().trim().min(2).max(64),
    fields: z.array(z.object({ label: z.string().trim().min(1).max(32), value: z.string().trim().min(1).max(48) })).min(4).max(8),
  }),
  activity: z.array(z.object({ actor: z.string().trim().min(1).max(32), action: z.string().trim().min(2).max(48), target: z.string().trim().min(1).max(48), time: z.string().trim().min(1).max(24) })).min(3).max(6),
});

export type BlueprintDataSchema = z.infer<typeof dataSchemaSchema>;

// ── The Blueprint ──────────────────────────────────────────────────────────

export const blueprintSchema = z
  .object({
    version: z.literal("25.0.0"),
    brief: blueprintBriefSchema,
    /** Exactly three DISTINCT concepts. */
    concepts: z.array(conceptSchema).length(3),
    /** The model's pick — the deterministic divergence scorer may override. */
    chosenConcept: z.number().int().min(0).max(2),
    screens: z.array(blueprintScreenSchema).min(2).max(4),
    componentManifest: z.array(manifestComponentSchema).min(6).max(14),
    dataSchema: dataSchemaSchema,
  })
  .superRefine((bp, ctx) => {
    // The chosen concept must be a valid index (redundant with the range but explicit).
    if (bp.chosenConcept >= bp.concepts.length) {
      ctx.addIssue({ code: "custom", message: "chosenConcept out of range", path: ["chosenConcept"] });
    }
    // Screen ids unique.
    const ids = bp.screens.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "screen ids must be unique", path: ["screens"] });
    }
    // Component names unique.
    const names = bp.componentManifest.map((c) => c.name);
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: "custom", message: "component names must be unique", path: ["componentManifest"] });
    }
    // usedBy references real screens.
    for (const c of bp.componentManifest) {
      for (const sid of c.usedBy) {
        if (!ids.includes(sid)) {
          ctx.addIssue({ code: "custom", message: `${c.name}.usedBy references unknown screen "${sid}"`, path: ["componentManifest"] });
        }
      }
    }
    // At least one component per screen — a screen with no manifest entry
    // has nothing product-specific to render.
    for (const s of bp.screens) {
      if (!bp.componentManifest.some((c) => c.usedBy.includes(s.id))) {
        ctx.addIssue({ code: "custom", message: `screen "${s.id}" mounts no manifest component`, path: ["screens"] });
      }
    }
  });

export type DesignBlueprint = z.infer<typeof blueprintSchema>;

/** The post-derive, enriched blueprint the pipeline carries. */
export interface DerivedBlueprint {
  blueprint: DesignBlueprint;
  /** Index into blueprint.concepts after the divergence veto. */
  chosenIndex: number;
  concept: Concept;
  notes: string[];
}

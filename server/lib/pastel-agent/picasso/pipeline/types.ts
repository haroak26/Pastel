import { z } from "zod";

// ── Brief & creative direction (Stage 1) ───────────────────────────────

export const nicheOptions = [
  "fintech",
  "productivity",
  "commerce",
  "health",
  "social",
  "devtools",
  "education",
  "travel",
  "creative",
  "other",
] as const;

export type Niche = (typeof nicheOptions)[number];

export interface CompanyRef {
  slug: string;
  name: string;
  tagline: string;
}

export interface CreativeDirection {
  name: string;
  summary: string;
  influences: string[];
  paletteDirection: string;
  densityFit: "low" | "medium" | "high";
}

const creativeDirectionSchema = z.object({
  name: z.string(),
  summary: z.string(),
  influences: z.array(z.string()),
  paletteDirection: z.string(),
  densityFit: z.enum(["low", "medium", "high"]),
});

export const briefSchema = z.object({
  productName: z.string().min(1),
  description: z.string().min(1),
  audience: z.string().min(1),
  niche: z.enum(nicheOptions),
  personality: z.array(z.string()).max(3),
  density: z.enum(["airy", "balanced", "dense"]),
  mode: z.enum(["light", "dark", "both"]),
  platform: z.enum(["web", "marketing", "mobile", "web+mobile"]),
  companyRefs: z.array(z.string()).max(2).optional(),
  chosenDirection: creativeDirectionSchema.optional(),
});

export type Brief = z.infer<typeof briefSchema>;

// ── Design tokens (Stage 2) ────────────────────────────────────────────

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const colorStopsSchema = z.record(z.string());

const neutralScaleSchema = z.object({
  "0": hexColor,
  "50": hexColor,
  "100": hexColor,
  "200": hexColor,
  "300": hexColor,
  "400": hexColor,
  "500": hexColor,
  "600": hexColor,
  "700": hexColor,
  "800": hexColor,
  "900": hexColor,
  "950": hexColor,
});

const accentScaleSchema = z.object({
  "50": hexColor,
  "100": hexColor,
  "200": hexColor.default(() => "#000000"),
  "300": hexColor.default(() => "#000000"),
  "400": hexColor.default(() => "#000000"),
  "500": hexColor,
  "600": hexColor,
  "700": hexColor.default(() => "#000000"),
  "800": hexColor.default(() => "#000000"),
  "900": hexColor,
}).or(z.object({
  "50": hexColor, "100": hexColor, "500": hexColor, "600": hexColor, "900": hexColor,
}));

const semanticScaleSchema = z.object({
  "50": hexColor, "500": hexColor, "900": hexColor,
});

export const tokensSchema = z.object({
  meta: z.object({
    brand: z.string(),
    version: z.literal("1.0.0"),
    generatedAt: z.string(),
  }),
  color: z.object({
    neutral: neutralScaleSchema,
    accent: accentScaleSchema,
    semantic: z.object({
      success: semanticScaleSchema,
      warning: semanticScaleSchema,
      danger: semanticScaleSchema,
      info: semanticScaleSchema,
    }),
    surface: z.object({
      background: hexColor,
      raised: hexColor,
      overlay: hexColor,
    }),
    text: z.object({
      primary: hexColor,
      secondary: hexColor,
      muted: hexColor,
      inverse: hexColor,
    }),
    border: z.object({
      default: hexColor,
      subtle: hexColor,
      focus: hexColor,
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
  }),
  breakpoints: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
  }),
});

export type Tokens = z.infer<typeof tokensSchema>;

// ── Layout & IA (Stage 3) ──────────────────────────────────────────────

export interface ScreenPlan {
  id: string;
  name: string;
  route: string;
  description: string;
  gridColumns: number;
  regions: ScreenRegion[];
}

export interface ScreenRegion {
  name: string;
  role: "nav" | "content" | "sidebar" | "hero" | "footer" | "main";
  componentTypes: ComponentSlot[];
}

export interface ComponentSlot {
  name: string;
  taxonomy: "primitive" | "atom" | "molecule" | "organism";
  description: string;
}

export interface LayoutPlan {
  screens: ScreenPlan[];
  globalRegions: ScreenRegion[];
  breakpoints: Record<string, string>;
}

// ── Component manifest (Stage 3 output, Stage 4 input) ─────────────────

export interface ComponentManifestEntry {
  id: string;
  name: string;
  taxonomy: "primitive" | "atom" | "molecule" | "organism";
  description: string;
  states: ("default" | "hover" | "focus" | "active" | "disabled" | "loading" | "empty" | "error")[];
  variants?: Record<string, string[]>;
  radixPrimitive?: string;
  props: Record<string, { type: string; required: boolean; description: string }>;
}

export interface ComponentsManifest {
  entries: ComponentManifestEntry[];
  generatedAt: string;
}

// ── Critque rubric (Stage 5) ───────────────────────────────────────────

export interface RubricScores {
  hierarchy: number;
  tokenFidelity: number;
  gridAlignment: number;
  spacingRhythm: number;
  colorRestraint: number;
  typographicRhythm: number;
  componentConsistency: number;
  accessibilityBaseline: number;
  brandFit: number;
  overallPolish: number;
}

export type RubricDimension = keyof RubricScores;

export type RouteTarget = "tokens" | "layout" | "components";

export interface CritiqueResult {
  scores: RubricScores;
  average: number;
  passed: boolean;
  failingDimensions: RubricDimension[];
  diagnosis: string;
  routeTo: RouteTarget | null;
  affectedIds: string[];
}

// ── Niche → company reference pre-filter ───────────────────────────────

export const NICHE_COMPANY_MAP: Record<Niche, string[]> = {
  fintech: ["stripe", "mercury", "apple", "linear"],
  productivity: ["linear", "notion", "superhuman", "apple", "slack"],
  commerce: ["shopify", "stripe", "airbnb", "apple"],
  health: ["headspace", "nike", "duolingo", "airbnb"],
  social: ["spotify", "airbnb", "duolingo", "slack"],
  devtools: ["vercel", "stripe", "linear", "apple", "figma"],
  education: ["duolingo", "notion", "headspace", "apple"],
  travel: ["airbnb", "spotify", "apple", "nike"],
  creative: ["figma", "framer", "arc", "webflow", "spotify"],
  other: ["apple", "linear", "stripe", "airbnb", "notion"],
};

// ── Run state ──────────────────────────────────────────────────────────

export interface PicassoRunState {
  runId: string;
  projectId?: string;
  userId?: string;

  // Stage outputs
  brief: Brief | null;
  creativeDirections: CreativeDirection[] | null;
  tokens: Tokens | null;
  layoutPlan: LayoutPlan | null;
  componentsManifest: ComponentsManifest | null;

  // Generated files
  generatedFiles: Record<string, string>;
  catalogPage: string | null;
  screenshots: Record<string, Buffer>;

  // Critique state
  critiqueResults: CritiqueResult[];
  currentIteration: number;
  maxIterations: number;

  // Status
  phase: PicassoPhase;
  error: string | null;
}

export type PicassoPhase =
  | "idle"
  | "brief"
  | "tokens"
  | "layout"
  | "components"
  | "critique"
  | "finalize"
  | "done"
  | "error";

export interface PicassoEvent {
  type: "phase" | "stage" | "error" | "done" | "direction" | "token" | "component" | "critique" | "file";
  phase?: PicassoPhase;
  message?: string;
  data?: unknown;
}

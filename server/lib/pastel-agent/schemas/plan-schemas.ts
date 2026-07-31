import { z } from "zod";
import { clarifyQuestionSchema } from "./clarify-schemas";

const nonEmpty = z.string().trim().min(1);
const HEX = /^#[0-9a-fA-F]{3,8}$/;

function requiredRecordKeys<K extends z.ZodTypeAny>(valueSchema: K, keys: readonly string[], message: string) {
  return z.record(valueSchema).refine(
    (record) => keys.every((key) => Object.prototype.hasOwnProperty.call(record, key)),
    { message },
  );
}

// ── Design system ───────────────────────────────────────────────────────────

const designColorSchema = z.object({
  hex: z.string().regex(HEX, "color must be a hex value"),
  usage: nonEmpty,
  contrastRatio: z.number().nonnegative().optional(),
});

const typeScaleEntrySchema = z.object({
  px: z.number().positive(),
  weight: z.number().int().min(100).max(950),
  lineHeight: z.number().positive(),
  tracking: z.string(),
  usage: nonEmpty,
});

const radiusEntrySchema = z.object({
  px: z.number().nonnegative(),
  usage: nonEmpty,
});

export const REQUIRED_COLOR_TOKENS = ["background", "surface", "text", "textMuted", "border", "accent", "accentForeground"] as const;
export const REQUIRED_TYPE_TOKENS = ["display", "h1", "h2", "h3", "lead", "body", "small", "caption", "overline"] as const;
export const REQUIRED_RADIUS_TOKENS = ["sm", "md", "lg", "full"] as const;

/** Design-system breakpoints are fixed by the product (preview + QA rely on them). */
export const FIXED_BREAKPOINTS = { mobile: 375, tablet: 768, desktop: 1440 } as const;

export const designSystemSpecSchema = z.object({
  concept: nonEmpty,
  colors: requiredRecordKeys(designColorSchema, REQUIRED_COLOR_TOKENS, "design system is missing required semantic colors"),
  fonts: z.object({ display: nonEmpty, body: nonEmpty }),
  typeScale: requiredRecordKeys(typeScaleEntrySchema, REQUIRED_TYPE_TOKENS, "design system is missing required type scale tokens"),
  radius: requiredRecordKeys(radiusEntrySchema, REQUIRED_RADIUS_TOKENS, "design system is missing radius tokens"),
  shadows: z.record(z.object({ value: z.string(), usage: nonEmpty })),
  spacing: z.object({
    base: z.number().positive(),
    sectionGap: z.number().positive(),
    containerWidth: z.number().positive(),
    gutter: z.number().positive(),
    verticalSectionPadding: z.number().positive(),
  }),
  breakpoints: z.object({
    mobile: z.number().positive(),
    tablet: z.number().positive(),
    desktop: z.number().positive(),
  }),
  grid: z.object({
    columns: z.number().int().min(4).max(16),
    gapPx: z.number().positive(),
    marginPx: z.number().positive(),
  }),
  motion: z.object({
    durationFastMs: z.number().int().positive(),
    durationBaseMs: z.number().int().positive(),
    easing: nonEmpty,
    principles: z.array(nonEmpty).min(1).max(5),
  }),
  componentStandards: z.object({
    fileLayout: nonEmpty,
    naming: nonEmpty,
    propConventions: z.array(nonEmpty).min(1).max(6),
  }),
  tokens: z.object({
    colors: z.record(nonEmpty),
    fonts: z.record(nonEmpty),
    sizes: z.record(nonEmpty),
    radius: z.record(nonEmpty),
    shadows: z.record(z.string()),
  }),
});
export type DesignSystemSpec = z.infer<typeof designSystemSpecSchema>;

// ── Product specification ───────────────────────────────────────────────────

const specScreenSectionSchema = z.object({
  name: nonEmpty,
  purpose: nonEmpty,
});

const specScreenSchema = z.object({
  id: z.string().trim().regex(/^[a-z][a-z0-9-]{0,40}$/, "screen id must be kebab-case"),
  name: z.string().trim().regex(/^[A-Z][a-zA-Z0-9]*$/, "screen name must be PascalCase"),
  purpose: nonEmpty,
  userGoal: nonEmpty,
  sections: z.array(specScreenSectionSchema).min(1).max(10),
  /** candidate reusable components the planner believes this screen needs */
  components: z.array(nonEmpty).max(12),
});

export const productSpecSchema = z.object({
  title: z.string().trim().min(3).max(60),
  summary: nonEmpty,
  goals: z.array(nonEmpty).min(1).max(6),
  audience: z.object({
    primary: nonEmpty,
    secondary: z.array(nonEmpty).max(3),
  }),
  screens: z.array(specScreenSchema).min(2).max(6),
  userFlows: z.array(z.object({
    name: nonEmpty,
    steps: z.array(nonEmpty).min(2).max(8),
  })).max(5),
  accessibility: z.object({
    level: z.literal("AA"),
    requirements: z.array(nonEmpty).min(1).max(12),
  }),
  interactionPatterns: z.array(nonEmpty).max(8),
  responsive: z.object({
    notes: z.array(nonEmpty).max(8),
  }),
  technicalConstraints: z.array(nonEmpty).max(8),
  successMetrics: z.array(nonEmpty).min(1).max(6),
});
export type ProductSpec = z.infer<typeof productSpecSchema>;
export type SpecScreen = z.infer<typeof specScreenSchema>;

// ── Architecture plan (component contracts + screen blueprints) ─────────────

export const COMPONENT_KINDS = ["shared", "layout", "screen"] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number];

const propSchema = z.object({
  name: nonEmpty,
  type: nonEmpty,
  default: z.string(),
  description: nonEmpty,
});

const variantSchema = z.object({
  name: nonEmpty,
  description: nonEmpty,
});

export const componentContractSchema = z.object({
  name: z.string().trim().regex(/^[A-Z][a-zA-Z0-9]*$/, "component name must be PascalCase"),
  kind: z.enum(COMPONENT_KINDS),
  /** owning screen name — required when kind === "screen" */
  ownerScreen: z.string().trim().regex(/^[A-Z][a-zA-Z0-9]*$/).optional().nullable(),
  purpose: nonEmpty,
  props: z.array(propSchema).min(1).max(12),
  variants: z.array(variantSchema).min(1).max(6),
  states: z.array(z.enum(["hover", "active", "focus", "disabled"])).max(4),
  /** design-token references this component consumes, e.g. "color.accent", "size.body" */
  tokens: z.array(nonEmpty).max(16),
  usedBy: z.array(nonEmpty).min(1).max(8),
}).refine(
  (contract) => contract.kind !== "screen" || !!contract.ownerScreen,
  { message: "screen-local components must declare ownerScreen" },
);
export type ComponentContract = z.infer<typeof componentContractSchema>;

const blueprintSectionSchema = z.object({
  name: nonEmpty,
  /** composition pattern chosen from the layout-pattern library */
  pattern: nonEmpty,
  /** registry/architecture component names used by this section */
  components: z.array(nonEmpty).max(6),
  /** final, verbatim copy strings for this section */
  copy: z.array(z.string()).max(24),
  notes: z.string().optional().nullable(),
});

export const screenBlueprintSchema = z.object({
  name: z.string().trim().regex(/^[A-Z][a-zA-Z0-9]*$/),
  /** name of a kind==="layout" component wrapping the screen, if any */
  layout: z.string().trim().regex(/^[A-Z][a-zA-Z0-9]*$/).optional().nullable(),
  sections: z.array(blueprintSectionSchema).min(1).max(10),
  responsive: z.object({
    tablet: nonEmpty,
    mobile: nonEmpty,
  }),
});
export type ScreenBlueprint = z.infer<typeof screenBlueprintSchema>;
export type ScreenBlueprintSection = z.infer<typeof blueprintSectionSchema>;

export const architecturePlanSchema = z.object({
  /** every planned file path in the project (informational — paths are derived deterministically) */
  fileTree: z.array(nonEmpty).min(1),
  components: z.array(componentContractSchema).min(1).max(24),
  screens: z.array(screenBlueprintSchema).min(1).max(6),
  hooks: z.array(z.object({ name: nonEmpty, purpose: nonEmpty })).max(4).optional(),
  lib: z.array(z.object({ name: nonEmpty, purpose: nonEmpty })).max(4).optional(),
});
export type ArchitecturePlan = z.infer<typeof architecturePlanSchema>;

// ── Intake (ambiguity engine) ───────────────────────────────────────────────

const ambiguityQuestionSchema = clarifyQuestionSchema.omit({ id: true });

export const intakeAmbiguitySchema = z.object({
  id: z.string().trim().regex(/^[a-z][a-z0-9_]{1,40}$/, "ambiguity id must be snake_case"),
  /** what product facet is ambiguous (audience, primary job, content, scope…) */
  facet: nonEmpty,
  impact: z.enum(["material", "cosmetic"]),
  /** planner's confidence it can proceed well without an answer */
  confidence: z.number().min(0).max(1),
  question: ambiguityQuestionSchema.optional(),
});

export const intakeBriefSchema = z.object({
  titleSuggestion: z.string().trim().min(3).max(60),
  productType: nonEmpty,
  audience: nonEmpty,
  primaryJobs: z.array(nonEmpty).min(1).max(5),
  contentDomains: z.array(nonEmpty).max(6),
  tone: z.array(nonEmpty).max(5),
  assumptions: z.array(nonEmpty).max(6),
  constraints: z.array(z.string()).max(6),
  /** overall confidence that a great design can be produced without user input */
  confidence: z.number().min(0).max(1),
  ambiguities: z.array(intakeAmbiguitySchema).max(4),
});
export type IntakeBrief = z.infer<typeof intakeBriefSchema>;
export type IntakeAmbiguity = z.infer<typeof intakeAmbiguitySchema>;

// ── Design gate findings ────────────────────────────────────────────────────

export const gateFindingSchema = z.object({
  /** artifact path or name the finding targets, e.g. "screen:Home", "component:Navbar", "design-system" */
  artifact: nonEmpty,
  severity: z.enum(["high", "medium", "low"]),
  class: z.enum([
    "slop",
    "hierarchy",
    "spacing",
    "contrast",
    "consistency",
    "copy",
    "brief-adherence",
    "accessibility",
  ]),
  issue: nonEmpty,
  fix: nonEmpty,
});

export const gateFindingsSchema = z.object({
  passes: z.boolean(),
  findings: z.array(gateFindingSchema).max(16),
});
export type GateFinding = z.infer<typeof gateFindingSchema>;
export type GateFindings = z.infer<typeof gateFindingsSchema>;

// ── Generated files (implementation + patch envelope) ───────────────────────

export const generatedFilesSchema = z.object({
  files: z.array(z.object({ path: nonEmpty, content: z.string().min(1) })).min(1),
});
export type GeneratedFiles = z.infer<typeof generatedFilesSchema>;

// ── Visual QA review ────────────────────────────────────────────────────────

export const visualReviewSchema = z.object({
  passes: z.boolean(),
  issues: z.array(z.object({
    screen: nonEmpty,
    viewport: z.enum(["desktop", "mobile"]),
    severity: z.enum(["high", "medium", "low"]),
    target: nonEmpty,
    issue: nonEmpty,
    evidence: nonEmpty,
    fix: nonEmpty,
  })).max(12),
});
export type VisualReview = z.infer<typeof visualReviewSchema>;

// ── Prompt-injected schema descriptions ─────────────────────────────────────

export const DESIGN_SYSTEM_SCHEMA_DESC = `{
  "concept": "One sentence describing the visual language.",
  "colors": {
    "background": { "hex": "#F7F6F2", "usage": "Primary page canvas", "contrastRatio": 15.1 },
    "surface": { "hex": "#FFFFFF", "usage": "Raised content surfaces" },
    "text": { "hex": "#1D1B18", "usage": "Primary text", "contrastRatio": 15.2 },
    "textMuted": { "hex": "#625E56", "usage": "Secondary text", "contrastRatio": 6.4 },
    "border": { "hex": "#DEDAD2", "usage": "Hairline structural borders" },
    "accent": { "hex": "#B5523C", "usage": "Primary actions", "contrastRatio": 4.7 },
    "accentForeground": { "hex": "#FFFFFF", "usage": "Text on accent", "contrastRatio": 4.7 }
  },
  "fonts": { "display": "Space Grotesk", "body": "DM Sans" },
  "typeScale": {
    "display": { "px": 64, "weight": 700, "lineHeight": 1.05, "tracking": "-0.03em", "usage": "Hero statements" },
    "h1": { "px": 48, "weight": 700, "lineHeight": 1.1, "tracking": "-0.03em", "usage": "Page titles" },
    "h2": { "px": 36, "weight": 650, "lineHeight": 1.15, "tracking": "-0.02em", "usage": "Section titles" },
    "h3": { "px": 24, "weight": 600, "lineHeight": 1.25, "tracking": "-0.01em", "usage": "Subsection titles" },
    "lead": { "px": 20, "weight": 400, "lineHeight": 1.5, "tracking": "0", "usage": "Introductory copy" },
    "body": { "px": 16, "weight": 400, "lineHeight": 1.55, "tracking": "0", "usage": "Body copy" },
    "small": { "px": 14, "weight": 500, "lineHeight": 1.45, "tracking": "0", "usage": "Supporting labels" },
    "caption": { "px": 12, "weight": 500, "lineHeight": 1.4, "tracking": "0.01em", "usage": "Metadata" },
    "overline": { "px": 10, "weight": 700, "lineHeight": 1.3, "tracking": "0.08em", "usage": "Section markers" }
  },
  "radius": {
    "sm": { "px": 4, "usage": "Compact controls" },
    "md": { "px": 8, "usage": "Buttons and cards" },
    "lg": { "px": 16, "usage": "Large surfaces" },
    "full": { "px": 9999, "usage": "Pills and badges" }
  },
  "shadows": {
    "sm": { "value": "none", "usage": "Not used by this style" },
    "md": { "value": "none", "usage": "Not used by this style" },
    "lg": { "value": "none", "usage": "Not used by this style" }
  },
  "spacing": { "base": 8, "sectionGap": 72, "containerWidth": 1280, "gutter": 32, "verticalSectionPadding": 72 },
  "breakpoints": { "mobile": 375, "tablet": 768, "desktop": 1440 },
  "grid": { "columns": 12, "gapPx": 32, "marginPx": 32 },
  "motion": {
    "durationFastMs": 150,
    "durationBaseMs": 250,
    "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
    "principles": ["Transitions are short and functional", "Hover states ease in, never bounce"]
  },
  "componentStandards": {
    "fileLayout": "src/components/<Name>.jsx for shared, src/layouts/<Name>.jsx for chrome, src/features/<Screen>/<Name>.jsx for screen-local",
    "naming": "PascalCase component names matching their file names",
    "propConventions": ["children: ReactNode for slot content", "className: string escape hatch, defaults to empty string"]
  },
  "tokens": {
    "colors": { "background": "#F7F6F2", "surface": "#FFFFFF", "text": "#1D1B18", "textMuted": "#625E56", "border": "#DEDAD2", "accent": "#B5523C", "accentForeground": "#FFFFFF" },
    "fonts": { "display": "Space Grotesk", "body": "DM Sans" },
    "sizes": { "display": "64px", "h1": "48px", "h2": "36px", "h3": "24px", "lead": "20px", "body": "16px", "small": "14px", "caption": "12px", "overline": "10px" },
    "radius": { "sm": "4px", "md": "8px", "lg": "16px", "full": "9999px" },
    "shadows": { "sm": "none", "md": "none", "lg": "none" }
  }
}`;

export const PRODUCT_SPEC_SCHEMA_DESC = `{
  "title": "Short Project Title",
  "summary": "2-4 sentences: what the product is and who it serves.",
  "goals": ["Primary product goal"],
  "audience": { "primary": "Who this is for", "secondary": ["Adjacent audience"] },
  "screens": [
    {
      "id": "dashboard",
      "name": "Dashboard",
      "purpose": "What this screen is for",
      "userGoal": "The single job the user accomplishes here",
      "sections": [{ "name": "Overview", "purpose": "Why this section exists" }],
      "components": ["Navbar", "Card"]
    }
  ],
  "userFlows": [{ "name": "Signing up", "steps": ["Arrives on home", "Chooses a plan", "Creates account"] }],
  "accessibility": { "level": "AA", "requirements": ["All interactive elements keyboard reachable", "Contrast 4.5:1 for body text"] },
  "interactionPatterns": ["Primary action per screen is a single accent button"],
  "responsive": { "notes": ["Below 768px multi-column sections stack"] },
  "technicalConstraints": ["Static React, no backend"],
  "successMetrics": ["A first-time user can find the primary action in under 5 seconds"]
}`;

export const ARCHITECTURE_SCHEMA_DESC = `{
  "fileTree": ["src/styles.css", "src/components/Navbar.jsx", "src/layouts/AppShell.jsx", "src/features/Dashboard/StatStrip.jsx", "src/screens/Dashboard.jsx"],
  "components": [
    {
      "name": "Navbar",
      "kind": "shared | layout | screen",
      "ownerScreen": "Dashboard (only when kind is screen)",
      "purpose": "What it does in one sentence",
      "props": [{ "name": "children", "type": "ReactNode", "default": "undefined", "description": "Slot content" }],
      "variants": [{ "name": "default", "description": "Standard presentation" }],
      "states": ["hover", "active", "focus", "disabled"],
      "tokens": ["color.accent", "size.body", "radius.md"],
      "usedBy": ["Dashboard", "Settings"]
    }
  ],
  "screens": [
    {
      "name": "Dashboard",
      "layout": "AppShell (optional — a kind=layout component)",
      "sections": [
        {
          "name": "Overview",
          "pattern": "Stat Block (choose from the composition pattern library)",
          "components": ["Navbar", "StatStrip"],
          "copy": ["Final verbatim copy strings for this section"],
          "notes": "Composition direction for the implementer"
        }
      ],
      "responsive": { "tablet": "768px behavior", "mobile": "375px behavior" }
    }
  ],
  "hooks": [{ "name": "useDisclosure", "purpose": "Optional local-state helper" }],
  "lib": [{ "name": "formatters", "purpose": "Optional formatting helpers" }]
}`;

export const INTAKE_SCHEMA_DESC = `{
  "titleSuggestion": "Short Project Title",
  "productType": "saas dashboard | storefront | marketing site | ...",
  "audience": "Who this is for, one sentence",
  "primaryJobs": ["The 1-5 jobs a user comes to do"],
  "contentDomains": ["Kinds of content the product shows"],
  "tone": ["confident", "restrained"],
  "assumptions": ["Reasonable assumption the design will proceed on"],
  "constraints": ["Hard constraint from the request"],
  "confidence": 0.85,
  "ambiguities": [
    {
      "id": "primary_job",
      "facet": "primary job",
      "impact": "material",
      "confidence": 0.4,
      "question": {
        "title": "Primary job",
        "question": "Concrete, answerable question?",
        "whyItMatters": "One sentence on how the answer changes the design.",
        "options": [{ "label": "Option A", "description": "A distinct direction" }],
        "placeholder": "Free-text hint"
      }
    }
  ]
}`;

export const GATE_SCHEMA_DESC = `{
  "passes": false,
  "findings": [
    {
      "artifact": "screen:Home | component:Navbar | design-system",
      "severity": "high | medium | low",
      "class": "slop | hierarchy | spacing | contrast | consistency | copy | brief-adherence | accessibility",
      "issue": "What is wrong, precisely",
      "fix": "The smallest concrete change that resolves it"
    }
  ]
}`;

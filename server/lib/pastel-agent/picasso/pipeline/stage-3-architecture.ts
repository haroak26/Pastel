import { z } from "zod";
import type { Brief, Tokens, LayoutPlan, ScreenPlan, ScreenRegion, ComponentSlot, ComponentsManifest, ComponentManifestEntry } from "./types";
import { loadAllDesignLaws, loadAllComponentLaws } from "./knowledge";
import { antiSlopSystemPrompt, contextCompositionRules, detectProductContext, AI_SLOP_PHRASES, type ProductContext } from "./anti-slop";
import { chatJSON, MAX_TOKENS_PER_CALL, type ChatMessage } from "../../gateway";

// ── BrandKit ─────────────────────────────────────────────────────────────

export interface BrandKit {
  colorRules: { accentUsage: string; semanticUsage: string; neutralUsage: string; forbiddenPatterns: string[] };
  typographyRules: { displayUsage: string; bodyUsage: string; monoUsage: string; weightRules: string; sizeRules: string };
  spacingRules: { sectionMargins: string; componentPadding: string; rhythmDescription: string };
  motionRules: { transitions: string; easing: string; duration: string };
  signatureMoves: string[];
  antiPatterns: string[];
  generatedAt: string;
}

// ── UXDesignPlan ─────────────────────────────────────────────────────────

export interface UXDesignPlan {
  navigationStrategy: string;
  surfaceRhythm: string;
  interactionPatterns: string;
  densityStrategy: string;
  primaryActionPerScreen: Record<string, string>;
  generatedAt: string;
}

// ── ArchitectureOutput ───────────────────────────────────────────────────

export interface ArchitectureOutput {
  layoutPlan: LayoutPlan;
  componentsManifest: ComponentsManifest;
  brandKit: BrandKit;
  uxDesignPlan: UXDesignPlan;
  componentInventory: { id: string; name: string; taxonomy: string; complexity: "low" | "medium" | "high" }[];
}

// ── Zod schemas ──────────────────────────────────────────────────────────

const componentSlotSchema = z.object({
  name: z.string(),
  taxonomy: z.enum(["primitive", "atom", "molecule", "organism"]),
  description: z.string(),
});

const screenRegionSchema = z.object({
  name: z.string(),
  role: z.enum(["nav", "content", "sidebar", "hero", "footer", "main"]),
  componentTypes: z.array(componentSlotSchema),
});

const screenPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  description: z.string(),
  gridColumns: z.number(),
  regions: z.array(screenRegionSchema),
});

const layoutPlanSchema = z.object({
  screens: z.array(screenPlanSchema),
  globalRegions: z.array(screenRegionSchema),
  breakpoints: z.record(z.string()),
});

const componentManifestEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  taxonomy: z.enum(["primitive", "atom", "molecule", "organism"]),
  description: z.string(),
  states: z.array(
    z.enum(["default", "hover", "focus", "active", "disabled", "loading", "empty", "error"]),
  ),
  variants: z.record(z.array(z.string())).optional(),
  radixPrimitive: z.string().optional(),
  props: z.record(
    z.object({
      type: z.string(),
      required: z.boolean(),
      description: z.string(),
    }),
  ),
});

const componentsManifestSchema = z.object({
  entries: z.array(componentManifestEntrySchema),
  generatedAt: z.string(),
});

const brandKitSchema = z.object({
  colorRules: z.object({
    accentUsage: z.string(),
    semanticUsage: z.string(),
    neutralUsage: z.string(),
    forbiddenPatterns: z.array(z.string()),
  }),
  typographyRules: z.object({
    displayUsage: z.string(),
    bodyUsage: z.string(),
    monoUsage: z.string(),
    weightRules: z.string(),
    sizeRules: z.string(),
  }),
  spacingRules: z.object({
    sectionMargins: z.string(),
    componentPadding: z.string(),
    rhythmDescription: z.string(),
  }),
  motionRules: z.object({
    transitions: z.string(),
    easing: z.string(),
    duration: z.string(),
  }),
  signatureMoves: z.array(z.string()),
  antiPatterns: z.array(z.string()),
  generatedAt: z.string(),
});

const uxDesignPlanSchema = z.object({
  navigationStrategy: z.string(),
  surfaceRhythm: z.string(),
  interactionPatterns: z.string(),
  densityStrategy: z.string(),
  primaryActionPerScreen: z.record(z.string()),
  generatedAt: z.string(),
});

// ── planLayout ───────────────────────────────────────────────────────────

function planLayoutSystem(prompts: { productContext: ProductContext }): string {
  const contextRules = contextCompositionRules(prompts.productContext);
  const laws = loadAllDesignLaws();
  const componentLaws = loadAllComponentLaws();

  return `You are a structural UI and information-architecture planner. Your job is to take a product brief and design tokens and produce a screen-by-screen layout plan with grid regions and component slots.

## ANTI-SLOP GUARDRAILS

${antiSlopSystemPrompt()}

## PRODUCT CONTEXT RULES

${contextRules}

## DESIGN LAWS (knowledge base)

${laws.slice(0, 4000)}

## COMPONENT LAWS (knowledge base)

${componentLaws.slice(0, 2000)}

## SCREEN PLANNING

- Determine which screens this product needs based on its niche, audience, platform, and personality.
- Common screens: landing, dashboard, detail, settings, profile, search, browse, feed, checkout, onboarding, etc.
- Be specific to the product domain — a fintech app needs different screens than a social feed or a devtools console.
- Every screen gets a short id (kebab-case), a human-readable name, a route path, and a one-sentence description of its purpose.
- Product context is "${prompts.productContext}" — plan screens accordingly.

## REGION PLANNING

- Each screen uses a 12-column desktop grid (gridColumns: 12).
- Divide each screen into named regions — these are the structural zones the viewport is divided into.
- Each region has a role:
  - "nav" — navigation bars, toolbars, breadcrumbs, topbars
  - "hero" — hero sections, page headers, feature showcases (LANDING ONLY)
  - "content" — main content zones (lists, grids, feeds, forms)
  - "sidebar" — side panels, filters, secondary navigation
  - "footer" — page footers, legal links (LANDING ONLY)
  - "main" — primary content area when the screen's focus is a single central zone
- Context matters: apps have NO hero regions, NO footer regions. Landing pages have hero → sections → footer.
- Regions should map to real UI zones, not abstract containers. Think about what the user actually sees.

## COMPONENT PLANNING

- Each region contains componentType slots — these describe what UI component fills that part of the region.
- Taxonomy levels:
  - "primitive" — base interactive elements (Button, Input, Link, Textarea, Checkbox, Select)
  - "atom" — single-purpose, standalone (Badge, Avatar, Icon, Divider, Label, Tag)
  - "molecule" — composed from primitives/atoms into a reusable unit (MetricCard, CommentRow, SearchBar, FormField, StatCard)
  - "organism" — entire sections composed from molecules (MetricGrid, ActivityFeed, ProductGallery, SettingsForm, DataTable)
- Describe each component by its role and what it displays, not by implementation details.
- Use domain-specific, meaningful names. A health app has "WorkoutCard", not "GenericCard".
- NO floating decorative blobs. NO testimonial carousels with circular avatars + centered quotes.
- IF the context is LANDING: allow 2-3 card sections max. Prefer alternating 2-column rows for features.

## GLOBAL REGIONS

- Define regions that appear on every screen (e.g., a global navigation bar, a global footer, a shared sidebar).
- These are the "chrome" — the persistent UI that frames every page.

## BREAKPOINTS

- Use the breakpoints provided in the design tokens.

Output ONLY valid JSON matching this schema:
{
  "screens": [
    {
      "id": "kebab-case-id",
      "name": "Human Readable Name",
      "route": "/route-path",
      "description": "One sentence describing what this screen does.",
      "gridColumns": 12,
      "regions": [
        {
          "name": "Region Name",
          "role": "nav" | "content" | "sidebar" | "hero" | "footer" | "main",
          "componentTypes": [
            { "name": "ComponentName", "taxonomy": "primitive" | "atom" | "molecule" | "organism", "description": "What this component does in context" }
          ]
        }
      ]
    }
  ],
  "globalRegions": [ ...same shape as regions above... ],
  "breakpoints": { "sm": "...", "md": "...", "lg": "...", "xl": "..." }
}`;
}

function planLayoutUser(brief: Brief, tokens: Tokens, productContext: ProductContext): string {
  const tokenSummary = {
    fontDisplay: tokens.typography.fontFamily.display,
    fontBody: tokens.typography.fontFamily.body,
    fontMono: tokens.typography.fontFamily.mono,
    accentPalette: tokens.color.accent,
    breakpoints: tokens.breakpoints,
    spaceScaleKeys: Object.keys(tokens.space).join(", "),
    density: tokens.meta.brand,
  };

  return `PRODUCT BRIEF:
${JSON.stringify({
  productName: brief.productName,
  description: brief.description,
  audience: brief.audience,
  niche: brief.niche,
  personality: brief.personality,
  density: brief.density,
  mode: brief.mode,
  platform: brief.platform,
  chosenDirection: brief.chosenDirection,
}, null, 2)}

PRODUCT CONTEXT: ${productContext}

DESIGN TOKENS SUMMARY:
${JSON.stringify(tokenSummary, null, 2)}

Plan the screens, regions, and component slots for this product. Follow the product context rules EXACTLY — do not include hero/footer regions for app screens, do not skip hero/footer for landing screens.`;
}

// ── buildComponentManifest ───────────────────────────────────────────────

function manifestSystem(): string {
  return `You are a component specification analyst. You receive a list of unique component types (already deduplicated by name + taxonomy) and enrich each one into a full component manifest entry.

For each component, provide:

**id**: kebab-case identifier derived from the component name (e.g., "metric-card", "activity-feed").

**name**: the component name exactly as provided.

**taxonomy**: exactly as provided.

**description**: the description exactly as provided.

**states**: which interactive/visual states apply to this component. Choose from:
  - "default", "hover", "focus", "active", "disabled", "loading", "empty", "error"
  - Interactive elements (buttons, inputs, links, toggles): default, hover, focus, active, disabled. Add "loading" if the component can trigger async actions.
  - Data displays (cards, feeds, grids, tables): default, loading, empty, error.
  - Text inputs: default, hover, focus, active, disabled, error.
  - Navigation elements: default, hover, focus, active.
  - Static elements (badges, avatars, dividers, labels): default only or default + empty.
  - Containers: default. Add "empty" if the container shows an empty state.

**variants** (optional): named visual/behavioral variants and their options, e.g.:
  - { "size": ["sm", "md", "lg"], "variant": ["primary", "secondary", "ghost"] }
  - { "layout": ["grid", "list"] }
  - { "emphasis": ["default", "muted", "bold"] }
  Leave absent if the component has no meaningful variants.

**radixPrimitive** (optional): the closest Radix UI primitive this maps to. Available primitives:
  Dialog, Popover, Select, Toggle, Switch, Tooltip, Avatar, Tabs, Accordion, Checkbox, RadioGroup, Slider, DropdownMenu, ContextMenu, NavigationMenu, HoverCard, ScrollArea, Separator, Label, ToggleGroup
  Only set this if there is a clear, direct mapping. Leave absent otherwise.

**props**: key props this component accepts, defined as an object where each key is the prop name and the value is:
  - "type": the TypeScript type string (e.g., "string", "number", "boolean", "ReactNode", "() => void", "string[]")
  - "required": boolean — true if the component cannot function without this prop
  - "description": one sentence explaining what the prop controls

## ANTI-SLOP GUARDRAILS

${antiSlopSystemPrompt()}

Output ONLY valid JSON matching this schema:
{
  "entries": [
    {
      "id": "kebab-case",
      "name": "ComponentName",
      "taxonomy": "primitive" | "atom" | "molecule" | "organism",
      "description": "...",
      "states": ["default", ...],
      "variants": { "size": ["sm", "md", "lg"] },
      "radixPrimitive": "Dialog",
      "props": {
        "propName": { "type": "string", "required": true, "description": "Controls the ..." }
      }
    }
  ],
  "generatedAt": "ISO-8601 timestamp"
}`;
}

function manifestUser(
  brief: Brief,
  components: { name: string; taxonomy: string; description: string }[],
): string {
  const { productName, niche, audience, density, platform, personality } = brief;
  return `PRODUCT: ${productName} — ${niche} platform for ${audience}
Density: ${density} | Platform: ${platform} | Personality: ${personality.join(", ")}

DEDUPLICATED COMPONENT TYPES:
${JSON.stringify(components, null, 2)}

Enrich each component into a full manifest entry with states, variants, radixPrimitive mapping, and props. Be domain-aware — a "${brief.niche}" product's components should reflect its domain conventions.`;
}

// ── generateBrandKit ─────────────────────────────────────────────────────

function brandKitSystem(tokens: Tokens): string {
  return `You are a brand identity strategist. You extract formal brand rules from a set of design tokens and reference company aesthetics.

## ANTI-SLOP GUARDRAILS

${antiSlopSystemPrompt()}

## DESIGN TOKENS

${JSON.stringify({
  meta: tokens.meta,
  color: {
    accentKeys: Object.keys(tokens.color.accent),
    neutralCount: Object.keys(tokens.color.neutral).length,
    semanticCount: Object.keys(tokens.color.semantic).length,
    surface: tokens.color.surface,
    text: tokens.color.text,
    border: tokens.color.border,
  },
  typography: tokens.typography,
  space: tokens.space,
  radius: tokens.radius,
  shadow: tokens.shadow,
  motion: tokens.motion,
}, null, 2)}

## INSTRUCTIONS

Analyze the tokens and extract formal brand rules:

**colorRules**:
- accentUsage: When and where the accent color appears (CTAs only? focus rings? badges? links?). Describe the role.
- semanticUsage: How success/warning/danger/info are used. Are they background tints, badges, borders, or text?
- neutralUsage: How the neutral scale creates hierarchy. Which steps are backgrounds, which are text, which are borders.
- forbiddenPatterns: What color patterns this brand explicitly avoids (e.g., "accent as decorative background", "gradients on surfaces", "more than one accent hue").

**typographyRules**:
- displayUsage: What role does the display font serve (headings, hero, branding, navigation)?
- bodyUsage: What role does the body font serve (body copy, labels, inputs, data)?
- monoUsage: What role does the mono font serve (code, data, tabular numbers, technical labels)?
- weightRules: Which weights for which contexts (headings: 600-700, body: 400, emphasis: 500-600, never 200/300 or 800/900).
- sizeRules: Minimum sizes, scale usage (headings from X to Y, body at Z, captions at W).

**spacingRules**:
- sectionMargins: How sections are separated (py-12 to py-32, varied never uniform).
- componentPadding: How components are padded (px-4 py-3 for compact, px-6 py-4 for relaxed).
- rhythmDescription: The overall spacing philosophy (airy with generous whitespace, dense and compact, rhythmic 8px grid).

**motionRules**:
- transitions: What transitions are used where (opacity for reveals, transform for layout changes, color for state changes).
- easing: The easing curve philosophy (smooth out-quad, snappy cubic-bezier, spring-like).
- duration: How durations map to actions (fast for micro-interactions, base for state changes, slow for page transitions).

**signatureMoves**: 3-5 distinctive design moves that make this brand recognizable (e.g., "bold numeric hero with accent counter", "floating action buttons with 1px inner shadow", "data cards with accent left-border").

**antiPatterns**: 3-5 patterns this brand should NEVER do (e.g., "card carousels", "centered marketing text in app context", "gradient hero sections", "more than 3 cards per viewport").

Output ONLY valid JSON:
{
  "colorRules": { "accentUsage": "...", "semanticUsage": "...", "neutralUsage": "...", "forbiddenPatterns": ["..."] },
  "typographyRules": { "displayUsage": "...", "bodyUsage": "...", "monoUsage": "...", "weightRules": "...", "sizeRules": "..." },
  "spacingRules": { "sectionMargins": "...", "componentPadding": "...", "rhythmDescription": "..." },
  "motionRules": { "transitions": "...", "easing": "...", "duration": "..." },
  "signatureMoves": ["...", "..."],
  "antiPatterns": ["...", "..."],
  "generatedAt": "ISO-8601 timestamp"
}`;
}

function brandKitUser(
  brief: Brief,
  tokens: Tokens,
  references: string[],
  productContext: ProductContext,
): string {
  return `PRODUCT: ${brief.productName}
Niche: ${brief.niche}
Personality: ${brief.personality.join(", ")}
Audience: ${brief.audience}
Mode: ${brief.mode}
Density: ${brief.density}
Platform: ${brief.platform}
Context: ${productContext}

REFERENCE COMPANIES:
${references.join("\n")}

Extract the brand rules from the design tokens, considering the reference company aesthetics as inspiration (not to copy directly). Be specific to this brand's identity — a fintech brand and a social brand should have VERY different rules.`;
}

// ── generateUXDesignPlan ─────────────────────────────────────────────────

function uxDesignPlanSystem(productContext: ProductContext): string {
  const contextRules = contextCompositionRules(productContext);

  return `You are a UX design architect. You plan navigation, surface rhythm, interaction patterns, and density for an application based on its layout, brand rules, and product context.

## ANTI-SLOP GUARDRAILS

${antiSlopSystemPrompt()}

## PRODUCT CONTEXT RULES

${contextRules}

## INSTRUCTIONS

**navigationStrategy**: How users move through the application. Describe the primary navigation paradigm (sidebar, topbar, tabbar, bottom nav), how sections are organized, how state is indicated (active/current), how secondary navigation works (breadcrumbs, tabs, contextual nav). Be specific about desktop behavior.

**surfaceRhythm**: How surfaces create visual hierarchy across screens. Describe the alternating pattern of surface types: Band (full-width tinted sections for overview/routing), Plain (white/neutral surface for primary content), Card (raised surfaces for action clusters), Tinted (subtle washed sections for grouping). What surfaces appear where, and why.

**interactionPatterns**: How users interact with the interface. Describe: hover behavior (desktop), click targets (min 44px), focus management (which element gets focus when navigating), keyboard shortcuts (CMD+K for search, ESC for close), form behavior (inline validation, progressive disclosure), loading states (skeleton vs spinner), transitions between views.

**densityStrategy**: How information density is managed. Describe: data density per screen (sparse/compact/dense), whitespace allocation, typographic scale usage, when to use grid vs list vs table, how to avoid uniform card grids.

**primaryActionPerScreen**: A Record<string, string> mapping each screen id to its primary user action, using specific, product-appropriate verb phrases (e.g., "Create project", "Add transaction", "View report", "Send message"). Not generic "Submit" or "Continue".

Output ONLY valid JSON:
{
  "navigationStrategy": "...",
  "surfaceRhythm": "...",
  "interactionPatterns": "...",
  "densityStrategy": "...",
  "primaryActionPerScreen": { "screen-id": "Action label", ... },
  "generatedAt": "ISO-8601 timestamp"
}`;
}

function uxDesignPlanUser(
  brief: Brief,
  layoutPlan: LayoutPlan,
  brandKit: BrandKit,
  productContext: ProductContext,
): string {
  const screenIds = layoutPlan.screens.map((s) => s.id);

  return `PRODUCT: ${brief.productName}
Niche: ${brief.niche}
Personality: ${brief.personality.join(", ")}
Audience: ${brief.audience}
Density: ${brief.density}
Platform: ${brief.platform}
Context: ${productContext}

LAYOUT PLAN (${layoutPlan.screens.length} screens):
${layoutPlan.screens.map((s) => {
  return `- ${s.id} (${s.name}): ${s.description} | ${s.regions.length} regions: ${s.regions.map((r) => `${r.name}[${r.role}]`).join(", ")}`;
}).join("\n")}

GLOBAL REGIONS:
${layoutPlan.globalRegions.map((r) => `${r.name}[${r.role}]`).join(", ") || "(none)"}

BRAND KIT HIGHLIGHTS:
- Accent: ${brandKit.colorRules.accentUsage.slice(0, 120)}
- Typography: ${brandKit.typographyRules.displayUsage.slice(0, 80)}
- Spacing: ${brandKit.spacingRules.rhythmDescription.slice(0, 80)}
- Signature moves: ${brandKit.signatureMoves.slice(0, 3).join("; ")}
- Anti-patterns: ${brandKit.antiPatterns.slice(0, 3).join("; ")}

Plan the UX for this product. Provide a primary action label for EACH of these screen ids:
${screenIds.map((id) => `  - ${id}`).join("\n")}

Make every action label specific to this product. A project management tool should have "Create project", a fintech app should have "Add transaction" or "View portfolio". NEVER use generic labels like "Submit", "Continue", or "Get started".`;
}

// ── Public API ───────────────────────────────────────────────────────────

export async function planLayout(
  brief: Brief,
  tokens: Tokens,
  productContext: ProductContext,
): Promise<LayoutPlan> {
  return chatJSON<LayoutPlan>(
    [
      { role: "system", content: planLayoutSystem({ productContext }) },
      { role: "user", content: planLayoutUser(brief, tokens, productContext) },
    ],
    {
      model: "planner",
      temperature: 0.3,
      maxTokens: MAX_TOKENS_PER_CALL.planner,
      validate: (v) => layoutPlanSchema.parse(v),
    },
  );
}

export async function buildComponentManifest(
  brief: Brief,
  layoutPlan: LayoutPlan,
): Promise<ComponentsManifest> {
  const seen = new Map<string, { name: string; taxonomy: string; description: string }>();

  const collect = (regions: ScreenRegion[]) => {
    for (const region of regions) {
      for (const ct of region.componentTypes) {
        const key = `${ct.name}|${ct.taxonomy}`;
        if (!seen.has(key)) {
          seen.set(key, { name: ct.name, taxonomy: ct.taxonomy, description: ct.description });
        }
      }
    }
  };

  for (const screen of layoutPlan.screens) {
    collect(screen.regions);
  }
  collect(layoutPlan.globalRegions);

  const uniqueComponents = [...seen.values()];

  return chatJSON<ComponentsManifest>(
    [
      { role: "system", content: manifestSystem() },
      { role: "user", content: manifestUser(brief, uniqueComponents) },
    ],
    {
      model: "planner",
      temperature: 0.2,
      maxTokens: 12000,
      validate: (v) => componentsManifestSchema.parse(v),
    },
  );
}

export async function generateBrandKit(
  tokens: Tokens,
  references: string[],
  productContext: ProductContext,
  brief: Brief,
): Promise<BrandKit> {
  return chatJSON<BrandKit>(
    [
      { role: "system", content: brandKitSystem(tokens) },
      { role: "user", content: brandKitUser(brief, tokens, references, productContext) },
    ],
    {
      model: "design",
      temperature: 0.4,
      maxTokens: MAX_TOKENS_PER_CALL.design,
      validate: (v) => brandKitSchema.parse(v),
    },
  );
}

export async function generateUXDesignPlan(
  brief: Brief,
  layoutPlan: LayoutPlan,
  brandKit: BrandKit,
  productContext: ProductContext,
): Promise<UXDesignPlan> {
  return chatJSON<UXDesignPlan>(
    [
      { role: "system", content: uxDesignPlanSystem(productContext) },
      { role: "user", content: uxDesignPlanUser(brief, layoutPlan, brandKit, productContext) },
    ],
    {
      model: "design",
      temperature: 0.4,
      maxTokens: MAX_TOKENS_PER_CALL.design,
      validate: (v) => uxDesignPlanSchema.parse(v),
    },
  );
}

// ── Complexity estimator ─────────────────────────────────────────────────

function estimateComplexity(
  taxonomy: ComponentManifestEntry["taxonomy"],
  states: string[],
  variants?: Record<string, string[]>,
): "low" | "medium" | "high" {
  const stateCount = states.length;
  const variantCount = variants ? Object.values(variants).reduce((sum, v) => sum + v.length, 0) : 0;

  if (taxonomy === "organism" && variantCount > 4) return "high";
  if (taxonomy === "organism") return "medium";
  if (taxonomy === "molecule" && variantCount >= 4) return "high";
  if (taxonomy === "molecule") return "medium";
  if (taxonomy === "primitive" && stateCount >= 5) return "medium";
  if (variantCount > 0) return "medium";
  return "low";
}

// ── runArchitecture ──────────────────────────────────────────────────────

export interface RunArchitectureInput {
  brief: Brief;
  tokens: Tokens;
  referenceSlugs?: string[];
  referenceContents?: string[];
}

export async function runArchitecture(
  input: RunArchitectureInput,
): Promise<ArchitectureOutput> {
  const { brief, tokens, referenceSlugs, referenceContents } = input;

  const productContext = detectProductContext({
    productName: brief.productName,
    description: brief.description,
    platform: brief.platform,
    niche: brief.niche,
  });

  const references = referenceContents ?? referenceSlugs ?? [];

  // ── 1. Generate layout plan ──────────────────────────────────────────
  const layoutPlan = await planLayout(brief, tokens, productContext);

  // ── 2. Build component manifest ─────────────────────────────────────
  const componentsManifest = await buildComponentManifest(brief, layoutPlan);

  // ── 3. Generate brand kit ────────────────────────────────────────────
  const brandKit = await generateBrandKit(tokens, references, productContext, brief);

  // ── 4. Generate UX design plan ───────────────────────────────────────
  const uxDesignPlan = await generateUXDesignPlan(brief, layoutPlan, brandKit, productContext);

  // ── 5. Build component inventory ─────────────────────────────────────
  const componentInventory = componentsManifest.entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    taxonomy: entry.taxonomy,
    complexity: estimateComplexity(entry.taxonomy, entry.states, entry.variants),
  }));

  return {
    layoutPlan,
    componentsManifest,
    brandKit,
    uxDesignPlan,
    componentInventory,
  };
}

// ── Markdown reporter ────────────────────────────────────────────────────

export function renderArchitectureReport(output: ArchitectureOutput): string {
  const { layoutPlan, componentsManifest, brandKit, uxDesignPlan, componentInventory } = output;

  const taxonomyCounts: Record<string, number> = {};
  for (const e of componentsManifest.entries) {
    taxonomyCounts[e.taxonomy] = (taxonomyCounts[e.taxonomy] ?? 0) + 1;
  }

  const complexityCounts: Record<string, number> = {};
  for (const c of componentInventory) {
    complexityCounts[c.complexity] = (complexityCounts[c.complexity] ?? 0) + 1;
  }

  const lines: string[] = [
    `## Architecture Plan`,
    ``,
    `### Layout — ${layoutPlan.screens.length} screens`,
    ``,
  ];

  for (const screen of layoutPlan.screens) {
    lines.push(`#### ${screen.name} (\`${screen.id}\`)`, ``);
    lines.push(`- **Route:** \`${screen.route}\``);
    lines.push(`- **Grid:** ${screen.gridColumns} columns`);
    lines.push(`- **Description:** ${screen.description}`);
    lines.push(`- **Regions:**`);
    for (const region of screen.regions) {
      const slots = region.componentTypes.map((c) => `${c.name} (${c.taxonomy})`).join(", ");
      lines.push(`  - \`${region.name}\` [${region.role}] → ${slots}`);
    }
    lines.push(``);
  }

  if (layoutPlan.globalRegions.length > 0) {
    lines.push(`### Global Regions`, ``);
    for (const region of layoutPlan.globalRegions) {
      const slots = region.componentTypes.map((c) => `${c.name} (${c.taxonomy})`).join(", ");
      lines.push(`- \`${region.name}\` [${region.role}] → ${slots}`);
    }
    lines.push(``);
  }

  lines.push(
    `### Breakpoints`,
    ``,
    ...Object.entries(layoutPlan.breakpoints).map(([k, v]) => `- **${k}:** ${v}`),
    ``,
  );

  lines.push(
    `### Component Manifest (${componentsManifest.entries.length} unique)`,
    ``,
    ...Object.entries(taxonomyCounts).map(([t, c]) => `- **${t}s:** ${c}`),
    ``,
    `| Component | Taxonomy | Complexity | States | Radix |`,
    `|-----------|----------|------------|--------|-------|`,
  );

  for (const entry of componentsManifest.entries) {
    const inventory = componentInventory.find((i) => i.id === entry.id);
    lines.push(
      `| ${entry.name} | ${entry.taxonomy} | ${inventory?.complexity ?? "—"} | ${entry.states.join(", ")} | ${entry.radixPrimitive ?? "—"} |`,
    );
  }

  lines.push(``, `### Brand Kit`, ``);
  lines.push(`#### Color Rules`, ``);
  lines.push(`- **Accent:** ${brandKit.colorRules.accentUsage}`);
  lines.push(`- **Semantic:** ${brandKit.colorRules.semanticUsage}`);
  lines.push(`- **Neutral:** ${brandKit.colorRules.neutralUsage}`);
  lines.push(`- **Forbidden:** ${brandKit.colorRules.forbiddenPatterns.join("; ")}`);
  lines.push(``, `#### Typography Rules`, ``);
  lines.push(`- **Display:** ${brandKit.typographyRules.displayUsage}`);
  lines.push(`- **Body:** ${brandKit.typographyRules.bodyUsage}`);
  lines.push(`- **Mono:** ${brandKit.typographyRules.monoUsage}`);
  lines.push(`- **Weights:** ${brandKit.typographyRules.weightRules}`);
  lines.push(`- **Sizes:** ${brandKit.typographyRules.sizeRules}`);
  lines.push(``, `#### Spacing Rules`, ``);
  lines.push(`- **Sections:** ${brandKit.spacingRules.sectionMargins}`);
  lines.push(`- **Components:** ${brandKit.spacingRules.componentPadding}`);
  lines.push(`- **Rhythm:** ${brandKit.spacingRules.rhythmDescription}`);
  lines.push(``, `#### Motion Rules`, ``);
  lines.push(`- **Transitions:** ${brandKit.motionRules.transitions}`);
  lines.push(`- **Easing:** ${brandKit.motionRules.easing}`);
  lines.push(`- **Duration:** ${brandKit.motionRules.duration}`);
  lines.push(``, `#### Signature Moves`, ``);
  for (const move of brandKit.signatureMoves) {
    lines.push(`- ${move}`);
  }
  lines.push(``, `#### Anti-Patterns`, ``);
  for (const ap of brandKit.antiPatterns) {
    lines.push(`- ${ap}`);
  }

  lines.push(``, `### UX Design Plan`, ``);
  lines.push(`- **Navigation:** ${uxDesignPlan.navigationStrategy}`);
  lines.push(`- **Surface Rhythm:** ${uxDesignPlan.surfaceRhythm}`);
  lines.push(`- **Interaction Patterns:** ${uxDesignPlan.interactionPatterns}`);
  lines.push(`- **Density Strategy:** ${uxDesignPlan.densityStrategy}`);
  lines.push(``, `#### Primary Actions per Screen`, ``);
  for (const [screenId, action] of Object.entries(uxDesignPlan.primaryActionPerScreen)) {
    lines.push(`- **${screenId}:** ${action}`);
  }

  lines.push(``, `### Component Inventory (${componentInventory.length} total)`, ``);
  lines.push(`- **Low complexity:** ${complexityCounts.low ?? 0}`);
  lines.push(`- **Medium complexity:** ${complexityCounts.medium ?? 0}`);
  lines.push(`- **High complexity:** ${complexityCounts.high ?? 0}`);
  lines.push(``, `Generated at ${output.componentsManifest.generatedAt}`);

  return lines.join("\n");
}

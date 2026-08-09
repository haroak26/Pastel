import { z } from "zod";
import type { Brief, Tokens, LayoutPlan, ComponentsManifest } from "./types";
import { chatJSON, MAX_TOKENS_PER_CALL } from "../../gateway";

// ── Zod validation schemas (mirrors ./types) ──────────────────────────

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

// ── AI prompts ────────────────────────────────────────────────────────

function planLayoutSystem(): string {
  return `You are a structural UI and information-architecture planner. Your job is to take a product brief and design tokens and produce a screen-by-screen layout plan with grid regions and component slots.

SCREEN PLANNING:
- Determine which screens this product needs based on its niche, audience, platform, and personality.
- Common screens: landing, dashboard, detail, settings, profile, search, browse, feed, checkout, onboarding, etc.
- Be specific to the product domain — a fintech app needs different screens than a social feed or a devtools console.
- Every screen gets a short id (kebab-case), a human-readable name, a route path, and a one-sentence description of its purpose.

REGION PLANNING:
- Each screen uses a 12-column desktop grid (gridColumns: 12).
- Divide each screen into named regions — these are the structural zones the viewport is divided into.
- Each region has a role:
  - "nav" — navigation bars, toolbars, breadcrumbs, topbars
  - "hero" — hero sections, page headers, feature showcases
  - "content" — main content zones (lists, grids, feeds, forms)
  - "sidebar" — side panels, filters, secondary navigation
  - "footer" — page footers, legal links
  - "main" — primary content area when the screen's focus is a single central zone
- Regions should map to real UI zones, not abstract containers. Think about what the user actually sees.

COMPONENT PLANNING:
- Each region contains componentType slots — these describe what UI component fills that part of the region.
- Taxonomy levels:
  - "primitive" — base interactive elements (Button, Input, Link, Textarea, Checkbox, Select)
  - "atom" — single-purpose, standalone (Badge, Avatar, Icon, Divider, Label, Tag)
  - "molecule" — composed from primitives/atoms into a reusable unit (MetricCard, CommentRow, SearchBar, FormField, StatCard)
  - "organism" — entire sections composed from molecules (MetricGrid, ActivityFeed, ProductGallery, SettingsForm, DataTable)
- Describe each component by its role and what it displays, not by implementation details.
- Use domain-specific, meaningful names. A health app has "WorkoutCard", not "GenericCard". A devtools app has "DeploymentRow", not "ListItem".

GLOBAL REGIONS:
- Define regions that appear on every screen (e.g., a global navigation bar, a global footer, a shared sidebar).
- These are the "chrome" — the persistent UI that frames every page.

BREAKPOINTS:
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

function planLayoutUser(brief: Brief, tokens: Tokens): string {
  const tokenSummary = {
    fontDisplay: tokens.typography.fontFamily.display,
    fontBody: tokens.typography.fontFamily.body,
    fontMono: tokens.typography.fontFamily.mono,
    accentPalette: tokens.color.accent,
    breakpoints: tokens.breakpoints,
    spaceScaleKeys: Object.keys(tokens.space).join(", "),
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

DESIGN TOKENS SUMMARY:
${JSON.stringify(tokenSummary, null, 2)}

Plan the screens, regions, and component slots for this product.`;
}

// ── Manifest builder prompts ──────────────────────────────────────────

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

// ── Implementation ─────────────────────────────────────────────────────

export async function planLayout(brief: Brief, tokens: Tokens): Promise<LayoutPlan> {
  return chatJSON<LayoutPlan>(
    [
      { role: "system", content: planLayoutSystem() },
      { role: "user", content: planLayoutUser(brief, tokens) },
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
  layout: LayoutPlan,
): Promise<ComponentsManifest> {
  const seen = new Map<string, { name: string; taxonomy: string; description: string }>();

  const collect = (regions: typeof layout.screens[number]["regions"]) => {
    for (const region of regions) {
      for (const ct of region.componentTypes) {
        const key = `${ct.name}|${ct.taxonomy}`;
        if (!seen.has(key)) {
          seen.set(key, { name: ct.name, taxonomy: ct.taxonomy, description: ct.description });
        }
      }
    }
  };

  for (const screen of layout.screens) {
    collect(screen.regions);
  }
  collect(layout.globalRegions);

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

export function mergeLayoutPlan(
  _brief: Brief,
  _tokens: Tokens,
  layout: LayoutPlan,
  manifest: ComponentsManifest,
): string {
  const taxonomyCounts: Record<string, number> = {};
  for (const e of manifest.entries) {
    taxonomyCounts[e.taxonomy] = (taxonomyCounts[e.taxonomy] ?? 0) + 1;
  }

  const lines: string[] = [
    `## Layout & IA Plan`,
    ``,
    `### Screens (${layout.screens.length})`,
    ``,
  ];

  for (const screen of layout.screens) {
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

  if (layout.globalRegions.length > 0) {
    lines.push(`### Global Regions`, ``);
    for (const region of layout.globalRegions) {
      const slots = region.componentTypes.map((c) => `${c.name} (${c.taxonomy})`).join(", ");
      lines.push(`- \`${region.name}\` [${region.role}] → ${slots}`);
    }
    lines.push(``);
  }

  lines.push(
    `### Breakpoints`,
    ``,
    ...Object.entries(layout.breakpoints).map(([k, v]) => `- **${k}:** ${v}`),
    ``,
  );

  lines.push(
    `### Component Manifest (${manifest.entries.length} unique components)`,
    ``,
  );

  for (const taxon of ["organism", "molecule", "atom", "primitive"] as const) {
    const count = taxonomyCounts[taxon] ?? 0;
    if (count > 0) {
      lines.push(`- **${taxon}s:** ${count}`);
    }
  }
  lines.push(``);

  lines.push(`| Component | Taxonomy | States | Radix |`);
  lines.push(`|-----------|----------|--------|-------|`);
  for (const e of manifest.entries) {
    lines.push(
      `| ${e.name} | ${e.taxonomy} | ${e.states.join(", ")} | ${e.radixPrimitive ?? "—"} |`,
    );
  }

  return lines.join("\n");
}

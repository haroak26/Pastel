import { z } from "zod";
import type {
  Brief,
  Tokens,
  LayoutPlan,
  ScreenPlan,
  ScreenRegion,
  ComponentsManifest,
  ComponentManifestEntry,
  PropContract,
} from "./types";
import type { ProductContext } from "./anti-slop";
import { loadAllDesignLaws, loadAllComponentLaws } from "./knowledge";
import { antiSlopSystemPrompt, contextCompositionRules } from "./anti-slop";
import { baseComponentNames } from "./lib/base-components";
import { chatJSON, MAX_TOKENS_PER_CALL, type ChatMessage } from "../../gateway";

// ── BrandKit / UX plan (v6 shapes) ──────────────────────────────────────

export interface BrandKit {
  colorRules: { accentUsage: string; semanticUsage: string; neutralUsage: string; forbiddenPatterns: string[] };
  typographyRules: { displayUsage: string; bodyUsage: string; monoUsage: string; weightRules: string; sizeRules: string };
  spacingRules: { sectionMargins: string; componentPadding: string; rhythmDescription: string };
  motionRules: { transitions: string; easing: string; duration: string };
  signatureMoves: string[];
  antiPatterns: string[];
  generatedAt: string;
}

export interface UXDesignPlan {
  navigationStrategy: string;
  surfaceRhythm: string;
  interactionPatterns: string;
  densityStrategy: string;
  primaryActionPerScreen: Record<string, string>;
  generatedAt: string;
}

export interface ArchitectureOutput {
  layoutPlan: LayoutPlan;
  componentsManifest: ComponentsManifest;
  brandKit: BrandKit;
  uxDesignPlan: UXDesignPlan;
  componentInventory: Array<{ id: string; name: string; taxonomy: string; complexity: "low" | "medium" | "high" }>;
}

// ── Base component vocabulary (curated one-liners for the model) ────────

const BASE_DESCRIPTIONS: Record<string, string> = {
  "button": "Action trigger. Variants: default|outline|secondary|ghost|destructive|link. Sizes: xs|sm|default|lg|icon. THE primary CTA everywhere.",
  "button-group": "Segmented control — a row of connected toggles (filter pills, view switchers).",
  "input": "Single-line text field (label via <Label> or <Field>). Sizes: default|sm|lg.",
  "textarea": "Multi-line text field.",
  "native-select": "Native <select> — good enough for small option lists; lighter than select.",
  "select": "Fully accessible custom select (scrollable, keyboard). Use for 3+ options.",
  "checkbox": "Checkable option — multiple selection, settings, filters.",
  "radio-group": "Exclusive choice set (2-5 options).",
  "switch": "On/off toggle — settings rows, feature flags.",
  "slider": "Range/value slider (budgets, scales, filters).",
  "label": "Accessible field label (htmlFor wiring).",
  "field": "Label + input + description + error wrapper — use for all forms.",
  "input-group": "Input with affixed icon or button.",
  "badge": "Compact status/label chip (counts, states, tags).",
  "avatar": "Entity photo or initials tile (users, orgs, items).",
  "kbd": "Keyboard shortcut hint.",
  "card": "Surface container: CardTitle/CardDescription/CardContent/CardFooter/CardHeader. Main content panel on raised surfaces.",
  "dialog": "Modal overlay for focused tasks (forms, detail views).",
  "alert-dialog": "Destructive-confirmation modal (delete flows).",
  "sheet": "Side drawer (settings, filters, navigation on desktop).",
  "drawer": "Bottom sheet (mobile-first panels).",
  "popover": "Floating contextual panel (filters, quick actions, help).",
  "dropdown-menu": "Menu of actions from a trigger (row actions, profile menu).",
  "context-menu": "Right-click action menu.",
  "tooltip": "Hover hint on icons and truncated content.",
  "hover-card": "Preview card on hover (entity summaries).",
  "tabs": "Tabbed section switch (primary/secondary content).",
  "accordion": "Collapsible FAQ / settings groups.",
  "collapsible": "Expand/collapse panel (advanced filters, long sections).",
  "separator": "Vertical/horizontal divider.",
  "progress": "Progress bar (goals, streaks, uploads).",
  "skeleton": "Loading placeholder blocks.",
  "table": "Table primitives: TableHeader/TableBody/TableRow/TableCell. For data with columns.",
  "pagination": "Paged navigation.",
  "scroll-area": "Custom scrollable region.",
  "navigation-menu": "Top nav with dropdown submenus (landing pages).",
  "breadcrumb": "Hierarchy trail (docs, admin).",
  "menubar": "Desktop application menu bar.",
  "sidebar": "App shell sidebar with navigation (needs use-mobile). Use for dashboard-style apps.",
  "toggle": "Single toggle button (favorite, pin, bookmark).",
  "toggle-group": "Exclusive toggle set (list/grid view switch).",
  "input-otp": "One-time passcode entry (verify codes).",
  "command": "⌘K command palette (search + jump navigation).",
  "resizable": "Draggable panel splitter (devtools, editors, mail).",
  "alert": "Inline status message (info/success/warning/error).",
  "sonner": "Toast notifications (toaster mounted once at app root).",
  "spinner": "Loading spinner (use inside buttons for loading states).",
  "aspect-ratio": "Fixed-aspect media frame.",
  "calendar": "Date grid picker (needs react-day-picker).",
  "chart": "Recharts wrapper: area/bar/line/pie/radar/scatter charts. For dashboards.",
  "carousel": "Swipeable media gallery.",
  "bubble": "Chat message bubble.",
  "message": "Chat message row with avatar + bubble.",
  "message-scroller": "Auto-scrolling chat message list.",
  "attachment": "File attachment row (chat/forms).",
  "empty": "Empty-state block (no results, no items yet).",
  "item": "List item container (compound list rows).",
  "marker": "Progress marker (steps, milestones).",
  "combobox": "Searchable combobox (base-ui) — pick a record from a large list.",
  "questionnaire": "Multi-step guided form (onboarding, checkout steps).",
};

// ── Zod schemas ──────────────────────────────────────────────────────────

const slotSchema = z.object({
  ref: z.string(),
  description: z.string(),
});

const regionSchema = z.object({
  name: z.string(),
  role: z.enum(["nav", "content", "sidebar", "hero", "footer", "main", "toolbar"]),
  purpose: z.string(),
  hierarchy: z.enum(["primary", "secondary", "supporting"]),
  components: z.array(slotSchema).min(1),
});

const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  description: z.string(),
  gridColumns: z.number().default(12),
  dominantMoment: z.string(),
  regions: z.array(regionSchema).min(2),
});

const manifestEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  taxonomy: z.enum(["primitive", "atom", "molecule", "organism"]),
  description: z.string(),
  baseComponent: z.string(),
  customization: z.string(),
  states: z.array(z.string()).default(["default"]),
  variants: z.record(z.array(z.string())).optional(),
  props: z.record(z.object({
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
  })).default({}),
});

const wireframeSchema = z.object({
  screens: z.array(screenSchema).min(2).max(4),
  globalRegions: z.array(regionSchema).max(4).default([]),
  components: z.array(manifestEntrySchema).min(10).max(24),
  brandKit: z.object({
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
    signatureMoves: z.array(z.string()).min(2),
    antiPatterns: z.array(z.string()).min(2),
    generatedAt: z.string().default(() => new Date().toISOString()),
  }),
  uxDesignPlan: z.object({
    navigationStrategy: z.string(),
    surfaceRhythm: z.string(),
    interactionPatterns: z.string(),
    densityStrategy: z.string(),
    primaryActionPerScreen: z.record(z.string()),
    generatedAt: z.string().default(() => new Date().toISOString()),
  }),
});

// ── THE WIREFRAME PROMPT (v6 — 100x) ────────────────────────────────────

const WIREFRAME_SYSTEM = `You are the principal product designer + information architect for a design studio that ships hand-crafted, distinctive UI. You translate a product brief into a wireframe (screens, regions, component slots) AND the component manifest that will build it — every component is a customized edit of a shadcn base component, so your job is to decide WHICH base component and HOW to customize it.

# THE LAYOUT LAW (non-negotiable)

1. ONE dominant moment per screen. Every screen opens with a single, unambiguous visual anchor:
   - apps/social: a scoreboard (giant tabular numbers), a live feed, a primary list, or a working canvas — NEVER a welcome banner.
   - landing: a search-or-product hero — one headline, one subhead, ONE primary CTA with a real action verb.
   - docs: the sidebar + readable content column.
2. Hierarchy: each screen has exactly ONE primary region, 1-3 secondary regions, and supporting regions (toolbars, panels, footers for landing only). Primary regions are visually loud (display-scale type, dominant surfaces); secondary regions are quiet.
3. Spacing rhythm: sections vary (py-10 → py-16 → py-20). Never uniform section heights across a screen. Prose ≤ 65ch. UI container ≤ 1200px, centered.
4. Chrome rules: apps get a topbar (and optional sidebar); NEVER hero or footer on app/social/docs screens. Landing pages get nav → hero → alternating feature rows → proof → CTA → footer.
5. Cards are a condiment, not the meal: ≤ 3 cards per screen; prefer tables, divided rows, and custom compositions for lists and data.
6. Grid: 12-column desktop grid; define where content spans 3/6/9/12 columns in region purposes. Mobile is single-column with the dominant moment first.

# THE COMPONENT LAW

- Every manifest entry MUST pick one base component from the provided list (the FULL list of shadcn base components available to edit).
- The manifest is the design contract: name entries for THIS product ("GoalCard", "SpendingBreakdown") — never generic ("StatCard", "InfoPanel") unless it is genuinely chrome.
- Each entry needs a precise "customization" instruction: sizing (control heights), rounding (which radius language), colour usage (where accent goes, what surfaces), density, and what makes it feel like THIS product. The build agent will edit the base source using exactly these instructions.
- Cover the essentials per product: buttons, inputs, cards/panels, badges, avatars, tabs/nav, tables or lists, an empty state, a dialog or sheet for primary actions, and 2-4 domain-specific molecules/organisms.
- Taxonomy: primitive = base interactive (button, input, select…); atom = single-purpose standalone (badge, avatar, icon…); molecule = composed unit (search bar, goal row, metric tile); organism = full section (metrics grid, activity feed, settings form).

# THE UNIQUENESS LAW

- Two screens in the SAME product must not share a region structure. A dashboard and a settings screen must look structurally different.
- This product must not look like the last product we shipped. Inject the creative seed: it defines the signature moves, the surface treatment, and the dominant moments.
- Every region and component slot must be justified by the product's actual workflow — no filler "newsletter" sections, no generic feature grids unless the product is literally that.

# WIREFRAME NOTATION

Each region gets: name, role (nav/content/sidebar/hero/footer/main/toolbar), purpose (what the user does here — one sentence), hierarchy (primary/secondary/supporting), and component slots (ref = manifest component id, description = what this slot shows with its data).

Use the product context rules below for shape. Output ONLY the JSON — complete, valid, every field present.`;

function baseVocabularyBlock(): string {
  const names = baseComponentNames();
  const lines = names.map((n) => {
    const desc = BASE_DESCRIPTIONS[n] ?? "Base shadcn component.";
    return `- ${n} — ${desc}`;
  });
  return lines.join("\n");
}

export interface WireframeInput {
  brief: Brief;
  tokens: Tokens;
  productContext: ProductContext;
  creativeSeed: string;
  contextDescription: string;
}

export async function runArchitecture(input: WireframeInput): Promise<ArchitectureOutput> {
  const { brief, tokens, productContext, creativeSeed, contextDescription } = input;

  const designLaws = loadAllDesignLaws();
  const componentLaws = loadAllComponentLaws();
  const contextRules = contextCompositionRules(productContext);

  const messages: ChatMessage[] = [
    { role: "system", content: WIREFRAME_SYSTEM },
    {
      role: "user",
      content: [
        `## PRODUCT BRIEF`,
        `Name: ${brief.productName}`,
        `Description: ${brief.description}`,
        `Audience: ${brief.audience}`,
        `Niche: ${brief.niche}`,
        `Personality: ${brief.personality.join(", ")}`,
        `Density: ${brief.density}`,
        `Mode: ${brief.mode}`,
        `Platform: ${brief.platform}`,
        `Creative seed: ${creativeSeed}`,
        `Context: ${contextDescription}`,
        "",
        `## PRODUCT CONTEXT RULES`,
        contextRules,
        "",
        `## DESIGN LAWS (knowledge base)`,
        designLaws.slice(0, 4200),
        "",
        `## COMPONENT LAWS (knowledge base)`,
        componentLaws.slice(0, 2400),
        "",
        `## DESIGN GUARDRAILS`,
        antiSlopSystemPrompt(),
        "",
        `## AVAILABLE BASE COMPONENTS (edit these; every manifest entry picks one)`,
        baseVocabularyBlock(),
        "",
        `## THEME SUMMARY`,
        `Accent: ${tokens.color.accent["500"]} (interactive ${tokens.color.accent["600"]}) · Radius base: ${tokens.radius.lg} · Motion: ${tokens.motion.character}`,
        `Fonts: ${tokens.typography.fontFamily.display} / ${tokens.typography.fontFamily.body}`,
        `Personality: ${brief.personality.join(", ")}`,
        "",
        `## OUTPUT CONTRACT`,
        `- 2-4 screens MAX. Each screen: id (kebab), name, route, description, gridColumns (12), dominantMoment (one sentence), regions (2-6, each with name/role/purpose/hierarchy/components[{ref,description}]).`,
        `- globalRegions: chrome shared by all screens (topbar, sidebar, nav) with component slots.`,
        `- components: 10-24 entries. Each: id (kebab, referenced by slots), name (product-specific), taxonomy, description, baseComponent (EXACT name from the available list), customization (precise edit instructions: sizing/rounding/colour-usage/density/brand-specific detail), states (default/hover/focus/active/disabled/loading/empty/error), variants (optional map of variant-name → option list), props (map: prop-name → {type, required, description} — types are TS types like string, number, boolean, {name:string}[]; date props MUST be typed string (ISO), never Date).`,
        `- Every slot ref must exist in components. Every baseComponent must exist in the available list.`,
        `- brandKit: colour/typography/spacing/motion usage rules + signatureMoves (the creative seed expressed concretely) + antiPatterns.`,
        `- uxDesignPlan: navigationStrategy, surfaceRhythm, interactionPatterns, densityStrategy, primaryActionPerScreen (one primary action per screen).`,
        "",
        `Generate the complete wireframe + manifest JSON now.`,
      ].join("\n"),
    },
  ];

  const result = await chatJSON<z.infer<typeof wireframeSchema>>(messages, {
    model: "wireframe",
    temperature: 0.7,
    maxTokens: MAX_TOKENS_PER_CALL.wireframe,
    validate: (v) => {
      const parsed = wireframeSchema.parse(v);
      return parsed;
    },
  });

  // Post-validate slot refs / base components; heal unknown refs.
  const baseNames = new Set(baseComponentNames());
  const compIds = new Set(result.components.map((c) => c.id));
  for (const c of result.components) {
    if (!baseNames.has(c.baseComponent)) {
      c.baseComponent = nearestBase(c.baseComponent, baseNames) ?? "button";
    }
  }
  const heal = (regions: Array<{ components: Array<{ ref: string }> }>) => {
    for (const r of regions) {
      for (const s of r.components) {
        if (!compIds.has(s.ref)) {
          const entry = result.components.find((c) => c.name === s.ref);
          if (entry) s.ref = entry.id;
        }
      }
    }
  };
  heal(result.screens.flatMap((s) => s.regions));
  heal(result.globalRegions);

  const layoutPlan: LayoutPlan = {
    screens: result.screens.map((s) => ({
      id: s.id,
      name: s.name,
      route: s.route,
      description: s.description,
      gridColumns: s.gridColumns ?? 12,
      dominantMoment: s.dominantMoment,
      regions: s.regions.map((r) => ({
        name: r.name,
        role: r.role,
        purpose: r.purpose,
        hierarchy: r.hierarchy,
        componentTypes: r.components.map((cs) => ({ name: cs.ref, taxonomy: "molecule", description: cs.description })),
      })),
    })),
    globalRegions: result.globalRegions.map((r) => ({
      name: r.name,
      role: r.role,
      purpose: r.purpose,
      hierarchy: r.hierarchy,
      componentTypes: r.components.map((cs) => ({ name: cs.ref, taxonomy: "molecule", description: cs.description })),
    })),
    breakpoints: tokens.breakpoints,
  };

  const componentsManifest: ComponentsManifest = {
    generatedAt: new Date().toISOString(),
    entries: result.components.map((c): ComponentManifestEntry => ({
      id: c.id,
      name: c.name,
      taxonomy: c.taxonomy,
      description: c.description,
      baseComponent: c.baseComponent,
      customization: c.customization,
      states: c.states as ComponentManifestEntry["states"],
      ...(c.variants ? { variants: c.variants } : {}),
      props: c.props,
    })),
  };

  const componentInventory = componentsManifest.entries.map((e) => ({
    id: e.id,
    name: e.name,
    taxonomy: e.taxonomy,
    complexity: Object.keys(e.props).length > 6 || e.taxonomy === "organism" ? "high" as const : e.taxonomy === "molecule" ? "medium" as const : "low" as const,
  }));

  return {
    layoutPlan,
    componentsManifest,
    brandKit: { ...result.brandKit, generatedAt: new Date().toISOString() },
    uxDesignPlan: { ...result.uxDesignPlan, generatedAt: new Date().toISOString() },
    componentInventory,
  };
}

function nearestBase(name: string, available: Set<string>): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const target = norm(name);
  let best: string | null = null;
  let bestScore = 0;
  for (const a of available) {
    const score = similarity(target, norm(a));
    if (score > bestScore) { best = a; bestScore = score; }
  }
  return bestScore >= 0.6 ? best : null;
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  let common = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) common++;
  }
  return common / Math.max(a.length, b.length);
}

// ── Prop contract (deterministic, from the manifest) ────────────────────

export function buildPropContract(manifest: ComponentsManifest): PropContract {
  return {
    generatedAt: new Date().toISOString(),
    entries: manifest.entries.map((e) => ({
      componentId: e.id,
      componentName: e.name,
      props: e.props,
      importPath: `./${kebab(e.name)}`,
    })),
  };
}

function kebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export { kebab, BASE_DESCRIPTIONS };

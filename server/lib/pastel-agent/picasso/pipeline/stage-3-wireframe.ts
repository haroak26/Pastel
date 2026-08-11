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

// ── BrandKit / UX plan (v6 shapes, v7-hardened) ─────────────────────────

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
  "combobox": "Searchable combobox — pick a record from a large list.",
  "questionnaire": "Multi-step guided form (onboarding, checkout steps).",
};

// ── Zod schemas ──────────────────────────────────────────────────────────
//
// V7 contract: descriptive/prose leaves carry `.default()` so a model that
// underfills a trailing prose field can never abort the run. STRUCTURAL
// fields (screens, components arrays, ids, routes, refs, baseComponent
// names, taxonomy enums) stay required — they genuinely break codegen.

const slotSchema = z.object({
  ref: z.string(),
  description: z.string().default(""),
});

const regionSchema = z.object({
  name: z.string(),
  role: z.enum(["nav", "content", "sidebar", "hero", "footer", "main", "toolbar"]),
  purpose: z.string().default(""),
  hierarchy: z.enum(["primary", "secondary", "supporting"]),
  components: z.array(slotSchema).min(1),
});

const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  description: z.string().default(""),
  gridColumns: z.coerce.number().default(12),
  dominantMoment: z.string().default(""),
  regions: z.array(regionSchema).min(2),
});

const manifestEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  taxonomy: z.enum(["primitive", "atom", "molecule", "organism"]),
  description: z.string().default(""),
  baseComponent: z.string(),
  customization: z.string().default(""),
  states: z.preprocess(
    (v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v as Record<string, unknown>) : v),
    z.array(z.string()).default(["default"]),
  ),
  variants: z.record(z.array(z.string())).optional(),
  props: z.record(z.object({
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
  })).default({}),
});

/** Call A — STRUCTURE: screens + globalRegions + component manifest.
 *  This is the part that needs the full design-law / component-law context
 *  and the base-component vocabulary. Structural failure here is a real
 *  failure (nothing to build from), so no fallback is wired in — the
 *  orchestrator degrades the run instead. */
export const structureSchema = z.object({
  screens: z.array(screenSchema).min(2).max(4),
  globalRegions: z.array(regionSchema).max(4).default([]),
  components: z.array(manifestEntrySchema).min(10).max(24),
});

// ── Call B schemas — brandKit + UX plan, entirely prose ─────────────────
//
// Every leaf has a deterministic `.default()` derived from the tokens and
// creative seed already computed in stages 1-2. A dropped
// `spacingRules.rhythmDescription` now costs nothing — the model call
// succeeds, zod fills the gap, and the run moves on.

function spaceScale(tokens: Tokens): string {
  const values = Object.values(tokens.space ?? {});
  return values.filter((v): v is string => typeof v === "string").slice(0, 8).join(", ");
}

export function brandKitSchemaFor(tokens: Tokens, creativeSeed: string) {
  const accent = tokens.color?.accent?.["500"] ?? "#0d9488";
  const accent600 = tokens.color?.accent?.["600"] ?? accent;
  const fast = tokens.motion?.duration?.fast ?? "120ms";
  const base = tokens.motion?.duration?.base ?? "200ms";
  const slow = tokens.motion?.duration?.slow ?? "300ms";
  const easing = tokens.motion?.easing?.standard ?? "cubic-bezier(0.4, 0, 0.2, 1)";
  const display = tokens.typography?.fontFamily?.display ?? "the display face";
  const body = tokens.typography?.fontFamily?.body ?? "the body face";
  const mono = tokens.typography?.fontFamily?.mono ?? "the mono face";
  const space = spaceScale(tokens);

  const colorRules = z.object({
    accentUsage: z.string().default(
      `Accent ${accent} is a spotlight: the primary CTA, active nav, focus rings, and one dominant highlight per screen. Interactive hover moves to ${accent600}. Never an accent page wash.`,
    ),
    semanticUsage: z.string().default(
      "Semantic tokens (success/warning/danger/info) are reserved for status, validation and data meaning — never decoration.",
    ),
    neutralUsage: z.string().default(
      "Neutral tokens carry chrome and surfaces; cards and panels use the surface tokens. Hairlines via border tokens.",
    ),
    forbiddenPatterns: z.array(z.string()).default([
      "No gradients or glassmorphism blur washes",
      "No default Tailwind palette colours (text-gray-400, bg-blue-500)",
      "No raw hex/rgb()/hsl() literals in components",
      "Accent never as a background wash",
    ]),
  });
  const typographyRules = z.object({
    displayUsage: z.string().default(`"${display}" only for the dominant moment and section headlines — 2-3 display moments per screen.`),
    bodyUsage: z.string().default(`"${body}" for all body text, 65ch max measure, left-aligned.`),
    monoUsage: z.string().default(`"${mono}" for numbers, codes, timestamps and tabular data.`),
    weightRules: z.string().default("Semibold/bold for headlines; regular/medium for body; emphasis is the exception, not the rule."),
    sizeRules: z.string().default("Use the token type scale with a clear 4px hierarchy; never more than one oversized number per screen."),
  });
  const spacingRules = z.object({
    sectionMargins: z.string().default(`Sections step through the token spacing scale (${space}); never uniform section rhythm.`),
    componentPadding: z.string().default("16-24px internal padding for controls and panels, consistent with the base spacing scale."),
    rhythmDescription: z.string().default("Varied section rhythm: alternate spacious and tight bands using the token spacing scale."),
  });
  const motionRules = z.object({
    transitions: z.string().default(`Transitions on hover/focus/enter only, using the theme durations (fast ${fast} · base ${base} · slow ${slow}).`),
    easing: z.string().default(`Standard easing ${easing} for all motion; no exotic spring constants.`),
    duration: z.string().default(`fast ${fast} · base ${base} · slow ${slow} — state changes fast, panels at base, large surfaces at slow.`),
  });

  return z.object({
    // Whole-sub-object defaults: a model that drops an entire nested rules
    // object (not just a leaf) must still be absorbed by the schema.
    colorRules: colorRules.default(() => colorRules.parse({})),
    typographyRules: typographyRules.default(() => typographyRules.parse({})),
    spacingRules: spacingRules.default(() => spacingRules.parse({})),
    motionRules: motionRules.default(() => motionRules.parse({})),
    signatureMoves: z.array(z.string()).min(2).default([
      `"${creativeSeed}" — the defining visual gesture, repeated deliberately (never everywhere).`,
      `One oversized, tabular display moment per screen (the dominant moment carries it).`,
    ]),
    antiPatterns: z.array(z.string()).min(2).default([
      "Stock shadcn look — every component must be visibly customized for this product",
      "Accent colour washes and gradient backgrounds",
      "Uniform section heights and monotonous spacing",
      "Generic template copy and placeholder data",
    ]),
    generatedAt: z.string().default(() => new Date().toISOString()),
  });
}

export function uxPlanSchemaFor(brief: Brief) {
  const density = brief.density ?? "balanced";
  return z.object({
    navigationStrategy: z.string().default("Top-level navigation lives in the global chrome (topbar/sidebar); in-screen travel via tabs and contextual actions."),
    surfaceRhythm: z.string().default("Alternate spacious and tight sections using the token spacing scale; one dominant surface per screen."),
    interactionPatterns: z.string().default("Every interactive element keeps hover, focus-ring, active and disabled states; standard easing from the tokens."),
    densityStrategy: z.string().default(`Match the brief's ${density} density: standard control heights (h-9/h-10), padding from the token scale.`),
    primaryActionPerScreen: z.record(z.string()).default({}),
    generatedAt: z.string().default(() => new Date().toISOString()),
  });
}

// ── THE WIREFRAME PROMPT (V7 — structure call A only) ───────────────────

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
- Each entry needs a precise "customization" instruction. A good customization reads like a design-review note a product designer leaves for an engineer: it names at least TWO concrete axes — control heights/sizing (h-9 vs h-11, compact vs spacious), corner radius language (which rounded-* family), colour/accent placement (where bg-primary goes, which surfaces), font weight or scale — plus one product-specific detail that makes it feel like THIS product.
- Cover the essentials per product: buttons, inputs, cards/panels, badges, avatars, tabs/nav, tables or lists, an empty state, a dialog or sheet for primary actions, and 2-4 domain-specific molecules/organisms.
- Taxonomy: primitive = base interactive (button, input, select…); atom = single-purpose standalone (badge, avatar, icon…); molecule = composed unit (search bar, goal row, metric tile); organism = full section (metrics grid, activity feed, settings form).

# THE UNIQUENESS LAW

- Two screens in the SAME product must not share a region structure. A dashboard and a settings screen must look structurally different.
- This product must not look like the last product we shipped. Inject the creative seed: it defines the signature moves, the surface treatment, and the dominant moments.
- Every region and component slot must be justified by the product's actual workflow — no filler "newsletter" sections, no generic feature grids unless the product is literally that.

# WIREFRAME NOTATION

Each region gets: name, role (nav/content/sidebar/hero/footer/main/toolbar), purpose (what the user does here — one sentence), hierarchy (primary/secondary/supporting), and component slots (ref = manifest component id, description = what this slot shows with its data).

Use the product context rules below for shape. Output ONLY the JSON — complete, valid, every field present.`;

/** Call B system prompt — brand kit + UX plan, grounded in the finished
 *  component manifest so the rules match what was actually planned. */
const BRAND_SYSTEM = `You are the brand designer + UX architect on the same studio team. The wireframe and component manifest for the product are already planned — your job is to write the brand usage rules and the UX plan that make those components feel like ONE product. You do not design screens or components; you write rules.

# BRAND RULES
- colourRules: where the accent is allowed (a spotlight, never a wash), what semantic colours mean, how neutrals carry chrome, what is forbidden.
- typographyRules: which face does display work, which carries body, where mono appears, weight and size discipline.
- spacingRules: section rhythm, internal component padding, how the spacing scale should feel (never uniform).
- motionRules: what transitions, which easing, which durations — tied to the theme motion tokens provided.
- signatureMoves: 2-4 concrete, repeatable gestures that make someone say "I know this product" — the creative seed expressed as design moves. Never generic ("smooth animations", "clean cards").
- antiPatterns: 2-4 things the build must never do (stock shadcn look, accent washes, gradient walls, template copy).

# UX PLAN
- navigationStrategy, surfaceRhythm, interactionPatterns, densityStrategy: 1-2 sentences each, concrete, tied to the planned screens.
- primaryActionPerScreen: one primary action per screen id from the manifest (the thing a user should be able to do first on that screen).

Output ONLY the JSON — complete, valid, every field present.`;

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
  /** V8: bounded re-architecture notes from the wireframe confirmation gate
   *  revision round-trip — never a full pipeline restart. */
  revisionNotes?: string;
}

// ── Deterministic prose healing (Call A post-parse) ─────────────────────

const REGION_PURPOSE_DEFAULTS: Record<string, string> = {
  nav: "Primary navigation between screens",
  content: "Main content area — the screen's work happens here",
  sidebar: "Secondary navigation and contextual tools",
  hero: "Opening hero moment that leads the screen",
  footer: "Page footer with supporting links",
  main: "Main content region",
  toolbar: "Actions and filters toolbar",
};

function healRegionPurpose(role: string, name: string): string {
  return REGION_PURPOSE_DEFAULTS[role] ?? `Supports the ${name} region of the layout`;
}

/** Customization specificity axes — a customization must concretely name at
 *  least TWO before it counts as a real design-review note. */
const CUSTOMIZATION_AXES: Array<[string, RegExp]> = [
  ["sizing", /(siz(e|ing)|height|h-8|h-9|h-10|h-11|density|padding|compact|spacious|larger|smaller|bigger|taller|slimmer)/],
  ["radius", /(radius|rounded|corner|pill|squar(e|ed)|sharp|soft|radius language)/],
  ["colour", /(colou?r|accent|surface|tint|hue|palette|primary|secondary|muted|border)/],
  ["type", /(weight|font|type[- ]?scale|display|body|mono|letter[- ]?spacing|tracking|uppercase|bold|semibold)/],
];

/** Deterministic, token-derived customization when the model's instruction
 *  was vague or missing — keeps stage-4's edit instructions concrete. */
export function ensureCustomizationSpecificity(
  entry: { name: string; taxonomy: string; customization?: string },
  tokens: Tokens,
): string {
  const c = (entry.customization ?? "").trim();
  const axesHit = CUSTOMIZATION_AXES.filter(([, re]) => re.test(c)).length;
  if (axesHit >= 2) return entry.customization ?? "";

  const accent = tokens.color?.accent?.["500"] ?? "the accent";
  const accent600 = tokens.color?.accent?.["600"] ?? accent;
  const radius = tokens.radius?.lg ?? "the theme radius";
  const display = tokens.typography?.fontFamily?.display ?? "the display face";
  const body = tokens.typography?.fontFamily?.body ?? "the body face";
  const role = entry.taxonomy === "primitive" ? "primitive" : "product-specific";

  return `${entry.name} (${role}): use the ${radius} radius language (rounded-* family) for corners, ${accent} accent only on the active/primary state with ${accent600} on interactive hover, standard control heights (h-9/h-10) with padding from the spacing scale, and type at ${body} weights with ${display} reserved for display moments.`;
}

function healStructureProse(result: z.infer<typeof structureSchema>, brief: Brief): void {
  const regionPurpose = (r: z.infer<typeof regionSchema>): string => r.purpose?.trim() ? r.purpose : healRegionPurpose(r.role, r.name);

  for (const s of result.screens) {
    if (!s.description.trim()) s.description = `The ${s.name} screen of ${brief.productName}.`;
    if (!s.dominantMoment.trim()) {
      const primary = s.regions.find((r) => r.hierarchy === "primary") ?? s.regions[0];
      s.dominantMoment = primary
        ? `The ${primary.name} region opens the screen as the dominant visual anchor.`
        : `The primary content region opens the screen.`;
    }
    for (const r of s.regions) {
      r.purpose = regionPurpose(r);
      for (const slot of r.components) {
        if (!slot.description.trim()) {
          const entry = result.components.find((c) => c.id === slot.ref);
          slot.description = entry ? `Renders ${entry.name} with the screen's data.` : `Renders the slotted component with the screen's data.`;
        }
      }
    }
  }
  for (const r of result.globalRegions) {
    r.purpose = regionPurpose(r);
    for (const slot of r.components) {
      if (!slot.description.trim()) {
        const entry = result.components.find((c) => c.id === slot.ref);
        slot.description = entry ? `Renders ${entry.name} in shared chrome.` : `Renders the slotted component in shared chrome.`;
      }
    }
  }
}

// ── Call builders ───────────────────────────────────────────────────────

function structureMessages(input: WireframeInput): ChatMessage[] {
  const { brief, tokens, productContext, creativeSeed, contextDescription } = input;
  const designLaws = loadAllDesignLaws();
  const componentLaws = loadAllComponentLaws();
  const contextRules = contextCompositionRules(productContext);
  const revisionBlock = input.revisionNotes
    ? [
        "",
        `## REVISION NOTES FROM THE USER (incorporate ALL of these)`,
        input.revisionNotes,
      ].join("\n")
    : "";

  return [
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
        `- components: 10-24 entries. Each: id (kebab, referenced by slots), name (product-specific), taxonomy, description, baseComponent (EXACT name from the available list), customization (a precise design-review note naming at least TWO of: control heights/sizing, corner radius language, colour/accent placement, font weight or scale, density — never a vague genre description), states (default/hover/focus/active/disabled/loading/empty/error), variants (optional map of variant-name → option list), props (map: prop-name → {type, required, description} — types are TS types like string, number, boolean, {name:string}[]; date props MUST be typed string (ISO), never Date).`,
        `- Every slot ref must exist in components. Every baseComponent must exist in the available list.`,
        revisionBlock,
        "",
        `Generate the complete wireframe + component manifest JSON now.`,
      ].join("\n"),
    },
  ];
}

function brandMessages(input: WireframeInput, structure: z.infer<typeof structureSchema>): ChatMessage[] {
  const { brief, tokens, creativeSeed, contextDescription } = input;
  const manifestSummary = structure.components
    .map((c) => `- ${c.name} (${c.taxonomy}) from ${c.baseComponent}: ${(c.customization || "default customization").slice(0, 160)}`)
    .join("\n");

  return [
    { role: "system", content: BRAND_SYSTEM },
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
        `Creative seed: ${creativeSeed}`,
        `Context: ${contextDescription}`,
        "",
        `## PLANNED SCREENS (from the wireframe)`,
        structure.screens.map((s) => `- ${s.id} — ${s.name} (${s.description})`).join("\n"),
        "",
        `## PLANNED COMPONENTS (the manifest the brand rules must fit)`,
        manifestSummary,
        "",
        `## THEME TOKENS (the rules must reference these)`,
        `Accent: ${tokens.color.accent["500"]} (interactive ${tokens.color.accent["600"]}) · Radius base: ${tokens.radius.lg}`,
        `Fonts: ${tokens.typography.fontFamily.display} / ${tokens.typography.fontFamily.body} / ${tokens.typography.fontFamily.mono}`,
        `Motion: ${tokens.motion.character} (fast ${tokens.motion.duration.fast} · base ${tokens.motion.duration.base} · slow ${tokens.motion.duration.slow})`,
        `Easing: ${tokens.motion.easing.standard}`,
        "",
        `## OUTPUT CONTRACT`,
        `- brandKit: { colorRules{accentUsage, semanticUsage, neutralUsage, forbiddenPatterns[]}, typographyRules{displayUsage, bodyUsage, monoUsage, weightRules, sizeRules}, spacingRules{sectionMargins, componentPadding, rhythmDescription}, motionRules{transitions, easing, duration}, signatureMoves[2-4], antiPatterns[2-4] }`,
        `- uxDesignPlan: { navigationStrategy, surfaceRhythm, interactionPatterns, densityStrategy, primaryActionPerScreen{<screen-id>: <primary action>} }`,
        "",
        `Generate the brand kit + UX plan JSON now.`,
      ].join("\n"),
    },
  ];
}

// ── The stage ───────────────────────────────────────────────────────────

export async function runArchitecture(input: WireframeInput): Promise<ArchitectureOutput> {
  const { brief, tokens, creativeSeed } = input;

  // ══ CALL A — STRUCTURE (screens + globalRegions + component manifest) ══
  const structure = await chatJSON<z.infer<typeof structureSchema>>(structureMessages(input), {
    model: "wireframe",
    temperature: 0.7,
    maxTokens: MAX_TOKENS_PER_CALL.wireframe,
    validate: (v) => structureSchema.parse(v),
    // Salvage: an unparseable/truncated response is only repairable when the
    // structural core (screens + components) survived. Missing structural
    // arrays decline repair — the orchestrator degrades the run.
    repair: (payload, _err) => {
      if (!payload || typeof payload !== "object") return null;
      const p = payload as Record<string, unknown>;
      if (!Array.isArray(p.screens) || (p.screens as unknown[]).length === 0) return null;
      if (!Array.isArray(p.components) || (p.components as unknown[]).length === 0) return null;
      return payload as z.infer<typeof structureSchema>;
    },
  });

  // Post-validate slot refs / base components; heal unknown refs + prose.
  const baseNames = new Set(baseComponentNames());
  const compIds = new Set(structure.components.map((c) => c.id));
  for (const c of structure.components) {
    if (!baseNames.has(c.baseComponent)) {
      c.baseComponent = nearestBase(c.baseComponent, baseNames) ?? "button";
    }
  }
  const heal = (regions: Array<{ components: Array<{ ref: string }> }>) => {
    for (const r of regions) {
      for (const s of r.components) {
        if (!compIds.has(s.ref)) {
          const entry = structure.components.find((c) => c.name === s.ref);
          if (entry) s.ref = entry.id;
        }
      }
    }
  };
  heal(structure.screens.flatMap((s) => s.regions));
  heal(structure.globalRegions);
  healStructureProse(structure, brief);

  // ══ CALL B — BRAND KIT + UX PLAN (small, grounded in Call A's manifest) ══
  const brandKitSchema = brandKitSchemaFor(tokens, creativeSeed);
  const uxSchema = uxPlanSchemaFor(brief);
  const brandSchema = z.object({
    // Whole-object defaults: a model that drops brandKit or uxDesignPlan
    // entirely is absorbed here — every leaf has a deterministic default.
    brandKit: brandKitSchema.default(() => brandKitSchema.parse({})),
    uxDesignPlan: uxSchema.default(() => uxSchema.parse({})),
  });
  const brand = await chatJSON<z.infer<typeof brandSchema>>(brandMessages(input, structure), {
    model: "brandKit",
    temperature: 0.6,
    maxTokens: MAX_TOKENS_PER_CALL.brandKit,
    validate: (v) => brandSchema.parse(v),
    // brandKit/uxDesignPlan are entirely descriptive — salvage any partial
    // object and let the schema's leaf defaults fill whatever is missing.
    repair: (payload) => (payload && typeof payload === "object" ? (payload as z.infer<typeof brandSchema>) : null),
    // Deterministic last resort: the same defaults the schema uses, so the
    // pipeline can never die on missing prose.
    fallback: () => brandSchema.parse({}),
  });

  const layoutPlan: LayoutPlan = {
    screens: structure.screens.map((s): ScreenPlan => ({
      id: s.id,
      name: s.name,
      route: s.route,
      description: s.description,
      gridColumns: s.gridColumns ?? 12,
      dominantMoment: s.dominantMoment,
      regions: s.regions.map((r): ScreenRegion => ({
        name: r.name,
        role: r.role,
        purpose: r.purpose,
        hierarchy: r.hierarchy,
        componentTypes: r.components.map((cs) => ({ name: cs.ref, taxonomy: "molecule", description: cs.description })),
      })),
    })),
    globalRegions: structure.globalRegions.map((r): ScreenRegion => ({
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
    entries: structure.components.map((c): ComponentManifestEntry => ({
      id: c.id,
      name: c.name,
      taxonomy: c.taxonomy,
      description: c.description,
      baseComponent: c.baseComponent,
      customization: ensureCustomizationSpecificity(c, tokens),
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
    brandKit: { ...brand.brandKit, generatedAt: new Date().toISOString() },
    uxDesignPlan: { ...brand.uxDesignPlan, generatedAt: new Date().toISOString() },
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

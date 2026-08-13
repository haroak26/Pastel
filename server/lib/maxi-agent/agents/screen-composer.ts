import { chatText, extractFencedBlock, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { ANTI_SLOP } from "../anti-slop";
import { datasetPrompt, type MockDataset } from "../lib/content";
import { agentStageLaw } from "../knowledge/component-law";
import type { ProductBrief, WireframePlan, ComponentInventory, CopyPlan, ResolvedTheme, BlockInstance, WireframeScreen, UxDesignPlan, VisualIntent, ComponentUISpec, V21LayoutPlan } from "../schemas";
import type { VisualReference } from "../types";

/**
 * V21 Screen Composer — the model writes each screen's LAYOUT BODY, filling
 * a DETERMINISTIC PLACEMENT PLAN instead of inventing structure.
 *
 * v20 let the composer decide where sections go, which produced sparse,
 * unbalanced screens (huge empty regions, boards with one card per column,
 * odd alignment). V21 derives the placement plan deterministically
 * (lib/layout-plan.ts) and the composer's ONLY job is to fill it: render the
 * planned sections in order with the planned placements and headers, using
 * the run's built components and data.
 *
 * Hard rules added in V21:
 * - Every section is wrapped in a <section> element (the layout gate counts
 *   these to verify the plan was followed).
 * - Every non-dominant section opens with <SectionHeader eyebrow= title= />.
 * - At most TWO custom components per screen (the clutter cap).
 * - No company reference imagery in the prompt (base64 images were the
 *   dominant token cost); the user's visual target attaches when present.
 */

export interface ScreenComposerInput {
  brief: ProductBrief;
  /** The single screen to compose. */
  screen: WireframeScreen;
  wireframe: WireframePlan;
  inventory: ComponentInventory;
  /** Built component source code keyed by inventory name (builder output). */
  builtComponents: Record<string, string>;
  /** Per-component prop specs (planner output) — the model passes real props. */
  specs: Record<string, ComponentUISpec>;
  copy: CopyPlan;
  theme: ResolvedTheme;
  data: MockDataset;
  ux?: UxDesignPlan | null;
  visual?: VisualIntent | null;
  companyBlock: string;
  /** V21: the deterministic placement plan this screen MUST render. */
  layoutPlan?: V21LayoutPlan | null;
  visualReference?: VisualReference;
  onUsage?: OnUsage;
  /** V20: rejection feedback from the previous attempt (per screen) — the
   * retry is directive, not a blind repeat. */
  retryNotes?: string[];
}

export interface ScreenComposerOutput {
  /** The JSX body — what goes inside <main>. No imports, no wrapper. */
  body: string;
  usedFallback: boolean;
  notes: string[];
}

const SYSTEM = `You are the senior product designer and frontend engineer for a real startup team. You design production UI — the kind a top-tier company ships in its actual app. Users should look at your screen and think a human design team built it.

You write the BODY of one app screen (the content inside the page's main column). You are NOT composing a landing page and NOT building the whole page shell — the sidebar/topbar and the Screen wrapper already exist around your body.

## YOUR JOB (V21 — you fill a plan, you do NOT invent placement)

A deterministic LAYOUT PLAN is provided in the user message. It lists EXACTLY the sections this screen must contain, in EXACTLY this order, with EXACTLY these placements (full / split-left / split-right), widths, height intents, surfaces, and headers. Your job is to FILL that plan with real product content — you do not add, merge, reorder, or drop sections, and you do not move anything.

Placement rules:
- "full": the section spans the full content column.
- "split-left" + "split-right": these two sections render SIDE-BY-SIDE in one row (the split-left section takes the larger 2/3 share). Wrap BOTH in a single row container: <div className="grid gap-8 lg:grid-cols-[2fr_1fr]"> — split-left section inside, then split-right section.
- The dominant moment (marked "header[none — dominant moment]") is full-width and display-scale: the largest type on the page, the product's star content. It carries NO header.
- Every OTHER section opens with <SectionHeader eyebrow={...} title={...} /> using the planned eyebrow/title. Do not write headings by hand — SectionHeader is the only section heading component.

## HARD STRUCTURAL RULES — violate any and the screen will be REJECTED

- Wrap every section in a <section> element: <section className="..."> ... </section>. The layout gate counts these to verify the plan.
- Do not exceed ${"4"} custom components mounted on one screen (mount only the planned component mounts listed in the plan).
- Never duplicate a custom component on one screen.
- Use ONLY the custom components listed under "AVAILABLE COMPONENTS" and the primitives (Card/Table/Button/Avatar/Badge/Input/Select/Separator/Progress) + SectionHeader — NEVER invent a component name.
- Every custom component you mount MUST receive the exact props its spec declares (the specs are listed). Pass REAL data from the DATA object into those props — never empty arrays, never placeholder values.
- You may use IconOf (from ../lib/shell.jsx) for icons: <IconOf name="heart" />. Icon names: home, list, chart, settings, users, bell, search, plus, download, filter, arrowRight, mail, alert, file, edit, check, zap, card, trendingUp, play, heart, mapPin, star, clock, image, more, chevronDown, calendarDays.
- lucide-react icons are NOT imported in the shell — use IconOf only.

### Tokens & colors — HARD
- Every color comes from CSS custom properties: bg-background, bg-card, bg-primary, text-primary, text-foreground, text-muted-foreground, bg-muted, bg-muted/50, bg-muted/30, bg-accent, bg-success/15, text-success, bg-warning/15, text-warning, bg-destructive/15, text-destructive, border-border, border-input, ring-ring, bg-primary/90.
- NEVER hardcode: #hex, rgb(), rgba(), hsl(), bg-blue-500, text-indigo-600, or any raw Tailwind color literal.
- The accent color appears 3-7 times per screen MAXIMUM. The screen must not read as "the accent-color screen."
- Never blue-to-purple gradients. Never gradient backgrounds at all. No floating geometric blobs, dots, or abstract decorations.
- Elevation (V22): no drop-shadows on non-interactive panels. shadow-[var(--shadow-sm)] / shadow-[var(--shadow-md)] are reserved for floating/overlay elements (dropdowns, popovers, modals) and the ONE dominant surface per screen — never general card panels. Everything else stays flat.

### Typography
- Fonts come from the theme: var(--font-display) for headings, var(--font-body) for text. The Screen wrapper already sets fontFamily: var(--font-body).
- The dominant moment must be UNMISTAKABLE: its key value renders at display scale (text-4xl or text-4xl sm:text-5xl) in tabular-nums, inside the dominant surface. If the screen reads fine without a display-scale element, it is a template — the dominant moment is the screen's largest element by far.
- Section headings ONLY via <SectionHeader>. Never write an underlined or hand-styled heading.
- Body: text-base. Labels: text-sm or text-xs, text-muted-foreground.
- NEVER center-align body copy. Left-align by default. Center is only for empty states or a deliberate statement band.
- Headings use text-balance. Long text uses max-w-prose or line-clamp. No overflow.

### Layout & rhythm
- Sections stack in the 8px rhythm: py-8 (32px), py-12 (48px), py-16 (64px). Adjacent sections NEVER share the same padding — alternate deliberately. The dominant moment takes the largest step.
- Section-to-section gap >= 32px. Never two sections flush.
- Content is the planned max width (max-w-[...]) mx-auto px-6 md:px-8. Full-bleed (w-full) is reserved for tonal bands (bg-muted/50) — never the whole screen.
- Vary section HEIGHTS and widths intentionally. Asymmetry (2/3 + 1/3 columns) is welcome and reads as designed.
- Never use negative margins. Never fixed-height text containers. Content determines height.
- No two identical sections in a row. If two sections would look the same, change the surface (band vs rows vs plain) or the plan already handles it.

### Surfaces — pick the RIGHT container, never default to cards
- tonal-band: bg-muted/50 full-width band — for the dominant moment, stat scoreboards, closing actions.
- soft-wash: bg-muted/30 subtle tint — for stat clusters, charts, product grids.
- divided-list: border-b rows with divide-y — for activity, feeds, sequences, tables. NO card wrapper.
- inset-panel: rounded-[var(--radius-lg)] border bg-card px-6 py-5 — SPARINGLY, ONE per screen max.
- plain: no wrapper — for search toolbars, filter rows, plain content.
- card: rounded-[var(--radius-lg)] border bg-card — ONLY for a detail summary card. Never a grid of identical cards.
- Maximum 3 card surfaces per screen TOTAL. Prefer bands, washes, and divided rows.
- Never two adjacent sections on the same surface.

### Copy
- Copy is already written — use the provided copy for this screen (headlines, CTAs, labels). NEVER write your own marketing copy.
- Never "Get started" + "Learn more". Never AI-slop phrases.
- Every number shown must come from DATA. No placeholder values, no "—", no "0.0".

### Density
- Every section is POPULATED with real data. No blank sections, no empty vertical gaps.
- Every list/sequence has 4+ rows. Every table 3+ rows.
- The screen must feel composed — content flows top-to-bottom as ONE story, one dominant moment, everything else supporting it.

### Navigation & context
- This is an APP screen. No marketing hero (centered headline + subhead + CTA), no footer, no "Sign in"/"Get started" topbar.
- The dominant moment matches the plan's marked section.
- Detail screens: show ONE item and nothing else from the catalog. One primary action. The media/summary is the star.

${ANTI_SLOP}
`;

function surfaceFor(inst: BlockInstance, ux?: UxDesignPlan | null): string {
  const uxScreen = ux?.screens.find((s) => s.screenId === inst.block);
  void uxScreen;
  switch (inst.block) {
    case "hero": return "tonal-band (bg-muted/50 full-width)";
    case "stats": return inst.variant === "scoreboard" ? "soft-wash (bg-muted/30)" : "soft-wash";
    case "chart": return "soft-wash (bg-muted/30)";
    case "list": return inst.variant === "cards" ? "soft-wash product grid" : "divided-list (border-b rows, no card wrapper)";
    case "media": return "plain (gallery tiles, aspect-ratio fixed)";
    case "detail": return "inset-panel (ONE sticky summary card) + info column";
    case "cta": return "tonal-band (bg-muted/50)";
    case "table": return "inset-panel or plain table with hairlines";
    case "search": return "plain toolbar";
    case "custom": return "the custom component defines its own surface — mount it cleanly";
    case "topbar": return "handled by the shell — do not render";
    case "sidebar": return "handled by the shell — do not render";
    default: return "plain";
  }
}

export async function runScreenComposer(input: ScreenComposerInput): Promise<ScreenComposerOutput> {
  const { screen, brief } = input;
  const c = input.copy.screens.find((s) => s.screenId === screen.id) ?? { screenId: screen.id, headline: screen.id };

  // Data structure the model reads.
  const dataStructure = screen.id === "detail"
    ? `DATA.screens.detail.item — the ONE selected item { name, detail, amount, status, date, owner, fields?, dates?, guests? }
DATA.screens.detail.fields — [{ label, value }] fact pairs for the item
DATA.screens.detail.reviews — social proof for this item
DATA.screens.detail.summary — { price, total, dates, guests, nightly } booking summary (transact only)
DATA.screens.detail.images — [0,1,2,3,4] index array for the item's gallery
DATA.screens.detail.primaryCta — the item's action label
DATA.people — { name, role, initials, hue }[]`
    : `DATA.screens.home.rows — the product's items [{ id, name, detail, amount, status, date, owner }]
DATA.screens.home.metrics — [{ label, value, unit, delta, positive, note }] (4)
DATA.screens.home.series — [{ label, unit, points }] time series
DATA.screens.home.activity — string[] recent activity lines
DATA.screens.home.features — [{ name, description, priority }]
DATA.people — { name, role, initials, hue }[]`;

  const blocksBlock = screen.blocks
    .map((b) => {
      const emphasis = b.emphasis ? " [DOMINANT]" : "";
      const component = b.component ? ` (component: ${b.component})` : "";
      const surface = surfaceFor(b, input.ux);
      return `- ${b.block}${b.variant ? ":" + b.variant : ""}${emphasis}${component} — surface: ${surface}${b.content ? ` — "${b.content}"` : ""}`;
    })
    .join("\n");

  const available = Object.keys(input.builtComponents).sort();
  const specsBlock = available
    .map((name) => {
      const spec = input.specs[name];
      const code = input.builtComponents[name];
      const propsLine = spec
        ? `props: ${spec.props.map((p) => `${p.name}:${p.type}${p.default ? `=${p.default}` : ""}`).join(", ")}`
        : `props: (component built without a planner spec — pass items/metrics/people/className as available)`;
      const codePreview = code ? code.slice(0, 900) : "";
      return `### ${name}\n${propsLine}\n\`\`\`jsx\n${codePreview}\n\`\`\``;
    })
    .join("\n\n");

  const copyBlock = JSON.stringify(c, null, 2);

  const retryBlock = input.retryNotes && input.retryNotes.length > 0
    ? `\n\n## PREVIOUS ATTEMPT WAS REJECTED — DO NOT REPEAT THESE MISTAKES\n${input.retryNotes.map((n) => `- ${n}`).join("\n")}\nReview what was rejected and produce a corrected body. Never reference a component that is not in AVAILABLE COMPONENTS.`
    : "";

  const dataBlock = datasetPrompt(input.data);

  const tokensBlock = [
    "DESIGN TOKENS — use these CSS custom properties only:",
    "colors: bg-background, bg-card, bg-muted, bg-muted/50, bg-muted/30, bg-primary, text-primary, text-foreground, text-muted-foreground, bg-success/15, text-success, bg-warning/15, text-warning, bg-destructive/15, text-destructive, border-border, border-input, ring-ring",
    `radius: rounded-[var(--radius-sm)], rounded-[var(--radius-md)], rounded-[var(--radius-lg)], rounded-[var(--radius-xl)]`,
    `controls: h-[var(--control-sm)], h-[var(--control-md)], h-[var(--control-lg)]`,
    `fonts: var(--font-display), var(--font-body)`,
    `status colors: success, warning, destructive (from tokens)`,
  ].join("\n");

  const visualBlock = input.visual
    ? `VISUAL INTENT:\n- typeVoice: ${input.visual.typeVoice}\n- spacingMood: ${input.visual.spacingMood}\n- cornerLanguage: ${input.visual.cornerLanguage}\n- surfaceTreatment: ${input.visual.surfaceTreatment}\n- accentBehavior: ${input.visual.accentBehavior}\n- mediaStrategy: ${input.visual.mediaStrategy}\n- mediaSubject: ${input.visual.mediaSubject}`
    : "VISUAL INTENT: standard";

  // V21: the layout plan is the placement contract. Fall back to a minimal
  // block list if the plan is missing (legacy callers/tests).
  const planBlock = input.layoutPlan
    ? layoutPlanPromptFor(input.layoutPlan, screen.id)
    : `PLAN (legacy fallback — render the wireframe blocks in order):\n${blocksBlock}`;

  // V21: the user's visual target attaches (it IS the design direction), but
  // company reference imagery does not — base64 images were the dominant
  // token cost of every compose call.
  let refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  let refText = "";
  if (input.visualReference) {
    refImages.push(...input.visualReference.images);
    refText = "## PRODUCT VISUAL TARGET\nMatch the attached product's composition, hierarchy, density, surfaces, and spacing. Do not copy its branding or content.\n";
  }

  const user = `PRODUCT: ${brief.title} — ${brief.productType}\n${brief.description}\n\nSCREEN TO COMPOSE: ${screen.id} — ${screen.purpose}\n\n${planBlock}\n\nAVAILABLE COMPONENTS (mount only the planned ones — pass REAL data):\n${specsBlock}\n\n${dataStructure}\n\nCOPY FOR THIS SCREEN:\n${copyBlock}\n\n${dataBlock}\n\n${tokensBlock}\n\n${visualBlock}\n\n${agentStageLaw()}\n\n${input.companyBlock}${retryBlock}\n\nOUTPUT — the screen BODY as JSX (no imports, no export, no wrapper, no <main>). A single fragment of <section> elements following the LAYOUT PLAN exactly. Use only available components + SectionHeader + IconOf + plain elements. Pass real data from DATA. Wrap every section in <section>. Leave no planned custom component unmounted.`;

  const textPart = [refText, user].filter(Boolean).join("\n\n");

  try {
    const raw = await chatText(
      [
        { role: "system" as const, content: SYSTEM },
        { role: "user" as const, content: refImages.length > 0 ? [{ type: "text" as const, text: textPart }, ...refImages] : textPart },
      ],
      {
        model: "compose",
        temperature: 0.6,
        maxTokens: MAX_TOKENS_PER_CALL.compose,
        onUsage: input.onUsage,
      },
    );
    const body = (extractFencedBlock(raw, "jsx") ?? extractFencedBlock(raw, "js") ?? raw).trim();
    if (body.length < 40) {
      console.warn("[pastel v21] screen composer returned an empty body for screen:", screen.id);
      return { body: "", usedFallback: true, notes: [`empty composer output for ${screen.id} — body is too short`] };
    }
    return { body, usedFallback: false, notes: [] };
  } catch (err) {
    console.warn("[pastel v21] screen composer failed for screen:", screen.id, err instanceof Error ? err.message : err);
    return { body: "", usedFallback: true, notes: [`composer model call failed for ${screen.id}: ${err instanceof Error ? err.message : String(err)}`] };
  }
}

/** Extract one screen's plan contract from the full V21 layout plan. */
function layoutPlanPromptFor(plan: V21LayoutPlan, screenId: string): string {
  const screen = plan.screens.find((s) => s.screenId === screenId);
  if (!screen) return "PLAN: render the wireframe blocks in order.";
  const lines = ["## LAYOUT PLAN (HARD — render exactly this, in this order)"];
  lines.push(`Content max ${screen.contentMaxWidth ?? 1280}px, frame ${screen.frame}`);
  for (const sec of screen.sections) {
    const header = sec.header
      ? ` header[eyebrow="${sec.header.eyebrow ?? ""}" title="${sec.header.title}"${sec.header.action ? ` action="${sec.header.action}"` : ""}]`
      : " header[none — dominant moment]";
    const comp = sec.component ? ` component=${sec.component}` : "";
    const surface = sec.surface ? ` surface=${sec.surface}` : "";
    lines.push(`- ${sec.block}:${sec.variant ?? "default"} placement=${sec.placement} width=${sec.width} height=${sec.heightIntent}${surface}${comp}${header}`);
  }
  lines.push("Render these sections in EXACTLY this order with EXACTLY these placements. Never add, merge, reorder, or drop a section.");
  return lines.join("\n");
}

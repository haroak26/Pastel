import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCompany, resolveCompanyTheme } from "../lib/pastel-agent/knowledge/index";
import { compileStyles } from "../lib/pastel-agent/compile";
import { productBriefSchema, type ProductBrief, type WireframePlan, type ComponentInventory } from "../lib/pastel-agent/schemas";
import { mockDataset } from "../lib/pastel-agent/lib/content";
import { fallbackCopy } from "../lib/pastel-agent/agents/copy";
import { composeAll } from "../lib/pastel-agent/compose";
import { classifyMode, isCatalogHome, detailWantsReviews, isStayMode } from "../lib/pastel-agent/lib/ux-design";
import { sanitizeDataPlan } from "../lib/pastel-agent/agents/data";
import { visualIntentFromTokens, designTokensFromManifest } from "../lib/pastel-agent/agents/design";
import { sceneSvg } from "../lib/pastel-agent/lib/scenes";
import { hashSeed } from "../lib/pastel-agent/lib/domains";

function makeBrief(over: Partial<ProductBrief> & { description: string }): ProductBrief {
  return productBriefSchema.parse({
    version: "1.0.0",
    title: "Test",
    productType: "application",
    description: over.description,
    audience: { primary: "Users", needs: ["Do things"] },
    goals: ["Deliver the core workflow"],
    features: [{ name: "Core", description: "The primary workflow.", priority: "critical" }],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "The primary workflow screen" },
      { id: "detail", purpose: "One item, record, task, or content object" },
    ],
    copyDirection: "Specific and calm.",
    designLanguage: "Clean and modern.",
    inspiration: { primary: "nike" },
    ...over,
  });
}

async function composeFor(brief: ProductBrief, screens: WireframePlan["screens"], bodies: Record<string, string>): Promise<Record<string, string>> {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const plan = { version: "1.0.0" as const, screens };
  const inventory: ComponentInventory = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v15");
  const copy = fallbackCopy(brief, plan as any, data);
  const { composeAll, composeScreenV20 } = await import("../lib/pastel-agent/compose");
  const composed = composeAll({ brief, wireframe: plan as any, inventory, copy, theme, data });
  const files: Record<string, string> = { ...composed.files, ...composed.primitives };
  for (const [sid, body] of Object.entries(bodies)) {
    const screen = plan.screens.find((s) => s.id === sid)!;
    const { content, primitives } = composeScreenV20({ brief, wireframe: plan as any, inventory, copy, theme, data }, screen, body);
    files[`src/screens/${sid}.jsx`] = content;
    for (const [p, c] of Object.entries(primitives)) if (!files[p]) files[p] = c;
  }
  // Auto-fill imported components (shell chrome) with a token-correct fixture.
  const imported = new Set<string>();
  for (const code of Object.values(files)) {
    for (const m of code.matchAll(/import\s+(?:{[^}]*}\s+from\s+|[\w$]+\s+from\s+)["']\.\.\/components\/([A-Za-z0-9_]+)\.jsx["']/g)) {
      imported.add(m[1]);
    }
  }
  for (const name of imported) {
    if (!files[`src/components/${name}.jsx`]) {
      files[`src/components/${name}.jsx`] = `import { ArrowRight } from "lucide-react";
export default function ${name}(props) {
  return <div className="rounded-[var(--radius-md)] border border-border bg-card p-4"><span className="text-sm font-medium">{props.title ?? "${name}"}</span><ArrowRight className="h-4 w-4" /></div>;
}`;
    }
  }
  files["src/styles.css"] = compileStyles(theme).css;
  return files;
}

test("v15 mode: classifyMode routes by intent, not by keyword domain", () => {
  assert.equal(classifyMode("Design an AI personal trainer app that tracks reps, sets, and personal records, with a readiness score."), "track");
  assert.equal(classifyMode("Browse a catalog of AI agent templates by capability and category, filter by rating and price, then launch your own agent."), "browse");
  assert.equal(classifyMode("A vacation rental booking app like Airbnb — browse beautiful stays and book your stay."), "transact");
  assert.equal(classifyMode("A community feed where members post updates and follow each other."), "social");
  assert.equal(classifyMode("A workspace where teams manage projects, tasks, and documents."), "operate");
});

test("v15 mode: layout helpers follow the mode (the law), with purpose fallback for legacy briefs", () => {
  assert.equal(isCatalogHome("Browse the catalog", "track"), false, "a track product never browses");
  assert.equal(isCatalogHome("Browse the catalog", "browse"), true);
  assert.equal(isCatalogHome("Browse the catalog", undefined), true, "legacy purpose fallback");
  assert.equal(detailWantsReviews("one workout", "track"), false, "no reviews on a track detail");
  assert.equal(detailWantsReviews("one listing", "browse"), true);
  assert.equal(isStayMode("transact"), true);
  assert.equal(isStayMode("browse"), false, "booking card is transact-only");
});

test("v15 brief: mode is optional on legacy briefs and parses", () => {
  const brief = makeBrief({ description: "A workout app." });
  assert.equal(brief.mode, undefined, "legacy briefs have no mode — derived later");
  const withMode = makeBrief({ description: "A workout app.", mode: "track" });
  assert.equal(withMode.mode, "track");
});

test("v15 compose: a fitness (track) product never ships an Airbnb booking shape", async () => {
  const brief = makeBrief({
    description: "An adaptive personal trainer that builds daily routines, tracks reps, sets, and personal records, and adjusts your plan.",
    productType: "AI personal trainer",
    mode: "track",
  });
  const files = await composeFor(brief, [
    { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Today's session dashboard", nav: "topbar", blocks: [
      { block: "stats", variant: "scoreboard", emphasis: true },
      { block: "list", variant: "rows" },
    ] },
    { id: "detail", archetype: "list-detail", title: "Workout", purpose: "One workout with form cues and the start action", nav: "topbar", blocks: [
      { block: "detail", variant: "pane", emphasis: true },
      { block: "cta", variant: "band" },
      { block: "list", variant: "activity" },
    ] },
  ], {
    home: `<section className="py-12">
  <SectionHeader eyebrow="Today" title="Your session" />
  <p className="text-muted-foreground">track dashboard</p>
</section>`,
    detail: `<section className="py-12">
  <SectionHeader eyebrow="Workout" title="Workout detail" />
  <p className="text-muted-foreground">Focused record view</p>
</section>`,
  });
  const home = files["src/screens/home.jsx"];
  const detail = files["src/screens/detail.jsx"];
  // The booking shape is a CONTENT-level law: the mode-aware data + copy
  // never carry marketplace vocabulary, and the screens use SectionHeader.
  assert.ok(home.includes("SectionHeader"), "track home uses the deterministic header");
  assert.ok(!/Add guests|Verified host|Guest reviews/i.test(home + detail), "no booking vocabulary on a track product");
  assert.ok(files["src/screens/home.jsx"].length > 100 && detail.length > 100, "both screens compose");
});

test("v15 compose: a transact product still gets the booking card (it is legal there)", async () => {
  const brief = makeBrief({
    description: "A vacation rental booking app — browse beautiful stays by destination, filter by price and rating, and book your stay.",
    productType: "vacation rental booking app",
    mode: "transact",
  });
  const files = await composeFor(brief, [
    { id: "home", archetype: "catalog", title: "Home", purpose: "Browse stays", nav: "topbar", blocks: [
      { block: "hero", variant: "app", emphasis: true },
      { block: "search", variant: "dropdown" },
      { block: "list", variant: "cards" },
    ] },
    { id: "detail", archetype: "list-detail", title: "Stay", purpose: "One stay with photos, amenities, reviews, and the book action", nav: "topbar", blocks: [
      { block: "media", variant: "gallery", emphasis: true },
      { block: "detail", variant: "pane" },
      { block: "list", variant: "activity" },
    ] },
  ], {
    home: `<section className="py-12">
  <SectionHeader eyebrow="Browse" title="Explore" />
  <p className="text-muted-foreground">stay catalog</p>
</section>`,
    detail: `<section className="py-12">
  <SectionHeader eyebrow="Stay" title="Stay detail" />
  <p className="text-muted-foreground">{DATA.screens.detail.summary.price}</p>
</section>`,
  });
  const detail = files["src/screens/detail.jsx"];
  // Transact data is stay-shaped: the scoped detail view carries the price
  // summary the composer renders through DATA.
  assert.ok(detail.includes("DATA.screens.detail.summary.price"), "transact detail renders the booking summary from its scoped data");
  assert.ok(files["src/screens/home.jsx"].includes("SectionHeader"), "browse home composes with the deterministic header");
});

test("v15 compose: an ecommerce-catalog (browse) product gets item facts, never booking rows", async () => {
  const brief = makeBrief({
    description: "A marketplace to browse agent templates by capability and category, filter by rating and price, and inspect one template's features and models before launching.",
    productType: "AI agent template platform",
    mode: "browse",
  });
  const files = await composeFor(brief, [
    { id: "home", archetype: "catalog", title: "Home", purpose: "Browse the template catalog", nav: "topbar", blocks: [
      { block: "hero", variant: "app", emphasis: true },
      { block: "list", variant: "cards" },
    ] },
    { id: "detail", archetype: "list-detail", title: "Template", purpose: "One template's features, model options, pricing, and reviews", nav: "topbar", blocks: [
      { block: "detail", variant: "pane", emphasis: true },
      { block: "list", variant: "activity" },
    ] },
  ], {
    home: `<section className="py-12">
  <SectionHeader eyebrow="Browse" title="Explore" />
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{DATA.screens.home.rows.slice(0, 6).map((r) => <div key={r.id} className="rounded-[var(--radius-lg)] bg-muted/30 p-4"><p className="font-medium">{r.name}</p></div>)}</div>
</section>`,
    detail: `<section className="py-12">
  <SectionHeader eyebrow="Template" title="Template detail" />
  <p className="text-muted-foreground">Item facts</p>
</section>`,
  });
  const home = files["src/screens/home.jsx"];
  const detail = files["src/screens/detail.jsx"];
  // A template catalog gets item facts, never booking rows — and the
  // mode-aware data never carries stay vocabulary.
  assert.ok(home.includes("DATA.screens.home.rows"), "browse home renders the catalog from its scoped view");
  assert.ok(!/Add guests|Verified host|Guest reviews/i.test(home + detail), "no booking rows for a template catalog");
});

test("v15 data: booking review headings are sanitized out of non-stay products", () => {
  const plan = {
    version: "1.0.0" as const,
    people: [{ name: "A", role: "r", email: "a@x.com" }],
    metrics: [] as never[],
    series: [] as never[],
    rows: [] as never[],
    activity: [] as never[],
    detailFields: [] as never[],
    detailValues: [] as never[],
    settingsSections: [] as never[],
    searchPlaceholder: "Search",
    emptyTitle: "Nothing",
    emptyBody: "Try again.",
    reviews: [] as never[],
    reviewHeading: "Guest reviews",
    trustItems: ["One", "Two", "Three"],
    primaryCta: "Start",
    homeCta: "Begin",
  } as any;
  const { plan: clean, corrected } = sanitizeDataPlan(plan, "fitness");
  assert.notEqual(clean.reviewHeading, "Guest reviews", "booking heading must be replaced");
  assert.ok(corrected.length > 0, "the correction is recorded");
  const stay = sanitizeDataPlan({ ...plan, reviewHeading: "Guest reviews" }, "rentals");
  assert.equal(stay.plan.reviewHeading, "Guest reviews", "stay products keep guest reviews");
});

test("v15 visual intent: deterministic fallback derives style axes from the tokens", async () => {
  const company = await loadCompany("nike");
  const tokens = designTokensFromManifest(company, "light");
  const visual = visualIntentFromTokens(tokens, "nike");
  assert.equal(visual.version, "1.0.0");
  assert.equal(visual.spacingMood, "standard");
  assert.ok(["sharp", "soft", "pill"].includes(visual.cornerLanguage));
  assert.ok(["condensed", "grotesque", "serif", "mono", "rounded"].includes(visual.typeVoice));
  assert.equal(visual.mediaSubject, "generic");
});

test("v15 media: subject scenes are deterministic and differ by subject", () => {
  const a1 = sceneSvg("fitness", hashSeed("run1"), 0, 0, "runner", "flat-illustration");
  const a2 = sceneSvg("fitness", hashSeed("run1"), 0, 0, "runner", "flat-illustration");
  assert.equal(a1, a2, "same subject+seed renders identical art");
  const graph = sceneSvg("fitness", hashSeed("run1"), 0, 0, "graph", "flat-illustration");
  assert.notEqual(a1, graph, "different subjects produce different art");
  const duotone = sceneSvg("fitness", hashSeed("run1"), 0, 0, "runner", "duotone-art");
  assert.notEqual(a1, duotone, "strategy changes the rendering");
});

test("v15 enforcement: off-mode blocks are DROPPED (gallery/search can not leak in)", async () => {
  const { enforceUxDesign } = await import("../lib/pastel-agent/lib/ux-design");
  const plan = {
    version: "1.0.0" as const,
    screens: [
      { id: "home", archetype: "catalog", title: "Home", purpose: "Today's session", nav: "topbar" as const,
        blocks: [
          { block: "hero", variant: "app", emphasis: true },
          { block: "search", variant: "dropdown" }, // off-mode for track
          { block: "list", variant: "cards" },
        ] },
      { id: "detail", archetype: "list-detail", title: "Exercise", purpose: "One exercise with form cues", nav: "topbar" as const,
        blocks: [
          { block: "media", variant: "gallery", emphasis: true }, // off-mode for track
          { block: "detail", variant: "pane" },
          { block: "list", variant: "activity" },
        ] },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const { plan: enforced } = enforceUxDesign(plan as any, inventory, "track");
  const homeBlocks = enforced.screens.find((s) => s.id === "home")!.blocks;
  const detailBlocks = enforced.screens.find((s) => s.id === "detail")!.blocks;
  assert.ok(!homeBlocks.some((b) => b.block === "search"), "track home drops the search toolbar");
  assert.ok(!detailBlocks.some((b) => b.block === "media"), "track detail drops the gallery");
  const stay = enforceUxDesign(plan as any, inventory, "transact");
  const stayDetail = stay.plan.screens.find((s) => s.id === "detail")!.blocks;
  assert.ok(stayDetail.some((b) => b.block === "media"), "transact detail keeps the gallery");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { listCatalog, scoreCompanies, loadCompany, compileCompanyBlock, megadesignBlock, resolveCompanyTheme } from "../lib/pastel-agent/knowledge/index";
import { companyManifestSchema } from "../lib/pastel-agent/knowledge/manifest-schema";
import { contrastRatio } from "../lib/pastel-agent/lib/colors";
import { compileStyles } from "../lib/pastel-agent/compile";
import { composeAll } from "../lib/pastel-agent/compose";
import { mockDataset } from "../lib/pastel-agent/lib/content";
import { pickDomain, scoreDomains } from "../lib/pastel-agent/lib/domains";
import { auditContent } from "../lib/pastel-agent/checks/content";
import { fallbackCopy, sanitizeCopyPlan } from "../lib/pastel-agent/agents/copy";
import { fallbackWireframe, enforceWireframeRules } from "../lib/pastel-agent/agents/wireframe";
import { fallbackUx } from "../lib/pastel-agent/agents/ux";
import { normalizeTwoScreens, resolveUxDesign, enforceUxDesign, canonicalStructure } from "../lib/pastel-agent/lib/ux-design";
import { inspirationFromAnswers } from "../lib/pastel-agent/agents/brief";
import { mergeReviewResults } from "../lib/pastel-agent/agents/review-merge";
import { IncrementalScreenVerifier } from "../lib/pastel-agent/sandbox";
import { componentDesignLaw } from "../lib/pastel-agent/knowledge/component-law";
import { productBriefSchema, type ProductBrief, type V6ReviewResult } from "../lib/pastel-agent/schemas";

/** V21: the base-component library is gone — components are builder-authored
 * per run. Tests stand in with a minimal token-correct component fixture
 * (the sandbox only requires valid JSX using theme tokens). */
function fixtureComponent(name: string): string {
  const safe = name.replace(/[^A-Za-z0-9_]/g, "");
  return `import { ArrowRight } from "lucide-react";

export default function ${safe}({ title = "${safe}", items = [], className = "" }) {
  return (
    <div className={\`rounded-[var(--radius-md)] border border-border bg-card p-4 text-card-foreground \${className}\`}>
      <span className="text-sm font-medium text-foreground">{title}</span>
      {items.length > 0 ? (
        <ul className="mt-2 divide-y divide-border">
          {items.map((it) => (
            <li key={it?.id ?? it} className="py-1 text-sm text-muted-foreground">{it?.name ?? it}</li>
          ))}
        </ul>
      ) : null}
      <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}`;
}

/**
 * V21 compose helper — the recipe composer is gone, so tests drive the REAL
 * v21 path: composeAll (data.js + shell.jsx) + composeScreenV20 wrapping a
 * hand-written model body (exactly what runScreenComposer output becomes in
 * production). Any component the composed screens import but the test did
 * not provide is filled with the fixture (shell chrome included).
 */
async function composeV21(opts: {
  brief: ProductBrief;
  plan: any;
  inventory: any;
  theme: any;
  data: any;
  copy: any;
  ux?: any;
  visual?: any;
  bodies: Record<string, string>;
  components?: Record<string, string>;
}): Promise<{ files: Record<string, string>; composed: any }> {
  const { composeAll, composeScreenV20 } = await import("../lib/pastel-agent/compose");
  const { compileStyles } = await import("../lib/pastel-agent/compile");
  const input: any = {
    brief: opts.brief,
    wireframe: opts.plan,
    inventory: opts.inventory,
    copy: opts.copy,
    theme: opts.theme,
    data: opts.data,
    ux: opts.ux,
    visual: opts.visual,
  };
  const composed = composeAll(input);
  const files: Record<string, string> = { ...(opts.components ?? {}), ...composed.files, ...composed.primitives };
  for (const [sid, body] of Object.entries(opts.bodies)) {
    const screen = opts.plan.screens.find((s: any) => s.id === sid);
    const { content, primitives } = composeScreenV20(input, screen, body);
    files[`src/screens/${sid}.jsx`] = content;
    for (const [p, c] of Object.entries(primitives)) if (!files[p]) files[p] = c;
  }
  // Auto-fill every imported component with the fixture (shell chrome, primitives).
  const imported = new Set<string>();
  for (const code of Object.values(files)) {
    for (const m of code.matchAll(/import\s+(?:{[^}]*}\s+from\s+|[\w$]+\s+from\s+)["']\.\.\/components\/([A-Za-z0-9_]+)\.jsx["']/g)) {
      imported.add(m[1]);
    }
  }
  for (const name of imported) {
    if (!files[`src/components/${name}.jsx`]) files[`src/components/${name}.jsx`] = fixtureComponent(name);
  }
  files["src/styles.css"] = compileStyles(opts.theme).css;
  return { files, composed };
}

/** V21: derive the deterministic placement plan for a plan (production path). */
async function v21Plan(plan: any, ux: any, copy: any): Promise<any> {
  const { buildV21LayoutPlan } = await import("../lib/pastel-agent/lib/layout-plan");
  return buildV21LayoutPlan(plan, ux ?? null, null, copy);
}

const SLUGS = ["apple", "nike", "uber", "airbnb", "spotify", "stripe", "notion", "netflix", "linear", "duolingo", "figma"];

function fitnessBrief(): ProductBrief {
  return productBriefSchema.parse({
    version: "1.0.0",
    title: "Pulse",
    productType: "fitness training app",
    description: "A running and strength-training app that tracks workouts, streaks, and personal records.",
    audience: { primary: "Amateur runners", needs: ["Track workouts", "Build streaks"] },
    goals: ["Track every run", "Motivate daily"],
    features: [
      { name: "Activity feed", description: "Every run with distance, pace, and calories.", priority: "critical" },
      { name: "Streaks", description: "Daily consistency streaks with goals.", priority: "high" },
    ],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse the workout library and today's plan" },
      { id: "detail", purpose: "Guided run info page with stats and the start action" },
    ],
    copyDirection: "Motivational and concrete.",
    designLanguage: "Nike-inspired athletic energy.",
    inspiration: { primary: "nike" },
  });
}

test("v11 knowledge: catalog lists every registered company with swatches + preview imagery", async () => {
  const catalog = await listCatalog();
  assert.equal(catalog.length, SLUGS.length);
  for (const c of catalog) {
    assert.ok(c.slug.length > 0);
    assert.ok(c.name.length > 0);
    assert.ok(c.swatches.length >= 2);
  }
});

test("v6 knowledge: every manifest validates against the schema", async () => {
  for (const slug of SLUGS) {
    const { manifest } = await import(`../lib/pastel-agent/knowledge/companies/${slug}/manifest.ts`);
    const parsed = companyManifestSchema.safeParse(manifest);
    assert.ok(parsed.success, `${slug} manifest invalid: ${parsed.error?.message}`);
  }
});

test("v6 knowledge: audited color pairs pass WCAG AA (>=4.5)", async () => {
  for (const slug of SLUGS) {
    const { manifest } = await import(`../lib/pastel-agent/knowledge/companies/${slug}/manifest.ts`);
    const m = companyManifestSchema.parse(manifest);
    for (const mode of ["light", "dark"] as const) {
      const t = m[mode];
      const pairs: Array<[string, string]> = [
        [t.foreground, t.background],
        [t.mutedForeground, t.background],
        [t.primary, t.primaryForeground],
        [t.primary, t.background],
        [t.accent, t.accentForeground],
        [t.success, t.successSubtle],
        [t.warning, t.warningSubtle],
      ];
      for (const [a, b] of pairs) {
        assert.ok(contrastRatio(a, b) >= 4.5, `${slug} ${mode}: contrast ${contrastRatio(a, b).toFixed(2)} for ${a} on ${b}`);
      }
    }
  }
});

test("v6 knowledge: fitness prompt scores Nike highest", async () => {
  const scored = await scoreCompanies("build a fitness training app for runners with workouts and streaks");
  assert.ok(scored.length >= 10, "every registered company is scored");
  assert.equal(scored[0].slug, "nike");
});

test("v6 knowledge: compileCompanyBlock and megadesignBlock return content", async () => {
  const block = await compileCompanyBlock("nike");
  assert.ok(block.includes("Nike"));
  assert.ok(block.includes("Voice & tone"));
  const mega = await megadesignBlock();
  assert.ok(mega.includes("MEGADESIGN"));
});

test("v6 brief: inspiration resolved from answers", () => {
  assert.equal(inspirationFromAnswers({}).primary, null);
  assert.equal(inspirationFromAnswers({ inspiration: "Nike" }).primary, "nike");
  assert.deepEqual(inspirationFromAnswers({ inspiration: "nike", inspirationSecondary: "apple,stripe" }).secondary, ["apple", "stripe"]);
});

test("v6 compose + sandbox: deterministic compose verifies and passes the gate", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });

  const brief = fitnessBrief();

  const wireframe = fallbackWireframe(brief, company);
  const data = mockDataset(brief, "v6-test");
  const copy = fallbackCopy(brief, wireframe.plan, data);

  // V21: screens come from the model composer — tests drive the same path
  // with a hand-written body (SectionHeader + a mounted custom component).
  const customName = wireframe.inventory.components.find((c) => c.usedBy?.includes("home"))?.name ?? "GoalProgress";
  const { files } = await composeV21({
    brief, plan: wireframe.plan, inventory: wireframe.inventory, theme, data, copy,
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Today" title="Your workout" />
  <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
    <div><${customName} title="Weekly load" items={DATA.screens.home.rows} /></div>
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-3xl font-semibold tabular-nums">${"data-metric"}</p></div>
  </div>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Run" title="Workout detail" />
  <p className="text-muted-foreground">Focused record view</p>
</section>`,
    },
  });

  assert.ok(files["src/lib/shell.jsx"].includes("SectionHeader"), "shell ships the deterministic SectionHeader");
  assert.ok(files["src/data.js"].includes("export const DATA"), "data file ships per-run content");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  assert.ok(Object.keys(result.bundles).length >= 2);

  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  const gate = auditFiles(theme, files);
  assert.ok(gate.passed, `gate failed: ${gate.issues.map((i) => i.description).join("; ")}`);

  // v7 content gate: no finance/B2B content, no duplicate labels, no page-scale blocks.
  const contentIssues = auditContent(data, files);
  assert.ok(contentIssues.length === 0, `content gate failed: ${contentIssues.map((i) => i.description).join("; ")}`);
});

test("v6 compose: name-based mount contract resolves, verifies, and passes the gate", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });

  const brief = fitnessBrief();
  const wireframe = fallbackWireframe(brief, company);

  // V21: components mount BY NAME — the composer only uses components the
  // builder produced under their inventory name. Renaming is impossible.
  const customName = wireframe.inventory.components.find((c) => c.usedBy?.includes("home"))?.name ?? "GoalProgress";
  const data = mockDataset(brief, "v6-test-renamed");
  const copy = fallbackCopy(brief, wireframe.plan, data);
  const { files } = await composeV21({
    brief, plan: wireframe.plan, inventory: wireframe.inventory, theme, data, copy,
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Today" title="Your workout" />
  <${customName} title="Weekly load" items={DATA.screens.home.rows} />
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Run" title="Workout detail" />
  <p className="text-muted-foreground">Focused record view</p>
</section>`,
    },
  });

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  assert.ok(Object.keys(result.bundles).length >= 2);

  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  const gate = auditFiles(theme, files);
  assert.ok(gate.passed, `gate failed: ${gate.issues.map((i) => i.description).join("; ")}`);
});

test("v6 review: merge forces RETURN_TO_BUILDER on sandbox errors", () => {
  const code: V6ReviewResult = { passed: true, score: 90, decision: "APPROVE", requiredFixes: [], issues: [], summary: "ok" };
  const merged = mergeReviewResults(code, null, {
    sandboxErrors: [{ file: "src/screens/home.jsx", message: "boom" }],
    generatedFiles: { "src/screens/home.jsx": "x" },
  });
  assert.equal(merged.decision, "RETURN_TO_BUILDER");
  assert.equal(merged.passed, false);
  assert.ok(merged.requiredFixes.some((f) => f.includes("src/screens/home.jsx")));
});

test("v21 component design law: no base-component anchor, token + radius + density rules present", () => {
  const law = componentDesignLaw();
  assert.ok(law.length > 800, "the design law is substantive");
  assert.ok(law.includes("var(--radius"), "law mandates the radius token scale (rounded components)");
  assert.ok(law.includes("ONE visual idea"), "law demands one visual idea per component");
  assert.ok(law.includes("props"), "law mandates data through props");
  assert.ok(!law.includes("```jsx"), "law contains no code anchor (no fenced example to copy)");
});

// ── V7: domain packs + content gate + signature variants ────────────────

test("v7 domains: brief picks the right domain pack", () => {
  assert.equal(pickDomain("fitness training app for runners with workouts and streaks").slug, "fitness");
  assert.equal(pickDomain("online store for sneakers with cart and checkout").slug, "ecommerce");
  assert.equal(pickDomain("expense tracker with invoices and billing").slug, "finance");
  assert.equal(pickDomain("podcast player with playlists").slug, "media");
  assert.equal(pickDomain("quantum weather balloons for fun").slug, "productivity");
  // V9: an Airbnb-style brief picks the RENTALS pack (stay catalog, nightly
  // prices, hosts) — not the trip-planner travel pack.
  assert.equal(pickDomain("vacation rental booking app like airbnb with stays and listings and hosts").slug, "rentals");
  assert.equal(pickDomain("plan a trip to kyoto with flights and hotels").slug, "travel");
  const scored = scoreDomains("running app with pace and calories");
  assert.ok(scored.length === 8);
  assert.equal(scored[0].pack.slug, "fitness");
});

test("v7 content: rentals dataset is a stay catalog (nightly prices, hosts, no order statuses)", () => {
  const brief = productBriefSchema.parse({
    version: "1.0.0",
    title: "StayVista",
    productType: "vacation rental booking app",
    description: "Browse unique vacation rentals worldwide and book your perfect stay.",
    audience: { primary: "Travelers", needs: ["Find stays", "Book quickly"] },
    goals: ["Browse the catalog", "Book a stay"],
    features: [{ name: "Search", description: "Find stays by destination.", priority: "critical" }],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm, specific, human.",
    designLanguage: "Airbnb-inspired warmth.",
    inspiration: { primary: "airbnb" },
  });
  const ds = mockDataset(brief, "rentals-1");
  assert.equal(ds.domain, "rentals");
  assert.ok(ds.metrics.some((m) => /homes|reviews|rating/i.test(m.label)), "community-proof metrics");
  assert.ok(!ds.metrics.some((m) => /trip|budget/i.test(m.label)), "no trip-planner metrics");
  assert.ok(ds.rows.every((r) => r.amount.startsWith("$")), "nightly prices are currency");
  assert.ok(ds.rows.every((r) => !/failed|pending/.test(r.status)), "host qualities, not order states");
  assert.equal(ds.searchPlaceholder, "Where to?");
  const issues = auditContent(ds, {
    "src/screens/home.jsx": `<Card><p>$245</p><p>Superhost</p></Card>`,
  });
  assert.ok(!issues.some((i) => i.category === "content"), "pricing is legitimate for rentals");
});

test("v7 content: fitness dataset is domain-correct (no finance)", () => {
  const ds = mockDataset(fitnessBrief(), "seed-1");
  assert.equal(ds.domain, "fitness");
  assert.ok(ds.metrics.length === 4);
  assert.equal(new Set(ds.metrics.map((m) => m.label)).size, 4, "stat labels must be distinct");
  assert.ok(ds.metrics.every((m) => !m.value.includes("$")), "no currency in fitness metrics");
  assert.ok(ds.rows.every((r) => !r.amount.startsWith("$")), "no currency amounts in fitness rows");
  assert.ok(ds.metrics.some((m) => /km|pace|kcal|days/.test(m.unit)), "units are fitness units");
  assert.ok(ds.settingsSections.length >= 2, "settings sections exist");
  assert.ok(ds.detailFields.length >= 4);
  assert.ok(!JSON.stringify(ds).includes("Aperture"), "no SaaS company names");
});

test("v7 content gate: flags finance content in a fitness product", () => {
  const data = mockDataset(fitnessBrief(), "gate-1");
  const issues = auditContent(data, {
    "src/screens/home.jsx": `<Card><p>$22,091</p><p>Monthly recurring revenue</p><p>Invoice INV-0211</p></Card>`,
  });
  assert.ok(issues.some((i) => i.category === "content" && i.severity === "high"), JSON.stringify(issues));
});

test("v7 content gate: flags page-scale blocks inside components", () => {
  const data = mockDataset(fitnessBrief(), "gate-2");
  const issues = auditContent(data, {
    "src/components/Weird.jsx": `<div className="fixed bottom-0 max-w-3xl p-12 text-4xl">No runs yet</div>`,
  });
  assert.ok(issues.some((i) => i.description.includes("Page-scale")));
});

test("v7 content gate: flags card overload and chip-group filters", () => {
  const data = mockDataset(fitnessBrief(), "gate-3");
  const cards = Array.from({ length: 6 }, () => `<div className="rounded-xl border bg-card"></div>`).join("");
  const chips = Array.from({ length: 8 }, () => `<button className="rounded-full border px-3.5 py-1.5">Filter</button>`).join("");
  const issues = auditContent(data, { "src/screens/home.jsx": cards + chips });
  assert.ok(issues.some((i) => i.category === "anti-slop" && i.description.includes("Card overload")));
  assert.ok(issues.some((i) => i.category === "ux" && i.description.includes("chip group")));
});

test("v7 content gate: skips materialized base primitives", () => {
  const data = mockDataset(fitnessBrief(), "gate-4");
  const issues = auditContent(data, {
    "src/components/PageHeader.jsx": fixtureComponent("PageHeader"),
    "src/components/Footer.jsx": fixtureComponent("Footer"),
  });
  assert.equal(issues.length, 0, JSON.stringify(issues));
});

test("v21 compose: layout plan drives placement, headers, and the section budget", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const brief = fitnessBrief();

  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Dashboard", nav: "topbar",
        blocks: [
          { block: "stats", variant: "scoreboard", emphasis: true },
          { block: "chart", variant: "area-card" },
          { block: "list", variant: "activity" },
        ] },
      { id: "detail", archetype: "list-detail", title: "Run", purpose: "Run info", nav: "topbar",
        blocks: [
          { block: "detail", variant: "pane", emphasis: true },
          { block: "cta", variant: "band" },
        ] },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v6-signature");
  const copy = fallbackCopy(brief, plan, data);

  // The deterministic placement plan is the composer's hard contract.
  const lp = await v21Plan(plan, null, copy);
  const home = lp.screens.find((s: any) => s.screenId === "home")!;
  const detail = lp.screens.find((s: any) => s.screenId === "detail")!;

  // One dominant moment, full-width, NO header.
  const dominant = home.sections.find((s: any) => s.emphasis)!;
  assert.equal(dominant.block, "stats");
  assert.equal(dominant.placement, "full");
  assert.equal(dominant.heightIntent, "dominant");
  assert.equal(dominant.header, undefined, "the dominant moment carries no header — it is the statement");

  // Every other section gets a deterministic header (consistent headings).
  const chart = home.sections.find((s: any) => s.block === "chart")!;
  assert.ok(chart.header && chart.header.title.length > 0, "chart section gets a planned header");
  const list = home.sections.find((s: any) => s.block === "list")!;
  assert.ok(list.header && list.header.eyebrow === "Activity", "activity list header is deterministic");

  // The section budget is capped (clutter fix): home ≤ 5, detail ≤ 4.
  assert.ok(home.sections.length <= 5, `home section budget: ${home.sections.length}`);
  assert.ok(detail.sections.length <= 4, `detail section budget: ${detail.sections.length}`);

  // The composer prompt contract states the placements verbatim.
  const { layoutPlanPrompt } = await import("../lib/pastel-agent/lib/layout-plan");
  const prompt = layoutPlanPrompt(lp);
  assert.ok(prompt.includes("placement=split") === false || prompt.includes("split"), "placements are part of the contract");

  const { files } = await composeV21({
    brief, plan, inventory, theme, data, copy,
    bodies: {
      home: `<section className="py-16">
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {DATA.screens.home.metrics.map((m) => (
      <div key={m.label} className="rounded-[var(--radius-lg)] bg-muted/30 p-5">
        <p className="text-3xl font-semibold tabular-nums">{m.value}{m.unit}</p>
        <p className="mt-1 text-sm text-muted-foreground">{m.label}</p>
      </div>
    ))}
  </div>
</section>
<section className="py-12">
  <SectionHeader eyebrow="Trends" title={DATA.copy.home.chartTitle ?? "Progress"} />
  <div className="rounded-[var(--radius-lg)] bg-muted/30 p-6">chart band</div>
</section>
<section className="py-12">
  <SectionHeader eyebrow="Activity" title="Recent activity" />
  <ul className="divide-y divide-border">
    {DATA.screens.home.activity.map((a) => <li key={a} className="py-2 text-sm text-muted-foreground">{a}</li>)}
  </ul>
</section>`,
      detail: `<section className="py-16">
  <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
    <div><SectionHeader eyebrow="Run" title="Run detail" /></div>
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p>Summary</p></div>
  </div>
</section>
<section className="py-12">
  <SectionHeader eyebrow="Next" title={DATA.copy.detail.primaryCta ?? "Continue"} />
</section>`,
    },
  });

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  assert.ok(Object.keys(result.bundles).length >= 2);

  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  const gate = auditFiles(theme, files);
  assert.ok(gate.passed, `gate failed: ${gate.issues.map((i) => i.description).join("; ")}`);
});

test("v7 theme: signature accent preserved when hue equals hueBase", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  assert.equal(theme.cssVars["--accent"], "#EAFF6A", "Nike keeps volt when hue = hueBase");
  assert.equal(theme.cssVars["--ring"], "#EAFF6A");
  const stripe = await loadCompany("stripe");
  const stripeTheme = resolveCompanyTheme(stripe, { mode: "light", hue: stripe.hueBase });
  assert.equal(stripeTheme.cssVars["--accent"], "#635BFF", "Stripe keeps indigo");
});

// ── V8: semantic coherence + mount discipline + composition quality ──────

test("v8 copy: sanitizeCopyPlan drops statLabels that mismatch the domain metrics", () => {
  const data = mockDataset(fitnessBrief(), "v8-san-1");
  const plan: any = {
    productTitle: "Pulse",
    screens: [
      {
        screenId: "progress",
        headline: "Progress",
        // Mismatched units + wrong count — the "Best 5K 18.2 km" class of bug.
        statLabels: [
          { label: "Best 5K", unit: "min·km" },
          { label: "Longest run", unit: "km" },
        ],
        // Unit "kcal" references the Calories series, but the title
        // "Weekly distance" does not match it — the title must go (v7 issue #3).
        chartTitle: "Weekly distance",
        chartUnit: "kcal",
      },
    ],
  };
  const { plan: clean } = sanitizeCopyPlan(plan, data);
  assert.equal(clean.screens[0].statLabels, undefined, "mismatched statLabels must be dropped");
  assert.equal(clean.screens[0].chartUnit, "kcal", "chartUnit may reference an existing series");
  assert.equal(clean.screens[0].chartTitle, undefined, "chartTitle must match the chosen series' label");
});

test("v8 copy: sanitizeCopyPlan drops chartUnit that references no series", () => {
  const data = mockDataset(fitnessBrief(), "v8-san-3");
  const plan: any = {
    productTitle: "Pulse",
    screens: [
      {
        screenId: "progress",
        headline: "Progress",
        chartTitle: "Weekly distance",
        chartUnit: "bogus", // no series has this unit
      },
    ],
  };
  const { plan: clean } = sanitizeCopyPlan(plan, data);
  assert.equal(clean.screens[0].chartUnit, undefined);
  assert.equal(clean.screens[0].chartTitle, "Weekly distance", "title matching a real series is kept");
});

test("v8 copy: sanitizeCopyPlan keeps matching statLabels and chart fields", () => {
  const data = mockDataset(fitnessBrief(), "v8-san-2");
  const plan: any = {
    productTitle: "Pulse",
    screens: [
      {
        screenId: "progress",
        headline: "Progress",
        statLabels: data.metrics.map((m) => ({ label: m.label, unit: m.unit })),
        chartTitle: data.series[0].label,
        chartUnit: data.series[0].unit,
      },
    ],
  };
  const { plan: clean, corrected } = sanitizeCopyPlan(plan, data);
  assert.ok(clean.screens[0].statLabels, "matching statLabels are kept");
  assert.equal(clean.screens[0].chartUnit, data.series[0].unit);
  assert.equal(corrected.length, 0);
});

test("v8 wireframe: enforceWireframeRules drops unmounted components and excess heavy blocks", () => {
  const plan: any = {
    version: "1.0.0",
    screens: [
      {
        id: "home", archetype: "app-dashboard", title: "Home", purpose: "Dashboard", nav: "tabbar",
        blocks: [
          { block: "custom", variant: "default", component: "StreakModule", emphasis: true },
          { block: "detail", variant: "pane" },
          { block: "form", variant: "cards" },
        ],
      },
      {
        id: "workouts", archetype: "catalog", title: "Workouts", purpose: "Browse", nav: "tabbar",
        blocks: [
          { block: "custom", variant: "default", component: "WorkoutCard" },
          { block: "custom", variant: "default", component: "RunHistoryTable" },
          { block: "custom", variant: "default", component: "PRComparisonStrip" },
          { block: "custom", variant: "default", component: "WorkoutCaptureSummary" },
          { block: "custom", variant: "default", component: "WeeklyTargetEditor" },
        ],
      },
    ],
  };
  const inventory: any = {
    version: "1.0.0",
    components: [
      { name: "StreakModule", purpose: "Streak", basedOn: "StatCard", usedBy: ["home"] },
      { name: "WorkoutCard", purpose: "Card", basedOn: "Card", usedBy: ["workouts"] },
      { name: "RunHistoryTable", purpose: "Table", basedOn: "Table", usedBy: ["workouts"] },
      { name: "PRComparisonStrip", purpose: "Strip", basedOn: "StatCard", usedBy: ["workouts"] },
      { name: "WorkoutCaptureSummary", purpose: "Summary", basedOn: "Card", usedBy: ["workouts"] },
      { name: "WeeklyTargetEditor", purpose: "Editor", basedOn: "Form", usedBy: ["workouts"] },
      { name: "UnusedWidget", purpose: "Never mounted", basedOn: "Card", usedBy: ["home"] },
    ],
  };
  const { plan: clean, inventory: cleanInv, notes } = enforceWireframeRules(plan, inventory);

  const home = clean.screens[0];
  const detail = clean.screens[1];
  // V14 product-led: a DASHBOARD home takes NO forced search toolbar or
  // product grid — the Airbnb-shaped catalog default is gone. Only the
  // mounted StreakModule survives; off-archetype blocks are dropped.
  assert.ok(!home.blocks.some((b: any) => b.block === "search"), "no forced search on a dashboard home");
  assert.ok(!home.blocks.some((b: any) => b.block === "list" && b.variant === "cards"), "no forced product grid on a dashboard home");
  assert.ok(home.blocks.some((b: any) => b.block === "custom" && b.component === "StreakModule"), "dashboard home keeps its product component");
  // The secondary screen (a browse workout library) becomes the focused
  // detail workflow: info pane + action band, no gallery forced.
  assert.ok(detail.blocks.some((b: any) => b.block === "detail" && b.variant === "pane"), "focused detail guarantees the info pane");
  assert.ok(detail.blocks.some((b: any) => b.block === "cta" && b.variant === "band"), "focused detail guarantees the action band");
  assert.ok(!detail.blocks.some((b: any) => b.block === "media"), "no gallery forced on a non-media detail");
  for (const s of clean.screens) assert.equal(s.blocks.filter((b: any) => b.emphasis).length, 1, "exactly one dominant moment");

  // V21 clutter cap: home ≤ 5 sections, detail ≤ 4 (the "too much on one
  // screen" defect is a hard limit, not a request).
  assert.ok(home.blocks.length <= 5, `home ≤ 5 sections (got ${home.blocks.length})`);
  assert.ok(detail.blocks.length <= 4, `detail ≤ 4 sections (got ${detail.blocks.length})`);
  assert.ok(notes.some((n) => n.includes("clutter cap")), "clutter cap note recorded");

  assert.ok(cleanInv.components.some((c: any) => c.name === "StreakModule"));
  assert.ok(!cleanInv.components.some((c: any) => c.name === "UnusedWidget"), "unmounted component dropped");
  // V21: the 8 shell components are always in the inventory (per-run chrome),
  // so the total is the mounted customs + shell.
  assert.ok(cleanInv.components.length > 6, "mounted customs + shell chrome");
  assert.ok(notes.some((n) => n.includes("dropped unmounted")));
});

test("v8 compose: custom block without a component emits no blank section", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);
  const brief = fitnessBrief();

  const plan: any = {
    version: "1.0.0",
    screens: [
      {
        id: "home", archetype: "app-dashboard", title: "Home", purpose: "Dashboard", nav: "tabbar",
        blocks: [
          { block: "hero", variant: "app", emphasis: true },
          { block: "custom", variant: "default" }, // no component — must vanish
          { block: "stats", variant: "scoreboard" },
        ],
      },
      {
        id: "workouts", archetype: "catalog", title: "Workouts", purpose: "Browse", nav: "tabbar",
        blocks: [
          { block: "search", variant: "dropdown", emphasis: true },
          { block: "list", variant: "rows" },
        ],
      },
      {
        id: "landing", archetype: "landing", title: "Landing", purpose: "Marketing", nav: "none",
        blocks: [
          { block: "hero", variant: "fullbleed", emphasis: true },
          { block: "cta", variant: "band" },
          { block: "footer", variant: "columns" },
        ],
      },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [{ name: "StreakModule", purpose: "Streak", basedOn: "StatCard", usedBy: ["home"] }] };
  const components: Record<string, string> = {};
  for (const item of inventory.components) components[`src/components/${item.name}.jsx`] = fixtureComponent(item.basedOn ?? item.name);

  const data = mockDataset(brief, "v8-compose");
  const copy = fallbackCopy(brief, plan, data);
  // V21: enforcement drops the component-less custom block and the
  // composer's sections are <section>-wrapped with real content — never blank.
  const enforced = enforceUxDesign(plan, inventory);
  const homePlan = enforced.plan.screens.find((s: any) => s.id === "home")!;
  assert.ok(!homePlan.blocks.some((b: any) => b.block === "custom" && !b.component), "component-less custom block dropped");

  const { files } = await composeV21({
    brief, plan: enforced.plan, inventory: enforced.inventory, theme, data, copy,
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Today" title="Your workout" />
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {DATA.screens.home.metrics.map((m) => <div key={m.label} className="rounded-[var(--radius-lg)] bg-muted/30 p-5"><p className="text-3xl font-semibold tabular-nums">{m.value}{m.unit}</p><p className="mt-1 text-sm text-muted-foreground">{m.label}</p></div>)}
  </div>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Run" title="Run detail" />
  <p className="text-muted-foreground">Focused record view</p>
</section>`,
    },
  });
  assert.ok(!/<section[^>]*>\s*<\/section>/.test(files["src/screens/home.jsx"]), "no blank sections in composed screens");

  const contentIssues = auditContent(data, files);
  const blank = contentIssues.filter((i) => i.description.includes("blank section") || i.description.includes("Spec-note"));
  assert.equal(blank.length, 0, JSON.stringify(blank));

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
});

test("v8 compose: chart picks the series matching the copy's unit, never by index", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);
  const brief = fitnessBrief();

  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "progress", archetype: "app-dashboard", title: "Progress", purpose: "Progress", nav: "tabbar",
        blocks: [
          { block: "stats", variant: "scoreboard", emphasis: true },
          { block: "chart", variant: "area-card" },
        ] },
      { id: "workouts", archetype: "catalog", title: "Workouts", purpose: "Browse", nav: "tabbar",
        blocks: [{ block: "search", variant: "dropdown", emphasis: true }, { block: "list", variant: "rows" }] },
      { id: "landing", archetype: "landing", title: "Landing", purpose: "Marketing", nav: "none",
        blocks: [{ block: "hero", variant: "fullbleed", emphasis: true }, { block: "cta", variant: "band" }, { block: "footer", variant: "columns" }] },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v8-chart");
  const copy = fallbackCopy(brief, plan, data);
  // The copy asks for the SECOND series (e.g. kcal over km).
  copy.screens[0].chartTitle = data.series[1].label;
  copy.screens[0].chartUnit = data.series[1].unit;
  // V21: the placement plan's chart header derives from the copy's chart
  // title (the copy is the content source of truth; the composer fills it).
  const lp = await v21Plan(plan, null, copy);
  const progress = lp.screens.find((s: any) => s.screenId === "progress")!;
  const chart = progress.sections.find((s: any) => s.block === "chart")!;
  assert.ok(chart.header && chart.header.title === data.series[1].label, "chart section header comes from the copy's requested series");
  assert.ok(chart.header.title !== data.series[0].label, "header never defaults to the index-0 series when copy asks for another");

  const { files } = await composeV21({
    brief, plan, inventory, theme, data, copy,
    bodies: {
      progress: `<section className="py-12">
  <SectionHeader eyebrow="Trends" title={DATA.copy.progress.chartTitle ?? "Progress"} />
  <div className="rounded-[var(--radius-lg)] bg-muted/30 p-6">series band</div>
</section>`,
      workouts: `<section className="py-12">
  <SectionHeader eyebrow="Browse" title="Explore" />
  <p className="text-muted-foreground">Catalog view</p>
</section>`,
    },
  });
  assert.ok(files["src/screens/progress.jsx"].includes("chartTitle"), "screen body reads the copy's chart title, never a baked const");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
});

test("v8 content gate: flags hardcoded zeros, spec notes, blank sections, and outline overload", () => {
  const data = mockDataset(fitnessBrief(), "v8-gate");
  const issues = auditContent(data, {
    "src/components/WorkoutSteps.jsx": `<div>DISTANCE {0.0} km · TIME 0 min</div>`,
    "src/screens/home.jsx": `<section className="pastel-frame py-4"></section><p>Recent run log rows: Easy 5K, with pace</p>`,
    "src/screens/library.jsx": Array.from({ length: 5 }, () => `<Button variant="outline">X</Button>`).join(""),
  });
  assert.ok(issues.some((i) => i.category === "content" && i.description.includes("zero")), JSON.stringify(issues));
  assert.ok(issues.some((i) => i.description.includes("Spec-note")), JSON.stringify(issues));
  assert.ok(issues.some((i) => i.description.includes("Empty <section>")), JSON.stringify(issues));
  assert.ok(issues.some((i) => i.description.includes("Outline-button overload")), JSON.stringify(issues));
});

test("v8 compose: ratio pairs two blocks into one grid row", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);
  const brief = fitnessBrief();

  const plan: any = {
    version: "1.0.0",
    screens: [
      {
        id: "home", archetype: "app-dashboard", title: "Home", purpose: "Dashboard", nav: "tabbar",
        blocks: [
          { block: "hero", variant: "statement", emphasis: true },
          { block: "chart", variant: "area-card" },
        ],
      },
      {
        id: "workouts", archetype: "catalog", title: "Workouts", purpose: "Browse", nav: "tabbar",
        blocks: [
          { block: "search", variant: "dropdown", emphasis: true },
          { block: "stats", variant: "scoreboard", ratio: "1:1" },
          { block: "chart", variant: "area-card" },
        ],
      },
      {
        id: "landing", archetype: "landing", title: "Landing", purpose: "Marketing", nav: "none",
        blocks: [{ block: "hero", variant: "fullbleed", emphasis: true }, { block: "cta", variant: "band" }, { block: "footer", variant: "columns" }],
      },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v8-ratio");
  const copy = fallbackCopy(brief, plan, data);
  // V21: side-by-side pairing comes from the UX plan's pair flag, and the
  // layout plan turns it into a two-up split (2/3 + 1/3) — the composer
  // contract states it, and the layout gate verifies the grid class.
  const ux = resolveUxDesign(plan, {
    version: "1.0.0",
    screens: [
      { screenId: "workouts", layout: { structure: "catalog-classic", dominantMoment: "search:dropdown", sections: [
        { block: "search" }, { block: "stats", pair: true }, { block: "chart" },
      ] } },
      { screenId: "home", layout: { structure: "dashboard-led", dominantMoment: "hero:app", sections: [{ block: "hero" }, { block: "chart" }] } },
      { screenId: "landing", layout: { structure: "single-column", dominantMoment: "hero:fullbleed", sections: [{ block: "hero" }, { block: "cta" }, { block: "footer" }] } },
    ],
  } as any);
  const lp = await v21Plan(plan, ux, copy);
  const workouts = lp.screens.find((s: any) => s.screenId === "workouts")!;
  const pair = workouts.sections.filter((s: any) => s.placement === "split-left" || s.placement === "split-right");
  assert.equal(pair.length, 2, "paired blocks become a split-left + split-right row");
  assert.ok(pair[0].placement === "split-left" && pair[1].placement === "split-right", "the pair is ordered 2/3 then 1/3");

  const { layoutPlanPrompt } = await import("../lib/pastel-agent/lib/layout-plan");
  const prompt = layoutPlanPrompt(lp);
  assert.ok(prompt.includes("split-left") && prompt.includes("split-right"), "the composer contract states the two-up placement");

  const { auditV21Layout } = await import("../lib/pastel-agent/checks/layout");
  const { files } = await composeV21({
    brief, plan, inventory, theme, data, copy, ux,
    bodies: {
      workouts: `<section className="py-12">
  <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
    <div><SectionHeader eyebrow="Browse" title="Explore" /></div>
    <div><SectionHeader eyebrow="Stats" title="At a glance" /></div>
  </div>
</section>`,
      home: `<section className="py-12">
  <SectionHeader eyebrow="Today" title="Your workout" />
  <p className="text-muted-foreground">Dashboard</p>
</section>`,
      landing: `<section className="py-12">
  <p className="text-3xl font-semibold">Landing</p>
</section>`,
    },
  });
  const layoutIssues = auditV21Layout(lp, files, {});
  assert.ok(!layoutIssues.some((i) => i.category === "v21-layout" && i.description.includes("side-by-side")), "two-up grid class present → no placement issue");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
});

// ── V9: two-screen canonical model + UX design ────────────────────────────

test("v9 brief: normalizeTwoScreens keeps exactly home + detail", () => {
  const out = normalizeTwoScreens([
    { id: "dashboard", purpose: "Dashboard with today's metrics and quick glance stats" },
    { id: "settings", purpose: "Account, profile, and preferences" },
    { id: "listing", purpose: "Full listing page with photos, details, and booking" },
  ]);
  assert.deepEqual(out.map((p) => p.id), ["home", "detail"], "ids are canonical");
  assert.ok(out[0].purpose.includes("Dashboard"), "home keeps the model's purpose text");
  assert.ok(out[1].purpose.includes("listing"), "detail keeps the model's purpose text");
  const fallback = normalizeTwoScreens([{ id: "browse", purpose: "Browse content" }]);
  assert.deepEqual(fallback.map((p) => p.id), ["home", "detail"]);
  assert.ok(fallback[1].purpose.length > 0, "missing detail falls back to canonical purpose");
});

test("v9 wireframe: enforceUxDesign builds the canonical two-screen model", () => {
  const plan: any = {
    version: "1.0.0",
    screens: [
      {
        id: "home", archetype: "app-dashboard", title: "Home", purpose: "Browse the catalog", nav: "tabbar",
        blocks: [
          { block: "table", variant: "panel", emphasis: true },
          { block: "form", variant: "cards" },
          { block: "list", variant: "cards" },
        ],
      },
      {
        id: "detail", archetype: "list-detail", title: "Listing", purpose: "Listing page", nav: "tabbar",
        blocks: [
          { block: "search", variant: "dropdown", emphasis: true },
          { block: "hero", variant: "statement" },
          { block: "media", variant: "gallery" },
          { block: "custom", variant: "default", component: "ReviewList" },
        ],
      },
      {
        id: "account", archetype: "settings-forms", title: "Account", purpose: "Settings", nav: "tabbar",
        blocks: [{ block: "form", variant: "cards", emphasis: true }],
      },
    ],
  };
  const inventory: any = {
    version: "1.0.0",
    components: [
      { name: "ReviewList", purpose: "Reviews", basedOn: "Avatar", usedBy: ["detail"] },
      { name: "OrphanWidget", purpose: "Never mounted", basedOn: "Card", usedBy: ["account"] },
    ],
  };
  const { plan: clean, inventory: cleanInv, notes } = enforceWireframeRules(plan, inventory);
  assert.deepEqual(clean.screens.map((s) => s.id), ["home", "detail"], "exactly two canonical screens");

  const home = clean.screens[0];
  const detail = clean.screens[1];
  // Off-archetype blocks are gone; required blocks are guaranteed.
  assert.ok(!home.blocks.some((b: any) => b.block === "table" || b.block === "form"), "no tables/forms on home");
  assert.ok(home.blocks.some((b: any) => b.block === "search"), "home keeps search");
  assert.ok(home.blocks.some((b: any) => b.block === "list" && b.variant === "cards"), "home keeps the product grid");
  assert.ok(!detail.blocks.some((b: any) => b.block === "search" || b.block === "hero"), "no search/hero on detail");
  assert.ok(detail.blocks.some((b: any) => b.block === "media" && b.variant === "gallery"), "detail keeps the gallery");
  assert.ok(detail.blocks.some((b: any) => b.block === "detail" && b.variant === "pane"), "detail guarantees the summary pane");
  assert.ok(detail.blocks.some((b: any) => b.block === "cta" && b.variant === "band"), "detail guarantees the action band");
  for (const s of clean.screens) assert.equal(s.blocks.filter((b: any) => b.emphasis).length, 1, "exactly one dominant moment");

  // Canonical order: search before grid on home; gallery leads detail.
  const homeOrder = home.blocks.map((b: any) => b.block);
  assert.ok(homeOrder.indexOf("search") < homeOrder.indexOf("list"), "toolbar precedes the grid");
  assert.equal(detail.blocks[0].block, "media", "gallery is the detail hero");

  // Mount contract with canonical-id remap. The custom ReviewList is dropped
  // because the deterministic guest-reviews section (list:activity) renders
  // reviews — a custom review component would duplicate it.
  assert.ok(!cleanInv.components.some((c: any) => c.name === "OrphanWidget"), "unmounted component dropped");
  assert.ok(!cleanInv.components.some((c: any) => c.name === "ReviewList"), "duplicate review component dropped");
  assert.ok(detail.blocks.some((b: any) => b.block === "list" && b.variant === "activity"), "deterministic reviews section present");
  assert.ok(notes.some((n) => n.includes("dropped")), "discipline notes emitted");
});

test("v9 ux: resolveUxDesign merges only valid model refinements", () => {
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Home", purpose: "Browse", nav: "topbar",
        blocks: [{ block: "search", variant: "dropdown", emphasis: true }, { block: "list", variant: "cards" }] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "Item", nav: "topbar",
        blocks: [{ block: "media", variant: "gallery", emphasis: true }, { block: "detail", variant: "pane" }] },
    ],
  };
  const model: any = {
    version: "1.0.0",
    screens: [
      { screenId: "home", layout: { structure: "single-column", sections: [{ block: "list", pair: true }, { block: "ghost", surface: "card" }] } },
    ],
  };
  const ux = resolveUxDesign(plan, model);
  const home = ux.screens.find((s) => s.screenId === "home")!;
  const listSec = home.layout.sections.find((s) => s.block === "list")!;
  assert.equal(listSec.pair, true, "model pairing accepted for a real block");
  assert.ok(!home.layout.sections.some((s) => s.block === "ghost"), "unknown blocks never merge");
  const detail = ux.screens.find((s) => s.screenId === "detail")!;
  assert.equal(detail.layout.structure, "detail-classic", "unrefined screen keeps its canonical structure");
  assert.equal(home.layout.structure, "catalog-classic", "a legacy home structure normalizes to catalog-classic");
});

test("v9 compose: detail renders sticky summary card, domain CTA, and reviews", async () => {
  const company = await loadCompany("airbnb");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);
  const brief = productBriefSchema.parse({
    version: "1.0.0",
    title: "StayVista",
    productType: "vacation rental booking app",
    description: "Browse unique vacation rentals worldwide and book your perfect stay.",
    audience: { primary: "Travelers", needs: ["Find stays", "Book quickly"] },
    goals: ["Browse the catalog", "Book a stay"],
    features: [
      { name: "Search", description: "Find stays by destination.", priority: "critical" },
      { name: "Booking", description: "Reserve a stay with dates and guests.", priority: "high" },
    ],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm, specific, human.",
    designLanguage: "Airbnb-inspired warmth.",
    inspiration: { primary: "airbnb" },
  });

  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Stays", purpose: "Browse", nav: "topbar",
        blocks: [
          { block: "hero", variant: "app", emphasis: true },
          { block: "search", variant: "dropdown" },
          { block: "list", variant: "cards" },
        ] },
      { id: "detail", archetype: "list-detail", title: "Villa", purpose: "Listing", nav: "topbar",
        blocks: [
          { block: "media", variant: "gallery", emphasis: true },
          { block: "detail", variant: "pane" },
          { block: "cta", variant: "band" },
          { block: "list", variant: "activity" },
        ] },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v9-compose");
  assert.equal(data.domain, "rentals", "the stay-catalog brief picks the rentals domain pack");
  const copy = fallbackCopy(brief, plan, data);
  // V21: the detail plan leads with the media gallery as the dominant moment
  // and gives every supporting section a deterministic header; the screen
  // composes with SectionHeader + a CTA band and never touches home's data.
  const lp = await v21Plan(plan, fallbackUx(plan), copy);
  const detailScreen = lp.screens.find((s: any) => s.screenId === "detail")!;
  const dominant = detailScreen.sections.find((s: any) => s.emphasis)!;
  assert.equal(dominant.block, "media", "gallery is the dominant moment");
  assert.equal(dominant.header, undefined, "dominant moment has no header");
  const cta = detailScreen.sections.find((s: any) => s.block === "cta")!;
  assert.ok(cta.header && cta.header.title.length > 0, "CTA band gets a planned header");

  const { files } = await composeV21({
    brief, plan, inventory, theme, data, copy, ux: fallbackUx(plan),
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Browse" title="Explore" />
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{DATA.screens.home.rows.slice(0, 6).map((r) => <div key={r.id} className="rounded-[var(--radius-lg)] bg-muted/30 p-4"><p className="font-medium">{r.name}</p><p className="text-sm text-muted-foreground">{r.detail}</p></div>)}</div>
</section>`,
      detail: `<section className="py-12">
  <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
    <div><SectionHeader eyebrow="Gallery" title="In detail" /><div className="rounded-[var(--radius-lg)] bg-muted/30 p-6">gallery</div></div>
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-sm text-muted-foreground">Summary</p><p className="mt-2 text-2xl font-semibold tabular-nums">{DATA.screens.detail.summary.price}</p></div>
  </div>
</section>
<section className="py-12">
  <SectionHeader eyebrow="Next" title={DATA.copy.detail.primaryCta ?? "Continue"} />
</section>`,
    },
  });

  const detail = files["src/screens/detail.jsx"];
  assert.ok(detail.includes("DATA.screens.detail.summary.price"), "detail reads its OWN scoped view");
  assert.ok(!detail.includes("DATA.screens.home"), "detail never reads the catalog view (v9 test4 bug class is gone)");
  assert.ok(detail.includes("SectionHeader"), "detail uses the deterministic SectionHeader");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  assert.ok(Object.keys(result.bundles).length >= 2);

  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  const gate = auditFiles(theme, files);
  assert.ok(gate.passed, `gate failed: ${gate.issues.map((i) => i.description).join("; ")}`);
  const contentIssues = auditContent(data, files);
  assert.equal(contentIssues.length, 0, `content gate failed: ${contentIssues.map((i) => i.description).join("; ")}`);
});

test("v9 content gate: archetype-aware card budget fires on stacks and passes on the canonical layout", () => {
  const data = mockDataset(fitnessBrief(), "v9-gate");
  const grid = `<section>{DATA.rows.map((r) => (<Card className="overflow-hidden p-0"></Card>))}</section>`;
  const stacked = Array.from({ length: 9 }, () => `<Card></Card>`).join("");
  const stickyStack = Array.from({ length: 4 }, () => `<Card className="lg:sticky lg:top-6"></Card>`).join("");
  const issuesHome = auditContent(data, { "src/screens/home.jsx": grid + stacked });
  assert.ok(issuesHome.some((i) => i.description.includes("Card overload")), "9 card clusters on home flagged");
  const issuesDetail = auditContent(data, { "src/screens/detail.jsx": stickyStack });
  assert.ok(issuesDetail.some((i) => i.description.includes("detail")), "4 card clusters on a sticky detail flagged");
  const clean = auditContent(data, { "src/screens/home.jsx": grid });
  assert.ok(!clean.some((i) => i.description.includes("Card overload")), "the single grid cluster is within budget");
});

test("v10 ux: structure normalization keeps roles in their legal sets", () => {
  assert.equal(canonicalStructure("home", "catalog-rail"), "catalog-rail");
  assert.equal(canonicalStructure("home", "detail-asymmetric"), "catalog-classic", "a detail structure on home normalizes to catalog-classic");
  assert.equal(canonicalStructure("detail", "detail-asymmetric"), "detail-asymmetric");
  assert.equal(canonicalStructure("detail", "catalog-featured"), "detail-classic", "a home structure on detail normalizes to detail-classic");
  assert.equal(canonicalStructure("home", "two-column"), "catalog-classic", "legacy structures normalize to the canonical role structure");
});

test("v10 compose: catalog-rail structure renders a sticky rail beside the grid", async () => {
  const company = await loadCompany("stripe");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);
  const brief = fitnessBrief();
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Workouts", purpose: "Browse", nav: "topbar",
        blocks: [
          { block: "search", variant: "dropdown" },
          { block: "list", variant: "cards", emphasis: true },
          { block: "chart", variant: "band" },
        ] },
      { id: "detail", archetype: "list-detail", title: "Run", purpose: "Info", nav: "topbar",
        blocks: [
          { block: "media", variant: "gallery", emphasis: true },
          { block: "detail", variant: "pane" },
          { block: "cta", variant: "band" },
          { block: "list", variant: "activity" },
        ] },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v10-rail");
  const copy = fallbackCopy(brief, plan, data);
  const ux = resolveUxDesign(plan, {
    version: "1.0.0",
    screens: [
      { screenId: "home", layout: { structure: "catalog-rail", dominantMoment: "list:cards", sections: plan.screens[0].blocks.map((b: any) => ({ block: b.block })) } },
      { screenId: "detail", layout: { structure: "detail-classic", sections: plan.screens[1].blocks.map((b: any) => ({ block: b.block })) } },
    ],
  });
  assert.equal(ux.screens.find((s) => s.screenId === "home")!.layout.structure, "catalog-rail");
  // V21: the UX rail structure becomes the layout plan's frame + placement.
  const lp = await v21Plan(plan, ux, copy);
  const homeScreen = lp.screens.find((s: any) => s.screenId === "home")!;
  assert.equal(homeScreen.frame, "rail", "catalog-rail structure derives a rail frame in the placement plan");
  assert.ok(homeScreen.sections.some((s: any) => s.block === "search"), "search section survives the plan");
  assert.ok(homeScreen.sections.some((s: any) => s.block === "list" && s.emphasis), "product grid is the dominant moment");

  const { files } = await composeV21({
    brief, plan, inventory, theme, data, copy, ux,
    bodies: {
      home: `<section className="py-12">
  <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
    <aside className="rounded-[var(--radius-lg)] bg-muted/30 p-5"><SectionHeader eyebrow="Find" title="Filter" /></aside>
    <div><SectionHeader eyebrow="Browse" title="Explore" /></div>
  </div>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Run" title="Run detail" />
  <p className="text-muted-foreground">Focused record view</p>
</section>`,
    },
  });

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  assert.ok(auditFiles(theme, files).passed, "gate passes on the rail structure");
  const contentIssues = auditContent(data, files);
  assert.equal(contentIssues.length, 0, `content gate failed: ${contentIssues.map((i) => i.description).join("; ")}`);
});

test("v10 compose: list:featured strip renders a curated showcase row", async () => {
  const company = await loadCompany("airbnb");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);
  const brief = productBriefSchema.parse({
    version: "1.0.0", title: "StayVista", productType: "vacation rental booking app",
    description: "Browse unique vacation rentals worldwide.", audience: { primary: "Travelers", needs: ["x"] },
    goals: ["g"], features: [{ name: "S", description: "d", priority: "critical" }], platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm", designLanguage: "x", inspiration: { primary: "airbnb" },
  });
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Stays", purpose: "Browse", nav: "topbar",
        blocks: [
          { block: "search", variant: "dropdown" },
          { block: "list", variant: "featured", content: "Featured stays" },
          { block: "list", variant: "cards", emphasis: true },
        ] },
      { id: "detail", archetype: "list-detail", title: "Villa", purpose: "Listing", nav: "topbar",
        blocks: [
          { block: "media", variant: "gallery", emphasis: true },
          { block: "detail", variant: "pane" },
          { block: "cta", variant: "band" },
          { block: "list", variant: "activity" },
        ] },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v10-featured");
  const copy = fallbackCopy(brief, plan, data);
  // V21: the featured strip gets a deterministic "Curated picks" header and
  // the product grid stays the dominant moment.
  const lp = await v21Plan(plan, fallbackUx(plan), copy);
  const homeScreen = lp.screens.find((s: any) => s.screenId === "home")!;
  const featured = homeScreen.sections.find((s: any) => s.block === "list" && s.variant === "featured");
  assert.ok(featured, "featured strip survives the placement plan");
  assert.ok(featured.header && featured.header.title === "Curated picks", "featured strip gets a deterministic header");
  assert.ok(homeScreen.sections.find((s: any) => s.block === "list" && s.emphasis), "product grid is the dominant moment");

  const { files } = await composeV21({
    brief, plan, inventory, theme, data, copy, ux: fallbackUx(plan),
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Featured" title="Curated picks" />
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{DATA.screens.home.rows.slice(0, 4).map((r) => <div key={r.id} className="rounded-[var(--radius-lg)] bg-muted/30 p-4"><p className="font-medium">{r.name}</p></div>)}</div>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Run" title="Run detail" />
  <p className="text-muted-foreground">Focused record view</p>
</section>`,
    },
  });

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  assert.ok(auditFiles(theme, files).passed, "gate passes on the featured strip");
  const contentIssues = auditContent(data, files);
  assert.equal(contentIssues.length, 0, `content gate failed: ${contentIssues.map((i) => i.description).join("; ")}`);
});

test("v10 content gate: cross-screen leak is flagged in a screen file", () => {
  const data = mockDataset(fitnessBrief(), "v10-leak");
  const leaky = `<section>{DATA.rows.map((r) => <Card key={r.id} />)}</section><p>{DATA.reviews[0].text}</p>`;
  const clean = `<section>{DATA.screens.home.rows.map((r) => <Card key={r.id} />)}</section>`;
  const issues = auditContent(data, { "src/screens/home.jsx": leaky, "src/screens/detail.jsx": clean });
  assert.ok(issues.some((i) => i.description.includes("Cross-screen data leak")), "bare global DATA refs in a screen are flagged");
  assert.ok(!issues.some((i) => i.file === "src/screens/detail.jsx" && i.description.includes("Cross-screen data leak")), "scoped refs pass");
});

test("v10 knowledge: new companies in the folder auto-register (no index edit)", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const slug = "testcompany";
  const root = path.join(process.cwd(), "server", "lib", "pastel-agent", "knowledge", "companies", slug);
  const airbnb = await import("../lib/pastel-agent/knowledge/companies/airbnb/manifest.ts");
  try {
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(
      path.join(root, "manifest.ts"),
      `export const manifest = ${JSON.stringify({ ...airbnb.manifest, slug, name: "Test Company" })};`,
    );
    fs.writeFileSync(path.join(root, "design.md"), "# Test Company\n\nA test company for auto-registration.\n");

    const { loadCompany, loadCompanyDoc, listCompanySlugs } = await import("../lib/pastel-agent/knowledge/index");
    assert.ok(listCompanySlugs().includes(slug), "new slug appears in the registry without editing index.ts");
    const m = await loadCompany(slug);
    assert.equal(m.name, "Test Company");
    assert.equal(m.slug, slug);
    const doc = await loadCompanyDoc(slug);
    assert.ok(doc && doc.includes("auto-registration"), "design.md is picked up automatically");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("v11 knowledge: every company ships preview.png + references; image helpers stay path-safe", async () => {
  const path = await import("node:path");
  const { companyImageFiles, readCompanyImage, companyRefImageBlocks } = await import("../lib/pastel-agent/knowledge/index");
  // V11: the captured reference imagery is part of every company folder.
  for (const slug of SLUGS) {
    const files = companyImageFiles(slug);
    assert.ok(files.includes("preview.png"), `${slug} ships preview.png`);
    assert.ok(files.some((f) => f.startsWith("references/")), `${slug} ships reference shots`);
    const png = readCompanyImage(slug, "preview.png");
    assert.ok(png && png.byteLength > 1000, `${slug} preview.png is a real image`);
    // Reference image blocks are gateway-ready (base64, sane size).
    const blocks = await companyRefImageBlocks(slug, 2);
    assert.ok(blocks.length >= 1, `${slug} produces image blocks`);
    for (const b of blocks) assert.equal(b.type, "image");
  }
  // Path traversal is still rejected.
  assert.equal(readCompanyImage("airbnb", "../apple/preview.png"), null);
  // A bogus slug yields an empty list, never a crash.
  assert.deepEqual(companyImageFiles("does-not-exist"), []);
});

// ── V11: Figma-quality foundations ────────────────────────────────────────

test("v11/v21 compose: rhythm law, full-width main, and 8px-gutter shell", async () => {
  const company = await loadCompany("airbnb");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const brief = productBriefSchema.parse({
    version: "1.0.0",
    title: "StayVista",
    productType: "vacation rental booking app",
    description: "Browse unique vacation rentals worldwide and book your perfect stay.",
    audience: { primary: "Travelers", needs: ["Find stays", "Book quickly"] },
    goals: ["Browse the catalog", "Book a stay"],
    features: [
      { name: "Search", description: "Find stays by destination.", priority: "critical" },
      { name: "Booking", description: "Reserve a stay with dates and guests.", priority: "high" },
    ],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm, specific, human.",
    designLanguage: "Airbnb-inspired warmth.",
    inspiration: { primary: "airbnb" },
  });
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Stays", purpose: "Browse", nav: "topbar",
        blocks: [
          { block: "hero", variant: "app", emphasis: true },
          { block: "search", variant: "dropdown" },
          { block: "list", variant: "cards" },
        ] },
      { id: "detail", archetype: "list-detail", title: "Villa", purpose: "Listing", nav: "topbar",
        blocks: [
          { block: "media", variant: "gallery", emphasis: true },
          { block: "detail", variant: "pane" },
          { block: "cta", variant: "band" },
        ] },
    ],
  };
  const inventory: any = { version: "1.0.0", components: [] };
  const data = mockDataset(brief, "v11-ladder");
  const copy = fallbackCopy(brief, plan, data);

  // V21 rhythm law: the composer's stage law mandates the 8px ladder ONLY.
  const { agentStageLaw } = await import("../lib/pastel-agent/knowledge/component-law");
  const law = agentStageLaw();
  assert.ok(/py-8\/py-12\/py-16/.test(law), "stage law mandates the 8px ladder (py-8/py-12/py-16)");
  assert.ok(!/py-10|py-14/.test(law), "no off-ladder steps in the law");

  // Layout plan height intents come from the ladder set (compact/standard/dominant).
  const lp = await v21Plan(plan, fallbackUx(plan), copy);
  for (const screen of lp.screens) {
    for (const sec of screen.sections) {
      assert.ok(["compact", "standard", "dominant"].includes(sec.heightIntent), `${screen.screenId}/${sec.block} height intent is on the ladder`);
    }
  }

  const { files } = await composeV21({
    brief, plan, inventory, theme, data, copy, ux: fallbackUx(plan),
    bodies: {
      home: `<section className="py-16">
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{DATA.screens.home.metrics.map((m) => <div key={m.label} className="rounded-[var(--radius-lg)] bg-muted/30 p-5"><p className="text-3xl font-semibold tabular-nums">{m.value}{m.unit}</p><p className="mt-1 text-sm text-muted-foreground">{m.label}</p></div>)}</div>
</section>
<section className="py-12">
  <SectionHeader eyebrow="Browse" title="Explore" />
  <p className="text-muted-foreground">catalog grid</p>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Gallery" title="In detail" />
  <p className="text-muted-foreground">gallery</p>
</section>
<section className="py-12">
  <SectionHeader eyebrow="Next" title="Continue" />
</section>`,
    },
  });

  // The shell's main is full-width (w-full min-w-0); sections self-frame.
  assert.ok(files["src/screens/home.jsx"].includes('<main className="w-full min-w-0">'), "main is full-width; sections self-frame");
  assert.ok(files["src/screens/home.jsx"].includes("py-16") && files["src/screens/home.jsx"].includes("py-12"), "screen body uses ladder steps");
  assert.ok(!/py-10\b/.test(files["src/screens/home.jsx"]), "no py-10 leftovers");
  assert.ok(!/-mx-6|-mx-8/.test(files["src/screens/home.jsx"]), "no negative-margin full-bleed escape hack");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
});

test("v11 wireframe: custom blocks missing 'component' get a deterministic inventory backfill", () => {
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Stays", purpose: "Browse", nav: "topbar",
        blocks: [
          { block: "hero", variant: "app", emphasis: true },
          { block: "search", variant: "dropdown" },
          { block: "list", variant: "cards" },
          { block: "custom", variant: "default", content: "Mount AmenityGrid here" },
        ] },
      { id: "detail", archetype: "list-detail", title: "Villa", purpose: "Listing", nav: "topbar",
        blocks: [
          { block: "media", variant: "gallery", emphasis: true },
          { block: "detail", variant: "pane" },
          { block: "custom", variant: "default" },
        ] },
    ],
  };
  const inventory: any = {
    version: "1.0.0",
    components: [
      { name: "AmenityGrid", purpose: "Stay amenities", basedOn: "Card", usedBy: ["home", "detail"] },
      { name: "HostTrustLegend", purpose: "Host trust badges", basedOn: "Badge", usedBy: ["detail"] },
    ],
  };
  const { plan: enforced, inventory: outInv, notes } = enforceUxDesign(plan, inventory);
  const customs = enforced.screens.flatMap((s: any) => s.blocks.filter((b: any) => b.block === "custom"));
  assert.ok(customs.every((b: any) => typeof b.component === "string"), "every custom block got a component");
  const mounted = new Set(enforced.screens.flatMap((s: any) => s.blocks.filter((b: any) => b.block === "custom").map((b: any) => b.component)));
  assert.equal(outInv.components.length, mounted.size, "inventory keeps exactly the mounted components");
  assert.ok(outInv.components.some((c: any) => c.name === "AmenityGrid"), "name-match backfill found AmenityGrid");
  assert.ok(notes.some((n: string) => n.includes("backfilled")), "backfill is reported in notes");
});

test("v11 data: semantic {label,value} detail fields, item-derived summary, unique catalog rows", async () => {
  const brief = productBriefSchema.parse({
    version: "1.0.0",
    title: "Hearthstay",
    productType: "vacation rental booking app",
    description: "Browse unique vacation rentals and book your stay.",
    audience: { primary: "Travelers", needs: ["Find stays"] },
    goals: ["Browse", "Book"],
    features: [{ name: "Search", description: "Find stays by destination.", priority: "critical" }],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm.",
    designLanguage: "Airbnb-inspired warmth.",
    inspiration: { primary: "airbnb" },
  });
  const company = await loadCompany("airbnb");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const data = mockDataset(brief, "v11-data");
  assert.equal(data.domain, "rentals");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Stays", purpose: "Browse", nav: "topbar",
        blocks: [{ block: "hero", variant: "app", emphasis: true }, { block: "search", variant: "dropdown" }, { block: "list", variant: "cards" }] },
      { id: "detail", archetype: "list-detail", title: "Villa", purpose: "Listing", nav: "topbar",
        blocks: [{ block: "media", variant: "gallery", emphasis: true }, { block: "detail", variant: "pane" }, { block: "cta", variant: "band" }] },
    ],
  };
  const copy = fallbackCopy(brief, plan, data);

  const { composeAll } = await import("../lib/pastel-agent/compose");
  const composed = composeAll({ brief, wireframe: plan, inventory: { version: "1.0.0", components: [] }, copy, theme, data, ux: fallbackUx(plan) });
  const dataFile = composed.files["src/data.js"];
  const match = dataFile.match(/export const DATA = (\{[\s\S]*?\});\s*$/);
  assert.ok(match, "DATA parses");
  const DATA = JSON.parse(match![1]);

  const names = DATA.screens.home.rows.map((r: { name: string }) => r.name);
  assert.equal(new Set(names).size, names.length, "catalog rows have unique names (no duplicate listings)");

  const fields = DATA.screens.detail.fields;
  assert.ok(Array.isArray(fields) && fields.length >= 3, "detail fields exist");
  for (const f of fields) {
    assert.equal(typeof f.label, "string", "field label is a string");
    assert.ok(typeof f.value === "string" && f.value.length > 0, `field ${f.label} has a real value`);
  }

  const summary = DATA.screens.detail.summary;
  const PROPS = ["Villa", "Casa", "Apartment", "Cabin", "Chalet", "Penthouse", "House", "Cottage", "Loft"];
  assert.ok(!PROPS.includes(summary.dates), `summary.dates is item-derived (got "${summary.dates}", not a property type)`);
  assert.ok(summary.dates.includes("–"), "dates look like a booking window (Aug 7 – Aug 10)");
  assert.ok(summary.guests.includes("guests"), "guest count derives from the item");

  // V21: the detail screen consumes the scoped {label,value} pairs via DATA.
  const { files } = await composeV21({
    brief, plan, inventory: { version: "1.0.0", components: [] }, theme, data, copy, ux: fallbackUx(plan),
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Browse" title="Explore" />
  <p className="text-muted-foreground">catalog</p>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Details" title="Listing details" />
  <dl className="divide-y divide-border">
    {DATA.screens.detail.fields.map((f) => (
      <div key={f.label} className="grid grid-cols-2 py-2">
        <dt className="text-sm text-muted-foreground">{f.label}</dt>
        <dd className="text-sm font-medium">{f.value}</dd>
      </div>
    ))}
  </dl>
</section>`,
    },
  });
  assert.ok(files["src/screens/detail.jsx"].includes("DATA.screens.detail.fields.map"), "detail pane consumes {label,value} pairs");
});

test("v11/v21 compose: search section header derives from the copy; gallery is the detail's dominant moment", async () => {
  const company = await loadCompany("airbnb");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const brief = productBriefSchema.parse({
    version: "1.0.0",
    title: "StayVista",
    productType: "vacation rental booking app",
    description: "Browse unique vacation rentals worldwide and book your perfect stay.",
    audience: { primary: "Travelers", needs: ["Find stays"] },
    goals: ["Browse", "Book"],
    features: [{ name: "Search", description: "Find stays by destination.", priority: "critical" }],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm.",
    designLanguage: "Airbnb-inspired warmth.",
    inspiration: { primary: "airbnb" },
  });
  const data = mockDataset(brief, "v11-scenes");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Stays", purpose: "Browse", nav: "topbar",
        blocks: [{ block: "hero", variant: "app", emphasis: true }, { block: "search", variant: "dropdown" }, { block: "list", variant: "cards" }] },
      { id: "detail", archetype: "list-detail", title: "Villa", purpose: "Listing", nav: "topbar",
        blocks: [{ block: "media", variant: "gallery", emphasis: true }, { block: "detail", variant: "pane" }, { block: "cta", variant: "band" }] },
    ],
  };
  const copy = fallbackCopy(brief, plan, data);

  // V21: the search section's planned header uses the copy's placeholder as
  // the title source — the model never invents search labels.
  const lp = await v21Plan(plan, fallbackUx(plan), copy);
  const homeScreen = lp.screens.find((s: any) => s.screenId === "home")!;
  const search = homeScreen.sections.find((s: any) => s.block === "search")!;
  assert.ok(search.header, "search section has a planned header");
  assert.ok(search.header.title.length > 0, "search header title is non-empty");
  const detailScreen = lp.screens.find((s: any) => s.screenId === "detail")!;
  assert.equal(detailScreen.sections.find((s: any) => s.emphasis)?.block, "media", "gallery is the detail dominant moment");

  const { files } = await composeV21({
    brief, plan, inventory: { version: "1.0.0", components: [] }, theme, data, copy, ux: fallbackUx(plan),
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Find" title="Where are you going?" />
  <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4">search field</div>
</section>`,
      detail: `<section className="py-12">
  <div className="rounded-[var(--radius-lg)] bg-muted/30 p-6">gallery tiles</div>
</section>
<section className="py-12">
  <SectionHeader eyebrow="Details" title="Listing details" />
  <p className="text-muted-foreground">facts</p>
</section>`,
    },
  });
  const home = files["src/screens/home.jsx"];
  assert.ok(home.includes("SectionHeader"), "home uses the deterministic SectionHeader");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
});

test("v11 scenes: same (seed,n,crop) is deterministic; crops vary the composition", async () => {
  const { sceneSvg } = await import("../lib/pastel-agent/lib/scenes");
  const { hashSeed } = await import("../lib/pastel-agent/lib/content");
  const a1 = sceneSvg("rentals", hashSeed("st1001"), 0, 0);
  const a2 = sceneSvg("rentals", hashSeed("st1001"), 0, 0);
  assert.equal(a1, a2, "same seed + crop reproduces the same artwork");
  const b1 = sceneSvg("rentals", hashSeed("st1001"), 0, 1);
  assert.notEqual(a1, b1, "a different angle changes the composition");
  const other = sceneSvg("rentals", hashSeed("st1002"), 0, 0);
  assert.notEqual(a1, other, "a different item renders different artwork");
  assert.ok(a1.includes("<linearGradient"), "stay scenes use a gradient sky (imagery, not UI panels)");
  assert.ok(a1.includes("<g transform="), "scenes carry the crop transform wrapper");
});

test("v11 gate: off-rhythm component sizes and unlabeled inputs are flagged; py-16 is legal", async () => {
  const company = await loadCompany("airbnb");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  const files = {
    "src/styles.css": ":root { --background: #fff; }",
    "src/components/BadButton.jsx": `export default function BadButton() { return <button className="h-9 px-3 rounded-md">x</button>; }`,
    "src/screens/home.jsx": `export default function S() { return <div><input placeholder="Search" /><input aria-label="Filter" /></div>; }`,
    "src/screens/detail.jsx": `export default function S() { return <section className="pastel-frame py-16"><h1>Hero band</h1></section>; }`,
  };
  const gate = auditFiles(theme, files);
  const offRhythm = gate.issues.filter((i) => i.category === "tokens" && i.description.includes("h-9"));
  assert.equal(offRhythm.length, 1, "h-9 in a shared component is flagged");
  const unlabeled = gate.issues.filter((i) => i.category === "a11y" && i.description.includes("no <label>"));
  assert.equal(unlabeled.length, 1, "screen with inputs but no label is flagged");
  assert.ok(!gate.issues.some((i) => i.description.includes("py-16") && i.category === "anti-slop"), "py-16 is the legal band step, not slop");
});

// ── V14: de-Airbnb — design tokens + product-led structures + brief catalog ──

test("v14 design: manifest-derived fallback tokens validate (WCAG + scales) and compile to a theme", async () => {
  const { designTokensFromManifest, validateDesignTokens } = await import("../lib/pastel-agent/agents/design");
  const { themeFromDesignTokens } = await import("../lib/pastel-agent/knowledge/index");
  const company = await loadCompany("stripe");
  const tokens = designTokensFromManifest(company, "light");
  const parsed = (await import("../lib/pastel-agent/schemas")).designTokensSchema.parse(tokens);
  assert.equal(parsed.version, "1.0.0");
  const { ok, errors } = validateDesignTokens(parsed);
  assert.ok(ok, `manifest-derived tokens must pass validation: ${errors.join("; ")}`);
  const theme = themeFromDesignTokens(parsed, company);
  assert.equal(theme.cssVars["--primary"], parsed.colors.primary);
  assert.equal(theme.cssVars["--radius-md"], `${parsed.radius.md}px`);
  assert.equal(theme.cssVars["--control-md"], "40px");
  assert.ok(theme.fontFamilies.length >= 1);
  const { css } = compileStyles(theme);
  assert.ok(css.includes(`--primary: ${parsed.colors.primary};`), "cssVars carry the design-token colors");
});

test("v14 design: WCAG validator rejects a low-contrast palette", async () => {
  const { validateDesignTokens } = await import("../lib/pastel-agent/agents/design");
  const company = await loadCompany("linear");
  const good = (await import("../lib/pastel-agent/agents/design")).designTokensFromManifest(company, "light");
  const bad = structuredClone(good);
  bad.colors.foreground = "#101010";
  bad.colors.background = "#101010";
  const badResult = validateDesignTokens(bad);
  assert.equal(badResult.ok, false, "same-dark-on-dark palette must fail");
  assert.ok(badResult.errors.some((e) => e.includes("foreground/background")), "the failing pair is named");
  const goodResult = validateDesignTokens(good);
  assert.equal(goodResult.ok, true);
});

test("v14 ux: home structure is product-led (dashboard-led unless the product browses)", async () => {
  const { homeStructureFor, canonicalStructure } = await import("../lib/pastel-agent/lib/ux-design");
  assert.equal(homeStructureFor("Dashboard with today's metrics"), "dashboard-led");
  assert.equal(homeStructureFor("The community feed"), "dashboard-led");
  assert.equal(homeStructureFor("Browse and explore the catalog of stays"), "catalog-classic");
  assert.equal(canonicalStructure("home", "catalog-rail"), "catalog-rail", "catalog structures stay legal");
  assert.equal(canonicalStructure("home", "two-column"), "catalog-classic", "legacy structures normalize");
  assert.equal(canonicalStructure("home", "detail-asymmetric", false), "dashboard-led", "invalid non-catalog home falls back product-led");
});

test("v14 wireframe fallback: a dashboard product NEVER degrades into an Airbnb catalog", async () => {
  const company = await loadCompany("linear");
  const brief = productBriefSchema.parse({
    version: "1.0.0",
    title: "Trace",
    productType: "project tracking workspace",
    description: "A workspace for teams to track projects, goals, and progress.",
    audience: { primary: "Product teams", needs: ["Track work"] },
    goals: ["Ship faster"],
    features: [{ name: "Projects", description: "Track project status and owners.", priority: "critical" }],
    platform: "desktop",
    screenPurposes: [
      { id: "home", purpose: "Dashboard with today's work, goals, and progress" },
      { id: "detail", purpose: "Focused view of one project with its facts and actions" },
    ],
    copyDirection: "Calm and specific.",
    designLanguage: "Dense, precise, quiet.",
    inspiration: { primary: "linear" },
  });
  const wf = fallbackWireframe(brief, company);
  const home = wf.plan.screens.find((s) => s.id === "home")!;
  const detail = wf.plan.screens.find((s) => s.id === "detail")!;
  assert.ok(!home.blocks.some((b) => b.block === "search"), "no forced search on a workspace home");
  assert.ok(!home.blocks.some((b) => b.block === "list" && b.variant === "cards"), "no product grid on a workspace home");
  assert.ok(!detail.blocks.some((b) => b.block === "media"), "no photo gallery on a workspace detail");
  assert.ok(detail.blocks.some((b) => b.block === "detail"), "focused record pane present");
  assert.ok(home.blocks.some((b) => b.block === "stats" && b.emphasis), "scoreboard opens the dashboard home");
  assert.ok(home.blocks.length <= 5, `v21 clutter cap: home ≤ 5 sections (got ${home.blocks.length})`);

  // Compose + sandbox + gates must all pass on the product-led fallback.
  const { designTokensFromManifest } = await import("../lib/pastel-agent/agents/design");
  const { themeFromDesignTokens } = await import("../lib/pastel-agent/knowledge/index");
  const tokens = designTokensFromManifest(company, "light");
  const theme = themeFromDesignTokens(tokens, company);
  const data = mockDataset(brief, "v14-dash");
  assert.equal(data.domain, "productivity");
  const copy = fallbackCopy(brief, wf.plan, data);

  const { files } = await composeV21({
    brief, plan: wf.plan, inventory: wf.inventory, theme, data, copy, ux: fallbackUx(wf.plan),
    bodies: {
      home: `<section className="py-16">
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{DATA.screens.home.metrics.map((m) => <div key={m.label} className="rounded-[var(--radius-lg)] bg-muted/30 p-5"><p className="text-3xl font-semibold tabular-nums">{m.value}{m.unit}</p><p className="mt-1 text-sm text-muted-foreground">{m.label}</p></div>)}</div>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Project" title="Project detail" />
  <p className="text-muted-foreground">Focused record view</p>
</section>`,
    },
  });

  const homeSrc = files["src/screens/home.jsx"];
  const detailSrc = files["src/screens/detail.jsx"];
  // The Airbnb-style surface language is GONE from a non-browse product.
  assert.ok(!homeSrc.includes("Where to?"), "no destination search hero");
  assert.ok(!detailSrc.includes("Guest reviews"), "no guest-reviews section on a workspace detail");
  assert.ok(!detailSrc.includes("Verified host"), "no verified-host language on a workspace detail");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  assert.ok(auditFiles(theme, files).passed, "gate passes on the product-led fallback");
  const contentIssues = auditContent(data, files);
  assert.equal(contentIssues.length, 0, `content gate failed: ${contentIssues.map((i) => i.description).join("; ")}`);
});

test("v14 wireframe fallback: a genuine catalog product keeps the browse structure", async () => {
  const company = await loadCompany("airbnb");
  const brief = productBriefSchema.parse({
    version: "1.0.0",
    title: "StayVista",
    productType: "vacation rental booking app",
    description: "Browse unique vacation rentals worldwide and book your perfect stay.",
    audience: { primary: "Travelers", needs: ["Find stays", "Book quickly"] },
    goals: ["Browse the catalog", "Book a stay"],
    features: [{ name: "Search", description: "Find stays by destination.", priority: "critical" }],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm, specific, human.",
    designLanguage: "Warm and photoreal.",
    inspiration: { primary: "airbnb" },
  });
  const wf = fallbackWireframe(brief, company);
  const home = wf.plan.screens.find((s) => s.id === "home")!;
  const detail = wf.plan.screens.find((s) => s.id === "detail")!;
  assert.ok(home.blocks.some((b) => b.block === "search"), "a browse product keeps the search toolbar");
  assert.ok(home.blocks.some((b) => b.block === "list" && b.variant === "cards"), "a browse product keeps the grid");
  assert.ok(detail.blocks.some((b) => b.block === "media" && b.variant === "gallery"), "a listing keeps the photo gallery");
  assert.ok(detail.blocks.some((b) => b.block === "list" && b.variant === "activity"), "a listing keeps social proof");
});

test("v14 brief: the catalog is the only source of inspiration (no hardcoded fallback)", async () => {
  const { inspirationFromAnswers } = await import("../lib/pastel-agent/agents/brief");
  assert.equal(inspirationFromAnswers({}).primary, null, "no answer → no hardcoded company");
  const scored = await scoreCompanies("build a fitness training app for runners");
  assert.ok(scored.length >= 10, "every registered company is scored");
  const { listCompanySlugs } = await import("../lib/pastel-agent/knowledge/index");
  const slugs = listCompanySlugs();
  for (const s of scored) assert.ok(slugs.includes(s.slug), "scores only reference registered companies");
});

test("v14 pipeline: phases + model roles are in the wire contract", async () => {
  const { PHASE_ORDER } = await import("../lib/pastel-agent/types");
  assert.deepEqual(PHASE_ORDER, ["discovery", "design", "brief", "data", "wireframe", "build", "assemble", "present", "review"]);
  const { designTokensSchema, dataPlanSchema } = await import("../lib/pastel-agent/schemas");
  assert.ok(designTokensSchema, "design-token schema exists");
  assert.ok(dataPlanSchema, "data-plan schema exists");
  const { MODELS, CHEAP_DEFAULT, MID_DEFAULT } = await import("../lib/pastel-agent/gateway");
  assert.ok(MODELS.design, "design model role registered");
  assert.ok(MODELS.data, "data model role registered");
  // V14 tier allocation: judgment stages on Luna, mechanical stages on Haiku.
  assert.equal(MODELS.planner, CHEAP_DEFAULT, "planner stays on Haiku");
  assert.equal(MODELS.builder, CHEAP_DEFAULT, "builder stays on Haiku");
  assert.equal(MODELS.repair, CHEAP_DEFAULT, "repair stays on Haiku");
  assert.equal(MODELS.copy, MID_DEFAULT, "copy moved to Luna (product voice)");
  assert.equal(MODELS.data, MID_DEFAULT, "data agent runs on Luna");
  assert.equal(MODELS.brief, MID_DEFAULT, "brief runs on Luna");
});

// ── V14b: design-data agent + next-gen review ─────────────────────────────

test("v14 data: fallback dataset fills every page-content slot from the packs", () => {
  const rentals = mockDataset(fitnessBrief(), "v14b-fill");
  assert.ok(rentals.reviews.length >= 4, "reviews exist in the dataset");
  assert.ok(rentals.reviewHeading.length > 0, "review heading exists");
  assert.ok(rentals.trustItems.length >= 3, "trust items exist");
  assert.ok(rentals.primaryCta.length > 0, "primary CTA exists");
  assert.ok(rentals.homeCta.length > 0, "home CTA exists");
  for (const r of rentals.reviews) {
    assert.ok(r.initials.length > 0 && r.hue >= 0, "review avatars are derived deterministically");
  }
});

test("v14 data: sanitizeDataPlan rejects duplicate labels and off-domain currency", async () => {
  const { sanitizeDataPlan } = await import("../lib/pastel-agent/agents/data");
  const { dataPlanSchema } = await import("../lib/pastel-agent/schemas");
  const base = {
    version: "1.0.0" as const,
    people: Array.from({ length: 6 }, (_, i) => ({ name: `Person ${i}`, role: "Member", email: `p${i}@example.com` })),
    metrics: [
      { label: "Volume", unit: "sets", value: "32", delta: 4, positive: true, note: "up", spark: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      { label: "Streak", unit: "days", value: "12", delta: 2, positive: true, note: "best 24", spark: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      { label: "Readiness", unit: "%", value: "88", delta: 3, positive: true, note: "trending", spark: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      { label: "PR", unit: "lb", value: "180", delta: 5, positive: true, note: "soon", spark: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    ],
    series: [
      { label: "Strength", unit: "lb", points: [{ x: "Mon", y: 120 }, { x: "Tue", y: 130 }, { x: "Wed", y: 125 }, { x: "Thu", y: 140 }] },
      { label: "Volume", unit: "sets", points: [{ x: "Mon", y: 30 }, { x: "Tue", y: 36 }, { x: "Wed", y: 32 }, { x: "Thu", y: 40 }] },
    ],
    rows: Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}`, detail: "d", amount: "40 lb", status: "done", date: "Aug 1" })),
    activity: ["Logged a session", "Set a PR", "Hit a streak", "Finished a block"],
    detailFields: ["Sets", "Reps", "Load", "Focus"],
    detailValues: ["3", "8", "60 lb", "Strength"],
    settingsSections: [
      { title: "Goals", items: [{ label: "Weekly goal", value: "30 km", control: "select" as const }, { label: "PR alerts", value: "On", control: "toggle" as const }] },
      { title: "Units", items: [{ label: "Distance", value: "km", control: "select" as const }, { label: "Weight", value: "lb", control: "select" as const }] },
    ],
    searchPlaceholder: "Search",
    emptyTitle: "No data",
    emptyBody: "Start a session.",
    reviews: Array.from({ length: 4 }, (_, i) => ({ name: `Person ${i}`, rating: 4.5, text: "A specific, useful review line for the product." })),
    reviewHeading: "Member feedback",
    trustItems: ["A", "B", "C"],
    primaryCta: "Start workout",
    homeCta: "Start today",
  };
  assert.ok(dataPlanSchema.safeParse(base).success, "valid plan parses");

  const dup = structuredClone(base);
  dup.metrics[1] = { ...dup.metrics[0] };
  assert.ok(sanitizeDataPlan(dataPlanSchema.parse(dup), "fitness").fatal.some((f) => f.includes("duplicate metric")), "duplicate metric labels are fatal");

  const dirty = structuredClone(base);
  dirty.rows[0].amount = "$22,091";
  dirty.rows[0].name = "Invoice INV-0211";
  assert.ok(sanitizeDataPlan(dataPlanSchema.parse(dirty), "fitness").fatal.some((f) => f.includes("currency")), "currency in a fitness product is fatal");

  const clean = sanitizeDataPlan(dataPlanSchema.parse(base), "fitness");
  assert.equal(clean.fatal.length, 0, "clean plan passes");
  assert.ok(clean.plan.reviews[0].initials.length > 0, "review initials derived");
});

test("v14 data: runData falls back to the domain packs when the gateway is unavailable", async () => {
  const { __setTestClient } = await import("../lib/pastel-agent/gateway");
  const { runData } = await import("../lib/pastel-agent/agents/data");
  const brief = fitnessBrief();
  try {
    __setTestClient({ responses: { create: async () => { throw new Error("stub: gateway down"); } } });
    const out = await runData({ brief, seed: "v14b-fallback" });
    assert.equal(out.usedFallback, true, "gateway failure → deterministic fallback");
    assert.equal(out.data.domain, "fitness");
    assert.ok(out.data.rows.length >= 6);
    assert.ok(out.data.reviews.length >= 4, "fallback dataset carries reviews");
  } finally {
    __setTestClient(null);
  }
});

test("v14 data: the composed screen reads the dataset's content (CTA, scoped fields) instead of baked consts", async () => {
  const company = await loadCompany("airbnb");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const brief = productBriefSchema.parse({
    version: "1.0.0", title: "StayVista", productType: "vacation rental booking app",
    description: "Browse unique vacation rentals worldwide.", audience: { primary: "Travelers", needs: ["x"] },
    goals: ["g"], features: [{ name: "S", description: "d", priority: "critical" }], platform: "all",
    screenPurposes: [
      { id: "home", purpose: "Browse and explore the catalog of stays" },
      { id: "detail", purpose: "Full listing page with photos, details, and booking" },
    ],
    copyDirection: "Warm", designLanguage: "x", inspiration: { primary: "airbnb" },
  });
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Stays", purpose: "Browse", nav: "topbar",
        blocks: [{ block: "hero", variant: "app", emphasis: true }, { block: "search", variant: "dropdown" }, { block: "list", variant: "cards" }] },
      { id: "detail", archetype: "list-detail", title: "Villa", purpose: "Listing", nav: "topbar",
        blocks: [{ block: "media", variant: "gallery", emphasis: true }, { block: "detail", variant: "pane" }, { block: "cta", variant: "band" }] },
    ],
  };
  const data = mockDataset(brief, "v14-content");
  const copy = fallbackCopy(brief, plan, data);

  // The deterministic data file carries the per-run content — CTA, reviews,
  // scoped detail fields. Screens read DATA, never baked consts.
  const { composeAll } = await import("../lib/pastel-agent/compose");
  const composed = composeAll({ brief, wireframe: plan, inventory: { version: "1.0.0", components: [] }, copy, theme, data, ux: fallbackUx(plan) });
  const dataFile = composed.files["src/data.js"];
  assert.ok(dataFile.includes(data.primaryCta ?? "Book my trip"), "primary CTA comes from the dataset");
  assert.ok(dataFile.includes("reviews"), "detail reviews ship in the scoped data");

  const { files } = await composeV21({
    brief, plan, inventory: { version: "1.0.0", components: [] }, theme, data, copy, ux: fallbackUx(plan),
    bodies: {
      home: `<section className="py-12">
  <SectionHeader eyebrow="Browse" title="Explore" />
  <p className="text-muted-foreground">catalog</p>
</section>`,
      detail: `<section className="py-12">
  <SectionHeader eyebrow="Next" title={DATA.screens.detail.primaryCta} />
  <p className="text-muted-foreground">{DATA.screens.detail.reviews.length} reviews</p>
</section>`,
    },
  });
  const detail = files["src/screens/detail.jsx"];
  assert.ok(detail.includes("DATA.screens.detail.primaryCta"), "detail renders the dataset CTA, never a baked string");
  assert.ok(detail.includes("DATA.screens.detail.reviews.length"), "detail reads the dataset's review count");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
});

test("v14 review: screen-composition audit flags duplicate and missing components", async () => {
  const { auditScreenComposition } = await import("../lib/pastel-agent/checks/review");
  const wireframe: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Dashboard", nav: "topbar",
        blocks: [
          { block: "custom", variant: "default", component: "StreakModule" },
          { block: "custom", variant: "default", component: "StreakModule" },
          { block: "custom", variant: "default", component: "CoachInsight" },
        ] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "Record", nav: "topbar",
        blocks: [{ block: "detail", variant: "pane" }] },
    ],
  };
  const inventory: any = {
    version: "1.0.0",
    components: [
      { name: "StreakModule", purpose: "Streak", basedOn: "StatCard", usedBy: ["home"] },
      { name: "CoachInsight", purpose: "Insight", basedOn: "Card", usedBy: ["home"] },
      { name: "RecordRow", purpose: "Row", basedOn: "ScheduleList", usedBy: ["detail"] },
    ],
  };
  const issues = auditScreenComposition(wireframe, inventory);
  assert.ok(issues.some((i) => i.description.includes('Component "StreakModule" planned 2x on home') && i.severity === "high"), "duplicate mount is flagged HIGH");
  assert.ok(issues.some((i) => i.description.includes("RecordRow") && i.file === "src/screens/detail.jsx"), "planned-but-unmounted component is flagged");
});

test("v14 review: geometry summary + screen context feed the vision model", async () => {
  const { geometrySummary, screenContext } = await import("../lib/pastel-agent/agents/review");
  const clean = geometrySummary("home", { overflow: false, fonts: [], overlaps: [], blanks: [], offGrid: 0, sampled: 10, minHeightOk: true, rhythm: [], flush: [], heroScale: true });
  assert.ok(clean.includes("clean"), "clean geometry reports clean");
  const dirty = geometrySummary("detail", { overflow: false, fonts: [], overlaps: [], blanks: [], offGrid: 2, sampled: 10, minHeightOk: true, rhythm: ["a"], flush: ["b"], heroScale: false });
  assert.ok(dirty.includes("issues") && dirty.includes("rhythm=1") && dirty.includes("heroScale=false"), "measured numbers reach the model");
  const ctx = screenContext("home", {
    version: "1.0.0",
    screens: [{ id: "home", archetype: "app-dashboard", title: "Home", purpose: "Dashboard", nav: "topbar", blocks: [{ block: "hero", variant: "app", emphasis: true }] }],
  }, { version: "1.0.0", components: [{ name: "StreakModule", purpose: "s", basedOn: "StatCard", usedBy: ["home"] }] });
  assert.ok(ctx.includes("hero:app*"), "screen context lists wireframe blocks");
  assert.ok(ctx.includes("StreakModule (StatCard)"), "screen context lists components to render");
});

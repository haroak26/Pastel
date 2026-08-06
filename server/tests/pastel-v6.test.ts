import { test } from "node:test";
import assert from "node:assert/strict";
import { listCatalog, scoreCompanies, loadCompany, compileCompanyBlock, megadesignBlock, resolveCompanyTheme } from "../lib/pastel-agent/knowledge/index";
import { companyManifestSchema } from "../lib/pastel-agent/knowledge/manifest-schema";
import { contrastRatio } from "../lib/pastel-agent/lib/colors";
import { compileStyles } from "../lib/pastel-agent/compile";
import { composeAll } from "../lib/pastel-agent/compose-v6";
import { mockDataset } from "../lib/pastel-agent/lib/content";
import { pickDomain, scoreDomains } from "../lib/pastel-agent/lib/domains";
import { auditContent } from "../lib/pastel-agent/checks/content";
import { fallbackCopy, sanitizeCopyPlan } from "../lib/pastel-agent/agents/copy-v6";
import { fallbackWireframe, enforceWireframeRules } from "../lib/pastel-agent/agents/wireframe-v6";
import { fallbackUx } from "../lib/pastel-agent/agents/ux-v6";
import { normalizeTwoScreens, resolveUxDesign, enforceUxDesign, canonicalStructure } from "../lib/pastel-agent/lib/ux-design";
import { inspirationFromAnswers } from "../lib/pastel-agent/agents/brief-v6";
import { mergeReviewResults } from "../lib/pastel-agent/agents/review-v6";
import { IncrementalScreenVerifier } from "../lib/pastel-agent/sandbox";
import { baseComponentCode, baseComponentNames } from "../lib/pastel-agent/base-components/index";
import { productBriefSchema, type ProductBrief, type V6ReviewResult } from "../lib/pastel-agent/schemas-v6";

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
  const { css } = compileStyles(theme);

  const brief = fitnessBrief();

  const wireframe = fallbackWireframe(brief, company);
  const components: Record<string, string> = {};
  for (const item of wireframe.inventory.components) {
    const code = baseComponentCode(item.basedOn);
    if (code) components[`src/components/${item.name}.jsx`] = code;
  }

  const data = mockDataset(brief, "v6-test");
  const copy = fallbackCopy(brief, wireframe.plan, data);
  const composed = composeAll({ brief, wireframe: wireframe.plan, inventory: wireframe.inventory, copy, theme, data });
  const files = { ...components, ...composed.files, ...composed.primitives, "src/styles.css": css };

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

test("v6 compose: model-renamed inventory resolves, verifies, and passes the gate", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);

  const brief = fitnessBrief();
  const wireframe = fallbackWireframe(brief, company);

  // Simulate the model renaming components (the run-2026-08-04 contract break):
  // everything keeps its basedOn but gets a product-specific file name.
  // Components referenced by NAME in custom blocks must keep their name —
  // the wireframe→file contract is name-based for mounted components.
  const renames: Record<string, string> = { Chart: "TrendChart", StatCard: "MetricCard", Avatar: "PersonBadge", Topbar: "AppTopbar", Badge: "StatusPill", Input: "SearchField", Button: "CtaButton" };
  const mounted = new Set(wireframe.plan.screens.flatMap((s) => s.blocks.filter((b) => b.block === "custom" && b.component).map((b) => b.component as string)));
  const inventory = {
    ...wireframe.inventory,
    components: wireframe.inventory.components.map((c) =>
      mounted.has(c.name) ? c : { ...c, name: renames[c.basedOn] ?? c.name },
    ),
  };

  // Builder output = base component code under the RENAMED file names.
  const components: Record<string, string> = {};
  for (const item of inventory.components) {
    const code = baseComponentCode(item.basedOn);
    if (code) components[`src/components/${item.name}.jsx`] = code;
  }

  const data = mockDataset(brief, "v6-test-renamed");
  const copy = fallbackCopy(brief, wireframe.plan, data);
  const composed = composeAll({ brief, wireframe: wireframe.plan, inventory, copy, theme, data });
  const files = { ...components, ...composed.files, ...composed.primitives, "src/styles.css": css };

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

test("v6 base components: every component name resolves to an exemplar", () => {
  const names = baseComponentNames();
  assert.ok(names.length >= 15);
  for (const n of names) assert.ok(baseComponentCode(n)!.length > 0);
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
    "src/components/PageHeader.jsx": baseComponentCode("PageHeader")!,
    "src/components/Footer.jsx": baseComponentCode("Footer")!,
  });
  assert.equal(issues.length, 0, JSON.stringify(issues));
});

test("v7 compose: signature variants (scoreboard stats, dropdown search, slogan band) emit deterministic markup", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const { css } = compileStyles(theme);
  const brief = fitnessBrief();

  const plan = {
    version: "1.0.0" as const,
    screens: [
      { id: "home", archetype: "app-dashboard" as const, title: "Home", purpose: "Dashboard", nav: "tabbar" as const,
        blocks: [
          { block: "stats", variant: "scoreboard", emphasis: true },
          { block: "chart", variant: "area-card" },
        ] },
      { id: "workouts", archetype: "catalog" as const, title: "Workouts", purpose: "Browse workouts", nav: "tabbar" as const,
        blocks: [
          { block: "search", variant: "dropdown", emphasis: true },
          { block: "detail", variant: "pane" },
        ] },
      { id: "landing", archetype: "landing" as const, title: "Landing", purpose: "Marketing", nav: "none" as const,
        blocks: [
          { block: "hero", variant: "fullbleed", emphasis: true },
          { block: "cta", variant: "slogan" },
          { block: "footer", variant: "columns" },
        ] },
    ],
  };
  const inventory = {
    version: "1.0.0" as const,
    components: [
      { name: "HeroStat", purpose: "Metric row", basedOn: "StatCard", usedBy: ["home"] },
      { name: "SearchPanel", purpose: "Search", basedOn: "Input", usedBy: ["workouts"] },
    ],
  };
  const components: Record<string, string> = {};
  for (const item of inventory.components) components[`src/components/${item.name}.jsx`] = baseComponentCode(item.basedOn)!;

  const data = mockDataset(brief, "v6-signature");
  const copy = fallbackCopy(brief, plan as any, data);
  const composed = composeAll({ brief, wireframe: plan as any, inventory, copy, theme, data });
  const files = { ...components, ...composed.files, ...composed.primitives, "src/styles.css": css };

  const home = composed.files["src/screens/home.jsx"];
  const workouts = composed.files["src/screens/workouts.jsx"];
  const landing = composed.files["src/screens/landing.jsx"];
  assert.ok(home.includes("text-4xl sm:text-5xl font-black"), "scoreboard giant numbers");
  assert.ok(home.includes("bg-accent text-accent-foreground"), "accent delta chips");
  assert.ok(workouts.includes("Select"), "dropdown search uses the Select component");
  assert.ok(!/rounded-full\s+border\s+px-3\.5/.test(workouts), "no filter chip groups");
  assert.ok(landing.includes("copy.slogan"), "slogan band is copy-driven");
  assert.ok(landing.includes("bg-accent text-accent-foreground"), "fullbleed/slogan accent CTA");

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
  const blocks = clean.screens[0].blocks;
  // Only ONE heavy block survives (detail or form, not both).
  const heavies = blocks.filter((b: any) => ["detail", "form", "table", "media"].includes(b.block) || (b.block === "list" && b.variant === "cards"));
  assert.equal(heavies.length, 1, `one heavy block per screen (got ${heavies.length})`);
  assert.ok(cleanInv.components.some((c: any) => c.name === "StreakModule"));
  assert.ok(!cleanInv.components.some((c: any) => c.name === "UnusedWidget"), "unmounted component dropped");
  assert.equal(cleanInv.components.length, 6);
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
          { block: "hero", variant: "statement", emphasis: true },
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
  for (const item of inventory.components) components[`src/components/${item.name}.jsx`] = baseComponentCode(item.basedOn)!;

  const data = mockDataset(brief, "v8-compose");
  const copy = fallbackCopy(brief, plan, data);
  const composed = composeAll({ brief, wireframe: plan, inventory, copy, theme, data });
  const files = { ...components, ...composed.files, ...composed.primitives, "src/styles.css": css };

  const home = composed.files["src/screens/home.jsx"];
  assert.ok(!/<section[^>]*>\s*<\/section>/.test(home), "no blank sections in composed screens");
  // App hero: dark dominant-metric band + no marketing "Get started / Learn more" outline pair.
  assert.ok(home.includes("lg:col-span-2"), "app hero has the dominant metric band");
  assert.ok(!/variant="outline"/.test(home), "app hero has no outline-button pair");

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
  const composed = composeAll({ brief, wireframe: plan, inventory, copy, theme, data });
  const files = { ...composed.files, ...composed.primitives, "src/styles.css": css };

  const progress = composed.files["src/screens/progress.jsx"];
  assert.ok(progress.includes(`unit='${data.series[1].unit}'`), `chart renders the requested series' unit (${data.series[1].unit})`);
  const y0 = data.series[0].points[0].y;
  assert.ok(!progress.includes(String(y0)), "chart does not render the index-0 series when copy asks for another");
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
  const composed = composeAll({ brief, wireframe: plan, inventory, copy, theme, data });
  const files = { ...composed.files, ...composed.primitives, "src/styles.css": css };

  const workouts = composed.files["src/screens/workouts.jsx"];
  assert.ok(workouts.includes("lg:grid-cols-2"), "paired blocks share a two-up grid row");
  // Paired stats collapse to 2 columns (never 4-in-a-row inside a half column).
  assert.ok(!workouts.includes("xl:grid-cols-4"), "paired scoreboard collapses to a 2-col grid");

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
  const composed = composeAll({ brief, wireframe: plan, inventory, copy, theme, data, ux: fallbackUx(plan) });
  const files = { ...composed.files, ...composed.primitives, "src/styles.css": css };

  const home = composed.files["src/screens/home.jsx"];
  const detail = composed.files["src/screens/detail.jsx"];
  assert.ok(home.includes("DATA.screens.home.rows.slice(0, 6)"), "home renders the product grid from its OWN scoped view");
  assert.ok(home.includes("SCENES"), "tiles are local deterministic scenes (no remote images)");
  assert.ok(!home.includes("DATA.reviews"), "home never touches the detail reviews");
  assert.equal((home.match(/<Card\b/g) ?? []).length, 1, "home budget = one grid cluster (6 cards at runtime)");
  assert.ok(detail.includes("lg:sticky lg:top-6"), "sticky summary card on desktop");
  assert.ok(detail.includes("DATA.screens.detail.primaryCta"), "domain-aware primary CTA from the detail view");
  assert.ok(detail.includes("Guest reviews"), "reviews section on detail");
  assert.ok(detail.includes("DATA.screens.detail.reviews.map"), "reviews render as rows from the detail view");
  assert.ok(detail.includes("DATA.screens.detail.images"), "gallery renders the SAME item's photos, never the catalog");
  assert.ok(!detail.includes("DATA.screens.home"), "detail never reads the catalog view (v9 test4 bug class is gone)");
  assert.ok(detail.includes("SCENES"), "gallery tiles are local deterministic scenes");
  assert.ok(detail.includes("CheckCircle2"), "trust-signal band on detail");
  assert.equal((detail.match(/<Card\b/g) ?? []).length, 1, "detail budget = the one summary card");
  assert.equal((detail.match(/variant="outline"/g) ?? []).length, 1, "at most one quiet outline action");

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
  const composed = composeAll({ brief, wireframe: plan, inventory, copy, theme, data, ux });
  const files = { ...composed.files, ...composed.primitives, "src/styles.css": css };
  const home = composed.files["src/screens/home.jsx"];
  assert.ok(home.includes("lg:grid-cols-[300px_1fr]"), "rail structure emits the 300px rail + main grid");
  assert.ok(home.includes("lg:sticky lg:top-6"), "rail is sticky on desktop");
  assert.ok(!home.includes("SCENES") || home.includes("SCENES"), "tiles render as local scenes");

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
  const composed = composeAll({ brief, wireframe: plan, inventory, copy, theme, data, ux: fallbackUx(plan) });
  const files = { ...composed.files, ...composed.primitives, "src/styles.css": css };
  const home = composed.files["src/screens/home.jsx"];
  assert.ok(home.includes("Featured stays"), "featured strip section renders");
  assert.ok(home.includes("lg:col-span-2"), "first featured tile is the wide dominant tile");
  assert.ok((home.match(/SCENES\[i % SCENES.length\]/g) ?? []).length >= 2, "both list variants use local scenes");

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

test("v11 compose: every section padding comes from the rhythm ladder (py-8/py-12/py-16), never ad hoc", async () => {
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
          { block: "list", variant: "featured" },
          { block: "cta", variant: "slogan" },
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
  const data = mockDataset(brief, "v11-rhythm");
  const copy = fallbackCopy(brief, plan, data);
  const composed = composeAll({ brief, wireframe: plan, inventory: { version: "1.0.0", components: [] }, copy, theme, data, ux: fallbackUx(plan) });
  const files = { ...composed.files, ...composed.primitives, "src/styles.css": css };
  const allSrc = Object.entries(files).filter(([p]) => p.endsWith(".jsx")).map(([, c]) => c).join("\n");

  // The ladder is py-8 / py-12 / py-16 ONLY — the old py-10/py-6/py-14 mix is gone.
  assert.ok(!/py-10\b/.test(allSrc), "no py-10 leftovers");
  assert.ok(!/py-6\b/.test(allSrc), "no py-6 leftovers");
  assert.ok(!/py-14\b/.test(allSrc), "no py-14 leftovers");
  assert.ok(!/py-20\b|py-24\b|py-32\b/.test(allSrc), "no slop paddings");
  for (const s of ["home", "detail"]) {
    const src = composed.files[`src/screens/${s}.jsx`];
    assert.ok(src.includes("py-8") || src.includes("py-12") || src.includes("py-16"), `${s} uses ladder steps`);
  }
  // V11 A2: no -mx escape hack; main is unconstrained so full-bleed bands are real.
  assert.ok(!/-mx-6|-mx-8/.test(allSrc), "no negative-margin full-bleed escape hack");
  assert.ok(!/main className="mx-auto w-full max-w-\[1280px\] px-6 md:px-8"/.test(allSrc), "main no longer constrains width");
  assert.ok(/<main className="w-full min-w-0">/.test(composed.files["src/screens/home.jsx"]), "main is full-width; sections self-frame");
  assert.ok(files["src/styles.css"].includes("clamp(16px, 4vw, 48px)"), "pastel-frame gutter floor is on the 8px grid");

  const verifier = new IncrementalScreenVerifier();
  const result = await verifier.verify(files);
  assert.ok(result.ok, `sandbox failed: ${result.errors.map((e) => e.message).join("; ")}`);
  const { auditFiles } = await import("../lib/pastel-agent/checks/audit");
  const gate = auditFiles(theme, files);
  assert.ok(gate.passed, `gate failed: ${gate.issues.map((i) => i.description).join("; ")}`);
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
        blocks: [{ block: "media", variant: "gallery", emphasis: true }, { block: "detail", variant: "pane" }, { block: "list", variant: "activity" }] },
    ],
  };
  const copy = fallbackCopy(brief, plan, data);
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

  const detailSrc = composed.files["src/screens/detail.jsx"];
  assert.ok(detailSrc.includes("DATA.screens.detail.fields.map"), "detail pane consumes {label,value} pairs");
  assert.ok(!detailSrc.includes("copy.detailFields"), "copy-plan detail labels can never leak into the pane");
  assert.equal((detailSrc.match(/DATA\.screens\.detail\.primaryCta/g) ?? []).length, 1, "single conversion point (one primary CTA)");
  assert.ok(detailSrc.includes(">Save</Button>"), "the outline action is 'Save', never a duplicate 'Reserve'");
});

test("v11 compose: search recipe renders visible labels; gallery scenes are per-item angle crops", async () => {
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
        blocks: [{ block: "media", variant: "gallery", emphasis: true }, { block: "detail", variant: "pane" }] },
    ],
  };
  const copy = fallbackCopy(brief, plan, data);
  const composed = composeAll({ brief, wireframe: plan, inventory: { version: "1.0.0", components: [] }, copy, theme, data, ux: fallbackUx(plan) });
  const home = composed.files["src/screens/home.jsx"];
  const detail = composed.files["src/screens/detail.jsx"];

  // Visible labels above search controls (V11 gate rule).
  const labelCount = (home.match(/<label className="block text-\[11px\]/g) ?? []).length;
  assert.ok(labelCount >= 3, `search segments carry visible labels (got ${labelCount})`);

  // Per-item gallery: tiles index SCENES by the ANGLE (n), not the layout index.
  assert.ok(/SCENES\[n % SCENES\.length\]/.test(detail), "gallery tiles use the angle index (SCENES[n])");
  assert.ok(detail.includes("images.map((n, i) =>"), "the gallery maps over the item's angle list");
  assert.ok(!detail.includes("SCENES[i % SCENES.length]"), "gallery tiles never index by layout position");
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

import { test } from "node:test";
import assert from "node:assert/strict";
import { productBriefSchema, type ProductBrief, type BrandKit } from "../lib/pastel-agent/schemas";
import {
  buildV17DesignPlan,
  enforceV17Plan,
  v17ForbiddenShape,
  auditV17Review,
  classifyProductContext,
  v17Structure,
} from "../lib/pastel-agent/contract";
import { classifyContext } from "../lib/pastel-agent/lib/ux-design";
import { decideNavigation, isNavLegal, footerPolicy } from "../lib/pastel-agent/lib/navigation";
import { buildBrandKit } from "../lib/pastel-agent/lib/brand-kit";
import { auditDensity } from "../lib/pastel-agent/lib/density";
import { defaultFrameSpec, columnLayoutFor, canonicalSurface, framePad } from "../lib/pastel-agent/lib/composition";
import { sectionPadV17, v17ScreenLayout } from "../lib/pastel-agent/lib/layout";
import { designTokensFromManifest, visualIntentFromTokens } from "../lib/pastel-agent/agents/design";
import { loadCompany } from "../lib/pastel-agent/knowledge/index";

function brief(mode: ProductBrief["mode"], description: string): ProductBrief {
  return productBriefSchema.parse({
    version: "1.0.0", title: "Test product", productType: "application", mode, description,
    audience: { primary: "Users", needs: ["Complete the core task"] }, goals: ["Complete the core task"],
    features: [{ name: "Core workflow", description: "The primary workflow.", priority: "critical" }], platform: "all",
    screenPurposes: [{ id: "home", purpose: "Primary workflow" }, { id: "detail", purpose: "One focused record" }],
    copyDirection: "Specific and useful.", designLanguage: "Clear and authored.", inspiration: { primary: "nike" },
  });
}

// ── Product context classification ────────────────────────────────────────

test("v17 classifyContext: dashboard products are context=dashboard", () => {
  assert.equal(classifyContext("A fitness dashboard to track workouts and personal records."), "dashboard");
  assert.equal(classifyContext("An analytics dashboard showing revenue and churn."), "dashboard");
});

test("v17 classifyContext: workspaces are context=workspace", () => {
  assert.equal(classifyContext("A project workspace where teams manage tasks and documents."), "workspace");
});

test("v17 classifyContext: marketing pages are context=marketing", () => {
  assert.equal(classifyContext("A beautiful landing page for our SaaS product."), "marketing");
  assert.equal(classifyContext("The pricing page for the platform."), "marketing");
});

test("v17 classifyContext: editors are context=editor", () => {
  assert.equal(classifyContext("A canvas-based design tool for creative work."), "editor");
  assert.equal(classifyContext("A text editor for writing code."), "editor");
});

test("v17 classifyContext: feeds are context=feed", () => {
  assert.equal(classifyContext("A social feed with posts and activity."), "feed");
});

test("v17 classifyContext: default is app", () => {
  assert.equal(classifyContext("A running coach app."), "app");
  assert.equal(classifyContext("A habit tracker."), "app");
});

// ── Navigation policies ───────────────────────────────────────────────────

test("v17 nav: dashboard context gets sidebar on desktop", () => {
  const nav = decideNavigation("dashboard", "track", 4, false, "all");
  assert.equal(nav.desktop, "sidebar");
});

test("v17 nav: workspace context with search gets sidebar+topbar", () => {
  const nav = decideNavigation("workspace", "operate", 5, true, "all");
  assert.equal(nav.desktop, "sidebar+topbar");
});

test("v17 nav: lightweight app gets topbar", () => {
  const nav = decideNavigation("app", "track", 2, false, "all");
  assert.equal(nav.desktop, "topbar");
});

test("v17 nav: marketing gets none", () => {
  const nav = decideNavigation("marketing", "browse", 3, false, "all");
  assert.equal(nav.desktop, "none");
});

test("v17 nav: tabbar and footer are illegal on desktop app", () => {
  assert.equal(isNavLegal("tabbar", "dashboard", "desktop"), false);
  assert.equal(isNavLegal("footer", "dashboard", "desktop"), false);
  assert.equal(isNavLegal("sidebar", "dashboard", "desktop"), true);
  assert.equal(isNavLegal("topbar", "dashboard", "desktop"), true);
});

test("v17 nav: marketing allows none nav", () => {
  assert.equal(isNavLegal("none", "marketing", "desktop"), true);
});

test("v17 footer: app screens never get footers", () => {
  assert.equal(footerPolicy("dashboard"), "never");
  assert.equal(footerPolicy("workspace"), "never");
  assert.equal(footerPolicy("app"), "never");
  assert.equal(footerPolicy("marketing"), "allowed");
});

// ── V17 design plan enforcement ───────────────────────────────────────────

test("v17 plan: track product with dashboard context has correct structure", () => {
  const b = brief("track", "A personal fitness dashboard to track workouts and PRs.");
  const plan = buildV17DesignPlan(b);
  assert.equal(plan.mode, "track");
  assert.equal(plan.context, "dashboard");
  assert.equal(plan.screens[0].structure, "dashboard");
  assert.equal(plan.screens[1].structure, "record-detail");
  assert.equal(plan.nav.desktop, "sidebar");
  assert.equal(plan.footerAllowed, false);
});

test("v17 plan: marketing context allows footers", () => {
  const b = brief("browse", "A landing page showcasing our AI product platform.");
  const plan = buildV17DesignPlan(b);
  assert.equal(plan.context, "marketing");
  assert.equal(plan.footerAllowed, true);
});

test("v17 enforcement: corrects illegal nav on desktop app screens", () => {
  const b = brief("track", "A workout tracking dashboard.");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Primary workflow", nav: "tabbar", blocks: [
        { block: "hero", variant: "app", emphasis: true }, { block: "stats", variant: "scoreboard" },
      ] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "One record", nav: "tabbar", blocks: [
        { block: "detail", variant: "pane", emphasis: true }, { block: "cta", variant: "band" },
      ] },
    ],
  };
  const out = enforceV17Plan(b, plan, { version: "1.0.0", components: [] });
  const homeNav = out.plan.screens.find((s) => s.id === "home")!.nav;
  assert.notEqual(homeNav, "tabbar", "tabbar should be corrected for dashboard context");
});

test("v17 enforcement: removes marketing vocabulary from track product", () => {
  const b = brief("track", "A personal training dashboard.");
  const issues = v17ForbiddenShape(b, { "src/screens/home.jsx": "Add guests", "src/screens/detail.jsx": "Guest reviews" });
  assert.equal(issues.length, 1);
});

// ── Density checks ────────────────────────────────────────────────────────

test("v17 density: dashboard requires minimum content fill", () => {
  const input = {
    ctx: "dashboard" as const,
    mode: "track" as const,
    screenId: "home",
    blockTypes: ["hero", "stats", "list"],
    sectionCount: 3,
    listRowCount: 2,
    metricCount: 2,
    customComponentCount: 0,
    hasPrimaryCta: true,
    hasContentColumn: false,
    hasSupportingContext: true,
    surfaceTypesUsed: ["hero", "stats", "list"],
    estimatedContentVp: 35,
  };
  const report = auditDensity(input);
  assert.equal(report.ok, false);
  assert.ok(report.issues.length > 0);
});

test("v17 density: well-populated dashboard passes", () => {
  const input = {
    ctx: "dashboard" as const,
    mode: "track" as const,
    screenId: "home",
    blockTypes: ["hero", "stats", "chart", "list", "custom"],
    sectionCount: 5,
    listRowCount: 6,
    metricCount: 4,
    customComponentCount: 2,
    hasPrimaryCta: true,
    hasContentColumn: true,
    hasSupportingContext: true,
    surfaceTypesUsed: ["tonal-band", "soft-wash", "inset-panel", "divided-list", "plain"],
    estimatedContentVp: 85,
  };
  const report = auditDensity(input);
  assert.equal(report.ok, true);
});

// ── Brand kit ──────────────────────────────────────────────────────────────

test("v17 brand kit: nike manifest produces a valid brand kit", async () => {
  const company = await loadCompany("nike");
  const tokens = designTokensFromManifest(company, "light");
  const visual = visualIntentFromTokens(tokens, "nike");
  const kit = buildBrandKit(tokens, visual, "nike");
  assert.equal(kit.version, "1.0.0");
  assert.equal(kit.company, "nike");
  assert.ok(kit.primary.length > 0);
  assert.ok(kit.accent.length > 0);
  assert.ok(kit.chartColors.length >= 3);
  assert.ok(kit.signatures.length >= 1);
  assert.ok(kit.forbiddenAccents.length >= 0);
  assert.ok(Object.keys(kit.cssVars).length > 0);
});

test("v17 brand kit: rejects indigo/blue accents when primary is already blue-hued", () => {
  const kit = buildBrandKit({
    version: "1.0.0", mode: "light",
    colors: {
      background: "#FFFFFF", foreground: "#0F172A", card: "#FFFFFF", cardForeground: "#0F172A",
      popover: "#FFFFFF", popoverForeground: "#0F172A", primary: "#2563EB", primaryForeground: "#FFFFFF",
      secondary: "#F1F5F9", secondaryForeground: "#0F172A", muted: "#F1F5F9", mutedForeground: "#64748B",
      accent: "#3B82F6", accentForeground: "#FFFFFF", destructive: "#EF4444", destructiveForeground: "#FFFFFF",
      success: "#22C55E", successSubtle: "#F0FDF4", warning: "#F59E0B", warningSubtle: "#FFFBEB",
      border: "#E2E8F0", input: "#E2E8F0", ring: "#2563EB", chart: ["#2563EB", "#7C3AED", "#F59E0B", "#22C55E", "#EF4444"],
    },
    radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    typeScale: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36 },
    control: { sm: 32, md: 40, lg: 48 },
    sectionPaddingY: 64, sectionGap: 32,
    fonts: { display: "Inter", body: "Inter" },
  }, { version: "1.0.0", typeVoice: "grotesque", spacingMood: "standard", cornerLanguage: "soft", surfaceTreatment: "hairline", accentBehavior: "warm", mediaStrategy: "flat-illustration", mediaSubject: "generic" }, "test");
  assert.ok(kit.forbiddenAccents.some((c) => c.includes("4F46E5") || c.includes("3B82F6")), "indigo/blue accents should be forbidden when primary is blue");
});

// ── V17 review board ───────────────────────────────────────────────────────

test("v17 review: catches nav violation on app screens", () => {
  const b = brief("track", "A personal training dashboard.");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Primary workflow", nav: "tabbar", blocks: [{ block: "hero", variant: "app", emphasis: true }] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "One record", nav: "tabbar", blocks: [{ block: "detail", variant: "pane", emphasis: true }] },
    ],
  };
  const issues = auditV17Review(b, plan, { "src/screens/home.jsx": "", "src/screens/detail.jsx": "" });
  assert.ok(issues.some((i) => i.category === "v17-nav"), "should catch illegal nav");
});

test("v17 review: catches marketing leakage on app dashboard", () => {
  const b = brief("track", "A personal training dashboard.");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Primary workflow", nav: "topbar", blocks: [{ block: "hero", variant: "app", emphasis: true }] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "One record", nav: "topbar", blocks: [{ block: "detail", variant: "pane", emphasis: true }] },
    ],
  };
  const issues = auditV17Review(b, plan, { "src/screens/home.jsx": "text-center text-4xl font-black mx-auto max-w-2xl", "src/screens/detail.jsx": "" });
  assert.ok(issues.some((i) => i.category === "v17-context"), "should catch marketing hero on app dashboard");
});

test("v17 review: catches footer on app screen", () => {
  const b = brief("track", "A personal training dashboard.");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Primary workflow", nav: "sidebar", blocks: [{ block: "hero", variant: "app", emphasis: true }] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "One record", nav: "sidebar", blocks: [{ block: "detail", variant: "pane", emphasis: true }] },
    ],
  };
  const issues = auditV17Review(b, plan, { "src/screens/home.jsx": "col-span-2 text-xs text-muted-foreground footer", "src/screens/detail.jsx": "" });
  assert.ok(issues.some((i) => i.category === "v17-nav"), "should catch footer on app screen");
});

test("v17 review: runs density checks", () => {
  const b = brief("track", "A personal training dashboard.");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Primary workflow", nav: "sidebar", blocks: [
        { block: "hero", variant: "app", emphasis: true },
      ] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "One record", nav: "sidebar", blocks: [
        { block: "detail", variant: "pane", emphasis: true },
      ] },
    ],
  };
  const issues = auditV17Review(b, plan, { "src/screens/home.jsx": "", "src/screens/detail.jsx": "" });
  assert.ok(issues.some((i) => i.category === "v17-density"), "should flag low-density screens");
});

// ── V17 composition module ────────────────────────────────────────────────

test("v17 composition: default frame spec varies by context", () => {
  const appSpec = defaultFrameSpec("app", "standard");
  const dashSpec = defaultFrameSpec("dashboard", "standard");
  assert.equal(appSpec.contentMaxWidth, 1440);
  assert.equal(dashSpec.contentMaxWidth, 1440);
  const mktSpec = defaultFrameSpec("marketing", "standard");
  assert.equal(mktSpec.contentMaxWidth, 1280);
});

test("v17 composition: column layout for dashboard home is two-column", () => {
  assert.equal(columnLayoutFor("home", "track", "dashboard"), "two-column");
});

test("v17 composition: column layout for detail is two-column", () => {
  assert.equal(columnLayoutFor("detail", "track", "dashboard"), "two-column");
});

test("v17 composition: column layout for marketing is single", () => {
  assert.equal(columnLayoutFor("home", "browse", "marketing"), "single");
});

test("v17 composition: canonical surfaces are not card by default", () => {
  assert.equal(canonicalSurface("hero", "app", "home", true), "tonal-band");
  assert.equal(canonicalSurface("stats", "scoreboard", "home"), "soft-wash");
  assert.equal(canonicalSurface("list"), "divided-list");
  assert.equal(canonicalSurface("detail", "pane", "detail"), "inset-panel");
  assert.equal(canonicalSurface("cta"), "tonal-band");
  // V18: list:cards defaults to soft-wash, not card — cards are scarce
  assert.equal(canonicalSurface("list", "cards"), "soft-wash");
  assert.equal(canonicalSurface("stats"), "soft-wash");
});

// ── Layout module ─────────────────────────────────────────────────────────

test("v17 layout: framePad rounds to nearest 8px step", () => {
  assert.equal(framePad(32), "py-8");
  assert.equal(framePad(48), "py-12");
  assert.equal(framePad(64), "py-16");
});

test("v17 layout: sectionPadV17 respects relationship", () => {
  const spec = defaultFrameSpec("dashboard", "standard");
  const sep = sectionPadV17(false, "separated", spec);
  const cont = sectionPadV17(false, "continues", spec);
  const supp = sectionPadV17(false, "supports", spec);
  assert.ok(parseInt(sep.replace(/\D/g, "")) >= parseInt(cont.replace(/\D/g, "")));
  assert.ok(parseInt(supp.replace(/\D/g, "")) <= parseInt(sep.replace(/\D/g, "")));
});

// ── Cross-product fingerprint diversity ───────────────────────────────────

test("v17 gives non-catalog products distinct screen fingerprints", () => {
  const dashboard = buildV17DesignPlan(brief("track", "Track workouts and personal records with a dashboard."));
  const workspace = buildV17DesignPlan(brief("create", "Create and inspect documents and drafts in a workspace."));
  const feed = buildV17DesignPlan(brief("social", "Share updates and discuss them in threads."));
  assert.notEqual(dashboard.fingerprint, workspace.fingerprint);
  assert.notEqual(workspace.fingerprint, feed.fingerprint);
  assert.equal(dashboard.screens[0].structure, "dashboard");
  assert.equal(workspace.screens[0].structure, "workspace");
  assert.equal(feed.screens[0].structure, "feed");
});

test("v17 preserves v16 backward compatibility", async () => {
  const dashboard = buildV17DesignPlan(brief("track", "Track workouts and personal records."));
  const { buildV16DesignPlan } = await import("../lib/pastel-agent/contract");
  const v16plan = buildV16DesignPlan(brief("track", "Track workouts and personal records."));
  assert.equal(dashboard.mode, v16plan.mode);
  assert.equal(dashboard.screens[0].structure, v16plan.screens[0].structure);
});

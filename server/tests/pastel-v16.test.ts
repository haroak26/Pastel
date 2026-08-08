import { test } from "node:test";
import assert from "node:assert/strict";
import { productBriefSchema, type ProductBrief } from "../lib/pastel-agent/schemas";
import { buildV16DesignPlan as buildDesignPlan, enforceV16Plan, v16ForbiddenShape as hasForbiddenShape, auditV16Review } from "../lib/pastel-agent/contract";
import { selectDesignCapabilities as selectCapabilities, selectCompanyReferences } from "../lib/pastel-agent/knowledge/index";

function brief(mode: ProductBrief["mode"], description: string): ProductBrief {
  return productBriefSchema.parse({
    version: "1.0.0", title: "Test product", productType: "application", mode, description,
    audience: { primary: "Users", needs: ["Complete the core task"] }, goals: ["Complete the core task"],
    features: [{ name: "Core workflow", description: "The primary workflow.", priority: "critical" }], platform: "all",
    screenPurposes: [{ id: "home", purpose: "Primary workflow" }, { id: "detail", purpose: "One focused record" }],
    copyDirection: "Specific and useful.", designLanguage: "Clear and authored.", inspiration: { primary: "nike" },
  });
}

test("v16 gives non-catalog products distinct screen fingerprints", () => {
  const dashboard = buildDesignPlan(brief("track", "Track workouts and personal records."));
  const workspace = buildDesignPlan(brief("create", "Create and inspect documents and drafts."));
  const feed = buildDesignPlan(brief("social", "Share updates and discuss them in threads."));
  assert.notEqual(dashboard.fingerprint, workspace.fingerprint);
  assert.notEqual(workspace.fingerprint, feed.fingerprint);
  assert.equal(dashboard.screens[0].structure, "dashboard");
  assert.equal(workspace.screens[0].structure, "workspace");
  assert.equal(feed.screens[0].structure, "feed");
});

test("v16 removes catalog blocks from a track product after model output", () => {
  const b = brief("track", "An adaptive workout coach with readiness and progress.");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "catalog", title: "Home", purpose: "Primary workflow", nav: "topbar", blocks: [
        { block: "hero", variant: "app", emphasis: true }, { block: "search", variant: "dropdown" }, { block: "list", variant: "cards" }, { block: "stats", variant: "scoreboard" },
      ] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "One focused record", nav: "topbar", blocks: [
        { block: "media", variant: "gallery", emphasis: true }, { block: "detail", variant: "pane" }, { block: "cta", variant: "band" },
      ] },
    ],
  };
  const out = enforceV16Plan(b, plan, { version: "1.0.0", components: [] });
  assert.ok(!out.plan.screens[0].blocks.some((x) => x.block === "search" || x.variant === "cards"));
  assert.ok(!out.plan.screens[1].blocks.some((x) => x.block === "media"));
  assert.ok(out.plan.screens[1].blocks.some((x) => x.block === "detail"));
});

test("v16 catches marketplace vocabulary in non-transaction output", () => {
  const b = brief("track", "A personal training dashboard.");
  const issues = hasForbiddenShape(b, { "src/screens/home.jsx": "Where to? Add guests", "src/screens/detail.jsx": "Guest reviews" });
  assert.equal(issues.length, 1);
});

test("v16 knowledge selects mode-compatible capabilities", () => {
  const caps = selectCapabilities("track", "adaptive coaching dashboard with progress and workout sequence");
  assert.ok(caps.some((c) => c.id === "dashboard" || c.id === "coaching"));
  assert.ok(!caps.some((c) => c.id === "catalog"));
});

test("v16 company knowledge remains a visual reference, not a layout default", async () => {
  const selected = await selectCompanyReferences("an adaptive workout coach with progress", "track", "nike");
  assert.equal(selected.primary.manifest.slug, "nike");
  assert.ok(selected.primary.block.includes("Nike"));
  assert.ok(!selected.capabilities.some((c) => c.id === "catalog"));
});

test("v16 deterministic review catches illegal sections and cross-screen data leaks", () => {
  const b = brief("track", "A personal training dashboard.");
  const plan: any = {
    version: "1.0.0",
    screens: [
      { id: "home", archetype: "app-dashboard", title: "Home", purpose: "Primary workflow", nav: "topbar", blocks: [{ block: "hero", variant: "app", emphasis: true }, { block: "search", variant: "dropdown" }] },
      { id: "detail", archetype: "list-detail", title: "Detail", purpose: "One record", nav: "topbar", blocks: [{ block: "detail", variant: "pane", emphasis: true }] },
    ],
  };
  const issues = auditV16Review(b, plan, { "src/screens/detail.jsx": "DATA.screens.home.rows.map((row) => row.name)" });
  assert.ok(issues.some((issue) => issue.category === "v16-contract"));
  assert.ok(issues.some((issue) => issue.category === "cross-screen-integrity"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  __setTestClient,
  chatJSON,
  parseAndValidate,
  type MergeGatewayLike,
} from "../lib/pastel-agent/gateway";
import {
  structureSchema,
  brandKitSchemaFor,
  uxPlanSchemaFor,
  ensureCustomizationSpecificity,
  runArchitecture,
} from "../lib/pastel-agent/picasso/pipeline/stage-3-wireframe";
import { validateComponentCode } from "../lib/pastel-agent/picasso/pipeline/stage-4-build";
import { loadBaseComponent, rewriteBaseImports } from "../lib/pastel-agent/picasso/pipeline/lib/base-components";
import { runPicassoPipeline, fallbackTokens, type PicassoHooks } from "../lib/pastel-agent/picasso/pipeline/orchestrator";
import type { Tokens, Brief } from "../lib/pastel-agent/picasso/pipeline/types";

// ── Fixtures ─────────────────────────────────────────────────────────────

const partialTokens = {
  color: { accent: { "500": "#14b8a6", "600": "#0d9488" } },
  radius: { lg: "0.75rem" },
  motion: { duration: { fast: "120ms", base: "200ms", slow: "300ms" }, easing: { standard: "cubic-bezier(0.4, 0, 0.2, 1)" } },
  typography: { fontFamily: { display: "Sora", body: "DM Sans", mono: "IBM Plex Mono" } },
  space: { "0": "0px", "4": "4px", "8": "8px", "16": "16px", "24": "24px" },
} as unknown as Tokens;

const fixtureBrief = {
  productName: "TrailCrew",
  description: "Social fitness tracker for trail runners.",
  audience: "Trail runners",
  niche: "health",
  personality: ["bold", "playful"],
  density: "balanced",
  mode: "light",
  platform: "web",
} as unknown as Brief;

/** Gateway stub: serves one canned JSON text per `responses.create` call. */
function stubClient(contents: string[]): MergeGatewayLike {
  let i = 0;
  return {
    responses: {
      create: async () => {
        const text = contents[Math.min(i++, contents.length - 1)];
        return { output: [{ type: "message", content: [{ type: "text", text }] }] };
      },
    },
  };
}

// ── V7 gateway: repair + fallback before the hard throw ────────────────

test("picasso v7: parseAndValidate exposes the partially-parsed payload on validation failure", () => {
  const result = parseAndValidate(`{"a": "x"}`, (v) => z.object({ a: z.string(), b: z.string() }).parse(v));
  assert.ok("error" in result && result.kind === "validate");
  if ("error" in result && result.kind === "validate") {
    assert.deepEqual(result.payload, { a: "x" });
  }
});

test("picasso v7: chatJSON repair salvages a partial object after both attempts fail", async () => {
  const schema = z.object({ a: z.string(), b: z.string() });
  __setTestClient(stubClient([`{"a": "first"}`, `{"a": "second"}`]));
  try {
    let repairs = 0;
    const value = await chatJSON(
      [{ role: "user", content: "go" }],
      {
        model: "clarify",
        validate: (v) => schema.parse(v),
        repair: (payload) => {
          repairs++;
          if (payload && typeof payload === "object") {
            const p = payload as Record<string, unknown>;
            if (typeof p.a === "string") return { a: p.a, b: "defaulted" };
          }
          return null;
        },
      },
    );
    assert.equal(repairs, 1);
    assert.deepEqual(value, { a: "second", b: "defaulted" });
  } finally {
    __setTestClient(null);
  }
});

test("picasso v7: chatJSON fallback is used when repair declines", async () => {
  const schema = z.object({ a: z.string(), b: z.string() });
  __setTestClient(stubClient([`{"a": "x"}`, `not json at all`]));
  try {
    const value = await chatJSON(
      [{ role: "user", content: "go" }],
      {
        model: "clarify",
        validate: (v) => schema.parse(v),
        repair: () => null,
        fallback: () => ({ a: "fallback-a", b: "fallback-b" }),
      },
    );
    assert.deepEqual(value, { a: "fallback-a", b: "fallback-b" });
  } finally {
    __setTestClient(null);
  }
});

test("picasso v7: chatJSON still throws without repair/fallback (structural contracts)", async () => {
  const schema = z.object({ a: z.string(), b: z.string() });
  __setTestClient(stubClient([`{"a": "x"}`, `{"a": "y"}`]));
  try {
    await assert.rejects(
      chatJSON([{ role: "user", content: "go" }], { model: "clarify", validate: (v) => schema.parse(v) }),
      /failed validation/,
    );
  } finally {
    __setTestClient(null);
  }
});

// ── V7 stage-3: prose fields default, structural fields stay required ───

test("picasso v7: brandKit schema fills every missing prose leaf with token-derived defaults", () => {
  const schema = brandKitSchemaFor(partialTokens, "midnight trail dust");
  const brand = schema.parse({});
  assert.equal(typeof brand.colorRules.accentUsage, "string");
  assert.ok(brand.colorRules.accentUsage.includes("#14b8a6"));
  assert.equal(brand.spacingRules.componentPadding, "16-24px internal padding for controls and panels, consistent with the base spacing scale.");
  assert.ok(brand.motionRules.easing.includes("cubic-bezier"));
  assert.ok(brand.signatureMoves.some((m) => m.includes("midnight trail dust")));
  assert.ok(brand.antiPatterns.length >= 2);
});

test("picasso v7: ux plan schema defaults when omitted entirely", () => {
  const plan = uxPlanSchemaFor(fixtureBrief).parse({});
  assert.ok(plan.densityStrategy.includes("balanced"));
  assert.deepEqual(plan.primaryActionPerScreen, {});
});

test("picasso v7: structure schema defaults prose but rejects missing structural arrays", () => {
  assert.throws(() => structureSchema.parse({}), /screens/);
  assert.throws(() => structureSchema.parse({
    screens: [
      {
        id: "home", name: "Home", route: "/",
        regions: [{ name: "main", role: "main", hierarchy: "primary", components: [{ ref: "goal-card" }] }],
      },
    ],
    components: [],
  }), /components/);

  const entries = Array.from({ length: 10 }, (_v, i) => ({
    id: `comp-${i}`, name: `Comp ${i}`, taxonomy: "primitive", baseComponent: "button",
  }));
  const parsed = structureSchema.parse({
    screens: [
      {
        id: "home", name: "Home", route: "/",
        regions: [
          { name: "main", role: "main", hierarchy: "primary", components: [{ ref: "comp-0" }] },
          { name: "toolbar", role: "toolbar", hierarchy: "supporting", components: [{ ref: "comp-1" }] },
        ],
      },
      {
        id: "detail", name: "Detail", route: "/d",
        regions: [
          { name: "content", role: "content", hierarchy: "primary", components: [{ ref: "comp-1" }] },
          { name: "sidebar", role: "sidebar", hierarchy: "secondary", components: [{ ref: "comp-2" }] },
        ],
      },
    ],
    components: entries,
  });
  assert.equal(parsed.screens[0].description, "");
  assert.equal(parsed.screens[0].regions[0].purpose, "");
  assert.equal(parsed.components[0].customization, "");
});

// ── V7 stage-3: customization specificity enforcement ───────────────────

test("picasso v7: vague customization is replaced with a token-derived design note", () => {
  const entry = { name: "GoalCard", taxonomy: "organism", customization: "make it feel modern and clean and on brand" };
  const out = ensureCustomizationSpecificity(entry, partialTokens);
  assert.notEqual(out, entry.customization);
  assert.ok(out.includes("#14b8a6"));
  assert.ok(out.includes("radius") || out.includes("rounded"));
  assert.ok(out.includes("h-9"));
});

test("picasso v7: specific customization naming two axes passes through unchanged", () => {
  const entry = {
    name: "GoalCard",
    taxonomy: "organism",
    customization: "h-11 controls with rounded-lg corners, accent on the active state, semibold display type",
  };
  const out = ensureCustomizationSpecificity(entry, partialTokens);
  assert.equal(out, entry.customization);
});

// ── V7 stage-4: taxonomy-aware divergence bar ───────────────────────────

function baseEntry(taxonomy: "primitive" | "molecule" | "organism") {
  return {
    id: "goal-card",
    name: "GoalCard",
    taxonomy,
    description: "Goal summary card",
    baseComponent: "card",
    customization: "rounded-lg corners, accent on active, h-9 controls",
    states: ["default", "hover"],
    props: {},
  };
}

test("picasso v7: molecule near-identical to its base fails validation", () => {
  const base = loadBaseComponent("card");
  assert.ok(base, "card base component must exist");
  const near = rewriteBaseImports(base.source.replace(/data-slot="card"/g, 'data-slot="goal-card"').replace(/bg-card/g, "bg-muted"));
  const result = validateComponentCode(near, baseEntry("molecule"), base);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Too close to the base")), result.errors.join("; "));
});

test("picasso v7: visibly customized organism passes validation", () => {
  const base = loadBaseComponent("card");
  assert.ok(base, "card base component must exist");
  const heavy = rewriteBaseImports(
    base.source
      .replace(/data-slot="card"/g, 'data-slot="goal-card"')
      .replace(/bg-card/g, "bg-muted")
      .replace(/text-card-foreground/g, "text-foreground")
      + `
function GoalCardExtra() {
  return (
    <div className="bg-primary text-primary-foreground rounded-lg h-9 px-3">
      <span className="text-muted-foreground border-border">goal progress</span>
    </div>
  )
}
`,
  );
  const result = validateComponentCode(heavy, baseEntry("organism"), base);
  assert.equal(result.valid, true, result.errors.join("; "));
});

test("picasso v7: primitive stays close to base without tripping the divergence bar", () => {
  const base = loadBaseComponent("button");
  assert.ok(base, "button base component must exist");
  const near = rewriteBaseImports(base.source.replace(/bg-primary/g, "bg-muted"));
  const result = validateComponentCode(near, baseEntry("primitive"), base);
  // Only byte-identical is banned for primitives; a light edit passes.
  assert.equal(result.valid, true, result.errors.join("; "));
  const identical = validateComponentCode(base.source, baseEntry("primitive"), base);
  assert.equal(identical.valid, false);
  assert.ok(!identical.errors.some((e) => e.includes("Too close to the base")), "primitives must not hit the molecule/organism divergence bar");
});

// ── V7 stage-3 split: full runArchitecture with stubbed gateway ─────────

test("picasso v7: runArchitecture splits into structure call + brand call, defaults trailing brand fields", async () => {
  const structureJson = JSON.stringify({
    screens: [
      {
        id: "dashboard", name: "Dashboard", route: "/",
        description: "The run dashboard",
        regions: [
          { name: "topbar", role: "nav", purpose: "Navigation", hierarchy: "secondary", components: [{ ref: "app-nav", description: "Primary nav" }] },
          { name: "main", role: "main", purpose: "Metrics", hierarchy: "primary", components: [{ ref: "goal-card", description: "Goal cards" }] },
        ],
      },
      {
        id: "profile", name: "Profile", route: "/profile",
        description: "Runner profile",
        regions: [
          { name: "header", role: "content", purpose: "Profile header", hierarchy: "primary", components: [{ ref: "avatar-badge", description: "Avatar" }] },
          { name: "stats", role: "content", purpose: "Stats", hierarchy: "secondary", components: [{ ref: "stat-tile", description: "Stats" }] },
        ],
      },
    ],
    globalRegions: [
      { name: "app-sidebar", role: "sidebar", purpose: "App nav", hierarchy: "secondary", components: [{ ref: "app-nav", description: "Sidebar nav" }] },
    ],
    components: [
      { id: "app-nav", name: "AppNav", taxonomy: "molecule", description: "Navigation", baseComponent: "sidebar", customization: "compact h-9 items, rounded-lg active state, accent marker" },
      { id: "goal-card", name: "GoalCard", taxonomy: "organism", description: "Goal summary", baseComponent: "card", customization: "rounded-xl corners, accent border on active, h-9 controls" },
      { id: "avatar-badge", name: "AvatarBadge", taxonomy: "molecule", description: "Avatar with badge", baseComponent: "avatar", customization: "rounded-full, accent ring when active" },
      { id: "stat-tile", name: "StatTile", taxonomy: "molecule", description: "Metric tile", baseComponent: "card", customization: "bg-muted surfaces, accent number, h-9 height" },
      { id: "primary-button", name: "PrimaryButton", taxonomy: "primitive", description: "Primary CTA", baseComponent: "button", customization: "h-10, rounded-lg, accent fill" },
      { id: "input-field", name: "InputField", taxonomy: "primitive", description: "Text input", baseComponent: "input", customization: "h-9, rounded-md, focus ring" },
      { id: "badge-chip", name: "BadgeChip", taxonomy: "atom", description: "Status chip", baseComponent: "badge", customization: "accent tint, pill radius" },
      { id: "empty-state", name: "EmptyState", taxonomy: "molecule", description: "Empty state", baseComponent: "empty", customization: "bg-muted panel, rounded-lg, accent icon" },
      { id: "progress-bar", name: "ProgressBar", taxonomy: "atom", description: "Progress", baseComponent: "progress", customization: "accent fill, rounded-full track" },
      { id: "sheet-panel", name: "SheetPanel", taxonomy: "organism", description: "Settings sheet", baseComponent: "sheet", customization: "rounded-l-xl panel, h-11 controls, accent active row" },
    ],
  });
  // Call B omits spacingRules, motionRules.easing, and the whole uxDesignPlan —
  // the exact shape of the V6 abort must now be absorbed by defaults.
  const brandJson = JSON.stringify({
    brandKit: {
      colorRules: { accentUsage: "accent on primary CTA only", semanticUsage: "status colours", neutralUsage: "chrome", forbiddenPatterns: ["gradients"] },
      typographyRules: { displayUsage: "headlines", bodyUsage: "body", monoUsage: "numbers", weightRules: "600", sizeRules: "4px steps" },
      signatureMoves: ["giant trail-mile numerals", "hairline route dividers"],
      antiPatterns: ["stock cards", "grey walls"],
    },
  });

  __setTestClient(stubClient([structureJson, brandJson]));
  try {
    const out = await runArchitecture({
      brief: fixtureBrief,
      tokens: partialTokens,
      productContext: "app",
      creativeSeed: "midnight trail dust",
      contextDescription: "A dashboard-first training app.",
    });

    assert.equal(out.layoutPlan.screens.length, 2);
    assert.equal(out.componentsManifest.entries.length, 10);
    // Call B was grounded in Call A: defaults reference the theme tokens.
    assert.equal(out.brandKit.spacingRules.componentPadding, "16-24px internal padding for controls and panels, consistent with the base spacing scale.");
    assert.ok(out.brandKit.motionRules.easing.includes("cubic-bezier"));
    assert.ok(out.uxDesignPlan.navigationStrategy.length > 0, "uxDesignPlan must be defaulted, not missing");
    assert.ok(out.brandKit.generatedAt.length > 0);
  } finally {
    __setTestClient(null);
  }
});

// ── V7 orchestrator: degrade, never hard-abort ──────────────────────────

function fakeHooks(persisted: Map<string, string>): PicassoHooks {
  return {
    emit: () => {},
    persistDoc: (p, _t, _k, content) => { persisted.set(p, content); },
    persistFile: () => {},
  };
}

const validDiscovery = JSON.stringify({
  productContext: "app",
  contextDescription: "A dashboard-first training app.",
  selectedReferences: [],
  creativeSeed: "midnight trail dust",
});

const validDirections = JSON.stringify({
  directions: [
    { name: "Railroad", summary: "s", accentColor: "#c2410c", surfaces: "paper", radius: "sharp", spacing: "dense", motion: "swift", typographyVoice: "v", signatureMoves: ["a", "b"] },
    { name: "Arcade", summary: "s", accentColor: "#7e22ce", surfaces: "tonal", radius: "pill", spacing: "airy", motion: "springy", typographyVoice: "v", signatureMoves: ["a", "b"] },
    { name: "Library", summary: "s", accentColor: "#15803d", surfaces: "layered", radius: "soft", spacing: "balanced", motion: "stately", typographyVoice: "v", signatureMoves: ["a", "b"] },
  ],
});

test("picasso v7: orchestrator degrades to success:false when the wireframe stage fails structurally", async () => {
  const brokenWireframe = JSON.stringify({ screens: [], components: [], globalRegions: [] });
  // Calls: discovery, directions, tokens, wireframe (attempt + corrective retry)
  __setTestClient(stubClient([
    validDiscovery,
    validDirections,
    JSON.stringify(fallbackTokens(fixtureBrief)),
    brokenWireframe,
    brokenWireframe,
  ]));
  const persisted = new Map<string, string>();
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "degrade-test",
      mode: "draft",
      hooks: fakeHooks(persisted),
    });
    // The exact V6 failure mode — a throwing runArchitecture — must now
    // return a valid output with success:false, not throw.
    assert.equal(out.success, false);
    assert.ok(out.degradations.some((d) => d.stage === "wireframe"), JSON.stringify(out.degradations));
    assert.deepEqual(out.screenFiles, {});
    // Partial artifacts from stages 1-2 survive and are persisted.
    assert.ok(persisted.has("docs/planning/Discovery.json"));
    assert.ok(persisted.has("docs/design/DesignTokens.json"));
    assert.ok(persisted.has("docs/design/MotionSpec.json"));
    assert.equal(persisted.has("docs/design/BrandKit.json"), false, "no brand kit was produced");
    assert.ok(persisted.has("docs/review/Degradations.json"), "degradation evidence must be persisted");
  } finally {
    __setTestClient(null);
  }
});

test("picasso v7: orchestrator degrades to success:false when discovery fails", async () => {
  __setTestClient(stubClient(["total garbage", "total garbage"]));
  const persisted = new Map<string, string>();
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "degrade-test-2",
      mode: "draft",
      hooks: fakeHooks(persisted),
    });
    assert.equal(out.success, false);
    assert.ok(out.degradations.some((d) => d.stage === "discovery"), JSON.stringify(out.degradations));
    assert.ok(persisted.has("docs/review/Degradations.json"));
  } finally {
    __setTestClient(null);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  MODELS,
  getPastelGatewayTags,
  PASTEL_GATEWAY_TAG_KEY,
  isTruncated,
  parseAndValidate,
} from "../lib/pastel-agent/gateway";
import { clarifyQuestionSchema } from "../lib/pastel-agent/schemas/clarify-schemas";
import {
  designSystemSpecSchema,
  productSpecSchema,
  architecturePlanSchema,
  generatedFilesSchema,
  intakeBriefSchema,
  gateFindingsSchema,
  creativeBriefSchema,
  brandStrategySchema,
  informationArchitectureSchema,
  userFlowPlanSchema,
  screenPlanSchema,
  layoutPlanSchema,
  interactionPlanSchema,
  componentSystemPlanSchema,
  screenCompositionSetSchema,
  patternRankResultSchema,
} from "../lib/pastel-agent/schemas/plan-schemas";
import { intakeSystemPrompt } from "../lib/pastel-agent/prompts/intake";
import { screenCodeUserPrompt } from "../lib/pastel-agent/prompts/implement";
import { STYLE_SEEDS, selectStyleSeedDeterministic, seedPermissions, styleSeedContext } from "../lib/pastel-agent/style-seeds";

// ── Model routing: reasoner ↔ implementer split ────────────────────────────

test("reasoning/planning/verification roles route to Terra; light roles to mini; implementation to Luna", () => {
  const reasoner: Array<keyof typeof MODELS> = [
    "intake", "creativeBrief", "spec", "brandStrategy", "designSystem",
    "screenPlan", "layout", "componentSystem", "compose", "architecture",
    "designGate", "visualQA",
  ];
  // Hybrid flagship posture: light structured-transform roles default to the
  // cheapest registered mini (overridable via PASTEL_MODEL_LIGHT / per-role env).
  const light: Array<keyof typeof MODELS> = ["ia", "flows", "interactions", "patternRank"];
  const implementer: Array<keyof typeof MODELS> = ["component", "screen", "patch"];
  for (const role of reasoner) assert.equal(MODELS[role], "openai/gpt-5.6-terra", `${role} must route to Terra`);
  for (const role of light) assert.equal(MODELS[role], "mistralai/ministral-14b-2512", `${role} must route to the light mini`);
  for (const role of implementer) assert.equal(MODELS[role], "openai/gpt-5.6-luna", `${role} must route to Luna`);
  for (const legacy of ["clarify", "brief", "plan", "review", "code", "fixSimple", "planFallback", "componentPlan", "title"] as const) {
    assert.equal(legacy in MODELS, false, `legacy role "${legacy}" must not exist`);
  }
});



// ── Gateway tags ────────────────────────────────────────────────────────────

test("every Pastel Gateway request receives the configured beta tester tag", () => {
  assert.deepEqual(getPastelGatewayTags("intake", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "clarify" }]);
  assert.deepEqual(getPastelGatewayTags("creativeBrief", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "brief" }]);
  assert.deepEqual(getPastelGatewayTags("designSystem", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("ia", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("flows", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("interactions", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("brandStrategy", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("screenPlan", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("layout", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("patternRank", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "planFallback" }]);
  assert.deepEqual(getPastelGatewayTags("architecture", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "componentPlan" }]);
  assert.deepEqual(getPastelGatewayTags("componentSystem", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "componentPlan" }]);
  assert.deepEqual(getPastelGatewayTags("compose", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "componentPlan" }]);
  assert.deepEqual(getPastelGatewayTags("component", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "code" }]);
  assert.deepEqual(getPastelGatewayTags("patch", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "fixSimple" }]);
  assert.deepEqual(getPastelGatewayTags("designGate", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "planFallback" }]);
  assert.deepEqual(
    getPastelGatewayTags("designGate", { PASTEL_MERGE_GATEWAY_TAG_KEY: "team", PASTEL_MERGE_GATEWAY_TAG_DESIGN_GATE: "99" }),
    [{ key: "team", value: "99" }],
  );
  assert.deepEqual(
    getPastelGatewayTags("spec", { PASTEL_MERGE_GATEWAY_TAG_VALUE: "77" }),
    [{ key: "betatesterid", value: "77" }],
  );
});

// ── Intake + clarify contracts ──────────────────────────────────────────────

test("intake contract requires confidence scoring and understandable questions", () => {
  const valid = intakeBriefSchema.safeParse({
    titleSuggestion: "Pulse Fitness Tracking",
    productType: "saas dashboard",
    audience: "Amateur runners",
    primaryJobs: ["Log a workout"],
    contentDomains: ["workouts"],
    tone: ["confident"],
    assumptions: ["Mobile-first"],
    constraints: [],
    confidence: 0.55,
    ambiguities: [{
      id: "primary_job",
      facet: "primary job",
      impact: "material",
      confidence: 0.4,
      question: {
        title: "Primary job",
        question: "What should a runner be able to do in the first 30 seconds?",
        whyItMatters: "The first screen is composed around the primary job.",
        options: [
          { label: "Log quickly", description: "A fast-entry first screen" },
          { label: "Review progress", description: "A progress-first dashboard" },
        ],
      },
    }],
  });
  assert.equal(valid.success, true);

  const sparse = intakeBriefSchema.safeParse({ titleSuggestion: "x" });
  assert.equal(sparse.success, false);

  // clarify question schema still guards the wire contract with the client UI
  const question = clarifyQuestionSchema.safeParse({
    id: "goal",
    title: "Goal",
    question: "What is the main thing someone should do here?",
    whyItMatters: "It shapes the first screen composition.",
    options: [
      { label: "A", description: "Direction A" },
      { label: "B", description: "Direction B" },
    ],
  });
  assert.equal(question.success, true);

  const prompt = intakeSystemPrompt();
  assert.ok(prompt.includes("whyItMatters"));
  assert.ok(prompt.includes("confidence"));
  assert.ok(/NEVER ask these/i.test(prompt), "intake prompt must ban cosmetic/design-system questions");
});

// ── Structured artifact contracts ───────────────────────────────────────────

test("plan contracts reject incomplete product, architecture, and file artifacts", () => {
  assert.equal(productSpecSchema.safeParse({ title: "X" }).success, false);
  assert.equal(architecturePlanSchema.safeParse({ fileTree: [] }).success, false);
  assert.equal(
    architecturePlanSchema.safeParse({
      fileTree: ["src/screens/Home.jsx"],
      components: [{
        name: "StatStrip",
        kind: "screen",
        purpose: "A strip of stats",
        props: [{ name: "children", type: "ReactNode", default: "undefined", description: "slot" }],
        variants: [{ name: "default", description: "default" }],
        states: [],
        tokens: ["color.text"],
        usedBy: ["Home"],
      }],
      screens: [],
    }).success,
    false,
    "screen-kind contracts require ownerScreen",
  );
  assert.equal(
    generatedFilesSchema.safeParse({ files: [{ path: "src/styles.css", content: ":root{}" }] }).success,
    true,
  );
  assert.equal(
    designSystemSpecSchema.safeParse({ concept: "x", colors: {}, fonts: { display: "Arial" } }).success,
    false,
  );
  assert.equal(
    gateFindingsSchema.safeParse({ passes: true, findings: [] }).success,
    true,
  );
});

// ── 17-stage artifact contracts ─────────────────────────────────────────────

test("creative brief + brand strategy contracts reject empty artifacts", () => {
  const brief = creativeBriefSchema.safeParse({
    productSummary: "A habit tracker for runners.",
    audience: { primary: "Amateur runners", secondary: [] },
    userGoals: ["Log a run"],
    businessGoals: ["Grow weekly actives"],
    functionalRequirements: ["Users can log a run"],
    successCriteria: ["First run logged in under a minute"],
    constraints: [],
  });
  assert.equal(brief.success, true);
  assert.equal(creativeBriefSchema.safeParse({ productSummary: "x" }).success, false);

  const strategy = brandStrategySchema.safeParse({
    personality: ["Professional", "Calm", "Premium"],
    designDirection: "Precise, calm, editorial product design.",
    emotionalTone: ["Focused"],
    visualKeywords: ["whitespace", "hairlines", "ink"],
    positioning: "The calm alternative to noisy fitness apps.",
  });
  assert.equal(strategy.success, true);
  assert.equal(brandStrategySchema.safeParse({ personality: ["Professional"] }).success, false, "needs 2+ personality traits");
});

test("structural-planning contracts enforce PascalCase screen references", () => {
  const ia = informationArchitectureSchema.safeParse({
    navigation: { type: "sidebar", items: [{ label: "Dashboard", screen: "Dashboard" }] },
    groups: [],
    entryScreen: "Dashboard",
    contentPriority: [{ screen: "Dashboard", priority: ["Metrics first"] }],
  });
  assert.equal(ia.success, true);
  assert.equal(
    informationArchitectureSchema.safeParse({
      navigation: { type: "sidebar", items: [{ label: "Dashboard", screen: "dashboard" }] },
      groups: [], entryScreen: "Dashboard", contentPriority: [],
    }).success,
    false,
    "kebab/lower screen refs must be rejected",
  );

  const flows = userFlowPlanSchema.safeParse({
    flows: [{ name: "Signup", description: "First run", steps: [{ screen: "Home", action: "Arrives" }, { screen: "Dashboard", action: "Sees state" }] }],
  });
  assert.equal(flows.success, true);

  const screenPlan = screenPlanSchema.safeParse({
    screens: [{ id: "dashboard", name: "Dashboard", goal: "g", user: "u", primaryAction: "Create report", secondaryActions: [], requiredComponents: ["Navbar"], requiredContent: ["Metrics"] }],
  });
  assert.equal(screenPlan.success, true);

  const layout = layoutPlanSchema.safeParse({
    grid: { columns: 12, gapPx: 32, marginPx: 32, containerWidthPx: 1280 },
    chrome: { navigation: "sidebar", sidebarWidthPx: 240, topbarHeightPx: null },
    sectionGapPx: 72,
    verticalSectionPaddingPx: 72,
    breakpoints: { mobile: 375, tablet: 768, desktop: 1440 },
    scrollBehavior: "Sidebar fixed, content scrolls",
    screens: [{ screen: "Dashboard", structure: "Stat row then split", notes: null }],
  });
  assert.equal(layout.success, true);

  const interactions = interactionPlanSchema.safeParse({
    keyboardShortcuts: [{ keys: "cmd+k", action: "Palette" }],
    focusManagement: ["Focus rings visible"],
    screens: [{ screen: "Dashboard", loading: "Skeleton rows", empty: "Empty CTA", error: "Retry", transitions: ["Hover lift"] }],
  });
  assert.equal(interactions.success, true);
});

test("component system + composition + pattern-rank contracts", () => {
  const contract = {
    name: "Navbar", kind: "shared", ownerScreen: null, purpose: "Top nav",
    props: [{ name: "children", type: "ReactNode", default: "undefined", description: "slot" }],
    variants: [{ name: "default", description: "d" }], states: ["hover"], tokens: ["color.text"], usedBy: ["Home"],
  };
  assert.equal(componentSystemPlanSchema.safeParse({ components: [contract] }).success, true);
  assert.equal(componentSystemPlanSchema.safeParse({ components: [] }).success, false);

  const composition = {
    screens: [{
      name: "Home",
      sections: [{ name: "Hero", pattern: "Split Hero", components: ["Navbar"], copy: ["Real copy"] }],
      responsive: { tablet: "t", mobile: "m" },
    }],
  };
  assert.equal(screenCompositionSetSchema.safeParse(composition).success, true);

  const ranked = patternRankResultSchema.safeParse({ assignments: [{ screen: "Home", patterns: ["Split Hero", "Bento Grid"] }] });
  assert.equal(ranked.success, true);
  assert.equal(patternRankResultSchema.safeParse({ assignments: [{ screen: "Home", patterns: [] }] }).success, false);
});

test("component system normalization enforces the flagship inventory cap", async () => {
  const { MAX_COMPONENT_CONTRACTS, fallbackComponentSystem } = await import("../lib/pastel-agent/stages/component-system");
  assert.ok(MAX_COMPONENT_CONTRACTS <= 12, "cap must be 12 or fewer");
  const screenPlan = {
    screens: ["One", "Two", "Three"].map((n, i) => ({
      id: n.toLowerCase(), name: n, goal: "g", user: "u", primaryAction: "a",
      secondaryActions: [], requiredComponents: Array.from({ length: 9 }, (_, k) => `Comp${k}${i}`), requiredContent: ["x"],
    })),
  };
  const specScreens = [
    { name: "One", components: ["Navbar", "Card"] },
    { name: "Two", components: ["Navbar", "Card"] },
    { name: "Three", components: ["Navbar"] },
  ];
  const fallback = fallbackComponentSystem(screenPlan as never, specScreens as never);
  assert.ok(fallback.components.length <= MAX_COMPONENT_CONTRACTS, `fallback system must respect the cap, got ${fallback.components.length}`);
});

test("fallback composition copy never leaks planner prose", async () => {
  const { copyCleanser } = await import("../lib/pastel-agent/stages/screen-composition");
  assert.equal(copyCleanser("Let users inspect current streaks and past completion patterns."), "Inspect current streaks and past completion patterns.");
  assert.equal(copyCleanser("Allow users to create habits."), "Create habits.");
  assert.equal(copyCleanser("Users can review their week."), "Review their week.");
  assert.equal(copyCleanser("Show today’s date."), "Show today’s date.");
});

test("static pattern fallback always assigns patterns per screen", async () => {
  const { staticPatternContext } = await import("../lib/pastel-agent/stages/pattern-retrieval");
  const context = staticPatternContext(["Home", "Dashboard", "Settings"]);
  assert.equal(context.provider, "static");
  assert.equal(context.assignments.length, 3);
  for (const assignment of context.assignments) {
    assert.ok(assignment.patterns.length >= 1, `${assignment.screen} must receive patterns`);
    for (const pattern of assignment.patterns) {
      assert.ok(context.patterns.some((p) => p.name === pattern), `pattern ${pattern} must come from the retrieved set`);
    }
  }
});

// ── Screen implementation prompt contract ───────────────────────────────────

test("screen coding prompt references authoritative import contracts and exact paths", () => {
  const prompt = screenCodeUserPrompt(
    "Home",
    JSON.stringify({ name: "Home", sections: [] }),
    'Button: import Button from "../components/Button.jsx" (canonical path: src/components/Button.jsx) — props [label: string], variants [default]. Primary action button.',
    "DESIGN TOKENS (CSS custom properties, already defined in src/styles.css)",
    "SANDBOX CONTRACT",
    "STYLE SEED\nName: swiss",
  );
  assert.match(prompt, /authoritative/);
  assert.match(prompt, /src\/components\/Button\.jsx/);
  assert.match(prompt, /imported from its exact/);
  assert.match(prompt, /src\/screens\/Home\.jsx/);
});

// ── Style seeds ─────────────────────────────────────────────────────────────

test("every style seed emits explicit permission and quality guardrails", () => {
  for (const seed of STYLE_SEEDS) {
    const context = styleSeedContext(seed);
    assert.match(context, new RegExp(`Name: ${seed.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.match(context, /Permission guardrails/);
    assert.match(context, /no muddy brown palettes/);
  }
});

test("style seed selection is deterministic per key and permissions match the context", () => {
  const a = selectStyleSeedDeterministic("project-123");
  const b = selectStyleSeedDeterministic("project-123");
  assert.equal(a.name, b.name);
  const perms = seedPermissions(a.name);
  const context = styleSeedContext(a);
  assert.match(context, perms.shadows ? /shadows allowed sparingly/ : /shadows not allowed/);
  assert.match(context, perms.gradients ? /gradients allowed sparingly/ : /gradients not allowed/);
});

// ── Gateway truncation + JSON repair ────────────────────────────────────────

test("truncated gateway responses are detected across finish reason variants", () => {
  assert.equal(isTruncated({ output: [{ finish_reason: "max_tokens" }] }), true);
  assert.equal(isTruncated({ output: [{ finish_reason: "length" }] }), true);
  assert.equal(isTruncated({ output: [{ finish_reason: "incomplete" }] }), true);
  assert.equal(isTruncated({ output: [{ finish_reason: "stop" }] }), false);
  assert.equal(isTruncated({ output: [{ finish_reason: "stop" }], incomplete_details: { reason: "max_output_tokens" } }), true);
});

test("parseAndValidate repairs truncated JSON and reports validation failures distinctly", () => {
  const truncated = parseAndValidate<{ items: string[] }>('{"items": ["a", "b", "c"');
  assert.ok("value" in truncated);

  const valid = parseAndValidate('{"a": 1}');
  assert.ok("value" in valid);

  const failing = parseAndValidate('{"a": 1}', () => { throw new Error("missing b"); });
  assert.ok("error" in failing && failing.kind === "validate");

  const garbage = parseAndValidate("not json at all");
  assert.ok("error" in garbage && garbage.kind === "parse");

  const nested = parseAndValidate<{ name: string; anatomy: unknown[] }>(
    '{"name": "UtilityHeader", "purpose": "…", "anatomy": [ {"part": "root"',
  );
  assert.ok("value" in nested);
  assert.equal(nested.value.name, "UtilityHeader");
  assert.equal(nested.value.anatomy.length, 1);
});

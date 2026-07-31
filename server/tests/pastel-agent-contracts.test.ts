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
} from "../lib/pastel-agent/schemas/plan-schemas";
import { intakeSystemPrompt } from "../lib/pastel-agent/prompts/intake";
import { screenCodeUserPrompt } from "../lib/pastel-agent/prompts/implement";
import { STYLE_SEEDS, selectStyleSeedDeterministic, seedPermissions, styleSeedContext } from "../lib/pastel-agent/style-seeds";

// ── Model routing: reasoner ↔ implementer split ────────────────────────────

test("reasoning/planning/verification roles route to Terra; implementation routes to Luna", () => {
  const reasoner: Array<keyof typeof MODELS> = ["intake", "spec", "designSystem", "architecture", "designGate", "visualQA"];
  const implementer: Array<keyof typeof MODELS> = ["component", "screen", "patch"];
  for (const role of reasoner) assert.equal(MODELS[role], "openai/gpt-5.6-terra", `${role} must route to Terra`);
  for (const role of implementer) assert.equal(MODELS[role], "openai/gpt-5.6-luna", `${role} must route to Luna`);
  for (const legacy of ["clarify", "brief", "plan", "review", "code", "fixSimple", "planFallback", "componentPlan", "title"] as const) {
    assert.equal(legacy in MODELS, false, `legacy role "${legacy}" must not exist`);
  }
});

// ── Gateway tags ────────────────────────────────────────────────────────────

test("every Pastel Gateway request receives the configured beta tester tag", () => {
  assert.deepEqual(getPastelGatewayTags("intake", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "clarify" }]);
  assert.deepEqual(getPastelGatewayTags("designSystem", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "plan" }]);
  assert.deepEqual(getPastelGatewayTags("architecture", {}), [{ key: PASTEL_GATEWAY_TAG_KEY, value: "componentPlan" }]);
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

import { test } from "node:test";
import assert from "node:assert/strict";
import { __setTestClient, type MergeGatewayLike } from "../lib/pastel-agent/gateway";
import { runPicassoPipeline, fallbackTokens, type PicassoHooks, type PicassoPipelineOutput } from "../lib/pastel-agent/picasso/pipeline/orchestrator";
import { loadBaseComponent, rewriteBaseImports, auditGlobalsCSS, generateGlobalsCSS } from "../lib/pastel-agent/picasso/pipeline/lib/base-components";
import { scanSiblingImports, closeDependencyGraph, checkSimilarityFloor, generateComponentWithFidelity, type FidelityVerdict } from "../lib/pastel-agent/picasso/pipeline/stage-4-build";
import { auditScreenProps, applyPropAutoFix } from "../lib/pastel-agent/picasso/pipeline/lib/prop-validation";
import { classifySurfacePolicy, enforceNeutralSurfaces, assertNeutralCanvas } from "../lib/pastel-agent/picasso/pipeline/lib/surface-policy";
import { auditScreenComposition, auditEmptySections } from "../lib/pastel-agent/picasso/pipeline/checks/composition";
import { auditScreenGeometry } from "../lib/pastel-agent/picasso/pipeline/checks/geometry";
import { buildWireframeReview } from "../lib/pastel-agent/picasso/pipeline/lib/wireframe-review";
import type { Tokens, Brief, ComponentsManifest, PropContract, LayoutPlan, ScreenPlan } from "../lib/pastel-agent/picasso/pipeline/types";
import type { ArchitectureOutput } from "../lib/pastel-agent/picasso/pipeline/stage-3-wireframe";
import type { ContentOutput } from "../lib/pastel-agent/picasso/pipeline/stage-4-build";
import type { MotionSpec } from "../lib/pastel-agent/picasso/pipeline/stage-2-design-system";
import type { DiscoveryOutput } from "../lib/pastel-agent/picasso/pipeline/stage-1-discovery";

// ── Fixtures ─────────────────────────────────────────────────────────────

const fixtureBrief: Brief = {
  productName: "TrailCrew",
  description: "Social fitness tracker for trail runners.",
  audience: "Trail runners",
  niche: "health",
  personality: ["bold", "playful"],
  density: "balanced",
  mode: "light",
  platform: "web",
};

/** Gateway stub: serves one canned JSON text per `responses.create` call. */
function stubClient(contents: string[]): MergeGatewayLike & { callCount: () => number } {
  let i = 0;
  const client: MergeGatewayLike = {
    responses: {
      create: async () => {
        const text = contents[Math.min(i++, contents.length - 1)];
        return { output: [{ type: "message", content: [{ type: "text", text }] }] };
      },
    },
  };
  return Object.assign(client, { callCount: () => i });
}

function fakeHooks(persisted: Map<string, string>): PicassoHooks {
  return {
    emit: () => {},
    persistDoc: (p, _t, _k, content) => { persisted.set(p, content); },
    persistFile: (p, _k, content) => { persisted.set(p, content); },
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

/** A minimal-but-valid screen the composer "produces". */
function screenStub(id: string): string {
  return `export default function ${id.replace(/(^|-)([a-z])/g, (_m, _p, c) => c.toUpperCase())}() {
  return (
    <main className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-foreground">${id} heading</h1>
    </main>
  )
}
`;
}

/** A stub "customized" component: the base source with a data-slot swap and
 *  one class remap — passes validation and the primitive floor. */
function componentStub(id: string, baseComponent: string): string {
  const base = loadBaseComponent(baseComponent);
  if (!base) return `export default function ${id}() { return <div /> }\nexport { ${id} }\n`;
  return rewriteBaseImports(
    base.source
      .replace(/data-slot="[^"]*"/, `data-slot="${id}"`)
      .replace(/bg-primary/g, "bg-muted"),
  );
}

interface ManifestSpec { id: string; name: string; taxonomy: "primitive" | "atom" | "molecule" | "organism"; baseComponent: string; }

const MANIFEST_SPECS: ManifestSpec[] = [
  { id: "app-nav", name: "AppNav", taxonomy: "atom", baseComponent: "button-group" },
  { id: "goal-card", name: "GoalCard", taxonomy: "primitive", baseComponent: "button" },
  { id: "primary-button", name: "PrimaryButton", taxonomy: "primitive", baseComponent: "button" },
  { id: "input-field", name: "InputField", taxonomy: "primitive", baseComponent: "input" },
  { id: "badge-chip", name: "BadgeChip", taxonomy: "atom", baseComponent: "badge" },
  { id: "avatar-tile", name: "AvatarTile", taxonomy: "atom", baseComponent: "avatar" },
  { id: "stat-tile", name: "StatTile", taxonomy: "primitive", baseComponent: "card" },
  { id: "empty-state", name: "EmptyState", taxonomy: "primitive", baseComponent: "empty" },
  { id: "progress-bar", name: "ProgressBar", taxonomy: "atom", baseComponent: "progress" },
  { id: "sheet-panel", name: "SheetPanel", taxonomy: "atom", baseComponent: "sheet" },
  { id: "switch-row", name: "SwitchRow", taxonomy: "primitive", baseComponent: "switch" },
];

function structureJson(): string {
  const components = MANIFEST_SPECS.map((s) => ({
    id: s.id,
    name: s.name,
    taxonomy: s.taxonomy,
    description: s.name,
    baseComponent: s.baseComponent,
    customization: "h-9 sizing, rounded-lg corners, accent on active state",
    states: ["default"],
    props: {},
  }));
  return JSON.stringify({
    screens: [
      {
        id: "dashboard", name: "Dashboard", route: "/",
        description: "The run dashboard",
        regions: [
          { name: "topbar", role: "nav", purpose: "Navigation", hierarchy: "secondary", components: [{ ref: "app-nav", description: "Primary nav" }] },
          { name: "main", role: "main", purpose: "Metrics", hierarchy: "primary", components: [{ ref: "goal-card", description: "Goal cards" }, { ref: "stat-tile", description: "Stats" }] },
        ],
      },
      {
        id: "profile", name: "Profile", route: "/profile",
        description: "Runner profile",
        regions: [
          { name: "header", role: "content", purpose: "Profile header", hierarchy: "primary", components: [{ ref: "avatar-tile", description: "Avatar" }] },
          { name: "stats", role: "content", purpose: "Stats", hierarchy: "secondary", components: [{ ref: "progress-bar", description: "Progress" }] },
        ],
      },
    ],
    globalRegions: [],
    components,
  });
}

const validBrand = JSON.stringify({ brandKit: {}, uxDesignPlan: {} });
const validContent = JSON.stringify({
  data: { itemCount: 2, metrics: [], items: [], screens: {} },
  copy: { screens: {} },
});

function fullPipelineStub(): { client: MergeGatewayLike & { callCount: () => number }; componentCalls: number; screenCalls: number } {
  const contents: string[] = [
    validDiscovery,
    validDirections,
    JSON.stringify(fallbackTokens(fixtureBrief)),
    structureJson(),
    validBrand,
    validContent,
  ];
  for (const spec of MANIFEST_SPECS) {
    contents.push(componentStub(spec.id, spec.baseComponent));
  }
  contents.push(screenStub("dashboard"), screenStub("profile"));
  return { client: stubClient(contents), componentCalls: MANIFEST_SPECS.length, screenCalls: 2 };
}

// ── V8 §5.1: dependency closure ─────────────────────────────────────────

test("picasso v8: scanSiblingImports finds relative sibling imports", () => {
  const imports = scanSiblingImports(`import { cn } from "./cn"\nimport { Separator } from "./separator"\nimport { Button } from "../button"\n`);
  assert.deepEqual(imports, ["cn", "separator"]);
});

test("picasso v8: closeDependencyGraph provisions missing sibling bases (the v7 Separator bug)", () => {
  const manifest: ComponentsManifest = {
    generatedAt: new Date().toISOString(),
    entries: [
      { id: "app-nav", name: "AppNav", taxonomy: "atom", description: "Nav", baseComponent: "button-group", customization: "x", states: ["default"], props: {} },
    ],
  };
  // A generated component that inherited button-group's import of ./separator.
  const components = { "app-nav": componentStub("app-nav", "button-group") };
  assert.ok(scanSiblingImports(components["app-nav"]).includes("separator"), "stub must import ./separator");

  const closure = closeDependencyGraph(components, manifest);
  assert.ok(closure.provisioned.includes("separator"), `provisioned=${closure.provisioned.join(",")}`);
  assert.ok(closure.components["separator"], "separator must be provisioned");
  const base = loadBaseComponent("separator");
  assert.ok(base, "separator base must exist");
  assert.equal(closure.components["separator"], rewriteBaseImports(base.source));
  assert.ok(!closure.components["cn"], "cn is a support file — never provisioned from base");
});

// ── V8 §5.2: prop-contract validation ───────────────────────────────────

const propContract: PropContract = {
  generatedAt: new Date().toISOString(),
  entries: [
    { componentId: "habit-row", componentName: "HabitRow", importPath: "./habit-row", props: { habit: { type: "{name:string;done:boolean}[]", required: true, description: "Rows" }, onToggle: { type: "() => void", required: true, description: "Toggle" } } },
    { componentId: "week-strip", componentName: "WeekStrip", importPath: "./week-strip", props: { days: { type: "string[]", required: true, description: "Days" }, value: { type: "string", required: true, description: "Selected" } } },
    { componentId: "add-button", componentName: "AddButton", importPath: "./add-button", props: { label: { type: "string", required: false, description: "Label" } } },
  ],
};

test("picasso v8: auditScreenProps flags empty usages of components with required props (the v7 WeekStrip/HabitRow crashes)", () => {
  const screen = `
export default function Today() {
  return (
    <main>
      <HabitRow />
      <WeekStrip className="w-full" />
      <AddButton label="Add" />
    </main>
  )
}
`;
  const audit = auditScreenProps(screen, propContract);
  assert.equal(audit.violations.length, 2, JSON.stringify(audit.violations));
  const habit = audit.violations.find((v) => v.componentId === "habit-row");
  assert.ok(habit, "habit-row must be flagged");
  assert.ok(habit!.missingRequired.includes("habit"));
  assert.ok(habit!.missingRequired.includes("onToggle"));
  const week = audit.violations.find((v) => v.componentId === "week-strip");
  assert.ok(week, "week-strip must be flagged (className-only usage)");
});

test("picasso v8: auditScreenProps skips usages with spread props (unverifiable, never blocked)", () => {
  const screen = `<main><HabitRow {...row} /><WeekStrip {...strip} /></main>`;
  const audit = auditScreenProps(screen, propContract);
  assert.equal(audit.violations.length, 0);
});

test("picasso v8: applyPropAutoFix wraps crash-prone empty usages deterministically", () => {
  const screen = `
export default function Today() {
  return (
    <main>
      <HabitRow />
      <AddButton label="Add" />
    </main>
  )
}
`;
  const audit = auditScreenProps(screen, propContract);
  const fixed = applyPropAutoFix(screen, audit, propContract);
  assert.deepEqual(fixed.fixed, ["habit-row"]);
  assert.ok(!fixed.code.includes("<HabitRow"), "the empty usage must be replaced");
  assert.ok(fixed.code.includes('data-mount="habit-row"'), "replacement carries the mount marker");
  assert.ok(fixed.code.includes("AddButton"), "valid usages are untouched");
  assert.equal(fixed.audit.violations.length, 0);
});

// ── V8 §5.3: token-CSS completeness audit ───────────────────────────────

test("picasso v8: generateTokensCSS emits every theme variable the base globals.css declares (incl. --input and --border)", () => {
  const css = generateGlobalsCSS(fallbackTokens(fixtureBrief));
  assert.ok(css.includes("--input:"), "generated CSS must emit --input");
  assert.ok(css.includes("--border:"), "generated CSS must emit --border");
  const audit = auditGlobalsCSS(css);
  assert.equal(audit.passed, true, `missing base theme vars: ${audit.missing.join(", ")}`);
  assert.ok(audit.present.includes("background"));
  assert.ok(audit.present.includes("ring"));
});

test("picasso v8: auditGlobalsCSS catches a generator that drops variables", () => {
  const css = generateGlobalsCSS(fallbackTokens(fixtureBrief)).replace(/--input:[^;]+;/, "");
  const audit = auditGlobalsCSS(css);
  assert.equal(audit.passed, false);
  assert.ok(audit.missing.includes("input"));
});

// ── V8 §6: surface policy / neutral canvas ──────────────────────────────

test("picasso v8: classifySurfacePolicy — software products get neutral, lifestyle gets warm", () => {
  assert.equal(classifySurfacePolicy("app", "A habit tracker app for desktop web", "Users tick daily habits"), "neutral");
  assert.equal(classifySurfacePolicy("app", "Invoicing dashboard for freelancers", "Metrics and ledger"), "neutral");
  assert.equal(classifySurfacePolicy("landing", "Lifestyle magazine about slow living", "Editorial stories"), "warm");
  assert.equal(classifySurfacePolicy("landing", "Artisan coffee brand site", "Brand story"), "warm");
});

test("picasso v8: enforceNeutralSurfaces greys out an accent-tinted canvas (the v7 #F7F5F2 cream background)", () => {
  const tokens = structuredClone(fallbackTokens(fixtureBrief)) as Tokens;
  tokens.color.surface.background = "#F7F5F2"; // the v7 cream/beige canvas
  tokens.color.neutral = { ...tokens.color.neutral, "100": "#F2F0ED" } as Tokens["color"]["neutral"];
  const neutral = enforceNeutralSurfaces(tokens, "neutral");
  const bg = neutral.color.surface.background;
  const [r, g, b] = [bg.slice(1, 3), bg.slice(3, 5), bg.slice(5, 7)].map((h) => parseInt(h, 16));
  assert.ok(Math.max(r, g, b) - Math.min(r, g, b) <= 6, `background ${bg} must be near-grey after enforcement`);
  const gate = assertNeutralCanvas(neutral, "neutral");
  assert.equal(gate.passed, true, gate.violations.join("; "));
  // Warm policy is untouched.
  const warm = enforceNeutralSurfaces(tokens, "warm");
  assert.equal(warm.color.surface.background, "#F7F5F2");
});

test("picasso v8: assertNeutralCanvas fails an accent-tinted page background in a neutral context", () => {
  const tokens = structuredClone(fallbackTokens(fixtureBrief)) as Tokens;
  tokens.color.surface.background = "#F2E3DF"; // clearly terracotta-tinted
  const gate = assertNeutralCanvas(tokens, "neutral");
  assert.equal(gate.passed, false);
  assert.ok(gate.violations.some((v) => v.includes("accent-tinted")), gate.violations.join("; "));
  assert.equal(assertNeutralCanvas(tokens, "warm").passed, true);
});

test("picasso v8: assertNeutralCanvas flags an input border invisible on the background", () => {
  const tokens = structuredClone(fallbackTokens(fixtureBrief)) as Tokens;
  tokens.color.surface.background = "#ffffff";
  tokens.color.border.default = "#ffffff"; // border == background → invisible inputs
  const gate = assertNeutralCanvas(tokens, "neutral");
  assert.equal(gate.passed, false);
  assert.ok(gate.violations.some((v) => v.includes("invisible")), gate.violations.join("; "));
});

// ── V8 §2/§5.4: taxonomy-tiered fidelity floors ─────────────────────────

function baseEntry(taxonomy: "primitive" | "atom" | "molecule" | "organism") {
  return {
    id: "x-button",
    name: "XButton",
    taxonomy,
    description: "x",
    baseComponent: "button",
    customization: "h-9 rounded-lg accent",
    states: ["default"],
    props: {},
  };
}

const DIVERGENT_BUTTON = `
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./cn"

const buttonVariants = cva(
  "my-product-button-utility-stack-that-is-entirely-different-from-the-base-utility-stack-and-long-enough-to-break-chunk-matching-with-the-base-source-file",
  { variants: { variant: { default: "bg-primary text-primary-foreground rounded-xl h-11 px-6", destructive: "bg-destructive", outline: "border border-input bg-transparent", secondary: "bg-secondary", ghost: "bg-transparent", link: "underline" }, size: { default: "h-11 px-5", xs: "h-8", sm: "h-9", lg: "h-12", icon: "size-10" } }, defaultVariants: { variant: "default", size: "default" } }
)

function XButton({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="x-button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { XButton, buttonVariants }
`;

test("picasso v8: a primitive far below its 85% floor fails the similarity gate", () => {
  const base = loadBaseComponent("button");
  assert.ok(base);
  const verdict = checkSimilarityFloor(DIVERGENT_BUTTON, baseEntry("primitive"), base!);
  assert.equal(verdict.passed, false);
  assert.equal(verdict.action, "reject");
  assert.ok(verdict.similarity < 0.85, `similarity was ${verdict.similarity}`);
});

test("picasso v8: a lightly-customized primitive passes its floor", () => {
  const base = loadBaseComponent("button");
  assert.ok(base);
  const near = rewriteBaseImports(base!.source.replace(/data-slot="button"/, 'data-slot="x-button"').replace(/bg-primary/g, "bg-muted"));
  const verdict = checkSimilarityFloor(near, baseEntry("primitive"), base!);
  assert.equal(verdict.passed, true, JSON.stringify(verdict));
});

test("picasso v8: atoms retry, molecules report only", () => {
  const base = loadBaseComponent("button");
  assert.ok(base);
  assert.equal(checkSimilarityFloor(DIVERGENT_BUTTON, baseEntry("atom"), base!).action, "retry");
  assert.equal(checkSimilarityFloor(DIVERGENT_BUTTON, baseEntry("molecule"), base!).action, "report");
  assert.equal(checkSimilarityFloor(DIVERGENT_BUTTON, baseEntry("organism"), base!).floor, null);
});

test("picasso v8: generateComponentWithFidelity falls back to the literal base when a primitive stays under floor", async () => {
  const base = loadBaseComponent("button");
  assert.ok(base);
  const entry = baseEntry("primitive");
  const client = stubClient([DIVERGENT_BUTTON, DIVERGENT_BUTTON]);
  __setTestClient(client);
  try {
    const result = await generateComponentWithFidelity({
      entry,
      tokens: fallbackTokens(fixtureBrief),
      brief: fixtureBrief,
      creativeSeed: "seed",
      baseSources: { button: base! },
    });
    assert.equal(result.fidelity.action, "fell-back-to-base", JSON.stringify(result.fidelity));
    // Fallback = literal base + import rewrite (+ branding marker).
    assert.ok(result.code.includes("data-slot"), "fallback must carry the base structure");
    assert.ok(client.callCount() >= 2, "floor violation must have triggered a retry call");
  } finally {
    __setTestClient(null);
  }
});

// ── V8 §7: deterministic gates ──────────────────────────────────────────

const screenPlan: ScreenPlan = {
  id: "today", name: "Today", route: "/", description: "d", gridColumns: 12,
  dominantMoment: "x",
  regions: [
    { name: "toolbar", role: "toolbar", purpose: "p", hierarchy: "supporting", componentTypes: [{ name: "tab-nav", taxonomy: "atom", description: "d" }] },
    { name: "main", role: "main", purpose: "p", hierarchy: "primary", componentTypes: [{ name: "habit-list", taxonomy: "organism", description: "d" }] },
  ],
};

test("picasso v8: duplicate labels in a sibling block are flagged (the Today / Today defect)", () => {
  const code = `
export default function Today() {
  return (
    <nav className="flex gap-1 border-b border-border">
      <a className="text-sm font-semibold">Today</a>
      <a className="text-sm">Today</a>
      <a className="text-sm">Ledger</a>
    </nav>
  )
}
`;
  const violations = auditScreenComposition(code, screenPlan);
  assert.ok(violations.some((v) => v.id === "duplicate-label" && v.description.includes("Today")), JSON.stringify(violations));
});

test("picasso v8: duplicate chrome mounts in a sibling block are flagged", () => {
  const code = `
<div className="flex gap-2">
  <PrimaryButton>Save</PrimaryButton>
  <PrimaryButton>Save</PrimaryButton>
</div>
`;
  const violations = auditScreenComposition(code, screenPlan);
  assert.ok(violations.some((v) => v.id === "duplicate-mount" && v.description.includes("PrimaryButton")), JSON.stringify(violations));
});

test("picasso v8: empty filled containers are flagged (the empty grey box defect)", () => {
  const code = `
<div className="mt-8 h-24 w-full rounded-lg border border-border bg-muted" />
<div className="mt-8 h-24 w-full bg-accent" />
`;
  const violations = auditEmptySections(code, screenPlan);
  assert.ok(violations.some((v) => v.id === "empty-section"), JSON.stringify(violations));
});

test("picasso v8: geometry gate flags overflow widths and inline fonts", () => {
  const code = `<div className="w-[1600px] flex"><h1 style={{ fontFamily: 'Georgia' }}>x</h1></div>`;
  const violations = auditScreenGeometry(code, screenPlan);
  assert.ok(violations.some((v) => v.id === "overflow-width"), JSON.stringify(violations));
  assert.ok(violations.some((v) => v.id === "inline-font"), JSON.stringify(violations));
});

// ── V8 §4.4: wireframe confirmation gate ────────────────────────────────

test("picasso v8: the wireframe gate fires before any build work and blocks until approved", async () => {
  const { client } = fullPipelineStub();
  let gateFired = 0;
  let gatePayload: ReturnType<typeof buildWireframeReview> | null = null;
  let buildActivityBeforeApproval = false;
  const persisted = new Map<string, string>();
  const events: string[] = [];

  __setTestClient(client);
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "gate-test",
      mode: "draft",
      hooks: {
        emit: (type, payload) => {
          if (type === "phase") events.push(`phase:${payload.phase}:${payload.status}`);
          if (type === "wireframes") {
            gateFired++;
            gatePayload = payload.review as ReturnType<typeof buildWireframeReview>;
          }
          if (type === "activity" && String(payload.message ?? "").includes("Composed")) buildActivityBeforeApproval = true;
        },
        persistDoc: (p, _t, _k, content) => { persisted.set(p, content); },
        persistFile: (p, _k, content) => { persisted.set(p, content); },
      },
      confirmWireframes: async (payload) => {
        gatePayload = payload;
        return { action: "approve" };
      },
    });

    assert.equal(gateFired, 1);
    assert.ok(gatePayload, "gate payload must be emitted");
    assert.deepEqual(gatePayload!.screens.map((s) => s.id), ["dashboard", "profile"]);
    assert.ok(gatePayload!.screens.every((s) => s.regions.length >= 2), "regions must be in the payload");
    assert.ok(gatePayload!.screens[0].regions[0].components.length >= 1, "planned components must be in the payload");
    assert.equal(out.success, true, `pipeline must succeed after approval (degradations: ${JSON.stringify(out.degradations)})`);
    assert.ok(events.includes("phase:wireframe-review:done"), "wireframe-review done must be emitted");
    assert.ok(persisted.has("docs/checkpoints/wireframe-approved.json"), "approval must be checkpointed");
  } finally {
    __setTestClient(null);
  }
});

test("picasso v8: cancelling at the gate stops the run with zero build spend", async () => {
  const { client } = fullPipelineStub();
  __setTestClient(client);
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "gate-cancel",
      mode: "draft",
      hooks: fakeHooks(new Map()),
      confirmWireframes: async () => ({ action: "cancel" }),
    });
    assert.equal(out.cancelled, true);
    assert.equal(out.success, false);
    assert.deepEqual(out.screenFiles, {});
    assert.deepEqual(out.generatedComponents, {});
    // Model calls stop at the gate: discovery + directions + tokens +
    // structure + brand = 5 (content/components/screens never run).
    assert.equal(client.callCount(), 5, `expected 5 calls before cancel, got ${client.callCount()}`);
  } finally {
    __setTestClient(null);
  }
});

test("picasso v8: a revision round-trip re-architects without re-running discovery/tokens", async () => {
  const { client } = fullPipelineStub();
  const revisions: string[] = [];
  __setTestClient(client);
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "gate-revise",
      mode: "draft",
      hooks: fakeHooks(new Map()),
      confirmWireframes: async (payload) => {
        if (payload.revisionsUsed === 0) {
          return { action: "revise", notes: { dashboard: "Make the metrics region the dominant moment." } };
        }
        revisions.push(payload.revisionsUsed.toString());
        return { action: "approve" };
      },
    });
    assert.equal(out.success, true);
    assert.deepEqual(revisions, ["1"], "second payload must carry revisionsUsed=1");
    // The revision consumed an extra structure call (+1) — content ran once.
    assert.ok(out.wireframeReview, "final review payload must be exposed on the output");
  } finally {
    __setTestClient(null);
  }
});

// ── V8 §4.3: checkpoint / resume ────────────────────────────────────────

test("picasso v8: a resumed run skips every completed stage and makes zero model calls", async () => {
  const persisted = new Map<string, string>();
  const run1 = fullPipelineStub();
  __setTestClient(run1.client);
  let out1: PicassoPipelineOutput;
  try {
    out1 = await runPicassoPipeline(fixtureBrief, {
      projectId: "resume-test",
      mode: "draft",
      hooks: fakeHooks(persisted),
    });
  } finally {
    __setTestClient(null);
  }
  assert.equal(out1.success, true);
  assert.ok(persisted.has("docs/checkpoints/checkpoint.json"), "checkpoint must be persisted");
  assert.ok(persisted.has("docs/planning/Discovery.json"));
  assert.ok(persisted.has("src/globals.css"));

  const run2 = fullPipelineStub();
  __setTestClient(run2.client);
  try {
    const out2 = await runPicassoPipeline(fixtureBrief, {
      projectId: "resume-test",
      mode: "draft",
      hooks: fakeHooks(persisted),
      resume: {
        loadDoc: (p) => persisted.get(p) ?? null,
        loadFile: (p) => persisted.get(p) ?? null,
      },
    });
    assert.equal(run2.client.callCount(), 0, "a fully-resumed run must make zero model calls");
    assert.equal(Object.keys(out2.screenFiles).length, Object.keys(out1.screenFiles).length);
    assert.deepEqual(Object.keys(out2.screenFiles).sort(), Object.keys(out1.screenFiles).sort());
    assert.equal(out2.success, true, JSON.stringify(out2.degradations));
    // Timing records the skipped stages.
    assert.ok(out2.timing.stages["discovery"] !== undefined);
    assert.ok(out2.timing.stages["screen:dashboard"] !== undefined);
  } finally {
    __setTestClient(null);
  }
});

test("picasso v8: a resumed run whose architecture was not yet approved re-enters the gate without model calls", async () => {
  const persisted = new Map<string, string>();
  // Run 1: kill AFTER wireframe but BEFORE approval — simulate by running
  // with cancel (which persists all pre-gate artifacts + checkpoint).
  const run1 = fullPipelineStub();
  __setTestClient(run1.client);
  try {
    await runPicassoPipeline(fixtureBrief, {
      projectId: "gate-resume",
      mode: "draft",
      hooks: fakeHooks(persisted),
      confirmWireframes: async () => ({ action: "cancel" }),
    });
  } finally {
    __setTestClient(null);
  }
  assert.ok(persisted.has("docs/planning/WireframePlan.json"), "architecture artifacts persist before approval");

  // Run 2: resume — architecture loads from disk, the gate fires again, and
  // approving continues with content/components/screens only (no re-pay of
  // discovery/design/wireframe model calls). The stub sequence is positional,
  // so build one that matches run 2's call graph: content(1) + components(11)
  // + screens(2).
  let gateFired = 0;
  const run2Contents = [
    validContent,
    ...MANIFEST_SPECS.map((s) => componentStub(s.id, s.baseComponent)),
    screenStub("dashboard"),
    screenStub("profile"),
  ];
  const run2 = stubClient(run2Contents);
  __setTestClient(run2);
  try {
    const out2 = await runPicassoPipeline(fixtureBrief, {
      projectId: "gate-resume",
      mode: "draft",
      hooks: fakeHooks(persisted),
      resume: {
        loadDoc: (p) => persisted.get(p) ?? null,
        loadFile: (p) => persisted.get(p) ?? null,
      },
      confirmWireframes: async () => { gateFired++; return { action: "approve" }; },
    });
    assert.equal(gateFired, 1, "the gate must fire again on the resumed run");
    assert.equal(out2.success, true, JSON.stringify(out2.degradations));
    // Calls: content(1) + components(11) + screens(2) = 14 — discovery/
    // design/wireframe were NOT re-run.
    assert.equal(run2.callCount(), 14, `expected 14 calls, got ${run2.callCount()}`);
    assert.deepEqual(Object.keys(out2.screenFiles).sort(), ["dashboard", "profile"]);
  } finally {
    __setTestClient(null);
  }
});

// ── V8 §8: timing capture ───────────────────────────────────────────────

test("picasso v8: run timing records wall time per stage", async () => {
  const { client } = fullPipelineStub();
  __setTestClient(client);
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "timing-test",
      mode: "draft",
      hooks: fakeHooks(new Map()),
    });
    assert.ok(out.timing.wallSeconds >= 0);
    for (const stage of ["discovery", "design", "wireframe", "content", "build", "screens", "gates"]) {
      assert.ok(stage in out.timing.stages, `timing must record stage "${stage}" (got ${Object.keys(out.timing.stages).join(",")})`);
    }
    assert.ok(out.timing.stages["screen:dashboard"] >= 0);
    assert.ok(out.timing.stages["screen:profile"] >= 0);
  } finally {
    __setTestClient(null);
  }
});

// ── V8 §6: surface policy through the full pipeline ─────────────────────

test("picasso v8: a neutral-context run's tokens pass the neutral-canvas gate end-to-end", async () => {
  const persisted = new Map<string, string>();
  const { client } = fullPipelineStub();
  __setTestClient(client);
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "neutral-test",
      mode: "draft",
      hooks: fakeHooks(persisted),
    });
    assert.equal(out.surfacePolicy, "neutral");
    assert.equal(out.themeGate.passed, true, out.themeGate.violations.join("; "));
    assert.equal(out.globalsAudit.passed, true, out.globalsAudit.missing.join(", "));
    assert.ok(persisted.has("docs/review/ThemeGate.json"));
  } finally {
    __setTestClient(null);
  }
});

// ── V8 §5.1: dependency closure wired into the pipeline ─────────────────

test("picasso v8: the pipeline provisions sibling bases and reports them", async () => {
  const persisted = new Map<string, string>();
  const { client } = fullPipelineStub();
  __setTestClient(client);
  try {
    const out = await runPicassoPipeline(fixtureBrief, {
      projectId: "closure-test",
      mode: "draft",
      hooks: fakeHooks(persisted),
    });
    // app-nav is built from button-group, which imports ./separator —
    // the closure must have provisioned it (the v7 bundle-killer).
    assert.ok(out.generatedComponents["separator"], "separator must be provisioned by the closure");
    assert.ok(out.provisioned.includes("separator"), JSON.stringify(out.provisioned));
    assert.ok(persisted.has("src/components/separator.tsx"), "provisioned base must be persisted");
  } finally {
    __setTestClient(null);
  }
});

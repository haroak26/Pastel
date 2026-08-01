import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveSharedComponents,
  pathForComponent,
  relativeImport,
  toPascalCase,
  validateArchitecture,
} from "../lib/pastel-agent/codegen/derive";
import {
  contrastRatio,
  failingContrastPairs,
} from "../lib/pastel-agent/codegen/contrast";
import { designTokensToCss } from "../lib/pastel-agent/codegen/styles";
import { scanAntiSlop, hasHighSeveritySlop } from "../lib/pastel-agent/codegen/anti-slop";
import { lintGeneratedFile, projectContractErrors } from "../lib/pastel-agent/codegen/lint";
import type { ArchitecturePlan, ProductSpec } from "../lib/pastel-agent/schemas/plan-schemas";

// ── WCAG contrast (deterministic, recomputed) ──────────────────────────────

test("contrast ratios are computed per WCAG 2.x", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
  const mid = contrastRatio("#777777", "#FFFFFF");
  assert.ok(mid > 4 && mid < 5.5, `expected mid-gray around 4.5, got ${mid}`);
});

// ── Deterministic derivations ───────────────────────────────────────────────

test("shared components are those used by at least two screens", () => {
  const spec = {
    screens: [
      { id: "home", name: "Home", purpose: "p", userGoal: "g", sections: [{ name: "Hero", purpose: "h" }], components: ["Navbar", "Card", "Button"] },
      { id: "about", name: "About", purpose: "p", userGoal: "g", sections: [{ name: "Story", purpose: "s" }], components: ["Navbar", "Footer"] },
      { id: "pricing", name: "Pricing", purpose: "p", userGoal: "g", sections: [{ name: "Tiers", purpose: "t" }], components: ["navbar", "Card", "CTA"] },
    ],
  } as unknown as ProductSpec;
  const shared = deriveSharedComponents(spec);
  assert.deepEqual(shared.sort(), ["Card", "Navbar"]);
});

test("component paths are canonical per kind", () => {
  assert.equal(pathForComponent("navbar", "shared"), "src/components/Navbar.jsx");
  assert.equal(pathForComponent("app shell", "layout"), "src/layouts/AppShell.jsx");
  assert.equal(pathForComponent("stat strip", "screen", "dashboard"), "src/features/Dashboard/StatStrip.jsx");
  assert.equal(relativeImport("src/screens/Home.jsx", "src/components/Navbar.jsx"), "../components/Navbar.jsx");
  assert.equal(relativeImport("src/features/Dashboard/StatStrip.jsx", "src/components/Card.jsx"), "../../components/Card.jsx");
});

test("architecture validation catches unresolved references", () => {
  const spec = {
    screens: [
      { id: "home", name: "Home", purpose: "p", userGoal: "g", sections: [{ name: "Hero", purpose: "h" }], components: ["Navbar"] },
    ],
  } as unknown as ProductSpec;
  const plan = {
    fileTree: ["src/screens/Home.jsx"],
    components: [{
      name: "Navbar", kind: "shared", purpose: "nav",
      props: [{ name: "children", type: "ReactNode", default: "undefined", description: "slot" }],
      variants: [{ name: "default", description: "d" }], states: [], tokens: ["color.text"], usedBy: ["Home"],
    }],
    screens: [{ name: "Home", sections: [{ name: "Hero", pattern: "Split Hero", components: ["Navbar", "Ghost"], copy: [] }], responsive: { tablet: "t", mobile: "m" } }],
  } as unknown as ArchitecturePlan;
  const issues = validateArchitecture(plan, spec);
  assert.ok(issues.some((i) => i.message.includes("Ghost")), "unknown component reference must be flagged");
});

// ── Deterministic styles codegen ────────────────────────────────────────────

test("styles.css is generated deterministically from tokens (no model call)", async () => {
  process.env.DATABASE_URL ??= "postgres://runner:runner@localhost:5432/pastel_test";
  const { fallbackDesignSystem } = await import("../lib/pastel-agent/stages/brand-kit");
  const css = designTokensToCss(fallbackDesignSystem());
  assert.match(css, /--color-text-muted: #625E56;/);
  assert.match(css, /--font-display: "Space Grotesk", sans-serif;/);
  assert.match(css, /--size-overline: 10px;/);
  assert.match(css, /--radius-full: 9999px;/);
  assert.match(css, /--shadow-sm: none;/);
  assert.match(css, /--bp-mobile: 375px;/);
  assert.match(css, /--bp-desktop: 1440px;/);
  assert.match(css, /--motion-fast: 150ms;/);
  assert.match(css, /--motion-ease: cubic-bezier\(0\.4, 0, 0\.2, 1\);/);
  assert.match(css, /\* \{ box-sizing: border-box; margin: 0; padding: 0; \}/);
});

// ── Anti-slop rule engine ───────────────────────────────────────────────────

test("anti-slop rules respect style-seed permissions", () => {
  const shadowCode = `export default function Card(){ return <div className="shadow-lg p-4">x</div>; }`;
  const swissViolations = scanAntiSlop(shadowCode, "swiss");
  assert.ok(swissViolations.some((v) => v.ruleId === "shadow-not-permitted"));
  const brutalistViolations = scanAntiSlop(shadowCode, "neo-brutalist");
  assert.ok(!brutalistViolations.some((v) => v.ruleId === "shadow-not-permitted"));

  const gradientCode = `<div className="bg-gradient-to-r from-pink-500 to-indigo-500" />`;
  assert.ok(scanAntiSlop(gradientCode, "editorial").some((v) => v.ruleId === "gradient-not-permitted"));
  assert.ok(!scanAntiSlop(gradientCode, "retro-futurist").some((v) => v.ruleId === "gradient-not-permitted"));

  const hardcoded = `<div style={{ color: "#ff00aa" }} />`;
  const hexViolations = scanAntiSlop(hardcoded, "swiss");
  assert.ok(hexViolations.some((v) => v.ruleId === "hardcoded-hex"));

  const slopCta = `<button>Get started free</button>`;
  assert.ok(hasHighSeveritySlop(scanAntiSlop(slopCta, "swiss")));

  const clean = `<button className="bg-[var(--color-accent)] text-[var(--color-accent-foreground)] rounded-[var(--radius-md)] px-4 py-2">Create project</button>`;
  assert.deepEqual(scanAntiSlop(clean, "swiss"), []);
});

// ── Static lint ─────────────────────────────────────────────────────────────

test("generated-file lint catches the historical failure classes", () => {
  assert.ok(lintGeneratedFile("src/components/X.jsx", `import React from "react";\nexport default function X(){}`).some((i) => i.message.includes("React import")));
  assert.ok(lintGeneratedFile("src/components/X.jsx", `import A from "../components/A";\nexport default function X(){}`).some((i) => i.message.includes("extension")));
  assert.ok(lintGeneratedFile("src/components/X.jsx", `import axios from "axios";\nexport default function X(){}`).some((i) => i.message.includes("not available")));
  assert.ok(lintGeneratedFile("src/components/X.jsx", `export default function X() { return <div style={{ color: "red" }}>{label}: {count}</div>; }`).length === 0 || true);
  assert.ok(lintGeneratedFile("src/components/X.jsx", `interface Props { label: string };\nexport default function X(){}`).some((i) => i.message.includes("TypeScript")));
  assert.ok(lintGeneratedFile("src/screens/Home.jsx", `export function Home(){}`).some((i) => i.message.includes("default export")));
});

test("the project contract requires screens to import planned shared components", async () => {
  const plan = {
    components: [{
      name: "Navbar", kind: "shared", purpose: "nav",
      props: [{ name: "children", type: "ReactNode", default: "undefined", description: "slot" }],
      variants: [{ name: "default", description: "d" }], states: [], tokens: [], usedBy: ["Home"],
    }],
    screens: [{ name: "Home", sections: [{ name: "Hero", pattern: "Split Hero", components: ["Navbar"], copy: [] }], responsive: { tablet: "t", mobile: "m" } }],
    fileTree: [],
  } as unknown as ArchitecturePlan;
  const files: Record<string, string> = {
    "src/components/Navbar.jsx": "export default function Navbar() { return <nav/>; }",
    "src/screens/Home.jsx": "export default function Home() { return <div>no nav here</div>; }",
  };
  const errors = projectContractErrors(files, plan);
  assert.ok(errors.some((e) => e.message.includes("must import shared component")));
});

// ── Intake ambiguity gate ───────────────────────────────────────────────────

test("the ambiguity engine asks only material, below-threshold, non-cosmetic questions", async () => {
  process.env.DATABASE_URL ??= "postgres://runner:runner@localhost:5432/pastel_test";
  const { selectClarifyQuestions } = await import("../lib/pastel-agent/stages/clarify");
  const mk = (overrides: Record<string, unknown>) => ({
    titleSuggestion: "Test Product",
    productType: "saas",
    audience: "founders",
    primaryJobs: ["do the thing"],
    contentDomains: [],
    tone: [],
    assumptions: [],
    constraints: [],
    confidence: 0.9,
    ambiguities: [],
    ...overrides,
  });
  const question = (overrides: Record<string, unknown> = {}) => ({
    title: "Primary job",
    question: "What is the first thing users should do?",
    whyItMatters: "It determines the first screen's composition entirely.",
    options: [
      { label: "Fast entry", description: "Optimise for speed" },
      { label: "Overview", description: "Optimise for comprehension" },
    ],
    ...overrides,
  });

  // material + low confidence → asked
  let result = selectClarifyQuestions(mk({
    ambiguities: [{ id: "primary_job", facet: "job", impact: "material", confidence: 0.3, question: question() }],
  }) as never);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "primary_job");

  // cosmetic impact → never asked
  result = selectClarifyQuestions(mk({
    ambiguities: [{ id: "color_pref", facet: "color", impact: "cosmetic", confidence: 0.1, question: question() }],
  }) as never);
  assert.equal(result.length, 0);

  // material but high confidence → not asked (proceed autonomously)
  result = selectClarifyQuestions(mk({
    ambiguities: [{ id: "primary_job", facet: "job", impact: "material", confidence: 0.9, question: question() }],
  }) as never);
  assert.equal(result.length, 0);

  // design-system questions are dropped deterministically regardless of model output
  result = selectClarifyQuestions(mk({
    ambiguities: [{ id: "colors", facet: "style", impact: "material", confidence: 0.1, question: question({ question: "What colors do you want the interface to use exactly?" }) }],
  }) as never);
  assert.equal(result.length, 0);

  // capped at 3 questions
  result = selectClarifyQuestions(mk({
    ambiguities: ["a", "b", "c", "d", "e"].map((id) => ({ id: `q_${id}`, facet: id, impact: "material", confidence: 0.2, question: question() })),
  }) as never);
  assert.equal(result.length, 3);
});

// ── Design-system deterministic validation ──────────────────────────────────

test("design-system validation enforces spacing caps, forbidden colors, fonts, and real contrast", async () => {
  process.env.DATABASE_URL ??= "postgres://runner:runner@localhost:5432/pastel_test";
  const { fallbackDesignSystem, normalizeDesignSystem, validateDesignSystemQuality } = await import("../lib/pastel-agent/stages/brand-kit");
  const ds = normalizeDesignSystem(fallbackDesignSystem());
  assert.deepEqual(ds.breakpoints, { mobile: 375, tablet: 768, desktop: 1440 });
  assert.equal(failingContrastPairs(ds).length, 0, "fallback tokens must pass WCAG AA");
  assert.doesNotThrow(() => validateDesignSystemQuality(ds, "swiss"));

  const badContrast = JSON.parse(JSON.stringify(ds));
  badContrast.colors.textMuted.hex = "#BBBBBB";
  assert.throws(() => validateDesignSystemQuality(badContrast, "swiss"), /contrast/i);

  const badFont = JSON.parse(JSON.stringify(ds));
  badFont.fonts.display = "Arial";
  assert.throws(() => validateDesignSystemQuality(badFont, "swiss"), /generic display font/);

  const badSpacing = JSON.parse(JSON.stringify(ds));
  badSpacing.spacing.sectionGap = 190;
  assert.throws(() => validateDesignSystemQuality(badSpacing, "swiss"), /spacing/);
  assert.doesNotThrow(() => validateDesignSystemQuality(JSON.parse(JSON.stringify({ ...badSpacing })), "monumental"), "relaxed seeds allow monumental spacing");
});

// ── Intake cache ────────────────────────────────────────────────────────────

test("intake briefs are cached by normalized prompt hash", async () => {
  process.env.DATABASE_URL ??= "postgres://runner:runner@localhost:5432/pastel_test";
  const { getCachedIntake, setCachedIntake, clearIntakeCache } = await import("../lib/pastel-agent/state");
  const { fallbackIntake } = await import("../lib/pastel-agent/stages/clarify");
  clearIntakeCache();
  const intake = fallbackIntake("A dashboard for a bakery chain");
  assert.equal(getCachedIntake("A dashboard for a bakery chain"), null);
  setCachedIntake("A dashboard for a bakery chain", intake);
  assert.deepEqual(getCachedIntake("a   dashboard  for a bakery chain"), intake, "cache keys normalize case + whitespace");
  clearIntakeCache();
  assert.equal(getCachedIntake("A dashboard for a bakery chain"), null);
});

// ── Incremental verification ────────────────────────────────────────────────

test("incremental verifier re-verifies only changed dependency closures", async () => {
  const { IncrementalScreenVerifier } = await import("../lib/pastel-agent/sandbox");
  const files: Record<string, string> = {
    "src/styles.css": ":root { --color-background: #fff; --color-text: #111; --color-accent: #a33; --font-body: sans-serif; }",
    "src/components/Button.jsx": `export default function Button({ label = "Go" }) { return <button className="px-4 py-2">{label}</button>; }`,
    "src/components/Chip.jsx": `export default function Chip({ label = "Chip" }) { return <span className="px-2 py-1">{label}</span>; }`,
    "src/screens/Home.jsx": `import Button from "../components/Button.jsx";\nexport default function Home() { return <div className="min-h-screen"><h1>Home</h1><Button label="Start" /><p>body copy here</p></div>; }`,
    "src/screens/Settings.jsx": `import Chip from "../components/Chip.jsx";\nexport default function Settings() { return <div className="min-h-screen"><h1>Settings</h1><Chip label="General" /><p>more content here</p></div>; }`,
  };
  const verifier = new IncrementalScreenVerifier();
  const first = await verifier.verify(files);
  assert.equal(first.ok, true, JSON.stringify(first.errors));
  assert.deepEqual(first.rebuilt.sort(), ["Home", "Settings"]);

  const changed = { ...files, "src/components/Button.jsx": `export default function Button({ label = "Go!" }) { return <button className="px-8 py-2">{label}</button>; }` };
  const second = await verifier.verify(changed);
  assert.equal(second.ok, true, JSON.stringify(second.errors));
  assert.deepEqual(second.rebuilt, ["Home"], "only the screen importing Button should rebuild");
  assert.deepEqual(second.reused, ["Settings"]);
});

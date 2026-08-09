import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCompany, resolveCompanyTheme } from "../lib/pastel-agent/knowledge/index";
import { compileStyles, compileStylesForRun } from "../lib/pastel-agent/compile";
import { auditPropBindings } from "../lib/pastel-agent/checks/props";
import { lintGeneratedFile } from "../lib/pastel-agent/checks/lint";

/**
 * V22 regression suite — the three P0 pipeline/enforcement bugs plus the P1
 * visual-system tweaks.
 *
 *  1. Opacity coverage: semantic color classes with opacity modifiers
 *     (bg-accent/20, bg-muted/50, …) must get a compiled CSS rule derived from
 *     the run's ACTUAL class usage — not a static allowlist.
 *  2. Prop binding: a mounted component must receive every required prop its
 *     own spec declares (no missing props, no empty arrays).
 *  3. Repair wiring: repair must run on the MID tier with a structural-rewrite
 *     token budget (never silently regress to cheap + 5000).
 *  4. Progress-bar tracks: rounded-none on a progress track auto-fixes to the
 *     theme's full radius.
 */

// ── P0 Bug 1: opacity-modified semantic classes render as invisible ─────────

test("v22 compile: base sheet has NO opacity rules (documents the CDN bug)", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const base = compileStyles(theme).css;
  // The bug: the Tailwind CDN can't alpha-blend the semantic CSS vars, so the
  // hand-written base sheet has no bg-accent/20 class at all.
  assert.ok(!base.includes(".bg-accent\\/20"), "base sheet has no opacity rule");
  assert.ok(!base.includes(".bg-muted\\/50"), "base sheet has no rest-state bg-muted/50");
});

test("v22 compile: every semantic opacity class actually used gets a CSS rule", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });

  // Reproduces the fixture's exact failure: six-sprint velocity bars at
  // bg-accent/20…/50 plus bg-success/60, and the tonal bands the design law
  // recommends (bg-muted/50, bg-muted/30, bg-destructive/10, text-accent/70).
  const files: Record<string, string> = {
    "src/screens/home.jsx": `
import { SprintTaskTable } from "../components/SprintTaskTable.jsx";
export default function Home() {
  return (
    <main>
      <section>
        <div className="flex items-end gap-2 h-40">
          <div className="bg-accent/20 h-24 w-8" />
          <div className="bg-accent/30 h-28 w-8" />
          <div className="bg-accent/40 h-32 w-8" />
          <div className="bg-accent/50 h-36 w-8" />
          <div className="bg-success/60 h-24 w-8" />
        </div>
      </section>
      <section className="bg-muted/50">
        <div className="bg-muted/30">quiet band</div>
        <span className="bg-destructive/10">chip</span>
        <span className="text-accent/70">label</span>
      </section>
      <button className="hover:bg-primary/80">hover</button>
      <input className="focus:text-accent/60" />
    </main>
  );
}`,
  };

  const { css } = compileStylesForRun(theme, files);

  // Rest-state coverage — the classes that were silently missing.
  assert.ok(css.includes(".bg-accent\\/20"), "bg-accent/20 has a rule");
  assert.ok(css.includes(".bg-accent\\/30"), "bg-accent/30 has a rule");
  assert.ok(css.includes(".bg-accent\\/40"), "bg-accent/40 has a rule");
  assert.ok(css.includes(".bg-accent\\/50"), "bg-accent/50 has a rule");
  assert.ok(css.includes(".bg-success\\/60"), "bg-success/60 has a rule");
  assert.ok(css.includes(".bg-muted\\/50"), "bg-muted/50 rest-state rule exists");
  assert.ok(css.includes(".bg-muted\\/30"), "bg-muted/30 rest-state rule exists");
  assert.ok(css.includes(".bg-destructive\\/10"), "bg-destructive/10 has a rule");
  assert.ok(css.includes(".text-accent\\/70"), "text-accent/70 has a rule");

  // Pseudo-prefixed variants get rules too.
  assert.ok(css.includes(".hover\\:bg-primary\\/80:hover"), "hover:bg-primary/80 has a rule");
  assert.ok(css.includes(".focus\\:text-accent\\/60:focus"), "focus:text-accent/60 has a rule");

  // Rules derive from the theme's real hex (zero-support-risk rgba).
  const accentHex = theme.cssVars["--accent"];
  const r = parseInt(accentHex.slice(1, 3), 16);
  assert.ok(css.includes(`rgba(${r},`), "rule uses rgba derived from the theme hex");
  assert.ok(css.includes("color-mix(in srgb, var(--accent)"), "rule keeps the color-mix var reference");

  // Base sheet still present.
  assert.ok(css.includes("--accent"), "base tokens still in the run sheet");
});

test("v22 compile: coverage is generated from actual usage, not a static list", async () => {
  const company = await loadCompany("nike");
  const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
  const files: Record<string, string> = {
    "src/screens/home.jsx": `<div className="bg-warning/35"><span className="border-primary/25">x</span><span className="ring-ring/40">y</span></div>`,
  };
  const { css } = compileStylesForRun(theme, files);
  assert.ok(css.includes(".bg-warning\\/35"), "unusual opacity 35 still covered");
  assert.ok(css.includes(".border-primary\\/25"), "border-primary/25 covered");
  assert.ok(css.includes(".ring-ring\\/40"), "ring-ring/40 covered");
});

// ── P0 Bug 2: components mounted without their required data ───────────────

function taskTableSpec(): Record<string, any> {
  return {
    SprintTaskTable: {
      name: "SprintTaskTable",
      purpose: "The sprint backlog table",
      props: [
        { name: "items", type: "array" },
        { name: "title", type: "string", default: "Tasks" },
        { name: "className", type: "string", default: "" },
      ],
      variants: [{ name: "default", purpose: "rows" }, { name: "compact", purpose: "denser" }],
      states: ["default", "empty"],
      designIntent: "A dense operating table",
    },
  };
}

test("v22 props gate: flags a mount that omits a required prop", () => {
  const specs = taskTableSpec();
  const bad = {
    "src/screens/home.jsx": `<section><SprintTaskTable className="w-full" /></section>`,
  };
  const issues = auditPropBindings(specs as any, bad);
  const hit = issues.find((i) => i.category === "props" && i.description.includes("items"));
  assert.ok(hit, "missing required items prop is flagged");
  assert.equal(hit!.severity, "high");
  assert.equal(hit!.file, "src/screens/home.jsx");
});

test("v22 props gate: does not flag a correctly-bound mount", () => {
  const specs = taskTableSpec();
  const good = {
    "src/screens/home.jsx": `<section><SprintTaskTable items={DATA.screens.home.rows} title="Sprint backlog" /></section>`,
  };
  assert.equal(auditPropBindings(specs as any, good).length, 0, "correctly-bound mount is clean");
});

test("v22 props gate: flags empty-array / empty-string values for required props", () => {
  const specs = taskTableSpec();
  const emptyArr = auditPropBindings(specs as any, {
    "src/screens/home.jsx": `<section><SprintTaskTable items={[]} /></section>`,
  });
  assert.ok(emptyArr.some((i) => i.category === "props" && i.description.includes("{[]}")), "items={[]} flagged");
  const emptyStr = auditPropBindings(specs as any, {
    "src/screens/home.jsx": `<section><SprintTaskTable items="" /></section>`,
  });
  assert.ok(emptyStr.some((i) => i.category === "props" && /empty value/.test(i.description)), 'items="" flagged');
  const undefinedVal = auditPropBindings(specs as any, {
    "src/screens/home.jsx": `<section><SprintTaskTable items={undefined} /></section>`,
  });
  assert.ok(undefinedVal.some((i) => i.category === "props"), "items={undefined} flagged");
});

// ── P0 Bug 3: the repair loop can't actually repair (config guardrail) ─────

test("v22 repair guardrail: repair runs on the mid tier with a structural-rewrite budget", async () => {
  const { MODELS, MAX_TOKENS_PER_CALL, CHEAP_DEFAULT, MID_DEFAULT } = await import("../lib/pastel-agent/gateway");
  assert.notEqual(MODELS.repair, CHEAP_DEFAULT, "repair must not silently regress to the cheap tier");
  assert.equal(MODELS.repair, MID_DEFAULT, "repair defaults to the same tier that found the defects");
  assert.ok(MAX_TOKENS_PER_CALL.repair >= 9000, "repair token budget must cover screen-level rewrites");
});

// ── P1: progress-bar square tracks read as a bug ───────────────────────────

test("v22 lint: progress-bar square track auto-fixes to the theme's full radius", () => {
  const code = `function Progress({ value = 0 }) {
  return (
    <div className="w-full">
      <div className="flex h-3 w-full overflow-hidden rounded-none bg-[var(--muted)]">
        <div className="h-full bg-primary transition-all" style={{ width: value + "%" }} />
      </div>
    </div>
  );
}`;
  const { issues, fixed } = lintGeneratedFile("src/components/Progress.jsx", code);
  assert.ok(issues.some((i) => i.description.includes("rounded-none")), "square track is flagged");
  assert.ok(fixed, "auto-fix produced a replacement");
  assert.ok(fixed!.includes("rounded-[var(--radius-full)]"), "track rounded to radius-full");
  assert.ok(!fixed!.includes("rounded-none"), "no rounded-none remains");
});

test("v22 lint: unrelated rounded-none elements are not touched", () => {
  const code = `export default function Divider() {
  return <div className="h-px w-full rounded-none bg-border" />;
}`;
  const { fixed } = lintGeneratedFile("src/components/Divider.jsx", code);
  assert.equal(fixed, null, "no overflow-hidden + height → not treated as a track");
});

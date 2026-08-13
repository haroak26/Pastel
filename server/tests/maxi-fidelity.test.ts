import test from "node:test";
import assert from "node:assert/strict";

import {
  sourceSimilarity,
  distinctSlotUtilities,
  checkSimilarityFloor,
  TAXONOMY_SIMILARITY_FLOORS,
  validateComponentCode,
  type ComponentBuildSpec,
} from "../lib/maxi-agent/lib/fidelity";
import { loadBaseComponent, rewriteBaseImports } from "../lib/maxi-agent/lib/base-components";

// ── sourceSimilarity ──────────────────────────────────────────────────────

test("sourceSimilarity: identical sources are 1", () => {
  const code = `export function Button({ className, ...props }) {\n  return <button className={className} {...props} />\n}`;
  assert.equal(sourceSimilarity(code, code), 1);
});

test("sourceSimilarity: disjoint sources are 0", () => {
  const a = "function Alpha() { return <div>alpha alpha alpha</div> }";
  const b = "function Beta() { return <span>beta beta beta</span> }";
  assert.equal(sourceSimilarity(a, b), 0);
});

test("sourceSimilarity: ratio stays bounded at or below 1 for very different lengths", () => {
  const short = "const a = 1;";
  const long = "const a = 1;\n".repeat(500);
  const sim = sourceSimilarity(short, long);
  assert.ok(sim >= 0 && sim <= 1, `sim ${sim} within [0,1]`);
});

test("sourceSimilarity: near-copies score high, modified cores score lower", () => {
  const base = [
    "import * as React from 'react'",
    "import { cn } from './cn'",
    "function Button({ className, variant = 'default', ...props }) {",
    "  return <button data-slot='button' className={cn('bg-primary text-primary-foreground h-9 rounded-md px-4', className)} {...props} />",
    "}",
    "export { Button }",
  ].join("\n");
  const tweaked = base.replace("h-9", "h-11").replace("rounded-md", "rounded-lg");
  const sim = sourceSimilarity(tweaked, base);
  assert.ok(sim >= 0.8, `light touch keeps ≥0.8 (${sim.toFixed(3)})`);
});

test("sourceSimilarity: empty inputs are 0", () => {
  assert.equal(sourceSimilarity("", "anything"), 0);
  assert.equal(sourceSimilarity("anything", ""), 0);
  assert.equal(sourceSimilarity("", ""), 0);
});

// ── Taxonomy floors (both directions) ────────────────────────────────────

test("fidelity floors: primitives have the highest floor and reject", () => {
  assert.equal(TAXONOMY_SIMILARITY_FLOORS.primitive.action, "reject");
  assert.equal(TAXONOMY_SIMILARITY_FLOORS.primitive.floor, 0.85);
});

test("fidelity floors: atoms retry, molecules report, organisms have no floor", () => {
  assert.equal(TAXONOMY_SIMILARITY_FLOORS.atom.action, "retry");
  assert.equal(TAXONOMY_SIMILARITY_FLOORS.atom.floor, 0.65);
  assert.equal(TAXONOMY_SIMILARITY_FLOORS.molecule.action, "report");
  assert.equal(TAXONOMY_SIMILARITY_FLOORS.molecule.floor, 0.4);
  assert.equal(TAXONOMY_SIMILARITY_FLOORS.organism.floor, null);
});

test("checkSimilarityFloor: a primitive at 95% passes with action pass", () => {
  const base = loadBaseComponent("button")!;
  const similar = base.source.replace(/h-9/g, "h-11").replace(/rounded-md/g, "rounded-lg");
  const verdict = checkSimilarityFloor(similar, { id: "b1", name: "Button", taxonomy: "primitive" }, base);
  assert.equal(verdict.passed, true);
  assert.equal(verdict.action, "pass");
  assert.ok(verdict.similarity >= 0.85, `similarity ${verdict.similarity} above floor`);
});

test("checkSimilarityFloor: a primitive that diverges hard is rejected (floor direction)", () => {
  const base = loadBaseComponent("button")!;
  const diverged = `export function Button() { return <button className="p-10 text-3xl border-8 border-red-500 rounded-3xl bg-white shadow-xl">Press me</button> }`;
  const verdict = checkSimilarityFloor(diverged, { id: "b1", name: "Button", taxonomy: "primitive" }, base);
  assert.equal(verdict.passed, false);
  assert.equal(verdict.action, "reject");
});

test("checkSimilarityFloor: a molecule near the base is a warning, not a pass (ceiling direction)", () => {
  const base = loadBaseComponent("card")!;
  // A molecule that only touches tokens stays ~identical to the base: the
  // FLOOR passes (≥0.4) but validateComponentCode rejects the ceiling
  // (molecules must visibly diverge). The floor check itself reports pass.
  const barelyTouched = base.source;
  const verdict = checkSimilarityFloor(barelyTouched, { id: "m1", name: "StatCard", taxonomy: "molecule" }, base);
  assert.equal(verdict.passed, true, "floor passes — the ceiling is a separate check");
});

test("checkSimilarityFloor: molecule floor 0.4 — discarding the base skeleton fails the floor", () => {
  const base = loadBaseComponent("card")!;
  const fromScratch = `export function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-primary/5 px-6 py-8">
      <p className="text-sm uppercase tracking-widest text-primary">{label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}`;
  const verdict = checkSimilarityFloor(fromScratch, { id: "m1", name: "StatCard", taxonomy: "molecule" }, base);
  assert.equal(verdict.passed, false, "a molecule that keeps none of the base skeleton violates the 40% floor");
  assert.equal(verdict.action, "report");
});

test("checkSimilarityFloor: a molecule retaining the base skeleton passes the 40% floor", () => {
  const base = loadBaseComponent("card")!;
  const skeletonKept = base.source
    .replace("bg-card", "bg-accent")
    .replace("text-card-foreground", "text-accent-foreground")
    .replace(/--card-spacing:--spacing\(4\)/g, "--card-spacing:--spacing(6)")
    .replace(/data-slot="card"/g, 'data-slot="stat-card"');
  const verdict = checkSimilarityFloor(skeletonKept, { id: "m1", name: "StatCard", taxonomy: "molecule" }, base);
  assert.equal(verdict.passed, true, `similarity ${verdict.similarity.toFixed(3)} ≥ 0.4`);
});

// ── validateComponentCode ────────────────────────────────────────────────

function entry(taxonomy: ComponentBuildSpec["taxonomy"]): ComponentBuildSpec {
  return {
    id: "stat-card",
    name: "StatCard",
    taxonomy,
    baseComponent: "card",
    description: "a product stat card",
    props: [{ name: "label", type: "string", required: true }, { name: "value", type: "number", required: true }],
    states: ["default"],
    customization: "make it this product's",
  };
}

test("validateComponentCode: rejects raw hex color literals", () => {
  const base = loadBaseComponent("card")!;
  const bad = base.source.replace("bg-card", "bg-#123456");
  const res = validateComponentCode(bad, entry("primitive"), base);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => /hex/.test(e)));
});

test("validateComponentCode: rejects @/ alias imports (self-contained contract)", () => {
  const base = loadBaseComponent("button")!;
  const bad = base.source.replace(/from "@\/lib\/utils"/, 'from "@shadcn/button"');
  const res = validateComponentCode(bad, entry("primitive"), base);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => /shadcn/.test(e)));
});

test("validateComponentCode: byte-identical output is a failure (never ship the base verbatim)", () => {
  const base = loadBaseComponent("badge")!;
  const res = validateComponentCode(base.source, entry("primitive"), base);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => /identical/.test(e)));
});

test("validateComponentCode: missing base exports are flagged", () => {
  const base = loadBaseComponent("button")!;
  const stripped = base.source.replace(/export \{[^}]*\}/, "");
  const res = validateComponentCode(stripped, entry("primitive"), base);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => /exports/.test(e)));
});

test("validateComponentCode: a molecule 95% similar to its base is a ceiling violation", () => {
  const base = loadBaseComponent("card")!;
  const close = base.source.replace(/rounded-xl/g, "rounded-2xl").replace(/p-6/g, "p-8");
  const res = validateComponentCode(close, entry("molecule"), base);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => /Too close/.test(e)), `errors: ${res.errors.join("; ")}`);
});

test("validateComponentCode: an organism too close to its base is also a ceiling violation", () => {
  const base = loadBaseComponent("card")!;
  const close = base.source.replace(/rounded-xl/g, "rounded-2xl");
  const res = validateComponentCode(close, entry("organism"), base);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((e) => /Too close/.test(e)));
});

test("validateComponentCode: a customized primitive with slot utilities passes", () => {
  const base = loadBaseComponent("button")!;
  // The real pipeline rewrites @/ alias imports BEFORE validation.
  const customized = rewriteBaseImports(
    base.source
      .replace("bg-primary", "bg-accent")
      .replace("text-primary-foreground", "text-accent-foreground")
      .replace(/h-9/g, "h-11"),
  );
  const res = validateComponentCode(customized, entry("primitive"), base);
  assert.equal(res.valid, true, res.errors.join("; "));
});

// ── distinctSlotUtilities ────────────────────────────────────────────────

test("distinctSlotUtilities: counts distinct theme slots", () => {
  const code = `className={cn("bg-primary text-primary-foreground bg-muted border-border text-muted-foreground")}`;
  assert.equal(distinctSlotUtilities(code), 4);
  assert.equal(distinctSlotUtilities("no utilities here"), 0);
});

// ── Env tuning ───────────────────────────────────────────────────────────

test("fidelity floors: env overrides are honored (MAXI_ prefix)", async () => {
  process.env.MAXI_SIM_FLOOR_PRIMITIVE = "0.9";
  try {
    const fresh = await import("../lib/maxi-agent/lib/fidelity?env-override");
    assert.equal(fresh.TAXONOMY_SIMILARITY_FLOORS.primitive.floor, 0.9);
  } finally {
    delete process.env.MAXI_SIM_FLOOR_PRIMITIVE;
  }
});

import test from "node:test";
import assert from "node:assert/strict";

import { generateDataset, composeDataJs } from "../lib/maxi-agent/lib/data-gen";
import { blueprintSchema, type DesignBlueprint } from "../lib/maxi-agent/lib/blueprint";

/**
 * Maxi Agent v25 — the deterministic dataset generator.
 *
 * v24's most persistent failure class was density: the genome schema
 * DECLARED minRows ≥ 3 and the composer ignored it (2-row lists shipped).
 * v25 solves density at the source: exemplars expand to 6-8 rows before
 * any file is authored. These tests pin the expansion, the determinism,
 * and the unit/currency/date conformance (the v24 Wave-5 lesson, by
 * construction instead of post-hoc checks).
 */

import { blueprintFixture } from "./maxi-v25-blueprint.test";

const SEED = "test-seed-123";

test("data-gen: exemplars expand to a dense populated list", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  const { dataset } = generateDataset(bp, SEED);
  assert.ok(dataset.list.rows.length >= 6 && dataset.list.rows.length <= 8, `got ${dataset.list.rows.length}`);
  const titles = new Set(dataset.list.rows.map((r) => r.title));
  assert.equal(titles.size, dataset.list.rows.length, "every row is distinguishable");
  assert.ok(dataset.metrics.length === 3);
  assert.ok(dataset.activity.length >= 3);
  assert.ok(dataset.spark.length === 12);
});

test("data-gen: the same seed is fully deterministic", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  const a = generateDataset(bp, SEED).dataset;
  const b = generateDataset(bp, SEED).dataset;
  assert.deepEqual(a, b);
});

test("data-gen: a different seed produces a different expansion", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  const a = generateDataset(bp, SEED).dataset;
  const b = generateDataset(bp, "another-seed").dataset;
  assert.notDeepEqual(a.list.rows, b.list.rows);
});

test("data-gen: metric units outside the declared vocabulary are replaced", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  bp.dataSchema.metrics[0]!.unit = "miles"; // not in ["km", "min", "%"]
  const { dataset, notes } = generateDataset(bp, SEED);
  assert.ok(dataset.metrics.every((m) => m.unit === "" || ["km", "min", "%"].includes(m.unit)));
  assert.ok(notes.some((n) => n.includes("unit") && n.includes("replaced")));
});

test("data-gen: amounts use the declared currency symbol", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  bp.dataSchema.currency = "EUR";
  bp.dataSchema.list.rows[0]!.amount = "$1,240";
  const { dataset } = generateDataset(bp, SEED);
  const withAmount = dataset.list.rows.find((r) => r.amount);
  assert.ok(withAmount, "amounts survive expansion");
  assert.ok(withAmount!.amount!.startsWith("€"), `euro symbol enforced (got ${withAmount!.amount})`);
  assert.ok(!withAmount!.amount!.includes("$"));
});

test("data-gen: generated row dates land inside the declared range", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  bp.dataSchema.dateRange = { start: "2026-07-01", end: "2026-07-31" };
  const { dataset } = generateDataset(bp, SEED);
  assert.ok(dataset.list.rows.length > 0);
  const months = new Set(dataset.list.rows.map((r) => r.date.split(" ")[0]));
  assert.deepEqual([...months], ["Jul"], "all dates inside July 2026");
});

test("data-gen: src/data.js is a self-contained ES module exporting DATA", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  const { dataset } = generateDataset(bp, SEED);
  const js = composeDataJs(dataset);
  assert.match(js, /export const DATA = \{/);
  assert.ok(!/^import /m.test(js), "data.js has no import statements — it is copy-pasteable standalone");
  assert.ok(js.includes(dataset.list.rows[0]!.title));
  assert.ok(js.includes('"primaryCta"'));
});

test("data-gen: nav is derived from the blueprint screens with legal icon names", () => {
  const bp: DesignBlueprint = blueprintSchema.parse(blueprintFixture());
  const { dataset } = generateDataset(bp, SEED);
  assert.deepEqual(dataset.nav.map((n) => n.id), ["home", "detail"]);
  assert.ok(dataset.nav.every((n) => /^[a-z][a-zA-Z]+$/.test(n.icon)));
});

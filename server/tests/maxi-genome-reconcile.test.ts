import test from "node:test";
import assert from "node:assert/strict";

import { reconcileGenome, slotsPlausiblyMerge, MAX_SLOTS_PER_SCREEN } from "../lib/maxi-agent/lib/genome-reconcile";
import { layoutGenomeSchema, type LayoutGenome } from "../lib/maxi-agent/lib/genome";

// ── Fixtures ──────────────────────────────────────────────────────────────

const GENOME_JSON = (over: Partial<LayoutGenome> = {}): LayoutGenome => ({
  version: "1.0.0",
  mode: "track",
  screens: [
    {
      id: "home",
      nav: "sidebar",
      maxEmptyViewport: 0.2,
      regions: [
        { block: "stats", variant: "scoreboard", surface: "soft-wash", emphasis: true },
        { block: "custom", variant: "default", surface: "plain", component: "InsightPanel", primaryAction: true },
        { block: "custom", variant: "default", surface: "plain", component: "GoalProgress" },
        { block: "list", variant: "rows", surface: "divided-list", minRows: 4 },
      ],
    },
    {
      id: "detail",
      nav: "sidebar",
      maxEmptyViewport: 0.2,
      regions: [
        { block: "detail", variant: "pane", surface: "inset-panel", emphasis: true },
        { block: "custom", variant: "default", surface: "plain", component: "SummaryBar" },
        { block: "cta", variant: "band", surface: "tonal-band", primaryAction: true },
      ],
    },
  ],
  componentSlots: [
    { name: "InsightPanel", purpose: "the key metric with trend", usedBy: ["home"] },
    { name: "GoalProgress", purpose: "progress toward the weekly goal", usedBy: ["home"] },
    { name: "SummaryBar", purpose: "record summary metrics", usedBy: ["detail"] },
    { name: "HistoryStrip", purpose: "recent record history", usedBy: ["detail"] },
  ],
  rationale: "test fixture",
  ...over,
});

/** Helper: custom slots referenced by a screen after reconcile. */
function slotsFor(genome: LayoutGenome, screenId: string): string[] {
  const screen = genome.screens.find((s) => s.id === screenId)!;
  return screen.regions.filter((r) => r.block === "custom" && r.component).map((r) => r.component as string);
}

// ── (a) nav slots never appear in componentSlots ──────────────────────────

test("reconcile: Sidebar/Topbar slots are dropped, never shipped", () => {
  const g = GENOME_JSON();
  g.componentSlots = [
    { name: "Sidebar", purpose: "Product navigation rail with brand and destinations", usedBy: ["home", "detail"] },
    { name: "Topbar", purpose: "Product header with brand and user context", usedBy: ["home", "detail"] },
    ...g.componentSlots,
  ];
  const { genome, notes } = reconcileGenome(g);
  const names = genome.componentSlots.map((s) => s.name);
  assert.ok(!names.includes("Sidebar"));
  assert.ok(!names.includes("Topbar"));
  assert.ok(notes.some((n) => /nav chrome slot/.test(n)), "a note records the drop");
});

test("reconcile: nav chrome never appears in componentSlots, no matter the input", () => {
  for (const chrome of ["Sidebar", "Topbar"]) {
    const g = GENOME_JSON();
    g.componentSlots.push({ name: chrome, purpose: "chrome that must never ship", usedBy: ["home", "detail"] });
    const { genome } = reconcileGenome(g);
    assert.ok(!genome.componentSlots.some((s) => s.name === chrome));
  }
});

// ── (b) >2 custom slots per screen always come out <=2 ────────────────────

test("reconcile: over-budget slots are merged or dropped — never >2 per screen", () => {
  const g = GENOME_JSON();
  // Three slots all claiming home (InsightPanel + GoalProgress + PaceRing).
  g.componentSlots.push({ name: "PaceRing", purpose: "ring showing pace progress toward the weekly goal", usedBy: ["home"] });
  g.screens[0].regions.push({ block: "custom", variant: "default", surface: "plain", component: "PaceRing" });

  const { genome, notes } = reconcileGenome(g);
  assert.ok(slotsFor(genome, "home").length <= MAX_SLOTS_PER_SCREEN, `home keeps ≤${MAX_SLOTS_PER_SCREEN} slots`);
  assert.ok(slotsFor(genome, "detail").length <= MAX_SLOTS_PER_SCREEN, `detail keeps ≤${MAX_SLOTS_PER_SCREEN} slots`);
  assert.ok(genome.componentSlots.length <= 4, "total slots never exceed 4");
  assert.ok(notes.some((n) => /budget/.test(n)), "a note records the cap enforcement");

  // Every kept slot is still referenced by a region, and every region's
  // component exists in the slot list (no orphaned halves).
  const names = new Set(genome.componentSlots.map((s) => s.name));
  for (const screen of genome.screens) {
    for (const r of screen.regions) {
      if (r.block === "custom" && r.component) assert.ok(names.has(r.component), `${screen.id} region mounts existing slot ${r.component}`);
    }
  }
});

test("reconcile: plausible-merge path rewires regions into the kept slot", () => {
  assert.ok(slotsPlausiblyMerge(
    { name: "A", purpose: "progress toward the weekly goal" },
    { name: "B", purpose: "ring showing goal progress" },
  ), "shared vocabulary counts as plausible");
  assert.ok(!slotsPlausiblyMerge(
    { name: "A", purpose: "progress toward the weekly goal" },
    { name: "B", purpose: "catalog amenities grid" },
  ), "disjoint purposes do not merge");

  const g = GENOME_JSON();
  g.componentSlots.push({ name: "GoalRing", purpose: "ring showing goal progress in the home section", usedBy: ["home"] });
  g.screens[0].regions.push({ block: "custom", variant: "default", surface: "plain", component: "GoalRing" });
  const { genome } = reconcileGenome(g);
  const homeSlots = slotsFor(genome, "home");
  assert.ok(homeSlots.length <= 2, "merge keeps the budget");
  assert.ok(homeSlots.every((s) => s === "InsightPanel" || s === "GoalProgress"), "regions rewire to a kept slot");
});

// ── (c) every remaining slot has >=1 mounting region ──────────────────────

test("reconcile: unmounted slots are dropped; every kept slot has a region", () => {
  const g = GENOME_JSON();
  g.componentSlots.push({ name: "OrphanWidget", purpose: "a widget nothing mounts", usedBy: ["home"] });
  const { genome, notes } = reconcileGenome(g);
  assert.ok(!genome.componentSlots.some((s) => s.name === "OrphanWidget"), "unmounted slot is dropped");
  assert.ok(notes.some((n) => /unused component slot/.test(n)), "a note records the drop");
  const names = new Set(genome.componentSlots.map((s) => s.name));
  const referenced = new Set(
    genome.screens.flatMap((s) => s.regions).filter((r) => r.block === "custom" && r.component).map((r) => r.component as string),
  );
  for (const name of names) {
    assert.ok(referenced.has(name), `slot ${name} is mounted by at least one region`);
  }
});

// ── (d) idempotent ────────────────────────────────────────────────────────

test("reconcile: idempotent — running twice produces the same output", () => {
  const messy = GENOME_JSON();
  messy.componentSlots.push({ name: "Sidebar", purpose: "nav chrome", usedBy: ["home", "detail"] });
  messy.componentSlots.push({ name: "OrphanWidget", purpose: "a widget nothing mounts", usedBy: ["detail"] });
  messy.componentSlots.push({ name: "PaceRing", purpose: "ring showing pace progress toward the weekly goal", usedBy: ["home"] });
  messy.screens[0].regions.push({ block: "custom", variant: "default", surface: "plain", component: "PaceRing" });
  messy.screens[0].regions.push({ block: "custom", variant: "default", surface: "plain", component: "InsightPanel" });

  const once = reconcileGenome(messy);
  const twice = reconcileGenome(once.genome);
  assert.deepEqual(twice.genome, once.genome, "second pass is a no-op");
  assert.deepEqual(twice.notes, [], "no notes on the stable pass");
});

// ── Output is always schema-valid and canonical ──────────────────────────

test("reconcile: output still parses the genome schema", () => {
  for (const over of [
    {},
    { componentSlots: [{ name: "Sidebar", purpose: "nav chrome that must never ship", usedBy: ["home"] }, ...GENOME_JSON().componentSlots] },
  ]) {
    const g = GENOME_JSON(over);
    const { genome } = reconcileGenome(g);
    const parsed = layoutGenomeSchema.parse(genome);
    assert.equal(parsed.screens.length, 2);
  }
});

test("reconcile: duplicate mounts of one slot on a screen merge to one region", () => {
  const g = GENOME_JSON();
  g.screens[0].regions.push({ block: "custom", variant: "default", surface: "plain", component: "InsightPanel" });
  const { genome, notes } = reconcileGenome(g);
  const mounts = genome.screens[0].regions.filter((r) => r.block === "custom" && r.component === "InsightPanel");
  assert.equal(mounts.length, 1, "one mount per slot per screen");
  assert.ok(notes.some((n) => /duplicate region/.test(n)), "a note records the merge");
});

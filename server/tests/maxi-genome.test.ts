import test from "node:test";
import assert from "node:assert/strict";

import {
  layoutGenomeSchema,
  MODE_VOCABULARY,
  legalBlocksForMode,
  legalSurfacesForMode,
  buildModeVocabulary,
  defaultGenome,
  genomeToWireframe,
  classifyGenomeMode,
  withShellComponents,
  type LayoutGenome,
} from "../lib/maxi-agent/lib/genome";
import type { ProductBrief } from "../lib/maxi-agent/schemas";
import { classifyMode } from "../lib/maxi-agent/lib/ux-design";

// ── Fixtures ──────────────────────────────────────────────────────────────

const MODES = ["browse", "transact", "track", "create", "operate", "learn", "social"] as const;

function brief(mode?: ProductBrief["mode"], title = "Runner Coach"): ProductBrief {
  return {
    version: "1.0.0",
    title,
    productType: "training app",
    mode,
    description: "A coaching app that plans runs and tracks progress.",
    audience: { primary: "runners", needs: ["plans", "logs"] },
    goals: ["plan training", "log runs"],
    features: [{ name: "plan", description: "weekly plans", priority: "critical" }],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "today's run and weekly progress — the primary workflow" },
      { id: "detail", purpose: "one run's splits and effort — the focused record view" },
    ],
    copyDirection: "concrete and encouraging",
    designLanguage: "warm minimal",
    inspiration: { primary: "nike", secondary: [] },
  };
}

const GENOME_JSON = (over: Partial<LayoutGenome> = {}): LayoutGenome => ({
  version: "1.0.0",
  mode: "track",
  screens: [
    {
      id: "home",
      nav: "topbar",
      regions: [
        { block: "stats", variant: "scoreboard", surface: "soft-wash", emphasis: true },
        { block: "chart", variant: "band", surface: "soft-wash" },
        { block: "list", variant: "rows", surface: "divided-list" },
        { block: "custom", variant: "default", surface: "plain", component: "InsightPanel" },
      ],
      pairHints: [["chart", "list"]],
    },
    {
      id: "detail",
      nav: "topbar",
      regions: [
        { block: "detail", variant: "pane", surface: "inset-panel", emphasis: true },
        { block: "list", variant: "activity", surface: "divided-list" },
        { block: "custom", variant: "default", surface: "plain", component: "SummaryBar" },
        { block: "cta", variant: "band", surface: "tonal-band" },
      ],
    },
  ],
  componentSlots: [
    { name: "InsightPanel", purpose: "the key metric with trend", usedBy: ["home"] },
    { name: "SummaryBar", purpose: "record summary metrics", usedBy: ["detail"] },
    { name: "GoalProgress", purpose: "progress toward the weekly goal", usedBy: ["home"] },
    { name: "HistoryStrip", purpose: "recent record history", usedBy: ["detail"] },
  ],
  rationale: "test fixture",
  ...over,
});

// ── Schema validation ─────────────────────────────────────────────────────

test("layout genome: a valid genome parses", () => {
  const parsed = layoutGenomeSchema.parse(GENOME_JSON());
  assert.equal(parsed.mode, "track");
  assert.equal(parsed.screens.length, 2);
  assert.equal(parsed.screens[0].regions.length, 4);
  assert.equal(parsed.componentSlots.length, 4);
});

test("layout genome: exactly two screens is enforced", () => {
  const one = GENOME_JSON();
  one.screens = one.screens.slice(0, 1);
  assert.throws(() => layoutGenomeSchema.parse(one), /screens/i);

  const three = GENOME_JSON();
  three.screens = [...three.screens, { ...three.screens[0], id: "extra" }];
  assert.throws(() => layoutGenomeSchema.parse(three), /screens/i);
});

test("layout genome: region count is 3..6 per screen", () => {
  const tooFew = GENOME_JSON();
  tooFew.screens[0].regions = tooFew.screens[0].regions.slice(0, 2);
  assert.throws(() => layoutGenomeSchema.parse(tooFew));

  const tooMany = GENOME_JSON();
  const extra = { block: "stats", variant: "scoreboard", surface: "soft-wash" };
  tooMany.screens[0].regions = [...tooMany.screens[0].regions, extra, extra, extra, extra];
  assert.throws(() => layoutGenomeSchema.parse(tooMany));
});

test("layout genome: componentSlots are 4..6 PascalCase", () => {
  const bad = GENOME_JSON();
  bad.componentSlots = bad.componentSlots.slice(0, 2);
  assert.throws(() => layoutGenomeSchema.parse(bad));

  const camel = GENOME_JSON();
  camel.componentSlots[0].name = "insightPanel";
  assert.throws(() => layoutGenomeSchema.parse(camel));
});

test("layout genome: content strings are bounded (genome stays small)", () => {
  const verbose = GENOME_JSON();
  verbose.screens[0].regions[0].content = "x".repeat(81);
  assert.throws(() => layoutGenomeSchema.parse(verbose));
});

// ── Mode-scoped vocabulary (the core wireframe-quality fix) ───────────────

test("vocabulary: hero and search exist ONLY for browse/transact", () => {
  for (const mode of MODES) {
    const blocks = legalBlocksForMode(mode);
    if (mode === "browse" || mode === "transact") {
      assert.ok(blocks.has("hero"), `${mode} must offer hero`);
      assert.ok(blocks.has("search"), `${mode} must offer search`);
    } else {
      assert.ok(!blocks.has("hero"), `${mode} must NOT offer hero`);
      assert.ok(!blocks.has("search"), `${mode} must NOT offer search`);
    }
  }
});

test("vocabulary: every mode offers stats/scoreboard and a custom slot", () => {
  for (const mode of MODES) {
    const blocks = legalBlocksForMode(mode);
    assert.ok(blocks.has("stats"), `${mode} offers stats`);
    assert.ok(blocks.has("custom"), `${mode} offers the custom product slot`);
  }
});

test("vocabulary: social opens with a feed, not a scoreboard-led dashboard", () => {
  const socialHome = MODE_VOCABULARY.social.home;
  assert.equal(socialHome[0].block, "list");
  assert.ok(socialHome[0].note.includes("dominant moment"));
});

test("vocabulary: the prompt JSON enum never contains illegal blocks for the mode", () => {
  for (const mode of MODES) {
    const text = buildModeVocabulary(mode);
    const legal = legalBlocksForMode(mode);
    // Every block the prompt offers must be in the legal set, and the
    // dominant-moment/hero guidance must be present where the block is absent.
    if (mode !== "browse" && mode !== "transact") {
      assert.ok(!text.includes('"hero"'), `${mode} prompt must not contain hero`);
      assert.ok(!text.includes('"search"'), `${mode} prompt must not contain search`);
    }
    for (const block of legal) {
      assert.ok(text.includes(`"${block}"`), `${mode} prompt offers ${block}`);
    }
    assert.ok(text.includes("Exactly ONE dominant moment"), "one-dominant-moment rule present");
  }
});

test("vocabulary: a track-mode genome with a hero block fails schema via the enum", () => {
  // The schema itself is block-agnostic (the enum is the constraint), so the
  // enforcement happens in the vocabulary + enforcement layer. Simulate the
  // full path: a hero region in a track genome must be rejected by
  // genomeToWireframe's enforcement, not silently accepted.
  const track = GENOME_JSON({ mode: "track" });
  track.screens[0].regions.unshift({ block: "hero", variant: "app", surface: "tonal-band", emphasis: true });
  const derived = genomeToWireframe(track, brief("track"));
  const heroLeft = derived.wireframe.screens.flatMap((s) => s.blocks).filter((b) => b.block === "hero");
  assert.equal(heroLeft.length, 0, "hero must be stripped from a track-mode wireframe");
});

// ── Mode classification runs before the layout call ───────────────────────

test("classifyGenomeMode: deterministic classification first", () => {
  const b = brief(undefined, "Marketplace for vacation rentals");
  b.description = "Discover and compare rental listings with filters and photos";
  assert.equal(classifyGenomeMode(b), "browse");

  const track = brief(undefined, "Habit tracker");
  track.description = "Log daily habits and monitor streaks";
  assert.equal(classifyGenomeMode(track), "track");
});

test("classifyMode agrees with the seven-mode enum", () => {
  for (const m of MODES) {
    const text = `a ${m} product`;
    const got = classifyMode(text);
    assert.ok(MODES.includes(got as any), `${text} → ${got}`);
  }
});

// ── Deterministic defaults ────────────────────────────────────────────────

test("defaultGenome: every mode produces a schema-valid genome", () => {
  for (const mode of MODES) {
    const genome = defaultGenome(mode, brief(mode));
    const parsed = layoutGenomeSchema.parse(genome);
    assert.equal(parsed.mode, mode);
    const blocks = parsed.screens.flatMap((s) => s.regions.map((r) => r.block));
    for (const block of blocks) {
      assert.ok(legalBlocksForMode(mode).has(block), `${mode} default never uses illegal block ${block}`);
    }
  }
});

test("defaultGenome: browse/transact defaults are hero-led; others are dashboard-led", () => {
  for (const mode of ["browse", "transact"] as const) {
    const g = defaultGenome(mode, brief(mode));
    assert.equal(g.screens[0].regions[0].block, "hero");
  }
  for (const mode of ["track", "create", "operate", "learn"] as const) {
    const g = defaultGenome(mode, brief(mode));
    assert.equal(g.screens[0].regions[0].block, "stats");
    assert.ok(g.screens[0].regions[0].emphasis);
  }
});

// ── Genome → wireframe derivation (placement solver input) ────────────────

test("genomeToWireframe: regions become blocks; mounted slots + shell become the inventory", () => {
  const g = GENOME_JSON();
  const derived = genomeToWireframe(g, brief("track"));
  assert.equal(derived.wireframe.screens.length, 2);
  assert.equal(derived.wireframe.screens[0].blocks.length, g.screens[0].regions.length);
  // Enforcement keeps only the slots actually mounted by a custom region;
  // the unmounted HistoryStrip/GoalProgress slots are dropped, never built.
  const names = derived.inventory.components.map((c) => c.name);
  for (const mounted of ["InsightPanel", "SummaryBar"]) {
    assert.ok(names.includes(mounted), `${mounted} stays (mounted by a region)`);
  }
  assert.ok(!names.includes("HistoryStrip"), "unmounted slot is dropped");
  assert.ok(!names.includes("GoalProgress"), "unmounted slot is dropped");
});

test("genomeToWireframe: pair hints produce two-up rows and skip the dominant moment", () => {
  const g = GENOME_JSON();
  const derived = genomeToWireframe(g, brief("track"));
  const homeUx = derived.ux.screens.find((s) => s.screenId === "home")!;
  const paired = homeUx.layout.sections.filter((s) => s.pair);
  assert.equal(paired.length, 2, "chart+list paired");
  const dominant = homeUx.layout.sections.find((s) => s.emphasis);
  assert.ok(dominant && !dominant.pair, "dominant moment is never paired");
  assert.ok(paired.some((s) => s.block === "chart") && paired.some((s) => s.block === "list"));
});

test("defaultGenome: pair hints never involve the dominant block", () => {
  for (const mode of MODES) {
    const g = defaultGenome(mode, brief(mode));
    for (const screen of g.screens) {
      const dominantBlock = screen.regions.find((r) => r.emphasis)?.block;
      for (const [a, b] of screen.pairHints ?? []) {
        assert.notEqual(a, dominantBlock, `${mode} ${screen.id}: paired block ${a} is the dominant moment`);
        assert.notEqual(b, dominantBlock, `${mode} ${screen.id}: paired block ${b} is the dominant moment`);
      }
    }
  }
});

test("genomeToWireframe: shell components are added once and only if missing", () => {
  const g = GENOME_JSON();
  const derived = genomeToWireframe(g, brief("track"));
  const names = derived.inventory.components.map((c) => c.name);
  for (const shell of ["Topbar", "Sidebar", "Button", "Avatar", "Badge", "Input", "Select", "Separator"]) {
    assert.ok(names.includes(shell), `shell ${shell} present`);
  }
  const again = withShellComponents(derived.inventory);
  assert.equal(again.components.length, derived.inventory.components.length, "idempotent");
});

test("genomeToWireframe: pair hints produce two-up rows and skip the dominant moment", () => {
  const g = GENOME_JSON();
  const derived = genomeToWireframe(g, brief("track"));
  const homeUx = derived.ux.screens.find((s) => s.screenId === "home")!;
  const paired = homeUx.layout.sections.filter((s) => s.pair);
  assert.equal(paired.length, 2, "chart+list paired");
  const dominant = homeUx.layout.sections.find((s) => s.emphasis);
  assert.ok(dominant && !dominant.pair, "dominant moment is never paired");
  assert.ok(paired.some((s) => s.block === "chart") && paired.some((s) => s.block === "list"));
});

test("genomeToWireframe: exactly one dominant moment per screen survives enforcement", () => {
  const g = GENOME_JSON();
  const derived = genomeToWireframe(g, brief("track"));
  for (const screen of derived.wireframe.screens) {
    const dominant = screen.blocks.filter((b) => b.emphasis);
    assert.equal(dominant.length, 1, `${screen.id} has one dominant region`);
  }
});

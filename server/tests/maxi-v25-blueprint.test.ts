import test from "node:test";
import assert from "node:assert/strict";

import { blueprintSchema, type DesignBlueprint } from "../lib/maxi-agent/lib/blueprint";
import {
  conceptDivergence,
  deriveBlueprint,
  expandTokens,
  fallbackBlueprint,
  lintManifest,
  resolveChosenConcept,
  SIBLING_THRESHOLD,
} from "../lib/maxi-agent/lib/blueprint-derive";
import { loadCompany } from "../lib/maxi-agent/knowledge/index";
import { designTokensSchema } from "../lib/maxi-agent/schemas";
import { contrastRatio } from "../lib/maxi-agent/lib/colors";
import type { Concept, ManifestComponent } from "../lib/maxi-agent/lib/blueprint";

/**
 * Maxi Agent v25 — the blueprint contract + deterministic derive pass.
 *
 * Wave 0 is ONE model call; everything after it is deterministic. These
 * tests pin that determinism: schema shape, WCAG repair, the sibling
 * veto, token expansion, manifest lint, and the fallback blueprint.
 * Zero model calls.
 */

// ── Fixtures ───────────────────────────────────────────────────────────────

const concept = (over: Partial<Concept> = {}): Concept => ({
  name: "Ledger Brutalist",
  thesis: "Financial data deserves the gravity of print: hairline rules, tabular numerals, and one ink color doing all the talking. No cards, no shadows — just the ledger.",
  palette: {
    background: "#FAFAF7",
    foreground: "#1A1A17",
    card: "#FFFFFF",
    primary: "#1F3A8F",
    primaryForeground: "#FFFFFF",
    accent: "#B45309",
    accentForeground: "#FFFFFF",
    muted: "#EEEDE8",
    mutedForeground: "#57534E",
    border: "#D6D3CC",
    ring: "#1F3A8F",
  },
  fonts: { display: "Space Grotesk", body: "IBM Plex Sans" },
  density: "compact",
  cornerLanguage: "sharp",
  motion: "still",
  signatureMoves: ["hairline dividers instead of cards", "tabular numerals at display scale"],
  ...over,
});

const SOFT_CANYON = concept({
  name: "Soft Canyon",
  thesis: "Warm, editorial calm: terracotta earth tones, generous air, and rounded canyon contours that make data feel inviting rather than institutional.",
  palette: {
    background: "#FFF9F4",
    foreground: "#3B2417",
    card: "#FFFDFA",
    primary: "#C2410C",
    primaryForeground: "#FFFFFF",
    accent: "#0F766E",
    accentForeground: "#FFFFFF",
    muted: "#F5E8DD",
    mutedForeground: "#7C5A46",
    border: "#E7D5C5",
    ring: "#C2410C",
  },
  fonts: { display: "Sora", body: "Manrope" },
  density: "airy",
  cornerLanguage: "pill",
  motion: "lively",
  signatureMoves: ["oversized rounded stat bands", "terracotta section washes"],
});

const NIGHT_TRANSIT = concept({
  name: "Night Transit",
  thesis: "A dark transit-control aesthetic: signal green on midnight blue, mono-spaced precision, and the calm of a well-run control room after dark.",
  palette: {
    background: "#0B1220",
    foreground: "#E6EDF7",
    card: "#111A2C",
    primary: "#5EEAD4",
    primaryForeground: "#06251E",
    accent: "#FBBF24",
    accentForeground: "#1F1602",
    muted: "#1B2740",
    mutedForeground: "#9DB0CC",
    border: "#24344F",
    ring: "#5EEAD4",
  },
  fonts: { display: "Archivo", body: "DM Sans" },
  density: "balanced",
  cornerLanguage: "soft",
  motion: "subtle",
  signatureMoves: ["signal-green data ink only", "mono numerals in status strips"],
});

const SCREENS = [
  { id: "home", intent: "The coach's cockpit: today's readiness at display scale, the week's load, and the full recent-activities list.", nav: "sidebar" as const, dominantMoment: "The readiness score as a display-scale tabular numeral" },
  { id: "detail", intent: "One focused session: the lap-by-lap split table, the coach notes, and the actions that apply to this session.", nav: "sidebar" as const, dominantMoment: "The session title with its pace badge" },
];

const MANIFEST: ManifestComponent[] = [
  { name: "Button", kind: "primitive", props: [{ name: "label", type: "string", required: true }, { name: "size", type: "string", required: false }], intent: "Squared action control with the ink weight of a ledger stamp.", usedBy: ["home", "detail"] },
  { name: "Badge", kind: "primitive", props: [{ name: "label", type: "string", required: true }], intent: "A hairline status chip in the ledger's ink.", usedBy: ["home", "detail"] },
  { name: "Input", kind: "primitive", props: [{ name: "label", type: "string", required: true }, { name: "value", type: "string", required: false }], intent: "A ruled-line field with a visible label above it.", usedBy: ["detail"] },
  { name: "MetricCard", kind: "component", props: [{ name: "label", type: "string", required: true }, { name: "value", type: "string", required: true }, { name: "unit", type: "string", required: false }], intent: "One metric, hairline-ruled, tabular numeral display.", usedBy: ["home"] },
  { name: "ActivityList", kind: "component", props: [{ name: "rows", type: "array", required: true }], intent: "Divided ledger rows — no card wrapper.", usedBy: ["home"] },
  { name: "SplitTable", kind: "component", props: [{ name: "rows", type: "array", required: true }, { name: "title", type: "string", required: true }], intent: "Lap splits as ruled table rows.", usedBy: ["detail"] },
];

const DATA_SCHEMA = {
  units: ["km", "min", "%"],
  currency: "USD",
  dateRange: { start: "2026-07-20", end: "2026-08-18" },
  people: [{ name: "Avery Quinn", role: "Head coach" }],
  metrics: [
    { label: "Weekly volume", value: "42.8", unit: "km", delta: 12, positive: true },
    { label: "Avg pace", value: "5:04", unit: "min", delta: -3, positive: false },
    { label: "Readiness", value: "86", unit: "%", delta: 4, positive: true },
  ],
  list: {
    name: "Sessions",
    rows: [
      { title: "Riverside Tempo", subtitle: "6 × 1km at threshold", meta: "8.2 km", status: "Completed", amount: "$0" },
      { title: "Dawn Long Run", subtitle: "Zone 2 endurance", meta: "16.1 km", status: "Planned", amount: "$0" },
    ],
  },
  detail: {
    title: "Riverside Tempo",
    fields: [
      { label: "Distance", value: "8.2 km" },
      { label: "Pace", value: "5:04 min" },
      { label: "Status", value: "Completed" },
      { label: "Coach", value: "Avery Quinn" },
    ],
  },
  activity: [
    { actor: "Avery Quinn", action: "logged", target: "Riverside Tempo", time: "2h ago" },
    { actor: "Avery Quinn", action: "annotated", target: "Dawn Long Run", time: "1d ago" },
    { actor: "Avery Quinn", action: "planned", target: "Track Session", time: "3d ago" },
  ],
};

export function blueprintFixture(over: Partial<DesignBlueprint> = {}): DesignBlueprint {
  return {
    version: "25.0.0",
    brief: {
      title: "PaceLedger",
      productType: "running analytics app",
      mode: "track",
      description: "A running tracker that turns every session into a ledger entry with coach-grade metrics.",
      audience: "Competitive runners and their coaches",
      copyDirection: "Precise, numeric, quietly confident — a coach's notebook, not a pep rally.",
      inspiration: { primary: "stripe" },
    },
    concepts: [concept(), SOFT_CANYON, NIGHT_TRANSIT],
    chosenConcept: 0,
    screens: SCREENS,
    componentManifest: MANIFEST,
    dataSchema: DATA_SCHEMA,
    ...over,
  };
}

async function hintManifest() {
  const manifest = await loadCompany("stripe");
  assert.ok(manifest, "stripe manifest loads from the knowledge base");
  return manifest;
}

// ── Schema ─────────────────────────────────────────────────────────────────

test("blueprint schema: the fixture parses", () => {
  const bp = blueprintSchema.parse(blueprintFixture());
  assert.equal(bp.concepts.length, 3);
  assert.equal(bp.screens.length, 2);
  assert.equal(bp.componentManifest.length, 6);
});

test("blueprint schema: structural violations are rejected", () => {
  assert.throws(() => blueprintSchema.parse(blueprintFixture({ concepts: [concept()] })), /concepts/);
  assert.throws(() => blueprintSchema.parse(blueprintFixture({ screens: [...SCREENS, SCREENS[0]!] })), /unique/);
  assert.throws(() =>
    blueprintSchema.parse(
      blueprintFixture({ componentManifest: [...MANIFEST, { ...MANIFEST[0]!, name: "MetricCard" }] }),
    ), /unique/);
  assert.throws(() =>
    blueprintSchema.parse(
      blueprintFixture({ componentManifest: [...MANIFEST, { name: "Orphan", kind: "component", props: [], intent: "no screen mounts this", usedBy: ["settings"] }] }),
    ), /unknown screen/);
  assert.throws(() =>
    blueprintSchema.parse(
      blueprintFixture({ screens: [...SCREENS, { id: "settings", intent: "A settings screen with nothing product-specific to render here at all", nav: "none", dominantMoment: "A settings header" }] }),
    ), /mounts no manifest component/);
});

// ── WCAG repair ────────────────────────────────────────────────────────────

test("derive: a low-contrast concept palette is repaired to WCAG AA", async () => {
  const manifest = await hintManifest();
  const lowContrast = concept({
    palette: {
      ...concept().palette,
      mutedForeground: "#B9B7B2", // ~2:1 on the light background — must be repaired
    },
  });
  const derivation = deriveBlueprint(
    blueprintFixture({ concepts: [lowContrast, SOFT_CANYON, NIGHT_TRANSIT], chosenConcept: 0 }),
    manifest,
  );
  const repaired = derivation.concept.palette.mutedForeground;
  assert.ok(
    contrastRatio(repaired, derivation.concept.palette.background) >= 4.5,
    `mutedForeground repaired to AA (got ${repaired})`,
  );
  assert.ok(derivation.notes.some((n) => n.includes("contrast repaired")));
});

// ── Divergence veto ────────────────────────────────────────────────────────

test("divergence: distinct concepts score above the sibling threshold", () => {
  assert.ok(conceptDivergence(concept(), SOFT_CANYON) >= SIBLING_THRESHOLD);
  assert.ok(conceptDivergence(concept(), NIGHT_TRANSIT) >= SIBLING_THRESHOLD);
  assert.ok(conceptDivergence(SOFT_CANYON, NIGHT_TRANSIT) >= SIBLING_THRESHOLD);
});

test("divergence: a sibling of the chosen concept is vetoed", () => {
  const sibling = concept({
    name: "Ledger Brutalist II",
    palette: { ...concept().palette, primary: "#22429E" }, // ~same hue
  });
  const notes: string[] = [];
  const chosen = resolveChosenConcept([concept(), sibling, NIGHT_TRANSIT], 0, notes);
  assert.equal(chosen, 2, "the distinct NIGHT_TRANSIT concept wins");
  assert.ok(notes.some((n) => n.includes("veto")), "the veto is explained in the notes");
});

test("divergence: a genuinely distinct pick is honored", () => {
  const notes: string[] = [];
  const chosen = resolveChosenConcept([concept(), SOFT_CANYON, NIGHT_TRANSIT], 1, notes);
  assert.equal(chosen, 1);
  assert.equal(notes.length, 0);
});

// ── Token expansion ────────────────────────────────────────────────────────

test("expand: the concept palette grows into a valid full token system", () => {
  const tokens = expandTokens(SOFT_CANYON);
  designTokensSchema.parse(tokens); // throws if any color/scale is invalid
  assert.equal(Object.keys(tokens.colors).length, 24, "all 23 named colors + chart");
  assert.deepEqual(
    [tokens.radius.sm, tokens.radius.md, tokens.radius.lg, tokens.radius.xl],
    [14, 20, 28, 36],
    "pill corners get the pill radius ladder",
  );
  assert.equal(tokens.sectionPaddingY, 72, "airy density gets the airy rhythm");
  assert.equal(tokens.mode, "light");
  assert.ok(tokens.colors.chart.length >= 3);
});

test("expand: dark backgrounds flip the mode", () => {
  const tokens = expandTokens(NIGHT_TRANSIT);
  assert.equal(tokens.mode, "dark");
});

// ── Manifest lint ──────────────────────────────────────────────────────────

test("lint: duplicate names drop, unknown usedBy drops, the Button floor applies", () => {
  const notes: string[] = [];
  const linted = lintManifest(
    [
      ...MANIFEST.slice(1), // no Button
      { ...MANIFEST[0]!, name: "MetricCard" }, // duplicate of an existing name
      { name: "lowercase", kind: "component", props: [], intent: "bad identifier", usedBy: ["home"] },
      { name: "Ghost", kind: "component", props: [], intent: "mounted by a screen that does not exist", usedBy: ["nowhere"] },
    ],
    ["home", "detail"],
    notes,
  );
  const names = linted.map((c) => c.name);
  assert.ok(names.includes("Button"), "Button added by the floor");
  assert.ok(!names.includes("lowercase"));
  assert.ok(!names.includes("Ghost"));
  assert.equal(names.filter((n) => n === "MetricCard").length, 1, "dupes collapse");
  assert.ok(notes.some((n) => n.includes("Button primitive added")));
});

// ── The derive entry point ─────────────────────────────────────────────────

test("derive: the full pass yields a theme + a clean blueprint", async () => {
  const manifest = await hintManifest();
  const derivation = deriveBlueprint(blueprintFixture(), manifest);
  assert.equal(derivation.blueprint.chosenConcept, 0);
  assert.ok(derivation.theme.cssVars["--primary"]);
  assert.ok(derivation.theme.cssVars["--font-display"].includes("Space Grotesk"));
  assert.equal(derivation.blueprint.componentManifest.length, 6);
  designTokensSchema.parse(derivation.tokens);
});

// ── Fallback blueprint ─────────────────────────────────────────────────────

test("fallback: a total Direction failure still produces a valid blueprint", async () => {
  const manifest = await hintManifest();
  const derivation = fallbackBlueprint("A running tracker for competitive runners", manifest, "stripe");
  const bp = blueprintSchema.parse(derivation.blueprint);
  assert.equal(bp.screens.length, 2);
  assert.ok(bp.componentManifest.some((c) => c.name === "Button"));
  designTokensSchema.parse(derivation.tokens);
  assert.ok(derivation.notes.some((n) => n.includes("fallback")));
});

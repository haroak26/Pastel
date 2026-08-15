import test from "node:test";
import assert from "node:assert/strict";

import { validateDomainContract, enforceDomainContract, briefDateRange, briefDeclaredUnits } from "../lib/maxi-agent/lib/domain-contract";
import type { ProductBrief } from "../lib/maxi-agent/schemas";
import type { MockDataset } from "../lib/maxi-agent/lib/content";

/**
 * Maxi Agent v24 — domain-contract regression (v23 issues #32-#34).
 *
 * #32: home/detail shipped strength-training units ('Weekly volume' in
 *      'sets', 'Next PR' in 'lb') in a running app.
 * #33: workout rows omitted the planned table fields 'Structure'/'Status'.
 * #34: rows mixed 'Today'/'Yesterday' with June 8-10 dates while the
 *      supplied dataset was August 4-12, 2026.
 *
 * All three must fail at the Wave-1/pre-build contract check now — never
 * surface only in the review verdict.
 */

const BRIEF = (over: Partial<ProductBrief> = {}): ProductBrief => ({
  version: "1.0.0",
  title: "RunPulse",
  productType: "fitness tracking app",
  mode: "track",
  description: "A fitness tracking app that logs runs: today's workout, weekly distance, pace trends, and run history with splits.",
  audience: { primary: "runners", needs: ["logs", "trends"] },
  goals: ["log runs", "track trends"],
  features: [{ name: "run log", description: "log every run", priority: "critical" }],
  platform: "all",
  screenPurposes: [
    { id: "home", purpose: "today's workout and weekly progress — the primary workflow" },
    { id: "detail", purpose: "one run's splits and effort — the focused record view" },
  ],
  designLanguage: "energetic minimal",
  inspiration: { primary: "nike", secondary: [] },
  ...over,
});

const BASE_DATA: MockDataset = {
  seed: 1,
  domain: "fitness",
  people: [{ name: "Ava", role: "Runner", email: "ava@example.com", initials: "A", hue: 0 }],
  metrics: [
    { label: "Weekly distance", unit: "km", value: "42.8", delta: 8, positive: true, note: "new personal best", spark: [1, 2, 3, 4] },
    { label: "Avg pace", unit: "min/km", value: "5:12", delta: -2, positive: true, note: "faster", spark: [1, 2, 3, 4] },
    { label: "Streak", unit: "days", value: "14", delta: 1, positive: true, note: "keep it going", spark: [1, 2, 3, 4] },
    { label: "Calories", unit: "kcal", value: "1,240", delta: 5, positive: true, note: "solid week", spark: [1, 2, 3, 4] },
  ],
  series: [{ label: "Weekly distance", unit: "km", points: [{ x: "W1", y: 30 }, { x: "W2", y: 35 }] }],
  rows: [
    { id: "r1", name: "Riverside Tempo", detail: "Tempo run", amount: "10.2 km", status: "complete", date: "Aug 4, 2026", owner: "Ava" },
    { id: "r2", name: "Recovery jog", detail: "Easy run", amount: "6.4 km", status: "complete", date: "Aug 12, 2026", owner: "Ava" },
  ],
  activity: ["Ran 10.2 km tempo"],
  detailFields: ["Distance", "Pace", "Splits"],
  detailValues: ["10.2 km", "5:02", "5:01 / 5:03"],
  settingsSections: [{ title: "Goals", items: [{ label: "Weekly target", value: "40 km", control: "text" }] }],
  searchPlaceholder: "Search runs",
  emptyTitle: "No runs yet",
  emptyBody: "Log your first run to start building history.",
  reviews: [{ name: "Ava", initials: "A", hue: 0, rating: 5, text: "Great app." }],
  reviewHeading: "What people say",
  trustItems: ["Private by default"],
  primaryCta: "Start run",
  homeCta: "Log a run",
};

const V23_BRIEF = BRIEF({
  description: "A fitness tracking app that logs runs: today's workout, weekly distance, pace trends, and run history with splits. The supplied dataset covers August 4–12, 2026.",
});

test("domain contract: v23 #32 — strength units in a running app fail pre-build", () => {
  const data: MockDataset = {
    ...BASE_DATA,
    metrics: [
      { label: "Weekly volume", unit: "sets", value: "18", delta: 5, positive: true, note: "volume up", spark: [1, 2, 3, 4] },
      { label: "Next PR", unit: "lb", value: "185", delta: 5, positive: true, note: "heavy week", spark: [1, 2, 3, 4] },
      { label: "Readiness", unit: "%", value: "82", delta: 2, positive: true, note: "recovered", spark: [1, 2, 3, 4] },
      { label: "Streak", unit: "days", value: "14", delta: 1, positive: true, note: "keep it going", spark: [1, 2, 3, 4] },
    ],
  };
  const violations = validateDomainContract({ brief: BRIEF(), domain: "fitness", data, copy: null });
  const unit = violations.filter((v) => v.field.startsWith("metrics"));
  assert.ok(unit.length >= 2, `strength units flagged (${unit.map((v) => v.message).join("; ")})`);
  assert.ok(unit.some((v) => /"sets"/.test(v.message)), "sets named");
  assert.ok(unit.some((v) => /"lb"/.test(v.message)), "lb named");
});

test("domain contract: v23 #33 — table columns rows cannot populate fail pre-build", () => {
  const data: MockDataset = {
    ...BASE_DATA,
    rows: BASE_DATA.rows.map((r) => ({ ...r, status: "", fields: undefined })),
  };
  const copy = {
    productTitle: "RunPulse",
    screens: [{ screenId: "home", headline: "Home", tableColumns: ["Name", "Detail", "Value", "Status", "Date", "Structure"] }],
  };
  const violations = validateDomainContract({ brief: BRIEF(), domain: "fitness", data, copy: copy as never });
  const table = violations.filter((v) => v.field.startsWith("tableColumns"));
  assert.ok(table.some((v) => /"Status"/.test(v.message)), "unfillable Status column flagged");
  assert.ok(table.some((v) => /"Structure"/.test(v.message)), "unfillable Structure column flagged");
});

test("domain contract: v23 #34 — stale dates outside the brief's dataset range fail", () => {
  const data: MockDataset = {
    ...BASE_DATA,
    rows: [
      { id: "r1", name: "Riverside Tempo", detail: "Tempo run", amount: "10.2 km", status: "complete", date: "Today", owner: "Ava" },
      { id: "r2", name: "Recovery jog", detail: "Easy run", amount: "6.4 km", status: "complete", date: "Yesterday", owner: "Ava" },
      { id: "r3", name: "Old run", detail: "Long run", amount: "18 km", status: "complete", date: "Jun 8, 2026", owner: "Ava" },
      { id: "r4", name: "Older run", detail: "Long run", amount: "20 km", status: "complete", date: "Jun 10, 2026", owner: "Ava" },
    ],
  };
  assert.deepEqual(briefDateRange(V23_BRIEF), { month: 8, dayStart: 4, dayEnd: 12, year: 2026, raw: "August 4–12, 2026" });
  const violations = validateDomainContract({ brief: V23_BRIEF, domain: "fitness", data, copy: null });
  const dates = violations.filter((v) => /date/i.test(v.message));
  assert.equal(dates.length, 2, `June rows flagged against the August dataset (${dates.map((v) => v.message).join("; ")})`);
});

test("domain contract: clean content passes", () => {
  const violations = validateDomainContract({ brief: BRIEF(), domain: "fitness", data: BASE_DATA, copy: null });
  assert.deepEqual(violations, []);
});

test("domain contract: in-range dates pass; the deterministic repair remaps out-of-range dates", () => {
  const ok = validateDomainContract({ brief: V23_BRIEF, domain: "fitness", data: BASE_DATA, copy: null });
  assert.deepEqual(ok, [], "Aug 4/Aug 12 rows are inside August 4–12, 2026");

  const data: MockDataset = {
    ...BASE_DATA,
    rows: [{ ...BASE_DATA.rows[0]!, date: "Jun 9, 2026" }],
  };
  const { data: repaired, notes } = enforceDomainContract({ brief: V23_BRIEF, domain: "fitness", data, copy: null });
  assert.ok(notes.some((n) => /dates remapped/.test(n)), "repair note present");
  assert.deepEqual(
    validateDomainContract({ brief: V23_BRIEF, domain: "fitness", data: repaired, copy: null }),
    [],
    "repaired dates are inside the declared range",
  );
});

test("domain contract: unfillable table columns are dropped deterministically", () => {
  const data: MockDataset = {
    ...BASE_DATA,
    rows: BASE_DATA.rows.map((r) => ({ ...r, status: "", fields: undefined })),
  };
  const copy = {
    productTitle: "RunPulse",
    screens: [
      { screenId: "home", headline: "Home", tableColumns: ["Name", "Detail", "Value", "Status", "Date", "Structure"] },
      { screenId: "detail", headline: "Detail", tableColumns: ["Name", "Value", "Date"] },
    ],
  };
  const { copy: repaired, notes } = enforceDomainContract({ brief: BRIEF(), domain: "fitness", data, copy: copy as never, seed: "test" });
  const home = (repaired as never as { screens: Array<{ tableColumns?: string[] }> }).screens[0];
  assert.ok(!home.tableColumns!.includes("Status"), "Status column dropped");
  assert.ok(!home.tableColumns!.includes("Structure"), "Structure column dropped");
  assert.ok(home.tableColumns!.includes("Name"), "fillable columns kept");
  assert.ok(notes.some((n) => /dropped table column/.test(n)), "drop is named in the notes");
});

test("domain contract: unit violations trigger deterministic domain-pack regeneration", () => {
  const data: MockDataset = {
    ...BASE_DATA,
    metrics: [
      { label: "Weekly volume", unit: "sets", value: "18", delta: 5, positive: true, note: "volume up", spark: [1, 2, 3, 4] },
      { label: "Next PR", unit: "lb", value: "185", delta: 5, positive: true, note: "heavy week", spark: [1, 2, 3, 4] },
      { label: "Readiness", unit: "%", value: "82", delta: 2, positive: true, note: "recovered", spark: [1, 2, 3, 4] },
      { label: "Streak", unit: "days", value: "14", delta: 1, positive: true, note: "keep it going", spark: [1, 2, 3, 4] },
    ],
  };
  const { data: repaired, notes } = enforceDomainContract({ brief: BRIEF(), domain: "fitness", data, copy: null, seed: "test" });
  assert.ok(notes.some((n) => /domain-pack content/.test(n)), "regeneration named");
  assert.deepEqual(validateDomainContract({ brief: BRIEF(), domain: "fitness", data: repaired, copy: null }), []);
});

test("domain contract: brief-declared units are honored", () => {
  assert.ok(briefDeclaredUnits(BRIEF()).has("pace"), "brief mentions pace");
  assert.ok(briefDeclaredUnits(BRIEF()).has("distance") === false || briefDeclaredUnits(BRIEF()).size >= 1, "unit tokens extracted");
  assert.ok(!briefDeclaredUnits(BRIEF()).has("sets"), "strength unit not declared by a running brief");
});

test("domain contract: the deterministic fallback for a running brief never ships strength units", async () => {
  const { mockDataset } = await import("../lib/maxi-agent/lib/content");
  const data = mockDataset(BRIEF(), "running-fallback-test");
  const violations = validateDomainContract({ brief: BRIEF(), domain: "fitness", data, copy: null });
  assert.deepEqual(violations, [], `running fallback is contract-clean (${violations.map((v) => v.message).join("; ")})`);
  const units = data.metrics.map((m) => m.unit);
  assert.ok(!units.some((u) => u === "sets" || u === "lb"), `fallback units are running vocabulary (${units.join(", ")})`);
});

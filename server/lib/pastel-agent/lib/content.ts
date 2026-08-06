/**
 * Deterministic mock-content generator — Pastel v7 (domain-aware).
 *
 * v6 fed every screen from a SaaS/B2B generator (companies, MRR, invoices,
 * "deployed to production"), so a fitness app shipped with "Aperture AI" and
 * "$22,091" invoices. v7 selects a DOMAIN PACK from the brief (fitness,
 * ecommerce, media, social, productivity, travel, finance) and generates
 * product-relevant data by construction: workouts have distances and paces,
 * shops have products and prices, music has titles and plays.
 *
 * All data derives from a seed (brief + run id hash) — reproducible across
 * runs, repair cycles, and reference rendering.
 */

import { mulberry32, hashSeed, pickDomain, domainPeople, briefText, type BriefLike } from "./domains";

export interface Person {
  name: string;
  role: string;
  email: string;
  initials: string;
  /** Hue for avatar tint (0-360). */
  hue: number;
}

export interface Metric {
  label: string;
  unit: string;
  value: string;
  delta: number;
  positive: boolean;
  note: string;
  spark: number[];
}

export interface Series {
  label: string;
  unit: string;
  points: Array<{ x: string; y: number }>;
}

export interface TableRow {
  id: string;
  name: string;
  detail: string;
  amount: string;
  status: string;
  date: string;
  owner: string;
  /** V9: per-item detail-pane values aligned with `detailFields` (coherent
   * with the row's own data — a listing can never contradict its card). */
  fields?: string[];
  /** V11: the item's own booking window + guest count (stay/travel). */
  dates?: string;
  guests?: string;
}

export interface SettingsSection {
  title: string;
  items: Array<{ label: string; value: string; control: "toggle" | "select" | "text" }>;
}

export interface MockDataset {
  seed: number;
  /** Domain pack slug that generated this data ("fitness", "ecommerce", …). */
  domain: string;
  people: Person[];
  metrics: Metric[];
  series: Series[];
  rows: TableRow[];
  activity: string[];
  detailFields: string[];
  /** Display values for the detail pane, aligned with detailFields. */
  detailValues: string[];
  settingsSections: SettingsSection[];
  searchPlaceholder: string;
  emptyTitle: string;
  emptyBody: string;
}

export { mulberry32, hashSeed, pickDomain, briefText };
export type { BriefLike };

/** Normalize a unit string for comparison: lowercase, no spaces, and "·"
 * treated the same as "/" (min·km ≡ min/km). */
export function normalizeUnit(u: string | undefined | null): string {
  return (u ?? "").toLowerCase().trim().replace(/[·]/g, "/").replace(/\s+/g, "");
}

export function mockDataset(input: string | BriefLike, seedInput?: string): MockDataset {
  const brief: BriefLike = typeof input === "string" ? { productType: "product", description: input } : input;
  const seed = hashSeed(`${seedInput ?? briefText(brief)}`);
  const rnd = mulberry32(seed);
  const pack = pickDomain(briefText(brief));

  const people = domainPeople(rnd);
  const items = pack.items(rnd);
  const owners = people.map((p) => p.name);

  const rows: TableRow[] = items.map((it, i) => ({
    id: it.id,
    name: it.name,
    detail: it.detail,
    amount: it.amount,
    status: it.status,
    date: it.date,
    owner: owners[i % owners.length],
    fields: it.fields,
    dates: it.dates,
    guests: it.guests,
  }));

  return {
    seed,
    domain: pack.slug,
    people,
    metrics: pack.metrics(rnd),
    series: pack.series(rnd),
    rows,
    activity: pack.activity(rnd),
    detailFields: pack.detailFields(),
    detailValues: pack.detailValues(rnd),
    settingsSections: pack.settingsSections(),
    searchPlaceholder: pack.searchPlaceholder(),
    emptyTitle: pack.emptyTitle(),
    emptyBody: pack.emptyBody(),
  };
}

// ── Dataset slice helpers (used by builder prompts) ──────────────────────

export function datasetPrompt(ds: MockDataset): string {
  const p = (x: Person) => `${x.name} (${x.role})`;
  const s = (x: SettingsSection) =>
    `${x.title}: ${x.items.map((i) => `${i.label} = ${i.value} [${i.control}]`).join("; ")}`;
  return [
    `PRODUCT DATA (domain pack: "${ds.domain}") — use this data to fill the component's data-driven slots (metrics, items, people, activity). NEVER invent other-domain content (no invoices, no company names, no currency) unless the product is financial/shopping.`,
    "",
    `People: ${ds.people.map(p).join("; ")}`,
    "",
    "Metrics:",
    ...ds.metrics.map((m) => `- ${m.label}: ${m.value} ${m.unit} (${m.positive ? "+" : ""}${m.delta}% ${m.note})`),
    "",
    "Time series:",
    ...ds.series.map((s2) => `- ${s2.label}: ${s2.points.slice(0, 12).map((pt) => `${pt.x}=${s2.unit}${pt.y}`).join(", ")}`),
    "",
    "Items (first 5):",
    ...ds.rows.slice(0, 5).map((r) => `- ${r.id} ${r.name} (${r.detail}) ${r.amount} — ${r.status} — ${r.date}`),
    "",
    `Recent activity: ${ds.activity.slice(0, 5).join("; ")}`,
    "",
    `Settings sections: ${ds.settingsSections.map(s).join(" | ")}`,
  ].join("\n");
}

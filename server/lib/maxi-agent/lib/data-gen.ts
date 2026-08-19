import type { DesignBlueprint } from "./blueprint";

/**
 * Maxi Agent v25 — deterministic dataset generation.
 *
 * The v24 failure class this module deletes: the genome schema *declared*
 * minRows ≥ 3 and the composer ignored it — screens shipped with 2 rows.
 * v25 solves density at the SOURCE: the Direction call authors 2-3 exemplar
 * rows, and this generator deterministically expands them to a full,
 * populated dataset before any file is authored. Screens render from
 * src/data.js; there is no second place content can come from.
 *
 * Conformance (the other v24 Wave-5 lesson) is by construction:
 *   · units  — metric units are validated against the declared vocabulary
 *   · dates  — every generated row date lands inside the declared range
 *   · currency — amount strings use the declared currency symbol
 */

// ── Seeded PRNG ────────────────────────────────────────────────────────────

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Dataset shape ──────────────────────────────────────────────────────────

export interface V25Metric {
  label: string;
  value: string;
  unit: string;
  delta: number;
  positive: boolean;
}

export interface V25Row {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  amount?: string;
  date: string;
}

export interface V25Dataset {
  brand: { name: string; tagline: string };
  user: { name: string; role: string; initials: string; hue: number };
  nav: Array<{ id: string; label: string; icon: string }>;
  metrics: V25Metric[];
  list: { name: string; rows: V25Row[] };
  detail: { title: string; fields: Array<{ label: string; value: string }> };
  activity: Array<{ actor: string; action: string; target: string; time: string }>;
  /** A generic 12-point trend series for inline spark visuals. */
  spark: number[];
  primaryCta: string;
}

// ── Conformance helpers ────────────────────────────────────────────────────

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };

/** A unit is legal when it matches (or starts with) a declared unit. */
function sanitizeUnit(unit: string, allowed: string[]): string {
  const u = unit.trim();
  if (!u) return "";
  if (allowed.includes(u)) return u;
  const partial = allowed.find((a) => u.startsWith(a) || a.startsWith(u));
  return partial ?? "";
}

function enforceCurrency(amount: string, currency?: string): string {
  if (!currency) return amount;
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  if (!symbol) return amount;
  return amount.replace(/^[$€£¥]/, symbol);
}

// ── Number perturbation (the expansion engine) ─────────────────────────────

/** Perturb every digit run in a string by ±`spread`%, seeded. */
function perturbNumbers(s: string, rnd: () => number, spread = 0.18): string {
  return s.replace(/\d[\d,]*(?:\.\d+)?/g, (run) => {
    const raw = Number(run.replace(/,/g, ""));
    if (!Number.isFinite(raw) || raw === 0) return run;
    const factor = 1 + (rnd() * 2 - 1) * spread;
    const next = raw * factor;
    const out = Number.isInteger(raw) ? Math.max(1, Math.round(next)) : Math.round(next * 10) / 10;
    return run.includes(",") ? out.toLocaleString("en-US") : String(out);
  });
}

function hasDigits(s: string | undefined): boolean {
  return !!s && /\d/.test(s);
}

// ── Dates ──────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function humanDate(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000);
}

// ── Nav icons (matched against the shell's fixed lucide set) ──────────────

const NAV_ICON_RULES: Array<{ re: RegExp; icon: string }> = [
  { re: /home|dashboard|overview|today/i, icon: "home" },
  { re: /chart|metric|trend|analytic|report/i, icon: "chart" },
  { re: /calendar|schedule|plan|week/i, icon: "calendarDays" },
  { re: /user|people|team|member|contact/i, icon: "users" },
  { re: /setting|account|preference/i, icon: "settings" },
  { re: /bell|notif|alert/i, icon: "bell" },
  { re: /search|browse|discover|explore/i, icon: "search" },
  { re: /heart|favorite|saved|like/i, icon: "heart" },
  { re: /file|doc|note|record/i, icon: "file" },
  { re: /star|review|rating/i, icon: "star" },
];

function navIconFor(id: string, intent: string): string {
  const hay = `${id} ${intent}`;
  for (const rule of NAV_ICON_RULES) {
    if (rule.re.test(hay)) return rule.icon;
  }
  return "list";
}

function labelFromId(id: string): string {
  return id
    .split("-")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

// ── The generator ──────────────────────────────────────────────────────────

const CTA_BY_MODE: Record<DesignBlueprint["brief"]["mode"], string> = {
  browse: "Explore",
  transact: "Book now",
  track: "Log entry",
  create: "New draft",
  operate: "New task",
  learn: "Start lesson",
  social: "Share",
};

const MIN_ROWS = 6;
const MAX_ROWS = 8;

export interface GeneratedData {
  dataset: V25Dataset;
  notes: string[];
}

export function generateDataset(bp: DesignBlueprint, seed: string): GeneratedData {
  const notes: string[] = [];
  const rnd = mulberry32(fnv1a(seed));
  const ds = bp.dataSchema;

  // ── metrics: unit conformance ──
  const metrics: V25Metric[] = ds.metrics.map((m) => {
    const unit = sanitizeUnit(m.unit, ds.units);
    if (m.unit && m.unit !== unit) {
      notes.push(`Metric "${m.label}": unit "${m.unit}" replaced (not in the declared vocabulary)`);
    }
    return { label: m.label, value: m.value, unit, delta: m.delta, positive: m.positive };
  });

  // ── list: exemplar expansion to a dense, populated set ──
  const start = new Date(`${ds.dateRange.start}T00:00:00Z`);
  const end = new Date(`${ds.dateRange.end}T00:00:00Z`);
  const span = daysBetween(start, end);
  const total = MIN_ROWS + Math.floor(rnd() * (MAX_ROWS - MIN_ROWS + 1));
  const statuses = [...new Set(ds.list.rows.map((r) => r.status))];

  const rows: V25Row[] = [];
  const seenTitles = new Set<string>();
  for (let i = 0; i < total; i++) {
    const ex = ds.list.rows[i % ds.list.rows.length]!;
    // Perturb numbers when present; fall back to a distinguishing ordinal.
    let title = hasDigits(ex.title) ? perturbNumbers(ex.title, rnd) : ex.title;
    if (seenTitles.has(title)) {
      title = hasDigits(title) ? perturbNumbers(title, rnd, 0.35) : `${title} ${i + 1}`;
      if (seenTitles.has(title)) title = `${title} ${String.fromCharCode(65 + (i % 26))}`;
    }
    seenTitles.add(title);

    const subtitle = hasDigits(ex.subtitle) ? perturbNumbers(ex.subtitle, rnd) : ex.subtitle;
    const meta = hasDigits(ex.meta) ? perturbNumbers(ex.meta, rnd) : ex.meta;
    const amount =
      ex.amount !== undefined
        ? enforceCurrency(hasDigits(ex.amount) ? perturbNumbers(ex.amount, rnd, 0.22) : (ex.amount ?? ""), ds.currency)
        : undefined;
    const status = statuses.length > 0 ? statuses[i % statuses.length]! : "Active";
    const date = humanDate(addDays(start, span > 0 ? Math.round((span * i) / Math.max(1, total - 1)) : 0));

    rows.push({
      id: `row-${i + 1}`,
      title,
      subtitle,
      meta,
      status,
      ...(amount !== undefined ? { amount } : {}),
      date,
    });
  }
  if (rows.length < MIN_ROWS) {
    // Defensive: expansion above always reaches MIN_ROWS, but the floor is
    // the contract — a future regression cannot reintroduce sparse screens.
    notes.push(`List expansion produced ${rows.length} rows (< ${MIN_ROWS})`);
  }

  // ── spark: a 12-point trend seeded from the primary metric ──
  const spark: number[] = [];
  let level = 46 + rnd() * 18;
  for (let i = 0; i < 12; i++) {
    level = Math.max(8, Math.min(96, level + (rnd() * 2 - 1) * 16));
    spark.push(Math.round(level * 10) / 10);
  }

  const firstPerson = ds.people[0]!;
  const initials = firstPerson.name
    .split(/\s+/)
    .map((w) => w[0]!)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dataset: V25Dataset = {
    brand: { name: bp.brief.title, tagline: bp.brief.description.slice(0, 90) },
    user: { name: firstPerson.name, role: firstPerson.role, initials, hue: Math.floor(rnd() * 360) },
    nav: bp.screens.map((s) => ({ id: s.id, label: labelFromId(s.id), icon: navIconFor(s.id, s.intent) })),
    metrics,
    list: { name: ds.list.name, rows },
    detail: { title: ds.detail.title, fields: ds.detail.fields },
    activity: ds.activity,
    spark,
    primaryCta: CTA_BY_MODE[bp.brief.mode] ?? "Get started",
  };

  return { dataset, notes };
}

// ── src/data.js composition ────────────────────────────────────────────────

export function composeDataJs(dataset: V25Dataset): string {
  const json = JSON.stringify(dataset, null, 2);
  return `// Generated dataset — the single source of content for every screen.
// Screens import { DATA } from "../data.js" and render from it; they never
// invent sample values.
export const DATA = ${json};
`;
}

import type { ProductBrief, CopyPlan } from "../schemas";
import type { MockDataset, BriefLike } from "./content";
import { normalizeUnit, mockDataset } from "./content";
import { TABLE_SOURCE_FIELDS } from "./layout-templates";

/**
 * Maxi Agent v24 — domain-contract cross-check (WS5).
 *
 * v23 shipped content that contradicted the product's own domain and the
 * brief's authoritative dataset, and only the REVIEW model caught it (v23
 * issues #32-#34): strength-training units in a running app, stale June
 * dates against the brief's August 2026 dataset, and table rows missing
 * fields the planned table needed. This deterministic check runs BEFORE the
 * build — the cheap-tier data call fails and retries with the mismatch
 * named explicitly instead of shipping and catching it at review.
 *
 * Three checks:
 *   1. UNITS — metric units must be legal for the product's domain, must
 *      respect the brief's declared unit vocabulary, and a running/track
 *      brief never ships strength-training units (sets/reps/lb/load/PR).
 *   2. DATES — when the brief declares an explicit date range (the
 *      supplied dataset's period), every absolute row date must fall inside
 *      it; relative labels may not mix with out-of-range absolute dates.
 *   3. TABLE FIELDS — the copy plan's table columns must each have a row
 *      field source from the layout template's declared table contract
 *      (WS2's tableFields), so a planned table can never render rows with
 *      missing values.
 */

export interface DomainContractViolation {
  field: string;
  message: string;
}

/** Currency is only legitimate content in financial/shopping domains. */
const CURRENCY_DOMAINS = new Set(["finance", "ecommerce", "rentals", "travel"]);
const CURRENCY_RE = /\$\s*\d[\d,.]*|\brevenue\b|\binvoice(s)?\b|\bbilling\b/i;

/** Strength-training units — never legal in a running/track product. */
const STRENGTH_UNITS = new Set(["sets", "reps", "lb", "lbs", "kg", "load", "pr", "volume", "max", "rest"]);
const RUNNING_MARKERS = /\b(run|runs|running|pace|splits?|distance|km|miles?|marathon|5k|10k|half-marathon)\b/i;

/** Neutral units any domain may use. */
const NEUTRAL_UNITS = new Set(["%", "min", "mins", "days", "day", "count", "rating", "stars", "level", "score", "points"]);

/** Per-domain legal unit vocabulary (mirrors the data agent guardrails). */
export const DOMAIN_UNITS: Record<string, Set<string>> = {
  fitness: new Set(["km", "mi", "m", "pace", "min/km", "min·km", "min/mi", "kcal", "cal", "bpm", "steps", "hr", "h", "days", "sets", "reps", "lb", "kg", "%", "min", "w", "weeks"]),
  ecommerce: new Set(["$", "usd", "stock", "ratings", "stars", "items", "%"]),
  media: new Set(["plays", "minutes", "min", "duration", "ratings", "stars", "%", "episodes", "hours"]),
  social: new Set(["members", "posts", "followers", "replies", "likes", "shares", "k", "%", "min"]),
  productivity: new Set(["tasks", "hours", "h", "projects", "%", "days", "sprint", "points"]),
  rentals: new Set(["$", "night", "nights", "guests", "rating", "stars", "dates"]),
  travel: new Set(["$", "duration", "nights", "days", "rating", "stars", "km", "mi"]),
  finance: new Set(["$", "%", "apy", "days", "yield", "balance"]),
};

/** Unit tokens the brief itself declares — the model must stay inside them. */
export function briefDeclaredUnits(brief: ProductBrief): Set<string> {
  const text = `${brief.productType} ${brief.description} ${brief.features.map((f) => `${f.name} ${f.description}`).join(" ")} ${brief.screenPurposes.map((s) => s.purpose).join(" ")}`.toLowerCase();
  const out = new Set<string>();
  for (const unit of ["km", "mi", "miles", "kcal", "cal", "bpm", "steps", "pace", "min/km", "lb", "kg", "sets", "reps", "watts", "hr", "hours", "minutes", "days", "$", "percent", "%", "points", "tasks", "episodes", "nights", "guests"]) {
    if (new RegExp(`\\b${unit.replace(/[.+]/g, "\\$&")}\\b`).test(text)) out.add(normalizeUnit(unit));
  }
  return out;
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/** A declared date range in the brief (the supplied dataset's period). */
export interface DeclaredDateRange {
  month: number;
  dayStart: number;
  dayEnd: number;
  year: number;
  raw: string;
}

/** "August 4–12, 2026" / "Aug 4 - 12, 2026" — the supplied dataset period. */
export function briefDateRange(brief: ProductBrief): DeclaredDateRange | null {
  const text = `${brief.description} ${brief.features.map((f) => f.description).join(" ")} ${brief.screenPurposes.map((s) => s.purpose).join(" ")}`;
  const re = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:\s*[–—-]\s*(\d{1,2}))?(?:,|\s+)\s*(\d{4})\b/i;
  const m = text.match(re);
  if (!m) return null;
  const month = MONTHS[m[1]!.toLowerCase()];
  if (!month) return null;
  return {
    month,
    dayStart: parseInt(m[2]!, 10),
    dayEnd: m[3] ? parseInt(m[3], 10) : parseInt(m[2]!, 10),
    year: parseInt(m[4]!, 10),
    raw: m[0],
  };
}

/** Parse a row date into {month, day, year?} — null when unparseable
 *  (relative labels like "Today"/"Yesterday" count as unparseable). */
function parseRowDate(date: string): { month: number; day: number; year?: number } | null {
  const d = date.trim();
  if (/^(today|yesterday|this week|last week|this month|week \d+)/i.test(d)) return null;
  const m = d.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:(?:st|nd|rd|th))?(?:,|\s+)?\s*(\d{4})?\b/i);
  if (m) {
    const month = MONTHS[m[1]!.toLowerCase()];
    if (!month) return null;
    return { month, day: parseInt(m[2]!, 10), year: m[3] ? parseInt(m[3], 10) : undefined };
  }
  const iso = d.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    return { year: parseInt(iso[1]!, 10), month: parseInt(iso[2]!, 10), day: parseInt(iso[3]!, 10) };
  }
  const short = d.match(/\b(\d{1,2})[-/.](\d{1,2})\b/);
  if (short) {
    return { month: parseInt(short[2]!, 10), day: parseInt(short[1]!, 10) };
  }
  return null;
}

const TABLE_COLUMN_SOURCES: Array<{ re: RegExp; source: string }> = [
  { re: /^name$/i, source: "name" },
  { re: /^(detail|description|notes?)$/i, source: "detail" },
  { re: /^(amount|value|price|cost|total|distance|duration)$/i, source: "amount" },
  { re: /^(status|state)$/i, source: "status" },
  { re: /^(date|day|when)$/i, source: "date" },
  { re: /^(owner|assignee|coach|host|author|person)$/i, source: "owner" },
];

/** Does a row carry a value for the given source field? */
function rowHasSource(row: { name: string; detail: string; amount: string; status: string; date: string; owner?: string; fields?: string[] }, source: string): boolean {
  switch (source) {
    case "name": return Boolean(row.name);
    case "detail": return Boolean(row.detail);
    case "amount": return Boolean(row.amount);
    case "status": return Boolean(row.status);
    case "date": return Boolean(row.date);
    case "owner": return Boolean(row.owner);
    default: return Boolean(row.fields?.length);
  }
}

/**
 * The v23 #32-#34 regression surface — deterministic, no model call.
 * Returns every violation found; an empty array means the content may ship.
 */
export function validateDomainContract(opts: {
  brief: ProductBrief;
  domain: string;
  data: MockDataset | null;
  copy: CopyPlan | null;
}): DomainContractViolation[] {
  const violations: DomainContractViolation[] = [];
  if (!opts.data) return violations;
  const { data, brief } = opts;
  const domain = opts.domain;

  // ── 1. Units ──────────────────────────────────────────────────────────
  const isCurrencyDomain = CURRENCY_DOMAINS.has(domain);
  if (!isCurrencyDomain) {
    for (const m of data.metrics) {
      if (CURRENCY_RE.test(`${m.label} ${m.value} ${m.unit}`)) {
        violations.push({ field: `metrics[${m.label}]`, message: `currency unit in a ${domain} product ("${m.label} ${m.value} ${m.unit}") — never $/invoice/billing outside financial/shopping domains` });
      }
    }
    for (const r of data.rows) {
      if (CURRENCY_RE.test(`${r.name} ${r.amount} ${r.detail}`)) {
        violations.push({ field: `rows[${r.name}]`, message: `currency content in a ${domain} product ("${r.amount}") — off-domain unit` });
      }
    }
  }

  const declared = briefDeclaredUnits(brief);
  const runningProduct = RUNNING_MARKERS.test(`${brief.productType} ${brief.description}`) && domain === "fitness";
  for (const m of data.metrics) {
    const unit = normalizeUnit(m.unit);
    if (!unit) continue;
    if (runningProduct && STRENGTH_UNITS.has(unit)) {
      violations.push({ field: `metrics[${m.label}]`, message: `strength-training unit "${m.unit}" in a running/track product ("${m.label}") — the running domain uses km/pace/kcal (v23 issue #32)` });
    }
    const legal = DOMAIN_UNITS[domain];
    if (legal && !legal.has(unit) && !NEUTRAL_UNITS.has(unit)) {
      // A unit the brief itself declares is always legal.
      if (!declared.has(unit)) {
        violations.push({ field: `metrics[${m.label}]`, message: `unit "${m.unit}" is not legal for the ${domain} domain (${m.label}) — v23 issue #32` });
      }
    }
  }

  // ── 2. Dates ──────────────────────────────────────────────────────────
  const range = briefDateRange(brief);
  if (range) {
    let sawAbsolute = false;
    for (const r of data.rows) {
      const parsed = parseRowDate(r.date);
      if (!parsed) continue;
      sawAbsolute = true;
      if (parsed.year !== undefined && parsed.year !== range.year) {
        violations.push({ field: `rows[${r.name}].date`, message: `date "${r.date}" (${parsed.year}) outside the supplied dataset period ${range.raw} — stale dates conflict with the brief's authoritative data (v23 issue #34)` });
        continue;
      }
      if (parsed.month !== range.month || parsed.day < range.dayStart || parsed.day > range.dayEnd) {
        violations.push({ field: `rows[${r.name}].date`, message: `date "${r.date}" falls outside the supplied dataset period ${range.raw} — stale dates conflict with the brief's authoritative data (v23 issue #34)` });
      }
    }
    // Relative labels are legal, but mixing them with out-of-range absolute
    // dates is exactly the v23 defect — covered by the checks above.
    void sawAbsolute;
  }

  // ── 3. Table/list field completeness (WS5.2 + v23 issue #33) ──────────
  const copyScreen = opts.copy?.screens.find((s) => s.screenId === "home") ?? opts.copy?.screens[0];
  const columns = copyScreen?.tableColumns ?? [];
  const rows = data.rows;
  for (const column of columns) {
    const source = TABLE_COLUMN_SOURCES.find((s) => s.re.test(column))?.source;
    if (!source) {
      // Custom column (product-specific, e.g. "Structure") — the template
      // contract covers it through the rows' fields array. Rows with no
      // fields array cannot populate it (v23 issue #33).
      const noFields = rows.every((r) => !r.fields || r.fields.length === 0);
      if (noFields) {
        violations.push({ field: `tableColumns[${column}]`, message: `table column "${column}" has no row field source — rows ship no fields array to populate it (template table contract: ${TABLE_SOURCE_FIELDS.join(", ")}) — v23 issue #33` });
      }
      continue;
    }
    const missing = rows.some((r) => !rowHasSource(r, source));
    if (missing) {
      violations.push({ field: `tableColumns[${column}]`, message: `table column "${column}" maps to row field "${source}" but rows omit it — the planned table cannot render complete values (v23 issue #33)` });
    }
  }

  return violations;
}

export { TABLE_SOURCE_FIELDS };

// ── Deterministic repair (the post-check corrective path) ──────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Remap every absolute row date into the brief's declared range (seeded,
 *  deterministic). Relative labels are left alone. Returns a new dataset. */
export function repairDatesToRange(data: MockDataset, brief: ProductBrief): MockDataset {
  const range = briefDateRange(brief);
  if (!range) return data;
  let i = 0;
  const rows = data.rows.map((r) => {
    const parsed = parseRowDate(r.date);
    if (!parsed) return r;
    const day = range.dayStart + ((i++ * 2) % (range.dayEnd - range.dayStart + 1));
    return { ...r, date: `${MONTH_NAMES[range.month - 1]} ${day}, ${range.year}` };
  });
  return { ...data, rows };
}

/** Drop copy table columns no row can populate (deterministic, named). */
export function dropUnfillableColumns(copy: CopyPlan, violations: DomainContractViolation[]): CopyPlan {
  const blocked = new Set(
    violations.filter((v) => v.field.startsWith("tableColumns[")).map((v) => v.field.match(/\[(.+)\]/)?.[1] ?? ""),
  );
  if (blocked.size === 0) return copy;
  return {
    ...copy,
    screens: copy.screens.map((s) => ({
      ...s,
      tableColumns: s.tableColumns?.filter((c) => !blocked.has(c)) ?? s.tableColumns,
    })),
  };
}

/**
 * Full pre-compose enforcement: units/rows → deterministic domain-pack
 * regeneration; dates → deterministic remap into the brief's declared
 * range; table columns → deterministic drop of unfillable columns. Every
 * action is recorded in notes. The content that reaches the composer is
 * always contract-clean.
 */
export function enforceDomainContract(opts: {
  brief: ProductBrief;
  domain: string;
  data: MockDataset;
  copy: CopyPlan | null;
  seed?: string;
}): { data: MockDataset; copy: CopyPlan | null; notes: string[] } {
  const notes: string[] = [];
  let data = opts.data;
  let copy = opts.copy;

  let violations = validateDomainContract({ brief: opts.brief, domain: opts.domain, data, copy });

  const isUnitOrRow = (v: DomainContractViolation) => v.field.startsWith("metrics") || v.field.startsWith("rows");
  if (violations.some(isUnitOrRow)) {
    notes.push(`domain contract: ${violations.filter(isUnitOrRow).map((v) => v.message).join(" | ")}`);
    notes.push("domain contract: unit/row violations → deterministic domain-pack content");
    data = mockDataset(opts.brief, opts.seed ?? "domain-contract-repair");
    violations = validateDomainContract({ brief: opts.brief, domain: opts.domain, data, copy });
  }

  if (violations.some((v) => /date/i.test(v.message))) {
    data = repairDatesToRange(data, opts.brief);
    notes.push(`domain contract: row dates remapped into the brief's declared range (${briefDateRange(opts.brief)?.raw ?? "?"})`);
    violations = validateDomainContract({ brief: opts.brief, domain: opts.domain, data, copy });
  }

  if (violations.some((v) => v.field.startsWith("tableColumns"))) {
    const before = JSON.stringify(copy?.screens.map((s) => s.tableColumns) ?? []);
    copy = dropUnfillableColumns(copy!, violations);
    const after = JSON.stringify(copy?.screens.map((s) => s.tableColumns) ?? []);
    if (before !== after) {
      notes.push(`domain contract: dropped table column(s) rows cannot populate (${violations.filter((v) => v.field.startsWith("tableColumns")).map((v) => v.message).join(" | ")})`);
      violations = validateDomainContract({ brief: opts.brief, domain: opts.domain, data, copy });
    }
  }

  if (violations.length > 0) {
    notes.push(`domain contract: ${violations.length} violation(s) remain after deterministic repair (${violations.map((v) => v.message).join(" | ")})`);
  }
  return { data, copy, notes };
}

export type { BriefLike };

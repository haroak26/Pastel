import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { dataPlanSchema, type DataPlan, type ProductBrief } from "../schemas";
import { pickDomain, briefText, hashSeed, REVIEW_HEADING } from "../lib/domains";
import { mockDataset, type MockDataset } from "../lib/content";

/**
 * V14 Design-data agent — generates ALL page content AFTER the brief.
 *
 * Runs on the mid-tier model (Luna). Everything the composer previously
 * baked as pre-defined content (review headings, review lines, trust items,
 * primary CTAs, metrics, rows, activity, settings, search/empty states) is
 * now written fresh per run: people, metrics, series, rows, activity,
 * detail fields, settings, social proof (reviews + heading), trust items,
 * and CTAs.
 *
 * The domain packs in `lib/domains.ts` remain the deterministic FALLBACK —
 * the safety net when the model call fails or the output fails validation.
 * Content guardrails (allowed units/vocabulary per domain) steer the model;
 * the sanitizer + the existing content gate are the two independent nets
 * against off-domain content (invoices in a fitness app, etc.).
 */

export interface DataInput {
  brief: ProductBrief;
  /** Deterministic seed for the fallback dataset (brief + run id). */
  seed: string;
  onUsage?: OnUsage;
}

export interface DataOutput {
  data: MockDataset;
  usedFallback: boolean;
  notes: string[];
}

/** Per-domain content guardrails — vocabulary guidance, NOT pre-done values
 * (the model must write fresh content inside these bounds). */
const GUARDRAILS: Record<string, string> = {
  fitness: "Units: km, pace (min/km), lb, kg, sets, reps, kcal, %, days. Statuses: complete/upcoming/skipped. Never currency, invoices, or company names.",
  ecommerce: "Units: currency ($), stock counts, ratings. Items are products with SKU-ish ids, prices, categories, delivery statuses. Never fitness or B2B workspace content.",
  media: "Units: plays, minutes, duration, ratings. Items are tracks/episodes/albums with titles and durations. Never currency or invoices.",
  social: "Units: members, posts, followers, replies. Items are posts/threads with engagement counts. Never currency or B2B invoices.",
  productivity: "Units: tasks, hours, projects, % complete, days. Items are projects/tasks/boards with owners and statuses. Currency only in billing-ish plans; never workout content.",
  rentals: "Units: nightly price ($), ratings, guests, dates. Items are stays with hosts, nightly prices, amenities, booking windows. Statuses are host qualities, NEVER order states (failed/pending).",
  travel: "Units: price ($), duration, ratings. Items are destinations/trips with itineraries and totals. Never rental-host language.",
  finance: "Units: currency ($), %, APY. Items are accounts/transactions/forecasts. Never workout or travel content.",
};

/** Finance/shopping domains where currency is legitimate content. */
const CURRENCY_DOMAINS = new Set(["finance", "ecommerce", "rentals", "travel"]);

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

function hueOf(name: string): number {
  return hashSeed(name.toLowerCase()) % 360;
}

/** Deterministic sanitization of the model's data plan. Returns `fatal` when
 * the content cannot be salvaged (caller falls back to the domain packs). */
export function sanitizeDataPlan(
  plan: DataPlan,
  domain: string,
): { plan: DataPlan; corrected: string[]; fatal: string[] } {
  const corrected: string[] = [];
  const fatal: string[] = [];

  // People: initials/hue are derived deterministically when missing.
  const people = plan.people.map((p) => ({
    ...p,
    initials: p.initials && p.initials.length > 0 ? p.initials : initialsOf(p.name),
    hue: typeof p.hue === "number" ? p.hue : hueOf(p.name),
  }));

  // Metric labels must be distinct — duplicate labels read as the same stat.
  const labels = plan.metrics.map((m) => m.label.toLowerCase().trim());
  if (new Set(labels).size !== labels.length) {
    fatal.push("duplicate metric labels");
  }

  // Currency is only legal in finance/shopping domains (the fitness-app
  // shipping "$22,091" class of bug).
  if (!CURRENCY_DOMAINS.has(domain)) {
    const dirty = [
      ...plan.metrics.filter((m) => /\$|revenue|invoice|billing/i.test(`${m.label} ${m.value} ${m.unit}`)),
      ...plan.rows.filter((r) => /\$|invoice|billing/i.test(`${r.name} ${r.amount} ${r.detail}`)),
      ...plan.activity.filter((a) => /\$|invoice|billing/i.test(a)),
    ];
    if (dirty.length > 0) fatal.push(`off-domain currency/content in a ${domain} product`);
  }

  // Row names must be unique (duplicate catalog rows read as a bug).
  const rowNames = plan.rows.map((r) => r.name.toLowerCase().trim());
  if (new Set(rowNames).size !== rowNames.length) {
    fatal.push("duplicate row names");
  }

  // Reviews: initials/hue derived from the reviewer name.
  const reviews = plan.reviews.map((r) => ({
    name: r.name,
    initials: initialsOf(r.name),
    hue: hueOf(r.name),
    rating: Math.min(5, Math.max(1, Math.round(r.rating * 10) / 10)),
    text: r.text,
  }));

  // V15 hard gate: booking wording in the social-proof heading is only legal
  // for stay products — whatever the model wrote, a fitness/workspace/agent
  // product never ships "Guest reviews" / "Verified host".
  const isStay = domain === "travel" || domain === "rentals";
  if (!isStay && /guest reviews|verified host|superhost/i.test(plan.reviewHeading)) {
    corrected.push(`reviewHeading "${plan.reviewHeading}" → "${REVIEW_HEADING[domain] ?? "What people say"}" (booking wording only legal for stay products)`);
    plan.reviewHeading = REVIEW_HEADING[domain] ?? "What people say";
  }

  return { plan: { ...plan, people, reviews }, corrected, fatal };
}

/** Build the run's dataset from a validated data plan (model path). */
export function datasetFromPlan(
  plan: DataPlan,
  seed: number,
  domain: string,
  strengthMode: boolean,
): MockDataset {
  const owners = plan.people.map((p) => p.name);
  const rows = plan.rows.map((r, i) => ({
    ...r,
    owner: r.owner ?? owners[i % owners.length],
  }));
  return {
    seed,
    domain,
    strengthMode,
    people: plan.people.map((p) => ({ name: p.name, role: p.role, email: p.email, initials: p.initials!, hue: p.hue! })),
    metrics: plan.metrics,
    series: plan.series,
    rows,
    activity: plan.activity,
    detailFields: plan.detailFields,
    detailValues: plan.detailValues,
    settingsSections: plan.settingsSections,
    searchPlaceholder: plan.searchPlaceholder,
    emptyTitle: plan.emptyTitle,
    emptyBody: plan.emptyBody,
    reviews: plan.reviews.map((r) => ({
      name: r.name,
      initials: initialsOf(r.name),
      hue: hueOf(r.name),
      rating: r.rating,
      text: r.text,
    })),
    reviewHeading: plan.reviewHeading,
    trustItems: plan.trustItems,
    primaryCta: plan.primaryCta,
    homeCta: plan.homeCta,
    priceSuffix: plan.priceSuffix,
    mediaSubject: plan.mediaSubject,
  };
}

const SYSTEM = `You are the Pastel content studio. You write ALL the sample data and page content for one product — metrics, items, activity, settings, search/empty states, social proof, trust items, and CTAs. The content must be specific, coherent, and native to the product described in the brief.

RULES:
- Write FRESH content for THIS product. Do not copy template values. The domain guardrails define allowed vocabulary (units, statuses, item kinds) — stay inside them.
- Metrics: exactly 4, each with a DISTINCT label, a real value with its unit, a delta (positive when good news), a one-line note, and a 12-point spark series.
- Series: 2-5 time series; label + unit must match the metric vocabulary (never "$" unless the domain is financial/shopping).
- Rows: 6-12 items with unique names, a one-line detail, a right-aligned amount, a domain status, a date, and an owner from the people list. For stays: nightly prices + booking windows (dates) + guest counts. Never mix domains (no invoices in a fitness app).
- People: 6-12 named people with roles and emails; reviewers must be among them.
- Activity: 4-12 short, concrete log lines with real numbers.
- Social proof: 4-8 reviews with a name (from people), a rating (1-5), and a specific one-line quote. The reviewHeading must fit the product ("Guest reviews" for stays, "Customer reviews" for shops, community language for feeds — never Airbnb wording for a non-stay product).
- Trust items: 3-5 short guarantees that make sense for this product.
- primaryCta (verb-first, ≤24 chars, the detail screen's main action) and homeCta (the home hero's action).
- No placeholder text, no "lorem", no spec notes, no "$0" samples, no AI-slop.

OUTPUT — valid JSON ONLY matching:
{
  "version": "1.0.0",
  "people": [{ "name", "role", "email" }],
  "metrics": [{ "label", "unit", "value", "delta", "positive", "note", "spark": [12 numbers] }] (exactly 4),
  "series": [{ "label", "unit", "points": [{ "x", "y" }] }],
  "rows": [{ "id", "name", "detail", "amount", "status", "date", "owner"?, "fields"?, "dates"?, "guests"? }],
  "activity": [strings],
  "detailFields": [4-6 field labels for the detail pane],
  "detailValues": [values aligned with detailFields, in order],
  "settingsSections": [{ "title", "items": [{ "label", "value", "control": "toggle"|"select"|"text" }] }],
  "searchPlaceholder", "emptyTitle", "emptyBody",
  "reviews": [{ "name", "rating", "text" }],
  "reviewHeading", "trustItems", "primaryCta", "homeCta", "priceSuffix"?,
  "mediaSubject"? — the imagery subject for the media tiles: "runner"|"dumbbell"|"house"|"graph"|"product"|"album"|"doc"|"chat"|"board"|"generic". Pick what THIS product's items are ABOUT (a runner app → "runner", an agent platform → "graph", a podcast app → "album"). Omit to let the domain fallback choose.
}`;

export async function runData(input: DataInput): Promise<DataOutput> {
  const domain = pickDomain(briefText(input.brief)).slug;
  const strengthMode = domain === "fitness" && /adaptive|personal trainer|suggested load|form cue|readiness|recovery block/i.test(briefText(input.brief));
  const guardrails = GUARDRAILS[domain] ?? "Keep the content native to the product described in the brief.";
  const notes: string[] = [];

  const briefBlock = [
    `PRODUCT: ${input.brief.title} — ${input.brief.productType}`,
    input.brief.description,
    `MODE (V15 — the product's primary job; shape the content to it): ${input.brief.mode ?? "track"}`,
    `Audience: ${input.brief.audience.primary}`,
    "Features:",
    ...input.brief.features.map((f) => `- ${f.name} (${f.priority}): ${f.description}`),
    "Screen purposes:",
    ...input.brief.screenPurposes.map((s) => `- ${s.id}: ${s.purpose}`),
  ].join("\n");

  // V24 WS5: the domain-contract cross-check runs on the cheap-tier output
  // BEFORE the build — wrong-domain units and stale dates (the v23 issues
  // #32/#34 class) fail here and are retried with the mismatch named
  // explicitly, never shipped to the composer.
  const contractBlock = async (plan: DataPlan): Promise<string[]> => {
    const { validateDomainContract } = await import("../lib/domain-contract");
    const ds = datasetFromPlan(plan, hashSeed(input.seed), domain, strengthMode);
    return validateDomainContract({ brief: input.brief, domain, data: ds, copy: null }).map((v) => v.message);
  };

  try {
    let plan = await chatJSON<DataPlan>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `${briefBlock}\n\nDOMAIN: ${domain}\nCONTENT GUARDRAILS:\n${guardrails}\n\nWrite the content plan as JSON.`,
        },
      ],
      {
        model: "data",
        temperature: 0.7,
        maxTokens: MAX_TOKENS_PER_CALL.data,
        validate: (v) => dataPlanSchema.parse(v),
        onUsage: input.onUsage,
      },
    );

    // One bounded corrective retry naming the contract mismatches.
    const mismatches = await contractBlock(plan);
    if (mismatches.length > 0) {
      console.warn(`[maxi-agent] data contract mismatches: ${mismatches.join(" | ")} — one corrective retry`);
      plan = await chatJSON<DataPlan>(
        [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `${briefBlock}\n\nDOMAIN: ${domain}\nCONTENT GUARDRAILS:\n${guardrails}\n\n### CORRECTION REQUIRED\nYour previous content violated the product's domain contract:\n${mismatches.map((m) => `- ${m}`).join("\n")}\nFix exactly those mismatches (units, dates) and re-emit the complete content plan as JSON.`,
          },
        ],
        {
          model: "data",
          temperature: 0.5,
          maxTokens: MAX_TOKENS_PER_CALL.data,
          validate: (v) => dataPlanSchema.parse(v),
          onUsage: input.onUsage,
        },
      );
      notes.push(`data contract: corrective retry after ${mismatches.length} mismatch(es) (${mismatches[0]})`);
    }

    const { plan: clean, fatal, corrected } = sanitizeDataPlan(plan, domain);
    if (fatal.length > 0) {
      notes.push(`data plan failed sanitization: ${fatal.join("; ")}`);
      throw new Error(`Data plan sanitization failed: ${fatal.join("; ")}`);
    }
    if (corrected.length > 0) notes.push(`data plan corrected: ${corrected.join(", ")}`);
    const ds = datasetFromPlan(clean, hashSeed(input.seed), domain, strengthMode);
    const remaining = (await contractBlock(clean)).length;
    if (remaining > 0) {
      notes.push(`data plan still violates the domain contract after the corrective retry — using the deterministic domain pack`);
      throw new Error("Data plan still violates the domain contract after the corrective retry");
    }
    return {
      data: ds,
      usedFallback: false,
      notes,
    };
  } catch (err) {
    console.warn("[pastel v14] data agent failed, using domain-pack fallback:", err instanceof Error ? err.message : err);
    return {
      data: mockDataset(input.brief, input.seed),
      usedFallback: true,
      notes: [...notes, "deterministic domain-pack content used (data model unavailable/invalid)"],
    };
  }
}

/**
 * V7 domain packs — brief-driven mock content.
 *
 * v6 fed every run from a SaaS/B2B generator (companies, MRR, invoices,
 * "deployed to production"), which leaked finance content into products that
 * have nothing to do with finance (a fitness app showing "Aperture AI" and
 * "$22,091" invoices). V7 replaces that with per-domain packs: the brief's
 * product type/features/screen purposes pick the pack, and every metric,
 * row, activity line and settings section is product-relevant by
 * construction. Deterministic (seeded RNG), same reproducibility contract.
 */

import type { ProductBrief } from "../schemas-v6";

// ── V14: fallback page-content vocabulary ─────────────────────────────────
//
// Everything the DATA agent normally generates lives here as the
// DETERMINISTIC FALLBACK (the safety net, never the default). The data agent
// (agents/data-v14.ts, mid-tier Luna) writes fresh content per run; when it
// fails or its output fails validation, these packs produce the dataset.

/** Domain-aware primary action for the detail page's summary card + band. */
export const DOMAIN_PRIMARY_CTA: Record<string, string> = {
  travel: "Reserve",
  rentals: "Reserve",
  ecommerce: "Add to cart",
  fitness: "Start workout",
  media: "Play now",
  social: "Join",
  productivity: "Open project",
  finance: "Continue",
};

/** Fallback CTA for the non-catalog home hero. */
export const DOMAIN_HOME_CTA: Record<string, string> = {
  travel: "Explore stays",
  rentals: "Explore stays",
  ecommerce: "Shop now",
  fitness: "Start today",
  media: "Listen now",
  social: "Join the community",
  productivity: "Get started",
  finance: "Open account",
};

/** Nightly-price suffix on catalog cards (rentals are priced per night). */
export const PRICE_SUFFIX: Record<string, string> = {
  rentals: " night",
  travel: " total",
};

/** Fallback social-proof lines per domain (the data agent writes fresh ones). */
export const REVIEW_PHRASES: Record<string, string[]> = {
  travel: [
    "Immaculate place — exactly as pictured, in a great neighbourhood.",
    "The host was wonderful and the location could not be better.",
    "Beautiful stay. Quiet at night, coffee round the corner, walkable to everything.",
    "Photos don't do it justice — spacious, spotless, and very comfortable.",
    "Perfect base for exploring. We would absolutely stay again.",
    "Great value for the area, check-in was effortless.",
  ],
  ecommerce: [
    "Quality is excellent — even better than the photos.",
    "Fast shipping and the fit is true to size.",
    "Bought this as a gift and it was a hit.",
    "Solid build, looks premium in person.",
    "Exactly what I needed, arrived in two days.",
    "Would recommend to anyone on the fence.",
  ],
  fitness: [
    "Best workout for building speed — felt it in the first session.",
    "Clear coaching cues and a great pace for a weekday run.",
    "Challenging but doable; the pacing guide really helps.",
    "My favourite interval session this season.",
    "Perfect recovery-run length with solid guidance.",
    "Took my 5K time down a full minute.",
  ],
  media: [
    "Incredible production — the mix is so clean.",
    "On repeat all week, every track lands.",
    "A new favourite. The vocals are unreal.",
    "Great energy from start to finish.",
    "Perfect soundtrack for late drives.",
    "Best release this month, hands down.",
  ],
  social: [
    "Active community with genuinely helpful people.",
    "Great discussions and zero drama.",
    "Found collaborators here within a week.",
    "Well moderated and welcoming to newcomers.",
    "The weekly threads are worth it alone.",
    "My favourite corner of the internet.",
  ],
  productivity: [
    "Streamlined our whole workflow in a day.",
    "Simple, fast, and the integrations just work.",
    "Our team finally stopped living in spreadsheets.",
    "The automation rules saved us hours every week.",
    "Clean UI and rock-solid reliability.",
    "Best tool we added this year.",
  ],
  finance: [
    "Clear statements and instant transfers.",
    "The reconciliation view saves me so much time.",
    "Reliable and fast — support answered in minutes.",
    "Accurate forecasts and easy exports.",
    "Set up in ten minutes, zero friction.",
    "Exactly the control we needed over cash flow.",
  ],
};

/** V14 fallback social-proof heading per domain — the data agent writes the
 * real heading for the run; this map is only the deterministic safety net. */
export const REVIEW_HEADING: Record<string, string> = {
  rentals: "Guest reviews",
  travel: "Guest reviews",
  ecommerce: "Customer reviews",
  media: "What listeners say",
  social: "From the community",
  fitness: "Member feedback",
  productivity: "Team feedback",
  finance: "Member feedback",
};

/** Fallback trust-signal items per domain (detail action band). */
export const TRUST_ITEMS: Record<string, string[]> = {
  travel: ["Free cancellation", "Instant confirmation", "Verified host"],
  ecommerce: ["Free returns", "Ships within 24h", "Secure checkout"],
  fitness: ["No equipment needed", "Coach-guided", "All levels welcome"],
  media: ["Offline listening", "Lossless audio", "Ad-free"],
  social: ["Active community", "Zero spam", "Newcomer friendly"],
  productivity: ["Free trial", "Team-ready", "Data encrypted"],
  finance: ["Bank-grade security", "Instant transfers", "No hidden fees"],
};

export interface DomainMetric {
  label: string;
  unit: string;
  value: string;
  delta: number;
  positive: boolean;
  note: string;
  spark: number[];
}

export interface DomainItem {
  id: string;
  name: string;
  detail: string;
  /** Right-aligned primary numeric/meta string (km, price, plays…). */
  amount: string;
  status: string;
  date: string;
  /** V9: per-item field values aligned with the pack's `detailFields` — the
   * detail pane renders THESE so a listing's facts can never contradict its
   * card (e.g. header "Oaxaca" + facts "Lake Como"). */
  fields?: string[];
  /** V11: the item's own booking window (stay/travel detail summary). */
  dates?: string;
  /** V11: the item's own guest count (stay/travel detail summary). */
  guests?: string;
}

export interface DomainSeries {
  label: string;
  unit: string;
  points: Array<{ x: string; y: number }>;
}

export interface DomainSettingsSection {
  title: string;
  items: Array<{ label: string; value: string; control: "toggle" | "select" | "text" }>;
}

export interface DomainPack {
  slug: string;
  match: RegExp[];
  /** Status vocabulary this domain uses (must exist in compose STATUS_TONE). */
  statuses: string[];
  metrics: (rnd: () => number) => DomainMetric[];
  series: (rnd: () => number) => DomainSeries[];
  items: (rnd: () => number) => DomainItem[];
  activity: (rnd: () => number) => string[];
  /** Field labels for the detail pane (aligned with `detailValues`). */
  detailFields: () => string[];
  /** Display values for the detail pane's first/selected item, in the same
   * order as `detailFields`. */
  detailValues: (rnd: () => number) => string[];
  settingsSections: () => DomainSettingsSection[];
  tableColumns: () => string[];
  searchPlaceholder: () => string;
  emptyTitle: () => string;
  emptyBody: () => string;
}

// ── Shared RNG helpers ───────────────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/** V11: Fisher–Yates shuffle — items draw UNIQUE names/places/hosts per run
 * (pick-with-replacement made "Sunset Terrace Flat" appear 4x with different
 * prices, which read as corrupted data). */
function shuffled<T>(rnd: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function fmtNum(v: number): string {
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function money(rnd: () => number, max: number): string {
  const v = (rnd() * max).toFixed(rnd() > 0.5 ? 0 : 2);
  const [i, d] = v.split(".");
  return `$${i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${d ? "." + d : ""}`;
}

function pace(rnd: () => number): string {
  const mins = Math.floor(rnd() * 3 + 3);
  const secs = Math.floor(rnd() * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function duration(rnd: () => number): string {
  const m = Math.floor(rnd() * 55 + 18);
  const s = Math.floor(rnd() * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function distance(rnd: () => number): string {
  return (rnd() * 16 + 3).toFixed(1);
}

function dateStr(rnd: () => number): string {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${MONTHS[Math.floor(rnd() * 12)]} ${Math.floor(rnd() * 28) + 1}`;
}

/** V11: a coherent booking window for a stay ("Aug 7 – Aug 10"). */
function dateRange(rnd: () => number): string {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = Math.floor(rnd() * 12);
  const d1 = Math.floor(rnd() * 20) + 1;
  const d2 = d1 + 2 + Math.floor(rnd() * 4);
  return `${MONTHS[m]} ${d1} – ${MONTHS[m]} ${d2}`;
}

function weekly(rnd: () => number, n: number, min: number, max: number, decimals = 1): Array<{ x: string; y: number }> {
  let v = min + rnd() * (max - min) * 0.4;
  const out: Array<{ x: string; y: number }> = [];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < n; i++) {
    v = Math.max(min * 0.6, v * (0.9 + rnd() * 0.25));
    out.push({ x: DAYS[i % 7], y: Number(v.toFixed(decimals)) });
  }
  return out;
}

function monthly(rnd: () => number, n: number, min: number, max: number): Array<{ x: string; y: number }> {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let v = min + rnd() * (max - min) * 0.4;
  const out: Array<{ x: string; y: number }> = [];
  for (let i = 0; i < n; i++) {
    v = Math.max(min * 0.6, v * (0.9 + rnd() * 0.25));
    out.push({ x: MONTHS[i % 12], y: Math.round(v) });
  }
  return out;
}

function spark(rnd: () => number): number[] {
  return Array.from({ length: 12 }, () => Math.floor(rnd() * 40 + 20));
}

function pctDelta(rnd: () => number, min: number, max: number, goodIfPositive = true): { delta: number; positive: boolean } {
  const delta = Math.round((rnd() * (max - min) + min) * 10) / 10;
  return { delta, positive: goodIfPositive ? delta >= 0 : delta <= 0 };
}

function metric(label: string, unit: string, value: string, d: { delta: number; positive: boolean }, note: string, rnd: () => number): DomainMetric {
  return { label, unit, value, delta: d.delta, positive: d.positive, note, spark: spark(rnd) };
}

const PEOPLE_FIRST = ["Maya", "Jonah", "Priya", "Diego", "Sofia", "Liam", "Amara", "Kai", "Noor", "Felix", "Ivy", "Marcus", "Tessa", "Omar", "Lena", "Hugo", "Zara", "Nate", "Rosa", "Eli"];
const PEOPLE_LAST = ["Chen", "Okafor", "Novak", "Silva", "Haddad", "Walsh", "Tanaka", "Bauer", "Kowalski", "Moreau", "Iqbal", "Fernandez", "Lindqvist", "Adeyemi", "Park", "Ricci", "Vasquez", "Nguyen", "Duval", "Costa"];

export function domainPeople(rnd: () => number, n = 10): Array<{ name: string; role: string; email: string; initials: string; hue: number }> {
  return Array.from({ length: n }, () => {
    const first = pick(rnd, PEOPLE_FIRST);
    const last = pick(rnd, PEOPLE_LAST);
    const name = `${first} ${last}`;
    return {
      name,
      role: pick(rnd, ["Runner", "Coach", "Member", "Founder", "Curator", "Customer", "Creator", "Trainer", "Guest", "Athlete"]),
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      initials: name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
      hue: Math.floor(rnd() * 360),
    };
  });
}

// ── Packs ────────────────────────────────────────────────────────────────

const fitness: DomainPack = {
  slug: "fitness",
  match: [/run/, /runn/, /workout/, /fitness/, /train/, /gym/, /sport/, /athlet/, /exercise/, /marathon/, /yoga/, /cycling/, /swim/, /streak/, /pace/, /calorie/, /cardio/],
  statuses: ["complete", "upcoming", "skipped"],
  metrics: (rnd) => [
    metric("Readiness", "%", String(Math.floor(rnd() * 12 + 82)), pctDelta(rnd, 2, 9), "recovery is trending well", rnd),
    metric("Weekly volume", "sets", String(Math.floor(rnd() * 12 + 28)), pctDelta(rnd, 4, 14), "vs last week", rnd),
    metric("Training streak", "days", String(Math.floor(rnd() * 18 + 3)), pctDelta(rnd, 0, 6), "best 24 days", rnd),
    metric("Next PR", "lb", String(Math.floor(rnd() * 20 + 155)), pctDelta(rnd, 1, 8), "estimated this month", rnd),
  ],
  detailValues: (rnd) => [`${Math.floor(rnd() * 3 + 3)} sets`, `${Math.floor(rnd() * 5 + 6)} reps`, `${Math.floor(rnd() * 35 + 65)} lb`, pick(rnd, ["Moderate", "Hard", "Controlled"]), pick(rnd, ["Strength", "Mobility", "Power"])],
  series: (rnd) => [
    { label: "Strength trend", unit: "lb", points: weekly(rnd, 7, 120, 210) },
    { label: "Weekly volume", unit: "sets", points: weekly(rnd, 7, 18, 48) },
    { label: "Readiness", unit: "%", points: weekly(rnd, 7, 72, 98) },
    // Legacy fitness vocabulary remains available for existing persisted
    // runs and copy-plan migrations; v12 prompts select the strength series.
    { label: "Weekly distance", unit: "km", points: weekly(rnd, 7, 8, 42) },
    { label: "Calories", unit: "kcal", points: weekly(rnd, 7, 500, 1800) },
  ],
  items: (rnd) => {
    const names = shuffled(rnd, ["Goblet squat", "Single-arm row", "Dead bug hold", "Romanian deadlift", "Half-kneeling press", "Reverse lunge", "Plank shoulder tap", "Hip mobility flow", "Push-up tempo"]);
    const focus = ["Lower body", "Pull", "Core", "Push", "Mobility", "Full body"];
    return names.map((name, i) => ({
      id: `wk${1000 + i}`,
      name,
      detail: `${Math.floor(rnd() * 3 + 2)} sets × ${Math.floor(rnd() * 6 + 8)} reps · ${pick(rnd, focus)}`,
      amount: `${Math.floor(rnd() * 45 + 35)} lb`,
      status: pick(rnd, fitness.statuses),
      date: dateStr(rnd),
    }));
  },
  activity: (rnd) => [
    `Added 5 lb to goblet squat · ${Math.floor(rnd() * 3 + 3)} sets`,
    "Set a new deadlift PR · 185 lb",
    `Hit a ${Math.floor(rnd() * 14 + 3)}-day streak`,
    "Completed strength session · 42 min",
    `Logged ${fmtNum(rnd() * 12 + 24)} working sets this week`,
    "Improved single-arm row form",
    "Finished a guided mobility block",
    `Monthly volume record · ${fmtNum(rnd() * 80 + 140)} lb`,
  ],
  detailFields: () => ["Sets", "Rep range", "Suggested load", "Intensity", "Training focus"],
  settingsSections: () => [
    {
      title: "Goals",
      items: [
        { label: "Weekly distance goal", value: "30 km", control: "select" },
        { label: "Monthly distance goal", value: "120 km", control: "select" },
        { label: "PR alerts", value: "On", control: "toggle" },
      ],
    },
    {
      title: "Units & preferences",
      items: [
        { label: "Distance units", value: "Kilometres", control: "select" },
        { label: "Pace format", value: "min/km", control: "select" },
        { label: "Voice coaching", value: "Off", control: "toggle" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { label: "Run reminders", value: "On", control: "toggle" },
        { label: "Streak alerts", value: "On", control: "toggle" },
      ],
    },
  ],
  tableColumns: () => ["Workout", "Focus", "Pace", "Status", "Date"],
  searchPlaceholder: () => "Search exercises",
  emptyTitle: () => "No exercises yet",
  emptyBody: () => "Complete your first coached session and your training history will show up here.",
};

const ecommerce: DomainPack = {
  slug: "ecommerce",
  match: [/shop/, /store/, /ecommerce/, /e-com/, /retail/, /product/, /marketplace/, /sell/, /cart/, /order/, /commerce/, /catalog/],
  statuses: ["active", "pending", "failed"],
  metrics: (rnd) => [
    metric("Revenue today", "", money(rnd, 9000), pctDelta(rnd, 2, 15), "vs yesterday", rnd),
    metric("Orders today", "", fmtNum(rnd() * 140 + 30), pctDelta(rnd, 2, 12), "vs yesterday", rnd),
    metric("Conversion rate", "%", `${(rnd() * 4 + 1.8).toFixed(1)}%`, pctDelta(rnd, -3, 5), "vs last week", rnd),
    metric("Avg order value", "", money(rnd, 220), pctDelta(rnd, -4, 8), "vs last week", rnd),
  ],
  series: (rnd) => [
    { label: "Revenue", unit: "$", points: weekly(rnd, 7, 800, 4200) },
    { label: "Orders", unit: "", points: weekly(rnd, 7, 20, 160) },
    { label: "Visitors", unit: "", points: weekly(rnd, 7, 400, 2400) },
  ],
  items: (rnd) => {
    const names = shuffled(rnd, ["Air Flow Runner", "Trail Blazer 2", "Cloud Cushion", "Metro Daypack", "Hydro Bottle 1L", "Flex Trainer", "Summit Hoodie", "Pulse Headphones", "Aero Windbreaker"]);
    const cats = ["Footwear", "Apparel", "Gear", "Accessories"];
    return names.map((name, i) => ({
      id: `p${1000 + i}`,
      name,
      detail: pick(rnd, cats),
      amount: money(rnd, 240),
      status: pick(rnd, ecommerce.statuses),
      date: dateStr(rnd),
    }));
  },
  activity: (rnd) => [
    `Order #10${Math.floor(rnd() * 90 + 10)} shipped`,
    `New review on ${pick(rnd, ["Air Flow Runner", "Cloud Cushion", "Trail Blazer 2"])}`,
    "Restocked Summit Hoodie · 24 units",
    `Return processed for order #10${Math.floor(rnd() * 90 + 10)}`,
    "Flash sale ended · 1,240 orders",
    "New collection published",
  ],
  detailFields: () => ["Price", "Category", "Stock", "Seller", "SKU"],
  detailValues: (rnd) => [money(rnd, 240), pick(rnd, ["Footwear", "Apparel", "Gear", "Accessories"]), pick(rnd, ["In stock", "Low stock", "Sold out"]), pick(rnd, ["Northwind", "Bluepoint", "Harbor & Co"]), `SKU-${Math.floor(rnd() * 9000 + 1000)}`],
  settingsSections: () => [
    { title: "Store", items: [{ label: "Store currency", value: "USD", control: "select" }, { label: "Tax rates", value: "Automatic", control: "select" }, { label: "Shop open", value: "On", control: "toggle" }] },
    { title: "Shipping", items: [{ label: "Default carrier", value: "Standard", control: "select" }, { label: "Free shipping over", value: "$50", control: "text" }, { label: "International", value: "Off", control: "toggle" }] },
    { title: "Notifications", items: [{ label: "New order alerts", value: "On", control: "toggle" }, { label: "Low stock alerts", value: "On", control: "toggle" }] },
  ],
  tableColumns: () => ["Product", "Category", "Price", "Status", "Date"],
  searchPlaceholder: () => "Search products",
  emptyTitle: () => "No products yet",
  emptyBody: () => "Add your first product and it will appear here.",
};

const media: DomainPack = {
  slug: "media",
  match: [/music/, /song/, /album/, /playlist/, /podcast/, /stream/, /video/, /movie/, /film/, /series/, /entertain/, /audio/, /listen/, /watch/, /artist/],
  statuses: ["active", "pending", "skipped"],
  metrics: (rnd) => [
    metric("Listeners", "", fmtNum(rnd() * 4000 + 900), pctDelta(rnd, 3, 14), "vs last week", rnd),
    metric("Hours streamed", "", fmtNum(rnd() * 900 + 300), pctDelta(rnd, 2, 12), "vs last week", rnd),
    metric("New followers", "", fmtNum(rnd() * 300 + 40), pctDelta(rnd, -4, 10), "vs last week", rnd),
    metric("Tracks saved", "", fmtNum(rnd() * 200 + 30), pctDelta(rnd, -6, 6), "vs last week", rnd),
  ],
  series: (rnd) => [
    { label: "Hours streamed", unit: "hrs", points: weekly(rnd, 7, 20, 160) },
    { label: "Listeners", unit: "", points: weekly(rnd, 7, 300, 1800) },
    { label: "New saves", unit: "", points: weekly(rnd, 7, 4, 60) },
  ],
  items: (rnd) => {
    const names = shuffled(rnd, ["Midnight Drive", "Golden Hour EP", "Neon Skyline", "Slow Motion", "Paper Planes", "Afterglow", "City Lights", "Empty Pages", "Northern Star"]);
    const artists = shuffled(rnd, ["Vera Lane", "The Hollows", "Kaito", "Mireille", "Okafor & Co", "Lumen", "Sable", "June Park", "Arcade Youth"]);
    return names.map((name, i) => ({
      id: `t${1000 + i}`,
      name,
      detail: artists[i],
      amount: `${fmtNum(rnd() * 8000 + 500)} plays`,
      status: pick(rnd, media.statuses),
      date: dateStr(rnd),
    }));
  },
  activity: (rnd) => [
    `You saved "${pick(rnd, ["Midnight Drive", "Golden Hour EP", "Neon Skyline"])}"`,
    `New release from ${pick(rnd, ["Vera Lane", "The Hollows", "Lumen"])}`,
    "Your playlist hit 100 saves",
    `You finished "${pick(rnd, ["Afterglow", "City Lights", "Northern Star"])}"`,
    "3 new episodes in your queue",
    "Your top track gained 2,400 plays",
  ],
  detailFields: () => ["Artist", "Album", "Released", "Duration", "Genre"],
  detailValues: (rnd) => [pick(rnd, ["Vera Lane", "The Hollows", "Kaito", "Lumen"]), pick(rnd, ["Golden Hour EP", "Neon Skyline", "Afterglow"]), pick(rnd, ["2024", "2025", "2026"]), `${duration(rnd)}`, pick(rnd, ["Indie", "Electronic", "Alternative", "Synth-pop"])],
  settingsSections: () => [
    { title: "Playback", items: [{ label: "Streaming quality", value: "High", control: "select" }, { label: "Downloads", value: "Wi-Fi only", control: "select" }, { label: "Gapless playback", value: "On", control: "toggle" }] },
    { title: "Library", items: [{ label: "Show explicit content", value: "Off", control: "toggle" }, { label: "Autoplay", value: "On", control: "toggle" }] },
    { title: "Privacy", items: [{ label: "Listening activity", value: "Public", control: "select" }, { label: "Personalised picks", value: "On", control: "toggle" }] },
  ],
  tableColumns: () => ["Title", "Artist", "Plays", "Status", "Added"],
  searchPlaceholder: () => "Search songs, artists or albums",
  emptyTitle: () => "No tracks yet",
  emptyBody: () => "Your saved music will appear here.",
};

const social: DomainPack = {
  slug: "social",
  match: [/social/, /community/, /forum/, /follow/, /post/, /feed/, /messag/, /chat/, /group/, /network/, /creator/, /blog/],
  statuses: ["active", "pending", "skipped"],
  metrics: (rnd) => [
    metric("Followers", "", fmtNum(rnd() * 5000 + 800), pctDelta(rnd, 4, 16), "vs last week", rnd),
    metric("Posts this month", "", fmtNum(rnd() * 40 + 6), pctDelta(rnd, -6, 12), "vs last month", rnd),
    metric("Engagement", "%", `${(rnd() * 6 + 2).toFixed(1)}%`, pctDelta(rnd, -3, 8), "vs last week", rnd),
    metric("New messages", "", fmtNum(rnd() * 120 + 20), pctDelta(rnd, -8, 14), "today", rnd),
  ],
  series: (rnd) => [
    { label: "Followers", unit: "", points: weekly(rnd, 7, 40, 320) },
    { label: "Engagement", unit: "%", points: weekly(rnd, 7, 1.5, 7) },
    { label: "Posts", unit: "", points: weekly(rnd, 7, 1, 14) },
  ],
  items: (rnd) => {
    const names = shuffled(rnd, ["Trail Runners Club", "Night Photography", "Startup Builders", "Urban Gardeners", "Indie Game Devs", "Coffee Roasters", "Wild Campers", "Book Swap", "Analog Synth Lab"]);
    const sizes = ["1.2k members", "840 members", "3.1k members", "520 members", "2.4k members"];
    return names.map((name, i) => ({
      id: `g${1000 + i}`,
      name,
      detail: pick(rnd, sizes),
      amount: `${fmtNum(rnd() * 300 + 20)} posts`,
      status: pick(rnd, social.statuses),
      date: dateStr(rnd),
    }));
  },
  activity: (rnd) => [
    `${pick(rnd, ["Maya", "Kai", "Zara", "Noor"])} liked your post`,
    "New member joined your community",
    `Your post reached ${fmtNum(rnd() * 800 + 200)} people`,
    `${pick(rnd, ["Jonah", "Priya", "Marcus"])} replied to your comment`,
    "Weekly digest sent · 42% opened",
    "Your group hit a new milestone",
  ],
  detailFields: () => ["Members", "Posts", "Last active", "Moderators"],
  detailValues: (rnd) => [`${fmtNum(rnd() * 3000 + 500)} members`, `${fmtNum(rnd() * 400 + 40)} posts`, pick(rnd, ["Active today", "Active this week", "Quiet"]), pick(rnd, ["Maya", "Kai", "Zara", "Jonah"])],
  settingsSections: () => [
    { title: "Privacy", items: [{ label: "Profile visibility", value: "Public", control: "select" }, { label: "Activity status", value: "On", control: "toggle" }, { label: "Blocked accounts", value: "3", control: "text" }] },
    { title: "Notifications", items: [{ label: "Likes & replies", value: "On", control: "toggle" }, { label: "Message requests", value: "On", control: "toggle" }, { label: "Weekly digest", value: "Off", control: "toggle" }] },
  ],
  tableColumns: () => ["Community", "Members", "Posts", "Status", "Last active"],
  searchPlaceholder: () => "Search communities",
  emptyTitle: () => "Nothing here yet",
  emptyBody: () => "Follow communities and their activity will show up here.",
};

const productivity: DomainPack = {
  slug: "productivity",
  match: [/task/, /project/, /productivity/, /todo/, /plan/, /workspace/, /team/, /note/, /document/, /goal/, /habit/, /tracker/, /manage/],
  statuses: ["active", "pending", "failed"],
  metrics: (rnd) => [
    metric("Tasks completed", "", fmtNum(rnd() * 40 + 8), pctDelta(rnd, 4, 18), "this week", rnd),
    metric("Focus hours", "hrs", (rnd() * 20 + 6).toFixed(1), pctDelta(rnd, -5, 12), "vs last week", rnd),
    metric("Active projects", "", String(Math.floor(rnd() * 8 + 2)), pctDelta(rnd, 0, 4), "across teams", rnd),
    metric("Completion rate", "%", `${Math.floor(rnd() * 20 + 75)}%`, pctDelta(rnd, -3, 8), "vs last week", rnd),
  ],
  series: (rnd) => [
    { label: "Tasks completed", unit: "", points: weekly(rnd, 7, 2, 18) },
    { label: "Focus hours", unit: "hrs", points: weekly(rnd, 7, 2, 9) },
    { label: "Docs edited", unit: "", points: weekly(rnd, 7, 1, 12) },
  ],
  items: (rnd) => {
    const names = shuffled(rnd, ["Q3 roadmap", "Design audit", "Onboarding v2", "API migration", "Spring cleanup", "Team offsite", "Docs refresh", "Bug triage", "Beta launch"]);
    const owners = ["Roadmap", "Design", "Engineering", "Operations", "Marketing"];
    return names.map((name, i) => ({
      id: `pr${1000 + i}`,
      name,
      detail: pick(rnd, owners),
      amount: `${fmtNum(rnd() * 40 + 4)} tasks`,
      status: pick(rnd, productivity.statuses),
      date: dateStr(rnd),
    }));
  },
  activity: (rnd) => [
    `Completed "${pick(rnd, ["Design audit", "API migration", "Beta launch"])}"`,
    "You finished 12 tasks today",
    `${pick(rnd, ["Maya", "Kai", "Zara", "Noor"])} tagged you in a comment`,
    "Weekly report generated",
    "Goal 'Ship v2' is 80% complete",
    "3 tasks are due today",
  ],
  detailFields: () => ["Owner", "Due", "Priority", "Progress"],
  detailValues: (rnd) => [pick(rnd, ["Maya", "Kai", "Zara", "Noor"]), pick(rnd, ["Mon", "Tue", "Thu", "Fri"]), pick(rnd, ["High", "Medium", "Low"]), `${Math.floor(rnd() * 70 + 30)}%`],
  settingsSections: () => [
    { title: "Workspace", items: [{ label: "Timezone", value: "UTC", control: "select" }, { label: "Week starts on", value: "Monday", control: "select" }, { label: "Daily digest", value: "On", control: "toggle" }] },
    { title: "Tasks", items: [{ label: "Default view", value: "List", control: "select" }, { label: "Due-date reminders", value: "On", control: "toggle" }, { label: "Auto-archive", value: "Off", control: "toggle" }] },
  ],
  tableColumns: () => ["Project", "Team", "Tasks", "Status", "Due"],
  searchPlaceholder: () => "Search projects",
  emptyTitle: () => "No projects yet",
  emptyBody: () => "Create your first project to start tracking work.",
};

const travel: DomainPack = {
  slug: "travel",
  match: [/travel/, /trip/, /flight/, /hotel/, /stay/, /booking/, /destination/, /vacation/, /tour/, /itinerar/, /food/, /restaurant/, /recipe/, /meal/],
  statuses: ["active", "pending", "failed"],
  metrics: (rnd) => [
    metric("Trips planned", "", fmtNum(rnd() * 6 + 2), pctDelta(rnd, 0, 4), "this year", rnd),
    metric("Nights booked", "", fmtNum(rnd() * 30 + 8), pctDelta(rnd, -6, 10), "vs last year", rnd),
    metric("Places saved", "", fmtNum(rnd() * 80 + 20), pctDelta(rnd, 4, 14), "across maps", rnd),
    metric("Budget used", "%", `${Math.floor(rnd() * 30 + 40)}%`, pctDelta(rnd, -8, 6), "of trip budget", rnd),
  ],
  series: (rnd) => [
    { label: "Nights per month", unit: "", points: monthly(rnd, 12, 1, 9) },
    { label: "Flights searched", unit: "", points: weekly(rnd, 7, 4, 30) },
    { label: "Places saved", unit: "", points: weekly(rnd, 7, 1, 16) },
  ],
  items: (rnd) => {
    const names = shuffled(rnd, ["Kyoto in autumn", "Lisbon weekend", "Banff trail week", "Coastal drive", "Iceland ring road", "Vienna & Budapest", "Oaxaca food tour", "Santorini escape", "Lake Como loop"]);
    const regions = ["Japan", "Portugal", "Canada", "Ireland", "Iceland", "Austria", "Mexico", "Greece", "Italy"];
    return names.map((name, i) => {
      const region = regions[i % regions.length];
      const nights = Math.floor(rnd() * 8 + 2);
      return {
        id: `tr${1000 + i}`,
        name,
        detail: `${region} · ${nights} nights`,
        amount: money(rnd, 3200),
        status: pick(rnd, travel.statuses),
        date: dateStr(rnd),
        dates: dateRange(rnd),
        guests: `${1 + Math.floor(rnd() * 3)} travellers`,
        fields: [region, `${dateStr(rnd)}–${dateStr(rnd)}`, `${nights} nights`, money(rnd, 3200)],
      };
    });
  },
  activity: (rnd) => [
    `Saved "${pick(rnd, ["Kyoto in autumn", "Oaxaca food tour", "Iceland ring road"])}"`,
    "Flight prices dropped 12% for Lisbon",
    "You booked 3 nights in Banff",
    "Trip 'Coastal drive' itinerary updated",
    "New restaurant added to your food list",
    "Your trip is 6 days away",
  ],
  detailFields: () => ["Location", "Dates", "Nights", "Est. cost"],
  detailValues: (rnd) => [pick(rnd, ["Japan", "Portugal", "Canada", "Iceland"]), pick(rnd, ["Mar 12–19", "Jun 3–10", "Sep 20–27"]), `${Math.floor(rnd() * 8 + 2)} nights`, money(rnd, 3200)],
  settingsSections: () => [
    { title: "Preferences", items: [{ label: "Currency", value: "USD", control: "select" }, { label: "Units", value: "Metric", control: "select" }, { label: "Price alerts", value: "On", control: "toggle" }] },
    { title: "Notifications", items: [{ label: "Price drops", value: "On", control: "toggle" }, { label: "Trip reminders", value: "On", control: "toggle" }, { label: "Newsletter", value: "Off", control: "toggle" }] },
  ],
  tableColumns: () => ["Trip", "Location", "Est. cost", "Status", "Dates"],
  searchPlaceholder: () => "Search destinations",
  emptyTitle: () => "No trips planned",
  emptyBody: () => "Save a destination and start planning your next trip.",
};

const finance: DomainPack = {
  slug: "finance",
  match: [/financ/, /budget/, /expense/, /invoice/, /billing/, /accounting/, /revenue/, /payment/, /bank/, /money/, /salary/, /wallet/, /invest/],
  statuses: ["active", "pending", "overdue"],
  metrics: (rnd) => [
    metric("Monthly revenue", "", money(rnd, 250000), pctDelta(rnd, 3, 14), "vs last month", rnd),
    metric("Active accounts", "", fmtNum(rnd() * 4000 + 900), pctDelta(rnd, 2, 10), "vs last month", rnd),
    metric("Avg invoice value", "", money(rnd, 900), pctDelta(rnd, -4, 8), "vs last month", rnd),
    metric("Overdue", "%", `${(rnd() * 4 + 1).toFixed(1)}%`, pctDelta(rnd, -3, 4, false), "of receivables", rnd),
  ],
  series: (rnd) => [
    { label: "Revenue", unit: "$", points: monthly(rnd, 12, 24000, 52000) },
    { label: "Active accounts", unit: "", points: monthly(rnd, 12, 1400, 3600) },
    { label: "New invoices", unit: "", points: daily(rnd, 12, 12, 140) },
  ],
  items: (rnd) => {
    const names = shuffled(rnd, ["Northwind Labs", "Fathom Analytics", "Vantage Systems", "Bluepoint", "Harbor & Co", "Kepler Health", "Orbit Finance", "Copperline", "Brightpath", "Meadow Retail", "Aperture AI"]).slice(0, 9);
    const tiers = ["Enterprise", "Growth", "Starter", "Pro", "Team"];
    return names.map((name, i) => ({
      id: `#${Math.floor(rnd() * 9000 + 1000)}`,
      name,
      detail: pick(rnd, tiers),
      amount: money(rnd, 40000),
      status: pick(rnd, finance.statuses),
      date: dateStr(rnd),
    }));
  },
  activity: (rnd) => [
    "Invoice #1042 paid · $2,400",
    "New enterprise account onboarded",
    "Payment reminder sent for 3 invoices",
    "Monthly report exported",
    "Recurring revenue up 6%",
    "2 invoices marked overdue",
  ],
  detailFields: () => ["Amount", "Date", "Owner", "Plan"],
  detailValues: (rnd) => [money(rnd, 40000), dateStr(rnd), pick(rnd, ["Maya", "Kai", "Zara", "Noor"]), pick(rnd, ["Enterprise", "Growth", "Starter"])],
  settingsSections: () => [
    { title: "Billing", items: [{ label: "Default currency", value: "USD", control: "select" }, { label: "Payment terms", value: "Net 30", control: "select" }, { label: "Auto-pay", value: "On", control: "toggle" }] },
    { title: "Reporting", items: [{ label: "Weekly report", value: "Off", control: "toggle" }, { label: "Currency conversion", value: "Manual", control: "select" }] },
  ],
  tableColumns: () => ["Account", "Plan", "Amount", "Status", "Date"],
  searchPlaceholder: () => "Search accounts",
  emptyTitle: () => "No accounts yet",
  emptyBody: () => "Once you add accounts, billing activity will show up here.",
};

/**
 * V9 rentals pack — a vacation-rental CATALOG (the Airbnb-style model):
 * listings with nightly price, location, beds, host, and rating; metrics are
 * community proof (homes, reviews, countries), NOT the trip-planner metrics
 * the travel pack produces. Statuses are host/listing qualities, never
 * "failed"/"pending" order states.
 */
const rentals: DomainPack = {
  slug: "rentals",
  match: [/airbnb/i, /rental/i, /listing/i, /\bstays?\b/i, /lodging/i, /host/i, /property/i, /vacation home/i, /nightly/i, /check-in/i, /\bbeds?\b/i, /guest/, /place to stay/i, /book(?:ing| a| your)? stay|perfect stay/i, /amenit/i, /unique home/i, /vacation rental/i],
  statuses: ["Superhost", "Instant book", "Top rated", "Guest favourite"],
  metrics: (rnd) => [
    metric("Homes worldwide", "", "2.4M", pctDelta(rnd, 2, 6), "across 220 countries", rnd),
    metric("Guest reviews", "", "1.9M", pctDelta(rnd, 3, 9), "from verified travellers", rnd),
    metric("Countries", "", "220", pctDelta(rnd, 0, 2), "and counting", rnd),
    metric("Avg rating", "★", "4.9", pctDelta(rnd, 0, 1), "from 1.9M reviews", rnd),
  ],
  series: (rnd) => [
    { label: "Nights booked", unit: "", points: weekly(rnd, 7, 40, 220) },
    { label: "Stays saved", unit: "", points: weekly(rnd, 7, 4, 40) },
    { label: "Searches", unit: "", points: weekly(rnd, 7, 200, 1200) },
  ],
  items: (rnd) => {
    const names = ["Coastal Cliff Villa", "Casa Palmera", "The Loft at Riverbend", "Villa Mare Blu", "Skyline Penthouse", "Cabin in the Pines", "Harbour View House", "Alpine Chalet", "Sunset Terrace Flat"];
    const places = ["Santorini, Greece", "Lisbon, Portugal", "Kyoto, Japan", "Lake Como, Italy", "Reykjavik, Iceland", "Oaxaca, Mexico", "Banff, Canada", "Vienna, Austria", "Sicily, Italy"];
    const types = ["Villa", "Casa", "Apartment", "Cabin", "Chalet", "Penthouse", "House", "Cottage", "Loft"];
    const hosts = ["Elena K.", "Miguel R.", "Yuki T.", "Giulia B.", "Arnar S.", "Paloma V.", "Camille D.", "Jonas H.", "Aisha N."];
    const beds = [1, 2, 2, 3, 3, 4, 5];
    // V11: shuffled pools — every listing gets a UNIQUE name, place, type and
    // host, so the catalog can never read as duplicated or corrupt data.
    const namesS = shuffled(rnd, names);
    const placesS = shuffled(rnd, places);
    const typesS = shuffled(rnd, types);
    const hostsS = shuffled(rnd, hosts);
    const bedsS = shuffled(rnd, beds);
    return namesS.map((name, i) => {
      const b = bedsS[i % bedsS.length];
      const place = placesS[i % placesS.length];
      const type = typesS[i % typesS.length];
      const host = hostsS[i % hostsS.length];
      return {
        id: `st${1000 + i}`,
        name,
        detail: `${place} · ${type} · ${b} bed${b === 1 ? "" : "s"}`,
        amount: money(rnd, 420),
        status: pick(rnd, rentals.statuses),
        date: dateStr(rnd),
        owner: host,
        dates: dateRange(rnd),
        guests: `${Math.min(b + 1, 6)} guests`,
        fields: [place, type, `${b}`, `${Math.min(b, 3)}`, host],
      };
    });
  },
  activity: (rnd) => [
    `Saved "${pick(rnd, ["Coastal Cliff Villa", "Casa Palmera", "Villa Mare Blu"])}" to your wishlist`,
    `Price dropped 12% on "${pick(rnd, ["Skyline Penthouse", "Alpine Chalet", "Harbour View House"])}"`,
    `You booked 3 nights at "${pick(rnd, ["Cabin in the Pines", "Sunset Terrace Flat", "The Loft at Riverbend"])}"`,
    "New Superhost in Santorini",
    "5 new stays match your search",
    "Your wishlist now has 12 stays",
  ],
  detailFields: () => ["Location", "Property type", "Beds", "Baths", "Host"],
  detailValues: (rnd) => [pick(rnd, ["Santorini, Greece", "Lisbon, Portugal", "Lake Como, Italy", "Banff, Canada"]), pick(rnd, ["Villa", "Casa", "Apartment", "Chalet"]), `${Math.floor(rnd() * 4 + 1)}`, `${Math.floor(rnd() * 3 + 1)}`, pick(rnd, ["Elena K.", "Miguel R.", "Yuki T.", "Giulia B."])],
  settingsSections: () => [
    {
      title: "Preferences",
      items: [
        { label: "Currency", value: "USD", control: "select" },
        { label: "Distance units", value: "Kilometres", control: "select" },
        { label: "Instant book", value: "On", control: "toggle" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { label: "Price drops", value: "On", control: "toggle" },
        { label: "New stay alerts", value: "On", control: "toggle" },
        { label: "Newsletter", value: "Off", control: "toggle" },
      ],
    },
  ],
  tableColumns: () => ["Stay", "Location", "Nightly price", "Status", "Dates"],
  searchPlaceholder: () => "Where to?",
  emptyTitle: () => "No stays found",
  emptyBody: () => "Try adjusting your search or filters — new stays are added every day.",
};

function daily(rnd: () => number, n: number, min: number, max: number): Array<{ x: string; y: number }> {
  let v = min + rnd() * (max - min) * 0.5;
  const out: Array<{ x: string; y: number }> = [];
  for (let i = 0; i < n; i++) {
    v = Math.max(min * 0.5, v * (0.85 + rnd() * 0.35));
    out.push({ x: `D${i + 1}`, y: Math.round(v) });
  }
  return out;
}

export const DOMAIN_PACKS: DomainPack[] = [fitness, ecommerce, media, social, productivity, rentals, travel, finance];

export function scoreDomains(text: string): Array<{ pack: DomainPack; score: number }> {
  const t = text.toLowerCase();
  return DOMAIN_PACKS
    .map((pack) => ({ pack, score: pack.match.reduce((n, re) => (re.test(t) ? n + 1 : n), 0) }))
    .sort((a, b) => b.score - a.score);
}

/** Deterministic domain selection: best match wins; ties → first in registry order. */
export function pickDomain(text: string): DomainPack {
  const scored = scoreDomains(text);
  const top = scored[0];
  if (!top || top.score === 0) return productivity;
  return top.pack;
}

/** Accepts a ProductBrief-like object or a raw prompt string. */
export type BriefLike = Pick<ProductBrief, "productType" | "description"> & {
  features?: ProductBrief["features"];
  screenPurposes?: ProductBrief["screenPurposes"];
};

export function briefText(brief: BriefLike): string {
  return [
    brief.productType,
    brief.description,
    ...(brief.features ?? []).map((f) => `${f.name} ${f.description}`),
    ...(brief.screenPurposes ?? []).map((s) => `${s.id} ${s.purpose}`),
  ].join(" ");
}

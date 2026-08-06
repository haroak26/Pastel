import type { ProductBrief, WireframePlan, ComponentInventory, CopyPlan, ResolvedTheme, BlockInstance, WireframeScreen, UxDesignPlan } from "./schemas-v6";
import { mockDataset, normalizeUnit, hashSeed, type MockDataset } from "./lib/content";
import { DOMAIN_PRIMARY_CTA, DOMAIN_HOME_CTA, PRICE_SUFFIX, REVIEW_HEADING, TRUST_ITEMS } from "./lib/domains";
import { baseComponentCode } from "./base-components/index";
import { uxLayoutFor } from "./lib/ux-design";
import { sectionPad, padCls, BAND_PAD, type PadContext } from "./lib/layout";
import { sceneSvg } from "./lib/scenes";

/** A block instance as the recipes receive it — rhythm pad attached. */
export type PaddedBlock = BlockInstance & PadContext;

/**
 * V6/V9 deterministic screen composer.
 *
 * Given the wireframe plan, the company theme, the copy plan and mock data,
 * emits the screen files. Screens are code-composed from the generated
 * components — the model never draws layout. Every block recipe below is
 * hand-written and known-good; the only variance is which blocks, in which
 * order, with which copy and data. Company flavor arrives through the theme
 * tokens/rules and the generated components.
 *
 * V7 changes:
 * - All recipe content is COPY/DATA-DRIVEN. Nothing hardcodes a domain
 *   ("Revenue", "$", invoices, payment methods) — the domain pack selected
 *   from the brief fills every slot, so a fitness app can never ship finance
 *   content.
 * - Signature-move variants implement the company's design.md in code:
 *   `stats:scoreboard` (giant tabular numbers + accent deltas), `cta:slogan`
 *   (single-word statement band), `hero:fullbleed` (accent CTA), and the
 *   search recipes use Select dropdowns instead of chip groups.
 * - Card surfaces are budgeted: rows/lists render as divided rows, and the
 *   content gate enforces the budget per screen.
 *
 * V9 changes (two-screen product model):
 * - The product is EXACTLY two screens: "home" (main browse/catalog) and
 *   "detail" (single-item info page). `lib/ux-design.ts` enforced the
 *   canonical block structure; this file renders it well.
 * - Photo-first product cards (hue-tinted media tile + title + rating/price
 *   row) — the catalog moment on home.
 * - The detail screen: photo gallery hero, a two-column info layout with a
 *   STICKY summary card (price + rating + domain-aware primary CTA), a
 *   domain-aware action band, and guest reviews as divided rows.
 * - Card discipline by construction: the grid is the only card cluster on
 *   home; the summary is the ONE card on detail; everything else is
 *   bands/rows/tiles/toolbar. Outline buttons are capped at one per action
 *   row.
 *
 * Component resolution (v2): the wireframe inventory may RENAME components
 * (e.g. `WorkoutStatRow` basedOn `StatCard`). Recipe generics resolve through
 * the inventory via `basedOn` (preferring the component used by THIS screen)
 * and are imported under their built name. Two exceptions stay generic:
 *   - `Card` / `Table` — named-export wrapper primitives used structurally.
 *   - any generic with no inventory match — imported as-is.
 * Both are materialized from the base component library by the orchestrator
 * when the builder did not produce them, so screens ALWAYS compile.
 */

export interface ComposeInput {
  brief: ProductBrief;
  wireframe: WireframePlan;
  /** The wireframe's component inventory — used to resolve recipe generics
   * (e.g. "StatCard") to the built component names (e.g. "WorkoutStatRow"). */
  inventory: ComponentInventory;
  copy: CopyPlan;
  theme: ResolvedTheme;
  data: MockDataset;
  /** V9 UX design plan — pair/sticky/surface choices per section. */
  ux?: UxDesignPlan | null;
}

// ── Data file ─────────────────────────────────────────────────────────────

/** Catalog-led products: the home hero is a search hero ("Where to?" +
 * dates + guests + Search), not a metric band — the catalog is the story. */
const CATALOG_DOMAINS = new Set(["travel", "rentals", "ecommerce"]);

export function composeDataFile(input: ComposeInput): string {
  const { data, copy, brief } = input;
  const features = brief.features.length > 0 ? brief.features : [
    { name: "Core experience", description: "The primary workflow, done well.", priority: "critical" },
    { name: "Fast search", description: "Find anything in seconds.", priority: "high" },
  ];

  const copyByScreen: Record<string, unknown> = {};
  for (const s of copy.screens) copyByScreen[s.screenId] = s;

  // V11: coherent booking summary for the detail screen — price, dates,
  // guests, and a plausible total ALL derive from the SAME first listing
  // (the old positional zip rendered "Dates: Apartment" — a label/value
  // mismatch that survived three releases).
  const first = data.rows[0];
  const priceNum = parseFloat((first?.amount ?? "").replace(/[^0-9.]/g, ""));
  const nightlyDomain = data.domain === "rentals" || data.domain === "travel";
  const summary = {
    price: first?.amount ?? "",
    total: priceNum > 0 && nightlyDomain ? `$${Math.round(priceNum * 3).toLocaleString("en-US")}` : (first?.amount ?? ""),
    nightly: nightlyDomain ? " night" : "",
    dates: first?.dates ?? (first?.fields ? first.fields[1] : undefined) ?? "Flexible dates",
    guests: first?.guests ?? "2 guests",
  };

  // V10 cross-screen integrity: every screen reads ONLY from its own scoped
  // view. `home` is the catalog (rows/metrics/series); `detail` is ONE item
  // (its photos, fields, reviews, summary). The content gate rejects any
  // bare DATA.<global> reference in a screen file, so the "catalog grid on
  // the detail page" class of bug is impossible by construction.
  const DATA = {
    productTitle: brief.title,
    productType: brief.productType,
    description: brief.description,
    domain: data.domain,
    people: data.people.map((p) => ({ name: p.name, role: p.role, initials: p.initials, hue: p.hue })),
    copy: copyByScreen,
    screens: {
      home: {
        rows: data.rows,
        metrics: data.metrics,
        series: data.series,
        activity: data.activity,
        features,
        settingsSections: data.settingsSections,
        emptyTitle: data.emptyTitle,
        emptyBody: data.emptyBody,
      },
      detail: {
        item: first ?? data.rows[0],
        rows: first ? [first] : [],
        images: [0, 1, 2, 3, 4],
        // V11 semantic contract: {label, value} PAIRS from the SAME pack —
        // labels and values can never disagree ("Host name: Oaxaca, Mexico"
        // class of bug is impossible by construction).
        fields: data.detailFields.map((label, i) => ({
          label,
          value: first?.fields?.[i] ?? data.detailValues[i] ?? "—",
        })),
        // V14: social proof comes from the DATA agent's dataset (fallback
        // fills it from the domain packs) — never baked template phrases.
        reviews: data.reviews,
        summary,
        primaryCta: data.primaryCta ?? DOMAIN_PRIMARY_CTA[data.domain] ?? "Continue",
      },
    },
  };

  return `// Deterministic content — domain-aware copy + sample data for this run.
// V10: each screen reads ONLY its own scoped view (DATA.screens.<id>).
export const DATA = ${JSON.stringify(DATA, null, 2)};
`;
}

// ── Shared helpers for generated screens ──────────────────────────────────

const STATUS_TONE: Record<string, string> = {
  active: "success", paid: "success", healthy: "success", complete: "success", done: "success",
  live: "success", planned: "secondary", scheduled: "secondary",
  pending: "warning", draft: "warning", processing: "warning", warning: "warning", upcoming: "warning",
  failed: "destructive", overdue: "destructive", error: "destructive",
  skipped: "muted", paused: "muted", inactive: "muted",
};

const ICONS: Record<string, string> = {
  home: "Home", list: "List", chart: "LineChart", settings: "SettingsIcon", users: "Users",
  bell: "Bell", search: "Search", plus: "Plus", download: "Download", filter: "Filter",
  arrowRight: "ArrowRight", mail: "Mail", alert: "AlertCircle", file: "FileText", edit: "Edit",
  check: "CheckCircle2", zap: "Zap", card: "CreditCard", trendingUp: "TrendingUp", play: "Play",
  heart: "Heart", mapPin: "MapPin", star: "Star", clock: "Clock", image: "Image", more: "MoreHorizontal",
  chevronDown: "ChevronDown", calendarDays: "CalendarDays",
};

const ICON_MAP = `
function IconOf({ name, className = "h-4 w-4" }) {
  const icons = {
    home: <Home className={className} />,
    list: <List className={className} />,
    chart: <LineChart className={className} />,
    settings: <SettingsIcon className={className} />,
    users: <Users className={className} />,
    bell: <Bell className={className} />,
    search: <Search className={className} />,
    plus: <Plus className={className} />,
    download: <Download className={className} />,
    filter: <Filter className={className} />,
    arrowRight: <ArrowRight className={className} />,
    mail: <Mail className={className} />,
    alert: <AlertCircle className={className} />,
    file: <FileText className={className} />,
    edit: <Edit className={className} />,
    check: <CheckCircle2 className={className} />,
    zap: <Zap className={className} />,
    card: <CreditCard className={className} />,
    trendingUp: <TrendingUp className={className} />,
    play: <Play className={className} />,
    heart: <Heart className={className} />,
    mapPin: <MapPin className={className} />,
    star: <Star className={className} />,
    clock: <Clock className={className} />,
    image: <Image className={className} />,
    more: <MoreHorizontal className={className} />,
    chevronDown: <ChevronDown className={className} />,
    calendarDays: <CalendarDays className={className} />,
  };
  return icons[name] ?? null;
}`;

/** V11 Airbnb-style search row — destination + check-in/check-out + guests +
 * ONE Search button, always visible (wraps gracefully on 375px). Every
 * control has a VISIBLE label above it (the v10 builds relied on
 * placeholder/aria-label only — an accessibility defect the gate now
 * enforces). */
function searchFields(placeholder: string, size: "md" | "lg"): string {
  const guestOpts = `[{ value: "1", label: "1 guest" }, { value: "2", label: "2 guests" }, { value: "3", label: "3 guests" }, { value: "4", label: "4+ guests" }]`;
  const labelCls = `block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`;
  const inputCls = `h-8 w-full border-0 bg-transparent p-0 shadow-none focus-visible:ring-offset-0`;
  const seg = (label: string, inner: string, widthCls: string, hidden = false): string => `<div className="flex min-w-0 flex-col justify-center ${widthCls}${hidden ? " hidden lg:flex" : ""}">
      <label className="${labelCls}">${label}</label>
      ${inner}
    </div>`;
  return `<div className="flex min-w-0 flex-1 items-stretch gap-0">
    ${seg("Where", `<Input aria-label="Destination" placeholder=${jstr(placeholder)} className="${inputCls}" />`, "flex-1 pl-3 pr-2")}
    <span className="my-3 w-px shrink-0 bg-border" />
    ${seg("Check-in", `<Input aria-label="Check-in date" icon={CalendarDays} placeholder="Add dates" className="${inputCls}" />`, "w-24 md:w-32 px-2")}
    <span className="hidden w-px shrink-0 bg-border md:block" />
    ${seg("Check-out", `<Input aria-label="Check-out date" icon={CalendarDays} placeholder="Add dates" className="${inputCls}" />`, "w-24 px-2", true)}
    <span className="my-3 w-px shrink-0 bg-border" />
    ${seg("Guests", `<Select aria-label="Guests" placeholder="Add guests" options={${guestOpts}} />`, "w-28 px-2")}
    <div className="flex items-center pr-2 pl-1">
      <Button size="${size === "lg" ? "lg" : "md"}" className="shrink-0 rounded-full"><Search className="h-4 w-4" />Search</Button>
    </div>
  </div>`;
}

/** Quiet filter row for catalog-led products — two labeled Select filters,
 * a result count, and a reset action (v9: browse toolbars stay simple, never
 * chip groups). */
function filterRow(input: ComposeInput): string {
  if (input.data.domain === "rentals" || input.data.domain === "travel") {
    const priceOpts = `[{ value: "", label: "Any price" }, { value: "0-150", label: "Under $150" }, { value: "150-300", label: "$150–$300" }, { value: "300", label: "$300+" }]`;
    const ratingOpts = `[{ value: "", label: "Any rating" }, { value: "4.5", label: "4.5+" }, { value: "4.8", label: "4.8+" }]`;
    return `<div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <Select aria-label="Price" placeholder="Any price" options={${priceOpts}} className="w-40" />
      <Select aria-label="Minimum rating" placeholder="Any rating" options={${ratingOpts}} className="w-40" />
      <span className="text-xs font-medium text-muted-foreground">{DATA.screens.home.rows.length} stays</span>
      <button type="button" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">Clear</button>
    </div>`;
  }
  if (input.data.domain === "ecommerce") {
    const priceOpts = `[{ value: "", label: "Any price" }, { value: "0-50", label: "Under $50" }, { value: "50-150", label: "$50–$150" }, { value: "150", label: "$150+" }]`;
    return `<div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <Select aria-label="Price" placeholder="Any price" options={${priceOpts}} className="w-40" />
      <Select aria-label="Category" placeholder="Any category" options={Array.from(new Set(DATA.screens.home.rows.slice(0, 6).map((r) => r.detail))).slice(0, 4).map((d) => ({ value: d, label: d }))} className="w-44" />
      <span className="text-xs font-medium text-muted-foreground">{DATA.screens.home.rows.length} products</span>
      <button type="button" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">Clear</button>
    </div>`;
  }
  return "";
}

/** App navigation built from the wireframe's own screens — labels are
 * product-relevant ("Stays", "Workouts"), never generic internal descriptors
 * (v9: strips stopwords so a title like "The Main" renders as "Main"). */
const NAV_STOPWORDS = new Set([
  "the", "a", "an", "and", "of", "for", "with", "your", "my", "all",
  "browse", "explore", "discover", "view", "open", "page", "screen",
  "info", "full", "single", "item", "main", "detail", "landing",
]);

export function navFor(wireframe: WireframePlan, data?: MockDataset) {
  return wireframe.screens.map((s) => {
    const id = s.id;
    // V9: the detail tab label IS the selected item's name — the nav can
    // never contradict the page it points at ("Sunlit Bungalow" vs the
    // rendered "Villa Mare Blu" class of bug).
    const detailName = id === "detail" && data?.rows[0]?.name
      ? data.rows[0].name.length > 22 ? data.rows[0].name.slice(0, 21) + "…" : data.rows[0].name
      : null;
    const words = (detailName ?? s.title ?? s.id)
      .replace(/[-_]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter((w) => w.length > 1 && !NAV_STOPWORDS.has(w.toLowerCase()));
    const label = (words.length > 0 ? words : [id]).slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const icon =
      /home|dash|overview|today|landing/.test(id) ? "home"
      : /detail|run|workout|guided|product|track|episode/.test(id) ? "play"
      : /profile|setting|account|goal/.test(id) ? "settings"
      : /history|stat|chart|performance|analytics|report/.test(id) ? "chart"
      : /library|browse|list|shop|catalog|explore|feed|discover/.test(id) ? "list"
      : "file";
    return { id, label: label || id, icon };
  }).slice(0, 5);
}

/** V9: one shared scaffold file (src/lib/shell.jsx) instead of duplicating
 * the tone map, nav constants, and icon map inside every screen. */
function composeShell(input: ComposeInput): string {
  const lucideNames = Object.values(ICONS).sort();
  const aliased = lucideNames.includes("SettingsIcon") ? `Settings as SettingsIcon` : null;
  const lucideList = (aliased ? [aliased, ...lucideNames.filter((n) => n !== "SettingsIcon")] : lucideNames).sort();
  const iconMap = ICON_MAP.trim().replace(/^function IconOf/, "export function IconOf");
  return `// Generated shell — shared screen scaffolding (tones, nav, icon map).
import { ${lucideList.join(", ")} } from "lucide-react";

export const TONE = {
${Object.entries(STATUS_TONE).map(([k, v]) => `  ${k}: "${v}"`).join(",\n")}
};

export const signed = (n) => (n > 0 ? "+" : "") + n + "%";

export const NAV = ${JSON.stringify(navFor(input.wireframe, input.data))};

${iconMap}
`;
}

// ── Block recipes ─────────────────────────────────────────────────────────

type RecipeResult = { jsx: string; comps: Set<string>; icons: Set<string>; prelude?: string };

function copyFor(copy: CopyPlan, screenId: string) {
  return copy.screens.find((s) => s.screenId === screenId) ?? { screenId, headline: screenId };
}

/** V14: the home hero's action — the DATA agent's homeCta wins; the domain
 * pack map is the deterministic fallback. */
function homeCtaOf(input: ComposeInput): string {
  return input.data.homeCta ?? DOMAIN_HOME_CTA[input.data.domain] ?? "Get started";
}

/** V14: the price suffix on catalog cards — the DATA agent's priceSuffix
 * wins (nightly " night" / " total"); fallback keeps the domain map. */
function priceSuffixOf(input: ComposeInput): string {
  return input.data.priceSuffix ?? PRICE_SUFFIX[input.data.domain] ?? "";
}

function jstr(s: string | undefined): string {
  return `'${(s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " ")}'`;
}

/** Escaped plain text for JSX TEXT positions (jstr adds quotes — that is for
 * JS string literals and attribute values; text positions must not quote). */
function txt(s: string | undefined): string {
  return (s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\r?\n/g, " ").replace(/</g, "&lt;");
}

/** V10 generative scene tile — a deterministic local SVG scene (no network,
 * always renders, theme-colored). `SCENES` is a module-level const injected
 * by the recipe's prelude; the runtime just indexes it. */
function sceneTile(idxExpr: string): string {
  return `<div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
  <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: SCENES[${idxExpr} % SCENES.length] }} />
</div>`;
}

/** V11 home-catalog scene set: each ROW renders its OWN art, seeded by the
 * item's id — the same listing shows the same house everywhere, and no two
 * catalog cards share artwork. */
function scenePreludeHome(input: ComposeInput, count = 6): string {
  const scenes = input.data.rows.slice(0, count).map((r) => sceneSvg(input.data.domain, hashSeed(r.id), 0));
  return `const SCENES = ${JSON.stringify(scenes)};`;
}

/** V11 detail-gallery scene set: the SAME item rendered as `count` angle/
 * crop variants — one property's photo set, never five different houses. */
function scenePreludeGallery(input: ComposeInput, count = 5): string {
  const item = input.data.rows[0];
  const scenes = Array.from({ length: count }, (_, a) => sceneSvg(input.data.domain, hashSeed(item?.id ?? "item"), 0, a));
  return `const SCENES = ${JSON.stringify(scenes)};`;
}

/** Accessible save/heart affordance used on cards + gallery tiles — visible
 * hover, pressed, and keyboard focus states. */
const HEART_BUTTON = `<button type="button" aria-label="Save to wishlist" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground transition-all hover:bg-background focus-visible:outline-2 focus-visible:outline-ring active:scale-90">
  <IconOf name="heart" className="h-4 w-4" />
</button>`;

function blockMarketingHeader(input: ComposeInput): RecipeResult {
  const comps = new Set(["Button"]);
  const jsx = `<header className="sticky top-0 z-10 border-b bg-background/95">
  <div className="pastel-frame flex h-16 items-center justify-between gap-4">
    <span className="text-lg font-semibold tracking-tight">{DATA.productTitle}</span>
    <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
      {["Product", "Customers", "Pricing", "Docs"].map((l) => (
        <a key={l} href="#" onClick={(e) => e.preventDefault()} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{l}</a>
      ))}
    </nav>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm">Sign in</Button>
      <Button size="md">Get started</Button>
    </div>
  </div>
</header>`;
  return { jsx, comps, icons: new Set<string>() };
}

function blockAppTopbar(input: ComposeInput, screen: WireframeScreen): RecipeResult {
  const comps = new Set(["Topbar", "Input"]);
  const copy = copyFor(input.copy, screen.id);
  const jsx = `<Topbar
    title={${jstr(copy.headline)}}
    subtitle={${jstr(copy.overline ?? `${input.brief.title} — ${input.brief.description.slice(0, 60)}`)}}
    search
    user={DATA.people[0]}
    actions={<></>}
  />`;
  return { jsx, comps, icons: new Set<string>() };
}

function blockSidebar(): RecipeResult {
  const comps = new Set(["Sidebar"]);
  const jsx = `<Sidebar
    brand={DATA.productTitle}
    nav={NAV}
    activeId={active}
    onNavigate={setActive}
    iconOf={(name) => <IconOf name={name} />}
    user={DATA.people[0]}
  />`;
  return { jsx, comps, icons: new Set<string>() };
}

function blockTabbar(): RecipeResult {
  const comps = new Set<string>();
  const jsx = `<nav className="sticky bottom-0 z-10 flex border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
  {NAV.map((n) => (
    <a key={n.id} href="#" onClick={(e) => { e.preventDefault(); setActive(n.id); }}
       className={"flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors " + (active === n.id ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
      <IconOf name={n.icon} className="h-5 w-5" />
      {n.label}
    </a>
  ))}
</nav>`;
  return { jsx, comps, icons: new Set<string>() };
}

function blockHero(input: ComposeInput, screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const copy = copyFor(input.copy, screen.id);
  const comps = new Set(["Button"]);
  const icons = new Set<string>();
  const emphasis = padCls(inst);
  const headlineSize = inst.emphasis ? "text-4xl" : "text-3xl";

  let jsx = "";
  switch (inst.variant) {
    case "app": {
      comps.add("Badge");
      const fitnessProduct = input.data.domain === "fitness" && input.data.strengthMode === true;
      if (fitnessProduct) {
        // V12 coaching dashboard hero: one clear action, one calm tonal
        // surface, and the useful session facts visible without scrolling.
        jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="rounded-[var(--radius-lg)] bg-secondary p-6 sm:p-8">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        {copy.overline && <p className="text-sm font-medium text-primary">{copy.overline}</p>}
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight leading-tight text-foreground">{copy.headline}</h1>
        {copy.description && <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{copy.description}</p>}
      </div>
      <Button size="lg" className="shrink-0">{copy.primaryCta ?? "Start workout"}</Button>
    </div>
    <div className="mt-7 grid gap-3 sm:grid-cols-3">
      {DATA.screens.home.metrics.slice(0, 3).map((m) => (
        <div key={m.label} className="rounded-[var(--radius-md)] bg-background p-4">
          <p className="text-sm text-muted-foreground">{m.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{m.value}<span className="ml-1 text-sm font-medium text-muted-foreground">{m.unit}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>
        </div>
      ))}
    </div>
  </div>
</section>`;
        break;
      }
      // V9: catalog-led products (rentals/travel/ecommerce) open with the
      // Airbnb-style SEARCH HERO — "Where to?" + dates + guests on a dark
      // band. The search bar IS the dominant moment; no metric band competes
      // with the product grid below.
      if (CATALOG_DOMAINS.has(input.data.domain)) {
        comps.add("Input");
        comps.add("Select");
        const placeholder = copyFor(input.copy, screen.id).searchPlaceholder ?? input.data.searchPlaceholder;
        jsx = `<section className="w-full bg-foreground text-background">
  <div className="pastel-frame ${padCls(inst)}">
    {copy.overline && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{copy.overline}</p>}
    <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight leading-tight">{copy.headline}</h1>
    {copy.description && <p className="mt-3 max-w-xl text-base leading-relaxed text-background/70">{copy.description}</p>}
    <div className="mt-8 max-w-2xl rounded-2xl border border-background/15 bg-card p-2 text-foreground">
      <div className="flex flex-wrap items-center gap-1.5">
        ${searchFields(placeholder, "lg")}
      </div>
      <div className="border-t border-border/60 px-2 pb-1 pt-2 text-foreground/80">
        ${filterRow(input)}
      </div>
    </div>
  </div>
</section>`;
        break;
      }
      jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex flex-wrap items-end justify-between gap-5">
    <div className="min-w-0">
      {copy.overline && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">{copy.overline}</p>}
      <h1 className="${headlineSize} font-semibold tracking-tight leading-tight">{copy.headline}</h1>
      {copy.description && <p className="mt-2 max-w-xl text-base text-muted-foreground">{copy.description}</p>}
    </div>
    <div className="shrink-0">
      <Button size="lg">{copy.primaryCta ?? (homeCtaOf(input))}</Button>
    </div>
  </div>
  <div className="mt-6 grid gap-4 lg:grid-cols-3">
    <div className="rounded-xl bg-foreground p-6 text-background lg:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-background/60">{DATA.screens.home.metrics[0].label}</p>
        <Badge variant={DATA.screens.home.metrics[0].positive ? "success" : "muted"} dot>{signed(DATA.screens.home.metrics[0].delta)}</Badge>
      </div>
      <p className="mt-2 text-5xl font-black tracking-tight tabular-nums">
        {DATA.screens.home.metrics[0].value}<span className="ml-2 text-lg font-semibold text-background/60">{DATA.screens.home.metrics[0].unit}</span>
      </p>
      <p className="mt-1 text-sm text-background/60">{DATA.screens.home.metrics[0].note}</p>
      <div className="mt-5">
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-none">{copy.primaryCta ?? (homeCtaOf(input))}</Button>
      </div>
    </div>
    <div className="grid gap-4">
      {DATA.screens.home.metrics.slice(1, 3).map((m) => (
        <div key={m.label} className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{m.value}<span className="ml-1.5 text-xs font-semibold text-muted-foreground">{m.unit}</span></p>
        </div>
      ))}
    </div>
  </div>
</section>`;
      break;
    }
    case "split": {
      comps.add("Badge");
      jsx = `<section className="pastel-frame ${emphasis}">
  <div className="grid items-center gap-10 lg:grid-cols-2">
    <div>
      {copy.overline && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{copy.overline}</p>}
      <h1 className="${headlineSize} font-semibold tracking-tight leading-tight">{copy.headline}</h1>
      {copy.description && <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{copy.description}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg">{copy.primaryCta ?? (homeCtaOf(input))}<ArrowRight className="h-4 w-4" /></Button>
        <Button size="lg" variant="outline">{copy.secondaryCta ?? "Learn more"}</Button>
      </div>
    </div>
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{DATA.screens.home.metrics[0].label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{DATA.screens.home.metrics[0].value}<span className="ml-1.5 text-sm font-medium text-muted-foreground">{DATA.screens.home.metrics[0].unit}</span></p>
        </div>
        <Badge variant={DATA.screens.home.metrics[0].positive ? "success" : "muted"} dot>{signed(DATA.screens.home.metrics[0].delta)}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{DATA.screens.home.metrics[0].note}</p>
      <svg viewBox="0 0 400 120" width="100%" height="120" className="mt-4" role="img" aria-label="Trend">
        <g className="chart-grid">
          <line x1="0" x2="400" y1="30" y2="30" /><line x1="0" x2="400" y1="60" y2="60" /><line x1="0" x2="400" y1="90" y2="90" />
        </g>
        <path d="M0 100 L40 92 L80 88 L120 94 L160 78 L200 70 L240 76 L280 58 L320 48 L360 40 L400 30 L400 120 L0 120 Z" fill="var(--chart-1)" fillOpacity="0.12" />
        <path d="M0 100 L40 92 L80 88 L120 94 L160 78 L200 70 L240 76 L280 58 L320 48 L360 40 L400 30" fill="none" stroke="var(--chart-1)" strokeWidth="2.5" />
      </svg>
    </div>
  </div>
</section>`;
      break;
    }
    case "banded": {
      jsx = `<section className="border-y bg-muted/50">
  <div className="pastel-frame ${padCls(inst)} text-center">
    {copy.overline && <p className="text-xs font-semibold uppercase tracking-wider text-primary">{copy.overline}</p>}
    <h1 className="mx-auto mt-3 max-w-2xl ${headlineSize} font-semibold tracking-tight leading-tight">{copy.headline}</h1>
    {copy.description && <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">{copy.description}</p>}
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Button size="lg">{copy.primaryCta ?? (homeCtaOf(input))}</Button>
      <Button size="lg" variant="outline">{copy.secondaryCta ?? "Learn more"}</Button>
    </div>
  </div>
</section>`;
      break;
    }
    case "fullbleed": {
      jsx = `<section className="w-full bg-foreground text-background">
  <div className="pastel-frame ${BAND_PAD}">
    {copy.overline && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{copy.overline}</p>}
    <h1 className="mt-3 max-w-3xl text-4xl font-black uppercase tracking-tight leading-tight">{copy.headline}</h1>
    {copy.description && <p className="mt-4 max-w-xl text-base leading-relaxed text-background/70">{copy.description}</p>}
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-none">{copy.primaryCta ?? (homeCtaOf(input))}</Button>
      <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">{copy.secondaryCta ?? "Learn more"}</Button>
    </div>
  </div>
</section>`;
      break;
    }
    case "map": {
      comps.add("Badge");
      jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="relative w-full overflow-hidden rounded-xl border bg-muted/40">
    <div className="aspect-[16/9] w-full">
      <svg viewBox="0 0 600 300" width="100%" height="100%" className="text-muted-foreground/60" role="img" aria-label="Map">
        <g stroke="currentColor" strokeOpacity="0.5" strokeWidth="1">
          <line x1="0" x2="600" y1="60" y2="60" /><line x1="0" x2="600" y1="120" y2="120" />
          <line x1="0" x2="600" y1="180" y2="180" /><line x1="0" x2="600" y1="240" y2="240" />
          <line x1="120" x2="120" y1="0" y2="300" /><line x1="240" x2="240" y1="0" y2="300" />
          <line x1="360" x2="360" y1="0" y2="300" /><line x1="480" x2="480" y1="0" y2="300" />
        </g>
        <path d="M60 230 C 140 180, 220 250, 300 210 S 460 150, 540 120" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="230" r="8" fill="var(--primary)" />
        <circle cx="540" cy="120" r="8" fill="var(--accent)" />
      </svg>
    </div>
    <div className="absolute inset-x-0 bottom-0 p-4">
      <div className="mx-auto max-w-sm rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{copy.overline ?? "Now"}</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight">{copy.headline}</p>
          </div>
          <Badge variant="success" dot>Live</Badge>
        </div>
        <Button size="md" className="mt-3 w-full">{copy.primaryCta ?? (homeCtaOf(input))}</Button>
      </div>
    </div>
  </div>
</section>`;
      break;
    }
    default: {
      jsx = `<section className="pastel-frame ${emphasis}">
  {copy.overline && <p className="text-xs font-semibold uppercase tracking-wider text-primary">{copy.overline}</p>}
  <h1 className="mt-2 max-w-2xl ${headlineSize} font-semibold tracking-tight leading-tight">{copy.headline}</h1>
  {copy.description && <p className="mt-3 max-w-xl text-base text-muted-foreground">{copy.description}</p>}
  {copy.primaryCta && (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Button size="md">{copy.primaryCta}</Button>
      {copy.secondaryCta && <Button size="md" variant="outline">{copy.secondaryCta}</Button>}
    </div>
  )}
</section>`;
    }
  }
  return { jsx, comps, icons };
}

/** Stat recipe — metrics are domain data, labels/units come from the copy
 * plan per screen (distinct labels enforced by the content gate).
 * scoreboard variant = the company signature move: giant tabular numbers,
 * unit labels, accent delta chips, no card surfaces. */
function blockStats(input: ComposeInput, _screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const icons = new Set<string>();
  if (inst.variant === "scoreboard") {
    icons.add("trendingUp");
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 sm:divide-x divide-border rounded-xl border bg-card">
    {DATA.screens.home.metrics.map((m, i) => {
      const l = copy.statLabels?.[i % Math.max(1, copy.statLabels?.length ?? 1)] ?? {};
      return (
        <div key={i} className="px-6 py-6 sm:px-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{l.label ?? m.label}</p>
          <p className="mt-2 text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-foreground">
            {m.value}<span className="ml-1.5 text-sm font-semibold text-muted-foreground">{l.unit ?? m.unit}</span>
          </p>
          <span className={"mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold " + (m.positive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
            <TrendingUp className="h-3 w-3" />{signed(m.delta)}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">{m.note}</span>
        </div>
      );
    })}
  </div>
</section>`;
    return { jsx, comps: new Set<string>(), icons };
  }

  const comps = new Set(["StatCard"]);
  const grid = inst.variant === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid gap-4 ${grid}">
    {DATA.screens.home.metrics.map((m, i) => {
      const l = copy.statLabels?.[i % Math.max(1, copy.statLabels?.length ?? 1)] ?? {};
      return (
        <StatCard key={i} label={l.label ?? m.label} value={m.value} unit={l.unit ?? m.unit} delta={m.delta} positive={m.positive} note={m.note} spark={m.spark} />
      );
    })}
  </div>
</section>`;
  return { jsx, comps, icons };
}

function blockChart(input: ComposeInput, screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const comps = new Set<string>(["Chart"]);
  const icons = new Set<string>();
  const type = inst.variant === "bars-card" || inst.variant === "bars-band" ? "bars" : "area";
  const color = type === "bars" ? "var(--chart-2)" : "var(--chart-1)";
  // Pick the series by the copy's unit/title — never by variant index — so a
  // chart titled "Weekly distance" can never render kcal data (v7 issue #3).
  const copy = copyFor(input.copy, screen.id);
  const wantUnit = normalizeUnit(copy.chartUnit);
  const wantTitle = (copy.chartTitle ?? "").toLowerCase();
  let seriesIdx = input.data.series.findIndex((s) => normalizeUnit(s.unit) === wantUnit);
  if (seriesIdx === -1 && wantTitle.length > 0) {
    seriesIdx = input.data.series.findIndex(
      (s) => s.label.toLowerCase().includes(wantTitle) || wantTitle.includes(s.label.toLowerCase()),
    );
  }
  if (seriesIdx === -1) seriesIdx = type === "bars" ? Math.min(2, input.data.series.length - 1) : 0;
  const series = input.data.series[Math.max(0, seriesIdx)] ?? input.data.series[0];
  const titleOk = copy.chartTitle && (series.label.toLowerCase().includes((copy.chartTitle ?? "").toLowerCase()) || (copy.chartTitle ?? "").toLowerCase().includes(series.label.toLowerCase()));
  const chartTitle = titleOk ? copy.chartTitle : series.label;

  const isBand = inst.variant === "band" || inst.variant === "bars-band";
  const header = `<div className="flex items-center justify-between gap-4 ${isBand ? "" : "border-b"} px-6 py-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">${txt(chartTitle)}</h3>
        <p className="text-xs text-muted-foreground">${txt(copy.chartSubtitle ?? series.label)}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">${txt(series.unit)}</span>
    </div>`;
  const body = `<div className="${isBand ? "px-6 pb-6 pt-2" : "p-6"}">
      <Chart data={${JSON.stringify(series.points)}} type="${type}" color="${color}" height={${isBand ? 340 : 300}} unit=${jstr(series.unit)} />
    </div>`;

  const jsx = isBand
    ? `<section className="pastel-frame ${padCls(inst)}">
  <div className="rounded-xl bg-muted/50">${header}
${body}
  </div>
</section>`
    : `<section className="pastel-frame ${padCls(inst)}">
  <Card>${header}
${body}
  </Card>
</section>`;
  comps.add("Card");
  return { jsx, comps, icons };
}

/** Table — domain rows, copy-driven columns/toolbar. No SaaS framing. */
function blockTable(input: ComposeInput, screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const copy = copyFor(input.copy, screen.id);
  const comps = new Set(["Card", "Table", "Button", "Input", "Badge", "Avatar"]);
  const icons = new Set(["search", "plus", "filter"]);
  const columns = copy.tableColumns && copy.tableColumns.length > 0
    ? copy.tableColumns.slice(0, 6)
    : (input.data.rows[0]?.amount.startsWith("$") ? ["Name", "Detail", "Amount", "Status", "Date"] : ["Name", "Detail", "Value", "Status", "Date"]);
  const heads = columns.map((c, i) => {
    const right = /(pace|price|amount|value|plays|tasks|posts|cost|revenue|budget|members|hours|km|calories|kcal)/i.test(c) || i === 2;
    return `<TableHead${right ? ' className="text-right"' : ""}>${c}</TableHead>`;
  }).join("\n          ");
  const cells: string[] = [];
  cells.push('<TableCell className="font-medium">{r.name}</TableCell>');
  if (columns.length > 1) cells.push('<TableCell className="text-muted-foreground">{r.detail}</TableCell>');
  if (columns.length > 2) cells.push('<TableCell className="text-right tabular-nums font-medium">{r.amount}</TableCell>');
  if (columns.length > 3) cells.push('<TableCell><Badge variant={TONE[r.status] ?? "muted"} dot>{r.status}</Badge></TableCell>');
  if (columns.length > 4) cells.push('<TableCell className="text-muted-foreground">{r.date}</TableCell>');
  if (columns.length > 5) cells.push(`<TableCell>
              <span className="inline-flex items-center gap-2">
                <Avatar name={r.owner} initials={r.owner.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()} hue={DATA.people[0].hue} size={24} />
                <span className="text-sm">{r.owner}</span>
              </span>
            </TableCell>`);

  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <Card>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">${txt(copy.tableTitle ?? copy.headline)}</h3>
        <p className="text-xs text-muted-foreground">${txt(copy.description ?? "Latest records")}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input icon={Search} placeholder=${jstr(copy.searchPlaceholder ?? input.data.searchPlaceholder)} className="hidden w-52 md:block" />
        <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5" />${txt(copy.secondaryCta ?? "Filter")}</Button>
        <Button size="sm"><Plus className="h-3.5 w-3.5" />${txt(copy.primaryCta ?? "New")}</Button>
      </div>
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          ${heads}
        </TableRow>
      </TableHeader>
      <TableBody>
        {DATA.screens.home.rows.map((r) => (
          <TableRow key={r.id}>
            ${cells.join("\n            ")}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
</section>`;
  return { jsx, comps, icons };
}

function blockDetail(input: ComposeInput, screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const copy = copyFor(input.copy, screen.id);
  const comps = new Set(["Card", "Badge", "Avatar", "Button"]);
  const icons = new Set(["star"]);

  if (input.data.domain === "fitness" && input.data.strengthMode === true && inst.variant !== "bottom") {
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
    <div className="min-w-0">
      <p className="text-sm font-medium text-primary">Guided exercise</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight leading-tight">{DATA.screens.detail.item?.name}</h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{copy.description ?? "A controlled strength block selected from your recent training history and recovery score."}</p>
      <dl className="mt-7 grid max-w-xl gap-x-8 sm:grid-cols-2">{DATA.screens.detail.fields.map((f, i) => <div key={i} className="flex items-baseline justify-between gap-4 border-b py-3"><dt className="text-sm text-muted-foreground">{f.label}</dt><dd className="text-sm font-semibold tabular-nums">{f.value}</dd></div>)}</dl>
    </div>
    <Card className="lg:sticky lg:top-6">
      <div className="px-6 py-5"><p className="text-sm text-muted-foreground">Today's target</p><p className="mt-2 text-2xl font-semibold tracking-tight">{DATA.screens.detail.item?.detail}</p><p className="mt-2 text-sm text-muted-foreground">Suggested load: <span className="font-medium text-foreground">{DATA.screens.detail.item?.amount}</span></p><Button size="lg" className="mt-5 w-full">{DATA.screens.detail.primaryCta}</Button></div>
    </Card>
  </div>
</section>`;
    return { jsx, comps, icons };
  }

  if (inst.variant === "bottom") {
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <Card className="rounded-t-2xl">
    <div className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">${txt(copy.headline)}</h3>
        <p className="text-xs text-muted-foreground">${txt(copy.description ?? "")}</p>
      </div>
      <Badge variant="success" dot>${txt(copy.overline ?? "Ready")}</Badge>
    </div>
    <div className="space-y-3 px-6 py-5">
      {DATA.screens.home.rows.slice(0, 3).map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.detail}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{r.amount}</span>
            <Badge variant={TONE[r.status] ?? "muted"}>{r.status}</Badge>
          </div>
        </div>
      ))}
    </div>
    <div className="border-t px-6 py-4">
      <Button size="md" className="w-full">${txt(copy.primaryCta ?? "Continue")}</Button>
    </div>
  </Card>
</section>`;
    return { jsx, comps, icons };
  }

  // V11: the detail pane renders the SEMANTIC {label, value} pairs from the
  // data file (same pack produced both sides — never a positional zip of the
  // copy plan's labels against a bare value array).
  const fieldRows = `      <dl className="mt-7 grid max-w-xl gap-x-8 sm:grid-cols-2">
        {DATA.screens.detail.fields.map((f, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 border-b pb-3">
            <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
            <dd className="text-sm font-semibold tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>`;

  // V14 (de-Airbnb): the marketplace summary card (price/dates/guests/total +
  // verified host) renders ONLY for genuine commerce/travel products. Every
  // other product gets a focused record card — the item's value, status,
  // date, and its one primary action. No booking language leaks into a
  // dashboard/coaching/workspace detail.
  const isMarketDetail = CATALOG_DOMAINS.has(input.data.domain);
  const headerRow = isMarketDetail
    ? `<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <Star className="h-4 w-4 fill-current text-accent" />{DATA.screens.detail.reviews[0] ? DATA.screens.detail.reviews[0].rating.toFixed(1) : "4.8"} · {DATA.screens.detail.reviews.length} reviews
        </span>
        <span>{DATA.screens.detail.item?.detail}</span>
      </div>`
    : `<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          <Badge variant={TONE[DATA.screens.detail.item?.status ?? ""] ?? "secondary"} dot>{DATA.screens.detail.item?.status ?? "Ready"}</Badge>
        </span>
        <span>{DATA.screens.detail.item?.detail}</span>
      </div>`;

  const summaryCard = isMarketDetail
    ? `<div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-bold tracking-tight tabular-nums">{DATA.screens.detail.summary.price}<span className="text-sm font-medium text-muted-foreground">{DATA.screens.detail.summary.nightly}</span></span>
          <Badge variant="success" dot>${txt(copy.overline ?? "Available")}</Badge>
        </div>
        <div className="mt-5 space-y-3 border-t pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Dates</span>
            <span className="font-medium tabular-nums">{DATA.screens.detail.summary.dates}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Guests</span>
            <span className="font-medium tabular-nums">{DATA.screens.detail.summary.guests}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-base font-bold tracking-tight tabular-nums">{DATA.screens.detail.summary.total}</span>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2.5">
          <Avatar name={DATA.screens.detail.reviews[0]?.name} initials={DATA.screens.detail.reviews[0]?.initials} hue={DATA.screens.detail.reviews[0]?.hue ?? DATA.people[0].hue} size={28} />
          <span className="min-w-0 text-xs text-muted-foreground">
            <span className="block truncate text-sm font-medium text-foreground">{DATA.screens.detail.reviews[0]?.name ?? DATA.people[0].name}</span>
            ${txt(copy.secondaryCta ?? "Verified host")}
          </span>
        </div>`
    : `<div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-bold tracking-tight tabular-nums">{DATA.screens.detail.item?.amount}</span>
          <Badge variant={TONE[DATA.screens.detail.item?.status ?? ""] ?? "secondary"} dot>{DATA.screens.detail.item?.status ?? "Ready"}</Badge>
        </div>
        <div className="mt-5 space-y-3 border-t pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last updated</span>
            <span className="font-medium tabular-nums">{DATA.screens.detail.item?.date ?? "Today"}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-semibold">${txt(copy.overline ?? "Summary")}</span>
            <span className="text-sm font-semibold tabular-nums">{DATA.screens.detail.item?.detail}</span>
          </div>
        </div>`;

  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid items-start gap-8 lg:grid-cols-3">
    <div className="min-w-0 lg:col-span-2">
${headerRow}
      <h1 className="mt-2 text-4xl font-bold tracking-tight leading-tight">{DATA.screens.detail.item?.name}</h1>
      {copy.description && <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{copy.description}</p>}
${fieldRows}
    </div>
    <Card className="lg:sticky lg:top-6">
      <div className="px-6 py-5">
${summaryCard}
        <Button size="lg" className="mt-5 w-full">{DATA.screens.detail.primaryCta}</Button>
        <Button size="md" variant="outline" className="mt-2 w-full">Save</Button>
      </div>
    </Card>
  </div>
</section>`;
  return { jsx, comps, icons };
}

/** Settings form — copy/data-driven sections (goals, units, notifications).
 * v7 removed the SaaS billing bodies (payment methods, invoices, danger
 * zone) entirely: nothing finance-shaped ships unless the domain is
 * financial/shopping. */
function blockForm(input: ComposeInput, screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const copy = copyFor(input.copy, screen.id);
  const comps = new Set(["Card", "Switch", "Avatar", "Button", "Badge"]);
  const icons = new Set(["chevronDown"]);
  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid gap-4 lg:grid-cols-3">
    <div className="space-y-4 lg:col-span-2">
      <Card>
        <div className="px-6 pb-2 pt-5">
          {(() => {
            const sections = copy.settingsSections?.length ? copy.settingsSections : DATA.screens.home.settingsSections;
            return sections.map((sec, si) => (
              <div key={si} className={si === 0 ? "" : "border-t pt-5"}>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{sec.title}</p>
                <ul className="mt-1 divide-y">
                  {sec.items.map((it, ii) => (
                    <li key={ii} className="flex items-center justify-between gap-4 py-3.5">
                      <span className="text-sm font-medium">{it.label}</span>
                      {it.control === "toggle" ? (
                        <Switch checked={it.value === "On"} label={it.label} />
                      ) : it.control === "select" ? (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">{it.value}<IconOf name="chevronDown" /></span>
                      ) : (
                        <span className="text-sm font-semibold tabular-nums">{it.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ));
          })()}
        </div>
      </Card>
    </div>
    <div className="space-y-4">
      <Card>
        <div className="border-b px-6 py-4">
          <h3 className="text-base font-semibold tracking-tight">{copy.headline}</h3>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <Avatar name={DATA.people[0].name} initials={DATA.people[0].initials} hue={DATA.people[0].hue} size={44} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{DATA.people[0].name}</p>
              <p className="truncate text-xs text-muted-foreground">{DATA.people[0].role}</p>
            </div>
            <Badge variant="secondary" dot>${txt(copy.overline ?? "Active")}</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {DATA.screens.home.metrics.slice(0, 3).map((m) => (
              <div key={m.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-xs text-muted-foreground">{m.label}</dt>
                <dd className="text-sm font-medium tabular-nums">{m.value} {m.unit}</dd>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t px-6 py-4">
          <Button size="sm" className="w-full">${txt(copy.primaryCta ?? "Save changes")}</Button>
        </div>
      </Card>
    </div>
  </div>
</section>`;
  return { jsx, comps, icons };
}

function blockList(input: ComposeInput, _screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const comps = new Set(["Card", "Avatar"]);
  const icons = new Set(["check", "play", "heart", "image", "star"]);

  if (inst.variant === "sequence" && input.data.domain === "fitness" && input.data.strengthMode === true) {
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex items-baseline justify-between gap-4">
    <h2 className="text-2xl font-semibold tracking-tight">${txt(inst.content ?? "Today's sequence")}</h2>
    <button type="button" className="text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">Adjust</button>
  </div>
  <ol className="mt-4 divide-y rounded-[var(--radius-lg)] border bg-card">
    {DATA.screens.home.rows.slice(0, 3).map((r, i) => (
      <li key={r.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
        <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold " + (i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-primary")}>{i + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium">{r.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
          <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{i === 0 ? "Drive through your heels" : i === 1 ? "Pause one beat at the top" : "Keep ribs down and breathe slow"}</span></p>
        </div>
        <button type="button" className="shrink-0 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">Swap</button>
      </li>
    ))}
  </ol>
</section>`;
    return { jsx, comps: new Set<string>(), icons };
  }

  if (inst.variant === "activity") {
    // V9: on the detail screen this section is SOCIAL PROOF — divided rows
    // with star ratings and a real review line (no cards, quiet type).
    // V14: the heading is domain-aware (guest reviews for stays, customer
    // reviews for shops, community for feeds) and overridable via content —
    // a non-commerce product never inherits Airbnb "Guest reviews" copy.
    if (_screen.id === "detail") {
      const heading = inst.content ?? input.data.reviewHeading ?? REVIEW_HEADING[input.data.domain] ?? "What people say";
      const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex flex-wrap items-baseline justify-between gap-3">
    <h3 className="text-2xl font-semibold tracking-tight">${txt(heading)}</h3>
    <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{DATA.screens.detail.reviews[0] ? DATA.screens.detail.reviews[0].rating.toFixed(1) : "4.8"}</span> average · {DATA.screens.detail.reviews.length} reviews</p>
  </div>
  <ul className="mt-4 divide-y border-t">
    {DATA.screens.detail.reviews.map((rv, i) => (
      <li key={i} className="flex items-start gap-3 py-4">
        <Avatar name={rv.name} initials={rv.initials} hue={rv.hue} size={32} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{rv.name}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star className="h-3 w-3 fill-current text-accent" />{rv.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{rv.text}</p>
        </div>
      </li>
    ))}
  </ul>
</section>`;
      return { jsx, comps, icons };
    }
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <h3 className="text-lg font-bold tracking-tight">${txt(inst.content ?? "Recent activity")}</h3>
  <ul className="mt-4 divide-y border-t">
    {DATA.screens.home.activity.slice(0, 6).map((a, i) => {
      const p = DATA.people[i % DATA.people.length];
      return (
        <li key={i} className="flex items-center gap-3 py-3.5">
          <Avatar name={p.name} initials={p.initials} hue={p.hue} size={30} />
          <p className="min-w-0 flex-1 truncate text-sm"><span className="font-medium">{p.name}</span> <span className="text-muted-foreground">{a}</span></p>
        </li>
      );
    })}
  </ul>
</section>`;
    return { jsx, comps, icons };
  }

  if (inst.variant === "carousel") {
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <h3 className="text-lg font-bold tracking-tight">${txt(inst.content ?? "More to explore")}</h3>
  <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
    {DATA.screens.home.rows.slice(0, 6).map((r, i) => (
      <a key={r.id} href="#" onClick={(e) => e.preventDefault()} className="group w-36 shrink-0">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted/60">
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <IconOf name={["play", "heart", "image", "chart", "users", "zap"][i % 6]} className="h-8 w-8" />
          </div>
        </div>
        <p className="mt-2 truncate text-sm font-medium">{r.name}</p>
        <p className="truncate text-xs text-muted-foreground">{r.detail}</p>
      </a>
    ))}
  </div>
</section>`;
    return { jsx, comps, icons };
  }

  if (inst.variant === "featured") {
    // V10: a featured showcase strip — the home screen's "editor's pick"
    // moment. Three wide scene tiles (one dominant 2-col) with quiet captions;
    // no card surfaces, no price rows — the strip reads as curated imagery.
    const prelude = scenePreludeHome(input);
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex flex-wrap items-end justify-between gap-4">
    <h3 className="text-2xl font-semibold tracking-tight">${txt(inst.content ?? "Featured stays")}</h3>
    <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">View all</a>
  </div>
  <div className="mt-6 grid gap-5 lg:grid-cols-3">
    {DATA.screens.home.rows.slice(0, 3).map((r, i) => (
      <a key={r.id} href="#" onClick={(e) => e.preventDefault()} className={"group " + (i === 0 ? "lg:col-span-2" : "")}>
        <div className={"relative w-full overflow-hidden rounded-xl " + (i === 0 ? "aspect-[16/9]" : "aspect-[16/10]")}>
          ${sceneTile("i")}
          ${HEART_BUTTON}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">{r.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.detail}</p>
          </div>
          <span className="shrink-0 text-sm font-bold tracking-tight tabular-nums">{r.amount}<span className="text-xs font-medium text-muted-foreground">${txt(priceSuffixOf(input))}</span></span>
        </div>
      </a>
    ))}
  </div>
</section>`;
    return { jsx, comps, icons, prelude };
  }

  if (inst.variant === "cards") {
    // V9: photo-first product cards — the catalog moment on the home screen.
    // V10: each tile is a deterministic local scene (never a failed remote
    // image or a letter block). The ONLY card cluster on home. V11: each
    // row renders its OWN art (seeded per item) — never slot-recycled art.
    const prelude = scenePreludeHome(input);
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
    {DATA.screens.home.rows.slice(0, 6).map((r, i) => (
      <a key={r.id} href="#" onClick={(e) => e.preventDefault()} className="group">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[16/10]">
            ${sceneTile("i")}
            ${HEART_BUTTON}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold tracking-tight">{r.name}</h3>
              <Badge variant={TONE[r.status] ?? "muted"}>{r.status}</Badge>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{r.detail}</p>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-base font-bold tracking-tight tabular-nums">{r.amount}<span className="text-xs font-medium text-muted-foreground">${txt(priceSuffixOf(input))}</span></span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-current text-accent" />{(4 + (i % 5) * 0.2).toFixed(1)}
              </span>
            </div>
          </div>
        </Card>
      </a>
    ))}
  </div>
</section>`;
    comps.add("Badge");
    return { jsx, comps, icons, prelude };
  }

  if (inst.variant === "rows") {
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="divide-y border-t">
    {DATA.screens.home.rows.slice(0, 5).map((r) => (
      <a key={r.id} href="#" onClick={(e) => e.preventDefault()} className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/50">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{r.name}</p>
          <p className="truncate text-xs text-muted-foreground">{r.detail} · {r.date}</p>
        </div>
        <span className="text-sm font-semibold tabular-nums">{r.amount}</span>
      </a>
    ))}
  </div>
</section>`;
    return { jsx, comps, icons };
  }

  // features (default)
  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {DATA.screens.home.features.map((f) => (
      <Card key={f.name} className="p-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><CheckCircle2 className="h-4 w-4" /></span>
        <h3 className="mt-4 text-base font-semibold tracking-tight">{f.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
      </Card>
    ))}
  </div>
</section>`;
  return { jsx, comps, icons };
}

function blockMedia(input: ComposeInput, _screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const comps = new Set<string>();
  const icons = new Set(["heart"]);
  // V10: photo-first GALLERY — a mosaic of THE SAME item's scenes (one large
  // hero tile + smaller tiles), never other catalog items (the v9 test4
  // "catalog on the detail page" bug). No name labels, no price rows — the
  // tiles read as one stay's photo set. `DATA.screens.detail.images` is the
  // index list; scenes are baked into the file by the prelude.
  if (inst.variant === "gallery") {
    const prelude = scenePreludeGallery(input);
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {DATA.screens.detail.images.map((n, i) => (
      <div key={n} className={i === 0 ? "col-span-2 row-span-2" : ""}>
        <div className={"relative h-full w-full overflow-hidden rounded-xl " + (i === 0 ? "min-h-56 sm:min-h-full" : "aspect-[4/3]")}>
          ${sceneTile("n")}
          {i === 0 && ${HEART_BUTTON}}
        </div>
      </div>
    ))}
  </div>
</section>`;
    return { jsx, comps, icons, prelude };
  }

  // Grid fallback: the same item's angle variants in a simple grid.
  const prelude = scenePreludeGallery(input);
  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {DATA.screens.detail.images.slice(0, 4).map((n, i) => (
      <div key={n} className="relative aspect-[4/3] overflow-hidden rounded-xl">
        ${sceneTile("n")}
        ${HEART_BUTTON}
      </div>
    ))}
  </div>
</section>`;
  return { jsx, comps, icons, prelude };
}

/** Search — v7 uses a Select dropdown, never chip groups (UX simplification).
 * dropdown = input + one category select + search; filters = select + apply.
 * V9: catalog-led products (rentals/travel/ecommerce) get the Airbnb-style
 * pill row — destination + check-in/check-out + guests + one Search button. */
function blockSearch(input: ComposeInput, _screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const comps = new Set(["Input", "Button", "Select"]);
  const icons = new Set(["search", "filter"]);
  const placeholder = jstr(copyFor(input.copy, _screen.id).searchPlaceholder ?? input.data.searchPlaceholder);

  if (inst.variant === "dropdown") {
    if (CATALOG_DOMAINS.has(input.data.domain)) {
      const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="rounded-2xl border bg-card p-2">
    <div className="flex flex-wrap items-center gap-1.5">
      ${searchFields(input.data.searchPlaceholder, "md")}
    </div>
    <div className="border-t px-2 pb-1 pt-2">
      ${filterRow(input)}
    </div>
  </div>
</section>`;
      return { jsx, comps, icons };
    }
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
    <Input label="Search" icon={Search} placeholder=${placeholder} className="flex-1" />
    <Select
      label="All"
      placeholder="All"
      options={Array.from(new Set(DATA.screens.home.rows.slice(0, 6).map((r) => r.detail))).slice(0, 4).map((d) => ({ value: d, label: d }))}
      className="sm:w-48"
    />
    <Button size="md"><Search className="h-4 w-4" />Search</Button>
  </div>
</section>`;
    return { jsx, comps, icons };
  }

  if (inst.variant === "filters") {
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex flex-wrap items-end gap-2">
    <Input label="Search" icon={Search} placeholder=${placeholder} className="min-w-52 flex-1" />
    <Select
      label="Category"
      placeholder="All categories"
      options={Array.from(new Set(DATA.screens.home.rows.slice(0, 6).map((r) => r.detail))).slice(0, 4).map((d) => ({ value: d, label: d }))}
      className="sm:w-44"
    />
    <Button variant="outline" size="md"><Filter className="h-4 w-4" />Apply</Button>
  </div>
</section>`;
    return { jsx, comps, icons };
  }

  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
    <Input label="Search" icon={Search} placeholder=${placeholder} className="flex-1" />
    <div className="flex items-center gap-2">
      <Button variant="outline" size="md"><Filter className="h-4 w-4" />Filters</Button>
      <Button size="md">Search</Button>
    </div>
  </div>
</section>`;
  return { jsx, comps, icons };
}

function blockPricing(input: ComposeInput, _screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const comps = new Set(["Card", "Button", "Badge"]);
  const icons = new Set(["check"]);
  // Pricing is only meaningful for commercial domains — never ship it for
  // fitness/media/social products.
  if (!["ecommerce", "productivity", "finance", "travel"].includes(input.data.domain)) {
    return { jsx: `<!-- pricing omitted: not applicable to the ${input.data.domain} domain -->`, comps: new Set<string>(), icons: new Set<string>() };
  }
  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="grid gap-5 lg:grid-cols-3">
    {[
      { name: "Starter", price: "$0", note: "For individuals getting started", features: ["1 project", "5 GB storage", "Community support"], highlight: false },
      { name: "Pro", price: "$19", note: "For growing teams", features: ["Unlimited projects", "100 GB storage", "Priority support", "Advanced analytics"], highlight: true },
      { name: "Scale", price: "$49", note: "For businesses at scale", features: ["Everything in Pro", "SSO & audit logs", "99.9% uptime SLA"], highlight: false },
    ].map((p) => (
      <Card key={p.name} className={"p-6 " + (p.highlight ? "border-primary ring-1 ring-primary/30" : "")}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">{p.name}</h3>
          {p.highlight && <Badge variant="secondary">Popular</Badge>}
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{p.price}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
        <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
        <ul className="mt-5 space-y-2.5">
          {p.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" />{f}</li>
          ))}
        </ul>
        <Button size="md" className="mt-6 w-full" variant={p.highlight ? "default" : "outline"}>{p.highlight ? "Start free trial" : "Choose " + p.name}</Button>
      </Card>
    ))}
  </div>
</section>`;
  return { jsx, comps, icons };
}

/** CTA — band variant (plain) or slogan variant (the signature statement
 * band: single-word slogan in accent on the foreground band). On the detail
 * screen the band is a quiet trust-signal strip — the summary card owns the
 * primary action (V9: one conversion point per page). */

function blockCta(input: ComposeInput, _screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const comps = new Set(["Button"]);
  const icons = new Set<string>();
  const copy = copyFor(input.copy, _screen.id);

  if (_screen.id === "detail") {
    const items = input.data.trustItems ?? TRUST_ITEMS[input.data.domain] ?? TRUST_ITEMS.travel;
    const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="rounded-xl bg-muted/50 px-6 py-5">
    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
      {${JSON.stringify(items)}.map((t) => (
        <li key={t} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-success" />{t}
        </li>
      ))}
    </ul>
  </div>
</section>`;
    icons.add("check");
    return { jsx, comps, icons };
  }

  if (inst.variant === "slogan") {
    const jsx = `<section className="w-full bg-foreground text-background">
  <div className="pastel-frame ${BAND_PAD} text-center">
    {copy.overline && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{copy.overline}</p>}
    <h2 className="mt-4 text-4xl font-black uppercase tracking-tight">{copy.slogan ?? copy.headline?.split(" ")[0].toUpperCase()}</h2>
    {copy.description && <p className="mx-auto mt-4 max-w-xl text-base text-background/70">{copy.description}</p>}
    <div className="mt-7">
      <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-none">{copy.primaryCta ?? (homeCtaOf(input))}</Button>
    </div>
  </div>
</section>`;
    return { jsx, comps, icons };
  }

  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <div className="flex flex-col items-center rounded-xl bg-muted/50 px-6 py-12 text-center">
    <h2 className="max-w-xl text-2xl font-semibold tracking-tight">${txt(copy.headline ?? `Try ${input.brief.title} today`)}</h2>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">${txt(copy.description ?? input.brief.description.slice(0, 120))}</p>
    <div className="mt-6"><Button size="lg">${txt(copy.primaryCta ?? (homeCtaOf(input)))}</Button></div>
  </div>
</section>`;
  return { jsx, comps, icons };
}

function blockFooter(): RecipeResult {
  const comps = new Set(["Footer"]);
  const jsx = `<Footer
    brand={DATA.productTitle}
    blurb={DATA.description.slice(0, 120)}
    columns={[
      { title: "Product", links: ["Overview", "Analytics", "Integrations"] },
      { title: "Company", links: ["About", "Careers", "Press"] },
      { title: "Resources", links: ["Docs", "Support", "Status"] },
    ]}
  />`;
  return { jsx, comps, icons: new Set<string>() };
}

function blockCustom(input: ComposeInput, screen: WireframeScreen, inst: PaddedBlock): RecipeResult {
  const comps = new Set<string>();
  if (!inst.component) return { jsx: "", comps, icons: new Set<string>() };
  const copy = copyFor(input.copy, screen.id);
  if (input.data.domain === "fitness" && input.data.strengthMode === true) {
    const wrapper = (body: string) => `<section className="pastel-frame ${padCls(inst)}">${body}</section>`;
    if (inst.component === "ReadinessMeter") {
      return { jsx: wrapper(`<div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4"><div><p className="text-sm font-medium text-muted-foreground">Readiness score</p><p className="mt-1 text-3xl font-semibold tabular-nums">{DATA.screens.home.metrics[0].value}<span className="ml-1 text-sm text-muted-foreground">/ 100</span></p></div><span className="rounded-full bg-success/15 px-3 py-1 text-sm font-medium text-success">Ready to train</span></div>`), comps, icons: new Set<string>() };
    }
    if (inst.component === "CoachInsight") {
      return { jsx: wrapper(`<div className="rounded-[var(--radius-lg)] bg-muted/50 p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground">+</div><div className="min-w-0"><h2 className="text-base font-semibold">Coach insight</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Your lower-body load is trending up. Keep today controlled and add one extra mobility block after round two.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring active:scale-[.98]">Ask for form tips</button><button type="button" className="rounded-[var(--radius-md)] bg-secondary px-4 py-2 text-sm font-medium text-primary hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-ring active:scale-[.98]">Shorten workout</button></div></div></div></div>`), comps, icons: new Set<string>() };
    }
    if (inst.component === "RecoveryBlock") {
      return { jsx: wrapper(`<div className="rounded-[var(--radius-lg)] bg-muted/50 p-5"><div className="flex items-baseline justify-between gap-4"><h2 className="text-xl font-semibold">After workout</h2><button type="button" className="text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">Why this matters</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-[var(--radius-md)] bg-background p-4"><p className="text-sm text-muted-foreground">Recovery block</p><p className="mt-2 text-base font-medium">6 min guided stretch</p></div><div className="rounded-[var(--radius-md)] bg-background p-4"><p className="text-sm text-muted-foreground">Coach check-in</p><p className="mt-2 text-base font-medium">Log energy and soreness</p></div></div></div>`), comps, icons: new Set<string>() };
    }
    if (inst.component === "ExerciseTarget") {
      return { jsx: wrapper(`<div className="grid gap-3 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Target</p><p className="mt-1 text-lg font-semibold">{DATA.screens.detail.item?.detail}</p></div><div><p className="text-sm text-muted-foreground">Suggested load</p><p className="mt-1 text-lg font-semibold tabular-nums">{DATA.screens.detail.item?.amount}</p></div><div><p className="text-sm text-muted-foreground">Rest</p><p className="mt-1 text-lg font-semibold">90 sec</p></div></div>`), comps, icons: new Set<string>() };
    }
    if (inst.component === "FormCues") {
      return { jsx: wrapper(`<div className="border-t pt-5"><h2 className="text-xl font-semibold">Form cues</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-sm font-medium">01 Setup</p><p className="mt-1 text-sm text-muted-foreground">Brace your core and plant both feet.</p></div><div><p className="text-sm font-medium">02 Execute</p><p className="mt-1 text-sm text-muted-foreground">Move slowly and keep the load close.</p></div><div><p className="text-sm font-medium">03 Watch for</p><p className="mt-1 text-sm text-muted-foreground">Do not let your knees cave inward.</p></div></div></div>`), comps, icons: new Set<string>() };
    }
    if (inst.component === "SessionHistory") {
      return { jsx: wrapper(`<div className="border-t pt-5"><h2 className="text-xl font-semibold">Recent progression</h2><div className="mt-3 divide-y">{DATA.screens.home.activity.slice(0, 3).map((a, i) => <div key={i} className="py-3 text-sm"><span className="font-medium">{a}</span></div>)}</div></div>`), comps, icons: new Set<string>() };
    }
  }
  comps.add(inst.component);
  // V10: custom components receive the SCREEN's own data view — the catalog
  // rows on home, the single item on detail. Never a global slice.
  const scope = screen.id === "detail" ? "detail" : "home";
  const jsx = `<section className="pastel-frame ${padCls(inst)}">
  <${inst.component}
    title={${jstr(copy.headline)}}
    items={DATA.screens.${scope}.rows.slice(0, 4)}
    metrics={DATA.screens.${scope}.metrics ? DATA.screens.${scope}.metrics.slice(0, 4) : []}
    people={DATA.people.slice(0, 4)}
    settings={DATA.screens.${scope}.settingsSections ?? []}
  />
</section>`;
  return { jsx, comps, icons: new Set<string>() };
}

const BLOCK_DEFS: Record<string, (i: ComposeInput, s: WireframeScreen, b: PaddedBlock) => RecipeResult> = {
  hero: blockHero,
  stats: blockStats,
  chart: blockChart,
  table: blockTable,
  detail: blockDetail,
  form: blockForm,
  list: blockList,
  media: blockMedia,
  search: blockSearch,
  pricing: blockPricing,
  cta: blockCta,
  footer: (_i, _s, _b) => blockFooter(),
  custom: blockCustom,
};

// ── Screen assembly ───────────────────────────────────────────────────────

/** Wrapper primitives with named sub-exports — never rename these. */
const STRUCTURAL_PRIMITIVES = new Set(["Card", "Table"]);

/**
 * Resolve a recipe generic (e.g. "StatCard") to the built component name via
 * the wireframe inventory (e.g. "WorkoutStatRow", basedOn "StatCard").
 * ONLY resolves to a component whose `usedBy` includes this screen — a
 * generic may never be replaced by an inventory component planned for a
 * DIFFERENT screen (v8: kills the generic-shadowing bug where a model-built
 * component silently replaced the trusted Chart/StatCard/Avatar recipe).
 * Returns null when there is no match (the base primitive is materialized).
 */
function resolveWidget(input: ComposeInput, generic: string, screenId: string): string | null {
  // Components explicitly mounted by a custom block on this screen are NOT
  // generic stand-ins — never let them shadow a trusted primitive (v9: this
  // killed the duplicate-import bug where ReviewList imported itself twice).
  const screen = input.wireframe.screens.find((s) => s.id === screenId);
  const mounted = new Set<string>(screen?.blocks.filter((b) => b.block === "custom" && b.component).map((b) => b.component as string) ?? []);
  const onScreen = input.inventory.components.find((c) => c.basedOn === generic && c.usedBy?.includes(screenId) && !mounted.has(c.name));
  if (!onScreen) return null;
  return onScreen.name !== generic ? onScreen.name : null;
}

/** Emit imports for a screen's component set, returning any base primitives
 * the screen depends on that must exist on disk. Duplicate specifiers are
 * collapsed (v9: a custom-mounted component could previously collide with a
 * resolved generic and import itself twice). */
function componentImports(input: ComposeInput, comps: Set<string>, screenId: string): { imports: string[]; primitives: string[] } {
  const imports: string[] = [];
  const primitives: string[] = [];
  const seen = new Set<string>();
  for (const c of [...comps].sort()) {
    const built = STRUCTURAL_PRIMITIVES.has(c) ? null : resolveWidget(input, c, screenId);
    let line: string;
    if (built) {
      line = `import ${built} from "../components/${built}.jsx";`;
    } else if (c === "Table") {
      line = `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/Table.jsx";`;
      primitives.push("Table");
    } else if (c === "Card") {
      line = `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card.jsx";`;
      primitives.push("Card");
    } else {
      line = `import ${c} from "../components/${c}.jsx";`;
      primitives.push(c);
    }
    if (!seen.has(line)) {
      seen.add(line);
      imports.push(line);
    }
  }
  return { imports, primitives };
}

/** Rename resolved widget tags inside a recipe's JSX (e.g. <StatCard> → <WorkoutStatRow>). */
function substituteTags(jsx: string, map: Map<string, string>): string {
  if (map.size === 0) return jsx;
  let out = jsx;
  for (const [generic, built] of map) {
    out = out.replace(new RegExp(`</?${generic}\\b`, "g"), (m) => m.replace(generic, built));
  }
  return out;
}

/** Strip the single top-level <section> wrapper (recipes emit exactly one),
 * so two blocks can share a grid row (the `ratio` pairing). */
function unwrapSection(jsx: string): string {
  const open = jsx.indexOf("<section");
  if (open === -1) return jsx;
  const close = jsx.lastIndexOf("</section>");
  if (close === -1) return jsx;
  const tagEnd = jsx.indexOf(">", open);
  if (tagEnd === -1 || tagEnd > close) return jsx;
  return jsx.slice(tagEnd + 1, close);
}

function composeScreen(input: ComposeInput, screen: WireframeScreen): { content: string; primitives: string[] } {
  const comps = new Set<string>();
  const icons = new Set<string>();
  const preludes: string[] = [];
  const uxMap = input.ux ? uxLayoutFor(input.ux, screen.id) : null;
  // V10 layout structure from the UX plan ("catalog-rail" turns the home
  // search/stats into a sticky left rail beside the grid).
  const uxStructure = input.ux?.screens.find((s) => s.screenId === screen.id)?.layout.structure;

  const isApp = screen.nav !== "none";
  const shell: string[] = [];
  const body: string[] = [];

  if (screen.nav === "sidebar+topbar" || screen.nav === "sidebar") {
    const s = blockSidebar();
    s.comps.forEach((c) => comps.add(c));
    shell.push(s.jsx);
    shell.push(`<div className="flex min-h-screen">`);
    shell.push(`  <div className="flex-1 min-w-0">`);
  }

  if (screen.nav === "topbar" || screen.nav === "sidebar+topbar") {
    const t = blockAppTopbar(input, screen);
    t.comps.forEach((c) => comps.add(c));
    shell.push(`    ${t.jsx}`);
  }

  // V11: `main` does NOT constrain width or padding — every section self-
  // frames with `pastel-frame`, so full-bleed bands (`w-full`) are genuinely
  // edge-to-edge and framed sections center themselves on the same law.
  // (The old `max-w-[1280px] px-6 md:px-8` + `-mx-6` escape hack produced
  // off-rhythm, colliding sections and gate artifacts.)
  const mainOpen = isApp ? `    <main className="w-full min-w-0">` : null;

  // On app screens the hero owns the metrics — a separate stats block would
  // compete with the dominant moment (v8: no double-metric screens). A
  // scoreboard-only screen simply omits the hero. V9: catalog-led products
  // (rentals/travel/ecommerce) never show stat bands or charts on home —
  // the search hero + product grid ARE the story.
  const isCatalogDomain = CATALOG_DOMAINS.has(input.data.domain);
  const skipStats = isApp && (screen.blocks.some((b) => b.block === "hero") || isCatalogDomain);
  const skipCharts = isApp && isCatalogDomain;
  // V9: the catalog hero already IS the search bar — a separate search block
  // would render the destination/dates/guests row twice.
  const skipSearch = isCatalogDomain && screen.blocks.some((b) => b.block === "hero");

  // V10 layout rhythm: each rendered section gets its padding from the
  // 8px-rhythm ladder (alternating steps, dominant moment largest), never an
  // ad hoc py-N baked into a recipe.
  const isRail = uxStructure === "catalog-rail" && screen.id === "home";
  const railBlocks: string[] = [];
  const mainBlocks: string[] = [];
  let railPad = "";
  let padIdx = 0;
  for (let bi = 0; bi < screen.blocks.length; bi++) {
    const inst = screen.blocks[bi];
    if (inst.block === "topbar" && screen.nav !== "none") continue;
    if (inst.block === "sidebar") continue;
    if (skipStats && inst.block === "stats") continue;
    if (skipCharts && inst.block === "chart") continue;
    if (skipSearch && inst.block === "search") continue;
    const def = BLOCK_DEFS[inst.block];
    if (!def) continue;
    // App screens never get marketing heroes — force the app-dashboard moment.
    const effective = inst.block === "hero" && isApp ? { ...inst, variant: "app" } : inst;
    // V9 UX plan: a section marked `pair` shares a grid row with the next
    // (translated to the existing ratio mechanism).
    const uxHint = uxMap?.get(inst.block);
    const instForLayout = {
      ...effective,
      __pad: sectionPad(effective.emphasis, padIdx++),
      ...(uxHint?.pair ? { ratio: "1:1" as const } : {}),
    };
    // In the rail structure the hero is dropped (the rail's search toolbar
    // heads the page); search + stats live in the sticky left rail. The
    // product grid keeps its dominant-moment emphasis.
    if (isRail) {
      if (inst.block === "hero") continue;
      const rr = def(input, screen, inst.block === "list" ? instForLayout : { ...instForLayout, emphasis: undefined });
      rr.comps.forEach((c) => comps.add(c));
      rr.icons.forEach((i) => icons.add(i));
      if (rr.prelude && !preludes.some((pp) => pp === rr.prelude || (pp.startsWith("const SCENES") && rr.prelude!.startsWith("const SCENES")))) preludes.push(rr.prelude);
      if (!rr.jsx.trim()) continue;
      if (inst.block === "search" || inst.block === "stats") {
        railBlocks.push(rr.jsx);
        if (!railPad) railPad = padCls(instForLayout);
      } else {
        mainBlocks.push(rr.jsx);
      }
      continue;
    }
    const r = def(input, screen, instForLayout);
    r.comps.forEach((c) => comps.add(c));
    r.icons.forEach((i) => icons.add(i));
    if (r.prelude && !preludes.some((pp) => pp === r.prelude || (pp.startsWith("const SCENES") && r.prelude!.startsWith("const SCENES")))) preludes.push(r.prelude);
    if (!r.jsx.trim()) continue;

    // Two-up pairing: a block with `ratio` shares a grid row with the next
    // block. Never pairs the dominant moment, and stats collapse to 2 columns.
    const next = screen.blocks[bi + 1];
    if (instForLayout.ratio && next && !instForLayout.emphasis && !next.emphasis) {
      const nextDef = BLOCK_DEFS[next.block];
      if (nextDef) {
        const nextEff = next.block === "hero" && isApp ? { ...next, variant: "app" } : next;
        const rn = nextDef(input, screen, { ...nextEff, __pad: instForLayout.__pad });
        rn.comps.forEach((c) => comps.add(c));
        rn.icons.forEach((i) => icons.add(i));
        if (rn.prelude && !preludes.some((pp) => pp === rn.prelude || (pp.startsWith("const SCENES") && rn.prelude!.startsWith("const SCENES")))) preludes.push(rn.prelude);
        if (rn.jsx.trim()) {
          const effA = inst.block === "stats" ? { ...effective, variant: "grid" } : effective;
          const rA = BLOCK_DEFS[inst.block]!(input, screen, { ...effA, __pad: instForLayout.__pad });
          rA.comps.forEach((c) => comps.add(c));
          rA.icons.forEach((i) => icons.add(i));
          if (rA.prelude && !preludes.some((pp) => pp === rA.prelude || (pp.startsWith("const SCENES") && rA.prelude!.startsWith("const SCENES")))) preludes.push(rA.prelude);
          const colA = unwrapSection(rA.jsx);
          const colB = unwrapSection(rn.jsx);
          const pairPad = padCls(instForLayout);
          body.push(`<section className="pastel-frame ${pairPad}">
  <div className="grid items-stretch gap-8 lg:grid-cols-2">
    ${indent(colA, 1)}
    ${indent(colB, 1)}
  </div>
</section>`);
          bi++;
          continue;
        }
      }
    }

    body.push(r.jsx);
  }

  // V10 catalog-rail: on desktop the search toolbar + stats live in a sticky
  // left rail beside the grid; on mobile everything stacks normally.
  if (isRail && railBlocks.length > 0) {
    body.push(`<section className="pastel-frame ${railPad || "py-10"}">
  <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
    <div className="min-w-0 space-y-6 lg:sticky lg:top-6">
      ${indent(railBlocks.join("\n"), 1)}
    </div>
    <div className="min-w-0">
      ${indent(mainBlocks.join("\n"), 1)}
    </div>
  </div>
</section>`);
  } else {
    body.push(...mainBlocks);
  }

  if (screen.nav === "none") {
    const h = blockMarketingHeader(input);
    h.comps.forEach((c) => comps.add(c));
    const bodyJsx = body.join("\n");
    return renderFile(input, screen, comps, icons, preludes, `<>${indent(h.jsx, 1)}\n${indent(bodyJsx, 1)}</>`);
  }

  const bodyJsx = body.join("\n");
  const inner = [
    ...shell,
    ...(mainOpen ? [mainOpen] : []),
    ...bodyJsx.split("\n").map((l) => (l.trim() ? `    ${l}` : l)),
    ...(mainOpen ? [`    </main>`] : []),
  ];
  if (screen.nav === "sidebar+topbar" || screen.nav === "sidebar") inner.push(`  </div>`);
  if (screen.nav === "sidebar+topbar" || screen.nav === "sidebar") inner.push(`</div>`);
  if (screen.nav === "tabbar") {
    const t = blockTabbar();
    t.comps.forEach((c) => comps.add(c));
    inner.push(t.jsx);
  }

  return renderFile(input, screen, comps, icons, preludes, indent(inner.join("\n"), 1));
}

function renderFile(input: ComposeInput, screen: WireframeScreen, comps: Set<string>, icons: Set<string>, preludes: string[], bodyJsx: string): { content: string; primitives: string[] } {
  const lucideNames = Object.values(ICONS).sort();
  const aliased = lucideNames.includes("SettingsIcon") ? `Settings as SettingsIcon` : null;
  const lucideList = (aliased ? [aliased, ...lucideNames.filter((n) => n !== "SettingsIcon")] : lucideNames).sort();

  // Resolve recipe generics → built component names for this screen.
  const rename = new Map<string, string>();
  for (const c of comps) {
    const built = STRUCTURAL_PRIMITIVES.has(c) ? null : resolveWidget(input, c, screen.id);
    if (built) rename.set(c, built);
  }
  const { imports, primitives } = componentImports(input, comps, screen.id);

  const importsList: string[] = [
    `import { useState } from "react";`,
    ...imports,
    `import { ${lucideList.join(", ")} } from "lucide-react";`,
    `import { TONE, signed, NAV, IconOf } from "../lib/shell.jsx";`,
    `import { DATA } from "../data.js";`,
  ];

  return {
    content: `// Generated screen: ${screen.id} — ${screen.archetype} (deterministic composition)
${importsList.join("\n")}
${preludes.join("\n\n")}
export default function Screen() {
  const [active, setActive] = useState("${screen.id}");

  const copy = DATA.copy["${screen.id}"] ?? { headline: "${screen.id}" };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground" style={{ fontFamily: "var(--font-body)" }}>
${indent(substituteTags(bodyJsx, rename), 1)}
    </div>
  );
}
`,
    primitives,
  };
}

function indent(s: string, n: number): string {
  const pad = "  ".repeat(n);
  return s.split("\n").map((l) => (l.trim() ? pad + l : l)).join("\n");
}

export interface ComposeOutput {
  files: Record<string, string>;
  /** Base-component primitives the screens depend on (built name !== generic
   * or generic not in the inventory). Orchestrator materializes any that the
   * builder did not already produce. */
  primitives: Record<string, string>;
}

export function composeScreens(input: ComposeInput): { screens: Record<string, string>; primitives: Record<string, string> } {
  const screens: Record<string, string> = {};
  const primitives: Record<string, string> = {};
  for (const screen of input.wireframe.screens) {
    const { content, primitives: deps } = composeScreen(input, screen);
    screens[`src/screens/${screen.id}.jsx`] = content;
    for (const name of deps) {
      const code = baseComponentCode(name);
      if (code && !primitives[`src/components/${name}.jsx`]) {
        primitives[`src/components/${name}.jsx`] = code;
      }
    }
  }
  return { screens, primitives };
}

export function composeAll(input: ComposeInput): ComposeOutput {
  const files: Record<string, string> = {};
  files["src/data.js"] = composeDataFile(input);
  files["src/lib/shell.jsx"] = composeShell(input);
  const { screens, primitives } = composeScreens(input);
  Object.assign(files, screens);
  return { files, primitives };
}

export { mockDataset };

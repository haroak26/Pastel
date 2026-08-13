import type { ProductBrief, WireframePlan, ComponentInventory, CopyPlan, ResolvedTheme, BlockInstance, WireframeScreen, UxDesignPlan, ProductMode, VisualIntent, ProductContext, BrandKit } from "./schemas";
import { mockDataset, normalizeUnit, hashSeed, type MockDataset } from "./lib/content";
import { DOMAIN_PRIMARY_CTA, DOMAIN_HOME_CTA, PRICE_SUFFIX, REVIEW_HEADING, TRUST_ITEMS, briefText } from "./lib/domains";
import { uxLayoutFor, classifyMode, APP_HERO_VARIANTS, classifyContext } from "./lib/ux-design";
import { sectionPad, padCls, BAND_PAD, type PadContext } from "./lib/layout";
import { sceneSvg } from "./lib/scenes";
import { buildV17DesignPlan, enforceV17Plan } from "./contract";
import { decideNavigation, footerPolicy, type V17NavType, isNavLegal } from "./lib/navigation";
import { surfaceCls, CARD_LIKE_SURFACES, canonicalSurface, defaultFrameSpec, framePad, columnLayoutFor } from "./lib/composition";

/**
 * V20 deterministic screen composer.
 *
 * V20 removes the recipe fallback: the model screen composer is the ONLY path
 * for screen body generation. The shell (sidebar/topbar/nav) wraps the model
 * body, and the model fills the V21 deterministic placement plan. The builder
 * produces EVERY component — there are no base templates to fall back to.
 */

export type PaddedBlock = BlockInstance & PadContext;

export interface ComposeInput {
  brief: ProductBrief;
  wireframe: WireframePlan;
  inventory: ComponentInventory;
  copy: CopyPlan;
  theme: ResolvedTheme;
  data: MockDataset;
  ux?: UxDesignPlan | null;
  visual?: VisualIntent | null;
}

// ── Data helpers ───────────────────────────────────────────────────────────

const STAY_DOMAINS = new Set(["travel", "rentals"]);

function modeOf(input: ComposeInput): ProductMode {
  return input.brief.mode ?? classifyMode(briefText(input.brief));
}

function isBrowseProduct(input: ComposeInput): boolean {
  const mode = modeOf(input);
  return mode === "browse" || mode === "transact";
}

function isStayProduct(input: ComposeInput): boolean {
  return modeOf(input) === "transact" || STAY_DOMAINS.has(input.data.domain);
}

function wantsReviews(input: ComposeInput): boolean {
  const mode = modeOf(input);
  if (mode === "browse" || mode === "transact" || mode === "social") return true;
  return /listing|stay|property|reviews?|episode|album|book(?:ing)?|product/i
    .test(input.brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "");
}

function isMediaItem(input: ComposeInput): boolean {
  const mode = modeOf(input);
  if (mode === "transact") return true;
  return /listing|gallery|photo|photograph|image|media|video|episode|stay|property|album|visual|house|room|shoe|product shot/i
    .test(input.brief.screenPurposes.find((p) => p.id === "detail")?.purpose ?? "");
}

function countLabel(input: ComposeInput): string {
  if (STAY_DOMAINS.has(input.data.domain)) return "stays";
  if (input.data.domain === "ecommerce") return "products";
  return "items";
}

function reviewHeadingFor(input: ComposeInput, fallback: string | undefined): string {
  const heading = fallback ?? REVIEW_HEADING[input.data.domain] ?? "What people say";
  if (!isStayProduct(input) && /guest reviews|verified host|superhost/i.test(heading)) {
    return REVIEW_HEADING[input.data.domain] ?? "What people say";
  }
  return heading;
}

function moodOf(input: ComposeInput): "compact" | "standard" | "generous" {
  return input.visual?.spacingMood ?? "standard";
}

function mediaStyleOf(input: ComposeInput): { strategy: string; subject: string } {
  return {
    strategy: input.visual?.mediaStrategy ?? "flat-illustration",
    subject: input.data.mediaSubject ?? input.visual?.mediaSubject ?? "generic",
  };
}

function cardSurfaceCls(input: ComposeInput): string {
  switch (input.visual?.surfaceTreatment) {
    case "hairline": return " border border-border/50";
    case "flat": return " border-0 shadow-none bg-transparent";
    case "layered": return " shadow-sm";
    default: return " border-0";
  }
}

// ── Data file generation ──────────────────────────────────────────────────

export function composeDataFile(input: ComposeInput): string {
  const { data, copy, brief } = input;
  const features = brief.features.length > 0 ? brief.features : [
    { name: "Core experience", description: "The primary workflow, done well.", priority: "critical" },
    { name: "Fast search", description: "Find anything in seconds.", priority: "high" },
  ];

  const copyByScreen: Record<string, unknown> = {};
  for (const s of copy.screens) copyByScreen[s.screenId] = s;

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
        fields: data.detailFields.map((label, i) => ({
          label,
          value: first?.fields?.[i] ?? data.detailValues[i] ?? "—",
        })),
        reviews: data.reviews,
        summary,
        primaryCta: data.primaryCta ?? DOMAIN_PRIMARY_CTA[data.domain] ?? "Continue",
      },
    },
  };

  return `// Deterministic content — domain-aware copy + sample data for this run.
// V20: each screen reads ONLY its own scoped view (DATA.screens.<id>).
export const DATA = ${JSON.stringify(DATA, null, 2)};
`;
}

// ── Shell + shared helpers ─────────────────────────────────────────────────

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

const NAV_STOPWORDS = new Set([
  "the", "a", "an", "and", "of", "for", "with", "your", "my", "all",
  "browse", "explore", "discover", "view", "open", "page", "screen",
  "info", "full", "single", "item", "main", "detail", "landing",
]);

export function navFor(wireframe: WireframePlan, data?: MockDataset) {
  return wireframe.screens.map((s) => {
    const id = s.id;
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

function composeShell(input: ComposeInput): string {
  const lucideNames = Object.values(ICONS).sort();
  const aliased = lucideNames.includes("SettingsIcon") ? `Settings as SettingsIcon` : null;
  const lucideList = (aliased ? [aliased, ...lucideNames.filter((n) => n !== "SettingsIcon")] : lucideNames).sort();
  const iconMap = ICON_MAP.trim().replace(/^function IconOf/, "export function IconOf");
  return `// Generated shell — shared screen scaffolding (tones, nav, icon map, section headers).
import { ${lucideList.join(", ")} } from "lucide-react";

export const TONE = {
${Object.entries(STATUS_TONE).map(([k, v]) => `  ${k}: "${v}"`).join(",\n")}
};

export const signed = (n) => (n > 0 ? "+" : "") + n + "%";

export const NAV = ${JSON.stringify(navFor(input.wireframe, input.data))};

// V21 deterministic section header — the ONLY section heading in the app.
// Every non-dominant section opens with one (eyebrow + title + optional
// right-aligned action), which keeps headings consistent across screens.
export function SectionHeader({ eyebrow, title, action, className = "" }) {
  return (
    <div className={\`mb-5 flex items-end justify-between gap-4 \${className}\`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight text-balance" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

${iconMap}
`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function copyFor(copy: CopyPlan, screenId: string) {
  return copy.screens.find((s) => s.screenId === screenId) ?? { screenId, headline: screenId };
}

function jstr(s: string | undefined): string {
  return `'${(s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " ")}'`;
}

function txt(s: string | undefined): string {
  return (s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\r?\n/g, " ").replace(/</g, "&lt;");
}

function sceneTile(idxExpr: string): string {
  return `<div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
  <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: SCENES[${idxExpr} % SCENES.length] }} />
</div>`;
}

function scenePreludeHome(input: ComposeInput, count = 6): string {
  const { subject, strategy } = mediaStyleOf(input);
  const scenes = input.data.rows.slice(0, count).map((r) => sceneSvg(input.data.domain, hashSeed(r.id), 0, 0, subject, strategy));
  return `const SCENES = ${JSON.stringify(scenes)};`;
}

function scenePreludeGallery(input: ComposeInput, count = 5): string {
  const { subject, strategy } = mediaStyleOf(input);
  const item = input.data.rows[0];
  const scenes = Array.from({ length: count }, (_, a) => sceneSvg(input.data.domain, hashSeed(item?.id ?? "item"), 0, a, subject, strategy));
  return `const SCENES = ${JSON.stringify(scenes)};`;
}

const HEART_BUTTON = `<button type="button" aria-label="Save to wishlist" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground transition-all hover:bg-background focus-visible:outline-2 focus-visible:outline-ring active:scale-90">
  <IconOf name="heart" className="h-4 w-4" />
</button>`;

// ── Component resolution ───────────────────────────────────────────────────

const STRUCTURAL_PRIMITIVES = new Set(["Card", "Table"]);

/** V21: built components are mounted by their own name — the composer only
 * uses components from the built set, so no legacy basedOn remapping exists.
 * The deterministic structural primitives (Card/Table) render from the
 * builder's output directly. */
function resolveWidget(input: ComposeInput, generic: string, screenId: string): string | null {
  const screen = input.wireframe.screens.find((s) => s.id === screenId);
  const mounted = new Set<string>(screen?.blocks.filter((b) => b.block === "custom" && b.component).map((b) => b.component as string) ?? []);
  const onScreen = input.inventory.components.find((c) => c.name === generic && c.usedBy?.includes(screenId) && !mounted.has(c.name));
  void onScreen;
  return null;
}

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

function substituteTags(jsx: string, map: Map<string, string>): string {
  if (map.size === 0) return jsx;
  let out = jsx;
  for (const [generic, built] of map) {
    out = out.replace(new RegExp(`</?${generic}\\b`, "g"), (m) => m.replace(generic, built));
  }
  return out;
}

// ── V20 screen rendering (model-composed body only) ────────────────────────

const JSX_TAG_RE = /<\/?([A-Z][A-Za-z0-9]*)\b/g;

function scanBodyComponents(body: string): Set<string> {
  const comps = new Set<string>();
  for (const m of body.matchAll(JSX_TAG_RE)) {
    const name = m[1];
    if (name === "IconOf" || name === "SectionHeader") continue;
    comps.add(name);
  }
  return comps;
}

/** V20/V21: wrap a model-composed body in the deterministic shell. Exported
 * so tests and component-proof renders drive the real production path. */
export function composeScreenV20(input: ComposeInput, screen: WireframeScreen, body: string): { content: string; primitives: string[] } {
  const ctx = classifyContext(briefText(input.brief));
  const comps = scanBodyComponents(body);
  const icons = new Set<string>();
  const preludes: string[] = [];
  const isApp = ctx !== "marketing" && ctx !== "onboarding";
  const shell: string[] = [];

  // V20: shell renders BUILT Topbar/Sidebar (produced by the builder) —
  // there are no base templates left to fall back to.
  const copy = copyFor(input.copy, screen.id);
  const showSearch = isBrowseProduct(input);
  const showUser = ctx !== "marketing" && ctx !== "onboarding";
  const brand = input.brief.title;

  if (screen.nav === "sidebar+topbar" || screen.nav === "sidebar") {
    comps.add("Sidebar");
    comps.add("Avatar");
    shell.push(`<Sidebar`);
    shell.push(`  brand={DATA.productTitle}`);
    shell.push(`  nav={NAV}`);
    shell.push(`  activeId={active}`);
    shell.push(`  onNavigate={setActive}`);
    shell.push(`  iconOf={(name) => <IconOf name={name} />}`);
    shell.push(`  user={DATA.people[0]}`);
    shell.push(`/>`);
    shell.push(`<div className="flex min-h-screen">`);
    shell.push(`  <div className="flex-1 min-w-0">`);
  }

  if (screen.nav === "topbar" || screen.nav === "sidebar+topbar") {
    comps.add("Topbar");
    comps.add("Input");
    comps.add("Avatar");
    const props: string[] = [
      `title={${jstr(copy.headline)}}`,
      `subtitle={${jstr(copy.overline ?? `${brand} — ${input.brief.description.slice(0, 60)}`)}}`,
    ];
    if (showSearch) props.push("search");
    if (showUser) props.push("user={DATA.people[0]}");
    props.push("actions={<></>}");
    shell.push(`    <Topbar\n    ${props.join("\n    ")}\n  />`);
  }

  const mainOpen = isApp ? `    <main className="w-full min-w-0">` : null;

  const bodyJsx = body.trim();
  const inner = [
    ...shell,
    ...(mainOpen ? [mainOpen] : []),
    ...bodyJsx.split("\n").map((l) => (l.trim() ? `    ${l}` : l)),
    ...(mainOpen ? [`    </main>`] : []),
  ];
  if (screen.nav === "sidebar+topbar" || screen.nav === "sidebar") inner.push(`  </div>`);
  if (screen.nav === "sidebar+topbar" || screen.nav === "sidebar") inner.push(`</div>`);

  return renderFile(input, screen, comps, icons, preludes, indent(inner.join("\n"), 1));
}

function renderFile(input: ComposeInput, screen: WireframeScreen, comps: Set<string>, icons: Set<string>, preludes: string[], bodyJsx: string): { content: string; primitives: string[] } {
  const lucideNames = Object.values(ICONS).sort();
  const aliased = lucideNames.includes("SettingsIcon") ? `Settings as SettingsIcon` : null;
  const lucideList = (aliased ? [aliased, ...lucideNames.filter((n) => n !== "SettingsIcon")] : lucideNames).sort();

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
    `import { TONE, signed, NAV, IconOf, SectionHeader } from "../lib/shell.jsx";`,
    `import { DATA } from "../data.js";`,
  ];

  return {
    content: `// Generated screen: ${screen.id} — ${screen.archetype} (V20 model composition)
${importsList.join("\n")}
${preludes.join("\n\n")}
export default function Screen() {
  const [active, setActive] = useState("${screen.id}");

  const copy = DATA.copy["${screen.id}"] ?? { headline: "${screen.id}" };
  const COPY = copy;

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

// ── V20 composition (model-only) ──────────────────────────────────────────

export interface ComposeV20Input extends ComposeInput {
  builtComponents: Record<string, string>;
  componentSpecs?: Record<string, import("./schemas").ComponentUISpec>;
  companyBlock?: string;
  megadesignBlock?: string;
  /** V21: deterministic placement plan — the composer fills it exactly. */
  layoutPlan?: import("./schemas").V21LayoutPlan | null;
  visualReference?: import("./types").VisualReference;
  onUsage?: import("./gateway").OnUsage;
  /** V20: feedback from the previous compose attempt (per screen) — re-injected
   * into the composer prompt on retry so the retry is directive, not identical. */
  retryNotes?: string[];
}

export interface ComposeV20Output {
  files: Record<string, string>;
  /** Base primitives the screens need that weren't produced by the builder. */
  primitives: Record<string, string>;
  /** Screens where the model composer failed — orchestrator retries or hard-fails. */
  failedScreens: string[];
  /** V20: one deterministic error per failed screen (missing components, etc.). */
  errors: Record<string, string>;
}

/** V20 backward-compatible compose output (used by tests and legacy paths). */
export interface ComposeOutput {
  files: Record<string, string>;
  primitives: Record<string, string>;
}

/**
 * V20 compositor — model-composed screens ONLY. No recipe fallback.
 *
 * On composer failure for a screen: the screen is marked as failed. The
 * orchestrator retries with improved context. After 2 retries, the run
 * hard-fails rather than silently degrading to generic template output.
 */
export async function composeAllV20(input: ComposeV20Input): Promise<ComposeV20Output> {
  const guarded = input.brief.mode
    ? enforceV17Plan(input.brief, input.wireframe, input.inventory, buildV17DesignPlan(input.brief))
    : null;
  const active: ComposeInput = guarded
    ? { ...input, wireframe: guarded.plan, inventory: guarded.inventory }
    : input;

  const files: Record<string, string> = {};
  files["src/data.js"] = composeDataFile(active);
  files["src/lib/shell.jsx"] = composeShell(active);

  const primitives: Record<string, string> = {};
  const failedScreens: string[] = [];
  const errors: Record<string, string> = {};

  const companyBlock = input.companyBlock ?? "";

  const { runScreenComposer } = await import("./agents/screen-composer");

  const builtByName: Record<string, string> = {};
  for (const [p, code] of Object.entries(input.builtComponents)) {
    const name = p.replace(/^src\/components\//, "").replace(/\.jsx$/, "");
    builtByName[name] = code;
  }

  for (const screen of active.wireframe.screens) {
    const composer = await runScreenComposer({
      brief: active.brief,
      screen,
      wireframe: active.wireframe,
      inventory: active.inventory,
      builtComponents: builtByName,
      specs: input.componentSpecs ?? {},
      copy: active.copy,
      theme: active.theme,
      data: active.data,
      ux: active.ux,
      visual: active.visual,
      companyBlock,
      layoutPlan: input.layoutPlan,
      visualReference: input.visualReference,
      onUsage: input.onUsage,
      retryNotes: input.retryNotes,
    });

    if (composer.usedFallback) {
      failedScreens.push(screen.id);
      errors[screen.id] = composer.notes.join("; ");
      continue;
    }

    const { content, primitives: deps } = composeScreenV20(active, screen, composer.body);
    files[`src/screens/${screen.id}.jsx`] = content;

    // V20: any primitive the screen needs that the builder didn't produce
    // is a hard failure — the orchestrator retries instead of silently
    // degrading to a template.
    const missing: string[] = [];
    for (const name of deps) {
      if (!primitives[`src/components/${name}.jsx`]) {
        const built = builtByName[name];
        if (built) {
          primitives[`src/components/${name}.jsx`] = built;
        } else {
          missing.push(name);
        }
      }
    }
    if (missing.length > 0) {
      failedScreens.push(screen.id);
      errors[screen.id] = `screen ${screen.id} references ${missing.length} component(s) the builder did not produce: ${[...new Set(missing)].join(", ")} — the composer must use ONLY components built for this run.`;
    }
  }

  return { files, primitives, failedScreens, errors };
}

// ── V23 per-screen composition (early start) ──────────────────────────────
//
// V23 composes each screen as soon as ITS components are ready — not after
// every component across every screen finishes (the biggest parallelism win
// Picasso identified but never shipped). The composer prompt only lists the
// components this screen can mount (mounted slots + shell chrome), which is
// exactly the contract it must obey anyway.

/**
 * V23 shared run files (data.js + lib/shell.jsx). These are run-wide, not
 * per-screen — generated ONCE before per-screen composition starts. Every
 * screen imports them (`../data.js`, `../lib/shell.jsx`), so a run that
 * forgets them fails every screen at bundle time.
 */
export function composeSharedFiles(input: ComposeV20Input): Record<string, string> {
  const guarded = input.brief.mode
    ? enforceV17Plan(input.brief, input.wireframe, input.inventory, buildV17DesignPlan(input.brief))
    : null;
  const active: ComposeInput = guarded
    ? { ...input, wireframe: guarded.plan, inventory: guarded.inventory }
    : input;
  return {
    "src/data.js": composeDataFile(active),
    "src/lib/shell.jsx": composeShell(active),
  };
}

/** The component set a screen's composer prompt must offer. */
export function screenNeedsComponents(screen: WireframeScreen): string[] {
  const needs = new Set<string>();
  for (const b of screen.blocks) {
    if (b.component) needs.add(b.component);
  }
  // Shell chrome the renderFile wrapper mounts for this screen's nav + the
  // primitives the composer may reach for.
  for (const n of ["Topbar", "Sidebar", "Button", "Avatar", "Badge", "Input", "Select", "Separator"]) {
    needs.add(n);
  }
  return [...needs].sort();
}

export interface OneScreenComposeResult {
  path: string;
  content: string;
  failed: boolean;
  error?: string;
  primitives: Record<string, string>;
}

/**
 * Compose ONE screen (model composer + deterministic file render). The
 * composer sees only the components this screen needs — already built.
 */
export async function composeOneScreenV20(
  input: ComposeV20Input,
  screen: WireframeScreen,
): Promise<OneScreenComposeResult> {
  const path = `src/screens/${screen.id}.jsx`;
  const builtByName: Record<string, string> = {};
  for (const [p, code] of Object.entries(input.builtComponents)) {
    const name = p.replace(/^src\/components\//, "").replace(/\.jsx$/, "");
    builtByName[name] = code;
  }

  const scoped: Record<string, string> = {};
  for (const n of screenNeedsComponents(screen)) {
    if (builtByName[n]) scoped[n] = builtByName[n];
  }

  const { runScreenComposer } = await import("./agents/screen-composer");
  const composer = await runScreenComposer({
    brief: input.brief,
    screen,
    wireframe: input.wireframe,
    inventory: input.inventory,
    builtComponents: scoped,
    specs: input.componentSpecs ?? {},
    copy: input.copy,
    theme: input.theme,
    data: input.data,
    ux: input.ux,
    visual: input.visual,
    companyBlock: input.companyBlock ?? "",
    layoutPlan: input.layoutPlan,
    visualReference: input.visualReference,
    onUsage: input.onUsage,
    retryNotes: input.retryNotes,
  });

  if (composer.usedFallback) {
    return { path, content: "", failed: true, error: composer.notes.join("; "), primitives: {} };
  }

  const { content, primitives: deps } = composeScreenV20(input, screen, composer.body);
  const missing = deps.filter((n) => !builtByName[n]);
  if (missing.length > 0) {
    return {
      path,
      content: "",
      failed: true,
      error: `screen ${screen.id} references ${missing.length} component(s) the builder did not produce: ${[...new Set(missing)].join(", ")} — the composer must use ONLY components built for this run.`,
      primitives: {},
    };
  }
  const primitivesOut: Record<string, string> = {};
  for (const n of deps) {
    if (builtByName[n]) primitivesOut[`src/components/${n}.jsx`] = builtByName[n];
  }
  return { path, content, failed: false, primitives: primitivesOut };
}

// ── Composition summary (for builder context) ─────────────────────────────

export function generateCompositionSummary(
  wireframe: WireframePlan,
  ux: UxDesignPlan | null,
  visual: VisualIntent | null,
): string {
  const lines: string[] = [];
  for (const screen of wireframe.screens) {
    const uxScreen = ux?.screens.find((s) => s.screenId === screen.id);
    const structure = uxScreen?.layout.structure ?? screen.archetype;
    const dominant = uxScreen?.layout.dominantMoment ?? "";
    lines.push(`## ${screen.id} — ${structure}`);
    lines.push(`Purpose: ${screen.purpose}`);
    lines.push(`Navigation: ${screen.nav}`);
    if (dominant) lines.push(`Dominant moment: ${dominant}`);
    if (visual) lines.push(`Visual intent: ${visual.typeVoice} voice, ${visual.spacingMood} spacing, ${visual.cornerLanguage} corners, ${visual.surfaceTreatment} surfaces, ${visual.accentBehavior} accent`);

    lines.push("Block sequence:");
    let prevBlock = "";
    for (const block of screen.blocks) {
      const surf = uxScreen?.layout.sections.find((s) => s.block === block.block)?.surface ?? canonicalSurface(block.block, block.variant, screen.id === "home" ? "home" : "detail");
      const emphasis = block.emphasis ? " (DOMINANT MOMENT)" : "";
      const marker = block.block === "custom" ? ` [custom component: ${block.component ?? "unknown"}]` : "";
      const variant = block.variant ? `:${block.variant}` : "";
      const relationship = prevBlock ? (surf === prevBlock ? " — SAME surface as previous (ensure visual distinction)" : ` — new surface: ${surf}`) : ` — surface: ${surf}`;
      lines.push(`  ${block.block}${variant}${emphasis}${marker}${relationship}`);
      prevBlock = surf;
    }
    lines.push("");
  }
  return lines.join("\n");
}

export { mockDataset };

/**
 * V20 backward-compatible composeAll for tests and non-model paths.
 * Returns data.js + shell.jsx only; screen generation requires model composer.
 */
export function composeAll(input: ComposeInput): ComposeOutput {
  const guarded = input.brief.mode
    ? enforceV17Plan(input.brief, input.wireframe, input.inventory, buildV17DesignPlan(input.brief))
    : null;
  const active = guarded
    ? { ...input, wireframe: guarded.plan, inventory: guarded.inventory }
    : input;
  const files: Record<string, string> = {};
  files["src/data.js"] = composeDataFile(active);
  files["src/lib/shell.jsx"] = composeShell(active);
  return { files, primitives: {} };
}

import type { DesignBlueprint } from "./blueprint";
import type { V25Dataset } from "./data-gen";

/**
 * Maxi Agent v25 — deterministic shared files.
 *
 * Everything here is generated ONCE per run with ZERO model calls:
 *
 *   · src/lib/shell.jsx — IconOf + the NavAdapter. The NavAdapter is the
 *     v24 WS1 lesson kept verbatim in spirit: navigation chrome is authored
 *     deterministically with a LOCKED prop contract (nav/activeId/onNavigate
 *     from run state; brand/user from DATA). The model never renders chrome,
 *     so "Sidebar rendered with the wrong props" is structurally impossible.
 *   · src/App.jsx — a tiny screen switcher so the exported project runs.
 *   · package.json — react + lucide-react; the two fonts the concept chose.
 *   · README.md — what was built and the file map.
 *
 * The shell is self-contained: it imports only lucide-react and DATA. It is
 * styled exclusively through the theme's CSS custom properties.
 */

export const SHELL_ICONS: Record<string, string> = {
  home: "Home", list: "List", chart: "LineChart", settings: "SettingsIcon", users: "Users",
  bell: "Bell", search: "Search", plus: "Plus", download: "Download", filter: "Filter",
  arrowRight: "ArrowRight", mail: "Mail", alert: "AlertCircle", file: "FileText", edit: "Edit",
  check: "CheckCircle2", zap: "Zap", card: "CreditCard", trendingUp: "TrendingUp", play: "Play",
  heart: "Heart", mapPin: "MapPin", star: "Star", clock: "Clock", image: "Image", more: "MoreHorizontal",
  chevronDown: "ChevronDown", calendarDays: "CalendarDays",
};

export const SHELL_ICON_NAMES = Object.keys(SHELL_ICONS).sort();

function lucideImportLine(): string {
  const names = Object.values(SHELL_ICONS).sort();
  const aliased = names.includes("SettingsIcon")
    ? `Settings as SettingsIcon, ${names.filter((n) => n !== "SettingsIcon").join(", ")}`
    : names.join(", ");
  return `import { ${aliased} } from "lucide-react";`;
}

function iconMapSource(): string {
  const entries = Object.entries(SHELL_ICONS)
    .map(([key, comp]) => `    ${key}: <${comp} className={className} />,`)
    .join("\n");
  return `export function IconOf({ name, className = "h-4 w-4" }) {
  const icons = {
${entries}
  };
  return icons[name] ?? null;
}`;
}

export function composeShellJsx(): string {
  return `// Generated shell — the app's only navigation chrome + icon map.
// The NavAdapter prop contract is LOCKED: nav / activeId / onNavigate come
// from deterministic run state, brand / user from DATA. Screens mount
// <NavAdapter nav="sidebar" activeId="home" onNavigate={setActive}> around
// their body — they never build their own chrome.
${lucideImportLine()}
import { DATA } from "../data.js";

${iconMapSource()}

export function NavAdapter({ nav, activeId, onNavigate, children }) {
  const hasSidebar = nav === "sidebar" || nav === "sidebar+topbar";
  const hasTopbar = nav === "topbar" || nav === "sidebar+topbar";
  if (!hasSidebar && !hasTopbar) return <>{children}</>;
  const brand = DATA.brand.name;
  const user = DATA.user;

  const topbarInner = hasTopbar ? (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">{brand.slice(0, 1)}</span>
      <span className="hidden truncate font-semibold sm:inline" style={{ fontFamily: "var(--font-display)" }}>{brand}</span>
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-2">
        <span aria-label={user.name} className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>{user.initials}</span>
        <span className="hidden text-sm font-medium md:inline">{user.name}</span>
      </div>
    </header>
  ) : null;

  if (!hasSidebar) {
    return (
      <>
        {topbarInner}
        <main className="w-full min-w-0">{children}</main>
      </>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <span className="flex h-16 items-center gap-2 px-6" aria-hidden="true">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground">{brand.slice(0, 1)}</span>
          <span className="truncate font-semibold" style={{ fontFamily: "var(--font-display)" }}>{brand}</span>
        </span>
        <nav className="mt-2 flex-1 space-y-1 px-4" aria-label="Primary navigation">
          {DATA.nav.map((item) => {
            const current = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={current ? "page" : undefined}
                className={"flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " + (current ? "bg-muted/50 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground")}
              >
                <IconOf name={item.icon} className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <span aria-label={user.name} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>{user.initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {topbarInner}
        <main className="w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
`;
}

export function composeAppJsx(bp: DesignBlueprint): string {
  const screens = bp.screens.map((s) => s.id);
  const imports = screens.map((id) => `import ${id[0]!.toUpperCase()}${id.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())} from "./screens/${id}.jsx";`).join("\n");
  const cases = screens
    .map((id, i) => `      {active === "${id}" ? <${id[0]!.toUpperCase()}${id.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())} /> : null}`)
    .join("\n");
  const navItems = screens
    .map((id) => `        <button key="${id}" type="button" onClick={() => setActive("${id}")} className={active === "${id}" ? "rounded-[var(--radius-md)] bg-muted/50 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring" : "rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"}>${id[0]!.toUpperCase()}${id.slice(1)}</button>`)
    .join("\n");
  return `import { useState } from "react";
${imports}

export default function App() {
  const [active, setActive] = useState("${screens[0]}");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 lg:hidden">
${navItems}
      </div>
${cases}
    </div>
  );
}
`;
}

export function composePackageJson(bp: DesignBlueprint): string {
  return JSON.stringify(
    {
      name: bp.brief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "maxi-app",
      private: true,
      version: "0.1.0",
      type: "module",
      dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", "lucide-react": "^0.454.0" },
      devDependencies: { vite: "^5.4.0", "@vitejs/plugin-react": "^4.3.0", tailwindcss: "^3.4.0", autoprefixer: "^10.4.0", postcss: "^8.4.0" },
      fonts: [bp.concepts[bp.chosenConcept]?.fonts.display, bp.concepts[bp.chosenConcept]?.fonts.body].filter(Boolean),
    },
    null,
    2,
  ) + "\n";
}

export function composeReadme(bp: DesignBlueprint, dataset: V25Dataset, filePaths: string[]): string {
  const concept = bp.concepts[bp.chosenConcept] ?? bp.concepts[0]!;
  const files = filePaths.sort().map((p) => `- \`${p}\``).join("\n");
  return `# ${bp.brief.title}

${bp.brief.description}

**Concept:** ${concept.name} — ${concept.thesis}

Built by Maxi Agent v25. ${bp.screens.length} screens · ${bp.componentManifest.length} components.

## Run it

\`\`\`bash
npm install
npm run dev
\`\`\`

Requires Tailwind (the \`src/styles.css\` token sheet pairs with Tailwind utilities).

## Files

${files}

## Data

All content renders from \`src/data.js\` (${dataset.list.rows.length} rows, ${dataset.metrics.length} metrics) — swap it with your real data and every screen updates.

## Fonts

- Display: ${concept.fonts.display}
- Body: ${concept.fonts.body}
`;
}

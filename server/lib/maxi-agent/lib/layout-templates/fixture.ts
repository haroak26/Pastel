import type { LayoutTemplate, TemplateSlot } from "./types";
import type { ComposeInput } from "../../compose";
import { composeShell } from "../../compose";
import { compileStyles } from "../../compile";
import { themeFromDesignTokens, loadCompany } from "../../knowledge/index";
import { mockDataset } from "../content";
import type { DesignTokens } from "../../schemas";

/**
 * Maxi Agent v24 — synthetic fixture screens for template geometry testing.
 *
 * For every hand-authored template a deterministic fixture screen is built
 * through the PRODUCTION paths: the composed shell (composeShell), the
 * compiled theme stylesheet (compileStyles), and the sandbox renderer
 * (lib/sandbox-render.ts via verifyScreens + renderScreenInSandbox). The
 * fixture renders the template's slots with real-looking content at the
 * template's 8px spacing scale — the geometry test asserts zero horizontal
 * overflow and 8px-grid-aligned spacing at 1440 / 768 / 375.
 */

const NAV_SLOT_MARKUP: Record<string, string> = {
  interactive: `<section className="min-w-0 py-8">
    <label htmlFor="fixture-{i}" className="mb-1 block text-sm font-medium text-foreground">Search</label>
    <input id="fixture-{i}" className="h-[var(--control-md)] w-full max-w-sm rounded-[var(--radius-md)] border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" placeholder="Find anything" />
  </section>`,
  dominant: `<section className="min-w-0 py-8">
    <div className="rounded-[var(--radius-lg)] bg-muted px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Weekly distance</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums text-foreground">1,284 km</p>
      <p className="mt-2 text-sm text-muted-foreground">+8.2% vs last week — the dominant moment of this screen</p>
    </div>
  </section>`,
  standard: `<section className="min-w-0 py-8">
    <h2 className="mb-4 text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Recent runs</h2>
    <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border bg-card">
      <li className="flex items-center justify-between gap-4 px-4 py-3"><span className="truncate text-sm font-medium text-foreground">Tempo run</span><span className="shrink-0 text-sm tabular-nums text-muted-foreground">12.4 km</span></li>
      <li className="flex items-center justify-between gap-4 px-4 py-3"><span className="truncate text-sm font-medium text-foreground">Recovery jog</span><span className="shrink-0 text-sm tabular-nums text-muted-foreground">5.1 km</span></li>
      <li className="flex items-center justify-between gap-4 px-4 py-3"><span className="truncate text-sm font-medium text-foreground">Long run</span><span className="shrink-0 text-sm tabular-nums text-muted-foreground">24.8 km</span></li>
    </ul>
  </section>`,
  compact: `<section className="min-w-0 py-8">
    <h2 className="mb-3 text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Quick stats</h2>
    <div className="flex flex-wrap gap-3">
      <span className="rounded-[var(--radius-md)] bg-muted px-3 py-1.5 text-sm tabular-nums text-foreground">Pace 5:02</span>
      <span className="rounded-[var(--radius-md)] bg-muted px-3 py-1.5 text-sm tabular-nums text-foreground">1,284 km</span>
      <span className="rounded-[var(--radius-md)] bg-muted px-3 py-1.5 text-sm tabular-nums text-foreground">42 runs</span>
    </div>
  </section>`,
};

function slotMarkup(slot: TemplateSlot, i: number, pairRole: "left" | "right" | null, columnGap: number): string {
  let kind: "interactive" | "dominant" | "standard" | "compact";
  if (slot.interactive) kind = "interactive";
  else if (slot.height === "dominant") kind = "dominant";
  else if (slot.height === "compact") kind = "compact";
  else kind = "standard";
  let markup = NAV_SLOT_MARKUP[kind]!.replace(/\{i\}/g, String(i));
  const gapCls = columnGap === 32 ? "gap-8" : "gap-6";
  if (pairRole === "left") markup = `<div className="grid ${gapCls} py-8 lg:grid-cols-[2fr_1fr]">\n    ${markup}`;
  if (pairRole === "right") markup = `${markup}\n  </div>`;
  return markup;
}

/** Deterministic fixture screen for one template — the template's exact
 *  slot sequence rendered at the template's 8px spacing scale. */
export function fixtureScreenFor(template: LayoutTemplate): string {
  const maxWidth = template.contentMaxWidth;
  const rows: string[] = [];
  const slots = template.slots;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const next = slots[i + 1];
    if (slot.placement === "split-left" && next?.placement === "split-right") {
      rows.push(slotMarkup(slot, i, "left", template.columnGap));
      rows.push(slotMarkup(next, i + 1, "right", template.columnGap));
      i++;
      continue;
    }
    rows.push(slotMarkup(slot, i, null, template.columnGap));
  }

  const nav = template.nav;
  return `// V24 template fixture — ${template.family} × ${template.nav} × ${template.bucket} (${template.role}), ${slots.length} slots
import { useState } from "react";
import { NavAdapter } from "../lib/shell.jsx";

export default function FixtureScreen() {
  const [active, setActive] = useState("home");
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-body)" }}>
      <NavAdapter nav="${nav}" activeId={active} onNavigate={setActive} brand="Fixture" title="Fixture screen" subtitle="Template geometry proof" user={null}>
        <div className="mx-auto w-full max-w-[${maxWidth}px] px-4 md:px-6">
          ${rows.join("\n          ")}
        </div>
      </NavAdapter>
    </div>
  );
}
`;
}

const FIXTURE_TOKENS: DesignTokens = {
  version: "1.0.0",
  mode: "light",
  colors: {
    background: "#ffffff", foreground: "#18181b", card: "#ffffff", cardForeground: "#18181b",
    popover: "#ffffff", popoverForeground: "#18181b",
    primary: "#18181b", primaryForeground: "#fafafa",
    secondary: "#f4f4f5", secondaryForeground: "#18181b",
    muted: "#f4f4f5", mutedForeground: "#71717a",
    accent: "#18181b", accentForeground: "#fafafa",
    destructive: "#dc2626", destructiveForeground: "#ffffff",
    success: "#16a34a", successSubtle: "#dcfce7",
    warning: "#d97706", warningSubtle: "#fef3c7",
    border: "#e4e4e7", input: "#e4e4e7", ring: "#18181b",
    chart: ["#18181b", "#16a34a", "#d97706", "#3b82f6", "#a855f7"],
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
  typeScale: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36 },
  control: { sm: 32, md: 40, lg: 48 },
  sectionPaddingY: 48,
  sectionGap: 32,
  fonts: { display: "Inter", body: "Inter" },
  rationale: "deterministic fixture tokens",
};

/**
 * The full fixture file set for one template: fixture screen + the REAL
 * composed shell (composeShell) + the REAL compiled stylesheet. Both shell
 * and styles go through the production code paths.
 */
export async function fixtureFilesFor(template: LayoutTemplate): Promise<Record<string, string>> {
  const company = await loadCompany("linear");
  const theme = themeFromDesignTokens(FIXTURE_TOKENS, company);
  const { css } = compileStyles(theme);

  const brief = {
    version: "1.0.0" as const,
    title: "Fixture",
    productType: "fixture app",
    mode: template.family === "catalog" ? ("browse" as const) : template.family === "social" ? ("social" as const) : ("track" as const),
    description: "A deterministic fixture product used to prove template geometry.",
    audience: { primary: "fixture users", needs: ["proof"] },
    goals: ["prove geometry"],
    features: [{ name: "fixture", description: "deterministic fixture", priority: "critical" as const }],
    platform: "all" as const,
    screenPurposes: [
      { id: "home", purpose: "the primary fixture workflow" },
      { id: "detail", purpose: "the focused fixture record" },
    ],
    designLanguage: "minimal",
    inspiration: { primary: "linear", secondary: [] },
  };

  const wireframe = {
    version: "1.0.0" as const,
    screens: [
      { id: "home", archetype: "app-dashboard" as const, title: "Home", purpose: "the primary fixture workflow", nav: template.nav, blocks: [] },
      { id: "detail", archetype: "list-detail" as const, title: "Detail", purpose: "the focused fixture record", nav: template.nav, blocks: [] },
    ],
  };

  const data = mockDataset(brief, "fixture-template-proof");

  const input: ComposeInput = {
    brief,
    wireframe,
    inventory: { version: "1.0.0", components: [] },
    copy: {
      productTitle: "Fixture",
      screens: [
        { screenId: "home", headline: "Fixture home", overline: "proof" },
        { screenId: "detail", headline: "Fixture detail", overline: "proof" },
      ],
    },
    theme,
    data,
  };

  const shell = composeShell(input);

  return {
    "src/screens/fixture.jsx": fixtureScreenFor(template),
    "src/lib/shell.jsx": shell,
    "src/styles.css": css,
  };
}

/** Static 8px-grid audit of the template's own spacing scale — runs with no
 *  sandbox. Returns the reasons it fails (empty when it passes). */
export function staticSpacingAudit(template: LayoutTemplate): string[] {
  const reasons: string[] = [];
  const multipleOf8 = (v: number) => v % 8 === 0;
  for (const [name, v] of Object.entries(template.gutter)) {
    if (!multipleOf8(v)) reasons.push(`gutter.${name} ${v}px is not on the 8px grid`);
  }
  if (!multipleOf8(template.columnGap)) reasons.push(`columnGap ${template.columnGap}px is not on the 8px grid`);
  if (!multipleOf8(template.sectionGap)) reasons.push(`sectionGap ${template.sectionGap}px is not on the 8px grid`);
  if (!multipleOf8(template.contentMaxWidth)) reasons.push(`contentMaxWidth ${template.contentMaxWidth}px is not on the 8px grid`);
  const minContent = 2 * template.gutter.mobile;
  if (minContent > 375) reasons.push(`mobile gutter leaves ${minContent}px of fixed chrome — overflows 375px`);
  if (template.slots.some((s) => s.placement === "split-left" || s.placement === "split-right")) {
    // Pair row math: (inner width - columnGap) / 3 must be an 8px multiple
    // so both 2/3 and 1/3 columns (and their edges) land on the grid.
    const inner = template.contentMaxWidth - 2 * template.gutter.desktop;
    const third = (inner - template.columnGap) / 3;
    if (!Number.isInteger(third) || !multipleOf8(third)) {
      reasons.push(`pair row lands off-grid: inner ${inner}px − gap ${template.columnGap}px = 3×${third}px (must be an 8px multiple)`);
    }
  }
  return reasons;
}

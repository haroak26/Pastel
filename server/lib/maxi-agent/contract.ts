export const SANDBOX_CONTRACT = `
REACT SANDBOX CONTRACT — code that violates these rules fails verification.

FILE STRUCTURE
  src/styles.css                      ← CSS custom properties + base styles (provided)
  src/components/<Name>.jsx           ← default export per component
  src/screens/<Screen>.jsx            ← default export per screen

HARD RULES
  1. Default exports: export default function Name() { ... }
  2. Relative imports with .jsx extension: import Button from "../components/Button.jsx"
  3. Never import React (JSX automatic runtime). Hooks allowed: import { useState } from "react"
  4. No external packages. Only react and react-dom exist.
  5. No fetch, localStorage, window.location at module scope.
     Use useState for local interactivity (toggles, tabs, accordions, mobile menus).
  6. No external images. Use inline SVGs with stroke="currentColor",
     strokeWidth 1.5-2, 24x24 viewBox. CSS-only visuals for decoration.
  7. Links: <a href="#" onClick={(e) => e.preventDefault()}>
  8. Every screen is self-sufficient at 1440px, responsive down to 375px
     via Tailwind prefixes (sm:, md:, lg:).

STYLING
  - Tailwind utility classes + CSS custom properties via arbitrary values.
    bg-[var(--color-surface)], text-[var(--color-accent)], rounded-[var(--radius-md)]
  - Never hardcode hex colours. Always reference CSS custom property tokens.
  - Font families: style={{ fontFamily: "var(--font-display)" }} for headlines.
    Body inherits var(--font-body) from the screen root.
  - No <style> tags, no CSS files beyond styles.css, no styled-components.
  - Spacing: 8px rhythm scale (p-2, p-4, p-6, p-8, p-12, p-16, p-24, p-32).

QUALITY
  - Screens compose shared components. Never duplicate navbar/sidebar inline.
  - All interactive elements have hover states (hover: + transition-colors).
  - Real, specific copy everywhere. No lorem ipsum. No placeholder text.
`.trim();

// ── Maxi Agent v17 product contract ─────────────────────────────────────
//
// V17: structure = product mode (job) × product context (surface)
//      company contributes visual language only.
//      Navigation is product-level, never wireframe-level.
//      Density thresholds gate sparse composition.
//      Brand-kit coherence gates palette consistency.
//      Marketing composition is ILLEGAL on app screens.
//
// Every deterministic check below replaces a prompt rule that v15/v16 models
// routinely ignored. The review board now evaluates DESIGN QUALITY (rubric),
// not just structural legality.

import type { ProductBrief, ProductMode, WireframePlan, ComponentInventory, BlockInstance, BrandKit } from "./schemas";
import type { ProductContext } from "./schemas";
import { classifyContext } from "./lib/ux-design";
import { decideNavigation, isNavLegal, footerPolicy } from "./lib/navigation";
import { auditBrandCoherence } from "./lib/brand-kit";
import { auditDensity, type V17DensityInput } from "./lib/density";

export type V17Section = "hero" | "stats" | "chart" | "search" | "list" | "media" | "detail" | "cta" | "custom";

export interface V17ScreenIntent {
  id: "home" | "detail";
  job: string;
  mode: ProductMode;
  context: ProductContext;
  dominant: string;
  sections: V17Section[];
  structure: "dashboard" | "workspace" | "feed" | "sequence" | "catalog" | "media-detail" | "record-detail" | "thread";
  cardBudget: number;
}

export interface V17DesignPlan {
  version: "1.0.0";
  mode: ProductMode;
  context: ProductContext;
  screens: [V17ScreenIntent, V17ScreenIntent];
  nav: { desktop: string; mobile: string };
  footerAllowed: boolean;
  knowledge: string[];
  fingerprint: string;
}

const V17_MODE_SECTIONS: Record<ProductMode, { home: V17Section[]; detail: V17Section[] }> = {
  browse:   { home: ["hero", "search", "list"], detail: ["media", "detail", "cta", "list"] },
  transact: { home: ["hero", "search", "list"], detail: ["media", "detail", "cta", "list"] },
  track:    { home: ["stats", "chart", "list", "custom"], detail: ["detail", "cta", "list", "custom"] },
  create:   { home: ["stats", "list", "custom"], detail: ["detail", "cta", "list", "custom"] },
  operate:  { home: ["stats", "chart", "list", "custom"], detail: ["detail", "cta", "list", "custom"] },
  learn:    { home: ["stats", "list", "custom"], detail: ["detail", "cta", "list", "custom"] },
  social:   { home: ["stats", "list", "custom"], detail: ["detail", "cta", "list", "custom"] },
};

// V17: All modes allow sidebar + topbar as nav metadata blocks.
const V17_NAV_SECTIONS = new Set(["sidebar", "topbar"]);

/** V17 context-aware structure selection. */
export function v17Structure(mode: ProductMode, role: "home" | "detail", purpose: string, ctx: ProductContext): V17ScreenIntent["structure"] {
  if (role === "detail") {
    if (mode === "browse" || mode === "transact") return /photo|image|gallery|stay|listing|property/i.test(purpose) ? "media-detail" : "record-detail";
    if (mode === "social") return "thread";
    return "record-detail";
  }
  // Home structure differs by context even within the same mode
  if (mode === "browse" || mode === "transact") return "catalog";
  if (mode === "social") return "feed";
  if (mode === "learn") return "sequence";
  if (ctx === "workspace") return "workspace";
  if (ctx === "dashboard") return "dashboard";
  if (ctx === "editor") return "workspace";
  if (mode === "create" || mode === "operate") return "workspace";
  return "dashboard";
}

function v17Dominant(mode: ProductMode, role: "home" | "detail", sections: V17Section[]): string {
  if (role === "detail") return mode === "browse" || mode === "transact" ? (sections.includes("media") ? "media:gallery" : "detail:pane") : "detail:pane";
  if (mode === "browse" || mode === "transact") return "list:cards";
  if (mode === "track" || mode === "operate") return "stats:scoreboard";
  if (mode === "social") return "list:activity";
  if (mode === "learn") return "list:sequence";
  return "stats:scoreboard";
}

/** V17: classify the product context from the brief text. */
export function classifyProductContext(brief: ProductBrief): ProductContext {
  return classifyContext(brief.description + " " + (brief.screenPurposes.map((s) => s.purpose).join(" ")));
}

export function buildV17DesignPlan(brief: ProductBrief, knowledge: string[] = []): V17DesignPlan {
  const mode = brief.mode ?? "track";
  const ctx = classifyProductContext(brief);
  const rules = V17_MODE_SECTIONS[mode];
  const homePurpose = brief.screenPurposes.find((s) => s.id === "home")?.purpose ?? "Primary workflow";
  const detailPurpose = brief.screenPurposes.find((s) => s.id === "detail")?.purpose ?? "Focused workflow";
  const home: V17ScreenIntent = {
    id: "home", mode, context: ctx,
    job: homePurpose,
    sections: rules.home,
    dominant: v17Dominant(mode, "home", rules.home),
    structure: v17Structure(mode, "home", homePurpose, ctx),
    cardBudget: mode === "browse" || mode === "transact" ? 1 : 0,
  };
  const detail: V17ScreenIntent = {
    id: "detail", mode, context: ctx,
    job: detailPurpose,
    sections: rules.detail,
    dominant: v17Dominant(mode, "detail", rules.detail),
    structure: v17Structure(mode, "detail", detailPurpose, ctx),
    cardBudget: 1,
  };
  const navCount = 2;
  const hasSearch = mode === "browse" || mode === "transact";
  const nav = decideNavigation(ctx, mode, navCount, hasSearch, brief.platform as "mobile" | "desktop" | "all");
  return {
    version: "1.0.0", mode, context: ctx,
    screens: [home, detail],
    nav: { desktop: nav.desktop, mobile: nav.mobile },
    footerAllowed: footerPolicy(ctx) !== "never",
    knowledge,
    fingerprint: [mode, ctx, home.structure, home.sections.join(","), detail.structure, detail.sections.join(","), nav.desktop].join("|"),
  };
}

export function enforceV17Plan(brief: ProductBrief, plan: WireframePlan, inventory: ComponentInventory, design = buildV17DesignPlan(brief)) {
  const notes: string[] = [];
  const ctx = classifyProductContext(brief);

  // V17 nav enforcement: wireframe nav that's illegal for this context is
  // corrected. Tabbar on desktop app → sidebar or topbar.
  // Footer → removed (app screens never get footers).
  const screens = design.screens.map((intent) => {
    const source = plan.screens.find((s) => s.id === intent.id) ?? plan.screens[intent.id === "home" ? 0 : 1];
    const correctedNav = isNavLegal(source.nav, ctx, "desktop")
      ? source.nav
      : design.nav.desktop;
    if (correctedNav !== source.nav) {
      notes.push(`v17 corrected ${intent.id} nav from "${source.nav}" to "${correctedNav}" (${ctx} context)`);
    }
    const kept = source.blocks.filter((b) => b.block === "custom" ? Boolean(b.component) : intent.sections.includes(b.block as V17Section) || V17_NAV_SECTIONS.has(b.block));
    const blocks: BlockInstance[] = [];
    for (const section of intent.sections) {
      const found = kept.find((b) => b.block === section);
      if (!found) { if (section !== "custom") notes.push(`v17 omitted unavailable ${section} section on ${intent.id}`); continue; }
      const variant = section === "list" && intent.structure !== "catalog"
        ? intent.structure === "sequence" ? "sequence" : intent.id === "detail" || intent.structure === "feed" || intent.structure === "thread" ? "activity" : "rows"
        : found.variant;
      blocks.push({ ...found, variant });
    }
    for (const block of kept) if (block.block === "custom") blocks.push(block);
    if (blocks.length === 0) {
      const isBrowseOrTransact = design.mode === "browse" || design.mode === "transact";
      blocks.push(isBrowseOrTransact
        ? { block: "hero", variant: "app", emphasis: true }
        : { block: "stats", variant: "scoreboard", emphasis: true });
    }
    const dominant = blocks.find((b) => `${b.block}:${b.variant ?? "default"}` === intent.dominant) ?? blocks[0];
    return {
      id: intent.id,
      archetype: intent.id === "home" && intent.structure === "catalog" ? "catalog" : intent.id === "home" ? "app-dashboard" : "list-detail",
      title: source.title,
      purpose: intent.job,
      nav: correctedNav as WireframePlan["screens"][number]["nav"],
      blocks: blocks.map((b) => ({ ...b, emphasis: b === dominant ? true : undefined })),
    } as WireframePlan["screens"][number];
  });
  // V21: `component` on ANY block is a mount (stats:scoreboard →
  // SprintHealthSummary), not just custom blocks — v20 dropped every
  // component the wireframe hinted behind a non-custom block.
  const mounted = new Set(screens.flatMap((s) => s.blocks.filter((b) => b.component).map((b) => b.component!)));
  // V20: the deterministic composer shell + prompt ALWAYS reference the
  // structural shell and primitives (Topbar/Sidebar/Avatar/Input for the shell,
  // Card/Table/Button/Badge/Select/Separator/Progress as composer primitives).
  // They are never mounted via "custom" blocks, so dropping them here would
  // starve the builder and hard-fail every app run at compose. Keep them and
  // drop only genuinely unused product components.
  const STRUCTURAL_KEEP = new Set([
    "Topbar", "Sidebar", "Button", "Avatar", "Badge", "Input", "Select", "Separator",
    "Card", "Table", "Progress",
  ]);
  const cleanInventory = { ...inventory, components: inventory.components.filter((c) => mounted.has(c.name) || STRUCTURAL_KEEP.has(c.name)) };
  if (cleanInventory.components.length !== inventory.components.length) notes.push("v17 dropped unmounted components");
  return { plan: { version: "1.0.0" as const, screens }, inventory: cleanInventory, design, notes };
}

export function v17ForbiddenShape(brief: ProductBrief, files: Record<string, string>): string[] {
  if (brief.mode === "browse" || brief.mode === "transact") return [];
  const text = Object.entries(files).filter(([p]) => p.includes("screens/")).map(([, c]) => c).join("\n");
  const issues: string[] = [];
  if (/(Add guests|Check-in|Check-out|Verified host|Guest reviews|nightly)/i.test(text)) issues.push("booking vocabulary in a non-transaction product");
  if (brief.mode !== "social" && /Save to wishlist|Guest favourite|Instant book/i.test(text)) issues.push("marketplace affordance in a non-marketplace product");
  return issues;
}

// ── V17 zero-cost review board ────────────────────────────────────────────

export interface V17ReviewIssue {
  file: string;
  severity: "high" | "medium" | "low";
  category: string;
  description: string;
}

/**
 * V17 review board — deterministic checks before model judgment.
 * Adds: product-context gating, navigation legality, density minimums,
 * brand-kit coherence, and marketing-leakage detection.
 */
export function auditV17Review(
  brief: ProductBrief,
  plan: WireframePlan,
  files: Record<string, string>,
  brandKit?: BrandKit | null,
): V17ReviewIssue[] {
  const issues: V17ReviewIssue[] = [];
  const design = buildV17DesignPlan(brief);
  const ctx = classifyProductContext(brief);
  const byId = new Map(plan.screens.map((screen) => [screen.id, screen]));
  const home = byId.get("home");
  const detail = byId.get("detail");

  // 1. Product-context gate
  if (ctx === "marketing" || ctx === "onboarding") {
    const detailScreen = byId.get("detail");
    if (detailScreen && !detailScreen.blocks.some((b) => b.block === "cta" || b.block === "detail")) {
      issues.push({ file: "src/screens/detail.jsx", severity: "medium", category: "v17-context", description: "Marketing/onboarding context — expected a CTA-led detail screen." });
    }
  }

  // 2. Marketing leakage into app screens
  if (ctx !== "marketing" && ctx !== "onboarding") {
    const homeCode = files["src/screens/home.jsx"] ?? "";
    const detailCode = files["src/screens/detail.jsx"] ?? "";
    // Detect marketing hero patterns on app screens
    if (/text-center.*text-4xl.*font-black|mx-auto.*max-w-2xl.*text-center/.test(homeCode)) {
      issues.push({ file: "src/screens/home.jsx", severity: "high", category: "v17-context", description: `Home screen reads as a marketing page; expected ${ctx} app composition.` });
    }
    // Detect footer on app screens
    if (!design.footerAllowed && /footer|col-span-2.*text-xs.*text-muted/.test(homeCode + detailCode)) {
      issues.push({ file: "src/screens/home.jsx", severity: "high", category: "v17-nav", description: "Footer detected on an app screen — footers are illegal in app contexts." });
    }
    // Detect tabbar on desktop app screens
    if (/tabbar|bottom-0.*sticky.*border-t.*pb-\[env/.test(homeCode)) {
      issues.push({ file: "src/screens/home.jsx", severity: "high", category: "v17-nav", description: "Mobile tabbar rendered on a desktop app screen — use sidebar or topbar." });
    }
  }

  // 3. Navigation legality
  for (const screen of plan.screens) {
    const file = `src/screens/${screen.id}.jsx`;
    if (!isNavLegal(screen.nav, ctx, "desktop")) {
      issues.push({ file, severity: "high", category: "v17-nav", description: `${screen.id} nav "${screen.nav}" is illegal for ${ctx} context on desktop.` });
    }
  }

  // 4. Contract integrity
  for (const intent of design.screens) {
    const screen = byId.get(intent.id);
    const file = `src/screens/${intent.id}.jsx`;
    if (!screen) {
      issues.push({ file, severity: "high", category: "v16-contract", description: `Missing required ${intent.id} screen.` });
      continue;
    }
    const emphasis = screen.blocks.filter((block) => block.emphasis).length;
    if (emphasis !== 1) {
      issues.push({ file, severity: "high", category: "v16-contract", description: `${intent.id} must have exactly one dominant moment; found ${emphasis}.` });
    }
    const illegal = screen.blocks.filter((block) => block.block !== "custom" && !intent.sections.includes(block.block as V17Section));
    if (illegal.length > 0) {
      issues.push({ file, severity: "high", category: "v16-contract", description: `${intent.id} contains sections outside its product contract: ${illegal.map((block) => block.block).join(", ")}.` });
    }
  }

  // 5. Fingerprint diversity
  if (home && detail) {
    const homeShape = home.blocks.map((block) => `${block.block}:${block.variant ?? "default"}`).join("|");
    const detailShape = detail.blocks.map((block) => `${block.block}:${block.variant ?? "default"}`).join("|");
    if (homeShape === detailShape) {
      issues.push({ file: "src/screens/detail.jsx", severity: "high", category: "v17-diversity", description: "Home and detail have the same section fingerprint; the product reads as a duplicated template." });
    }
  }

  // 6. Mode vocabulary gate
  const forbidden = v17ForbiddenShape(brief, files);
  for (const description of forbidden) {
    issues.push({ file: "src/screens/home.jsx", severity: "high", category: "v17-mode", description });
  }

  // 7. Detail scoping
  const detailCode = files["src/screens/detail.jsx"] ?? "";
  if (detailCode.includes("DATA.screens.home")) {
    issues.push({ file: "src/screens/detail.jsx", severity: "high", category: "cross-screen-integrity", description: "Detail screen reads the home data view; detail must be scoped to one selected object." });
  }
  if (brief.mode !== "browse" && brief.mode !== "transact" && /DATA\.screens\.home\.rows\.map/.test(detailCode)) {
    issues.push({ file: "src/screens/detail.jsx", severity: "high", category: "v17-mode", description: "Non-catalog detail renders a collection of home rows instead of one focused record." });
  }

  // 8. Density checks
  for (const screen of plan.screens) {
    const code = files[`src/screens/${screen.id}.jsx`] ?? "";
    const densityInput: V17DensityInput = {
      ctx,
      mode: design.mode,
      screenId: screen.id,
      blockTypes: screen.blocks.map((b) => b.block),
      sectionCount: screen.blocks.length,
      listRowCount: (code.match(/\.map\(/g) || []).length,
      metricCount: screen.blocks.filter((b) => b.block === "stats").length > 0 ? 4 : 0,
      customComponentCount: screen.blocks.filter((b) => b.block === "custom").length,
      hasPrimaryCta: /Button.*size="lg"s/.test(code) || /primaryCta/.test(code),
      hasContentColumn: /lg:grid-cols-\[|lg:grid-cols-2|two-column/.test(code),
      hasSupportingContext: screen.blocks.length > 3,
      surfaceTypesUsed: [...new Set(screen.blocks.map((b) => b.block))],
      estimatedContentVp: screen.blocks.length > 4 ? 60 : screen.blocks.length > 2 ? 40 : 20,
    };
    const density = auditDensity(densityInput);
    for (const issue of density.issues) {
      issues.push({ file: `src/screens/${screen.id}.jsx`, severity: "medium", category: "v17-density", description: issue });
    }
  }

  // 9. Brand-kit coherence (when available)
  if (brandKit) {
    for (const screen of plan.screens) {
      const code = files[`src/screens/${screen.id}.jsx`] ?? "";
      const audit = auditBrandCoherence(brandKit, code);
      for (const issue of audit.issues) {
        issues.push({ file: `src/screens/${screen.id}.jsx`, severity: "medium", category: "v17-brand-kit", description: issue });
      }
    }
  }

  return issues;
}

// ── Backward-compat aliases (v16 callers) ──────────────────────────────────

export { buildV17DesignPlan as buildV16DesignPlan };
export { enforceV17Plan as enforceV16Plan };
export { v17ForbiddenShape as v16ForbiddenShape };
export { auditV17Review as auditV16Review };

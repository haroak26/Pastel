import type { ProductContext, ProductMode } from "../schemas";

/**
 * V17 Navigation policy — deterministic nav selection based on product context.
 *
 * V16/V15 left nav as a wireframe-level choice with weak defaults. V17 makes
 * navigation a product-level decision derived from context, destination count,
 * density, and platform — never defaulting to tabbar/footer patterns.
 *
 * Rules:
 * - Desktop app screens NEVER default to tabbar or footer.
 * - Sidebar is the recommended default for dashboards, workspaces, and tools.
 * - Topbar is appropriate for lightweight or single-workflow products.
 * - Tabbar is mobile-only and only when 3-5 peer destinations exist.
 * - Footer navigation is ILLEGAL for app screens.
 * - Marketing pages may use header nav or none.
 */

export type V17NavType =
  | "sidebar"
  | "sidebar+topbar"
  | "topbar"
  | "header-tabs"
  | "contextual-header"
  | "tabbar-mobile"
  | "none";

export interface V17NavDecision {
  desktop: V17NavType;
  mobile: V17NavType;
  rationale: string;
}

/** Recommended navigation for a product context + mode + destination count. */
export function decideNavigation(
  ctx: ProductContext,
  mode: ProductMode,
  screenCount: number,
  hasGlobalSearch: boolean,
  platform: "mobile" | "desktop" | "all",
): V17NavDecision {
  const desktop = desktopNav(ctx, mode, screenCount, hasGlobalSearch);
  const mobile = mobileNav(ctx, mode, screenCount);
  const rationale = buildRationale(ctx, mode, desktop, mobile);

  return {
    desktop: platform === "mobile" ? "none" : desktop,
    mobile: platform === "desktop" ? "none" : mobile,
    rationale,
  };
}

function desktopNav(
  ctx: ProductContext,
  mode: ProductMode,
  screenCount: number,
  hasGlobalSearch: boolean,
): V17NavType {
  if (ctx === "marketing" || ctx === "onboarding") return "none";
  if (ctx === "editor" || mode === "create") return screenCount > 3 ? "topbar" : "contextual-header";
  if (ctx === "dashboard" && screenCount >= 3) return "sidebar";
  if (ctx === "workspace" && screenCount >= 4) return "sidebar+topbar";
  if (ctx === "dashboard") return hasGlobalSearch ? "sidebar+topbar" : "sidebar";
  if (mode === "operate") return "sidebar+topbar";
  if (mode === "social") return screenCount >= 3 ? "topbar" : "header-tabs";
  if (mode === "learn") return screenCount >= 3 ? "sidebar" : "topbar";
  if (mode === "browse" || mode === "transact") return "topbar";
  return screenCount >= 4 ? "sidebar" : "topbar";
}

function mobileNav(
  ctx: ProductContext,
  mode: ProductMode,
  screenCount: number,
): V17NavType {
  if (ctx === "marketing" || ctx === "onboarding") return "none";
  if (screenCount >= 3 && screenCount <= 5) return "tabbar-mobile";
  return "topbar";
}

function buildRationale(
  ctx: ProductContext,
  mode: ProductMode,
  desktop: V17NavType,
  mobile: V17NavType,
): string {
  if (ctx === "marketing" || ctx === "onboarding") return "Marketing/onboarding context uses no persistent shell navigation.";
  if (desktop === "sidebar") return `${mode} product with ${ctx} context: sidebar provides persistent navigation for frequent context switching.`;
  if (desktop === "sidebar+topbar") return `${mode} product: sidebar for primary navigation + topbar for global actions/search.`;
  if (desktop === "topbar") return `Lightweight ${mode} product with ${ctx} context: topbar is sufficient.`;
  return `V17 navigated ${ctx}/${mode} to ${desktop} (desktop) / ${mobile} (mobile).`;
}

/** Checks whether a given nav type is legal for this product context. */
export function isNavLegal(nav: string, ctx: ProductContext, platform: "mobile" | "desktop"): boolean {
  if (ctx === "marketing" || ctx === "onboarding") return nav === "none";

  if (platform === "desktop") {
    // Tabbar / footer is illegal on desktop for app contexts
    if (nav === "tabbar" || nav === "footer") return false;
    return ["sidebar", "sidebar+topbar", "topbar", "header-tabs", "contextual-header"].includes(nav);
  }

  // Mobile
  return ["tabbar", "topbar", "header-tabs", "contextual-header"].includes(nav);
}

/** Translate old wireframe nav strings to v17 types. */
export function normalizeNavLegacy(nav: string): string {
  if (nav === "tabbar") return "tabbar-mobile";
  return nav;
}

/** Recommended footer behavior. */
export function footerPolicy(ctx: ProductContext): "never" | "minimal" | "allowed" {
  if (ctx === "marketing") return "allowed";
  return "never";
}

import type { ProductContext, ProductMode } from "../schemas";

/**
 * V17 Density contract — deterministic content-completeness checks.
 *
 * V16/V15 detected blank sections but not sparse composition. V17 adds:
 * - Minimum module count per screen
 * - Minimum populated rows per list/sequence section
 * - Maximum empty vertical span
 * - Required supporting content around dominant modules
 * - Action completeness (one visible primary action, not inert)
 *
 * Density thresholds are context-aware (a dashboard expects more data than
 * an editor), never product-specific.
 */

export interface V17DensityReport {
  ok: boolean;
  issues: string[];
  metrics: {
    moduleCount: number;
    populatedSections: number;
    emptySections: number;
    listRowsTotal: number;
    metricCount: number;
    estimatedEmptyVpPercent: number;
    uniqueSurfaceTypes: number;
    hasPrimaryAction: boolean;
    hasSecondaryContext: boolean;
  };
}

export interface V17DensityInput {
  ctx: ProductContext;
  mode: ProductMode;
  screenId: string;
  blockTypes: string[];
  sectionCount: number;
  listRowCount: number;
  metricCount: number;
  customComponentCount: number;
  hasPrimaryCta: boolean;
  hasContentColumn: boolean;
  hasSupportingContext: boolean;
  surfaceTypesUsed: string[];
  estimatedContentVp: number; // 0-100 percentage of viewport with real content
}

/** V17 density thresholds per context. */
interface DensityThresholds {
  minModules: number;
  minPopulatedSections: number;
  minListRows: number;
  minMetrics: number;
  minCustomComponents: number;
  maxEmptyGapPercent: number;  // max empty vertical as % of viewport
  minUniqueSurfaces: number;
  requirePrimaryAction: boolean;
  requireSupportingContext: boolean;
  minContentFillPercent: number; // minimum content fill % of viewport
}

function thresholdsFor(ctx: ProductContext): DensityThresholds {
  switch (ctx) {
    case "dashboard":
      return { minModules: 4, minPopulatedSections: 3, minListRows: 4, minMetrics: 3, minCustomComponents: 1, maxEmptyGapPercent: 20, minUniqueSurfaces: 2, requirePrimaryAction: true, requireSupportingContext: true, minContentFillPercent: 50 };
    case "workspace":
      return { minModules: 3, minPopulatedSections: 3, minListRows: 4, minMetrics: 2, minCustomComponents: 1, maxEmptyGapPercent: 20, minUniqueSurfaces: 2, requirePrimaryAction: true, requireSupportingContext: true, minContentFillPercent: 50 };
    case "feed":
      return { minModules: 3, minPopulatedSections: 2, minListRows: 4, minMetrics: 1, minCustomComponents: 1, maxEmptyGapPercent: 15, minUniqueSurfaces: 2, requirePrimaryAction: true, requireSupportingContext: true, minContentFillPercent: 55 };
    case "editor":
      return { minModules: 2, minPopulatedSections: 2, minListRows: 2, minMetrics: 1, minCustomComponents: 0, maxEmptyGapPercent: 25, minUniqueSurfaces: 1, requirePrimaryAction: false, requireSupportingContext: true, minContentFillPercent: 40 };
    case "catalog":
      return { minModules: 3, minPopulatedSections: 2, minListRows: 6, minMetrics: 0, minCustomComponents: 1, maxEmptyGapPercent: 15, minUniqueSurfaces: 2, requirePrimaryAction: false, requireSupportingContext: false, minContentFillPercent: 55 };
    case "app":
      return { minModules: 3, minPopulatedSections: 3, minListRows: 3, minMetrics: 2, minCustomComponents: 1, maxEmptyGapPercent: 20, minUniqueSurfaces: 2, requirePrimaryAction: true, requireSupportingContext: true, minContentFillPercent: 50 };
    case "marketing":
      return { minModules: 3, minPopulatedSections: 3, minListRows: 3, minMetrics: 1, minCustomComponents: 1, maxEmptyGapPercent: 25, minUniqueSurfaces: 2, requirePrimaryAction: true, requireSupportingContext: false, minContentFillPercent: 45 };
    case "onboarding":
      return { minModules: 2, minPopulatedSections: 2, minListRows: 1, minMetrics: 0, minCustomComponents: 0, maxEmptyGapPercent: 30, minUniqueSurfaces: 1, requirePrimaryAction: true, requireSupportingContext: false, minContentFillPercent: 35 };
  }
}

export function auditDensity(input: V17DensityInput): V17DensityReport {
  const t = thresholdsFor(input.ctx);
  const issues: string[] = [];
  const metrics: V17DensityReport["metrics"] = {
    moduleCount: input.sectionCount,
    populatedSections: input.sectionCount - (input.blockTypes.filter((b) => !b).length),
    emptySections: 0,
    listRowsTotal: input.listRowCount,
    metricCount: input.metricCount,
    estimatedEmptyVpPercent: Math.max(0, 100 - input.estimatedContentVp),
    uniqueSurfaceTypes: input.surfaceTypesUsed.length,
    hasPrimaryAction: input.hasPrimaryCta,
    hasSecondaryContext: input.hasSupportingContext,
  };

  if (input.sectionCount < t.minModules) {
    issues.push(`${input.screenId}: ${input.sectionCount} modules (min ${t.minModules} for ${input.ctx})`);
  }

  if (input.listRowCount < t.minListRows && input.blockTypes.some((b) => b === "list")) {
    issues.push(`${input.screenId}: ${input.listRowCount} list rows (min ${t.minListRows})`);
  }

  if (input.metricCount < t.minMetrics && input.blockTypes.some((b) => b === "stats")) {
    issues.push(`${input.screenId}: ${input.metricCount} metrics (min ${t.minMetrics})`);
  }

  if (input.customComponentCount < t.minCustomComponents && input.ctx !== "marketing" && input.ctx !== "onboarding") {
    issues.push(`${input.screenId}: ${input.customComponentCount} custom components (min ${t.minCustomComponents})`);
  }

  const emptyPercent = Math.max(0, 100 - input.estimatedContentVp);
  if (emptyPercent > t.maxEmptyGapPercent) {
    issues.push(`${input.screenId}: ~${emptyPercent}% empty viewport (max ${t.maxEmptyGapPercent}% for ${input.ctx})`);
  }

  if (t.requirePrimaryAction && !input.hasPrimaryCta) {
    issues.push(`${input.screenId}: missing primary action`);
  }

  if (t.requireSupportingContext && !input.hasSupportingContext) {
    issues.push(`${input.screenId}: missing supporting context (secondary column, insight, or activity)`);
  }

  if (input.surfaceTypesUsed.length < t.minUniqueSurfaces) {
    issues.push(`${input.screenId}: ${input.surfaceTypesUsed.length} surface types used (min ${t.minUniqueSurfaces} — screens should vary surface treatments)`);
  }

  if (input.estimatedContentVp < t.minContentFillPercent) {
    issues.push(`${input.screenId}: ~${input.estimatedContentVp}% content fill (min ${t.minContentFillPercent}%)`);
  }

  return { ok: issues.length === 0, issues, metrics };
}

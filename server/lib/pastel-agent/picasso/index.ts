// Picasso V2 — Barrel Export
// All public modules for the 8-stage design generation pipeline.

export { runPicassoPipeline } from "./pipeline/orchestrator";
export type { PicassoRunConfig } from "./pipeline/orchestrator";

// Knowledge base
export {
  loadMegadesign,
  loadCompanyDoc,
  listCompanySlugs,
  getCompanyTagline,
  getCompanyWithTaglines,
  loadFullCompanyContext,
  loadDesignLaw,
  loadComponentLaw,
  loadProductMode,
  loadAllDesignLaws,
  loadAllComponentLaws,
  loadAllProductModes,
  loadCompanyDeepDive,
  listCompanyDeepDiveSlugs,
  getKnowledgeStats,
} from "./pipeline/knowledge";

// Anti-slop
export {
  detectSlopViolations,
  filterBlockingViolations,
  hasBlockingViolations,
  antiSlopSystemPrompt,
  detectProductContext,
  contextCompositionRules,
  FORBIDDEN_DISPLAY_FONTS,
  FORBIDDEN_ACCENT_COLORS,
  AI_SLOP_PHRASES,
} from "./pipeline/anti-slop";
export type { SlopViolation, ProductContext } from "./pipeline/anti-slop";

// Rubric
export {
  RUBRIC_DIMENSIONS_V2,
  BLOCKING_DEFECTS,
  computeWeightedScore,
  scorePassesV2,
  findBlockingDefects,
  buildCritiqueResultV2,
  critiqueSystemPrompt,
} from "./pipeline/rubric";
export type { RubricDimensionV2, BlockingDefect } from "./pipeline/rubric";

// Types
export { NICHE_COMPANY_MAP } from "./pipeline/types";
export type {
  Brief,
  CreativeDirection,
  Tokens,
  LayoutPlan,
  ScreenPlan,
  ScreenRegion,
  ComponentSlot,
  ComponentsManifest,
  ComponentManifestEntry,
  CritiqueResult,
  RubricScores,
  RubricDimension,
  PicassoPhase,
  PicassoEvent,
  PicassoRunState,
  Niche,
} from "./pipeline/types";

// Pipeline stages (for programmatic use)
export { runDiscovery } from "./pipeline/stage-1-discovery";
export type { DiscoveryInput, DiscoveryOutput } from "./pipeline/stage-1-discovery";

export {
  generateEnhancedTokens,
  generateTokens,
  generateTokensCSS,
  generateTailwindConfig,
  generateCreativeDirections,
  validateTokens,
} from "./pipeline/stage-2-design-system";
export type {
  EnhancedTokensInput,
  Stage2CreativeDirection,
  TokenValidationResult,
} from "./pipeline/stage-2-design-system";

export {
  runArchitecture,
  planLayout,
  buildComponentManifest,
  generateBrandKit,
  generateUXDesignPlan,
} from "./pipeline/stage-3-architecture";
export type {
  BrandKit,
  UXDesignPlan,
  ArchitectureOutput,
} from "./pipeline/stage-3-architecture";

export {
  runContentGeneration,
  generateMockData,
  generateCopyPlan,
} from "./pipeline/stage-4-content";
export type {
  MockDataset,
  CopyPlan,
  ContentOutput,
} from "./pipeline/stage-4-content";

export {
  generateAllComponents,
  generateCatalogPage,
  composeScreens,
} from "./pipeline/stage-5-components";

export {
  composeAllScreens,
  composeScreenWithRetry,
  lintScreen,
  autoFixViolations,
} from "./pipeline/stage-6-screens";
export type { LintResult } from "./pipeline/stage-6-screens";

export {
  runVisualQA,
  renderAllScreens,
  scoreScreenshot,
} from "./pipeline/stage-7-visual-qa";
export type { VisualQAInput, VisualQAOutput } from "./pipeline/stage-7-visual-qa";

export {
  finalize,
  generateSummaryReport,
  exportDesignSystem,
  exportComponents,
  exportScreens,
} from "./pipeline/stage-8-finalize";
export type { FinalizeInputV2, FinalizeReportV2 } from "./pipeline/stage-8-finalize";

// Checks
export { reviewScreen } from "./pipeline/checks/visual-review-agent";
export type { VisualReviewInput, VisualReviewOutput } from "./pipeline/checks/visual-review-agent";
export {
  analyzeScreenshotQuality,
  validateScreenshotSet,
  createPlaceholderScreenshot,
} from "./pipeline/checks/render-quality";
export type { RenderQualityResult } from "./pipeline/checks/render-quality";

// Sandbox rendering
export { renderScreen, renderScreens } from "./pipeline/lib/sandbox-render";
export type { SandboxRenderOptions, SandboxRenderResult } from "./pipeline/lib/sandbox-render";

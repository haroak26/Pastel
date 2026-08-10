// Picasso V6 — Barrel Export
// shadcn-grounded design generation pipeline.

export { runPicassoPipeline } from "./pipeline/orchestrator";
export type { PicassoRunConfig, PicassoPipelineOutput, PicassoHooks } from "./pipeline/orchestrator";

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
  runFullAntiSlopGate,
  FORBIDDEN_DISPLAY_FONTS,
  FORBIDDEN_ACCENT_COLORS,
  AI_SLOP_PHRASES,
} from "./pipeline/anti-slop";
export type { SlopViolation, ProductContext, AntiSlopGateResult } from "./pipeline/anti-slop";

// Types
export { NICHE_COMPANY_MAP, briefSchema, tokensSchema } from "./pipeline/types";
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
  PropContract,
  Niche,
} from "./pipeline/types";

// Stage 1 — discovery
export { runDiscovery } from "./pipeline/stage-1-discovery";
export type { DiscoveryInput, DiscoveryOutput } from "./pipeline/stage-1-discovery";

// Stage 2 — design system
export {
  generateDirectionsWithRetry,
  validateDivergence,
  selectBestDirection,
  generateEnhancedTokens,
  generateTokensCSS,
  generateTailwindConfig,
  generateMotionSpec,
  generateMotionCSS,
  validateTokens,
} from "./pipeline/stage-2-design-system";
export type {
  Stage2Direction,
  DirectionsInput,
  EnhancedTokensInput,
  MotionSpec,
} from "./pipeline/stage-2-design-system";

// Stage 3 — wireframe
export { runArchitecture, buildPropContract } from "./pipeline/stage-3-wireframe";
export type { BrandKit, UXDesignPlan, ArchitectureOutput } from "./pipeline/stage-3-wireframe";

// Stage 4 — build
export { runContentGeneration, generateAllComponents, generateComponent, supportFiles } from "./pipeline/stage-4-build";
export type { ContentOutput, MockDataset, CopyPlan } from "./pipeline/stage-4-build";

// Stage 5 — assemble
export { composeAllScreens, composeScreenWithRetry } from "./pipeline/stage-5-assemble";

// Stage 6 — verify
export { runSmokeTest, runAntiSlopLintGate } from "./pipeline/stage-6-verify";

// Stage 7 — visual QA
export { runVisualQA } from "./pipeline/stage-7-visual-qa";
export type { VisualQAInput, VisualQAOutput } from "./pipeline/stage-7-visual-qa";

// Stage 8 — finalize
export { finalize, generateSummaryReport } from "./pipeline/stage-8-finalize";
export type { FinalizeInputV2, FinalizeReportV2 } from "./pipeline/stage-8-finalize";

// Checks
export { reviewScreen } from "./pipeline/checks/visual-review-agent";
export type { VisualReviewInput, VisualReviewOutput } from "./pipeline/checks/visual-review-agent";
export { analyzeScreenshotQuality, validateScreenshotSet } from "./pipeline/checks/render-quality";

// Base components (vendored shadcn sources)
export {
  baseComponentNames,
  loadBaseComponent,
  rewriteBaseImports,
  generateGlobalsCSS,
  tokenSnapshot,
  deriveSlots,
} from "./pipeline/lib/base-components";
export type { BaseComponentInfo, ThemeSlots } from "./pipeline/lib/base-components";

// Sandbox rendering (E2B)
export {
  renderScreen,
  renderScreens,
  getWarmSandbox,
  clearWarmSandbox,
  e2bConfigured,
} from "./pipeline/lib/sandbox-render";
export type { SandboxRenderOptions, SandboxRenderResult } from "./pipeline/lib/sandbox-render";

// Preview tooling
export { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "./pipeline/lib/preview";

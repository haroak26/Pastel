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

// V8 — reliability + fidelity + gates
export { closeDependencyGraph, scanSiblingImports, checkSimilarityFloor, TAXONOMY_SIMILARITY_FLOORS } from "./pipeline/stage-4-build";
export type { FidelityVerdict, GenerateAllResult, DependencyClosureResult } from "./pipeline/stage-4-build";
export { composeScreenV8 } from "./pipeline/stage-5-assemble";
export type { ComposedScreenV8 } from "./pipeline/stage-5-assemble";
export { auditScreenProps, applyPropAutoFix } from "./pipeline/lib/prop-validation";
export type { PropViolation, ScreenPropAudit } from "./pipeline/lib/prop-validation";
export { classifySurfacePolicy, enforceNeutralSurfaces, assertNeutralCanvas, surfacePolicyPrompt } from "./pipeline/lib/surface-policy";
export type { SurfacePolicy, NeutralCanvasGateResult } from "./pipeline/lib/surface-policy";
export { auditGlobalsCSS } from "./pipeline/lib/base-components";
export type { GlobalsAuditResult } from "./pipeline/lib/base-components";
export { runCompositionGate, auditScreenComposition, auditEmptySections } from "./pipeline/checks/composition";
export type { CompositionGateResult, CompositionViolation } from "./pipeline/checks/composition";
export { runGeometryGate, auditScreenGeometry } from "./pipeline/checks/geometry";
export type { GeometryGateResult, GeometryViolation } from "./pipeline/checks/geometry";
export { buildWireframeReview } from "./pipeline/lib/wireframe-review";
export type { WireframeReviewPayload, WireframeDecision } from "./pipeline/lib/wireframe-review";
export { loadResumableArtifacts } from "./pipeline/lib/resume";
export type { ResumeLoaders, ResumedArtifacts } from "./pipeline/lib/resume";

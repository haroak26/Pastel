import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Brief,
  Tokens,
  LayoutPlan,
  ComponentsManifest,
  CritiqueResult,
  PropContract,
} from "./types";
import type { ProductContext } from "./anti-slop";
import { runDiscovery, type DiscoveryOutput } from "./stage-1-discovery";
import {
  generateDirectionsWithRetry,
  validateDivergence,
  selectBestDirection,
  generateEnhancedTokens,
  generateTokensCSS,
  generateMotionSpec,
  generateTailwindConfig,
  type Stage2Direction,
  type MotionSpec,
} from "./stage-2-design-system";
import { runArchitecture, buildPropContract, type ArchitectureOutput } from "./stage-3-wireframe";
import { runContentGeneration, generateAllComponents, supportFiles, closeDependencyGraph, type ContentOutput, type FidelityVerdict } from "./stage-4-build";
import { composeScreenV8 } from "./stage-5-assemble";
import type { PropViolation } from "./lib/prop-validation";
import { runSmokeTest, runAntiSlopLintGate } from "./stage-6-verify";
import { runFullAntiSlopGate } from "./anti-slop";
import { reviewScreen } from "./checks/visual-review-agent";
import { finalize, type FinalizeReportV2 } from "./stage-8-finalize";
import { loadMegadesign, loadCompanyDoc } from "./knowledge";
import { auditGlobalsCSS, loadBaseComponent, type GlobalsAuditResult } from "./lib/base-components";
import { classifySurfacePolicy, enforceNeutralSurfaces, assertNeutralCanvas, surfacePolicyPrompt, type SurfacePolicy, type NeutralCanvasGateResult } from "./lib/surface-policy";
import { RunStats, writeCheckpoint } from "./lib/run-stats";
import { loadResumableArtifacts, type ResumeLoaders, type ResumedArtifacts } from "./lib/resume";
import { buildWireframeReview, wireframeReviewSignature, type WireframeReviewPayload, type WireframeDecision } from "./lib/wireframe-review";
import { runCompositionGate, type CompositionGateResult } from "./checks/composition";
import { runGeometryGate, type GeometryGateResult } from "./checks/geometry";
import { compileStylesForRun, bundleScreenForPreview, buildPreviewHtml } from "./lib/preview";
import { renderScreen, getWarmSandbox } from "./lib/sandbox-render";
import pLimit from "p-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PicassoHooks {
  /** Activity / phase / wireframe-review / screens events. */
  emit(type: "activity" | "phase" | "doc" | "file" | "screens" | "wireframes" | "done", payload: Record<string, unknown>): void;
  /** Persist a JSON/string document (planning docs). */
  persistDoc(path: string, title: string, kind: string, content: string): Promise<void> | void;
  /** Persist a generated code/style file. */
  persistFile(path: string, kind: string, content: string): Promise<void> | void;
}

export interface PicassoConcurrency {
  /** Concurrent component-build model calls (cheap tier — latency is the constraint). */
  componentBuild?: number;
  /** Concurrent per-screen pipelines (compose → smoke → render → QA). */
  screens?: number;
  /** Concurrent E2B renders — one sandbox runs one browser at a time, so 1. */
  render?: number;
}

export interface PicassoRunConfig {
  projectId: string;
  mode?: "draft" | "harden";
  maxScreens?: number;
  hooks: PicassoHooks;
  /** V8 §4.3: resume loaders — skips stages whose artifacts already exist. */
  resume?: ResumeLoaders;
  /** V8 §4.4: hard wireframe confirmation gate. Absent → auto-approve
   *  (tests/harness); production always provides a real callback. */
  confirmWireframes?: (payload: WireframeReviewPayload) => Promise<WireframeDecision>;
  /** V8 §4.2: per-stage concurrency caps. */
  concurrency?: PicassoConcurrency;
  /** V8 §4.3: invoked after each stage completes with the current stats —
   *  hosts use it to persist partial summaries on kill. */
  onCheckpoint?: (stats: ReturnType<RunStats["toJSON"]>) => void;
}

export interface PicassoPipelineOutput {
  success: boolean;
  report: string;
  exportPath: string;
  tokens: Tokens;
  globalsCSS: string;
  layoutPlan: LayoutPlan;
  componentsManifest: ComponentsManifest;
  propContract: PropContract;
  generatedComponents: Record<string, string>;
  supportFiles: Record<string, string>;
  screenFiles: Record<string, string>;
  critiqueResults: CritiqueResult[];
  averageScore: number;
  passedAll: boolean;
  antiSlopPassed: boolean;
  smokeFailures: string[];
  discovery: DiscoveryOutput;
  architecture: ArchitectureOutput;
  content: ContentOutput | null;
  motionSpec: MotionSpec;
  directions: Stage2Direction[];
  finalReport: FinalizeReportV2 | null;
  /** V7: stages that degraded instead of aborting, with reasons. Surfaced in
   *  the final report so a degraded run is never mistaken for a clean one. */
  degradations: Array<{ stage: string; reason: string }>;
  // ── V8 additions ───────────────────────────────────────────────────────
  /** True when the run was cancelled at the wireframe gate (no build spend). */
  cancelled?: boolean;
  /** Hard-rendered screenshots (harden mode; the pipeline owns rendering). */
  screenshots: Record<string, Buffer>;
  /** Per-screen render failures (bundle failures, sandbox errors). */
  renderErrors: string[];
  /** Runtime diagnostics (error boundary / pageerror / console) per screen. */
  renderDiagnostics: Record<string, string[]>;
  /** Prop-contract violations that survived composition retries. */
  propViolations: Record<string, PropViolation[]>;
  /** Mounts auto-fixed deterministically before persisting. */
  autoFixedMounts: Record<string, string[]>;
  /** Taxonomy-fidelity verdicts per generated component (§2/§5.4). */
  fidelityReport: FidelityVerdict[];
  /** Sibling bases provisioned by dependency closure (§5.1). */
  provisioned: string[];
  /** Per-stage wall time (§8). */
  timing: { wallSeconds: number; stages: Record<string, number> };
  /** §6: neutral-canvas gate result. */
  themeGate: NeutralCanvasGateResult;
  /** §5.3: token-CSS completeness audit. */
  globalsAudit: GlobalsAuditResult;
  /** §7: duplicate-mount / empty-section gate. */
  compositionGate: CompositionGateResult;
  /** §7: geometry gate (advisory). */
  geometryGate: GeometryGateResult;
  /** §6: surface policy applied to the run. */
  surfacePolicy: SurfacePolicy;
  /** The last wireframe review payload shown to the user (§4.4). */
  wireframeReview?: WireframeReviewPayload;
}

export interface StageDegradation {
  stage: string;
  reason: string;
}

// ── Deterministic fallbacks for degraded runs ────────────────────────────
// A degraded run still returns a structurally valid output so callers (the
// production run path and the E2E harness) always get something they can
// persist and reason about. These fallbacks are ONLY used after a stage
// already failed — they are never passed off as real design work.

function fallbackTokens(brief: Brief): Tokens {
  const neutral = {
    "0": "#ffffff", "50": "#fafafa", "100": "#f5f5f5", "200": "#e5e5e5", "300": "#d4d4d4",
    "400": "#a3a3a3", "500": "#737373", "600": "#525252", "700": "#404040", "800": "#262626",
    "900": "#171717", "950": "#0a0a0a",
  } as const;
  const accent = {
    "50": "#f0fdfa", "100": "#ccfbf1", "200": "#99f6e4", "300": "#5eead4", "400": "#2dd4bf",
    "500": "#14b8a6", "600": "#0d9488", "700": "#0f766e", "800": "#115e59", "900": "#134e4a",
  } as const;
  const semantic = (s: string) => ({ "50": s, "500": s, "900": s });

  return {
    meta: {
      brand: brief.productName,
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      seed: "degraded-fallback",
      character: "swift",
      mode: brief.mode,
    },
    color: {
      neutral,
      accent,
      semantic: {
        success: semantic("#16a34a"),
        warning: semantic("#d97706"),
        danger: semantic("#dc2626"),
        info: semantic("#0ea5e9"),
      },
      surface: { background: "#ffffff", raised: "#ffffff", overlay: "#ffffff" },
      text: { primary: "#171717", secondary: "#525252", muted: "#a3a3a3", inverse: "#ffffff" },
      border: { default: "#e5e5e5", subtle: "#f5f5f5", focus: "#0d9488" },
    },
    typography: {
      fontFamily: { display: "Manrope", body: "DM Sans", mono: "IBM Plex Mono" },
      scale: { xs: "12px", sm: "14px", base: "16px", lg: "18px", xl: "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px", "5xl": "48px" },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    },
    space: {
      "0": "0px", "2": "2px", "4": "4px", "6": "6px", "8": "8px", "12": "12px", "16": "16px",
      "24": "24px", "32": "32px", "40": "40px", "48": "48px", "64": "64px", "80": "80px",
      "96": "96px", "128": "128px", "160": "160px",
    },
    radius: { none: "0px", sm: "4px", md: "6px", lg: "8px", xl: "12px", full: "9999px" },
    shadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    },
    motion: {
      duration: { fast: "120ms", base: "200ms", slow: "300ms" },
      easing: { standard: "cubic-bezier(0.4, 0, 0.2, 1)" },
      character: "swift",
    },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
  };
}

function emptyArchitecture(brief: Brief): ArchitectureOutput {
  return {
    layoutPlan: { screens: [], globalRegions: [], breakpoints: {} },
    componentsManifest: { entries: [], generatedAt: new Date().toISOString() },
    brandKit: {
      colorRules: { accentUsage: "", semanticUsage: "", neutralUsage: "", forbiddenPatterns: [] },
      typographyRules: { displayUsage: "", bodyUsage: "", monoUsage: "", weightRules: "", sizeRules: "" },
      spacingRules: { sectionMargins: "", componentPadding: "", rhythmDescription: "" },
      motionRules: { transitions: "", easing: "", duration: "" },
      signatureMoves: [],
      antiPatterns: [],
      generatedAt: new Date().toISOString(),
    },
    uxDesignPlan: {
      navigationStrategy: "",
      surfaceRhythm: "",
      interactionPatterns: "",
      densityStrategy: "",
      primaryActionPerScreen: {},
      generatedAt: new Date().toISOString(),
    },
    componentInventory: [],
  };
}

const FALLBACK_MOTION_SPEC: MotionSpec = {
  character: "swift",
  durations: { fast: "120ms", base: "200ms", slow: "300ms" },
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  interactionRules: {
    hover: { enabled: true, duration: "120ms" },
    focus: { enabled: true, ring: "#0d9488" },
    enter: { enabled: true, style: "fade" },
    press: { enabled: true, translate: "translate-y-px" },
  },
};

const EMPTY_DISCOVERY: DiscoveryOutput = {
  productContext: "unknown",
  contextDescription: "Run degraded before discovery completed.",
  selectedReferences: [],
  creativeSeed: "degraded-fallback",
};

const DEFAULT_CONCURRENCY: Required<PicassoConcurrency> = {
  componentBuild: 6,
  screens: 4,
  render: 1,
};

/** Max revision round-trips at the wireframe gate before auto-approving. */
const MAX_WIREFRAME_REVISIONS = 2;

/**
 * Picasso V8 pipeline core. Wired to the UI via `startPicassoAgentLoop`
 * (run.ts) or driven directly by tests with custom hooks.
 *
 * V7 contract preserved: every model-calling stage degrades instead of
 * throwing past the pipeline boundary; a degraded run returns
 * `success: false` with whatever partial artifacts exist.
 *
 * V8 changes:
 * - Per-screen pipelines: each screen moves through compose → smoke →
 *   render → visual-QA concurrently (capped), instead of the sequential
 *   compose-all → smoke-all → QA-all shape.
 * - Hard wireframe confirmation gate between architecture and any build
 *   work (§4.4) — nothing is spent past it until the user approves.
 * - Checkpoint/resume: stage artifacts persist as they complete; a resumed
 *   run skips completed stages (§4.3).
 * - Dependency closure, prop-contract validation, taxonomy-fidelity floors,
 *   neutral-canvas enforcement, and the deterministic composition gates.
 */
export async function runPicassoPipeline(brief: Brief, config: PicassoRunConfig): Promise<PicassoPipelineOutput> {
  const { projectId, mode = "harden", hooks } = config;
  const maxScreens = config.maxScreens ?? 3;
  const concurrency = {
    ...DEFAULT_CONCURRENCY,
    ...(config.concurrency ?? {}),
    componentBuild: Number(process.env.PASTEL_PICASSO_COMPONENT_CONCURRENCY) || config.concurrency?.componentBuild || DEFAULT_CONCURRENCY.componentBuild,
    screens: Number(process.env.PASTEL_PICASSO_SCREEN_CONCURRENCY) || config.concurrency?.screens || DEFAULT_CONCURRENCY.screens,
  };
  const emit = hooks.emit;
  const stats = new RunStats();

  const degradations: StageDegradation[] = [];
  const failReason = (err: unknown): string => (err instanceof Error ? err.message : String(err));

  const checkpoint = async (): Promise<void> => {
    await writeCheckpoint(hooks, stats);
    config.onCheckpoint?.(stats.toJSON());
  };

  /** Build a degraded-but-valid output for a failed stage. Never throws. */
  const degrade = (
    stage: string,
    reason: string,
    partial: Partial<PicassoPipelineOutput>,
  ): PicassoPipelineOutput => {
    degradations.push({ stage, reason });
    stats.mark(stage, "degraded");
    emit("activity", { message: `${stage} stage failed — run degraded (${reason})` });
    // Persist evidence even when the run cannot reach finalize, so a
    // reviewer always has a doc saying which stage degraded and why.
    try {
      hooks.persistDoc(
        "docs/review/Degradations.json",
        "Stage Degradations",
        "degradation",
        JSON.stringify({ brief: brief.productName, generatedAt: new Date().toISOString(), degradations }, null, 2),
      );
    } catch { /* persistence must never mask the degradation */ }
    void checkpoint();
    return {
      success: false,
      report: "",
      exportPath: "",
      tokens: partial.tokens ?? fallbackTokens(brief),
      globalsCSS: partial.globalsCSS ?? "",
      layoutPlan: partial.layoutPlan ?? { screens: [], globalRegions: [], breakpoints: {} },
      componentsManifest: partial.componentsManifest ?? { entries: [], generatedAt: new Date().toISOString() },
      propContract: partial.propContract ?? { entries: [], generatedAt: new Date().toISOString() },
      generatedComponents: partial.generatedComponents ?? {},
      supportFiles: partial.supportFiles ?? {},
      screenFiles: partial.screenFiles ?? {},
      critiqueResults: partial.critiqueResults ?? [],
      averageScore: partial.averageScore ?? 0,
      passedAll: false,
      antiSlopPassed: partial.antiSlopPassed ?? false,
      smokeFailures: partial.smokeFailures ?? [stage],
      discovery: partial.discovery ?? EMPTY_DISCOVERY,
      architecture: partial.architecture ?? emptyArchitecture(brief),
      content: partial.content ?? null,
      motionSpec: partial.motionSpec ?? FALLBACK_MOTION_SPEC,
      directions: partial.directions ?? [],
      finalReport: partial.finalReport ?? null,
      degradations,
      cancelled: partial.cancelled,
      screenshots: partial.screenshots ?? {},
      renderErrors: partial.renderErrors ?? [],
      renderDiagnostics: partial.renderDiagnostics ?? {},
      propViolations: partial.propViolations ?? {},
      autoFixedMounts: partial.autoFixedMounts ?? {},
      fidelityReport: partial.fidelityReport ?? [],
      provisioned: partial.provisioned ?? [],
      timing: partial.timing ?? { wallSeconds: Math.round(stats.wallMs / 1000), stages: stats.wallTimeByStage() },
      themeGate: partial.themeGate ?? { passed: false, policy: "neutral", violations: [reason] },
      globalsAudit: partial.globalsAudit ?? { passed: false, missing: [], present: [] },
      compositionGate: partial.compositionGate ?? { passed: true, violations: [] },
      geometryGate: partial.geometryGate ?? { passed: true, violations: [] },
      surfacePolicy: partial.surfacePolicy ?? "neutral",
      wireframeReview: partial.wireframeReview,
    };
  };

  // ── Resume: load any persisted stage artifacts up front ────────────────
  let resumed: ResumedArtifacts | null = null;
  if (config.resume) {
    try {
      resumed = await loadResumableArtifacts(config.resume);
      if (resumed?.discovery || resumed?.tokens || resumed?.architecture) {
        emit("activity", { message: `Resuming run — loading persisted stage artifacts (discovery: ${!!resumed.discovery}, design: ${!!resumed.tokens}, wireframe: ${!!resumed.architecture}, components: ${Object.keys(resumed.components ?? {}).length}, screens: ${Object.keys(resumed.screens ?? {}).length})` });
      }
    } catch (err) {
      emit("activity", { message: `Resume load failed (${failReason(err)}) — starting fresh` });
      resumed = null;
    }
  }

  emit("phase", { phase: "discovery", status: "running" });

  // ══ STAGE 1: DISCOVERY ══
  stats.start("discovery");
  let discovery: DiscoveryOutput;
  if (resumed?.discovery) {
    discovery = resumed.discovery;
    stats.mark("discovery", "skipped");
  } else {
    try {
      discovery = await runDiscovery({ brief });
    } catch (err) {
      return degrade("discovery", failReason(err), {});
    }
    stats.end("discovery");
  }
  emit("activity", { message: `${brief.productName} — ${discovery.productContext} context · seed: ${discovery.creativeSeed}` });
  await hooks.persistDoc("docs/brief/Brief.json", "Product Brief", "brief", JSON.stringify(brief, null, 2));
  await hooks.persistDoc("docs/planning/Discovery.json", "Discovery", "discovery", JSON.stringify(discovery, null, 2));
  emit("phase", { phase: "discovery", status: "done" });
  emit("phase", { phase: "brief", status: "running" });
  emit("phase", { phase: "brief", status: "done" });
  await checkpoint();

  // ══ STAGE 2: DIRECTIONS + TOKENS + MOTION ══
  emit("phase", { phase: "design", status: "running" });
  stats.start("design");
  let directions: Stage2Direction[];
  let tokens: Tokens;
  let globalsCSS = "";
  let motionSpec = FALLBACK_MOTION_SPEC;
  const surfacePolicy: SurfacePolicy = classifySurfacePolicy(
    discovery.productContext as ProductContext,
    brief.description,
    discovery.contextDescription,
  );

  if (resumed?.tokens) {
    tokens = enforceNeutralSurfaces(resumed.tokens, surfacePolicy);
    globalsCSS = resumed.globalsCSS ?? generateTokensCSS(tokens);
    motionSpec = resumed.motionSpec ?? FALLBACK_MOTION_SPEC;
    directions = resumed.directions ?? [];
    stats.mark("design", "skipped");
  } else {
    try {
      const megadesignContent = loadMegadesign();
      const companyContents: Record<string, string> = {};
      for (const ref of discovery.selectedReferences) {
        try { companyContents[ref.slug] = loadCompanyDoc(ref.slug); } catch { /* skip */ }
      }

      directions = await generateDirectionsWithRetry({
        brief,
        references: discovery.selectedReferences,
        megadesignContent,
        companyContents,
        creativeSeed: discovery.creativeSeed,
      });
      const divergence = validateDivergence(directions);
      const selection = selectBestDirection(directions, brief);
      const chosen = selection.chosen;
      emit("activity", { message: `Direction: "${chosen.name}" — ${selection.rationale} (divergence ${divergence.divergenceScore}/6)` });
      await hooks.persistDoc("docs/design/CreativeDirections.json", "Creative Directions", "creative-directions", JSON.stringify({
        allDirections: directions,
        chosen,
        chosenIndex: selection.chosenIndex,
        rationale: selection.rationale,
        divergenceResult: divergence,
      }, null, 2));

      const direction = {
        name: chosen.name,
        summary: chosen.summary,
        influences: discovery.selectedReferences.map((r) => r.name),
        paletteDirection: `${chosen.accentColor} — ${chosen.surfaces}`,
        densityFit: chosen.spacing === "airy" ? "low" as const : chosen.spacing === "dense" ? "high" as const : "medium" as const,
      };

      tokens = await generateEnhancedTokens({
        brief,
        direction,
        stage2Directions: directions,
        megadesignContent,
        companyContents,
        contextDescription: discovery.contextDescription,
        creativeSeed: discovery.creativeSeed,
        surfacePolicy,
      });
      globalsCSS = generateTokensCSS(tokens);
      motionSpec = generateMotionSpec(direction, brief, tokens);
      const tailwindConfig = generateTailwindConfig();

      emit("activity", { message: `Design system: ${tokens.meta.brand} · accent ${tokens.color.accent["500"]} · ${tokens.typography.fontFamily.display} · ${motionSpec.character} motion` });
      await hooks.persistDoc("docs/design/DesignTokens.json", "Design Tokens", "design-tokens", JSON.stringify(tokens, null, 2));
      await hooks.persistDoc("docs/design/MotionSpec.json", "Motion Spec", "motion-spec", JSON.stringify(motionSpec, null, 2));
      await hooks.persistFile("src/globals.css", "style", globalsCSS);
      await hooks.persistFile("tokens/tokens.css", "build", globalsCSS);
      await hooks.persistDoc("docs/design/TailwindConfig.json", "Tailwind Config", "build", JSON.stringify({ note: tailwindConfig }, null, 2));
    } catch (err) {
      return degrade("design", failReason(err), { discovery });
    }
    stats.end("design");
  }
  emit("activity", { message: `Surface policy: ${surfacePolicy} canvas (${surfacePolicy === "neutral" ? "near-neutral background enforced" : "accent-tinted canvas allowed"})` });
  emit("phase", { phase: "design", status: "done" });
  await checkpoint();

  // ══ STAGE 3: WIREFRAME (structure call + brandKit/UX call) ══
  emit("phase", { phase: "wireframe", status: "running" });
  stats.start("wireframe");
  let architecture: ArchitectureOutput;
  const wireframeInput = (revisionNotes?: string) => ({
    brief,
    tokens,
    productContext: discovery.productContext as ProductContext,
    creativeSeed: discovery.creativeSeed,
    contextDescription: discovery.contextDescription,
    ...(revisionNotes ? { revisionNotes } : {}),
  });

  if (resumed?.architecture) {
    architecture = resumed.architecture;
    stats.mark("wireframe", "skipped");
  } else {
    try {
      architecture = await runArchitecture(wireframeInput());
    } catch (err) {
      return degrade("wireframe", failReason(err), { discovery, tokens, globalsCSS, motionSpec, directions, surfacePolicy });
    }
    stats.end("wireframe");
  }
  const layoutPlan: LayoutPlan = architecture.layoutPlan;
  if (layoutPlan.screens.length > maxScreens) {
    layoutPlan.screens = layoutPlan.screens.slice(0, maxScreens);
  }
  const componentsManifest: ComponentsManifest = architecture.componentsManifest;
  const propContract: PropContract = (architecture as ArchitectureOutput & { propContract?: PropContract }).propContract ?? buildPropContract(componentsManifest);

  emit("activity", { message: `Wireframe: ${layoutPlan.screens.length} screen(s) · ${componentsManifest.entries.length} components` });
  await hooks.persistDoc("docs/planning/WireframePlan.json", "Wireframe Plan", "wireframe", JSON.stringify(layoutPlan, null, 2));
  await hooks.persistDoc("docs/planning/ComponentManifest.json", "Component Manifest", "component-manifest", JSON.stringify(componentsManifest, null, 2));
  await hooks.persistDoc("docs/planning/PropContract.json", "Prop Contract", "prop-contract", JSON.stringify(propContract, null, 2));
  await hooks.persistDoc("docs/design/BrandKit.json", "Brand Kit", "brand-kit", JSON.stringify(architecture.brandKit, null, 2));
  emit("phase", { phase: "wireframe", status: "done" });
  await checkpoint();

  // ══ STAGE 3.5: WIREFRAME CONFIRMATION GATE (hard checkpoint, §4.4) ══
  // Nothing (no model call, no component build) is spent past this point
  // until the user approves. A resumed run whose architecture was already
  // approved skips the gate entirely.
  let lastNotes: Record<string, string> = {};

  function formatRevisionNotes(notes: Record<string, string>): string {
    const lines = Object.entries(notes);
    if (lines.length === 0) return "";
    return lines.map(([screen, note]) => `- ${screen}: ${note}`).join("\n");
  }

  const gateApproved = resumed?.architecture ? resumed.wireframeApproved : false;
  let revisionsUsed = 0;
  let wireframeReview: WireframeReviewPayload | undefined;

  if (!gateApproved) {
    const confirm = config.confirmWireframes ?? (async () => ({ action: "approve" } as const));
    while (true) {
      if (revisionsUsed > 0) {
        // Bounded re-architecture call from the revision notes — discovery/
        // design-tokens are NOT re-run.
        stats.start("wireframe");
        try {
          architecture = await runArchitecture(wireframeInput(formatRevisionNotes(lastNotes)));
          layoutPlan.screens = architecture.layoutPlan.screens.slice(0, maxScreens);
          componentsManifest.entries = architecture.componentsManifest.entries;
          propContract.entries = (architecture as ArchitectureOutput & { propContract?: PropContract }).propContract?.entries ?? buildPropContract(componentsManifest).entries;
        } catch (err) {
          emit("activity", { message: `Wireframe revision failed (${failReason(err)}) — keeping the previous architecture` });
        }
        stats.end("wireframe");
        await hooks.persistDoc("docs/planning/WireframePlan.json", "Wireframe Plan", "wireframe", JSON.stringify(layoutPlan, null, 2));
        await hooks.persistDoc("docs/planning/ComponentManifest.json", "Component Manifest", "component-manifest", JSON.stringify(componentsManifest, null, 2));
        await hooks.persistDoc("docs/planning/PropContract.json", "Prop Contract", "prop-contract", JSON.stringify(propContract, null, 2));
        await hooks.persistDoc("docs/design/BrandKit.json", "Brand Kit", "brand-kit", JSON.stringify(architecture.brandKit, null, 2));
      }

      wireframeReview = buildWireframeReview(layoutPlan, componentsManifest, tokens, discovery.creativeSeed, revisionsUsed);
      emit("phase", { phase: "wireframe-review", status: "running" });
      emit("activity", { message: `Wireframe review needed — ${layoutPlan.screens.length} screen(s): ${wireframeReviewSignature(wireframeReview).slice(0, 200)}` });
      // The review payload goes over SSE; the run blocks here (no `done`
      // event) until the client posts approve / revise / cancel.
      emit("wireframes", { review: wireframeReview });

      const decision = await confirm(wireframeReview);
      if (decision.action === "approve") {
        emit("phase", { phase: "wireframe-review", status: "done" });
        break;
      }
      if (decision.action === "cancel") {
        stats.mark("wireframe", "cancelled");
        stats.setStatus("cancelled");
        emit("activity", { message: "Run cancelled at the wireframe confirmation gate — no component/screen work was spent." });
        emit("phase", { phase: "wireframe-review", status: "error" });
        void checkpoint();
        return degrade("wireframe-review", "Cancelled by user before any build work", {
          discovery, tokens, globalsCSS, motionSpec, directions, architecture, propContract,
          cancelled: true, wireframeReview, surfacePolicy,
        });
      }
      // revise
      lastNotes = decision.notes ?? {};
      revisionsUsed++;
      emit("activity", { message: `Wireframe revision ${revisionsUsed}/${MAX_WIREFRAME_REVISIONS} requested — re-architecting with the user's notes (${Object.keys(lastNotes).length} screen note(s))` });
      if (revisionsUsed > MAX_WIREFRAME_REVISIONS) {
        emit("activity", { message: "Max wireframe revisions reached — approving the latest architecture." });
        emit("phase", { phase: "wireframe-review", status: "done" });
        break;
      }
    }
    // Architecture approved — the gate is now a checkpoint so a kill here
    // resumes past the model calls but re-enters the gate only if unapproved.
    stats.mark("wireframe", "done");
    await hooks.persistDoc("docs/checkpoints/wireframe-approved.json", "Wireframe Approved", "checkpoint", JSON.stringify({ approvedAt: new Date().toISOString(), revisionsUsed }, null, 2));
  }
  await checkpoint();

  // ══ STAGE 4: CONTENT ∥ COMPONENTS (parallel) ══
  emit("phase", { phase: "data", status: "running" });
  emit("phase", { phase: "build", status: "running" });

  let content: ContentOutput | null = null;
  if (resumed?.content) {
    content = resumed.content;
    emit("activity", { message: `Content: resumed from checkpoint (${content.data.itemCount} items)` });
  } else {
    stats.start("content");
    try {
      content = await runContentGeneration({
        brief,
        layoutPlan,
        brandKit: architecture.brandKit,
        creativeSeed: discovery.creativeSeed,
      });
      if (content) {
        emit("activity", { message: `Content: ${content.data.itemCount} items · coherence ${content.coherenceReport.valid ? "PASS" : "FAIL"}` });
        await hooks.persistDoc("docs/planning/ContentData.json", "Content & Data", "content-data", JSON.stringify(content.data, null, 2));
        await hooks.persistDoc("docs/planning/CopyPlan.json", "Copy Plan", "copy-plan", JSON.stringify(content.copy, null, 2));
      }
    } catch (err) {
      emit("activity", { message: `Content generation failed (${failReason(err)})` });
      content = null;
    }
    stats.end("content");
  }

  let generatedComponents: Record<string, string>;
  let fidelityReport: FidelityVerdict[] = [];
  let provisioned: string[] = [];
  if (resumed?.components) {
    generatedComponents = resumed.components;
    // Re-close the dependency graph in case the previous run was killed
    // between component build and closure.
    const closure = closeDependencyGraph(generatedComponents, componentsManifest);
    generatedComponents = closure.components;
    provisioned = closure.provisioned;
    emit("activity", { message: `Components: resumed ${Object.keys(generatedComponents).length} from checkpoint (+${provisioned.length} provisioned siblings)` });
  } else {
    stats.start("build");
    try {
      const built = await generateAllComponents(componentsManifest, tokens, brief, discovery.creativeSeed, concurrency.componentBuild);
      generatedComponents = built.components;
      fidelityReport = built.fidelity;
    } catch (err) {
      degradations.push({ stage: "build", reason: `Component generation failed: ${failReason(err)}` });
      emit("activity", { message: `Component generation failed (${failReason(err)}) — composing with plain HTML` });
      generatedComponents = {};
    }
    // V8 §5.1: dependency closure — every sibling a generated file imports
    // must exist before the manifest is considered final.
    const closure = closeDependencyGraph(generatedComponents, componentsManifest);
    generatedComponents = closure.components;
    provisioned = closure.provisioned;
    if (provisioned.length > 0) {
      emit("activity", { message: `Dependency closure: provisioned ${provisioned.join(", ")} from the base library` });
    }
    stats.end("build");
  }

  const support = supportFiles(generatedComponents, {});
  for (const [name, code] of Object.entries(generatedComponents)) {
    await hooks.persistFile(`src/components/${name}.tsx`, "component", code);
  }
  for (const [name, code] of Object.entries(support)) {
    await hooks.persistFile(`src/components/${name}.ts`, "component", code);
  }
  emit("activity", { message: `Built ${Object.keys(generatedComponents).length} components` });
  emit("phase", { phase: "data", status: "done" });
  emit("phase", { phase: "build", status: "done" });
  await checkpoint();

  // ══ STAGE 5: SCREENS — PER-SCREEN PIPELINES (parallel, §4.1/§4.2) ══
  // Two passes because the compiled Tailwind CSS must include every screen's
  // classes (the CLI content glob needs the final screen sources):
  //   pass 1 — compose + smoke, all screens concurrently (capped);
  //   pass 2 — render + visual QA, all screens concurrently (renders
  //            serialized through the shared sandbox queue).
  emit("phase", { phase: "assemble", status: "running" });
  stats.start("screens");

  const screenFiles: Record<string, string> = {};
  const screenshots: Record<string, Buffer> = {};
  const renderErrors: string[] = [];
  const renderDiagnostics: Record<string, string[]> = {};
  const propViolations: Record<string, PropViolation[]> = {};
  const autoFixedMounts: Record<string, string[]> = {};
  const critiqueResults: CritiqueResult[] = [];
  const feedback: Array<{ screen: string; strengths: string[]; improvements: string[] }> = [];
  const smokeFailures: string[] = [];

  const fonts = [...new Set([
    tokens.typography.fontFamily.display,
    tokens.typography.fontFamily.body,
    tokens.typography.fontFamily.mono,
  ])];
  const supportFinal = support;
  const screenLimiter = pLimit(concurrency.screens);
  const screenPlans = layoutPlan.screens.slice(0, maxScreens);

  // ── Pass 1: compose + smoke (parallel per screen) ──────────────────────
  const composeAndSmoke = async (screenPlan: (typeof layoutPlan.screens)[number], index: number, total: number): Promise<void> => {
    const stage = `screen:${screenPlan.id}`;
    stats.start(stage);
    try {
      // Resume: screens already composed in a previous run are reused.
      if (resumed?.screens?.[screenPlan.id]) {
        screenFiles[screenPlan.id] = resumed.screens[screenPlan.id];
        stats.mark(stage, "skipped");
        emit("activity", { message: `Composed ${screenPlan.name}: resumed from checkpoint` });
        return;
      }
      const composed = await composeScreenV8({
        screenPlan,
        components: generatedComponents,
        tokens,
        data: content?.data ?? { itemCount: 0, metrics: [], items: [], screens: {} },
        copy: content?.copy ?? { screens: {} },
        productContext: discovery.productContext as ProductContext,
        propContract,
        brief,
        creativeSeed: discovery.creativeSeed,
      });
      screenFiles[screenPlan.id] = composed.code;
      await hooks.persistFile(`src/screens/${screenPlan.id}.tsx`, "screen", composed.code);
      if (composed.propViolations.length > 0) {
        propViolations[screenPlan.id] = composed.propViolations;
        emit("activity", { message: `${screenPlan.name}: ${composed.propViolations.length} prop-contract violation(s) could not be auto-fixed` });
      }
      if (composed.autoFixed.length > 0) {
        autoFixedMounts[screenPlan.id] = composed.autoFixed;
        emit("activity", { message: `${screenPlan.name}: auto-fixed ${composed.autoFixed.join(", ")} (empty usage → safe wrapper)` });
      }
      emit("activity", { message: `Composed ${screenPlan.name} (${index + 1}/${total})` });
    } catch (err) {
      degradations.push({ stage: "assemble", reason: `Screen ${screenPlan.id} composition failed: ${failReason(err)}` });
      emit("activity", { message: `Compose ${screenPlan.name} failed (${failReason(err)})` });
      smokeFailures.push(screenPlan.id);
      stats.end(stage, "degraded");
      return;
    }

    const code = screenFiles[screenPlan.id];
    // Smoke test (bundle-level) — per screen, inside its own pipeline.
    try {
      const smoke = await runSmokeTest({ screenCode: code, screenName: screenPlan.name, componentFiles: generatedComponents, supportFiles: supportFinal });
      if (!smoke.passed) {
        smokeFailures.push(screenPlan.id);
        renderErrors.push(`${screenPlan.id}: smoke FAIL — ${smoke.errors.map((e) => e.message).join("; ").slice(0, 200)}`);
        emit("activity", { message: `Smoke ${screenPlan.name}: FAIL — ${smoke.errors.map((e) => e.message).join("; ").slice(0, 200)}` });
      } else {
        emit("activity", { message: `Smoke ${screenPlan.name}: PASS (${smoke.renderTimeMs}ms)` });
      }
    } catch (err) {
      smokeFailures.push(screenPlan.id);
      emit("activity", { message: `Smoke ${screenPlan.name}: FAIL — ${failReason(err)}` });
    }

    // Lint gate (advisory).
    try {
      const lint = runAntiSlopLintGate({
        screenCode: code,
        componentFiles: generatedComponents,
        tokens,
        brief,
        globalsCSS,
        context: discovery.productContext as ProductContext,
      });
      emit("activity", { message: `Lint ${screenPlan.name}: ${lint.passed ? "PASS" : "FAIL"} (design ${lint.uniqueDesignScore}/10)` });
    } catch { /* advisory */ }
  };

  await Promise.all(screenPlans.map((plan, i) => screenLimiter(() => composeAndSmoke(plan, i, screenPlans.length))));

  // ── Pass 2: render + visual QA (harden only; renders serialized) ───────
  const compiled = mode === "harden" ? await compileStylesForRun({
    globalsCSS,
    components: generatedComponents,
    screens: screenFiles,
    support: supportFinal,
  }) : null;
  if (mode === "harden" && !compiled) {
    degradations.push({ stage: "visual-qa", reason: "Tailwind compilation failed — screens cannot render" });
    emit("activity", { message: "Tailwind compilation failed — visual QA and rendering skipped" });
  }
  const warm = mode === "harden" ? await getWarmSandbox() : null;
  const renderQueue = pLimit(concurrency.render);

  const renderAndQA = async (screenPlan: (typeof layoutPlan.screens)[number]): Promise<void> => {
    const code = screenFiles[screenPlan.id];
    if (!code || mode !== "harden" || !compiled) return;

    // Render + visual QA — the pipeline owns rendering now, so a bundle
    // failure or crash is attributed here, never a silent blank PNG.
    const bundle = await bundleScreenForPreview(screenPlan.id, code, generatedComponents, supportFinal);
    if (!bundle) {
      renderErrors.push(`${screenPlan.id}: bundle failed`);
      emit("activity", { message: `Render ${screenPlan.name}: bundle failed` });
      return;
    }
    const html = buildPreviewHtml(screenPlan.id, bundle, compiled, fonts);
    const render = await renderQueue(() => renderScreen({ html, screenName: screenPlan.id, warmSandbox: warm ?? undefined }));
    if (render.diagnostics.length > 0) renderDiagnostics[screenPlan.id] = render.diagnostics;
    if (!render.screenshot) {
      renderErrors.push(`${screenPlan.id}: ${render.errors.join("; ")}`);
      emit("activity", { message: `Render ${screenPlan.name}: FAIL — ${render.errors.join("; ").slice(0, 200)}` });
      return;
    }
    screenshots[screenPlan.id] = render.screenshot;
    emit("activity", { message: `Render ${screenPlan.name}: OK${render.errors.length ? ` (${render.errors.join("; ")})` : ""}` });
    try {
      const review = await reviewScreen({
        screenshot: render.screenshot,
        screenName: screenPlan.id,
        brief,
        tokens,
        productContext: discovery.productContext as ProductContext,
        creativeSeed: discovery.creativeSeed,
      });
      critiqueResults.push({
        scores: review.scores,
        average: review.average,
        passed: review.passed,
        failingDimensions: review.failingDimensions,
        diagnosis: review.diagnosis,
        routeTo: review.average < 7 ? "components" : null,
        affectedIds: [screenPlan.id],
      });
      feedback.push({ screen: screenPlan.id, strengths: review.strengths, improvements: review.improvements });
      emit("activity", { message: `Visual QA ${screenPlan.name}: ${review.average}/10 — ${review.diagnosis.slice(0, 120)}` });
    } catch (err) {
      critiqueResults.push({
        scores: { productContext: 0, brandCoherence: 0, hierarchy: 0, composition: 0, spacingRhythm: 0, componentConsistency: 0, navigation: 0, contentCopy: 0, responsiveDesign: 0, accessibilityBaseline: 0 },
        average: 0,
        passed: false,
        failingDimensions: [],
        diagnosis: `Visual review failed: ${failReason(err)}`,
        routeTo: null,
        affectedIds: [screenPlan.id],
      });
    }
  };

  await Promise.all(screenPlans.map((plan) => screenLimiter(() => renderAndQA(plan))));
  for (const plan of screenPlans) {
    if (stats.stageStatus(`screen:${plan.id}`) === "running") stats.end(`screen:${plan.id}`);
  }

  stats.end("screens");
  await hooks.persistDoc("docs/review/SmokeTestResults.json", "Smoke Test Results", "smoke-test", JSON.stringify(smokeFailures.map((id) => ({ screen: id, passed: false })), null, 2));
  emit("activity", { message: `Composed ${Object.keys(screenFiles).length} screen(s)` });
  emit("phase", { phase: "assemble", status: "done" });
  await checkpoint();

  // ══ STAGE 6: DETERMINISTIC GATES ══
  stats.start("gates");

  const baseSources: Record<string, string> = {};
  for (const e of componentsManifest.entries) {
    const info = loadBaseComponent(e.baseComponent);
    if (info) baseSources[e.id] = info.source;
  }
  const antiSlopResult = runFullAntiSlopGate(generatedComponents, screenFiles, baseSources, discovery.productContext as ProductContext);
  emit("activity", { message: `Anti-slop gate: ${antiSlopResult.passed ? "PASSED" : `FAILED (${antiSlopResult.blockingViolations.length} blocking)`}` });
  await hooks.persistDoc("docs/review/AntiSlopGate.json", "Anti-Slop Gate", "anti-slop-gate", JSON.stringify(antiSlopResult, null, 2));

  const themeGate = assertNeutralCanvas(tokens, surfacePolicy);
  emit("activity", { message: `Theme gate: ${themeGate.passed ? "PASSED" : `FAILED (${themeGate.violations.join("; ")})`}` });
  await hooks.persistDoc("docs/review/ThemeGate.json", "Theme Gate", "theme-gate", JSON.stringify(themeGate, null, 2));

  const globalsAudit = auditGlobalsCSS(globalsCSS);
  if (!globalsAudit.passed) {
    degradations.push({ stage: "tokens", reason: `Generated globals.css omits theme variables: ${globalsAudit.missing.join(", ")}` });
  }
  emit("activity", { message: `Token-CSS audit: ${globalsAudit.passed ? "PASSED" : `FAILED (missing ${globalsAudit.missing.join(", ")})`}` });
  await hooks.persistDoc("docs/review/GlobalsAudit.json", "Globals CSS Audit", "globals-audit", JSON.stringify(globalsAudit, null, 2));

  const compositionGate = runCompositionGate(screenFiles, screenPlans);
  emit("activity", { message: `Composition gate: ${compositionGate.passed ? "PASSED" : `FAILED (${compositionGate.violations.filter((v) => v.severity === "high").length} blocking)`}` });
  await hooks.persistDoc("docs/review/CompositionGate.json", "Composition Gate", "composition-gate", JSON.stringify(compositionGate, null, 2));

  const geometryGate = runGeometryGate(screenFiles, screenPlans);
  await hooks.persistDoc("docs/review/GeometryGate.json", "Geometry Gate", "geometry-gate", JSON.stringify(geometryGate, null, 2));

  if (fidelityReport.length > 0) {
    await hooks.persistDoc("docs/review/ComponentFidelity.json", "Component Fidelity", "component-fidelity", JSON.stringify({ report: fidelityReport, provisioned }, null, 2));
  }
  if (Object.keys(propViolations).length > 0) {
    await hooks.persistDoc("docs/review/PropViolations.json", "Prop Contract Violations", "prop-violations", JSON.stringify(propViolations, null, 2));
  }
  stats.end("gates");
  await checkpoint();

  // ══ PRESENT (screens live before QA) ══
  emit("screens", { screens: Object.keys(screenFiles) });
  emit("phase", { phase: "present", status: "running" });
  emit("phase", { phase: "present", status: "done" });

  // ══ STAGE 7: VISUAL QA SUMMARY (harden only) ══
  const averageScore = critiqueResults.length > 0
    ? Math.round((critiqueResults.reduce((s, r) => s + r.average, 0) / critiqueResults.length) * 10) / 10
    : 0;
  const passedAll = critiqueResults.length > 0
    && critiqueResults.every((r) => r.passed)
    && Object.keys(screenshots).length === screenPlans.length;

  if (mode === "harden") {
    emit("phase", { phase: "review", status: passedAll ? "done" : "error" });
    emit("activity", { message: `Visual QA: ${averageScore}/10 avg — ${passedAll ? "ALL PASSED" : "blocking defects present"}` });
    await hooks.persistDoc("docs/review/CritiqueResults.json", "Critique Results", "critique-results", JSON.stringify(critiqueResults, null, 2));
  }

  // ══ STAGE 8: FINALIZE ══
  let finalReport: FinalizeReportV2 | null = null;
  try {
    finalReport = await finalize({
      projectId,
      brief,
      tokens,
      globalsCSS,
      generatedFiles: generatedComponents,
      supportFiles: supportFinal,
      screenFiles,
      critiqueResults,
      manifest: componentsManifest,
      brandKit: architecture.brandKit as unknown as Record<string, unknown>,
      visualQAResults: { averageScore, blockingDefects: critiqueResults.filter((r) => !r.passed).map((r) => ({ screen: r.affectedIds[0] ?? "?", defects: [r.diagnosis] })) },
      contentReport: content
        ? { dataItemCount: content.data.itemCount, copyScreenCount: Object.keys(content.copy.screens).length, hasSlop: !content.coherenceReport.valid || !antiSlopResult.passed }
        : { dataItemCount: 0, copyScreenCount: 0, hasSlop: true },
      degradations: degradations.map((d) => `${d.stage}: ${d.reason}`),
      v8Gates: {
        themeGatePassed: themeGate.passed,
        globalsAuditPassed: globalsAudit.passed,
        compositionGatePassed: compositionGate.passed,
        geometryGatePassed: geometryGate.passed,
        surfacePolicy,
        timing: { wallSeconds: Math.round(stats.wallMs / 1000), stages: stats.wallTimeByStage() },
      },
    });
    await hooks.persistDoc("docs/review/FinalReport.md", "Final Report", "final-report", finalReport.summaryMarkdown);
  } catch (err) {
    degradations.push({ stage: "finalize", reason: `Finalize failed: ${failReason(err)}` });
    emit("activity", { message: `Finalize failed (${failReason(err)})` });
  }

  const success = degradations.length === 0
    && smokeFailures.length === 0
    && antiSlopResult.passed
    && themeGate.passed
    && globalsAudit.passed
    && compositionGate.passed
    && (mode === "draft" || passedAll);

  stats.setStatus(success ? "done" : "error");
  const timing = { wallSeconds: Math.round(stats.wallMs / 1000), stages: stats.wallTimeByStage() };
  await hooks.persistDoc("docs/review/Timing.json", "Run Timing", "timing", JSON.stringify(timing, null, 2));
  await checkpoint();

  return {
    success,
    report: finalReport?.summaryMarkdown ?? "",
    exportPath: finalReport?.exportPath ?? "",
    tokens,
    globalsCSS,
    layoutPlan,
    componentsManifest,
    propContract,
    generatedComponents,
    supportFiles: supportFinal,
    screenFiles,
    critiqueResults,
    averageScore,
    passedAll,
    antiSlopPassed: antiSlopResult.passed,
    smokeFailures,
    discovery,
    architecture,
    content,
    motionSpec,
    directions,
    finalReport,
    degradations,
    screenshots,
    renderErrors,
    renderDiagnostics,
    propViolations,
    autoFixedMounts,
    fidelityReport,
    provisioned,
    timing,
    themeGate,
    globalsAudit,
    compositionGate,
    geometryGate,
    surfacePolicy,
    wireframeReview,
  };
}

export { loadMegadesign, loadCompanyDoc };
export const PICASSO_OUTPUT_BASE = path.resolve(__dirname, "../output");

/** Exported for tests/consumers that need a structurally valid token set. */
export { fallbackTokens };

export function outputBaseDir(): string {
  fs.mkdirSync(PICASSO_OUTPUT_BASE, { recursive: true });
  return PICASSO_OUTPUT_BASE;
}

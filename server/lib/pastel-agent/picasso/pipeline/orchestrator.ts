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
import { runContentGeneration, generateAllComponents, supportFiles, type ContentOutput } from "./stage-4-build";
import { composeAllScreens } from "./stage-5-assemble";
import { runSmokeTest, runAntiSlopLintGate } from "./stage-6-verify";
import { runFullAntiSlopGate } from "./anti-slop";
import { runVisualQA } from "./stage-7-visual-qa";
import { finalize, type FinalizeReportV2 } from "./stage-8-finalize";
import { loadMegadesign, loadCompanyDoc } from "./knowledge";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PicassoHooks {
  /** Activity / phase messages. */
  emit(type: "activity" | "phase" | "doc" | "file" | "screens" | "done", payload: Record<string, unknown>): void;
  /** Persist a JSON/string document (planning docs). */
  persistDoc(path: string, title: string, kind: string, content: string): Promise<void> | void;
  /** Persist a generated code/style file. */
  persistFile(path: string, kind: string, content: string): Promise<void> | void;
}

export interface PicassoRunConfig {
  projectId: string;
  mode?: "draft" | "harden";
  maxScreens?: number;
  hooks: PicassoHooks;
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

/**
 * Picasso V7 pipeline core. Wired to the UI via `startPicassoAgentLoop`
 * (run.ts) or driven directly by tests with custom hooks.
 *
 * V7 contract: every model-calling stage degrades instead of throwing past
 * the pipeline boundary. A failed stage is recorded in `degradations`,
 * surfaced in the final report, and the run returns `success: false` with
 * whatever partial artifacts exist — a run never dies silently after money
 * was already spent.
 *
 * discovery → directions → tokens+motion → wireframe (structure ∥ brand) →
 * content ∥ components (parallel) → screens (parallel) →
 * smoke/lint/anti-slop gates → [harden: E2B visual QA] → finalize
 */
export async function runPicassoPipeline(brief: Brief, config: PicassoRunConfig): Promise<PicassoPipelineOutput> {
  const { projectId, mode = "harden", hooks } = config;
  const maxScreens = config.maxScreens ?? 3;
  const emit = hooks.emit;

  const degradations: StageDegradation[] = [];
  const failReason = (err: unknown): string => (err instanceof Error ? err.message : String(err));

  /** Build a degraded-but-valid output for a failed stage. Never throws. */
  const degrade = (
    stage: string,
    reason: string,
    partial: Partial<PicassoPipelineOutput>,
  ): PicassoPipelineOutput => {
    degradations.push({ stage, reason });
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
    };
  };

  emit("phase", { phase: "discovery", status: "running" });

  // ══ STAGE 1: DISCOVERY ══
  let discovery: DiscoveryOutput;
  try {
    discovery = await runDiscovery({ brief });
  } catch (err) {
    return degrade("discovery", failReason(err), {});
  }
  emit("activity", { message: `${brief.productName} — ${discovery.productContext} context · seed: ${discovery.creativeSeed}` });
  await hooks.persistDoc("docs/brief/Brief.json", "Product Brief", "brief", JSON.stringify(brief, null, 2));
  await hooks.persistDoc("docs/planning/Discovery.json", "Discovery", "discovery", JSON.stringify(discovery, null, 2));
  emit("phase", { phase: "discovery", status: "done" });
  emit("phase", { phase: "brief", status: "running" });
  emit("phase", { phase: "brief", status: "done" });

  // ══ STAGE 2: DIRECTIONS + TOKENS + MOTION ══
  emit("phase", { phase: "design", status: "running" });
  let directions: Stage2Direction[];
  let tokens: Tokens;
  let globalsCSS = "";
  let motionSpec = FALLBACK_MOTION_SPEC;
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
  emit("phase", { phase: "design", status: "done" });

  // ══ STAGE 3: WIREFRAME (structure call + brandKit/UX call) ══
  emit("phase", { phase: "wireframe", status: "running" });
  let architecture: ArchitectureOutput;
  try {
    architecture = await runArchitecture({
      brief,
      tokens,
      productContext: discovery.productContext as ProductContext,
      creativeSeed: discovery.creativeSeed,
      contextDescription: discovery.contextDescription,
    });
  } catch (err) {
    return degrade("wireframe", failReason(err), { discovery, tokens, globalsCSS, motionSpec, directions });
  }
  const layoutPlan: LayoutPlan = architecture.layoutPlan;
  if (layoutPlan.screens.length > maxScreens) {
    layoutPlan.screens = layoutPlan.screens.slice(0, maxScreens);
  }
  const componentsManifest: ComponentsManifest = architecture.componentsManifest;
  const propContract: PropContract = buildPropContract(componentsManifest);

  emit("activity", { message: `Wireframe: ${layoutPlan.screens.length} screen(s) · ${componentsManifest.entries.length} components` });
  await hooks.persistDoc("docs/planning/WireframePlan.json", "Wireframe Plan", "wireframe", JSON.stringify(layoutPlan, null, 2));
  await hooks.persistDoc("docs/planning/ComponentManifest.json", "Component Manifest", "component-manifest", JSON.stringify(componentsManifest, null, 2));
  await hooks.persistDoc("docs/planning/PropContract.json", "Prop Contract", "prop-contract", JSON.stringify(propContract, null, 2));
  await hooks.persistDoc("docs/design/BrandKit.json", "Brand Kit", "brand-kit", JSON.stringify(architecture.brandKit, null, 2));
  emit("phase", { phase: "wireframe", status: "done" });

  // ══ STAGES 4-5: CONTENT ∥ COMPONENTS (parallel) ══
  emit("phase", { phase: "data", status: "running" });
  emit("phase", { phase: "build", status: "running" });

  const [content, generatedComponents] = await Promise.all([
    runContentGeneration({
      brief,
      layoutPlan,
      brandKit: architecture.brandKit,
      creativeSeed: discovery.creativeSeed,
    }).catch((err) => {
      emit("activity", { message: `Content generation failed (${err instanceof Error ? err.message : err})` });
      return null;
    }),
    generateAllComponents(componentsManifest, tokens, brief, discovery.creativeSeed, 4).catch((err) => {
      degradations.push({ stage: "build", reason: `Component generation failed: ${failReason(err)}` });
      emit("activity", { message: `Component generation failed (${failReason(err)}) — composing with plain HTML` });
      return {};
    }),
  ]);

  if (content) {
    emit("activity", { message: `Content: ${content.data.itemCount} items · coherence ${content.coherenceReport.valid ? "PASS" : "FAIL"}` });
    await hooks.persistDoc("docs/planning/ContentData.json", "Content & Data", "content-data", JSON.stringify(content.data, null, 2));
    await hooks.persistDoc("docs/planning/CopyPlan.json", "Copy Plan", "copy-plan", JSON.stringify(content.copy, null, 2));
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

  // ══ STAGE 5: SCREENS (parallel per-screen) ══
  emit("phase", { phase: "assemble", status: "running" });
  let screenFiles: Record<string, string>;
  try {
    screenFiles = await composeAllScreens({
      layoutPlan,
      components: generatedComponents,
      tokens,
      data: content?.data ?? { itemCount: 0, metrics: [], items: [], screens: {} },
      copy: content?.copy ?? { screens: {} },
      productContext: discovery.productContext as ProductContext,
      propContract,
      brief,
      creativeSeed: discovery.creativeSeed,
      onProgress: (name, i, total) => emit("activity", { message: `Composed ${name} (${i}/${total})` }),
    });
  } catch (err) {
    degradations.push({ stage: "assemble", reason: `Screen composition failed: ${failReason(err)}` });
    emit("activity", { message: `Screen composition failed (${failReason(err)})` });
    screenFiles = {};
  }

  for (const [id, code] of Object.entries(screenFiles)) {
    await hooks.persistFile(`src/screens/${id}.tsx`, "screen", code);
  }
  emit("activity", { message: `Composed ${Object.keys(screenFiles).length} screen(s)` });
  emit("phase", { phase: "assemble", status: "done" });

  // Support files re-scan (screens may reference use-mobile too)
  const supportFinal = supportFiles(generatedComponents, screenFiles);
  for (const [name, code] of Object.entries(supportFinal)) {
    await hooks.persistFile(`src/components/${name}.ts`, "component", code);
  }

  // ══ STAGE 6: GATES (smoke + lint + anti-slop) ══
  const smokeFailures: string[] = [];
  for (const screenPlan of layoutPlan.screens) {
    const code = screenFiles[screenPlan.id];
    if (!code) continue;
    try {
      const smoke = await runSmokeTest({ screenCode: code, screenName: screenPlan.name, componentFiles: generatedComponents, supportFiles: supportFinal });
      if (!smoke.passed) {
        smokeFailures.push(screenPlan.id);
        emit("activity", { message: `Smoke ${screenPlan.name}: FAIL — ${smoke.errors.map((e) => e.message).join("; ").slice(0, 200)}` });
      } else {
        emit("activity", { message: `Smoke ${screenPlan.name}: PASS (${smoke.renderTimeMs}ms)` });
      }
    } catch (err) {
      smokeFailures.push(screenPlan.id);
      emit("activity", { message: `Smoke ${screenPlan.name}: FAIL — ${err instanceof Error ? err.message : String(err)}` });
    }
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
  }
  await hooks.persistDoc("docs/review/SmokeTestResults.json", "Smoke Test Results", "smoke-test", JSON.stringify(smokeFailures.map((id) => ({ screen: id, passed: false })), null, 2));

  const baseSources: Record<string, string> = {};
  for (const e of componentsManifest.entries) {
    const { loadBaseComponent } = await import("./lib/base-components");
    const info = loadBaseComponent(e.baseComponent);
    if (info) baseSources[e.id] = info.source;
  }
  const antiSlopResult = runFullAntiSlopGate(generatedComponents, screenFiles, baseSources, discovery.productContext as ProductContext);
  emit("activity", { message: `Anti-slop gate: ${antiSlopResult.passed ? "PASSED" : `FAILED (${antiSlopResult.blockingViolations.length} blocking)`}` });
  await hooks.persistDoc("docs/review/AntiSlopGate.json", "Anti-Slop Gate", "anti-slop-gate", JSON.stringify(antiSlopResult, null, 2));

  // ══ PRESENT (screens live before QA) ══
  emit("screens", { screens: Object.keys(screenFiles) });
  emit("phase", { phase: "present", status: "running" });
  emit("phase", { phase: "present", status: "done" });

  // ══ STAGE 7: VISUAL QA (harden only) ══
  let critiqueResults: CritiqueResult[] = [];
  let averageScore = 0;
  let passedAll = false;

  if (mode === "harden") {
    emit("phase", { phase: "review", status: "running" });
    try {
      const fonts = [...new Set([
        tokens.typography.fontFamily.display,
        tokens.typography.fontFamily.body,
        tokens.typography.fontFamily.mono,
      ])];
      const visualQA = await runVisualQA({
        screenFiles,
        componentFiles: generatedComponents,
        supportFiles: supportFinal,
        globalsCSS,
        tokens,
        brief,
        productContext: discovery.productContext as ProductContext,
        creativeSeed: discovery.creativeSeed,
        fonts,
      });
      critiqueResults = visualQA.results;
      averageScore = visualQA.averageScore;
      passedAll = visualQA.passedAll;
      emit("activity", { message: `Visual QA: ${averageScore}/10 avg — ${passedAll ? "ALL PASSED" : `${visualQA.blockingDefects.length} screen(s) with blocking defects`}` });
      for (const r of visualQA.results) {
        emit("activity", { message: `  ${r.average}/10 — ${r.diagnosis.slice(0, 120)}` });
      }
      await hooks.persistDoc("docs/review/CritiqueResults.json", "Critique Results", "critique-results", JSON.stringify(visualQA.results, null, 2));
    } catch (err) {
      degradations.push({ stage: "visual-qa", reason: `Visual QA did not run: ${failReason(err)}` });
      emit("activity", { message: `Visual QA unavailable (${failReason(err)})` });
    }
    emit("phase", { phase: "review", status: passedAll ? "done" : "error" });
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
    });
    await hooks.persistDoc("docs/review/FinalReport.md", "Final Report", "final-report", finalReport.summaryMarkdown);
  } catch (err) {
    degradations.push({ stage: "finalize", reason: `Finalize failed: ${failReason(err)}` });
    emit("activity", { message: `Finalize failed (${failReason(err)})` });
  }

  const success = degradations.length === 0 && smokeFailures.length === 0 && antiSlopResult.passed && (mode === "draft" || passedAll);

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

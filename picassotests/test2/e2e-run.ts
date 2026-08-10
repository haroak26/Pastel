/**
 * Picasso V2 (New Agent) — Full E2E Test
 *
 * Runs the real 8-stage V2 pipeline end to end with live AI calls:
 *   discovery → design system → architecture → content → components →
 *   screens (2) → visual QA (E2B sandbox screenshots + vision critique) →
 *   finalize.
 *
 * Captures per-stage timing, real gateway usage/cost, artifacts and
 * screenshots. Writes findings to picassotests/test2/.
 *
 * Run with:
 *   E2B_API_KEY=e2b_... npx tsx picassotests/test2/e2e-run.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── E2B key (user-provided, not yet in env) ────────────────────────────
process.env.E2B_API_KEY = process.env.E2B_API_KEY ?? "e2b_c5ef682efd5dd1a9c2ff27639a9824dd302d65a5";

// ── Usage/cost tracking — wrap the gateway client ─────────────────────
import { MergeGateway } from "merge-gateway-sdk";
import {
  __setTestClient,
  MODELS,
  type ChatMessage,
  type UsageRecord,
} from "../../server/lib/pastel-agent/gateway";
import { ledgerFromUsage } from "../../server/lib/pastel-agent/lib/ledger";
import { calcCostTokens } from "../../server/lib/pricing";

const apiKey = process.env.MERGE_GATEWAY_API_KEY;
if (!apiKey) {
  console.error("MERGE_GATEWAY_API_KEY not set — cannot run the V2 pipeline");
  process.exit(1);
}

const realClient = new MergeGateway({
  apiKey,
  baseUrl: "https://api-gateway.merge.dev/v1",
  timeout: 300000,
});

const usageRecords: UsageRecord[] = [];
const roleByModel = new Map<string, keyof typeof MODELS>();
for (const [role, model] of Object.entries(MODELS)) {
  roleByModel.set(model, role as keyof typeof MODELS);
}

function countImageBlocks(input: unknown): number {
  let n = 0;
  const messages = Array.isArray(input) ? (input as ChatMessage[]) : [];
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      for (const block of m.content) {
        if (block && typeof block === "object" && (block as { type?: string }).type === "image") n++;
      }
    }
  }
  return n;
}

const trackingProxy = {
  responses: {
    create: async (params: Record<string, unknown>) => {
      const response = (await realClient.responses.create(params)) as {
        model?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
        routing?: { cost_usd?: number };
      };
      const modelId = response.model ?? (params.model as string);
      const inputTokens = response.usage?.input_tokens ?? 0;
      const outputTokens = response.usage?.output_tokens ?? 0;
      usageRecords.push({
        role: roleByModel.get(modelId) ?? "design",
        modelId,
        inputChars: 0,
        outputChars: 0,
        inputTokens,
        outputTokens,
        imageBlocks: countImageBlocks(params.input),
        ...(typeof response.routing?.cost_usd === "number"
          ? { costUsd: response.routing.cost_usd }
          : {}),
      });
      return response;
    },
  },
};
__setTestClient(trackingProxy as never);

// ── V2 pipeline imports ──────────────────────────────────────────────────
import { runDiscovery } from "../../server/lib/pastel-agent/picasso/pipeline/stage-1-discovery";
import {
  generateCreativeDirections,
  generateEnhancedTokens,
  generateTokensCSS,
  generateTailwindConfig,
  validateTokens,
} from "../../server/lib/pastel-agent/picasso/pipeline/stage-2-design-system";
import { runArchitecture } from "../../server/lib/pastel-agent/picasso/pipeline/stage-3-architecture";
import { runContentGeneration } from "../../server/lib/pastel-agent/picasso/pipeline/stage-4-content";
import { generateAllComponents, generateCatalogPage } from "../../server/lib/pastel-agent/picasso/pipeline/stage-5-components";
import { composeScreenWithRetry } from "../../server/lib/pastel-agent/picasso/pipeline/stage-6-screens";
import { runVisualQA } from "../../server/lib/pastel-agent/picasso/pipeline/stage-7-visual-qa";
import { finalize } from "../../server/lib/pastel-agent/picasso/pipeline/stage-8-finalize";
import { loadMegadesign, loadCompanyDoc } from "../../server/lib/pastel-agent/picasso/pipeline/knowledge";
import type {
  Brief,
  CreativeDirection,
  Tokens,
  LayoutPlan,
  ComponentsManifest,
  CritiqueResult,
} from "../../server/lib/pastel-agent/picasso/pipeline/types";
import type { MockDataset, CopyPlan as ContentCopyPlan } from "../../server/lib/pastel-agent/picasso/pipeline/stage-4-content";
import type { CopyPlan as ScreenCopyPlan } from "../../server/lib/pastel-agent/picasso/pipeline/stage-6-screens";

// ── Test dirs ─────────────────────────────────────────────────────────────
const TEST_DIR = path.resolve(__dirname);
const SCREENSHOT_DIR = path.join(TEST_DIR, "screenshots");
const OUTPUT_DIR = path.join(TEST_DIR, "output");
const RUN_START = new Date().toISOString();
const MAX_SCREENS = 2;

interface StageTiming {
  stage: string;
  start: string;
  end: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

interface TestArtifact {
  name: string;
  path: string;
  size: number;
  type: string;
}

const results: {
  stages: StageTiming[];
  artifacts: TestArtifact[];
  errors: string[];
  warnings: string[];
} = { stages: [], artifacts: [], errors: [], warnings: [] };

function recordArtifact(name: string, filePath: string, type: string) {
  try {
    const stat = fs.statSync(filePath);
    results.artifacts.push({ name, path: filePath, size: stat.size, type });
  } catch {
    results.warnings.push(`Artifact missing: ${filePath}`);
  }
}

async function runStage<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  console.log(`\n[${name}] Starting...`);
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[${name}] ✓ Completed in ${duration}ms`);
    results.stages.push({
      stage: name,
      start: new Date(start).toISOString(),
      end: new Date().toISOString(),
      durationMs: duration,
      success: true,
    });
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${name}] ✗ FAILED in ${duration}ms: ${msg}`);
    results.errors.push(`${name}: ${msg}`);
    results.stages.push({
      stage: name,
      start: new Date(start).toISOString(),
      end: new Date().toISOString(),
      durationMs: duration,
      success: false,
      error: msg,
    });
    throw err;
  }
}

/** AI stages occasionally return malformed JSON — retry a few times before failing the run. */
async function runStageRetry<T>(name: string, fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await runStage(`${name} (attempt ${attempt}/${retries})`, fn);
    } catch (err) {
      if (attempt >= retries) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[${name}] attempt ${attempt} failed (${msg.slice(0, 120)}) — retrying in 1s...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("Picasso V2 (New Agent) — Full E2E Test");
  console.log(`Started: ${RUN_START}`);
  console.log(`E2B: ${process.env.E2B_API_KEY ? "configured" : "MISSING"}`);
  console.log("═══════════════════════════════════════════\n");

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Test brief: budgeting app for Gen Z ─────────────────────────────
  const brief: Brief = {
    productName: "Wavelength",
    description:
      "A budgeting app for Gen Z that makes tracking money feel like a game. Users see spending breakdowns, set savings goals, and earn streak rewards for hitting budgets. Core screens are a dashboard and a goals view.",
    audience:
      "Gen Z and younger millennials who are new to managing their own money. Students and early-career professionals.",
    niche: "fintech",
    personality: ["playful", "bold", "minimal"],
    density: "balanced",
    mode: "light",
    platform: "web",
    companyRefs: ["stripe", "duolingo"],
  };

  console.log("Test brief:", JSON.stringify(brief, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, "brief.json"), JSON.stringify(brief, null, 2));

  // ── Stage 1: Discovery ──────────────────────────────────────────────
  const discovery = await runStage("stage-1-discovery", () => runDiscovery({ brief }));
  console.log(`  Context: ${discovery.productContext} | validation: ${discovery.validationPassed ? "PASS" : "FAIL"}`);
  console.log(`  References: ${discovery.selectedReferences.map((r) => r.name).join(", ")}`);
  fs.writeFileSync(path.join(OUTPUT_DIR, "discovery.json"), JSON.stringify(discovery, null, 2));
  recordArtifact("discovery.json", path.join(OUTPUT_DIR, "discovery.json"), "json");

  // ── Stage 2: Design system ──────────────────────────────────────────
  const megadesignContent = loadMegadesign();

  const companyContents: Record<string, string> = {};
  for (const ref of discovery.selectedReferences) {
    try {
      companyContents[ref.name] = loadCompanyDoc(ref.name);
      console.log(`  Loaded company: ${ref.name} (${companyContents[ref.name].length} chars)`);
    } catch {
      results.warnings.push(`Company file not found: ${ref.name}.md`);
    }
  }

  const stage2Directions = await runStageRetry("stage-2-directions", () =>
    generateCreativeDirections({
      brief,
      references: discovery.selectedReferences,
      megadesignContent,
      companyContents,
    }),
  );
  console.log(`  Generated ${stage2Directions.length} directions:`);
  for (const d of stage2Directions) {
    console.log(`    • "${d.name}" — ${d.summary.slice(0, 70)} (accent ${d.accentColor})`);
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, "creative-directions.json"), JSON.stringify(stage2Directions, null, 2));
  recordArtifact("creative-directions.json", path.join(OUTPUT_DIR, "creative-directions.json"), "json");

  const chosen = stage2Directions[0];
  const direction: CreativeDirection = {
    name: chosen.name,
    summary: chosen.summary,
    influences: discovery.selectedReferences.map((r) => r.name),
    paletteDirection: `${chosen.accentColor} — ${chosen.surfaces}`,
    densityFit:
      chosen.spacing === "airy" ? "low" : chosen.spacing === "dense" ? "high" : "medium",
  };

  const tokens = await runStage("stage-2-tokens", () =>
    generateEnhancedTokens({
      brief,
      direction,
      stage2Directions,
      megadesignContent,
      companyContents,
      contextDescription: discovery.contextDescription,
    }),
  );
  console.log(`  Brand: ${tokens.meta.brand} | Accent: ${tokens.color.accent["500"]} | Display: ${tokens.typography.fontFamily.display}`);

  const tokenValidation = validateTokens(tokens);
  console.log(`  Token validation: ${tokenValidation.valid ? "PASS" : `ISSUES: ${tokenValidation.issues.slice(0, 3).join("; ")}`}`);

  fs.writeFileSync(path.join(OUTPUT_DIR, "tokens.json"), JSON.stringify(tokens, null, 2));
  recordArtifact("tokens.json", path.join(OUTPUT_DIR, "tokens.json"), "json");

  const tokensCSS = generateTokensCSS(tokens);
  fs.writeFileSync(path.join(OUTPUT_DIR, "tokens.css"), tokensCSS);
  recordArtifact("tokens.css", path.join(OUTPUT_DIR, "tokens.css"), "css");

  const tailwindConfig = generateTailwindConfig(tokens);
  fs.writeFileSync(path.join(OUTPUT_DIR, "tailwind.config.ts"), tailwindConfig);
  recordArtifact("tailwind.config.ts", path.join(OUTPUT_DIR, "tailwind.config.ts"), "ts");

  // ── Stage 3: Architecture ───────────────────────────────────────────
  const architecture = await runStage("stage-3-architecture", () => runArchitecture({ brief, tokens }));
  const layoutPlan: LayoutPlan = architecture.layoutPlan;
  const componentsManifest: ComponentsManifest = architecture.componentsManifest;

  // E2E cap: limit to 2 screens
  if (layoutPlan.screens.length > MAX_SCREENS) {
    console.log(`  Trimming from ${layoutPlan.screens.length} to ${MAX_SCREENS} screens for fast testing`);
    layoutPlan.screens = layoutPlan.screens.slice(0, MAX_SCREENS);
  }

  console.log(`  Screens: ${layoutPlan.screens.length}`);
  for (const s of layoutPlan.screens) {
    console.log(`    • ${s.name} (${s.route}) — ${s.regions.length} regions`);
  }
  console.log(`  Components: ${componentsManifest.entries.length} | BrandKit: ${architecture.brandKit.signatureMoves.length} moves`);

  fs.writeFileSync(path.join(OUTPUT_DIR, "layout-plan.json"), JSON.stringify(layoutPlan, null, 2));
  recordArtifact("layout-plan.json", path.join(OUTPUT_DIR, "layout-plan.json"), "json");
  fs.writeFileSync(path.join(OUTPUT_DIR, "components-manifest.json"), JSON.stringify(componentsManifest, null, 2));
  recordArtifact("components-manifest.json", path.join(OUTPUT_DIR, "components-manifest.json"), "json");
  fs.writeFileSync(path.join(OUTPUT_DIR, "brand-kit.json"), JSON.stringify(architecture.brandKit, null, 2));
  recordArtifact("brand-kit.json", path.join(OUTPUT_DIR, "brand-kit.json"), "json");

  // ── Stage 4: Content ────────────────────────────────────────────────
  const content = await runStage("stage-4-content", () =>
    runContentGeneration({ brief, layoutPlan, brandKit: architecture.brandKit }),
  );
  console.log(`  Data items: ${content.data.itemCount} | Coherence: ${content.coherenceReport.valid ? "PASS" : "FAIL"}`);
  if (!content.coherenceReport.valid) {
    for (const i of content.coherenceReport.issues) results.warnings.push(`Content coherence: ${i}`);
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, "content-data.json"), JSON.stringify(content.data, null, 2));
  recordArtifact("content-data.json", path.join(OUTPUT_DIR, "content-data.json"), "json");
  fs.writeFileSync(path.join(OUTPUT_DIR, "content-copy.json"), JSON.stringify(content.copy, null, 2));
  recordArtifact("content-copy.json", path.join(OUTPUT_DIR, "content-copy.json"), "json");

  // ── Stage 5: Components ─────────────────────────────────────────────
  const generatedComponents = await runStage("stage-5-components", () =>
    generateAllComponents(componentsManifest, tokens, tokensCSS, brief, 4),
  );
  console.log(`  Generated ${Object.keys(generatedComponents).length} component files`);

  const componentsDir = path.join(OUTPUT_DIR, "components");
  fs.mkdirSync(componentsDir, { recursive: true });
  for (const [name, code] of Object.entries(generatedComponents)) {
    const filePath = path.join(componentsDir, `${name}.tsx`);
    fs.writeFileSync(filePath, code);
  }
  recordArtifact("components", componentsDir, "dir");

  const catalogPage = await runStage("stage-5-catalog", () =>
    generateCatalogPage(componentsManifest, tokens),
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, "catalog-page.tsx"), catalogPage);
  recordArtifact("catalog-page.tsx", path.join(OUTPUT_DIR, "catalog-page.tsx"), "tsx");

  // ── Stage 6: Screens (compose, with per-screen copy) ───────────────
  const screenFiles: Record<string, string> = {};
  const copyByScreen = content.copy.screens as Record<string, ContentCopyPlan["screens"][string]>;

  for (let i = 0; i < layoutPlan.screens.length; i++) {
    const screenPlan = layoutPlan.screens[i];
    const screenCopy = copyByScreen[screenPlan.id];
    const perScreenCopy: ScreenCopyPlan = screenCopy
      ? {
          heading: screenCopy.heading,
          subheading: screenCopy.subheading,
          ctas: screenCopy.ctas.map((c) => ({ label: c.label, variant: c.variant })),
          labels: screenCopy.labels,
        }
      : {
          heading: screenPlan.name,
          subheading: screenPlan.description,
          ctas: [],
          labels: {},
        };

    const result = await runStage(`stage-6-screen-${screenPlan.id}`, () =>
      composeScreenWithRetry(
        screenPlan,
        generatedComponents,
        tokens,
        content.data as MockDataset,
        perScreenCopy,
        discovery.productContext,
        2,
      ),
    );
    screenFiles[screenPlan.id] = result.screen;
    console.log(`  ${screenPlan.name}: composed (${result.retries} retries, ${result.screen.length} chars)`);
  }

  const screensDir = path.join(OUTPUT_DIR, "screens");
  fs.mkdirSync(screensDir, { recursive: true });
  for (const [name, code] of Object.entries(screenFiles)) {
    fs.writeFileSync(path.join(screensDir, `${name}.tsx`), code);
    recordArtifact(`screen-${name}.tsx`, path.join(screensDir, `${name}.tsx`), "tsx");
  }

  // ── Stage 7: Visual QA (render + critique) ─────────────────────────
  const visualQA = await runStage("stage-7-visual-qa", () =>
    runVisualQA({
      screenFiles,
      tokens,
      tokensCSS,
      brief,
      productContext: discovery.productContext,
      componentFiles: generatedComponents,
      catalogPage,
    }),
  );

  console.log(`  Screenshots: ${Object.keys(visualQA.screenshots).length}`);
  for (const [name, buf] of Object.entries(visualQA.screenshots)) {
    const ssPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    fs.writeFileSync(ssPath, buf);
    recordArtifact(`screenshot-${name}.png`, ssPath, "png");
    console.log(`    • ${name}.png (${buf.length} bytes)`);
  }

  console.log(`  Critique: avg ${visualQA.averageScore}/10 | passedAll: ${visualQA.passedAll}`);
  for (const r of visualQA.results) {
    console.log(`    • avg ${r.average} | passed ${r.passed} | failing: [${r.failingDimensions.join(", ") || "none"}]`);
  }
  if (visualQA.blockingDefects.length > 0) {
    for (const b of visualQA.blockingDefects) {
      console.log(`    ⚠ Blocking on ${b.screen}: ${b.defects.join("; ")}`);
      results.warnings.push(`Blocking defects on ${b.screen}: ${b.defects.join("; ")}`);
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "critique-results.json"), JSON.stringify(visualQA.results, null, 2));
  recordArtifact("critique-results.json", path.join(OUTPUT_DIR, "critique-results.json"), "json");
  fs.writeFileSync(path.join(OUTPUT_DIR, "visual-qa-feedback.json"), JSON.stringify(visualQA.feedback, null, 2));
  recordArtifact("visual-qa-feedback.json", path.join(OUTPUT_DIR, "visual-qa-feedback.json"), "json");

  // ── Stage 8: Finalize ───────────────────────────────────────────────
  const report = await runStage("stage-8-finalize", () =>
    finalize({
      projectId: `test2-${Date.now()}`,
      brief,
      tokens,
      tokensCSS,
      tailwindConfig,
      generatedFiles: generatedComponents,
      catalogPage,
      screenFiles,
      critiqueResults: visualQA.results,
      manifest: componentsManifest,
      brandKit: architecture.brandKit as unknown as Record<string, unknown>,
      visualQAResults: {
        averageScore: visualQA.averageScore,
        blockingDefects: visualQA.blockingDefects.flatMap((b) => b.defects),
      },
      contentReport: {
        dataItemCount: content.data.itemCount,
        copyScreenCount: Object.keys(content.copy.screens).length,
        hasSlop: !content.coherenceReport.valid,
      },
    }),
  );

  console.log(`  Export: ${report.exportPath}`);
  console.log(`  Components: ${report.componentCount} | Screens: ${report.screenCount} | Tokens: ${report.designTokenCount}`);
  console.log(`  Gates: ${JSON.stringify(report.qualityGates)}`);
  fs.writeFileSync(path.join(OUTPUT_DIR, "final-report.md"), report.summaryMarkdown);
  recordArtifact("final-report.md", path.join(OUTPUT_DIR, "final-report.md"), "md");

  // ── Cost / usage summary ────────────────────────────────────────────
  const ledger = ledgerFromUsage(usageRecords);
  const usageDetail = usageRecords.map((u) => {
    const cost = typeof u.costUsd === "number"
      ? u.costUsd
      : calcCostTokens(u.modelId, u.inputTokens, u.outputTokens).costDollars;
    return {
      role: u.role,
      model: u.modelId,
      inputTokens: u.inputTokens,
      outputTokens: u.outputTokens,
      imageBlocks: u.imageBlocks,
      costUsd: Math.round(cost * 100000) / 100000,
    };
  });
  const totalTokens = usageRecords.reduce((s, u) => s + u.inputTokens + u.outputTokens, 0);
  const modelCalls = usageRecords.length;

  console.log("\n── Usage ────────────────────────────────────────");
  console.log(`  Model calls: ${modelCalls} | Total tokens: ${totalTokens}`);
  console.log(`  Cost: $${ledger.totalDollars} (${ledger.totalCredits} credits)`);
  const byModel: Record<string, { calls: number; cost: number }> = {};
  for (const u of usageDetail) {
    byModel[u.model] ??= { calls: 0, cost: 0 };
    byModel[u.model].calls++;
    byModel[u.model].cost += u.costUsd;
  }
  for (const [model, stat] of Object.entries(byModel)) {
    console.log(`    ${model}: ${stat.calls} calls, $${Math.round(stat.cost * 10000) / 10000}`);
  }

  // ── Write run summary ──────────────────────────────────────────────
  const runEnd = new Date().toISOString();
  const totalDuration = Date.now() - new Date(RUN_START).getTime();
  const allStagesPassed = results.stages.every((s) => s.success);

  const runSummary = buildRunSummary({ runEnd, totalDuration, allStagesPassed, screenFiles, visualQA, report, usageDetail, byModel, ledger, modelCalls, totalTokens });

  fs.writeFileSync(
    path.join(TEST_DIR, "run-summary.json"),
    JSON.stringify(runSummary, null, 2),
  );

  // ── Diagnosis / findings markdown ──────────────────────────────────
  const diagnosisMd = generateDiagnosis(brief, discovery, runSummary, visualQA, report.qualityGates);
  fs.writeFileSync(path.join(TEST_DIR, "diagnosis.md"), diagnosisMd);

  // ── Print summary ──────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("E2E Test Complete");
  console.log(`Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`Stages: ${results.stages.filter((s) => s.success).length}/${results.stages.length} passed`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log(`Artifacts: ${results.artifacts.length}`);
  console.log(`Cost: $${ledger.totalDollars} (${ledger.totalCredits} credits)`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log("═══════════════════════════════════════════");
}

function generateDiagnosis(
  brief: Brief,
  discovery: { productContext: string; validationPassed: boolean; contextDescription: string },
  summary: ReturnType<typeof buildRunSummary>,
  visualQA: { averageScore: number; passedAll: boolean; blockingDefects: { screen: string; defects: string[] }[]; feedback: { screen: string; strengths: string[]; improvements: string[] }[]; results?: CritiqueResult[] },
  qualityGates?: { briefValidated: boolean; tokenGatePassed: boolean; componentGatePassed: boolean; screenGatePassed: boolean; antiSlopGatePassed: boolean },
): string {
  const verdict = summary.overallSuccess && visualQA.passedAll
    ? "PASSED"
    : summary.overallSuccess
      ? "PARTIAL — pipeline stages passed, but screens failed visual QA"
      : "FAILED";
  const lines: string[] = [
    `# Picasso V2 (New Agent) — E2E Test Findings`,
    ``,
    `**Run ID:** ${summary.runId}`,
    `**Started:** ${summary.startedAt}`,
    `**Completed:** ${summary.completedAt}`,
    `**Duration:** ${(summary.durationMs / 1000).toFixed(1)}s`,
    `**Overall:** ${verdict}`,
    `**Cost:** $${summary.usage.totalCostUsd} (${summary.usage.totalCredits} credits, ${summary.usage.modelCalls} model calls)`,
    ``,
    `## Test Brief`,
    `- **Product:** ${brief.productName}`,
    `- **Description:** ${brief.description}`,
    `- **Niche:** ${brief.niche} | **Personality:** ${brief.personality.join(", ")}`,
    `- **Context detected:** ${discovery.productContext}`,
    ``,
    `## Stage Results`,
    ``,
  ];

  for (const stage of summary.stages) {
    lines.push(`### ${stage.success ? "✓" : "✗"} ${stage.stage} (${(stage.durationMs / 1000).toFixed(1)}s)`);
    if (stage.error) lines.push(`- **Error:** ${stage.error}`);
    lines.push("");
  }

  lines.push(`## Critique Results`);
  lines.push(`- **Average score:** ${visualQA.averageScore}/10 | **Passed all:** ${visualQA.passedAll}`);
  if (visualQA.blockingDefects.length > 0) {
    lines.push(`- **Blocking defects:**`);
    for (const b of visualQA.blockingDefects) {
      lines.push(`  - ${b.screen}: ${b.defects.join("; ")}`);
    }
  }
  if (qualityGates) {
    lines.push(`- **Final quality gates:** ${JSON.stringify(qualityGates)}`);
  }
  lines.push("");

  lines.push(`## Screen Feedback`);
  lines.push("");
  for (const f of visualQA.feedback) {
    lines.push(`### ${f.screen}`);
    lines.push(`- **Strengths:** ${f.strengths.join(", ") || "none"}`);
    lines.push(`- **Improvements:** ${f.improvements.join(", ") || "none"}`);
    const perScreenResult = visualQA.results?.[visualQA.feedback.indexOf(f)];
    if (perScreenResult?.diagnosis) {
      lines.push(`- **Diagnosis:** ${perScreenResult.diagnosis}`);
    }
    lines.push("");
  }

  lines.push(`## Improvements & New Features`);
  lines.push("");
  lines.push(`### High Priority`);
  lines.push(`1. **E2B sandbox template fix** — \`Sandbox.create({ template: "node" })\` failed (404: template not found). Switched to the default \`code-interpreter-v1\` template which ships Node 20.`);
  lines.push(`2. **E2B chromium deps** — Puppeteer in the sandbox failed to launch Chromium (missing libnspr4/libnss3/etc). Added an \`apt-get install\` step before puppeteer use; otherwise every E2B render falls back to local Playwright.`);
  lines.push(`3. **E2B renderer was a no-op** — the old \`generatePreviewHTML\` never mounted the React screen (only a comment), producing blank screenshots. Stage 7 now bundles the real screen + components and passes the prebuilt HTML into the sandbox.`);
  lines.push(`4. **Stage 7 bundling omitted components** — \`renderScreen\` bundled the screen file alone, so any \`./button\`-style component import failed and fell back to placeholder SVGs. The vfs now includes all generated component files.`);
  lines.push(`5. **Per-screen copy wiring** — content stage produces \`copy.screens[screenId]\` but \`composeAllScreens\` expects one generic \`CopyPlan\` for every screen. The e2e composes per-screen with its own copy; the pipeline should accept per-screen copy natively.`);
  lines.push("");
  lines.push(`### Medium Priority`);
  lines.push(`6. **Usage/cost tracking** — pipeline stages never pass \`onUsage\`, so per-run cost is invisible to callers. The e2e wraps the gateway client to record usage; the pipeline should expose a usage hook for production runs.`);
  lines.push(`7. **Critique scoring fallback** — when the vision review agent fails, scores default to a flat 5.0 with ALL dimensions failing; a narrower fallback (retry once, then code-only review) would be more honest.`);
  lines.push(`8. **renderAllScreens is serial** — each screen renders in its own E2B sandbox sequentially; parallelizing with p-limit would cut the QA stage roughly in half.`);
  lines.push("");
  lines.push(`### Future Features`);
  lines.push(`9. **E2B sandbox reuse** — puppeteer install (~1-2 min) repeats per sandbox. A persistent sandbox or a pre-built template with puppeteer + deps would speed up renders.`);
  lines.push(`10. **Render quality gate** — \`validateScreenshotSet\` exists but scores are still attempted on blank/placeholder screenshots; gate should short-circuit scoring when a render falls back to SVG.`);
  lines.push("");

  lines.push(`## Issues Found`);
  lines.push("");
  if (summary.errors.length > 0) {
    for (const e of summary.errors) lines.push(`- **Error:** ${e}`);
  } else {
    lines.push(`- No stage errors.`);
  }
  for (const w of summary.warnings) {
    lines.push(`- ⚠ ${w}`);
  }
  lines.push("");

  lines.push(`## Run Details (Cost)`);
  lines.push("");
  lines.push(`| Model | Calls | Cost (USD) |`);
  lines.push(`|-------|-------|------------|`);
  for (const [model, stat] of Object.entries(summary.usage.byModel)) {
    lines.push(`| ${model} | ${stat.calls} | $${Math.round(stat.cost * 10000) / 10000} |`);
  }
  lines.push(`| **Total** | **${summary.usage.modelCalls}** | **$${summary.usage.totalCostUsd}** |`);
  lines.push(`- **Tokens:** ${summary.usage.totalTokens} (${summary.usage.totalCredits} credits)`);
  lines.push("");

  lines.push(`## Artifacts`);
  lines.push("");
  lines.push(`| File | Type | Size |`);
  lines.push(`|------|------|------|`);
  for (const a of summary.artifacts) {
    lines.push(`| ${a.name} | ${a.type} | ${a.size} bytes |`);
  }

  return lines.join("\n");
}

main().catch((err) => {
  console.error("\n═══════════════════════════════════════════");
  console.error("FATAL: E2E test crashed");
  console.error(err instanceof Error ? err.stack : String(err));
  console.error("═══════════════════════════════════════════");
  process.exit(1);
});

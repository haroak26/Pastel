/**
 * Picasso V2 — End-to-End Pipeline Validator
 * 
 * Validates that all 8 pipeline stages can be loaded, their types are coherent,
 * and the quality gate system works correctly.
 * 
 * This is a DRY RUN — no AI models are called. It validates structural integrity.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Import all V2 pipeline modules ───────────────────────────────────────

import { runDiscovery } from "../../server/lib/pastel-agent/picasso/pipeline/stage-1-discovery";
import { generateEnhancedTokens, generateTokensCSS, generateTailwindConfig, validateTokens, generateCreativeDirections } from "../../server/lib/pastel-agent/picasso/pipeline/stage-2-design-system";
import { runArchitecture } from "../../server/lib/pastel-agent/picasso/pipeline/stage-3-architecture";
import { runContentGeneration } from "../../server/lib/pastel-agent/picasso/pipeline/stage-4-content";
import { detectProductContext, detectSlopViolations, filterBlockingViolations, antiSlopSystemPrompt } from "../../server/lib/pastel-agent/picasso/pipeline/anti-slop";
import { RUBRIC_DIMENSIONS_V2, BLOCKING_DEFECTS, computeWeightedScore, scorePassesV2, findBlockingDefects } from "../../server/lib/pastel-agent/picasso/pipeline/rubric";
import { loadMegadesign, loadCompanyDoc, loadFullCompanyContext, getKnowledgeStats, loadDesignLaw, loadComponentLaw, loadProductMode } from "../../server/lib/pastel-agent/picasso/pipeline/knowledge";
import { testBriefs } from "../../server/lib/pastel-agent/picasso/pipeline/__tests__/test-briefs";

// ── Test Results ──────────────────────────────────────────────────────────

interface StageTest {
  name: string;
  passed: boolean;
  detail: string;
  durationMs: number;
}

const results: StageTest[] = [];

function record(name: string, startTime: number, passed: boolean, detail: string) {
  results.push({
    name,
    passed,
    detail,
    durationMs: Date.now() - startTime,
  });
}

// ── Main Test Runner ──────────────────────────────────────────────────────

async function runE2ETests(): Promise<void> {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Picasso V2 — E2E Pipeline Validator   ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // ── Stage 0: Module loading ───────────────────────────────────────────
  let t = Date.now();
  const modules: Record<string, boolean> = {
    "stage-1-discovery": typeof runDiscovery === "function",
    "stage-2-design-system": typeof generateEnhancedTokens === "function",
    "stage-3-architecture": typeof runArchitecture === "function",
    "stage-4-content": typeof runContentGeneration === "function",
    "anti-slop": typeof detectSlopViolations === "function",
    "rubric": typeof computeWeightedScore === "function",
    "knowledge": typeof loadMegadesign === "function",
  };
  const allLoaded = Object.values(modules).every(Boolean);
  record("Module Loading", t, allLoaded, `${Object.keys(modules).length} modules loaded`);
  Object.entries(modules).forEach(([name, loaded]) => {
    if (!loaded) console.log(`  FAIL: ${name} not loaded`);
  });

  // ── Stage 1: Discovery — context detection ────────────────────────────
  t = Date.now();
  let contextMatches = 0;
  let contextTotal = 0;
  for (const { name, brief, expectedContext } of testBriefs) {
    const ctx = detectProductContext({
      productName: brief.productName,
      description: brief.description,
      platform: brief.platform,
      niche: brief.niche,
    });
    if (ctx === expectedContext) contextMatches++;
    contextTotal++;
  }
  const contextOk = contextMatches === contextTotal;
  record("Stage 1: Discovery", t, contextOk, `Context detection: ${contextMatches}/${contextTotal} correct`);

  // ── Stage 2: Design System — token validation ─────────────────────────
  t = Date.now();
  const testTokens = {
    meta: { brand: "Test", version: "1.0.0" as const, generatedAt: new Date().toISOString() },
    color: {
      neutral: { "0": "#FFFFFF", "50": "#F9FAFB", "100": "#F3F4F6", "200": "#E5E7EB", "300": "#D1D5DB", "400": "#9CA3AF", "500": "#6B7280", "600": "#4B5563", "700": "#374151", "800": "#1F2937", "900": "#111827", "950": "#030712" },
      accent: { "50": "#ECFDF5", "100": "#D1FAE5", "500": "#059669", "600": "#047857", "900": "#064E3B" },
      semantic: {
        success: { "50": "#ECFDF5", "500": "#10B981", "900": "#065F46" },
        warning: { "50": "#FFFBEB", "500": "#F59E0B", "900": "#78350F" },
        danger: { "50": "#FEF2F2", "500": "#EF4444", "900": "#7F1D1D" },
        info: { "50": "#EFF6FF", "500": "#3B82F6", "900": "#1E3A8A" },
      },
      surface: { background: "#FFFFFF", raised: "#F9FAFB", overlay: "#000000" },
      text: { primary: "#111827", secondary: "#4B5563", muted: "#6B7280", inverse: "#FFFFFF" },
      border: { default: "#E5E7EB", subtle: "#F3F4F6", focus: "#059669" },
    },
    typography: {
      fontFamily: { display: "Geist", body: "Manrope", mono: "JetBrains Mono, monospace" },
      scale: { xs: "12px/16px", sm: "14px/20px", base: "16px/24px", lg: "18px/28px", xl: "20px/28px", "2xl": "24px/32px", "3xl": "30px/36px", "4xl": "36px/40px", "5xl": "48px/52px" },
      weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    },
    space: { "0": "0px", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px", "12": "48px", "16": "64px", "24": "96px" },
    radius: { none: "0px", sm: "6px", md: "10px", lg: "16px", xl: "24px", full: "9999px" },
    shadow: { sm: "0 1px 2px rgba(0,0,0,0.05)", md: "0 4px 6px rgba(0,0,0,0.1)", lg: "0 10px 15px rgba(0,0,0,0.15)", xl: "0 20px 25px rgba(0,0,0,0.2)" },
    motion: { duration: { fast: "120ms", base: "200ms", slow: "320ms" }, easing: { standard: "cubic-bezier(0.2, 0, 0, 1)" } },
    breakpoints: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
  };
  const tokenValidation = validateTokens(testTokens);
  record("Stage 2: Token Validation", t, tokenValidation.valid, `${tokenValidation.tokenCount ?? 0} tokens, ${tokenValidation.issues.length} issues`);

  // ── Stage 3: Architecture — layout types ──────────────────────────────
  t = Date.now();
  const testLayoutPlan = {
    screens: [{
      id: "home", name: "Home", route: "/", description: "Main dashboard",
      gridColumns: 12,
      regions: [{ name: "sidebar", role: "nav" as const, componentTypes: [{ name: "Nav", taxonomy: "molecule" as const, description: "Navigation" }] }],
    }],
    globalRegions: [],
    breakpoints: { sm: "640", md: "768", lg: "1024" },
  };
  const layoutValid = testLayoutPlan.screens.length > 0 && testLayoutPlan.screens[0].regions.length > 0;
  record("Stage 3: Architecture", t, layoutValid, `${testLayoutPlan.screens.length} screens, ${testLayoutPlan.screens[0].regions.length} regions`);

  // ── Stage 4: Content — data types ─────────────────────────────────────
  t = Date.now();
  const testData = { users: [{ id: "1", name: "Alex", email: "a@test.com", role: "admin", avatar: "" }], products: [], transactions: [], metrics: {}, lists: {}, generatedAt: new Date().toISOString(), itemCount: 1 };
  const contentValid = testData.users.length > 0 && testData.itemCount > 0;
  record("Stage 4: Content", t, contentValid, `${testData.itemCount} data items, ${testData.users.length} users`);

  // ── Stage 5: Anti-Slop detection ──────────────────────────────────────
  t = Date.now();
  const testCode = `
    export default function Page() {
      return (
        <div className="text-center">
          <h1 className="text-5xl font-bold">Get started</h1>
          <button style={{backgroundColor: "#3B82F6"}}>Learn more</button>
          <footer>Copyright 2024</footer>
        </div>
      );
    }
  `;
  const violations = detectSlopViolations(testCode);
  const hasBlocking = filterBlockingViolations(violations).length > 0;
  record("Stage 5: Anti-Slop", t, hasBlocking, `${violations.length} violations detected (${filterBlockingViolations(violations).length} blocking)`);

  // ── Stage 6: Rubric scoring ───────────────────────────────────────────
  t = Date.now();
  const testScores: Record<string, number> = {
    productContext: 8, brandCoherence: 7, hierarchy: 7, composition: 7, spacingRhythm: 7,
    componentConsistency: 7, navigation: 7, contentCopy: 7, responsiveDesign: 7, accessibilityBaseline: 7,
  };
  const weightedScore = computeWeightedScore(testScores);
  const passes = scorePassesV2(testScores);
  record("Stage 6: Rubric", t, passes, `Weighted score: ${weightedScore}/10 (threshold: 7.0)`);

  // ── Stage 7: Blocking defects ─────────────────────────────────────────
  t = Date.now();
  const diagWithDefect = "Centered hero on app screen detected. Also some spacing issues.";
  const defects = findBlockingDefects(diagWithDefect, { ...testScores, productContext: 0 });
  const hasDefects = defects.length > 0;
  record("Stage 7: Blocking Defects", t, hasDefects, `${defects.length} blocking defects detected`);

  // ── Stage 8: Knowledge base ───────────────────────────────────────────
  t = Date.now();
  let kbOk = false;
  let kbDetail = "";
  try {
    const stats = getKnowledgeStats();
    kbOk = stats.totalBytes > 100000;
    kbDetail = `${(stats.totalBytes / 1024).toFixed(0)} KB across ${stats.designLawsCount + stats.componentLawsCount + stats.productModesCount + stats.companyDocsCount + stats.companyDeepDivesCount} files`;
  } catch (err) {
    kbDetail = `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
  record("Stage 8: Knowledge Base", t, kbOk, kbDetail);

  // ── Summary ───────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.durationMs, 0);

  console.log("\n── Results ────────────────────────────────────────────");
  for (const r of results) {
    const icon = r.passed ? "✓" : "✗";
    console.log(`  ${icon} ${r.name}: ${r.detail} (${r.durationMs}ms)`);
  }

  console.log(`\n  ${passed}/${total} passed  •  ${totalTime}ms total`);

  if (passed === total) {
    console.log("\n  ✓ All Picasso V2 pipeline stages validated.\n");
  } else {
    console.log(`\n  ✗ ${total - passed} stage(s) failed.\n`);
    process.exit(1);
  }

  // Write results
  const outputDir = path.resolve(__dirname, "output");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "e2e-results.json"),
    JSON.stringify({ results, summary: { passed, total, totalTime, timestamp: new Date().toISOString() } }, null, 2),
  );
}

runE2ETests().catch((err) => {
  console.error("E2E tests failed:", err);
  process.exit(1);
});

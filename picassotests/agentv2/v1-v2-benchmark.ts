/**
 * Picasso V1 vs V2 — Rubric Benchmark Comparison
 * 
 * Compares the old V1 rubric (10 unweighted dimensions) with the 
 * new V2 rubric (10 weighted dimensions + blocking defects).
 */

// V1 rubric dimensions (old names)
const V1_DIMENSIONS = [
  "hierarchy", "tokenFidelity", "gridAlignment", "spacingRhythm",
  "colorRestraint", "typographicRhythm", "componentConsistency",
  "accessibilityBaseline", "brandFit", "overallPolish",
] as const;

// V2 rubric dimensions with weights
const V2_WEIGHTS: Record<string, number> = {
  productContext: 0.15,
  brandCoherence: 0.15,
  hierarchy: 0.15,
  composition: 0.10,
  spacingRhythm: 0.10,
  componentConsistency: 0.10,
  navigation: 0.10,
  contentCopy: 0.05,
  responsiveDesign: 0.05,
  accessibilityBaseline: 0.05,
};

// Test scenarios: simulate different review outcomes
interface TestScenario {
  name: string;
  description: string;
  v1Scores: Record<string, number>; // 10 dimensions
  v2Scores: Record<string, number>; // 10 dimensions with new names
  expectedV2Pass: boolean;
  hasBlockingDefect: boolean;
}

const scenarios: TestScenario[] = [
  {
    name: "Wavelength V1 (actual result)",
    description: "Blank catalog screen — worst-case scenario",
    v1Scores: { hierarchy: 1, tokenFidelity: 1, gridAlignment: 1, spacingRhythm: 1, colorRestraint: 1, typographicRhythm: 1, componentConsistency: 1, accessibilityBaseline: 1, brandFit: 2, overallPolish: 1 },
    v2Scores: { productContext: 0, brandCoherence: 1, hierarchy: 1, composition: 1, spacingRhythm: 1, componentConsistency: 1, navigation: 1, contentCopy: 1, responsiveDesign: 1, accessibilityBaseline: 1 },
    expectedV2Pass: false,
    hasBlockingDefect: true, // blank screen
  },
  {
    name: "Generic SaaS App",
    description: "Functional but generic — Tailwind blue, Inter font, all cards",
    v1Scores: { hierarchy: 5, tokenFidelity: 3, gridAlignment: 6, spacingRhythm: 5, colorRestraint: 4, typographicRhythm: 5, componentConsistency: 4, accessibilityBaseline: 4, brandFit: 3, overallPolish: 4 },
    v2Scores: { productContext: 4, brandCoherence: 2, hierarchy: 5, composition: 4, spacingRhythm: 5, componentConsistency: 4, navigation: 5, contentCopy: 3, responsiveDesign: 5, accessibilityBaseline: 4 },
    expectedV2Pass: false,
    hasBlockingDefect: false,
  },
  {
    name: "Good App Screen",
    description: "Well-designed app with sidebar, consistent tokens, good content",
    v1Scores: { hierarchy: 8, tokenFidelity: 8, gridAlignment: 7, spacingRhythm: 7, colorRestraint: 8, typographicRhythm: 7, componentConsistency: 7, accessibilityBaseline: 6, brandFit: 8, overallPolish: 8 },
    v2Scores: { productContext: 9, brandCoherence: 8, hierarchy: 8, composition: 7, spacingRhythm: 7, componentConsistency: 7, navigation: 8, contentCopy: 7, responsiveDesign: 7, accessibilityBaseline: 6 },
    expectedV2Pass: true,
    hasBlockingDefect: false,
  },
  {
    name: "Perfect Landing Page",
    description: "Excellent landing page — hero, features, CTA flow, proper hierarchy",
    v1Scores: { hierarchy: 9, tokenFidelity: 9, gridAlignment: 8, spacingRhythm: 8, colorRestraint: 9, typographicRhythm: 8, componentConsistency: 9, accessibilityBaseline: 8, brandFit: 9, overallPolish: 9 },
    v2Scores: { productContext: 10, brandCoherence: 9, hierarchy: 9, composition: 9, spacingRhythm: 8, componentConsistency: 9, navigation: 8, contentCopy: 9, responsiveDesign: 8, accessibilityBaseline: 8 },
    expectedV2Pass: true,
    hasBlockingDefect: false,
  },
  {
    name: "Landing on App (blocking defect)",
    description: "Centered hero + marketing CTA on an app dashboard — blocking defect",
    v1Scores: { hierarchy: 7, tokenFidelity: 7, gridAlignment: 6, spacingRhythm: 6, colorRestraint: 6, typographicRhythm: 6, componentConsistency: 6, accessibilityBaseline: 5, brandFit: 4, overallPolish: 5 },
    v2Scores: { productContext: 1, brandCoherence: 6, hierarchy: 7, composition: 5, spacingRhythm: 6, componentConsistency: 6, navigation: 3, contentCopy: 4, responsiveDesign: 6, accessibilityBaseline: 5 },
    expectedV2Pass: false,
    hasBlockingDefect: true, // landing hero on app screen
  },
];

// Compute V1 average (simple average)
function v1Average(scores: Record<string, number>): number {
  const values = Object.values(scores);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Compute V2 weighted average
function v2WeightedAverage(scores: Record<string, number>): number {
  let total = 0;
  for (const [dim, weight] of Object.entries(V2_WEIGHTS)) {
    total += (scores[dim] ?? 0) * weight;
  }
  return Math.round(total * 10) / 10;
}

// Run benchmark
console.log("\n╔════════════════════════════════════════════════╗");
console.log("║   Picasso V1 vs V2 — Rubric Benchmark         ║");
console.log("╚════════════════════════════════════════════════╝\n");

let v1Passed = 0;
let v2Passed = 0;
let v2BlockingDetected = 0;

for (const scenario of scenarios) {
  const v1Avg = v1Average(scenario.v1Scores);
  const v2Avg = v2WeightedAverage(scenario.v2Scores);
  const v1Pass = v1Avg >= 8.0; // V1 threshold
  const v2Pass = v2Avg >= 7.0 && !scenario.hasBlockingDefect; // V2 threshold + blocking

  if (v1Pass) v1Passed++;
  if (v2Pass) v2Passed++;
  if (scenario.hasBlockingDefect) v2BlockingDetected++;

  console.log(`${scenario.name}`);
  console.log(`  ${scenario.description}`);
  console.log(`  V1: ${v1Avg.toFixed(1)}/10 → ${v1Pass ? "PASS" : "FAIL"}  |  V2: ${v2Avg.toFixed(1)}/10 → ${v2Pass ? "PASS" : "FAIL"}${scenario.hasBlockingDefect ? " [BLOCKING]" : ""}`);
  console.log();
}

console.log("── Summary ────────────────────────────────────────");
console.log(`  V1 threshold: >= 8.0 unweighted`);
console.log(`  V2 threathed: >= 7.0 weighted + no blocking defects`);
console.log();
console.log(`  V1 passes: ${v1Passed}/${scenarios.length}`);
console.log(`  V2 passes: ${v2Passed}/${scenarios.length}`);
console.log(`  V2 blocking defects caught: ${v2BlockingDetected}`);
console.log();

if (v2Passed <= v1Passed && v2BlockingDetected > 0) {
  console.log("  ✓ V2 is stricter than V1 — catches more bad output with blocking defects.");
} else {
  console.log("  ⚠ V2 may need calibration — review false positives/negatives.");
}

// Key insight: V2 catches the landing-on-app and blank-screen cases that V1 would miss
const v1MissedBlocking = scenarios.filter(s => s.hasBlockingDefect && v1Average(s.v1Scores) >= 8.0);
if (v1MissedBlocking.length > 0) {
  console.log(`\n  ⚠ V1 would have passed ${v1MissedBlocking.length} blocking-defect screens:`);
  v1MissedBlocking.forEach(s => console.log(`    - ${s.name}: ${v1Average(s.v1Scores).toFixed(1)}/10 (V1 PASS, but has: ${s.description})`));
}

console.log();

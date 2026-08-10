import type { Brief } from "../types";
import { detectProductContext } from "../anti-slop";
import { testBriefs } from "./test-briefs";

export interface BenchmarkResult {
  name: string;
  expectedContext: string;
  detectedContext: string;
  contextMatch: boolean;
  briefValid: boolean;
  timestamp: string;
}

export function runBenchmarks(): { results: BenchmarkResult[]; summary: { total: number; passed: number; failed: number; failures: string[] } } {
  const results: BenchmarkResult[] = [];

  for (const { name, brief, expectedContext } of testBriefs) {
    const detectedContext = detectProductContext({
      productName: brief.productName,
      description: brief.description,
      platform: brief.platform,
      niche: brief.niche,
    });

    const contextMatch = detectedContext === expectedContext;
    const briefValid = validateBriefType(brief);

    results.push({
      name,
      expectedContext,
      detectedContext,
      contextMatch,
      briefValid,
      timestamp: new Date().toISOString(),
    });
  }

  const failures = results.filter(r => !r.contextMatch || !r.briefValid);

  return {
    results,
    summary: {
      total: results.length,
      passed: results.length - failures.length,
      failed: failures.length,
      failures: failures.map(f => `${f.name}: context=${f.contextMatch ? 'OK' : 'MISMATCH'}, type=${f.briefValid ? 'OK' : 'INVALID'}`),
    },
  };
}

function validateBriefType(brief: Brief): boolean {
  if (!brief.productName || typeof brief.productName !== "string") return false;
  if (!brief.description || typeof brief.description !== "string") return false;
  if (!brief.audience || typeof brief.audience !== "string") return false;
  if (!brief.niche || typeof brief.niche !== "string") return false;
  if (!Array.isArray(brief.personality) || brief.personality.length === 0) return false;
  if (!brief.density) return false;
  if (!brief.mode) return false;
  if (!brief.platform) return false;
  return true;
}

const isDirectRun = process.argv[1]?.includes("benchmark-runner");
if (isDirectRun) {
  const { summary } = runBenchmarks();
  console.log(`\n=== PICASSO V2 BENCHMARK RESULTS ===`);
  console.log(`Total: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);
  if (summary.failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of summary.failures) {
      console.log(`  - ${f}`);
    }
  }
  console.log("");
}

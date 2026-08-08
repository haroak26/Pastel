/**
 * V15 distinctness gate — standalone.
 *
 * Reads run-summary.json files under test/ (or PASTEL_DIVERSITY_DIR) and
 * fails when any two runs share nearly the same LAYOUT SIGNATURE (mode,
 * visual-intent axes, screen structures, dominant moments, grids). Two runs
 * that converge on the same UI shape are "the same product" even with
 * different content — that is the exact v14 defect this gate prevents.
 *
 *   npx tsx script/diversity-check.ts [dir]
 *
 * Exit 1 when a similar pair is found (set PASTEL_DIVERSITY_THRESHOLD to
 * loosen/tighten, default 0.8).
 */
import fs from "node:fs";
import path from "node:path";
import { diversityCheck } from "./e2e-v6";

const ROOT = path.resolve(process.argv[2] ?? process.cwd());
const THRESHOLD = Number(process.env.PASTEL_DIVERSITY_THRESHOLD) || 0.8;

const summaries: Array<{ dir: string; signature: Record<string, unknown> }> = [];
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const summaryPath = path.join(ROOT, entry.name, "run-summary.json");
  if (!fs.existsSync(summaryPath)) continue;
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    if (summary.layoutSignature) {
      summaries.push({ dir: entry.name, signature: summary.layoutSignature });
    }
  } catch {
    /* skip unreadable summaries */
  }
}

console.log(`diversity check: ${summaries.length} run(s) found in ${ROOT}`);
const { ok, pairs } = diversityCheck(summaries, THRESHOLD);
for (const p of pairs) {
  console.log(`  FAIL  ${p.a} ≈ ${p.b} (similarity ${p.similarity.toFixed(2)}) — same UI shape`);
}
if (ok) {
  console.log("  PASS  all runs are structurally distinct");
} else {
  console.log(`  ${pairs.length} similar pair(s) — the system converged on one UI shape`);
  process.exit(1);
}

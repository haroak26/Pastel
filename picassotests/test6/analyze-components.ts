/**
 * Component analysis: compare every generated component in a run against its
 * base shadcn source. Reuses the pipeline's own chunk-similarity metric.
 */
import fs from "node:fs";
import path from "node:path";

const RUN_DIR = path.resolve(process.argv[2] ?? "picassotests/test6/output/e2e-1-1786397271062");
const BASE_DIR = path.resolve("server/lib/pastel-agent/picasso/base-components/ui");

function sourceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (longer.length === 0) return 0;
  const CHUNK = 32;
  let matches = 0;
  let sampled = 0;
  const seen = new Set<number>();
  for (let i = 0; i + CHUNK <= shorter.length; i += CHUNK) {
    const chunk = shorter.slice(i, i + CHUNK);
    if (chunk.length < 16) continue;
    sampled += chunk.length;
    const idx = longer.indexOf(chunk);
    if (idx >= 0 && !seen.has(idx)) {
      matches += chunk.length;
      seen.add(idx);
    }
  }
  if (sampled === 0) return 0;
  return matches / Math.max(sampled, longer.length);
}

const manifest = JSON.parse(fs.readFileSync(path.join(RUN_DIR, "docs/planning/ComponentManifest.json"), "utf8"));
const entries: Array<{ id: string; name: string; taxonomy: string; baseComponent: string }> = manifest.entries ?? [];

const genDir = path.join(RUN_DIR, "src/components");
const rows: Array<{ id: string; base: string; taxonomy: string; sim: number; genLines: number; baseLines: number }> = [];
const byBase = new Map<string, number>();

for (const e of entries) {
  const genFile = path.join(genDir, `${e.id}.tsx`);
  const baseFile = path.join(BASE_DIR, `${e.baseComponent}.tsx`);
  if (!fs.existsSync(genFile)) continue;
  const gen = fs.readFileSync(genFile, "utf8");
  if (!fs.existsSync(baseFile)) {
    console.log(`${e.id}: NO BASE FILE ${e.baseComponent}`);
    continue;
  }
  const base = fs.readFileSync(baseFile, "utf8");
  const sim = sourceSimilarity(gen, base);
  rows.push({ id: e.id, base: e.baseComponent, taxonomy: e.taxonomy, sim, genLines: gen.split("\n").length, baseLines: base.split("\n").length });
  byBase.set(e.baseComponent, (byBase.get(e.baseComponent) ?? 0) + 1);
}

rows.sort((a, b) => b.sim - a.sim);

const verdict = (r: (typeof rows)[0]) => {
  if (r.sim >= 0.9) return r.taxonomy === "molecule" || r.taxonomy === "organism" ? "ESSENTIALLY BASE (gate violation)" : "NEAR-BASE";
  if (r.sim >= 0.7) return "lightly customized";
  if (r.sim >= 0.5) return "moderately customized";
  return "substantially rewritten";
};

console.log(`\n${rows.length} generated components vs their bases\n`);
console.log("ID | base | taxonomy | similarity | verdict | gen/base lines");
for (const r of rows) {
  console.log(`${r.id} | ${r.base} | ${r.taxonomy} | ${(r.sim * 100).toFixed(0)}% | ${verdict(r)} | ${r.genLines}/${r.baseLines}`);
}

const avg = rows.reduce((s, r) => s + r.sim, 0) / Math.max(1, rows.length);
const nearBase = rows.filter((r) => r.sim >= 0.9);
console.log(`\navg similarity: ${(avg * 100).toFixed(0)}%  · near-base (>=90%): ${nearBase.length}  · heavily rewritten (<50%): ${rows.filter((r) => r.sim < 0.5).length}`);
console.log(`bases reused: ${byBase.size} distinct base files for ${rows.length} components`);

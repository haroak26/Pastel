import { getRunState } from "../server/lib/pastel-agent/run-store";
const runId = process.argv[2] ?? "81372852-d658-4e3e-af44-b9d779cd3e46";
const state = await getRunState(runId);
const docs = state?.docs ?? [];
for (const d of docs) {
  if (d.path === "docs/planning/WireframePlan.json" || d.path === "docs/planning/LayoutPlan.json") {
    console.log(`\n=== ${d.path} ===`);
    console.log(d.content.slice(0, 4500));
  }
}
console.log("\n=== SCREEN FILES ===");
for (const f of state?.files ?? []) {
  if (f.path.startsWith("src/screens/")) {
    console.log(`--- ${f.path} (${f.content.length} chars)`);
    console.log(f.content.slice(0, 2200));
  }
}
console.log("\n=== COMPONENT FILES ===");
for (const f of state?.files ?? []) {
  if (f.path.startsWith("src/components/")) console.log(`  ${f.path} (${f.content.length} chars)`);
}

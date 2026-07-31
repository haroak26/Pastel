/** Offline repro: load a run's source files from DB and verify them twice incrementally. */
import { db } from "../server/db";
import { agentFiles } from "../shared/schema";
import { eq } from "drizzle-orm";
import { IncrementalScreenVerifier, listScreens } from "../server/lib/pastel-agent/sandbox";

async function main() {
  const runId = process.argv[2];
  if (!runId) throw new Error("usage: npx tsx script/verify-repro.ts <runId>");
  const rows = await db.select().from(agentFiles).where(eq(agentFiles.runId, runId));
  const files: Record<string, string> = {};
  for (const row of rows) {
    if (row.kind === "build") continue;
    if (!row.path.startsWith("src/")) continue;
    files[row.path] = row.content;
  }
  console.log("files:", Object.keys(files).length, "screens:", listScreens(files).join(", "));
  const verifier = new IncrementalScreenVerifier();
  const r1 = await verifier.verify(files);
  console.log("first verify: ok =", r1.ok, "| bundles:", Object.keys(r1.bundles).join(", ") || "none", "| errors:", JSON.stringify(r1.errors.slice(0, 3), null, 2));
  const r2 = await verifier.verify(files);
  console.log("second verify: ok =", r2.ok, "| bundles:", Object.keys(r2.bundles).join(", ") || "none", "| rebuilt:", r2.rebuilt.join(","), "| reused:", r2.reused.join(","));
  process.exit(0);
}
main().catch((err) => { console.error(err); process.exit(1); });

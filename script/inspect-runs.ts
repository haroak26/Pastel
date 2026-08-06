import { db } from "../server/db";
import { agentDocuments } from "../shared/schema";

async function main() {
  const rows = await db.select({ runId: agentDocuments.runId, path: agentDocuments.path, createdAt: agentDocuments.createdAt }).from(agentDocuments).limit(300);
  const plans = rows.filter((r) => r.path === "docs/planning/WireframePlan.json");
  for (const p of plans) console.log(String(p.createdAt).slice(0, 24), p.runId);
  const mine = rows.filter((r) => r.runId === "dc627751-d33b-418e-8009-0e536f817914");
  console.log("dc627751 docs:", mine.map((m) => m.path).join(", ") || "NONE");
}

main().catch((e) => { console.error(e); process.exit(1); });

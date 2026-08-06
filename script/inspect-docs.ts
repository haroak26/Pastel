import { db } from "../server/db";
import { agentDocuments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const RUN = process.env.RUN_ID ?? "dc627751-d33b-418e-8009-0e536f817914";
  const docs = await db.select({ path: agentDocuments.path, content: agentDocuments.content }).from(agentDocuments).where(eq(agentDocuments.runId, RUN));
  const plan = docs.find((d) => d.path === "docs/planning/WireframePlan.json");
  const copy = docs.find((d) => d.path === "docs/planning/CopyPlan.json");
  console.log("PLAN screen ids:", JSON.parse(plan!.content).screens.map((s: any) => s.id).join(", "));
  console.log("PLAN inventory:", JSON.parse(docs.find((d) => d.path === "docs/planning/ComponentInventory.json")!.content).components.map((c: any) => c.name).join(", "));
  console.log("COPY screens:", JSON.parse(copy!.content).screens.map((s: any) => s.screenId).join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });

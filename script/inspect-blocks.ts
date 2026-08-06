import { db } from "../server/db";
import { agentDocuments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const RUN = process.env.RUN_ID ?? "dc627751-d33b-418e-8009-0e536f817914";
  const docs = await db.select({ path: agentDocuments.path, content: agentDocuments.content }).from(agentDocuments).where(eq(agentDocuments.runId, RUN));
  const plan = JSON.parse(docs.find((d) => d.path === "docs/planning/WireframePlan.json")!.content);
  for (const s of plan.screens) {
    console.log(s.id + " [" + s.nav + "]: " + s.blocks.map((b) => b.block + ":" + b.variant + (b.component ? "[" + b.component + "]" : "") + (b.emphasis ? "*" : "")).join(", "));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

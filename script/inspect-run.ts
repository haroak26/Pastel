import { db } from "../server/db";
import { agentDocuments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const RUN = process.env.RUN_ID ?? "dc627751-d33b-418e-8009-0e536f817914";
  const [wp, inv] = await Promise.all([
    db.select().from(agentDocuments).where(eq(agentDocuments.path, "docs/planning/WireframePlan.json")).orderBy(agentDocuments.createdAt, "desc").limit(5),
    db.select().from(agentDocuments).where(eq(agentDocuments.path, "docs/planning/ComponentInventory.json")).orderBy(agentDocuments.createdAt, "desc").limit(5),


  ]);
  if (!wp[0] || !inv[0]) { console.log("docs missing"); return; }
  const plan = JSON.parse(wp[0].content);
  console.log("SCREENS:");
  for (const s of plan.screens) {
    console.log("  " + s.id + " [" + s.nav + "]: " + s.blocks.map((b) => b.block + (b.component ? "[" + b.component + "]" : ":" + b.variant)).join(", "));
  }
  const invDoc = JSON.parse(inv[0].content);
  console.log("INVENTORY (" + invDoc.components.length + "): " + invDoc.components.map((c) => c.name + "(" + c.basedOn + ")").join(", "));
  const mounted = new Set(plan.screens.flatMap((s) => s.blocks.filter((b) => b.block === "custom" && b.component).map((b) => b.component)));
  const unmounted = invDoc.components.filter((c) => !mounted.has(c.name)).map((c) => c.name);
  console.log("MOUNTED:", [...mounted].join(", "));
  console.log("UNMOUNTED:", unmounted.join(", ") || "none");
}

main().catch((e) => { console.error(e); process.exit(1); });

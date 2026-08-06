import { db } from "../server/db";
import { agentDocuments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const RUN = process.env.RUN_ID ?? "18717a15-4772-4bbf-bbe7-4b8513220e4c";
  const docs = await db.select({ path: agentDocuments.path, content: agentDocuments.content }).from(agentDocuments).where(eq(agentDocuments.runId, RUN));
  const cp = docs.find((d) => d.path === "docs/planning/CopyPlan.json");
  if (!cp) { console.log("no copy plan"); return; }
  const plan = JSON.parse(cp.content);
  for (const s of plan.screens) {
    console.log(s.screenId, "| headline:", s.headline, "| CTA:", s.primaryCta, "| overline:", s.overline);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

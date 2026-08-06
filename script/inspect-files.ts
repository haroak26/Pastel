import { db } from "../server/db";
import { agentFiles } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const RUN = process.env.RUN_ID ?? "dc627751-d33b-418e-8009-0e536f817914";
  const files = await db.select({ path: agentFiles.path, kind: agentFiles.kind }).from(agentFiles).where(eq(agentFiles.runId, RUN));
  console.log(files.map((f) => f.kind + ":" + f.path).join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });

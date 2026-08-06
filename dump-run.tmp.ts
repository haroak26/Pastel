import { db } from "/home/runner/workspace/server/db";
import { agentDocuments, agentFiles } from "/home/runner/workspace/shared/schema";
import { eq } from "drizzle-orm";

const RUN = process.env.RUN_ID ?? "5a3fd171-a773-4d21-9429-29bb975b2e6b";
const arg = process.argv.slice(2);
async function main() {
  if (arg.length && arg[0].includes(".json")) {
    const docs = await db.select().from(agentDocuments).where(eq(agentDocuments.runId, RUN));
    for (const d of docs) {
      if (arg.some((n) => d.path.includes(n))) console.log(`\n===== ${d.path} =====\n${d.content}`);
    }
  } else {
    const files = await db.select().from(agentFiles).where(eq(agentFiles.runId, RUN));
    for (const f of files) {
      if (arg.length && !arg.some((n) => f.path.includes(n))) continue;
      console.log(`\n===== ${f.path} =====\n${f.content}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

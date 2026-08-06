import { db } from "../server/db";
import { agentFiles } from "../shared/schema";
import { eq } from "drizzle-orm";
async function main() {
  const RUN = process.env.RUN_ID ?? "dc627751-d33b-418e-8009-0e536f817914";
  const files = await db.select({ path: agentFiles.path, content: agentFiles.content }).from(agentFiles).where(eq(agentFiles.runId, RUN));
  for (const f of files) {
    const i = f.content.indexOf("No runs yet");
    if (i !== -1) console.log(f.path, "=>", JSON.stringify(f.content.slice(Math.max(0, i - 200), i + 120)));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

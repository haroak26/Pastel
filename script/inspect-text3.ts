import { db } from "../server/db";
import { agentFiles } from "../shared/schema";
import { eq } from "drizzle-orm";
async function main() {
  const RUN = process.env.RUN_ID ?? "dc627751-d33b-418e-8009-0e536f817914";
  const files = await db.select({ path: agentFiles.path, content: agentFiles.content }).from(agentFiles).where(eq(agentFiles.runId, RUN));
  for (const f of files.filter((x) => x.path.startsWith("src/components/"))) {
    const i = f.content.indexOf("No runs yet");
    if (i !== -1) console.log("COMPONENT", f.path);
  }
  for (const f of files.filter((x) => x.path.startsWith("src/screens/"))) {
    console.log(f.path, "imports:", [...f.content.matchAll(/import\s+([A-Za-z0-9_]+)\s+from/g)].map((m) => m[1]).join(", "));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

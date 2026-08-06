import { db } from "../server/db";
import { agentFiles } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const RUN = process.env.RUN_ID ?? "dc627751-d33b-418e-8009-0e536f817914";
  const files = await db.select({ path: agentFiles.path, content: agentFiles.content }).from(agentFiles).where(eq(agentFiles.runId, RUN));
  for (const f of files.filter((x) => x.path.startsWith("src/screens/"))) {
    const m = f.content.match(/\b0(?:\.0)?\s*(?:km|mi|m|min|kcal|cal|steps?|count)\b/i);
    if (m) {
      const i = f.content.indexOf(m[0]);
      console.log(f.path, "=>", JSON.stringify(f.content.slice(Math.max(0, i - 120), i + 60)));
    }
  }
  console.log("--- data.js zero-ish:");
  const data = files.find((x) => x.path === "src/data.js")!.content;
  for (const m of data.matchAll(/"[^"]*0(?:\.0)?\s*(km|min|kcal|mi|count)[^"]*"/gi)) console.log(m[0]);
}

main().catch((e) => { console.error(e); process.exit(1); });

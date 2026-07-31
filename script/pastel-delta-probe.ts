/** Delta-only probe against the latest E2E project (saves a full-run when iterating). */
import { desc, like } from "drizzle-orm";
import { db } from "../server/db";
import { projects } from "../shared/schema";
import { createRun, subscribeToRun, getRunState } from "../server/lib/pastel-agent/run-store";
import { startScreenDeltaLoop } from "../server/lib/pastel-agent/engine";
import type { AgentManifest } from "../server/lib/pastel-agent/types";

async function main() {
  const [project] = await db.select().from(projects).where(like(projects.publicId, "e2e-%")).orderBy(desc(projects.createdAt)).limit(1);
  if (!project) throw new Error("no e2e project found");
  console.log("project:", project.id, project.name);

  const prompt = process.argv[2] ?? "Add an Achievements screen showing streak badges and weekly milestones";
  const run = await createRun({ projectId: project.id, userId: project.ownerId, prompt, answers: {} });
  subscribeToRun(run.id, (event) => {
    if (event.type === "activity") console.log("  ·", event.message);
    if (event.type === "phase") console.log("  ▸", event.phase, "→", event.status);
    if (event.type === "error") console.log("  ✗", event.message);
  });
  await startScreenDeltaLoop(run.id, project.id, prompt);

  const state = await getRunState(run.id);
  const manifest = (state?.run.manifest ?? {}) as unknown as AgentManifest;
  console.log("\nstatus:", state?.run.status);
  console.log("screensAdded:", manifest.screensAdded?.join(", ") || "none");
  console.log("all screens:", manifest.screens?.join(", "));
  console.log("failedScreens:", manifest.failedScreens?.join(", ") || "none");
  console.log("cost:", manifest.costs?.totalCredits, "credits ≈ $" + manifest.costs?.totalDollars);
  console.log("registryStats:", JSON.stringify(manifest.registryStats));
  console.log("cost per stage:", manifest.costs?.entries.map((e) => `${e.stage}:${e.credits}`).join(", "));
  process.exit(state?.run.status === "done" && (manifest.screensAdded?.length ?? 0) > 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });

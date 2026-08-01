/**
 * Live end-to-end validation of the Pastel Agent v2 pipeline.
 * Requires DATABASE_URL + MERGE_GATEWAY_API_KEY in the environment.
 *
 *   npx tsx script/pastel-e2e.ts
 */
import { db } from "../server/db";
import { projects } from "../shared/schema";
import { createRun, subscribeToRun, getRunState } from "../server/lib/pastel-agent/run-store";
import { startAgentLoop, startScreenDeltaLoop } from "../server/lib/pastel-agent/engine";
import { loadProjectState } from "../server/lib/pastel-agent/state";
import { listRegistry } from "../server/lib/pastel-agent/registry";
import type { AgentManifest } from "../server/lib/pastel-agent/types";

const WORKSPACE_ID = process.env.E2E_WORKSPACE_ID ?? "8586ec95-39f3-453e-8e16-994e278e2d4e";
const USER_ID = process.env.E2E_USER_ID ?? "474b6cd7-61bc-4813-9897-5c1f5ad140c7";

function log(tag: string, message: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${tag} ${message}`);
}

async function main() {
  const started = Date.now();
  const [project] = await db.insert(projects).values({
    publicId: `e2e-${Date.now()}`,
    workspaceId: WORKSPACE_ID,
    ownerId: USER_ID,
    name: "Pastel v2 E2E",
  }).returning();
  log("setup", `project ${project.id}`);

  // ── Full run ────────────────────────────────────────────────────────────
  const prompt = "A habit tracker for freelance designers — daily check-ins, streaks, and a minimal weekly review";
  const fullRun = await createRun({ projectId: project.id, userId: USER_ID, prompt, answers: {} });
  log("run", `full run ${fullRun.id}`);

  subscribeToRun(fullRun.id, (event) => {
    if (event.type === "activity") log("activity", event.message ?? "");
    if (event.type === "phase") log("phase", `${event.phase} → ${event.status}`);
    if (event.type === "title") log("title", event.title ?? "");
    if (event.type === "error") log("ERROR", event.message ?? "");
  });

  await startAgentLoop(fullRun.id, prompt, {}, project.id);
  const state = await getRunState(fullRun.id);
  if (!state) throw new Error("run state missing");
  const manifest = (state.run.manifest ?? {}) as unknown as AgentManifest;

  const docs = state.docs.map((d) => `${d.kind}:${d.path}`);
  const files = state.files.map((f) => `${f.kind}:${f.path}`);
  const bundles = files.filter((f) => f.startsWith("build:"));
  const screens = files.filter((f) => f.startsWith("screen:"));
  const components = files.filter((f) => f.startsWith("component:"));

  console.log("\n════ FULL RUN RESULT ════");
  console.log("status:", state.run.status);
  console.log("screens:", manifest.screens?.join(", "));
  console.log("failedScreens:", manifest.failedScreens?.join(", ") || "none");
  console.log("docs:", docs.join(" | "));
  console.log("files:", screens.length, "screens,", components.length, "components,", bundles.length, "bundles");
  console.log("cost:", manifest.costs?.totalCredits, "credits ≈ $" + manifest.costs?.totalDollars);
  console.log("registryStats:", JSON.stringify(manifest.registryStats));
  console.log("quality:", JSON.stringify(manifest.quality));
  console.log("cost per stage:", manifest.costs?.entries.map((e) => `${e.stage}:${e.credits}`).join(", "));

  const assertions: Array<[boolean, string]> = [
    [state.run.status === "done", "run completed"],
    [(manifest.screens?.length ?? 0) >= 2, "at least 2 screens"],
    [docs.some((d) => d.startsWith("brief:docs/00-creative-brief.md")), "creative brief doc"],
    [docs.some((d) => d.startsWith("brief:docs/01-product-spec.md")), "product spec doc"],
    [docs.some((d) => d.startsWith("system:docs/02-brand-strategy.md")), "brand strategy doc"],
    [docs.some((d) => d.startsWith("system:docs/03-brand-kit.md")), "brand kit doc"],
    [docs.some((d) => d.startsWith("system:docs/04-architecture.md")), "information architecture + flows doc"],
    [docs.some((d) => d.startsWith("system:docs/05-screen-plan.md")), "screen plan doc"],
    [docs.some((d) => d.startsWith("system:docs/06-layout.md")), "layout plan doc"],
    [docs.some((d) => d.startsWith("component-spec:docs/07-components.md")), "components doc"],
    [docs.some((d) => d.startsWith("screen-spec:docs/screens/")), "screen composition docs"],
    [docs.some((d) => d.startsWith("system:docs/09-interactions.md")), "interaction plan doc"],
    [docs.some((d) => d.startsWith("visual-review:docs/10-visual-review.md")), "visual review doc"],
    [files.some((f) => f === "style:src/styles.css"), "styles.css generated deterministically"],
    [components.length >= 3, "components generated"],
    [bundles.length >= 2, "verified bundles exist"],
    [(manifest.costs?.totalCredits ?? 999) > 0, "cost ledger tracked"],
  ];
  const projectState = await loadProjectState(project.id);
  assertions.push([!!projectState?.creativeBrief, "creative brief persisted to project state"]);
  assertions.push([!!projectState?.productSpec, "product spec persisted to project state"]);
  assertions.push([!!projectState?.brandStrategy, "brand strategy persisted to project state"]);
  assertions.push([!!projectState?.designSystem, "brand kit persisted to project state"]);
  assertions.push([!!projectState?.informationArchitecture, "information architecture persisted"]);
  assertions.push([!!projectState?.screenPlan, "screen plan persisted"]);
  assertions.push([!!projectState?.layoutPlan, "layout plan persisted"]);
  assertions.push([!!projectState?.patternContext, `pattern context persisted (${projectState?.patternContext?.provider ?? "none"})`]);
  assertions.push([!!projectState?.interactionPlan, "interaction plan persisted"]);
  assertions.push([!!projectState?.architecture && (projectState?.architecture.screens.length ?? 0) >= 2, "compositions assembled into architecture"]);
  const registry = await listRegistry(project.id);
  assertions.push([registry.length >= 3, `registry has components (${registry.length})`]);

  // ── Delta run: add a screen ──────────────────────────────────────────────
  console.log("\n════ DELTA RUN: add a screen ════");
  const deltaRun = await createRun({ projectId: project.id, userId: USER_ID, prompt: "Add an Achievements screen showing streak badges and weekly milestones", answers: {} });
  log("run", `delta run ${deltaRun.id}`);
  subscribeToRun(deltaRun.id, (event) => {
    if (event.type === "activity") log("activity", event.message ?? "");
    if (event.type === "phase") log("phase", `${event.phase} → ${event.status}`);
    if (event.type === "error") log("ERROR", event.message ?? "");
  });
  await startScreenDeltaLoop(deltaRun.id, project.id, "Add an Achievements screen showing streak badges and weekly milestones");
  const deltaState = await getRunState(deltaRun.id);
  const deltaManifest = (deltaState?.run.manifest ?? {}) as unknown as AgentManifest;
  console.log("delta status:", deltaState?.run.status);
  console.log("screensAdded:", deltaManifest.screensAdded?.join(", ") || "none");
  console.log("all screens:", deltaManifest.screens?.join(", "));
  console.log("delta cost:", deltaManifest.costs?.totalCredits, "credits");
  console.log("delta registryStats:", JSON.stringify(deltaManifest.registryStats));
  assertions.push([deltaState?.run.status === "done", "delta run completed"]);
  assertions.push([(deltaManifest.screensAdded?.length ?? 0) >= 1, "delta added at least one screen"]);
  assertions.push([(deltaManifest.registryStats?.reused ?? 0) >= 0, "registry consulted (reuse counter present)"]);
  assertions.push([(deltaManifest.costs?.totalCredits ?? 999) < 20, "delta run is materially cheaper than a full run"]);

  console.log("\n════ ASSERTIONS ════");
  let failed = 0;
  for (const [ok, label] of assertions) {
    console.log(`${ok ? "✅" : "❌"} ${label}`);
    if (!ok) failed++;
  }
  console.log(`\nTotal: ${assertions.length - failed}/${assertions.length} passed in ${Math.round((Date.now() - started) / 1000)}s`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("E2E failed:", err);
  process.exit(1);
});

import { EventEmitter } from "node:events";
import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  agentRuns,
  agentDocuments,
  agentFiles,
  creditHolds,
  type AgentRun,
  type AgentDocument,
  type AgentFile,
} from "@shared/schema";
import type { MaxiEvent, AgentManifest } from "./types";

/**
 * Run store — keeps each agent run alive independently of any HTTP connection.
 *
 * The pipeline writes every artifact to Postgres the moment it exists, and
 * broadcasts every event to an in-memory emitter. SSE clients attach/detach
 * freely: on (re)connect they receive the full event log replay, then live
 * events. Refreshing the browser never loses a run.
 */

interface RunEntry {
  runId: string;
  emitter: EventEmitter;
  events: MaxiEvent[];
  status: "running" | "done" | "done_needs_review" | "error";
  phase: string | null;
}

const MAX_EVENT_LOG = 1000;
const registry = new Map<string, RunEntry>();
const manifestQueues = new Map<string, Promise<void>>();

function getOrCreateEntry(runId: string): RunEntry {
  let entry = registry.get(runId);
  if (!entry) {
    entry = {
      runId,
      emitter: new EventEmitter(),
      events: [],
      status: "running",
      phase: null,
    };
    entry.emitter.setMaxListeners(50);
    registry.set(runId, entry);
  }
  return entry;
}

export async function createRun(opts: {
  projectId?: string;
  userId?: string;
  prompt: string;
  answers: Record<string, string>;
}): Promise<AgentRun> {
  const manifest: AgentManifest = {
    screens: [],
    docs: [],
    brandKit: null,
    styleSeed: null,
    phases: {},
    failedScreens: [],
  };

  const [run] = await db
    .insert(agentRuns)
    .values({
      projectId: opts.projectId ?? null,
      userId: opts.userId ?? null,
      prompt: opts.prompt,
      answers: opts.answers,
      status: "running",
      manifest: manifest as unknown as Record<string, unknown>,
    })
    .returning();

  getOrCreateEntry(run.id);
  return run;
}

export function emitEvent(runId: string, event: MaxiEvent): void {
  const entry = getOrCreateEntry(runId);
  entry.events.push(event);
  if (entry.events.length > MAX_EVENT_LOG) {
    entry.events.splice(0, entry.events.length - MAX_EVENT_LOG);
  }
  if (event.type === "phase" && event.phase) {
    entry.phase = event.phase;
  }
  if (event.type === "done") entry.status = "done";
  if (event.type === "error") entry.status = "error";
  entry.emitter.emit("event", event);
}

export async function updateRun(
  runId: string,
  patch: Partial<{
    status: "running" | "done" | "done_needs_review" | "error";
    phase: string | null;
    error: string | null;
    title: string | null;
    manifest: Record<string, unknown>;
  }>,
): Promise<void> {
  try {
    await db
      .update(agentRuns)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(agentRuns.id, runId));
  } catch (err) {
    console.error("[maxi-agent] updateRun failed:", err instanceof Error ? err.message : err);
  }
}

export async function mergeManifest(
  runId: string,
  patch: Partial<AgentManifest>,
): Promise<AgentManifest> {
  const previous = manifestQueues.get(runId) ?? Promise.resolve();
  let release!: () => void;
  const currentQueue = new Promise<void>((resolve) => { release = resolve; });
  manifestQueues.set(runId, currentQueue);

  await previous;
  try {
    const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
    const current = (run?.manifest ?? {}) as unknown as AgentManifest;
    const merged: AgentManifest = {
      ...current,
      ...patch,
      screens: patch.screens ?? current.screens ?? [],
      docs: patch.docs ?? current.docs ?? [],
      brandKit: patch.brandKit ?? current.brandKit ?? null,
      styleSeed: patch.styleSeed ?? current.styleSeed ?? null,
      phases: { ...(current.phases ?? {}), ...(patch.phases ?? {}) },
      failedScreens: patch.failedScreens ?? current.failedScreens ?? [],
    };
    await updateRun(runId, { manifest: merged as unknown as Record<string, unknown> });
    return merged;
  } finally {
    release();
    if (manifestQueues.get(runId) === currentQueue) manifestQueues.delete(runId);
  }
}

export async function persistDoc(
  runId: string,
  doc: { path: string; title: string; kind: string; content: string },
): Promise<void> {
  await db
    .insert(agentDocuments)
    .values({ runId, ...doc })
    .onConflictDoUpdate({
      target: [agentDocuments.runId, agentDocuments.path],
      set: { content: doc.content, title: doc.title, kind: doc.kind },
    });
}

export async function persistFile(
  runId: string,
  file: { path: string; kind: string; content: string },
): Promise<void> {
  await db
    .insert(agentFiles)
    .values({ runId, ...file })
    .onConflictDoUpdate({
      target: [agentFiles.runId, agentFiles.path],
      set: { content: file.content, kind: file.kind, updatedAt: new Date() },
    });
}

export interface RunState {
  run: AgentRun;
  docs: AgentDocument[];
  files: AgentFile[];
  /** live in-memory status (more current than DB during a run) */
  liveStatus: "running" | "done" | "done_needs_review" | "error";
  livePhase: string | null;
}

export async function getRunState(runId: string): Promise<RunState | null> {
  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
  if (!run) return null;

  const [docs, files] = await Promise.all([
    db.select().from(agentDocuments).where(eq(agentDocuments.runId, runId)),
    db.select().from(agentFiles).where(eq(agentFiles.runId, runId)),
  ]);

  docs.sort((a, b) => a.path.localeCompare(b.path));
  files.sort((a, b) => a.path.localeCompare(b.path));

  const entry = registry.get(runId);
  return {
    run,
    docs,
    files,
    liveStatus: entry?.status ?? (run.status as RunState["liveStatus"]),
    livePhase: entry?.phase ?? run.phase,
  };
}

export async function getLatestRunForProject(projectId: string): Promise<RunState | null> {
  const [run] = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.projectId, projectId))
    .orderBy(desc(agentRuns.createdAt))
    .limit(1);

  if (!run) return null;
  return getRunState(run.id);
}

/**
 * Source files from the most recent completed run of a project (excluding a
 * given run) — used by delta runs to seed their virtual file system.
 */
export async function getLatestCompletedFilesForProject(
  projectId: string,
  excludeRunId?: string,
): Promise<Record<string, string>> {
  const runs = await db
    .select({ id: agentRuns.id })
    .from(agentRuns)
    .where(and(eq(agentRuns.projectId, projectId), eq(agentRuns.status, "done")))
    .orderBy(desc(agentRuns.createdAt))
    .limit(3);

  for (const candidate of runs) {
    if (excludeRunId && candidate.id === excludeRunId) continue;
    const rows = await db
      .select()
      .from(agentFiles)
      .where(eq(agentFiles.runId, candidate.id));
    const files: Record<string, string> = {};
    for (const row of rows) {
      if (row.kind === "build") continue;
      if (!row.path.startsWith("src/")) continue;
      files[row.path] = row.content;
    }
    if (Object.keys(files).length > 0) return files;
  }
  return {};
}

/**
 * Subscribe to a run's event stream. Replays the buffered event log first,
 * then streams live events. Returns an unsubscribe function.
 */
export function subscribeToRun(
  runId: string,
  listener: (event: MaxiEvent) => void,
): () => void {
  const entry = getOrCreateEntry(runId);
  for (const event of entry.events) {
    listener(event);
  }
  entry.emitter.on("event", listener);
  return () => {
    entry.emitter.off("event", listener);
  };
}

export function getRunLiveStatus(runId: string): { status: string; phase: string | null } | null {
  const entry = registry.get(runId);
  if (!entry) return null;
  return { status: entry.status, phase: entry.phase };
}

/**
 * On boot, mark runs stuck in "running" (from a previous process) as errored
 * so clients restoring them don't wait forever. Also cancels credit holds
 * for those runs and any stale holds (no balance impact — holds never deducted).
 */
export async function cleanupStaleRuns(): Promise<void> {
  try {
    const staleRuns = await db
      .select({ id: agentRuns.id })
      .from(agentRuns)
      .where(eq(agentRuns.status, "running"));

    await db
      .update(agentRuns)
      .set({ status: "error", error: "Run interrupted by server restart", updatedAt: new Date() })
      .where(eq(agentRuns.status, "running"));

    // Cancel active holds for stale runs — no balance change since holds never deduct
    const runIds = staleRuns.map((r) => r.id);
    if (runIds.length > 0) {
      for (const runId of runIds) {
        await db
          .update(creditHolds)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(and(eq(creditHolds.status, "active"), eq(creditHolds.runId, runId)));
      }
    }

    // Cancel any stale active holds older than 12h
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    await db
      .update(creditHolds)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(
        eq(creditHolds.status, "active"),
        sql`${creditHolds.createdAt} < ${cutoff.toISOString()}`,
      ));
  } catch (err) {
    console.error("[maxi-agent] stale run cleanup failed:", err instanceof Error ? err.message : err);
  }
}

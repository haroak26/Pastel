/**
 * V8 run statistics + checkpointing (§4.3) — per-stage wall time, the
 * furthest stage reached, and the checkpoint document persisted to the run's
 * doc store as each stage completes. A killed run writes a partial summary
 * (status "killed") instead of losing cost/usage data, and a resumed run
 * skips stages whose artifacts already exist.
 */

export type StageStatus = "running" | "done" | "degraded" | "skipped" | "awaiting-approval" | "cancelled";

export interface StageRecord {
  status: StageStatus;
  wallMs: number;
}

export interface RunStatsJson {
  status: "running" | "killed" | "done" | "cancelled" | "error";
  stageReached: string;
  wallSeconds: number;
  stages: Record<string, StageRecord>;
  startedAt: string;
  updatedAt: string;
  /** Optional host-provided accounting (model calls / cost) merged in. */
  modelCalls?: number;
  totalCredits?: number;
  totalDollars?: number;
}

export class RunStats {
  private stages: Record<string, StageRecord> = {};
  private active: Record<string, number> = {};
  private status: RunStatsJson["status"] = "running";
  readonly startedAt = new Date().toISOString();

  start(stage: string): void {
    this.active[stage] = Date.now();
    this.stages[stage] = { status: "running", wallMs: 0 };
  }

  end(stage: string, status: StageStatus = "done"): void {
    const started = this.active[stage];
    const wallMs = started !== undefined ? Date.now() - started : 0;
    delete this.active[stage];
    this.stages[stage] = { status, wallMs };
  }

  mark(stage: string, status: StageStatus): void {
    if (this.stages[stage]?.status === "running") {
      this.end(stage, status);
    } else {
      this.stages[stage] = { status, wallMs: this.stages[stage]?.wallMs ?? 0 };
    }
  }

  setStatus(status: RunStatsJson["status"]): void {
    this.status = status;
  }

  get stageReached(): string {
    let reached = "init";
    for (const [name, rec] of Object.entries(this.stages)) {
      if (rec.status === "done" || rec.status === "awaiting-approval") reached = name;
    }
    if (Object.keys(this.active).length > 0) {
      for (const name of Object.keys(this.active)) {
        if (this.stages[name]?.status === "running") reached = name;
      }
    }
    return reached;
  }

  get wallMs(): number {
    return Date.now() - new Date(this.startedAt).getTime();
  }

  wallTimeByStage(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [name, rec] of Object.entries(this.stages)) out[name] = rec.wallMs;
    return out;
  }

  /** Status of a stage (or null when never started). */
  stageStatus(name: string): StageStatus | null {
    return this.stages[name]?.status ?? null;
  }

  toJSON(accounting?: { modelCalls?: number; totalCredits?: number; totalDollars?: number }): RunStatsJson {
    return {
      status: this.status,
      stageReached: this.stageReached,
      wallSeconds: Math.round((this.wallMs / 1000) * 10) / 10,
      stages: this.stages,
      startedAt: this.startedAt,
      updatedAt: new Date().toISOString(),
      ...(accounting ?? {}),
    };
  }
}

/** Persist the checkpoint document via the run's doc-store hook. */
export async function writeCheckpoint(
  hooks: { persistDoc(path: string, title: string, kind: string, content: string): Promise<void> | void },
  stats: RunStats,
): Promise<void> {
  try {
    await hooks.persistDoc(
      "docs/checkpoints/checkpoint.json",
      "Run Checkpoint",
      "checkpoint",
      JSON.stringify(stats.toJSON(), null, 2),
    );
  } catch {
    // checkpoint persistence must never break the pipeline
  }
}

/**
 * Maxi Agent v23 — run timing instrumentation.
 *
 * Records wall-clock ms per stage, grouped into the v23 waves. Persisted
 * into the run manifest + docs/timing/TimingReport.json so future regressions
 * are visible per-wave, not just as one aggregate number.
 */

export interface TimingStage {
  wave: number;
  stage: string;
  ms: number;
  /** Optional detail — call counts, KB-slice sizes, etc. */
  note?: string;
}

export interface TimingReport {
  wallSeconds: number;
  stages: TimingStage[];
}

export class RunTiming {
  private stages: TimingStage[] = [];
  private start = Date.now();
  private current: { wave: number; stage: string; at: number; note?: string } | null = null;

  begin(wave: number, stage: string, note?: string): void {
    this.end();
    this.current = { wave, stage, at: Date.now(), note };
  }

  end(note?: string): void {
    if (!this.current) return;
    this.stages.push({
      wave: this.current.wave,
      stage: this.current.stage,
      ms: Date.now() - this.current.at,
      ...(note ? { note } : this.current.note ? { note: this.current.note } : {}),
    });
    this.current = null;
  }

  /** End the open stage without recording (on failure paths). */
  cancel(): void {
    this.current = null;
  }

  stageNote(note: string): void {
    if (this.current) this.current = { ...this.current, note };
  }

  report(): TimingReport {
    this.end();
    return { wallSeconds: Math.round((Date.now() - this.start) / 100) / 10, stages: this.stages };
  }
}

/** Sum of stage ms for one wave (for per-wave logging). */
export function waveMs(report: TimingReport, wave: number): number {
  return report.stages.filter((s) => s.wave === wave).reduce((n, s) => n + s.ms, 0);
}

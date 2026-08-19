import React, { useState, useMemo } from "react";
import { Activity, ArrowDown, ArrowUp, ChevronDown, ChevronUp, Gauge, Heart, Zap } from "lucide-react";

interface SplitItem {
  split?: number;
  lap?: number;
  distance: string;
  pace: string;
  hr: number;
  cadence?: number;
  gct?: number;
  variance: number;
  status?: string;
}

interface SplitTableProps {
  splits?: SplitItem[];
  targetPace?: string;
  className?: string;
}

const DEFAULT_SPLITS: SplitItem[] = [
  { split: 1, distance: "400m", pace: "2:50", hr: 168, cadence: 194, gct: 190, variance: -1.2, status: "Ahead" },
  { split: 2, distance: "400m", pace: "2:51", hr: 172, cadence: 196, gct: 189, variance: -0.8, status: "Ahead" },
  { split: 3, distance: "400m", pace: "2:52", hr: 175, cadence: 195, gct: 191, variance: 0.0, status: "Locked" },
  { split: 4, distance: "400m", pace: "2:52", hr: 177, cadence: 194, gct: 192, variance: 0.0, status: "Locked" },
  { split: 5, distance: "400m", pace: "2:53", hr: 180, cadence: 193, gct: 193, variance: 0.4, status: "Locked" },
  { split: 6, distance: "400m", pace: "2:51", hr: 182, cadence: 195, gct: 190, variance: -0.6, status: "Ahead" },
  { split: 7, distance: "400m", pace: "2:52", hr: 184, cadence: 194, gct: 192, variance: 0.0, status: "Locked" },
  { split: 8, distance: "400m", pace: "2:54", hr: 186, cadence: 192, gct: 195, variance: 1.1, status: "Fade" },
  { split: 9, distance: "400m", pace: "2:53", hr: 187, cadence: 193, gct: 194, variance: 0.5, status: "Locked" },
  { split: 10, distance: "400m", pace: "2:55", hr: 188, cadence: 190, gct: 198, variance: 1.8, status: "Fade" },
  { split: 11, distance: "400m", pace: "2:53", hr: 188, cadence: 192, gct: 196, variance: 0.6, status: "Locked" },
  { split: 12, distance: "400m", pace: "2:49", hr: 191, cadence: 198, gct: 186, variance: -1.9, status: "Ahead" },
];

export default function SplitTable({
  splits = DEFAULT_SPLITS,
  targetPace = "2:52 min/km",
  className = "",
}: SplitTableProps) {
  const [selectedSplitIndex, setSelectedSplitIndex] = useState<number | null>(null);
  const [metricView, setMetricView] = useState<"standard" | "biometrics" | "biomechanics">("standard");
  const [sortField, setSortField] = useState<"index" | "variance" | "hr">("index");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const stats = useMemo(() => {
    const list = splits && splits.length > 0 ? splits : DEFAULT_SPLITS;
    const totalHr = list.reduce((acc, s) => acc + s.hr, 0);
    const avgHr = Math.round(totalHr / list.length);
    const inTolerance = list.filter((s) => Math.abs(s.variance) <= 0.8).length;
    const fidelity = Math.round((inTolerance / list.length) * 100);

    let fastest = list[0];
    let worstFade = 0;

    list.forEach((s) => {
      if (s.variance < fastest.variance) fastest = s;
      if (s.variance > worstFade) worstFade = s.variance;
    });

    return {
      avgHr,
      fidelity,
      maxFade: worstFade,
      fastestSplit: fastest.split ?? fastest.lap ?? 1,
    };
  }, [splits]);

  const processedSplits = useMemo(() => {
    const list = splits && splits.length > 0 ? splits : DEFAULT_SPLITS;
    const data = [...list];
    data.sort((a, b) => {
      const idxA = a.split ?? a.lap ?? 0;
      const idxB = b.split ?? b.lap ?? 0;
      let cmp = 0;
      if (sortField === "index") cmp = idxA - idxB;
      if (sortField === "variance") cmp = a.variance - b.variance;
      if (sortField === "hr") cmp = a.hr - b.hr;
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [splits, sortField, sortAsc]);

  const handleSort = (field: "index" | "variance" | "hr") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getDeviationWidth = (variance: number) => {
    const clamped = Math.min(Math.abs(variance), 3.0);
    return Math.max((clamped / 3.0) * 44, 4);
  };

  return (
    <div
      className={`w-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden shadow-2xl transition-all ${className}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── SCOREBOARD TELEMETRY BAND ── */}
      <div className="bg-[var(--background)] px-5 py-4 border-b border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-[var(--control-sm)] rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Prescribed Target Pace
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--border)] text-[10px] font-mono text-[var(--primary)] font-semibold">
                  LOCK MODE
                </span>
              </div>
              <div
                className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)] tabular-nums"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {targetPace}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-md)]">
            <div className="px-2 sm:px-3 py-1">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                Pace Fidelity
              </div>
              <div className="text-base sm:text-lg font-bold text-[var(--primary)] tabular-nums flex items-baseline gap-0.5">
                {stats.fidelity}
                <span className="text-xs text-[var(--muted-foreground)]">%</span>
              </div>
            </div>
            <div className="px-2 sm:px-3 py-1 border-l border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                Avg Heart Rate
              </div>
              <div className="text-base sm:text-lg font-bold text-[var(--foreground)] tabular-nums flex items-baseline gap-0.5">
                {stats.avgHr}
                <span className="text-xs text-[var(--muted-foreground)]">bpm</span>
              </div>
            </div>
            <div className="px-2 sm:px-3 py-1 border-l border-[var(--border)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
                Max Lap Fade
              </div>
              <div
                className={`text-base sm:text-lg font-bold tabular-nums flex items-baseline gap-0.5 ${
                  stats.maxFade > 1.0 ? "text-[var(--accent)]" : "text-[var(--foreground)]"
                }`}
              >
                +{stats.maxFade.toFixed(1)}
                <span className="text-xs text-[var(--muted-foreground)]">s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── METRIC TOGGLES ── */}
      <div className="px-5 py-2.5 bg-[var(--card)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mr-1">
            Telemetry Feed:
          </span>
          <button
            type="button"
            onClick={() => setMetricView("standard")}
            className={`h-[var(--control-sm)] px-3 rounded-[var(--radius-sm)] font-medium transition-colors cursor-pointer ${
              metricView === "standard"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm"
                : "bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
            }`}
          >
            Pace & Delta
          </button>
          <button
            type="button"
            onClick={() => setMetricView("biometrics")}
            className={`h-[var(--control-sm)] px-3 rounded-[var(--radius-sm)] font-medium transition-colors cursor-pointer ${
              metricView === "biometrics"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm"
                : "bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
            }`}
          >
            Biometrics (HR/Cadence)
          </button>
          <button
            type="button"
            onClick={() => setMetricView("biomechanics")}
            className={`h-[var(--control-sm)] px-3 rounded-[var(--radius-sm)] font-medium transition-colors cursor-pointer ${
              metricView === "biomechanics"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm"
                : "bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
            }`}
          >
            Kinematics (GCT)
          </button>
        </div>

        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-[11px] font-mono">
            {processedSplits.length} SPLITS RECORDED
          </span>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]/60 text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] select-none">
              <th
                scope="col"
                className="py-3 px-4 font-semibold cursor-pointer hover:text-[var(--foreground)] transition-colors"
                onClick={() => handleSort("index")}
              >
                <div className="flex items-center gap-1">
                  <span>Split #</span>
                  {sortField === "index" && (
                    sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-[var(--primary)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--primary)]" />
                  )}
                </div>
              </th>
              <th scope="col" className="py-3 px-4 font-semibold">Distance</th>
              <th scope="col" className="py-3 px-4 font-semibold">Split Pace</th>

              {metricView === "standard" && (
                <>
                  <th
                    scope="col"
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    onClick={() => handleSort("variance")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Target Delta</span>
                      {sortField === "variance" && (
                        sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-[var(--primary)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--primary)]" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-4 font-semibold min-w-[140px]">
                    <div className="flex justify-between items-center text-[10px]">
                      <span>- FAST</span>
                      <span>DRIFT</span>
                      <span>+ FADE</span>
                    </div>
                  </th>
                </>
              )}

              {metricView === "biometrics" && (
                <>
                  <th
                    scope="col"
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    onClick={() => handleSort("hr")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Heart Rate</span>
                      {sortField === "hr" && (
                        sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-[var(--primary)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--primary)]" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-4 font-semibold">Cadence (SPM)</th>
                </>
              )}

              {metricView === "biomechanics" && (
                <>
                  <th scope="col" className="py-3 px-4 font-semibold">Ground Contact (GCT)</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Dynamic Balance</th>
                </>
              )}

              <th scope="col" className="py-3 px-4 font-semibold text-right">Pace Adherence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] font-mono text-sm">
            {processedSplits.map((item, idx) => {
              const splitNumber = item.split ?? item.lap ?? idx + 1;
              const isSelected = selectedSplitIndex === splitNumber;
              const isFast = item.variance < 0;
              const isFade = item.variance > 0.8;

              return (
                <React.Fragment key={splitNumber}>
                  <tr
                    onClick={() => setSelectedSplitIndex(isSelected ? null : splitNumber)}
                    className={`group transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[var(--border)]/40"
                        : "hover:bg-[var(--border)]/20 bg-transparent"
                    }`}
                  >
                    <td className="py-3 px-4 text-xs font-bold text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--background)] border border-[var(--border)] flex items-center justify-center font-mono text-[var(--foreground)]">
                          {splitNumber < 10 ? `0${splitNumber}` : splitNumber}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs text-[var(--secondary-foreground)] font-semibold">
                      {item.distance}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1">
                        <span
                          className="font-bold text-[var(--foreground)] text-base tracking-tight tabular-nums"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {item.pace}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-normal">
                          /km
                        </span>
                      </div>
                    </td>

                    {metricView === "standard" && (
                      <>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold tabular-nums ${
                              isFast
                                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                                : isFade
                                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                : "bg-[var(--border)] text-[var(--foreground)]"
                            }`}
                          >
                            {isFast ? (
                              <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                            ) : isFade ? (
                              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                            ) : null}
                            {item.variance === 0
                              ? "±0.0s"
                              : `${item.variance > 0 ? "+" : ""}${item.variance.toFixed(1)}s`}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="relative w-full h-3 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius-sm)] flex items-center justify-center overflow-hidden">
                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[var(--muted-foreground)] z-10 opacity-70" />
                            {item.variance !== 0 ? (
                              <div
                                className="absolute top-0.5 bottom-0.5 transition-all duration-300 rounded-[2px]"
                                style={{
                                  left: item.variance < 0 ? undefined : "50%",
                                  right: item.variance < 0 ? "50%" : undefined,
                                  width: `${getDeviationWidth(item.variance)}px`,
                                  backgroundColor: item.variance < 0 ? "var(--primary)" : "var(--accent)",
                                }}
                              />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-[var(--primary)] shadow-sm" />
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {metricView === "biometrics" && (
                      <>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                item.hr > 185
                                  ? "text-[var(--accent)] fill-[var(--accent)]"
                                  : "text-[var(--muted-foreground)]"
                              }`}
                            />
                            <span className="font-bold text-[var(--foreground)]">{item.hr}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">bpm</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span className="text-[var(--foreground)] font-bold">{item.cadence ?? 192}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">spm</span>
                          </div>
                        </td>
                      </>
                    )}

                    {metricView === "biomechanics" && (
                      <>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span className="font-bold text-[var(--foreground)]">{item.gct ?? 192}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">ms</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[var(--secondary-foreground)]">
                          {(item.gct ?? 192) < 192 ? (
                            <span className="text-[var(--primary)] font-bold">Elastic / Snappy</span>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">Nominal</span>
                          )}
                        </td>
                      </>
                    )}

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isFast
                            ? "border border-[var(--primary)] text-[var(--primary)]"
                            : isFade
                            ? "border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                            : "border border-[var(--border)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {isFast ? "Aggressive" : isFade ? "Lactate Fade" : "Precision Lock"}
                      </span>
                    </td>
                  </tr>

                  {isSelected && (
                    <tr className="bg-[var(--background)] border-b border-[var(--border)]">
                      <td colSpan={metricView === "standard" ? 6 : 5} className="p-4">
                        <div className="border-l-2 border-[var(--primary)] pl-4 py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs uppercase tracking-wider text-[var(--primary)] font-bold"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                LAP {splitNumber} SURGICAL TELEMETRY
                              </span>
                              <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                                • {item.distance} Split
                              </span>
                            </div>
                            <p className="text-xs text-[var(--foreground)] mt-1 font-sans">
                              {item.variance < -1.0
                                ? "Accelerated ahead of pacing threshold. Monitor lactate accumulation into successive intervals."
                                : item.variance > 1.0
                                ? "Critical velocity loss detected. Neuromuscular fatigue or stride length shortening observed."
                                : "Optimal pacing fidelity. Stride length and cadence remain locked in target aerobic zone."}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                            <div className="bg-[var(--card)] px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)]">
                              <div className="text-[9px] uppercase text-[var(--muted-foreground)]">Stride Contact</div>
                              <div className="font-bold text-[var(--foreground)]">{item.gct ?? 192} ms</div>
                            </div>
                            <div className="bg-[var(--card)] px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)]">
                              <div className="text-[9px] uppercase text-[var(--muted-foreground)]">Cadence</div>
                              <div className="font-bold text-[var(--foreground)]">{item.cadence ?? 194} spm</div>
                            </div>
                            <div className="bg-[var(--card)] px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)]">
                              <div className="text-[9px] uppercase text-[var(--muted-foreground)]">Peak HR</div>
                              <div className="font-bold text-[var(--accent)]">{item.hr} bpm</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-5 py-3 bg-[var(--background)] border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-[var(--muted-foreground)] font-sans">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
            <span className="text-[11px] font-medium text-[var(--foreground)]">Fast / Ahead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
            <span className="text-[11px] font-medium text-[var(--foreground)]">Target Lock (±0.8s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span className="text-[11px] font-medium text-[var(--foreground)]">Pacing Fade (&gt;0.8s)</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[var(--muted-foreground)]">
          Fastest Rep:{" "}
          <span className="text-[var(--primary)] font-bold">
            Split #{stats.fastestSplit < 10 ? `0${stats.fastestSplit}` : stats.fastestSplit}
          </span>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { ChevronRight, CheckCircle2, TrendingDown } from "lucide-react";

export default function SessionLogList({
  sessions = [],
  onSelectSession
}) {
  const [filterType, setFilterType] = useState("all");
  const [hoveredId, setHoveredId] = useState(null);

  const sessionList = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return [
        {
          id: "row-1",
          title: "14 x 415m Track VO2 Inflection",
          subtitle: "364m @ 73s / 203m jog recovery",
          meta: "13.5 km · 3:08 min/km · Track",
          status: "Target Met",
          date: "Mar 1"
        },
        {
          id: "row-2",
          title: "35km Progressive Marathon Pace Long Run",
          subtitle: "Last 9km dialed to 3:22 min/km target",
          meta: "28.0 km · 3:33 min/km · Road",
          status: "Slight Fade",
          date: "Mar 5"
        },
        {
          id: "row-3",
          title: "4 x 2km Lactate Threshold Cruise",
          subtitle: "77s static recovery between reps",
          meta: "15.1 km · 3:13 min/km · Asphalt",
          status: "Target Met",
          date: "Mar 9"
        }
      ];
    }
    return sessions;
  }, [sessions]);

  const parseMeta = (metaString = "") => {
    const parts = metaString.split("·").map((p) => p.trim());
    return {
      distance: parts[0] || "-- km",
      pace: parts[1] || "-- min/km",
      surface: parts[2] || "Track"
    };
  };

  const filteredSessions = useMemo(() => {
    if (filterType === "all") return sessionList;
    if (filterType === "met") return sessionList.filter((s) => s.status?.toLowerCase().includes("met"));
    if (filterType === "fade") return sessionList.filter((s) => s.status?.toLowerCase().includes("fade"));
    if (filterType === "track") return sessionList.filter((s) => s.meta?.toLowerCase().includes("track") || s.title?.toLowerCase().includes("track"));
    return sessionList;
  }, [sessionList, filterType]);

  const targetMetCount = sessionList.filter((s) => s.status?.toLowerCase().includes("met")).length;
  const fidelityRate = sessionList.length > 0 ? Math.round((targetMetCount / sessionList.length) * 100) : 100;

  return (
    <div
      style={{ fontFamily: "var(--font-body)" }}
      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden text-[var(--foreground)]"
    >
      {/* Telemetry Header Band */}
      <div className="bg-[var(--background)] px-5 py-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-6 bg-[var(--primary)] rounded-full animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-mono text-[var(--muted-foreground)] font-semibold">
                Telemetry Log
              </span>
              <span className="bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 text-[10px] font-mono px-1.5 py-0.5 rounded-[var(--radius-sm)] font-bold tracking-tight">
                REALTIME SYNC
              </span>
            </div>
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)]"
            >
              Completed Training Sessions
            </h2>
          </div>
        </div>

        {/* High-Contrast Athletic Metric Bar */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-foreground)]">
              Fidelity Rate
            </span>
            <div className="flex items-center gap-1.5 justify-end">
              <span
                style={{ fontFamily: "var(--font-display)" }}
                className="text-lg font-black text-[var(--primary)] tracking-tight tabular-nums"
              >
                {fidelityRate}%
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                ({targetMetCount}/{sessionList.length})
              </span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-[var(--border)] hidden sm:block" />

          {/* Filter Controls */}
          <div className="flex items-center bg-[var(--background)] p-1 rounded-[var(--radius-md)] border border-[var(--border)]">
            {[
              { key: "all", label: "All Units" },
              { key: "met", label: "Locked" },
              { key: "fade", label: "Drift" },
              { key: "track", label: "Track" }
            ].map((tab) => {
              const active = filterType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterType(tab.key)}
                  className={`h-[var(--control-sm)] px-3 text-xs font-semibold uppercase tracking-wider rounded-[var(--radius-sm)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    active
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Column Guide Bar */}
      <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-[var(--card)] border-b border-[var(--border)] text-[10px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
        <div className="col-span-3 sm:col-span-2">Date / Protocol</div>
        <div className="col-span-6 sm:col-span-5">Prescription & Interval Focus</div>
        <div className="col-span-3 sm:col-span-2 text-right">Volume & Pace</div>
        <div className="hidden sm:block sm:col-span-3 text-right">Fidelity Gate</div>
      </div>

      {/* Session Rows List */}
      <div className="divide-y divide-[var(--border)] bg-[var(--background)]/60">
        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-sm font-mono text-[var(--muted-foreground)] uppercase tracking-wider">
            No telemetry records match the active filter criteria.
          </div>
        ) : (
          filteredSessions.map((session, idx) => {
            const isMet = session.status?.toLowerCase().includes("met");
            const meta = parseMeta(session.meta);
            const isHovered = hoveredId === session.id;

            const deltaValues = [
              [95, 98, 99, 97, 94],
              [92, 88, 86, 82, 80],
              [99, 100, 98, 97, 99],
              [96, 94, 91, 89, 87],
              [98, 97, 99, 98, 99],
              [94, 91, 88, 86, 83],
              [100, 99, 100, 98, 99],
              [95, 90, 86, 84, 82]
            ][idx % 8];

            return (
              <div
                key={session.id || idx}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectSession && onSelectSession(session)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectSession && onSelectSession(session);
                  }
                }}
                className={`group relative grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:z-10 ${
                  isHovered
                    ? "bg-[var(--card)] text-[var(--foreground)]"
                    : "bg-transparent hover:bg-[var(--card)]"
                }`}
              >
                {/* Left Active Accent Indicator Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
                    isHovered
                      ? "bg-[var(--primary)]"
                      : isMet
                      ? "bg-transparent group-hover:bg-[var(--primary)]"
                      : "bg-[var(--accent)]/40 group-hover:bg-[var(--accent)]"
                  }`}
                />

                {/* Col 1: Date & Surface Tag */}
                <div className="col-span-3 sm:col-span-2 flex flex-col items-start gap-1">
                  <span
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-sm font-extrabold tracking-tight text-[var(--foreground)] tabular-nums uppercase"
                  >
                    {session.date || `SET 0${idx + 1}`}
                  </span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] tracking-tight uppercase">
                    {meta.surface}
                  </span>
                </div>

                {/* Col 2: Title & Interval Prescription */}
                <div className="col-span-6 sm:col-span-5 flex flex-col justify-center min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <h3
                      style={{ fontFamily: "var(--font-display)" }}
                      className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors tracking-tight"
                    >
                      {session.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] truncate font-mono mt-0.5">
                    {session.subtitle}
                  </p>
                </div>

                {/* Col 3: Tabular Pace & Distance */}
                <div className="col-span-3 sm:col-span-2 flex flex-col items-end justify-center text-right">
                  <div
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-base font-black tracking-tight text-[var(--foreground)] tabular-nums flex items-baseline gap-1"
                  >
                    {meta.pace}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--muted-foreground)] tabular-nums">
                    {meta.distance}
                  </div>
                </div>

                {/* Col 4: Target Fidelity & Micro-Delta Telemetry */}
                <div className="hidden sm:flex sm:col-span-3 items-center justify-end gap-3 pl-2">
                  {/* Micro Interval Delta Sparkline */}
                  <div
                    className="flex items-end gap-[3px] h-5 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--card)] border border-[var(--border)]"
                    title="Interval target pace adherence sequence"
                  >
                    {deltaValues.map((val, vIdx) => {
                      const heightPercent = Math.max(20, Math.min(100, (val - 70) * 3.3));
                      const isHigh = val >= 95;
                      return (
                        <div
                          key={vIdx}
                          style={{ height: `${heightPercent}%` }}
                          className={`w-1 rounded-t-[1px] transition-all ${
                            isHigh
                              ? "bg-[var(--primary)]"
                              : "bg-[var(--accent)]"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-mono font-bold tracking-tight border uppercase whitespace-nowrap ${
                      isMet
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
                        : "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
                    }`}
                  >
                    {isMet ? (
                      <CheckCircle2 className="w-3 h-3 text-[var(--primary)] shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-[var(--accent)] shrink-0" />
                    )}
                    <span>{session.status || "Target Met"}</span>
                  </div>

                  {/* Action Chevron Indicator */}
                  <div className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Telemetry Footer Band */}
      <div className="bg-[var(--card)] px-5 py-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--muted-foreground)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            <span className="uppercase text-[11px]">Threshold Target Locked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="uppercase text-[11px]">Pace Drift Detected</span>
          </div>
        </div>

        <div className="flex items-center gap-2 tracking-tight">
          <span className="text-[var(--foreground)] font-bold tabular-nums">
            {filteredSessions.length}
          </span>
          <span>of</span>
          <span className="text-[var(--foreground)] font-bold tabular-nums">
            {sessionList.length}
          </span>
          <span>INTERVAL BLOCKS LOGGED</span>
        </div>
      </div>
    </div>
  );
}
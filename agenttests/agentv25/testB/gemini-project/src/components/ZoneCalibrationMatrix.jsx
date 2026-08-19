import React, { useState, useMemo } from "react";
import { Activity, ArrowUpRight, Check, ChevronRight, Flame, Lock, RotateCcw, SlidersHorizontal, TrendingDown, Unlock, Zap } from "lucide-react";

interface PaceZone {
  id: string;
  code: string;
  name: string;
  paceRange: string;
  minPaceSec: number;
  maxPaceSec: number;
  hrRange: string;
  minHr: number;
  maxHr: number;
  lactateBand: string;
  description: string;
  fidelityPct: number;
  targetSplit: string;
}

interface ZoneCalibrationMatrixProps {
  zones?: PaceZone[];
  lactateThresholdPace?: string;
  className?: string;
  onCalibrationCommit?: (updatedZones: PaceZone[], anchorPace: string) => void;
}

const DEFAULT_ZONES: PaceZone[] = [
  {
    id: "z1",
    code: "Z1",
    name: "Aerobic Restoration",
    paceRange: "4:15 - 4:45",
    minPaceSec: 255,
    maxPaceSec: 285,
    hrRange: "125 - 142 bpm",
    minHr: 125,
    maxHr: 142,
    lactateBand: "< 1.4 mmol/L",
    description: "Vascular mitochondrial density base & active lipid flush",
    fidelityPct: 98.4,
    targetSplit: "4:28 min/km",
  },
  {
    id: "z2",
    code: "Z2",
    name: "Extensive Aerobic Base",
    paceRange: "3:42 - 4:14",
    minPaceSec: 222,
    maxPaceSec: 254,
    hrRange: "143 - 158 bpm",
    minHr: 143,
    maxHr: 158,
    lactateBand: "1.5 - 2.1 mmol/L",
    description: "Glycogen conservation & structural aerobic capacity",
    fidelityPct: 96.1,
    targetSplit: "3:52 min/km",
  },
  {
    id: "z3",
    code: "Z3",
    name: "Tempo / Steady State",
    paceRange: "3:22 - 3:41",
    minPaceSec: 202,
    maxPaceSec: 221,
    hrRange: "159 - 171 bpm",
    minHr: 159,
    maxHr: 171,
    lactateBand: "2.2 - 3.4 mmol/L",
    description: "Aerobic power gate & sustained marathon-pace clearance",
    fidelityPct: 91.8,
    targetSplit: "3:29 min/km",
  },
  {
    id: "z4",
    code: "Z4",
    name: "Lactate Threshold (LT2)",
    paceRange: "3:08 - 3:21",
    minPaceSec: 188,
    maxPaceSec: 201,
    hrRange: "172 - 183 bpm",
    minHr: 172,
    maxHr: 183,
    lactateBand: "3.5 - 4.9 mmol/L",
    description: "Inflection gate: maximal sustainable split without exponential acid fade",
    fidelityPct: 94.2,
    targetSplit: "3:12 min/km",
  },
  {
    id: "z5",
    code: "Z5",
    name: "VO2 Max Inflection",
    paceRange: "2:46 - 3:07",
    minPaceSec: 166,
    maxPaceSec: 187,
    hrRange: "184 - 196 bpm",
    minHr: 184,
    maxHr: 196,
    lactateBand: "> 5.0 mmol/L",
    description: "Maximal stroke volume, motor unit recruitment & 400m track turnover",
    fidelityPct: 88.7,
    targetSplit: "2:54 min/km",
  },
];

function parsePaceSeconds(paceStr: string): number {
  const clean = paceStr.replace(/[^0-9:]/g, "");
  const parts = clean.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 192;
}

function formatPaceSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function ZoneCalibrationMatrix({
  zones = DEFAULT_ZONES,
  lactateThresholdPace = "3:12",
  className = "",
  onCalibrationCommit,
}: ZoneCalibrationMatrixProps) {
  const [activeZoneId, setActiveZoneId] = useState<string>("z4");
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [paceDeltaOffset, setPaceDeltaOffset] = useState<number>(0);
  const [committedFlash, setCommittedFlash] = useState<boolean>(false);

  const initialLtSec = useMemo(
    () => parsePaceSeconds(lactateThresholdPace),
    [lactateThresholdPace]
  );

  const effectiveLtSec = initialLtSec + paceDeltaOffset;
  const effectiveLtDisplay = formatPaceSeconds(effectiveLtSec);

  const calibratedZones = useMemo(() => {
    return zones.map((z) => {
      const shiftRatio =
        z.id === "z4"
          ? paceDeltaOffset
          : paceDeltaOffset * (z.id === "z5" ? 0.8 : z.id === "z3" ? 1.1 : 1.3);
      const newMin = Math.max(120, Math.round(z.minPaceSec + shiftRatio));
      const newMax = Math.max(130, Math.round(z.maxPaceSec + shiftRatio));
      const targetSec = Math.round((newMin + newMax) / 2);

      return {
        ...z,
        minPaceSec: newMin,
        maxPaceSec: newMax,
        paceRange: `${formatPaceSeconds(newMin)} - ${formatPaceSeconds(newMax)}`,
        targetSplit: `${formatPaceSeconds(targetSec)} min/km`,
      };
    });
  }, [zones, paceDeltaOffset]);

  const activeZone =
    calibratedZones.find((z) => z.id === activeZoneId) || calibratedZones[3];

  const handleNudge = (delta: number) => {
    if (isLocked) return;
    setPaceDeltaOffset((prev) => prev + delta);
  };

  const handleReset = () => {
    setPaceDeltaOffset(0);
  };

  const handleCommit = () => {
    setCommittedFlash(true);
    if (onCalibrationCommit) {
      onCalibrationCommit(calibratedZones, effectiveLtDisplay);
    }
    setTimeout(() => {
      setCommittedFlash(false);
      setIsLocked(true);
    }, 900);
  };

  return (
    <section
      aria-label="Zone Calibration Matrix"
      className={`relative w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-[family-name:var(--font-body)] ${className}`}
    >
      {/* FULL-BLEED CONTRAST BAND 1: TELEMETRY SCOREBOARD HEADER */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-display)] text-xs font-black tracking-widest uppercase text-[var(--primary)]">
                  PHYSIOLOGICAL ANCHOR GATE
                </span>
                <span className="inline-flex items-center rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-[10px] font-mono font-bold tracking-tight text-[var(--muted-foreground)]">
                  V4.2 LIVE
                </span>
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-black tracking-tight text-[var(--foreground)] sm:text-xl">
                Zone Calibration Matrix
              </h2>
            </div>
          </div>

          {/* Calibrate & Lock Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              aria-label={isLocked ? "Unlock matrix calibration" : "Lock matrix"}
              className={`group inline-flex h-[var(--control-sm)] items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                isLocked
                  ? "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  : "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span className="tracking-wide">LOCKED</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  <span className="tracking-wide">CALIBRATING</span>
                </>
              )}
            </button>

            {!isLocked && (
              <button
                type="button"
                onClick={handleCommit}
                className="inline-flex h-[var(--control-sm)] items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 text-xs font-black uppercase text-[var(--primary-foreground)] transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                {committedFlash ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>LOCKED</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>COMMIT SPLITS</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* DOMINANT MOMENT: Massive Tabular Scoreboard Display */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[var(--border)]">
          {/* LT2 Pace Big Numerals */}
          <div className="flex flex-col justify-between p-2 lg:pr-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Anchor Threshold (LT2)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-4xl font-black tracking-tighter text-[var(--primary)] sm:text-5xl">
                {effectiveLtDisplay}
              </span>
              <span className="font-mono text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                min/km
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                  paceDeltaOffset < 0
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : paceDeltaOffset > 0
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--border)] text-[var(--muted-foreground)]"
                }`}
              >
                {paceDeltaOffset < 0 ? (
                  <TrendingDown className="h-3 w-3 inline" />
                ) : paceDeltaOffset > 0 ? (
                  <ArrowUpRight className="h-3 w-3 inline" />
                ) : null}
                {paceDeltaOffset === 0
                  ? "BASELINE LOCK"
                  : `${paceDeltaOffset > 0 ? "+" : ""}${paceDeltaOffset}s OFFSET`}
              </span>
              {!isLocked && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleNudge(-1)}
                    className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] font-mono text-xs font-bold hover:bg-[var(--border)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
                    aria-label="Speed up anchor by 1s"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudge(1)}
                    className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] font-mono text-xs font-bold hover:bg-[var(--border)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
                    aria-label="Slow down anchor by 1s"
                  >
                    +
                  </button>
                  {paceDeltaOffset !== 0 && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="ml-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      aria-label="Reset offset"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lactate Clearance */}
          <div className="flex flex-col justify-between p-2 lg:px-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Acid Clearance Inflection
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                4.0
              </span>
              <span className="font-mono text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                mmol/L
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted-foreground)]">
              <Activity className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>Shift velocity: ±0.8 m/s²</span>
            </div>
          </div>

          {/* Stride Cadence Target */}
          <div className="flex flex-col justify-between p-2 lg:px-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Cadence Synchronization
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                184
              </span>
              <span className="font-mono text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                spm
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[var(--primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
              <span>Optimal elastic return</span>
            </div>
          </div>

          {/* Fidelity Index */}
          <div className="flex flex-col justify-between p-2 lg:pl-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Pacing Gate Fidelity
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                94.2
              </span>
              <span className="font-mono text-xs font-semibold uppercase text-[var(--primary)]">
                %
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted-foreground)]">
              <span>Drift limit: &lt; 2.1% across 15k</span>
            </div>
          </div>
        </div>
      </header>

      {/* FULL-BLEED CONTRAST BAND 2: INTERVAL TIERS DIVIDED ROWS */}
      <div className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
        {calibratedZones.map((zone) => {
          const isSelected = activeZoneId === zone.id;
          const isLt2 = zone.id === "z4";

          const minAnchorSec = 160;
          const maxAnchorSec = 300;
          const leftPct = Math.max(
            0,
            Math.min(
              100,
              ((maxAnchorSec - zone.maxPaceSec) / (maxAnchorSec - minAnchorSec)) * 100
            )
          );
          const widthPct = Math.max(
            12,
            Math.min(
              100 - leftPct,
              ((zone.maxPaceSec - zone.minPaceSec) / (maxAnchorSec - minAnchorSec)) *
                100 *
                2.8
            )
          );

          return (
            <div
              key={zone.id}
              onClick={() => setActiveZoneId(zone.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveZoneId(zone.id);
                }
              }}
              className={`group relative flex flex-col justify-between gap-4 px-4 py-4.5 transition-all cursor-pointer sm:flex-row sm:items-center sm:px-6 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] ${
                isSelected ? "bg-[var(--card)]" : ""
              }`}
            >
              {/* Left Zone Identification + Badging */}
              <div className="flex items-start gap-3 sm:w-1/3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-mono text-xs font-black transition-colors ${
                    isLt2
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : isSelected
                      ? "border border-[var(--primary)] text-[var(--primary)]"
                      : "border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                  }`}
                >
                  {zone.code}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-tight text-[var(--foreground)]">
                      {zone.name}
                    </span>
                    {isLt2 && (
                      <span className="rounded-[var(--radius-sm)] bg-[var(--primary)] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-[var(--primary-foreground)]">
                        LT2 ANCHOR
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                    {zone.description}
                  </p>
                </div>
              </div>

              {/* Middle: Embedded Micro-Delta Pace Bar & Target Gates */}
              <div className="flex flex-1 flex-col gap-1.5 sm:px-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--foreground)]">
                    {zone.paceRange}{" "}
                    <span className="text-[10px] font-normal text-[var(--muted-foreground)]">
                      min/km
                    </span>
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                    {zone.hrRange}
                  </span>
                </div>

                {/* Tactical Embedded Bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--background)] border border-[var(--border)]">
                  <div
                    className={`absolute top-0 bottom-0 transition-all duration-300 rounded-[var(--radius-full)] ${
                      isLt2
                        ? "bg-[var(--primary)]"
                        : isSelected
                        ? "bg-[var(--foreground)]"
                        : "bg-[var(--border)] group-hover:bg-[var(--muted)]"
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  />
                  {/* Anchor Notch Marker for Zone 4 */}
                  {isLt2 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[var(--primary-foreground)]"
                      style={{ left: `${leftPct + widthPct / 2}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Right: Fidelity Metrics & Status Chip */}
              <div className="flex items-center justify-between gap-3 sm:w-1/4 sm:justify-end">
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-[var(--foreground)]">
                    {zone.lactateBand}
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">
                    Split Lock: {zone.fidelityPct}%
                  </div>
                </div>

                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-full)] border transition-transform ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] group-hover:border-[var(--muted)]"
                  }`}
                >
                  <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL-BLEED CONTRAST BAND 3: SELECTED ZONE TELEMETRY COCKPIT */}
      <footer className="bg-[var(--background)] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-[var(--control-sm)] w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] text-[var(--primary)]">
              <Flame className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--primary)]">
                  {activeZone.code} TARGET TELEMETRY
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">·</span>
                <span className="text-xs text-[var(--foreground)] font-medium">
                  {activeZone.name}
                </span>
              </div>
              <p className="font-mono text-xs text-[var(--muted-foreground)]">
                Prescribed Lap Gate:{" "}
                <strong className="text-[var(--foreground)]">
                  {activeZone.targetSplit}
                </strong>{" "}
                (Target Heart Band: {activeZone.hrRange})
              </p>
            </div>
          </div>

          {/* Quick micro-actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isLocked) {
                  setPaceDeltaOffset((p) => p - 2);
                }
              }}
              disabled={isLocked}
              className="inline-flex h-[var(--control-sm)] items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2.5 font-mono text-[11px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--muted)] hover:bg-[var(--border)] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
            >
              -2s PACE TRIM
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isLocked) {
                  setPaceDeltaOffset((p) => p + 2);
                }
              }}
              disabled={isLocked}
              className="inline-flex h-[var(--control-sm)] items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2.5 font-mono text-[11px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--muted)] hover:bg-[var(--border)] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
            >
              +2s PACE TRIM
            </button>
            <div className="hidden h-4 w-px bg-[var(--border)] sm:block" />
            <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--muted-foreground)]">
              <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
              <span>STRIDE/LAB CALIBRATED</span>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
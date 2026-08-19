import React, { useState } from "react";
import { Zap, Mountain, HeartPulse, Gauge, Info, CheckCircle2 } from "lucide-react";

export interface TelemetryRibbonProps {
  /** Average strides per minute */
  cadenceAvg: number;
  /** Total vertical gain in meters */
  elevationGain: number;
  /** Peak heart rate during workout */
  heartRateMax: number;
  /** Percentage cardiac drift measurement */
  aerobicDecoupling: string;
}

export default function TelemetryRibbon({
  cadenceAvg = 184,
  elevationGain = 142,
  heartRateMax = 188,
  aerobicDecoupling = "1.9%",
}: TelemetryRibbonProps) {
  const [activeTelemetry, setActiveTelemetry] = useState<number | null>(null);

  // Normalizing string decoupled value (e.g. "1.9%" or "1.9% (Optimal)" -> numeric check)
  const numericDecoupling = parseFloat(aerobicDecoupling);
  const isDecouplingOptimal = isNaN(numericDecoupling) || numericDecoupling < 3.0;

  const telemetryData = [
    {
      id: 0,
      code: "STRIDE_FREQ",
      index: "01",
      label: "Average Cadence",
      value: cadenceAvg,
      unit: "SPM",
      benchmark: "Target: 180–186",
      delta: cadenceAvg >= 180 ? "Optimal Rhythm" : "Low Cadence",
      deltaPositive: cadenceAvg >= 180,
      statusChip: `${cadenceAvg} spm lock`,
      icon: Zap,
      sparkType: "cadence",
      description: "Neuromuscular turnover rate. Cadence held strictly within high-economy envelope.",
    },
    {
      id: 1,
      code: "VERT_ACCUM",
      index: "02",
      label: "Elevation Gain",
      value: elevationGain > 0 ? `+${elevationGain}` : `${elevationGain}`,
      unit: "M",
      benchmark: "Grad 4.2% Max",
      delta: "+18m vs route avg",
      deltaPositive: true,
      statusChip: "Grade adjusted",
      icon: Mountain,
      sparkType: "elevation",
      description: "Net vertical work done. Split power normalized across rolling incline sections.",
    },
    {
      id: 2,
      code: "CARD_PEAK",
      index: "03",
      label: "Peak Heart Rate",
      value: heartRateMax,
      unit: "BPM",
      benchmark: "Z5 Cap: 192 bpm",
      delta: "96% of HR_MAX",
      deltaPositive: heartRateMax <= 190,
      statusChip: "Zone 5 Ceiling",
      icon: HeartPulse,
      sparkType: "heartrate",
      description: "Highest sustained 5-second cardiovascular output recorded in interval reps.",
    },
    {
      id: 3,
      code: "PW_HR_DRIFT",
      index: "04",
      label: "Aerobic Decoupling",
      value: aerobicDecoupling.includes("%") ? aerobicDecoupling : `${aerobicDecoupling}%`,
      unit: "Pw:HR",
      benchmark: "Threshold: <3.0%",
      delta: isDecouplingOptimal ? "Sub-3% (Efficient)" : "High Fade (>3.0%)",
      deltaPositive: isDecouplingOptimal,
      statusChip: isDecouplingOptimal ? "Minimal Drift" : "Fade Detected",
      icon: Gauge,
      sparkType: "drift",
      description: "Efficiency factor ratio between internal cardiovascular strain and external pace output.",
    },
  ];

  return (
    <section 
      aria-label="Workout Telemetry Summary"
      className="w-full bg-[color:var(--card)] border border-[color:var(--border)] rounded-[var(--radius-lg)] overflow-hidden font-['DM_Sans',sans-serif]"
    >
      {/* Top Telemetry Feed Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[color:var(--background)] border-b border-[color:var(--border)] text-[11px] font-medium tracking-wider text-[color:var(--muted-foreground)] uppercase">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[color:var(--primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--primary)]"></span>
          </span>
          <span className="font-['Archivo',sans-serif] font-bold text-[color:var(--foreground)] tracking-normal">
            TELEMETRY MATRIX
          </span>
          <span className="text-[color:var(--border)]">|</span>
          <span className="hidden sm:inline">STRIDE/LAB BIO-TELEMETRY 1000Hz ENGINE</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[color:var(--success)] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CALIBRATED
          </span>
          <span className="text-[color:var(--border)]">|</span>
          <span className="font-mono text-[10px] text-[color:var(--secondary)]">LATENCY: 0.04ms</span>
        </div>
      </div>

      {/* 4-Up High-Contrast Scoreboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--border)]">
        {telemetryData.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTelemetry === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setActiveTelemetry(isSelected ? null : item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTelemetry(isSelected ? null : item.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isSelected}
              aria-label={`${item.label}: ${item.value} ${item.unit}, ${item.delta}`}
              className={`group relative p-5 transition-colors duration-150 outline-none text-left cursor-pointer select-none
                ${isSelected ? "bg-[color:var(--background)] ring-1 ring-inset ring-[color:var(--ring)]" : "hover:bg-[color:var(--background)]/60"}
                focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--ring)]
              `}
            >
              {/* Header Bar: Spec index + Micro-tag */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-['Archivo',sans-serif] text-[11px] font-black tracking-widest text-[color:var(--muted-foreground)]">
                    {item.index}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--foreground)]">
                    {item.label}
                  </span>
                </div>
                <div className="p-1 rounded-[var(--radius-sm)] bg-[color:var(--background)] border border-[color:var(--border)] text-[color:var(--muted-foreground)] group-hover:text-[color:var(--primary)] transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Massive Tabular Metric Scoreboard */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-['Archivo',sans-serif] text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-[color:var(--foreground)]">
                  {item.value}
                </span>
                <span className="font-['Archivo',sans-serif] text-xs font-extrabold uppercase tracking-wider text-[color:var(--secondary)]">
                  {item.unit}
                </span>
              </div>

              {/* Tactical Status Delta Band */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[color:var(--border)]/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-['Archivo',sans-serif] font-black uppercase tracking-wider
                      ${
                        item.deltaPositive
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
                      }
                    `}
                  >
                    {item.statusChip}
                  </span>
                  <span className="text-[11px] text-[color:var(--muted-foreground)] truncate">
                    {item.benchmark}
                  </span>
                </div>

                {/* Micro-spark visual */}
                <div className="shrink-0">
                  {item.sparkType === "cadence" && (
                    <svg className="w-12 h-4 overflow-visible" viewBox="0 0 48 16" fill="none" aria-hidden="true">
                      <rect x="0" y="8" width="6" height="8" rx="1" fill="var(--border)" />
                      <rect x="10" y="4" width="6" height="12" rx="1" fill="var(--border)" />
                      <rect x="20" y="2" width="6" height="14" rx="1" fill="var(--primary)" />
                      <rect x="30" y="3" width="6" height="13" rx="1" fill="var(--primary)" />
                      <rect x="40" y="1" width="6" height="15" rx="1" fill="var(--primary)" />
                    </svg>
                  )}
                  {item.sparkType === "elevation" && (
                    <svg className="w-12 h-4 overflow-visible" viewBox="0 0 48 16" fill="none" aria-hidden="true">
                      <path
                        d="M1 14L12 12L24 7L36 9L47 2"
                        stroke="var(--foreground)"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polygon points="1,14 12,12 24,7 36,9 47,2 47,15 1,15" fill="var(--border)" opacity="0.4" />
                    </svg>
                  )}
                  {item.sparkType === "heartrate" && (
                    <svg className="w-12 h-4 overflow-visible" viewBox="0 0 48 16" fill="none" aria-hidden="true">
                      <path
                        d="M1 9H12L16 2L22 15L28 6L33 11H47"
                        stroke={item.deltaPositive ? "var(--primary)" : "var(--accent)"}
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {item.sparkType === "drift" && (
                    <svg className="w-12 h-4 overflow-visible" viewBox="0 0 48 16" fill="none" aria-hidden="true">
                      <line x1="2" y1="12" x2="46" y2="4" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="2 2" />
                      <path
                        d="M2 13C14 12 28 10 46 6"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Context Drawer Indicator for active selection */}
              {isSelected && (
                <div className="mt-3 pt-2.5 border-t border-[color:var(--border)] text-[11px] leading-relaxed text-[color:var(--foreground)] animate-in fade-in duration-150">
                  <div className="flex items-start gap-1.5 text-[color:var(--secondary)]">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[color:var(--primary)]" />
                    <span>{item.description}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ribbon Footer Diagnostics */}
      <div className="px-4 py-2.5 bg-[color:var(--card)] border-t border-[color:var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[color:var(--muted-foreground)]">
        <div className="flex items-center gap-2">
          <span className="font-['Archivo',sans-serif] font-black text-[color:var(--primary)] text-[10px] tracking-wider uppercase bg-[color:var(--primary)]/10 border border-[color:var(--primary)]/30 px-1.5 py-0.5 rounded-[var(--radius-sm)]">
            STADIUM TELEMETRY
          </span>
          <span>Click any metric box to inspect metabolic and biomechanical targets.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-[color:var(--secondary)]">
          <span>SOURCE: ANT+ STRIDE POD / OPTICAL ECG</span>
        </div>
      </div>
    </section>
  );
}
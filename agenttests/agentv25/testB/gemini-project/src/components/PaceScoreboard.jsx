import React, { useState } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Zap, Target, Gauge, Sliders } from "lucide-react";

interface MetricItem {
  label: string;
  value: string | number;
  unit: string;
  delta?: number;
  positive?: boolean;
}

interface PaceScoreboardProps {
  metrics?: MetricItem[];
  headline?: string;
}

const DEFAULT_METRICS: MetricItem[] = [
  { label: "Weekly Volume", value: "118.4", unit: "km", delta: 8.2, positive: true },
  { label: "Target Pace Fidelity", value: "94.2", unit: "%", delta: 2.1, positive: true },
  { label: "Threshold Pace", value: "3:12", unit: "min/km", delta: -3, positive: true },
  { label: "Avg Stride Cadence", value: "184", unit: "spm", delta: 2, positive: true },
  { label: "Cardiac Decoupling", value: "2.8", unit: "%", delta: -1.1, positive: true }
];

export default function PaceScoreboard({
  metrics = DEFAULT_METRICS,
  headline = "Lactate Threshold & Telemetry Board"
}: PaceScoreboardProps) {
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [telemetryMode, setTelemetryMode] = useState<"standard" | "drift">("standard");

  const primaryMetric = metrics[activeSlot] || metrics[0];

  return (
    <section 
      aria-label="Pace Telemetry Scoreboard"
      className="w-full bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden shadow-2xl transition-all"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Top Telemetry Header & Status Strip */}
      <div className="bg-background/80 border-b border-border px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-[var(--radius-full)] bg-primary opacity-75" />
              <span className="relative inline-flex rounded-[var(--radius-full)] h-2.5 w-2.5 bg-primary" />
            </span>
            <span 
              className="text-xs uppercase tracking-widest font-black text-primary font-[family-name:var(--font-display)]"
            >
              STRIDE // TLM-01
            </span>
          </div>
          <span className="text-border">|</span>
          <h2 
            className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-md"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {headline}
          </h2>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setTelemetryMode(telemetryMode === "standard" ? "drift" : "standard")}
            className="h-[var(--control-sm)] px-2.5 text-xs font-semibold rounded-[var(--radius-sm)] border border-border bg-card text-card-foreground hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors flex items-center gap-1.5"
            aria-label="Toggle telemetry drift mode"
          >
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">
              {telemetryMode === "standard" ? "Precision Mode" : "Delta Drift"}
            </span>
          </button>
        </div>
      </div>

      {/* Dominant Display Stadium Scoreboard Hero */}
      <div className="p-5 sm:p-7 md:p-8 bg-card border-b border-border relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                Primary Target Splice
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-primary/10 text-primary border border-primary/20">
                L-Threshold
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span 
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter text-foreground font-[family-name:var(--font-display)]"
              >
                {primaryMetric?.value}
              </span>
              <span 
                className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-tight text-primary font-[family-name:var(--font-display)]"
              >
                {primaryMetric?.unit}
              </span>

              {primaryMetric?.delta !== undefined && (
                <div 
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-xs sm:text-sm font-bold font-mono tracking-tight ${
                    primaryMetric.positive
                      ? "bg-primary text-primary-foreground"
                      : "bg-destructive text-accent-foreground"
                  }`}
                >
                  {primaryMetric.positive ? (
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>
                    {primaryMetric.delta > 0 ? `+${primaryMetric.delta}` : primaryMetric.delta}
                    {primaryMetric.unit === "%" ? "%" : ""}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1.5 pt-1">
              <Target className="w-3.5 h-3.5 text-primary" />
              Focus Split: <strong className="text-foreground">{primaryMetric?.label}</strong> calibrated for competition gates.
            </p>
          </div>

          {/* Micro Telemetry Graph / Delta Strip Gauge */}
          <div className="w-full lg:w-80 bg-background rounded-[var(--radius-md)] p-3.5 border border-border space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted-foreground uppercase tracking-wider">Gate Dispersion</span>
              <span className="text-primary font-bold">±0.4% Target Sync</span>
            </div>
            
            {/* Split Interval Micro-Bars */}
            <div className="grid grid-cols-12 gap-1 h-6 items-end">
              {[45, 60, 52, 78, 88, 92, 100, 96, 94, 82, 90, 95].map((height, i) => (
                <div
                  key={i}
                  className="w-full rounded-[var(--radius-sm)] transition-all"
                  style={{
                    height: `${height}%`,
                    backgroundColor: i === 6 ? "var(--primary)" : i > 8 ? "var(--muted)" : "var(--border)"
                  }}
                  title={`Split block ${i + 1}: ${height}% output`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border">
              <span>Split 01</span>
              <span className="text-foreground font-semibold">MID-BLOCK LOCK</span>
              <span>Split 12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Grid — High-Density Scoreboard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border bg-card">
        {metrics.map((item, idx) => {
          const isSelected = activeSlot === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlot(idx)}
              className={`p-4 sm:p-5 text-left transition-all relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] ${
                isSelected 
                  ? "bg-background/90" 
                  : "hover:bg-background/40"
              }`}
              aria-pressed={isSelected}
              aria-label={`View stats for ${item.label}`}
            >
              {/* Active Indicator Top Notch */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
                
                {item.delta !== undefined && (
                  <span
                    className={`inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[var(--radius-sm)] shrink-0 ${
                      item.positive 
                        ? "bg-primary/20 text-primary border border-primary/30" 
                        : "bg-destructive/20 text-destructive border border-destructive/30"
                    }`}
                  >
                    {item.delta > 0 ? `+${item.delta}` : item.delta}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span 
                  className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-foreground font-[family-name:var(--font-display)]"
                >
                  {item.value}
                </span>
                <span className="text-xs uppercase font-bold text-muted-foreground font-[family-name:var(--font-display)]">
                  {item.unit}
                </span>
              </div>

              {/* Embedded micro-delta bar showing fidelity relative to baseline */}
              <div className="mt-3 w-full bg-border h-1 rounded-[var(--radius-full)] overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 rounded-[var(--radius-full)]"
                  style={{
                    width: typeof item.value === "string" && item.value.includes(":") ? "84%" : `${Math.min(parseFloat(String(item.value)) || 75, 100)}%`,
                    backgroundColor: isSelected ? "var(--primary)" : "var(--secondary)"
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Telemetry Footer Band */}
      <div className="bg-background/95 border-t border-border px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono text-[11px] tracking-tight">
            DATA FREQ: <strong className="text-foreground">250Hz SENSOR POLLING</strong>
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-[var(--radius-full)] bg-success" />
            TELEMETRY LIVE
          </span>
          <span className="text-border">•</span>
          <span className="text-foreground">LATENCY 14ms</span>
        </div>
      </div>
    </section>
  );
}
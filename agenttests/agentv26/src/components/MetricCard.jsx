import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function MetricCard({
  label = "Metric",
  value = "0",
  unit = "",
  delta,
  positive = true,
}) {
  const hasDelta = typeof delta === "number";
  const isNeutral = delta === 0;

  return (
    <div className="flex flex-col justify-between p-5 bg-card text-card-foreground border border-border rounded-[var(--radius-lg)] hover:border-foreground/30 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground font-[var(--font-display)]">
          {label}
        </span>
        {hasDelta && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-semibold tabular-nums ${
              isNeutral
                ? "bg-muted text-muted-foreground"
                : positive
                ? "bg-secondary text-success"
                : "bg-secondary text-destructive"
            }`}
          >
            {isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {positive && !isNeutral ? "+" : ""}
              {delta}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 mt-auto">
        <span className="text-4xl font-black tracking-tight text-foreground font-[var(--font-display)] tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-lg font-bold text-muted-foreground font-[var(--font-display)]">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span>vs. previous period</span>
        <svg
          className="w-16 h-4 stroke-current opacity-70"
          viewBox="0 0 64 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d={
              positive
                ? "M2 14 L18 10 L34 12 L50 4 L62 2"
                : "M2 3 L18 5 L34 8 L50 7 L62 13"
            }
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
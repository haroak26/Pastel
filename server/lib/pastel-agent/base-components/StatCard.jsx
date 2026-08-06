import { TrendingDown, TrendingUp } from "lucide-react";

function Sparkline({ data, positive }) {
  const w = 96;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 4 - ((v - min) / span) * (h - 8)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={positive ? "var(--success)" : "var(--destructive)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  delta,
  positive = true,
  note,
  icon,
  spark = [],
  className = "",
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 text-card-foreground ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {spark.length > 1 && <Sparkline data={spark} positive={positive} />}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}>
          {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta > 0 ? `+${delta}%` : `${delta}%`}
        </span>
        {note && <span className="truncate text-xs text-muted-foreground">{note}</span>}
      </div>
    </div>
  );
}

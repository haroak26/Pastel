/**
 * Token-driven progress ring (streaks, goals, weekly targets). Sized for the
 * slot it renders in — never a full-page widget.
 */
export default function Meter({ value = 0, max = 100, label = "", suffix = "", color = "var(--primary)", size = 72, stroke = 8 }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label || "Progress"}>
          <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle
            cx={mid}
            cy={mid}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${((pct / 100) * c).toFixed(1)} ${c.toFixed(1)}`}
            transform={`rotate(-90 ${mid} ${mid})`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
          {value}{suffix}
        </span>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

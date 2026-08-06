/** Circular progress ring — completion/achievement moments. */
export default function StatRing({ label = "", value = 0, max = 100, unit = "%", size = 96, className = "" }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${label} ${value}${unit}`}>
        <svg viewBox="0 0 80 80" width={size} height={size} className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tracking-tight tabular-nums">
            {value}
            <span className="text-[10px] font-semibold text-muted-foreground">{unit}</span>
          </span>
        </div>
      </div>
      {label && <span className="mt-2 text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}

/** Minimal inline map-style visual — a location card for stays/products. */
export default function MapCard({ title = "", subtitle = "", markers = 3, className = "" }) {
  const dots = [];
  for (let i = 0; i < markers; i++) {
    dots.push(
      <circle
        key={i}
        cx={26 + i * 54}
        cy={38 + ((i * 37) % 44)}
        r={i === 0 ? 6 : 4}
        fill={i === 0 ? "var(--primary)" : "var(--accent)"}
      />,
    );
  }
  return (
    <div className={`overflow-hidden rounded-xl border bg-card ${className}`}>
      <div className="relative aspect-[16/9] bg-muted/40">
        <svg viewBox="0 0 160 90" width="100%" height="100%" className="text-muted-foreground/60" role="img" aria-label="Map">
          <g stroke="currentColor" strokeOpacity="0.5" strokeWidth="1">
            <line x1="0" x2="160" y1="22" y2="22" />
            <line x1="0" x2="160" y1="45" y2="45" />
            <line x1="0" x2="160" y1="68" y2="68" />
            <line x1="40" x2="40" y1="0" y2="90" />
            <line x1="80" x2="80" y1="0" y2="90" />
            <line x1="120" x2="120" y1="0" y2="90" />
          </g>
          <path d="M8 74 Q40 52 76 60 T152 34" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
          {dots}
        </svg>
      </div>
      <div className="px-4 py-3">
        <p className="truncate text-sm font-semibold tracking-tight">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

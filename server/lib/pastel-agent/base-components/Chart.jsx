/**
 * Token-driven SVG chart: area, bars, or line — single series via `data` or
 * multi-series via `series`. Chart colors via --chart-N vars. v8: smooth
 * curves, end-point value labels, cleaner tick formatting, taller defaults.
 */
function smoothPath(points) {
  if (points.length < 3) return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function fmt(v, unit) {
  const num = v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v >= 100 ? Math.round(v).toString() : (Math.round(v * 10) / 10).toString();
  return unit && unit.startsWith("$") ? unit + num : num + (unit ? " " + unit : "");
}

export default function Chart({ data, series, type = "area", color = "var(--chart-1)", height = 280, unit = "", yMax, yMin, showAxis = true }) {
  const W = 640;
  const H = height;
  const PAD = { top: 18, right: 14, bottom: showAxis ? 28 : 8, left: showAxis ? 46 : 10 };

  const sets = series && series.length > 0
    ? series.map((s, i) => ({ points: s.points, color: s.color ?? `var(--chart-${Math.min(i + 1, 6)})`, unit: s.unit ?? unit, label: s.label }))
    : [{ points: data ?? [], color, unit, label: "" }];

  const valid = sets.filter((s) => s.points && s.points.length >= 2);
  if (valid.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data
      </div>
    );
  }

  const all = valid.flatMap((s) => s.points.map((d) => d.y));
  const max = yMax ?? Math.max(...all) * 1.12;
  const min = yMin ?? Math.min(0, Math.min(...all) * 0.9);
  const span = max - min || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i, len) => PAD.left + (i / (len - 1)) * innerW;
  const y = (v) => PAD.top + (1 - (v - min) / span) * innerH;

  const gridLines = [];
  for (let i = 0; i <= 4; i++) gridLines.push(PAD.top + (innerH * i) / 4);

  const yTicks = [min, min + span * 0.5, max];
  const lastSet = valid[valid.length - 1];
  const xLabels = lastSet.points.length > 4
    ? [0, Math.floor((lastSet.points.length - 1) / 2), lastSet.points.length - 1]
    : lastSet.points.map((_d, i) => i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={lastSet.label || "Chart"}>
      <g className="chart-grid">
        {gridLines.map((gy, i) => (
          <line key={i} x1={PAD.left} x2={W - PAD.right} y1={gy} y2={gy} />
        ))}
      </g>
      <g className="chart-axis">
        {yTicks.map((v, i) => (
          <text key={i} x={PAD.left - 8} y={y(v) + 4} textAnchor="end">
            {fmt(v, valid[0].unit)}
          </text>
        ))}
        {showAxis &&
          xLabels.map((i) => (
            <text key={i} x={x(i, lastSet.points.length)} y={H - 8} textAnchor="middle">
              {lastSet.points[i].x}
            </text>
          ))}
      </g>
      {valid.map((s, si) => {
        const pts = s.points.map((d, i) => [x(i, s.points.length), y(d.y)]);
        const line = smoothPath(pts);
        const last = pts[pts.length - 1];
        const lastPt = s.points[s.points.length - 1];
        const isLast = si === valid.length - 1;
        return (
          <g key={si}>
            {type !== "bars" && (
              <>
                <path
                  d={`${line} L${pts[pts.length - 1][0].toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${pts[0][0].toFixed(1)},${(H - PAD.bottom).toFixed(1)} Z`}
                  fill={s.color}
                  fillOpacity="0.1"
                  stroke="none"
                />
                <path d={line} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {isLast && (
                  <>
                    <circle cx={last[0]} cy={last[1]} r="3.5" fill={s.color} />
                    <text x={last[0] - 6} y={last[1] - 8} textAnchor="end" className="chart-axis" fill="var(--muted-foreground)">
                      {fmt(lastPt.y, s.unit)}
                    </text>
                  </>
                )}
              </>
            )}
            {type === "bars" &&
              s.points.map((d, i) => {
                const bw = Math.min(26, (innerW / s.points.length) * 0.62);
                return (
                  <rect
                    key={i}
                    x={x(i, s.points.length) - bw / 2}
                    y={y(d.y)}
                    width={bw}
                    height={H - PAD.bottom - y(d.y)}
                    rx="3"
                    fill={s.color}
                    fillOpacity="0.85"
                  />
                );
              })}
          </g>
        );
      })}
    </svg>
  );
}

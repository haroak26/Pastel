import { cn } from "@/lib/utils";

/*
 * The Pastel wave divider — a soft, filled echo of the Pastel mark used to
 * separate hero / CTA sections. Each variant lays out the same brand
 * gradient differently (direction, stops, band colors, phases) so every
 * wave on the site reads as its own, unique shape.
 *
 * The wave renders into whatever height you give it via `className`
 * (e.g. "h-[150px] md:h-[190px]"). Use `flip` to mirror it vertically for
 * dividers that sit above a section instead of below it.
 */

export type WaveVariant = "hero" | "cta" | "contact";

const WAVE_W = 1440;
const WAVE_H = 240;
const WAVE_BASE = 30;
const WAVE_DIP = 56;

const WAVE_HARMONICS: Array<[number, number, number]> = [
  [7, 760, 0.3],
  [4, 470, 3.1],
  [2.5, 290, 1.3],
];

interface WaveStyle {
  gradientId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: Array<{ offset: string; color: string }>;
  bands: Array<{ offset: number; thickness: number; color: string; opacity: number; phase: number }>;
}

const WAVE_STYLES: Record<WaveVariant, WaveStyle> = {
  /* Landing hero — cool blue sweeping up through purple into warm pink. */
  hero: {
    gradientId: "hero-wave-grad",
    x1: 0,
    y1: 1,
    x2: 1,
    y2: 0,
    stops: [
      { offset: "0", color: "#2a77f8" },
      { offset: "0.27", color: "#5088f6" },
      { offset: "0.48", color: "#6373e5" },
      { offset: "0.66", color: "#9a71ce" },
      { offset: "0.81", color: "#dc71aa" },
      { offset: "0.93", color: "#fa778c" },
      { offset: "1", color: "#fd7476" },
    ],
    bands: [
      { offset: -10, thickness: 58, color: "#71a7f9", opacity: 0.15, phase: 0.2 },
      { offset: 27, thickness: 63, color: "#a7c9fa", opacity: 0.12, phase: 2.7 },
      { offset: 66, thickness: 59, color: "#9f8de6", opacity: 0.13, phase: 5.0 },
      { offset: 104, thickness: 64, color: "#d48ccf", opacity: 0.12, phase: 1.4 },
      { offset: 144, thickness: 61, color: "#f486b0", opacity: 0.11, phase: 4.3 },
      { offset: 182, thickness: 58, color: "#fc859a", opacity: 0.10, phase: 2.0 },
    ],
  },

  /* Footer CTA divider — warm pink fading to periwinkle on a mirrored axis. */
  cta: {
    gradientId: "cta-wave-grad",
    x1: 1,
    y1: 1,
    x2: 0,
    y2: 0,
    stops: [
      { offset: "0", color: "#fd7476" },
      { offset: "0.2", color: "#fa778c" },
      { offset: "0.42", color: "#dc71aa" },
      { offset: "0.64", color: "#9a71ce" },
      { offset: "0.84", color: "#6373e5" },
      { offset: "1", color: "#5088f6" },
    ],
    bands: [
      { offset: -12, thickness: 60, color: "#fc859a", opacity: 0.15, phase: 3.2 },
      { offset: 26, thickness: 62, color: "#f486b0", opacity: 0.12, phase: 0.9 },
      { offset: 66, thickness: 60, color: "#d48ccf", opacity: 0.13, phase: 4.6 },
      { offset: 104, thickness: 64, color: "#9f8de6", opacity: 0.12, phase: 2.1 },
      { offset: 144, thickness: 60, color: "#a7c9fa", opacity: 0.11, phase: 5.7 },
      { offset: 182, thickness: 58, color: "#71a7f9", opacity: 0.10, phase: 2.8 },
    ],
  },

  /* Contact footer — bright sweep, blues concentrated at the leading edge. */
  contact: {
    gradientId: "contact-wave-grad",
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 1,
    stops: [
      { offset: "0", color: "#5088f6" },
      { offset: "0.28", color: "#2a77f8" },
      { offset: "0.52", color: "#9f8de6" },
      { offset: "0.76", color: "#fa778c" },
      { offset: "1", color: "#fd7476" },
    ],
    bands: [
      { offset: -8, thickness: 58, color: "#71a7f9", opacity: 0.14, phase: 1.1 },
      { offset: 32, thickness: 62, color: "#9f8de6", opacity: 0.11, phase: 3.8 },
      { offset: 70, thickness: 60, color: "#d48ccf", opacity: 0.12, phase: 0.5 },
      { offset: 108, thickness: 64, color: "#fc859a", opacity: 0.11, phase: 5.9 },
      { offset: 148, thickness: 60, color: "#a7c9fa", opacity: 0.10, phase: 2.2 },
    ],
  },
};

function waveHeight(x: number, offset = 0, phase = 0) {
  let y = WAVE_BASE + offset + WAVE_DIP * Math.sin((Math.PI * x) / WAVE_W) ** 2;
  for (const [a, l, p] of WAVE_HARMONICS) {
    y += a * Math.sin((2 * Math.PI * x) / l + p + phase);
  }
  return y;
}

function wavePath(offset: number, phase = 0) {
  const n = 160;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (WAVE_W * i) / n;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${waveHeight(x, offset, phase).toFixed(1)}`);
  }
  return `${pts.join(" ")} L ${WAVE_W} ${WAVE_H} L 0 ${WAVE_H} Z`;
}

function waveRibbonPath(band: WaveStyle["bands"][number]) {
  const n = 160;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (WAVE_W * i) / n;
    top.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${waveHeight(x, band.offset, band.phase).toFixed(1)}`);
    bottom.unshift(`L ${x.toFixed(1)} ${waveHeight(x, band.offset + band.thickness, band.phase + 0.7).toFixed(1)}`);
  }
  return `${top.join(" ")} ${bottom.join(" ")} Z`;
}

export function HeroWave({
  variant = "hero",
  flip = false,
  className,
}: {
  variant?: WaveVariant;
  /** Mirror vertically — use for dividers that sit above a section. */
  flip?: boolean;
  className?: string;
}) {
  const style = WAVE_STYLES[variant];
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 overflow-hidden",
        flip ? "top-0" : "bottom-0",
        className,
      )}
      aria-hidden
    >
      <svg
        className={cn("block h-full w-full", flip && "-scale-y-100")}
        viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={style.gradientId} x1={style.x1} y1={style.y1} x2={style.x2} y2={style.y2}>
            {style.stops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <path d={wavePath(0)} fill={`url(#${style.gradientId})`} />
        {style.bands.map((band) => (
          <path key={band.offset} d={waveRibbonPath(band)} fill={band.color} opacity={band.opacity} />
        ))}
      </svg>
    </div>
  );
}

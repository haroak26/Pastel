import { cn } from "@/lib/utils";

/*
 * The Pastel streak divider — a line of tapered streak ribbons that mirror
 * the streak burst of the Pastel mark. Each streak has a domed top and
 * leans away from the centre (up-left on the left, up-right on the right),
 * with streaks biggest at the outer edges and shortest in the middle.
 * Colours sweep in muted steps from brand blue to coral so both brand
 * colours anchor the divider without the candy pastels.
 *
 * The divider renders into whatever height you give it via `className`
 * (e.g. "h-[150px] md:h-[190px]"). Use `flip` to mirror it vertically for
 * dividers that sit above a section instead of below it. On small screens
 * the streak line is pulled lower into the divider.
 */

export type WaveVariant = "hero" | "cta" | "contact";

const WAVE_W = 1440;
const WAVE_H = 240;
const STREAK_COUNT = 18;
const STREAK_BASE_W = WAVE_W / STREAK_COUNT;
const STREAK_TIP_W = 20;
const MAX_H = 195; /* tallest at the outer edges */
const MIN_H = 150; /* shortest in the middle */
const LEAN = 18;

const HERO_COLORS = [
  "#0B99FF",
  "#1997F7",
  "#2895EF",
  "#3692E7",
  "#4490DF",
  "#528ED7",
  "#608CCF",
  "#6F8AC7",
  "#7D88BF",
  "#8B85B6",
  "#9983AE",
  "#A881A6",
  "#B67F9E",
  "#C47D96",
  "#D27A8E",
  "#E07886",
  "#EF767E",
  "#FD7476",
];

const STREAK_COLORS: Record<WaveVariant, string[]> = {
  /* Brand blue sweeping to coral. */
  hero: HERO_COLORS,

  /* Footer CTA divider — the same streak line, swept the other way. */
  cta: [...HERO_COLORS].reverse(),

  /* Contact footer — same sweep as the hero. */
  contact: HERO_COLORS,
};

function streakHeight(x: number) {
  const t = Math.sin((Math.PI * x) / WAVE_W);
  return MAX_H - (MAX_H - MIN_H) * t;
}

function streakPath(i: number) {
  const xi = (i + 0.5) * STREAK_BASE_W;
  const h = streakHeight(xi);
  const dir = xi < WAVE_W / 2 ? -1 : 1;
  const tipX = xi + dir * LEAN;
  const tipY = WAVE_H - h;
  const tipL = tipX - STREAK_TIP_W / 2;
  const tipR = tipX + STREAK_TIP_W / 2;
  const x0 = i * STREAK_BASE_W - 0.5;
  const x1 = (i + 1) * STREAK_BASE_W + 0.5;
  const r = STREAK_TIP_W / 2;

  /* Domed top: two quarter arcs meet at the tip centre so the top edge is
     one continuous rounded cap with no flat run between the corners. */
  const rdx = x1 - tipR;
  const rdy = WAVE_H - tipY;
  const rlen = Math.hypot(rdx, rdy);
  const rbX = tipR + (rdx / rlen) * r;
  const rbY = tipY + (rdy / rlen) * r;

  const ldx = x0 - tipL;
  const ldy = WAVE_H - tipY;
  const llen = Math.hypot(ldx, ldy);
  const lbX = tipL + (ldx / llen) * r;
  const lbY = tipY + (ldy / llen) * r;

  return `M ${x0} ${WAVE_H} L ${x1} ${WAVE_H} L ${rbX.toFixed(1)} ${rbY.toFixed(1)} Q ${tipR.toFixed(1)} ${tipY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${tipL.toFixed(1)} ${tipY.toFixed(1)} ${lbX.toFixed(1)} ${lbY.toFixed(1)} Z`;
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
  const colors = STREAK_COLORS[variant];
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
        className={cn(
          "block h-full w-full",
          flip && "-scale-y-100",
          !flip && "max-md:origin-bottom max-md:scale-y-[0.72]",
        )}
        viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
        preserveAspectRatio="none"
      >
        {colors.map((color, i) => (
          <path key={color + i} d={streakPath(i)} fill={color} />
        ))}
      </svg>
    </div>
  );
}

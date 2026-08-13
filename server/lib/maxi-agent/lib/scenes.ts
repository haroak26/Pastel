/**
 * V11 scene generator — deterministic, local, generative product imagery.
 *
 * Every media tile (catalog cards, detail gallery, mosaics) renders as a
 * hand-composed SVG scene generated from the run's seed — no network, no
 * picsum, no failed loads. Each domain has a scene archetype (villa, track,
 * album art, chat, product, board, card) so tiles evoke their domain.
 *
 * V11 changes (Figma-quality imagery):
 * - Scenes are seeded PER ITEM (`hashSeed(item.id)`), never per slot: a
 *   catalog row always renders the same art everywhere, and the detail
 *   gallery renders ONE item's five angle/crop variants (`crop` parameter) —
 *   the "five different houses in one gallery" class of bug is impossible.
 * - The stay archetype was rebuilt toward photography: gradient sky, sun
 *   glow, clouds, layered hills, window grids, door, chimney, fence, path,
 *   and ground shadows. Scene art is imagery — the no-gradient UI rule does
 *   not apply inside tiles.
 * - Colors come from the theme's chart palette via CSS custom properties
 *   (flips with light/dark).
 *
 * Rules honored: no external resources, every scene fills its viewBox,
 * seeded reproducibility: same (domain, seed, n, crop) always produces the
 * same artwork.
 */

import { mulberry32 } from "./domains";

export const SCENE_VIEWBOX = "0 0 400 250";

type Rnd = () => number;

function pick<T>(rnd: Rnd, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function between(rnd: Rnd, min: number, max: number): number {
  return min + rnd() * (max - min);
}

/** One of the theme's chart palette colors. */
function chart(rnd: Rnd, max = 6): string {
  return `var(--chart-${Math.floor(rnd() * max) + 1})`;
}

/**
 * V11 crop presets — the detail gallery's "five photos of one property":
 * each angle pans/zooms the SAME composed scene (transform around the
 * 400×250 viewBox center). Angle 0 is the full hero shot.
 */
const CROPS: Array<{ s: number; tx: number; ty: number }> = [
  { s: 1, tx: 0, ty: 0 },        // full establishing shot
  { s: 1.35, tx: -0.08, ty: 0 }, // centered close-up
  { s: 1.7, tx: -0.22, ty: 0 },  // house detail
  { s: 1.25, tx: 0.22, ty: 0 },  // right pan (hills + sky)
  { s: 1.85, tx: -0.3, ty: -0.1 }, // entrance/porch detail
];

/** Wrap a scene body with its crop transform + title. */
function svg(body: string, title: string, seed: number, crop: number): string {
  const c = CROPS[crop % CROPS.length] ?? CROPS[0];
  const tx = (1 - c.s) * 200 - c.tx * 400;
  const ty = (1 - c.s) * 125 - c.ty * 250;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${title}"><title>${title}</title><g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${c.s})">${body}</g></svg>`;
}

/** Theme-aware sky gradient (scenes only — imagery, not UI panels). */
function skyDef(rnd: Rnd, seed: number): { def: string; url: string } {
  const id = `sky${seed}`;
  const top = chart(rnd, 6);
  const bottom = chart(rnd, 4);
  return {
    def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${top}"/><stop offset="100%" stop-color="${bottom}"/></linearGradient>`,
    url: `url(#${id})`,
  };
}

/** Clouds — soft rounded groups drifting across the sky. */
function clouds(rnd: Rnd, n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) {
    const cx = between(rnd, 40, 360);
    const cy = between(rnd, 30, 90);
    const r = between(rnd, 16, 30);
    out += `<g fill="var(--background)" opacity="${(0.25 + rnd() * 0.3).toFixed(2)}">
<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(r * 0.6).toFixed(0)}"/>
<circle cx="${(cx + r * 0.9).toFixed(0)}" cy="${(cy + r * 0.15).toFixed(0)}" r="${(r * 0.45).toFixed(0)}"/>
<circle cx="${(cx - r * 0.85).toFixed(0)}" cy="${(cy + r * 0.2).toFixed(0)}" r="${(r * 0.4).toFixed(0)}"/>
<rect x="${(cx - r).toFixed(0)}" y="${(cy + r * 0.15).toFixed(0)}" width="${(r * 1.8).toFixed(0)}" height="${(r * 0.35).toFixed(0)}" rx="${(r * 0.18).toFixed(0)}"/>
</g>`;
  }
  return out;
}

/** Ground shadows under structures (photographic grounding). */
function groundShadow(x: number, w: number, y: number, opacity: number): string {
  return `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${(w * 0.09).toFixed(0)}" fill="var(--background)" opacity="${opacity}"/>`;
}

// ── Scene archetypes (each returns the raw body — sceneSvg applies the crop) ──

/** Stays & travel: gradient sky, sun glow, clouds, layered hills, and a
 * house with windows, door, chimney, fence, path, and ground shadow. */
function sceneStay(rnd: Rnd, seed: number): string {
  const sky = skyDef(rnd, seed);
  const hillA = chart(rnd, 4);
  const hillB = chart(rnd, 4);
  const house = chart(rnd, 3);
  const roof = chart(rnd, 3);
  const accent = chart(rnd, 5);
  const houseX = Math.round(between(rnd, 100, 230));
  const houseW = Math.round(between(rnd, 100, 150));
  const houseH = Math.round(between(rnd, 64, 96));
  const houseY = 250 - houseH - Math.round(between(rnd, 6, 16));
  const roofH = Math.round(houseW * 0.34);
  const doorW = Math.round(houseW * 0.16);
  const doorH = Math.round(houseH * 0.48);
  const sunX = Math.round(between(rnd, 300, 372));
  const hasPalm = rnd() > 0.35;
  const palmX = Math.round(between(rnd, 24, 380));
  const hasFence = rnd() > 0.4;
  const fenceX = Math.round(between(rnd, 30, 120));

  // Window grid — the same house always keeps the same window pattern.
  const winCols = 2 + Math.floor(rnd() * 2);
  const winRows = 2;
  const winW = Math.max(10, Math.round(houseW * 0.14));
  const winH = Math.round(winW * 0.85);
  const gapX = Math.round((houseW - winCols * winW) / (winCols + 1));
  const winStartY = houseY + Math.round(houseH * 0.2);
  let windows = "";
  for (let c = 0; c < winCols; c++) {
    for (let r = 0; r < winRows; r++) {
      const wx = houseX + gapX * (c + 1) + winW * c;
      const wy = winStartY + winH * r + Math.round(houseH * 0.08) * r;
      if (wy + winH > houseY + houseH - doorH - 6) continue;
      windows += `<rect x="${wx}" y="${wy}" width="${winW}" height="${winH}" rx="2" fill="${sky.url}" opacity="0.9"/>
<line x1="${wx}" x2="${wx + winW}" y1="${wy + winH / 2}" y2="${wy + winH / 2}" stroke="var(--background)" stroke-width="1.5" opacity="0.7"/>
<line x1="${wx + winW / 2}" x2="${wx + winW / 2}" y1="${wy}" y2="${wy + winH}" stroke="var(--background)" stroke-width="1.5" opacity="0.7"/>`;
    }
  }

  return `<defs>${sky.def}</defs>
<rect width="400" height="250" fill="${sky.url}" opacity="0.55"/>
<circle cx="${sunX}" cy="46" r="34" fill="${accent}" opacity="0.28"/>
<circle cx="${sunX}" cy="46" r="17" fill="${accent}" opacity="0.55"/>
${clouds(rnd, 2 + Math.floor(rnd() * 2))}
<path d="M0 250 L0 176 Q100 122 210 168 T400 152 L400 250 Z" fill="${hillB}" opacity="0.5"/>
<path d="M0 250 L0 200 Q130 164 250 198 T400 186 L400 250 Z" fill="${hillA}" opacity="0.4"/>
${groundShadow(houseX + houseW / 2, houseW + 60, houseY + houseH + 2, 0.22)}
<rect x="${houseX}" y="${houseY}" width="${houseW}" height="${houseH}" rx="5" fill="${house}" opacity="0.95"/>
<polygon points="${houseX - 16},${houseY} ${houseX + houseW / 2},${houseY - roofH} ${houseX + houseW + 16},${houseY}" fill="${roof}" opacity="0.95"/>
<rect x="${houseX + houseW * 0.42}" y="${houseY - roofH * 0.72}" width="${Math.round(houseW * 0.16)}" height="${Math.round(roofH * 0.72)}" rx="2" fill="${house}" opacity="0.9"/>
${windows}
<rect x="${houseX + houseW - doorW - 10}" y="${houseY + houseH - doorH}" width="${doorW}" height="${doorH}" rx="2" fill="var(--background)" opacity="0.9"/>
<circle cx="${houseX + houseW - doorW - 10 + 5}" cy="${houseY + houseH - doorH / 2}" r="1.6" fill="${accent}"/>
${hasFence ? `<g stroke="${house}" stroke-width="2" opacity="0.75"><line x1="${fenceX}" y1="${houseY + houseH}" x2="${fenceX}" y2="242"/><line x1="${fenceX + 14}" y1="${houseY + houseH}" x2="${fenceX + 14}" y2="242"/><line x1="${fenceX + 28}" y1="${houseY + houseH}" x2="${fenceX + 28}" y2="242"/><line x1="${fenceX - 4}" y1="236" x2="${fenceX + 32}" y2="236"/><line x1="${fenceX - 4}" y1="243" x2="${fenceX + 32}" y2="243"/></g>` : ""}
${hasPalm ? `<path d="M${palmX} 250 L${palmX} ${Math.round(between(rnd, 58, 108))}" stroke="${accent}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.9"/>
<path d="M${palmX} ${Math.round(between(rnd, 58, 108))} Q${palmX - 28} ${Math.round(between(rnd, 28, 50))},${palmX - 10} ${Math.round(between(rnd, 22, 40))}" stroke="${accent}" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M${palmX} ${Math.round(between(rnd, 58, 108))} Q${palmX + 28} ${Math.round(between(rnd, 28, 50))},${palmX + 10} ${Math.round(between(rnd, 22, 40))}" stroke="${accent}" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M${palmX} ${Math.round(between(rnd, 58, 108))} Q${palmX} ${Math.round(between(rnd, 34, 54))},${palmX - 4} ${Math.round(between(rnd, 22, 34))}" stroke="${accent}" stroke-width="5" stroke-linecap="round" fill="none"/>` : ""}
<rect x="0" y="240" width="400" height="10" fill="${accent}" opacity="0.5"/>`;
}

/** Ecommerce: product on a pedestal with a highlight and ground shadow. */
function sceneProduct(rnd: Rnd, _seed: number): string {
  const back = chart(rnd);
  const pedestal = chart(rnd, 4);
  const product = chart(rnd, 3);
  const accent = chart(rnd, 5);
  const w = Math.round(between(rnd, 90, 150));
  const h = Math.round(between(rnd, 70, 110));
  const x = Math.round(between(rnd, 120, 210));
  const y = 250 - 46 - h;
  const round = Math.round(between(rnd, 8, 40));
  return `<rect width="400" height="250" fill="${back}" opacity="0.18"/>
<path d="M${x - 34} 250 L${x - 12} 204 H${x + w + 12} L${x + w + 34} 250 Z" fill="${pedestal}" opacity="0.8"/>
${groundShadow(x + w / 2, w + 90, 202, 0.18)}
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${round}" fill="${product}" opacity="0.95"/>
<path d="M${x + 14} ${y + h - 16} Q${x + w / 2} ${y + h - 40},${x + w - 14} ${y + h - 16}" stroke="${accent}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.9"/>
<circle cx="${Math.round(between(rnd, 30, 120))}" cy="${Math.round(between(rnd, 24, 70))}" r="6" fill="${accent}" opacity="0.8"/>
<circle cx="${Math.round(between(rnd, 300, 372))}" cy="${Math.round(between(rnd, 30, 80))}" r="4" fill="${chart(rnd, 5)}" opacity="0.8"/>`;
}

/** Fitness: running lanes with a runner and lane shadows. */
function sceneTrack(rnd: Rnd, _seed: number): string {
  const field = chart(rnd);
  const lane = chart(rnd, 3);
  const laneB = chart(rnd, 4);
  const runner = chart(rnd, 5);
  const rx = Math.round(between(rnd, 120, 300));
  return `<rect width="400" height="250" fill="${field}" opacity="0.16"/>
<rect x="40" y="52" width="320" height="150" rx="75" fill="none" stroke="${lane}" stroke-width="16" opacity="0.85"/>
<rect x="58" y="70" width="284" height="114" rx="57" fill="none" stroke="${laneB}" stroke-width="3" opacity="0.7"/>
<rect x="90" y="180" width="220" height="10" rx="5" fill="${field}" opacity="0.5"/>
${groundShadow(rx, 60, 156, 0.2)}
<circle cx="${rx}" cy="140" r="14" fill="${runner}" opacity="0.95"/>
<path d="M${rx - 26} 152 Q${rx - 40} ${Math.round(between(rnd, 120, 150))},${rx - 52} ${Math.round(between(rnd, 108, 140))}" stroke="${runner}" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M${rx + 14} 128 Q${rx + 30} 112,${rx + 44} ${Math.round(between(rnd, 96, 120))}" stroke="${runner}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}

/** Media: vinyl-style album art or equalizer bars. */
function sceneMedia(rnd: Rnd, _seed: number): string {
  const back = chart(rnd);
  const vinyl = chart(rnd, 3);
  const accent = chart(rnd, 5);
  if (rnd() > 0.5) {
    const cx = Math.round(between(rnd, 150, 250));
    const cy = Math.round(between(rnd, 110, 140));
    const r = Math.round(between(rnd, 52, 68));
    return `<rect width="400" height="250" fill="${back}" opacity="0.18"/>
${groundShadow(cx, r * 2.4, cy + r + 8, 0.2)}
<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="14" fill="${vinyl}" opacity="0.95"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--background)" stroke-width="2" opacity="0.75"/>
<circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.62)}" fill="none" stroke="var(--background)" stroke-width="2" opacity="0.6"/>
<circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.3)}" fill="none" stroke="var(--background)" stroke-width="2" opacity="0.5"/>
<circle cx="${cx}" cy="${cy}" r="7" fill="${accent}"/>`;
  }
  const bars = [46, 82, 118, 154, 190, 226].map((x) => {
    const h = Math.round(between(rnd, 40, 120));
    return `<rect x="${x}" y="${250 - 30 - h}" width="26" height="${h}" rx="6" fill="${chart(rnd, 5)}" opacity="0.85"/>`;
  }).join("");
  return `<rect width="400" height="250" fill="${back}" opacity="0.18"/>
<rect x="28" y="40" width="344" height="170" rx="16" fill="var(--background)" opacity="0.5"/>
${bars}`;
}

/** Social: chat bubbles. */
function sceneSocial(rnd: Rnd, _seed: number): string {
  const back = chart(rnd);
  const a = chart(rnd, 4);
  const b = chart(rnd, 4);
  const dot = chart(rnd, 5);
  const bw = Math.round(between(rnd, 120, 170));
  const bh = Math.round(between(rnd, 44, 64));
  const x1 = 36;
  const x2 = 400 - 36 - bw;
  const by = Math.round(between(rnd, 120, 136));
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
<rect x="${x1}" y="52" width="${bw}" height="${bh}" rx="20" fill="${a}" opacity="0.85"/>
<path d="M${x1 + 22} 116 L${x1 + 6} ${Math.round(between(rnd, 138, 152))} L${x1 + 44} 116 Z" fill="${a}" opacity="0.85"/>
<rect x="${x2}" y="${by}" width="${bw}" height="${bh}" rx="20" fill="${b}" opacity="0.85"/>
<path d="M${x2 + bw - 22} ${by + bh} L${x2 + bw - 6} ${Math.round(between(rnd, 160, 174))} L${x2 + bw - 44} ${by + bh} Z" fill="${b}" opacity="0.85"/>
<circle cx="${x1 + 30}" cy="${x1 > 90 ? 40 : 30}" r="16" fill="${dot}" opacity="0.9"/>
<circle cx="${x2 + bw - 30}" cy="${Math.round(between(rnd, 160, 196))}" r="16" fill="${dot}" opacity="0.9"/>
<rect x="${x1 + 18}" y="70" width="${bw - 36}" height="9" rx="4.5" fill="var(--background)" opacity="0.75"/>
<rect x="${x1 + 18}" y="88" width="${Math.round(bw * 0.55)}" height="9" rx="4.5" fill="var(--background)" opacity="0.5"/>
<rect x="${x2 + 18}" y="${by + 18}" width="${bw - 36}" height="9" rx="4.5" fill="var(--background)" opacity="0.75"/>
<rect x="${x2 + 18}" y="${by + 36}" width="${Math.round(bw * 0.5)}" height="9" rx="4.5" fill="var(--background)" opacity="0.5"/>`;
}

/** Productivity: kanban-style board with cards. */
function sceneBoard(rnd: Rnd, _seed: number): string {
  const back = chart(rnd);
  const cols = [chart(rnd, 4), chart(rnd, 4), chart(rnd, 4)];
  const colsX = [28, 152, 276];
  const colW = 96;
  const cards = colsX.map((x, ci) => {
    const n = 2 + Math.floor(rnd() * 2);
    const cardH = Math.round(between(rnd, 26, 40));
    let out = `<rect x="${x}" y="44" width="${colW}" height="172" rx="10" fill="${cols[ci]}" opacity="0.8"/>
<rect x="${x + 10}" y="58" width="${colW - 20}" height="8" rx="4" fill="var(--background)" opacity="0.7"/>`;
    for (let k = 0; k < n; k++) {
      out += `<rect x="${x + 10}" y="${74 + k * 44}" width="${colW - 20}" height="${cardH}" rx="8" fill="var(--background)" opacity="0.85"/>
<rect x="${x + 18}" y="${80 + k * 44}" width="${Math.round((colW - 36) * between(rnd, 0.5, 0.85))}" height="6" rx="3" fill="${cols[ci]}" opacity="0.8"/>`;
    }
    return out;
  }).join("");
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
${cards}
<circle cx="356" cy="30" r="9" fill="${chart(rnd, 5)}" opacity="0.9"/>
<circle cx="332" cy="30" r="9" fill="${chart(rnd, 5)}" opacity="0.7"/>`;
}

/** Finance: payment card with a trend line. */
function sceneCard(rnd: Rnd, _seed: number): string {
  const back = chart(rnd);
  const card = chart(rnd, 3);
  const accent = chart(rnd, 5);
  const cx = Math.round(between(rnd, 30, 70));
  const cy = Math.round(between(rnd, 60, 90));
  const cw = 300;
  const ch = 96;
  const points = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const x = cx + (cw * i) / 6;
    const y = cy + 62 - Math.round(between(rnd, 8, 42));
    return `${Math.round(x)},${y}`;
  }).join(" ");
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
${groundShadow(cx + cw / 2, cw + 40, cy + ch + 6, 0.18)}
<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="16" fill="${card}" opacity="0.95"/>
<circle cx="${cx + 34}" cy="${cy + 40}" r="14" fill="var(--background)" opacity="0.7"/>
<circle cx="${cx + 64}" cy="${cy + 40}" r="14" fill="${accent}" opacity="0.7"/>
<polyline points="${points}" fill="none" stroke="var(--background)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
<circle cx="${Math.round(cx + cw - 8)}" cy="${Math.round(cy + 62 - between(rnd, 8, 42))}" r="5" fill="var(--background)" opacity="0.95"/>
<rect x="${cx + 20}" y="${cy + ch - 26}" width="86" height="8" rx="4" fill="var(--background)" opacity="0.6"/>`;
}

/** Fallback: confident geometric composition. */
function sceneGeometric(rnd: Rnd, _seed: number): string {
  const back = chart(rnd);
  const a = chart(rnd, 4);
  const b = chart(rnd, 4);
  const dot = chart(rnd, 5);
  const cx = Math.round(between(rnd, 140, 230));
  const r = Math.round(between(rnd, 48, 72));
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
<circle cx="${cx}" cy="120" r="${r}" fill="${a}" opacity="0.9"/>
<rect x="${Math.round(between(rnd, 60, 120))}" y="${Math.round(between(rnd, 140, 170))}" width="120" height="30" rx="15" fill="${b}" opacity="0.85"/>
<circle cx="${Math.round(between(rnd, 300, 360))}" cy="${Math.round(between(rnd, 40, 80))}" r="9" fill="${dot}" opacity="0.9"/>
<circle cx="${Math.round(between(rnd, 40, 80))}" cy="${Math.round(between(rnd, 190, 220))}" r="12" fill="${dot}" opacity="0.75"/>`;
}

const SCENE_FNS: Record<string, (rnd: Rnd, seed: number) => string> = {
  rentals: sceneStay,
  travel: sceneStay,
  ecommerce: sceneProduct,
  fitness: sceneTrack,
  media: sceneMedia,
  social: sceneSocial,
  productivity: sceneBoard,
  finance: sceneCard,
  default: sceneGeometric,
};

// ── V15: subject × strategy media families ────────────────────────────────
//
// The run's VisualIntent picks a SUBJECT (what the imagery is about) and a
// STRATEGY (how it renders). Same (subject, strategy, seed, n, crop) always
// produces the same artwork. The old domain-keyed functions stay as the
// content-domain fallback (house/product/board/album/chat…).

/** Style context every subject family renders through. */
interface SceneStyle {
  /** Color source — the full chart palette, or a duotone pair. */
  pal: (max?: number) => string;
  /** Decorative richness (minimal strategy renders quieter). */
  rich: boolean;
}

function styleFor(strategy: string, rnd: Rnd): SceneStyle {
  if (strategy === "duotone-art") {
    // Two fixed chart colors — no full-palette noise.
    return { pal: (max = 6) => (max < 2 ? "var(--chart-1)" : rnd() > 0.5 ? "var(--chart-1)" : "var(--chart-2)"), rich: true };
  }
  if (strategy === "minimal") {
    return { pal: (max = 6) => chart(rnd, Math.min(max, 3)), rich: false };
  }
  if (strategy === "data-as-art") {
    return { pal: (max = 6) => chart(rnd, Math.min(max, 4)), rich: true };
  }
  return { pal: (max = 6) => chart(rnd, max), rich: true };
}

/** Runner family — lanes, pace clock, runner silhouette (track mode). */
function sceneRunner(rnd: Rnd, _seed: number, s: SceneStyle): string {
  const field = s.pal(6);
  const lane = s.pal(3);
  const laneB = s.pal(4);
  const runner = s.pal(5);
  const rx = Math.round(between(rnd, 120, 300));
  const clockX = Math.round(between(rnd, 40, 96));
  return `<rect width="400" height="250" fill="${field}" opacity="0.16"/>
<rect x="40" y="52" width="320" height="150" rx="75" fill="none" stroke="${lane}" stroke-width="16" opacity="0.85"/>
<rect x="58" y="70" width="284" height="114" rx="57" fill="none" stroke="${laneB}" stroke-width="3" opacity="0.7"/>
${s.rich ? `<circle cx="${clockX}" cy="34" r="16" fill="var(--background)" opacity="0.85"/><circle cx="${clockX}" cy="34" r="16" fill="none" stroke="${runner}" stroke-width="3"/><path d="M${clockX} 34 L${clockX} 26 M${clockX} 34 L${clockX + 6} 34" stroke="${runner}" stroke-width="2.5" stroke-linecap="round"/>` : ""}
<rect x="90" y="180" width="220" height="10" rx="5" fill="${field}" opacity="0.5"/>
${groundShadow(rx, 60, 156, 0.2)}
<circle cx="${rx}" cy="140" r="14" fill="${runner}" opacity="0.95"/>
<path d="M${rx - 26} 152 Q${rx - 40} ${Math.round(between(rnd, 120, 150))},${rx - 52} ${Math.round(between(rnd, 108, 140))}" stroke="${runner}" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M${rx + 14} 128 Q${rx + 30} 112,${rx + 44} ${Math.round(between(rnd, 96, 120))}" stroke="${runner}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}

/** Dumbbell family — weight plates on a floor with a mat (strength mode). */
function sceneDumbbell(rnd: Rnd, _seed: number, s: SceneStyle): string {
  const back = s.pal(6);
  const plate = s.pal(3);
  const plateB = s.pal(4);
  const bar = s.pal(5);
  const x = Math.round(between(rnd, 90, 160));
  const w = Math.round(between(rnd, 120, 180));
  const barY = Math.round(between(rnd, 118, 138));
  const plateW = 22;
  const plateH = Math.round(between(rnd, 34, 52));
  const top = barY - plateH / 2;
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
<rect x="30" y="196" width="340" height="12" rx="6" fill="${back}" opacity="0.35"/>
${s.rich ? `<rect x="40" y="150" width="320" height="52" rx="26" fill="${plateB}" opacity="0.16"/>` : ""}
${groundShadow(x + w / 2, w + 80, 196, 0.2)}
<rect x="${x}" y="${barY - 6}" width="${w}" height="12" rx="6" fill="${bar}" opacity="0.95"/>
<rect x="${x - 8}" y="${top}" width="${plateW}" height="${plateH}" rx="8" fill="${plate}" opacity="0.95"/>
<rect x="${x - plateW - 10}" y="${top + 6}" width="${plateW}" height="${plateH - 12}" rx="8" fill="${plateB}" opacity="0.9"/>
<rect x="${x + w - 14}" y="${top}" width="${plateW}" height="${plateH}" rx="8" fill="${plate}" opacity="0.95"/>
<rect x="${x + w + 2}" y="${top + 6}" width="${plateW}" height="${plateH - 12}" rx="8" fill="${plateB}" opacity="0.9"/>
<circle cx="${x + w / 2}" cy="${barY}" r="7" fill="var(--background)" opacity="0.7"/>`;
}

/** Graph family — connected nodes (networks, agents, data). */
function sceneGraph(rnd: Rnd, _seed: number, s: SceneStyle): string {
  const back = s.pal(6);
  const a = s.pal(4);
  const b = s.pal(4);
  const c = s.pal(5);
  const nodes = [
    { x: 90, y: 70, r: 18, f: a },
    { x: 300, y: 60, r: 14, f: b },
    { x: 210, y: 130, r: 22, f: c },
    { x: 110, y: 180, r: 13, f: a },
    { x: 310, y: 170, r: 16, f: b },
    { x: 200, y: 40, r: 10, f: c },
  ];
  const links = [[0, 2], [1, 2], [2, 3], [2, 4], [0, 5], [1, 5]];
  const linkStr = links.map(([i, j]) => {
    const n1 = nodes[i];
    const n2 = nodes[j];
    return `<line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" stroke="${n1.f}" stroke-width="2.5" opacity="0.55"/>`;
  }).join("");
  const nodeStr = nodes.map((n, i) => {
    const ring = s.rich && i % 2 === 0 ? `<circle cx="${n.x}" cy="${n.y}" r="${n.r + 7}" fill="none" stroke="${n.f}" stroke-width="2" opacity="0.4"/>` : "";
    return `${ring}<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.f}" opacity="0.92"/>
<circle cx="${n.x - 4}" cy="${n.y - 4}" r="${Math.max(2, n.r * 0.22)}" fill="var(--background)" opacity="0.6"/>`;
  }).join("");
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
<path d="M0 250 L0 168 Q120 130 260 178 T400 160 L400 250 Z" fill="${a}" opacity="0.22"/>
${linkStr}
${nodeStr}
${s.rich ? `<circle cx="${Math.round(between(rnd, 320, 380))}" cy="${Math.round(between(rnd, 24, 60))}" r="5" fill="${c}" opacity="0.8"/>` : ""}`;
}

/** Document family — stacked sheets with text lines. */
function sceneDoc(rnd: Rnd, _seed: number, s: SceneStyle): string {
  const back = s.pal(6);
  const sheet = s.pal(4);
  const ink = s.pal(5);
  const accent = s.pal(3);
  const x = Math.round(between(rnd, 80, 120));
  const y = Math.round(between(rnd, 40, 60));
  const w = Math.round(between(rnd, 160, 200));
  const h = Math.round(between(rnd, 120, 150));
  const lines = [0.42, 0.6, 0.78, 0.3, 0.52].map((f, i) => {
    const lw = Math.round(w * f);
    const ly = y + Math.round(h * 0.18) + i * Math.round(h * 0.16);
    if (ly + 6 > y + h - 14) return "";
    return `<rect x="${x + 18}" y="${ly}" width="${lw}" height="6" rx="3" fill="${i === 0 ? accent : ink}" opacity="${i === 0 ? 0.9 : 0.55}"/>`;
  }).join("");
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
${s.rich ? `<rect x="${x + 14}" y="${y + 14}" width="${w}" height="${h}" rx="10" fill="${sheet}" opacity="0.4"/>` : ""}
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${sheet}" opacity="0.92"/>
<rect x="${x + 18}" y="${y + 18}" width="${Math.round(w * 0.32)}" height="9" rx="4.5" fill="${accent}" opacity="0.9"/>
${lines}
<rect x="${x + 18}" y="${y + h - 20}" width="${Math.round(w * 0.24)}" height="8" rx="4" fill="${ink}" opacity="0.7"/>`;
}

/** Chat family — message bubbles (social/messaging). */
function sceneChat(rnd: Rnd, _seed: number, s: SceneStyle): string {
  const back = s.pal(6);
  const a = s.pal(4);
  const b = s.pal(4);
  const dot = s.pal(5);
  const bw = Math.round(between(rnd, 130, 180));
  const bh = Math.round(between(rnd, 42, 60));
  const x2 = 400 - 36 - bw;
  const by = Math.round(between(rnd, 122, 140));
  const bubble = (x: number, y: number, w2: number, h2: number, fill: string, tail: string): string =>
    `<rect x="${x}" y="${y}" width="${w2}" height="${h2}" rx="20" fill="${fill}" opacity="0.85"/>${tail}`;
  return `<rect width="400" height="250" fill="${back}" opacity="0.16"/>
${bubble(36, 52, bw, bh, a, `<path d="M${36 + 22} ${52 + bh} L${36 + 6} ${Math.round(between(rnd, 138, 152))} L${36 + 44} ${52 + bh} Z" fill="${a}" opacity="0.85"/>`)}
${bubble(x2, by, bw, bh, b, `<path d="M${x2 + bw - 22} ${by + bh} L${x2 + bw - 6} ${Math.round(between(rnd, 162, 176))} L${x2 + bw - 44} ${by + bh} Z" fill="${b}" opacity="0.85"/>`)}
${s.rich ? `<circle cx="66" cy="30" r="16" fill="${dot}" opacity="0.9"/>
<circle cx="${x2 + bw - 30}" cy="${Math.round(between(rnd, 176, 200))}" r="16" fill="${dot}" opacity="0.9"/>
<rect x="${36 + 18}" y="70" width="${bw - 36}" height="9" rx="4.5" fill="var(--background)" opacity="0.75"/>
<rect x="${36 + 18}" y="88" width="${Math.round(bw * 0.55)}" height="9" rx="4.5" fill="var(--background)" opacity="0.5"/>
<rect x="${x2 + 18}" y="${by + 18}" width="${bw - 36}" height="9" rx="4.5" fill="var(--background)" opacity="0.75"/>
<rect x="${x2 + 18}" y="${by + 36}" width="${Math.round(bw * 0.5)}" height="9" rx="4.5" fill="var(--background)" opacity="0.5"/>` : ""}`;
}

/** Album family — vinyl / equalizer tiles (media). */
function sceneAlbum(rnd: Rnd, _seed: number, s: SceneStyle): string {
  const back = s.pal(6);
  const vinyl = s.pal(3);
  const accent = s.pal(5);
  if (rnd() > 0.45) {
    const cx = Math.round(between(rnd, 150, 250));
    const cy = Math.round(between(rnd, 110, 140));
    const r = Math.round(between(rnd, 52, 68));
    return `<rect width="400" height="250" fill="${back}" opacity="0.18"/>
${groundShadow(cx, r * 2.4, cy + r + 8, 0.2)}
<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="14" fill="${vinyl}" opacity="0.95"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--background)" stroke-width="2" opacity="0.75"/>
<circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.62)}" fill="none" stroke="var(--background)" stroke-width="2" opacity="0.6"/>
<circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.3)}" fill="none" stroke="var(--background)" stroke-width="2" opacity="0.5"/>
<circle cx="${cx}" cy="${cy}" r="7" fill="${accent}"/>`;
  }
  const bars = [46, 82, 118, 154, 190, 226].map((x) => {
    const h = Math.round(between(rnd, 40, 120));
    return `<rect x="${x}" y="${250 - 30 - h}" width="26" height="${h}" rx="6" fill="${s.pal(5)}" opacity="0.85"/>`;
  }).join("");
  return `<rect width="400" height="250" fill="${back}" opacity="0.18"/>
<rect x="28" y="40" width="344" height="170" rx="16" fill="var(--background)" opacity="0.5"/>
${bars}`;
}

/** Subject-keyed families (V15) — the run's VisualIntent picks the subject;
 * the domain-keyed functions remain the content fallback. */
const SUBJECT_FNS: Record<string, (rnd: Rnd, seed: number, s: SceneStyle) => string> = {
  runner: sceneRunner,
  dumbbell: sceneDumbbell,
  graph: sceneGraph,
  doc: sceneDoc,
  chat: sceneChat,
  album: sceneAlbum,
  house: sceneStay,
  product: sceneProduct,
  board: sceneBoard,
  generic: sceneGeometric,
};

/** V15: default subject per content domain (fallback when the data agent
 * did not write one). */
const SUBJECT_OF_DOMAIN: Record<string, string> = {
  fitness: "runner",
  ecommerce: "product",
  media: "album",
  social: "chat",
  productivity: "board",
  rentals: "house",
  travel: "house",
  finance: "graph",
};

/**
 * V15 deterministic scene SVG for one media slot.
 *
 * Same (subject/domain, seed, n, crop, strategy) always produces the same
 * artwork — fully reproducible across runs, repair cycles, and reference
 * rendering.
 * - `subject` (V15) is the imagery subject from the run's VisualIntent;
 *   the content domain is the fallback.
 * - `strategy` (V15) renders the family per the media strategy.
 * - `seed` should be the ITEM's id hash (per-item art, never per-slot).
 * - `n` varies the composition within one item's art set.
 * - `crop` picks the angle/crop preset (the detail gallery's shots of ONE
 *   item).
 */
export function sceneSvg(domain: string, seed: number, n = 0, crop = 0, subject?: string, strategy = "flat-illustration"): string {
  const rnd = mulberry32((seed ^ (n * 2654435761)) >>> 0);
  const subj = subject ?? SUBJECT_OF_DOMAIN[domain] ?? "generic";
  const style = styleFor(strategy, rnd);
  const fn = SUBJECT_FNS[subj] ?? SCENE_FNS[domain] ?? sceneGeometric;
  const body = fn(rnd, seed, style);
  return svg(body, `${subj} scene ${seed}`, seed, crop);
}

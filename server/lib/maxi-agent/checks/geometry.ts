import type { Page } from "playwright-core";
import type { GateIssue } from "./audit";

/**
 * DOM-geometry audit — runs inside the headless render and measures what a
 * human eye would catch: horizontal overflow, missing fonts, overlapping
 * elements, grid alignment, and — since V10 — the layout law: vertical
 * rhythm, whitespace between stacked sections, and hero-scale hierarchy.
 * Since the model cannot see renders, this is the mechanical "does it line
 * up" gate.
 */

export interface GeometryReport {
  overflow: boolean;
  fonts: Array<{ family: string; loaded: boolean }>;
  overlaps: Array<{ a: string; b: string }>;
  blanks: string[];
  offGrid: number;
  sampled: number;
  minHeightOk: boolean;
  /** V10: adjacent sections whose top padding jumps more than one rhythm
   * step (32px) — the "random py-4 next to py-16" defect. */
  rhythm: string[];
  /** V10: stacked sections with less than 16px of combined whitespace
   * between them — the "flush sections" defect. */
  flush: string[];
  /** V10: whether the page's largest text is at hero scale (>= 36px) —
   * a screen without any hero-scale type reads as a template. */
  heroScale: boolean;
}

export interface GeometryOptions {
  fontFamilies?: string[];
  /** Base grid unit in px (theme's spacing rhythm). */
  gridUnit?: number;
  /** V11: the theme's 4xl size in px — the dominant-moment floor. Falls
   * back to the universal 36px when the caller does not know the theme. */
  heroScalePx?: number;
}

/** One rhythm step on the 8px ladder (px). */
const STEP_PX = 32;
/** Whitespace floor between stacked sections (px). */
const GAP_PX = 16;
/** Smallest acceptable dominant-moment type size (px). */
const HERO_SCALE_PX = 36;

/**
 * The in-page geometry measurement — shared between the local playwright
 * path and the e2b sandbox renderer. The sandbox script embeds this exact
 * source so both paths measure identically.
 */
export function geometryEvalSource(): string {
  return `async ({ fonts, unit, stepPx, gapPx, heroScalePx }) => {
      try {
        await (document).fonts?.ready;
      } catch {}
      const doc = document.documentElement;
      const overflow = doc.scrollWidth > doc.clientWidth + 1;

      const fontReport = [];
      if (typeof (document).fonts?.check === "function") {
        for (const f of fonts ?? []) {
          fontReport.push({ family: f, loaded: (document).fonts.check('16px "' + f + '"') });
        }
      }

      const overlaps = [];
      const candidates = Array.from(
        document.querySelectorAll("section, header, footer, nav, aside, [class*='bg-card'], [class*='rounded-'], [class*='bg-muted']"),
      ).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 80 && r.height > 40 && r.top < doc.scrollHeight;
      });

      let offGrid = 0;
      let sampled = 0;
      for (let i = 0; i < Math.min(candidates.length, 240); i++) {
        const a = candidates[i].getBoundingClientRect();
        sampled++;
        if (Math.round(a.left) % unit > 2 && Math.round(a.left) % unit < unit - 2) offGrid++;
        const elA = candidates[i];
        for (let j = i + 1; j < Math.min(candidates.length, 240); j++) {
          const elB = candidates[j];
          const b = elB.getBoundingClientRect();
          if (a === b) continue;
          if (elA.contains(elB) || elB.contains(elA)) continue;
          const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          const inter = ix * iy;
          const small = Math.min(a.width * a.height, b.width * b.height);
          if (small > 0 && inter > small * 0.35) {
            overlaps.push({
              a: candidates[i].className.slice(0, 60),
              b: candidates[j].className.slice(0, 60),
            });
            if (overlaps.length >= 5) break;
          }
        }
        if (overlaps.length >= 5) break;
      }

      const blanks = [];
      for (const el of document.querySelectorAll("section")) {
        const text = (el.innerText ?? "").trim();
        const hasMedia = Boolean(el.querySelector("img, svg, iframe, video, canvas, input, button, a, audio"));
        if (text.length === 0 && !hasMedia) {
          blanks.push(el.className.slice(0, 60) || "section");
          if (blanks.length >= 5) break;
        }
      }

      const rhythm = [];
      const sections = Array.from(document.querySelectorAll("section"));
      let prevTopPad = null;
      for (const el of sections) {
        const topPad = ((el) => {
          const cs = getComputedStyle(el);
          const own = parseFloat(cs.paddingTop);
          if (own > 0) return own;
          const inner = el.querySelector("[class*='pastel-frame']");
          if (inner) {
            const pt = parseFloat(getComputedStyle(inner).paddingTop);
            if (Number.isFinite(pt)) return pt;
          }
          return own;
        })(el);
        if (prevTopPad !== null && Math.abs(topPad - prevTopPad) > stepPx) {
          rhythm.push('"' + el.className.slice(0, 50) + '" (' + prevTopPad + 'px → ' + topPad + 'px)');
          if (rhythm.length >= 5) break;
        }
        prevTopPad = topPad;
      }

      const flush = [];
      for (let i = 0; i < sections.length - 1; i++) {
        const a = sections[i].getBoundingClientRect();
        const b = sections[i + 1].getBoundingClientRect();
        if (a.height === 0 || b.height === 0) continue;
        if (b.top < a.bottom) continue;
        const padBottom = (() => {
          const cs = getComputedStyle(sections[i]);
          const own = parseFloat(cs.paddingBottom);
          if (own > 0) return own;
          const inner = sections[i].querySelector("[class*='pastel-frame']");
          if (inner) {
            const pb = parseFloat(getComputedStyle(inner).paddingBottom);
            if (Number.isFinite(pb)) return pb;
          }
          return own;
        })();
        const padTop = ((el) => {
          const cs = getComputedStyle(el);
          const own = parseFloat(cs.paddingTop);
          if (own > 0) return own;
          const inner = el.querySelector("[class*='pastel-frame']");
          if (inner) {
            const pt = parseFloat(getComputedStyle(inner).paddingTop);
            if (Number.isFinite(pt)) return pt;
          }
          return own;
        })(sections[i + 1]);
        const gap = b.top - a.bottom + padBottom + padTop;
        if (gap >= 0 && gap < gapPx && a.bottom < doc.scrollHeight) {
          flush.push(sections[i].className.slice(0, 40) + " / " + sections[i + 1].className.slice(0, 40));
          if (flush.length >= 5) break;
        }
      }

      let maxPx = 0;
      for (const el of Array.from(document.querySelectorAll("h1, h2, p, span, a, button, div"))) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs > maxPx) maxPx = fs;
      }
      const heroScale = maxPx >= heroScalePx;

      const minHeightOk = doc.scrollHeight > 200;

      return { overflow, fonts: fontReport, overlaps, blanks, offGrid, sampled, minHeightOk, rhythm, flush, heroScale };
    }`;
}

export async function auditGeometry(
  page: Page,
  opts: GeometryOptions = {},
): Promise<GeometryReport> {
  const unit = opts.gridUnit ?? 8;
  const heroScalePx = Math.max(32, opts.heroScalePx ?? HERO_SCALE_PX);

  const result = await page.evaluate(
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(`return (${geometryEvalSource()})`)() as (args: unknown) => Promise<GeometryReport>,
    { fonts: opts.fontFamilies ?? [], unit, stepPx: STEP_PX, gapPx: GAP_PX, heroScalePx },
  );

  return result as GeometryReport;
}

export function geometryPasses(rep: GeometryReport): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (rep.overflow) reasons.push("horizontal overflow detected");
  for (const f of rep.fonts) {
    if (!f.loaded) reasons.push(`font not loaded: ${f.family}`);
  }
  if (rep.overlaps.length > 0) reasons.push(`${rep.overlaps.length} overlapping element(s)`);
  if (rep.blanks.length > 0) reasons.push(`${rep.blanks.length} blank section(s)`);
  if (rep.rhythm.length > 0) reasons.push(`uneven vertical rhythm: ${rep.rhythm.slice(0, 2).join("; ")}`);
  if (rep.flush.length > 0) reasons.push(`flush sections (no whitespace): ${rep.flush.slice(0, 2).join("; ")}`);
  if (!rep.heroScale) reasons.push("no hero-scale type on the page (reads as a template)");
  if (!rep.minHeightOk) reasons.push("page rendered suspiciously short");
  return { ok: reasons.length === 0, reasons };
}

/**
 * V24 — geometry issues for the GATE (WS6). Extracted from the orchestrator
 * so the regression suite can assert the blocking behavior without a run.
 *
 * Horizontal overflow / clipping is BLOCKING (high) at every viewport — the
 * v16 standard claimed "geometry checks at 1440px and 375px", and v24 makes
 * it actually enforced: the sandbox renders every screen at 1440 / 768 /
 * 375 and an overflow at ANY width fails the gate. Overlaps stay blocking;
 * blank/rhythm/flush/hero-scale stay advisory.
 */
export function geometryIssuesFor(name: string, geo: GeometryReport, viewportWidth?: number): GateIssue[] {
  const issues: GateIssue[] = [];
  const at = viewportWidth ? ` (${viewportWidth}px)` : "";
  if (geo.overflow) {
    issues.push({
      file: `src/screens/${name}.jsx`,
      severity: "high",
      category: "geometry",
      description: `Horizontal overflow detected on the rendered screen${at} — content clips beyond the viewport (mobile clipping is a hard gate failure)`,
    });
  }
  if (geo.overlaps.length > 0) {
    issues.push({
      file: `src/screens/${name}.jsx`,
      severity: "high",
      category: "geometry",
      description: `${geo.overlaps.length} overlapping element(s) on the rendered screen${at}`,
    });
  }
  if (geo.blanks.length > 0) {
    issues.push({
      file: `src/screens/${name}.jsx`,
      severity: "medium",
      category: "geometry",
      description: `${geo.blanks.length} blank section(s) on the rendered screen${at}`,
    });
  }
  if (geo.rhythm.length > 0) {
    issues.push({
      file: `src/screens/${name}.jsx`,
      severity: "medium",
      category: "geometry",
      description: `Uneven vertical rhythm: ${geo.rhythm.slice(0, 2).join("; ")}${at}`,
    });
  }
  if (geo.flush.length > 0) {
    issues.push({
      file: `src/screens/${name}.jsx`,
      severity: "medium",
      category: "geometry",
      description: `Flush sections with no whitespace: ${geo.flush.slice(0, 2).join("; ")}${at}`,
    });
  }
  if (!geo.heroScale) {
    issues.push({
      file: `src/screens/${name}.jsx`,
      severity: "medium",
      category: "geometry",
      description: "No hero-scale type on the page — the dominant moment must be the largest element (reads as a template)",
    });
  }
  return issues;
}

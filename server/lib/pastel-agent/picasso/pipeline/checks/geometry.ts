import type { ScreenPlan } from "../types";

/**
 * V8 deterministic geometry gate — source-level port of the sibling
 * pipeline's `checks/geometry.ts` concepts (overflow/overlap/fonts/rhythm)
 * for code that hasn't been rendered yet. Full DOM-level geometry still runs
 * in visual QA on the screenshot; this gate catches the statically-visible
 * shapes of those defects at $0 cost.
 */

export interface GeometryViolation {
  screen: string;
  id: string;
  severity: "high" | "medium" | "low";
  description: string;
  fix?: string;
}

export interface GeometryGateResult {
  passed: boolean;
  violations: GeometryViolation[];
}

const FIXED_WIDTH_OVERFLOW = /(?:w-\[(\d+|\d*\.\d+)px\]|min-w-\[(\d+|\d*\.\d+)px\]|max-w-\[(\d+|\d*\.\d+)px\])/g;

export function auditScreenGeometry(code: string, plan: ScreenPlan | null): GeometryViolation[] {
  const violations: GeometryViolation[] = [];
  const screen = plan?.id ?? "?";

  // Overflow: fixed widths beyond the desktop viewport, or a fixed-width
  // element inside a flex row that cannot shrink.
  let m: RegExpExecArray | null;
  FIXED_WIDTH_OVERFLOW.lastIndex = 0;
  while ((m = FIXED_WIDTH_OVERFLOW.exec(code))) {
    const px = Number(m[1] ?? m[2] ?? m[3]);
    if (px > 1440) {
      violations.push({
        screen,
        id: "overflow-width",
        severity: "high",
        description: `Fixed width ${px}px exceeds the desktop viewport (1440px) — the screen will overflow horizontally.`,
        fix: "Use max-w-* constraints or percentage/grid-based widths",
      });
    }
  }
  if (/\bw-\[(?:calc|100vw)/.test(code)) {
    violations.push({
      screen,
      id: "overflow-width",
      severity: "medium",
      description: "100vw/full-viewport widths can overflow when scrollbars exist — prefer w-full within a padded container.",
    });
  }

  // Fonts: inline font-family or arbitrary font classes break the theme law.
  if (/font-\[['"][^'"]+['"]\]|fontFamily\s*:/i.test(code)) {
    violations.push({
      screen,
      id: "inline-font",
      severity: "high",
      description: "Inline font-family or arbitrary font utility found — fonts must come from font-sans/font-heading/font-mono.",
      fix: "Use font-sans / font-heading / font-mono",
    });
  }

  // Rhythm: three consecutive sections with the identical vertical padding
  // read as a uniform wall (the "never uniform section rhythm" law).
  const pads: string[] = [];
  const pyRe = /\bpy-(\d+|\[\S+\])/g;
  let pm: RegExpExecArray | null;
  while ((pm = pyRe.exec(code))) pads.push(pm[1]);
  for (let i = 2; i < pads.length; i++) {
    if (pads[i] === pads[i - 1] && pads[i] === pads[i - 2]) {
      violations.push({
        screen,
        id: "uniform-rhythm",
        severity: "medium",
        description: `${pads.slice(i - 2, i + 1).join("/")} — three consecutive sections share the same vertical padding; vary the section rhythm.`,
      });
      break;
    }
  }

  // Flush: full-viewport sections without a max-w container run edge to edge.
  if (/<(?:main|section)\b[^>]*className="[^"]*min-h-(?:screen|\[100vh\])[^"]*"/.test(code) && !/max-w-/.test(code)) {
    violations.push({
      screen,
      id: "flush-viewport",
      severity: "low",
      description: "Full-viewport section without a max-w container — content may run edge to edge on wide displays.",
    });
  }

  // Overlap: absolute positioning with fixed offsets is a common overlap
  // source in generated code; flag non-decorative uses.
  if (/absolute\b[^>]*inset-\d|inset-\[-?\d+px\]/.test(code)) {
    violations.push({
      screen,
      id: "absolute-overlap",
      severity: "low",
      description: "Absolutely positioned element with fixed offsets — verify it does not overlap neighbouring content.",
    });
  }

  return violations;
}

export function runGeometryGate(
  screens: Record<string, string>,
  plans: ScreenPlan[],
): GeometryGateResult {
  const violations: GeometryViolation[] = [];
  const byId = new Map(plans.map((p) => [p.id, p]));
  for (const [id, code] of Object.entries(screens)) {
    violations.push(...auditScreenGeometry(code, byId.get(id) ?? null));
  }
  const blocking = violations.filter((v) => v.severity === "high");
  return { passed: blocking.length === 0, violations };
}

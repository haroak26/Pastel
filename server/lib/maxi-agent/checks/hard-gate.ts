import type { GateIssue } from "./audit";
import type { GeometryReport } from "./geometry";
import type { DesignBlueprint } from "../lib/blueprint";

/**
 * Maxi Agent v25 — the hard/advisory gate split.
 *
 * v24's gate was one undifferentiated pile: a missing CTA label blocked the
 * run exactly like a crashed screen, and the repair loop chased all of it
 * (118s). v25 splits every issue:
 *
 *   HARD (blockers — Wave 3 repairs these, flagged if they survive):
 *     runtime failures, esbuild errors, horizontal overflow at any viewport,
 *     prop-contract violations, illegal imports, hex literals, missing
 *     default exports, inputs with no identification at all.
 *
 *   ADVISORY (recorded — they feed the advisory review and the run report,
 *     they NEVER block): density notes, rhythm, hero-scale, alt-text
 *     polish, a11y refinements.
 *
 * Plus the deterministic a11y scan (the v24 #24/#25 lesson, as a source
 * check that runs even when no screenshot exists) and the density notes
 * (the v24 #6/#7/#9/#10 lesson, measured from the authored files).
 */

export interface GateSplit {
  hard: GateIssue[];
  advisory: GateIssue[];
}

/** Hard = severity high. Everything else is advisory. */
export function splitIssues(issues: GateIssue[]): GateSplit {
  const hard = issues.filter((i) => i.severity === "high");
  const advisory = issues.filter((i) => i.severity !== "high");
  return { hard, advisory };
}

// ── A11y source scan ───────────────────────────────────────────────────────

const INPUT_TAG_RE = /<(?<tag>input|Input|select|Select|textarea|Textarea)\b(?<attrs>[^>]*)>/g;

/**
 * Every input/select/textarea must be identifiable: a visible <label
 * htmlFor>, an aria-label/aria-labelledby, or — for authored input
 * COMPONENTS (capitalized tags) — a `label` prop (the primitive's contract
 * is to render it visibly). Raw <input>/<select>/<textarea> tags get no
 * prop credit: they must carry aria or a real label association.
 */
export function a11yScan(files: Record<string, string>): GateIssue[] {
  const issues: GateIssue[] = [];
  for (const [path, code] of Object.entries(files)) {
    if (!/^src\/(screens|components)\//.test(path)) continue;

    // label htmlFor targets in this file
    const labelled = new Set(
      [...code.matchAll(/<label\b[^>]*htmlFor=["']([\w-]+)["']/g)].map((m) => m[1]!),
    );
    for (const m of code.matchAll(INPUT_TAG_RE)) {
      const tag = m.groups?.tag ?? "";
      const attrs = m.groups?.attrs ?? "";
      const hasAria = /aria-label(edby)?=/.test(attrs);
      const id = attrs.match(/\bid=["']([\w-]+)["']/)?.[1];
      const hasLabel = id !== undefined && labelled.has(id);
      const isAuthoredComponent = /^[A-Z]/.test(tag);
      const hasLabelProp = isAuthoredComponent && /\blabel=/.test(attrs);
      if (!hasAria && !hasLabel && !hasLabelProp) {
        issues.push({
          file: path,
          severity: "high",
          category: "a11y",
          description: `<${tag}> has no label, aria-label, or aria-labelledby — every control must be identifiable to assistive tech`,
        });
      }
    }

    for (const m of code.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt=/.test(m[0])) {
        issues.push({
          file: path,
          severity: "medium",
          category: "a11y",
          description: "<img> without an alt attribute",
        });
      }
    }
  }
  return issues;
}

// ── Density notes (advisory) ───────────────────────────────────────────────

/**
 * Density is solved at the DATA source in v25 (the generator always emits
 * 6-8 rows), so these checks are advisory signals for the review, not
 * blockers: does the screen actually render the list, does the DOM have
 * blanks, is there a display-scale moment?
 */
export function densityNotes(
  bp: DesignBlueprint,
  files: Record<string, string>,
  geometryByViewport: Record<number, Record<string, GeometryReport>> | undefined,
): GateIssue[] {
  const issues: GateIssue[] = [];

  for (const screen of bp.screens) {
    const path = `src/screens/${screen.id}.jsx`;
    const code = files[path];
    if (!code) continue;

    // The screen should render the populated list somewhere (directly or
    // through a mounted component) — a sparse screen reads as a template.
    const rendersList = /DATA\.list\.rows|rows=\{DATA\.list\.rows\}/.test(code);
    const mountsListConsumer = bp.componentManifest
      .filter((c) => c.usedBy.includes(screen.id) && c.props.some((p) => p.type === "array"))
      .some((c) => new RegExp(`<${c.name}[\\s/>]`).test(code));
    if (!rendersList && !mountsListConsumer) {
      issues.push({
        file: path,
        severity: "medium",
        category: "density",
        description: "the screen never renders DATA.list rows — the primary list is the product's heart",
      });
    }
  }

  // Measured DOM blanks + hero scale, when renders exist.
  for (const perScreen of Object.values(geometryByViewport ?? {})) {
    for (const [name, geo] of Object.entries(perScreen)) {
      for (const blank of geo.blanks) {
        issues.push({
          file: `src/screens/${name}.jsx`,
          severity: "medium",
          category: "density",
          description: `empty region detected in the render (${blank})`,
        });
      }
      if (!geo.heroScale) {
        issues.push({
          file: `src/screens/${name}.jsx`,
          severity: "medium",
          category: "density",
          description: "no display-scale (hero) element measured — the dominant moment is missing or undersized",
        });
      }
    }
  }
  return issues;
}

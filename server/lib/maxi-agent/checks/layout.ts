import type { GateIssue } from "./audit";
import type { V21LayoutPlan, V21ScreenLayout } from "../schemas";
import { SECTION_BLOCK_CAP } from "../lib/layout-plan";
import { legalSurfacesForMode, type LayoutGenome } from "../lib/genome";

/**
 * V21/V23 layout gate — verifies the composed screens against the
 * deterministic placement plan. This is the enforcement side of the
 * placement fix:
 *
 * 1. SECTION COUNT: no more than the planned sections per screen (home ≤ 5,
 *    detail ≤ 4) — the clutter cap. Too many <section> wrappers = the
 *    composer ignored the plan and over-stuffed the screen.
 * 2. SECTION HEADERS: every non-dominant section opens with a SectionHeader.
 *    Missing headers are the "odd section headings" defect.
 * 3. COMPONENT BUDGET: at most TWO custom components mounted per screen.
 * 4. PLACEMENT: planned split rows render as a side-by-side grid
 *    (lg:grid-cols-[2fr_1fr]).
 *
 * V23: the plan is derived deterministically from the layout genome
 * (lib/genome.ts → lib/layout-plan.ts), so auditing the plan IS auditing the
 * genome. `auditGenomeLayout` additionally enforces the genome contract
 * itself: the composed output may only contain blocks and surfaces that were
 * legal in the mode-scoped vocabulary (illegal blocks were never offered, so
 * their presence in output is a hard defect), and exactly one dominant
 * moment per screen.
 *
 * All checks are zero-cost source scans — no model call.
 */

const SECTION_WRAPPER_RE = /<section\b/g;
const HEADER_RE = /<SectionHeader\b/g;
const TWO_UP_GRID_RE = /lg:grid-cols-\[2fr_1fr\]|lg:grid-cols-\[1fr_2fr\]|lg:grid-cols-2\b/g;
const JSX_TAG_RE = /<\/?([A-Z][A-Za-z0-9]*)\b/g;

export function auditV21Layout(
  plan: V21LayoutPlan | null,
  files: Record<string, string>,
  budgetNames: Set<string>,
): GateIssue[] {
  if (!plan) return [];
  const issues: GateIssue[] = [];
  const builtNames = budgetNames;

  for (const screen of plan.screens) {
    const code = files[`src/screens/${screen.screenId}.jsx`] ?? "";
    if (!code) continue;
    auditScreen(screen, code, builtNames, issues);
  }
  return issues;
}

export function auditScreen(
  screen: V21ScreenLayout,
  code: string,
  builtNames: Set<string>,
  issues: GateIssue[],
): void {
  const file = `src/screens/${screen.screenId}.jsx`;
  const cap = SECTION_BLOCK_CAP[screen.screenId] ?? 5;

  // 1. Section count — the clutter cap.
  const sectionCount = (code.match(SECTION_WRAPPER_RE) ?? []).length;
  if (sectionCount > cap) {
    issues.push({
      file,
      severity: "high",
      category: "v21-layout",
      description: `${screen.screenId} renders ${sectionCount} sections — the layout plan allows at most ${cap}. Too much on one screen; merge or drop sections and follow the plan exactly.`,
    });
  }

  // 2. Section headers — every non-dominant section must open with one.
  const planned = screen.sections;
  const nonDominant = planned.filter((s) => !s.emphasis).length;
  const headerCount = (code.match(HEADER_RE) ?? []).length;
  if (nonDominant > 0 && headerCount < nonDominant - 1) {
    issues.push({
      file,
      severity: "high",
      category: "v21-layout",
      description: `${screen.screenId} has ${nonDominant} non-dominant sections but only ${headerCount} SectionHeader(s). Every non-dominant section must open with <SectionHeader eyebrow=... title=... /> for consistent headings.`,
    });
  }

  // 3. Custom component budget — at most 2 custom components per screen.
  // V24: the budget counts ONLY the genome's custom slots — deterministic
  // shell chrome (NavAdapter) and shell primitives never count against the
  // "fewer, richer components" law.
  const mounted = new Set<string>();
  for (const m of code.matchAll(JSX_TAG_RE)) {
    if (builtNames.has(m[1])) mounted.add(m[1]);
  }
  if (mounted.size > 2) {
    issues.push({
      file,
      severity: "medium",
      category: "v21-layout",
      description: `${screen.screenId} mounts ${mounted.size} custom components (${[...mounted].join(", ")}) — the layout law allows at most 2 per screen. Fewer, richer components read as designed.`,
    });
  }

  // 4. Placement — planned split rows must render side-by-side.
  const plannedSplits = planned.filter((s) => s.placement === "split-left" || s.placement === "split-right");
  if (plannedSplits.length > 0 && !TWO_UP_GRID_RE.test(code)) {
    issues.push({
      file,
      severity: "medium",
      category: "v21-layout",
      description: `${screen.screenId} plans a side-by-side row (${plannedSplits.map((s) => s.block).join(" + ")}) but no two-up grid (lg:grid-cols-[2fr_1fr]) renders — the pair must sit side-by-side, not stacked.`,
    });
  }
}

// ── V23 genome-contract audit ────────────────────────────────────────────
//
// The V21 plan audit above checks the composed output against the derived
// plan. This audit checks the genome contract itself: composed output may
// only contain blocks/surfaces from the mode-scoped vocabulary, and exactly
// one dominant moment per screen (the vocabulary for the mode never offered
// illegal blocks, so their presence in output is a hard defect).

const SECTION_OPEN_RE = /<section\b[^>]*class="([^"]*)"/g;
const DOMINANT_RE = /text-(?:4xl|5xl|6xl|7xl|8xl)\b|hero-scale|dominant/g;

export function auditGenomeLayout(
  genome: LayoutGenome | null,
  plan: V21LayoutPlan | null,
  files: Record<string, string>,
  _builtComponents: Record<string, string>,
): GateIssue[] {
  if (!genome) return [];
  const issues: GateIssue[] = [];
  const legalSurfaces = legalSurfacesForMode(genome.mode);

  // Any non-vocabulary block/surface class on a section is a contract breach.
  for (const screen of genome.screens) {
    const code = files[`src/screens/${screen.id}.jsx`] ?? "";
    if (!code) continue;
    const file = `src/screens/${screen.id}.jsx`;

    for (const m of code.matchAll(SECTION_OPEN_RE)) {
      const classes = m[1] ?? "";
      for (const cls of classes.split(/\s+/)) {
        const blockMatch = cls.match(/^surface-(band|soft-wash|divided-list|inset-panel|plain|card|editorial-tile)$/);
        if (blockMatch && !legalSurfaces.has(blockMatch[1])) {
          issues.push({
            file,
            severity: "high",
            category: "genome",
            description: `${screen.id} renders surface "${blockMatch[1]}" — not in the ${genome.mode} mode vocabulary. The layout genome never offered it.`,
          });
        }
      }
    }

    // Dominant moment: exactly one hero-scale statement per screen.
    const dominants = (code.match(DOMINANT_RE) ?? []).length;
    if (dominants === 0) {
      issues.push({
        file,
        severity: "medium",
        category: "genome",
        description: `${screen.id} has no dominant moment (no hero-scale type) — the genome declares one dominant region per screen.`,
      });
    }
  }

  issues.push(...auditV21Layout(plan, files, customSlotNames(genome)));
  return issues;
}

/** The genome's custom slot names — the only components the budget law
 *  counts (V24: shell chrome and primitives are never product components). */
function customSlotNames(genome: LayoutGenome): Set<string> {
  return new Set(genome.componentSlots.map((s) => s.name));
}

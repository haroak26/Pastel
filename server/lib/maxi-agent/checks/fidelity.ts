import type { GateIssue } from "./audit";
import type { ComponentUISpec } from "../schemas";
import {
  sourceSimilarity,
  distinctSlotUtilities,
  TAXONOMY_SIMILARITY_FLOORS,
  type ComponentTaxonomy,
} from "../lib/fidelity";
import { baseComponentNames, loadBaseComponent } from "../lib/base-components";

/**
 * Maxi Agent v23 — the component-fidelity audit.
 *
 * The run-time enforcement side of the taxonomy-tiered fidelity contract
 * (extracted from the retired Picasso stage-4-build.ts). Every built
 * component is checked deterministically — no model call — and every verdict
 * lands in docs/review/FidelityReport.json:
 *
 * 1. STRUCTURAL CONTRACT — the v23 from-scratch build contract: self-contained
 *    (react + lucide-react only), no raw hex literals, no "@/" alias or
 *    shadcn imports, a default export present, theme slot utilities used.
 *    A violation is a HIGH gate issue (the builder was supposed to hold it).
 * 2. UNIQUENESS CEILING — the from-scratch direction of the fidelity contract:
 *    a component must visibly diverge from the vendored base library. The
 *    taxonomy CEILING (molecule/organism must be <90% similar to their base)
 *    is applied to every component against the nearest catalog base; a
 *    from-scratch component that lands at ≥90% similarity to a base is a
 *    disguised base copy — the "reads as a template" defect made measurable.
 * 3. TIER RECORD — when a spec carries a base anchor (`basedOn`), the
 *    Picasso similarity FLOOR for that tier is applied in full: a primitive
 *    under 85% (or a molecule under 40%) is a violation. From-scratch tiers
 *    record the floor table as inapplicable (no anchor) — the ceiling +
 *    structural contract are their contract.
 *
 * All checks are zero-cost source scans.
 */

export interface FidelityVerdictRecord {
  componentId: string;
  componentName: string;
  taxonomy: ComponentTaxonomy;
  /** Whether the spec anchored this component to a base file. */
  baseAnchor: string | null;
  /** Chunk similarity to the anchor (or to the nearest catalog base). */
  similarity: number;
  /** The tier's Picasso similarity floor (null = organism/no floor). */
  floor: number | null;
  /** The taxonomy ceiling: from-scratch tiers must stay under 0.90. */
  ceiling: number | null;
  structural: { passed: boolean; errors: string[] };
  passed: boolean;
  issues: string[];
}

export interface FidelityReport {
  generatedAt: string;
  verdicts: FidelityVerdictRecord[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    highIssues: number;
  };
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const ALIAS_RE = /from\s+["']@\//;
const SHADCN_RE = /from\s+["'](?:shadcn|@shadcn\/[a-z-]+|@base-ui\/)["']/;
const DEFAULT_EXPORT_RE = /export\s+default\s+/;
const SLOT_UTIL_RE = /(?:bg-primary|text-primary|bg-muted|bg-accent|text-muted-foreground|bg-card|bg-secondary|border-border|ring-ring|rounded|h-8|h-9|h-10|h-11)/;

/** The v23 from-scratch structural contract (no base anchor required). */
export function validateFromScratchComponent(code: string): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!code.trim()) errors.push("Empty component file");
  const bareImports = [...code.matchAll(/import[^\n]*from\s+["']([^"']+)["']/g)].map((m) => m[1]).filter((s) => !s.startsWith("."));
  for (const spec of bareImports) {
    if (spec !== "react" && spec !== "react/jsx-runtime" && !spec.startsWith("lucide-react")) {
      errors.push(`Import from "${spec}" — the from-scratch contract allows react and lucide-react only`);
    }
  }
  if (ALIAS_RE.test(code)) errors.push('"@/" alias import found — file must be self-contained');
  if (SHADCN_RE.test(code)) errors.push("Import from a shadcn/base-ui package — component source must be self-contained");
  if (HEX_RE.test(code)) errors.push("Raw hex colour literal — use theme slot utilities");
  if (!DEFAULT_EXPORT_RE.test(code)) errors.push("No default export — the composer mounts components via `import X from`");
  if (!SLOT_UTIL_RE.test(code)) errors.push("No theme styling present — use slot utilities from the token snapshot");
  if (code.trim().length < 60) errors.push("Component is suspiciously small");
  return { passed: errors.length === 0, errors };
}

/** The nearest catalog base for a component name (exact name match first). */
export function nearestBaseFor(name: string): { name: string; source: string } | null {
  const names = baseComponentNames();
  if (names.includes(name.toLowerCase())) {
    const base = loadBaseComponent(name.toLowerCase());
    if (base) return { name: base.name, source: base.source };
  }
  const lower = name.toLowerCase();
  const candidates = names
    .map((n) => ({ n, sim: sourceSimilarity(lower, n) }))
    .filter((c) => c.sim > 0.4)
    .sort((a, b) => b.sim - a.sim);
  const best = candidates[0];
  if (!best) return null;
  const base = loadBaseComponent(best.n);
  return base ? { name: base.name, source: base.source } : null;
}

/** How "close to the catalog" reads as a template copy (the ceiling). */
export const CEILING_SIMILARITY = 0.9;

export function auditComponentFidelity(
  specs: Record<string, ComponentUISpec>,
  builtFiles: Record<string, string>,
): { report: FidelityReport; issues: GateIssue[] } {
  const verdicts: FidelityVerdictRecord[] = [];
  const issues: GateIssue[] = [];

  for (const [name, spec] of Object.entries(specs)) {
    const path = `src/components/${name}.jsx`;
    const code = builtFiles[path] ?? "";
    if (!code.trim()) {
      verdicts.push({
        componentId: name, componentName: name,
        taxonomy: (spec as { taxonomy?: ComponentTaxonomy }).taxonomy ?? "molecule",
        baseAnchor: null, similarity: 0, floor: null, ceiling: CEILING_SIMILARITY,
        structural: { passed: false, errors: ["component file missing"] },
        passed: false, issues: ["component file missing"],
      });
      issues.push({ file: path, severity: "high", category: "fidelity", description: `${name}: component file missing — the build produced no code` });
      continue;
    }

    const anchor = (spec as { basedOn?: string }).basedOn ?? name.toLowerCase();
    const base = anchor ? (() => {
      const direct = loadBaseComponent(anchor);
      if (direct) return { name: direct.name, source: direct.source };
      return nearestBaseFor(name);
    })() : nearestBaseFor(name);

    const structural = validateFromScratchComponent(code);
    const taxonomy: ComponentTaxonomy = (spec as { taxonomy?: ComponentTaxonomy }).taxonomy
      ?? (["Topbar", "Sidebar", "Button", "Avatar", "Badge", "Input", "Select", "Separator"].includes(name) ? "primitive" : "molecule");
    const floorRule = TAXONOMY_SIMILARITY_FLOORS[taxonomy] ?? { floor: null as number | null, action: "report" as const };

    let similarity = 0;
    let ceilingApplied = false;
    const issuesList: string[] = [];
    if (base) {
      similarity = sourceSimilarity(code, base.source);
      // Uniqueness ceiling: even with a base anchor, from-scratch output must
      // visibly diverge from the library (the molecule/organism direction).
      if (similarity >= CEILING_SIMILARITY) {
        issuesList.push(`Uniqueness ceiling breached: ${Math.round(similarity * 100)}% similar to base "${base.name}" — must be a product-specific design, not a library copy`);
      }
      ceilingApplied = true;
    }

    const floorApplied = Boolean(spec.basedOn) && base !== null && floorRule.floor !== null;
    if (floorApplied && similarity < floorRule.floor!) {
      issuesList.push(`${taxonomy} "${name}" is ${Math.round(similarity * 100)}% similar to its base — below the ${Math.round(floorRule.floor! * 100)}% ${taxonomy} floor`);
    }

    const passed = structural.passed && issuesList.length === 0;
    const record: FidelityVerdictRecord = {
      componentId: name,
      componentName: name,
      taxonomy,
      baseAnchor: spec.basedOn ?? (base && ceilingApplied ? base.name : null),
      similarity: Math.round(similarity * 100) / 100,
      floor: floorApplied ? floorRule.floor : null,
      ceiling: ceilingApplied ? CEILING_SIMILARITY : null,
      structural,
      passed,
      issues: issuesList,
    };
    verdicts.push(record);

    for (const err of structural.errors) {
      issues.push({ file: path, severity: "high", category: "fidelity", description: `${name}: ${err}` });
    }
    for (const note of issuesList) {
      issues.push({ file: path, severity: "high", category: "fidelity", description: note });
    }
  }

  const report: FidelityReport = {
    generatedAt: new Date().toISOString(),
    verdicts,
    summary: {
      total: verdicts.length,
      passed: verdicts.filter((v) => v.passed).length,
      failed: verdicts.filter((v) => !v.passed).length,
      highIssues: issues.filter((i) => i.severity === "high").length,
    },
  };
  return { report, issues };
}

/** Distinct slot utilities — re-exported for the audit report. */
export function slotUtilityCount(code: string): number {
  return distinctSlotUtilities(code);
}

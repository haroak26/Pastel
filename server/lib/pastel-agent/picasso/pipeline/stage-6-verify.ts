import type { Tokens, Brief } from "./types";
import type { ProductContext } from "./anti-slop";
import { bundleScreenForPreview } from "./lib/preview";
import { detectSlopViolations, filterBlockingViolations, type SlopViolation } from "./anti-slop";
import { loadBaseComponent } from "./lib/base-components";

export interface SmokeTestInput {
  screenCode: string;
  screenName: string;
  componentFiles: Record<string, string>;
  supportFiles?: Record<string, string>;
}

export interface SmokeTestOutcome {
  passed: boolean;
  errors: Array<{ type: string; message: string }>;
  warnings: Array<{ type: string; message: string }>;
  renderTimeMs: number;
}

/** Compile-level smoke test: the screen + its components must bundle cleanly. */
export async function runSmokeTest(input: SmokeTestInput): Promise<SmokeTestOutcome> {
  const start = Date.now();
  const errors: SmokeTestOutcome["errors"] = [];
  const warnings: SmokeTestOutcome["warnings"] = [];

  const bundle = await bundleScreenForPreview(
    input.screenName,
    input.screenCode,
    input.componentFiles,
    input.supportFiles ?? {},
  );

  if (!bundle) {
    errors.push({ type: "bundle-failed", message: "Screen failed to bundle with its components" });
  }

  // Static sanity checks
  if (/undefined/.test(input.screenCode) && /<\w+[^>]*\bundefined\b/.test(input.screenCode)) {
    warnings.push({ type: "undefined-value", message: "Literal `undefined` appears in JSX" });
  }
  if (/NaN/.test(input.screenCode) && /<\w+[^>]*NaN/.test(input.screenCode)) {
    warnings.push({ type: "nan-value", message: "NaN appears in JSX" });
  }
  if (/from\s+["']@\//.test(input.screenCode)) {
    errors.push({ type: "alias-import", message: "Screen imports via @/ alias — must be relative" });
  }

  return { passed: errors.length === 0, errors, warnings, renderTimeMs: Date.now() - start };
}

export interface AntiSlopLintOutcome {
  passed: boolean;
  uniqueDesignScore: number; // 0-10
  tokenViolations: Array<{ type: string; location: string; detail: string; severity: "high" | "medium" | "low" }>;
  violations: SlopViolation[];
}

/** Static lint gate: anti-slop + design uniqueness over generated files. */
export function runAntiSlopLintGate(input: {
  screenCode: string;
  componentFiles: Record<string, string>;
  tokens: Tokens;
  brief: Brief;
  globalsCSS: string;
  context: ProductContext;
}): AntiSlopLintOutcome {
  const { screenCode, componentFiles, tokens, context } = input;
  const violations: SlopViolation[] = [];

  const baseSources: Record<string, string> = {};
  for (const [name, code] of Object.entries(componentFiles)) {
    // Find the base this component likely descends from via file-name match
    const base = loadBaseComponent(name);
    if (base) baseSources[name] = base.source;
    violations.push(...detectSlopViolations(code, { file: `components/${name}.tsx`, context, baseSource: base?.source }));
  }
  violations.push(...detectSlopViolations(screenCode, { file: "screen.tsx", context }));

  const blocking = filterBlockingViolations(violations);

  // Uniqueness score: how far generated components diverge from their bases.
  let diffScore = 0;
  let diffCount = 0;
  for (const [name, code] of Object.entries(componentFiles)) {
    const base = baseSources[name];
    if (!base) continue;
    diffCount++;
    diffScore += similarity(code, base);
  }
  const avgSimilarity = diffCount > 0 ? diffScore / diffCount : 1;
  const uniqueness = Math.round((1 - avgSimilarity) * 10);

  const tokenUsage = (screenCode.match(/(?:bg|text|border|ring|fill|stroke)-(?:primary|muted|accent|secondary|card|background|foreground|destructive|input|popover)\b/g) ?? []).length;
  const designScore = Math.max(0, Math.min(10, Math.round(uniqueness * 0.6 + Math.min(10, tokenUsage / 6) * 0.4)));

  return {
    passed: blocking.length === 0,
    uniqueDesignScore: designScore,
    tokenViolations: violations.map((v) => ({
      type: v.id,
      location: v.file ?? "unknown",
      detail: v.description,
      severity: v.severity,
    })),
    violations,
  };
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (longer.length === 0) return 0;
  let matches = 0;
  const sample = Math.min(shorter.length, 2000);
  const seen = new Set<number>();
  for (let i = 0; i < sample; i += 4) {
    const chunk = shorter.slice(i, i + 24);
    const idx = longer.indexOf(chunk);
    if (idx >= 0 && !seen.has(idx)) {
      matches += chunk.length;
      seen.add(idx);
    }
  }
  return matches / Math.max(a.length, b.length, 1);
}

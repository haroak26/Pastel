/**
 * V20 post-generation lint — scans generated JSX for anti-slop violations
 * that survived the model pipeline. These are hard checks that would be
 * caught by the gate; running them in the lint pass gives faster feedback
 * and auto-fixes unambiguous violations.
 */

export interface LintIssue {
  file: string;
  line?: number;
  severity: "high" | "medium" | "low";
  category: string;
  description: string;
  /** When true, the linter auto-fixed this (for transparency). */
  autoFixed?: boolean;
}

interface LintRule {
  name: string;
  scan: (code: string) => Omit<LintIssue, "file">[];
  fix?: (code: string) => { fixed: string; changed: boolean };
}

const HEX_COLOR_RE = /(?<!var\(--\w+[,\)\s]*)#[0-9a-fA-F]{6}\b/g;
const RAW_RADIUS_RE = /\brounded-(sm|md|lg|xl|2xl|3xl|full)\b(?![-\w]*\(var\(--radius)/g;
const RAW_HEIGHT_RE = /\bh-(9|10|11|12|14)\b/g;
const RAW_BG_BLUE_RE = /\bbg-(blue|indigo|purple|pink)-(500|600|700)\b/g;
const SHADOW_ON_STATIC_RE = /\bshadow-(sm|md|lg|xl)\b(?!\s+(hover|active|focus))/g;
const TEXT_CENTER_BODY_RE = /className="[^"]*\btext-center\b[^"]*"[^>]*>[\s\S]*?<(?!div|section|span\s+className="[^"]*\b(absolute|sr-only|flex|grid|inline))/g;
const AI_SLOP_RE = /\b(Get started|Learn more|Unlock your potential|Enterprise-grade security)\b/gi;
const GRADIENT_RE = /\b(bg-gradient-to|from-(blue|indigo|purple)|via-(blue|indigo|purple)|to-(blue|indigo|purple))\b/g;
const BLOB_DOTS_RE = /\b(h-64\s+w-64\s+rounded-full\s+(bg|opacity|blur))|(absolute\s+-top-\d+\s+-right-\d+)|(floating\s+blob)|(geometric\s+blob)\b/gi;

const RULES: LintRule[] = [
  {
    name: "hardcoded-hex-colors",
    scan: (code) => {
      const matches = [...code.matchAll(HEX_COLOR_RE)];
      if (matches.length === 0) return [];
      // Filter out JS object literal colors used as DATA (not styling)
      const styleHexes = matches.filter((m) => {
        const pos = m.index!;
        const context = code.slice(Math.max(0, pos - 50), pos + 20);
        return /\b(className|style|bg-|text-|border-|ring-|shadow-)/.test(context.slice(0, 50));
      });
      if (styleHexes.length === 0) return [];
      return [{
        severity: "high" as const,
        category: "lint",
        description: `${styleHexes.length} hardcoded hex color(s) in inline styles/classes: ${styleHexes.map((m) => code.slice(m.index!, m.index! + 10)).join(", ")} — use CSS custom properties from the theme`,
      }];
    },
  },
  {
    name: "raw-radius-utilities",
    scan: (code) => {
      const matches = [...code.matchAll(RAW_RADIUS_RE)];
      if (matches.length === 0) return [];
      return [{
        severity: "high" as const,
        category: "lint",
        description: `${matches.length} raw Tailwind radius utilit${matches.length === 1 ? "y" : "ies"} (${matches.map((m) => m[0]).join(", ")}) — use rounded-[var(--radius-md)] etc. from the theme`,
      }];
    },
    fix: (code) => {
      let fixed = code;
      fixed = fixed.replace(/\brounded-sm\b/g, "rounded-[var(--radius-sm)]");
      fixed = fixed.replace(/\brounded-md\b/g, "rounded-[var(--radius-md)]");
      fixed = fixed.replace(/\brounded-lg\b/g, "rounded-[var(--radius-lg)]");
      // V21: rounded-xl maps to radius-xl (it is the largest step), so large
      // surfaces keep their intended generous corner — v20 collapsed them
      // onto radius-lg, which read as "not rounded".
      fixed = fixed.replace(/\brounded-xl\b/g, "rounded-[var(--radius-xl)]");
      fixed = fixed.replace(/\brounded-2xl\b/g, "rounded-[var(--radius-xl)]");
      fixed = fixed.replace(/\brounded-3xl\b/g, "rounded-[var(--radius-xl)]");
      fixed = fixed.replace(/\brounded-full\b/g, "rounded-full");
      return { fixed, changed: fixed !== code };
    },
  },
  {
    name: "raw-control-heights",
    scan: (code) => {
      const matches = [...code.matchAll(RAW_HEIGHT_RE)];
      if (matches.length === 0) return [];
      return [{
        severity: "high" as const,
        category: "lint",
        description: `${matches.length} raw Tailwind height utilit${matches.length === 1 ? "y" : "ies"} (${matches.map((m) => m[0]).join(", ")}) — use h-[var(--control-sm/md/lg)] from the control scale`,
      }];
    },
    fix: (code) => {
      let fixed = code;
      fixed = fixed.replace(/\bh-9\b/g, "h-[var(--control-sm)]");
      fixed = fixed.replace(/\bh-10\b/g, "h-[var(--control-md)]");
      fixed = fixed.replace(/\bh-11\b/g, "h-[var(--control-sm)]");
      fixed = fixed.replace(/\bh-12\b/g, "h-[var(--control-md)]");
      fixed = fixed.replace(/\bh-14\b/g, "h-[var(--control-lg)]");
      return { fixed, changed: fixed !== code };
    },
  },
  {
    name: "blue-purple-utilities",
    scan: (code) => {
      const matches = [...code.matchAll(RAW_BG_BLUE_RE)];
      if (matches.length === 0) return [];
      return [{
        severity: "medium" as const,
        category: "lint",
        description: `${matches.length} blue/indigo/purple background utilit${matches.length === 1 ? "y" : "ies"} — use theme tokens (bg-primary, bg-muted, bg-accent)`,
      }];
    },
  },
  {
    name: "gradients",
    scan: (code) => {
      const matches = [...code.matchAll(GRADIENT_RE)];
      if (matches.length === 0) return [];
      return [{
        severity: "high" as const,
        category: "lint",
        description: `Gradient utilities detected — no gradient backgrounds allowed per anti-slop law`,
      }];
    },
  },
  {
    name: "floating-decorations",
    scan: (code) => {
      const matches = [...code.matchAll(BLOB_DOTS_RE)];
      if (matches.length === 0) return [];
      return [{
        severity: "high" as const,
        category: "lint",
        description: `Floating blob/dot decorations detected — no geometric decorations allowed per anti-slop law`,
      }];
    },
  },
  {
    name: "ai-slop-copy",
    scan: (code) => {
      const matches = [...code.matchAll(AI_SLOP_RE)];
      if (matches.length === 0) return [];
      return [{
        severity: "medium" as const,
        category: "lint",
        description: `${matches.length} AI-slop phrase(s) detected: ${matches.map((m) => m[0]).join(", ")}`,
      }];
    },
  },
];

/**
 * Scan generated JSX files for anti-slop violations.
 * Returns issues and a fixed version of the code (when auto-fixable rules apply).
 */
export function lintGeneratedFile(path: string, code: string): {
  issues: LintIssue[];
  fixed: string | null;
} {
  const issues: LintIssue[] = [];
  let fixed = code;
  let changed = false;

  for (const rule of RULES) {
    const found = rule.scan(fixed);
    if (found.length > 0) {
      for (const f of found) {
        issues.push({ ...f, file: path });
      }
      if (rule.fix) {
        const result = rule.fix(fixed);
        if (result.changed) {
          fixed = result.fixed;
          changed = true;
          for (const f of found) {
            issues.push({ ...f, file: path, autoFixed: true });
          }
        }
      }
    }
  }

  return { issues, fixed: changed ? fixed : null };
}

/**
 * Scan ALL generated files, returning issues + a map of fixed files.
 */
export function lintAllGeneratedFiles(
  files: Record<string, string>,
): { issues: LintIssue[]; fixedFiles: Record<string, string> } {
  const allIssues: LintIssue[] = [];
  const fixedFiles: Record<string, string> = {};

  for (const [path, code] of Object.entries(files)) {
    if (!path.endsWith(".jsx") && !path.endsWith(".js")) continue;
    // Only lint generated files, not source schemas
    if (!path.startsWith("src/")) continue;

    const { issues, fixed } = lintGeneratedFile(path, code);
    allIssues.push(...issues);
    if (fixed) {
      fixedFiles[path] = fixed;
    }
  }
  return { issues: allIssues, fixedFiles };
}

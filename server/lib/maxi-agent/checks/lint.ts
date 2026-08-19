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
/** className literal(s) a generated element can carry. */
const CLASS_STRING_RE = /className=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g;
const TEXT_CENTER_BODY_RE = /className="[^"]*\btext-center\b[^"]*"[^>]*>[\s\S]*?<(?!div|section|span\s+className="[^"]*\b(absolute|sr-only|flex|grid|inline))/g;
const AI_SLOP_RE = /\b(Get started|Learn more|Unlock your potential|Enterprise-grade security)\b/gi;
const GRADIENT_RE = /\b(bg-gradient-to|from-(blue|indigo|purple)|via-(blue|indigo|purple)|to-(blue|indigo|purple))\b/g;
const BLOB_DOTS_RE = /\b(h-64\s+w-64\s+rounded-full\s+(bg|opacity|blur))|(absolute\s+-top-\d+\s+-right-\d+)|(floating\s+blob)|(geometric\s+blob)\b/gi;

// V26: oversized text classes — the most common anti-slop violation
const OVERSIZE_TEXT_RE = /\btext-(5xl|6xl|7xl|8xl|9xl)\b/g;

// V26: TypeScript syntax in .jsx files (Gemini emits TS in JSX)
const TS_INTERFACE_RE = /^\s*(export\s+)?interface\s+\w+\s*\{[^}]*\}\s*$/gm;
const TS_TYPE_ALIAS_RE = /^\s*(export\s+)?type\s+\w+\s*=\s*[^;]+;\s*$/gm;
const TS_GENERIC_RE = /\b(useState|useRef|useMemo|useCallback|useContext|useReducer)<[^>]+>/g;
const TS_TYPE_ANNOTATION_RE = /(\w+)\s*:\s*(string|number|boolean|any|void|never|unknown|object|React\.\w+)(\s*[=;,)])/g;
const TS_AS_CAST_RE = /\s+as\s+(string|number|boolean|any|HTMLElement|Element|unknown)\b/g;

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
    name: "progress-bar-square-track",
    scan: (code) => {
      const tracks: string[] = [];
      for (const m of code.matchAll(CLASS_STRING_RE)) {
        const cls = m[1] ?? m[2] ?? m[3] ?? "";
        // A raw track signature: a clip container (overflow-hidden) sized by a
        // height utility whose corners are forced square — the "unstyled HTML
        // progress bar" look that reads as a bug on rounded content.
        if (/overflow-hidden/.test(cls) && /\bh-[0-9.]+\b/.test(cls) && /\brounded-none\b/.test(cls)) {
          tracks.push(m[0].slice(0, 60));
        }
      }
      if (tracks.length === 0) return [];
      return [{
        severity: "medium" as const,
        category: "lint",
        description: `Progress/scroll track uses rounded-none (${tracks.length} element(s): ${tracks.join(", ")}) — square corners on rounded content reads as a bug. Use rounded-[var(--radius-full)].`,
      }];
    },
    fix: (code) => {
      let changed = false;
      const fixed = code.replace(CLASS_STRING_RE, (whole, dq: string | undefined, sq: string | undefined, bt: string | undefined) => {
        const cls = dq ?? sq ?? bt ?? "";
        if (!/overflow-hidden/.test(cls) || !/\bh-[0-9.]+\b/.test(cls) || !/\brounded-none\b/.test(cls)) return whole;
        const next = cls.replace(/\brounded-none\b/g, "rounded-[var(--radius-full)]");
        if (next !== cls) changed = true;
        const wrap = whole.slice(0, whole.indexOf("="));
        const quote = dq !== undefined ? '"' : sq !== undefined ? "'" : "`";
        return `${wrap}=${quote}${next}${quote}`;
      });
      return { fixed, changed };
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
  // V26: oversized text — the single most common anti-slop violation
  {
    name: "oversized-text-classes",
    scan: (code) => {
      const matches = [...code.matchAll(OVERSIZE_TEXT_RE)];
      if (matches.length === 0) return [];
      return [{
        severity: "high" as const,
        category: "anti-slop",
        description: `Oversized text class(es) found (${matches.map((m) => m[0]).join(", ")}) — maximum allowed is text-4xl. Use font-black + tracking-tight for impact instead.`,
      }];
    },
    fix: (code) => {
      const fixed = code.replace(/\btext-(5xl|6xl|7xl|8xl|9xl)\b/g, "text-4xl");
      return { fixed, changed: fixed !== code };
    },
  },
  // V26: TypeScript syntax in .jsx files — Gemini emits TS syntax that breaks esbuild
  {
    name: "typescript-in-jsx",
    scan: (code) => {
      const issues: Array<{ severity: "high"; category: "lint"; description: string }> = [];
      const interfaces = [...code.matchAll(TS_INTERFACE_RE)];
      const types = [...code.matchAll(TS_TYPE_ALIAS_RE)];
      const generics = [...code.matchAll(TS_GENERIC_RE)];
      const parts: string[] = [];
      if (interfaces.length > 0) parts.push(`${interfaces.length} interface declaration(s)`);
      if (types.length > 0) parts.push(`${types.length} type alias(es)`);
      if (generics.length > 0) parts.push(`${generics.length} generic type parameter(s)`);
      if (parts.length > 0) {
        issues.push({
          severity: "high",
          category: "lint",
          description: `TypeScript syntax in .jsx file: ${parts.join(", ")} — write plain JSX only, no TypeScript`,
        });
      }
      return issues;
    },
    fix: (code) => {
      let fixed = code;
      // Remove interface declarations (handle multi-line with brace matching)
      fixed = fixed.replace(/^\s*(export\s+)?interface\s+\w+\s*\{[\s\S]*?\}\s*$/gm, "");
      // Remove type alias declarations
      fixed = fixed.replace(/^\s*(export\s+)?type\s+\w+\s*=\s*[^;]+;\s*$/gm, "");
      // Remove generic type parameters from React hooks
      fixed = fixed.replace(/\b(useState|useRef|useMemo|useCallback|useContext|useReducer)<[^>]+>/g, "$1");
      // Remove simple 'as Type' casts
      fixed = fixed.replace(/\s+as\s+(string|number|boolean|any|HTMLElement|Element|unknown)\b/g, "");
      return { fixed, changed: fixed !== code };
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

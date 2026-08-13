import { contrastRatio } from "../lib/colors";
import type { ResolvedTheme } from "../schemas";

/**
 * Deterministic quality gate — Pastel v5 (code-level, $0).
 *
 * Every check is mechanical: no LLM judgment. Violations produce
 * file-targeted fixes. The theme tokens are validated for WCAG AA at
 * runtime (hue rotation shifts them), and every generated file is scanned
 * for contract violations.
 */

export interface GateIssue {
  file: string;
  severity: "high" | "medium" | "low";
  category: string;
  description: string;
}

export interface GateReport {
  passed: boolean;
  score: number;
  issues: GateIssue[];
}

const HEX_RE = /#[0-9a-fA-F]*[a-fA-F][0-9a-fA-F]*\b/;
const FORBIDDEN_FONTS = ["Inter", "Roboto", "system-ui"];

/** Class tokens that imply huge paddings/sections (the v4 slop signature).
 * py-16 is LEGAL since V11 — it is the 2xl ladder step for dominant moments
 * and full-bleed accent bands; anything above it is slop. */
const HUGE_PADDING = ["py-20", "py-24", "py-28", "py-32", "p-16", "p-20", "p-24", "gap-16", "gap-20", "gap-24"];
const HUGE_TYPE = ["text-6xl", "text-7xl", "text-8xl"]; // text-5xl is legal: compile.ts caps it at the theme 4xl size
/** V11: raw control heights OFF the 8px rhythm (36px/44px) in shared
 * components — heights must come from the --control-* token scale.
 * (Small paddings like px-3/p-3 stay legal — chips and icons use the
 * 4px sub-grid; control HEIGHTS are the law.) */
const OFF_RHYTHM_CONTROL = /\bh-9\b|\bh-11\b/;
const GRADIENT = /bg-gradient|from-[a-z]+-|via-[a-z]+-|to-[a-z]+-/;
const BLURB = /lorem ipsum|placeholder text/i;
const AI_SLOP_COPY = /unlock (your |the )?potential|enterprise-grade|game[- ]changer|seamless(ly)? (integration|experience)|revolutioniz|cutting[- ]edge|supercharge/i;
/** V19: hardcoded radius values off the token scale — the theme law. */
const RAW_RADIUS = /\brounded-(?:sm|md|lg|xl|2xl|3xl)\b/;

/** Detect a generated component file that reads as an UNMODIFIED generic
 * template. V21 removed the base-component library, so there is no source
 * file to diff against — instead the signature of "copied template" is
 * detected structurally: a component that uses NO theme token and NO radius
 * token renders as the bare-bones generic skeleton. */
function isVerbatimBaseCopy(path: string, content: string): boolean {
  if (!path.startsWith("src/components/")) return false;
  if (content.includes("var(--")) return false;
  if (/rounded-\[var\(--radius/.test(content)) return false;
  return content.trim().length > 60;
}

function contrastIssues(theme: ResolvedTheme): GateIssue[] {
  const t = theme.tokens;
  const pairs: Array<[string, string, string]> = [
    ["foreground on background", t.foreground, t.background],
    ["muted-foreground on background", t.mutedForeground, t.background],
    ["primary on primary-foreground", t.primary, t.primaryForeground],
    ["primary on background (links)", t.primary, t.background],
    ["accent on accent-foreground", t.accent, t.accentForeground],
    ["success on success-subtle", t.success, t.successSubtle],
    ["warning on warning-subtle", t.warning, t.warningSubtle],
  ];
  const out: GateIssue[] = [];
  for (const [name, a, b] of pairs) {
    const r = contrastRatio(a, b);
    if (r < 4.5) {
      out.push({
        file: "src/styles.css",
        severity: "high",
        category: "contrast",
        description: `${name}: contrast ${r.toFixed(2)} < 4.5 (WCAG AA). Adjust the theme tokens.`,
      });
    }
  }
  return out;
}

export function auditFiles(theme: ResolvedTheme, files: Record<string, string>): GateReport {
  const issues: GateIssue[] = [...contrastIssues(theme)];

  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith(".jsx") && !path.endsWith(".js")) continue;
    // Generated data payload — ids like "#1234" are data, not colors.
    if (path === "src/data.js") continue;

    // Hardcoded hex colors (contract: tokens only)
    if (HEX_RE.test(content)) {
      const m = content.match(HEX_RE);
      issues.push({
        file: path,
        severity: "high",
        category: "tokens",
        description: `Hardcoded color ${m?.[0] ?? ""} — use CSS custom properties only.`,
      });
    }

    // Forbidden fonts
    for (const f of FORBIDDEN_FONTS) {
      if (new RegExp(`["']${f}["']`, "i").test(content)) {
        issues.push({
          file: path,
          severity: "high",
          category: "tokens",
          description: `Forbidden font "${f}" — use var(--font-display)/var(--font-body).`,
        });
      }
    }

    // Slop-pattern classes
    const slop: string[] = [];
    for (const c of HUGE_PADDING) if (content.includes(c)) slop.push(c);
    for (const c of HUGE_TYPE) if (content.includes(c)) slop.push(c);
    if (slop.length > 0) {
      issues.push({
        file: path,
        severity: "medium",
        category: "anti-slop",
        description: `Slop pattern classes: ${slop.join(", ")}. Section padding comes from the 8px ladder (py-8/py-12, bands py-16); type maxes at text-4xl.`,
      });
    }
    if (GRADIENT.test(content)) {
      issues.push({
        file: path,
        severity: "medium",
        category: "anti-slop",
        description: "Gradient backgrounds detected — forbidden in every theme.",
      });
    }

    // V11: shared components must size controls from the --control-* token
    // scale — raw h-9/h-11/p-3/p-7 break the 8px rhythm and the theme law.
    if (path.startsWith("src/components/") && OFF_RHYTHM_CONTROL.test(content)) {
      const hits = [...new Set(content.match(OFF_RHYTHM_CONTROL) ?? [])].join(", ");
      issues.push({
        file: path,
        severity: "medium",
        category: "tokens",
        description: `Off-rhythm raw sizing utilities ${hits} — use the --control-* scale (h-[var(--control-md)]) and the 8px rhythm.`,
      });
    }

    // V19: hardcoded radius values off the token scale — the theme law.
    // Raw rounded-md/xl etc. override the run's radius tokens.
    if (RAW_RADIUS.test(content)) {
      const hits = [...new Set(content.match(RAW_RADIUS) ?? [])].slice(0, 3).join(", ");
      issues.push({
        file: path,
        severity: "medium",
        category: "tokens",
        description: `Hardcoded radius ${hits} — use rounded-[var(--radius-md)]/var(--radius-lg) so corners follow the run's token scale.`,
      });
    }

    // V19: a component shipped as an UNMODIFIED base component copy is the
    // "everything looks the same" defect. Every component must be adapted
    // per-run by the builder.
    if (isVerbatimBaseCopy(path, content)) {
      issues.push({
        file: path,
        severity: "medium",
        category: "anti-slop",
        description: `Component is an unmodified copy of the base "${path.replace(/^src\/components\//, "").replace(/\.jsx$/, "")}" — every component must be a per-run adaptation (the builder's job).`,
      });
    }

    // V11: screens with inputs must have visible labels (the search recipe
    // emits them by construction; this rule keeps the contract). A label
    // counts when rendered as a <label> element or passed as the Input/
    // Select `label` prop (the base components render it visibly).
    if (path.startsWith("src/screens/") && /<Input\b|<input\b/.test(content) && !/<label\b|(?<!aria-)label=/.test(content)) {
      issues.push({
        file: path,
        severity: "medium",
        category: "a11y",
        description: "Inputs on this screen have no <label> — every control needs a visible label (not just placeholder/aria-label).",
      });
    }
    if (BLURB.test(content)) {
      issues.push({
        file: path,
        severity: "medium",
        category: "anti-slop",
        description: "Placeholder/lorem copy detected — real content required.",
      });
    }
    if (AI_SLOP_COPY.test(content)) {
      issues.push({
        file: path,
        severity: "medium",
        category: "anti-slop",
        description: "AI-slop copy detected — rewrite in specific, human language.",
      });
    }

    // Import compliance
    const bare = content.match(/^import .* from "([^"]+)"/gm)?.map((m) => m.match(/"([^"]+)"/)![1]).filter((b) => !b.startsWith(".")) ?? [];
    for (const b of bare) {
      if (b !== "react" && !b.startsWith("lucide-react")) {
        issues.push({
          file: path,
          severity: "high",
          category: "state",
          description: `Forbidden import "${b}" — only react and lucide-react are available.`,
        });
      }
    }

    // Relative component imports must resolve to a generated file — the
    // contract-break that kills every screen is caught here at $0.
    for (const m of content.match(/import .* from "(\.[^"]+)"/g) ?? []) {
      const spec = m.match(/"(\.[^"]+)"/)![1];
      if (spec.endsWith(".jsx") && spec.startsWith("../components/")) {
        if (!files[spec.replace(/^\.\.\//, "src/")]) {
          issues.push({
            file: path,
            severity: "high",
            category: "state",
            description: `Imports missing component file ${spec} — screen cannot compile.`,
          });
        }
      }
    }
  }

  const high = issues.filter((i) => i.severity === "high").length;
  const passed = high === 0;
  const score = Math.max(0, 100 - issues.length * 5 - high * 10);
  return { passed, score, issues: issues.slice(0, 40) };
}

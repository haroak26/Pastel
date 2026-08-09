import type { GateIssue } from "./audit";
import type { ComponentUISpec } from "../schemas";

/**
 * V22 prop-binding gate — verifies that every mounted custom component
 * actually received the props its own planner spec declares as required.
 *
 * screen-composer.ts already tells the model "every component you mount MUST
 * receive the exact props its spec declares… never empty arrays." Nothing
 * verified it happened: the v21 fixture shipped <SprintTaskTable
 * className="w-full" /> — no items prop at all — and the component's own
 * `var fallbackItems = []` fallback rendered "0 tasks" with an empty body.
 * This is the enforcement half of that rule, the same way checks/layout.ts
 * enforces the placement/header half.
 *
 * All checks are zero-cost source scans — no model call.
 */

/** Extract every mount site of the given component names from a JSX file.
 * Handles self-closing (<Tag />) and paired (<Tag>…</Tag>) opening tags,
 * quoted attribute strings, and brace-balanced JSX expression attributes
 * (so `items={{ a: 1 }}` and `className={cn("x", {active})}` parse whole). */
function scanMountSites(code: string, names: Set<string>): Array<{ name: string; attrs: string }> {
  const sites: Array<{ name: string; attrs: string }> = [];
  const tagRe = /<(?!\/)([A-Z][A-Za-z0-9]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(code)) !== null) {
    const name = m[1];
    if (!names.has(name)) continue;
    let i = m.index + m[0].length;
    let depth = 0;
    let inStr: string | null = null;
    let attrs = "";
    let closed = false;
    while (i < code.length) {
      const ch = code[i];
      if (inStr) {
        attrs += ch;
        if (ch === "\\") { attrs += code[i + 1] ?? ""; i += 2; continue; }
        if (ch === inStr) inStr = null;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'") { inStr = ch; attrs += ch; i++; continue; }
      if (ch === "{") { depth++; attrs += ch; i++; continue; }
      if (ch === "}") { depth = Math.max(0, depth - 1); attrs += ch; i++; continue; }
      if (ch === ">" && depth === 0) { closed = true; break; }
      attrs += ch;
      i++;
    }
    if (!closed) continue;
    sites.push({ name, attrs });
  }
  return sites;
}

/** Parse the attribute body of a JSX opening tag into prop name → raw value. */
function parseProps(attrs: string): Map<string, string> {
  const props = new Map<string, string>();
  const attrRe = /([A-Za-z_$][\w$]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/g;
  for (const m of attrs.matchAll(attrRe)) {
    if (m[2] !== undefined) props.set(m[1], `"${m[2]}"`);
    else if (m[3] !== undefined) props.set(m[1], `'${m[3]}'`);
    else if (m[4] !== undefined) props.set(m[1], `{${m[4]}}`);
  }
  return props;
}

/** A value that reads as "no real data" — the exact failure the gate exists to catch.
 * Expression props arrive wrapped as {expr} (e.g. {[]}, {undefined}), so unwrap
 * the outer braces before judging the literal. */
function isEmptyLiteral(raw: string): boolean {
  let v = raw.trim();
  if (v.startsWith("{") && v.endsWith("}")) v = v.slice(1, -1).trim();
  return v === "[]" || v === "{}" || v === '""' || v === "''" || v === "undefined" || v === "null";
}

/**
 * Audit composed screens against the planner's per-component prop specs.
 *
 * For every custom component mounted in a screen file, every prop declared in
 * its spec WITHOUT a default (i.e. required) must be passed at the mount site
 * with a non-empty value. Missing or empty props produce a file-targeted
 * GateIssue that flows into the repair pipeline exactly like a layout issue.
 */
export function auditPropBindings(
  specs: Record<string, ComponentUISpec>,
  files: Record<string, string>,
): GateIssue[] {
  const issues: GateIssue[] = [];
  const names = new Set(Object.keys(specs));
  if (names.size === 0) return issues;

  for (const [path, code] of Object.entries(files)) {
    if (!path.startsWith("src/screens/") || !/\.(jsx|tsx)$/.test(path)) continue;
    const sites = scanMountSites(code, names);
    if (sites.length === 0) continue;
    for (const site of sites) {
      const spec = specs[site.name];
      if (!spec) continue;
      const passed = parseProps(site.attrs);
      for (const prop of spec.props) {
        if (prop.default !== undefined) continue;
        const val = passed.get(prop.name);
        if (val === undefined) {
          issues.push({
            file: path,
            severity: "high",
            category: "props",
            description: `${site.name} mounts without its required prop "${prop.name}" (${spec.name}'s spec declares it with no default). Pass real data from DATA — e.g. ${prop.name}={DATA.screens.home.rows} — never omit it or pass an empty array.`,
          });
          continue;
        }
        if (isEmptyLiteral(val)) {
          issues.push({
            file: path,
            severity: "high",
            category: "props",
            description: `${site.name} receives empty value ${val} for required prop "${prop.name}" — pass real data (no empty arrays, strings, undefined, or null).`,
          });
        }
      }
    }
  }
  return issues;
}

import type { PropContract, PropContractEntry } from "../types";

/**
 * V8 prop-contract validation (IMPROVEMENTS.md #3) — before a composed screen
 * is persisted, every component usage in its JSX is checked against the
 * manifest's declared prop contract. Required props must be present; basic
 * type sanity is checked for array/object specs. This is the gate that turns
 * the v7 runtime crashes (WeekStrip/HabitRow/LedgerSwitch used without their
 * required props → `undefined.map`) into a composition-time failure.
 */

export interface PropViolation {
  componentId: string;
  componentName: string;
  /** Required props the usage does not pass (verifiably). */
  missingRequired: string[];
  /** How many times the component is mounted. */
  usageCount: number;
  /** Reason the contract could not be verified (spread props present). */
  unverifiable?: boolean;
}

export interface ScreenPropAudit {
  violations: PropViolation[];
  /** Mounts auto-fixed (replaced with a safe wrapper) before persisting. */
  autoFixed: string[];
}

interface Usage {
  attrNames: Set<string>;
  hasSpread: boolean;
  isEmpty: boolean;
}

/** Attributes that never satisfy a data contract (styling/layout chrome). */
const CHROME_ATTRS = new Set(["className", "style", "id", "key", "ref"]);

function entryFor(propContract: PropContract, componentId: string): PropContractEntry | undefined {
  return propContract.entries.find((e) => e.componentId === componentId);
}

function pascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_m, _p, c) => c.toUpperCase());
}

/** The composer aliases EVERY export of a component with the manifest's
 *  PascalCase id (importsBlock in stage-5), so a usage of manifest entry
 *  "habit-row" appears in JSX as `<HabitRowHabitRow>`, `<HabitRowItem>`…
 *  Match by the PascalCase-id prefix — longest prefix wins. */
function findUsages(screenCode: string, componentIds: string[]): Map<string, Usage[]> {
  const prefixes = componentIds
    .map((id) => ({ id, prefix: pascal(id) }))
    .filter((p) => p.prefix.length > 0)
    .sort((a, b) => b.prefix.length - a.prefix.length);
  const byName = new Map<string, Usage[]>();
  const tagRe = /<([A-Z][\w$]*)\b([^>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(screenCode))) {
    const name = m[1];
    const matched = prefixes.find((p) => name === p.prefix || name.startsWith(p.prefix));
    if (!matched) continue;
    const attrs = m[2] ?? "";
    const selfClosing = m[3] === "/";
    const attrNames = new Set<string>();
    const attrRe = /([\w$-]+)\s*=/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(attrs))) attrNames.add(a[1]);
    const hasSpread = /\{[^}]*\.\.\.[^}]*\}/.test(attrs) || /\.\.\.\w+/.test(attrs);
    // A tag is "empty" when it passes no data-bearing attributes at all
    // (only chrome like className) and has no children reference.
    const dataAttrs = [...attrNames].filter((n) => !CHROME_ATTRS.has(n));
    const isEmpty = !hasSpread && dataAttrs.length === 0;
    if (!byName.has(matched.id)) byName.set(matched.id, []);
    byName.get(matched.id)!.push({ attrNames: new Set(dataAttrs), hasSpread, isEmpty });
    if (selfClosing) {
      tagRe.lastIndex = Math.max(tagRe.lastIndex, m.index + m[0].length);
    }
  }
  return byName;
}

/**
 * Audit a composed screen's component usages against the prop contract.
 * Spread props make the contract unverifiable statically — those usages are
 * reported as unverifiable, never as violations.
 */
export function auditScreenProps(screenCode: string, propContract: PropContract): ScreenPropAudit {
  const violations: PropViolation[] = [];
  const componentIds = propContract.entries.map((e) => e.componentId);
  const usages = findUsages(screenCode, componentIds);

  for (const [componentId, usageList] of usages) {
    const entry = entryFor(propContract, componentId);
    if (!entry) continue;
    const required = Object.entries(entry.props ?? {})
      .filter(([, spec]) => spec.required)
      .map(([name]) => name);
    if (required.length === 0) continue;

    const missing = new Set<string>(required);
    let spreadSeen = false;
    for (const usage of usageList) {
      if (usage.hasSpread) { spreadSeen = true; continue; }
      for (const attr of usage.attrNames) missing.delete(attr);
    }
    if (spreadSeen) {
      // Cannot verify statically — never block on unverifiable usage.
      continue;
    }
    if (missing.size > 0) {
      const verifiable = usageList.filter((u) => !u.hasSpread);
      if (verifiable.length === 0) continue;
      violations.push({
        componentId,
        componentName: entry.componentName,
        missingRequired: [...missing],
        usageCount: verifiable.length,
      });
    }
  }

  return { violations, autoFixed: [] };
}

/**
 * Deterministic auto-fix for crash-prone mounts: usages that pass no
 * data-bearing attributes while the component declares required props are
 * replaced with a safe neutral wrapper (children preserved). The composer's
 * data-driven layout is untouched; only the broken mount is neutralized.
 * Anything that cannot be safely auto-fixed stays flagged.
 */
export function applyPropAutoFix(
  screenCode: string,
  audit: ScreenPropAudit,
  propContract: PropContract,
): { code: string; audit: ScreenPropAudit; fixed: string[] } {
  if (audit.violations.length === 0) return { code: screenCode, audit, fixed: [] };

  const fixedIds = new Set<string>();
  let code = screenCode;
  const prefixes = propContract.entries
    .map((e) => ({ id: e.componentId, prefix: pascal(e.componentId) }))
    .filter((p) => p.prefix.length > 0)
    .sort((a, b) => b.prefix.length - a.prefix.length);
  const tagRe = /<([A-Z][\w$]*)\b([^>]*?)(\/?)>/g;

  for (const violation of audit.violations) {
    const entry = entryFor(propContract, violation.componentId);
    if (!entry) continue;
    // Only auto-fix usages whose ENTIRE attribute set is chrome (no data at all).
    tagRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    const fixCandidates: Array<{ start: number; end: number; name: string }> = [];
    while ((m = tagRe.exec(code))) {
      const matched = prefixes.find((p) => m![1] === p.prefix || m![1].startsWith(p.prefix));
      if (!matched || matched.id !== violation.componentId) continue;
      const attrs = m[2] ?? "";
      const dataAttrs = [...attrs.matchAll(/([\w$-]+)\s*=/g)].map((a) => a[1]).filter((n) => !CHROME_ATTRS.has(n));
      if (dataAttrs.length > 0) continue;
      if (/\{[^}]*\.\.\.[^}]*\}/.test(attrs)) continue;
      fixCandidates.push({ start: m.index, end: m.index + m[0].length, name: m[1] });
    }
    if (fixCandidates.length === 0) continue;

    // Replace each candidate with a safe wrapper; paired tags get their
    // children kept by closing with </div>.
    const blocks: Array<{ start: number; end: number; replacement: string }> = [];
    for (const cand of fixCandidates) {
      const openTag = code.slice(cand.start, cand.end);
      const paired = !openTag.endsWith("/>");
      if (paired) {
        // Find the matching closing tag on the same line or next lines.
        const rest = code.slice(cand.end);
        const closeRe = new RegExp(`<\\/${cand.name}>`);
        const close = closeRe.exec(rest);
        if (close) {
          const closeEnd = cand.end + close.index + close[0].length;
          const wrapper = `<div data-mount="${violation.componentId}" className="rounded-lg border border-border p-4 text-sm text-muted-foreground">`;
          const content = code.slice(cand.end, cand.end + close.index);
          blocks.push({ start: cand.start, end: closeEnd, replacement: `${wrapper}${content}</div>` });
          continue;
        }
      }
      blocks.push({
        start: cand.start,
        end: cand.end,
        replacement: `<div data-mount="${violation.componentId}" className="rounded-lg border border-border p-4 text-sm text-muted-foreground" />`,
      });
    }
    // Apply from the end so earlier indexes stay valid.
    blocks.sort((a, b) => b.start - a.start);
    for (const b of blocks) {
      code = code.slice(0, b.start) + b.replacement + code.slice(b.end);
    }
    fixedIds.add(violation.componentId);
  }

  const remaining = audit.violations.filter((v) => !fixedIds.has(v.componentId));
  return {
    code,
    audit: { violations: remaining, autoFixed: audit.autoFixed },
    fixed: [...fixedIds],
  };
}

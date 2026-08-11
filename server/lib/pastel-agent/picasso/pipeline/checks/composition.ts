import type { ScreenPlan } from "../types";

/**
 * V8 deterministic composition gate — ported from the sibling Pastel Agent
 * pipeline's `checks/review-v14.ts#auditScreenComposition` concepts
 * (duplicate mounts, planned-but-unmounted components) plus an
 * empty/placeholder-section detector. These catch the v7 defects that the
 * static anti-slop gate missed: the "Today / Today" duplicate nav tab and
 * the unlabeled full-width bar / empty grey box.
 */

export interface CompositionViolation {
  screen: string;
  id: string;
  severity: "high" | "medium" | "low";
  description: string;
}

export interface CompositionGateResult {
  passed: boolean;
  violations: CompositionViolation[];
}

/** Component usages in the JSX source: tag name → count. */
export function countComponentMounts(code: string): Map<string, number> {
  const counts = new Map<string, number>();
  const tagRe = /<([A-Z][\w$]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(code))) {
    const name = m[1];
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

/**
 * Literal text nodes in JSX (e.g. `Today` between tags), used for the
 * duplicate-label detector. Text inside `{...}` expressions is skipped.
 */
export function collectJsxTextNodes(code: string): string[] {
  const out: string[] = [];
  const re = />([^<{}]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const text = m[1].trim();
    if (text.length >= 2 && text.length <= 40 && !/^\d+[.,\d]*$/.test(text)) {
      out.push(text);
    }
  }
  return out;
}

/** Group consecutive source lines into indentation "blocks" (loose sibling
 *  adjacency — good enough to catch `<Tab>Today</Tab><Tab>Today</Tab>`). */
function siblingBlocks(code: string): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  let currentIndent = -1;
  for (const raw of code.split("\n")) {
    const line = raw.replace(/\/\/.*$/, "").trimEnd();
    if (!line.trim()) continue;
    const indent = raw.match(/^\s*/)?.[0].length ?? 0;
    if (current.length > 0 && indent !== currentIndent && line.startsWith("</")) {
      // closing tag of a block — close the current block
      blocks.push(current);
      current = [];
      currentIndent = -1;
    }
    if (current.length > 0 && indent !== currentIndent) {
      blocks.push(current);
      current = [];
    }
    currentIndent = indent;
    current.push(line.trim());
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

/**
 * Duplicate-mount detector: the same non-row component mounted twice within
 * one sibling block (the "Today / Today" defect shape), and the same literal
 * text label rendered twice within one sibling block.
 */
export function auditScreenComposition(
  code: string,
  plan: ScreenPlan | null,
): CompositionViolation[] {
  const violations: CompositionViolation[] = [];
  const screen = plan?.id ?? "?";

  for (const block of siblingBlocks(code)) {
    // Duplicate component mounts within a sibling block. Row/collection
    // components (molecule/organism names carrying plural data) are exempt —
    // repeated rows are the product, repeated chrome is the defect.
    const mounts = new Map<string, number>();
    for (const line of block) {
      const tagRe = /<([A-Z][\w$]*)\b/g;
      let m: RegExpExecArray | null;
      while ((m = tagRe.exec(line))) {
        mounts.set(m[1], (mounts.get(m[1]) ?? 0) + 1);
      }
    }
    for (const [name, count] of mounts) {
      if (count >= 2 && isChromeComponent(name)) {
        violations.push({
          screen,
          id: "duplicate-mount",
          severity: "high",
          description: `Component "${name}" is mounted ${count}× in one sibling block — a duplicated chrome mount (e.g. duplicate nav tabs).`,
        });
      }
    }

    // Duplicate literal labels within a sibling block (Today / Today).
    const labels = new Map<string, number>();
    for (const line of block) {
      for (const text of collectJsxTextNodes(line)) {
        labels.set(text, (labels.get(text) ?? 0) + 1);
      }
    }
    for (const [text, count] of labels) {
      if (count >= 2) {
        violations.push({
          screen,
          id: "duplicate-label",
          severity: "high",
          description: `The literal label "${text}" appears ${count}× in one sibling block — duplicated nav/tab/chip text.`,
        });
      }
    }
  }

  // Planned-but-unmounted: manifest components that never appear in the JSX.
  if (plan) {
    const mounts = countComponentMounts(code);
    for (const region of plan.regions) {
      for (const slot of region.componentTypes) {
        if (!mounts.has(slot.name) && slot.taxonomy !== "primitive") {
          violations.push({
            screen,
            id: "unmounted-component",
            severity: "medium",
            description: `Planned component "${slot.name}" (${slot.taxonomy}) is never mounted in the screen.`,
          });
        }
      }
    }
  }

  return violations;
}

/** Chrome-ish components that must never repeat in a sibling block. */
function isChromeComponent(name: string): boolean {
  return !/\b(Row|Item|Cell|Tile|Card|Entry|Row|Line|TabContent|Dialog|Sheet)\b/.test(name);
}

/**
 * Empty/placeholder-section detector: a filled container (bg-*, h-*, min-h-*,
 * border-*) with no text content and no mounted component inside it is an
 * unlabeled empty bar/box — the "empty grey box" defect. Self-closing filled
 * elements count too (a `h-24 bg-muted` div with no children is an empty
 * box). Deliberate `data-mount` wrappers from the prop auto-fixer are
 * exempt — they are marked, not placeholder.
 */
export function auditEmptySections(code: string, plan: ScreenPlan | null): CompositionViolation[] {
  const violations: CompositionViolation[] = [];
  const screen = plan?.id ?? "?";

  const filledAttrs = (attrs: string): boolean => /(?:bg-[a-z]+|bg-\[\S+\]|border\b|h-1[0-9]|h-2[0-9]|min-h-|p-[0-9]|px-[0-9]|py-[0-9])/.test(attrs);

  const blockRe = /<(\w+)\s+([^>]*?)\s*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(code))) {
    const attrs = m[2];
    const inner = m[3];
    if (!filledAttrs(attrs)) continue;
    if (/data-mount=/.test(attrs)) continue;
    const hasText = />[^<>{}\s][^<>]*</.test(inner) || collectJsxTextNodes(inner).length > 0;
    const hasMount = /<[A-Z][\w$]*\b/.test(inner);
    if (!hasText && !hasMount && inner.trim() !== "") {
      violations.push({
        screen,
        id: "empty-section",
        severity: "high",
        description: `Filled container <${m[1]}> has no text and no mounted component — an empty/unlabeled placeholder section.`,
      });
    } else if (!hasText && !hasMount && inner.trim() === "" && /min-h-|h-1[0-9]|h-2[0-9]/.test(attrs)) {
      violations.push({
        screen,
        id: "empty-section",
        severity: "medium",
        description: `Container <${m[1]}> has a fixed height but no content — likely a blank spacer box.`,
      });
    }
  }

  const selfRe = /<(\w+)\s+([^>]*?)\s*\/>/g;
  let sm: RegExpExecArray | null;
  while ((sm = selfRe.exec(code))) {
    const attrs = sm[2];
    if (/data-mount=/.test(attrs)) continue;
    // A self-closing element with a fill + a size is an empty box; icons
    // (size classes but no fill) are content and stay legal.
    const hasFill = /(?:bg-[a-z]+|bg-\[\S+\]|border\b)/.test(attrs);
    const hasSize = /(?:h-1[0-9]|h-2[0-9]|min-h-|size-\d|w-full)/.test(attrs);
    if (hasFill && hasSize) {
      violations.push({
        screen,
        id: "empty-section",
        severity: "high",
        description: `Self-closing <${sm[1]}> is a filled empty box with no content — an unlabeled placeholder section.`,
      });
    }
  }
  return violations;
}

export function runCompositionGate(
  screens: Record<string, string>,
  plans: ScreenPlan[],
): CompositionGateResult {
  const violations: CompositionViolation[] = [];
  const byId = new Map(plans.map((p) => [p.id, p]));
  for (const [id, code] of Object.entries(screens)) {
    const plan = byId.get(id) ?? null;
    violations.push(...auditScreenComposition(code, plan));
    violations.push(...auditEmptySections(code, plan));
  }
  const blocking = violations.filter((v) => v.severity === "high");
  return { passed: blocking.length === 0, violations };
}

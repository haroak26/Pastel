import type { GateIssue } from "./audit";
import type { WireframePlan, ComponentInventory } from "../schemas";
import { SHELL_PRIMITIVES, NAV_CHROME } from "../lib/genome";

/**
 * V14 review — deterministic screen-composition audits that feed the gate
 * AND the next-gen review model (agents/review.ts).
 *
 * The gate's ground truth for "spacing" is the DOM-geometry audit
 * (checks/geometry.ts — rhythm, flush, overflow, overlaps). The ground truth
 * for "components" is here: every component the inventory says a screen
 * uses must be mounted exactly once, and no screen may render the same
 * component twice (the duplicate-component defect the vision review also
 * hunts for in the render).
 */

/** Audit the composed screens against the wireframe + inventory. */
export function auditScreenComposition(
  wireframe: WireframePlan,
  inventory: ComponentInventory,
): GateIssue[] {
  const issues: GateIssue[] = [];

  for (const screen of wireframe.screens) {
    // V21: `component` on ANY block is a mount (the wireframe hints
    // components behind stats/chart/detail blocks, not only custom blocks).
    const mounts = screen.blocks.filter((b) => b.component);
    const seen = new Map<string, number>();
    for (const b of mounts) {
      const name = b.component!;
      seen.set(name, (seen.get(name) ?? 0) + 1);
    }
    for (const [name, count] of seen) {
      if (count > 1) {
        issues.push({
          file: `src/screens/${screen.id}.jsx`,
          severity: "high",
          category: "composition",
          description: `Component "${name}" planned ${count}x on ${screen.id} — every inventory component renders exactly once per screen (identical sections read as a template).`,
        });
      }
    }

    // Defense in depth: an inventory component listed for a screen must be
    // mounted by a block there (the mount contract enforces this at
    // wireframe time; this catches anything that slipped through).
    // V24: shell primitives and nav chrome are exempt — they are mounted by
    // the deterministic shell wrapper (NavAdapter) or the body, never by a
    // wireframe block, so they cannot be "planned but unmounted".
    const mounted = new Set(mounts.map((b) => b.component));
    for (const c of inventory.components) {
      if (SHELL_PRIMITIVES.has(c.name) || NAV_CHROME.has(c.name)) continue;
      if (c.usedBy.includes(screen.id) && !mounted.has(c.name)) {
        issues.push({
          file: `src/screens/${screen.id}.jsx`,
          severity: "medium",
          category: "composition",
          description: `Component "${c.name}" is planned for ${screen.id} but no block mounts it — the screen will miss it.`,
        });
      }
    }
  }

  return issues;
}

/** Compact prompt block for the review model — what it must verify on the
 * render (spacing / missing components / duplicates / flow / mode). */
export function reviewV14Checklist(): string {
  return [
    "SPACING: density and whitespace must follow the layout law — sections alternate rhythm steps, nothing is flush, no cramped or stretched sections, alignment on the 8px grid.",
    "MISSING COMPONENTS: every component the screen mounts must be visibly present in the render. A component the wireframe plans but the screenshot does not show is a defect.",
    "DUPLICATED COMPONENTS: two visually identical sections on one screen are a defect (the same component/block rendered twice reads as a template).",
    "FLOW: the screen must read top-to-bottom as the briefed workflow — dominant moment first at hero scale, sections in the wireframe's order, one clear primary action, secondary actions quiet, and the screen must look like THIS product's purpose (not a marketplace unless it is one).",
    "MODE FIDELITY (V15): the screen's shape must match the brief's MODE — a track/create/operate/learn product must not inherit a browse/marketplace structure (search hero, catalog grid, gallery-led detail, price/dates/guests booking card, 'Verified host', 'Guest reviews'), and a browse product must not look like a SaaS dashboard. Booking language is ONLY legal for transact/stay products.",
  ].join("\n");
}

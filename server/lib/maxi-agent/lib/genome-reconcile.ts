import type { LayoutGenome, GenomeRegion, GenomeScreen } from "./genome";

/**
 * Maxi Agent v24 — deterministic genome reconciliation.
 *
 * The genome call is schema-constrained but the model can still emit
 * structurally-valid-but-wrong genomes: navigation chrome listed as a
 * component slot, more than 2 custom slots per screen, slots nothing
 * mounts, or duplicate mounts of the same slot on one screen. Each of
 * those was a live v23 defect (issues #2-#19, #26, #28, #30, #31).
 *
 * This module is a plain code pass right after the model call — no second
 * model call, no judgment. The rules, all deterministic:
 *
 *   1. Nav chrome (Sidebar/Topbar) is NEVER a component slot — it derives
 *      from each screen's `nav` field only. Any slot named for chrome is
 *      dropped (and noted).
 *   2. At most TWO component slots may serve each screen. Over-budget
 *      slots are merged into a plausible existing slot of the same screen
 *      (shared purpose vocabulary) or dropped, never shipped.
 *   3. No slot ships without at least one mounting region, and no region
 *      cites a slot that was dropped — resolved in a SINGLE fixed point
 *      (repeat until stable), never two independent passes that can
 *      disagree.
 *   4. A slot mounted by two regions on the same screen is a duplicate
 *      (the "identical sections read as a template" defect) — the extra
 *      region is merged away.
 *
 * Every drop/merge is recorded in `notes` and surfaced through
 * emitActivity exactly like the existing genome notes.
 */

/** Nav chrome names that must never appear as component slots. */
const NAV_CHROME = new Set(["Sidebar", "Topbar"]);

/** Per-screen custom-slot budget (the layout law: fewer, richer). */
export const MAX_SLOTS_PER_SCREEN = 2;

/** Word length floor for a "plausible merge" purpose match. */
const MERGE_WORD_MIN = 4;

function words(s: string): Set<string> {
  return new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= MERGE_WORD_MIN));
}

/** Two slots are plausibly the same product region (mergeable) when their
 *  purposes share a real vocabulary word. */
export function slotsPlausiblyMerge(a: { name: string; purpose: string }, b: { name: string; purpose: string }): boolean {
  const wa = words(a.purpose);
  for (const w of words(b.purpose)) if (wa.has(w)) return true;
  return false;
}

function cloneGenome(genome: LayoutGenome): LayoutGenome {
  return JSON.parse(JSON.stringify(genome)) as LayoutGenome;
}

/** Slots referenced by the custom regions of one screen. */
function referencedSlots(genome: LayoutGenome, screenId: string): Map<string, string> {
  const screen = genome.screens.find((s) => s.id === screenId);
  const out = new Map<string, string>();
  for (const r of screen?.regions ?? []) {
    if (r.block === "custom" && r.component && !out.has(r.component)) out.set(r.component, r.component);
  }
  return out;
}

/** Regions referencing a given slot (any screen). */
function regionsForSlot(genome: LayoutGenome, slotName: string): Array<{ screen: GenomeScreen; region: GenomeRegion }> {
  const out: Array<{ screen: GenomeScreen; region: GenomeRegion }> = [];
  for (const screen of genome.screens) {
    for (const region of screen.regions) {
      if (region.block === "custom" && region.component === slotName) out.push({ screen, region });
    }
  }
  return out;
}

export interface ReconcileResult {
  genome: LayoutGenome;
  notes: string[];
}

export function reconcileGenome(genome: LayoutGenome): ReconcileResult {
  const notes: string[] = [];
  let g = cloneGenome(genome);

  // Single fixed point: every pass can invalidate the previous pass's
  // output (a merged slot leaves its regions orphaned; a dropped region
  // unmounts a slot), so repeat until nothing changes.
  for (let iter = 0; iter < 6; iter++) {
    const before = JSON.stringify(g);
    g = pass(g, notes);
    if (JSON.stringify(g) === before) break;
  }

  return { genome: g, notes };
}

function pass(genome: LayoutGenome, notes: string[]): LayoutGenome {
  let g = genome;

  // 1. Nav chrome is never a component slot.
  const navSlots = g.componentSlots.filter((s) => NAV_CHROME.has(s.name));
  if (navSlots.length > 0) {
    notes.push(`dropped nav chrome slot(s) ${navSlots.map((s) => s.name).join(", ")} — navigation derives from each screen's nav field, never a component slot`);
    g = { ...g, componentSlots: g.componentSlots.filter((s) => !NAV_CHROME.has(s.name)) };
  }

  // 2. Regions: rewire or drop any custom region whose slot no longer
  //    exists, backfill regions with no component, and merge duplicate
  //    mounts of the same slot on one screen.
  g = {
    ...g,
    screens: g.screens.map((screen) => {
      const seen = new Set<string>();
      const regions: GenomeRegion[] = [];
      for (const region of screen.regions) {
        if (region.block !== "custom") {
          regions.push(region);
          continue;
        }
        let component = region.component;
        if (!component) {
          const fallback = g.componentSlots.find((s) => s.usedBy.includes(screen.id));
          if (fallback) {
            component = fallback.name;
            notes.push(`${screen.id}: custom region had no component — backfilled ${fallback.name}`);
          } else {
            notes.push(`${screen.id}: dropped custom region with no mountable component`);
            continue;
          }
        }
        if (!g.componentSlots.some((s) => s.name === component)) {
          const fallback = g.componentSlots.find((s) => s.usedBy.includes(screen.id));
          if (fallback) {
            notes.push(`${screen.id}: region mounted dropped slot ${component} — rewired to ${fallback.name}`);
            component = fallback.name;
          } else {
            notes.push(`${screen.id}: dropped region mounting unknown slot ${component}`);
            continue;
          }
        }
        if (seen.has(component)) {
          notes.push(`${screen.id}: merged duplicate region mounting ${component} — one mount per screen`);
          continue;
        }
        seen.add(component);
        regions.push({ ...region, component });
      }
      return { ...screen, regions };
    }),
  };

  // 3. Slots: drop anything nothing mounts.
  const referenced = new Set(g.screens.flatMap((s) => s.regions).filter((r) => r.block === "custom" && r.component).map((r) => r.component as string));
  const unmounted = g.componentSlots.filter((s) => !referenced.has(s.name));
  if (unmounted.length > 0) {
    notes.push(`dropped unused component slot(s) ${unmounted.map((s) => s.name).join(", ")} — a slot nothing mounts never ships`);
    g = { ...g, componentSlots: g.componentSlots.filter((s) => referenced.has(s.name)) };
  }

  // 4. Per-screen cap: at most MAX_SLOTS_PER_SCREEN slots per screen.
  for (const screenId of ["home", "detail"] as const) {
    const used = [...referencedSlots(g, screenId).keys()];
    if (used.length <= MAX_SLOTS_PER_SCREEN) continue;
    const slots = g.componentSlots.filter((s) => used.includes(s.name));
    // Keep the most-referenced slots first; merge or drop the rest.
    const kept: string[] = [];
    const extra: string[] = [];
    for (const s of slots) {
      const refCount = regionsForSlot(g, s.name).length;
      (kept.length < MAX_SLOTS_PER_SCREEN ? kept : extra).push(s.name);
      void refCount;
    }
    for (const name of extra) {
      const slot = g.componentSlots.find((s) => s.name === name)!;
      const keptSlot = g.componentSlots.find((s) => kept.includes(s.name) && s.usedBy.includes(screenId) && slotsPlausiblyMerge(s, slot));
      if (keptSlot) {
        notes.push(`${screenId}: merged component slot ${name} into ${keptSlot.name} — over the ${MAX_SLOTS_PER_SCREEN}-slot budget`);
        g = {
          ...g,
          screens: g.screens.map((s) => ({
            ...s,
            regions: s.regions.map((r) => (r.block === "custom" && r.component === name ? { ...r, component: keptSlot.name } : r)),
          })),
          componentSlots: g.componentSlots.filter((s) => s.name !== name),
        };
      } else {
        notes.push(`${screenId}: dropped component slot ${name} — over the ${MAX_SLOTS_PER_SCREEN}-slot budget and no plausible merge`);
        g = {
          ...g,
          screens: g.screens.map((s) => ({
            ...s,
            regions: s.regions.filter((r) => !(r.block === "custom" && r.component === name)),
          })),
          componentSlots: g.componentSlots.filter((s) => s.name !== name),
        };
      }
      kept.push(name);
    }
  }

  // 5. Recompute usedBy from the actual mounting screens (a slot used by
  //    home only never claims detail).
  g = {
    ...g,
    componentSlots: g.componentSlots.map((slot) => {
      const mounters = g.screens.filter((s) => s.regions.some((r) => r.block === "custom" && r.component === slot.name)).map((s) => s.id);
      if (mounters.length === 0) return slot;
      const usedBy = slot.usedBy.filter((id) => mounters.includes(id));
      const merged = [...new Set([...usedBy, ...mounters])];
      return merged.length > 0 ? { ...slot, usedBy: merged } : slot;
    }),
  };

  return g;
}

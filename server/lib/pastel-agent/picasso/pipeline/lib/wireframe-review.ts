import type { LayoutPlan, ComponentsManifest, Tokens } from "../types";

/**
 * V8 wireframe confirmation gate (§4.4) — the hard blocking checkpoint
 * between architecture and any component/screen build work. The payload is
 * built from the SAME layoutSignature-style data the harness already writes
 * to run-summary.json (regions + planned component slots + dominant moment);
 * nothing new is invented here, and rendering it costs zero model calls.
 */

export interface WireframeReviewSlot {
  name: string;
  taxonomy: string;
  description: string;
}

export interface WireframeReviewRegion {
  name: string;
  role: string;
  hierarchy: string;
  purpose: string;
  components: WireframeReviewSlot[];
}

export interface WireframeReviewScreen {
  id: string;
  name: string;
  route: string;
  dominantMoment: string;
  regions: WireframeReviewRegion[];
}

export interface WireframeReviewPayload {
  phase: "wireframe-review";
  screens: WireframeReviewScreen[];
  accent: string;
  radius: string;
  seed: string;
  revisionsUsed: number;
}

export type WireframeDecision =
  | { action: "approve" }
  | { action: "revise"; notes: Record<string, string> }
  | { action: "cancel" };

/** Build the review payload from the finished architecture — static data,
 *  rendered in seconds, no model call. */
export function buildWireframeReview(
  layoutPlan: LayoutPlan,
  componentsManifest: ComponentsManifest,
  tokens: Tokens,
  creativeSeed: string,
  revisionsUsed = 0,
): WireframeReviewPayload {
  const slotTaxonomy = new Map(componentsManifest.entries.map((e) => [e.id, e.taxonomy]));
  return {
    phase: "wireframe-review",
    screens: layoutPlan.screens.map((s) => ({
      id: s.id,
      name: s.name,
      route: s.route,
      dominantMoment: s.dominantMoment,
      regions: s.regions.map((r) => ({
        name: r.name,
        role: r.role,
        hierarchy: r.hierarchy,
        purpose: r.purpose,
        components: r.componentTypes.map((c) => ({
          name: c.name,
          taxonomy: slotTaxonomy.get(c.name) ?? c.taxonomy,
          description: c.description,
        })),
      })),
    })),
    accent: tokens.color?.accent?.["500"] ?? "unknown",
    radius: tokens.radius?.lg ?? "unknown",
    seed: creativeSeed,
    revisionsUsed,
  };
}

/** One-line signature for logs/activity (mirrors run-summary's shape). */
export function wireframeReviewSignature(payload: WireframeReviewPayload): string {
  return payload.screens
    .map((s) => `${s.id}: ${s.regions.map((r) => `${r.role}:${r.hierarchy}:${r.components.map((c) => c.name).join("+")}`).join(" | ")}`)
    .join(" · ");
}

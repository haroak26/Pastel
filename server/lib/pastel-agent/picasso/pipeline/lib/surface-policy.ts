import type { Tokens, Brief } from "../types";
import type { ProductContext } from "../anti-slop";
import { hexToRgb, relativeLuminance } from "./base-components";

/**
 * V8 surface policy — the "no tinted page background for software products"
 * rule (§6 of the v8 brief). The sibling Pastel Agent pipeline classifies
 * product contexts (app/workspace/dashboard/utility vs lifestyle/editorial/
 * consumer-brand); this module ports that distinction into a surface policy:
 *
 * - "neutral" (app / workspace / dashboard / utility / software product):
 *   background and card surfaces MUST stay true near-white/near-grey — no
 *   hint of the accent's temperature. The accent is confined to controls,
 *   CTAs, selected states, and chart series — never the page canvas.
 * - "warm" (lifestyle / editorial / consumer brand): the accent-tinted
 *   neutral scale remains available as a deliberate choice.
 */

export type SurfacePolicy = "neutral" | "warm";

/** Keywords that mark a brief as lifestyle/editorial/consumer-brand. */
const WARM_KEYWORDS: Array<[string, RegExp]> = [
  ["lifestyle", /lifestyle|wellness|self[- ]care|mindfulness|fashion|beauty|skincare|cosmetic|fragrance/],
  ["editorial", /editorial|magazine|journal|zine|newsletter|publishing|storytelling|feature article/],
  ["consumer-brand", /brand|artisan|handmade|boutique|restaurant|caf[eé]|food|coffee|baking|cookbook|hospitality|hotel|resort|travel experience|gift shop/],
  ["media", /music|podcast|streaming|video|photography|art gallery|exhibition|designer furniture|home decor/],
];

/** Keywords that force a neutral canvas even when marketing-ish copy appears. */
const NEUTRAL_KEYWORDS = [
  /app|workspace|dashboard|admin|console|utility|tool|software|saas|b2b|crm|erp|dev|engineering|analytics|metrics|tracker|planner|inbox|ledger|accounting|finance|bank|budget/,
];

export function classifySurfacePolicy(
  productContext: ProductContext,
  description: string,
  contextDescription: string,
): SurfacePolicy {
  const text = `${description} ${contextDescription}`.toLowerCase();
  // Software-product signals win over surface-level lifestyle words.
  if (NEUTRAL_KEYWORDS.some((re) => re.test(text))) return "neutral";
  if (WARM_KEYWORDS.some(([, re]) => re.test(text))) return "warm";
  // Landing/docs/social without brand signals stay neutral by default.
  return "neutral";
}

/** Prompt block injected into the tokens call, gating the warm-tint law. */
export function surfacePolicyPrompt(policy: SurfacePolicy): string {
  if (policy === "warm") {
    return `## SURFACE POLICY — WARM CANVAS
- The neutral scale may carry a hint of the accent's temperature (warm/cool tint) — this is a lifestyle/editorial/consumer-brand product and a tinted canvas is a deliberate choice.
- surface.background may be an off-white with a subtle accent temperature (e.g. #FAF7F3) — never a saturated wash.`;
  }
  return `## SURFACE POLICY — NEUTRAL CANVAS (HARD RULE)
- The neutral scale MUST be true near-neutral grey — NO hint of the accent's temperature. Pure grey (equal RGB channels) is correct here.
- surface.background MUST be near-white/near-grey (e.g. #FFFFFF / #FAFAFA / #F8F8F8) with zero accent tint, regardless of accent colour.
- The accent is confined to controls, CTAs, selected states, focus rings, and chart series — NEVER the page canvas, NEVER card/panel surfaces.
- border.default / border.subtle stay neutral grey hairlines — never accent-tinted, never so light they are invisible on the background.`;
}

/** Chroma = channel spread (0 = pure grey). */
function chroma(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function greyOfSameLuminance(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  // Perceptual-ish luminance in sRGB channel space — a neutral grey that
  // keeps the same visual weight.
  const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const v = Math.min(255, Math.max(0, y));
  return `#${[v, v, v].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

const NEUTRAL_CHROMA_LIMIT = 6;

/**
 * Deterministic enforcement (not just a prompt instruction): for neutral
 * policies, the neutral scale, surfaces and borders are grey-washed and the
 * background is pinned to the near-white end of the (now grey) scale.
 */
export function enforceNeutralSurfaces(tokens: Tokens, policy: SurfacePolicy): Tokens {
  if (policy !== "neutral") return tokens;

  const out: Tokens = structuredClone(tokens);
  const neutral = out.color.neutral as Record<string, string>;
  for (const key of Object.keys(neutral)) {
    if (chroma(neutral[key]) > NEUTRAL_CHROMA_LIMIT) {
      neutral[key] = greyOfSameLuminance(neutral[key]);
    }
  }

  const surfaces: Array<[keyof typeof out.color.surface, string]> = [
    ["background", out.color.surface.background],
    ["raised", out.color.surface.raised],
    ["overlay", out.color.surface.overlay],
  ];
  for (const [key, value] of surfaces) {
    if (/^#[0-9a-fA-F]{6}$/.test(value) && chroma(value) > NEUTRAL_CHROMA_LIMIT) {
      out.color.surface[key] = greyOfSameLuminance(value);
    }
  }

  const border: Array<[keyof typeof out.color.border, string]> = [
    ["default", out.color.border.default],
    ["subtle", out.color.border.subtle],
    ["focus", out.color.border.focus],
  ];
  for (const [key, value] of border) {
    if (/^#[0-9a-fA-F]{6}$/.test(value) && chroma(value) > NEUTRAL_CHROMA_LIMIT) {
      out.color.border[key] = greyOfSameLuminance(value);
    }
  }

  // Pin the page background near-white when it still carries tint.
  const bg = out.color.surface.background;
  if (/^#[0-9a-fA-F]{6}$/.test(bg) && (chroma(bg) > NEUTRAL_CHROMA_LIMIT || relativeLuminance(bg) < 0.82)) {
    out.color.surface.background = "#fafafa";
    // Keep cards/raised slightly distinct but still neutral.
    if (out.color.surface.raised === bg) out.color.surface.raised = "#ffffff";
  }
  return out;
}

// ── Static gate (zero-cost, deterministic) ──────────────────────────────

export interface NeutralCanvasGateResult {
  passed: boolean;
  policy: SurfacePolicy;
  violations: string[];
}

/**
 * The §6 static check: for non-lifestyle contexts, the page background (and
 * card surface) must sit inside the near-neutral range — chroma ≤ 6 and
 * near-white luminance in light mode. Out of range → the run fails loudly,
 * the same way WCAG contrast is enforced elsewhere in this codebase.
 */
export function assertNeutralCanvas(tokens: Tokens, policy: SurfacePolicy): NeutralCanvasGateResult {
  if (policy === "warm") return { passed: true, policy, violations: [] };

  const violations: string[] = [];
  const mode = tokens.meta?.mode ?? "light";
  const bg = tokens.color.surface.background;
  const raised = tokens.color.surface.raised;

  if (/^#[0-9a-fA-F]{6}$/.test(bg)) {
    const c = chroma(bg);
    if (c > NEUTRAL_CHROMA_LIMIT) {
      violations.push(`Page background ${bg} is accent-tinted (chroma ${c} > ${NEUTRAL_CHROMA_LIMIT}) in a neutral-surface context — background must be near-neutral grey/white.`);
    }
    const lum = relativeLuminance(bg);
    if (mode !== "dark" && lum < 0.82) {
      violations.push(`Page background ${bg} is not near-white (luminance ${lum.toFixed(2)} < 0.82) — software products need a clean near-white canvas.`);
    }
  }
  if (/^#[0-9a-fA-F]{6}$/.test(raised)) {
    const c = chroma(raised);
    if (c > NEUTRAL_CHROMA_LIMIT) {
      violations.push(`Card surface ${raised} is accent-tinted (chroma ${c} > ${NEUTRAL_CHROMA_LIMIT}) in a neutral-surface context.`);
    }
  }

  // Input/border visibility: a border at (or near) the background's own
  // colour reads as "no input box at all" (the v7 `base-input.png` defect).
  const border = tokens.color.border.default;
  if (/^#[0-9a-fA-F]{6}$/.test(border) && /^#[0-9a-fA-F]{6}$/.test(bg)) {
    const ratio = contrastRatio(border, bg);
    if (ratio < 1.08) {
      violations.push(`Border ${border} is effectively invisible on background ${bg} (contrast ${ratio.toFixed(2)}:1) — inputs and fields will not read as present.`);
    }
  }
  return { passed: violations.length === 0, policy, violations };
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Convenience for callers that already built the policy from a brief. */
export function surfacePolicyForBrief(brief: Brief, productContext: ProductContext, contextDescription: string): SurfacePolicy {
  return classifySurfacePolicy(productContext, brief.description, contextDescription);
}

import type { RubricScores, RubricDimension, CritiqueResult, RouteTarget } from "./types";

/**
 * Visual critique rubric — scores every screenshot 1–10 on 10 dimensions.
 * 
 * Pass rule: average >= 8.0 AND no single dimension < 6.
 * On fail: structured JSON routes back to the narrowest fix.
 */

export const RUBRIC_DIMENSIONS: { key: RubricDimension; label: string; description: string; weight: number }[] = [
  {
    key: "hierarchy",
    label: "Hierarchy & focus",
    description: "Is there exactly one clear primary action or focal point? Everything else visually subordinate through size, weight, and color.",
    weight: 1.0,
  },
  {
    key: "tokenFidelity",
    label: "Token fidelity",
    description: "Does every visible color, size, radius, and spacing trace to tokens.json? No raw hex values, no ad-hoc pixel values.",
    weight: 1.0,
  },
  {
    key: "gridAlignment",
    label: "Grid & alignment",
    description: "Is everything on a consistent column grid with matching gutters across the project? Content aligned to grid, not eyeballed.",
    weight: 1.0,
  },
  {
    key: "spacingRhythm",
    label: "Spacing rhythm & whitespace",
    description: "Does the spacing follow a consistent scale (4px base)? Generous but intentional whitespace, no floating orphans.",
    weight: 1.0,
  },
  {
    key: "colorRestraint",
    label: "Color restraint & contrast",
    description: "One accent used with intent. Neutrals carry the UI. WCAG AA contrast met. No competing accent colors.",
    weight: 1.0,
  },
  {
    key: "typographicRhythm",
    label: "Typographic rhythm",
    description: "Consistent modular type scale, line-height, and weight usage. Body text >= 16px. No more than 4 weights in play.",
    weight: 1.0,
  },
  {
    key: "componentConsistency",
    label: "Component consistency",
    description: "Same button, card, input, badge styling used everywhere it should be. No one-off visual variations.",
    weight: 1.0,
  },
  {
    key: "accessibilityBaseline",
    label: "Accessibility baseline",
    description: "States defined (hover, focus, active, disabled, loading). Visible focus rings. Semantic HTML. Labeled inputs.",
    weight: 1.0,
  },
  {
    key: "brandFit",
    label: "Brand & niche fit",
    description: "Does it feel right for the stated product, audience, and selected brand references? Not generic, not off-brand.",
    weight: 1.0,
  },
  {
    key: "overallPolish",
    label: "Overall polish / would-ship",
    description: "Would a design lead approve this? Penalize over-design as much as under-design. Restraint is a feature.",
    weight: 1.0,
  },
];

export function scorePasses(scores: RubricScores): boolean {
  const values = Object.values(scores) as number[];
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const minScore = Math.min(...values);
  return average >= 8.0 && minScore >= 6;
}

export function buildCritiqueResult(
  scores: RubricScores,
  diagnosis: string,
  routeTo: RouteTarget | null,
  affectedIds: string[],
): CritiqueResult {
  const values = Object.values(scores) as number[];
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const failingDimensions = RUBRIC_DIMENSIONS
    .filter((d) => scores[d.key] < 6)
    .map((d) => d.key);

  return {
    scores,
    average: Math.round(average * 10) / 10,
    passed: average >= 8.0 && failingDimensions.length === 0,
    failingDimensions,
    diagnosis,
    routeTo: failingDimensions.length > 0 ? routeTo : null,
    affectedIds,
  };
}

/**
 * Routing logic for critique failures:
 * - tokenFidelity / colorRestraint / typographicRhythm → back to stage 2 (tokens)
 *   OR stage 4 (specific component files) if tokens are fine but components ignored them.
 * - hierarchy / gridAlignment / spacingRhythm → stage 3 (layout plan)
 * - componentConsistency / accessibilityBaseline → stage 4 (specific components)
 * - brandFit / overallPolish → route based on diagnosis's root cause.
 */
export function determineRoute(
  failingDimensions: RubricDimension[],
  diagnosis: string,
): { routeTo: RouteTarget | null; shouldRegenTokens: boolean; shouldRegenLayout: boolean; affectedComponents: string[] } {
  const tokensDimensions: RubricDimension[] = ["tokenFidelity", "colorRestraint", "typographicRhythm"];
  const layoutDimensions: RubricDimension[] = ["hierarchy", "gridAlignment", "spacingRhythm"];
  const componentDimensions: RubricDimension[] = ["componentConsistency", "accessibilityBaseline"];

  let routeTo: RouteTarget | null = null;
  let shouldRegenTokens = false;
  let shouldRegenLayout = false;
  let affectedComponents: string[] = [];

  const hasTokens = failingDimensions.some((d) => tokensDimensions.includes(d));
  const hasLayout = failingDimensions.some((d) => layoutDimensions.includes(d));
  const hasComponents = failingDimensions.some((d) => componentDimensions.includes(d));

  // Prefer the narrowest fix
  if (hasTokens) {
    if (diagnosis.toLowerCase().includes("token") || diagnosis.toLowerCase().includes("palette")) {
      shouldRegenTokens = true;
      routeTo = "tokens";
    } else {
      routeTo = "components";
      affectedComponents = extractAffectedIds(diagnosis);
    }
  }

  if (hasLayout && !routeTo) {
    shouldRegenLayout = true;
    routeTo = "layout";
  }

  if (hasComponents && !routeTo) {
    routeTo = "components";
    affectedComponents = extractAffectedIds(diagnosis);
  }

  // brandFit / overallPolish → read diagnosis
  if (!routeTo) {
    const diag = diagnosis.toLowerCase();
    // Render/pipeline failures that produced no visual UI at all
    if (diag.includes("render") || diag.includes("source code") || diag.includes("compil")
        || diag.includes("plain text") || diag.includes("not rendered")
        || diag.includes("catalog screen") || diag.includes("cannot be evaluated")) {
      routeTo = "components";
      affectedComponents = extractAffectedIds(diagnosis);
    } else if (diag.includes("layout") || diag.includes("grid")) {
      routeTo = "layout";
      shouldRegenLayout = true;
    } else if (diag.includes("component") || diag.includes("style") || diag.includes("styling")) {
      routeTo = "components";
      affectedComponents = extractAffectedIds(diagnosis);
    } else {
      routeTo = "components";
    }
  }

  return { routeTo, shouldRegenTokens, shouldRegenLayout, affectedComponents };
}

function extractAffectedIds(diagnosis: string): string[] {
  const ids: string[] = [];
  // Look for component names in quotes or backticks
  const quoted = diagnosis.match(/["'`]([^"'`]+)["'`]/g);
  if (quoted) {
    for (const q of quoted) {
      ids.push(q.replace(/["'`]/g, ""));
    }
  }
  // Also look for kebab-case identifiers
  const kebab = diagnosis.match(/\b([a-z]+(?:-[a-z]+)+)\b/g);
  if (kebab && ids.length === 0) {
    for (const k of kebab) {
      if (["token-fidelity", "color-restraint", "high-contrast"].includes(k)) continue;
      ids.push(k);
    }
  }
  return [...new Set(ids)];
}

/** System prompt addition for the critique call — scoring instructions. */
export function critiqueSystemPrompt(): string {
  return `You are a visual design critic scoring UI screenshots against an explicit 10-dimension rubric.

Score each dimension 1–10 (1 = critically broken, 5 = meh, 8 = good enough to ship, 10 = exceptional).

Dimensions:
1. **hierarchy** — One clear primary action/focal point. Everything else subordinate.
2. **tokenFidelity** — Every visible style traces to design tokens (CSS vars), no raw hex/px.
3. **gridAlignment** — Content on consistent column grid, matching gutters.
4. **spacingRhythm** — Spacing follows 4px base scale, whitespace is intentional.
5. **colorRestraint** — One accent, neutrals carry UI, WCAG AA contrast met.
6. **typographicRhythm** — Consistent scale, line-height, weight. Body >= 16px.
7. **componentConsistency** — Same styling used everywhere it should be.
8. **accessibilityBaseline** — States defined, focus rings visible, semantic HTML.
9. **brandFit** — Feels right for the stated product/audience/brand reference.
10. **overallPolish** — Would a design lead ship this? Penalize over-design too.

Return ONLY valid JSON:
{
  "scores": { "hierarchy": N, "tokenFidelity": N, ...all 10 },
  "diagnosis": "brief explanation of what failed and why",
  "affectedIds": ["component-name-or-screen-id"]
}

The "diagnosis" should clearly state whether the root cause is in the tokens themselves, the layout plan, or individual components. This determines the routing for the fix loop.`;
}

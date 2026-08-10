import type { RubricScores, RubricDimension, CritiqueResult, RouteTarget } from "./types";

/**
 * Picasso V2 Visual Critique Rubric
 *
 * 10 dimensions, weighted average scoring (0-10).
 * 
 * Pass rule: weighted average >= 7.0 AND no blocking defects.
 * Hard fail: any blocking defect = score 0, screen rejected.
 *
 * This replaces the V1 ad-hoc rubric. V2 rubric maps directly to
 * the spec's Visual QA system with weighted categories.
 */

// ─── Rubric Dimensions (V2 — Weighted) ─────────────────────────────────────

export interface RubricDimensionV2 {
  key: RubricDimension;
  label: string;
  description: string;
  weight: number; // proportion of total score (sum = 1.0)
  blockingDefects?: string[]; // descriptions of what would cause this dimension to auto-fail
}

export const RUBRIC_DIMENSIONS_V2: RubricDimensionV2[] = [
  {
    key: "productContext",
    label: "Product Context Fidelity",
    description:
      "Does the screen feel like the right product type (app, landing, docs)? App screens: no marketing hero, no footer. Landing: hero + CTA flow + social proof. Docs: search + content grid.",
    weight: 0.15,
    blockingDefects: [
      "Centered hero on app screen",
      "Footer on app screen",
      "Marketing CTA on app screen",
      "Tabbar on desktop app screen",
    ],
  },
  {
    key: "brandCoherence",
    label: "Brand Coherence",
    description:
      "Are brand tokens consistently used across all screens? Same accent color, typography pairing, spacing scale? No Tailwind blue, indigo, or generic defaults.",
    weight: 0.15,
    blockingDefects: [
      "Tailwind blue/indigo/purple accent (#3B82F6, #4F46E5, #A78BFA)",
      "Mismatched fonts across screens",
      "Multiple accent colors in same project",
    ],
  },
  {
    key: "hierarchy",
    label: "Visual Hierarchy",
    description:
      "One clear dominant moment per screen? Heading > Subheading > Body > Caption clearly differentiated. No competing elements at same visual weight.",
    weight: 0.15,
    blockingDefects: [
      "No primary action or focal point",
      "All text same size and weight",
      "Competing elements of equal visual weight",
    ],
  },
  {
    key: "composition",
    label: "Composition & Surfaces",
    description:
      "Deliberate surface treatment (card, band, panel, full-bleed)? Sections intentionally varied? Content fills intent (not sparse, not overflowing)?",
    weight: 0.10,
  },
  {
    key: "spacingRhythm",
    label: "Spacing & Rhythm",
    description:
      "Consistent vertical rhythm? All margins/padding on-scale? Sections breathe (no cramped gaps, no excessive whitespace)? Text line-height proportional?",
    weight: 0.10,
  },
  {
    key: "componentConsistency",
    label: "Component Sophistication",
    description:
      "Are components brand-aware (custom colors, custom sizes)? Multiple states visible (hover, focus, active)? No placeholder content? Components feel polished?",
    weight: 0.10,
    blockingDefects: [
      "Placeholder text throughout ('Click here', 'Title', 'Description')",
      "No hover/focus/active states on any interactive elements",
      "Generic, unstyled components that could ship in any product",
    ],
  },
  {
    key: "navigation",
    label: "Navigation & Primary Action",
    description:
      "Navigation strategy matches product mode? Primary action immediately obvious? Secondary actions clearly subordinate? No dead buttons?",
    weight: 0.10,
    blockingDefects: [
      "No primary action on screen",
      "Tabbar on desktop app",
      "Footer as primary navigation on app",
    ],
  },
  {
    key: "contentCopy",
    label: "Content & Copy Quality",
    description:
      "Specific, human copy (no AI-slop)? Copy matches brand tone? No generic phrases? Data is realistic, not sparse?",
    weight: 0.05,
  },
  {
    key: "responsiveDesign",
    label: "Responsive Design",
    description:
      "Layout adapts fluidly from 1440px to 375px? No text overflow, no horizontal scroll? Touch targets >= 44px on mobile?",
    weight: 0.05,
  },
  {
    key: "accessibilityBaseline",
    label: "Accessibility Baseline",
    description:
      "Color contrast >= 4.5:1? Focus rings visible on interactive elements? Semantic HTML? Icons have labels?",
    weight: 0.05,
  },
];

// ─── Blocking Defects (Any ONE = score 0, screen rejected) ─────────────────

export interface BlockingDefect {
  id: string;
  label: string;
  description: string;
  dimension: RubricDimension;
}

export const BLOCKING_DEFECTS: BlockingDefect[] = [
  {
    id: "landing-on-app",
    label: "Landing page composition on app screen",
    description: "Centered hero, full-width hero image, CTA-heavy, marketing copy, footer, social proof carousel on screens that should be app UI",
    dimension: "productContext",
  },
  {
    id: "tabbar-on-desktop",
    label: "Tabbar or footer as primary nav on desktop app screens",
    description: "Desktop apps must use sidebar or topbar, never mobile-style tabbar or footer nav",
    dimension: "navigation",
  },
  {
    id: "generic-tailwind-accent",
    label: "Generic Tailwind accent",
    description: "Using #3B82F6, #4F46E5, #A78BFA, or #6366F1 instead of brand-generated accent from tokens",
    dimension: "brandCoherence",
  },
  {
    id: "blank-screen",
    label: "Completely blank or missing content",
    description: "Screen renders but has no meaningful content — empty hero, no component mount points, tables with zero rows when data exists",
    dimension: "productContext",
  },
  {
    id: "no-primary-action",
    label: "No primary action",
    description: "App screen with no call-to-action button or primary affordance — user can't do anything on the screen",
    dimension: "navigation",
  },
  {
    id: "uncompilable",
    label: "Uncompilable code",
    description: "Syntax errors, missing imports, undefined components, type mismatches — TSC validation fails",
    dimension: "productContext",
  },
];

// ─── Scoring Functions ─────────────────────────────────────────────────────

/** Compute the weighted total score from all 10 dimensions. */
export function computeWeightedScore(scores: RubricScores): number {
  let total = 0;
  for (const dim of RUBRIC_DIMENSIONS_V2) {
    total += (scores[dim.key] ?? 0) * dim.weight;
  }
  return Math.round(total * 10) / 10;
}

/** Check if scores pass the V2 threshold (>= 7.0 weighted average). */
export function scorePassesV2(scores: RubricScores): boolean {
  return computeWeightedScore(scores) >= 7.0;
}

/** Check for any blocking defects in the diagnosis text. */
export function findBlockingDefects(diagnosis: string, scores: RubricScores): BlockingDefect[] {
  const diag = diagnosis.toLowerCase();
  const found: BlockingDefect[] = [];

  for (const defect of BLOCKING_DEFECTS) {
    const label = defect.label.toLowerCase();
    const desc = defect.description.toLowerCase();

    // Check diagnosis text mentions the defect
    if (diag.includes(defect.id) || diag.includes(label.slice(0, 20))) {
      found.push(defect);
    }
  }

  // Also check dimension scores — if a blocking dimension scored 0, it's a blocking defect
  if (scores.productContext <= 1 && !found.some((d) => d.dimension === "productContext")) {
    found.push(BLOCKING_DEFECTS[0]); // landing-on-app
  }
  if (scores.brandCoherence <= 1 && !found.some((d) => d.dimension === "brandCoherence")) {
    found.push(BLOCKING_DEFECTS[2]); // generic-tailwind-accent
  }
  if (scores.navigation <= 1 && !found.some((d) => d.dimension === "navigation")) {
    found.push(BLOCKING_DEFECTS[4]); // no-primary-action
  }

  return found;
}

// ─── Critique Result Builder ───────────────────────────────────────────────

export function buildCritiqueResultV2(
  scores: RubricScores,
  diagnosis: string,
  routeTo: RouteTarget | null,
  affectedIds: string[],
): CritiqueResult {
  const weighted = computeWeightedScore(scores);
  const blockingDefects = findBlockingDefects(diagnosis, scores);
  const hasBlocking = blockingDefects.length > 0;

  if (hasBlocking) {
    // On blocking defect, set all scores to 0 for routing and hard-fail
    return {
      scores: Object.keys(scores).reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as RubricScores),
      average: 0,
      passed: false,
      failingDimensions: RUBRIC_DIMENSIONS_V2.map((d) => d.key),
      diagnosis: `BLOCKING DEFECTS: ${blockingDefects.map((d) => d.label).join("; ")}. ${diagnosis}`,
      routeTo: "components", // blocking defects require component/screen regeneration
      affectedIds,
    };
  }

  const failingDimensions = RUBRIC_DIMENSIONS_V2
    .filter((d) => (scores[d.key] ?? 0) < 6)
    .map((d) => d.key);

  return {
    scores,
    average: weighted,
    passed: weighted >= 7.0 && failingDimensions.length === 0,
    failingDimensions,
    diagnosis,
    routeTo: failingDimensions.length > 0 ? routeTo : null,
    affectedIds,
  };
}

// ─── V1 Compatibility ─────────────────────────────────────────────────────

export const RUBRIC_DIMENSIONS = RUBRIC_DIMENSIONS_V2;

export function scorePasses(scores: RubricScores): boolean {
  return scorePassesV2(scores);
}

export function buildCritiqueResult(
  scores: RubricScores,
  diagnosis: string,
  routeTo: RouteTarget | null,
  affectedIds: string[],
): CritiqueResult {
  return buildCritiqueResultV2(scores, diagnosis, routeTo, affectedIds);
}

// ─── Routing Logic ─────────────────────────────────────────────────────────

export function determineRoute(
  failingDimensions: RubricDimension[],
  diagnosis: string,
): { routeTo: RouteTarget | null; shouldRegenTokens: boolean; shouldRegenLayout: boolean; affectedComponents: string[] } {
  const tokensDimensions: RubricDimension[] = ["brandCoherence", "hierarchy"];
  const layoutDimensions: RubricDimension[] = ["composition", "spacingRhythm", "responsiveDesign"];
  const componentDimensions: RubricDimension[] = ["componentConsistency", "accessibilityBaseline", "navigation", "contentCopy"];
  const contextDimensions: RubricDimension[] = ["productContext"];

  let routeTo: RouteTarget | null = null;
  let shouldRegenTokens = false;
  let shouldRegenLayout = false;
  let affectedComponents: string[] = [];

  const hasTokens = failingDimensions.some((d) => tokensDimensions.includes(d));
  const hasLayout = failingDimensions.some((d) => layoutDimensions.includes(d));
  const hasComponents = failingDimensions.some((d) => componentDimensions.includes(d));
  const hasContext = failingDimensions.some((d) => contextDimensions.includes(d));

  if (hasContext) {
    shouldRegenLayout = true;
    routeTo = "layout";
  }

  if (hasTokens && !routeTo) {
    if (diagnosis.toLowerCase().includes("token") || diagnosis.toLowerCase().includes("palette") ||
        diagnosis.toLowerCase().includes("color") || diagnosis.toLowerCase().includes("font")) {
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

  if (!routeTo) {
    const diag = diagnosis.toLowerCase();
    if (diag.includes("render") || diag.includes("blank") || diag.includes("compil") || diag.includes("syntax")) {
      routeTo = "components";
      affectedComponents = extractAffectedIds(diagnosis);
    } else if (diag.includes("layout") || diag.includes("grid") || diag.includes("spacing")) {
      routeTo = "layout";
      shouldRegenLayout = true;
    } else if (diag.includes("component") || diag.includes("style") || diag.includes("styling")) {
      routeTo = "components";
      affectedComponents = extractAffectedIds(diagnosis);
    } else if (diag.includes("token") || diag.includes("color") || diag.includes("font")) {
      routeTo = "tokens";
      shouldRegenTokens = true;
    } else {
      routeTo = "components";
    }
  }

  return { routeTo, shouldRegenTokens, shouldRegenLayout, affectedComponents };
}

function extractAffectedIds(diagnosis: string): string[] {
  const ids: string[] = [];
  const quoted = diagnosis.match(/["'`]([^"'`]+)["'`]/g);
  if (quoted) {
    for (const q of quoted) {
      ids.push(q.replace(/["'`]/g, ""));
    }
  }
  const kebab = diagnosis.match(/\b([a-z]+(?:-[a-z]+)+)\b/g);
  if (kebab && ids.length === 0) {
    for (const k of kebab) {
      if (["token-fidelity", "color-restraint", "high-contrast", "brand-coherence", "product-context"].includes(k)) continue;
      ids.push(k);
    }
  }
  return [...new Set(ids)];
}

// ─── Critique System Prompt (V2) ───────────────────────────────────────────

export function critiqueSystemPrompt(): string {
  return `You are a senior design reviewer judging UI screenshots against a Figma-level rubric.

Score each dimension 1–10 (1 = critically broken, 5 = borderline, 7 = good enough to ship, 10 = exceptional).

DIMENSIONS (10 total, weighted):

1. **productContext** (15%) — Does the screen feel like the right product type?
   - APP screens: function-first layout, sidebar/topbar, NO hero, NO footer, data-rich
   - LANDING pages: hero + CTA flow, social proof, footer, marketing-appropriate copy
   - DOCS: search + content grid, reading-optimized, no marketing
   
2. **brandCoherence** (15%) — Are brand tokens consistently used?
   - Same accent color across all screens? No Tailwind blue/indigo?
   - Same typography pairing? Consistent spacing scale?

3. **hierarchy** (15%) — One clear dominant moment per screen?
   - Heading > Subheading > Body > Caption differentiated by size + weight
   - Primary action clearly more prominent than secondary

4. **composition** (10%) — Deliberate surface treatment?
   - Multiple surface types (card, band, panel)? Not all same?
   - Content fills intent? Sections intentionally varied?

5. **spacingRhythm** (10%) — Consistent vertical rhythm?
   - All margins/padding on-scale? Sections breathe (no cramped or excessive)?
   - Text line-height proportional to size?

6. **componentConsistency** (10%) — Brand-aware components?
   - Custom colors and sizes? Multiple states visible? No placeholder content?

7. **navigation** (10%) — Navigation strategy matches product mode?
   - Primary action obvious? No dead buttons? Tabbar only on mobile?

8. **contentCopy** (5%) — Specific, human copy? No AI-slop phrases?

9. **responsiveDesign** (5%) — Layout adapts fluidly? No overflow on mobile?

10. **accessibilityBaseline** (5%) — Contrast >= 4.5:1? Focus rings visible?

BLOCKING DEFECTS (override scoring — score 0, instant rejection):
- CENTERED HERO ON APP SCREEN (landing composition on app UI)
- TABBAR OR FOOTER ON DESKTOP APP SCREENS
- GENERIC TAILWIND BLUE/INDIGO ACCENT (not brand token)
- BLANK SCREEN or unrendered content
- NO PRIMARY ACTION (user can't do anything)
- UNCOMPILABLE CODE (syntax errors, missing imports)

Return ONLY valid JSON:
{
  "scores": {
    "productContext": N,
    "brandCoherence": N,
    "hierarchy": N,
    "composition": N,
    "spacingRhythm": N,
    "componentConsistency": N,
    "navigation": N,
    "contentCopy": N,
    "responsiveDesign": N,
    "accessibilityBaseline": N
  },
  "diagnosis": "What passed and what failed. Be specific about blocking defects.",
  "affectedIds": ["component-or-screen-id"]
}`;
}

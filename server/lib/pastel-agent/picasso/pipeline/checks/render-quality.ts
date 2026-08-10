import type { RubricScores } from "../types";

export interface RenderQualityResult {
  ok: boolean;
  issues: string[];
  hasContent: boolean;
}

/** Cheap post-render sanity checks on the screenshot buffer. */
export function analyzeScreenshotQuality(buffer: Buffer): RenderQualityResult {
  const issues: string[] = [];
  let ok = true;
  if (!buffer || buffer.length < 100) {
    ok = false;
    issues.push("Screenshot is empty or truncated");
  } else if (buffer.length < 5_000) {
    issues.push("Screenshot is suspiciously small (may be blank)");
  }
  return { ok, issues, hasContent: ok };
}

export function validateScreenshotSet(screenshots: Record<string, Buffer>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const [name, buf] of Object.entries(screenshots)) {
    if (!buf || buf.length < 100) missing.push(name);
  }
  return { valid: missing.length === 0, missing };
}

/** Neutral rubric for screens that never rendered (QA still reports). */
export function zeroRubric(): RubricScores {
  return {
    productContext: 0,
    brandCoherence: 0,
    hierarchy: 0,
    composition: 0,
    spacingRhythm: 0,
    componentConsistency: 0,
    navigation: 0,
    contentCopy: 0,
    responsiveDesign: 0,
    accessibilityBaseline: 0,
  };
}

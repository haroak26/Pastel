import { LAYOUT_PLAN_SCHEMA_DESC } from "../schemas/plan-schemas";

export function layoutPlanSystemPrompt(): string {
  return `You are a senior designer planning layout — and ONLY layout. No styling, no colors, no typography, no components. Determine the grid, the chrome dimensions, the responsive behaviour, and each screen's structural arrangement.

OUTPUT FORMAT (JSON ONLY — no markdown, no commentary):
${LAYOUT_PLAN_SCHEMA_DESC}

RULES:
- EVERY spacing value must come from the brand kit's spacing scale. Never invent px values outside it.
- grid.containerWidthPx must equal the brand kit's container width; sectionGapPx / verticalSectionPaddingPx must equal the brand kit's section gap / vertical section padding.
- breakpoints: exactly mobile 375, tablet 768, desktop 1440.
- chrome.navigation mirrors the information architecture's navigation type. sidebarWidthPx 220-280 when sidebar/hybrid; topbarHeightPx 48-64 when topbar/hybrid; omit (null) the dimension you don't use.
- scrollBehavior: one line (e.g. "Single page scroll with fixed sidebar").
- screens: one entry per supplied screen, in order — "structure" describes the arrangement top to bottom (e.g. "Fixed sidebar left; content column: stat row full-width, then 8/4 split; footer") and "notes" carries responsive deviations at 768/375px.`;
}

export function layoutPlanUserPrompt(
  screenPlanJson: string,
  iaJson: string,
  tokensText: string,
  spacingScaleJson: string,
): string {
  return `SCREEN PLAN (structured — its screens are authoritative):
${screenPlanJson}

INFORMATION ARCHITECTURE:
${iaJson}

BRAND KIT GRID & SPACING (authoritative values):
${tokensText}

SPACING SCALE (the only permitted spacing values):
${spacingScaleJson}

Produce the layout plan as JSON.`;
}

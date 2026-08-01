import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { layoutPlanSystemPrompt, layoutPlanUserPrompt } from "../prompts/layout-plan";
import { layoutPlanSchema, type InformationArchitecture, type LayoutPlan, type ScreenPlan } from "../schemas/plan-schemas";
import { layoutPlanToMarkdown } from "../codegen/markdown";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 9 — Layout planning. Grid, chrome dimensions, breakpoints, per-screen
 * structural arrangement. No styling — every spacing value comes from the
 * brand kit's spacing scale.
 */

export function fallbackLayoutPlan(ctx: StageContext, screenNames: string[]): LayoutPlan {
  const ds = ctx.state.designSystem!;
  const ia = ctx.state.informationArchitecture;
  const navigation = ia?.navigation.type ?? "topbar";
  return {
    grid: { columns: ds.grid.columns, gapPx: ds.grid.gapPx, marginPx: ds.grid.marginPx, containerWidthPx: ds.spacing.containerWidth },
    chrome: {
      navigation,
      sidebarWidthPx: navigation === "sidebar" || navigation === "hybrid" ? 240 : null,
      topbarHeightPx: navigation === "topbar" || navigation === "hybrid" ? 56 : null,
    },
    sectionGapPx: ds.spacing.sectionGap,
    verticalSectionPaddingPx: ds.spacing.verticalSectionPadding,
    breakpoints: { ...ds.breakpoints },
    scrollBehavior: navigation === "sidebar" || navigation === "hybrid" ? "Fixed navigation chrome; content column scrolls" : "Single page scroll under a sticky topbar",
    screens: screenNames.map((screen) => ({
      screen,
      structure: navigation === "sidebar" || navigation === "hybrid"
        ? "Fixed navigation chrome with a content column; primary content first, supporting panels below"
        : "Top navigation, vertically stacked full-width sections, footer last",
      notes: "At 768px stack multi-column content; at 375px single column with the primary action visible.",
    })),
  };
}

export async function layoutPlanStage(ctx: StageContext): Promise<LayoutPlan> {
  ctx.activity("Planning the layout system");
  const ds = ctx.state.designSystem;
  const screenPlan: ScreenPlan | null = ctx.state.screenPlan;
  const ia: InformationArchitecture | null = ctx.state.informationArchitecture;
  if (!ds || !screenPlan || !ia) throw new Error("layout stage requires designSystem, screenPlan and informationArchitecture in state");

  const screenNames = screenPlan.screens.map((s) => s.name);
  const tokensText = JSON.stringify({
    grid: ds.grid,
    containerWidth: ds.spacing.containerWidth,
    sectionGap: ds.spacing.sectionGap,
    verticalSectionPadding: ds.spacing.verticalSectionPadding,
    breakpoints: ds.breakpoints,
  });
  const spacingScale = JSON.stringify(ds.spacingScale ?? [4, 8, 12, 16, 24, 32, 48, 64]);

  let layout: LayoutPlan;
  const sys = layoutPlanSystemPrompt();
  const user = layoutPlanUserPrompt(JSON.stringify(screenPlan), JSON.stringify(ia), tokensText, spacingScale);
  try {
    layout = await chatJSON<LayoutPlan>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "layout",
        temperature: 0.2,
        maxTokens: MAX_TOKENS_PER_CALL.layout,
        validate: (v) => {
          const parsed = layoutPlanSchema.parse(v);
          const scale = new Set([...(ds.spacingScale ?? [])]);
          if (scale.size > 0) {
            // Rhythm values must come from the scale; chrome dimensions are exempt.
            const pxValues = [parsed.grid.gapPx, parsed.grid.marginPx, parsed.sectionGapPx, parsed.verticalSectionPaddingPx];
            const offScale = pxValues.filter((n) => !scale.has(n) && n !== ds.grid.gapPx && n !== ds.grid.marginPx && n !== ds.spacing.sectionGap && n !== ds.spacing.verticalSectionPadding);
            if (offScale.length > 0) throw new Error(`layout uses spacing values outside the brand-kit scale: ${offScale.join(", ")}`);
          }
          const known = new Set(screenNames);
          const missing = screenNames.filter((name) => !parsed.screens.some((s) => s.screen === name));
          if (missing.length > 0) throw new Error(`layout plan does not cover screens: ${missing.join(", ")}`);
          for (const entry of parsed.screens) {
            if (!known.has(entry.screen)) throw new Error(`layout plan covers unknown screen ${entry.screen}`);
          }
          return parsed;
        },
      },
    );
    ctx.trackCost("layout", MODELS.layout, sys.length + user.length, JSON.stringify(layout).length);
  } catch (err) {
    console.warn("[pastel-agent] layout plan failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Layout plan completed with deterministic defaults");
    layout = fallbackLayoutPlan(ctx, screenNames);
  }

  // Deterministic guardrails — the model never overrides product-fixed values.
  layout = {
    ...layout,
    breakpoints: { ...ds.breakpoints },
    grid: { ...layout.grid, containerWidthPx: ds.spacing.containerWidth },
    screens: screenNames.map((name) => layout.screens.find((s) => s.screen === name) ?? { screen: name, structure: "Sections stacked top to bottom within the grid", notes: null }),
  };
  ctx.state.layoutPlan = layout;
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/06-layout.md",
    title: "Layout Plan",
    kind: "system",
    content: layoutPlanToMarkdown(layout),
  });
  return layout;
}

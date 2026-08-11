import type { Tokens, Brief, CritiqueResult } from "./types";
import type { ProductContext } from "./anti-slop";
import { compileStylesForRun, bundleScreenForPreview, buildPreviewHtml } from "./lib/preview";
import { renderScreen, getWarmSandbox } from "./lib/sandbox-render";
import { reviewScreen } from "./checks/visual-review-agent";
import { zeroRubric } from "./checks/render-quality";

export interface VisualQAInput {
  screenFiles: Record<string, string>;
  componentFiles: Record<string, string>;
  supportFiles: Record<string, string>;
  globalsCSS: string;
  tokens: Tokens;
  brief: Brief;
  productContext: ProductContext;
  creativeSeed: string;
  fonts: string[];
}

export interface VisualQAOutput {
  screenshots: Record<string, Buffer>;
  results: CritiqueResult[];
  feedback: Array<{ screen: string; strengths: string[]; improvements: string[] }>;
  averageScore: number;
  passedAll: boolean;
  blockingDefects: Array<{ screen: string; defects: string[] }>;
}

// ── V8: per-screen visual QA (screen-level pipelining §4.1) ──────────────
//
// One screen moves through render → vision critique as its own pipeline,
// running concurrently with every other screen (the caller caps concurrency
// and serializes sandbox renders through a shared queue — a single E2B
// sandbox runs one browser at a time).

export interface ScreenVisualQAInput {
  screenId: string;
  bundle: string;
  compiledStyles: string;
  fonts: string[];
  brief: Brief;
  tokens: Tokens;
  productContext: ProductContext;
  creativeSeed: string;
  warmSandbox?: unknown;
}

export interface ScreenVisualQAOutput {
  screenshot: Buffer | null;
  renderErrors: string[];
  diagnostics: string[];
  critique: CritiqueResult | null;
  feedback: { screen: string; strengths: string[]; improvements: string[] } | null;
}

export async function runScreenVisualQA(input: ScreenVisualQAInput): Promise<ScreenVisualQAOutput> {
  const { screenId, bundle, compiledStyles, fonts, brief, tokens, productContext, creativeSeed, warmSandbox } = input;

  const html = buildPreviewHtml(screenId, bundle, compiledStyles, fonts);
  const render = await renderScreen({ html, screenName: screenId, warmSandbox });

  if (!render.screenshot) {
    return {
      screenshot: null,
      renderErrors: render.errors,
      diagnostics: render.diagnostics,
      critique: null,
      feedback: null,
    };
  }

  try {
    const review = await reviewScreen({
      screenshot: render.screenshot,
      screenName: screenId,
      brief,
      tokens,
      productContext,
      creativeSeed,
    });
    return {
      screenshot: render.screenshot,
      renderErrors: render.errors,
      diagnostics: render.diagnostics,
      critique: {
        scores: review.scores,
        average: review.average,
        passed: review.passed,
        failingDimensions: review.failingDimensions,
        diagnosis: review.diagnosis,
        routeTo: review.average < 7 ? "components" : null,
        affectedIds: [screenId],
      },
      feedback: { screen: screenId, strengths: review.strengths, improvements: review.improvements },
    };
  } catch (err) {
    return {
      screenshot: render.screenshot,
      renderErrors: render.errors,
      diagnostics: render.diagnostics,
      critique: {
        scores: zeroRubric(),
        average: 0,
        passed: false,
        failingDimensions: [],
        diagnosis: `Visual review failed: ${err instanceof Error ? err.message : err}`,
        routeTo: null,
        affectedIds: [screenId],
      },
      feedback: null,
    };
  }
}

/**
 * Visual QA: compile styles once → bundle + HTML per screen → render every
 * screen in the E2B sandbox → vision critique each screenshot.
 * Draft mode skips this entirely (callers decide).
 */
export async function runVisualQA(input: VisualQAInput): Promise<VisualQAOutput> {
  const { screenFiles, componentFiles, supportFiles, globalsCSS, tokens, brief, productContext, creativeSeed, fonts } = input;

  const screenshots: Record<string, Buffer> = {};
  const results: CritiqueResult[] = [];
  const feedback: VisualQAOutput["feedback"] = [];
  const blockingDefects: VisualQAOutput["blockingDefects"] = [];

  // 1. Compile the theme CSS once for the whole run.
  const compiled = await compileStylesForRun({ globalsCSS, components: componentFiles, screens: screenFiles, support: supportFiles });
  if (!compiled) {
    const diagnosis = "Tailwind compilation failed — visual QA skipped";
    for (const id of Object.keys(screenFiles)) {
      results.push({ scores: zeroRubric(), average: 0, passed: false, failingDimensions: [], diagnosis, routeTo: "components", affectedIds: [id] });
    }
    return { screenshots, results, feedback, averageScore: 0, passedAll: false, blockingDefects };
  }

  // 2. Bundle each screen.
  const bundles: Record<string, string> = {};
  for (const [id, code] of Object.entries(screenFiles)) {
    const bundle = await bundleScreenForPreview(id, code, componentFiles, supportFiles);
    if (bundle) bundles[id] = bundle;
  }

  // 3. Render all screens in the E2B sandbox (one warm sandbox).
  const warm = await getWarmSandbox();
  for (const [id, bundle] of Object.entries(bundles)) {
    const html = buildPreviewHtml(id, bundle, compiled, fonts);
    const render = await renderScreen({ html, screenName: id, warmSandbox: warm });
    if (render.screenshot) {
      screenshots[id] = render.screenshot;
    } else {
      blockingDefects.push({ screen: id, defects: render.errors });
    }
  }

  // 4. Vision critique per screenshot.
  for (const [id, buf] of Object.entries(screenshots)) {
    try {
      const review = await reviewScreen({
        screenshot: buf,
        screenName: id,
        brief,
        tokens,
        productContext,
        creativeSeed,
      });
      results.push({
        scores: review.scores,
        average: review.average,
        passed: review.passed,
        failingDimensions: review.failingDimensions,
        diagnosis: review.diagnosis,
        routeTo: review.average < 7 ? "components" : null,
        affectedIds: [id],
      });
      feedback.push({ screen: id, strengths: review.strengths, improvements: review.improvements });
      if (!review.passed) {
        blockingDefects.push({ screen: id, defects: review.improvements });
      }
    } catch (err) {
      results.push({
        scores: zeroRubric(),
        average: 0,
        passed: false,
        failingDimensions: [],
        diagnosis: `Visual review failed: ${err instanceof Error ? err.message : err}`,
        routeTo: null,
        affectedIds: [id],
      });
    }
  }

  // Screens that never rendered get a failing result.
  for (const id of Object.keys(screenFiles)) {
    if (!screenshots[id]) {
      results.push({
        scores: zeroRubric(),
        average: 0,
        passed: false,
        failingDimensions: [],
        diagnosis: `Screen "${id}" did not render in the sandbox`,
        routeTo: "components",
        affectedIds: [id],
      });
    }
  }

  const averageScore = results.length > 0
    ? Math.round((results.reduce((s, r) => s + r.average, 0) / results.length) * 10) / 10
    : 0;
  const passedAll = results.length > 0 && results.every((r) => r.passed) && Object.keys(screenshots).length === Object.keys(screenFiles).length;

  return { screenshots, results, feedback, averageScore, passedAll, blockingDefects };
}

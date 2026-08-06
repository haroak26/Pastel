import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { reviewResultSchema, type V6ReviewResult, type ProductBrief, type ResolvedTheme, type CopyPlan, type UxDesignPlan } from "../schemas-v6";
import { datasetPrompt, type MockDataset } from "../lib/content";

/**
 * V6/V9 Review agent — the quality gate.
 *
 * Two model passes over the deterministic gates:
 * 1. Static review — the mid-tier model judges generated code against the
 *    brief, the company design language, and the universal design law.
 * 2. Visual review — a vision-capable model judges rendered screenshots
 *    against the same references (screenshots are the ground truth for taste).
 *
 * Sandbox failures and the deterministic code/geometry gates are merged in
 * by the orchestrator as ground truth.
 *
 * V9: the review also judges the two-screen UX contract — home/catalog must
 * be a toolbar + product grid with one dominant moment; detail must be a
 * gallery + summary card + primary action; off-archetype elements (settings
 * forms, pricing, tables, search on detail) are blocking; card surfaces are
 * deliberate (grid + one summary card only); secondary actions stay quiet.
 */

export interface ReviewInput {
  brief: ProductBrief;
  theme: ResolvedTheme;
  companyBlock: string;
  megadesign: string;
  generatedFiles: Record<string, string>;
  /** Files the sandbox verified — the only files you may judge. */
  verifiedFiles?: string[];
  verificationErrors: string[];
  /** V7: the copy plan + domain dataset — judges relevance (a fitness app
   * must never show invoices/companies/currency). */
  copy?: CopyPlan | null;
  data?: MockDataset | null;
  /** V9: the UX design plan the composer was told to render. */
  ux?: UxDesignPlan | null;
  onUsage?: OnUsage;
}

export interface VisualReviewInput {
  brief: ProductBrief;
  theme: ResolvedTheme;
  companyBlock: string;
  megadesign: string;
  screenshotNames: string[];
  screenshots: string[];
  verifiedFiles?: string[];
  onUsage?: OnUsage;
}

const REVIEW_SYSTEM = `You are a senior design reviewer on the Pastel review board. You judge generated UI code against a product brief, a company design language, and a universal design law.

GROUND TRUTH:
- The sandbox is the ground truth for compilation. Files NOT listed as verified did not compile and are handled by the runtime gate — never speculate about them, never claim they are "truncated", "incomplete", or "missing" (you cannot see what did not compile).
- Only judge the VERIFIED files. Runtime failures are already counted as blocking by the gate.
- Do not invent code-level claims (truncation, missing exports, non-existent classes) about verified files unless you can see them in the code below.

Judge:
- Fidelity to the company design language (tokens, rules, signature moves, voice).
- Adherence to the universal design law (accessibility, anti-slop, layout rhythm, token discipline).
- Coverage of the brief: every feature and screen purpose represented.
- Copy quality: specific, human, on-voice. Flag AI-slop.
- Composition quality (v8): one dominant moment per screen at hero scale; metrics and charts are large and legible; no two adjacent sections use the same surface; no blank sections; card and outline-button counts are restrained; charts are branded moments whose header/unit match the data they plot.
- Two-screen UX contract (v9): the product is EXACTLY two screens — "home" (main browse/catalog: toolbar + product grid + ONE dominant moment) and "detail" (single-item info page: photo gallery + summary card + primary action). Flag as HIGH any off-archetype element: settings forms, pricing tables, data tables, marketing heroes/CTAs on home, or search/stats/charts on detail.
- Card discipline (v9): card surfaces are deliberate — the product grid on home and the ONE summary card on detail; stats/charts are bands; divided rows for reviews/details. Flag stacked outline-card modules and missing cards where a product needs them (e.g. a detail page without a summary/action card).
- Layout law (v10): vertical rhythm — adjacent sections alternate padding steps, never two identical steps in a row and never random jumps; hierarchy is monotonic (the dominant moment is the LARGEST type on the page, ≥ text-4xl); no two adjacent sections use the same surface; every section has real content and breathing room; paired columns are equal height; type sizes come from the ladder (section headings text-2xl, body base, labels xs/sm).
- Cross-screen integrity (v10): each screen shows ONLY its own data — the detail page is ONE item (its photos, facts, reviews); flag any catalog content (other listings, search results, metric bands) rendered on the detail page as HIGH, and any item-detail content on home.

Rules:
- Be specific: fixes must name a file path (src/screens/... or src/components/...) and a concrete change.
- severity: high (blocks approval), medium (should fix), low (polish).
- decision: APPROVE only when there are no high-severity issues.
- Output ONLY valid JSON.`;

export async function runReview(input: ReviewInput): Promise<V6ReviewResult> {
  const filesBlock = Object.entries(input.generatedFiles)
    .filter(([p]) => p.endsWith(".jsx") || p.endsWith(".js"))
    .slice(0, 30)
    .map(([p, c]) => `### ${p}\n\`\`\`jsx\n${c.slice(0, 2600)}\n\`\`\``)
    .join("\n\n");

  const dataBlock = input.data ? datasetPrompt(input.data) : "";
  const copyBlock = input.copy
    ? `COPY PLAN (what each screen should say):\n${JSON.stringify(input.copy.screens, null, 2)}`
    : "";
  const uxBlock = input.ux
    ? `UX DESIGN PLAN (the layout the composer was told to render):\n${JSON.stringify(input.ux, null, 2)}`
    : "";

  const user = `PRODUCT BRIEF:\n${JSON.stringify({ title: input.brief.title, productType: input.brief.productType, description: input.brief.description, features: input.brief.features, screenPurposes: input.brief.screenPurposes }, null, 2)}\n\n${input.companyBlock}\n\n${input.megadesign}\n\n${dataBlock}\n\n${copyBlock}\n\n${uxBlock}\n\nRELEVANCE RULE: judge whether on-screen content matches the product's domain — flag invoices, company names, currency, billing, or B2B workspace content in a non-financial/non-shopping product as high severity.\n\nVERIFIED FILES (compiled by the sandbox — judge ONLY these):\n${(input.verifiedFiles?.length ? input.verifiedFiles.join("\n") : "none")}\n\nVERIFICATION ERRORS (from the sandbox — treat as blocking, already counted):\n${input.verificationErrors.length ? input.verificationErrors.join("\n") : "none"}\n\nGENERATED FILES (verified ones in full):\n${filesBlock}\n\nEmit the review verdict as JSON: { "passed": boolean, "score": 0-100, "decision": "APPROVE"|"RETURN_TO_BUILDER", "requiredFixes": string[], "issues": [{ "target", "severity", "category", "description" }], "summary" }`;

  try {
    return await chatJSON<V6ReviewResult>(
      [
        { role: "system", content: REVIEW_SYSTEM },
        { role: "user", content: user },
      ],
      {
        model: "review",
        temperature: 0.2,
        maxTokens: MAX_TOKENS_PER_CALL.review,
        validate: (v) => reviewResultSchema.parse(v),
        onUsage: input.onUsage,
      },
    );
  } catch (err) {
    console.warn("[pastel v6] static review failed:", err instanceof Error ? err.message : err);
    return { passed: false, score: 50, decision: "RETURN_TO_BUILDER", requiredFixes: [], issues: [{ target: "project", severity: "high", category: "review", description: "Static review unavailable — treat as needs-verification." }], summary: "Static review degraded." };
  }
}

const VISUAL_SYSTEM = `You are a senior visual design reviewer with an eye for detail. You look at rendered screenshots of a generated product and judge them against a product brief, a company design language, and a universal design law.

Judge each screenshot:
- Brand fidelity: do the colors, type, spacing, and components feel like the company design language? If reference imagery is provided, compare directly against it.
- Layout quality: alignment, whitespace, hierarchy, one dominant moment per screen, no cramped density.
- Composition variety (v8): no two adjacent sections with the same surface; metric values and charts are hero-scale and legible; no blank or empty-looking sections; cards and outline buttons are not overused.
- Layout law (v10): vertical rhythm alternates (adjacent sections never share one padding step); the dominant moment is the largest type on the page; sections breathe (no flush stacking); paired columns align; type follows the ladder.
- Two-screen UX contract (v9): "home" reads as a browse/catalog screen (search toolbar + product grid + one dominant moment); "detail" reads as a single-item info page (photo gallery, a summary/action card, reviews). Flag any screen that reads as a settings page, a data table, or a marketing landing page as high severity.
- Cross-screen integrity (v10): detail shows ONE item only — flag catalog grids, other listings, or search content on the detail page as high severity.
- Card discipline (v9): the grid and the single summary card are the only card clusters; stats/charts are bands; outline-button pairs are scaffolding.
- Polish: does anything look broken, empty, or misaligned?
- Copy: is the on-screen copy specific and on-voice?

Rules:
- Fixes must target a screen file by name (the screenshot name) with a concrete change.
- decision: APPROVE only when all screens are on-brand and polished.
- Output ONLY valid JSON.`;

export async function runVisualReview(input: VisualReviewInput): Promise<V6ReviewResult | null> {
  if (input.screenshots.length === 0) return null;

  // V10: attach the company's real reference imagery (preview.png +
  // references/*.png) so brand fidelity is judged against an actual visual,
  // not just prose. Best-effort: the review still runs without them.
  const refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  const refNames: string[] = [];
  try {
    const { companyImageFiles, readCompanyImage } = await import("../knowledge/index");
    const { inspiration } = input.brief;
    for (const file of companyImageFiles(inspiration.primary).slice(0, 3)) {
      const buf = readCompanyImage(inspiration.primary, file);
      if (buf && buf.byteLength <= 2_000_000) {
        refImages.push({
          type: "image",
          source: {
            type: "base64",
            media_type: file.endsWith(".webp") ? "image/webp" : file.endsWith(".jpg") || file.endsWith(".jpeg") ? "image/jpeg" : "image/png",
            data: buf.toString("base64"),
          },
        });
        refNames.push(file);
      }
    }
  } catch {
    /* reference imagery is optional */
  }

  const imageBlocks = input.screenshots.slice(0, 6).map((dataUrl) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: "image/png", data: dataUrl.replace(/^data:image\/png;base64,/, "") },
  }));

  const textBlock = {
    type: "text" as const,
    text: `PRODUCT BRIEF:\n${JSON.stringify({ title: input.brief.title, productType: input.brief.productType, description: input.brief.description, features: input.brief.features }, null, 2)}\n\nSCREENSHOTS: ${input.screenshotNames.join(", ")}\n\n${input.companyBlock}\n\n${input.megadesign}\n\nCOMPANY REFERENCE IMAGERY (${refNames.join(", ") || "none shipped"}): the reference image(s) show the real company's visual language — use them as the ground truth for brand fidelity (colors, type, spacing, component shapes, mood).\n\nReview the rendered screenshots above against the brief, the design language, and the reference imagery. Emit the verdict as JSON: { "passed": boolean, "score": 0-100, "decision": "APPROVE"|"RETURN_TO_BUILDER", "requiredFixes": string[], "issues": [{ "target" (a screen file), "severity", "category", "description" }], "summary" }`,
  };
  try {
    return await chatJSON<V6ReviewResult>(
      [
        { role: "system", content: VISUAL_SYSTEM },
        { role: "user", content: [textBlock, ...refImages, ...imageBlocks] as unknown as string },
      ],
      {
        model: "visualReview",
        temperature: 0.2,
        maxTokens: MAX_TOKENS_PER_CALL.visualReview,
        validate: (v) => reviewResultSchema.parse(v),
        onUsage: input.onUsage,
      },
    );
  } catch (err) {
    console.warn("[pastel v6] visual review failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export function mergeReviewResults(
  codeResult: V6ReviewResult,
  visualResult: V6ReviewResult | null,
  opts?: { sandboxErrors?: Array<{ file?: string; message: string }>; generatedFiles?: Record<string, string> },
): V6ReviewResult {
  const issues = [...codeResult.issues];
  const requiredFixes = [...codeResult.requiredFixes];
  let decision = codeResult.decision;
  let passed = codeResult.passed;
  let score = codeResult.score;

  if (visualResult) {
    for (const i of visualResult.issues) {
      if (!issues.some((x) => x.target === i.target && x.description === i.description)) issues.push(i);
    }
    for (const f of visualResult.requiredFixes) {
      if (!requiredFixes.includes(f)) requiredFixes.push(f);
    }
    if (visualResult.decision === "RETURN_TO_BUILDER") decision = "RETURN_TO_BUILDER";
    passed = passed && visualResult.passed;
    score = Math.round((score + visualResult.score) / 2);
  }

  // Sandbox verification is ground truth the model can't see.
  if (opts?.sandboxErrors && opts.sandboxErrors.length > 0) {
    decision = "RETURN_TO_BUILDER";
    passed = false;
    score = Math.min(score, 69);
    for (const e of opts.sandboxErrors) {
      const target = e.file && opts.generatedFiles?.[e.file] ? e.file : "project";
      const desc = `Runtime failure: ${e.message}`;
      if (!issues.some((i) => i.target === target && i.description === desc)) {
        issues.push({ target, severity: "high", category: "state", description: desc });
      }
      requiredFixes.push(`Fix the runtime error in ${target}: ${e.message}`);
    }
  }

  return { passed, score: Math.max(0, Math.min(100, score)), decision, requiredFixes, issues: issues.slice(0, 40), summary: codeResult.summary };
}

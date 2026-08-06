import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { reviewResultSchema, type V6ReviewResult, type ProductBrief, type ResolvedTheme, type CopyPlan, type UxDesignPlan, type WireframePlan, type ComponentInventory } from "../schemas-v6";
import { datasetPrompt, type MockDataset } from "../lib/content";
import { reviewV14Checklist } from "../checks/review-v14";
import { geometryPasses, type GeometryReport } from "../checks/geometry";
import type { VisualReference } from "../types";

/**
 * V14 Next-gen review agent — the vision-first review board.
 *
 * Two model passes over the deterministic gates:
 * 1. Static review — Luna judges generated code against the brief, the
 *    company design language, the universal design law, AND the measured
 *    ground truth (geometry reports, mount audit, per-screen block lists).
 * 2. Visual review — a vision-capable Luna model looks at the RENDERED
 *    screenshots and judges spacing, missing components, duplicated
 *    components, and flow (per the `reviewV14Checklist`), with each
 *    screenshot paired to the wireframe blocks and components it must show.
 *
 * Sandbox failures and the deterministic gates are merged in by the
 * orchestrator as ground truth (`mergeReviewResults` from review-v6).
 */

export interface ReviewInput {
  brief: ProductBrief;
  theme: ResolvedTheme;
  companyBlock: string;
  megadesign: string;
  generatedFiles: Record<string, string>;
  verifiedFiles?: string[];
  verificationErrors: string[];
  copy?: CopyPlan | null;
  data?: MockDataset | null;
  ux?: UxDesignPlan | null;
  wireframe?: WireframePlan | null;
  inventory?: ComponentInventory | null;
  /** V14: measured DOM geometry per verified screen — fed to the model. */
  geometryReports?: Record<string, GeometryReport>;
  onUsage?: OnUsage;
  visualReference?: VisualReference;
}

export interface VisualReviewInput {
  brief: ProductBrief;
  theme: ResolvedTheme;
  companyBlock: string;
  megadesign: string;
  screenshotNames: string[];
  screenshots: string[];
  verifiedFiles?: string[];
  wireframe?: WireframePlan | null;
  inventory?: ComponentInventory | null;
  /** V14: measured DOM geometry per screenshot — the model sees the numbers. */
  geometryReports?: Record<string, GeometryReport>;
  onUsage?: OnUsage;
  visualReference?: VisualReference;
}

export { mergeReviewResults } from "./review-v6";

/** Compact per-screen context: wireframe blocks + mounted components. */
export function screenContext(
  screenId: string,
  wireframe?: WireframePlan | null,
  inventory?: ComponentInventory | null,
): string {
  const screen = wireframe?.screens.find((s) => s.id === screenId);
  if (!screen) return `- ${screenId}: (no wireframe block list)`;
  const blocks = screen.blocks.map((b) => `${b.block}:${b.variant ?? "default"}${b.emphasis ? "*" : ""}`).join(", ");
  const mounted = (inventory?.components ?? [])
    .filter((c) => c.usedBy.includes(screenId))
    .map((c) => `${c.name} (${c.basedOn})`)
    .join(", ");
  return `- ${screenId} — purpose: ${screen.purpose}\n  blocks: ${blocks}\n  components to render: ${mounted || "none (generic primitives only)"}`;
}

/** The measured geometry as a compact truth block for the model. */
export function geometrySummary(name: string, rep?: GeometryReport): string {
  if (!rep) return `- ${name}: (no geometry measurement)`;
  const { ok, reasons } = geometryPasses(rep);
  return `- ${name}: ${ok ? "clean" : `issues — ${reasons.join("; ")}`} (rhythm=${rep.rhythm.length}, flush=${rep.flush.length}, overlaps=${rep.overlaps.length}, blanks=${rep.blanks.length}, overflow=${rep.overflow}, heroScale=${rep.heroScale}, offGrid=${rep.offGrid}/${rep.sampled})`;
}

const REVIEW_SYSTEM = `You are a senior design reviewer on the Pastel review board. You judge generated UI code against a product brief, a company design language, a universal design law, and MEASURED layout data.

GROUND TRUTH:
- The sandbox is the ground truth for compilation. Files NOT listed as verified did not compile and are handled by the runtime gate — never speculate about them.
- Only judge the VERIFIED files. Runtime failures are already counted as blocking by the gate.
- The GEOMETRY MEASUREMENTS are ground truth for spacing: rhythm, flush whitespace, overlaps, blanks, overflow, hero-scale. Do not re-litigate them; use them as input.
- The MOUNT AUDIT is ground truth for components: which components each screen must render.

Judge:
- Fidelity to the company design language (tokens, rules, signature moves, voice).
- Adherence to the universal design law (accessibility, anti-slop, layout rhythm, token discipline).
- Coverage of the brief: every feature and screen purpose represented.
- Copy quality: specific, human, on-voice. Flag AI-slop.
- Composition quality (v8/v14): one dominant moment per screen at hero scale; no two adjacent sections use the same surface; no blank sections; restrained cards and outline buttons; charts are branded moments whose header/unit match their data.
- Two-screen UX contract (v14): home leads the product's primary workflow; detail supports the focused secondary workflow. Never require a search toolbar, catalog grid, gallery, booking card, or marketplace structure unless the brief explicitly requires it.
- ${reviewV14Checklist()}
- Cross-screen integrity (v10): each screen shows ONLY its own data — detail is ONE item; flag catalog content on the detail screen as HIGH, and item-detail content on home.

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

  // V14: measured spacing + per-screen block lists + mount contract — the
  // model judges with real measurements instead of guesswork.
  const geometryBlock = input.geometryReports && Object.keys(input.geometryReports).length > 0
    ? `MEASURED LAYOUT (geometry gate — ground truth for spacing):\n${Object.entries(input.geometryReports).map(([name, rep]) => geometrySummary(name, rep)).join("\n")}`
    : "";
  const screensBlock = input.wireframe
    ? `SCREEN CONTEXT (blocks the wireframe plans + components each screen must render):\n${input.wireframe.screens.map((s) => screenContext(s.id, input.wireframe, input.inventory)).join("\n")}`
    : "";

  const targetBlock = input.visualReference
    ? `USER PRODUCT VISUAL TARGET: ${input.visualReference.names?.join(", ") ?? "attached reference"}. The target is authoritative for composition, hierarchy, spacing, surfaces, density, and action placement. Do not infer its domain or copy its branding.`
    : "";

  const user = `PRODUCT BRIEF:\n${JSON.stringify({ title: input.brief.title, productType: input.brief.productType, description: input.brief.description, features: input.brief.features, screenPurposes: input.brief.screenPurposes }, null, 2)}\n\n${input.companyBlock}\n\n${input.megadesign}\n\n${targetBlock}\n\n${geometryBlock}\n\n${screensBlock}\n\n${dataBlock}\n\n${copyBlock}\n\n${uxBlock}\n\nRELEVANCE RULE: judge whether on-screen content matches the product's domain — flag invoices, company names, currency, billing, or B2B workspace content in a non-financial/non-shopping product as high severity.\n\nVERIFIED FILES (compiled by the sandbox — judge ONLY these):\n${(input.verifiedFiles?.length ? input.verifiedFiles.join("\n") : "none")}\n\nVERIFICATION ERRORS (from the sandbox — treat as blocking, already counted):\n${input.verificationErrors.length ? input.verificationErrors.join("\n") : "none"}\n\nGENERATED FILES (verified ones in full):\n${filesBlock}\n\nEmit the review verdict as JSON: { "passed": boolean, "score": 0-100, "decision": "APPROVE"|"RETURN_TO_BUILDER", "requiredFixes": string[], "issues": [{ "target", "severity", "category", "description" }], "summary" }`;

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
    console.warn("[pastel v14] static review failed:", err instanceof Error ? err.message : err);
    return { passed: false, score: 50, decision: "RETURN_TO_BUILDER", requiredFixes: [], issues: [{ target: "project", severity: "high", category: "review", description: "Static review unavailable — treat as needs-verification." }], summary: "Static review degraded." };
  }
}

const VISUAL_SYSTEM = `You are a senior VISUAL design reviewer with an eye for detail. You look at rendered screenshots of a generated product and judge them against a product brief, a company design language, a universal design law, and the wireframe each screen was told to render.

You judge the PIXELS — spacing, component presence, duplication, and flow:

- SPACING: density and whitespace. Are sections breathing? Is alignment on the grid? Do any sections look cramped, stretched, or flush against each other? Use the MEASURED LAYOUT numbers as ground truth; your job is the human-eye read on top (visual clutter, awkward gaps, misalignment).
- MISSING COMPONENTS: for each screenshot you are told which components it must render. Look for each one in the pixels. A planned component that is not visibly present is a defect.
- DUPLICATED COMPONENTS: two sections that look like the same component rendered twice (identical cards, identical strips, repeated panels) are a defect — even if the underlying code differs.
- FLOW: does the screen read top-to-bottom as the briefed workflow? Dominant moment first at hero scale; sections in the wireframe's order; one clear primary action; secondary actions quiet; no competing elements. Does the screen look like THIS product's purpose (a coaching app, a workspace, a marketplace)? A screen that reads as an unrelated template — especially a generic marketplace/listing template — is HIGH severity.
- Brand fidelity: colors, type, spacing, and components should feel like the company design language; when reference imagery is provided, compare directly.
- Layout law: vertical rhythm alternates; dominant moment is the largest type; no two adjacent sections share a surface; sections have real content.
- Cross-screen integrity: detail shows ONE item only; catalog grids, other listings, or search content on the detail screen are HIGH severity.
- Copy: specific and on-voice.

Rules:
- Fixes must target a screen file by name (the screenshot name) with a concrete change.
- decision: APPROVE only when all screens are on-brand, complete, and polished.
- Output ONLY valid JSON.`;

export async function runVisualReview(input: VisualReviewInput): Promise<V6ReviewResult | null> {
  if (input.screenshots.length === 0) return null;

  const refImages: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  const refNames: string[] = [];
  let productReferenceText = "";

  if (input.visualReference) {
    refImages.push(...input.visualReference.images);
    refNames.push(...(input.visualReference.names ?? ["user product target"]));
    productReferenceText = input.visualReference.description ?? "The attached user reference is the product composition source of truth. Match its hierarchy, spacing, density, surfaces, responsive intent, and component relationships without copying its branding or content.";
  }
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

  // V14: per-screenshot context — what the screen was told to render, which
  // components must be visible, and how the geometry gate measured it.
  const perScreen = input.screenshotNames.map((name) => {
    const id = name.replace(/\.(?:png|jpeg|jpg|webp)$/, "");
    return `${screenContext(id, input.wireframe, input.inventory)}\n  measured: ${geometrySummary(id, input.geometryReports?.[id])}`;
  }).join("\n");

  const imageBlocks = input.screenshots.slice(0, 6).map((dataUrl) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: "image/png", data: dataUrl.replace(/^data:image\/png;base64,/, "") },
  }));

  const textBlock = {
    type: "text" as const,
    text: `PRODUCT BRIEF:\n${JSON.stringify({ title: input.brief.title, productType: input.brief.productType, description: input.brief.description, features: input.brief.features }, null, 2)}\n\nSCREENSHOTS: ${input.screenshotNames.join(", ")}\n\nSCREEN CONTEXT (what each screenshot must show):\n${perScreen}\n\n${input.companyBlock}\n\n${input.megadesign}\n\n${productReferenceText}\n\nREFERENCE IMAGERY (${refNames.join(", ") || "none shipped"}): company imagery describes inspiration brand fidelity; a user Figma/Banani target describes the intended product composition. Product requirements and the user target outrank the inspiration brand's page archetype.\n\n${reviewV14Checklist()}\n\nReview the rendered screenshots above against the brief, the design language, the screen context, and the reference imagery. When a user target is attached, explicitly judge its dominant moment, layout proportions, surface hierarchy, spacing rhythm, content density, action placement, and responsive intent. Reject any recognizable inspiration-template structure that is not supported by the brief or target. Emit the verdict as JSON: { "passed": boolean, "score": 0-100, "decision": "APPROVE"|"RETURN_TO_BUILDER", "requiredFixes": string[], "issues": [{ "target" (a screen file), "severity", "category", "description" }], "summary" }`,
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
    console.warn("[pastel v14] visual review failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

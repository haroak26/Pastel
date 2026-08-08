import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { reviewResultSchema, type V6ReviewResult, type ProductBrief, type ResolvedTheme, type CopyPlan, type UxDesignPlan, type WireframePlan, type ComponentInventory, type BrandKit } from "../schemas";
import { datasetPrompt, type MockDataset } from "../lib/content";
import { reviewV14Checklist } from "../checks/review";
import { geometryPasses, type GeometryReport } from "../checks/geometry";
import type { VisualReference } from "../types";
import { classifyContext } from "../lib/ux-design";
import type { ProductContext } from "../schemas";
import { auditV17Review, classifyProductContext } from "../contract";

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
  geometryReports?: Record<string, GeometryReport>;
  onUsage?: OnUsage;
  visualReference?: VisualReference;
  brandKit?: BrandKit | null;
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
  geometryReports?: Record<string, GeometryReport>;
  onUsage?: OnUsage;
  visualReference?: VisualReference;
}

export { mergeReviewResults } from "./review-merge";

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
- The V17 DESIGN PLAN is ground truth for screen intent, structure, product context, and navigation legality.

V17 RUBRIC (score weighting):
- Product context (15%): the screen reads as the correct product type, not a marketing landing page, onboarding flow, or unrelated template.
- Brand coherence (15%): tokens, palette, radius steps, and signature moves are consistent across all screens. Default blue/indigo accent is a defect.
- Hierarchy (15%): one dominant moment per screen at hero scale; monotonic type ladder; no competing elements.
- Composition (15%): no two adjacent sections share the same surface; sections alternate in padding; card counts are deliberate.
- Spacing/density (15%): rhythm is on-grid; sections breathe; no large empty vertical gaps; no cramped density.
- Surface creativity (10%): sections use deliberate surfaces (card, band, panel, glass, divider, full-bleed). Sections separated only by light gray outlines or hairline rules are a defect.
- Nav appropriateness (10%): navigation matches the product context. Tabbar or footer on desktop app screens is a HIGH defect. Missing primary action is a HIGH defect.
- Content completeness (10%): every section has real, specific content. Sparse data rendering, placeholder rows, or empty sections where data exists are HIGH defects.
- Responsive (5%): layout adapts fluidly from 1440px to 375px via responsive prefixes.

BLOCKING DEFECTS (always HIGH severity):
- Landing/marketing page composition on an app screen (centered hero, max-w prose, footer, pricing, testimonials, or landing-page layouts on a product app screen).
- Detail screen rendered as a stack of generic cards with no dominant moment or focused workflow.
- Tabbar or footer on desktop app screens (use sidebar or topbar instead).
- Large empty vertical gaps (>3 rem) between sections with no content bridge.
- Inconsistent palette — sections using different accent tokens, or default Tailwind blue/indigo accent without brand customization.
- Sections separated only by light gray outlines or hairline rules instead of deliberate surface treatments.
- Sparse data rendering — placeholder content, empty list rows, or stateless empty states where data is present in the dataset.
- Missing primary action — no clear call-to-action button or primary affordance on the dominant screen.

Judge:
- Fidelity to the company design language (tokens, rules, signature moves, voice).
- Adherence to the universal design law (accessibility, anti-slop, layout rhythm, token discipline).
- Coverage of the brief: every feature and screen purpose represented.
- Copy quality: specific, human, on-voice. Flag AI-slop.
- Composition quality (v8/v14): one dominant moment per screen at hero scale; no two adjacent sections use the same surface; no blank sections; restrained cards and outline buttons; charts are branded moments whose header/unit match their data.
- Two-screen UX contract (v16): home leads the product's primary workflow; detail supports the focused secondary workflow. Render only structures justified by the product mode and screen intent.
- MODE fidelity (v16): judge the screen against the brief's MODE. Transaction controls are legal only for transact products; dashboards, workspaces, feeds, and coaching surfaces use their own workflow language.
- ${reviewV14Checklist()}
- Cross-screen integrity (v10): each screen shows ONLY its own data — detail is ONE item; flag catalog content on the detail screen as HIGH, and item-detail content on home.

Rules:
- Be specific: fixes must name a file path (src/screens/... or src/components/...) and a concrete change.
- Every issue must include observable evidence in its description, not a vague quality opinion.
- Use severity high only for contract, runtime, missing-content, accessibility, or clearly broken visual hierarchy failures. V17 blocking defects are always HIGH.
- Include a confidence value from 0 to 1 when emitting an issue.
- severity: high (blocks approval), medium (should fix), low (polish).
- decision: APPROVE only when there are no high-severity issues.
- Output ONLY valid JSON. The issue shape is { target, severity, category, description, confidence? }.`;

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

  const geometryBlock = input.geometryReports && Object.keys(input.geometryReports).length > 0
    ? `MEASURED LAYOUT (geometry gate — ground truth for spacing):\n${Object.entries(input.geometryReports).map(([name, rep]) => geometrySummary(name, rep)).join("\n")}`
    : "";
  const screensBlock = input.wireframe
    ? `SCREEN CONTEXT (blocks the wireframe plans + components each screen must render):\n${input.wireframe.screens.map((s) => screenContext(s.id, input.wireframe, input.inventory)).join("\n")}`
    : "";

  const targetBlock = input.visualReference
    ? `USER PRODUCT VISUAL TARGET: ${input.visualReference.names?.join(", ") ?? "attached reference"}. The target is authoritative for composition, hierarchy, spacing, surfaces, density, and action placement. Do not infer its domain or copy its branding.`
    : "";

  let v17Block = "";
  let v17AuditBlock = "";
  const productContext = classifyProductContext(input.brief);
  if (input.wireframe) {
    const v17Issues = auditV17Review(input.brief, input.wireframe, input.generatedFiles, input.brandKit);
    const ctxStr = classifyContext(input.brief.description + " " + (input.brief.screenPurposes.map((s) => s.purpose).join(" ")));
    v17Block = `V17 PRODUCT CONTEXT: ${ctxStr}\nV17 SCREEN INTENTS:${input.wireframe.screens.map((s) => {
      const sections = s.blocks.map((b) => `${b.block}:${b.variant ?? "default"}`);
      return `\n  ${s.id} — job: ${s.purpose}, structure: ${s.archetype ?? "auto"}, sections: [${sections.join(", ")}], nav: ${s.nav}`;
    }).join("")}`;
    v17AuditBlock = v17Issues.length > 0
      ? `V17 DETERMINISTIC GATE (already blocked):\n${v17Issues.map((i) => `- [${i.severity}] ${i.category}: ${i.description}`).join("\n")}`
      : "V17 DETERMINISTIC GATE: all structural and contextual checks passed.";
  }

  const brandKitBlock = input.brandKit
    ? `BRAND KIT (authoritative palette, radius, and typography rules):\n${JSON.stringify(input.brandKit, null, 2)}`
    : "";

  const user = `PRODUCT BRIEF:\n${JSON.stringify({ title: input.brief.title, productType: input.brief.productType, mode: input.brief.mode ?? "track", productContext, description: input.brief.description, features: input.brief.features, screenPurposes: input.brief.screenPurposes }, null, 2)}\n\n${input.companyBlock}\n\n${input.megadesign}\n\n${targetBlock}\n\n${brandKitBlock}\n\n${v17Block}\n\n${v17AuditBlock}\n\n${geometryBlock}\n\n${screensBlock}\n\n${dataBlock}\n\n${copyBlock}\n\n${uxBlock}\n\nRELEVANCE RULE: judge whether on-screen content matches the product's domain.\n\nMODE RULE (V16): the product contract and screen intent are authoritative. Flag any section, vocabulary, or dominant moment that is not justified by the product mode as HIGH.\n\nV17 CONTEXT RULE: product context (${productContext}) is authoritative. Landing/marketing composition on an app screen, detail-as-card-stack, tabbar/footer on desktop, and default blue/indigo accent are HIGH defects.\n\nV17 BLOCKING DEFECTS: flag landing page composition on app screens, detail as generic card stack, tabbar/footer on desktop, large empty gaps, inconsistent palette, outline-only sections, sparse data, and missing primary action as HIGH.\n\nVERIFIED FILES (compiled by the sandbox — judge ONLY these):\n${(input.verifiedFiles?.length ? input.verifiedFiles.join("\n") : "none")}\n\nVERIFICATION ERRORS (from the sandbox — treat as blocking, already counted):\n${input.verificationErrors.length ? input.verificationErrors.join("\n") : "none"}\n\nGENERATED FILES (verified ones in full):\n${filesBlock}\n\nEmit the review verdict as JSON: { "passed": boolean, "score": 0-100, "decision": "APPROVE"|"RETURN_TO_BUILDER", "requiredFixes": string[], "issues": [{ "target", "severity", "category", "description", "confidence": 0-1 }], "summary" }`;

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
    console.warn("[pastel v17] static review failed:", err instanceof Error ? err.message : err);
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

V17 BLOCKING DEFECTS (always HIGH in visual review):
- Landing/marketing page composition on an app screen.
- Detail screen as a stack of generic cards with no dominant moment.
- Tabbar or footer on desktop app screens.
- Large empty vertical gaps (>3 rem) without content.
- Inconsistent palette or default blue/indigo accent.
- Sections only separated by light gray outlines instead of surface treatments.
- Sparse data rendering (empty-looking rows where data should exist).
- Missing primary action button or affordance.

Rules:
- Fixes must target a screen file by name (the screenshot name) with a concrete change.
- Cite the visual evidence and expected screen intent for every issue.
- Distinguish a real defect from intentional empty space or a brand-specific choice.
- decision: APPROVE only when all screens are on-brand, complete, and polished.
- Output ONLY valid JSON. The issue shape is { target, severity, category, description, confidence? }.`;

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
    text: `PRODUCT BRIEF:\n${JSON.stringify({ title: input.brief.title, productType: input.brief.productType, description: input.brief.description, features: input.brief.features }, null, 2)}\n\nSCREENSHOTS: ${input.screenshotNames.join(", ")}\n\nSCREEN CONTEXT (what each screenshot must show):\n${perScreen}\n\n${input.companyBlock}\n\n${input.megadesign}\n\n${productReferenceText}\n\nREFERENCE IMAGERY (${refNames.join(", ") || "none shipped"}): company imagery is optional visual context; product requirements and screen intent are authoritative.\n\n${reviewV14Checklist()}\n\nV17 BLOCKING DEFECTS: flag landing page composition on app screens, detail as generic card stack, tabbar/footer on desktop, large empty gaps, inconsistent palette, outline-only sections, sparse data, and missing primary action as HIGH.\n\nReview the rendered screenshots above against the brief, the design language, the screen context, and the reference imagery. Judge dominant moment, layout proportions, surface hierarchy, spacing rhythm, content density, action placement, and responsive intent. Reject any structure not supported by the brief or screen intent. Emit the verdict as JSON: { "passed": boolean, "score": 0-100, "decision": "APPROVE"|"RETURN_TO_BUILDER", "requiredFixes": string[], "issues": [{ "target" (a screen file), "severity", "category", "description" }], "summary" }`,
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
    console.warn("[pastel v17] visual review failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

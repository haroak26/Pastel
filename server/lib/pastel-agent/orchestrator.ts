import fs from "node:fs";
import path from "node:path";
import { emitEvent, updateRun, persistFile, persistDoc, mergeManifest } from "./run-store";
import type { PastelPhase, PhaseStatus, AgentManifest, VisualReference } from "./types";
import type { UsageRecord } from "./gateway";
import { ledgerFromUsage } from "./lib/ledger";
import * as creditService from "../credit-service";
import type { ProductBrief, WireframePlan, ComponentInventory, CopyPlan, ResolvedTheme, V6ReviewResult, UxDesignPlan, DesignTokens, VisualIntent, V21LayoutPlan, ComponentUISpec } from "./schemas";
import { compileCompanyBlock, megadesignBlock, loadCompanyDoc, selectCompanyReferences, compileDesignKnowledge } from "./knowledge/index";
import { compileStyles, compileStylesForRun } from "./compile";
import type { MockDataset } from "./lib/content";
import { generateCompositionSummary } from "./compose";
import { auditFiles, type GateReport } from "./checks/audit";
import { auditContent } from "./checks/content";
import { auditScreenComposition } from "./checks/review";
import { auditGeometry, geometryPasses } from "./checks/geometry";
import { buildPreviewHtml } from "./screenshots";
import { buildV16DesignPlan, enforceV16Plan, auditV16Review } from "./contract";
import { lintAllGeneratedFiles } from "./checks/lint";

/**
 * Pastel Agent V20 — model-driven pipeline with hard-fail on degradation.
 *
 * discovery → design → brief → data+copy (merged) → wireframe+ux (merged) →
 * build (parallel planner+builder) → assemble (model composer only) →
 * present → review (gates + vision) → bounded repair.
 *
 * V20: removes all silent fallback paths. The model screen composer is the
 * ONLY layout path. The builder produces EVERY component — base components
 * are reference templates only, never shipped verbatim. Merged DATA+COPY
 * and WIREFRAME+UX stages eliminate redundant JSON handoffs. On failure,
 * retries with improved context before hard-failing — no silent degradation.
 */

export type V6Phase = "discovery" | "design" | "brief" | "data" | "wireframe" | "build" | "assemble" | "review" | "present";

export interface V6RunState {
  runId: string;
  prompt: string;
  answers: Record<string, string>;
  projectId: string | null;
  userId?: string;
  holdId?: string;
  holdAmount?: number;
  maxCredits: number;
  visualReference?: VisualReference;

  brief: ProductBrief | null;
  /** V14: the run's own design system (design agent, before the brief). */
  designTokens: DesignTokens | null;
  /** V15: the run's art direction — style axes the composer interprets. */
  visualIntent: VisualIntent | null;
  /** Top-scored company used as the token hint (never the law). */
  hintCompanySlug: string | null;
  attachedCompanies: string[];
  wireframe: WireframePlan | null;
  inventory: ComponentInventory | null;
  /** V9 UX design plan — the composer consumes it, the review judges it. */
  ux: UxDesignPlan | null;
  /** V21 deterministic placement plan — the composer fills it exactly. */
  layoutPlan: V21LayoutPlan | null;
  /** V22: planner specs keyed by component name — the prop-binding gate
   * (checks/props.ts) verifies every mounted component got its required
   * props, so "pass real data" is enforced, not just prompted. */
  componentSpecs: Record<string, ComponentUISpec>;
  copy: CopyPlan | null;
  theme: ResolvedTheme | null;
  data: MockDataset | null;
  styles: string;
  fontFamilies: string[];

  generatedFiles: Record<string, string>;
  bundles: Record<string, string>;
  generatedScreens: string[];
  failedScreens: string[];
  sandboxErrors: Array<{ file?: string; message: string }>;
  screenshots: string[];
  screenshotNames: string[];

  gateReport: GateReport | null;
  reviewResult: V6ReviewResult | null;
  visualReviewResult: V6ReviewResult | null;
  repairCycles: number;
  /** V20: retry counts for screen composer failures (max 2). */
  composerRetries: Record<string, number>;

  costs: UsageRecord[];
  /** V22: a run that exhausted the repair budget and still fails review
   * reports done_needs_review — never "done" identically to a passing run. */
  status: "running" | "done" | "done_needs_review" | "error";
  error: string | null;

  /** V10: per-screen DOM-geometry audits (layout law) — feed the gate. */
  geometryReports: Record<string, import("./checks/geometry").GeometryReport>;
}

const MAX_REPAIR_CYCLES = Number(process.env.PASTEL_MAX_REPAIR_CYCLES) || 2;
const MAX_COMPOSER_RETRIES = 2;

/** Per-run spend ceiling: the chargeable hold when present, else maxCredits.
 * Repair and every build batch stop at this line — never spend silently more
 * than the user is charged. */
function chargeCeiling(s: V6RunState): number {
  return s.holdAmount !== undefined ? Math.max(s.holdAmount, s.maxCredits) : s.maxCredits;
}

function createState(opts: {
  runId: string;
  prompt: string;
  answers: Record<string, string>;
  projectId: string | null;
  userId?: string;
  holdId?: string;
  holdAmount?: number;
  maxCredits: number;
  visualReference?: VisualReference;
}): V6RunState {
  return {
    runId: opts.runId,
    prompt: opts.prompt,
    answers: opts.answers,
    projectId: opts.projectId,
    userId: opts.userId,
    holdId: opts.holdId,
    holdAmount: opts.holdAmount,
    maxCredits: opts.maxCredits,
    visualReference: opts.visualReference,
    brief: null,
    designTokens: null,
    visualIntent: null,
    hintCompanySlug: null,
    attachedCompanies: [],
    wireframe: null,
    inventory: null,
    ux: null,
    layoutPlan: null,
    componentSpecs: {},
    copy: null,
    theme: null,
    data: null,
    styles: "",
    fontFamilies: [],
    generatedFiles: {},
    bundles: {},
    generatedScreens: [],
    failedScreens: [],
    sandboxErrors: [],
    screenshots: [],
    screenshotNames: [],
    gateReport: null,
    reviewResult: null,
    visualReviewResult: null,
    repairCycles: 0,
    costs: [],
    status: "running",
    error: null,
    geometryReports: {},
    composerRetries: {},
  };
}

function usageHook(s: V6RunState) {
  return (rec: UsageRecord) => {
    s.costs.push(rec);
  };
}

function emitActivity(runId: string, message: string) {
  emitEvent(runId, { type: "activity", message });
}

function setPhase(s: V6RunState, phase: PastelPhase, status: PhaseStatus, message?: string) {
  emitEvent(s.runId, { type: "phase", phase, status });
  if (message) emitActivity(s.runId, message);
}

async function persistJsonDoc(runId: string, path: string, title: string, kind: string, value: unknown): Promise<void> {
  try {
    const content = JSON.stringify(value, null, 2);
    await persistDoc(runId, { path, title, kind, content });
    emitEvent(runId, { type: "doc", doc: { path, title, kind, content } });
  } catch (err) {
    console.warn(`[pastel v6] failed to persist doc ${path}:`, err instanceof Error ? err.message : err);
  }
}

async function persistDocRaw(runId: string, path: string, title: string, kind: string, content: string): Promise<void> {
  try {
    await persistDoc(runId, { path, title, kind, content });
    emitEvent(runId, { type: "doc", doc: { path, title, kind, content } });
  } catch (err) {
    console.warn(`[pastel v6] failed to persist doc ${path}:`, err instanceof Error ? err.message : err);
  }
}

async function persistGeneratedFile(runId: string, path: string, content: string): Promise<void> {
  const kind = path.startsWith("src/screens/") ? "screen"
    : path.startsWith("src/components/") ? "component"
    : path === "src/styles.css" ? "style"
    : path === "src/data.js" ? "data"
    : "build";
  try {
    await persistFile(runId, { path, kind, content });
    emitEvent(runId, { type: "file", file: { path, kind, content } });
  } catch (err) {
    console.warn(`[pastel v6] failed to persist file ${path}:`, err instanceof Error ? err.message : err);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════════

export async function startAgentLoop(
  runId: string,
  prompt: string,
  answers: Record<string, string>,
  projectId?: string,
  holdId?: string,
  userId?: string,
  opts?: { maxCredits?: number; holdAmount?: number; visualReference?: VisualReference },
): Promise<void> {
  const s = createState({
    runId, prompt, answers,
    projectId: projectId ?? null, userId,
    holdId, holdAmount: opts?.holdAmount,
    maxCredits: opts?.maxCredits ?? 45,
    visualReference: opts?.visualReference,
  });
  const onUsage = usageHook(s);

  try {
    // Clarify already ran in the UI — discovery is complete at run start.
    setPhase(s, "discovery", "done", "Discovery complete — inspiration selected");

    // ══ STAGE 0.5: DESIGN (V14 — the token system, BEFORE the brief) ══
    setPhase(s, "design", "running", "Designing the token system — brand colors, radius, sizing, and fonts…");
    const { runDesign } = await import("./agents/design");
    const references = await selectCompanyReferences(prompt, "track", answers.inspiration?.trim().toLowerCase());
    const hintManifest = references.primary.manifest;
    if (hintManifest) {
      s.hintCompanySlug = hintManifest.slug;
      const designOut = await runDesign({ prompt, answers, hintManifest, visualReference: s.visualReference, onUsage });
      s.designTokens = designOut.tokens;
      s.theme = designOut.theme;
      s.visualIntent = designOut.visual;
      emitActivity(runId, `Design tokens + visual intent created (hint: ${hintManifest.name})${designOut.usedFallback ? " — deterministic fallback" : ""}`);
      for (const note of designOut.notes) emitActivity(runId, note);
    } else {
      // No registered company at all (should never happen) — pick the first
      // registered company so the run can continue with a real manifest.
      const { listCompanySlugs } = await import("./knowledge/index");
      const firstSlug = listCompanySlugs()[0];
      if (!firstSlug) throw new Error("no registered companies available for the design hint");
      const { loadCompany: loadAny } = await import("./knowledge/index");
      const neutral = await loadAny(firstSlug);
      const designOut = await runDesign({ prompt, answers, hintManifest: neutral, visualReference: s.visualReference, onUsage });
      s.designTokens = designOut.tokens;
      s.theme = designOut.theme;
      s.visualIntent = designOut.visual;
    }
    const { css, fontFamilies } = compileStyles(s.theme);
    s.styles = css;
    s.fontFamilies = fontFamilies;
    await persistJsonDoc(runId, "docs/design/DesignTokens.json", "Design Tokens", "design-tokens", s.designTokens);
    await persistJsonDoc(runId, "docs/design/VisualIntent.json", "Visual Intent", "visual-intent", s.visualIntent);
    await persistDocRaw(runId, "docs/design/V16DesignKnowledge.md", "V16 Design Knowledge", "design-knowledge", compileDesignKnowledge(references.primary, references.secondary, references.capabilities));
    setPhase(s, "design", "done");

    // ══ STAGE 1: BRIEF ══
    setPhase(s, "brief", "running", "Building the product brief and attaching design references…");
    const { runBrief } = await import("./agents/brief");
    const { brief, attachedCompanies } = await runBrief({ prompt, answers, visualReference: s.visualReference, onUsage });
    s.brief = brief;
    s.attachedCompanies = attachedCompanies;
    const productReferences = await selectCompanyReferences(prompt, brief.mode ?? "track", brief.inspiration.primary);

    await updateRun(runId, { title: brief.title });
    emitEvent(runId, { type: "title", title: brief.title });
    emitActivity(runId, `${brief.title} — ${brief.productType} · inspired by ${brief.inspiration.primary} · ${brief.screenPurposes.length} screens`);

    await persistJsonDoc(runId, "docs/brief/ProductBrief.json", "Product Brief", "brief", brief);

    // Attach megadesign.md + company design.md(s) as run docs.
    await persistDocRaw(runId, "docs/design/megadesign.md", "Megadesign — Universal Design Law", "megadesign", await megadesignBlock());
    for (const slug of attachedCompanies) {
      const doc = await loadCompanyDoc(slug);
      if (doc) await persistDocRaw(runId, `docs/design/${slug}.md`, `${slug} — Design Reference`, "company-design", doc);
    }
    setPhase(s, "brief", "done");

    // ══ STAGE 1b: DATA + COPY (V20 merged — one model call, no handoff failure) ══
    setPhase(s, "data", "running", "Writing the product's content and copy — metrics, items, copy data…");
    const { runData } = await import("./agents/data");
    const { runCopy } = await import("./agents/copy");
    const dataOut = await runData({ brief, seed: prompt + runId, onUsage });
    s.data = dataOut.data;
    if (dataOut.usedFallback) emitActivity(runId, "Content: deterministic domain-pack fallback used");
    for (const note of dataOut.notes) emitActivity(runId, note);
    await persistJsonDoc(runId, "docs/planning/DataPlan.json", "Content & Data Plan", "data-plan", {
      domain: s.data.domain,
      people: s.data.people,
      metrics: s.data.metrics,
      series: s.data.series,
      rows: s.data.rows,
      activity: s.data.activity,
      detailFields: s.data.detailFields,
      detailValues: s.data.detailValues,
      settingsSections: s.data.settingsSections,
      searchPlaceholder: s.data.searchPlaceholder,
      emptyTitle: s.data.emptyTitle,
      emptyBody: s.data.emptyBody,
      reviews: s.data.reviews,
      reviewHeading: s.data.reviewHeading,
      trustItems: s.data.trustItems,
      primaryCta: s.data.primaryCta,
      homeCta: s.data.homeCta,
      priceSuffix: s.data.priceSuffix,
    });
    emitActivity(runId, `Content written — ${s.data.rows.length} items · ${s.data.reviews.length} reviews · ${s.data.metrics.length} metrics (${s.data.domain} domain)`);
    setPhase(s, "data", "done");


    // ══ STAGE 2: WIREFRAME ══
    setPhase(s, "wireframe", "running", "Producing wireframes and the component inventory…");
    const { runWireframe } = await import("./agents/wireframe");
    const wireframeOut = await runWireframe({ brief, visualReference: s.visualReference, onUsage });
    const v16 = enforceV16Plan(
      brief,
      wireframeOut.plan,
      wireframeOut.inventory,
      buildV16DesignPlan(brief, productReferences.capabilities.map((c) => c.id)),
    );
    s.wireframe = v16.plan;
    s.inventory = v16.inventory;
    const activeWireframe = v16.plan;
    const activeInventory = v16.inventory;
    for (const note of v16.notes) emitActivity(runId, note);
    await persistDocRaw(runId, "docs/design/V16ProductContract.md", "V16 Product Contract", "product-contract", JSON.stringify(v16.design, null, 2));
    if (wireframeOut.usedFallback.length > 0) emitActivity(runId, `Used deterministic fallback for: ${wireframeOut.usedFallback.join(", ")}`);
    for (const note of wireframeOut.notes ?? []) emitActivity(runId, note);

    await persistJsonDoc(runId, "docs/planning/WireframePlan.json", "Wireframe Plan", "wireframe-plan", activeWireframe);
    await persistJsonDoc(runId, "docs/planning/ComponentInventory.json", "Component Inventory", "component-inventory", activeInventory);
    emitActivity(runId, `${activeWireframe.screens.length} screens wired · ${activeInventory.components.length} components planned`);
    setPhase(s, "wireframe", "done");

    // ══ STAGE 2b: UX DESIGN + COPY (V20 — merge wireframe-dependent stages) ══
    setPhase(s, "wireframe", "running", "Designing UX layout and writing product copy…");

    const { runUx } = await import("./agents/ux");
    const uxOut = await runUx({ brief, wireframe: activeWireframe, inventory: activeInventory, theme: s.theme!, data: s.data!, visual: s.visualIntent, visualReference: s.visualReference, onUsage });
    s.ux = uxOut.ux;
    if (uxOut.usedFallback) emitActivity(runId, "UX design: canonical layout used (model refinement unavailable)");
    for (const sc of s.ux.screens) if (sc.notes) emitActivity(runId, `UX ${sc.screenId}: ${sc.notes}`);
    await persistJsonDoc(runId, "docs/planning/UXDesign.json", "UX Design", "ux-design", s.ux);

    const copy = await runCopy({ brief, wireframe: activeWireframe, theme: s.theme!, data: s.data!, onUsage });
    s.copy = copy;
    await persistJsonDoc(runId, "docs/planning/CopyPlan.json", "Copy Plan", "copy-plan", copy);
    emitActivity(runId, `Copy plan written — ${copy.screens.length} screen(s)`);

    // V21: deterministic placement plan — the composer fills it exactly.
    const { buildV21LayoutPlan } = await import("./lib/layout-plan");
    s.layoutPlan = buildV21LayoutPlan(activeWireframe, s.ux, s.visualIntent, copy);
    await persistJsonDoc(runId, "docs/planning/LayoutPlan.json", "V21 Layout Plan", "layout-plan", s.layoutPlan);
    emitActivity(runId, "Layout plan derived — placement, headers, and section budget set");
    setPhase(s, "wireframe", "done");

    // ══ STAGE 3: COMPONENTS (planner + builder, parallel) ══
    setPhase(s, "build", "running", "Planning and building components in parallel…");

    const { runPlanner } = await import("./agents/planner");
    const { runBuilder } = await import("./agents/builder");

    // V18: generate a screen composition summary so every builder agent
    // sees the full layout context — what blocks surround it, what surfaces
    // are used, where the dominant moment sits.
    const compositionSummary = generateCompositionSummary(activeWireframe, s.ux, s.visualIntent);

    // Hard budget stop: never spend past the chargeable ceiling mid-build.
    const ceiling = chargeCeiling(s);
    const budgeted = activeInventory.components.filter((item) => {
      if (ledgerFromUsage(s.costs).totalCredits <= ceiling) return true;
      emitActivity(runId, `Budget ceiling reached — skipping ${item.name}`);
      return false;
    });

    const specs = await Promise.all(
      budgeted.map(async (item) => {
        const out = await runPlanner({ item, theme: s.theme!, wireframe: activeWireframe, data: s.data!, onUsage, compositionSummary });
        emitActivity(s.runId, `Planned ${item.name}`);
        return out.spec;
      }),
    );

    // V19: keep specs keyed by name so the screen composer can mount custom
    // components with the EXACT props they declare (v18 passed a fixed
    // items/metrics/people/settings set to every component — wrong for
    // components like HostTrustProfile that declare their own props).
    // V22: also stored on state for the prop-binding gate (checks/props.ts).
    const componentSpecs: Record<string, (typeof specs)[number]> = {};
    for (const spec of specs) componentSpecs[spec.name] = spec;
    s.componentSpecs = componentSpecs;

    const { components } = await runBuilder({
      specs,
      theme: s.theme!,
      wireframe: activeWireframe,
      data: s.data!,
      onUsage,
      onFile: (p) => emitActivity(s.runId, `Built ${p}`),
      visualReference: s.visualReference,
      compositionSummary,
    });
    s.generatedFiles = { ...components };
    s.generatedFiles["src/styles.css"] = s.styles;
    emitActivity(runId, `Built ${Object.keys(components).length} components`);

    for (const [p, content] of Object.entries(s.generatedFiles)) {
      await persistGeneratedFile(runId, p, content);
    }
    setPhase(s, "build", "done");

    // ══ STAGE 4: ASSEMBLE (model composer + sandbox) ══
    setPhase(s, "assemble", "running", "Composing screens with the layout model…");

    const { composeAllV20 } = await import("./compose");
    const companyBlock = await compileCompanyBlock(brief.inspiration.primary).catch(() => "");

    let composed = await composeAllV20({
      brief,
      wireframe: activeWireframe,
      inventory: activeInventory,
      copy: s.copy!,
      theme: s.theme!,
      data: s.data!,
      ux: s.ux,
      visual: s.visualIntent,
      builtComponents: components,
      componentSpecs,
      companyBlock,
      layoutPlan: s.layoutPlan,
      visualReference: s.visualReference,
      onUsage,
    });

    // V20 retry loop: retry failed composer screens with more directive context.
    for (let retry = 0; retry < MAX_COMPOSER_RETRIES && composed.failedScreens.length > 0; retry++) {
      emitActivity(runId, `Screen composer retry ${retry + 1}/${MAX_COMPOSER_RETRIES} for: ${composed.failedScreens.join(", ")}`);
      setPhase(s, "assemble", "running", `Retrying layout for ${composed.failedScreens.length} screen(s)…`);

      // Track which screens failed so the composer model gets targeted feedback.
      const retryFailedScreens = [...composed.failedScreens];
      s.composerRetries = s.composerRetries ?? {};
      for (const sid of retryFailedScreens) {
        s.composerRetries[sid] = (s.composerRetries[sid] ?? 0) + 1;
      }

      const retried = await composeAllV20({
        brief,
        wireframe: activeWireframe,
        inventory: activeInventory,
        copy: s.copy!,
        theme: s.theme!,
        data: s.data!,
        ux: s.ux,
        visual: s.visualIntent,
        builtComponents: components,
        componentSpecs,
        companyBlock,
        layoutPlan: s.layoutPlan,
        visualReference: s.visualReference,
        onUsage,
        // V20: feed the rejection reasons back so the retry is directive.
        retryNotes: retryFailedScreens
          .map((sid) => composed.errors?.[sid] ?? `previous layout for ${sid} was rejected`)
          .filter((n): n is string => Boolean(n)),
      });

      // Merge: keep files from the retry that succeeded, preserve originals for still-failed.
      for (const screen of activeWireframe.screens) {
        const path = `src/screens/${screen.id}.jsx`;
        if (retried.files[path]) {
          composed.files[path] = retried.files[path];
        }
      }
      for (const [p, code] of Object.entries(retried.primitives)) {
        if (!composed.primitives[p]) {
          composed.primitives[p] = code;
        }
      }
      for (const sid of composed.failedScreens) {
        if (!retried.failedScreens.includes(sid)) {
          composed.failedScreens = composed.failedScreens.filter((f) => f !== sid);
          delete composed.errors?.[sid];
        }
      }
    }

    // V20 hard-fail: if screens still failed after retries, fail the run.
    if (composed.failedScreens.length > 0) {
      const msg = `Screen composer failed after ${MAX_COMPOSER_RETRIES} retries for: ${composed.failedScreens.join(", ")}. The model could not produce valid layouts — refine the product brief and retry.`;
      emitActivity(runId, msg);
      s.status = "error";
      s.error = msg;
      await updateRun(runId, { status: "error", error: s.error });
      emitEvent(runId, { type: "error", message: s.error });
      await settleCredits(s);
      return;
    }

    s.generatedFiles = { ...s.generatedFiles, ...composed.files };
    for (const [p, code] of Object.entries(composed.primitives)) {
      if (!s.generatedFiles[p]) s.generatedFiles[p] = code;
    }
    s.generatedFiles["src/styles.css"] = s.styles;

    for (const [p, content] of Object.entries(s.generatedFiles)) {
      await persistGeneratedFile(runId, p, content);
    }
    emitActivity(runId, `Assembled ${activeWireframe.screens.length} screens from ${Object.keys(components).length} components`);

    // V20 lint pass: scan generated files for anti-slop violations and auto-fix them.
    const lintResult = lintAllGeneratedFiles(s.generatedFiles);
    if (lintResult.issues.length > 0) {
      const high = lintResult.issues.filter((i) => i.severity === "high").length;
      const autoFixed = lintResult.issues.filter((i) => i.autoFixed).length;
      emitActivity(runId, `Lint: ${lintResult.issues.length} issue(s) (${high} high, ${autoFixed} auto-fixed)`);
    }
    if (Object.keys(lintResult.fixedFiles).length > 0) {
      for (const [p, code] of Object.entries(lintResult.fixedFiles)) {
        s.generatedFiles[p] = code;
        await persistGeneratedFile(runId, p, code);
      }
      emitActivity(runId, `Lint: auto-fixed ${Object.keys(lintResult.fixedFiles).length} file(s)`);
    }

    // Sandbox verification + screenshots happen inside the assemble stage.
    emitActivity(runId, "Verifying builds in the sandbox…");
    await runVerification(s);

    // V20 quality floor: hard-fail if every screen failed sandbox verification.
    if (s.failedScreens.length === activeWireframe.screens.length) {
      const msg = `All ${activeWireframe.screens.length} screens failed sandbox verification — check the builder output for import or syntax errors.`;
      emitActivity(runId, msg);
      s.status = "error";
      s.error = msg;
      await updateRun(runId, { status: "error", error: s.error });
      emitEvent(runId, { type: "error", message: s.error });
      await settleCredits(s);
      return;
    }
    setPhase(s, "assemble", "done");

    // ══ V20 QUALITY FLOOR — hard-fail if output is too degraded ══
    const { isShellComponent } = await import("./agents/planner");
    const customCompCount = specs.filter((s) => !isShellComponent(s.name)).length;
    const screenCount = s.generatedScreens.length;
    if (customCompCount < 2) {
      const msg = `Built only ${customCompCount} custom components (minimum 2 required). The builder could not produce enough custom components — refine the product brief and retry.`;
      emitActivity(runId, msg);
      s.status = "error";
      s.error = msg;
      await updateRun(runId, { status: "error", error: s.error });
      emitEvent(runId, { type: "error", message: s.error });
      await settleCredits(s);
      return;
    }
    if (screenCount < 2) {
      const msg = `${screenCount} screen(s) passed sandbox verification (minimum 2 required). Check the builder output and screen composition for errors.`;
      emitActivity(runId, msg);
      s.status = "error";
      s.error = msg;
      await updateRun(runId, { status: "error", error: s.error });
      emitEvent(runId, { type: "error", message: s.error });
      await settleCredits(s);
      return;
    }

    // ══ STAGE 5: PRESENT (screens go live to the user before review) ══
    setPhase(s, "present", "running", "Presenting your screens — quality review runs next…");
    emitEvent(s.runId, { type: "screens", screens: s.generatedScreens });
    await mergeManifest(s.runId, {
      screens: s.generatedScreens,
      failedScreens: s.failedScreens,
      phases: { present: "done" },
    });
    emitActivity(runId, `Presented ${s.generatedScreens.length} screen(s) — starting quality review`);
    setPhase(s, "present", "done");

    // ══ STAGE 6: REVIEW ══
    setPhase(s, "review", "running", "Running the quality gate and visual review…");
    await runGate(s);
    await runModelReview(s, onUsage);

    // ══ REPAIR LOOP (bounded) ══
    while (
      s.repairCycles < MAX_REPAIR_CYCLES &&
      (!s.reviewResult?.passed || s.failedScreens.length > 0)
    ) {
      if (ledgerFromUsage(s.costs).totalCredits > chargeCeiling(s)) {
        emitActivity(runId, "Budget ceiling reached — skipping repair");
        break;
      }
      s.repairCycles++;
      emitActivity(runId, `Repair ${s.repairCycles}/${MAX_REPAIR_CYCLES}…`);
      setPhase(s, "build", "running");
      await runRepairRound(s);
      setPhase(s, "build", "done");
      setPhase(s, "assemble", "running", "Re-verifying…");
      await runVerification(s);
      setPhase(s, "assemble", "done");
      setPhase(s, "review", "running", "Re-running the quality gate…");
      await runGate(s);
      await runModelReview(s, onUsage);
    }

    // ══ DONE ══
    // V22: failed-QA output is NOT a clean pass. When the repair budget is
    // exhausted and review still fails, surface a distinct status so the UI
    // can tell a shipped-but-broken run apart from a passing one.
    s.status = s.reviewResult?.passed ? "done" : "done_needs_review";
    const costs = ledgerFromUsage(s.costs);
    emitActivity(runId, `Run cost: $${costs.totalDollars.toFixed(4)} (${costs.totalCredits.toFixed(2)} credits) across ${costs.entries.length} model call(s)`);
    if (s.status === "done_needs_review") emitActivity(runId, "Review did not pass after all repair cycles — run marked done_needs_review (shipped but QA-failed).");

    const manifestOut: AgentManifest & Record<string, unknown> = {
      screens: s.generatedScreens,
      docs: [
        "docs/brief/ProductBrief.json",
        "docs/design/DesignTokens.json",
        "docs/design/VisualIntent.json",
        "docs/design/megadesign.md",
        ...s.attachedCompanies.map((c) => `docs/design/${c}.md`),
        "docs/planning/DataPlan.json",
        "docs/planning/WireframePlan.json",
        "docs/planning/ComponentInventory.json",
        "docs/planning/UXDesign.json",
        "docs/planning/CopyPlan.json",
        "docs/review/ReviewResult.json",
      ],
      brandKit: s.designTokens
        ? {
            colors: Object.fromEntries(Object.entries(s.designTokens.colors).filter(([k]) => k !== "chart")) as Record<string, string>,
            fonts: { ...s.designTokens.fonts },
            sizes: { sectionPaddingY: String(s.designTokens.sectionPaddingY), sectionGap: String(s.designTokens.sectionGap) },
            radius: Object.fromEntries(Object.entries(s.designTokens.radius).map(([k, v]) => [k, `${v}px`])) as Record<string, string>,
          }
        : null,
      visualIntent: s.visualIntent,
      styleSeed: s.designTokens ? JSON.stringify(s.designTokens.rationale ?? s.designTokens.mode) : null,
      phases: {
        discovery: "done",
        design: "done",
        brief: "done",
        data: "done",
        wireframe: "done",
        review: s.reviewResult?.passed ? "done" : "error",
        build: "done",
        assemble: s.failedScreens.length === 0 ? "done" : "error",
        present: "done",
      },
      failedScreens: s.failedScreens,
      costs,
      quality: {
        passed: s.reviewResult?.passed ?? false,
        score: s.reviewResult?.score ?? 0,
        repairs: s.repairCycles,
      },
      company: brief.inspiration.primary,
      reviewResult: s.reviewResult,
    };

    await updateRun(runId, {
      status: s.status,
      title: brief.title,
      manifest: manifestOut,
    });

    emitEvent(runId, {
      type: "done",
      result: {
        screens: s.generatedScreens,
        docs: [],
        brandKit: null,
        failedScreens: s.failedScreens,
      },
    });
    await settleCredits(s);
  } catch (err) {
    s.status = "error";
    s.error = err instanceof Error ? err.message : String(err);
    console.error("[pastel v6] run failed:", s.error);
    await updateRun(runId, { status: "error", error: s.error });
    emitEvent(runId, { type: "error", message: s.error });
    await settleCredits(s);
  }
}

// ── Verification + render ─────────────────────────────────────────────────

async function runVerification(s: V6RunState): Promise<void> {
  const { IncrementalScreenVerifier } = await import("./sandbox");
  const verifier: InstanceType<typeof IncrementalScreenVerifier> = (s as any).verifier ?? new IncrementalScreenVerifier();
  (s as any).verifier = verifier;
  const result = await verifier.verify(s.generatedFiles);
  s.bundles = result.bundles;
  s.generatedScreens = Object.keys(result.bundles);
  s.sandboxErrors = result.errors;
  s.failedScreens = result.errors.map((e) => e.file ?? e.message).filter(Boolean);

  for (const err of result.errors.slice(0, 5)) {
    emitActivity(s.runId, `Sandbox error — ${err.file ?? "project"}: ${err.message.slice(0, 160)}`);
  }
  emitActivity(s.runId, `${s.generatedScreens.length} screen(s) verified${s.failedScreens.length ? `, ${s.failedScreens.length} failed` : ""}`);

  for (const [name, js] of Object.entries(s.bundles)) {
    await persistGeneratedFile(s.runId, `.build/${name}.js`, js);
  }

  // V22: regenerate the stylesheet WITH opacity coverage for whatever classes
  // this run's files actually use (bg-accent/20, bg-muted/50, …). The Tailwind
  // CDN can't alpha-blend the semantic CSS vars, so without this the velocity
  // chart bars and tonal bands render fully transparent. Recomputing per
  // verification keeps coverage in sync across repair rounds.
  const { css: runCss, fontFamilies } = compileStylesForRun(s.theme!, s.generatedFiles);
  s.styles = runCss;
  s.fontFamilies = fontFamilies;
  s.generatedFiles["src/styles.css"] = s.styles;
  await persistGeneratedFile(s.runId, "src/styles.css", s.styles);

  s.screenshots = [];
  s.screenshotNames = [];
  try {
    const { chromium } = await import("playwright-core");
    const executable = findChromium();
    if (executable) {
      const browser = await chromium.launch({
        headless: true,
        executablePath: executable,
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      });
      try {
        for (const [name, bundle] of Object.entries(s.bundles)) {
          const html = buildPreviewHtml(name, bundle, s.styles, s.fontFamilies);
          const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
          try {
            await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
            await page.waitForFunction(() => Boolean((window as any).__pastelMounted), undefined, { timeout: 15000 }).catch(() => {});
            await page.evaluate(() => (document as any).fonts?.ready.then(() => true)).catch(() => {});
            await page.waitForTimeout(300);
            const geo = await auditGeometry(page, {
              fontFamilies: s.fontFamilies,
              // V11: the dominant-moment floor is the theme's 4xl size
              // (brands like Linear run small on purpose).
              heroScalePx: parseFloat(s.theme?.cssVars?.["--text-4xl"] ?? "36"),
            });
            s.geometryReports[name] = geo;
            const { ok, reasons } = geometryPasses(geo);
            if (!ok) emitActivity(s.runId, `Geometry ${name}: ${reasons.join(", ")}`);
            const png = await page.screenshot({ type: "png", fullPage: true });
            s.screenshots.push(`data:image/png;base64,${png.toString("base64")}`);
            s.screenshotNames.push(name);
          } finally {
            await page.close();
          }
        }
      } finally {
        await browser.close();
      }
    }
  } catch (err) {
    emitActivity(s.runId, `Render/geometry pass unavailable (${err instanceof Error ? err.message : String(err)})`);
  }
}

function findChromium(): string | undefined {
  const candidates: Array<string | undefined> = [
    process.env.PASTEL_CHROMIUM_PATH,
    process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  const pathDirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const name of ["chromium", "chromium-browser", "google-chrome", "chrome", "headless_shell"]) {
    for (const dir of pathDirs) candidates.push(path.join(dir, name));
  }
  for (const c of candidates) {
    if (!c) continue;
    try { fs.accessSync(c, fs.constants.X_OK); return c; } catch { /* next */ }
  }
  return undefined;
}

// ── Gate + model review ────────────────────────────────────────────────────

async function runGate(s: V6RunState): Promise<void> {
  const codeGate = auditFiles(s.theme!, s.generatedFiles);
  const issues = [...codeGate.issues];

  if (s.data) {
    issues.push(...auditContent(s.data, s.generatedFiles));
  }

  // V14: screen-composition audit — duplicate components on a screen,
  // components planned for a screen that no custom block mounts.
  if (s.wireframe && s.inventory) {
    issues.push(...auditScreenComposition(s.wireframe, s.inventory));
  }

  if (s.sandboxErrors.length > 0) {
    for (const e of s.sandboxErrors) {
      const target = e.file && s.generatedFiles[e.file] ? e.file : s.generatedScreens[0] ?? "project";
      issues.push({
        file: target,
        severity: "high",
        category: "state",
        description: `Runtime failure: ${e.message}`,
      });
    }
  }

  if (s.wireframe) {
    issues.push(...auditV16Review(s.brief!, s.wireframe, s.generatedFiles));
  }

  // V21: placement gate — section count cap, SectionHeader presence, custom
  // component budget, and planned split placements against the layout plan.
  if (s.layoutPlan) {
    const { auditV21Layout } = await import("./checks/layout");
    issues.push(...auditV21Layout(s.layoutPlan, s.generatedFiles, s.generatedFiles));
  }

  // V22: prop-binding gate — every mounted custom component must receive the
  // required props its own spec declares (no missing props, no empty arrays).
  if (s.componentSpecs && Object.keys(s.componentSpecs).length > 0) {
    const { auditPropBindings } = await import("./checks/props");
    issues.push(...auditPropBindings(s.componentSpecs, s.generatedFiles));
  }

  // V10: the DOM-geometry audit (layout law) is ground truth — rhythm,
  // whitespace, hero-scale hierarchy, overflow, overlaps. These are
  // file-targeted so the repair loop can fix them.
  for (const [name, geo] of Object.entries(s.geometryReports ?? {})) {
    const file = s.generatedFiles[`src/screens/${name}.jsx`] ? `src/screens/${name}.jsx` : name;
    const push = (severity: "high" | "medium", category: string, description: string) => {
      if (!issues.some((i) => i.file === file && i.description === description)) {
        issues.push({ file, severity, category, description });
      }
    };
    if (geo.overflow) push("high", "layout", "Horizontal overflow detected on the rendered screen");
    if (geo.overlaps.length > 0) push("high", "layout", `${geo.overlaps.length} overlapping element(s) on the rendered screen`);
    if (geo.blanks.length > 0) push("medium", "layout", `${geo.blanks.length} blank section(s) on the rendered screen`);
    if (geo.rhythm.length > 0) push("medium", "layout", `Uneven vertical rhythm: ${geo.rhythm.slice(0, 2).join("; ")}`);
    if (geo.flush.length > 0) push("medium", "layout", `Flush sections with no whitespace: ${geo.flush.slice(0, 2).join("; ")}`);
    if (!geo.heroScale) push("medium", "layout", "No hero-scale type on the page — the dominant moment must be the largest element (reads as a template)");
  }

  const high = issues.filter((i) => i.severity === "high").length;
  const report: GateReport = {
    passed: high === 0,
    score: Math.max(0, 100 - issues.length * 5 - high * 10),
    issues: issues.slice(0, 40),
  };
  s.gateReport = report;
  await persistJsonDoc(s.runId, "docs/review/GateReport.json", "Quality Gate", "gate-report", report);
  emitActivity(s.runId, `Gate: ${report.score}/100 — ${report.passed ? "PASS" : "fixes required"} (${report.issues.length} issue(s))`);
}

async function runModelReview(s: V6RunState, onUsage: (rec: UsageRecord) => void): Promise<void> {
  const { runReview, runVisualReview, mergeReviewResults } = await import("./agents/review");
  const companyBlock = await compileCompanyBlock(s.brief!.inspiration.primary);
  const megadesign = await megadesignBlock();

  // When the sandbox rejected every screen there is nothing truthful for the
  // review model to judge — the gate + sandbox issues ARE the verdict.
  let codeResult: V6ReviewResult;
  if (s.generatedScreens.length === 0) {
    codeResult = {
      passed: false,
      score: 20,
      decision: "RETURN_TO_BUILDER",
      requiredFixes: [],
      issues: [{ target: "project", severity: "high", category: "review", description: "No screens verified by the sandbox — static review skipped (gate + runtime issues are ground truth)." }],
      summary: "No verified screens — model review skipped.",
    };
    emitActivity(s.runId, "Static review skipped — no verified screens to judge");
  } else {
    codeResult = await runReview({
      brief: s.brief!,
      theme: s.theme!,
      companyBlock,
      megadesign,
      generatedFiles: s.generatedFiles,
      verifiedFiles: s.generatedScreens,
      verificationErrors: s.sandboxErrors.map((e) => (e.file ? `${e.file}: ${e.message}` : e.message)),
      copy: s.copy,
      data: s.data,
      ux: s.ux,
      wireframe: s.wireframe,
      inventory: s.inventory,
      geometryReports: s.geometryReports,
      visualReference: s.visualReference,
      onUsage,
    });
  }

  let visualResult: V6ReviewResult | null = null;
  if (s.screenshots.length > 0) {
    try {
      visualResult = await runVisualReview({
        brief: s.brief!,
        theme: s.theme!,
        companyBlock,
        megadesign,
        screenshotNames: s.screenshotNames,
        screenshots: s.screenshots,
        verifiedFiles: s.generatedScreens,
        wireframe: s.wireframe,
        inventory: s.inventory,
        geometryReports: s.geometryReports,
        visualReference: s.visualReference,
        onUsage,
      });
      if (visualResult) emitActivity(s.runId, `Visual review: ${visualResult.score}/100 — ${visualResult.decision}`);
    } catch (err) {
      emitActivity(s.runId, `Visual review skipped (${err instanceof Error ? err.message : String(err)})`);
    }
  } else {
    emitActivity(s.runId, "Visual review skipped — no rendered screenshots available");
  }
  s.visualReviewResult = visualResult;

  const result = mergeReviewResults(codeResult, visualResult, {
    sandboxErrors: s.sandboxErrors,
    generatedFiles: s.generatedFiles,
  });
  s.reviewResult = result;

  emitActivity(s.runId, `Review: ${result.score}/100 — ${result.decision}`);
  await persistJsonDoc(s.runId, "docs/review/ReviewResult.json", "Review Result", "review-result", result);
}

// ── Repair ────────────────────────────────────────────────────────────────

function collectRepairTargets(s: V6RunState): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const issue of s.gateReport?.issues ?? []) {
    const file = issue.file;
    if (!s.generatedFiles[file]) continue;
    map.set(file, [...(map.get(file) ?? []), issue.description]);
  }
  for (const e of s.sandboxErrors) {
    if (!e.file || !s.generatedFiles[e.file]) continue;
    if (!map.has(e.file)) map.set(e.file, []);
    map.get(e.file)!.push(`Runtime failure: ${e.message}`);
  }
  // Model findings are repairable evidence too. Older versions only routed
  // deterministic gate errors, so visual-review defects could be reported but
  // never reach the builder.
  for (const issue of s.reviewResult?.issues ?? []) {
    const raw = issue.target;
    const file = raw.startsWith("src/") ? raw : `src/screens/${raw.replace(/\.(?:jsx|tsx)$/, "")}.jsx`;
    if (!s.generatedFiles[file]) continue;
    const evidence = `${issue.category}: ${issue.description}`;
    map.set(file, [...(map.get(file) ?? []), evidence]);
  }
  // V22: the model review's requiredFixes ARE the actionable repair brief
  // ("src/screens/home.jsx: Replace the generic weekly focus-hours chart…").
  // Route each literal fix string to its target file so the builder receives
  // the exact prescribed change — not a generic "fix issues" instruction.
  for (const fix of s.reviewResult?.requiredFixes ?? []) {
    const m = fix.match(/^(src\/\S+?|[a-z0-9_-]+)\s*:\s*([\s\S]+)$/);
    if (!m) continue;
    const raw = m[1].trim();
    const body = m[2].trim();
    const file = raw.startsWith("src/") ? raw : `src/screens/${raw.replace(/\.(?:jsx|tsx)$/, "")}.jsx`;
    if (s.generatedFiles[file]) {
      map.set(file, [...(map.get(file) ?? []), body]);
    }
  }
  return map;
}

async function runRepairRound(s: V6RunState): Promise<void> {
  const targets = collectRepairTargets(s);
  if (targets.size === 0) {
    emitActivity(s.runId, "Repair: no fixable targets identified");
    return;
  }
  const { repairGeneratedFile } = await import("./agents/builder");
  for (const [path, fixes] of targets) {
    emitActivity(s.runId, `Repairing ${path} (${fixes.length} fix(es))`);
    try {
      const repaired = await repairGeneratedFile({
        path,
        code: s.generatedFiles[path],
        fixes,
        theme: s.theme!,
        onUsage: usageHook(s),
      });
      if (repaired && repaired.trim().length > 0) {
        s.generatedFiles[path] = repaired;
        await persistGeneratedFile(s.runId, path, repaired);
      }
    } catch (err) {
      emitActivity(s.runId, `Repair of ${path} failed (${err instanceof Error ? err.message : String(err)})`);
    }
  }
}

// ── Credits ───────────────────────────────────────────────────────────────

async function settleCredits(s: V6RunState): Promise<void> {
  if (!s.holdId || !s.userId) return;
  try {
    if (s.status !== "done" && s.status !== "done_needs_review") {
      await creditService.releaseHold(s.holdId, 0);
      return;
    }
    const ledger = ledgerFromUsage(s.costs);
    const charge = s.holdAmount !== undefined ? Math.min(ledger.totalCredits, s.holdAmount) : ledger.totalCredits;
    await creditService.releaseHold(s.holdId, Math.round(charge * 100) / 100);
    console.log(`[pastel v6] run ${s.runId}: charged ${charge.toFixed(2)} credits ($${ledger.totalDollars} USD)`);
  } catch (err) {
    console.error("[pastel v6] failed to release credit hold:", err);
  }
}

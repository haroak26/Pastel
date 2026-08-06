import fs from "node:fs";
import path from "node:path";
import { emitEvent, updateRun, persistFile, persistDoc, mergeManifest } from "./run-store";
import type { PastelPhase, PhaseStatus, AgentManifest } from "./types";
import type { UsageRecord } from "./gateway";
import { ledgerFromUsage } from "./lib/ledger";
import * as creditService from "../credit-service";
import type { ProductBrief, WireframePlan, ComponentInventory, CopyPlan, ResolvedTheme, V6ReviewResult, UxDesignPlan } from "./schemas-v6";
import { loadCompany, resolveCompanyTheme, compileCompanyBlock, megadesignBlock, loadCompanyDoc } from "./knowledge/index";
import { compileStyles } from "./compile";
import { mockDataset, type MockDataset } from "./lib/content";
import { composeAll } from "./compose-v6";
import { auditFiles, type GateReport } from "./checks/audit";
import { auditContent } from "./checks/content";
import { auditGeometry, geometryPasses } from "./checks/geometry";
import { buildPreviewHtml } from "./screenshots";

/**
 * Pastel Agent v6 — knowledge-base pipeline.
 *
 * discovery → brief → wireframe → build (parallel) → assemble → present →
 * review (gates + vision).
 *
 * The knowledge base (company design.md + megadesign.md) carries the visual
 * quality; models select, specify, and adapt; code composes, verifies, and
 * gates. Hybrid model tiers keep the parallel component work cheap while the
 * few judgment stages get a mid-tier model.
 */

export type V6Phase = "discovery" | "brief" | "wireframe" | "build" | "assemble" | "review" | "present";

export interface V6RunState {
  runId: string;
  prompt: string;
  answers: Record<string, string>;
  projectId: string | null;
  userId?: string;
  holdId?: string;
  holdAmount?: number;
  maxCredits: number;

  brief: ProductBrief | null;
  attachedCompanies: string[];
  wireframe: WireframePlan | null;
  inventory: ComponentInventory | null;
  /** V9 UX design plan — the composer consumes it, the review judges it. */
  ux: UxDesignPlan | null;
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

  costs: UsageRecord[];
  status: "running" | "done" | "error";
  error: string | null;

  /** V10: per-screen DOM-geometry audits (layout law) — feed the gate. */
  geometryReports: Record<string, import("./checks/geometry").GeometryReport>;
}

const MAX_REPAIR_CYCLES = Number(process.env.PASTEL_MAX_REPAIR_CYCLES) || 2;

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
    brief: null,
    attachedCompanies: [],
    wireframe: null,
    inventory: null,
    ux: null,
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

export async function startAgentLoopV6(
  runId: string,
  prompt: string,
  answers: Record<string, string>,
  projectId?: string,
  holdId?: string,
  userId?: string,
  opts?: { maxCredits?: number; holdAmount?: number },
): Promise<void> {
  const s = createState({
    runId, prompt, answers,
    projectId: projectId ?? null, userId,
    holdId, holdAmount: opts?.holdAmount,
    maxCredits: opts?.maxCredits ?? 25,
  });
  const onUsage = usageHook(s);

  try {
    // Clarify already ran in the UI — discovery is complete at run start.
    setPhase(s, "discovery", "done", "Discovery complete — inspiration selected");

    // ══ STAGE 1: BRIEF ══
    setPhase(s, "brief", "running", "Building the product brief and attaching design references…");
    const { runBrief } = await import("./agents/brief-v6");
    const { brief, attachedCompanies } = await runBrief({ prompt, answers, onUsage });
    s.brief = brief;
    s.attachedCompanies = attachedCompanies;

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

    // ══ STAGE 2: WIREFRAME ══
    setPhase(s, "wireframe", "running", "Producing wireframes and the component inventory…");
    const { runWireframe } = await import("./agents/wireframe-v6");
    const wireframeOut = await runWireframe({ brief, onUsage });
    s.wireframe = wireframeOut.plan;
    s.inventory = wireframeOut.inventory;
    if (wireframeOut.usedFallback.length > 0) emitActivity(runId, `Used deterministic fallback for: ${wireframeOut.usedFallback.join(", ")}`);
    for (const note of wireframeOut.notes ?? []) emitActivity(runId, note);

    await persistJsonDoc(runId, "docs/planning/WireframePlan.json", "Wireframe Plan", "wireframe-plan", s.wireframe);
    await persistJsonDoc(runId, "docs/planning/ComponentInventory.json", "Component Inventory", "component-inventory", s.inventory);
    emitActivity(runId, `${s.wireframe.screens.length} screens wired · ${s.inventory.components.length} components planned`);
    setPhase(s, "wireframe", "done");

    // ══ STAGE 2b: UX DESIGN (canonical layout + model refinement) ══
    // The theme + domain dataset are deterministic and cheap — compute them
    // now so the UX agent can reason about real data, then the composer and
    // the review both consume the UX design plan.
    setPhase(s, "wireframe", "running", "Designing the UX layout — hierarchy, surfaces, and the interaction flow…");
    const manifest = await loadCompany(brief.inspiration.primary);
    const theme = resolveCompanyTheme(manifest, {
      mode: brief.platform === "mobile" && manifest.name === "Spotify" ? "dark" : (answers["mode"] === "dark" ? "dark" : "light"),
      hue: manifest.hueBase,
    });
    s.theme = theme;
    const { css, fontFamilies } = compileStyles(theme);
    s.styles = css;
    s.fontFamilies = fontFamilies;

    // Domain-aware dataset — built once, shared by planner/builder/copy/
    // composer/UX.
    const data = mockDataset(brief, prompt + runId);
    s.data = data;

    const { runUx } = await import("./agents/ux-v6");
    const uxOut = await runUx({ brief, wireframe: s.wireframe!, inventory: s.inventory!, theme, data, onUsage });
    s.ux = uxOut.ux;
    if (uxOut.usedFallback) emitActivity(runId, "UX design: canonical layout used (model refinement unavailable)");
    for (const sc of s.ux.screens) if (sc.notes) emitActivity(runId, `UX ${sc.screenId}: ${sc.notes}`);
    await persistJsonDoc(runId, "docs/planning/UXDesign.json", "UX Design", "ux-design", s.ux);
    setPhase(s, "wireframe", "done");

    // ══ STAGE 3: COMPONENTS (planner + builder, parallel) ══
    setPhase(s, "build", "running", "Planning and building components in parallel…");

    const { runPlanner } = await import("./agents/planner-v6");
    const { runBuilder } = await import("./agents/builder-v6");

    // Hard budget stop: never spend past the chargeable ceiling mid-build.
    const ceiling = chargeCeiling(s);
    const budgeted = s.inventory.components.filter((item) => {
      if (ledgerFromUsage(s.costs).totalCredits <= ceiling) return true;
      emitActivity(runId, `Budget ceiling reached — skipping ${item.name}`);
      return false;
    });

    const specs = await Promise.all(
      budgeted.map(async (item) => {
        const out = await runPlanner({ item, theme, wireframe: s.wireframe!, data, onUsage, companySlug: s.brief!.inspiration.primary });
        emitActivity(s.runId, `Planned ${item.name}`);
        return out.spec;
      }),
    );

    const { components } = await runBuilder({
      specs,
      theme,
      wireframe: s.wireframe!,
      data,
      onUsage,
      onFile: (p) => emitActivity(s.runId, `Built ${p}`),
      companySlug: s.brief.inspiration.primary,
    });
    s.generatedFiles = { ...components };
    s.generatedFiles["src/styles.css"] = s.styles;
    emitActivity(runId, `Built ${Object.keys(components).length} components`);

    for (const [p, content] of Object.entries(s.generatedFiles)) {
      await persistGeneratedFile(runId, p, content);
    }
    setPhase(s, "build", "done");

    // ══ STAGE 4: ASSEMBLE (final builder — compose + copy + sandbox verify) ══
    setPhase(s, "assemble", "running", "Writing copy and assembling the screens…");
    const { runCopy } = await import("./agents/copy-v6");
    const copy = await runCopy({ brief, wireframe: s.wireframe, theme, data, onUsage });
    s.copy = copy;
    await persistJsonDoc(runId, "docs/planning/CopyPlan.json", "Copy Plan", "copy-plan", copy);

    const composed = composeAll({ brief, wireframe: s.wireframe, inventory: s.inventory!, copy, theme, data, ux: s.ux });
    s.generatedFiles = { ...s.generatedFiles, ...composed.files };
    // Materialize base primitives the screens depend on (Card, Table, Button,
    // …) that the builder did not produce — guarantees screens always compile.
    for (const [p, code] of Object.entries(composed.primitives)) {
      if (!s.generatedFiles[p]) s.generatedFiles[p] = code;
    }
    s.generatedFiles["src/styles.css"] = s.styles;

    for (const [p, content] of Object.entries(s.generatedFiles)) {
      await persistGeneratedFile(runId, p, content);
    }
    emitActivity(runId, `Assembled ${s.wireframe.screens.length} screens from ${Object.keys(components).length} components`);

    // Sandbox verification + screenshots happen inside the assemble stage.
    emitActivity(runId, "Verifying builds in the sandbox…");
    await runVerification(s);
    setPhase(s, "assemble", "done");

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
    s.status = "done";
    const costs = ledgerFromUsage(s.costs);
    emitActivity(runId, `Run cost: $${costs.totalDollars.toFixed(4)} (${costs.totalCredits.toFixed(2)} credits) across ${costs.entries.length} model call(s)`);

    const manifestOut: AgentManifest & Record<string, unknown> = {
      screens: s.generatedScreens,
      docs: [
        "docs/brief/ProductBrief.json",
        "docs/design/megadesign.md",
        ...s.attachedCompanies.map((c) => `docs/design/${c}.md`),
        "docs/planning/WireframePlan.json",
        "docs/planning/ComponentInventory.json",
        "docs/planning/UXDesign.json",
        "docs/planning/CopyPlan.json",
        "docs/review/ReviewResult.json",
      ],
      brandKit: null,
      styleSeed: null,
      phases: {
        discovery: "done",
        brief: "done",
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
      status: "done",
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
  const { runReview, runVisualReview, mergeReviewResults } = await import("./agents/review-v6");
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
  return map;
}

async function runRepairRound(s: V6RunState): Promise<void> {
  const targets = collectRepairTargets(s);
  if (targets.size === 0) {
    emitActivity(s.runId, "Repair: no fixable targets identified");
    return;
  }
  const { repairGeneratedFile } = await import("./agents/builder-v6");
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
    if (s.status !== "done") {
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

import { emitEvent, updateRun, persistFile, persistDoc, mergeManifest } from "./run-store";
import type { MaxiPhase, PhaseStatus, AgentManifest, VisualReference } from "./types";
import type { UsageRecord } from "./gateway";
import { ledgerFromUsage } from "./lib/ledger";
import * as creditService from "../credit-service";
import type { ProductBrief, WireframePlan, ComponentInventory, CopyPlan, ResolvedTheme, V6ReviewResult, UxDesignPlan, VisualIntent, V21LayoutPlan, ComponentUISpec } from "./schemas";
import { compileCompanyBlock, megadesignBlock, loadCompanyDoc, selectCompanyReferences, compileDesignKnowledge } from "./knowledge/index";
import { compileStyles, compileStylesForRun } from "./compile";
import type { MockDataset } from "./lib/content";
import { generateCompositionSummary } from "./compose";
import { auditFiles, type GateReport } from "./checks/audit";
import { auditContent } from "./checks/content";
import { auditScreenComposition } from "./checks/review";
import { geometryPasses } from "./checks/geometry";
import { buildV16DesignPlan, enforceV16Plan, auditV16Review } from "./contract";
import { lintAllGeneratedFiles } from "./checks/lint";
import { RunTiming, waveMs, type TimingReport } from "./lib/timing";
import { genomeToWireframe, type LayoutGenome } from "./lib/genome";
import { captureScreenshots } from "./screenshots";

/**
 * Maxi Agent v23 ("Endgame") — dependency-graph wave executor.
 *
 * Replaces the v20-v22 sequential waterfall (discovery → design → brief →
 * data → wireframe → ux → build → assemble → present → review, ~9 serial
 * network round-trips ≈ 8 minutes) with four waves:
 *
 *   WAVE 0 (<20s): discovery = deterministic nearest-neighbor company
 *                  scoring (no model call); design tokens + product brief =
 *                  ONE combined cheap-tier call (agents/plan.ts).
 *   WAVE 1 (<15s): mode classification (deterministic) → ONE schema-
 *                  constrained call producing the layout genome
 *                  (agents/genome.ts) → deterministic enforcement →
 *                  V21 placement plan (lib/layout-plan.ts).
 *   WAVE 2 (<45s): component build fans out in parallel (capped at
 *                  MAXI_COMPONENT_CONCURRENCY); content/copy run concurrent
 *                  with the build; each screen composes as soon as ITS
 *                  components are ready — not after every component finishes.
 *   WAVE 3 (<30s): one CSS compile (the only serialization point — Tailwind
 *                  needs every screen's classes), then per-screen
 *                  bundle + sandboxed smoke + sandboxed render + geometry
 *                  + deterministic gates + visual review, all concurrent
 *                  against the warm e2b pool (lib/sandbox-render.ts).
 *   WAVE 4: bounded repair — only screens that actually fail a gate get one
 *                  targeted pass. Persistent failures ship FLAGGED in the
 *                  run report (done_needs_review), never silently swallowed.
 *
 * The SSE phase-event wire contract is preserved (phase/status/message
 * events with the client's phase names); real per-wave timing is persisted
 * (docs/timing/TimingReport.json + manifest.timing).
 *
 * Sandboxing: generated/untrusted code NEVER executes on the app server.
 * esbuild compiles locally (a compiler, no execution); the smoke render and
 * the Chromium screenshot+geometry render run inside the e2b sandbox.
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
  designTokens: VisualIntent extends never ? never : import("./schemas").DesignTokens | null;
  visualIntent: VisualIntent | null;
  hintCompanySlug: string | null;
  attachedCompanies: string[];
  /** V23: the layout genome (Wave 1) — the schema-constrained layout contract. */
  genome: LayoutGenome | null;
  genomeNotes: string[];
  wireframe: WireframePlan | null;
  inventory: ComponentInventory | null;
  ux: UxDesignPlan | null;
  layoutPlan: V21LayoutPlan | null;
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
  composerRetries: Record<string, number>;
  /** V23: prop-contract audit + auto-fix outcome (docs/review/PropContractReport.json). */
  propContractReport: import("./lib/prop-validation").ScreenPropAudit & { screens: string[]; autoFixedCount: number; persisted: boolean } | null;

  costs: UsageRecord[];
  /** V23: per-wave wall-clock timing — the regression surface. */
  timing: TimingReport | null;
  /** V23: knowledge-base slice sizes per stage (prompt-token lever). */
  kbSlices: Record<string, { chars: number; files: string[] }>;
  /** V23: model call count per role (the Wave-0 merge lever). */
  callsByRole: Record<string, number>;

  status: "running" | "done" | "done_needs_review" | "error";
  error: string | null;

  geometryReports: Record<string, import("./checks/geometry").GeometryReport>;
}

const MAX_REPAIR_CYCLES = 1; // V23: bounded repair — one targeted pass only.
const MAX_COMPOSER_RETRIES = 1;

/** V23: component build concurrency (renamed from PASTEL_PICASSO_*). */
const COMPONENT_CONCURRENCY = Number(process.env.MAXI_COMPONENT_CONCURRENCY) || 6;

/** Per-run spend ceiling: the chargeable hold when present, else maxCredits. */
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
    genome: null,
    genomeNotes: [],
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
    timing: null,
    kbSlices: {},
    callsByRole: {},
    status: "running",
    error: null,
    geometryReports: {},
    composerRetries: {},
    propContractReport: null,
  };
}

function usageHook(s: V6RunState) {
  return (rec: UsageRecord) => {
    s.costs.push(rec);
    s.callsByRole[rec.role] = (s.callsByRole[rec.role] ?? 0) + 1;
  };
}

function emitActivity(runId: string, message: string) {
  emitEvent(runId, { type: "activity", message });
}

function setPhase(s: V6RunState, phase: MaxiPhase, status: PhaseStatus, message?: string) {
  emitEvent(s.runId, { type: "phase", phase, status });
  if (message) emitActivity(s.runId, message);
}

async function persistJsonDoc(runId: string, path: string, title: string, kind: string, value: unknown): Promise<void> {
  try {
    const content = JSON.stringify(value, null, 2);
    await persistDoc(runId, { path, title, kind, content });
    emitEvent(runId, { type: "doc", doc: { path, title, kind, content } });
  } catch (err) {
    console.warn(`[maxi-agent] failed to persist doc ${path}:`, err instanceof Error ? err.message : err);
  }
}

async function persistDocRaw(runId: string, path: string, title: string, kind: string, content: string): Promise<void> {
  try {
    await persistDoc(runId, { path, title, kind, content });
    emitEvent(runId, { type: "doc", doc: { path, title, kind, content } });
  } catch (err) {
    console.warn(`[maxi-agent] failed to persist doc ${path}:`, err instanceof Error ? err.message : err);
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
    console.warn(`[maxi-agent] failed to persist file ${path}:`, err instanceof Error ? err.message : err);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PIPELINE — the wave executor
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
  const t = new RunTiming();

  try {
    // ══ WAVE 0 — DISCOVERY (deterministic) + DESIGN+BRIEF (one call) ══
    t.begin(0, "discovery");
    setPhase(s, "discovery", "running", "Matching your product to design references…");
    // Deterministic nearest-neighbor scoring — NO model call (was a MID call).
    const references = await selectCompanyReferences(prompt, "track", answers.inspiration?.trim().toLowerCase());
    s.hintCompanySlug = references.primary.manifest.slug;
    t.end();

    t.begin(0, "plan");
    setPhase(s, "design", "running", "Designing tokens + product brief in one pass…");
    const { runPlanAgent } = await import("./agents/plan");
    const planOut = await runPlanAgent({
      prompt,
      answers,
      hintManifest: references.primary.manifest,
      visualReference: s.visualReference,
      onUsage,
    });
    s.designTokens = planOut.tokens;
    s.theme = planOut.theme;
    s.visualIntent = planOut.visual;
    s.brief = planOut.brief;
    s.attachedCompanies = planOut.attachedCompanies;
    for (const note of planOut.notes) emitActivity(runId, note);
    if (planOut.usedFallback.length > 0) emitActivity(runId, `Deterministic fallback used for: ${planOut.usedFallback.join(", ")}`);
    t.end(`calls=${s.callsByRole.plan ?? 0}`);

    const { css, fontFamilies } = compileStyles(s.theme);
    s.styles = css;
    s.fontFamilies = fontFamilies;

    await updateRun(runId, { title: s.brief.title });
    emitEvent(runId, { type: "title", title: s.brief.title });
    emitActivity(runId, `${s.brief.title} — ${s.brief.productType} · mode ${s.brief.mode ?? "?"} · inspired by ${s.brief.inspiration.primary}`);

    await persistJsonDoc(runId, "docs/brief/ProductBrief.json", "Product Brief", "brief", s.brief);
    await persistJsonDoc(runId, "docs/design/DesignTokens.json", "Design Tokens", "design-tokens", s.designTokens);
    await persistJsonDoc(runId, "docs/design/VisualIntent.json", "Visual Intent", "visual-intent", s.visualIntent);
    await persistDocRaw(runId, "docs/design/V16DesignKnowledge.md", "V16 Design Knowledge", "design-knowledge", compileDesignKnowledge(references.primary, references.secondary, references.capabilities));
    await persistDocRaw(runId, "docs/design/megadesign.md", "Megadesign — Universal Design Law", "megadesign", await megadesignBlock());
    for (const slug of s.attachedCompanies) {
      const doc = await loadCompanyDoc(slug);
      if (doc) await persistDocRaw(runId, `docs/design/${slug}.md`, `${slug} — Design Reference`, "company-design", doc);
    }
    setPhase(s, "design", "done");
    setPhase(s, "brief", "done");
    setPhase(s, "discovery", "done");
    emitActivity(runId, `Wave 0 done — design + brief in ONE call (was two)`);

    // ══ WAVE 1 — MODE CLASSIFICATION + LAYOUT GENOME (one call) ══
    t.begin(1, "genome");
    setPhase(s, "wireframe", "running", "Classifying the product mode and deriving the layout genome…");
    const { runGenomeAgent } = await import("./agents/genome");
    const { retrieveKnowledge } = await import("./knowledge/retrieval");
    const kb = await retrieveKnowledge({ company: s.brief.inspiration.primary, mode: s.brief.mode });
    s.kbSlices["wave1-genome"] = { chars: kb.chars, files: kb.files };
    t.stageNote(`kb=${kb.chars} chars`);

    const genomeOut = await runGenomeAgent({ brief: s.brief, visualReference: s.visualReference, onUsage });
    s.genome = genomeOut.genome;
    s.genomeNotes = genomeOut.notes;
    if (genomeOut.usedFallback) emitActivity(runId, `Layout genome: deterministic ${genomeOut.mode} default used`);
    for (const note of genomeOut.notes) emitActivity(runId, `Genome: ${note}`);
    t.end(`mode=${genomeOut.mode}`);

    // Deterministic derivation: genome → enforced wireframe + inventory + UX.
    const derived = genomeToWireframe(genomeOut.genome, s.brief);
    s.wireframe = derived.wireframe;
    s.inventory = derived.inventory;
    s.ux = derived.ux;
    for (const note of derived.notes) emitActivity(runId, note);

    // V16 product contract (safety net — required blocks, inventory sanity).
    const v16 = enforceV16Plan(s.brief, s.wireframe, s.inventory, buildV16DesignPlan(s.brief, references.capabilities.map((c) => c.id)));
    s.wireframe = v16.plan;
    s.inventory = v16.inventory;
    for (const note of v16.notes) emitActivity(runId, note);
    await persistDocRaw(runId, "docs/design/V16ProductContract.md", "V16 Product Contract", "product-contract", JSON.stringify(v16.design, null, 2));

    await persistJsonDoc(runId, "docs/planning/Genome.json", "Layout Genome", "genome", s.genome);
    await persistJsonDoc(runId, "docs/planning/WireframePlan.json", "Wireframe Plan", "wireframe-plan", s.wireframe);
    await persistJsonDoc(runId, "docs/planning/ComponentInventory.json", "Component Inventory", "component-inventory", s.inventory);
    await persistJsonDoc(runId, "docs/planning/UXDesign.json", "UX Design", "ux-design", s.ux);
    emitActivity(runId, `${s.wireframe.screens.length} screens wired · ${s.inventory.components.length} components planned`);
    setPhase(s, "wireframe", "done");
    emitActivity(runId, `Wave 1 done — genome produced (${genomeOut.mode} mode vocabulary)`);

    // ══ WAVE 2 — COMPONENTS ∥ CONTENT ∥ COPY ∥ PER-SCREEN COMPOSITION ══
    t.begin(2, "build");
    setPhase(s, "data", "running", "Writing content while components build…");
    setPhase(s, "build", "running", "Building components in parallel…");

    const compositionSummary = generateCompositionSummary(s.wireframe, s.ux, s.visualIntent);
    const ceiling = chargeCeiling(s);
    const budgeted = s.inventory.components.filter((item) => {
      if (ledgerFromUsage(s.costs).totalCredits <= ceiling) return true;
      emitActivity(runId, `Budget ceiling reached — skipping ${item.name}`);
      return false;
    });

    // ── Component build, per component, with per-screen early composition ──
    // Each component's completion triggers a check: every screen whose whole
    // component set is ready composes immediately (V23 — the biggest
    // parallelism win, implemented for this real time).
    const { runPlanner } = await import("./agents/planner");
    const { generateComponent } = await import("./agents/builder");
    const builtByName: Record<string, string> = {};

    // Content + copy run CONCURRENT with the component build (was serial).
    // The copy agent gets the deterministic dataset (content-shape parity);
    // the run's real dataset lands when runData resolves and the composer
    // consumes that one.
    const { runData } = await import("./agents/data");
    const { runCopy } = await import("./agents/copy");
    const { mockDataset } = await import("./lib/content");
    const dataPromise = runData({ brief: s.brief, seed: prompt + runId, onUsage });
    const copyPromise = runCopy({ brief: s.brief, wireframe: s.wireframe, theme: s.theme!, data: mockDataset(s.brief, runId), onUsage }).catch((err) => {
      console.warn("[maxi-agent] copy call failed:", err instanceof Error ? err.message : err);
      return null;
    });

    const dataOut = await dataPromise;
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
    emitActivity(runId, `Content written — ${s.data.rows.length} items · ${s.data.reviews.length} reviews (${s.data.domain} domain)`);
    setPhase(s, "data", "done");

    // Copy + layout plan resolve during the build (was serial after it).
    const { buildLayoutPlanFromGenome: layoutFromGenome } = await import("./lib/layout-plan");
    const companyBlock = await compileCompanyBlock(s.brief.inspiration.primary).catch(() => "");
    const megadesign = await megadesignBlock();
    const layoutPromise = (async (): Promise<V21LayoutPlan> => {
      const cp = await copyPromise;
      if (cp) {
        s.copy = cp;
      } else {
        const { fallbackCopy } = await import("./agents/copy");
        s.copy = fallbackCopy(s.brief!, s.wireframe!, s.data!);
        emitActivity(runId, "Copy: deterministic fallback used (model call unavailable)");
      }
      await persistJsonDoc(runId, "docs/planning/CopyPlan.json", "Copy Plan", "copy-plan", s.copy);
      emitActivity(runId, `Copy plan written — ${s.copy.screens.length} screen(s)`);
      s.layoutPlan = layoutFromGenome({ wireframe: s.wireframe!, ux: s.ux! }, s.visualIntent, s.copy);
      await persistJsonDoc(runId, "docs/planning/LayoutPlan.json", "V21 Layout Plan", "layout-plan", s.layoutPlan);
      emitActivity(runId, "Layout plan derived from the genome — placement, headers, and section budget set");
      return s.layoutPlan;
    })();

    const specs = await runPlannerBatch(budgeted, s, compositionSummary, onUsage);
    const componentSpecs: Record<string, ComponentUISpec> = {};
    for (const spec of specs) componentSpecs[spec.name] = spec;
    s.componentSpecs = componentSpecs;

    // Dependency tracker: screen → its required component set; a screen's
    // composition promise resolves as soon as every required component is
    // built (and the copy/layout plan has landed).
    const needsByScreen = new Map<string, Set<string>>();
    const { screenNeedsComponents } = await import("./compose");
    for (const screen of s.wireframe.screens) {
      needsByScreen.set(screen.id, new Set(screenNeedsComponents(screen)));
    }
    const readyComponents = new Set<string>();
    const waiting: Array<{ screenId: string; resolve: () => void }> = [];
    const markComponentReady = (name: string) => {
      readyComponents.add(name);
      for (let i = waiting.length - 1; i >= 0; i--) {
        const w = waiting[i];
        const needs = needsByScreen.get(w.screenId);
        if (needs && [...needs].every((n) => readyComponents.has(n))) {
          waiting.splice(i, 1);
          w.resolve();
        }
      }
    };
    const waitForScreenComponents = (screenId: string): Promise<void> => {
      const needs = needsByScreen.get(screenId);
      if (needs && [...needs].every((n) => readyComponents.has(n))) return Promise.resolve();
      return new Promise((resolve) => waiting.push({ screenId, resolve }));
    };

    // Builder pool: per component, concurrency-capped; each completion
    // releases the screens waiting on it.
    const buildPool = async () => {
      const size = Math.min(COMPONENT_CONCURRENCY, specs.length);
      let next = 0;
      const lanes = Array.from({ length: Math.max(1, size) }, async () => {
        for (;;) {
          const i = next++;
          if (i >= specs.length) return;
          const spec = specs[i];
          try {
            const code = await generateComponent(spec, s.theme!, {
              onUsage,
              wireframe: s.wireframe!,
              data: s.data!,
              visualReference: s.visualReference,
              compositionSummary,
            });
            builtByName[spec.name] = code;
            s.generatedFiles[`src/components/${spec.name}.jsx`] = code;
            await persistGeneratedFile(runId, `src/components/${spec.name}.jsx`, code);
            emitActivity(s.runId, `Built ${spec.name}`);
          } catch (err) {
            // V23: transient failure → the base-anchored fidelity repair path
            // (rewrites the vendored base under the taxonomy floors) so the
            // screen never loses a component to a model hiccup.
            const { repairWithFidelity } = await import("./agents/builder");
            const repaired = await repairWithFidelity(spec, s.theme!, { onUsage, productContext: `${s.brief!.title} — ${s.brief!.productType}` }).catch(() => null);
            if (repaired) {
              builtByName[spec.name] = repaired.code;
              s.generatedFiles[`src/components/${spec.name}.jsx`] = repaired.code;
              await persistGeneratedFile(runId, `src/components/${spec.name}.jsx`, repaired.code);
              emitActivity(s.runId, `Built ${spec.name} via fidelity repair (${repaired.verdict.action} — ${(repaired.verdict.similarity * 100).toFixed(0)}% vs base)`);
            } else {
              emitActivity(s.runId, `Build of ${spec.name} failed (${err instanceof Error ? err.message : String(err)})`);
              builtByName[spec.name] = "";
              // A failed component still "completes" — the screen composition
              // marks the screen failed rather than deadlocking the batch.
            }
          }
          markComponentReady(spec.name);
        }
      });
      await Promise.all(lanes);
    };

    const buildPromise = buildPool();
    const { composeOneScreenV20, composeSharedFiles } = await import("./compose");

    // Shared run files (data.js + lib/shell.jsx) — generated ONCE before
    // per-screen composition; every screen imports them.
    {
      const sharedInput = {
        brief: s.brief!,
        wireframe: s.wireframe!,
        inventory: s.inventory!,
        copy: s.copy!,
        theme: s.theme!,
        data: s.data!,
        ux: s.ux,
        visual: s.visualIntent,
        builtComponents: builtByName,
        componentSpecs,
        companyBlock,
        megadesignBlock: megadesign,
        layoutPlan: s.layoutPlan,
        visualReference: s.visualReference,
        onUsage,
      };
      const shared = composeSharedFiles(sharedInput);
      s.generatedFiles = { ...s.generatedFiles, ...shared };
    }

    // Each screen composes as soon as ITS components + the layout plan land.
    setPhase(s, "assemble", "running", "Composing screens as their components finish…");
    const composedFiles: Record<string, string> = {};
    const composedPrimitives: Record<string, string> = {};
    const composedFailed: string[] = [];
    const composedErrors: Record<string, string> = {};

    const composePromises = s.wireframe.screens.map(async (screen) => {
      await Promise.all([waitForScreenComponents(screen.id), buildPromise, layoutPromise]);
      const res = await composeOneScreenV20({
        brief: s.brief!,
        wireframe: s.wireframe!,
        inventory: s.inventory!,
        copy: s.copy!,
        theme: s.theme!,
        data: s.data!,
        ux: s.ux,
        visual: s.visualIntent,
        builtComponents: builtByName,
        componentSpecs,
        companyBlock,
        megadesignBlock: megadesign,
        layoutPlan: s.layoutPlan,
        visualReference: s.visualReference,
        onUsage,
      }, screen);
      if (res.failed) {
        composedFailed.push(screen.id);
        composedErrors[screen.id] = res.error ?? "composer failure";
      } else {
        composedFiles[res.path] = res.content;
        Object.assign(composedPrimitives, res.primitives);
      }
      return res;
    });

    await Promise.all(composePromises);
    emitActivity(runId, `Assembled ${s.wireframe.screens.length} screens from ${Object.keys(builtByName).filter((n) => builtByName[n]).length} components`);

    // Bounded composer retry (V23: 1 retry) for failed screens.
    if (composedFailed.length > 0) {
      emitActivity(runId, `Screen composer retry for: ${composedFailed.join(", ")}`);
      for (const sid of composedFailed) {
        s.composerRetries[sid] = (s.composerRetries[sid] ?? 0) + 1;
      }
      const retryInput = {
        brief: s.brief!,
        wireframe: s.wireframe!,
        inventory: s.inventory!,
        copy: s.copy!,
        theme: s.theme!,
        data: s.data!,
        ux: s.ux,
        visual: s.visualIntent,
        builtComponents: builtByName,
        componentSpecs,
        companyBlock,
        megadesignBlock: megadesign,
        layoutPlan: s.layoutPlan,
        visualReference: s.visualReference,
        onUsage,
        retryNotes: composedFailed
          .map((sid) => composedErrors[sid] ?? `previous layout for ${sid} was rejected`)
          .filter((n): n is string => Boolean(n)),
      };
      for (const screen of s.wireframe.screens) {
        if (!composedFailed.includes(screen.id)) continue;
        const res = await composeOneScreenV20(retryInput, screen);
        if (!res.failed) {
          composedFiles[res.path] = res.content;
          Object.assign(composedPrimitives, res.primitives);
          composedFailed.splice(composedFailed.indexOf(screen.id), 1);
          delete composedErrors[screen.id];
        }
      }
    }

    // V23: screens still failing after the bounded retry are NOT a hard
    // run failure — they ship flagged. The report carries failedScreens.
    for (const sid of composedFailed) {
      s.failedScreens.push(sid);
      emitActivity(runId, `Screen ${sid} could not be composed — flagged in the run report (${composedErrors[sid] ?? "composer failure"})`);
    }

    s.generatedFiles = { ...s.generatedFiles, ...composedFiles };
    for (const [p, code] of Object.entries(composedPrimitives)) {
      if (!s.generatedFiles[p]) s.generatedFiles[p] = code;
    }
    s.generatedFiles["src/styles.css"] = s.styles;

    // V23: prop-contract audit + deterministic auto-fix (the Picasso
    // mechanic, wired into the wave executor). Every composed screen is
    // checked against the planner's declared required props BEFORE it is
    // persisted or verified; crash-prone chrome-only mounts are replaced
    // with safe data-mount wrappers so `undefined.map` can't ship.
    {
      const propModule = await import("./lib/prop-validation");
      const { auditScreenProps, applyPropAutoFix } = propModule;
      type PropContract = import("./lib/prop-validation").PropContract;
      const contract: PropContract = {
        generatedAt: new Date().toISOString(),
        entries: Object.entries(s.componentSpecs).map(([name, spec]) => ({
          componentId: name,
          componentName: name,
          importPath: `src/components/${name}.jsx`,
          props: Object.fromEntries(
            spec.props.map((p) => [p.name, { type: p.type, required: p.default === undefined, description: "" }]),
          ),
        })),
      };
      const screenPaths = Object.keys(s.generatedFiles).filter((p) => /^src\/screens\/[^/]+\.jsx$/.test(p));
      let violations: import("./lib/prop-validation").PropViolation[] = [];
      let autoFixedCount = 0;
      for (const path of screenPaths) {
        const audit = auditScreenProps(s.generatedFiles[path], contract);
        if (audit.violations.length === 0) continue;
        const fixed = applyPropAutoFix(s.generatedFiles[path], audit, contract);
        if (fixed.fixed.length > 0) {
          s.generatedFiles[path] = fixed.code;
          autoFixedCount += fixed.fixed.length;
        }
        violations = [...violations, ...fixed.audit.violations];
      }
      s.propContractReport = { violations, autoFixed: [], screens: screenPaths, autoFixedCount, persisted: true };
      if (autoFixedCount > 0) emitActivity(runId, `Prop contract: auto-fixed ${autoFixedCount} crash-prone mount(s) in composed screens`);
      if (violations.length > 0) emitActivity(runId, `Prop contract: ${violations.length} violation(s) still flagged (${violations.map((v) => v.componentName).join(", ")})`);
      await persistJsonDoc(runId, "docs/review/PropContractReport.json", "Prop Contract Report", "prop-contract-report", s.propContractReport);
    }

    for (const [p, content] of Object.entries(s.generatedFiles)) {
      await persistGeneratedFile(runId, p, content);
    }

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
    t.end(`components=${Object.keys(builtByName).filter((n) => builtByName[n]).length} screens=${s.wireframe.screens.length}`);
    setPhase(s, "build", "done");

    // ══ WAVE 3 — ONE CSS COMPILE, THEN SANDBOXED RENDER + GATES ∥ ══
    t.begin(3, "compile");
    setPhase(s, "assemble", "running", "Compiling styles, then verifying every screen in the sandbox…");
    // The one genuinely unavoidable serialization point: Tailwind needs every
    // screen's classes before compiling once.
    const { css: runCss, fontFamilies: runFonts } = compileStylesForRun(s.theme!, s.generatedFiles);
    s.styles = runCss;
    s.fontFamilies = runFonts;
    s.generatedFiles["src/styles.css"] = s.styles;
    await persistGeneratedFile(runId, "src/styles.css", s.styles);
    t.end();

    // Verification + render: concurrent against the warm e2b pool.
    t.begin(3, "verify-render");
    const { IncrementalScreenVerifier } = await import("./sandbox");
    const verifier: InstanceType<typeof IncrementalScreenVerifier> = (s as any).verifier ?? new IncrementalScreenVerifier();
    (s as any).verifier = verifier;
    const result = await verifier.verify(s.generatedFiles);
    s.bundles = result.bundles;
    s.generatedScreens = Object.keys(result.bundles);
    s.sandboxErrors = result.errors;
    if (result.smoke === "e2b") {
      emitActivity(runId, `Smoke tests ran in the e2b sandbox (${s.generatedScreens.length} screen(s))`);
    } else {
      emitActivity(runId, `Smoke tests unavailable (e2b not configured) — ${s.generatedScreens.length} screen(s) bundled`);
    }
    for (const err of result.errors.slice(0, 5)) {
      emitActivity(s.runId, `Sandbox error — ${err.file ?? "project"}: ${err.message.slice(0, 160)}`);
    }
    for (const [name, js] of Object.entries(s.bundles)) {
      await persistGeneratedFile(s.runId, `.build/${name}.js`, js);
    }
    emitActivity(s.runId, `${s.generatedScreens.length} screen(s) verified${s.failedScreens.length ? `, ${s.failedScreens.length} failed` : ""}`);

    // Screenshot + DOM-geometry, all concurrent against the warm pool.
    const shotResult = await captureScreenshots({
      bundles: s.bundles,
      styles: s.styles,
      fonts: s.fontFamilies,
      heroScalePx: parseFloat(s.theme?.cssVars?.["--text-4xl"] ?? "36"),
    });
    s.screenshots = shotResult.screenshots.map((x) => x.dataUrl);
    s.screenshotNames = shotResult.screenshots.map((x) => x.name);
    s.geometryReports = shotResult.geometryReports;
    if (shotResult.reason) emitActivity(runId, `Render: ${shotResult.reason}`);
    for (const [name, geo] of Object.entries(s.geometryReports)) {
      const { ok, reasons } = geometryPasses(geo);
      if (!ok) emitActivity(runId, `Geometry ${name}: ${reasons.join(", ")}`);
    }
    emitActivity(runId, `${s.screenshots.length} screenshot(s) rendered in the sandbox`);
    t.end(`screens=${s.generatedScreens.length} shots=${s.screenshots.length} sandboxes=${Math.max(1, Number(process.env.MAXI_SANDBOX_POOL_SIZE) || 3)}`);
    setPhase(s, "assemble", "done");

    // Present screens (live before review, unchanged contract).
    setPhase(s, "present", "running", "Presenting your screens — quality review runs next…");
    emitEvent(s.runId, { type: "screens", screens: s.generatedScreens });
    await mergeManifest(s.runId, { screens: s.generatedScreens, failedScreens: s.failedScreens, phases: { present: "done" } });
    emitActivity(runId, `Presented ${s.generatedScreens.length} screen(s) — starting quality review`);
    setPhase(s, "present", "done");

    // Quality floor: no verified screens at all is an error state.
    if (s.generatedScreens.length === 0 && s.brief && s.brief.screenPurposes.length >= 2) {
      const msg = `All screens failed sandbox verification — check the builder output for import or syntax errors.`;
      emitActivity(runId, msg);
      s.status = "error";
      s.error = msg;
      await updateRun(runId, { status: "error", error: s.error });
      emitEvent(runId, { type: "error", message: s.error });
      await settleCredits(s);
      return;
    }

    // ══ WAVE 3b — GATES + REVIEW ══
    setPhase(s, "review", "running", "Running the quality gate and visual review…");
    await runGate(s);
    await runModelReview(s, onUsage);

    // ══ WAVE 4 — BOUNDED REPAIR (one targeted pass, flagged failures) ══
    const needsRepair =
      (!s.reviewResult?.passed || s.failedScreens.length > 0) && s.repairCycles < MAX_REPAIR_CYCLES;
    if (needsRepair) {
      if (ledgerFromUsage(s.costs).totalCredits <= chargeCeiling(s)) {
        s.repairCycles++;
        emitActivity(runId, `Repair ${s.repairCycles}/${MAX_REPAIR_CYCLES} — one targeted pass…`);
        setPhase(s, "build", "running");
        await runRepairRound(s);
        setPhase(s, "build", "done");
        setPhase(s, "assemble", "running", "Re-verifying…");
        await runVerification(s);
        setPhase(s, "assemble", "done");
        setPhase(s, "review", "running", "Re-running the quality gate…");
        await runGate(s);
        await runModelReview(s, onUsage);
      } else {
        emitActivity(runId, "Budget ceiling reached — skipping repair");
      }
    }

    // V23: a screen that still fails ships with the failure explicitly
    // flagged in the run report — no silent swallow, no infinite loop.
    const stillFailed = s.failedScreens.filter((f) => s.generatedScreens.includes(f));
    if (stillFailed.length > 0) {
      emitActivity(runId, `Flagged screens that still fail verification: ${stillFailed.join(", ")}`);
    }

    // ══ DONE ══
    s.status = s.reviewResult?.passed && s.failedScreens.length === 0 ? "done" : "done_needs_review";
    const costs = ledgerFromUsage(s.costs);
    const report = t.report();
    s.timing = report;
    emitActivity(runId, `Run cost: $${costs.totalDollars.toFixed(4)} (${costs.totalCredits.toFixed(2)} credits) across ${costs.entries.length} model call(s)`);
    emitActivity(runId, `Waves: w0=${(waveMs(report, 0) / 1000).toFixed(1)}s w1=${(waveMs(report, 1) / 1000).toFixed(1)}s w2=${(waveMs(report, 2) / 1000).toFixed(1)}s w3=${(waveMs(report, 3) / 1000).toFixed(1)}s — total ${report.wallSeconds}s`);
    if (s.status === "done_needs_review") emitActivity(runId, "Review did not pass after the bounded repair pass — run marked done_needs_review (shipped but QA-failed).");

    await persistJsonDoc(runId, "docs/timing/TimingReport.json", "Wave Timing Report", "timing-report", report);
    await persistJsonDoc(runId, "docs/timing/CallCounts.json", "Model Call Counts", "call-counts", {
      callsByRole: s.callsByRole,
      totalCalls: s.costs.length,
      kbSlices: s.kbSlices,
    });

    const manifestOut: AgentManifest & Record<string, unknown> = {
      screens: s.generatedScreens,
      docs: [
        "docs/brief/ProductBrief.json",
        "docs/design/DesignTokens.json",
        "docs/design/VisualIntent.json",
        "docs/design/megadesign.md",
        ...s.attachedCompanies.map((c) => `docs/design/${c}.md`),
        "docs/planning/Genome.json",
        "docs/planning/WireframePlan.json",
        "docs/planning/ComponentInventory.json",
        "docs/planning/UXDesign.json",
        "docs/planning/CopyPlan.json",
        "docs/review/ReviewResult.json",
        "docs/review/GateReport.json",
        "docs/review/FidelityReport.json",
        "docs/review/PropContractReport.json",
        "docs/timing/TimingReport.json",
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
      company: s.brief.inspiration.primary,
      reviewResult: s.reviewResult,
      /** V23: real per-wave timing — the regression surface. */
      timing: report,
      callsByRole: s.callsByRole,
      kbSlices: s.kbSlices,
    };

    await updateRun(runId, {
      status: s.status,
      title: s.brief.title,
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
    t.cancel();
    s.status = "error";
    s.error = err instanceof Error ? err.message : String(err);
    console.error("[maxi-agent] run failed:", s.error);
    await updateRun(runId, { status: "error", error: s.error });
    emitEvent(runId, { type: "error", message: s.error });
    await settleCredits(s);
  }
}

// ── Wave 2 helpers ────────────────────────────────────────────────────────

async function runPlannerBatch(
  budgeted: ComponentInventory["components"],
  s: V6RunState,
  compositionSummary: string,
  onUsage: (rec: UsageRecord) => void,
): Promise<ComponentUISpec[]> {
  const { runPlanner } = await import("./agents/planner");
  const size = Math.min(COMPONENT_CONCURRENCY, budgeted.length);
  const results: ComponentUISpec[] = new Array(budgeted.length);
  let next = 0;
  const lanes = Array.from({ length: Math.max(1, size) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= budgeted.length) return;
      const item = budgeted[i];
      const out = await runPlanner({ item, theme: s.theme!, wireframe: s.wireframe!, data: s.data!, onUsage, compositionSummary });
      emitActivity(s.runId, `Planned ${item.name}`);
      results[i] = out.spec;
    }
  });
  await Promise.all(lanes);
  return results;
}

// ── Verification + render (Wave 3/4) ──────────────────────────────────────

async function runVerification(s: V6RunState): Promise<void> {
  const { IncrementalScreenVerifier } = await import("./sandbox");
  const verifier: InstanceType<typeof IncrementalScreenVerifier> = (s as any).verifier ?? new IncrementalScreenVerifier();
  (s as any).verifier = verifier;
  const result = await verifier.verify(s.generatedFiles);
  s.bundles = result.bundles;
  s.generatedScreens = Object.keys(result.bundles);
  s.sandboxErrors = result.errors;
  s.failedScreens = s.failedScreens.filter((f) => !s.generatedScreens.includes(f));
  s.failedScreens.push(...result.errors.map((e) => e.file ?? e.message).filter(Boolean));

  for (const err of result.errors.slice(0, 5)) {
    emitActivity(s.runId, `Sandbox error — ${err.file ?? "project"}: ${err.message.slice(0, 160)}`);
  }
  emitActivity(s.runId, `${s.generatedScreens.length} screen(s) verified${s.failedScreens.length ? `, ${s.failedScreens.length} failed` : ""}`);

  for (const [name, js] of Object.entries(s.bundles)) {
    await persistGeneratedFile(s.runId, `.build/${name}.js`, js);
  }

  const { css: runCss, fontFamilies } = compileStylesForRun(s.theme!, s.generatedFiles);
  s.styles = runCss;
  s.fontFamilies = fontFamilies;
  s.generatedFiles["src/styles.css"] = s.styles;
  await persistGeneratedFile(s.runId, "src/styles.css", s.styles);

  s.screenshots = [];
  s.screenshotNames = [];
  const shotResult = await captureScreenshots({
    bundles: s.bundles,
    styles: s.styles,
    fonts: s.fontFamilies,
    heroScalePx: parseFloat(s.theme?.cssVars?.["--text-4xl"] ?? "36"),
  });
  s.screenshots = shotResult.screenshots.map((x) => x.dataUrl);
  s.screenshotNames = shotResult.screenshots.map((x) => x.name);
  s.geometryReports = shotResult.geometryReports;
  if (shotResult.reason) emitActivity(s.runId, `Render: ${shotResult.reason}`);
}

// ── Gate + model review ────────────────────────────────────────────────────

async function runGate(s: V6RunState): Promise<void> {
  const codeGate = auditFiles(s.theme!, s.generatedFiles);
  const issues = [...codeGate.issues];

  if (s.data) {
    issues.push(...auditContent(s.data, s.generatedFiles));
  }

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

  // V23: prop-contract violations that survived the auto-fix are gate issues.
  if (s.propContractReport && s.propContractReport.violations.length > 0) {
    for (const v of s.propContractReport.violations) {
      issues.push({
        file: `src/components/${v.componentId}.jsx`,
        severity: "high",
        category: "props",
        description: `${v.componentName} mounted without required prop(s) ${v.missingRequired.join(", ")} (${v.usageCount} mount(s)) — the composer must pass real data from DATA.`,
      });
    }
  }

  // V23: the layout gate validates the composed output against the V21 plan
  // DERIVED FROM THE GENOME (genome → wireframe → placement plan), plus the
  // genome contract itself (mode-scoped vocabulary compliance).
  if (s.layoutPlan || s.genome) {
    const { auditGenomeLayout } = await import("./checks/layout");
    issues.push(...auditGenomeLayout(s.genome, s.layoutPlan, s.generatedFiles, s.generatedFiles));
  }

  if (s.componentSpecs && Object.keys(s.componentSpecs).length > 0) {
    const { auditPropBindings } = await import("./checks/props");
    issues.push(...auditPropBindings(s.componentSpecs, s.generatedFiles));
    // V23: the taxonomy fidelity audit — structural contract + uniqueness
    // ceiling per built component. Verdicts persist to the run docs.
    const { auditComponentFidelity } = await import("./checks/fidelity");
    const fidelity = auditComponentFidelity(s.componentSpecs, s.generatedFiles);
    issues.push(...fidelity.issues);
    await persistJsonDoc(s.runId, "docs/review/FidelityReport.json", "Component Fidelity Report", "fidelity-report", fidelity.report);
    emitActivity(
      s.runId,
      `Fidelity: ${fidelity.report.summary.passed}/${fidelity.report.summary.total} component(s) passed (${fidelity.report.summary.highIssues} issue(s))`,
    );
  }

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
  for (const issue of s.reviewResult?.issues ?? []) {
    const raw = issue.target;
    const file = raw.startsWith("src/") ? raw : `src/screens/${raw.replace(/\.(?:jsx|tsx)$/, "")}.jsx`;
    if (!s.generatedFiles[file]) continue;
    const evidence = `${issue.category}: ${issue.description}`;
    map.set(file, [...(map.get(file) ?? []), evidence]);
  }
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
    console.log(`[maxi-agent] run ${s.runId}: charged ${charge.toFixed(2)} credits ($${ledger.totalDollars} USD)`);
  } catch (err) {
    console.error("[maxi-agent] failed to release credit hold:", err);
  }
}

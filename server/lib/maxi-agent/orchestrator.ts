import { emitEvent, updateRun, persistFile, persistDoc, mergeManifest } from "./run-store";
import type { MaxiPhase, PhaseStatus, AgentManifest, VisualReference } from "./types";
import type { UsageRecord } from "./gateway";
import { ledgerFromUsage } from "./lib/ledger";
import * as creditService from "../credit-service";
import { compileStylesForRun } from "./compile";
import { captureScreenshots } from "./screenshots";
import { IncrementalScreenVerifier, type SandboxError } from "./sandbox";
import { RunTiming, waveMs, type TimingReport } from "./lib/timing";
import { auditFiles, type GateReport, type GateIssue } from "./checks/audit";
import { lintAllGeneratedFiles } from "./checks/lint";
import { geometryIssuesFor } from "./checks/geometry";
import type { GeometryReport } from "./checks/geometry";
import { splitIssues, a11yScan, densityNotes, type GateSplit } from "./checks/hard-gate";
import { auditScreenProps, applyPropAutoFix, type PropContract } from "./lib/prop-validation";
import { selectCompanyReferences } from "./knowledge/index";
import type { DesignBlueprint } from "./lib/blueprint";
import type { BlueprintDerivation } from "./lib/blueprint-derive";
import { generateDataset, composeDataJs, type V25Dataset } from "./lib/data-gen";
import { composeShellJsx, composeAppJsx, composePackageJson, composeReadme } from "./lib/shell-gen";
import { buildFileManifest, uniquenessFingerprint, type FileManifest } from "./lib/file-manifest";
import type { ModelChat } from "./lib/model-chat";
import type { AdvisoryReview } from "./agents/advisory-review";
import type { ResolvedTheme } from "./schemas";

/**
 * Maxi Agent v25 ("Auteur") — the wave executor.
 *
 *   WAVE 0 · DIRECTION (1 strong call, ~15s)
 *     Deterministic inspiration scoring → ONE Direction call → the
 *     deterministic derive pass (WCAG repair, divergence veto, token
 *     expansion, manifest lint) → the dataset (exemplars → 6-8 dense rows).
 *     Replaces v24's plan → genome → planner → data → copy chain.
 *
 *   WAVE 1 · SYNTHESIS (~35-60s)
 *     Components ∥ screens in ONE parallel batch (screens code against the
 *     manifest API, not built code) + the deterministic shared files
 *     (shell.jsx, data.js, App.jsx) + lint + prop-contract auto-fix.
 *
 *   WAVE 2 · VERIFY (deterministic, warm e2b pool)
 *     One CSS compile → esbuild bundles → e2b smoke → 3-viewport renders →
 *     geometry → the HARD/ADVISORY gate split.
 *
 *   WAVE 3 · POLISH (0-3 repair calls, hard failures only)
 *     One repair call per failing FILE with the gate errors + the rendered
 *     screenshot; one re-verify round; persistent failures ship FLAGGED.
 *
 *   WAVE 4 · ADVISORY REVIEW (1 call, non-blocking)
 *     A scorecard for the user. It never triggers repair and never gates —
 *     the v24 118s wave-4 tail is structurally gone.
 *
 * The SSE phase-event wire contract and the run-store/credits/manifest
 * contracts are preserved from v24 — the client UI works unchanged.
 */

export interface V25RunState {
  runId: string;
  prompt: string;
  answers: Record<string, string>;
  projectId: string | null;
  userId?: string;
  holdId?: string;
  holdAmount?: number;
  maxCredits: number;
  visualReference?: VisualReference;

  derivation: BlueprintDerivation | null;
  dataset: V25Dataset | null;
  dataNotes: string[];

  generatedFiles: Record<string, string>;
  bundles: Record<string, string>;
  generatedScreens: string[];
  failedScreens: string[];
  sandboxErrors: SandboxError[];
  screenshots: string[];
  screenshotNames: string[];
  geometryReportsByViewport: Record<number, Record<string, GeometryReport>>;

  gateSplit: GateSplit | null;
  gateReport: GateReport | null;
  propViolations: number;
  advisory: AdvisoryReview | null;
  repairCalls: number;

  costs: UsageRecord[];
  callsByRole: Record<string, number>;
  timing: TimingReport | null;
  kbChars: number;

  fingerprint: string | null;
  status: "running" | "done" | "done_needs_review" | "error";
  error: string | null;
}

const MAX_REPAIR_CALLS = Number(process.env.MAXI_MAX_REPAIR_CALLS) || 3;
const AUTHOR_CONCURRENCY = Number(process.env.MAXI_AUTHOR_CONCURRENCY) || 8;

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
}): V25RunState {
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
    derivation: null,
    dataset: null,
    dataNotes: [],
    generatedFiles: {},
    bundles: {},
    generatedScreens: [],
    failedScreens: [],
    sandboxErrors: [],
    screenshots: [],
    screenshotNames: [],
    geometryReportsByViewport: {},
    gateSplit: null,
    gateReport: null,
    propViolations: 0,
    advisory: null,
    repairCalls: 0,
    costs: [],
    callsByRole: {},
    timing: null,
    kbChars: 0,
    fingerprint: null,
    status: "running",
    error: null,
  };
}

function usageHook(s: V25RunState) {
  return (rec: UsageRecord) => {
    s.costs.push(rec);
    s.callsByRole[rec.role] = (s.callsByRole[rec.role] ?? 0) + 1;
  };
}

function emitActivity(runId: string, message: string) {
  emitEvent(runId, { type: "activity", message });
}

function setPhase(s: V25RunState, phase: MaxiPhase, status: PhaseStatus, message?: string) {
  emitEvent(s.runId, { type: "phase", phase, status });
  if (message) emitActivity(s.runId, message);
}

function fileKind(path: string): string {
  if (path.startsWith("src/screens/")) return "screen";
  if (path.startsWith("src/components/")) return "component";
  if (path.startsWith("src/lib/")) return "component";
  if (path === "src/data.js") return "data";
  if (path.endsWith(".css")) return "style";
  if (path === "README.md" || path === "package.json" || path === "manifest.json" || path === "src/App.jsx") return "build";
  return "build";
}

async function persistGeneratedFile(runId: string, path: string, content: string): Promise<void> {
  const kind = fileKind(path);
  // The SSE event flows even when persistence fails — clients render from
  // the event stream; the DB is durability, not the delivery path.
  emitEvent(runId, { type: "file", file: { path, kind, content } });
  try {
    await persistFile(runId, { path, kind, content });
  } catch (err) {
    console.warn(`[maxi-agent] failed to persist file ${path}:`, err instanceof Error ? err.message : err);
  }
}

async function persistJsonDoc(runId: string, path: string, title: string, kind: string, value: unknown): Promise<void> {
  const content = JSON.stringify(value, null, 2);
  emitEvent(runId, { type: "doc", doc: { path, title, kind, content } });
  try {
    await persistDoc(runId, { path, title, kind, content });
  } catch (err) {
    console.warn(`[maxi-agent] failed to persist doc ${path}:`, err instanceof Error ? err.message : err);
  }
}

async function persistDocRaw(runId: string, path: string, title: string, kind: string, content: string): Promise<void> {
  emitEvent(runId, { type: "doc", doc: { path, title, kind, content } });
  try {
    await persistDoc(runId, { path, title, kind, content });
  } catch (err) {
    console.warn(`[maxi-agent] failed to persist doc ${path}:`, err instanceof Error ? err.message : err);
  }
}

function chargeCeiling(s: V25RunState): number {
  return s.holdAmount !== undefined ? Math.max(s.holdAmount, s.maxCredits) : s.maxCredits;
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
  opts?: { maxCredits?: number; holdAmount?: number; visualReference?: VisualReference; chat?: ModelChat },
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
    // ══ WAVE 0 — DIRECTION (1 call) + deterministic derive + data ══
    t.begin(0, "discovery");
    setPhase(s, "discovery", "running", "Matching your product to design references…");
    const references = await selectCompanyReferences(prompt, "track", answers.inspiration?.trim().toLowerCase());
    t.end();

    t.begin(0, "direction");
    setPhase(s, "design", "running", "Designing three directions and choosing one…");
    const { runDirectionAgent } = await import("./agents/direction");
    const direction = await runDirectionAgent({
      prompt,
      answers,
      hintManifest: references.primary.manifest,
      visualReference: s.visualReference,
      chat: opts?.chat,
      onUsage,
    });
    const d = direction.derivation;
    s.derivation = d;
    s.kbChars = 0; // kb slice accounting happens inside the direction prompt assembly
    if (direction.usedFallback) emitActivity(runId, "Direction: deterministic fallback blueprint used (model call unavailable)");
    for (const note of direction.notes) emitActivity(runId, `Direction: ${note}`);
    t.end(`calls=${s.callsByRole.direction ?? 0}`);

    const bp = d.blueprint;
    await updateRun(runId, { title: bp.brief.title });
    emitEvent(runId, { type: "title", title: bp.brief.title });
    emitActivity(runId, `${bp.brief.title} — ${bp.brief.productType} · mode ${bp.brief.mode} · concept "${d.concept.name}" · inspired by ${bp.brief.inspiration.primary}`);

    setPhase(s, "brief", "done");
    setPhase(s, "design", "done");

    await persistJsonDoc(runId, "docs/brief/Blueprint.json", "Design Blueprint", "blueprint", bp);
    await persistJsonDoc(runId, "docs/design/DesignTokens.json", "Design Tokens", "design-tokens", d.tokens);
    await persistDocRaw(
      runId,
      "docs/design/Concepts.md",
      "Design Concepts",
      "concepts",
      [
        `# Three directions for ${bp.brief.title}`,
        "",
        ...bp.concepts.map(
          (c, i) => `## ${i + 1}. ${c.name}${i === d.chosenIndex ? " — CHOSEN" : ""}\n\n${c.thesis}\n\n- Fonts: ${c.fonts.display} + ${c.fonts.body}\n- Density: ${c.density} · Corners: ${c.cornerLanguage} · Motion: ${c.motion}\n- Signature moves: ${c.signatureMoves.join("; ")}\n- Primary: ${c.palette.primary} on ${c.palette.background}\n`,
        ),
      ].join("\n"),
    );
    await persistJsonDoc(runId, "docs/planning/ComponentManifest.json", "Component Manifest", "component-manifest", bp.componentManifest);

    setPhase(s, "wireframe", "done");
    emitActivity(runId, `Wave 0 done — blueprint: ${bp.screens.length} screens · ${bp.componentManifest.length} components · 3 concepts`);

    t.begin(0, "data");
    setPhase(s, "data", "running", "Generating the dataset…");
    const generated = generateDataset(bp, prompt + runId);
    s.dataset = generated.dataset;
    s.dataNotes = generated.notes;
    for (const note of generated.notes) emitActivity(runId, `Data: ${note}`);
    const dataJs = composeDataJs(generated.dataset);
    s.generatedFiles["src/data.js"] = dataJs;
    await persistGeneratedFile(runId, "src/data.js", dataJs);
    await persistJsonDoc(runId, "docs/planning/DataPlan.json", "Dataset", "data-plan", generated.dataset);
    emitActivity(runId, `Data: ${generated.dataset.list.rows.length} rows · ${generated.dataset.metrics.length} metrics · ${generated.dataset.activity.length} activity events`);
    setPhase(s, "data", "done");
    t.end();

    // Deterministic shared files.
    t.begin(0, "shared-files");
    const shellJsx = composeShellJsx();
    s.generatedFiles["src/lib/shell.jsx"] = shellJsx;
    await persistGeneratedFile(runId, "src/lib/shell.jsx", shellJsx);
    t.end();

    // ══ WAVE 1 — SYNTHESIS: components ∥ screens, one parallel batch ══
    t.begin(1, "synthesis");
    setPhase(s, "build", "running", `Authoring ${bp.componentManifest.length} components and ${bp.screens.length} screens in parallel…`);
    const authorModule = await import("./agents/author");
    const { authorComponent, authorScreen } = authorModule;
    type AuthorContext = import("./agents/author").AuthorContext;
    const ctx: AuthorContext = {
      blueprint: bp,
      concept: d.concept,
      theme: d.theme,
      dataJs,
      chat: opts?.chat,
      onUsage,
    };

    type Job =
      | { kind: "component"; spec: (typeof bp)["componentManifest"][number] }
      | { kind: "screen"; screen: (typeof bp)["screens"][number] };

    const jobs: Job[] = [
      ...bp.componentManifest.map((spec) => ({ kind: "component", spec }) as Job),
      ...bp.screens.map((screen) => ({ kind: "screen", screen }) as Job),
    ];

    let next = 0;
    const failedComponents: string[] = [];
    const lanes = Array.from({ length: Math.min(AUTHOR_CONCURRENCY, jobs.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= jobs.length) return;
        const job = jobs[i]!;
        try {
          if (job.kind === "component") {
            const out = await authorComponent(ctx, job.spec);
            const path = `src/components/${job.spec.name}.jsx`;
            s.generatedFiles[path] = out.code;
            await persistGeneratedFile(runId, path, out.code);
            emitActivity(runId, `Built ${job.spec.name}`);
          } else {
            const out = await authorScreen(ctx, job.screen);
            const path = `src/screens/${job.screen.id}.jsx`;
            s.generatedFiles[path] = out.code;
            await persistGeneratedFile(runId, path, out.code);
            emitActivity(runId, `Authored screen ${job.screen.id}`);
          }
        } catch (err) {
          const what = job.kind === "component" ? job.spec.name : job.screen.id;
          const message = err instanceof Error ? err.message : String(err);
          if (job.kind === "component") {
            // Last resort: the deterministic fidelity path (v24's lesson).
            const fallbackCode = await fidelityFallbackComponent(what, job.spec.intent, d.theme, onUsage).catch(() => null);
            if (fallbackCode) {
              const path = `src/components/${what}.jsx`;
              s.generatedFiles[path] = fallbackCode;
              await persistGeneratedFile(runId, path, fallbackCode);
              emitActivity(runId, `Built ${what} via the deterministic fidelity fallback (${message})`);
              continue;
            }
            failedComponents.push(what);
            emitActivity(runId, `Build of ${what} failed — screens mounting it will be flagged (${message})`);
          } else {
            s.failedScreens.push(job.screen.id);
            emitActivity(runId, `Screen ${what} could not be authored — flagged (${message})`);
          }
        }
      }
    });
    await Promise.all(lanes);

    // Any screen whose components all failed cannot render — flag it.
    for (const screen of bp.screens) {
      if (s.failedScreens.includes(screen.id)) continue;
      const mounted = bp.componentManifest.filter((c) => c.usedBy.includes(screen.id));
      if (mounted.length > 0 && mounted.every((c) => failedComponents.includes(c.name))) {
        s.failedScreens.push(screen.id);
        emitActivity(runId, `Screen ${screen.id} flagged — every component it mounts failed to build`);
      }
    }

    // Project files.
    const appJsx = composeAppJsx(bp);
    s.generatedFiles["src/App.jsx"] = appJsx;
    await persistGeneratedFile(runId, "src/App.jsx", appJsx);
    const pkg = composePackageJson(bp);
    s.generatedFiles["package.json"] = pkg;
    await persistGeneratedFile(runId, "package.json", pkg);

    // Lint auto-fix pass (deterministic, zero calls).
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
    }

    // Prop-contract audit + auto-fix against the manifest API.
    {
      const contract: PropContract = {
        generatedAt: new Date().toISOString(),
        entries: bp.componentManifest.map((c) => ({
          componentId: c.name,
          componentName: c.name,
          importPath: `src/components/${c.name}.jsx`,
          props: Object.fromEntries(c.props.map((p) => [p.name, { type: p.type, required: p.required, description: p.description ?? "" }])),
        })),
      };
      let violations = 0;
      let autoFixed = 0;
      for (const screen of bp.screens) {
        const path = `src/screens/${screen.id}.jsx`;
        const code = s.generatedFiles[path];
        if (!code) continue;
        const audit = auditScreenProps(code, contract);
        if (audit.violations.length === 0) continue;
        const fixed = applyPropAutoFix(code, audit, contract);
        if (fixed.fixed.length > 0) {
          s.generatedFiles[path] = fixed.code;
          await persistGeneratedFile(runId, path, fixed.code);
          autoFixed += fixed.fixed.length;
        }
        violations += fixed.audit.violations.length;
      }
      s.propViolations = violations;
      if (autoFixed > 0) emitActivity(runId, `Prop contract: auto-fixed ${autoFixed} crash-prone mount(s)`);
      if (violations > 0) emitActivity(runId, `Prop contract: ${violations} violation(s) flagged for repair`);
    }
    t.end(`components=${bp.componentManifest.length - failedComponents.length}/${bp.componentManifest.length} screens=${bp.screens.length - s.failedScreens.length}/${bp.screens.length}`);
    setPhase(s, "build", "done");

    // ══ WAVE 2 — VERIFY (deterministic) ══
    t.begin(2, "verify");
    setPhase(s, "assemble", "running", "Compiling, rendering, and gating every screen…");
    const { css, fontFamilies } = compileStylesForRun(d.theme, s.generatedFiles);
    s.generatedFiles["src/styles.css"] = css;
    await persistGeneratedFile(runId, "src/styles.css", css);

    const verifier = new IncrementalScreenVerifier();
    const verifyRun = async (): Promise<void> => {
      const result = await verifier.verify(s.generatedFiles);
      s.bundles = result.bundles;
      s.generatedScreens = Object.keys(result.bundles);
      s.sandboxErrors = result.errors;
      if (result.smoke === "e2b") {
        emitActivity(runId, `Smoke tests ran in the e2b sandbox (${s.generatedScreens.length} screen(s))`);
      } else {
        emitActivity(runId, `Smoke tests ${result.smoke} — ${s.generatedScreens.length} screen(s) bundled (esbuild)`);
      }
      for (const err of result.errors.slice(0, 5)) {
        emitActivity(runId, `Sandbox error — ${err.file ?? "project"}: ${err.message.slice(0, 160)}`);
      }
      for (const [name, js] of Object.entries(s.bundles)) {
        await persistGeneratedFile(runId, `.build/${name}.js`, js);
      }
    };
    await verifyRun();

    const shotRun = async (): Promise<void> => {
      const shotResult = await captureScreenshots({
        bundles: s.bundles,
        styles: css,
        fonts: fontFamilies,
        heroScalePx: parseFloat(d.theme.cssVars["--text-4xl"] ?? "36"),
      });
      s.screenshots = shotResult.screenshots.map((x) => x.dataUrl);
      s.screenshotNames = shotResult.screenshots.map((x) => x.name);
      s.geometryReportsByViewport = shotResult.geometryReportsByViewport ?? {};
      if (shotResult.reason) emitActivity(runId, `Render: ${shotResult.reason}`);
      else emitActivity(runId, `${s.screenshots.length} screenshot(s) rendered at 1440/768/375`);
    };
    await shotRun();
    t.end(`screens=${s.generatedScreens.length} sandboxes=${Math.max(1, Number(process.env.MAXI_SANDBOX_POOL_SIZE) || 3)}`);

    // Hard/advisory gate split.
    t.begin(2, "gates");
    const gateRun = (): void => {
      const issues: GateIssue[] = [...auditFiles(d.theme, s.generatedFiles).issues];
      for (const e of s.sandboxErrors) {
        const target = e.file && s.generatedFiles[e.file] ? e.file : s.generatedScreens[0] ? `src/screens/${s.generatedScreens[0]}.jsx` : "project";
        issues.push({ file: target, severity: "high", category: "state", description: `Runtime failure: ${e.message}` });
      }
      if (s.propViolations > 0) {
        issues.push({ file: "src/screens", severity: "high", category: "props", description: `${s.propViolations} prop-contract violation(s) survived the auto-fix — required props are missing at mount sites` });
      }
      const pushed = new Set<string>();
      for (const [width, perScreen] of Object.entries(s.geometryReportsByViewport)) {
        for (const [name, geo] of Object.entries(perScreen)) {
          const file = s.generatedFiles[`src/screens/${name}.jsx`] ? `src/screens/${name}.jsx` : name;
          for (const issue of geometryIssuesFor(name, geo, Number(width))) {
            const key = `${file}|${issue.description}`;
            if (pushed.has(key)) continue;
            pushed.add(key);
            issues.push({ ...issue, file });
          }
        }
      }
      issues.push(...a11yScan(s.generatedFiles));
      issues.push(...densityNotes(bp, s.generatedFiles, s.geometryReportsByViewport));

      const split = splitIssues(issues);
      s.gateSplit = split;
      s.gateReport = {
        passed: split.hard.length === 0,
        score: Math.max(0, 100 - split.hard.length * 12 - split.advisory.length * 3),
        issues: issues.slice(0, 40),
      };
      emitActivity(runId, `Gate: ${s.gateReport.passed ? "PASS" : "hard failures"} — ${split.hard.length} hard · ${split.advisory.length} advisory`);
    };
    gateRun();
    await persistJsonDoc(runId, "docs/review/GateReport.json", "Quality Gate", "gate-report", s.gateReport);
    t.end();
    setPhase(s, "assemble", "done");

    // Present screens (before review, unchanged contract).
    setPhase(s, "present", "running", "Presenting your screens…");
    emitEvent(runId, { type: "screens", screens: s.generatedScreens });
    await mergeManifest(runId, { screens: s.generatedScreens, failedScreens: s.failedScreens, phases: { present: "done" } });
    emitActivity(runId, `Presented ${s.generatedScreens.length} screen(s)`);
    setPhase(s, "present", "done");

    // Quality floor: zero verified screens is an error state.
    if (s.generatedScreens.length === 0) {
      const msg = "No screens verified — every screen failed to author or bundle. Check the builder output.";
      s.status = "error";
      s.error = msg;
      await updateRun(runId, { status: "error", error: msg });
      emitEvent(runId, { type: "error", message: msg });
      await settleCredits(s);
      return;
    }

    // ══ WAVE 3 — POLISH (bounded repair, hard failures only) ══
    if ((s.gateSplit?.hard.length ?? 0) > 0 && s.repairCalls < MAX_REPAIR_CALLS) {
      if (ledgerFromUsage(s.costs).totalCredits <= chargeCeiling(s)) {
        t.begin(3, "repair");
        setPhase(s, "build", "running");
        emitActivity(runId, `Polish: up to ${MAX_REPAIR_CALLS - s.repairCalls} repair call(s) for ${s.gateSplit!.hard.length} hard failure(s)…`);
        const { repairFile } = await import("./agents/repair");

        const targets = new Map<string, string[]>();
        for (const issue of s.gateSplit!.hard) {
          const file = issue.file ?? "";
          if (!s.generatedFiles[file]) continue;
          targets.set(file, [...(targets.get(file) ?? []), issue.description]);
        }

        const conceptLine = `${bp.brief.title} — concept "${d.concept.name}": ${d.concept.thesis}`;
        const screenshotByScreen = new Map<string, string>();
        for (let i = 0; i < s.screenshotNames.length; i++) {
          screenshotByScreen.set(s.screenshotNames[i]!, s.screenshots[i]!);
        }

        for (const [path, issues] of targets) {
          if (s.repairCalls >= MAX_REPAIR_CALLS) break;
          const screenName = path.startsWith("src/screens/") ? path.slice("src/screens/".length).replace(/\.jsx$/, "") : null;
          const screenshot = screenName !== null ? screenshotByScreen.get(screenName) : undefined;
          try {
            s.repairCalls++;
            const repaired = await repairFile({
              path,
              code: s.generatedFiles[path]!,
              issues,
              theme: d.theme,
              ...(screenshot ? { screenshotDataUrl: screenshot } : {}),
              conceptLine,
              chat: opts?.chat,
              onUsage,
            });
            s.generatedFiles[path] = repaired;
            await persistGeneratedFile(runId, path, repaired);
            emitActivity(runId, `Repaired ${path}`);
          } catch (err) {
            emitActivity(runId, `Repair of ${path} failed (${err instanceof Error ? err.message : String(err)})`);
          }
        }

        // One re-verify round for everything the repairs touched.
        setPhase(s, "build", "done");
        setPhase(s, "assemble", "running", "Re-verifying…");
        t.begin(3, "reverify");
        await verifyRun();
        await shotRun();
        gateRun();
        await persistJsonDoc(runId, "docs/review/GateReport.json", "Quality Gate", "gate-report", s.gateReport);
        t.end(`repairs=${s.repairCalls} hard=${s.gateSplit?.hard.length ?? 0}`);
        setPhase(s, "assemble", "done");
      } else {
        emitActivity(runId, "Budget ceiling reached — skipping polish");
      }
    } else if ((s.gateSplit?.hard.length ?? 0) > 0) {
      emitActivity(runId, `Polish budget exhausted — ${s.gateSplit!.hard.length} hard failure(s) ship flagged`);
    }

    // ══ WAVE 4 — ADVISORY REVIEW (non-blocking) + FINALIZE ══
    t.begin(4, "advisory");
    setPhase(s, "review", "running", "Scoring the design (advisory — never blocks)…");
    const { runAdvisoryReview } = await import("./agents/advisory-review");
    s.advisory = await runAdvisoryReview({
      contextLine: `${bp.brief.title} — ${bp.brief.productType}. Concept "${d.concept.name}": ${d.concept.thesis}`,
      screens: s.generatedScreens,
      fileSummaries: s.generatedScreens.map((name) => ({ path: `src/screens/${name}.jsx`, code: s.generatedFiles[`src/screens/${name}.jsx`] ?? "" })),
      screenshotNames: s.screenshotNames,
      screenshots: s.screenshots,
      gateStats: { hard: s.gateSplit?.hard.length ?? 0, advisory: s.gateSplit?.advisory.length ?? 0 },
      chat: opts?.chat,
      onUsage,
    });
    emitActivity(runId, `Advisory review: ${s.advisory.score}/100 (${s.advisory.verdict})${s.advisory.estimated ? " — estimated (review model unavailable)" : ""}`);
    await persistJsonDoc(runId, "docs/review/AdvisoryReview.json", "Advisory Review", "advisory-review", s.advisory);
    setPhase(s, "review", "done");
    t.end(`score=${s.advisory.score}`);

    // ══ DONE — manifest, fingerprint, export docs ══
    const costs = ledgerFromUsage(s.costs);
    const report = t.report();
    s.timing = report;
    s.fingerprint = uniquenessFingerprint(bp, s.generatedFiles);

    const fileManifest: FileManifest = buildFileManifest(s.generatedFiles, bp);
    const manifestJson = JSON.stringify(fileManifest, null, 2);
    s.generatedFiles["manifest.json"] = manifestJson;
    await persistGeneratedFile(runId, "manifest.json", manifestJson);
    const readme = composeReadme(bp, s.dataset!, Object.keys(s.generatedFiles).filter((p) => p.startsWith("src/") || p === "package.json"));
    s.generatedFiles["README.md"] = readme;
    await persistGeneratedFile(runId, "README.md", readme);

    s.status = (s.gateSplit?.hard.length ?? 0) === 0 && s.failedScreens.length === 0 ? "done" : "done_needs_review";
    emitActivity(runId, `Run cost: $${costs.totalDollars.toFixed(4)} (${costs.totalCredits.toFixed(2)} credits) across ${costs.entries.length} model call(s)`);
    emitActivity(runId, `Waves: w0=${(waveMs(report, 0) / 1000).toFixed(1)}s w1=${(waveMs(report, 1) / 1000).toFixed(1)}s w2=${(waveMs(report, 2) / 1000).toFixed(1)}s w3=${(waveMs(report, 3) / 1000).toFixed(1)}s w4=${(waveMs(report, 4) / 1000).toFixed(1)}s — total ${report.wallSeconds}s`);
    emitActivity(runId, `Fingerprint: ${s.fingerprint}`);
    if (s.status === "done_needs_review") emitActivity(runId, "Hard-gate failures survived polish — run marked done_needs_review (shipped but QA-failed).");

    await persistJsonDoc(runId, "docs/timing/TimingReport.json", "Wave Timing Report", "timing-report", report);
    await persistJsonDoc(runId, "docs/timing/CallCounts.json", "Model Call Counts", "call-counts", {
      callsByRole: s.callsByRole,
      totalCalls: s.costs.length,
    });

    const manifestOut: AgentManifest & Record<string, unknown> = {
      screens: s.generatedScreens,
      docs: [
        "docs/brief/Blueprint.json",
        "docs/design/DesignTokens.json",
        "docs/design/Concepts.md",
        "docs/planning/ComponentManifest.json",
        "docs/planning/DataPlan.json",
        "docs/review/GateReport.json",
        "docs/review/AdvisoryReview.json",
        "docs/timing/TimingReport.json",
      ],
      brandKit: {
        colors: Object.fromEntries(Object.entries(d.tokens.colors).filter(([k]) => k !== "chart")) as Record<string, string>,
        fonts: { ...d.tokens.fonts },
        sizes: { sectionPaddingY: String(d.tokens.sectionPaddingY), sectionGap: String(d.tokens.sectionGap) },
        radius: Object.fromEntries(Object.entries(d.tokens.radius).map(([k, v]) => [k, `${v}px`])) as Record<string, string>,
      },
      visualIntent: null,
      styleSeed: d.concept.name,
      phases: {
        discovery: "done",
        design: "done",
        brief: "done",
        data: "done",
        wireframe: "done",
        review: "done",
        build: "done",
        assemble: s.failedScreens.length === 0 ? "done" : "error",
        present: "done",
      },
      failedScreens: s.failedScreens,
      costs,
      quality: {
        passed: s.status === "done",
        score: s.advisory.score,
        repairs: s.repairCalls,
      },
      company: bp.brief.inspiration.primary,
      reviewResult: null,
      timing: report,
      callsByRole: s.callsByRole,
      kbSlices: { "wave0-direction": { chars: s.kbChars, files: [] } },
      // v25 extras
      concepts: bp.concepts.map((c) => ({ name: c.name, thesis: c.thesis })),
      chosenConcept: d.concept.name,
      fingerprint: s.fingerprint,
      fileManifest: fileManifest.files,
    };

    // The final updateRun clears `error` — a completed run never carries a
    // stale interruption stamp (v24 WS8).
    await updateRun(runId, {
      status: s.status,
      title: bp.brief.title,
      manifest: manifestOut,
      error: null,
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

// ── Helpers ────────────────────────────────────────────────────────────────

/** The deterministic last resort for a component whose authoring failed. */
async function fidelityFallbackComponent(
  name: string,
  intent: string,
  theme: ResolvedTheme,
  onUsage: (rec: UsageRecord) => void,
): Promise<string | null> {
  const anchor = name.toLowerCase();
  const { loadBaseComponent, maxiTokensFromTheme } = await import("./lib/base-components");
  const base = loadBaseComponent(anchor);
  if (!base) return null;
  const { generateComponentWithFidelity } = await import("./lib/fidelity");
  const tokens = maxiTokensFromTheme(theme);
  const entry = {
    id: name,
    name,
    taxonomy: "primitive" as const,
    baseComponent: base.name,
    description: intent,
    props: [],
    variants: [],
    states: [],
    customization: `Adapt the base ${base.name} to this product's theme, density, and purpose: ${intent}`,
  };
  const { code } = await generateComponentWithFidelity({
    entry,
    tokens,
    productContext: intent,
    creativeSeed: name,
    extraContext: `Repair mode: the from-scratch generation failed. Rewrite the base for this product and ensure a default export named ${name}.`,
    onUsage,
  });
  let final = code;
  if (!/export\s+default\b/.test(final)) {
    const fallbackName = base.name.split("-").map((p) => p[0]!.toUpperCase() + p.slice(1)).join("");
    final = `${final}\nexport default ${final.includes(`function ${name}`) ? name : fallbackName};\n`;
  }
  return final;
}

async function settleCredits(s: V25RunState): Promise<void> {
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

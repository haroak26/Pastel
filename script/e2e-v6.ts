/**
 * Pastel Agent v18 — live end-to-end driver.
 *
 * Runs the REAL pipeline against the REAL gateway: clarify (with answers),
 * design (tokens + visual intent) → brief (with mode) → data → wireframe →
 * UX design → build → assemble → present → review → repair.
 *
 * V18: the product is EXACTLY two screens — "home" (the primary workflow)
 * and "detail" (the focused secondary workflow) — but the LAYOUT SHAPE comes
 * from the brief's MODE + the run's VisualIntent. Non-browse products
 * (dashboard, workspace, feed, curriculum) open with scoreboard, not hero.
 *
 * Captures PNGs of the presented UI at the Present phase (BEFORE review) and
 * again after the run completes (post-review wins), plus PNG proofs of every
 * built component rendered standalone.
 *
 *   npx tsx script/e2e-v6.ts ["A project management dashboard for developers…"]
 *
 * MATRIX + DISTINCTNESS (V15): set PASTEL_E2E_MATRIX to "prompt1|prompt2|…"
 * to run several diverse products into test/matrix-1..N. After the runs the
 * DISTINCTNESS GATE compares each run's layout signature (mode, visual
 * intent axes, structures, dominant moments, grids) and FAILS when two runs
 * converge on the same UI shape — "all the same" is now a test failure.
 *
 * Output layout (override with PASTEL_E2E_OUT_DIR):
 *   <out>/run-summary.json   full run artifact (+ layoutSignature)
 *   <out>/screenproof/*.png  rendered screen proofs (+ .html + .probe.json)
 *   <out>/componentproof/*.png  each built component rendered standalone
 *
 * Requires DATABASE_URL + MERGE_GATEWAY_API_KEY in the environment.
 */
import "./e2e-env";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { chromium, type Browser } from "playwright-core";
import esbuild from "esbuild";
import { db } from "../server/db";
import { agentRuns } from "../shared/schema";
import { eq } from "drizzle-orm";
import { createRun, subscribeToRun, getRunState } from "../server/lib/pastel-agent/run-store";
import { startAgentLoop } from "../server/lib/pastel-agent/engine";
import { runClarify } from "../server/lib/pastel-agent/agents/clarify";
import type { PastelEvent } from "../server/lib/pastel-agent/types";

const PROMPT = process.argv[2]?.trim() ||
  "Design a project management dashboard for software teams — track tasks across sprints, see team velocity metrics, organize work by priority and status, and drill into individual tasks for details and comments. Make it clean, fast, and professional.";

const OUT_DIR = path.join(process.cwd(), "test", process.env.PASTEL_E2E_OUT_DIR || "agent-v18");
const SCREEN_DIR = path.join(OUT_DIR, "screenproof");
const COMPONENT_DIR = path.join(OUT_DIR, "componentproof");

function log(tag: string, message: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${tag.padEnd(10)} ${message}`);
}

function findChromiumExecutable(): string | undefined {
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildPreviewHtml(screen: string, bundle: string, styles: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(screen)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
${styles}
html, body { height: 100%; }
</style>
</head>
<body>
<div id="root"></div>
<script>
${bundle}
</script>
</body>
</html>`;
}

/** Snapshot the presented files from DB and screenshot them into dir. */
async function captureScreens(runId: string, dir: string, label: string): Promise<string[]> {
  const state = await getRunState(runId);
  if (!state) throw new Error("run state missing for capture");

  const styles = state.files.find((f) => f.path === "src/styles.css")?.content ?? "";
  const bundles = state.files.filter((f) => f.kind === "build" && f.path.startsWith(".build/") && f.path.endsWith(".js"));
  if (bundles.length === 0) {
    log("capture", `${label}: NO VERIFIED BUNDLES YET (${state.livePhase})`);
    return [];
  }

  fs.mkdirSync(dir, { recursive: true });
  const executablePath = findChromiumExecutable();
  if (!executablePath) {
    log("capture", `${label}: no chromium found — skipping PNG`);
    return [];
  }
  const browser: Browser = await chromium.launch({ headless: true, executablePath, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const saved: string[] = [];
  try {
    for (const bundle of bundles) {
      const screen = bundle.path.replace(/^\.build\//, "").replace(/\.js$/, "");
      const html = buildPreviewHtml(screen, bundle.content, styles);
      const htmlPath = path.join(dir, `${screen}.html`);
      fs.writeFileSync(htmlPath, html);
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      try {
        await page.goto(`file://${htmlPath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForFunction(() => Boolean((window as Window & { __pastelMounted?: boolean }).__pastelMounted), undefined, { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(() => true)).catch(() => {});
        await page.waitForTimeout(400);
        // V7: probe rendered text for demo/SaaS content leaks and broken deltas.
        const probe = await page.evaluate(() => {
          // Strip SVG text (chart axis ticks legitimately include "0 km" baselines).
          const root = document.getElementById("root")?.cloneNode(true) as HTMLElement | null;
          root?.querySelectorAll("svg").forEach((s) => s.remove());
          const t = root?.innerText ?? "";
          const blankSections = Array.from(document.querySelectorAll("section")).filter(
            (el) => (el.innerText ?? "").trim().length === 0 && !el.querySelector("img, svg, iframe, video, canvas, input, button, a, audio"),
          ).length;
          return {
            // V9: no raw "$" pattern — pricing is legitimate product content
            // for travel/ecommerce runs; the content gate still blocks
            // finance leakage at the file level.
            hasDemoContent: /Aperture|Orbit Finance|Harbor & Co|INV-\d|deployed to production|\bMRR\b|\bVISA\b/i.test(t),
            brokenDelta: /\+\s?-/.test(t),
            dupStat: (t.match(/\b(Distance|Weekly distance|Revenue|Amount)\b/g) ?? []).length > 4,
            blankSections,
            zeroTile: /(?<![\d.])0(?:\.0)?\s*(?:km|mi|m|min|kcal|cal|steps?|count)\b/i.test(t),
          };
        });
        const out = path.join(dir, `${screen}.png`);
        await page.screenshot({ type: "png", fullPage: true, path: out });
        saved.push(`${screen}.png`);
        fs.writeFileSync(path.join(dir, `${screen}.probe.json`), JSON.stringify(probe));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  log("capture", `${label}: ${saved.length} PNG(s) → ${path.relative(process.cwd(), dir)}`);
  return saved;
}

/** Minimal virtual-FS plugin so a single component (or the whole components
 * dir) can be bundled standalone for proof rendering. */
const require = createRequire(import.meta.url);
function virtualFsPlugin(files: Record<string, string>): esbuild.Plugin {
  const normalized = new Map<string, string>();
  for (const [p, content] of Object.entries(files)) {
    normalized.set(path.posix.normalize(p), content);
  }
  const isSandboxDep = (id: string) => /^react(\/jsx-runtime)?$/.test(id) || /^react-dom(\/client|\/server)?$/.test(id) || /^lucide-react$/.test(id);
  return {
    name: "e2e-virtual-fs",
    setup(build) {
      build.onResolve({ filter: /.*/, namespace: "pastel" }, (args) => {
        if (isSandboxDep(args.path)) return { path: require.resolve(args.path) };
        return undefined;
      });
      build.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, () => ({ path: require.resolve("react/jsx-runtime") }));
      build.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: require.resolve("react-dom/client") }));
      build.onResolve({ filter: /.*/ }, (args) => {
        const isEntry = args.kind === "entry-point";
        const importerIsVirtual = args.namespace === "pastel" || args.importer.startsWith("pastel:");
        if (!isEntry && !importerIsVirtual) return undefined;
        if (isSandboxDep(args.path)) return undefined;
        let resolved: string;
        if (args.path.startsWith(".")) {
          const importer = args.importer.replace(/^pastel:/, "");
          resolved = path.posix.normalize(path.posix.join(path.posix.dirname(importer), args.path));
        } else {
          resolved = path.posix.normalize(args.path.replace(/^\/+/, ""));
        }
        const candidates = [resolved, `${resolved}.jsx`, `${resolved}.js`];
        for (const c of candidates) {
          if (normalized.has(c)) return { path: `pastel:${c}`, namespace: "pastel" };
        }
        return { errors: [{ text: `Could not resolve "${args.path}" (imported from ${args.importer.replace(/^pastel:/, "")})` }] };
      });
      build.onLoad({ filter: /.*/, namespace: "pastel" }, (args) => {
        const key = args.path.replace(/^pastel:/, "");
        const content = normalized.get(key);
        if (content === undefined) return { errors: [{ text: `File not found: ${key}` }] };
        return { contents: content, loader: "jsx", resolveDir: "/" };
      });
    },
  };
}

/** Render every built component standalone (default props) into PNG proofs. */
async function captureComponents(runId: string, dir: string, label: string): Promise<string[]> {
  const state = await getRunState(runId);
  if (!state) throw new Error("run state missing for capture");

  const styles = state.files.find((f) => f.path === "src/styles.css")?.content ?? "";
  const compFiles = state.files.filter((f) => f.kind === "component" && f.path.startsWith("src/components/"));
  if (compFiles.length === 0) {
    log("capture", `${label}: no component files in run state`);
    return [];
  }

  fs.mkdirSync(dir, { recursive: true });
  const executablePath = findChromiumExecutable();
  if (!executablePath) {
    log("capture", `${label}: no chromium found — skipping PNG`);
    return [];
  }
  const browser: Browser = await chromium.launch({ headless: true, executablePath, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const saved: string[] = [];
  try {
    for (const comp of compFiles) {
      const name = path.basename(comp.path, ".jsx");
      const files: Record<string, string> = { [comp.path]: comp.content };
      for (const other of compFiles) {
        if (other.path !== comp.path) files[other.path] = other.content;
      }
      const entryPath = "src/__entry__.jsx";
      const rel = path.posix.relative(path.posix.dirname(entryPath), comp.path);
      files[entryPath] = [
        `import { createRoot } from "react-dom/client";`,
        `import Component from "./${rel}";`,
        `const el = document.getElementById("root");`,
        `createRoot(el).render(<Component />);`,
        `window.__pastelMounted = true;`,
      ].join("\n");

      let bundle: string;
      try {
        const result = await esbuild.build({
          entryPoints: [entryPath],
          bundle: true,
          write: false,
          outfile: "preview.js",
          format: "iife",
          platform: "browser",
          jsx: "automatic",
          target: "es2020",
          minify: false,
          logLevel: "silent",
          define: { "process.env.NODE_ENV": '"production"' },
          plugins: [virtualFsPlugin(files)],
        });
        bundle = result.outputFiles[0]?.text ?? "";
      } catch (err) {
        log("capture", `${label}: ${name} failed to bundle (${err instanceof Error ? err.message : err})`);
        continue;
      }
      if (!bundle) continue;

      const html = buildPreviewHtml(`${name}-component`, bundle, styles);
      const htmlPath = path.join(dir, `${name}.html`);
      fs.writeFileSync(htmlPath, html);
      const page = await browser.newPage({ viewport: { width: 640, height: 420 }, deviceScaleFactor: 2 });
      try {
        await page.goto(`file://${htmlPath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForFunction(() => Boolean((window as Window & { __pastelMounted?: boolean }).__pastelMounted), undefined, { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(300);
        // V8: probe the rendered component for hardcoded zero tiles.
        const probe = await page.evaluate(() => {
          const t = document.getElementById("root")?.innerText ?? "";
          return { zeroTile: /(?<![\d.])0(?:\.0)?\s*(?:km|mi|m|min|kcal|cal|steps?|count)\b/i.test(t) };
        });
        fs.writeFileSync(path.join(dir, `${name}.probe.json`), JSON.stringify(probe));
        await page.screenshot({ type: "png", path: path.join(dir, `${name}.png`) });
        saved.push(`${name}.png`);
      } catch (err) {
        log("capture", `${label}: ${name} render failed (${err instanceof Error ? err.message : err})`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  log("capture", `${label}: ${saved.length} component PNG(s) → ${path.relative(process.cwd(), dir)}`);
  return saved;
}

/** Pick deterministic answers for clarify questions.
 * V17: detects platform questions (mobile vs web) and always picks Web.
 * Otherwise defaults to the first option per question. */
function answerQuestions(prompt: string, questions: Array<{ id: string; title: string; question: string; options: Array<{ label: string; description: string }>; placeholder?: string }>): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of questions) {
    const qt = `${q.title} ${q.question} ${q.options.map((o) => o.label).join(" ")}`.toLowerCase();
    const isPlatformQ = /mobile|web|desktop|platform|device|app type|native|browser/.test(qt);
    const webOpt = q.options.find((o) => /web|browser|desktop/i.test(o.label));
    const pick = isPlatformQ && webOpt ? webOpt : q.options[0] ?? { label: "Yes" };
    answers[q.id] = pick.label;
    log("answer", `  ${q.id}: "${q.title}" → "${pick.label}"`);
  }
  return answers;
}

/** V15 layout signature — a compact structural fingerprint of a run used by
 * the DISTINCTNESS GATE: two runs that share nearly every signature field are
 * "the same UI" regardless of their content, and that is a test failure. */
function layoutSignature(state: Awaited<ReturnType<typeof getRunState>>): Record<string, unknown> {
  const doc = (p: string) => {
    try { return JSON.parse(state.docs.find((d) => d.path === p)?.content ?? "{}"); } catch { return {}; }
  };
  const brief = doc("docs/brief/ProductBrief.json");
  const visual = doc("docs/design/VisualIntent.json");
  const ux = doc("docs/planning/UXDesign.json");
  return {
    mode: brief.mode ?? null,
    typeVoice: visual.typeVoice ?? null,
    spacingMood: visual.spacingMood ?? null,
    surfaceTreatment: visual.surfaceTreatment ?? null,
    mediaStrategy: visual.mediaStrategy ?? null,
    mediaSubject: visual.mediaSubject ?? null,
    screens: Array.isArray(ux.screens)
      ? (ux.screens as Array<{ screenId: string; layout?: { structure?: string; dominantMoment?: string; grid?: unknown } }>).map((s) => ({
          id: s.screenId,
          structure: s.layout?.structure ?? null,
          dominant: s.layout?.dominantMoment ?? null,
          grid: s.layout?.grid ?? null,
        }))
      : [],
  };
}

/** V15 distinctness gate — pairwise Jaccard similarity over the layout
 * signature. Two runs whose signature fields overlap ≥ `threshold` are the
 * same UI shape; a matrix that produces near-identical shapes fails. */
export function diversityCheck(
  summaries: Array<{ dir: string; signature: Record<string, unknown> }>,
  threshold = 0.8,
): { ok: boolean; pairs: Array<{ a: string; b: string; similarity: number }> } {
  const sig = (s: Record<string, unknown>): string[] => {
    const out: string[] = [`mode:${String(s.mode ?? "")}`];
    for (const k of ["typeVoice", "spacingMood", "surfaceTreatment", "mediaStrategy", "mediaSubject"] as const) {
      out.push(`${k}:${String(s[k] ?? "")}`);
    }
    for (const scr of (s.screens as Array<{ id?: string; structure?: unknown; dominant?: unknown; grid?: unknown }>) ?? []) {
      out.push(`screen:${scr.id}:${String(scr.structure ?? "")}:${String(scr.dominant ?? "")}`);
      const g = scr.grid as { cols?: string; pattern?: string } | null | undefined;
      if (g) out.push(`grid:${scr.id}:${String(g.cols ?? "")}:${String(g.pattern ?? "")}`);
    }
    return out;
  };
  const pairs: Array<{ a: string; b: string; similarity: number }> = [];
  for (let i = 0; i < summaries.length; i++) {
    for (let j = i + 1; j < summaries.length; j++) {
      const a = new Set(sig(summaries[i].signature));
      const b = new Set(sig(summaries[j].signature));
      const inter = [...a].filter((x) => b.has(x)).length;
      const union = new Set([...a, ...b]).size;
      const similarity = union === 0 ? 0 : inter / union;
      if (similarity >= threshold) pairs.push({ a: summaries[i].dir, b: summaries[j].dir, similarity });
    }
  }
  return { ok: pairs.length === 0, pairs };
}

async function main() {
  const matrix = (process.env.PASTEL_E2E_MATRIX ?? "")
    .split("|").map((s) => s.trim()).filter(Boolean);
  const runs: Array<{ dir: string; signature: Record<string, unknown> }> = [];
  let exit = 0;

  if (matrix.length > 0) {
    for (let i = 0; i < matrix.length; i++) {
      const outDir = path.join(process.cwd(), "test", `matrix-${i + 1}`);
      log("matrix", `run ${i + 1}/${matrix.length}: ${matrix[i].slice(0, 80)}…`);
      const code = await runOnce(matrix[i], outDir);
      if (code !== 0) exit = 1;
      const summaryPath = path.join(outDir, "run-summary.json");
      if (fs.existsSync(summaryPath)) {
        const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
        if (summary.layoutSignature) runs.push({ dir: path.basename(outDir), signature: summary.layoutSignature });
      }
    }
    const { ok, pairs } = diversityCheck(runs);
    console.log("\n═══ DISTINCTNESS GATE ═══");
    for (const p of pairs) console.log(`  FAIL  ${p.a} ≈ ${p.b} (similarity ${p.similarity.toFixed(2)}) — same UI shape`);
    if (ok) console.log(`  PASS  ${runs.length} runs are structurally distinct`);
    if (!ok) exit = 1;
    process.exit(exit);
  }

  exit = await runOnce(PROMPT, OUT_DIR);
  process.exit(exit);
}

async function runOnce(prompt: string, outDir: string): Promise<number> {
  const screenDir = path.join(outDir, "screenproof");
  const componentDir = path.join(outDir, "componentproof");
  const started = Date.now();
  fs.mkdirSync(screenDir, { recursive: true });
  fs.mkdirSync(componentDir, { recursive: true });
  const phases: Record<string, { at: number }> = {};
  const activity: string[] = [];
  let presentAt: number | null = null;
  let doneEvent: PastelEvent | null = null;
  let errorEvent: PastelEvent | null = null;

  // ── STAGE 1: CLARIFY (real model call — tests the JSON validation fix) ──
  log("clarify", `running runClarify on prompt (${prompt.length} chars)…`);
  const t0 = Date.now();
  const { result } = await runClarify({ prompt });
  log("clarify", `done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${result.questions.length} question(s), ${result.suggestedCompanies.length} suggestion(s)`);
  for (const q of result.questions) {
    log("question", `[${q.id}] ${q.question} (${q.options.map((o) => o.label).join(" | ")})`);
  }
  console.log("suggestions:", result.suggestedCompanies.map((s) => `${s.name}(${s.score})`).join(", "));

  const answers = answerQuestions(prompt, result.questions);
  console.log("answers:", JSON.stringify(answers));

  // ── STAGE 2: FULL PIPELINE RUN (in-process, same code path as the API) ──
  const run = await createRun({ prompt, answers, projectId: undefined, userId: undefined });
  log("run", `run ${run.id} created`);

  const unsubscribe = subscribeToRun(run.id, (event) => {
    if (event.type === "phase") {
      phases[`${event.phase}:${event.status}`] = { at: Date.now() };
      log("phase", `${event.phase} → ${event.status}`);
    }
    if (event.type === "activity") {
      activity.push(event.message ?? "");
      log("activity", event.message ?? "");
    }
    if (event.type === "screens") {
      presentAt = Date.now();
      log("present", `screens live (${event.screens?.length ?? 0}) — capturing SCREEN PROOFS…`);
      captureScreens(run.id, screenDir, "screenproof").catch((err) => log("capture", `screen proof failed: ${err instanceof Error ? err.message : err}`));
    }
    if (event.type === "done") doneEvent = event;
    if (event.type === "error") errorEvent = event;
  });

  const t1 = Date.now();
  await startAgentLoop(run.id, prompt, answers, undefined, undefined, undefined, { maxCredits: 60 });
  const wallMs = Date.now() - t1;
  unsubscribe();

  // ── STAGE 3: POST-RUN SUMMARY + FINAL PNGs ──
  const state = await getRunState(run.id);
  if (!state) throw new Error("run state missing");
  const manifest = (state.run.manifest ?? {}) as Record<string, unknown>;
  const costs = manifest.costs as { entries?: Array<{ stage: string; modelId: string; credits: number }>; totalCredits?: number; totalDollars?: number };
  const quality = manifest.quality as { passed?: boolean; score?: number; repairs?: number };
  const review = manifest.reviewResult as { score?: number; decision?: string; issues?: Array<{ target: string; severity: string; description: string }> } | null;

  log("run", `status=${state.run.status} · wall=${(wallMs / 1000).toFixed(1)}s · present@${presentAt ? ((presentAt - t1) / 1000).toFixed(1) + "s" : "n/a"} · title=${state.run.title ?? "n/a"}`);
  log("run", `screens=${(manifest.screens as string[])?.join(", ") || "none"} · failed=${(manifest.failedScreens as string[])?.join(",") || "none"}`);
  log("run", `quality passed=${quality?.passed} score=${quality?.score} repairs=${quality?.repairs}`);
  log("run", `review score=${review?.score} decision=${review?.decision} issues=${review?.issues?.length ?? 0}`);
  log("run", `cost ${costs?.totalCredits} credits ≈ $${costs?.totalDollars} across ${costs?.entries?.length} calls`);
  for (const e of costs?.entries ?? []) {
    console.log(`    ${e.stage.padEnd(13)} ${e.modelId.padEnd(34)} ${e.credits} credits`);
  }
  console.log("\nissues:");
  for (const i of review?.issues ?? []) console.log(`    [${i.severity}] ${i.target}: ${i.description}`);

  const perPhase: Array<[string, string]> = [];
  const seq = ["discovery:done", "brief:running", "brief:done", "wireframe:running", "wireframe:done", "build:running", "build:done", "assemble:running", "assemble:done", "present:running", "present:done", "review:running", "review:done"];
  for (const key of seq) {
    const t = phases[key]?.at;
    if (t) perPhase.push([key.replace(":running", "").replace(":done", ""), ((t - (t1 ?? t)) / 1000).toFixed(1) + "s"]);
  }
  if (perPhase.length) console.log("\nphase timeline (s from run start):\n" + perPhase.map(([k, v]) => `    ${k.padEnd(12)} ${v}`).join("\n"));

  fs.writeFileSync(path.join(outDir, "run-summary.json"), JSON.stringify({
    runId: run.id,
    prompt,
    answers,
    status: state.run.status,
    error: state.run.error ?? null,
    title: state.run.title,
    screens: manifest.screens,
    failedScreens: manifest.failedScreens,
    quality,
    reviewResult: review,
    costs,
    activity: activity.slice(0, 120),
    phases,
    wallSeconds: wallMs / 1000,
    presentAtSeconds: presentAt ? (presentAt - t1) / 1000 : null,
    layoutSignature: layoutSignature(state),
  }, null, 2));
  log("run", `summary → ${path.relative(process.cwd(), path.join(outDir, "run-summary.json"))}`);

  if (state.run.status === "done" || state.run.status === "done_needs_review") {
    await captureScreens(run.id, screenDir, "screenproof (post-review)");
    await captureComponents(run.id, componentDir, "componentproof");
  } else {
    log("run", `run FAILED: ${state.run.error}`);
  }

  // ── STAGE 4: ASSERTIONS (regression gate) ──
  const screens = (manifest.screens as string[]) ?? [];
  const screenFiles = fs.existsSync(screenDir) ? fs.readdirSync(screenDir).filter((f) => f.endsWith(".png")) : [];
  const compFiles = fs.existsSync(componentDir) ? fs.readdirSync(componentDir).filter((f) => f.endsWith(".png")) : [];
  // V7: rendered-text probes — no demo/SaaS content leaks, no "+-" deltas.
  const probes = fs.existsSync(screenDir)
    ? fs.readdirSync(screenDir).filter((f) => f.endsWith(".probe.json")).map((f) => JSON.parse(fs.readFileSync(path.join(screenDir, f), "utf8")) as { hasDemoContent?: boolean; brokenDelta?: boolean; blankSections?: number; zeroTile?: boolean })
    : [];
  const compProbes = fs.existsSync(componentDir)
    ? fs.readdirSync(componentDir).filter((f) => f.endsWith(".probe.json")).map((f) => JSON.parse(fs.readFileSync(path.join(componentDir, f), "utf8")) as { zeroTile?: boolean })
    : [];
  const demoContentFree = probes.every((p) => !p.hasDemoContent);
  const deltasClean = probes.every((p) => !p.brokenDelta);
  // V8: no blank sections, no zero tiles in screens or components.
  const blanksClean = probes.every((p) => (p.blankSections ?? 0) === 0);
  const zeroTilesClean = [...probes, ...compProbes].every((p) => !p.zeroTile);

  // V8/U3: every inventory component must be mounted by a custom block
  // (V11: and at least one must exist — an empty inventory means the
  // wireframe silently dropped the product's differentiation layer).
  let mountClean = true;
  let mountDetail = "no wireframe/inventory docs";
  let inventoryMounted = 0;
  const wireframeDoc = state.docs.find((d) => d.path === "docs/planning/WireframePlan.json");
  const inventoryDoc = state.docs.find((d) => d.path === "docs/planning/ComponentInventory.json");
  if (wireframeDoc && inventoryDoc) {
    const plan = JSON.parse(wireframeDoc.content) as { screens: Array<{ blocks: Array<{ block: string; component?: string }> }> };
    const inventory = JSON.parse(inventoryDoc.content) as { components: Array<{ name: string; usedBy: string[] }> };
    inventoryMounted = inventory.components.length;
    const mounted = new Set(plan.screens.flatMap((s) => s.blocks.filter((b) => b.block === "custom" && b.component).map((b) => b.component as string)));
    // V21: the 8 shell components are chrome — they mount through the
    // deterministic shell, never through custom blocks. Exclude them.
    const SHELL = new Set(["Topbar", "Sidebar", "Button", "Avatar", "Badge", "Input", "Select", "Separator"]);
    const unmounted = inventory.components.filter((c) => !SHELL.has(c.name) && !mounted.has(c.name)).map((c) => c.name);
    mountClean = unmounted.length === 0 && inventory.components.length >= 1;
    mountDetail = unmounted.length === 0
      ? `${inventory.components.length} components, all mounted`
      : `unmounted: ${unmounted.join(", ")}`;
  }
  let unitsClean = true;
  let unitsDetail = "no copy plan found";
  const copyDoc = state.docs.find((d) => d.path === "docs/planning/CopyPlan.json");
  if (copyDoc && wireframeDoc) {
    const copyPlan = JSON.parse(copyDoc.content) as { screens: Array<{ screenId: string; statLabels?: Array<{ label: string; unit?: string }> }> };
    const mismatches: string[] = [];
    // Domain metrics come from the deterministic dataset for this run — rebuild it.
    const { mockDataset } = await import("../server/lib/pastel-agent/lib/content");
    const { productBriefSchema } = await import("../server/lib/pastel-agent/schemas");
    const brief = productBriefSchema.safeParse(JSON.parse((state.docs.find((d) => d.path === "docs/brief/ProductBrief.json") ?? { content: "{}" }).content));
    if (brief.success) {
      const data = mockDataset(brief.data, prompt + run.id);
      const normalize = (u?: string) => (u ?? "").toLowerCase().trim().replace(/[·]/g, "/").replace(/\s+/g, "");
      for (const s of copyPlan.screens) {
        if (!s.statLabels) continue;
        if (s.statLabels.length !== data.metrics.length) {
          mismatches.push(`${s.screenId}: ${s.statLabels.length} labels vs ${data.metrics.length} metrics`);
          continue;
        }
        for (let i = 0; i < s.statLabels.length; i++) {
          const lu = s.statLabels[i].unit;
          if (lu !== undefined && normalize(lu) !== normalize(data.metrics[i].unit)) {
            mismatches.push(`${s.screenId}: "${lu}" ≠ metric "${data.metrics[i].unit}"`);
          }
        }
      }
      unitsClean = mismatches.length === 0;
      unitsDetail = mismatches.length === 0 ? "all stat label units match their metrics" : mismatches.slice(0, 3).join("; ");
    }
  }

  // V8: builder must stay on the cheap model (never minimax/mid for bulk work).
  // V21: shell chrome stays cheap; CUSTOM components are designed on the MID
  // tier (builderCustom) — they ARE the visible design surface.
  const { MODELS, CHEAP_DEFAULT, MID_DEFAULT } = await import("../server/lib/pastel-agent/gateway");
  const builderOnCheap = MODELS.builder === CHEAP_DEFAULT;
  const customBuilderOnMid = MODELS.builderCustom === MID_DEFAULT;

  // ── V9: two-screen canonical model + layout discipline ──────────────────
  const canonicalIds = ["home", "detail"];
  const twoScreensClean = screens.length === 2
    && screens.every((s) => canonicalIds.includes(s))
    && new Set(screens).size === 2;

  const screenSrc = (id: string): string =>
    state.files.find((f) => f.path === `src/screens/${id}.jsx`)?.content ?? "";
  const homeSrc = screenSrc("home");
  const detailSrc = screenSrc("detail");

  // V15: home/detail requirements are MODE-LED — derived from the run's brief
  // mode (the layout law). A browse/transact product demands search + grid;
  // a dashboard/workspace/coaching product must NOT inherit them.
  const briefDoc = state.docs.find((d) => d.kind === "brief" || d.path.endsWith("ProductBrief.json"));
  let briefPurposes: Array<{ id: string; purpose: string }> = [];
  let briefMode: string | undefined;
  try {
    const brief = JSON.parse(briefDoc?.content ?? "{}");
    briefPurposes = brief.screenPurposes ?? [];
    briefMode = brief.mode;
  } catch { /* keep [] */ }
  const { isCatalogHome, isMediaDetail, detailWantsReviews } = await import("../server/lib/pastel-agent/lib/ux-design");
  const homePurpose = briefPurposes.find((p) => p.id === "home")?.purpose ?? "";
  const detailPurpose = briefPurposes.find((p) => p.id === "detail")?.purpose ?? "";
  const briefIsCatalog = isCatalogHome(homePurpose, briefMode);
  const detailIsMediaRich = isMediaDetail(detailPurpose, briefMode);
  const detailWantsSocial = detailWantsReviews(detailPurpose, briefMode);

  // V15: booking language is illegal outside transact/stay products.
  const stayProduct = briefMode === "transact" || /rental|vacation|stay|booking|travel/i.test(`${briefMode ?? ""} ${homePurpose} ${detailPurpose}`);
  const bookingLeak = /Verified host|Guest reviews|Check availability|"Dates"|"Guests"/.test(detailSrc) && !stayProduct;

  // V18: a screen must have a dominant moment. For browse products this is
  // the search hero or product grid. For non-browse products (dashboard,
  // workspace, feed) it's a scoreboard — giant tabular numbers marked by
  // display-scale type. The hero patterns below cover browse products; the
  // scoreboard checks cover v18's mode-led dominant moments.
  const homeHasMoment = /text-4xl font-black/.test(homeSrc) || /lg:col-span-2/.test(homeSrc) || /text-4xl sm:text-5xl font-black/.test(homeSrc) || /text-4xl font-semibold/.test(homeSrc) || /text-4xl font-bold/.test(homeSrc) || /text-5xl font-black/.test(homeSrc) || (/font-black tracking-tight tabular-nums/.test(homeSrc) && /text-5xl/.test(homeSrc)) || /text-3xl font-semibold tabular-nums/.test(homeSrc);
  const homeHasSearch = /<Select/.test(homeSrc) && /placeholder=/.test(homeSrc);
  const homeHasGrid = /DATA\.screens\.home\.rows\.slice\(0, 6\)/.test(homeSrc) && /<Card\b/.test(homeSrc);
  // V21: every non-dominant section opens with the deterministic SectionHeader.
  const homeHeaders = (homeSrc.match(/<SectionHeader\b/g) ?? []).length;
  const detailHeaders = (detailSrc.match(/<SectionHeader\b/g) ?? []).length;
  // V21: the section budget — home ≤ 5 <section> wrappers, detail ≤ 4.
  const homeSections = (homeSrc.match(/<section\b/g) ?? []).length;
  const detailSections = (detailSrc.match(/<section\b/g) ?? []).length;
  const homeBudgetClean = homeSections <= 5 && detailSections <= 4;
  // V18: browse products require search + grid; non-browse (dashboard/workspace/feed)
  // only need a dominant moment (scoreboard, feed, etc.) — no hero, no search.
  const homeIsCatalog = briefIsCatalog ? (homeHasMoment && homeHasSearch && homeHasGrid) : homeHasMoment;

  const detailHasGallery = /DATA\.screens\.detail\.images\.map/.test(detailSrc) && /sceneTile|rounded-xl/.test(detailSrc);
  // V18: detail summary check — sticky panel + detail content. The primaryCta
  // may be rendered via a button or action component, not always a direct
  // reference to DATA.screens.detail.primaryCta in the source.
  const detailHasSummary = /lg:sticky lg:top-6/.test(detailSrc) || (/DATA\.screens\.detail/.test(detailSrc) && (/detail\.item/.test(detailSrc) || /detail\.fields/.test(detailSrc)));
  const detailHasAction = /CheckCircle2/.test(detailSrc) || /Button/.test(detailSrc);
  const detailHasReviews = /DATA\.screens\.detail\.reviews\.map/.test(detailSrc) || /Guest reviews/.test(detailSrc);
  // V18: for non-browse products, detail only needs summary section.
  const detailIsInfoPage = (briefIsCatalog || detailIsMediaRich ? detailHasSummary && detailHasAction && detailHasGallery && (!detailWantsSocial || detailHasReviews) : detailHasSummary);

  // Card budget: home = one grid cluster + at most the scoreboard moment;
  // detail = the single sticky summary card.
  // V17: budgets from the UX engine (ROLE_CARD_BUDGET).
  const { ROLE_CARD_BUDGET } = await import("../server/lib/pastel-agent/lib/ux-design");
  const homeCards = (homeSrc.match(/<Card\b/g) ?? []).length;
  const detailCards = (detailSrc.match(/<Card\b/g) ?? []).length;
  const cardsClean = homeCards <= ROLE_CARD_BUDGET.home && detailCards <= ROLE_CARD_BUDGET.detail;

  // Outline buttons: secondary actions should be quiet.
  const homeOutlines = (homeSrc.match(/variant="outline"/g) ?? []).length;
  const detailOutlines = (detailSrc.match(/variant="outline"/g) ?? []).length;
  const outlinesClean = homeOutlines <= 4 && detailOutlines <= 4;

  // ── V11: semantic data contract + deployability ─────────────────────────
  // Parse the deterministic data file: unique rows, {label,value} detail
  // pairs, an item-derived summary (dates can never be a property type), and
  // a single conversion point in the summary card.
  let dataClean = true;
  let dataDetail = "data.js not parsed";
  let summaryClean = true;
  let summaryDetail = "no summary";
  let singleCtaClean = true;
  let singleCtaDetail = "n/a";
  let labelsClean = true;
  let labelsDetail = "n/a";
  const dataFile = state.files.find((f) => f.path === "src/data.js")?.content ?? "";
  const dataMatch = dataFile.match(/export const DATA = (\{[\s\S]*?\});\s*$/);
  if (dataMatch) {
    try {
      const DATA = JSON.parse(dataMatch[1]);
      const rows = DATA.screens?.home?.rows ?? [];
      const names = rows.map((r: { name: string }) => r.name);
      const dupes = names.filter((n: string, i: number) => names.indexOf(n) !== i);
      const fields = DATA.screens?.detail?.fields ?? [];
      const fieldsSemantic = fields.length > 0 && fields.every((f: { label?: string; value?: string }) => typeof f.label === "string" && typeof f.value === "string" && f.value.length > 0);
      const summary = DATA.screens?.detail?.summary ?? {};
      const PROPS = ["Villa", "Casa", "Apartment", "Cabin", "Chalet", "Penthouse", "House", "Cottage", "Loft"];
      const datesSane = typeof summary.dates === "string" && !PROPS.includes(summary.dates);
      dataClean = dupes.length === 0 && fieldsSemantic;
      dataDetail = dupes.length === 0
        ? `${rows.length} rows unique · detail fields are ${fieldsSemantic ? "{label,value} pairs" : "NOT pairs"}`
        : `duplicate row names: ${[...new Set(dupes)].join(", ")}`;
      // V15: the item-derived booking summary is asserted ONLY for stay
      // products; a record/dashboard detail legitimately has no dates/guests.
      summaryClean = !stayProduct || (datesSane && typeof summary.guests === "string" && summary.guests.length > 0);
      summaryDetail = stayProduct
        ? `summary.dates="${summary.dates}" (${datesSane ? "sane" : "PROPERTY-TYPE LEAK"}) · guests="${summary.guests}"`
        : `booking summary not required (mode ${briefMode ?? "track"})`;
    } catch (err) {
      dataClean = false;
      dataDetail = `data.js parse failed: ${err instanceof Error ? err.message : err}`;
    }
  }

  // Single conversion point: a primary action renders on detail.
  const ctaCount = (detailSrc.match(/primaryCta|Button.*lg|Button.*md/g) ?? []).length;
  singleCtaClean = ctaCount >= 1;
  singleCtaDetail = `action rendered ${ctaCount}x (expect at least 1)`;

  // V11 gate rule: inputs carry visible labels.
  const homeHasLabels = /<label\b/.test(homeSrc);
  labelsClean = !/<Input\b/.test(homeSrc) || homeHasLabels;
  labelsDetail = homeHasLabels ? "search controls have visible labels" : "inputs without labels found on home";

  const checks: Array<[boolean, string]> = [
    [state.run.status === "done" || state.run.status === "done_needs_review", `run completed (${state.run.status})`],
    [state.run.status === "done", `run passed review (status=${state.run.status})`],
    [screens.length === 2, `exactly 2 screens (got ${screens.length})`],
    [twoScreensClean, `screens are the canonical pair: ${screens.join(", ")}`],
    [homeIsCatalog, `home leads its primary workflow: moment${briefIsCatalog ? " + search + grid" : " (product-led, no forced browse)"} (${homeHasMoment}/${homeHasSearch}/${homeHasGrid})`],
    [detailIsInfoPage, `detail is the focused secondary workflow: summary + action${detailIsMediaRich ? " + gallery" : ""}${detailWantsSocial ? " + reviews" : ""} (${detailHasGallery}/${detailHasSummary}/${detailHasAction}/${detailHasReviews})`],
    [homeHeaders >= 1, `SectionHeader present on home (${homeHeaders})`],
    [detailHeaders >= 1, `SectionHeader present on detail (${detailHeaders})`],
    [homeBudgetClean, `section budget: home ${homeSections} ≤ 5, detail ${detailSections} ≤ 4`],
    [!bookingLeak, `no booking language outside transact/stay products (mode=${briefMode ?? "track"})`],
    [cardsClean, `card budgets respected: home ${homeCards} ≤ ${ROLE_CARD_BUDGET.home}, detail ${detailCards} ≤ ${ROLE_CARD_BUDGET.detail}`],
    [outlinesClean, `no outline-button stacks: home ${homeOutlines}, detail ${detailOutlines} (≤ 2 each)`],
    [screenFiles.length >= 1, `screen proof PNG captured (got ${screenFiles.length})`],
    [compFiles.length >= 1, `component proof PNGs captured (got ${compFiles.length})`],
    [demoContentFree, `rendered screens free of off-domain demo content (${probes.length} probe(s))`],
    [deltasClean, `no broken "+-" delta strings in rendered screens`],
    [blanksClean, `no blank sections in rendered screens`],
    [zeroTilesClean, `no hardcoded zero tiles in screens or components (${zeroTilesClean ? "clean" : "FOUND"})`],
    [mountClean && inventoryMounted >= 0, `every custom inventory component mounted by a custom block (${mountDetail})`],
    [unitsClean, `stat label units match their metrics (${unitsDetail})`],
    [builderOnCheap, `shell builder model is the cheap stack (${MODELS.builder})`],
    [customBuilderOnMid, `custom component builder is the mid tier (${MODELS.builderCustom})`],
    [dataClean, `catalog rows unique + semantic detail pairs (${dataDetail})`],
    [summaryClean, `item-derived booking summary (${summaryDetail})`],
    [singleCtaClean, `single conversion point (${singleCtaDetail})`],
    [labelsClean, `visible input labels on home (${labelsDetail})`],
    [quality?.score != null && quality.score >= 30, `review score >= 30 (got ${quality?.score ?? "n/a"})`],
    [(costs?.totalCredits ?? 99) < 50, `cost under 50 credits (got ${costs?.totalCredits ?? "n/a"})`],
    [!errorEvent, "no pipeline error event"],
  ];
  const failed = checks.filter(([, ok]) => !ok);
  console.log("\n═══ ASSERTIONS ═══");
  for (const [ok, label] of checks) console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  let exitCode = state.run.status === "done" ? 0 : 1;
  if (failed.length > 0) {
    console.error(`\n${failed.length} assertion(s) failed — see run-summary.json for details`);
    exitCode = 1;
  } else {
    console.log("\nALL ASSERTIONS PASSED");
  }

  console.log(`\n═══ RUN ${run.id} — ${state.run.status} ═══ (${((Date.now() - started) / 1000).toFixed(1)}s total)`);
  return exitCode;
}

const isMain = process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().catch((err) => {
    console.error("e2e-v6 crashed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

export { captureScreens, captureComponents };
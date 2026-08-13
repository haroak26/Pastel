import { createRequire } from "node:module";
import { geometryEvalSource } from "../checks/geometry";

/**
 * Maxi Agent v23 — e2b sandbox renderer.
 *
 * The ONLY execution path for generated/untrusted code. Two verification
 * jobs run here, never on the app server:
 *
 *   1. SMOKE RENDER — the CJS smoke bundle (esbuild-compiled locally; the
 *      compiler never executes generated code) is required and rendered via
 *      renderToStaticMarkup inside the sandbox. Runtime errors in the
 *      generated React (undefined components, bad hooks, null access) are
 *      caught HERE, not in-process.
 *   2. SCREENSHOT + GEOMETRY — the browser bundle renders in the sandbox's
 *      system Chromium (playwright-core + chromium baked into the template),
 *      producing the PNG for visual review AND the DOM-geometry metrics the
 *      layout gate consumes (checks/geometry.ts shares its evaluation source
 *      with this module, so both paths measure identically).
 *
 * The cold-start bug this module exists to prevent forever: the retired
 * Picasso createSandbox() ran `apt-get install` of a dozen browser system
 * libraries plus `npm install puppeteer` on EVERY cold sandbox, mitigated
 * only by a 10-minute warm window. Here the toolchain is baked into the
 * template (sandbox-image/); a cold sandbox boots with the marker file
 * already present, and createSandbox() verifies the marker instead of
 * installing anything. The regression guard is server/tests/sandbox-e2b.test.ts:
 * a cold start that issues an apt-get/npm install command fails the test.
 */

const _require = createRequire(import.meta.url);

export const SANDBOX_TEMPLATE = "maxi-agent-v23";
export const SANDBOX_READY_MARKER = "/home/user/.maxi-sandbox-ready";

/** Cold-start budget: a template-based boot should take low seconds. */
const SANDBOX_CREATE_TIMEOUT_MS = Number(process.env.MAXI_SANDBOX_CREATE_TIMEOUT_MS) || 60_000;
/** Command timeout for in-sandbox jobs (smoke/screenshot). */
const SANDBOX_JOB_TIMEOUT_MS = Number(process.env.MAXI_SANDBOX_JOB_TIMEOUT_MS) || 90_000;
/** Warm pool size — render concurrency across the batch. */
export const SANDBOX_POOL_SIZE = Number(process.env.MAXI_SANDBOX_POOL_SIZE) || 3;
/** Warm-pool TTL (latency shave on top of the template fix). */
const SANDBOX_TTL_MS = Number(process.env.MAXI_SANDBOX_TTL_MS) || 10 * 60 * 1000;

// Type shape for the e2b sandbox (structural typing — no hard import).
interface E2BSandboxLike {
  files: { write(path: string, content: string): Promise<void> };
  commands: { run(cmd: string, opts?: { timeoutMs?: number }): Promise<{ stdout: string; stderr: string; exitCode?: number }> };
  kill(): Promise<void>;
}

function e2bConfigured(): boolean {
  return !!process.env.E2B_API_KEY;
}

export function e2bAvailable(): boolean {
  try {
    _require.resolve("@e2b/code-interpreter");
    return e2bConfigured();
  } catch {
    return false;
  }
}

// ── Command instrumentation (CI regression guard) ─────────────────────────
//
// Every in-sandbox command flows through this hook. The cold-start test
// asserts that no command matches the install antipattern (apt-get / npm
// install / pip install). Install commands must NEVER appear at runtime —
// the template is the only install path.

export type SandboxCommandLog = Array<{ at: number; cmd: string; kind: "create" | "job" }>;

let commandLog: SandboxCommandLog = [];
/** Test seam: collect every in-sandbox command. Returns the log. */
export function getSandboxCommandLog(): SandboxCommandLog {
  return commandLog;
}

/** Test seam: clear the command log (between tests). */
export function resetSandboxCommandLog(): void {
  commandLog = [];
}

const INSTALL_ANTIPATTERN = /(?:^|\s)(?:sudo\s+)?(?:apt-get|apt|dnf|yum|apk|pip3?|npm|pnpm|yarn)\s+(?:install|update|add)/i;

/** True when a command looks like a package-install call (regression guard). */
export function isInstallCommand(cmd: string): boolean {
  return INSTALL_ANTIPATTERN.test(cmd);
}

async function createSandbox(): Promise<E2BSandboxLike> {
  const { Sandbox } = await import("@e2b/code-interpreter");
  const sb = await Sandbox.create({
    template: SANDBOX_TEMPLATE,
    // Sandbox lifetime ≥ warm-pool TTL (the pool holds sandboxes for reuse).
    timeoutMs: Math.max(SANDBOX_TTL_MS + 60_000, 11 * 60_000),
    requestTimeoutMs: SANDBOX_CREATE_TIMEOUT_MS,
  });
  const sandbox = sb as unknown as E2BSandboxLike;

  // Verify the template is intact — NEVER install anything at runtime. A
  // missing marker means the template drifted; fail loudly instead of
  // falling back to the install-tax path this module exists to prevent.
  const check = await runCommand(sandbox, `test -f ${SANDBOX_READY_MARKER} && cat ${SANDBOX_READY_MARKER}`, "create");
  const marker = (check.stdout ?? "").trim();
  if (!marker || check.exitCode !== 0) {
    sandbox.kill().catch(() => {});
    throw new Error(
      `e2b template "${SANDBOX_TEMPLATE}" is missing its readiness marker (${SANDBOX_READY_MARKER}). ` +
        "The toolchain is not baked in — rebuild the template with sandbox-image/build.ts. " +
        "The sandbox module refuses to install packages at runtime.",
    );
  }
  if (marker !== "maxi-agent-v23") {
    sandbox.kill().catch(() => {});
    throw new Error(`e2b template "${SANDBOX_TEMPLATE}" has an unexpected marker: "${marker}"`);
  }
  return sandbox;
}

async function runCommand(
  sandbox: E2BSandboxLike,
  cmd: string,
  kind: SandboxCommandLog[number]["kind"],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  commandLog.push({ at: Date.now(), cmd, kind });
  const res = await sandbox.commands.run(cmd, { timeoutMs: SANDBOX_JOB_TIMEOUT_MS });
  return { stdout: res.stdout ?? "", stderr: res.stderr ?? "", exitCode: res.exitCode ?? 0 };
}

// ── Warm pool ─────────────────────────────────────────────────────────────

interface PooledSandbox {
  sandbox: E2BSandboxLike;
  createdAt: number;
  inUse: boolean;
}

const pool: PooledSandbox[] = [];
let poolWarming: Promise<void> | null = null;

/** Number of warm sandboxes currently held (monitoring/tests). */
export function warmPoolSize(): number {
  return pool.filter((p) => !p.inUse).length;
}

export function totalSandboxCount(): number {
  return pool.length;
}

async function warmPoolToSize(): Promise<void> {
  const target = Math.max(1, SANDBOX_POOL_SIZE);
  for (;;) {
    const alive = pool.filter((p) => Date.now() - p.createdAt < SANDBOX_TTL_MS && !p.inUse);
    if (alive.length >= target) break;
    const sb = await createSandbox();
    pool.push({ sandbox: sb, createdAt: Date.now(), inUse: false });
  }
  // Reap anything stale or in-use-past-ttl.
  const stale = pool.filter((p) => Date.now() - p.createdAt >= SANDBOX_TTL_MS);
  for (const p of stale) {
    p.sandbox.kill().catch(() => {});
    pool.splice(pool.indexOf(p), 1);
  }
}

/** Acquire a warm sandbox for one job; release it when done. Returns the
 *  LEASE — the exact sandbox this job owns. Concurrent jobs must never
 *  resolve their slot via a shared search (pool.find) — the first in-use
 *  slot would be claimed by every job and their file writes would race. */
export interface SandboxLease {
  sandbox: E2BSandboxLike;
  release: () => Promise<void>;
}

export async function acquireSandbox(): Promise<SandboxLease> {
  if (!e2bConfigured()) throw new Error("E2B sandboxing is not configured — set E2B_API_KEY");
  if (poolWarming) await poolWarming;
  poolWarming = warmPoolToSize();
  await poolWarming;
  poolWarming = null;

  const fresh = pool.filter((p) => !p.inUse && Date.now() - p.createdAt < SANDBOX_TTL_MS);
  const slot = fresh[0];
  if (!slot) throw new Error("e2b sandbox pool exhausted");
  slot.inUse = true;
  let released = false;
  return {
    sandbox: slot.sandbox,
    release: async () => {
      if (released) return;
      released = true;
      if (Date.now() - slot.createdAt >= SANDBOX_TTL_MS) {
        slot.sandbox.kill().catch(() => {});
        pool.splice(pool.indexOf(slot), 1);
      } else {
        slot.inUse = false;
      }
    },
  };
}

/** Test seam: kill every sandbox and reset the pool. */
export async function resetSandboxPool(): Promise<void> {
  for (const p of pool) {
    p.sandbox.kill().catch(() => {});
  }
  pool.length = 0;
  poolWarming = null;
}

// ── Smoke render (runtime verification, sandboxed) ────────────────────────

export interface SmokeRenderResult {
  ok: boolean;
  errors: string[];
  /** Rendered static-markup length (sanity floor). */
  markupChars?: number;
  method: "e2b" | "unavailable";
}

/**
 * Render the CJS smoke bundle (react external) inside the sandbox. The
 * bundle was compiled locally by esbuild — a compiler, it never executes
 * generated code; the EXECUTION happens here, in the sandbox.
 */
export async function smokeRenderInSandbox(smokeBundle: string): Promise<SmokeRenderResult> {
  if (!e2bAvailable()) {
    return { ok: false, errors: ["E2B sandboxing unavailable (E2B_API_KEY not set) — smoke render skipped, NOT run locally"], method: "unavailable" };
  }
  const { sandbox, release } = await acquireSandbox();
  try {
    await sandbox.files.write("/home/user/smoke.cjs", smokeBundle);
    const script = [
      "const React = require('react');",
      "const { renderToStaticMarkup } = require('react-dom/server');",
      "const mod = require('/home/user/smoke.cjs');",
      "const Screen = mod.default || mod;",
      "if (typeof Screen !== 'function') { console.error('__SMOKE_FAIL__ no default export function'); process.exit(1); }",
      "try {",
      "  const html = renderToStaticMarkup(React.createElement(Screen));",
      "  if (!html || html.length < 50) { console.error('__SMOKE_FAIL__ suspiciously little markup (' + (html ? html.length : 0) + ' chars)'); process.exit(1); }",
      "  console.log('__SMOKE_OK__' + html.length);",
      "} catch (err) {",
      "  console.error('__SMOKE_FAIL__ ' + (err && err.message ? err.message : String(err)));",
      "  process.exit(1);",
      "}",
    ].join("\n");
    await sandbox.files.write("/home/user/run-smoke.js", script);
    const res = await runCommand(sandbox, "cd /home/user && node run-smoke.js", "job");
    const stdout = res.stdout ?? "";
    const stderr = res.stderr ?? "";
    const okMatch = stdout.match(/__SMOKE_OK__(\d+)/);
    if (okMatch) {
      return { ok: true, errors: [], markupChars: parseInt(okMatch[1], 10), method: "e2b" };
    }
    const failMatch = `${stdout}\n${stderr}`.match(/__SMOKE_FAIL__ ([\s\S]*?)$/);
    return {
      ok: false,
      errors: [failMatch ? failMatch[1].trim() : `${stdout}${stderr}`.slice(0, 400) || "smoke render produced no result"],
      method: "e2b",
    };
  } finally {
    await release();
  }
}

// ── Screenshot + geometry render (sandboxed Chromium) ─────────────────────

export interface GeometryReport {
  overflow: boolean;
  fonts: Array<{ family: string; loaded: boolean }>;
  overlaps: Array<{ a: string; b: string }>;
  blanks: string[];
  offGrid: number;
  sampled: number;
  minHeightOk: boolean;
  rhythm: string[];
  flush: string[];
  heroScale: boolean;
}

export interface SandboxRenderResult {
  screenshot: Buffer | null;
  geometry: GeometryReport | null;
  /** Blank threshold — a PNG under this size is near-blank. */
  errors: string[];
  diagnostics: string[];
  method: "e2b" | "unavailable";
  renderTimeMs: number;
}

/** A rendered PNG under this size is a near-blank page. */
const BLANK_PNG_THRESHOLD = 5_000;

function buildShotScript(width: number, height: number, heroScalePx: number, fontFamilies: string[]): string {
  const geometrySource = JSON.stringify(geometryEvalSource());
  return `const { chromium } = require('playwright-core');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: ${width}, height: ${height} }, deviceScaleFactor: 1 });
  const diag = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', (err) => { diag.pageErrors.push(String(err && err.message || err)); });
  page.on('console', (msg) => { if (msg.type() === 'error') diag.consoleErrors.push(msg.text().slice(0, 500)); });
  await page.goto('file:///home/user/screen.html', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForFunction(() => Boolean(window.__maxiMounted), undefined, { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => (document.fonts && document.fonts.ready) ? document.fonts.ready.then(() => true) : Promise.resolve(true)).catch(() => {});
  await new Promise((r) => setTimeout(r, 350));
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'png', fullPage: true });
  let geometry = null;
  try {
    const fn = new Function('return (' + ${geometrySource} + ')')();
    geometry = await page.evaluate(fn, { fonts: ${JSON.stringify(fontFamilies)}, unit: 8, stepPx: 32, gapPx: 16, heroScalePx: ${heroScalePx} });
  } catch (e) { diag.pageErrors.push('geometry: ' + String(e && e.message || e)); }
  let runtime = null;
  try { runtime = await page.evaluate(() => window.__maxiDiagnostics || null); } catch (e) {}
  console.log(screenshot);
  console.log('__MAXI_GEOMETRY__' + Buffer.from(JSON.stringify({ geometry: geometry, pageErrors: diag.pageErrors, consoleErrors: diag.consoleErrors, runtime: runtime || null })).toString('base64'));
  await browser.close();
})().catch((err) => { console.error('__MAXI_SHOT_FAIL__ ' + (err && err.message ? err.message : String(err))); process.exit(1); });`;
}

export interface SandboxRenderOptions {
  html: string;
  screenName: string;
  width?: number;
  height?: number;
  /** The theme's 4xl size in px — the dominant-moment floor. */
  heroScalePx?: number;
  fontFamilies?: string[];
}

/**
 * Render a screen (pre-built HTML) inside the e2b sandbox and return the
 * PNG + DOM-geometry metrics. This is the ONLY screenshot path — local
 * unsandboxed Chromium on the app server is gone (screenshots.ts no longer
 * launches a local browser).
 */
export async function renderScreenInSandbox(options: SandboxRenderOptions): Promise<SandboxRenderResult> {
  const start = Date.now();
  const width = options.width ?? 1440;
  const height = options.height ?? 900;
  if (!e2bAvailable()) {
    return {
      screenshot: null, geometry: null,
      errors: ["E2B sandboxing unavailable (E2B_API_KEY not set) — render skipped, NOT run on the app server"],
      diagnostics: [], method: "unavailable", renderTimeMs: Date.now() - start,
    };
  }

  const { sandbox, release } = await acquireSandbox();
  try {
    await sandbox.files.write("/home/user/screen.html", options.html);
    const script = buildShotScript(width, height, options.heroScalePx ?? 36, options.fontFamilies ?? []);
    await sandbox.files.write("/home/user/shot.js", script);
    const res = await runCommand(sandbox, "cd /home/user && node shot.js", "job");
    const stdout = res.stdout ?? "";
    if (res.exitCode !== 0 || /__MAXI_SHOT_FAIL__/.test(stdout)) {
      const fail = `${stdout}\n${res.stderr ?? ""}`.match(/__MAXI_SHOT_FAIL__ ([\s\S]*?)$/);
      return {
        screenshot: null, geometry: null,
        errors: [fail ? fail[1].trim() : `${stdout}${res.stderr ?? ""}`.slice(0, 400) || "shot failed"],
        diagnostics: [], method: "e2b", renderTimeMs: Date.now() - start,
      };
    }
    const base64Line = stdout.split("\n").find((l) => l.length > 100 && !l.startsWith("__MAXI_"));
    const metaLine = stdout.split("\n").find((l) => l.startsWith("__MAXI_GEOMETRY__"));
    const errors: string[] = [];
    const diagnostics: string[] = [];
    let geometry: GeometryReport | null = null;
    if (metaLine) {
      try {
        const parsed = JSON.parse(Buffer.from(metaLine.slice("__MAXI_GEOMETRY__".length), "base64").toString("utf8"));
        geometry = (parsed.geometry as GeometryReport) ?? null;
        const runtime = parsed.runtime ?? {};
        const rtErrors = Array.isArray(runtime.errors) ? runtime.errors : [];
        const rtConsole = Array.isArray(runtime.console) ? runtime.console : [];
        for (const e of [...(parsed.pageErrors ?? []), ...rtErrors]) diagnostics.push(String(e));
        for (const e of rtConsole) diagnostics.push(`console.error: ${e}`);
      } catch {
        /* diagnostics are best-effort */
      }
    }
    let screenshot: Buffer | null = null;
    if (base64Line) {
      screenshot = Buffer.from(base64Line, "base64");
      if (screenshot.length < BLANK_PNG_THRESHOLD) {
        errors.push("Screenshot is suspiciously small (may be blank)");
      }
    } else {
      errors.push("Empty screenshot output from sandbox");
    }
    return { screenshot, geometry, errors, diagnostics, method: "e2b", renderTimeMs: Date.now() - start };
  } catch (err) {
    return {
      screenshot: null, geometry: null,
      errors: [`E2B render error: ${err instanceof Error ? err.message : String(err)}`],
      diagnostics: [], method: "e2b", renderTimeMs: Date.now() - start,
    };
  } finally {
    await release();
  }
}

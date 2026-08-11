import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);

export interface SandboxRenderOptions {
  html: string;
  screenName: string;
  width?: number;
  height?: number;
  warmSandbox?: unknown | null;
  timeoutMs?: number;
  /** V8: re-render once when the PNG looks blank (IMPROVEMENTS.md #5). */
  retryOnBlank?: boolean;
}

export interface SandboxRenderResult {
  screenshot: Buffer | null;
  method: "e2b" | "unavailable";
  renderTimeMs: number;
  width: number;
  height: number;
  errors: string[];
  /** V8: runtime diagnostics captured from the page (error boundary,
   *  pageerror, console.error) so a crash is attributable, not a blank PNG. */
  diagnostics: string[];
}

// Type shape for E2B sandbox (structural typing — no hard import).
interface E2BSandboxLike {
  files: { write(path: string, content: string): Promise<void> };
  commands: { run(cmd: string, opts?: { timeoutMs?: number }): Promise<{ stdout: string; stderr: string }> };
  kill(): Promise<void>;
}

function e2bAvailable(): boolean {
  try {
    _require.resolve("@e2b/code-interpreter");
    return true;
  } catch {
    return false;
  }
}

export function e2bConfigured(): boolean {
  return !!(process.env.E2B_API_KEY) && e2bAvailable();
}

// ── Warm sandbox pool ───────────────────────────────────────────────────

let warmSandbox: E2BSandboxLike | null = null;
let warmSandboxCreatedAt = 0;
const SANDBOX_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function createSandbox(): Promise<E2BSandboxLike> {
  const { Sandbox } = await import("@e2b/code-interpreter");
  const sb = await Sandbox.create();
  // Pre-install browser deps + puppeteer so renders skip the cold-start tax.
  await sb.commands.run(
    "sudo apt-get update -qq && sudo apt-get install -y -qq libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 libx11-6 libxcb1 libxext6 libxi6 libxtst6 libglib2.0-0 libdbus-1-3 libexpat1 2>&1 | tail -1",
    { timeoutMs: 240_000 },
  );
  await sb.commands.run("cd /home/user && npm init -y >/dev/null 2>&1; npm install puppeteer 2>&1 | tail -1", { timeoutMs: 240_000 });
  return sb as unknown as E2BSandboxLike;
}

/** Get the shared warm sandbox (creates + warms it if needed). */
export async function getWarmSandbox(): Promise<unknown | null> {
  if (!e2bConfigured()) return null;
  const now = Date.now();
  if (warmSandbox && now - warmSandboxCreatedAt < SANDBOX_TTL_MS) {
    return warmSandbox;
  }
  if (warmSandbox) {
    warmSandbox.kill().catch(() => {});
    warmSandbox = null;
  }
  try {
    warmSandbox = await createSandbox();
    warmSandboxCreatedAt = Date.now();
    return warmSandbox;
  } catch (err) {
    console.warn(`[sandbox-render] E2B sandbox warmup failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

export function clearWarmSandbox(): void {
  if (warmSandbox) {
    warmSandbox.kill().catch(() => {});
    warmSandbox = null;
  }
}

// ── Rendering ───────────────────────────────────────────────────────────

const SCREENSHOT_SCRIPT = `
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const diag = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', (err) => { diag.pageErrors.push(String(err && err.message || err)); });
  page.on('console', (msg) => { if (msg.type() === 'error') diag.consoleErrors.push(msg.text().slice(0, 500)); });
  await page.setViewport({ width: __WIDTH__, height: __HEIGHT__ });
  await page.goto('file:///home/user/screen.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2200));
  await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => {});
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
  let runtime = null;
  try {
    runtime = await page.evaluate(() => window.__picassoDiagnostics || null);
  } catch (e) {}
  console.log(screenshot);
  console.log('__PICASSO_DIAG__' + Buffer.from(JSON.stringify({
    pageErrors: diag.pageErrors,
    consoleErrors: diag.consoleErrors,
    runtime: runtime || null,
  })).toString('base64'));
  await browser.close();
})();
`;

/** A rendered PNG under this size is a near-blank page (1440×900 white PNG
 *  compresses to a few KB — a real screen with text/panels is far larger). */
export const BLANK_PNG_THRESHOLD = 5_000;

function isBlankBuffer(buf: Buffer): boolean {
  return buf.length < BLANK_PNG_THRESHOLD;
}

/**
 * Render a screen (pre-built HTML) inside the E2B sandbox and return a PNG.
 * The sandbox is the ONLY render path — local browsers are never used for
 * pipeline renders.
 *
 * V8: the result carries runtime `diagnostics` (error boundary, pageerror,
 * console.error) captured from the page, and — when `retryOnBlank` is set —
 * a suspiciously small PNG triggers one re-render before being accepted.
 */
export async function renderScreen(options: SandboxRenderOptions): Promise<SandboxRenderResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const diagnostics: string[] = [];
  const width = options.width ?? 1440;
  const height = options.height ?? 900;

  if (!e2bConfigured()) {
    return { screenshot: null, method: "unavailable", renderTimeMs: Date.now() - startTime, width, height, errors: ["E2B not configured — set E2B_API_KEY"], diagnostics };
  }

  const sandbox = (options.warmSandbox as E2BSandboxLike | null) ?? (await getWarmSandbox()) as E2BSandboxLike | null;
  const ownsSandbox = !options.warmSandbox;
  if (!sandbox) {
    return { screenshot: null, method: "unavailable", renderTimeMs: Date.now() - startTime, width, height, errors: ["No E2B sandbox available"], diagnostics };
  }

  const attempt = async (): Promise<{ screenshot: Buffer | null; diag: string[]; runErrors: string[] }> => {
    try {
      await sandbox.files.write("/home/user/screen.html", options.html);
      const script = SCREENSHOT_SCRIPT.replace("__WIDTH__", String(width)).replace("__HEIGHT__", String(height));
      await sandbox.files.write("/home/user/screenshot.js", script);
      const result = await sandbox.commands.run("cd /home/user && node screenshot.js", { timeoutMs: options.timeoutMs ?? 90_000 });
      const lines = result.stdout.trim().split("\n");
      const base64Line = lines.find((l) => l.length > 100 && !l.startsWith("__PICASSO_DIAG__"));
      const diagLine = lines.find((l) => l.startsWith("__PICASSO_DIAG__"));
      const pageDiag: string[] = [];
      if (diagLine) {
        try {
          const parsed = JSON.parse(Buffer.from(diagLine.slice("__PICASSO_DIAG__".length), "base64").toString("utf8"));
          const runtime = parsed.runtime || {};
          const rtErrors = Array.isArray(runtime.errors) ? runtime.errors : [];
          const rtConsole = Array.isArray(runtime.console) ? runtime.console : [];
          for (const e of [...(parsed.pageErrors ?? []), ...rtErrors]) pageDiag.push(String(e));
          for (const e of rtConsole) pageDiag.push(`console.error: ${e}`);
        } catch { /* diagnostics are best-effort */ }
      }
      if (!base64Line || base64Line.length < 100) {
        const runErrors = pageDiag.length > 0 ? [] : ["Empty screenshot output from sandbox"];
        return { screenshot: null, diag: pageDiag, runErrors };
      }
      return { screenshot: Buffer.from(base64Line, "base64"), diag: pageDiag, runErrors: [] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { screenshot: null, diag: [], runErrors: [`E2B render error: ${msg}`] };
    }
  };

  try {
    let out = await attempt();
    diagnostics.push(...out.diag);
    errors.push(...out.runErrors.filter((e) => !out.diag.includes(e)));
    // V8 retry-on-blank: a near-blank PNG without an attributable crash is
    // re-rendered once before being accepted as final.
    const firstShot = out.screenshot;
    const wantsRetry = (options.retryOnBlank ?? true) && !!firstShot && isBlankBuffer(firstShot) && out.diag.length === 0;
    if (wantsRetry) {
      const second = await attempt();
      diagnostics.push(...second.diag);
      if (second.screenshot && firstShot && second.screenshot.length > firstShot.length) {
        out = second;
      } else if (second.runErrors.length) {
        errors.push(...second.runErrors);
      }
    }
    if (out.screenshot && isBlankBuffer(out.screenshot)) {
      errors.push("Screenshot is suspiciously small (may be blank)");
    }
    return {
      screenshot: out.screenshot,
      method: "e2b",
      renderTimeMs: Date.now() - startTime,
      width,
      height,
      errors,
      diagnostics,
    };
  } finally {
    if (!options.warmSandbox && warmSandbox !== sandbox) {
      sandbox.kill().catch(() => {});
    }
  }
}

/** Render many screens through one sandbox (sequential — one browser at a time). */
export async function renderScreens(
  screens: Record<string, string>,
  options: { width?: number; height?: number; timeoutMs?: number },
): Promise<Record<string, SandboxRenderResult>> {
  const results: Record<string, SandboxRenderResult> = {};
  const warm = await getWarmSandbox();
  for (const [name, html] of Object.entries(screens)) {
    results[name] = await renderScreen({ html, screenName: name, width: options.width, height: options.height, timeoutMs: options.timeoutMs, warmSandbox: warm });
  }
  return results;
}

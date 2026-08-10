import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);

export interface SandboxRenderOptions {
  html: string;
  screenName: string;
  width?: number;
  height?: number;
  warmSandbox?: unknown | null;
  timeoutMs?: number;
}

export interface SandboxRenderResult {
  screenshot: Buffer | null;
  method: "e2b" | "unavailable";
  renderTimeMs: number;
  width: number;
  height: number;
  errors: string[];
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
  await page.setViewport({ width: __WIDTH__, height: __HEIGHT__ });
  await page.goto('file:///home/user/screen.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2200));
  await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => {});
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
  console.log(screenshot);
  await browser.close();
})();
`;

/**
 * Render a screen (pre-built HTML) inside the E2B sandbox and return a PNG.
 * The sandbox is the ONLY render path — local browsers are never used for
 * pipeline renders.
 */
export async function renderScreen(options: SandboxRenderOptions): Promise<SandboxRenderResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const width = options.width ?? 1440;
  const height = options.height ?? 900;

  if (!e2bConfigured()) {
    return { screenshot: null, method: "unavailable", renderTimeMs: Date.now() - startTime, width, height, errors: ["E2B not configured — set E2B_API_KEY"] };
  }

  const sandbox = (options.warmSandbox as E2BSandboxLike | null) ?? (await getWarmSandbox()) as E2BSandboxLike | null;
  const ownsSandbox = !options.warmSandbox;
  if (!sandbox) {
    return { screenshot: null, method: "unavailable", renderTimeMs: Date.now() - startTime, width, height, errors: ["No E2B sandbox available"] };
  }

  try {
    await sandbox.files.write("/home/user/screen.html", options.html);
    const script = SCREENSHOT_SCRIPT.replace("__WIDTH__", String(width)).replace("__HEIGHT__", String(height));
    await sandbox.files.write("/home/user/screenshot.js", script);
    const result = await sandbox.commands.run("cd /home/user && node screenshot.js", { timeoutMs: options.timeoutMs ?? 90_000 });
    const base64 = result.stdout.trim();
    if (!base64 || base64.length < 100) {
      errors.push("Empty screenshot output from sandbox");
      return { screenshot: null, method: "e2b", renderTimeMs: Date.now() - startTime, width, height, errors };
    }
    return {
      screenshot: Buffer.from(base64, "base64"),
      method: "e2b",
      renderTimeMs: Date.now() - startTime,
      width,
      height,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`E2B render error: ${msg}`);
    return { screenshot: null, method: "e2b", renderTimeMs: Date.now() - startTime, width, height, errors };
  } finally {
    if (ownsSandbox && options.warmSandbox) {
      // If the caller passed a sandbox, they own it. We only clean up when we
      // created the pool ourselves AND the caller didn't pass one.
    }
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

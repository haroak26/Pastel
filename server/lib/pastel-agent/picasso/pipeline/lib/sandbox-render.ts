import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _require = createRequire(import.meta.url);

export interface SandboxRenderOptions {
  screenCode: string;
  tokensCSS: string;
  screenName: string;
  width?: number;
  height?: number;
  projectSlug: string;
  outputDir: string;
  /** Pre-built HTML (bundled screen JS inline) to screenshot. When provided,
   * the sandbox writes this file directly instead of the placeholder HTML —
   * required to render real React screens inside the E2B sandbox. */
  previewHtml?: string;
}

export interface SandboxRenderResult {
  screenshot: Buffer;
  method: "e2b" | "playwright" | "fallback";
  renderTimeMs: number;
  width: number;
  height: number;
  errors: string[];
}

// Type definitions for E2B (for when it's available)
interface E2BSandbox {
  files: { write(path: string, content: string): Promise<void> };
  commands: { run(cmd: string): Promise<{ stdout: string; stderr: string }> };
  kill(): Promise<void>;
}

// Check if E2B SDK is available
function e2bAvailable(): boolean {
  try {
    _require.resolve("@e2b/code-interpreter");
    return true;
  } catch {
    return false;
  }
}

// Check if Playwright is available
function playwrightAvailable(): boolean {
  try {
    _require.resolve("playwright-core");
    return true;
  } catch {
    return false;
  }
}

function e2bKeyConfigured(): boolean {
  return !!(process.env.E2B_API_KEY);
}

/**
 * Render a screen using E2B sandbox (isolated, reliable).
 * This is the preferred rendering method.
 * Requires: E2B_API_KEY env variable + @e2b/code-interpreter package.
 */
async function renderWithE2B(options: SandboxRenderOptions): Promise<SandboxRenderResult> {
  if (!e2bAvailable()) {
    throw new Error("E2B SDK not installed. Install with: npm install @e2b/code-interpreter");
  }

  if (!e2bKeyConfigured()) {
    throw new Error("E2B_API_KEY not set. Set it in your environment to use E2B sandboxes.");
  }

  const startTime = Date.now();
  const errors: string[] = [];

  const { Sandbox } = await import("@e2b/code-interpreter");

  // Default template (code-interpreter-v1) has node; "node" template doesn't exist
  const sandbox = await Sandbox.create();

  try {
    const width = options.width ?? 1440;
    const height = options.height ?? 900;

    // Install chromium runtime deps + puppeteer inside the sandbox
    await sandbox.commands.run(
      "sudo apt-get update -qq && sudo apt-get install -y -qq libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 libx11-6 libxcb1 libxext6 libxi6 libxtst6 libglib2.0-0 libdbus-1-3 libexpat1 2>&1 | tail -1",
      { timeoutMs: 240000 },
    );

    const htmlContent = options.previewHtml ?? generatePreviewHTML(options.screenCode, options.tokensCSS, options.screenName, width, height);
    await sandbox.files.write("/home/user/screen.html", htmlContent);

    // Install puppeteer and take screenshot inside sandbox
    await sandbox.commands.run("cd /home/user && npm init -y >/dev/null 2>&1; npm install puppeteer 2>&1 | tail -1", { timeoutMs: 240000 });

    const screenshotScript = `
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: ${width}, height: ${height} });
  await page.goto('file:///home/user/screen.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2500));
  const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
  console.log(screenshot);
  await browser.close();
})();
`;
    await sandbox.files.write("/home/user/screenshot.js", screenshotScript);
    const result = await sandbox.commands.run("cd /home/user && node screenshot.js", { timeoutMs: 90000 });

    const renderTime = Date.now() - startTime;
    const screenshot = Buffer.from(result.stdout.trim(), "base64");

    return {
      screenshot,
      method: "e2b",
      renderTimeMs: renderTime,
      width,
      height,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`E2B render error: ${msg}`);
    throw err;
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

/**
 * Render a screen using Playwright (local headless browser).
 * Falls back to SVG placeholder if Playwright is unavailable.
 */
async function renderWithPlaywright(options: SandboxRenderOptions): Promise<SandboxRenderResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const width = options.width ?? 1440;
  const height = options.height ?? 900;

  if (!playwrightAvailable()) {
    // Generate a placeholder SVG
    const svg = createPlaceholderSvg(options.screenName, "Playwright not available", width, height);
    return {
      screenshot: svg,
      method: "fallback",
      renderTimeMs: Date.now() - startTime,
      width,
      height,
      errors: ["Playwright not installed. Install with: npm install playwright-core"],
    };
  }

  try {
    const { chromium } = await import("playwright-core");

    // Create preview HTML
    const htmlContent = generatePreviewHTML(options.screenCode, options.tokensCSS, options.screenName, width, height);
    const previewPath = path.join(options.outputDir, `${options.screenName}-preview.html`);
    fs.writeFileSync(previewPath, htmlContent);

    // Serve via local HTTP (needed for Tailwind CDN)
    const server = await startServer(previewPath);
    const url = `http://localhost:${server.port}`;

    try {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000); // Wait for Tailwind CDN

      const screenshot = await page.screenshot({ type: "png", fullPage: false });
      await browser.close();

      return {
        screenshot: Buffer.from(screenshot),
        method: "playwright",
        renderTimeMs: Date.now() - startTime,
        width,
        height,
        errors,
      };
    } finally {
      await server.close();
    }
  } catch (err) {
    errors.push(`Playwright render error: ${err instanceof Error ? err.message : String(err)}`);
    const svg = createPlaceholderSvg(options.screenName, `Render failed: ${err instanceof Error ? err.message : "Unknown error"}`, width, height);
    return {
      screenshot: svg,
      method: "fallback",
      renderTimeMs: Date.now() - startTime,
      width,
      height,
      errors,
    };
  }
}

/**
 * Main render function — tries E2B first, falls back to Playwright, then SVG placeholder.
 */
export async function renderScreen(options: SandboxRenderOptions): Promise<SandboxRenderResult> {
  // 1. Try E2B if SDK is installed AND API key is configured
  if (e2bAvailable() && e2bKeyConfigured()) {
    try {
      return await renderWithE2B(options);
    } catch (err) {
      console.warn(`[sandbox-render] E2B render failed, falling back to Playwright: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else if (e2bAvailable() && !e2bKeyConfigured()) {
    console.warn("[sandbox-render] E2B SDK installed but E2B_API_KEY not set — using Playwright fallback");
  }

  // 2. Fall back to Playwright
  return renderWithPlaywright(options);
}

/**
 * Render multiple screens in parallel.
 */
export async function renderScreens(
  screens: Record<string, string>,
  tokensCSS: string,
  options: { projectSlug: string; outputDir: string; width?: number; height?: number },
): Promise<Record<string, SandboxRenderResult>> {
  const results: Record<string, SandboxRenderResult> = {};
  const promises: Promise<void>[] = [];

  for (const [name, code] of Object.entries(screens)) {
    promises.push(
      renderScreen({
        screenCode: code,
        tokensCSS,
        screenName: name,
        width: options.width,
        height: options.height,
        projectSlug: options.projectSlug,
        outputDir: options.outputDir,
      }).then((result) => {
        results[name] = result;
      }),
    );
  }

  await Promise.all(promises);
  return results;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function generatePreviewHTML(
  screenCode: string,
  tokensCSS: string,
  screenName: string,
  width: number,
  height: number,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${width}, initial-scale=1.0">
<title>${screenName} — Picasso V2 Preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  ${tokensCSS}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body, system-ui); background: var(--color-surface-background, #fff); color: var(--color-text-primary, #111); width: ${width}px; min-height: ${height}px; }
</style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'https://esm.sh/react@18';
    import { createRoot } from 'https://esm.sh/react-dom@18/client';
    // Component preview: ${screenName}
    // Screenshot dimensions: ${width}x${height}
    // Generated by Picasso V2 Sandbox Renderer
    console.log('Picasso V2 Preview: ${screenName}');
  </script>
</body>
</html>`;
}

function createPlaceholderSvg(screenName: string, message: string, width: number, height: number): Buffer {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#F3F4F6"/>
  <rect x="${width / 2 - 200}" y="${height / 2 - 60}" width="400" height="120" rx="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="${width / 2}" y="${height / 2 - 15}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#374151">${escapeXml(screenName)}</text>
  <text x="${width / 2}" y="${height / 2 + 10}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#9CA3AF">${escapeXml(message)}</text>
  <text x="${width / 2}" y="${height / 2 + 35}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#D1D5DB">Picasso V2 — Render Unavailable</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Simple HTTP server for serving preview HTML
function startServer(filePath: string): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
      } catch (err) {
        res.writeHead(500);
        res.end("Error loading preview");
      }
    });

    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve({
          port: addr.port,
          close: () => new Promise<void>((r) => server.close(() => r())),
        });
      } else {
        reject(new Error("Could not get server address"));
      }
    });

    server.on("error", reject);
  });
}

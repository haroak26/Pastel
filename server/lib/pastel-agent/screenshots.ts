import fs from "node:fs";
import path from "node:path";

/**
 * Runtime screenshot capture — renders each verified screen bundle in
 * headless Chromium and returns base64 PNG data URLs for the Review Board.
 *
 * Availability is best-effort: if no Chromium executable can be found, or
 * playwright-core is unavailable, capture resolves to an empty result and
 * the pipeline falls back to code-only review. Screenshots are a quality
 * signal, never a hard dependency.
 */

export interface CapturedScreenshot {
  /** screen name (bundle key) */
  name: string;
  /** data:image/png;base64,... */
  dataUrl: string;
}

export interface CaptureResult {
  screenshots: CapturedScreenshot[];
  /** why capture produced nothing (for activity logging) */
  reason?: string;
}

const MAX_SHOT_BYTES = 1_500_000; // keep vision prompts sane
const MAX_SCREENS = 8;

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
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch { /* keep looking */ }
  }
  return undefined;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Shared preview HTML builder (screenshots + geometry audit + preview route). */
export function buildPreviewHtml(screen: string, bundle: string, styles: string, fonts: string[]): string {
  const fontLinks = [...new Set(fonts)]
    .filter((f) => /^[a-zA-Z0-9 ]+$/.test(f))
    .map((f) => `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(screen)}</title>
${fontLinks}
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

export async function captureScreenshots(opts: {
  bundles: Record<string, string>;
  styles: string;
  fonts?: string[];
}): Promise<CaptureResult> {
  const bundleEntries = Object.entries(opts.bundles)
    .filter(([, js]) => js && js.trim().length > 0)
    .slice(0, MAX_SCREENS);

  if (bundleEntries.length === 0) {
    return { screenshots: [], reason: "no verified screen bundles to render" };
  }

  const executablePath = findChromiumExecutable();
  if (!executablePath) {
    return { screenshots: [], reason: "no Chromium executable available on this host" };
  }

  let chromium: typeof import("playwright-core").chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    return { screenshots: [], reason: "playwright-core is not installed" };
  }

  const out: CapturedScreenshot[] = [];
  let browser: import("playwright-core").Browser | null = null;
  const tmpDir = fs.mkdtempSync(path.join(process.cwd(), "node_modules", ".cache", "pastel-shots-"));

  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });

    for (const [name, bundle] of bundleEntries) {
      const html = buildPreviewHtml(name, bundle, opts.styles, opts.fonts ?? []);
      const htmlPath = path.join(tmpDir, `${name.replace(/[^\w-]/g, "_")}.html`);
      fs.writeFileSync(htmlPath, html);

      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      try {
        await page.goto(`file://${htmlPath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page
          .waitForFunction(() => Boolean((window as Window & { __pastelMounted?: boolean }).__pastelMounted), undefined, { timeout: 8000 })
          .catch(() => {});
        await page.evaluate(() => (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready ?? Promise.resolve()).catch(() => {});
        await page.waitForTimeout(350);
        const png = await page.screenshot({ type: "png", fullPage: true });
        if (png.byteLength <= MAX_SHOT_BYTES) {
          out.push({ name, dataUrl: `data:image/png;base64,${png.toString("base64")}` });
        }
      } catch (err) {
        console.warn(`[pastel-agent] screenshot failed for ${name}:`, err instanceof Error ? err.message : err);
      } finally {
        await page.close().catch(() => {});
      }
    }
  } catch (err) {
    return {
      screenshots: out,
      reason: `browser launch/render failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    try { await browser?.close(); } catch {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  if (out.length === 0) {
    return { screenshots: [], reason: "every screenshot render failed" };
  }
  return { screenshots: out };
}

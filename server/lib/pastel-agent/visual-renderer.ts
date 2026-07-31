import { chromium, type Browser } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

export interface RenderedScreenshot {
  screen: string;
  viewport: "desktop" | "mobile";
  dataUrl: string;
}

export interface ScreenshotResult {
  screenshots: RenderedScreenshot[];
  skippedReason?: string;
}

let browserPromise: Promise<Browser | null> | null = null;

/** Resolve a chromium executable, honoring env overrides then searching PATH. */
function findChromiumExecutable(): string | undefined {
  const candidates: Array<string | undefined> = [
    process.env.PASTEL_CHROMIUM_PATH,
    // Replit provides a preinstalled Playwright chromium via this env var.
    process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  ];

  const pathDirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const name of ["chromium", "chromium-browser", "google-chrome", "chrome", "headless_shell"]) {
    for (const dir of pathDirs) {
      candidates.push(path.join(dir, name));
    }
  }

  // Hardcoded fallbacks kept for non-PATH installations.
  candidates.push("/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome");

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // not usable, keep looking
    }
  }
  return undefined;
}

async function getBrowser(): Promise<Browser | null> {
  if (!browserPromise) {
    const executablePath = findChromiumExecutable();
    browserPromise = chromium
      .launch({
        headless: true,
        executablePath,
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      })
      .catch((error) => {
        console.warn("[pastel-agent] visual renderer unavailable:", error instanceof Error ? error.message : error);
        browserPromise = null;
        return null;
      });
  }
  return browserPromise;
}

async function captureViewport(
  browser: Browser,
  url: string,
  width: number,
  height: number,
  screen: string,
  viewport: "desktop" | "mobile",
): Promise<RenderedScreenshot> {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(
      () => Boolean((window as Window & { __pastelMounted?: boolean }).__pastelMounted),
      undefined,
      { timeout: 15000 },
    );
    await page.evaluate(() => document.fonts?.ready.then(() => true));
    await page.waitForTimeout(250);
    const image = await page.screenshot({ type: "jpeg", quality: 68, fullPage: false });
    return {
      screen,
      viewport,
      dataUrl: `data:image/jpeg;base64,${image.toString("base64")}`,
    };
  } finally {
    await page.close();
  }
}

/**
 * Capture the same preview route users see. The renderer is deliberately
 * best-effort: design generation must still work when Chromium is unavailable.
 */
export async function captureScreenshots(
  runId: string,
  screens: string[],
  options: { includeMobile?: boolean } = {},
): Promise<ScreenshotResult> {
  if (screens.length === 0) return { screenshots: [], skippedReason: "No verified screens" };
  const browser = await getBrowser();
  if (!browser) return { screenshots: [], skippedReason: "Chromium is not available" };

  const baseUrl = process.env.PASTEL_PREVIEW_BASE_URL || `http://127.0.0.1:${process.env.PORT || "5000"}`;
  const screenshots: RenderedScreenshot[] = [];
  for (const screen of screens) {
    const url = `${baseUrl}/api/pastel-agent/runs/${encodeURIComponent(runId)}/preview/${encodeURIComponent(screen)}`;
    try {
      screenshots.push(await captureViewport(browser, url, 1440, 900, screen, "desktop"));
      if (options.includeMobile) {
        screenshots.push(await captureViewport(browser, url, 390, 844, screen, "mobile"));
      }
    } catch (error) {
      console.warn(`[pastel-agent] screenshot failed for ${screen}:`, error instanceof Error ? error.message : error);
    }
  }

  return {
    screenshots,
    skippedReason: screenshots.length === 0 ? "No screenshots could be captured" : undefined,
  };
}

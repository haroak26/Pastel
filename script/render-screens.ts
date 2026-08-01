import fs from "node:fs";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { chromium, type Browser } from "playwright-core";
import { db } from "../server/db";
import { agentRuns, agentFiles } from "../shared/schema";
import type { AgentManifest } from "../server/lib/pastel-agent/types";

/**
 * Offline screen renderer — rebuilds the exact preview HTML for a run's
 * screens from Postgres and screenshots them headlessly, so design output
 * can be reviewed visually without booting the server.
 *
 *   npx tsx script/render-screens.ts [runId|latest] [outDir]
 */
const WORKSPACE_ID = process.env.E2E_WORKSPACE_ID ?? "";

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

function buildPreviewHtml(screen: string, bundle: string, styles: string, fonts: string[]): string {
  const fontLinks = [...new Set(fonts)]
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

async function main() {
  const [, , runArg = "latest", outDir = "screenshots/review"] = process.argv;
  let runId = runArg;
  if (runArg === "latest") {
    const [run] = await db.select().from(agentRuns).where(eq(agentRuns.status, "done")).orderBy(desc(agentRuns.createdAt)).limit(1);
    if (!run) throw new Error("no completed runs found");
    runId = run.id;
  }
  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
  if (!run) throw new Error(`run ${runId} not found`);
  const manifest = (run.manifest ?? {}) as unknown as AgentManifest;
  const fonts = manifest.brandKit?.fonts ? Object.values(manifest.brandKit.fonts) : [];

  const files = await db.select().from(agentFiles).where(eq(agentFiles.runId, runId));
  const styles = files.find((f) => f.path === "src/styles.css")?.content ?? "";
  const bundles = files.filter((f) => f.kind === "build" && f.path.startsWith(".build/") && f.path.endsWith(".js"));
  if (bundles.length === 0) throw new Error("no built screen bundles in this run");

  const dir = path.join(process.cwd(), outDir, runId.slice(0, 8));
  fs.mkdirSync(dir, { recursive: true });
  console.log(`run ${runId} (${run.title ?? "untitled"}) — ${bundles.length} screens → ${dir}`);

  const executablePath = findChromiumExecutable();
  const browser: Browser = await chromium.launch({ headless: true, executablePath, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  try {
    for (const bundle of bundles) {
      const screen = bundle.path.replace(/^\.build\//, "").replace(/\.js$/, "");
      const html = buildPreviewHtml(screen, bundle.content, styles, fonts);
      fs.writeFileSync(path.join(dir, `${screen}.html`), html);
      for (const [viewport, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]] as const) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
        try {
          await page.goto(`file://${path.join(dir, `${screen}.html`)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForFunction(() => Boolean((window as Window & { __pastelMounted?: boolean }).__pastelMounted), undefined, { timeout: 15000 }).catch(() => {});
          await page.evaluate(() => document.fonts?.ready.then(() => true)).catch(() => {});
          await page.waitForTimeout(400);
          const out = path.join(dir, `${screen}-${viewport}.png`);
          await page.screenshot({ type: "png", fullPage: true, path: out });
          console.log(`✓ ${screen}-${viewport}.png`);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("render failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

void WORKSPACE_ID;

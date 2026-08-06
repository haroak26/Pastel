/**
 * V11 company reference imagery capture.
 *
 * Screenshots each company's REAL website into `knowledge/companies/<slug>/`:
 *   - preview.png           — 1280×900 viewport shot (the gallery card).
 *   - references/<name>.jpg — full-page shots per URL (2–4 per company),
 *     used by the wireframe/UX/planner/builder prompts (vision) and the
 *     visual review as brand-fidelity ground truth.
 *
 * The rest of the pipeline (auto-registration, companyImageFiles, gallery
 * imageUrl, visual-review attachment) is already wired — this script is the
 * missing CONTENT.
 *
 * Usage: npx tsx script/capture-company-shots.ts [slug ...]
 *   (no args = all companies in the map)
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright-core";

const ROOT = path.join(process.cwd(), "server", "lib", "pastel-agent", "knowledge", "companies");

/** slug → labeled URLs (label becomes the reference file name). */
const SHOTS: Record<string, Array<{ label: string; url: string }>> = {
  airbnb: [
    { label: "home", url: "https://www.airbnb.com/" },
    { label: "results", url: "https://www.airbnb.com/s/lisbon--Portugal/homes" },
    { label: "listing", url: "https://www.airbnb.com/rooms/20669368" },
  ],
  apple: [
    { label: "home", url: "https://www.apple.com/" },
    { label: "iphone", url: "https://www.apple.com/iphone/" },
  ],
  nike: [
    { label: "home", url: "https://www.nike.com/" },
    { label: "shoes", url: "https://www.nike.com/w/mens-shoes-nik1zy7ok" },
  ],
  spotify: [
    { label: "home", url: "https://www.spotify.com/" },
    { label: "app", url: "https://open.spotify.com/" },
  ],
  stripe: [
    { label: "home", url: "https://stripe.com/" },
    { label: "pricing", url: "https://stripe.com/pricing" },
  ],
  notion: [
    { label: "home", url: "https://www.notion.com/" },
    { label: "product", url: "https://www.notion.com/product" },
  ],
  netflix: [
    { label: "home", url: "https://www.netflix.com/" },
  ],
  uber: [
    { label: "home", url: "https://www.uber.com/" },
    { label: "riders", url: "https://www.uber.com/us/en/ride/" },
  ],
  linear: [
    { label: "home", url: "https://linear.app/" },
    { label: "changelog", url: "https://linear.app/changelog" },
  ],
  duolingo: [
    { label: "home", url: "https://www.duolingo.com/" },
  ],
  figma: [
    { label: "home", url: "https://www.figma.com/" },
    { label: "community", url: "https://www.figma.com/community" },
  ],
  openai: [
    { label: "home", url: "https://openai.com/" },
    { label: "chatgpt", url: "https://chatgpt.com/" },
  ],
  anthropic: [
    { label: "home", url: "https://www.anthropic.com/" },
    { label: "claude", url: "https://claude.ai/" },
  ],
  perplexity: [
    { label: "home", url: "https://www.perplexity.ai/" },
  ],
  gemini: [
    { label: "home", url: "https://gemini.google.com/" },
  ],
  replit: [
    { label: "home", url: "https://replit.com/" },
    { label: "ai", url: "https://replit.com/ai" },
  ],
  cursor: [
    { label: "home", url: "https://cursor.com/" },
  ],
  vercel: [
    { label: "home", url: "https://vercel.com/" },
  ],
  github: [
    { label: "home", url: "https://github.com/" },
    { label: "features", url: "https://github.com/features" },
  ],
  shopify: [
    { label: "home", url: "https://www.shopify.com/" },
  ],
  asana: [
    { label: "home", url: "https://asana.com/" },
    { label: "product", url: "https://asana.com/product" },
  ],
  slack: [
    { label: "home", url: "https://slack.com/" },
  ],
  airtable: [
    { label: "home", url: "https://www.airtable.com/" },
  ],
  reddit: [
    { label: "home", url: "https://www.reddit.com/" },
  ],
  youtube: [
    { label: "home", url: "https://www.youtube.com/" },
  ],
  twitch: [
    { label: "home", url: "https://www.twitch.tv/" },
  ],
  discord: [
    { label: "home", url: "https://discord.com/" },
  ],
  medium: [
    { label: "home", url: "https://medium.com/" },
  ],
  substack: [
    { label: "home", url: "https://substack.com/" },
  ],
  amazon: [
    { label: "home", url: "https://www.amazon.com/" },
  ],
  etsy: [
    { label: "home", url: "https://www.etsy.com/" },
  ],
  booking: [
    { label: "home", url: "https://www.booking.com/" },
  ],
  doordash: [
    { label: "home", url: "https://www.doordash.com/" },
  ],
  wise: [
    { label: "home", url: "https://wise.com/" },
  ],
  myfitnesspal: [
    { label: "home", url: "https://www.myfitnesspal.com/" },
  ],
  khanacademy: [
    { label: "home", url: "https://www.khanacademy.org/" },
  ],
  todoist: [
    { label: "home", url: "https://www.todoist.com/" },
  ],
  webflow: [
    { label: "home", url: "https://webflow.com/" },
  ],
};

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

function findChromiumExecutable(): string | undefined {
  const candidates = [
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

async function openPage(browser: Browser, url: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    userAgent: UA,
    locale: "en-US",
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3500);
  } catch (err) {
    console.warn(`  [warn] navigation issue for ${url}: ${err instanceof Error ? err.message : err}`);
  }
  return page;
}

async function captureCompany(browser: Browser, slug: string): Promise<void> {
  const shots = SHOTS[slug];
  if (!shots) {
    console.log(`[skip] ${slug}: no URL map — add an entry in SHOTS`);
    return;
  }
  const dir = path.join(ROOT, slug);
  const refsDir = path.join(dir, "references");
  fs.mkdirSync(refsDir, { recursive: true });

  console.log(`[shot] ${slug} — ${shots.length} page(s)`);
  for (const [i, shot] of shots.entries()) {
    const page = await openPage(browser, shot.url);
    try {
      const title = (await page.title().catch(() => "")) || "";
      const height = await page.evaluate(() => document.body?.scrollHeight ?? 0).catch(() => 0);
      if (i === 0) {
        const png = await page.screenshot({ type: "png" });
        const previewPath = path.join(dir, "preview.png");
        fs.writeFileSync(previewPath, png);
        console.log(`  [ok] preview.png (${(png.byteLength / 1024).toFixed(0)} KB) — ${title}`);
      }
      const safe = shot.label.replace(/[^a-z0-9-]/gi, "_");
      const jpg = await page.screenshot({ type: "jpeg", quality: 60, fullPage: true });
      const refPath = path.join(refsDir, `${safe}.jpg`);
      fs.writeFileSync(refPath, jpg);
      console.log(`  [ok] references/${safe}.jpg (${(jpg.byteLength / 1024).toFixed(0)} KB, page ${Math.round(height)}px) — ${title}`);
    } catch (err) {
      console.warn(`  [warn] ${shot.label} capture failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      await page.context().close().catch(() => {});
    }
  }
}

async function main() {
  const exe = findChromiumExecutable();
  if (!exe) {
    console.error("No chromium executable found — set PASTEL_CHROMIUM_PATH");
    process.exit(1);
  }
  const only = process.argv.slice(2);
  const slugs = only.length > 0 ? only.filter((s) => SHOTS[s]) : Object.keys(SHOTS);
  if (only.length > 0 && slugs.length !== only.length) {
    console.warn(`[warn] unknown slugs ignored: ${only.filter((s) => !SHOTS[s]).join(", ")}`);
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: exe,
    args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  try {
    for (const slug of slugs) {
      await captureCompany(browser, slug).catch((err) =>
        console.warn(`[warn] ${slug} failed: ${err instanceof Error ? err.message : err}`),
      );
    }
  } finally {
    await browser.close();
  }
  console.log("done — verify with: ls server/lib/pastel-agent/knowledge/companies/*/preview.png server/lib/pastel-agent/knowledge/companies/*/references/");
}

main();

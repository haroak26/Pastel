// Screenshot both screens with the local Chromium
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
const styles = fs.readFileSync(path.resolve("src/styles.css"), "utf8");

function buildHtml(screen, bundle) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${screen}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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

const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });

async function shoot(name, bundlePath, outPath) {
  const bundle = fs.readFileSync(bundlePath, "utf8");
  const html = buildHtml(name, bundle);
  const tmp = path.resolve(`.render/${name}.html`);
  fs.writeFileSync(tmp, html);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text().slice(0, 300)); });
  await page.goto("file://" + tmp, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.__maxiMounted), undefined, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const mounted = await page.evaluate(() => window.__maxiMounted || false);
  const rootLen = await page.evaluate(() => document.getElementById("root").innerHTML.length);
  await page.screenshot({ path: outPath, type: "png", fullPage: true });
  console.log(`${name}: mounted=${mounted} rootLen=${rootLen} errors=${errors.length ? JSON.stringify(errors) : "none"} -> ${outPath}`);
  await page.close();
}

await shoot("home", ".build/home.js", ".render/home.png");
await shoot("detail", ".render/detail.mount.js", ".render/detail.png");
await browser.close();

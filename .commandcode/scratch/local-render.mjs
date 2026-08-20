// Render the home preview HTML locally with playwright-core + system chromium
import { chromium } from "playwright-core";
const browser = await chromium.launch({
  headless: true,
  executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text()); });
await page.goto("file:///tmp/home-preview.html", { waitUntil: "domcontentloaded", timeout: 25000 });
await page.waitForFunction(() => Boolean(window.__maxiMounted), undefined, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1000);
const mounted = await page.evaluate(() => window.__maxiMounted || false);
const bodyHtml = await page.evaluate(() => document.getElementById("root").innerHTML.slice(0, 300));
const shot = await page.screenshot({ type: "png", fullPage: true });
console.log("mounted:", mounted);
console.log("errors:", JSON.stringify(errors, null, 2));
console.log("root html:", bodyHtml);
console.log("png bytes:", shot.length);
require("fs").writeFileSync("/tmp/home-local.png", shot);
await browser.close();

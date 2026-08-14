import { chromium } from "playwright-core";

const PROJECT_ID = "c50117f0-9feb-4a6e-b944-5169d3db351f";
const BASE = "http://localhost:5000";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
  const page = await context.newPage();
  await page.request.get(`${BASE}/`);
  const csrf = (await context.cookies()).find((c) => c.name === "XSRF-TOKEN")?.value;
  await page.request.post(`${BASE}/api/login`, {
    headers: { "x-csrf-token": csrf ?? "" },
    data: { email: "canvas-test@example.com", password: "TestPass123!" },
  });
  await page.goto(`${BASE}/canvas/${PROJECT_ID}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(5000);

  const info = await page.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll('[class*="overflow-auto"]'));
    return scrollers.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        cls: (el.className as string).slice(0, 60),
        scrollW: el.scrollWidth, clientW: el.clientWidth,
        scrollH: el.scrollHeight, clientH: el.clientHeight,
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
      };
    });
  });
  console.log("scrollers:", JSON.stringify(info, null, 1));

  await page.locator("button:has(svg.lucide-hand)").first().click();
  await page.waitForTimeout(200);
  const mouse = page.mouse;
  await mouse.move(900, 500);
  await mouse.down();
  await mouse.move(700, 400, { steps: 6 });
  await mouse.up();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll('[class*="overflow-auto"]'));
    return scrollers.map((el) => ({ cls: (el.className as string).slice(0, 40), sl: el.scrollLeft, st: el.scrollTop }));
  });
  console.log("after pan:", JSON.stringify(after, null, 1));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });

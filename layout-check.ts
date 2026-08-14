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

  const layout = await page.evaluate(() => {
    function q(s) {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), boxShadow: cs.boxShadow, border: cs.borderTopWidth + " " + cs.borderTopColor };
    }
    const panels = Array.from(document.querySelectorAll(".screen-panel")).map((el) => {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const iframes = Array.from(document.querySelectorAll("iframe")).map((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    const scroller = Array.from(document.querySelectorAll('[class*="overflow-auto"]')).find((e) => e.scrollWidth > 1500);
    const r2 = scroller ? scroller.getBoundingClientRect() : null;
    return {
      toolbar: q('[class*="h-[36px]"][class*="bg-background"]'),
      panels,
      iframes,
      canvasScroll: r2 ? { x: Math.round(r2.x), y: Math.round(r2.y), w: Math.round(r2.width), h: Math.round(r2.height) } : null,
    };
  });
  console.log(JSON.stringify(layout, null, 1));
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });

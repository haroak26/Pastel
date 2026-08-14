import { chromium } from "playwright-core";

const PROJECT_ID = "c50117f0-9feb-4a6e-b944-5169d3db351f";
const BASE = "http://localhost:5000";

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

const homeFrame = page.frames().find((f) => f.url().includes("/preview/home"));
await homeFrame.evaluate(() => {
  window.__pmCount = 0;
  window.addEventListener("pointermove", () => window.__pmCount++);
});
await page.evaluate(() => {
  window.__msgs = [];
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "maxi:screen-drag") window.__msgs.push(e.data);
  });
});
const fb = await homeFrame.locator("body").boundingBox();
const mouse = page.mouse;
await mouse.move(fb.x + 60, fb.y + fb.height - 30);
await mouse.down();
await mouse.move(fb.x + 20, fb.y + fb.height - 60, { steps: 3 });
await page.waitForTimeout(150);
await mouse.up();
const stats = await homeFrame.evaluate(() => ({ pm: window.__pmCount }));
const msgs = await page.evaluate(() => window.__msgs);
console.log("pointermove in frame:", stats.pm, "| parent messages:", msgs.length);
console.log("msgs:", JSON.stringify(msgs.slice(0, 8)));
await browser.close();

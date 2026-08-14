import { chromium } from "playwright-core";

const PROJECT_ID = "c50117f0-9feb-4a6e-b944-5169d3db351f";
const BASE = "http://localhost:5000";

const browser = await chromium.launch({
  executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
const page = await context.newPage();
const logs = [];
page.on("console", (m) => logs.push(m.text()));
await page.request.get(`${BASE}/`);
const csrf = (await context.cookies()).find((c) => c.name === "XSRF-TOKEN")?.value;
await page.request.post(`${BASE}/api/login`, {
  headers: { "x-csrf-token": csrf ?? "" },
  data: { email: "canvas-test@example.com", password: "TestPass123!" },
});
await page.goto(`${BASE}/canvas/${PROJECT_ID}`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(5000);

const homeFrame = page.frames().find((f) => f.url().includes("/preview/home"));
console.log("frame url:", homeFrame?.url());
// inspect the injected script source inside the iframe
const hasPx = await homeFrame.evaluate(() => {
  const scripts = Array.from(document.querySelectorAll("script")).map((s) => s.textContent);
  return scripts.map((t) => (t.includes("px: e.clientX") ? "HAS_PX" : t.includes("maxi:edit-mode") ? "EDIT_SCRIPT_NO_PX" : "other"));
});
console.log("scripts in frame:", JSON.stringify(hasPx));

// intercept messages at the parent window
await page.evaluate(() => {
  const orig = window.postMessage;
  window.__msgs = [];
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type && String(e.data.type).startsWith("maxi")) {
      window.__msgs.push(e.data);
    }
  });
});
const fb = await homeFrame.locator("body").boundingBox();
const mouse = page.mouse;
await mouse.move(fb.x + 60, fb.y + fb.height - 30);
await mouse.down();
await mouse.move(fb.x + 10, fb.y + fb.height - 90, { steps: 4 });
await page.waitForTimeout(200);
await mouse.up();
const msgs = await page.evaluate(() => window.__msgs);
console.log("messages:", JSON.stringify(msgs.filter((m) => m.type === "maxi:screen-drag").slice(0, 10)));
await browser.close();

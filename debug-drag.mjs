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
page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));
await page.request.get(`${BASE}/`);
const csrf = (await context.cookies()).find((c) => c.name === "XSRF-TOKEN")?.value;
await page.request.post(`${BASE}/api/login`, {
  headers: { "x-csrf-token": csrf ?? "" },
  data: { email: "canvas-test@example.com", password: "TestPass123!" },
});
await page.goto(`${BASE}/canvas/${PROJECT_ID}`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(5000);

const panelDiv = page.locator(".screen-panel").first();
const pb = await panelDiv.boundingBox();
console.log("panel at", Math.round(pb.x), Math.round(pb.y));
const frames = page.frames().filter((f) => f.url().includes("/preview/home"));
const homeFrame = frames[0];
const fb = await homeFrame.locator("body").boundingBox();
console.log("iframe body at", Math.round(fb.x), Math.round(fb.y), fb.width, fb.height);

const mouse = page.mouse;
// start drag inside iframe near bottom
await mouse.move(fb.x + 60, fb.y + fb.height - 30);
await mouse.down();
await mouse.move(fb.x + 20, fb.y + fb.height - 100, { steps: 5 });
await page.waitForTimeout(150);
const mid = await panelDiv.boundingBox();
console.log("mid (inside iframe):", Math.round(mid.x), Math.round(mid.y));
// continue outside the iframe (to the left)
await mouse.move(fb.x - 250, fb.y + fb.height - 180, { steps: 6 });
await page.waitForTimeout(150);
const out = await panelDiv.boundingBox();
console.log("after exit:", Math.round(out.x), Math.round(out.y));
await mouse.up();
await page.waitForTimeout(300);
const fin = await panelDiv.boundingBox();
console.log("final:", Math.round(fin.x), Math.round(fin.y));
console.log("── logs ──");
for (const l of logs.slice(0, 40)) console.log(l);
await browser.close();

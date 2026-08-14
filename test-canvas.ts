import { chromium } from "playwright-core";

const PROJECT_ID = "c50117f0-9feb-4a6e-b944-5169d3db351f";
const BASE = "http://localhost:5000";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  await page.request.get(`${BASE}/`);
  const csrf = (await context.cookies()).find((c) => c.name === "XSRF-TOKEN")?.value;
  const res = await page.request.post(`${BASE}/api/login`, {
    headers: { "x-csrf-token": csrf ?? "" },
    data: { email: "canvas-test@example.com", password: "TestPass123!" },
  });
  console.log("login status:", res.status(), (await res.text()).slice(0, 120));

  await page.goto(`${BASE}/canvas/${PROJECT_ID}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(4000);

  const url = page.url();
  console.log("url:", url);

  // Screens listed in sidebar?
  const sidebarButtons = await page.locator("button:has-text('Home')").count();
  console.log("sidebar 'Home' buttons:", sidebarButtons);

  const screensText = await page.evaluate(() => document.body.innerText.includes("Home"));
  console.log("body has Home:", screensText);

  // Find ScreenPanel name span (text-xs cursor-text)
  const nameSpans = await page.locator("span.cursor-text").count();
  console.log("name spans:", nameSpans);
  for (let i = 0; i < nameSpans; i++) {
    const txt = await page.locator("span.cursor-text").nth(i).innerText();
    console.log("  span:", JSON.stringify(txt));
  }

  if (nameSpans > 0) {
    await page.locator("span.cursor-text").first().click();
    await page.waitForTimeout(800);
    const inputs = await page.locator("input[autofocus]").count();
    const panelInputs = await page.locator("input.border-b").count();
    console.log("inputs after click (autofocus):", inputs, "panel inputs:", panelInputs);
    const pageState = await page.evaluate(() => ({
      active: document.activeElement?.tagName,
      cls: document.activeElement?.className,
    }));
    console.log("activeElement:", JSON.stringify(pageState));
  }

  await page.screenshot({ path: "/tmp/opencode/canvas.png" });
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });

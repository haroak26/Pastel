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
  const res = await page.request.post(`${BASE}/api/login`, {
    headers: { "x-csrf-token": csrf ?? "" },
    data: { email: "canvas-test@example.com", password: "TestPass123!" },
  });
  console.log("login:", res.status());

  await page.goto(`${BASE}/canvas/${PROJECT_ID}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(4000);

  // ── 1. Toolbar: no shadow, gray border, fixed dims ──
  const toolbar = page.locator('[class*="h-[36px]"][class*="bg-background"]').first();
  const toolbarBox = await toolbar.boundingBox();
  const toolbarCls = await toolbar.getAttribute("class");
  console.log("── Toolbar ──");
  console.log("  class:", toolbarCls);
  console.log("  has shadow:", toolbarCls?.includes("shadow"));
  console.log("  has border:", toolbarCls?.includes("border-border/80"));
  console.log("  box:", toolbarBox && `${toolbarBox.width}x${toolbarBox.height}`);

  // ── 2. Screens on canvas (both Home + Pricing) ──
  await page.waitForTimeout(3000);
  const panels = await page.locator(".screen-panel").count();
  console.log("── Canvas ──");
  console.log("  screen panels:", panels);
  const frames = page.frames().filter((f) => f.url().includes("/preview/"));
  console.log("  preview iframes:", frames.length);

  const homeFrame = frames.find((f) => f.url().includes("home")) ?? frames[0];
  if (homeFrame) {
    // ── 3. Component selection inside iframe ──
    const header = homeFrame.locator("header");
    await header.waitFor({ timeout: 10000 });
    await header.click();
    await page.waitForTimeout(400);
    const selCount = await homeFrame.locator(".maxi-sel").count();
    const handleCount = await homeFrame.locator(".maxi-handle").count();
    const chipText = await homeFrame.locator(".maxi-chip").innerText().catch(() => "");
    console.log("── Component select ──");
    console.log("  .maxi-sel count:", selCount, "| handles:", handleCount, "| chip:", JSON.stringify(chipText));

    if (handleCount >= 8) {
      // ── 4. Resize via SE handle (measure the selected element itself) ──
      const selBefore = await homeFrame.locator(".maxi-sel").boundingBox();
      const se = homeFrame.locator(".maxi-handle[data-dir='se']");
      const seBox = await se.boundingBox();
      if (seBox && selBefore) {
        const mouse = homeFrame.page().mouse;
        await mouse.move(seBox.x + seBox.width / 2, seBox.y + seBox.height / 2);
        await mouse.down();
        await mouse.move(seBox.x + 60, seBox.y + 40, { steps: 5 });
        await mouse.up();
        await page.waitForTimeout(400);
        const selAfter = await homeFrame.locator(".maxi-sel").boundingBox();
        const inlineStyle = await homeFrame.locator(".maxi-sel").evaluate((el) => (el as HTMLElement).style.cssText);
        console.log("── Resize ──");
        console.log("  before:", selBefore && [Math.round(selBefore.width), Math.round(selBefore.height)], "→ after:", selAfter && [Math.round(selAfter.width), Math.round(selAfter.height)]);
        console.log("  inline style:", inlineStyle);
      }
    }

    // ── 5. Screen drag via header bar ──
    const panelDiv = page.locator(".screen-panel").first();
    const beforePanel = await panelDiv.boundingBox();
    const mouse = page.mouse;
    const headerY = (beforePanel?.y ?? 140) + 8;
    const headerX = (beforePanel?.x ?? 345) + 200;
    await mouse.move(headerX, headerY);
    await mouse.down();
    await mouse.move(headerX + 120, headerY + 90, { steps: 8 });
    await mouse.up();
    await page.waitForTimeout(400);
    const afterPanel = await panelDiv.boundingBox();
    console.log("── Screen drag (header zone) ──");
    console.log("  before:", beforePanel && [Math.round(beforePanel.x), Math.round(beforePanel.y)], "→ after:", afterPanel && [Math.round(afterPanel.x), Math.round(afterPanel.y)]);

    // ── 5b. Screen drag from empty background inside the frame ──
    await page.waitForTimeout(300);
    const before2 = await panelDiv.boundingBox();
    const frame = homeFrame.locator("body");
    const fb = await frame.boundingBox();
    if (fb) {
      await mouse.move(fb.x + 60, fb.y + fb.height - 30);
      await mouse.down();
      await mouse.move(fb.x + 40, fb.y + fb.height - 80, { steps: 8 });
      await mouse.up();
      await page.waitForTimeout(500);
      const after2 = await panelDiv.boundingBox();
      console.log("── Screen drag (iframe background) ──");
      console.log("  before:", before2 && [Math.round(before2.x), Math.round(before2.y)], "→ after:", after2 && [Math.round(after2.x), Math.round(after2.y)]);

      // ── 5c. Drag continuation: pointer leaves the iframe mid-drag ──
      await mouse.move(fb.x + 60, fb.y + fb.height - 30);
      await mouse.down();
      await mouse.move(fb.x - 80, fb.y + fb.height - 120, { steps: 10 });
      await page.waitForTimeout(200);
      await mouse.move(fb.x - 240, fb.y + fb.height - 200, { steps: 8 });
      await mouse.up();
      await page.waitForTimeout(500);
      const after3 = await panelDiv.boundingBox();
      console.log("── Screen drag (exit iframe → parent continues) ──");
      console.log("  after2:", after2 && [Math.round(after2.x), Math.round(after2.y)], "→ after3:", after3 && [Math.round(after3.x), Math.round(after3.y)]);
    }
  }

  // ── 6. Rename screen ──
  const nameSpan = page.locator(".screen-panel span.cursor-text").first();
  await nameSpan.click();
  await page.waitForTimeout(300);
  const input = page.locator(".screen-panel input.border-b").first();
  const inputVisible = await input.isVisible().catch(() => false);
  console.log("── Rename ──");
  console.log("  edit input visible:", inputVisible);
  if (inputVisible) {
    await input.fill("Landing Page");
    await input.press("Enter");
    await page.waitForTimeout(400);
    const headerText = await page.locator(".screen-panel span.cursor-text").first().innerText();
    const sidebarTexts = await page.locator("button:has(span.truncate)").allInnerTexts();
    console.log("  panel name now:", JSON.stringify(headerText));
    console.log("  sidebar contains renamed:", sidebarTexts.some((t) => t.includes("Landing Page")));
  }

  // ── 7. Zoom + hand tool ──
  const panelDiv2 = page.locator(".screen-panel").first();
  const zBefore = await panelDiv2.boundingBox();
  await page.locator("button:has(svg.lucide-zoom-in)").first().click();
  await page.locator("button:has(svg.lucide-zoom-in)").first().click();
  await page.waitForTimeout(400);
  const zAfter = await panelDiv2.boundingBox();
  console.log("── Zoom ──");
  console.log("  panel w:", zBefore && Math.round(zBefore.width), "→", zAfter && Math.round(zAfter.width));

  const handBtn = page.locator("button:has(svg.lucide-hand)").first();
  await handBtn.click();
  await page.waitForTimeout(200);
  const scrollers = page.locator('[class*="overflow-auto"]');
  const scroller = scrollers.filter({ has: page.locator('[style*="width: 3200px"], [style*="width: 3840px"], [style*="width: 3520px"]') }).first();
  const slBefore = await scroller.evaluate((el) => el.scrollLeft);
  const stBefore = await scroller.evaluate((el) => el.scrollTop);
  const mouse2 = page.mouse;
  await mouse2.move(900, 500);
  await mouse2.down();
  await mouse2.move(700, 400, { steps: 6 });
  await mouse2.up();
  await page.waitForTimeout(300);
  const slAfter = await scroller.evaluate((el) => el.scrollLeft);
  const stAfter = await scroller.evaluate((el) => el.scrollTop);
  console.log("── Hand pan ──");
  console.log("  scroll:", slBefore, stBefore, "→", slAfter, stAfter);

  await page.screenshot({ path: "/tmp/opencode/canvas-final.png" });
  await browser.close();
  console.log("DONE");
}

main().catch((e) => { console.error(e); process.exit(1); });

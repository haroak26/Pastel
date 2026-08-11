import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "/home/runner/workspace/server/lib/pastel-agent/picasso/pipeline/lib/preview";

const BASE_DIR = "/home/runner/workspace/server/lib/pastel-agent/picasso/base-components/ui";
function rewrite(code: string): string {
  return code
    .replace(/from\s+["']@\/lib\/utils["']/g, 'from "./cn"')
    .replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, (_m: string, name: string) => `from "./${name}"`);
}
function load(...names: string[]): Record<string, string> {
  const files: Record<string, string> = {};
  for (const name of names) files[name] = rewrite(fs.readFileSync(path.join(BASE_DIR, `${name}.tsx`), "utf8"));
  return files;
}
const components = { ...load("button", "input", "textarea", "input-group", "combobox") };
const cn = `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`;

const screen = `import * as React from "react"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "./combobox"
const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]
export default function Demo() {
  const [value, setValue] = React.useState("")
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <Combobox items={frameworks} value={value} onValueChange={setValue}>
        <ComboboxInput placeholder="Select a framework" data-testid="combo-input" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList data-testid="combo-list">
            {(item) => (
              <ComboboxItem key={item} value={item} data-testid={"combo-item-" + item}>{item}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}`;

async function main() {
  const globalsCSS = fs.readFileSync(path.join(BASE_DIR, "../theme/globals.css"), "utf8").replace('@import "@fontsource-variable/inter";', "");
  const styles = await compileStylesForRun({ globalsCSS, components, screens: { s: screen }, support: { cn } });
  const bundle = await bundleScreenForPreview("s", screen, components, { cn });
  const html = buildPreviewHtml("s", bundle!, styles!, []);
  const browser = await chromium.launch({ executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const input = page.getByTestId("combo-input");
  await input.click();
  await input.press("ArrowDown");
  await page.waitForTimeout(600);
  const all = await page.evaluate(`(() => {
    const out = [];
    document.querySelectorAll("[data-slot]").forEach((el) => {
      const b = el.getBoundingClientRect();
      out.push({ slot: el.getAttribute("data-slot"), dataSide: el.getAttribute("data-side"), top: Math.round(b.top), left: Math.round(b.left), width: Math.round(b.width), height: Math.round(b.height) });
    });
    const style = document.querySelector("[data-slot=combobox-content]")?.getAttribute("style");
    return { out, style };
  })()`) as any;
  console.log(JSON.stringify(all, null, 1));
  await page.screenshot({ path: "/tmp/opencode/combo-debug2.png" });
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });

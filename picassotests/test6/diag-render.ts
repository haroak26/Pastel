/** Diagnostic: render one screen capturing page console + errors. */
import fs from "node:fs";
import path from "node:path";
import { renderScreen, getWarmSandbox, clearWarmSandbox } from "../../server/lib/pastel-agent/picasso/pipeline/lib/sandbox-render";
import { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "../../server/lib/pastel-agent/picasso/pipeline/lib/preview";

const RUN_DIR = path.resolve(process.argv[2] ?? "picassotests/test6/output/e2e-1-1786397271062");
const TARGET = process.argv[3] ?? "today";

function readDir(p: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(p)) return out;
  for (const f of fs.readdirSync(p)) if (f.endsWith(".tsx")) out[f.replace(/\.tsx$/, "")] = fs.readFileSync(path.join(p, f), "utf8");
  return out;
}

async function main() {
  const screens = readDir(path.join(RUN_DIR, "src/screens"));
  const components = readDir(path.join(RUN_DIR, "src/components"));
  const cnCode = components["cn"] ?? `export function cn(...args:any[]) { return args.filter(Boolean).join(" "); }`;
  delete components["cn"];
  if (!components["separator"]) {
    components["separator"] = fs.readFileSync(path.resolve("server/lib/pastel-agent/picasso/base-components/ui/separator.tsx"), "utf8");
  }

  const globalsCSS = fs.readFileSync(path.join(RUN_DIR, "src/globals.css"), "utf8");
  const tokens = JSON.parse(fs.readFileSync(path.join(RUN_DIR, "docs/design/DesignTokens.json"), "utf8"));
  const compiled = await compileStylesForRun({ globalsCSS, components, screens, support: { cn: cnCode } });
  if (!compiled) { console.error("styles failed"); process.exit(1); }

  const bundle = await bundleScreenForPreview(TARGET, screens[TARGET], components, { cn: cnCode });
  if (!bundle) { console.error("bundle failed"); process.exit(1); }
  const html = buildPreviewHtml(TARGET, bundle, compiled, [
    tokens.typography.fontFamily.display, tokens.typography.fontFamily.body, tokens.typography.fontFamily.mono,
  ]);

  // Add console capture into the sandbox script by wrapping the HTML with a
  // listener that reports errors via the page title (survives stdout rules).
  const { Sandbox } = await import("@e2b/code-interpreter");
  const sandbox = (await getWarmSandbox()) as any;
  const script = `
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push('CONSOLE: ' + m.type() + ' ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + (e && e.message ? e.message : String(e))));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('file:///home/user/screen.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(() => {
    document.title = (window.__pastelMounted ? 'MOUNTED' : 'NOT-MOUNTED') + ' | ' + document.body.innerHTML.length;
  });
  const shot = await page.screenshot({ encoding: 'base64', type: 'png' });
  console.log('LOGS_BEGIN');
  console.log(JSON.stringify(logs));
  console.log('LOGS_END');
  console.log(await page.title());
  console.log('SHOT_BEGIN');
  console.log(shot);
  await browser.close();
})();
`;
  await sandbox.files.write("/home/user/screen.html", html);
  await sandbox.files.write("/home/user/screenshot.js", script);
  const res = await sandbox.commands.run("cd /home/user && node screenshot.js", { timeoutMs: 120_000 });
  const out = res.stdout;
  const logs = (out.match(/LOGS_BEGIN([\s\S]*?)LOGS_END/) ?? [])[1] ?? "(no logs captured)";
  const title = (out.match(/(MOUNTED|NOT-MOUNTED)[^\n]*/) ?? [])[0] ?? "(no title)";
  console.log("=== title:", title);
  console.log("=== page logs:\n" + logs.slice(0, 3000));
  const shot = (out.match(/SHOT_BEGIN\s*([\s\S]*)/) ?? [])[1];
  if (shot && shot.length > 100) {
    fs.writeFileSync(path.join(RUN_DIR, "screenshots", `${TARGET}-diag.png`), Buffer.from(shot.trim(), "base64"));
    console.log(`diag screenshot saved (${shot.length} b64 chars)`);
  }
  clearWarmSandbox();
}
main().catch((e) => { console.error("crashed:", e.message); clearWarmSandbox(); process.exit(1); });

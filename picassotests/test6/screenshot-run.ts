/**
 * Manual screenshot of a completed run's composed screens.
 * Injects the missing base `separator` module (import fix only — no UI
 * changes to generated code), bundles + renders each screen in E2B, and
 * saves PNGs into the run's screenshots/ folder.
 */
import fs from "node:fs";
import path from "node:path";

import { renderScreen, getWarmSandbox, clearWarmSandbox } from "../../server/lib/pastel-agent/picasso/pipeline/lib/sandbox-render";
import { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "../../server/lib/pastel-agent/picasso/pipeline/lib/preview";

const RUN_DIR = path.resolve(process.argv[2] ?? "picassotests/test6/output/e2e-1-1786397271062");

function readDir(p: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(p)) return out;
  for (const f of fs.readdirSync(p)) {
    if (!f.endsWith(".tsx")) continue;
    out[f.replace(/\.tsx$/, "")] = fs.readFileSync(path.join(p, f), "utf8");
  }
  return out;
}

async function main() {
  const screensDir = path.join(RUN_DIR, "src/screens");
  const componentsDir = path.join(RUN_DIR, "src/components");
  const shotsDir = path.join(RUN_DIR, "screenshots");
  fs.mkdirSync(shotsDir, { recursive: true });

  const screens = readDir(screensDir);
  const components = readDir(componentsDir);
  const cnCode = components["cn"] ?? `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`;
  delete components["cn"];

  // Import fix: the manifest never built `separator`, but generated components
  // import { Separator } from "./separator". Inject the base module verbatim.
  if (!components["separator"]) {
    components["separator"] = fs.readFileSync(
      path.resolve("server/lib/pastel-agent/picasso/base-components/ui/separator.tsx"),
      "utf8",
    );
    console.log("injected base separator.tsx (import fix)");
  }

  const screenIds = Object.keys(screens).sort();
  console.log(`Screens: ${screenIds.join(", ")}`);
  console.log(`Components: ${Object.keys(components).length}`);
  if (!screenIds.length) {
    console.error("no screens found");
    process.exit(1);
  }

  const globalsCSS = fs.readFileSync(path.join(RUN_DIR, "src/globals.css"), "utf8");
  const tokens = JSON.parse(fs.readFileSync(path.join(RUN_DIR, "docs/design/DesignTokens.json"), "utf8"));

  const compiled = await compileStylesForRun({
    globalsCSS,
    components,
    screens,
    support: { cn: cnCode },
  });
  if (!compiled) {
    console.error("styles: tailwind compilation failed");
    process.exit(1);
  }
  console.log("styles compiled");

  const warm = await getWarmSandbox();
  const fonts = [
    tokens.typography.fontFamily.display,
    tokens.typography.fontFamily.body,
    tokens.typography.fontFamily.mono,
  ];

  for (const id of screenIds) {
    try {
      const bundle = await bundleScreenForPreview(id, screens[id], components, { cn: cnCode });
      if (!bundle) {
        console.error(`${id}: bundle failed`);
        continue;
      }
      const html = buildPreviewHtml(id, bundle, compiled, fonts);
      const result = await renderScreen({ html, screenName: id, warmSandbox: warm });
      if (result.screenshot) {
        const out = path.join(shotsDir, `${id}.png`);
        fs.writeFileSync(out, result.screenshot);
        console.log(`${id}: screenshot saved → ${out} (${result.screenshot.length} bytes)`);
      } else {
        console.error(`${id}: render failed — ${result.errors.join("; ")}`);
      }
    } catch (err) {
      console.error(`${id}: error — ${err instanceof Error ? err.message : err}`);
    }
  }

  clearWarmSandbox();
}

main().catch((err) => {
  console.error("crashed:", err instanceof Error ? err.stack : err);
  clearWarmSandbox();
  process.exit(1);
});

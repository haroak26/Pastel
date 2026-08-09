import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "output");

async function main() {
  const tokensPath = path.join(OUTPUT_DIR, "tokens.json");
  const cssPath = path.join(OUTPUT_DIR, "tokens.css");
  const catalogPath = path.join(OUTPUT_DIR, "catalog-page.tsx");
  const componentsDir = path.join(OUTPUT_DIR, "components");
  const screensDir = path.join(OUTPUT_DIR, "screens");

  if (!fs.existsSync(tokensPath)) {
    console.error("No cached output found. Run full e2e test first.");
    process.exit(1);
  }

  const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));
  const tokensCSS = fs.readFileSync(cssPath, "utf-8");
  const catalogPage = fs.existsSync(catalogPath) ? fs.readFileSync(catalogPath, "utf-8") : "";

  const generatedFiles: Record<string, string> = {};
  if (fs.existsSync(componentsDir)) {
    for (const f of fs.readdirSync(componentsDir)) {
      generatedFiles[f] = fs.readFileSync(path.join(componentsDir, f), "utf-8");
    }
  }
  if (fs.existsSync(screensDir)) {
    for (const f of fs.readdirSync(screensDir)) {
      generatedFiles[f] = fs.readFileSync(path.join(screensDir, f), "utf-8");
    }
  }

  const brief = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, "brief.json"), "utf-8"));

  console.log(`Testing render pipeline for "${brief.productName}"`);
  console.log(`  Tokens: ${tokens.color?.accent?.["500"] ?? "?"}`);
  console.log(`  Generated files: ${Object.keys(generatedFiles).length}`);
  console.log(`  Catalog: ${catalogPage.length} chars`);

  const { renderScreenshots } = await import(
    "../../server/lib/pastel-agent/picasso/pipeline/stage-5-render-critique"
  );

  const screenshots = await renderScreenshots({
    generatedFiles,
    catalogPage,
    tokens,
    tokensCSS,
    brief,
  });

  console.log(`\nScreenshots captured: ${Object.keys(screenshots).length}`);

  for (const [name, buf] of Object.entries(screenshots)) {
    const p = path.join(__dirname, "screenshots", `${name}-render.png`);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, buf);
    console.log(`  ${p} (${(buf.length / 1024).toFixed(1)}KB)`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error("Render test failed:", err.message || err);
  process.exit(1);
});

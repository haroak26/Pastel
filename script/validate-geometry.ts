/**
 * V11 offline geometry validation — no model calls, no DB.
 *
 * Composes a canonical Airbnb-style product (deterministic brief/copy/ux),
 * verifies it in the sandbox, renders each screen headlessly, and runs the
 * REAL geometry gate (`auditGeometry`) that the orchestrator uses — proving
 * the rhythm/flush/overlap fixes on actual rendered output.
 *
 *   npx tsx script/validate-geometry.ts
 */
import { chromium } from "playwright-core";
import { loadCompany, resolveCompanyTheme } from "../server/lib/pastel-agent/knowledge/index";
import { compileStyles } from "../server/lib/pastel-agent/compile";
import { composeAll } from "../server/lib/pastel-agent/compose-v6";
import { mockDataset } from "../server/lib/pastel-agent/lib/content";
import { fallbackCopy } from "../server/lib/pastel-agent/agents/copy-v6";
import { fallbackUx } from "../server/lib/pastel-agent/agents/ux-v6";
import { IncrementalScreenVerifier } from "../server/lib/pastel-agent/sandbox";
import { buildPreviewHtml } from "../server/lib/pastel-agent/screenshots";
import { auditGeometry, geometryPasses } from "../server/lib/pastel-agent/checks/geometry";
import { auditFiles } from "../server/lib/pastel-agent/checks/audit";
import { productBriefSchema } from "../server/lib/pastel-agent/schemas-v6";
import fs from "node:fs";
import path from "node:path";

function findChromium(): string | undefined {
  const candidates = [
    process.env.PASTEL_CHROMIUM_PATH,
    process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  const pathDirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const name of ["chromium", "chromium-browser", "google-chrome", "chrome", "headless_shell"]) {
    for (const dir of pathDirs) candidates.push(path.join(dir, name));
  }
  for (const c of candidates) {
    if (!c) continue;
    try { fs.accessSync(c, fs.constants.X_OK); return c; } catch { /* next */ }
  }
  return undefined;
}

async function main() {
  const outDir = path.join(process.cwd(), "test", "v11-geometry");
  fs.mkdirSync(outDir, { recursive: true });

  for (const slug of process.argv.slice(2).length ? process.argv.slice(2) : ["airbnb", "nike", "linear"]) {
    const company = await loadCompany(slug);
    const theme = resolveCompanyTheme(company, { mode: "light", hue: company.hueBase });
    const { css, fontFamilies } = compileStyles(theme);
    const brief = productBriefSchema.parse({
      version: "1.0.0",
      title: `${company.name} Style Product`,
      productType: slug === "nike" ? "fitness training app" : slug === "linear" ? "issue tracker for developers" : "vacation rental booking app",
      description: slug === "nike"
        ? "Track runs, build streaks, and train toward goals."
        : slug === "linear"
          ? "Plan sprints, triage issues, and ship faster."
          : "Browse unique vacation rentals worldwide and book your perfect stay.",
      audience: { primary: "Everyone", needs: ["Browse"] },
      goals: ["Browse", "Act"],
      features: [
        { name: "Search", description: "Find what you need.", priority: "critical" },
        { name: "Detail", description: "See everything about one item.", priority: "high" },
      ],
      platform: "all",
      screenPurposes: [
        { id: "home", purpose: "Browse and explore the main catalog" },
        { id: "detail", purpose: "Full info page for one item" },
      ],
      copyDirection: "Specific, calm, useful.",
      designLanguage: `${company.name} visual language.`,
      inspiration: { primary: slug },
    });
    const data = mockDataset(brief, `v11-geo-${slug}`);
    const plan: any = {
      version: "1.0.0",
      screens: [
        { id: "home", archetype: "catalog", title: "Home", purpose: "Browse", nav: "topbar",
          blocks: [
            { block: "hero", variant: "app", emphasis: true },
            { block: "search", variant: "dropdown" },
            { block: "list", variant: "cards" },
            { block: "list", variant: "featured" },
            { block: "chart", variant: "band" },
            { block: "cta", variant: "slogan" },
          ] },
        { id: "detail", archetype: "list-detail", title: "Detail", purpose: "Item", nav: "topbar",
          blocks: [
            { block: "media", variant: "gallery", emphasis: true },
            { block: "detail", variant: "pane" },
            { block: "list", variant: "activity" },
            { block: "cta", variant: "band" },
          ] },
      ],
    };
    const copy = fallbackCopy(brief, plan, data);
    const composed = composeAll({ brief, wireframe: plan, inventory: { version: "1.0.0", components: [] }, copy, theme, data, ux: fallbackUx(plan) });
    const files = { ...composed.files, ...composed.primitives, "src/styles.css": css };

    const codeGate = auditFiles(theme, files);
    console.log(`\n=== ${slug} === gate ${codeGate.passed ? "PASS" : "FAIL"} (${codeGate.issues.length} issues)`);
    for (const i of codeGate.issues) console.log(`  [${i.severity}] ${i.file}: ${i.description.slice(0, 110)}`);

    const verifier = new IncrementalScreenVerifier();
    const result = await verifier.verify(files);
    if (!result.ok) {
      console.log("  SANDBOX FAIL:", result.errors.map((e) => e.message).join("; "));
      continue;
    }
    const exe = findChromium();
    if (!exe) { console.log("  no chromium — skipping render/geometry"); continue; }
    const browser = await chromium.launch({ headless: true, executablePath: exe, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
    for (const [name, bundle] of Object.entries(result.bundles)) {
      const html = buildPreviewHtml(name, bundle, css, fontFamilies);
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForFunction(() => Boolean((window as any).__pastelMounted), undefined, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(400);
      const geo = await auditGeometry(page, {
        fontFamilies,
        heroScalePx: parseFloat(theme.cssVars["--text-4xl"] ?? "36"),
      });
      const { ok, reasons } = geometryPasses(geo);
      console.log(`  ${name}: geometry ${ok ? "OK" : "ISSUES"} — overflow=${geo.overflow} overlaps=${geo.overlaps.length} blanks=${geo.blanks.length} rhythm=[${geo.rhythm.join("; ") || "none"}] flush=[${geo.flush.join("; ") || "none"}] heroScale=${geo.heroScale} offGrid=${geo.offGrid}/${geo.sampled}`);
      if (!ok) for (const r of reasons) console.log(`      - ${r}`);
      const png = await page.screenshot({ type: "png", fullPage: true });
      fs.writeFileSync(path.join(outDir, `${slug}-${name}.png`), png);
      await page.close();
    }
    await browser.close();
  }
  console.log(`\nPNGs written to ${outDir}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

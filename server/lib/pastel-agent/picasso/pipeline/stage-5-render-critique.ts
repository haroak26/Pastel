import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import http from "node:http";
import esbuild from "esbuild";
import { createRequire } from "node:module";
import { chat, type ChatMessage, MODELS, parseAndValidate } from "../../gateway";
import {
  critiqueSystemPrompt,
  RUBRIC_DIMENSIONS,
  scorePasses,
  buildCritiqueResult,
  determineRoute,
} from "./rubric";
import type {
  CritiqueResult,
  RubricScores,
  RouteTarget,
  Brief,
  Tokens,
} from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_ROOT = path.resolve(__dirname, "../output");
const _require = createRequire(import.meta.url);

// ── Interfaces ──────────────────────────────────────────────────────────

export interface RenderInput {
  generatedFiles: Record<string, string>;
  catalogPage: string;
  tokens: Tokens;
  tokensCSS: string;
  brief: Brief;
  /** Optional explicit list of file keys to screenshot as screens (not components) */
  screenKeys?: string[];
}

export interface CritiqueInput {
  screenshots: Record<string, Buffer>;
  brief: Brief;
  tokens: Tokens;
}

export interface LoopDecision {
  shouldLoop: boolean;
  routeTo: RouteTarget | null;
  affectedIds: string[];
  shouldRegenTokens: boolean;
  shouldRegenLayout: boolean;
  iteration: number;
}

// ── Virtual filesystem plugin (same pattern as pastel-agent sandbox.ts) ──

function resolvePackage(id: string): string {
  return _require.resolve(id);
}

function virtualFsPlugin(files: Record<string, string>): esbuild.Plugin {
  const normalized = new Map<string, string>();
  for (const [p, content] of Object.entries(files)) {
    normalized.set(path.posix.normalize(p), content);
  }

  return {
    name: "picasso-virtual-fs",
    setup(build) {
      build.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, (args) => ({
        path: resolvePackage(args.path),
      }));
      build.onResolve({ filter: /^react-dom(\/client)?$/ }, (args) => ({
        path: resolvePackage(args.path),
      }));
      // Resolve npm packages not already handled by virtual FS
      build.onResolve({ filter: /.*/ }, (args) => {
        const p = args.path;
        if (p.startsWith(".") || p.startsWith("/") || p.includes(":/")) return undefined;
        if (p.endsWith(".css")) return undefined;
        // Only handle bare packages and scoped packages
        if (!p.includes("/") || p.startsWith("@")) {
          try {
            return { path: resolvePackage(p) };
          } catch {
            return undefined;
          }
        }
        return undefined;
      });

      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path.endsWith(".css")) {
          return { path: args.path, namespace: "picasso-css" };
        }
        const isEntry = args.kind === "entry-point";
        const importerIsVirtual = args.namespace === "picasso" || args.importer.startsWith("picasso:");
        if (!isEntry && !importerIsVirtual) return undefined;

        let resolved: string;
        if (args.path.startsWith(".")) {
          const importer = args.importer.replace(/^picasso:/, "");
          resolved = path.posix.normalize(
            path.posix.join(path.posix.dirname(importer), args.path),
          );
        } else {
          resolved = path.posix.normalize(args.path.replace(/^\/+/, ""));
        }
        const candidates = [resolved, `${resolved}.tsx`, `${resolved}.jsx`, `${resolved}.ts`, `${resolved}.js`, `${resolved}/index.tsx`];
        for (const c of candidates) {
          if (normalized.has(c)) return { path: `picasso:${c}`, namespace: "picasso" };
        }
        // Case-insensitive + punctuation-insensitive fallback
        const ext = path.posix.extname(resolved);
        const normal = (s: string) => {
          const base = ext && s.endsWith(ext) ? s.slice(0, -ext.length) : s;
          return path.posix.basename(base).toLowerCase().replace(/[^a-z0-9]/g, "");
        };
        const targetNorm = normal(resolved);
        const targetDir = path.posix.dirname(resolved);
        for (const [key] of normalized) {
          const keyDir = path.posix.dirname(key);
          if (normal(key) === targetNorm && (targetDir === "." || targetDir === keyDir || keyDir === ".")) {
            return { path: `picasso:${key}`, namespace: "picasso" };
          }
        }
        return { errors: [{ text: `Could not resolve "${args.path}"` }] };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso" }, (args) => {
        const key = args.path.replace(/^picasso:/, "");
        return { contents: normalized.get(key) ?? "", loader: "tsx", resolveDir: "/" };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso-css" }, () => ({
        contents: "", loader: "js",
      }));
    },
  };
}

// ── File sanitization ───────────────────────────────────────────────────

function sanitizeFile(raw: string): string {
  let s = raw.trim();
  const fenceMatch = s.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n```\s*$/);
  if (fenceMatch) return fenceMatch[1].trim() + "\n";
  const codeStart = s.search(/^(import |const |export |function |\/\/)/m);
  if (codeStart > 0) s = s.slice(codeStart);
  return s;
}

function normalizeImports(code: string): string {
  return code
    // Rewrite ../components/PascalCase to ./kebab-case
    .replace(/from\s+["'](?:\.\.\/)+components\/([^"']+)["']/g, (_m, name: string) => {
      const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").toLowerCase();
      return `from "./${kebab}"`;
    })
    .replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, (_m: string, name: string) => {
      const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").toLowerCase();
      return `from "./${kebab}"`;
    })
    // Rewrite lib/utils imports to local cn stub
    .replace(/from\s+["'](?:@\/|\.\.\/)lib\/(?:utils|cn)["']/g, 'from "./cn"')
    // Rewrite deep lucide-react paths to just "lucide-react"
    .replace(/from\s+["']lucide-react\/[^"']+["']/g, 'from "lucide-react"');
}

// ── Screen detection ────────────────────────────────────────────────────

function isScreenFile(filename: string): boolean {
  return filename.includes("page") || filename.includes("screen") || /^[a-z]+(?:-[a-z]+){2,}\.tsx$/.test(filename);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

// ── Bundling ───────────────────────────────────────────────────────────

async function bundleScreen(
  files: Record<string, string>,
  screenPath: string,
): Promise<string> {
  const entryPath = "src/__entry__.jsx";
  const allFiles: Record<string, string> = { ...files };
  allFiles[entryPath] = [
    `import React from "react";`,
    `import { createRoot } from "react-dom/client";`,
    `import * as ScreenModule from "${screenPath}";`,
    `const Screen = ScreenModule.default || Object.values(ScreenModule).find(v => typeof v === "function") || (() => React.createElement("div", null, "No component found"));`,
    `const el = document.getElementById("root");`,
    `if (el) { createRoot(el).render(React.createElement(Screen)); }`,
    `window.__pastelMounted = true;`,
  ].join("\n");

  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    target: "es2020",
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [virtualFsPlugin(allFiles)],
  });

  return result.outputFiles?.[0]?.text ?? "";
}

// ── HTML builder (same pattern as pastel-agent preview route) ──────────

function buildPreviewHTML(bundleJS: string, tokensCSS: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
${tokensCSS}
</style>
</head>
<body>
<div id="root"></div>
<script>${bundleJS}</script>
</body>
</html>`;
}

// ── Screenshot rendering ───────────────────────────────────────────────

function getViewports(platform: Brief["platform"]): { name: string; width: number; height: number }[] {
  const viewports: { name: string; width: number; height: number }[] = [
    { name: "desktop", width: 1440, height: 900 },
  ];
  if (platform === "mobile" || platform === "web+mobile") {
    viewports.push({ name: "mobile", width: 375, height: 812 });
  }
  return viewports;
}

async function launchBrowser(): Promise<ReturnType<typeof chromium.launch>> {
  const chromiumPath = process.env.PASTEL_CHROMIUM_PATH;
  const launchArgs = ["--disable-gpu", "--disable-dev-shm-usage", "--disable-setuid-sandbox", "--no-sandbox"];
  if (chromiumPath) return chromium.launch({ executablePath: chromiumPath, args: launchArgs });
  return chromium.launch({ args: launchArgs });
}

export async function renderScreenshots(
  input: RenderInput,
): Promise<Record<string, Buffer>> {
  const { generatedFiles, catalogPage, tokensCSS, brief } = input;
  const projectSlug = slugify(brief.productName || "preview");
  const previewDir = path.join(OUTPUT_ROOT, projectSlug, "preview");
  fs.mkdirSync(previewDir, { recursive: true });

  // Build virtual filesystem from all generated files, normalizing import paths
  const vfs: Record<string, string> = {};
  for (const [name, code] of Object.entries(generatedFiles)) {
    vfs[`src/${name}`] = normalizeImports(sanitizeFile(code));
  }
  vfs["src/catalog.tsx"] = normalizeImports(sanitizeFile(catalogPage));
  vfs["src/cn.ts"] = `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`;
  vfs["src/cn.tsx"] = `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`;

  // Write HTML files and serve via HTTP so Tailwind CDN can load
  const port = 9800 + Math.floor(Math.random() * 999);
  const server = http.createServer((_req, res) => {
    const url = new URL(_req.url ?? "/", `http://localhost:${port}`);
    const filePath = path.join(previewDir, url.pathname.replace(/^\//, "") || "catalog-desktop.html");
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      res.writeHead(200, { "Content-Type": path.extname(filePath) === ".html" ? "text/html" : "text/css" });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  const baseUrl = `http://localhost:${port}`;

  try {
    // Build catalog bundle
    let catalogBundle = "";
    try { catalogBundle = await bundleScreen(vfs, "./catalog.tsx"); } catch (e) { console.error("[render] Catalog bundle failed:", e instanceof Error ? e.message : e); }

    // Build screen bundles (use explicit screenKeys if provided, else auto-detect)
    const screenFileKeys = input.screenKeys && input.screenKeys.length > 0
      ? input.screenKeys
      : Object.keys(generatedFiles).filter(isScreenFile);
    const screenBundles: Record<string, string> = {};
    for (const key of screenFileKeys) {
      try { screenBundles[key] = await bundleScreen(vfs, `./${key}`); } catch (e) { console.error(`[render] Bundle failed for ${key}:`, e instanceof Error ? e.message : e); }
    }

    // Write preview HTML files (only non-empty bundles)
    const validBundles: Record<string, string> = {};
    if (catalogBundle && catalogBundle.length > 100) {
      fs.writeFileSync(path.join(previewDir, "catalog.html"), buildPreviewHTML(catalogBundle, tokensCSS, "Catalog"));
      validBundles["catalog"] = catalogBundle;
    }
    for (const [key, bundle] of Object.entries(screenBundles)) {
      if (!bundle || bundle.length < 100) continue;
      const name = key.replace(/\.(tsx|jsx)$/, "");
      fs.writeFileSync(path.join(previewDir, `${name}.html`), buildPreviewHTML(bundle, tokensCSS, name));
      validBundles[name] = bundle;
    }

    const screenshots: Record<string, Buffer> = {};
    const viewports = getViewports(brief.platform);
    const browser = await launchBrowser();

    try {
      // Take screenshots one at a time with fresh pages to avoid memory issues
      const tasks: Array<{ key: string; htmlFile: string }> = [];

      if (validBundles["catalog"]) {
        tasks.push({ key: "catalog", htmlFile: "catalog.html" });
      }
      for (const name of Object.keys(validBundles)) {
        if (name === "catalog") continue;
        // Limit to first 4 non-catalog screens
        if (tasks.length > 4) break;
        tasks.push({ key: name, htmlFile: `${name}.html` });
      }

      for (const vp of viewports) {
        for (const task of tasks) {
          const context = await browser.newContext({ viewport: vp });
          try {
            const page = await context.newPage();
            await page.goto(`${baseUrl}/${task.htmlFile}`, { waitUntil: "networkidle", timeout: 15000 });
            await page.waitForFunction(() => (window as any).__pastelMounted === true, {}, { timeout: 10000 }).catch(() => {});
            await page.evaluate(() => document.fonts.ready).catch(() => {});
            await page.waitForTimeout(1500);
            const shotKey = vp.name === "desktop" ? task.key : `${task.key}-${vp.name}`;
            screenshots[shotKey] = await page.screenshot({ type: "png", fullPage: true });
          } catch (e) {
            console.error(`[render] Screenshot failed for ${task.key}:`, e instanceof Error ? e.message : e);
          } finally {
            await context.close();
          }
        }
      }
    } finally {
      await browser.close();
    }

    return screenshots;
  } finally {
    server.close();
  }
}

// ── Critique ────────────────────────────────────────────────────────────

interface CritiqueAIResponse {
  scores: RubricScores;
  diagnosis: string;
  affectedIds: string[];
}

function validateCritiqueResponse(value: unknown): CritiqueAIResponse {
  const obj = value as Record<string, unknown>;
  if (!obj || typeof obj !== "object") throw new Error("Expected an object");

  if (!obj.scores || typeof obj.scores !== "object") {
    throw new Error("Missing scores object");
  }

  const scores = obj.scores as Record<string, unknown>;
  for (const dim of RUBRIC_DIMENSIONS) {
    const val = scores[dim.key];
    if (typeof val !== "number" || val < 1 || val > 10) {
      throw new Error(`Invalid score for ${dim.key}: expected 1–10, got ${val}`);
    }
  }

  if (typeof obj.diagnosis !== "string" || !obj.diagnosis.trim()) {
    throw new Error("Missing or empty diagnosis");
  }

  if (obj.affectedIds !== undefined && !Array.isArray(obj.affectedIds)) {
    throw new Error("affectedIds must be an array");
  }

  return {
    scores: {
      productContext: scores.productContext as number,
      brandCoherence: scores.brandCoherence as number,
      hierarchy: scores.hierarchy as number,
      composition: scores.composition as number,
      spacingRhythm: scores.spacingRhythm as number,
      componentConsistency: scores.componentConsistency as number,
      navigation: scores.navigation as number,
      contentCopy: scores.contentCopy as number,
      responsiveDesign: scores.responsiveDesign as number,
      accessibilityBaseline: scores.accessibilityBaseline as number,
    },
    diagnosis: obj.diagnosis as string,
    affectedIds: (obj.affectedIds as string[]) ?? [],
  };
}

export async function critiqueScreenshots(
  input: CritiqueInput,
): Promise<CritiqueResult[]> {
  const { screenshots, brief, tokens } = input;
  const results: CritiqueResult[] = [];

  for (const [name, buf] of Object.entries(screenshots)) {
    const systemPrompt = critiqueSystemPrompt();

    const imageBlock = {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: buf.toString("base64"),
      },
    };

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: `Product: ${brief.productName} (${brief.niche}, ${brief.personality.join(", ")})\nAccent: ${tokens.color.accent["500"]}\n\nScore this screenshot of "${name}" against the rubric dimensions above. Output ONLY valid JSON.` },
          imageBlock,
        ],
      },
    ];

    try {
      const parsed = await parseAndValidate<CritiqueAIResponse>("", () => {
        throw new Error("use chatText path below");
      });

      const rawResult = await chat(messages, {
        model: "visualReview",
        temperature: 0.3,
        maxTokens: 4000,
      });

      const responseObj = extractAndParseCritique(rawResult.content);
      const validated = validateCritiqueResponse(responseObj);
      const result = buildCritiqueResult(
        validated.scores,
        validated.diagnosis,
        null,
        validated.affectedIds,
      );
      const routeInfo = determineRoute(result.failingDimensions, result.diagnosis);
      result.routeTo = routeInfo.routeTo;
      results.push(result);
    } catch (err) {
      console.error(`[critique] Failed for ${name}:`, err instanceof Error ? err.message : err);
      results.push({
        scores: { productContext: 1, brandCoherence: 1, hierarchy: 1, composition: 1, spacingRhythm: 1, componentConsistency: 1, navigation: 1, contentCopy: 1, responsiveDesign: 1, accessibilityBaseline: 1 },
        average: 1,
        passed: false,
        failingDimensions: ["productContext", "brandCoherence", "hierarchy", "composition", "spacingRhythm", "componentConsistency", "navigation", "contentCopy", "responsiveDesign", "accessibilityBaseline"],
        diagnosis: `Critique evaluation failed for ${name}: ${err instanceof Error ? err.message : String(err)}`,
        routeTo: "components",
        affectedIds: [],
      });
    }
  }

  return results;
}

function extractAndParseCritique(raw: string): unknown {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  return JSON.parse(text);
}

// ── Loop decision ──────────────────────────────────────────────────────

export function decideNextAction(
  failingResults: CritiqueResult[],
  currentIteration: number,
  maxIterations: number,
): LoopDecision {
  if (failingResults.length === 0) {
    return {
      shouldLoop: false,
      routeTo: null,
      affectedIds: [],
      shouldRegenTokens: false,
      shouldRegenLayout: false,
      iteration: currentIteration,
    };
  }

  if (currentIteration >= maxIterations) {
    return {
      shouldLoop: false,
      routeTo: null,
      affectedIds: [],
      shouldRegenTokens: false,
      shouldRegenLayout: false,
      iteration: currentIteration,
    };
  }

  const diag = failingResults.map((r) => r.diagnosis).join(" ");
  const routeInfo = determineRoute(
    failingResults.flatMap((r) => r.failingDimensions),
    diag,
  );

  return {
    shouldLoop: true,
    routeTo: routeInfo.routeTo,
    affectedIds: routeInfo.affectedComponents,
    shouldRegenTokens: routeInfo.shouldRegenTokens,
    shouldRegenLayout: routeInfo.shouldRegenLayout,
    iteration: currentIteration + 1,
  };
}

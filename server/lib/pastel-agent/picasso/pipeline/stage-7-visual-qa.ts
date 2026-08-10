import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import esbuild from "esbuild";
import { createRequire } from "node:module";
import { chat, type ChatMessage, MODELS } from "../../gateway";
import { detectProductContext, type ProductContext } from "./anti-slop";
import {
  buildCritiqueResultV2,
  findBlockingDefects,
  critiqueSystemPrompt,
} from "./rubric";
import type {
  Brief,
  Tokens,
  CritiqueResult,
  RubricScores,
} from "./types";
import { reviewScreen, type VisualReviewOutput } from "./checks/visual-review-agent";
import { analyzeScreenshotQuality, validateScreenshotSet, createPlaceholderScreenshot, type RenderQualityResult } from "./checks/render-quality";
import { renderScreen as sandboxRenderScreen } from "./lib/sandbox-render";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_ROOT = path.resolve(__dirname, "../output");
const _require = createRequire(import.meta.url);

// ── Stage 7 — Visual QA ─────────────────────────────────────────────────

export interface VisualQAInput {
  screenFiles: Record<string, string>;
  tokens: Tokens;
  tokensCSS: string;
  brief: Brief;
  productContext: ProductContext;
  componentFiles: Record<string, string>;
  catalogPage?: string;
}

export interface VisualQAOutput {
  screenshots: Record<string, Buffer>;
  results: CritiqueResult[];
  passedAll: boolean;
  averageScore: number;
  blockingDefects: { screen: string; defects: string[] }[];
  feedback: { screen: string; strengths: string[]; improvements: string[] }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

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
    .replace(
      /from\s+["'](?:\.\.\/)+components\/([^"']+)["']/g,
      (_m, name: string) => {
        const kebab = name
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
          .toLowerCase();
        return `from "./${kebab}"`;
      },
    )
    .replace(
      /from\s+["']@\/components\/ui\/([^"']+)["']/g,
      (_m: string, name: string) => {
        const kebab = name
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
          .toLowerCase();
        return `from "./${kebab}"`;
      },
    )
    .replace(
      /from\s+["'](?:@\/|\.\.\/)lib\/(?:utils|cn)["']/g,
      'from "./cn"',
    )
    .replace(
      /from\s+["']lucide-react\/[^"']+["']/g,
      'from "lucide-react"',
    );
}

function resolvePackage(id: string): string {
  return _require.resolve(id);
}

// ── Virtual filesystem plugin ───────────────────────────────────────────

function virtualFsPlugin(files: Record<string, string>): esbuild.Plugin {
  const normalized = new Map<string, string>();
  for (const [p, content] of Object.entries(files)) {
    normalized.set(path.posix.normalize(p), content);
  }

  return {
    name: "picasso-vqa-virtual-fs",
    setup(build) {
      build.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, (args) => ({
        path: resolvePackage(args.path),
      }));
      build.onResolve({ filter: /^react-dom(\/client)?$/ }, (args) => ({
        path: resolvePackage(args.path),
      }));
      build.onResolve({ filter: /.*/ }, (args) => {
        const p = args.path;
        if (p.startsWith(".") || p.startsWith("/") || p.includes(":/"))
          return undefined;
        if (p.endsWith(".css")) return undefined;
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
        const importerIsVirtual =
          args.namespace === "picasso" || args.importer.startsWith("picasso:");
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
        const candidates = [
          resolved,
          `${resolved}.tsx`,
          `${resolved}.jsx`,
          `${resolved}.ts`,
          `${resolved}.js`,
          `${resolved}/index.tsx`,
        ];
        for (const c of candidates) {
          if (normalized.has(c))
            return { path: `picasso:${c}`, namespace: "picasso" };
        }

        const ext = path.posix.extname(resolved);
        const normal = (s: string) => {
          const base =
            ext && s.endsWith(ext) ? s.slice(0, -ext.length) : s;
          return path.posix
            .basename(base)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
        };
        const targetNorm = normal(resolved);
        const targetDir = path.posix.dirname(resolved);
        for (const [key] of normalized) {
          const keyDir = path.posix.dirname(key);
          if (
            normal(key) === targetNorm &&
            (targetDir === "." || targetDir === keyDir || keyDir === ".")
          ) {
            return { path: `picasso:${key}`, namespace: "picasso" };
          }
        }
        // Fallback stub for components that were referenced but never
        // generated (generated files sometimes import missing siblings like
        // `./Button`). Rendering a placeholder beats failing the bundle.
        if (args.path.startsWith(".") || args.path.startsWith("/")) {
          return {
            path: `picasso:${resolved.replace(/^\//, "")}`,
            namespace: "picasso-stub",
          };
        }
        return {
          errors: [{ text: `Could not resolve "${args.path}"` }],
        };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso-stub" }, (args) => {
        const name = path.posix.basename(args.path).replace(/\.[^.]+$/, "");
        return {
          contents: `
import React from "react";
const Stub = React.forwardRef((props, ref) =>
  React.createElement("div", { ref, className: props.className, style: props.style }, props.children)
);
const Named = Stub;
export default Stub;
export { Named as ${name} };
`,
          loader: "jsx",
          resolveDir: "/",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso" }, (args) => {
        const key = args.path.replace(/^picasso:/, "");
        const raw = normalized.get(key) ?? "";
        // Wrap each component module's default export in an error boundary so
        // one crashing component doesn't blank the entire screen render.
        if (key.endsWith(".tsx") && !key.includes("__vqa_entry__") && key !== "src/screen.tsx" && !key.startsWith("src/cn")) {
          const wrapped = wrapDefaultExport(raw);
          if (wrapped !== raw) {
            return { contents: wrapped, loader: "tsx", resolveDir: "/" };
          }
        }
        return {
          contents: raw,
          loader: "tsx",
          resolveDir: "/",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso-css" }, () => ({
        contents: "",
        loader: "js",
      }));
    },
  };
}

// ── Bundling ────────────────────────────────────────────────────────────

/**
 * Rewrites a component module so its default export is wrapped in an error
 * boundary. A crashing component shows an inline error card instead of
 * unmounting the whole screen.
 */
function wrapDefaultExport(code: string): string {
  // Only wrap modules that have a default export.
  if (!/\bexport\s+default\b/.test(code)) return code;

  const boundary = `
const __PicassoBoundary = (() => {
  const { Component } = React;
  class B extends Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error) { console.error("COMPONENT_RENDER_ERROR:", error && error.message); }
    render() {
      if (this.state.error) {
        const msg = String((this.state.error && this.state.error.message) || this.state.error);
        return React.createElement("div", { style: { padding: 16, fontFamily: "system-ui, sans-serif", fontSize: 12, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8 } },
          React.createElement("strong", null, "Component error: "), msg);
      }
      return this.props.children;
    }
  }
  return (Comp) => function PicassoBoundary(props) {
    return React.createElement(B, null, React.createElement(Comp, props));
  };
})();
`;

  // Convert `export default <decl>` into a named declaration, then re-export wrapped.
  const replaced = code.replace(
    /\bexport\s+default\s+(async\s+function|function|class|const|let|var)\b/,
    (_m, kind) => `__PicassoOrig = ${kind}`,
  );

  if (replaced === code) {
    // `export default Identifier` or `export default <expr>` — keep original,
    // append wrapped re-export at the end.
    return (
      `import React from "react";\n` +
      `let __PicassoOrig;\n` +
      replaced.replace(/\bexport\s+default\s+/, "__PicassoOrig = ") +
      `\n${boundary}\n` +
      `export default __PicassoBoundary(__PicassoOrig);\n`
    );
  }

  return (
    `import React from "react";\n` +
    `let __PicassoOrig;\n` +
    replaced +
    `\n${boundary}\n` +
    `export default __PicassoBoundary(__PicassoOrig);\n`
  );
}

async function bundleScreen(
  files: Record<string, string>,
  screenPath: string,
): Promise<string> {
  const entryPath = "src/__vqa_entry__.jsx";
  const allFiles: Record<string, string> = { ...files };
  allFiles[entryPath] = [
    `import React from "react";`,
    `import { createRoot } from "react-dom/client";`,
    `import * as ScreenModule from "${screenPath}";`,
    `const Screen = ScreenModule.default || Object.values(ScreenModule).find(v => typeof v === "function") || (() => React.createElement("div", null, "No component found"));`,
    `class Boundary extends React.Component {`,
    `  constructor(props) { super(props); this.state = { error: null }; }`,
    `  static getDerivedStateFromError(error) { return { error }; }`,
    `  componentDidCatch(error) { console.error("SCREEN_RENDER_ERROR:", error && error.message); }`,
    `  render() {`,
    `    if (this.state.error) {`,
    `      const msg = String(this.state.error && this.state.error.message || this.state.error);`,
    `      return React.createElement("div", { style: { padding: 32, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#b91c1c", minHeight: "100vh", boxSizing: "border-box" } },`,
    `        React.createElement("h2", { style: { fontSize: 20, margin: "0 0 8px" } }, "Screen render error — ${screenPath}"),`,
    `        React.createElement("pre", { style: { whiteSpace: "pre-wrap", fontSize: 13, color: "#7f1d1d" } }, msg)`,
    `      );`,
    `    }`,
    `    return this.props.children;`,
    `  }`,
    `}`,
    `const el = document.getElementById("root");`,
    `if (el) { createRoot(el).render(React.createElement(Boundary, null, React.createElement(Screen))); }`,
    `window.__pastelVqaMounted = true;`,
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

// ── HTML builder ────────────────────────────────────────────────────────

function buildPreviewHTML(
  bundleJS: string,
  tokensCSS: string,
  width: number,
  title: string,
): string {
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
#root { width: ${width}px; min-height: 100vh; }
${tokensCSS}
</style>
</head>
<body>
<div id="root"></div>
<script>${bundleJS}</script>
</body>
</html>`;
}

// ── SVG placeholder fallback ────────────────────────────────────────────

function generatePlaceholderSVG(
  screenName: string,
  brief: Brief,
  width: number,
  height: number,
): Buffer {
  const productName = brief.productName || "Screen";
  const accent = brief.chosenDirection?.paletteDirection ?? "brand colors";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1e2e"/>
      <stop offset="100%" style="stop-color:#181825"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${width / 2 - 120}" y="${height / 2 - 40}" width="240" height="80" rx="12" fill="none" stroke="#45475a" stroke-width="1" stroke-dasharray="6 4"/>
  <text x="${width / 2}" y="${height / 2 - 12}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#cdd6f4" font-weight="600">${productName}</text>
  <text x="${width / 2}" y="${height / 2 + 16}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#a6adc8">${screenName} — ${accent}</text>
  <text x="${width / 2}" y="${height / 2 + 40}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#6c7086">Render unavailable (Playwright not installed)</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
}

// ── Playwright check ────────────────────────────────────────────────────

function playwrightAvailable(): boolean {
  try {
    _require.resolve("playwright-core");
    return true;
  } catch {
    return false;
  }
}

async function launchBrowser(): Promise<ReturnType<typeof import("playwright-core").chromium.launch> | null> {
  if (!playwrightAvailable()) return null;
  const { chromium } = await import("playwright-core");
  const chromiumPath = process.env.PASTEL_CHROMIUM_PATH;
  const launchArgs = [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-sandbox",
  ];
  if (chromiumPath)
    return chromium.launch({ executablePath: chromiumPath, args: launchArgs });
  return chromium.launch({ args: launchArgs });
}

// ── Render single screen ────────────────────────────────────────────────

export async function renderScreen(
  screenCode: string,
  tokensCSS: string,
  tokens: Tokens,
  screenNameOverride?: string,
  componentFiles?: Record<string, string>,
): Promise<Buffer> {
  const screenName = screenNameOverride ?? "qa-screen";
  const projectSlug = slugify(tokens.meta.brand || "vqa");
  const width = 1440;
  const height = 1024;

  // Build the virtual filesystem from the screen + its components FIRST, so
  // the bundled HTML (used by both E2B and Playwright) actually renders the
  // composed screen instead of a placeholder.
  const vfs: Record<string, string> = {
    "src/screen.tsx": normalizeImports(sanitizeFile(screenCode)),
    "src/cn.ts": `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`,
    "src/cn.tsx": `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`,
  };
  if (componentFiles) {
    for (const [id, code] of Object.entries(componentFiles)) {
      const kebab = id
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .toLowerCase();
      vfs[`src/${kebab}.tsx`] = normalizeImports(sanitizeFile(code));
    }
  }

  let bundle = "";
  try {
    bundle = await bundleScreen(vfs, "./screen.tsx");
  } catch (e) {
    console.error("[visual-qa] Bundle failed:", e instanceof Error ? e.message : e);
    return generatePlaceholderSVG(screenName, { productName: "Project", personality: [] } as unknown as Brief, width, height);
  }

  if (!bundle || bundle.length < 100) {
    return generatePlaceholderSVG(screenName, { productName: "Project", personality: [] } as unknown as Brief, width, height);
  }

  const htmlContent = buildPreviewHTML(bundle, tokensCSS, width, screenName);

  // 1. Try E2B sandbox renderer first (isolated, reliable)
  try {
    const outputDir = path.join(OUTPUT_ROOT, projectSlug);
    fs.mkdirSync(outputDir, { recursive: true });
    const result = await sandboxRenderScreen({
      screenCode,
      tokensCSS,
      screenName,
      width,
      height,
      projectSlug,
      outputDir,
      previewHtml: htmlContent,
    });
    if (result.method !== "fallback" && result.screenshot.length > 1000) {
      return result.screenshot;
    }
  } catch (e) {
    console.warn(`[visual-qa] E2B render failed for ${screenName}, falling back to Playwright: ${e instanceof Error ? e.message : String(e)}`);
    // Fall through to Playwright/SVG path
  }

  // 2. Fall back to bundled Playwright renderer
  const hasPlaywright = playwrightAvailable();
  if (!hasPlaywright) {
    return generatePlaceholderSVG(screenName, { productName: "Project", personality: [] } as unknown as Brief, width, height);
  }

  const previewDir = path.join(OUTPUT_ROOT, projectSlug, "vqa-preview");
  fs.mkdirSync(previewDir, { recursive: true });
  const htmlPath = path.join(previewDir, `${screenName}.html`);
  fs.writeFileSync(htmlPath, htmlContent, "utf-8");

  const port = 9800 + Math.floor(Math.random() * 999);
  const server = http.createServer((_req, res) => {
    const url = new URL(_req.url ?? "/", `http://localhost:${port}`);
    const filePath = path.join(
      previewDir,
      url.pathname.replace(/^\//, "") || `${screenName}.html`,
    );
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      res.writeHead(200, {
        "Content-Type": path.extname(filePath) === ".html"
          ? "text/html"
          : "text/css",
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  const baseUrl = `http://localhost:${port}`;

  try {
    const browser = await launchBrowser();
    if (!browser) {
      return generatePlaceholderSVG(screenName, { productName: "Project", personality: [] } as unknown as Brief, width, height);
    }

    try {
      const context = await browser.newContext({ viewport: { width, height } });
      try {
        const page = await context.newPage();
        await page.goto(`${baseUrl}/${screenName}.html`, {
          waitUntil: "networkidle",
          timeout: 15000,
        });
        await page
          .waitForFunction(
            () => (window as any).__pastelVqaMounted === true,
            {},
            { timeout: 10000 },
          )
          .catch(() => {});
        await page.evaluate(() => document.fonts.ready).catch(() => {});
        await page.waitForTimeout(1500);
        return await page.screenshot({ type: "png", fullPage: true });
      } finally {
        await context.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
  }
}

// ── Render all screens ──────────────────────────────────────────────────

export async function renderAllScreens(
  screenFiles: Record<string, string>,
  tokensCSS: string,
  tokens: Tokens,
  componentFiles?: Record<string, string>,
): Promise<Record<string, Buffer>> {
  const screenshots: Record<string, Buffer> = {};

  for (const [name, code] of Object.entries(screenFiles)) {
    try {
      screenshots[name] = await renderScreen(code, tokensCSS, tokens, name, componentFiles);
    } catch (e) {
      console.error(
        `[visual-qa] Render failed for ${name}:`,
        e instanceof Error ? e.message : e,
      );
      screenshots[name] = generatePlaceholderSVG(
        name,
        { productName: "Project", personality: [] } as unknown as Brief,
        1440,
        1024,
      );
    }
  }

  return screenshots;
}

// ── Score screenshot ────────────────────────────────────────────────────

interface CritiqueAIResponse {
  scores: RubricScores;
  diagnosis: string;
  affectedIds: string[];
}

function extractAndParseCritique(raw: string): unknown {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  return JSON.parse(text);
}

function validateCritiqueResponse(value: unknown): CritiqueAIResponse {
  const obj = value as Record<string, unknown>;
  if (!obj || typeof obj !== "object")
    throw new Error("Expected an object");

  if (!obj.scores || typeof obj.scores !== "object") {
    throw new Error("Missing scores object");
  }

  const scores = obj.scores as Record<string, unknown>;
  const requiredDims = [
    "productContext",
    "brandCoherence",
    "hierarchy",
    "composition",
    "spacingRhythm",
    "componentConsistency",
    "navigation",
    "contentCopy",
    "responsiveDesign",
    "accessibilityBaseline",
  ];
  for (const dim of requiredDims) {
    const val = scores[dim];
    if (typeof val !== "number" || val < 1 || val > 10) {
      throw new Error(
        `Invalid score for ${dim}: expected 1–10, got ${val}`,
      );
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

export async function scoreScreenshot(
  screenshot: Buffer,
  brief: Brief,
  tokens: Tokens,
  productContext: ProductContext,
): Promise<CritiqueResult> {
  const systemPrompt = critiqueSystemPrompt();

  const imageBlock = {
    type: "image",
    source: {
      type: "base64",
      media_type: "image/png",
      data: screenshot.toString("base64"),
    },
  };

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Product: ${brief.productName} (${brief.niche}, ${brief.personality.join(", ")})\nAccent: ${tokens.color.accent["500"]}\nPlatform: ${brief.platform}\n\nScore this screenshot against the rubric dimensions above. Output ONLY valid JSON.`,
        },
        imageBlock,
      ],
    },
  ];

  try {
    const rawResult = await chat(messages, {
      model: "visualReview",
      temperature: 0.3,
      maxTokens: 4000,
    });

    const responseObj = extractAndParseCritique(rawResult.content);
    const validated = validateCritiqueResponse(responseObj);

    const blockingDefects = findBlockingDefects(
      validated.diagnosis,
      validated.scores,
    );
    const diagnosisWithContext = blockingDefects.length > 0
      ? `BLOCKING DEFECTS: ${blockingDefects.map((d) => d.label).join("; ")}. ${validated.diagnosis}`
      : validated.diagnosis;

    return buildCritiqueResultV2(
      validated.scores,
      diagnosisWithContext,
      null,
      validated.affectedIds,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[visual-qa] Scoring failed:`, message);
    return {
      scores: {
        productContext: 5,
        brandCoherence: 5,
        hierarchy: 5,
        composition: 5,
        spacingRhythm: 5,
        componentConsistency: 5,
        navigation: 5,
        contentCopy: 5,
        responsiveDesign: 5,
        accessibilityBaseline: 5,
      },
      average: 5.0,
      passed: false,
      failingDimensions: [
        "productContext",
        "brandCoherence",
        "hierarchy",
        "composition",
        "spacingRhythm",
        "componentConsistency",
        "navigation",
        "contentCopy",
        "responsiveDesign",
        "accessibilityBaseline",
      ],
      diagnosis: `Visual review failed: ${message}. Manual review required.`,
      routeTo: "components",
      affectedIds: [],
    };
  }
}

// ── Main visual QA runner ───────────────────────────────────────────────

export async function runVisualQA(input: VisualQAInput): Promise<VisualQAOutput> {
  const {
    screenFiles,
    tokens,
    tokensCSS,
    brief,
    productContext,
    componentFiles,
    catalogPage,
  } = input;

  const screenshots = await renderAllScreens(screenFiles, tokensCSS, tokens, componentFiles);

  // Validate screenshot quality before scoring
  const qualityResults = validateScreenshotSet(screenshots);
  if (!qualityResults.allValid) {
    console.warn(`[visual-qa] Screenshots quality issues: ${qualityResults.summary}`);
    for (const [name, result] of Object.entries(qualityResults.results)) {
      if (!result.isRenderable || result.isBlank) {
        console.warn(`[visual-qa]   ${name}: ${result.issues.join("; ")}`);
      }
    }
  }

  const results: CritiqueResult[] = [];
  for (const [name, screenshot] of Object.entries(screenshots)) {
    // Check quality first — skip scoring if screenshot is clearly broken
    const qualityResult = qualityResults.results[name];
    if (qualityResult && qualityResult.isBlank) {
      results.push({
        scores: {
          productContext: 0, brandCoherence: 0, hierarchy: 0,
          composition: 0, spacingRhythm: 0, componentConsistency: 0,
          navigation: 0, contentCopy: 0, responsiveDesign: 0, accessibilityBaseline: 0,
        },
        average: 0,
        passed: false,
        failingDimensions: [
          "productContext", "brandCoherence", "hierarchy",
          "composition", "spacingRhythm", "componentConsistency",
          "navigation", "contentCopy", "responsiveDesign", "accessibilityBaseline",
        ],
        diagnosis: `BLOCKING DEFECTS: Blank screen — screenshot appears empty (${qualityResult.fileSizeKB}KB, content score: ${qualityResult.contentDetectionScore}). Render failure detected.`,
        routeTo: "components",
        affectedIds: [],
      });
      continue;
    }

    // Try the vision model review agent first, fall back to built-in
    try {
      const reviewResult = await reviewScreen({
        screenshot,
        screenName: name,
        brief: {
          productName: brief.productName,
          niche: brief.niche,
          personality: brief.personality,
        },
        tokens: { accentColor: tokens.color.accent["500"] },
        productContext,
      });

      results.push({
        scores: reviewResult.scores,
        average: reviewResult.weightedScore,
        passed: reviewResult.passed,
        failingDimensions: Object.entries(reviewResult.scores)
          .filter(([, score]) => score < 6)
          .map(([dim]) => dim as keyof RubricScores),
        diagnosis: reviewResult.blockingDefects.length > 0
          ? `BLOCKING DEFECTS: ${reviewResult.blockingDefects.map((d) => d.label).join("; ")}. ${reviewResult.diagnosis}`
          : reviewResult.diagnosis,
        routeTo: reviewResult.passed ? null : "components",
        affectedIds: [],
      });
    } catch {
      // Fall back to built-in scoring
      const result = await scoreScreenshot(screenshot, brief, tokens, productContext);
      results.push(result);
    }
  }

  const blockingDefects: { screen: string; defects: string[] }[] = [];
  const feedback: {
    screen: string;
    strengths: string[];
    improvements: string[];
  }[] = [];

  let totalScore = 0;
  const screenNames = Object.keys(screenFiles);

  for (let i = 0; i < screenNames.length; i++) {
    const name = screenNames[i];
    const result = results[i];
    if (!result) continue;

    const screenBlockingDefects = findBlockingDefects(
      result.diagnosis,
      result.scores,
    );
    if (screenBlockingDefects.length > 0) {
      blockingDefects.push({
        screen: name,
        defects: screenBlockingDefects.map((d) => d.label),
      });
    }

    const strengths: string[] = [];
    const improvements: string[] = [];
    for (const [dim, score] of Object.entries(result.scores)) {
      if (score >= 7) {
        strengths.push(dim);
      } else if (score < 6) {
        improvements.push(dim);
      }
    }
    feedback.push({ screen: name, strengths, improvements });
    totalScore += result.average;
  }

  const averageScore =
    screenNames.length > 0 ? totalScore / screenNames.length : 0;
  const hasBlocking = blockingDefects.length > 0;
  const allScoresOk = results.every((r) => r.average >= 7.0);
  const passedAll = allScoresOk && !hasBlocking;

  return {
    screenshots,
    results,
    passedAll,
    averageScore: Math.round(averageScore * 10) / 10,
    blockingDefects,
    feedback,
  };
}

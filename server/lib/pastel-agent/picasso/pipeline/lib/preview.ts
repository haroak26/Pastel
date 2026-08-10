import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _require = createRequire(import.meta.url);

// Version-safe aliases so the preview pipeline never touches the client's
// lucide-react (v0) / recharts (v2) / date-fns (v3) installs.
const PACKAGE_ALIASES: Record<string, string> = {
  "lucide-react": "lucide-react-v1",
  recharts: "recharts-v3",
  "react-day-picker": "react-day-picker-v10",
  "date-fns": "date-fns-v4",
  "@base-ui/react": "base-ui-react",
};

export interface PreviewFiles {
  screenCode: string;
  components: Record<string, string>;
  support: Record<string, string>;
}

function kebab(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

// ── esbuild VFS bundling (JS) ───────────────────────────────────────────

function normalizeImports(code: string): string {
  return code
    .replace(/from\s+["'](?:\.\.\/)+components\/([^"']+)["']/g, (_m, name: string) => `from "./${kebab(name)}"`)
    .replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, (_m, name: string) => `from "./${kebab(name)}"`)
    .replace(/from\s+["'](?:@\/|\.\.\/)lib\/(?:utils|cn)["']/g, 'from "./cn"')
    .replace(/from\s+["'](?:@\/|\.\.\/)hooks\/([^"']+)["']/g, (_m, name: string) => `from "./${kebab(name)}"`);
}

function virtualFsPlugin(files: Record<string, string>, resolvePackage: (id: string) => string) {
  const normalized = new Map<string, string>();
  for (const [p, content] of Object.entries(files)) {
    normalized.set(path.posix.normalize(p), content);
  }

  return {
    name: "picasso-preview-vfs",
    setup(build: any) {
      build.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, (args: any) => ({ path: resolvePackage(args.path) }));
      build.onResolve({ filter: /^react-dom(\/client)?$/ }, (args: any) => ({ path: resolvePackage(args.path) }));
      build.onResolve({ filter: /.*/ }, (args: any) => {
        const p = args.path;
        if (p.startsWith(".") || p.startsWith("/") || p.includes(":/")) return undefined;
        if (p.endsWith(".css")) return undefined;
        const aliased = PACKAGE_ALIASES[p] ?? p;
        try {
          return { path: resolvePackage(aliased) };
        } catch {
          return undefined;
        }
      });

      build.onResolve({ filter: /.*/ }, (args: any) => {
        if (args.path.endsWith(".css")) {
          return { path: args.path, namespace: "picasso-css" };
        }
        const isEntry = args.kind === "entry-point";
        const importerIsVirtual = args.namespace === "picasso" || (args.importer || "").startsWith("picasso:");
        if (!isEntry && !importerIsVirtual) return undefined;

        let resolved: string;
        if (args.path.startsWith(".")) {
          const importer = (args.importer || "").replace(/^picasso:/, "");
          resolved = path.posix.normalize(path.posix.join(path.posix.dirname(importer), args.path));
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
          if (normalized.has(c)) return { path: `picasso:${c}`, namespace: "picasso" };
        }

        // Loose fallback: match by basename (kebab-cased) in the same dir.
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
        if (args.path.startsWith(".") || args.path.startsWith("/")) {
          return { path: `picasso:${resolved.replace(/^\//, "")}`, namespace: "picasso-stub" };
        }
        return { errors: [{ text: `Could not resolve "${args.path}"` }] };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso-stub" }, (args: any) => {
        const name = path.posix.basename(args.path).replace(/\.[^.]+$/, "");
        return {
          contents: `
import React from "react";
const Stub = React.forwardRef((props, ref) =>
  React.createElement("div", { ref, className: props.className, style: props.style }, props.children)
);
export default Stub;
export { Stub as ${name} };
`,
          loader: "jsx",
          resolveDir: "/",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso" }, (args: any) => {
        const key = args.path.replace(/^picasso:/, "");
        return { contents: normalized.get(key) ?? "", loader: "tsx", resolveDir: "/" };
      });

      build.onLoad({ filter: /.*/, namespace: "picasso-css" }, () => ({ contents: "", loader: "js" }));
    },
  };
}

export async function bundleScreenForPreview(
  screenId: string,
  screenCode: string,
  componentFiles: Record<string, string>,
  supportFiles: Record<string, string> = {},
): Promise<string | null> {
  const { build } = await import("esbuild");
  const resolvePackage = (id: string) => _require.resolve(id);

  const vfs: Record<string, string> = {
    "src/screen.tsx": normalizeImports(screenCode),
    "src/cn.ts": supportFiles["cn"] ?? `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`,
    "src/cn.tsx": supportFiles["cn"] ?? `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }`,
    "src/__entry__.tsx": [
      `import React from "react";`,
      `import { createRoot } from "react-dom/client";`,
      `import * as ScreenModule from "./screen";`,
      `const Screen = ScreenModule.default || Object.values(ScreenModule).find(v => typeof v === "function") || (() => React.createElement("div", null, "No component found"));`,
      `const el = document.getElementById("root");`,
      `if (el) { createRoot(el).render(React.createElement(Screen)); }`,
      `window.__pastelMounted = true;`,
      `if (window.parent && window.parent !== window) {`,
      `  try { window.parent.postMessage({ type: "pastel:mounted" }, "*"); } catch (e) {}`,
      `}`,
    ].join("\n"),
  };
  for (const [name, code] of Object.entries(componentFiles)) {
    vfs[`src/${kebab(name)}.tsx`] = normalizeImports(code);
  }
  for (const [name, code] of Object.entries(supportFiles)) {
    if (name === "cn") continue;
    vfs[`src/${kebab(name)}.ts`] = normalizeImports(code);
  }

  try {
    const result = await build({
      entryPoints: ["src/__entry__.tsx"],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      jsx: "automatic",
      target: "es2020",
      logLevel: "silent",
      define: { "process.env.NODE_ENV": '"production"' },
      plugins: [virtualFsPlugin(vfs, resolvePackage)],
    });
    const text = result.outputFiles?.[0]?.text ?? "";
    return text.length > 100 ? text : null;
  } catch (err) {
    console.warn(`[preview] bundle failed for ${screenId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Tailwind v4 CSS compilation ─────────────────────────────────────────

const PREVIEW_TMP = path.resolve(__dirname, "../../.preview-tmp");
const CLI4 = path.resolve(process.cwd(), "node_modules", "@tailwindcss", "cli4", "dist", "index.mjs");

export interface CompileStylesInput {
  globalsCSS: string;
  components: Record<string, string>;
  screens: Record<string, string>;
  support: Record<string, string>;
}

export async function compileStylesForRun(input: CompileStylesInput): Promise<string | null> {
  const { globalsCSS, components, screens, support } = input;
  fs.mkdirSync(PREVIEW_TMP, { recursive: true });
  const runDir = fs.mkdtempSync(path.join(PREVIEW_TMP, "run-"));
  const srcDir = path.join(runDir, "src");
  fs.mkdirSync(srcDir, { recursive: true });

  try {
    // Alias tailwindcss → tailwindcss4 so v4 resolves from the workspace.
    const css = globalsCSS.replaceAll('@import "tailwindcss";', '@import "tailwindcss4";');
    fs.writeFileSync(path.join(srcDir, "index.css"), css);

    for (const [name, code] of Object.entries(components)) {
      fs.writeFileSync(path.join(srcDir, `${kebab(name)}.tsx`), normalizeImports(code));
    }
    for (const [name, code] of Object.entries(screens)) {
      fs.writeFileSync(path.join(srcDir, `${kebab(name)}.tsx`), normalizeImports(code));
    }
    for (const [name, code] of Object.entries(support)) {
      if (name === "cn") continue;
      fs.writeFileSync(path.join(srcDir, `${kebab(name)}.ts`), normalizeImports(code));
    }

    const out = path.join(srcDir, "styles.css");
    const code = await runCli(["-i", path.join(srcDir, "index.css"), "-o", out, "--content", `${srcDir}/**/*.tsx`]);
    if (code !== 0 || !fs.existsSync(out)) return null;
    return fs.readFileSync(out, "utf8");
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
}

function runCli(args: string[], timeoutMs = 240_000): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI4, ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += String(d); });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`tailwind CLI timed out after ${timeoutMs}ms: ${stderr.slice(0, 300)}`));
    }, timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`tailwind CLI exited ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(code ?? 0);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ── Preview HTML (for E2B renders and screenshots) ──────────────────────

export function buildPreviewHtml(
  screenName: string,
  bundle: string,
  styles: string,
  fonts: string[],
  width = 1440,
): string {
  const fontLinks = fonts.length
    ? fonts.map((f) => `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`).join("\n")
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(screenName)} — Picasso V6 Preview</title>
${fontLinks}
<style>
${styles}
html, body { height: 100%; }
</style>
</head>
<body>
<div id="root"></div>
<script>
${bundle}
</script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function previewTmpDir(): string {
  fs.mkdirSync(PREVIEW_TMP, { recursive: true });
  return PREVIEW_TMP;
}

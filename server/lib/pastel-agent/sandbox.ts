import esbuild from "esbuild";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

/**
 * Pastel Sandbox — compiles and smoke-renders the agent's virtual file system.
 *
 * Two verification stages per screen:
 *   1. esbuild bundle (browser IIFE, React bundled in) — catches syntax errors,
 *      unresolved imports, undefined identifiers at build time.
 *   2. renderToStaticMarkup smoke test (node CJS bundle, React external) —
 *      catches runtime errors: undefined components, bad hooks, null access.
 *
 * The browser bundles produced here are exactly what the preview route serves —
 * what the agent verified is byte-identical to what the user sees.
 */

export interface SandboxError {
  file?: string;
  line?: number;
  message: string;
}

export interface VerifyResult {
  ok: boolean;
  errors: SandboxError[];
  /** screenName → compiled browser JS */
  bundles: Record<string, string>;
}

const require = createRequire(import.meta.url);

/** Resolve react packages to real node_modules paths for the bundler. */
function resolvePackage(id: string): string {
  return require.resolve(id);
}

/** Strip markdown fences / stray prose a model may have wrapped code in. */
export function sanitizeFileContent(raw: string): string {
  let s = raw.trim();
  // Remove a single wrapping fence: ```jsx ... ```
  const fenceMatch = s.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n```\s*$/);
  if (fenceMatch) return fenceMatch[1].trim() + "\n";
  // Remove leading prose before the first import/const/export
  const codeStart = s.search(/^(import |const |export |function |\/\/)/m);
  if (codeStart > 0) s = s.slice(codeStart);
  return s;
}

function virtualFsPlugin(
  files: Record<string, string>,
  opts: { bundleReact: boolean },
): esbuild.Plugin {
  const normalized = new Map<string, string>();
  for (const [p, content] of Object.entries(files)) {
    normalized.set(path.posix.normalize(p), content);
  }

  return {
    name: "pastel-virtual-fs",
    setup(build) {
      if (opts.bundleReact) {
        // React packages → real node_modules paths (browser bundle)
        build.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, (args) => ({
          path: resolvePackage(args.path),
        }));
        build.onResolve({ filter: /^react-dom(\/client|\/server)?$/ }, (args) => ({
          path: resolvePackage(args.path),
        }));
      }

      // Relative/absolute imports into the virtual FS — only when the
      // importer is itself virtual (or this is the entry point). Imports
      // inside real node_modules files use esbuild's default resolution.
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path.endsWith(".css")) {
          return { path: args.path, namespace: "pastel-css" };
        }
        const isEntry = args.kind === "entry-point";
        const importerIsVirtual =
          args.namespace === "pastel" || args.importer.startsWith("pastel:");
        if (!isEntry && !importerIsVirtual) {
          return undefined; // default node resolution
        }
        // Bare react imports from virtual files: when react is external
        // (node smoke bundle), defer to esbuild's external handling.
        if (!opts.bundleReact && /^react(-dom)?(\/.*)?$/.test(args.path)) {
          return undefined;
        }
        let resolved: string;
        if (args.path.startsWith(".")) {
          const importer = args.importer.replace(/^pastel:/, "");
          resolved = path.posix.normalize(
            path.posix.join(path.posix.dirname(importer), args.path),
          );
        } else {
          resolved = path.posix.normalize(args.path.replace(/^\/+/, ""));
        }
        const candidates = [resolved, `${resolved}.jsx`, `${resolved}.js`];
        for (const c of candidates) {
          if (normalized.has(c)) return { path: `pastel:${c}`, namespace: "pastel" };
        }
        return {
          errors: [
            {
              text: `Could not resolve "${args.path}" (imported from ${args.importer.replace(/^pastel:/, "")})`,
            },
          ],
        };
      });

      build.onLoad({ filter: /.*/, namespace: "pastel" }, (args) => {
        const key = args.path.replace(/^pastel:/, "");
        const content = normalized.get(key);
        if (content === undefined) {
          return { errors: [{ text: `File not found: ${key}` }] };
        }
        return { contents: content, loader: "jsx", resolveDir: "/" };
      });

      // CSS imports become empty modules (styles are served separately)
      build.onLoad({ filter: /.*/, namespace: "pastel-css" }, () => ({
        contents: "",
        loader: "js",
      }));
    },
  };
}

function normalizeBuildErrors(err: unknown): SandboxError[] {
  const failure = err as esbuild.BuildFailure;
  if (failure && Array.isArray(failure.errors) && failure.errors.length > 0) {
    return failure.errors.map((e) => ({
      file: e.location?.file?.replace(/^pastel:/, "") || undefined,
      line: e.location?.line || undefined,
      message: e.text,
    }));
  }
  return [{ message: err instanceof Error ? err.message : String(err) }];
}

async function bundleScreenBrowser(
  files: Record<string, string>,
  screenPath: string,
): Promise<string> {
  const entryPath = "src/__entry__.jsx";
  const screenDir = path.posix.dirname(screenPath);
  const screenBase = path.posix.basename(screenPath);
  const relImport =
    path.posix.relative(path.posix.dirname(entryPath), path.posix.join(screenDir, screenBase));

  const filesWithEntry: Record<string, string> = {
    ...files,
    [entryPath]: [
      `import { createRoot } from "react-dom/client";`,
      `import Screen from "./${relImport}";`,
      `const el = document.getElementById("root");`,
      `createRoot(el).render(<Screen />);`,
      `window.__pastelMounted = true;`,
      `if (window.parent && window.parent !== window) { window.parent.postMessage({ type: "pastel:mounted" }, "*"); }`,
    ].join("\n"),
  };

  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    outfile: "preview.js",
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    target: "es2020",
    minify: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [virtualFsPlugin(filesWithEntry, { bundleReact: true })],
  });

  return result.outputFiles[0]?.text ?? "";
}

async function bundleScreenNode(
  files: Record<string, string>,
  screenPath: string,
  outFile: string,
): Promise<void> {
  const entryPath = "src/__smoke__.jsx";
  const screenDir = path.posix.dirname(screenPath);
  const screenBase = path.posix.basename(screenPath);
  const relImport =
    path.posix.relative(path.posix.dirname(entryPath), path.posix.join(screenDir, screenBase));

  const filesWithEntry: Record<string, string> = {
    ...files,
    [entryPath]: `export { default } from "./${relImport}";`,
  };

  await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    write: true,
    outfile: outFile,
    format: "cjs",
    platform: "node",
    jsx: "automatic",
    target: "node18",
    minify: false,
    logLevel: "silent",
    external: ["react", "react-dom", "react/jsx-runtime", "react-dom/server"],
    plugins: [virtualFsPlugin(filesWithEntry, { bundleReact: false })],
  });
}

/** Find all screen files in the virtual FS. */
export function listScreens(files: Record<string, string>): string[] {
  return Object.keys(files)
    .filter((p) => /^src\/screens\/[^/]+\.jsx$/.test(p))
    .sort();
}

/** screen file path → screen display name */
export function screenNameFromPath(p: string): string {
  return path.posix.basename(p).replace(/\.jsx$/, "");
}

/**
 * Verify a project: bundle every screen for the browser, then smoke-render
 * each screen server-side. Returns browser bundles ready to serve.
 */
export async function verifyProject(
  rawFiles: Record<string, string>,
): Promise<VerifyResult> {
  // Sanitize all file contents up front (strip fences/prose)
  const files: Record<string, string> = {};
  for (const [p, content] of Object.entries(rawFiles)) {
    files[p] = p.endsWith(".jsx") || p.endsWith(".js") ? sanitizeFileContent(content) : content;
  }

  const screens = listScreens(files);
  const errors: SandboxError[] = [];
  const bundles: Record<string, string> = {};

  if (screens.length === 0) {
    return {
      ok: false,
      errors: [{ message: "No screen files found under src/screens/" }],
      bundles,
    };
  }

  // Stage 1: browser bundles
  const bundleResults = await Promise.all(
    screens.map(async (screenPath) => {
      try {
        const js = await bundleScreenBrowser(files, screenPath);
        return { screenPath, js, error: null as SandboxError[] | null };
      } catch (err) {
        return { screenPath, js: "", error: normalizeBuildErrors(err) };
      }
    }),
  );

  for (const r of bundleResults) {
    if (r.error) {
      errors.push(...r.error);
    } else {
      bundles[screenNameFromPath(r.screenPath)] = r.js;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, bundles };
  }

  // Stage 2: smoke render each screen (catches runtime errors).
  // Temp bundles live under node_modules/.cache so node can resolve the
  // workspace's react from the external require() calls.
  const cacheBase = path.join(process.cwd(), "node_modules", ".cache");
  fs.mkdirSync(cacheBase, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(cacheBase, "pastel-sandbox-"));
  try {
    const smokeResults = await Promise.all(
      screens.map(async (screenPath) => {
        const name = screenNameFromPath(screenPath);
        const outFile = path.join(tmpDir, `${name}.cjs`);
        try {
          await bundleScreenNode(files, screenPath, outFile);
          const mod = require(outFile);
          const Screen = mod.default;
          if (typeof Screen !== "function") {
            return [
              { file: screenPath, message: `${screenPath} has no default export function` },
            ] as SandboxError[];
          }
          const React = require("react");
          const { renderToStaticMarkup } = require("react-dom/server");
          const html = renderToStaticMarkup(React.createElement(Screen));
          if (!html || html.length < 50) {
            return [
              { file: screenPath, message: `${name} rendered suspiciously little markup (${html?.length ?? 0} chars)` },
            ] as SandboxError[];
          }
          return [] as SandboxError[];
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return [{ file: screenPath, message: `Runtime error in ${name}: ${message}` }] as SandboxError[];
        } finally {
          // Clear require cache so re-verification picks up fixed code
          try { delete require.cache[outFile]; } catch {}
        }
      }),
    );

    for (const r of smokeResults) errors.push(...r);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  return { ok: errors.length === 0, errors, bundles };
}

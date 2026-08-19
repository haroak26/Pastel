import esbuild from "esbuild";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { hashArtifact } from "./codegen/hash";
import { e2bAvailable, smokeRenderInSandbox } from "./lib/sandbox-render";

/**
 * Maxi Agent v23 Sandbox — compiles the agent's virtual file system.
 *
 * Two verification stages per screen:
 *   1. esbuild bundle (browser IIFE, React bundled in) — catches syntax errors,
 *      unresolved imports, undefined identifiers at build time. This is a
 *      COMPILER — it never executes generated code, so it runs on the app
 *      server.
 *   2. smoke render — the CJS bundle (React external) is EXECUTED inside the
 *      e2b sandbox (lib/sandbox-render.ts::smokeRenderInSandbox). Generated
 *      code never executes on the app server after v23; if e2b is not
 *      configured the smoke stage is SKIPPED and reported, never run locally.
 *
 * The browser bundles produced here are exactly what the preview route serves —
 * what the agent verified is byte-identical to what the user sees.
 *
 * IncrementalScreenVerifier caches per-screen results keyed by the hash of
 * the screen's dependency closure, so repair rounds re-verify only the
 * screens actually affected by a change.
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
  /** Where the runtime smoke stage ran: the e2b sandbox, or skipped
   *  (e2b not configured — smoke is NEVER executed in-process). */
  smoke: "e2b" | "skipped" | "unavailable";
}

const require = (() => {
  try {
    const url = import.meta?.url;
    if (url) return createRequire(url);
  } catch {
    // bundled CJS output has no import.meta — resolve relative to the repo root
  }
  return createRequire(path.join(process.cwd(), "server", "lib", "maxi-agent", "sandbox.js"));
})();

/** Resolve react packages to real node_modules paths for the bundler. */
function resolvePackage(id: string): string {
  return require.resolve(id);
}

/**
 * Bare package imports allowed from virtual files. Resolved to real
 * node_modules paths in browser bundles; marked external in node bundles.
 * Generated projects depend on react + lucide-react only — every other
 * import is forbidden by the build contract.
 */
const SANDBOX_DEP_PATTERNS: Array<RegExp> = [
  /^react(\/jsx-runtime)?$/,
  /^react-dom(\/client|\/server)?$/,
  /^lucide-react$/,
];

function isSandboxDep(id: string): boolean {
  return SANDBOX_DEP_PATTERNS.some((re) => re.test(id));
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
  // V26: strip empty-path imports (Gemini emits `import ... from ""`)
  s = s.replace(/^import\s[^\n]*from\s+["']["'];?\s*$/gm, "");
  // V26: strip TypeScript syntax from .jsx output (Gemini emits TS in JSX)
  s = s.replace(/^\s*(export\s+)?(interface|type)\s+\w+[\s\S]*?[{;]\s*$/gm, "");
  s = s.replace(/\b(useState|useRef|useMemo|useCallback|useContext|useReducer)<[^>]+>/g, "$1");
  s = s.replace(/\s+as\s+(string|number|boolean|any|HTMLElement|Element|unknown)\b/g, "");
  return s;
}

function sanitizeFiles(rawFiles: Record<string, string>): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [p, content] of Object.entries(rawFiles)) {
    files[p] = p.endsWith(".jsx") || p.endsWith(".js") ? sanitizeFileContent(content) : content;
  }
  return files;
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
    name: "maxi-virtual-fs",
    setup(build) {
      if (opts.bundleReact) {
        // Allowlisted packages → real node_modules paths (browser bundle)
        build.onResolve({ filter: /.*/, namespace: "maxi" }, (args) => {
          if (isSandboxDep(args.path)) {
            return { path: resolvePackage(args.path) };
          }
          return undefined;
        });
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
          return { path: args.path, namespace: "maxi-css" };
        }
        const isEntry = args.kind === "entry-point";
        const importerIsVirtual =
          args.namespace === "maxi" || args.importer.startsWith("maxi:");
        if (!isEntry && !importerIsVirtual) {
          return undefined; // default node resolution
        }
        // Bare dep imports from virtual files: browser bundle resolves them
        // above; when deps are external (node smoke bundle), defer.
        if (!opts.bundleReact && (isSandboxDep(args.path) || /^react(-dom)?(\/.*)?$/.test(args.path))) {
          return undefined;
        }
        let resolved: string;
        if (args.path.startsWith(".")) {
          const importer = args.importer.replace(/^maxi:/, "");
          resolved = path.posix.normalize(
            path.posix.join(path.posix.dirname(importer), args.path),
          );
        } else {
          resolved = path.posix.normalize(args.path.replace(/^\/+/, ""));
        }
        const candidates = [resolved, `${resolved}.jsx`, `${resolved}.js`];
        for (const c of candidates) {
          if (normalized.has(c)) return { path: `maxi:${c}`, namespace: "maxi" };
        }
        return {
          errors: [
            {
              text: `Could not resolve "${args.path}" (imported from ${args.importer.replace(/^maxi:/, "")})`,
            },
          ],
        };
      });

      build.onLoad({ filter: /.*/, namespace: "maxi" }, (args) => {
        const key = args.path.replace(/^maxi:/, "");
        const content = normalized.get(key);
        if (content === undefined) {
          return { errors: [{ text: `File not found: ${key}` }] };
        }
        return { contents: content, loader: "jsx", resolveDir: "/" };
      });

      // CSS imports become empty modules (styles are served separately)
      build.onLoad({ filter: /.*/, namespace: "maxi-css" }, () => ({
        contents: "",
        loader: "js",
      }));
    },
  };
}

/** esbuild prefixes virtual-namespace paths (repeatedly for chained imports). */
function stripNamespacePrefix(file: string): string {
  return file.replace(/^(?:maxi:)+/, "");
}

function normalizeBuildErrors(err: unknown): SandboxError[] {
  const failure = err as esbuild.BuildFailure;
  if (failure && Array.isArray(failure.errors) && failure.errors.length > 0) {
    return failure.errors.map((e) => ({
      file: e.location?.file ? stripNamespacePrefix(e.location.file) : undefined,
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
      `window.__maxiMounted = true;`,
      `if (window.parent && window.parent !== window) { window.parent.postMessage({ type: "maxi:mounted" }, "*"); }`,
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

/** Compile the CJS smoke bundle (React external) — returns the bundle text.
 *  The bundle is EXECUTED in the e2b sandbox, never in-process. */
async function bundleScreenNodeCjs(
  files: Record<string, string>,
  screenPath: string,
): Promise<string> {
  const entryPath = "src/__smoke__.jsx";
  const screenDir = path.posix.dirname(screenPath);
  const screenBase = path.posix.basename(screenPath);
  const relImport =
    path.posix.relative(path.posix.dirname(entryPath), path.posix.join(screenDir, screenBase));

  const filesWithEntry: Record<string, string> = {
    ...files,
    [entryPath]: `export { default } from "./${relImport}";`,
  };

  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    outfile: "smoke.cjs",
    format: "cjs",
    platform: "node",
    jsx: "automatic",
    target: "node18",
    minify: false,
    logLevel: "silent",
    external: ["react", "react-dom", "react/jsx-runtime", "react-dom/server", "lucide-react"],
    plugins: [virtualFsPlugin(filesWithEntry, { bundleReact: false })],
  });

  return result.outputFiles[0]?.text ?? "";
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

/** All files (transitively) reachable from an entry path via relative imports. */
export function dependencyClosure(files: Record<string, string>, entryPath: string): Set<string> {
  const seen = new Set<string>();
  const stack = [entryPath];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    const content = files[current];
    if (!content) continue;
    for (const match of content.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(current), match[1]),
      );
      for (const candidate of [resolved, `${resolved}.jsx`, `${resolved}.js`, `${resolved}.css`]) {
        if (files[candidate] !== undefined) {
          stack.push(candidate);
          break;
        }
      }
    }
  }
  return seen;
}

function closureHash(files: Record<string, string>, entryPath: string): string {
  const closure = dependencyClosure(files, entryPath);
  const material = [...closure]
    .sort()
    .map((p) => `${p}\n${files[p] ?? ""}`)
    .join("\n:=:\n");
  return hashArtifact(material);
}

/**
 * Verify an arbitrary subset of screens: bundle each for the browser, then
 * smoke-render each server-side. Returns browser bundles ready to serve.
 *
 * The smoke stage runs INSIDE the e2b sandbox (never in-process). When e2b
 * is unavailable the smoke stage is skipped and `smoke` reports "skipped" —
 * it is never silently executed on the app server.
 */
export async function verifyScreens(
  rawFiles: Record<string, string>,
  screenPaths: string[],
  opts?: { smoke?: "sandbox" | "skip" },
): Promise<VerifyResult & { smoke: "e2b" | "skipped" | "unavailable" }> {
  const files = sanitizeFiles(rawFiles);
  const errors: SandboxError[] = [];
  const bundles: Record<string, string> = {};
  const wantSmoke = opts?.smoke === "skip" ? false : true;

  if (screenPaths.length === 0) {
    return { ok: true, errors, bundles, smoke: "skipped" };
  }

  // Stage 1: browser bundles (local esbuild — compilation only, no execution)
  const bundleResults = await Promise.all(
    screenPaths.map(async (screenPath) => {
      try {
        const js = await bundleScreenBrowser(files, screenPath);
        if (!js.trim()) {
          return { screenPath, js: "", error: [{ file: screenPath, message: `${screenPath} produced an empty browser bundle` }] as SandboxError[] };
        }
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
    return { ok: false, errors, bundles, smoke: "skipped" };
  }

  // Stage 2: smoke render each screen INSIDE the e2b sandbox (catches
  // runtime errors: undefined components, bad hooks, null access).
  if (!wantSmoke || !e2bAvailable()) {
    return { ok: true, errors, bundles, smoke: "unavailable" };
  }

  const smokeResults = await Promise.all(
    screenPaths.map(async (screenPath) => {
      const name = screenNameFromPath(screenPath);
      try {
        const cjs = await bundleScreenNodeCjs(files, screenPath);
        const result = await smokeRenderInSandbox(cjs);
        if (!result.ok) {
          return [{ file: screenPath, message: `Runtime error in ${name}: ${result.errors.join("; ")}` }] as SandboxError[];
        }
        return [] as SandboxError[];
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return [{ file: screenPath, message: `Runtime error in ${name}: ${message}` }] as SandboxError[];
      }
    }),
  );

  for (const r of smokeResults) errors.push(...r);

  return { ok: errors.length === 0, errors, bundles, smoke: "e2b" };
}

/**
 * Verify a project: bundle every screen for the browser, then smoke-render
 * each screen server-side. Returns browser bundles ready to serve.
 */
export async function verifyProject(
  rawFiles: Record<string, string>,
): Promise<VerifyResult & { smoke: "e2b" | "skipped" | "unavailable" }> {
  const files = sanitizeFiles(rawFiles);
  const screens = listScreens(files);

  if (screens.length === 0) {
    return {
      ok: false,
      errors: [{ message: "No screen files found under src/screens/" }],
      bundles: {},
      smoke: "skipped",
    };
  }

  return verifyScreens(files, screens);
}

// ── Incremental verifier ────────────────────────────────────────────────────

interface ScreenVerifyRecord {
  closureHash: string;
  ok: boolean;
  errors: SandboxError[];
  bundle: string;
}

export interface IncrementalVerifyResult extends VerifyResult {
  /** screens re-compiled in this round */
  rebuilt: string[];
  /** screens whose previous result was reused */
  reused: string[];
}

/**
 * Caches per-screen verification results keyed by dependency-closure hash.
 * Repair rounds call verify() repeatedly; only screens whose code (or whose
 * components' code) changed are re-compiled.
 */
export class IncrementalScreenVerifier {
  private records = new Map<string, ScreenVerifyRecord>();

  async verify(rawFiles: Record<string, string>): Promise<IncrementalVerifyResult> {
    const files = sanitizeFiles(rawFiles);
    const screens = listScreens(files);
    const errors: SandboxError[] = [];
    const bundles: Record<string, string> = {};
    const rebuilt: string[] = [];
    const reused: string[] = [];

    if (screens.length === 0) {
      return { ok: false, errors: [{ message: "No screen files found under src/screens/" }], bundles, rebuilt, reused, smoke: "skipped" };
    }

    const changed: string[] = [];
    const hashes = new Map<string, string>();
    for (const screenPath of screens) {
      const hash = closureHash(files, screenPath);
      hashes.set(screenPath, hash);
      const prev = this.records.get(screenNameFromPath(screenPath));
      if (!prev || prev.closureHash !== hash) changed.push(screenPath);
    }

    const partial = await verifyScreens(files, changed);

    for (const screenPath of screens) {
      const name = screenNameFromPath(screenPath);
      if (!changed.includes(screenPath)) {
        const prev = this.records.get(name)!;
        reused.push(name);
        if (prev.ok) bundles[name] = prev.bundle;
        else {
          errors.push(...prev.errors);
          if (prev.errors.length === 0) {
            // Defensive: a previously-broken-but-errorless screen must surface.
            errors.push({ file: screenPath, message: `${screenPath} has no verified browser bundle` });
          }
        }
        continue;
      }
      rebuilt.push(name);
      const closure = dependencyClosure(files, screenPath);
      const screenErrors = partial.errors.filter((err) =>
        err.file === screenPath || (err.file && closure.has(err.file)) || (!err.file && changed.includes(screenPath)),
      );
      const bundle = partial.bundles[name] ?? "";
      let ok = screenErrors.length === 0 && !!bundle;
      if (ok === false && screenErrors.length === 0) {
        screenErrors.push({ file: screenPath, message: `${screenPath} produced no verified browser bundle` });
      }
      this.records.set(name, { closureHash: hashes.get(screenPath)!, ok, errors: screenErrors, bundle });
      if (ok) bundles[name] = bundle;
      else errors.push(...screenErrors);
    }

    const everyScreenBundled = screens.every((screenPath) => !!bundles[screenNameFromPath(screenPath)]);
    return { ok: errors.length === 0 && everyScreenBundled, errors, bundles, rebuilt, reused, smoke: partial.smoke };
  }

  /** Forget everything (e.g. when the file set is replaced wholesale). */
  reset(): void {
    this.records.clear();
  }
}

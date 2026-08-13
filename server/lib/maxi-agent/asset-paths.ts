import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the runtime asset root for Pastel's on-disk assets (company
 * design.md files, megadesign.md, base component .jsx files).
 *
 * In dev (tsx / ESM) `import.meta.url` points at the source file. In the
 * bundled CJS server output (`dist/server/index.cjs`) esbuild makes it
 * empty, so fall back to the repo-relative path — the server is always run
 * from the repository root (`node dist/server/index.cjs`).
 */
export function maxiAssetRoot(): string {
  try {
    const meta = import.meta as { url?: string } | undefined;
    if (meta?.url && meta.url.startsWith("file:")) {
      const p = new URL(meta.url).pathname;
      const dir = path.dirname(p);
      // If the source tree exists at this path, trust it (dev).
      if (fs.existsSync(path.join(dir, "..", "..", "knowledge"))) return path.join(dir, "..", "..");
      if (fs.existsSync(dir)) return dir;
    }
  } catch {
    // import.meta unavailable/empty in bundled CJS — fall through
  }
  return path.join(process.cwd(), "server", "lib", "maxi-agent");
}

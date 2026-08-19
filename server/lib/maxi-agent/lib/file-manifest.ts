import type { DesignBlueprint, ManifestComponent } from "./blueprint";
import { hashArtifact } from "../codegen/hash";

/**
 * Maxi Agent v25 — the exported project manifest.
 *
 * The run's output is a REAL project of individually-copyable files. This
 * module builds manifest.json: per-file entries with resolved dependency
 * edges and component APIs, the copy-set closure (the client's "copy with
 * dependencies" chips), and the run's uniqueness fingerprint.
 */

export interface FileManifestEntry {
  path: string;
  kind: "screen" | "component" | "shell" | "data" | "style" | "project";
  bytes: number;
  /** Project-relative imports resolved to real file paths. */
  deps: string[];
  /** Present for components: the manifest API (drives the client's docs). */
  api?: { props: ManifestComponent["props"] };
}

export interface FileManifest {
  generatedAt: string;
  entry: string;
  files: FileManifestEntry[];
}

function kindOf(path: string): FileManifestEntry["kind"] {
  if (path.startsWith("src/screens/")) return "screen";
  if (path.startsWith("src/components/")) return "component";
  if (path.startsWith("src/lib/")) return "shell";
  if (path === "src/data.js") return "data";
  if (path.endsWith(".css")) return "style";
  return "project";
}

function resolveImport(from: string, spec: string): string | null {
  const norm = (p: string) => p.replace(/\/$/, "");
  const join = (base: string, rel: string) => {
    const parts = norm(base).split("/");
    const relParts = rel.split("/");
    const out = [...parts.slice(0, -1)];
    for (const rp of relParts) {
      if (rp === "." || rp === "") continue;
      if (rp === "..") out.pop();
      else out.push(rp);
    }
    return out.join("/");
  };
  const base = join(from, spec);
  return norm(base);
}

export function buildFileManifest(files: Record<string, string>, bp: DesignBlueprint): FileManifest {
  const paths = Object.keys(files).sort();
  const apis = new Map<string, ManifestComponent["props"]>();
  for (const c of bp.componentManifest) {
    apis.set(`src/components/${c.name}.jsx`, c.props);
  }

  const entries: FileManifestEntry[] = paths.map((path) => {
    const code = files[path] ?? "";
    const deps = new Set<string>();
    for (const m of code.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const resolved = resolveImport(path, m[1]!);
      for (const candidate of [resolved, `${resolved}.jsx`, `${resolved}.js`, `${resolved}.css`]) {
        if (candidate && files[candidate] !== undefined) {
          deps.add(candidate);
          break;
        }
      }
    }
    const api = apis.get(path);
    return {
      path,
      kind: kindOf(path),
      bytes: code.length,
      deps: [...deps].sort(),
      ...(api ? { api: { props: api } } : {}),
    };
  });

  return { generatedAt: new Date().toISOString(), entry: "src/App.jsx", files: entries };
}

/** The dependency closure of a file (itself + everything it imports). */
export function copySet(manifest: FileManifest, path: string): string[] {
  const byPath = new Map(manifest.files.map((f) => [f.path, f]));
  const seen = new Set<string>();
  const stack = [path];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    const entry = byPath.get(current);
    if (!entry) continue;
    seen.add(current);
    stack.push(...entry.deps);
  }
  return [...seen].sort();
}

// ── Uniqueness fingerprint ─────────────────────────────────────────────────

import { hexToHsl, relativeLuminance } from "./colors";

function structuralProfile(code: string): string {
  // The sorted multiset of JSX tags + tailwind layout/typography classes —
  // a shape signature that ignores identifiers and byte noise.
  const tags = [...code.matchAll(/<\/?([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]!);
  const classes = [
    ...code.matchAll(
      /\b(?:grid|flex|hidden|block|inline-flex|sticky|text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)|tabular-nums|max-w-\[[^\]]+\]|lg:grid-cols-\[[^\]]+\]|divide-y|border-b|border-r|rounded-\[var\(--radius-(?:sm|md|lg|xl)\)\])\b/g,
    ),
  ].map((m) => m[0]);
  return [...tags, ...classes].sort().join("|");
}

/**
 * A stable identity of this run's DESIGN: concept palette/type/axes + the
 * structural profile of what was actually authored. Two runs with the same
 * fingerprint are the same design; the e2e gate asserts three different
 * briefs produce three different fingerprints (the anti-slop regression).
 */
export function uniquenessFingerprint(bp: DesignBlueprint, files: Record<string, string>): string {
  const concept = bp.concepts[bp.chosenConcept] ?? bp.concepts[0]!;
  const hue = Math.round(hexToHsl(concept.palette.primary).h / 10) * 10;
  const lum = Math.round(relativeLuminance(concept.palette.background) * 20) / 20;
  const material = {
    hue,
    lum,
    fonts: [concept.fonts.display, concept.fonts.body].sort(),
    density: concept.density,
    corner: concept.cornerLanguage,
    components: bp.componentManifest.map((c) => c.name).sort(),
    screens: bp.screens.map((s) => s.id).sort(),
    structure: Object.keys(files)
      .filter((p) => /^src\/(screens|components)\//.test(p))
      .sort()
      .map((p) => `${p}:${hashArtifact(structuralProfile(files[p] ?? ""))}`)
      .join(","),
  };
  const hex = hashArtifact(JSON.stringify(material));
  return hex.slice(0, 16);
}

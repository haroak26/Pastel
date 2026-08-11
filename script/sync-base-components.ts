/**
 * Sync base-components/ui with the current shadcn registry (radix-nova style).
 *
 * - Fetches https://ui.shadcn.com/r/styles/radix-nova/{name}.json for every
 *   vendored component and overwrites ui/{name}.tsx with the registry source,
 *   rewritten to the pipeline's import conventions:
 *     @/registry/radix-nova/lib/utils   -> @/lib/utils
 *     @/registry/radix-nova/ui/{x}      -> @/components/ui/{x}
 *     @/registry/radix-nova/hooks/{x}   -> @/hooks/{x}
 *     @/app/(create)/components/icon-placeholder -> ./icon-placeholder
 * - Keeps vendored versions of any component whose registry source imports
 *   Base UI, @shadcn/* or other app-internal paths (combobox, message-scroller,
 *   questionnaire, ...).
 * - Vendors a self-contained ui/icon-placeholder.tsx (lucide icons only).
 * - Regenerates manifest.json.
 * - Refreshes theme/utilities.css (+ globals.css ejected section) from the
 *   shadcn package's tailwind.css if a newer version is published.
 *
 * Run: npx tsx script/sync-base-components.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STYLE = "radix-nova";
const BASE = path.resolve(__dirname, "../server/lib/pastel-agent/picasso/base-components");
const UI_DIR = path.join(BASE, "ui");
const THEME_DIR = path.join(BASE, "theme");
const registryUrl = (name: string) => `https://ui.shadcn.com/r/styles/${STYLE}/${name}.json`;

// Components that must keep their vendored (self-contained) implementation:
// their registry source depends on Base UI / @shadcn/react helpers.
const HARD_KEEP = new Set(["combobox", "message-scroller", "questionnaire"]);

const FORBIDDEN_IMPORT = /@base-ui\/|@base_ui\/|@shadcn\//;
const APP_IMPORT = /@\/app\/(?![^"']*icon-placeholder)/;
const ICON_PLACEHOLDER_IMPORT = "@/app/(create)/components/icon-placeholder";

const REWRITES: Array<[RegExp, string]> = [
  [/@\/registry\/radix-nova\/lib\/utils/g, "@/lib/utils"],
  [/@\/registry\/radix-nova\/lib\/([^"']+)/g, "@/lib/$1"],
  [/@\/registry\/radix-nova\/hooks\/([^"']+)/g, "@/hooks/$1"],
  [/@\/registry\/radix-nova\/ui\/([^"']+)/g, "@/components/ui/$1"],
  [/@\/registry\/radix-nova\/components\/([^"']+)/g, "@/components/$1"],
  [new RegExp(ICON_PLACEHOLDER_IMPORT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "./icon-placeholder"],
];

function importsOf(source: string): string[] {
  return [...source.matchAll(/^import[^\n]*/gm)].map((m) => m[0].trim());
}

function specOf(line: string): string | null {
  const m = line.match(/from\s+["']([^"']+)["']/);
  return m ? m[1] : null;
}

async function fetchJson(url: string): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "picasso-sync" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function writeIfChanged(file: string, content: string): boolean {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return false;
  fs.writeFileSync(file, content);
  return true;
}

async function main() {
  const vendored = fs
    .readdirSync(UI_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""))
    .sort();

  const updated: string[] = [];
  const kept: Array<{ name: string; reason: string }> = [];
  const iconUses = new Set<string>();

  for (const name of vendored) {
    if (name === "icon-placeholder") continue;
    if (HARD_KEEP.has(name)) {
      kept.push({ name, reason: "hard-keep (Base UI / @shadcn/react in registry source)" });
      continue;
    }
    const item = await fetchJson(registryUrl(name));
    if (!item || !item.files?.length) {
      kept.push({ name, reason: "not in registry (kept vendored)" });
      continue;
    }
    let source = item.files[0].content as string;

    let reason = "";
    for (const imp of importsOf(source)) {
      const spec = specOf(imp) ?? "";
      if (FORBIDDEN_IMPORT.test(spec)) reason = `registry imports ${spec.split("/").slice(0, 2).join("/")}`;
      else if (APP_IMPORT.test(spec) && !spec.includes("icon-placeholder")) reason = `registry imports app-internal ${spec}`;
      if (reason) break;
    }
    if (reason) {
      kept.push({ name, reason });
      continue;
    }

    for (const [re, to] of REWRITES) source = source.replace(re, to);

    if (/@\/registry\//.test(source)) {
      kept.push({ name, reason: "leftover @/registry import after rewrite" });
      continue;
    }
    if (/@\/app\//.test(source)) {
      kept.push({ name, reason: "leftover app-internal import after rewrite" });
      continue;
    }

    for (const icon of source.matchAll(/lucide="([A-Za-z0-9]+)"/g)) iconUses.add(icon[1]);

    if (writeIfChanged(path.join(UI_DIR, `${name}.tsx`), source)) updated.push(name);
  }

  // ── Vendor icon-placeholder (lucide-only) ─────────────────────────────
  const lucide = require("lucide-react") as Record<string, unknown>;
  const icons: string[] = [];
  for (const use of [...iconUses].sort()) {
    if (use in lucide) icons.push(use);
    else {
      const alt = use.replace(/Icon$/, "");
      if (alt in lucide) icons.push(alt);
      else console.warn(`[sync] lucide icon ${use} not found in installed lucide-react`);
    }
  }
  const iconSource = `import * as React from "react"\nimport { ${icons.join(", ")} } from "lucide-react"\n\nconst iconMap = { ${icons.join(", ")} } as const\n\n/** Vendored shadcn IconPlaceholder (lucide-only). Props are the icon-library\n *  names from the registry (lucide/tabler/hugeicons/phosphor/remixicon) plus\n *  svg props; only the lucide name is honored. */\nexport function IconPlaceholder({\n  lucide,\n  tabler,\n  hugeicons,\n  phosphor,\n  remixicon,\n  ...props\n}: {\n  lucide?: string\n  tabler?: string\n  hugeicons?: string\n  phosphor?: string\n  remixicon?: string\n} & React.ComponentProps<"svg">) {\n  const name = lucide ?? tabler ?? hugeicons ?? phosphor ?? remixicon\n  if (!name) return null\n  const Icon = iconMap[name as keyof typeof iconMap]\n  if (!Icon) return null\n  return <Icon {...props} />\n}\n`;
  writeIfChanged(path.join(UI_DIR, "icon-placeholder.tsx"), iconSource);

  // ── Regenerate manifest.json ──────────────────────────────────────────
  const files = fs.readdirSync(UI_DIR).filter((f) => f.endsWith(".tsx")).sort();
  const components: Record<string, any>[] = [];
  const external = new Set<string>();
  for (const file of files) {
    const name = file.replace(/\.tsx$/, "");
    const source = fs.readFileSync(path.join(UI_DIR, file), "utf8");
    const imports: string[] = [];
    const siblingImports: string[] = [];
    for (const imp of importsOf(source)) {
      const spec = specOf(imp);
      if (!spec) continue;
      imports.push(spec);
      if (spec.startsWith("@/components/ui")) siblingImports.push(path.basename(spec));
      else if (spec.startsWith("@/")) {
        const leaf = path.basename(spec);
        siblingImports.push(leaf === "utils" ? "cn" : leaf);
      } else if (spec.startsWith(".")) siblingImports.push(path.basename(spec));
      else external.add(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
    }
    const exportsBlock = source.match(/export\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    components.push({
      name,
      file,
      path: `ui/${file}`,
      imports,
      siblingImports,
      exports: exportsBlock ? [exportsBlock.split("\n").map((l) => l.trimEnd()).join("\n")] : [],
      lines: source.split("\n").length,
    });
  }
  components.sort((a, b) => a.name.localeCompare(b.name));
  external.add("@/lib/utils");
  external.add("@/hooks/use-mobile");
  const manifest = {
    style: STYLE,
    preset: "b0",
    generated: new Date().toISOString(),
    runtimeDependencies: [...external].sort(),
    components,
  };
  writeIfChanged(path.join(BASE, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");

  // ── Refresh theme from shadcn package (tailwind.css) ──────────────────
  const npmMeta = await fetch("https://registry.npmjs.org/shadcn/latest", {
    headers: { "user-agent": "picasso-sync" },
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const shadcnVersion = npmMeta?.version ?? "latest";
  const tailwindCss = await fetch(
    `https://unpkg.com/shadcn@${shadcnVersion}/dist/tailwind.css`,
    { headers: { "user-agent": "picasso-sync" } }
  ).then((r) => (r.ok ? r.text() : null));
  if (tailwindCss) {
    const header = `/* ejected from shadcn@${shadcnVersion} */\n`;
    const fresh = header + tailwindCss;
    const stripHeader = (css: string) => css.replace(/^\/\* ejected from shadcn@[^\n]*\*\/\n?/, "");
    const utilitiesPath = path.join(THEME_DIR, "utilities.css");
    const utilities = fs.readFileSync(utilitiesPath, "utf8");
    if (stripHeader(tailwindCss) !== stripHeader(utilities) || utilities !== fresh) {
      writeIfChanged(utilitiesPath, fresh);
      console.log(`[theme] utilities.css updated (shadcn@${shadcnVersion})`);
    } else {
      console.log(`[theme] utilities.css already current (shadcn@${shadcnVersion})`);
    }
    const globalsPath = path.join(THEME_DIR, "globals.css");
    const globals = fs.readFileSync(globalsPath, "utf8");
    if (!globals.includes("@import \"shadcn/tailwind.css\"")) {
      const markerIdx = globals.indexOf("/* ejected from shadcn@");
      const endIdx = globals.indexOf("@import \"@fontsource-variable/inter\";");
      if (markerIdx >= 0 && endIdx > markerIdx) {
        const section = globals.slice(markerIdx, endIdx);
        if (stripHeader(section) !== stripHeader(tailwindCss) || section !== fresh) {
          writeIfChanged(globalsPath, globals.slice(0, markerIdx) + fresh + globals.slice(endIdx));
          console.log(`[theme] globals.css ejected section updated (shadcn@${shadcnVersion})`);
        } else {
          console.log("[theme] globals.css ejected section already current");
        }
      }
    }
  }

  // ── Report ────────────────────────────────────────────────────────────
  console.log(`\n=== SYNC REPORT (style: ${STYLE}) ===`);
  console.log(`updated: ${updated.length}`);
  for (const n of updated) console.log(`  + ${n}`);
  console.log(`kept vendored: ${kept.length}`);
  for (const k of kept) console.log(`  ~ ${k.name} — ${k.reason}`);
  console.log(`icon-placeholder: ${icons.length} icons (${icons.join(", ")})`);
  console.log(`manifest.json: ${components.length} entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import fs from "node:fs";
import path from "node:path";
import { pastelAssetRoot } from "../asset-paths";
import { companyManifestSchema, companyCatalogSchema, type CompanyManifest, type CompanyCatalog } from "./manifest-schema";
import { rotateHue, darken, contrastRatio } from "../lib/colors";
import type { ResolvedTheme, V6Selection } from "../schemas-v6";

/**
 * V6 knowledge base registry.
 *
 * `knowledge/companies/<slug>/` pairs a detailed human `design.md` (persisted
 * as a run doc, read by the review agent) with a structured `manifest.ts`
 * (compiled into compact prompt blocks for every agent). `megadesign.md` is
 * the universal design law applied to every run.
 *
 * Manifests are validated at load time and cached in memory. Nothing here
 * calls the model — scoring is deterministic tag matching.
 */

const COMPANY_MODULES = {
  apple: () => import("./companies/apple/manifest.ts"),
  nike: () => import("./companies/nike/manifest.ts"),
  uber: () => import("./companies/uber/manifest.ts"),
  airbnb: () => import("./companies/airbnb/manifest.ts"),
  spotify: () => import("./companies/spotify/manifest.ts"),
  stripe: () => import("./companies/stripe/manifest.ts"),
  notion: () => import("./companies/notion/manifest.ts"),
  netflix: () => import("./companies/netflix/manifest.ts"),
  linear: () => import("./companies/linear/manifest.ts"),
  duolingo: () => import("./companies/duolingo/manifest.ts"),
  figma: () => import("./companies/figma/manifest.ts"),
} as const satisfies Record<string, () => Promise<{ manifest: unknown }>>;

type CompanySlug = keyof typeof COMPANY_MODULES;

const manifestCache = new Map<string, CompanyManifest>();
const docCache = new Map<string, string>();
let megadesignCache: string | null = null;

function companyRoot(): string {
  return path.join(pastelAssetRoot(), "knowledge", "companies");
}

/**
 * V10 auto-registration: the bundled manifests above are the production
 * baseline (esbuild inlines them into the server bundle). On top of that,
 * every folder under `knowledge/companies/<slug>/` with a `manifest.ts` is
 * discovered at runtime — in the tsx dev server the dynamic import works, so
 * adding a company is a matter of dropping in a folder (manifest.ts +
 * design.md + optional preview.png). Nothing else needs editing.
 *
 * The scan is deliberately not cached (one readdir — cheap); the parsed
 * manifests ARE cached below, so adding a company mid-run just works.
 */
function companyModules(): Record<string, () => Promise<{ manifest: unknown }>> {
  const out: Record<string, () => Promise<{ manifest: unknown }>> = { ...COMPANY_MODULES };
  try {
    const root = companyRoot();
    if (fs.existsSync(root)) {
      for (const slug of fs.readdirSync(root)) {
        if (!slug || out[slug]) continue;
        if (!fs.existsSync(path.join(root, slug, "manifest.ts"))) continue;
        out[slug] = () => import(path.join(root, slug, "manifest.ts"));
      }
    }
  } catch {
    // on-disk discovery is best-effort; the bundled manifests always work.
  }
  return out;
}

export function listCompanySlugs(): string[] {
  return Object.keys(companyModules());
}

export async function loadCompany(slug: string): Promise<CompanyManifest> {
  const mod = companyModules()[slug];
  if (!mod) {
    throw new Error(
      `company "${slug}" is not registered — add it under knowledge/companies/${slug}/ with a manifest.ts (and design.md), or use one of: ${listCompanySlugs().join(", ")}`,
    );
  }
  const cached = manifestCache.get(slug);
  if (cached) return cached;
  const { manifest } = await mod();
  const parsed = companyManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    throw new Error(
      `company "${slug}" manifest invalid: ${parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`,
    );
  }
  manifestCache.set(slug, parsed.data);
  return parsed.data;
}

/** The full design.md for a company (for run docs + the review agent). */
export async function loadCompanyDoc(slug: string): Promise<string | null> {
  const cached = docCache.get(slug);
  if (cached !== undefined) return cached;
  const p = path.join(companyRoot(), slug, "design.md");
  if (!fs.existsSync(p)) {
    docCache.set(slug, null as unknown as string);
    return null;
  }
  const content = fs.readFileSync(p, "utf8");
  docCache.set(slug, content);
  return content;
}

// ── V10 company reference imagery ─────────────────────────────────────────

/** Image files shipped with a company (preview.png, references/*.png). */
export function companyImageFiles(slug: string): string[] {
  const root = path.join(companyRoot(), slug);
  try {
    if (!fs.existsSync(root)) return [];
    const out: string[] = [];
    const preview = path.join(root, "preview.png");
    if (fs.existsSync(preview)) out.push("preview.png");
    const refs = path.join(root, "references");
    if (fs.existsSync(refs)) {
      for (const f of fs.readdirSync(refs)) {
        if (/\.(png|jpe?g|webp)$/i.test(f)) out.push(`references/${f}`);
      }
    }
    return out.sort();
  } catch {
    return [];
  }
}

/** Read a company image file (path-safe — only files under the company
 * folder). Returns null when the file does not exist. */
export function readCompanyImage(slug: string, file: string): Buffer | null {
  const safe = file.replace(/^\.\.\//g, "").replace(/\/+/g, "/");
  const p = path.resolve(path.join(companyRoot(), slug, safe));
  const root = path.resolve(companyRoot(), slug);
  if (!p.startsWith(root + path.sep) && p !== root) return null;
  try {
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return null;
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

/** V11: company reference imagery as gateway image blocks — the wireframe,
 * UX, planner and builder prompts attach these so the models adapt structure
 * and components to the company's ACTUAL look (not just its tokens). Best
 * effort: returns [] when a company ships no imagery. `references/*` are
 * preferred over the gallery `preview.png`. */
export async function companyRefImageBlocks(
  slug: string,
  max = 2,
  maxBytes = 1_500_000,
): Promise<Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }>> {
  const out: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  try {
    const files = companyImageFiles(slug);
    const ordered = [...files.filter((f) => f !== "preview.png"), ...files.filter((f) => f === "preview.png")];
    for (const file of ordered.slice(0, max)) {
      const buf = readCompanyImage(slug, file);
      if (!buf || buf.byteLength <= 0 || buf.byteLength > maxBytes) continue;
      const media_type = file.endsWith(".webp") ? "image/webp"
        : file.endsWith(".jpg") || file.endsWith(".jpeg") ? "image/jpeg"
        : "image/png";
      out.push({ type: "image", source: { type: "base64", media_type, data: buf.toString("base64") } });
    }
  } catch {
    /* reference imagery is optional */
  }
  return out;
}

/** The universal design law, compiled to a compact prompt block. */
export async function megadesignBlock(): Promise<string> {
  if (megadesignCache) return megadesignCache;
  const p = path.join(pastelAssetRoot(), "knowledge", "megadesign.md");
  megadesignCache = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  return megadesignCache;
}

// ── Catalog (gallery UI) ─────────────────────────────────────────────────

export async function listCatalog(): Promise<CompanyCatalog[]> {
  const out: CompanyCatalog[] = [];
  for (const slug of listCompanySlugs()) {
    const m = await loadCompany(slug);
    const previews = companyImageFiles(slug).filter((f) => f === "preview.png");
    const parsed = companyCatalogSchema.parse({
      slug: m.slug,
      name: m.name,
      description: m.description,
      tags: m.bestFor.slice(0, 10),
      swatches: [m.light.primary, m.light.accent, m.light.background, m.light.foreground].slice(0, 6),
      imageUrl: previews.length > 0 ? `/api/pastel-agent/knowledge/${slug}/image/preview.png` : undefined,
    });
    out.push(parsed);
  }
  return out;
}

// ── Deterministic prompt scoring (clarify suggestions) ──────────────────

export interface CompanyScore {
  slug: string;
  name: string;
  score: number;
  hits: string[];
}

export async function scoreCompanies(prompt: string): Promise<CompanyScore[]> {
  const p = prompt.toLowerCase();
  const out: CompanyScore[] = [];
  for (const slug of listCompanySlugs()) {
    const m = await loadCompany(slug);
    const hits: string[] = [];
    for (const tag of m.bestFor) {
      const tokens = tag.split("|");
      if (tokens.some((t) => t.trim() && p.includes(t.trim().toLowerCase()))) hits.push(tag);
    }
    out.push({ slug, name: m.name, score: hits.length, hits });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ── Compact prompt block (token-efficient knowledge injection) ──────────

export async function compileCompanyBlock(slug: string): Promise<string> {
  const m = await loadCompany(slug);
  const lines: string[] = [
    `# ${m.name} — design language`,
    m.description,
    "",
    "## Voice & tone",
    m.voiceAndTone,
    "",
    "## Tokens",
    ":root {",
    `  --background: ${m.light.background};`,
    `  --foreground: ${m.light.foreground};`,
    `  --card: ${m.light.card};`,
    `  --primary: ${m.light.primary};`,
    `  --primary-foreground: ${m.light.primaryForeground};`,
    `  --secondary: ${m.light.secondary};`,
    `  --muted: ${m.light.muted};`,
    `  --muted-foreground: ${m.light.mutedForeground};`,
    `  --accent: ${m.light.accent};`,
    `  --destructive: ${m.light.destructive};`,
    `  --success: ${m.light.success};`,
    `  --warning: ${m.light.warning};`,
    `  --border: ${m.light.border};`,
    `  --input: ${m.light.input};`,
    "}",
    `Fonts: display="${m.fonts.display}", body="${m.fonts.body}"${m.fonts.mono ? `, mono="${m.fonts.mono}"` : ""}`,
    "",
    "## Composition rules",
    ...m.rules.map((r) => `- ${r}`),
    "",
    "## Signature moves",
    ...m.signatureMoves.map((s) => `- ${s}`),
    "",
    "## Avoid",
    ...m.avoidPatterns.map((a) => `- ${a}`),
  ];
  // V10: when the company ships reference imagery, every agent knows it
  // exists (the visual review attaches the actual images).
  const images = companyImageFiles(slug);
  if (images.length > 0) {
    lines.push("", "## Reference imagery", `Shipped files: ${images.join(", ")} — use them as the ground truth for brand fidelity.`);
  }
  return lines.join("\n");
}

// ── Resolve company + selection → concrete values ─────────────────────────

export function resolveCompanyTheme(
  manifest: CompanyManifest,
  selection: Pick<V6Selection, "mode" | "hue">,
): ResolvedTheme {
  const tokens = selection.mode === "dark" ? manifest.dark : manifest.light;
  const hueDelta = selection.hue - manifest.hueBase;
  const rotate = (hex: string) => rotateHue(hex, hueDelta);
  const t = tokens;

  const colors = {
    primary: rotate(t.primary),
    primaryHover: darken(rotate(t.primary), 0.08),
    accent: rotate(t.accent),
    accentHover: darken(rotate(t.accent), 0.08),
    destructive: rotate(t.destructive),
    destructiveHover: darken(rotate(t.destructive), 0.08),
    success: rotate(t.success),
    warning: rotate(t.warning),
    chart: t.chart.map(rotate),
  };

  const ts = manifest.typeScale;
  const cssVars: Record<string, string> = {
    "--background": t.background,
    "--foreground": t.foreground,
    "--card": t.card,
    "--card-foreground": t.cardForeground,
    "--popover": t.popover,
    "--popover-foreground": t.popoverForeground,
    "--primary": colors.primary,
    "--primary-foreground": t.primaryForeground,
    "--primary-hover": colors.primaryHover,
    "--secondary": t.secondary,
    "--secondary-foreground": t.secondaryForeground,
    "--muted": t.muted,
    "--muted-foreground": t.mutedForeground,
    "--accent": colors.accent,
    "--accent-foreground": t.accentForeground,
    "--accent-hover": colors.accentHover,
    "--destructive": colors.destructive,
    "--destructive-foreground": t.destructiveForeground,
    "--destructive-hover": colors.destructiveHover,
    "--success": colors.success,
    "--success-subtle": t.successSubtle,
    "--warning": colors.warning,
    "--warning-subtle": t.warningSubtle,
    "--border": t.border,
    "--input": t.input,
    "--ring": colors.accent,

    "--radius": `${manifest.radius.md}px`,
    "--radius-sm": `${manifest.radius.sm}px`,
    "--radius-md": `${manifest.radius.md}px`,
    "--radius-lg": `${manifest.radius.lg}px`,
    "--radius-xl": `${manifest.radius.xl}px`,
    "--radius-full": `${manifest.radius.full}px`,

    "--font-display": `"${manifest.fonts.display}"`,
    "--font-body": `"${manifest.fonts.body}"`,
    ...(manifest.fonts.mono ? { "--font-mono": `"${manifest.fonts.mono}"` } : {}),

    "--text-xs": `${ts.xs}px`,
    "--text-sm": `${ts.sm}px`,
    "--text-base": `${ts.base}px`,
    "--text-lg": `${ts.lg}px`,
    "--text-xl": `${ts.xl}px`,
    "--text-2xl": `${ts["2xl"]}px`,
    "--text-3xl": `${ts["3xl"]}px`,
    "--text-4xl": `${ts["4xl"]}px`,

    "--section-padding-y": `${manifest.sectionPaddingY}px`,
    "--section-gap": `${manifest.sectionGap}px`,
    "--content-max": "1280px",
  };

  const fontFamilies = [...new Set([manifest.fonts.display, manifest.fonts.body, manifest.fonts.mono].filter(Boolean))] as string[];

  return { manifest, tokens, mode: selection.mode, selection, cssVars, fontFamilies, colors };
}

export { contrastRatio };

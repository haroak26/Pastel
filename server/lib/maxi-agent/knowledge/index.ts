import fs from "node:fs";
import path from "node:path";
import { maxiAssetRoot } from "../asset-paths";
import { companyManifestSchema, companyCatalogSchema, type CompanyManifest, type CompanyCatalog } from "./manifest-schema";
import { rotateHue, darken, contrastRatio } from "../lib/colors";
import type { ResolvedTheme, V6Selection, ProductMode } from "../schemas";

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
  return path.join(maxiAssetRoot(), "knowledge", "companies");
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
 * preferred over the gallery `preview.png`.
 * V17: skips images where any dimension exceeds maxDimension (Anthropic
 * rejects images larger than 8000px in either axis).
 * V21: the smallest files are selected FIRST so per-call image context stays
 * bounded (a 1.4MB JPEG ≈ 350K input chars of base64 — the dominant token
 * cost of every prompt). If nothing fits the cap, the single smallest file
 * is used so every company keeps a style cue. Mechanical stages (planner/
 * builder/compose) no longer attach company imagery at all. */
export async function companyRefImageBlocks(
  slug: string,
  max = 2,
  maxBytes = 500_000,
  maxDimension = 7000,
): Promise<Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }>> {
  const out: Array<{ type: "image"; source: { type: "base64"; media_type: string; data: string } }> = [];
  try {
    const files = companyImageFiles(slug);
    const ordered = [...files.filter((f) => f !== "preview.png"), ...files.filter((f) => f === "preview.png")];
    // V21: smallest-first — bounded context per call.
    const sized = ordered
      .map((f) => ({ f, size: readCompanyImage(slug, f)?.byteLength ?? 0 }))
      .sort((a, b) => a.size - b.size);
    const pool = sized.filter((s) => s.size > 0 && s.size <= maxBytes);
    const chosen = (pool.length > 0 ? pool : sized.filter((s) => s.size > 0).slice(0, 1));
    for (const { f, size } of chosen.slice(0, max)) {
      const buf = readCompanyImage(slug, f);
      if (!buf || buf.byteLength <= 0) continue;
      if (buf.byteLength !== size) continue;
      const dims = imageDimensions(buf, f);
      if (dims && (dims.w > maxDimension || dims.h > maxDimension)) continue;
      const media_type = f.endsWith(".webp") ? "image/webp"
        : f.endsWith(".jpg") || f.endsWith(".jpeg") ? "image/jpeg"
        : "image/png";
      out.push({ type: "image", source: { type: "base64", media_type, data: buf.toString("base64") } });
    }
  } catch {
    /* reference imagery is optional */
  }
  return out;
}

/** Parse image width/height from JPEG or PNG bytes without external deps. */
function imageDimensions(buf: Buffer, filename: string): { w: number; h: number } | null {
  try {
    if (filename.endsWith(".png")) {
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
        const w = buf.readUInt32BE(16);
        const h = buf.readUInt32BE(20);
        return { w, h };
      }
    }
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xFF) return null;
        while (buf[i] === 0xFF) i++;
        const marker = buf[i];
        i++;
        if (marker === 0xD8) continue;
        if (marker === 0xD9) return null;
        if (marker === 0xDA) return null;
        if (i + 1 >= buf.length) return null;
        const len = buf.readUInt16BE(i);
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          if (i + 5 > buf.length) return null;
          const h = buf.readUInt16BE(i + 3);
          const w = buf.readUInt16BE(i + 5);
          return { w, h };
        }
        i += len;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/** The universal design law, compiled to a compact prompt block. */
export async function megadesignBlock(): Promise<string> {
  if (megadesignCache) return megadesignCache;
  const p = path.join(maxiAssetRoot(), "knowledge", "megadesign.md");
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
      imageUrl: previews.length > 0 ? `/api/maxi-agent/knowledge/${slug}/image/preview.png` : undefined,
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

/**
 * V24 — derive the company's VISUAL MOOD from its manifest instead of
 * injecting its literal brand tokens.
 *
 * v23 injected the company's exact `:root { --primary: <hex>; ... }` tokens
 * into every prompt, so a fitness app inspired by Nike was prompted to
 * reproduce Nike's literal colors (the v23 ISSUES #37 class: the sidebar
 * read as "generic white panel" precisely because the model was copying
 * token values without any mood). The mood block keeps everything the model
 * needs to adapt the company's LOOK — contrast level, accent frequency,
 * corner language, density, motion character, type voice — without ever
 * shipping a hex value. Literal brand/color reproduction is only legal when
 * the product IS that brand.
 */
export function visualMoodBlock(m: CompanyManifest): string {
  const t = m.light;
  const fgBg = contrastRatio(t.foreground, t.background);
  const mutedBg = contrastRatio(t.mutedForeground, t.background);
  const primaryBg = contrastRatio(t.primary, t.background);
  const contrast = fgBg >= 12 ? "very high" : fgBg >= 7 ? "high" : fgBg >= 4.5 ? "AA-balanced" : "soft";
  void mutedBg;
  void primaryBg;

  const corpus = `${m.description} ${m.tagline} ${m.voiceAndTone}`.toLowerCase();
  const accentFreq = /accent|bold color|vivid|energy|bright|electric|pop of color/i.test(corpus)
    ? "generous"
    : /monochrome|single accent|quiet/i.test(corpus)
      ? "minimal"
      : "moderate";

  const corner = m.radius.md <= 6 ? "sharp" : m.radius.md >= 16 ? "soft-pill" : "soft";
  const density = m.density ?? (m.sectionGap >= 48 ? "generous" : m.sectionGap <= 24 ? "dense" : "balanced");

  const moves = `${m.interactionMoves?.join(" ") ?? ""} ${m.signatureMoves.join(" ")}`.toLowerCase();
  const motion = /snap|instant|energetic|spring|fast|bold|swift|punch/i.test(moves)
    ? "energetic, decisive"
    : /calm|gentle|quiet|soft|meditative/i.test(moves)
      ? "calm, deliberate"
      : "restrained, functional";

  const displayMax = m.typeScale["4xl"];
  const typeVoice = `${displayMax >= 40 ? "statement-scale display" : "standard display"} (${m.fonts.display}) with ${m.fonts.body} body`;

  return [
    `## Visual mood (derived — adapt the MOOD, never copy the brand's literal colors)`,
    `- Contrast: ${contrast} (foreground/background ${fgBg.toFixed(1)}:1)`,
    `- Accent frequency: ${accentFreq}`,
    `- Corner language: ${corner}`,
    `- Density: ${density}`,
    `- Motion character: ${motion}`,
    `- Type voice: ${typeVoice}`,
  ].join("\n");
}

/**
 * V24 — strip literal hex values from authored company prose (rules,
 * signature moves, avoid patterns, descriptions). Some manifests embed
 * their brand hexes in prose; the prompt contract is: mood and words, never
 * literal brand color values.
 */
export function stripHexLiterals(text: string): string {
  return text
    .replace(/\(\s*#[0-9a-fA-F]{3,8}(?:\s*,\s*#[0-9a-fA-F]{3,8})*\s*\)/g, "")
    .replace(/#[0-9a-fA-F]{3,8}\b/g, "the brand color")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function compileCompanyBlock(slug: string): Promise<string> {
  const m = await loadCompany(slug);
  const lines: string[] = [
    `# ${m.name} — design language`,
    stripHexLiterals(m.description),
    "",
    "## Voice & tone",
    stripHexLiterals(m.voiceAndTone),
    "",
    visualMoodBlock(m),
    "",
    "## Composition rules",
    ...m.rules.map((r) => `- ${stripHexLiterals(r)}`),
    "",
    "## Signature moves",
    ...m.signatureMoves.map((s) => `- ${stripHexLiterals(s)}`),
    "",
    "## Avoid",
    ...m.avoidPatterns.map((a) => `- ${stripHexLiterals(a)}`),
    "",
    "## v16 visual adaptation",
    `Suitable product modes: ${(m.suitableModes ?? ["any"]).join(", ")}`,
    `Layout moves: ${stripHexLiterals((m.layoutMoves ?? []).join(", ")) || "Adapt hierarchy and rhythm to the product contract."}`,
    `Interaction moves: ${stripHexLiterals((m.interactionMoves ?? []).join(", ")) || "Use clear, accessible state changes."}`,
    `Media direction: ${stripHexLiterals(m.mediaDirection ?? "") || "Use media only when the product contract calls for it."}`,
    `Density: ${m.density ?? "balanced"}`,
  ];
  // V10/V24: when the company ships reference imagery, every agent knows it
  // exists (the visual review attaches the actual images). V24 rewording:
  // the imagery is reference for typography/spacing/motion patterns —
  // NEVER brand/color reproduction unless the product IS that brand.
  const images = companyImageFiles(slug);
  if (images.length > 0) {
    lines.push("", "## Reference imagery", `Shipped files: ${images.join(", ")} — use them as reference for typography, spacing, and motion patterns. Never reproduce the brand's literal colors or logo unless the product IS that brand.`);
  }
  return lines.join("\n");
}

// ── v16 visual knowledge selection ─────────────────────────────────────────

export interface DesignCapability {
  id: string;
  modes: ProductMode[];
  moves: string[];
  avoid: string[];
}

export interface CompanyReferencePack {
  manifest: CompanyManifest;
  block: string;
  images: string[];
  capabilityFit: number;
  rationale: string;
}

const DESIGN_CAPABILITIES: DesignCapability[] = [
  { id: "dashboard", modes: ["track", "operate", "create"], moves: ["hero-led", "metric-band", "progressive rows"], avoid: ["catalog grid", "booking controls"] },
  { id: "workspace", modes: ["create", "operate"], moves: ["tool-first layout", "recent work", "inspector detail"], avoid: ["photo gallery", "guest language"] },
  { id: "coaching", modes: ["track", "learn"], moves: ["today-first hero", "sequence rows", "quiet guidance"], avoid: ["ratings", "wishlist", "catalog shell"] },
  { id: "feed", modes: ["social"], moves: ["activity stream", "author context", "thread detail"], avoid: ["commerce filters", "booking card"] },
  { id: "catalog", modes: ["browse", "transact"], moves: ["discovery toolbar", "item comparison", "focused item detail"], avoid: ["dashboard metrics as lead"] },
  { id: "editorial", modes: ["browse", "learn", "social"], moves: ["featured first", "asymmetric rhythm", "long-form sections"], avoid: ["uniform six-card repetition"] },
  { id: "data-dense", modes: ["operate", "track"], moves: ["divided rows", "trend band", "compact controls"], avoid: ["decorative card stacks"] },
];

export function selectDesignCapabilities(mode: ProductMode, prompt: string): DesignCapability[] {
  const text = prompt.toLowerCase();
  const compatible = DESIGN_CAPABILITIES.filter((c) => c.modes.includes(mode));
  return compatible
    .map((capability) => ({ capability, score: capability.moves.reduce((n, move) => n + (text.includes(move.split("-")[0]) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.capability.id.localeCompare(b.capability.id))
    .slice(0, mode === "browse" || mode === "transact" ? 2 : 3)
    .map((item) => item.capability);
}

/** Selects visual references without allowing references to select page shape. */
export async function selectCompanyReferences(
  prompt: string,
  mode: ProductMode,
  preferred?: string,
): Promise<{ primary: CompanyReferencePack; secondary: CompanyReferencePack[]; capabilities: DesignCapability[] }> {
  const scores = await scoreCompanies(prompt);
  const ordered: CompanyScore[] = preferred && listCompanySlugs().includes(preferred)
    ? [{ slug: preferred, name: preferred, score: Number.MAX_SAFE_INTEGER, hits: ["user preference"] }, ...scores.filter((s) => s.slug !== preferred)]
    : scores;
  const capabilities = selectDesignCapabilities(mode, prompt);
  const primaryScore = ordered[0];
  if (!primaryScore) throw new Error("no registered company references available");
  const makePack = async (score: CompanyScore): Promise<CompanyReferencePack> => {
    const manifest = await loadCompany(score.slug);
    const block = await compileCompanyBlock(score.slug);
    const visualMoves = manifest.rules.concat(manifest.signatureMoves, manifest.layoutMoves ?? [], manifest.interactionMoves ?? []);
    const capabilityFit = capabilities.reduce((n, capability) => n + (visualMoves.some((rule) => capability.moves.some((move) => rule.toLowerCase().includes(move.split("-")[0]))) ? 1 : 0), 0);
    return { manifest, block, images: companyImageFiles(score.slug), capabilityFit, rationale: score.hits.join(", ") || "visual language match" };
  };
  const primary = await makePack(primaryScore);
  const secondary: CompanyReferencePack[] = [];
  for (const score of ordered.slice(1)) {
    if (secondary.length >= 2 || score.slug === primary.manifest.slug) break;
    const pack = await makePack(score);
    if (pack.capabilityFit > 0 || secondary.length === 0) secondary.push(pack);
  }
  return { primary, secondary, capabilities };
}

export function compileDesignKnowledge(primary: CompanyReferencePack, secondary: CompanyReferencePack[], capabilities: DesignCapability[]): string {
  return [
    "# V16 DESIGN KNOWLEDGE",
    "Company references control visual language. Product mode controls structure.",
    `Primary reference: ${primary.manifest.name} — ${primary.rationale}`,
    primary.block,
    secondary.length ? `Secondary references: ${secondary.map((p) => p.manifest.name).join(", ")}` : "No secondary references.",
    "## Product capabilities",
    ...capabilities.map((c) => `- ${c.id}: moves=${c.moves.join(", ")}; avoid=${c.avoid.join(", ")}`),
    "## Structural rule",
    "Do not copy a reference company's page archetype. Adapt its visual language to the product contract.",
  ].join("\n\n");
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

    "--control-sm": "32px",
    "--control-md": "40px",
    "--control-lg": "48px",
    "--control-pad-x": "16px",

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

    // V22: minimal elevation tokens — RESERVED for floating/overlay elements
    // (dropdowns, popovers, modals) and the one dominant surface per screen.
    // Static content panels keep the no-shadow rule.
    "--shadow-sm": "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10)",
    "--shadow-md": "0 4px 6px rgba(16, 24, 40, 0.04), 0 10px 20px rgba(16, 24, 40, 0.10)",
  };

  const fontFamilies = [...new Set([manifest.fonts.display, manifest.fonts.body, manifest.fonts.mono].filter(Boolean))] as string[];

  return { manifest, tokens, mode: selection.mode, selection, cssVars, fontFamilies, colors };
}

export { contrastRatio };

// ── V14: theme from the design agent's tokens ────────────────────────────
//
// V14: the design agent produces an explicit per-run design system
// (`DesignTokens`) BEFORE the brief — brand colors, radius scale, type scale,
// control sizing, section rhythm, and fonts. No company manifest is copied
// wholesale into the theme anymore; the top-scored company manifest is only a
// HINT carried along for voice/review context (e.g. `theme.manifest.voiceAndTone`).

export function themeFromDesignTokens(
  tokens: import("../schemas").DesignTokens,
  hintManifest: CompanyManifest,
): ResolvedTheme {
  const c = tokens.colors;
  const colors = {
    primary: c.primary,
    primaryHover: darken(c.primary, 0.08),
    accent: c.accent,
    accentHover: darken(c.accent, 0.08),
    destructive: c.destructive,
    destructiveHover: darken(c.destructive, 0.08),
    success: c.success,
    warning: c.warning,
    chart: c.chart,
  };

  const cssVars: Record<string, string> = {
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.card,
    "--card-foreground": c.cardForeground,
    "--popover": c.popover,
    "--popover-foreground": c.popoverForeground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--primary-hover": colors.primaryHover,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--accent-hover": colors.accentHover,
    "--destructive": c.destructive,
    "--destructive-foreground": c.destructiveForeground,
    "--destructive-hover": colors.destructiveHover,
    "--success": c.success,
    "--success-subtle": c.successSubtle,
    "--warning": c.warning,
    "--warning-subtle": c.warningSubtle,
    "--border": c.border,
    "--input": c.input,
    "--ring": c.ring,

    "--radius": `${tokens.radius.md}px`,
    "--radius-sm": `${tokens.radius.sm}px`,
    "--radius-md": `${tokens.radius.md}px`,
    "--radius-lg": `${tokens.radius.lg}px`,
    "--radius-xl": `${tokens.radius.xl}px`,
    "--radius-full": `${tokens.radius.full}px`,

    "--control-sm": `${tokens.control.sm}px`,
    "--control-md": `${tokens.control.md}px`,
    "--control-lg": `${tokens.control.lg}px`,
    "--control-pad-x": "16px",

    "--font-display": `"${tokens.fonts.display}"`,
    "--font-body": `"${tokens.fonts.body}"`,
    ...(tokens.fonts.mono ? { "--font-mono": `"${tokens.fonts.mono}"` } : {}),

    "--text-xs": `${tokens.typeScale.xs}px`,
    "--text-sm": `${tokens.typeScale.sm}px`,
    "--text-base": `${tokens.typeScale.base}px`,
    "--text-lg": `${tokens.typeScale.lg}px`,
    "--text-xl": `${tokens.typeScale.xl}px`,
    "--text-2xl": `${tokens.typeScale["2xl"]}px`,
    "--text-3xl": `${tokens.typeScale["3xl"]}px`,
    "--text-4xl": `${tokens.typeScale["4xl"]}px`,

    "--section-padding-y": `${tokens.sectionPaddingY}px`,
    "--section-gap": `${tokens.sectionGap}px`,
    "--content-max": "1280px",

    // V22: minimal elevation tokens — floating/overlay + one dominant surface
    // per screen only. Static panels stay shadow-free.
    "--shadow-sm": "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10)",
    "--shadow-md": "0 4px 6px rgba(16, 24, 40, 0.04), 0 10px 20px rgba(16, 24, 40, 0.10)",
  };

  const fontFamilies = [...new Set([tokens.fonts.display, tokens.fonts.body, tokens.fonts.mono].filter(Boolean))] as string[];

  const themeTokens: ResolvedTheme["tokens"] = {
    background: c.background,
    foreground: c.foreground,
    card: c.card,
    cardForeground: c.cardForeground,
    popover: c.popover,
    popoverForeground: c.popoverForeground,
    primary: c.primary,
    primaryForeground: c.primaryForeground,
    secondary: c.secondary,
    secondaryForeground: c.secondaryForeground,
    muted: c.muted,
    mutedForeground: c.mutedForeground,
    accent: c.accent,
    accentForeground: c.accentForeground,
    destructive: c.destructive,
    destructiveForeground: c.destructiveForeground,
    success: c.success,
    successSubtle: c.successSubtle,
    warning: c.warning,
    warningSubtle: c.warningSubtle,
    border: c.border,
    input: c.input,
    ring: c.ring,
    chart: c.chart,
  };

  return {
    manifest: hintManifest,
    tokens: themeTokens,
    mode: tokens.mode,
    selection: { mode: tokens.mode, hue: hintManifest.hueBase },
    cssVars,
    fontFamilies,
    colors,
  };
}

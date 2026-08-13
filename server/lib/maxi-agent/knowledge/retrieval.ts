import fs from "node:fs";
import path from "node:path";
import type { ProductMode } from "../schemas";

/**
 * Maxi Agent v23 — knowledge-base retrieval index.
 *
 * A run's prompts receive ONLY the slice relevant to the selected company
 * and the classified product mode — not the entire knowledge base pasted in.
 * This is a real cost and latency lever: the company design.md + the laws
 * are large (8.4KB of laws alone), and most of it is irrelevant to any one
 * stage.
 *
 * The index is built deterministically at first use (no embeddings, no
 * external service — it is a section-title + keyword index over the markdown
 * docs) and cached. Retrieval returns:
 *   - the selected company's design.md (full — it is the design language)
 *   - the design-law + component-law slices relevant to the product mode
 *   - megadesign.md for judgment stages
 *
 * Each stage reports the byte-size of its slice so the orchestrator can log
 * the prompt-token lever per run (docs/timing/CallCounts.json).
 */

// ── Mode → law slices ─────────────────────────────────────────────────────
//
// Which design laws matter for which product mode. The slice is the full law
// file — the granularity is the FILE, not a section: every law doc is
// already mode-agnostic guidance, and pulling the full file keeps the
// retrieval deterministic (no fuzzy section matching at prompt time).

export const MODE_LAW_SLICES: Record<ProductMode, string[]> = {
  browse: ["color-strategy", "typography", "layout-grids", "spacing-rhythm", "surface-treatments"],
  transact: ["color-strategy", "typography", "layout-grids", "spacing-rhythm", "surface-treatments", "anti-slop"],
  track: ["spacing-rhythm", "layout-grids", "color-strategy", "surface-treatments", "anti-slop"],
  create: ["surface-treatments", "spacing-rhythm", "layout-grids", "context-switching", "anti-slop"],
  operate: ["layout-grids", "spacing-rhythm", "surface-treatments", "component-patterns", "anti-slop"],
  learn: ["color-strategy", "spacing-rhythm", "typography", "context-switching"],
  social: ["color-strategy", "typography", "surface-treatments", "component-patterns", "context-switching"],
};

/** Component-law slices relevant per mode (forms/interaction/surfaces…). */
export const MODE_COMPONENT_LAW: Record<ProductMode, string[]> = {
  browse: ["surfaces", "interaction", "data-display"],
  transact: ["surfaces", "interaction", "data-display", "feedback"],
  track: ["data-display", "interaction", "feedback"],
  create: ["interaction", "navigation", "forms"],
  operate: ["data-display", "forms", "interaction", "navigation"],
  learn: ["interaction", "feedback", "navigation"],
  social: ["interaction", "feedback", "data-display", "navigation"],
};

function knowledgeRoot(): string {
  return path.join(process.cwd(), "server", "lib", "maxi-agent", "knowledge");
}

function companyRoot(): string {
  return path.join(knowledgeRoot(), "companies");
}

// ── Index ─────────────────────────────────────────────────────────────────

export interface KnowledgeIndex {
  companies: string[];
  /** design.md byte sizes per company (for slice accounting). */
  companySizes: Record<string, number>;
  lawSizes: Record<string, number>;
  componentLawSizes: Record<string, number>;
}

let indexCache: KnowledgeIndex | null = null;

function fileSize(p: string): number {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

/** Build (and cache) the deterministic retrieval index. */
export function buildKnowledgeIndex(): KnowledgeIndex {
  if (indexCache) return indexCache;
  const companies = fs.existsSync(companyRoot())
    ? fs.readdirSync(companyRoot()).filter((d) => {
        try {
          return fs.statSync(path.join(companyRoot(), d)).isDirectory();
        } catch {
          return false;
        }
      }).sort()
    : [];
  const lawDir = path.join(knowledgeRoot(), "design-laws");
  const componentLawDir = path.join(knowledgeRoot(), "component-law");
  const lawSizes: Record<string, number> = {};
  for (const f of fs.existsSync(lawDir) ? fs.readdirSync(lawDir) : []) {
    if (f.endsWith(".md")) lawSizes[f.replace(/\.md$/, "")] = fileSize(path.join(lawDir, f));
  }
  const componentLawSizes: Record<string, number> = {};
  for (const f of fs.existsSync(componentLawDir) ? fs.readdirSync(componentLawDir) : []) {
    if (f.endsWith(".md")) componentLawSizes[f.replace(/\.md$/, "")] = fileSize(path.join(componentLawDir, f));
  }
  const companySizes: Record<string, number> = {};
  for (const slug of companies) {
    companySizes[slug] = fileSize(path.join(companyRoot(), slug, "design.md"));
  }
  indexCache = { companies, companySizes, lawSizes, componentLawSizes };
  return indexCache;
}

/** Test seam: drop the cached index (after docs change). */
export function resetKnowledgeIndex(): void {
  indexCache = null;
}

export interface KnowledgeSlice {
  /** The selected company's full design.md (the design language). */
  companyDoc: string;
  /** Design-law file contents relevant to the mode. */
  designLaws: Array<{ name: string; content: string }>;
  /** Component-law file contents relevant to the mode. */
  componentLaws: Array<{ name: string; content: string }>;
  /** Total byte size of the slice (the prompt-token lever). */
  chars: number;
  files: string[];
}

function readDesignDoc(slug: string): string {
  const p = path.join(companyRoot(), slug, "design.md");
  try {
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  } catch {
    return "";
  }
}

function readMarkdown(dir: string, name: string): string {
  try {
    return fs.readFileSync(path.join(dir, `${name}.md`), "utf8");
  } catch {
    return "";
  }
}

/**
 * Retrieve the knowledge slice for one run: the selected company's design
 * language + the laws relevant to the classified mode.
 *
 * V23: law files are long-form (26-43KB each); pasting them whole made the
 * "slice" the entire knowledge base (~67K tokens). Each law is truncated to
 * `maxLawCharsPerFile` — the core rules are front-loaded, so the head of the
 * file carries the binding contract and the tail is guidance detail.
 */
export async function retrieveKnowledge(opts: {
  company: string;
  mode?: ProductMode | string | null;
  /** Per-law file cap in chars (default 3500 ≈ 900 tokens per law). */
  maxLawCharsPerFile?: number;
}): Promise<KnowledgeSlice> {
  const index = buildKnowledgeIndex();
  const mode: ProductMode = (["browse", "track", "create", "operate", "learn", "social", "transact"] as const)
    .find((m) => m === opts.mode) ?? "track";
  const lawNames = MODE_LAW_SLICES[mode] ?? MODE_LAW_SLICES.track;
  const componentLawNames = MODE_COMPONENT_LAW[mode] ?? MODE_COMPONENT_LAW.track;
  const cap = opts.maxLawCharsPerFile ?? 3_500;

  const lawDir = path.join(knowledgeRoot(), "design-laws");
  const componentLawDir = path.join(knowledgeRoot(), "component-law");
  const TRUNC_MARKER = "\n\n…(law truncated — the tail is guidance detail, the rules above are binding)";
  const sliceLaw = (content: string): string =>
    content.length > cap ? `${content.slice(0, Math.max(0, cap - TRUNC_MARKER.length))}${TRUNC_MARKER}` : content;
  const designLaws = lawNames
    .filter((n) => index.lawSizes[n] !== undefined)
    .map((n) => ({ name: n, content: sliceLaw(readMarkdown(lawDir, n)) }))
    .filter((l) => l.content.length > 0);
  const componentLaws = componentLawNames
    .filter((n) => index.componentLawSizes[n] !== undefined)
    .map((n) => ({ name: n, content: sliceLaw(readMarkdown(componentLawDir, n)) }))
    .filter((l) => l.content.length > 0);

  const companyDoc = readDesignDoc(opts.company);

  const files = [`companies/${opts.company}/design.md`, ...designLaws.map((l) => `design-laws/${l.name}.md`), ...componentLaws.map((l) => `component-law/${l.name}.md`)];
  const chars = companyDoc.length + designLaws.reduce((n, l) => n + l.content.length, 0) + componentLaws.reduce((n, l) => n + l.content.length, 0);
  return { companyDoc, designLaws, componentLaws, chars, files };
}

/** Compact prompt block — the slice rendered for mechanical stages. */
export function knowledgeBlock(slice: KnowledgeSlice): string {
  const parts: string[] = [];
  if (slice.companyDoc) parts.push(`# Company design language\n${slice.companyDoc}`);
  if (slice.designLaws.length > 0) {
    parts.push(`# Design law (${slice.designLaws.length} relevant slice(s) for this product mode)`);
    for (const l of slice.designLaws) parts.push(`## ${l.name}\n${l.content}`);
  }
  if (slice.componentLaws.length > 0) {
    parts.push(`# Component law (${slice.componentLaws.length} relevant slice(s) for this product mode)`);
    for (const l of slice.componentLaws) parts.push(`## ${l.name}\n${l.content}`);
  }
  return parts.join("\n\n");
}

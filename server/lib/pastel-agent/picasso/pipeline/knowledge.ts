import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, "../knowledge-base");

// ─── Caches ────────────────────────────────────────────────────────────────

let megadesignCache: string | null = null;
const companyCache = new Map<string, string>();
const designLawCache = new Map<string, string>();
const componentLawCache = new Map<string, string>();
const productModeCache = new Map<string, string>();
const deepCompanyCache = new Map<string, { brandBook: string; designSystem: string; caseStudies: string; doDont: string }>();

// ─── Path Utilities ────────────────────────────────────────────────────────

export function knowledgeBaseDir(): string {
  return KNOWLEDGE_BASE_DIR;
}

// ─── Megadesign (Core Constitution) ────────────────────────────────────────

export function loadMegadesign(): string {
  if (megadesignCache) return megadesignCache;
  const p = path.join(KNOWLEDGE_BASE_DIR, "megadesign.md");
  if (!fs.existsSync(p)) throw new Error(`megadesign.md not found at ${p}`);
  megadesignCache = fs.readFileSync(p, "utf8");
  return megadesignCache;
}

// ─── Company Docs (Flat .md files — existing V1 format) ────────────────────

export function loadCompanyDoc(slug: string): string {
  const cached = companyCache.get(slug);
  if (cached) return cached;
  const p = path.join(KNOWLEDGE_BASE_DIR, "companies", `${slug}.md`);
  if (!fs.existsSync(p)) throw new Error(`Company file not found: ${slug}.md`);
  const content = fs.readFileSync(p, "utf8");
  companyCache.set(slug, content);
  return content;
}

export function listCompanySlugs(): string[] {
  const dir = path.join(KNOWLEDGE_BASE_DIR, "companies");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}

export interface CompanyWithTagline {
  slug: string;
  tagline: string;
}

const TAGLINES: Record<string, string> = {
  vercel: "Dark-mode-first, near-monochrome with sharp accent — developer tools and infrastructure",
  nike: "Bold kinetic blocking, huge type, high contrast — fitness and lifestyle brands",
  apple: "Restraint and materiality; the product is always the hero",
  stripe: "Technical elegance, docs-as-product feel with indigo accent",
  linear: "Keyboard-first minimalism, dense but calm — productivity tools",
  airbnb: "Warm and approachable, coral accent, human photography",
  duolingo: "Playful and high-energy, saturated palette — education and gamification",
  notion: "Calm and neutral, content-first with minimal chrome",
  spotify: "Bold black canvas with vivid green accent — media and editorial",
  headspace: "Soft and calm, pastel palette, organic shapes — wellness",
  mercury: "Fintech trust, precise data-typography, restrained accent",
  figma: "Playful precision, controlled color, geometric icons — creative tools",
  arc: "Expressive gradients as brand signature, soft rounding — modern browsing",
  slack: "Friendly and professional, approachable — team communication",
  mailchimp: "Quirky and illustrative, warm yellow/black — marketing and email",
  shopify: "Confident commerce, green/black, product-first — e-commerce",
  superhuman: "Fast and premium, near-monochrome — email and productivity",
  framer: "Design-tool-cool, gradient accents, motion-forward — websites and prototyping",
  webflow: "Builder clarity, structured and technical but approachable — no-code tools",
  discord: "Gaming-first, dark mode default, saturated blurple accent — community and chat",
  github: "Developer home, dark mode, subtle green accent — code hosting and collaboration",
  uber: "Bold black and white, confident, motion-forward — mobility and delivery",
};

export function getCompanyTagline(slug: string): string {
  return TAGLINES[slug] ?? slug;
}

export function getCompanyWithTaglines(slugs: string[]): CompanyWithTagline[] {
  return slugs.map((slug) => ({ slug, tagline: getCompanyTagline(slug) }));
}

// ─── Company Deep Dives (V2 expanded format) ───────────────────────────────

export interface CompanyDeepDive {
  slug: string;
  brandBook: string;
  designSystem: string;
  caseStudies: string;
  doDont: string;
}

export function loadCompanyDeepDive(slug: string): CompanyDeepDive {
  const cached = deepCompanyCache.get(slug);
  if (cached) return { slug, ...cached };

  const deepDir = path.join(KNOWLEDGE_BASE_DIR, "companies", slug, "deep");
  if (!fs.existsSync(deepDir)) {
    throw new Error(`Deep dive directory not found for company: ${slug}`);
  }

  const brandBookPath = path.join(deepDir, "brand-book.md");
  const designSystemPath = path.join(deepDir, "design-system.md");
  const caseStudiesPath = path.join(deepDir, "case-studies.md");
  const doDontPath = path.join(deepDir, "do-dont.md");

  const brandBook = fs.existsSync(brandBookPath) ? fs.readFileSync(brandBookPath, "utf8") : "";
  const designSystem = fs.existsSync(designSystemPath) ? fs.readFileSync(designSystemPath, "utf8") : "";
  const caseStudies = fs.existsSync(caseStudiesPath) ? fs.readFileSync(caseStudiesPath, "utf8") : "";
  const doDont = fs.existsSync(doDontPath) ? fs.readFileSync(doDontPath, "utf8") : "";

  const dive = { brandBook, designSystem, caseStudies, doDont };
  deepCompanyCache.set(slug, dive);

  return { slug, ...dive };
}

export function hasCompanyDeepDive(slug: string): boolean {
  const deepDir = path.join(KNOWLEDGE_BASE_DIR, "companies", slug, "deep");
  return fs.existsSync(deepDir);
}

export function listCompanyDeepDiveSlugs(): string[] {
  const companiesDir = path.join(KNOWLEDGE_BASE_DIR, "companies");
  if (!fs.existsSync(companiesDir)) return [];

  return fs.readdirSync(companiesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => {
      const deepDir = path.join(companiesDir, name, "deep");
      return fs.existsSync(deepDir);
    });
}

export function loadFullCompanyContext(slug: string): string {
  const parts: string[] = [];

  // Load flat company doc
  try {
    parts.push(loadCompanyDoc(slug));
  } catch {
    // Skip if no flat doc exists
  }

  // Load deep dive if available
  try {
    const dive = loadCompanyDeepDive(slug);
    if (dive.brandBook) parts.push(`\n## Brand Book\n\n${dive.brandBook}`);
    if (dive.designSystem) parts.push(`\n## Design System\n\n${dive.designSystem}`);
    if (dive.caseStudies) parts.push(`\n## Case Studies\n\n${dive.caseStudies}`);
    if (dive.doDont) parts.push(`\n## Do's and Don'ts\n\n${dive.doDont}`);
  } catch {
    // Skip if no deep dive
  }

  return parts.join("\n");
}

// ─── Design Laws (V2 knowledge base) ───────────────────────────────────────

export function loadDesignLaw(name: string): string {
  const cached = designLawCache.get(name);
  if (cached) return cached;

  const p = path.join(KNOWLEDGE_BASE_DIR, "design-laws", `${name}.md`);
  if (!fs.existsSync(p)) throw new Error(`Design law file not found: ${name}.md`);
  const content = fs.readFileSync(p, "utf8");
  designLawCache.set(name, content);
  return content;
}

export function listDesignLaws(): string[] {
  const dir = path.join(KNOWLEDGE_BASE_DIR, "design-laws");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}

export function loadAllDesignLaws(): string {
  const names = listDesignLaws();
  return names.map((name) => loadDesignLaw(name)).join("\n\n---\n\n");
}

// ─── Component Law (V2 knowledge base) ─────────────────────────────────────

export function loadComponentLaw(name: string): string {
  const cached = componentLawCache.get(name);
  if (cached) return cached;

  const p = path.join(KNOWLEDGE_BASE_DIR, "component-law", `${name}.md`);
  if (!fs.existsSync(p)) throw new Error(`Component law file not found: ${name}.md`);
  const content = fs.readFileSync(p, "utf8");
  componentLawCache.set(name, content);
  return content;
}

export function listComponentLaws(): string[] {
  const dir = path.join(KNOWLEDGE_BASE_DIR, "component-law");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}

export function loadAllComponentLaws(): string {
  const names = listComponentLaws();
  return names.map((name) => loadComponentLaw(name)).join("\n\n---\n\n");
}

// ─── Product Modes (V2 knowledge base) ─────────────────────────────────────

export function loadProductMode(name: string): string {
  const cached = productModeCache.get(name);
  if (cached) return cached;

  const p = path.join(KNOWLEDGE_BASE_DIR, "product-modes", `${name}.md`);
  if (!fs.existsSync(p)) throw new Error(`Product mode file not found: ${name}.md`);
  const content = fs.readFileSync(p, "utf8");
  productModeCache.set(name, content);
  return content;
}

export function listProductModes(): string[] {
  const dir = path.join(KNOWLEDGE_BASE_DIR, "product-modes");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}

export function loadAllProductModes(): string {
  const names = listProductModes();
  return names.map((name) => loadProductMode(name)).join("\n\n---\n\n");
}

// ─── Aggregate Knowledge Loading ───────────────────────────────────────────

export interface PicassoKnowledge {
  megadesign: string;
  designLaws: string;
  componentLaws: string;
  productModes: string;
  companyDocs: Record<string, string>;
  companyDeepDives: Record<string, CompanyDeepDive>;
  totalBytes: number;
}

export function loadAllKnowledge(companySlugs?: string[]): PicassoKnowledge {
  const megadesign = loadMegadesign();
  const designLaws = loadAllDesignLaws();
  const componentLaws = loadAllComponentLaws();
  const productModes = loadAllProductModes();

  const slugs = companySlugs ?? listCompanySlugs();
  const companyDocs: Record<string, string> = {};
  const companyDeepDives: Record<string, CompanyDeepDive> = {};

  for (const slug of slugs) {
    try {
      companyDocs[slug] = loadCompanyDoc(slug);
    } catch {
      // Skip missing docs
    }
    try {
      companyDeepDives[slug] = loadCompanyDeepDive(slug);
    } catch {
      // Skip missing deep dives
    }
  }

  const allContent = [
    megadesign,
    designLaws,
    componentLaws,
    productModes,
    ...Object.values(companyDocs),
    ...Object.values(companyDeepDives).flatMap((d) => [d.brandBook, d.designSystem, d.caseStudies, d.doDont]),
  ];

  return {
    megadesign,
    designLaws,
    componentLaws,
    productModes,
    companyDocs,
    companyDeepDives,
    totalBytes: allContent.reduce((sum, s) => sum + Buffer.byteLength(s, "utf8"), 0),
  };
}

export function getKnowledgeStats(): {
  megadesignBytes: number;
  designLawsCount: number;
  designLawsBytes: number;
  componentLawsCount: number;
  componentLawsBytes: number;
  productModesCount: number;
  productModesBytes: number;
  companyDocsCount: number;
  companyDocsBytes: number;
  companyDeepDivesCount: number;
  companyDeepDivesBytes: number;
  totalBytes: number;
} {
  const megadesign = loadMegadesign();
  const designLawNames = listDesignLaws();
  const componentLawNames = listComponentLaws();
  const productModeNames = listProductModes();
  const companySlugs = listCompanySlugs();
  const deepDiveSlugs = listCompanyDeepDiveSlugs();

  const designLawsBytes = designLawNames.reduce((sum, n) => sum + Buffer.byteLength(loadDesignLaw(n), "utf8"), 0);
  const componentLawsBytes = componentLawNames.reduce((sum, n) => sum + Buffer.byteLength(loadComponentLaw(n), "utf8"), 0);
  const productModesBytes = productModeNames.reduce((sum, n) => sum + Buffer.byteLength(loadProductMode(n), "utf8"), 0);

  let companyDocsBytes = 0;
  for (const slug of companySlugs) {
    try { companyDocsBytes += Buffer.byteLength(loadCompanyDoc(slug), "utf8"); } catch {}
  }

  let deepDivesBytes = 0;
  for (const slug of deepDiveSlugs) {
    try {
      const dive = loadCompanyDeepDive(slug);
      deepDivesBytes += Buffer.byteLength(dive.brandBook + dive.designSystem + dive.caseStudies + dive.doDont, "utf8");
    } catch {}
  }

  return {
    megadesignBytes: Buffer.byteLength(megadesign, "utf8"),
    designLawsCount: designLawNames.length,
    designLawsBytes,
    componentLawsCount: componentLawNames.length,
    componentLawsBytes,
    productModesCount: productModeNames.length,
    productModesBytes,
    companyDocsCount: companySlugs.length,
    companyDocsBytes,
    companyDeepDivesCount: deepDiveSlugs.length,
    companyDeepDivesBytes: deepDivesBytes,
    totalBytes: Buffer.byteLength(megadesign, "utf8") + designLawsBytes + componentLawsBytes + productModesBytes + companyDocsBytes + deepDivesBytes,
  };
}

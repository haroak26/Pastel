import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, "../knowledge-base");

let megadesignCache: string | null = null;
const companyCache = new Map<string, string>();

export function knowledgeBaseDir(): string {
  return KNOWLEDGE_BASE_DIR;
}

export function loadMegadesign(): string {
  if (megadesignCache) return megadesignCache;
  const p = path.join(KNOWLEDGE_BASE_DIR, "megadesign.md");
  if (!fs.existsSync(p)) throw new Error(`megadesign.md not found at ${p}`);
  megadesignCache = fs.readFileSync(p, "utf8");
  return megadesignCache;
}

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
};

export function getCompanyTagline(slug: string): string {
  return TAGLINES[slug] ?? slug;
}

export function getCompanyWithTaglines(slugs: string[]): CompanyWithTagline[] {
  return slugs.map((slug) => ({ slug, tagline: getCompanyTagline(slug) }));
}

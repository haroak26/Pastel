import type { Brief, CompanyRef } from "./types";
import { NICHE_COMPANY_MAP } from "./types";
import { listCompanySlugs, getCompanyWithTaglines, loadCompanyDeepDive, hasCompanyDeepDive } from "./knowledge";
import { detectProductContext, type ProductContext } from "./anti-slop";
import { chatJSON, MAX_TOKENS_PER_CALL, type ChatMessage } from "../../gateway";
import { z } from "zod";

export interface DiscoveryInput {
  brief: Brief;
}

export interface DiscoveryOutput {
  productContext: ProductContext;
  contextDescription: string;
  selectedReferences: CompanyRef[];
  creativeSeed: string;
}

// V7: prose fields carry deterministic defaults so a dropped trailing field
// can never abort the whole pipeline. productContext/selectedReferences stay
// required — they drive downstream structure.
const discoverySchema = z.object({
  productContext: z.enum(["app", "landing", "docs", "social", "unknown"]),
  contextDescription: z.string().max(400).default("The product's dominant moment is its primary workflow, surfaced immediately on entry."),
  selectedReferences: z.array(z.string()).max(2).default([]),
  creativeSeed: z.string().max(80).default("a fresh, product-specific creative angle"),
});

const DISCOVERY_SYSTEM = `You are the discovery lead of a product-design studio. You read a one-paragraph brief and return the product's true shape and a creative seed.

Rules:
1. productContext — the single best fit:
   - "app" — a product the user operates repeatedly (dashboard, workspace, inbox, tracker, player)
   - "landing" — a marketing site whose job is to persuade and convert
   - "docs" — reference/documentation material
   - "social" — feed-first, people and conversations are the product
   - "unknown" — genuinely ambiguous
2. contextDescription — 1-2 sentences on what the user actually does, what the dominant moment of the UI should be (the thing a user sees first), and what makes it feel like THIS product.
3. selectedReferences — pick 0-2 slugs from the provided list whose design craft is worth referencing (visual craft, not copying). Prefer companies that fit the product's personality.
4. creativeSeed — a short, memorable phrase (5-8 words) that captures the unique creative angle of this product. It will be injected into every generation so this UI is unlike any other. Make it specific: a metaphor, a texture, a tone ("railroad timetable precision", "midnight arcade glow", "library card quiet"). Never generic words like "modern", "clean", "bold", "minimal".`;

export async function runDiscovery(input: DiscoveryInput): Promise<DiscoveryOutput> {
  const { brief } = input;

  // Deterministic context pre-filter (cheap, no model call)
  const deterministic = detectProductContext(brief.description);
  const allSlugs = listCompanySlugs();

  // Candidate pool: brief refs first, then niche map, filtered to existing docs.
  const candidates: string[] = [];
  const pushUnique = (s: string) => { if (allSlugs.includes(s) && !candidates.includes(s)) candidates.push(s); };
  for (const ref of brief.companyRefs ?? []) pushUnique(ref.toLowerCase());
  for (const slug of NICHE_COMPANY_MAP[brief.niche]) pushUnique(slug);
  for (const slug of ["stripe", "linear", "airbnb", "duolingo", "notion", "vercel", "figma", "spotify", "mercury", "headspace"]) pushUnique(slug);

  const messages: ChatMessage[] = [
    { role: "system", content: DISCOVERY_SYSTEM },
    {
      role: "user",
      content: [
        `Product: ${brief.productName}`,
        `Brief: ${brief.description}`,
        `Audience: ${brief.audience}`,
        `Niche: ${brief.niche}`,
        `Personality: ${brief.personality.join(", ")}`,
        `Platform: ${brief.platform}`,
        "",
        `Available reference slugs: ${candidates.join(", ")}`,
        "",
        "Return JSON: { productContext, contextDescription, selectedReferences (slugs from the list, max 2), creativeSeed }",
      ].join("\n"),
    },
  ];

  const result = await chatJSON<z.infer<typeof discoverySchema>>(messages, {
    model: "discovery",
    maxTokens: MAX_TOKENS_PER_CALL.discovery,
    validate: (v) => discoverySchema.parse(v),
  });

  const references = result.selectedReferences
    .map((slug) => {
      const taglines = getCompanyWithTaglines([slug]);
      const t = taglines[0];
      return t ? { slug: t.slug, name: t.slug, tagline: t.tagline } : null;
    })
    .filter((r): r is CompanyRef => r !== null)
    .slice(0, 2);

  return {
    productContext: (result.productContext as ProductContext) ?? deterministic,
    contextDescription: result.contextDescription,
    selectedReferences: references,
    creativeSeed: result.creativeSeed,
  };
}

export { hasCompanyDeepDive, loadCompanyDeepDive };

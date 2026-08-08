import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { productBriefSchema, type ProductBrief } from "../schemas";
import { loadCompany, scoreCompanies, compileCompanyBlock, megadesignBlock, listCatalog, type CompanyScore } from "../knowledge/index";
import { normalizeTwoScreens, classifyMode } from "../lib/ux-design";
import type { VisualReference } from "../types";

/**
 * V14 Brief agent — writes the product brief AND selects the reference
 * companies from the FULL available catalog.
 *
 * The brief no longer inherits a company from a
 * hardcoded default (`?? "apple"`) or from the user's gallery pick alone.
 * The model sees EVERY registered company (slug + name + description + tags)
 * and chooses primary + secondary references with a rationale. The user's
 * gallery pick is a strong prior, never a requirement. The deterministic
 * fallback is the top-scored company via `scoreCompanies` — never a literal.
 *
 * Screen purposes are product-led: "home" is the product's primary workflow
 * (dashboard, feed, workspace, coaching, or catalog — per the product) and
 * "detail" is its focused secondary workflow. Browse/catalog/marketplace
 * language is NOT the default shape of every product.
 */

export interface BriefInput {
  prompt: string;
  answers: Record<string, string>;
  visualReference?: VisualReference;
  onUsage?: OnUsage;
}

export interface BriefOutput {
  brief: ProductBrief;
  /** Company slugs whose design.md should be attached as run docs. */
  attachedCompanies: string[];
  usedFallback: string[];
  /** Companies the model had to choose from (all registered). */
  availableSlugs: string[];
}

export function inspirationFromAnswers(answers: Record<string, string>): {
  primary: string | null;
  secondary: string[];
} {
  const primary = answers["inspiration"]?.trim().toLowerCase() || null;
  const secondaryRaw = answers["inspirationSecondary"]?.trim() || "";
  const secondary = secondaryRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return { primary, secondary };
}

const SYSTEM = `You are the Pastel product brief writer. You turn a user's idea (plus clarification answers) into a precise, buildable product brief, and you choose which registered reference companies this product should study.

REFERENCE COMPANY SELECTION (V14):
- Choose from the AVAILABLE COMPANIES list only — primary must be one of those slugs.
- Match the product's domain, audience, and vibe to the companies' descriptions and tags. A travel marketplace should not be told to look like a developer tool.
- If the user already picked an inspiration (in CLARIFICATION ANSWERS), treat it as the primary choice unless the product clearly contradicts it — then you may override with a better match and say why in rationale.
- secondary: 0-2 additional companies whose design language adds useful contrast.
- The reference companies are STYLE references — the brief's designLanguage, copyDirection, and screen purposes must serve THIS product, not the references' niches.

RULES:
- Be specific and concrete. No AI-slop language.
- The chosen references' design language (rules, signature moves, voice) must shape the brief's designLanguage and copyDirection.
- MODE (V15 — the single most important layout decision): classify the product's PRIMARY job from its actual language and write it as "mode". This decides the layout shape — never classify from a domain pack:
  - "browse" — users discover/compare items (template catalogs, marketplaces, media libraries, shops). Home = search + grid; detail = item facts.
  - "transact" — users book or buy one item (vacation rentals, hotels, checkout flows). The ONLY mode where a price/dates/guests booking card is legal.
  - "track" — users log and monitor themselves (fitness, habits, health, personal records). Home = scoreboard/dashboard; detail = one record with the start/continue action.
  - "create" — users build something (AI agents, documents, designs, code). Home = workspace + recent work; detail = inspect/configure one thing.
  - "operate" — users run a team/project/ops (projects, tasks, email, admin). Home = toolbar + table/stats; detail = one record's facts.
  - "learn" — users follow a curriculum or coaching (courses, trainer, lessons). Home = sequence/curriculum; detail = one lesson with a continue action.
  - "social" — users share and discuss (community, feed, forum). Home = feed; detail = one thread/post.
- EXACTLY TWO screens — the two main screens of the product:
  1. "home" — the product's primary workflow screen. This may be a dashboard, workspace, feed, catalog, or coaching surface. Do not turn every product into a browse/search page; search and product grids are OPTIONAL, only for products that genuinely browse.
  2. "detail" — the product's focused secondary workflow for one item, task, exercise, record, or content object. It is not automatically a marketplace listing page.
  There are NO other screens: no settings, no account, no landing pages, no analytics.
- features: 2-8, each with a clear description and priority.
- platform: mobile, desktop, or all — from the answers when given.
- inspiration.primary MUST be a real company slug from the AVAILABLE COMPANIES list.`;

export async function runBrief(input: BriefInput): Promise<BriefOutput> {
  const { primary, secondary } = inspirationFromAnswers(input.answers);

  // V14: the brief agent sees the FULL catalog, not just the user's picks.
  const catalog = await listCatalog();
  const availableSlugs = catalog.map((c) => c.slug);
  const catalogBlock = catalog
    .map((c) => `- ${c.slug}: ${c.name} — ${c.description}${c.tags.length > 0 ? ` [tags: ${c.tags.join(", ")}]` : ""}`)
    .join("\n");

  // Strong prior from the user's gallery pick (validated against the registry).
  let primarySlug: string | null = primary && availableSlugs.includes(primary) ? primary : null;
  const secondaryValid: string[] = [];
  for (const s of secondary) {
    if (availableSlugs.includes(s) && s !== primarySlug) secondaryValid.push(s);
  }

  const usedFallback: string[] = [];
  if (!primarySlug) {
    const scored = await scoreCompanies(input.prompt);
    const top = scored.find((s) => s.score > 0) ?? scored[0];
    if (top) {
      primarySlug = top.slug;
      usedFallback.push("inspiration (top-scored)");
    } else {
      throw new Error("no registered companies available for inspiration selection");
    }
  }

  const company = await loadCompany(primarySlug);
  const companyBlock = await compileCompanyBlock(primarySlug);
  const megadesign = await megadesignBlock();

  const answersBlock = Object.keys(input.answers).length > 0
    ? `\nCLARIFICATION ANSWERS:\n${Object.entries(input.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
    : "";

  try {
    const brief = await chatJSON<ProductBrief>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `USER REQUEST:\n${input.prompt}${answersBlock}\n\nAVAILABLE COMPANIES (choose from these — primary must be one of these slugs):\n${catalogBlock}\n\nUSER'S INSPIRATION PICK (strong prior — use unless the product clearly contradicts it):\n${primarySlug}\n${secondaryValid.length > 0 ? `secondary: ${secondaryValid.join(", ")}` : "(none)"}\n\nPRIMARY REFERENCE DESIGN LANGUAGE (to embody, not to copy verbatim):\n${companyBlock}\n\nUNIVERSAL DESIGN LAW:\n${megadesign}\n\nWrite the product brief as JSON matching the schema:\n{\n  "version": "1.0.0",\n  "title", "productType", "mode": "browse"|"track"|"create"|"operate"|"learn"|"social"|"transact" (the product's PRIMARY job — see the MODE rules),\n  "description",\n  "audience": { "primary", "needs": string[] },\n  "goals": string[],\n  "features": [{ "name", "description", "priority": "critical"|"high"|"medium"|"low" }],\n  "platform": "mobile"|"desktop"|"all",\n  "screenPurposes": EXACTLY TWO entries: [{ "id": "home", "purpose": "the product's primary workflow — describe THIS product's actual main screen (dashboard, feed, workspace, coaching, or catalog)" }, { "id": "detail", "purpose": "the focused secondary workflow for one item/record/task — describe THIS product's actual detail screen" }],\n  "copyDirection",\n  "designLanguage",\n  "inspiration": { "primary": "${primarySlug}", "secondary"?: string[], "rationale"?: "why these references fit this product" }\n}`,
        },
        ...(input.visualReference ? [{ role: "user" as const, content: [{ type: "text" as const, text: "USER PRODUCT REFERENCE: analyze this image for composition, hierarchy, spacing, surfaces, density, and responsive intent. Do not copy its branding or content." }, ...input.visualReference.images] }] : []),
      ],
      {
        model: "brief",
        temperature: 0.4,
        maxTokens: MAX_TOKENS_PER_CALL.brief,
        validate: (v) => {
          const parsed = productBriefSchema.parse(v);
          // V14: the model may only choose from the registry.
          if (!availableSlugs.includes(parsed.inspiration.primary)) {
            throw new Error(`inspiration.primary "${parsed.inspiration.primary}" is not in the available catalog`);
          }
          return parsed;
        },
        onUsage: input.onUsage,
      },
    );
    // V9: exactly two canonical screens, deterministically.
    const normalized = { ...brief, screenPurposes: normalizeTwoScreens(brief.screenPurposes) };
    const attached = [...new Set([primarySlug, ...(brief.inspiration.secondary ?? []), ...secondaryValid])]
      .filter((s) => availableSlugs.includes(s) && s !== primarySlug);
    return {
      brief: productBriefSchema.parse(normalized),
      attachedCompanies: [primarySlug, ...attached],
      usedFallback,
      availableSlugs,
    };
  } catch (err) {
    console.warn("[pastel v14] brief failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    return {
      brief: await fallbackBrief(input.prompt, input.answers, company.name, primarySlug, secondaryValid),
      attachedCompanies: [primarySlug, ...secondaryValid],
      usedFallback: [...usedFallback, "brief"],
      availableSlugs,
    };
  }
}

async function fallbackBrief(
  prompt: string,
  answers: Record<string, string>,
  companyName: string,
  primarySlug: string,
  secondary: string[],
): Promise<ProductBrief> {
  const words = prompt.split(/\s+/).filter(Boolean);
  const title = words.slice(0, 6).join(" ").replace(/[^a-zA-Z0-9 ]/g, "") || "Product";
  const platform = (answers["platform"] as ProductBrief["platform"]) ?? "all";

  const screenPurposes = normalizeTwoScreens([
    { id: "home", purpose: "The product's primary workflow — the screen users spend the most time in" },
    { id: "detail", purpose: "The focused secondary workflow for one item, record, task, or content object" },
  ]);

  // V15: the deterministic mode classifier — never a hardcoded niche default.
  const mode = classifyMode(`${prompt} ${screenPurposes.map((p) => p.purpose).join(" ")}`);

  return {
    version: "1.0.0",
    title,
    productType: answers["productType"] || words.slice(0, 4).join(" ").slice(0, 60) || "application",
    mode,
    description: prompt.slice(0, 400),
    audience: {
      primary: answers["audience"] || "Primary users",
      needs: ["Complete core tasks", "Clear navigation"],
    },
    goals: ["Deliver the core workflow", "Feel instantly familiar"],
    features: [
      { name: "Core experience", description: "The primary workflow, done well.", priority: "critical" },
      { name: "Fast search", description: "Find anything in seconds.", priority: "high" },
    ],
    platform,
    screenPurposes,
    copyDirection: "Specific, calm, useful copy in the spirit of " + companyName + ".",
    designLanguage: `${companyName}-inspired: ${prompt.slice(0, 200)}`,
    inspiration: { primary: primarySlug, secondary: secondary.length > 0 ? secondary : undefined },
  };
}

import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { productBriefSchema, type ProductBrief } from "../schemas-v6";
import { loadCompany, scoreCompanies, compileCompanyBlock, megadesignBlock } from "../knowledge/index";
import { normalizeTwoScreens } from "../lib/ux-design";

/**
 * V6/V9 Brief agent — builds the product brief and selects the design
 * references. The company/app inspiration comes from the user's clarify
 * answers; if none was chosen the brief builder falls back to the highest
 * scored company. The output attaches megadesign.md + company design.md(s)
 * (the orchestrator persists them as run docs).
 *
 * V9: the brief ALWAYS describes exactly two screens — the main browse
 * (home/catalog) screen and the item detail page. `normalizeTwoScreens`
 * enforces this deterministically after the model call.
 */

export interface BriefInput {
  prompt: string;
  answers: Record<string, string>;
  onUsage?: OnUsage;
}

export interface BriefOutput {
  brief: ProductBrief;
  /** Company slugs whose design.md should be attached as run docs. */
  attachedCompanies: string[];
  usedFallback: string[];
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

const SYSTEM = `You are the Pastel product brief writer. You turn a user's idea (plus clarification answers and the chosen design inspiration) into a precise, buildable product brief.

RULES:
- Be specific and concrete. No AI-slop language.
- The inspiration's design language (rules, signature moves, voice) must shape the brief's designLanguage, copyDirection, and screen purposes.
- EXACTLY TWO screens — the two main screens of the product:
  1. "home" — the product's MAIN screen: browsing the catalog (for an Airbnb-style product this is the stays/home page). Purposes: search, explore, browse the core content.
  2. "detail" — the info page for ONE item: full details, photos, and the primary action (for an Airbnb-style product this is the listing page).
  There are NO other screens: no settings, no account, no landing pages, no analytics.
- features: 2-8, each with a clear description and priority.
- platform: mobile, desktop, or all — from the answers when given.
- inspiration.primary MUST be a real company slug provided in the context.`;

export async function runBrief(input: BriefInput): Promise<BriefOutput> {
  const { primary, secondary } = inspirationFromAnswers(input.answers);

  let primarySlug = primary;
  let usedFallback: string[] = [];
  if (!primarySlug) {
    const scored = await scoreCompanies(input.prompt);
    const top = scored.find((s) => s.score > 0) ?? scored[0];
    primarySlug = top?.slug ?? "apple";
    usedFallback.push("inspiration");
  }

  const company = await loadCompany(primarySlug);
  const companyBlock = await compileCompanyBlock(primarySlug);
  const megadesign = await megadesignBlock();

  const secondaryValid: string[] = [];
  for (const s of secondary) {
    try {
      await loadCompany(s);
      secondaryValid.push(s);
    } catch {
      // drop unknown secondary inspirations silently
    }
  }

  const answersBlock = Object.keys(input.answers).length > 0
    ? `\nCLARIFICATION ANSWERS:\n${Object.entries(input.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
    : "";

  const availableSlugs = [primarySlug, ...secondaryValid].join(", ");

  try {
    const brief = await chatJSON<ProductBrief>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `USER REQUEST:\n${input.prompt}${answersBlock}\n\nINSPIRATION (design language to embody):\n${companyBlock}\n\nUNIVERSAL DESIGN LAW:\n${megadesign}\n\nAvailable company slugs: ${availableSlugs}\n\nWrite the product brief as JSON matching the schema:\n{\n  "version": "1.0.0",\n  "title", "productType", "description",\n  "audience": { "primary", "needs": string[] },\n  "goals": string[],\n  "features": [{ "name", "description", "priority": "critical"|"high"|"medium"|"low" }],\n  "platform": "mobile"|"desktop"|"all",\n  "screenPurposes": EXACTLY TWO entries: [{ "id": "home", "purpose": "the main browse/catalog screen" }, { "id": "detail", "purpose": "the single-item info page" }],\n  "copyDirection",\n  "designLanguage",\n  "inspiration": { "primary": "${primarySlug}", "secondary"?: string[], "rationale"? }\n}`,
        },
      ],
      {
        model: "brief",
        temperature: 0.4,
        maxTokens: MAX_TOKENS_PER_CALL.brief,
        validate: (v) => productBriefSchema.parse(v),
        onUsage: input.onUsage,
      },
    );
    // V9: exactly two canonical screens, deterministically.
    const normalized = { ...brief, screenPurposes: normalizeTwoScreens(brief.screenPurposes) };
    return { brief: productBriefSchema.parse(normalized), attachedCompanies: [primarySlug, ...secondaryValid], usedFallback };
  } catch (err) {
    console.warn("[pastel v6] brief failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    return { brief: await fallbackBrief(input.prompt, input.answers, company.name, primarySlug, secondaryValid), attachedCompanies: [primarySlug, ...secondaryValid], usedFallback: [...usedFallback, "brief"] };
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
    { id: "home", purpose: "Browse and explore the product's main catalog — the primary screen" },
    { id: "detail", purpose: "Full info page for one item — photos, details, and the primary action" },
  ]);

  return {
    version: "1.0.0",
    title,
    productType: answers["productType"] || words.slice(0, 4).join(" ").slice(0, 60) || "application",
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

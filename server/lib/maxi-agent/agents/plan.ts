import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { designTokensSchema, visualIntentSchema, productBriefSchema, type DesignTokens, type ResolvedTheme, type VisualIntent, type ProductBrief } from "../schemas";
import { themeFromDesignTokens, compileCompanyBlock, megadesignBlock, listCatalog } from "../knowledge/index";
import type { CompanyManifest } from "../knowledge/manifest-schema";
import type { VisualReference } from "../types";
import { validateDesignTokens, enforceRadiusFloor, enforceCardContrast, designTokensFromManifest, visualIntentFromTokens } from "./design";
import { fallbackBrief, inspirationFromAnswers } from "./brief";
import { normalizeTwoScreens } from "../lib/ux-design";
import { buildBrandKit } from "../lib/brand-kit";

/**
 * Maxi Agent v23 — Wave 0: ONE combined call for the design system + product
 * brief (was two sequential MID-tier calls in v22: runDesign then runBrief).
 *
 * Every output is checked by a deterministic gate afterward:
 *   - tokens:  WCAG contrast pairs + radius/card floors (design.ts)
 *   - brief:   productBriefSchema + registry check + normalizeTwoScreens
 * So the call runs on the CHEAP tier. On any gate failure the deterministic
 * fallbacks (manifest tokens / fallbackBrief) take over — the run never
 * stalls on a model whim.
 *
 * Discovery (company selection) is deterministic nearest-neighbor scoring
 * (knowledge/index.ts::scoreCompanies) — it runs BEFORE this call and is not
 * a model call at all.
 */

export interface PlanInput {
  prompt: string;
  answers: Record<string, string>;
  /** Top-scored company (deterministic discovery) — the token hint. */
  hintManifest: CompanyManifest;
  visualReference?: VisualReference;
  onUsage?: OnUsage;
}

export interface PlanOutput {
  tokens: DesignTokens;
  theme: ResolvedTheme;
  visual: VisualIntent;
  brief: ProductBrief;
  attachedCompanies: string[];
  usedFallback: string[];
  notes: string[];
}

const SYSTEM = `You are the Maxi Agent design + product-planning architect. You produce ONE combined output for one product: the DESIGN SYSTEM (tokens + visual intent) AND the PRODUCT BRIEF — in a single JSON response.

DESIGN SYSTEM RULES:
- The product's audience, mood, and niche drive the tokens AND the visual intent. A running app, a developer tool, a travel marketplace, and a kids' learning app each deserve a DIFFERENT system.
- A company design language is attached as a HINT. Treat it as a starting point to ADAPT — never copy its palette wholesale.
- visual intent axes (these change the actual screen structure):
  - typeVoice: "condensed" (heavy tight display) | "grotesque" (clean neutral) | "serif" (elegant editorial) | "mono" (technical data) | "rounded" (friendly playful)
  - spacingMood: "compact" (dense, 24px sections) | "standard" (balanced, 32px) | "generous" (airy, 48px)
  - cornerLanguage: "sharp" (2-4px) | "soft" (8-12px) | "pill" (16px+)
  - surfaceTreatment: "flat" | "hairline" | "layered"
  - accentBehavior: "electric" (accent dominates) | "monochrome" (accent quiet) | "duotone" (tints imagery) | "pastel" (soft) | "warm" (earthy)
  - mediaStrategy: "photo-mosaic" | "flat-illustration" | "duotone-art" | "data-as-art" | "minimal"
  - mediaSubject: "runner"|"dumbbell"|"house"|"graph"|"product"|"album"|"doc"|"chat"|"board"|"generic"
- Colors: every pair must pass WCAG AA (>= 4.5:1). Light mode: near-white background, near-black foreground. Radius: match brand character (sharp 2-4, soft 8-12, pill 16-20); full is always 9999. Type scale: real Google Fonts (Inter, Archivo, Space Grotesk, DM Sans, Sora, Manrope, Lexend, IBM Plex Sans, JetBrains Mono...). Control sizes on the 8px ladder (sm 28-36, md 40-44, lg 48-56). sectionPaddingY 48-88, sectionGap 24-48 tied to spacingMood.

PRODUCT BRIEF RULES:
- MODE (the single most important layout decision): classify the product's PRIMARY job:
  "browse" (discover/compare items) | "transact" (book/buy one item) | "track" (log and monitor) | "create" (build something) | "operate" (run a team/project) | "learn" (follow a curriculum) | "social" (share and discuss)
- EXACTLY TWO screens: "home" (the product's primary workflow) + "detail" (the focused secondary workflow for one item/record/task). No settings, no landing pages.
- features: 2-8 with priority.
- inspiration.primary MUST be a real slug from the AVAILABLE COMPANIES list. The user's pick in CLARIFICATION ANSWERS is a strong prior.
- Be specific. No AI-slop language.

OUTPUT — valid JSON ONLY (no markdown, no prose):
{
  "tokens": {
    "version": "1.0.0", "mode": "light"|"dark",
    "colors": { "background", "foreground", "card", "cardForeground", "popover", "popoverForeground", "primary", "primaryForeground", "secondary", "secondaryForeground", "muted", "mutedForeground", "accent", "accentForeground", "destructive", "destructiveForeground", "success", "successSubtle", "warning", "warningSubtle", "border", "input", "ring", "chart": [3-6 hex] },
    "radius": { "sm", "md", "lg", "xl", "full": 9999 },
    "typeScale": { "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl" },
    "control": { "sm", "md", "lg" },
    "sectionPaddingY", "sectionGap",
    "fonts": { "display", "body", "mono"? },
    "rationale"?
  },
  "visual": {
    "version": "1.0.0",
    "typeVoice", "spacingMood", "cornerLanguage", "surfaceTreatment", "accentBehavior", "mediaStrategy", "mediaSubject",
    "rationale"?
  },
  "brief": {
    "version": "1.0.0",
    "title", "productType", "mode", "description",
    "audience": { "primary", "needs": string[] },
    "goals": string[],
    "features": [{ "name", "description", "priority" }],
    "platform": "mobile"|"desktop"|"all",
    "screenPurposes": [{ "id": "home", "purpose" }, { "id": "detail", "purpose" }],
    "copyDirection", "designLanguage",
    "inspiration": { "primary" (available slug), "secondary"?: string[], "rationale"? }
  }
}
Every color is 6-digit hex like "#0F172A".`;

export async function runPlanAgent(input: PlanInput): Promise<PlanOutput> {
  const mode: "light" | "dark" = input.answers["mode"]?.toLowerCase() === "dark" ? "dark" : "light";
  const usedFallback: string[] = [];
  const notes: string[] = [];
  const { primary, secondary } = inspirationFromAnswers(input.answers);

  const catalog = await listCatalog();
  const availableSlugs = catalog.map((c) => c.slug);
  const catalogBlock = catalog
    .map((c) => `- ${c.slug}: ${c.name} — ${c.description}${c.tags.length > 0 ? ` [tags: ${c.tags.join(", ")}]` : ""}`)
    .join("\n");

  const primarySlug = primary && availableSlugs.includes(primary) ? primary : input.hintManifest.slug;
  const secondaryValid = secondary.filter((s) => availableSlugs.includes(s) && s !== primarySlug);

  const megadesign = await megadesignBlock();
  const hintBlock = await compileCompanyBlock(primarySlug);
  const answersBlock = Object.keys(input.answers).length > 0
    ? `\nCLARIFICATION ANSWERS:\n${Object.entries(input.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
    : "";

  let tokens: DesignTokens;
  let visual: VisualIntent;
  let brief: ProductBrief;

  try {
    const out = await chatJSON<{ tokens: DesignTokens; visual?: VisualIntent; brief: ProductBrief }>(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            `PRODUCT REQUEST:\n${input.prompt}${answersBlock}`,
            "",
            `AVAILABLE COMPANIES (choose brief.inspiration.primary from these slugs only):\n${catalogBlock}`,
            `USER'S INSPIRATION PICK (strong prior — use unless the product clearly contradicts it): ${primarySlug}${secondaryValid.length > 0 ? `, secondary: ${secondaryValid.join(", ")}` : ""}`,
            "",
            `REFERENCE COMPANY DESIGN LANGUAGE (hint — adapt, never copy):\n${hintBlock}`,
            "",
            `UNIVERSAL DESIGN LAW:\n${megadesign}`,
            "",
            "Emit the design tokens, visual intent, and product brief as ONE JSON object.",
          ].join("\n"),
        },
        ...(input.visualReference
          ? [{ role: "user" as const, content: [{ type: "text" as const, text: "PRODUCT VISUAL TARGET: use this image to inform the palette, mood, surfaces, and art direction. Do not copy its branding." }, ...input.visualReference.images] }]
          : []),
      ],
      {
        model: "plan",
        temperature: 0.5,
        maxTokens: MAX_TOKENS_PER_CALL.plan,
        validate: (v: unknown) => {
          const raw = v as { tokens?: unknown; visual?: unknown; brief?: unknown };
          const tokens = designTokensSchema.parse(raw.tokens);
          const visual = raw.visual ? visualIntentSchema.parse(raw.visual) : undefined;
          const brief = productBriefSchema.parse(raw.brief);
          if (!availableSlugs.includes(brief.inspiration.primary)) {
            throw new Error(`brief.inspiration.primary "${brief.inspiration.primary}" is not in the available catalog`);
          }
          return { tokens, visual, brief };
        },
        onUsage: input.onUsage,
      },
    );

    const { ok, errors } = validateDesignTokens(out.tokens);
    if (!ok) {
      throw new Error(`Design tokens failed WCAG validation: ${errors.join("; ")}`);
    }

    tokens = out.tokens;
    visual = out.visual ?? visualIntentFromTokens(tokens, primarySlug);
    brief = productBriefSchema.parse({ ...out.brief, screenPurposes: normalizeTwoScreens(out.brief.screenPurposes) });

    const floored = enforceRadiusFloor(tokens, visual);
    if (floored !== tokens) notes.push("radius raised to the corner-language floor (components read as rounded)");
    const separated = enforceCardContrast(floored);
    if (separated !== floored) notes.push("card color separated from background (surfaces read as surfaces, not hairlines)");
    tokens = separated;
  } catch (err) {
    console.warn("[maxi-agent] combined plan call failed, using deterministic fallbacks:", err instanceof Error ? err.message : err);
    usedFallback.push("plan");
    tokens = designTokensFromManifest(input.hintManifest, mode);
    visual = visualIntentFromTokens(tokens, input.hintManifest.slug);
    const floored = enforceRadiusFloor(tokens, visual);
    if (floored !== tokens) notes.push("radius raised to the corner-language floor (components read as rounded)");
    const separated = enforceCardContrast(floored);
    if (separated !== floored) notes.push("card color separated from background (surfaces read as surfaces, not hairlines)");
    tokens = separated;

    brief = await fallbackBrief(input.prompt, input.answers, input.hintManifest.name, primarySlug, secondaryValid);
    usedFallback.push("brief");
  }

  const brandKit = buildBrandKit(tokens, visual, primarySlug);
  const attached = [...new Set([primarySlug, ...(brief.inspiration.secondary ?? []), ...secondaryValid])]
    .filter((s) => availableSlugs.includes(s) && s !== primarySlug);

  return {
    tokens,
    theme: themeFromDesignTokens(tokens, input.hintManifest),
    visual,
    brief,
    attachedCompanies: [primarySlug, ...attached],
    usedFallback,
    notes: [...notes, `brandKit built (${brandKit.signatures.length} signature(s))`],
  };
}

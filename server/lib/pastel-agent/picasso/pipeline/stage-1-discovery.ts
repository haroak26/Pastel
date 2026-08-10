import type { Brief } from "./types";
import { chatText, type ChatMessage } from "../../gateway";
import { loadMegadesign, loadCompanyDoc, loadProductMode } from "./knowledge";
import { detectProductContext, type ProductContext } from "./anti-slop";

export interface DiscoveryInput {
  brief: Brief;
}

export interface DiscoveryOutput {
  productContext: ProductContext;
  validationPassed: boolean;
  reasonIfFailed: string | null;
  selectedReferences: { name: string; rationale: string }[];
  contextDescription: string;
}

function validateContextFit(brief: Brief, context: ProductContext): { valid: boolean; reason: string | null } {
  const desc = brief.description.toLowerCase();

  if (context === "app" && (brief.platform === "marketing" || desc.includes("hero section"))) {
    return { valid: false, reason: "Brief describes marketing/landing page but resolves to an app context — context mismatch. An app should not have hero sections and marketing CTAs." };
  }

  if (context === "landing" && brief.platform === "mobile") {
    return { valid: false, reason: "Mobile apps should not be landing pages. Set platform to 'web' or 'marketing' for landing pages." };
  }

  if (brief.niche === "fintech" && brief.personality.includes("playful") && context === "app") {
    return { valid: true, reason: null };
  }

  return { valid: true, reason: null };
}

async function selectReferences(brief: Brief): Promise<{ name: string; rationale: string }[]> {
  if (brief.companyRefs && brief.companyRefs.length > 0) {
    const refs: { name: string; rationale: string }[] = [];
    for (const slug of brief.companyRefs) {
      try {
        loadCompanyDoc(slug);
        refs.push({ name: slug, rationale: `User-selected reference for ${brief.niche} product` });
      } catch {
        // skip unavailable
      }
    }
    if (refs.length > 0) return refs;
  }

  const nicheMap: Record<string, string[]> = {
    fintech: ["stripe", "mercury", "linear"],
    productivity: ["linear", "notion", "superhuman"],
    commerce: ["shopify", "stripe", "airbnb"],
    health: ["headspace", "duolingo", "airbnb"],
    social: ["spotify", "discord", "airbnb"],
    devtools: ["vercel", "stripe", "linear", "figma"],
    education: ["duolingo", "notion", "headspace"],
    travel: ["airbnb", "spotify", "uber"],
    creative: ["figma", "framer", "spotify"],
    other: ["stripe", "linear", "notion"],
  };

  const candidates = nicheMap[brief.niche] ?? nicheMap.other;
  const refs: { name: string; rationale: string }[] = [];

  for (const slug of candidates.slice(0, 3)) {
    try {
      loadCompanyDoc(slug);
      const rationale = getReferenceRationale(slug, brief);
      refs.push({ name: slug, rationale });
    } catch {
      // skip
    }
  }

  return refs.slice(0, 2);
}

function getReferenceRationale(slug: string, brief: Brief): string {
  const rationales: Record<string, string> = {
    stripe: "Professional, fintech-focused, minimal design with strong data display",
    mercury: "Startup banking, clean fintech, data precision, trustworthy",
    linear: "Keyboard-first minimalism, dense but calm — great for productivity tools",
    notion: "Calm and neutral, content-first, flexible layouts",
    superhuman: "Fast and premium, near-monochrome — speed-focused products",
    shopify: "Confident commerce, product-first, green/black palette",
    airbnb: "Warm and approachable, photography-first, human-centric",
    headspace: "Soft and calm, warm pastels, organic shapes — wellness and mindfulness",
    duolingo: "Playful and energetic, gamification patterns, bright green brand",
    spotify: "Bold dark canvas, vibrant accent, media-focused",
    vercel: "Dark-mode-first, developer tools, sharp and technical",
    figma: "Playful precision, creative tools, community-driven",
    framer: "Design-tool-cool, gradient accents, motion-forward",
    arc: "Expressive, soft rounding, modern browsing experience",
    discord: "Gaming-first, dark mode, community and chat",
    uber: "Bold black and white, confident, mobility-focused",
  };
  return rationales[slug] ?? `${slug}-inspired design approach for ${brief.niche} products`;
}

export async function runDiscovery(input: DiscoveryInput): Promise<DiscoveryOutput> {
  const { brief } = input;

  const productContext = detectProductContext({
    productName: brief.productName,
    description: brief.description,
    platform: brief.platform,
    niche: brief.niche,
  });

  const { valid, reason } = validateContextFit(brief, productContext);

  const selectedReferences = await selectReferences(brief);

  let contextDescription = "";
  try {
    const megadesignContent = loadMegadesign();
    let productModeContent = "";
    try {
      const modeMap: Record<string, string> = {
        app: "app-dashboard",
        landing: "landing-page",
        docs: "documentation",
        social: "app-social",
      };
      const modeFile = modeMap[productContext] ?? "app-dashboard";
      productModeContent = loadProductMode(modeFile);
    } catch {
      // fine if mode file missing
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a design discovery agent. Analyze the product brief and output a context description.

Product context: ${productContext}
${productModeContent}

Your output should describe:
1. What this product IS (its core function)
2. What screens/views it needs (based on context)
3. What NOT to do (anti-patterns for this context)

Keep it under 150 words. Be specific.`,
      },
      {
        role: "user",
        content: `Product: ${brief.productName}
Description: ${brief.description}
Audience: ${brief.audience}
Niche: ${brief.niche}
Personality: ${brief.personality.join(", ")}
Platform: ${brief.platform}
Mode: ${brief.mode}`,
      },
    ];

    contextDescription = await chatText(messages, {
      model: "brief",
      temperature: 0.3,
      maxTokens: 300,
    });
  } catch {
    contextDescription = `${brief.productName} is a ${brief.niche} ${productContext} designed for ${brief.audience}.`;
  }

  return {
    productContext,
    validationPassed: valid,
    reasonIfFailed: reason,
    selectedReferences,
    contextDescription,
  };
}

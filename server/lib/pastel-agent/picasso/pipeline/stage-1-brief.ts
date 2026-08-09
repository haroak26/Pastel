import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CreativeDirection } from "./types";
import { NICHE_COMPANY_MAP } from "./types";
import { chatText, type ChatMessage } from "../../gateway";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GenerateDirectionsInput {
  brief: BriefLike;
  megadesignContent: string;
  companyContents: Record<string, string>;
}

export interface BriefLike {
  productName: string;
  description: string;
  audience: string;
  niche: string;
  personality: string[];
  density: string;
  mode: string;
  platform: string;
  companyRefs?: string[];
}

const KB_DIR = path.resolve(__dirname, "../knowledge-base");

function resolveCompanySlugs(brief: BriefLike): string[] {
  if (brief.companyRefs && brief.companyRefs.length > 0) {
    return brief.companyRefs;
  }
  const niche = brief.niche as keyof typeof NICHE_COMPANY_MAP;
  return NICHE_COMPANY_MAP[niche] ?? NICHE_COMPANY_MAP["other"];
}

export async function loadContextForStage1(
  brief: BriefLike,
): Promise<{ megadesign: string; companies: Record<string, string> }> {
  const megadesign = fs.readFileSync(
    path.join(KB_DIR, "megadesign.md"),
    "utf-8",
  );

  const slugs = resolveCompanySlugs(brief);

  const companies: Record<string, string> = {};
  for (const slug of slugs) {
    const filePath = path.join(KB_DIR, "companies", `${slug}.md`);
    if (fs.existsSync(filePath)) {
      companies[slug] = fs.readFileSync(filePath, "utf-8");
    }
  }

  return { megadesign, companies };
}

function buildSystemPrompt(
  brief: BriefLike,
  megadesign: string,
  companies: Record<string, string>,
): string {
  const companyBlocks = Object.entries(companies)
    .map(([slug, content]) =>
      `### Company reference: ${slug}\n\n${content}`
    )
    .join("\n\n---\n\n");

  return `You are a senior creative director who translates product briefs into distinct visual directions. You work within the constraints of a design constitution ("megadesign") and a library of company design language references.

Your job: given a product brief + design constitution + company references, produce 2–3 creative directions. Each direction is a cohesive styling angle — genuinely different from the others, not just swapped adjectives.

## Design constitution

${megadesign}

## Company design language references

${companyBlocks}

## Instructions

Read the product brief below. Understand the product, audience, niche, personality, density, and mode. Then produce 2–3 creative directions. Each direction must be a genuinely different approach — vary the attitude, application of influences, and expression of personality. Do NOT produce directions that are just synonyms of each other.

For each direction include:
- **name** — a memorable, evocative label (2–4 words)
- **summary** — 1–2 sentences capturing the feel and stance
- **influences** — array of company slugs (from the references above) that shape this direction most
- **paletteDirection** — a text description of the color approach (no hex codes). Describe warmth, saturation, contrast, accent strategy, and light/dark posture.
- **densityFit** — "low", "medium", or "high" matching the brief's density expectation ("airy" → low, "balanced" → medium, "dense" → high)

Output ONLY a valid JSON array of CreativeDirection objects. No markdown, no code fences, no explanations.`;
}

function buildUserPrompt(brief: BriefLike): string {
  return `Product: ${brief.productName}
Description: ${brief.description}
Audience: ${brief.audience}
Niche: ${brief.niche}
Personality: ${brief.personality.join(", ")}
Density: ${brief.density}
Mode: ${brief.mode}
Platform: ${brief.platform}
${brief.companyRefs?.length ? `Preferred company references: ${brief.companyRefs.join(", ")}` : ""}`;
}

function validateCreativeDirections(value: unknown): CreativeDirection[] {
  let arr = value as Record<string, unknown>[];

  // Handle object wrapping: { directions: [...] } or { "0": {...}, "1": {...} }
  if (!Array.isArray(arr) && typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.directions)) {
      arr = obj.directions as Record<string, unknown>[];
    } else if (Array.isArray(obj.creativeDirections)) {
      arr = obj.creativeDirections as Record<string, unknown>[];
    } else {
      const entries = Object.entries(obj)
        .filter(([k]) => /^\d+$/.test(k) || k.startsWith("direction_"))
        .map(([, v]) => v as Record<string, unknown>);
      if (entries.length >= 2) {
        arr = entries;
      }
    }
  }

  if (!Array.isArray(arr)) throw new Error("Expected an array of creative directions");
  if (arr.length < 2 || arr.length > 3) throw new Error("Expected 2–3 directions, got " + arr.length);
  for (const item of arr) {
    if (typeof item.name !== "string" || !item.name.trim()) throw new Error("name must be a non-empty string");
    if (typeof item.summary !== "string" || !item.summary.trim()) throw new Error("summary must be a non-empty string");
    if (!Array.isArray(item.influences)) throw new Error("influences must be an array");
    if (typeof item.paletteDirection !== "string" || !item.paletteDirection.trim()) throw new Error("paletteDirection must be a non-empty string");
    if (!["low", "medium", "high"].includes(item.densityFit as string)) throw new Error("densityFit must be low, medium, or high");
  }
  return arr as unknown as CreativeDirection[];
}

export async function generateCreativeDirections(
  input: GenerateDirectionsInput,
): Promise<CreativeDirection[]> {
  const { brief, megadesignContent, companyContents } = input;

  const systemPrompt = buildSystemPrompt(brief, megadesignContent, companyContents);
  const userPrompt = buildUserPrompt(brief);

  let rawText = "";
  try {
    rawText = await chatText(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { model: "design", temperature: 0.7, maxTokens: 4000 },
    );
  } catch (err) {
    console.error("[stage-1] chatText failed:", err instanceof Error ? err.message : err);
    return fallbackDirections(input.brief);
  }

  // Parse from raw text with aggressive fallbacks
  let directions = tryParseDirections(rawText);
  if (directions) return directions;

  console.error("[stage-1] Could not parse directions from raw text. First 500 chars:", rawText.slice(0, 500));
  return fallbackDirections(input.brief);
}

function tryParseDirections(text: string): CreativeDirection[] | null {
  const attempts: (() => unknown)[] = [
    // 1. Full document as JSON
    () => JSON.parse(text.trim()),
    // 2. Extract from markdown code fence
    () => {
      const m = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      return m ? JSON.parse(m[1].trim()) : null;
    },
    // 3. Find first JSON array
    () => {
      const m = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      return m ? JSON.parse(m[0]) : null;
    },
    // 4. Find first JSON object and check for wrapped array
    () => {
      const m = text.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : null;
    },
    // 5. Find multiple JSON objects separated by commas outside array
    () => {
      const objs = text.match(/\{[^{}]*\}/g);
      if (objs && objs.length >= 2) {
        return JSON.parse(`[${objs.join(",")}]`);
      }
      return null;
    },
  ];

  for (const attempt of attempts) {
    try {
      const result = attempt();
      if (!result) continue;
      return validateCreativeDirections(result);
    } catch {
      continue;
    }
  }

  return null;
}

function fallbackDirections(brief: BriefLike): CreativeDirection[] {
  const references = brief.companyRefs ?? [];
  return [
    {
      name: `${brief.productName} — Focused`,
      summary: `Clean, restrained ${brief.niche} product with generous whitespace and a single bold accent. Professional but warm — closer to ${references[0] ?? "Stripe"} than a traditional finance app.`,
      influences: references.slice(0, 1),
      paletteDirection: "Light neutral base, single confident accent, high contrast for readability",
      densityFit: brief.density === "airy" ? "low" : brief.density === "dense" ? "high" : "medium",
    },
    {
      name: `${brief.productName} — Playful`,
      summary: `Energetic and game-like with rounded shapes, bouncy interactions, and a saturated palette. Feels like ${references[1] ?? "Duolingo"} — learning through doing, progress through play.`,
      influences: references.length > 1 ? [references[1]] : references,
      paletteDirection: "Saturated accent on white, colorful semantic palette, high energy",
      densityFit: "medium",
    },
    {
      name: `${brief.productName} — Dark`,
      summary: `Dark-mode-first, moody and premium. Neon accent against deep backgrounds. Feels like a premium creative tool — serious where it counts, beautiful where it can be.`,
      influences: references,
      paletteDirection: "Dark base (#0a0a0f range), luminous single accent, muted secondary surfaces",
      densityFit: "medium",
    },
  ];
}

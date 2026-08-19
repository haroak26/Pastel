import { MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import type { ChatMessage } from "../gateway";
import type { CompanyManifest } from "../knowledge/manifest-schema";
import { compileCompanyBlock, listCatalog, megadesignBlock, visualMoodBlock } from "../knowledge/index";
import { blueprintSchema } from "../lib/blueprint";
import {
  deriveBlueprint,
  fallbackBlueprint,
  type BlueprintDerivation,
} from "../lib/blueprint-derive";
import { callJSON, gatewayModelChat, type ModelChat } from "../lib/model-chat";
import type { VisualReference } from "../types";

/**
 * Maxi Agent v25 — Wave 0 · DIRECTION.
 *
 * ONE strong-model call that replaces v24's plan → genome → planner → data
 * → copy chain (five stages, seven JSON handoffs). The model does what
 * models are best at — having a point of view — and emits the complete
 * DesignBlueprint: three distinct named concepts, a chosen direction, screen
 * intents, the component API manifest Wave-1 authors code against, and the
 * exemplar content the deterministic generator expands.
 *
 * Everything mechanical happens after the call (blueprint-derive.ts): WCAG
 * repair, divergence veto, token expansion, manifest lint. On total failure
 * the deterministic fallback blueprint derives from the inspiration manifest
 * — the run never dies in Wave 0.
 */

export interface DirectionInput {
  prompt: string;
  answers: Record<string, string>;
  /** Top-scored company (deterministic discovery) — the mood hint. */
  hintManifest: CompanyManifest;
  visualReference?: VisualReference;
  /** Injectable chat — tests stub this; production uses the gateway. */
  chat?: ModelChat;
  onUsage?: OnUsage;
}

export interface DirectionOutput {
  derivation: BlueprintDerivation;
  usedFallback: boolean;
  notes: string[];
}

const SYSTEM = `You are the design director of a top product studio (think the team behind Linear, Stripe, or Mercury's actual app UIs). You deliver ONE complete design direction per product brief — a named concept, not a style menu.

You are starting a REAL product. Real startups (Vercel, Stripe-tier) will put this UI in front of real users, and it must look like a senior human designer built it. Generic "AI SaaS" output ends careers.

## YOUR DELIVERABLE — one JSON document with five parts

### 1. brief — what the product is
Title, productType, mode (browse|transact|track|create|operate|learn|social — the product's PRIMARY job), a description, the audience, and copyDirection: ONE directive sentence that is the product's voice (specific, human, never marketing fluff).

### 2. concepts — THREE distinct design directions
Each concept is a named POV, not a palette variant:
- name: 2-4 evocative words ("Ink & Air", "Ledger Brutalist", "Soft Canyon")
- thesis: 2-3 sentences. What this design believes. What it refuses to do.
- palette: 11 hex colors. Light or dark. background/foreground/card are the canvas; primary is the action color; accent appears rarely; muted carries secondary text; border/ring structure the surface. Aim for WCAG AA contrast (≥4.5:1 for text pairs) — the pipeline repairs misses, but start close.
- fonts: a REAL Google Fonts pairing. The pairing IS the voice. NEVER Inter, Roboto, Arial, or system-ui — those are the voice of nothing.
- density: compact | balanced | airy
- cornerLanguage: sharp | soft | pill
- motion: still | subtle | lively
- signatureMoves: 2-3 CONCRETE recognizable moves ("hairline dividers instead of cards", "oversized tabular numerals as the hero element", "chart ink restricted to one hue")

THE THREE CONCEPTS MUST BE GENUINELY DIFFERENT: different hue family for primary, different type voice, different density or corner language. Two concepts that are siblings = failure. A sibling-check runs after you: if your chosen concept is a near-twin of another, it gets vetoed.

### 3. chosenConcept — your pick
Pick the one that fits THIS product and THIS audience best — the one you would defend in a design review.

### 4. screens — 2 to 4 screens (you decide the set)
The minimum viable surface: usually home + detail; add a third or fourth ONLY when the product genuinely needs it (a library, a calendar, a settings surface). Each screen: id (slug), intent (2-3 sentences — what the user does here, what matters most), nav (sidebar|topbar|sidebar+topbar|none), dominantMoment (the ONE display-scale visual idea this screen is built around).

### 5. componentManifest — the API contract (6-14 entries)
Components are coded against this manifest IN PARALLEL with each other, so it must be complete and self-consistent:
- Include 2-4 primitives (Button, plus what this product needs: Input, Badge, Avatar, Select…) — primitives carry the concept's corner/weight language.
- Include 3-8 product components with names that belong to THIS product (PaceWall, InvoiceLedger, CabinGallery — never Widget3).
- props: camelCase names with types (string|number|boolean|array|object|node|func). EVERY prop MUST include "required" as an explicit boolean (true/false — never omit it); "description" is optional. Keep it small — data flows in, nothing flows out except optional callbacks. This is the API both the component author and the screen author code against; it must be enough to render real content.
- intent: one line of art direction per component.
- usedBy: which screens mount it. Every screen mounts at least one component.

### 6. dataSchema — the exemplar content (content IS design)
The dataset generator expands whatever you write here into the full dataset every screen renders. Write content that feels REAL for this product — specific names, believable numbers, honest statuses:
- units: every unit allowed in the UI (km, min, %, pts, €…) — nothing else may appear
- currency (only if amounts exist): ISO code
- dateRange: a recent ~30-day window (use 2026 dates)
- people: 1-3 believable names+roles
- metrics: 3-6 with label/value/unit/delta — these become the scoreboard moments
- list: the primary list's name + 2-3 exemplar rows (title/subtitle/meta/status/optional amount) — these are expanded to 7 populated rows, so make them the product's heart
- detail: the focused record's title + 4-8 label/value fields
- activity: 3-6 believable events

## HARD RULES
- inspiration.primary MUST be a real slug from the AVAILABLE COMPANIES list (the user's pick is a strong prior).
- The inspiration is a MOOD reference (its approach to contrast, density, restraint) — never copy its brand colors or layout recipes.
- No AI-slop language anywhere ("seamless", "empower", "revolutionize", "Get started").
- Optional fields must be OMITTED entirely — never emit null.
- Respect the character caps: detail field values ≤48, row meta ≤48, status ≤24, metric value ≤16, unit ≤12, labels ≤32, people names ≤48, roles ≤40, activity fields ≤48.
- Output valid JSON ONLY. No markdown fences, no commentary.`;

/**
 * Tolerate common model quirks before strict validation:
 *  - `null` on optional fields → omit the key (the schema uses .optional(),
 *    which accepts undefined but NOT null).
 *  - strings over a path's schema cap → truncate to the cap so a single
 *    verbose value can't sink the whole blueprint.
 */
const MAX_BY_PATH: Array<[string[], number]> = [
  [["brief", "title"], 48],
  [["brief", "productType"], 80],
  [["brief", "description"], 400],
  [["brief", "audience"], 160],
  [["brief", "copyDirection"], 240],
  [["concepts", "*", "name"], 48],
  [["concepts", "*", "fonts", "display"], 48],
  [["concepts", "*", "fonts", "body"], 48],
  [["concepts", "*", "signatureMoves", "*"], 160],
  [["screens", "*", "intent"], 400],
  [["screens", "*", "dominantMoment"], 240],
  [["componentManifest", "*", "intent"], 240],
  [["componentManifest", "*", "props", "*", "description"], 120],
  [["dataSchema", "list", "name"], 48],
  [["dataSchema", "list", "rows", "*", "title"], 48],
  [["dataSchema", "list", "rows", "*", "subtitle"], 80],
  [["dataSchema", "list", "rows", "*", "meta"], 48],
  [["dataSchema", "list", "rows", "*", "status"], 24],
  [["dataSchema", "list", "rows", "*", "amount"], 24],
  [["dataSchema", "metrics", "*", "label"], 32],
  [["dataSchema", "metrics", "*", "value"], 16],
  [["dataSchema", "metrics", "*", "unit"], 12],
  [["dataSchema", "people", "*", "name"], 48],
  [["dataSchema", "people", "*", "role"], 40],
  [["dataSchema", "detail", "title"], 64],
  [["dataSchema", "detail", "fields", "*", "label"], 32],
  [["dataSchema", "detail", "fields", "*", "value"], 48],
  [["dataSchema", "activity", "*", "actor"], 32],
  [["dataSchema", "activity", "*", "action"], 48],
  [["dataSchema", "activity", "*", "target"], 48],
  [["dataSchema", "activity", "*", "time"], 24],
  [["dataSchema", "units", "*"], 12],
];

function capForPath(path: string[]): number | null {
  for (const [pattern, max] of MAX_BY_PATH) {
    if (pattern.length !== path.length) continue;
    if (pattern.every((p, i) => p === "*" || p === path[i])) return max;
  }
  return null;
}

export function sanitizeBlueprintValue(value: unknown, path: string[] = []): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const cap = capForPath(path);
    return cap !== null && value.length > cap ? value.slice(0, cap) : value;
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => sanitizeBlueprintValue(v, [...path, String(i)]));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = sanitizeBlueprintValue(v, [...path, k]);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return value;
}

export function directionUserMessage(args: {
  prompt: string;
  answers: Record<string, string>;
  hintManifest: CompanyManifest;
  catalogBlock: string;
  primarySlug: string;
  moodBlock: string;
  megadesign: string;
}): string {
  const answersBlock = Object.keys(args.answers).length > 0
    ? `\nCLARIFICATION ANSWERS:\n${Object.entries(args.answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
    : "";
  return [
    `PRODUCT REQUEST:\n${args.prompt}${answersBlock}`,
    "",
    `AVAILABLE COMPANIES (choose brief.inspiration.primary from these slugs only):\n${args.catalogBlock}`,
    `USER'S INSPIRATION PICK (strong prior): ${args.primarySlug}`,
    "",
    `INSPIRATION MOOD (adapt the approach — never the brand):\n${args.moodBlock}`,
    "",
    `UNIVERSAL DESIGN LAW:\n${args.megadesign}`,
    "",
    "Emit the complete DesignBlueprint as ONE JSON object.",
  ].join("\n");
}

export async function runDirectionAgent(input: DirectionInput): Promise<DirectionOutput> {
  const chatFn = input.chat ?? gatewayModelChat();

  const catalog = await listCatalog();
  const availableSlugs = catalog.map((c) => c.slug);
  const catalogBlock = catalog
    .map((c) => `- ${c.slug}: ${c.name} — ${c.description}`)
    .join("\n");

  const userPick = input.answers["inspiration"]?.trim().toLowerCase();
  const primarySlug = userPick && availableSlugs.includes(userPick) ? userPick : input.hintManifest.slug;

  const megadesign = await megadesignBlock();
  const companyBlock = await compileCompanyBlock(primarySlug);
  const moodBlock = `${companyBlock}\n\nVISUAL MOOD SUMMARY:\n${visualMoodBlock(input.hintManifest)}`;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: directionUserMessage({
        prompt: input.prompt,
        answers: input.answers,
        hintManifest: input.hintManifest,
        catalogBlock,
        primarySlug,
        moodBlock,
        megadesign,
      }),
    },
  ];

  if (input.visualReference) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: "PRODUCT VISUAL TARGET: use this image to inform the concepts' mood, density, and art direction. Do not copy its branding." },
        ...input.visualReference.images,
      ] as Array<Record<string, unknown>>,
    });
  }

  try {
    const raw = await callJSON(chatFn, messages, {
      model: "direction",
      maxTokens: MAX_TOKENS_PER_CALL.direction,
      temperature: 0.7,
      onUsage: input.onUsage,
      validate: (v: unknown) => {
        const cleaned = sanitizeBlueprintValue(v);
        const parsed = blueprintSchema.parse(cleaned);
        if (!availableSlugs.includes(parsed.brief.inspiration.primary)) {
          throw new Error(`brief.inspiration.primary "${parsed.brief.inspiration.primary}" is not in the available catalog`);
        }
        return parsed;
      },
    });
    const derivation = deriveBlueprint(raw, input.hintManifest);
    return { derivation, usedFallback: false, notes: derivation.notes };
  } catch (err) {
    console.warn("[maxi-agent] direction call failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    const derivation = fallbackBlueprint(input.prompt, input.hintManifest, primarySlug);
    return { derivation, usedFallback: true, notes: derivation.notes };
  }
}

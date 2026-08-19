/**
 * Maxi Agent v26 — Model adapter layer.
 *
 * The MergeGateway SDK already normalises the wire format for most providers,
 * but two families need different treatment at the prompt/construction level:
 *
 *   1. **Image blocks** — the SDK's `ImageContent` type uses `{ type: "image",
 *      source_type: "base64", media_type, data }`.  The v25 code used the
 *      Anthropic format `{ type: "image", source: { type: "base64", ... } }`.
 *      This module provides `buildImageBlock()` that emits the correct shape
 *      for every provider.
 *
 *   2. **Temperature tuning** — Gemini is more sensitive to high temperature
 *      (produces chaotic output at 0.7) while Luna needs higher temperature
 *      to avoid template-like output.  `tuneTemperature()` adjusts per role.
 *
 *   3. **Token budget scaling** — Gemini 3.7 Flash has a smaller effective
 *      output window.  `tuneMaxTokens()` scales budgets per provider.
 *
 *   4. **Prompt suffixes** — each model family has a creative bias that must
 *      be counteracted in the system prompt.
 */

// ── Provider detection ─────────────────────────────────────────────────────

export type Provider = "openai" | "gemini";

/**
 * Detect the provider family from a model identifier string.
 * Handles common formats: "google/gemini-3.7-flash", "openai/gpt-5.6-luna",
 * "anthropic/claude-haiku-4-5", etc.
 */
export function detectProvider(model: string): Provider {
  if (model.startsWith("google/") || model.includes("gemini")) return "gemini";
  return "openai";
}

// ── Image block construction ───────────────────────────────────────────────

export interface ImageBlockInput {
  mediaType: string;
  data: string;
}

/**
 * Parse a data URL (`data:image/png;base64,...`) into its parts.
 */
export function parseDataUrl(dataUrl: string): ImageBlockInput {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error(`Invalid data URL (expected data:<mime>;base64,...): ${dataUrl.slice(0, 60)}`);
  return { mediaType: match[1]!, data: match[2]! };
}

/**
 * Build an image content block in the format the MergeGateway SDK expects.
 *
 * The SDK's `ImageContent` type is:
 *   `{ type: "image", source_type: "base64", media_type: string, data: string }`
 *
 * This is the same for all providers — the gateway translates internally.
 */
export function buildImageBlock(input: ImageBlockInput): Record<string, unknown> {
  return {
    type: "image",
    source_type: "base64",
    media_type: input.mediaType,
    data: input.data,
  };
}

/**
 * Convenience: parse a data URL and return an image content block.
 */
export function imageBlockFromDataUrl(dataUrl: string): Record<string, unknown> {
  return buildImageBlock(parseDataUrl(dataUrl));
}

// ── Temperature tuning ─────────────────────────────────────────────────────

/** Role-specific temperatures. */
interface TempByRole {
  direction: number;
  author: number;
  repair: number;
  review: number;
  clarify: number;
}

const LUNA_TEMPS: TempByRole = {
  direction: 0.7,
  author: 0.6,
  repair: 0.3,
  review: 0.4,
  clarify: 0.3,
};

const GEMINI_TEMPS: TempByRole = {
  direction: 0.5,
  author: 0.4,
  repair: 0.2,
  review: 0.3,
  clarify: 0.2,
};

/**
 * Get the recommended temperature for a given model and role.
 * Luna needs higher temp to avoid template output; Gemini needs lower to
 * avoid chaotic overcomplexity.
 */
export function tuneTemperature(model: string, role: keyof TempByRole): number {
  const provider = detectProvider(model);
  return provider === "gemini" ? GEMINI_TEMPS[role] : LUNA_TEMPS[role];
}

// ── Token budget scaling ───────────────────────────────────────────────────

const GEMINI_TOKEN_SCALE = 0.75; // Gemini 3.7 Flash has a smaller effective window

/**
 * Scale a token budget for the given provider.
 * Gemini gets ~75% of Luna's budget to stay within its effective window.
 */
export function tuneMaxTokens(model: string, baseBudget: number): number {
  const provider = detectProvider(model);
  return provider === "gemini" ? Math.floor(baseBudget * GEMINI_TOKEN_SCALE) : baseBudget;
}

// ── Prompt suffixes ────────────────────────────────────────────────────────

/**
 * Model-specific suffix appended to the Direction system prompt.
 * Luna tends toward template-like sameness; Gemini tends toward overcomplexity.
 */
export function directionPromptSuffix(model: string): string {
  const provider = detectProvider(model);
  if (provider === "gemini") {
    return `
## SIMPLICITY BIAS (Gemini-specific)
Your biggest risk is overcomplexity. Every element must earn its place:
- Maximum 3 distinct visual treatments per screen (surface types, not sections).
- No component with more than 5 props — if you need more, split it.
- Prefer 2 screens over 3 unless the product genuinely demands it.
- If a section could be removed without losing the product's story, remove it.
- Signature moves should be SUBTLE — one typographic choice, one spatial relationship.
- Keep the componentManifest lean — 4-6 components is ideal. Don't pad with unnecessary components.`;
  }
  return `
## CREATIVE BIAS (Luna-specific)
Your biggest risk is sameness — every run reading as the same template. Push HARD on distinctiveness:
- Choose an unexpected font pairing — something a senior designer would defend but a template wouldn't dare.
- Give each concept a genuinely different visual thesis, not just different colors on the same layout.
- The signature moves should be things that make a designer stop scrolling — a typographic choice, a spatial relationship, a density decision that is unmistakably THIS concept.
- Prefer asymmetric compositions over centered/balanced layouts. Two columns at 60/40 beat 50/50.
- Push the density and corner language to their extremes — "compact" should feel tight, "airy" should feel spacious.`;
}

/**
 * Model-specific suffix appended to Author system prompts.
 */
export function authorPromptSuffix(model: string): string {
  const provider = detectProvider(model);
  if (provider === "gemini") {
    return `
## GEMINI GUIDANCE
Write clean, simple JSX. Resist the urge to add:
- Extra wrapper divs, unnecessary flex containers, or nesting more than 3 levels deep
- More than 5 props per component
- TypeScript syntax (interfaces, type annotations, generics) — this is plain JSX
- Complex state management — prefer simple conditional rendering
- More than 2 interactive elements per section`;
  }
  return `
## LUNA GUIDANCE
Your output must feel designed by a human, not generated by a template:
- Every screen needs ONE unmistakable moment that is different from every other screen you've seen
- Vary your compositions: if one screen uses a band, the next should use rows or a grid
- Use font-weight, letter-spacing, and color contrast for impact — not just size
- Real product UI has visual texture: mix dividers, badges, inline SVGs, and tonal surfaces
- Avoid the "hero section → card grid → footer" pattern at all costs`;
}

// ── Hard constraints (model-agnostic, appended to all author prompts) ─────

export const HARD_CONSTRAINTS = `HARD CONSTRAINTS (violation = automatic rejection):
- MAXIMUM text size: text-4xl. NEVER use text-5xl, text-6xl, text-7xl, text-8xl, text-9xl.
  The display-scale dominant moment uses text-4xl at most. For larger visual impact use
  font-black + tracking-tight + color contrast — NOT bigger text sizes.
- NO hex color literals anywhere in JSX. Every color is a CSS token (bg-primary, text-muted-foreground, var(--ring)).
- NO raw Tailwind color names (bg-blue-500, text-red-200, border-gray-300). Use token classes only.
- NO TypeScript syntax. Write PLAIN JSX only — no "interface", no "type", no angle-bracket generics (useState<number>).
- NO gradients (bg-gradient-to-*), no decorative floating blobs, no drop shadows on static panels.
- NO centered-everything layouts. Use intentional asymmetry: 2/3 + 1/3, offset grids, varied section widths.
- Import ONLY from: react, lucide-react (for components) + relative project paths (for screens).`;

import { MergeGateway, type TagInput, type ThinkingConfig } from "merge-gateway-sdk";

/**
 * Multi-model gateway for the Pastel Agent 2 (17-stage) pipeline.
 *
 * Routing is by capability, not by pipeline stage:
 *   - Reasoner roles (Terra): intake, creativeBrief, spec, brandStrategy,
 *     designSystem, screenPlan, layout, componentSystem, compose, architecture,
 *     designGate, visualQA — planning, strategy, composition, verification.
 *   - Light roles (PASTEL_MODEL_LIGHT, defaults to ministral-14b-2512 — fast,
 *     cheap, and proven reliable on this gateway for structured JSON): ia,
 *     flows, interactions, patternRank. (gpt-oss-20b returns empty responses
 *     via this gateway — do not route roles to it.)
 *   - Implementer roles (Luna): component, screen, patch — deterministic
 *     React generation, component creation, targeted repair.
 *
 * Override any via env: PASTEL_MODEL_INTAKE, PASTEL_MODEL_COMPONENT, …
 */
export const MODELS = {
  // Stage 1 — clarification / intake
  intake: process.env.PASTEL_MODEL_INTAKE || "openai/gpt-5.6-terra",
  // Stage 2 — creative brief
  creativeBrief: process.env.PASTEL_MODEL_CREATIVE_BRIEF || "openai/gpt-5.6-terra",
  // Stage 3 — product specification
  spec: process.env.PASTEL_MODEL_SPEC || "openai/gpt-5.6-terra",
  // Stage 4 — brand strategy
  brandStrategy: process.env.PASTEL_MODEL_BRAND_STRATEGY || "openai/gpt-5.6-terra",
  // Stage 5 — brand kit (design system) generation
  designSystem: process.env.PASTEL_MODEL_DESIGN_SYSTEM || "openai/gpt-5.6-terra",
  // Stage 6 — information architecture (light)
  ia: process.env.PASTEL_MODEL_IA || process.env.PASTEL_MODEL_LIGHT || "mistralai/ministral-14b-2512",
  // Stage 7 — user flow planning (light)
  flows: process.env.PASTEL_MODEL_FLOWS || process.env.PASTEL_MODEL_LIGHT || "mistralai/ministral-14b-2512",
  // Stage 8 — screen planning
  screenPlan: process.env.PASTEL_MODEL_SCREEN_PLAN || "openai/gpt-5.6-terra",
  // Stage 9 — layout planning
  layout: process.env.PASTEL_MODEL_LAYOUT || "openai/gpt-5.6-terra",
  // Stage 10 — component system planning
  componentSystem: process.env.PASTEL_MODEL_COMPONENT_SYSTEM || "openai/gpt-5.6-terra",
  // Stage 11 — pattern retrieval reranker (light)
  patternRank: process.env.PASTEL_MODEL_PATTERN_RANK || process.env.PASTEL_MODEL_LIGHT || "mistralai/ministral-14b-2512",
  // Stage 12 — screen composition
  compose: process.env.PASTEL_MODEL_COMPOSE || "openai/gpt-5.6-terra",
  // Stage 13 — interaction planning (light)
  interactions: process.env.PASTEL_MODEL_INTERACTIONS || process.env.PASTEL_MODEL_LIGHT || "mistralai/ministral-14b-2512",
  // Delta planning (screen additions onto established projects)
  architecture: process.env.PASTEL_MODEL_ARCHITECTURE || "openai/gpt-5.6-terra",
  // Review phase — composition design gate
  designGate: process.env.PASTEL_MODEL_DESIGN_GATE || "openai/gpt-5.6-terra",
  // Stage 16 — visual design review (multimodal)
  visualQA: process.env.PASTEL_MODEL_VISUAL_QA || "openai/gpt-5.6-terra",
  // Stage 14 — code generation (implementer)
  component: process.env.PASTEL_MODEL_COMPONENT || "openai/gpt-5.6-luna",
  screen: process.env.PASTEL_MODEL_SCREEN || "openai/gpt-5.6-luna",
  // Stages 15/17 — surgical repair (implementer)
  patch: process.env.PASTEL_MODEL_PATCH || "openai/gpt-5.6-luna",
} as const;

export type ModelRole = keyof typeof MODELS;

export const PASTEL_GATEWAY_TAG_KEY = "betatesterid";

const TAG_ENV_BY_ROLE: Record<ModelRole, string> = {
  intake: "PASTEL_MERGE_GATEWAY_TAG_INTAKE",
  creativeBrief: "PASTEL_MERGE_GATEWAY_TAG_CREATIVE_BRIEF",
  spec: "PASTEL_MERGE_GATEWAY_TAG_SPEC",
  brandStrategy: "PASTEL_MERGE_GATEWAY_TAG_BRAND_STRATEGY",
  designSystem: "PASTEL_MERGE_GATEWAY_TAG_DESIGN_SYSTEM",
  ia: "PASTEL_MERGE_GATEWAY_TAG_IA",
  flows: "PASTEL_MERGE_GATEWAY_TAG_FLOWS",
  screenPlan: "PASTEL_MERGE_GATEWAY_TAG_SCREEN_PLAN",
  layout: "PASTEL_MERGE_GATEWAY_TAG_LAYOUT",
  componentSystem: "PASTEL_MERGE_GATEWAY_TAG_COMPONENT_SYSTEM",
  patternRank: "PASTEL_MERGE_GATEWAY_TAG_PATTERN_RANK",
  compose: "PASTEL_MERGE_GATEWAY_TAG_COMPOSE",
  interactions: "PASTEL_MERGE_GATEWAY_TAG_INTERACTIONS",
  architecture: "PASTEL_MERGE_GATEWAY_TAG_ARCHITECTURE",
  designGate: "PASTEL_MERGE_GATEWAY_TAG_DESIGN_GATE",
  visualQA: "PASTEL_MERGE_GATEWAY_TAG_VISUAL_QA",
  component: "PASTEL_MERGE_GATEWAY_TAG_COMPONENT",
  screen: "PASTEL_MERGE_GATEWAY_TAG_SCREEN",
  patch: "PASTEL_MERGE_GATEWAY_TAG_PATCH",
};

// Gateway-registered tag values (betagroupa) — new roles map onto the
// established registered value set. Override per role via the env vars above.
// If an org's tag config drifts, chat() retries once without tags.
const DEFAULT_TAG_VALUE_BY_ROLE: Record<ModelRole, string> = {
  intake: "clarify",
  creativeBrief: "brief",
  spec: "brief",
  brandStrategy: "plan",
  designSystem: "plan",
  ia: "plan",
  flows: "plan",
  screenPlan: "plan",
  layout: "plan",
  componentSystem: "componentPlan",
  patternRank: "planFallback",
  compose: "componentPlan",
  interactions: "plan",
  architecture: "componentPlan",
  designGate: "planFallback",
  visualQA: "planFallback",
  component: "code",
  screen: "code",
  patch: "fixSimple",
};

export function getPastelGatewayTags(
  role: ModelRole,
  env: NodeJS.ProcessEnv = process.env,
): TagInput[] {
  const key = env.PASTEL_MERGE_GATEWAY_TAG_KEY || env.MERGE_GATEWAY_TAG_KEY || PASTEL_GATEWAY_TAG_KEY;
  const value = env[TAG_ENV_BY_ROLE[role]] || env.PASTEL_MERGE_GATEWAY_TAG_VALUE || env.MERGE_GATEWAY_TAG_VALUE || DEFAULT_TAG_VALUE_BY_ROLE[role];
  return [{ key, value }];
}

// Budgets are right-sized to measured emission — oversized budgets cost
// latency on every call (models fill headroom with reasoning).
export const MAX_TOKENS_PER_CALL: Record<ModelRole, number> = {
  intake: Number(process.env.PASTEL_MAX_TOKENS_INTAKE) || 2500,
  creativeBrief: Number(process.env.PASTEL_MAX_TOKENS_CREATIVE_BRIEF) || 2500,
  spec: Number(process.env.PASTEL_MAX_TOKENS_SPEC) || 6000,
  brandStrategy: Number(process.env.PASTEL_MAX_TOKENS_BRAND_STRATEGY) || 1600,
  designSystem: Number(process.env.PASTEL_MAX_TOKENS_DESIGN_SYSTEM) || 9000,
  ia: Number(process.env.PASTEL_MAX_TOKENS_IA) || 2000,
  flows: Number(process.env.PASTEL_MAX_TOKENS_FLOWS) || 1600,
  screenPlan: Number(process.env.PASTEL_MAX_TOKENS_SCREEN_PLAN) || 3500,
  layout: Number(process.env.PASTEL_MAX_TOKENS_LAYOUT) || 2500,
  componentSystem: Number(process.env.PASTEL_MAX_TOKENS_COMPONENT_SYSTEM) || 8000,
  patternRank: Number(process.env.PASTEL_MAX_TOKENS_PATTERN_RANK) || 900,
  compose: Number(process.env.PASTEL_MAX_TOKENS_COMPOSE) || 10000,
  interactions: Number(process.env.PASTEL_MAX_TOKENS_INTERACTIONS) || 2000,
  architecture: Number(process.env.PASTEL_MAX_TOKENS_ARCHITECTURE) || 10000,
  designGate: Number(process.env.PASTEL_MAX_TOKENS_DESIGN_GATE) || 4000,
  visualQA: Number(process.env.PASTEL_MAX_TOKENS_VISUAL_QA) || 6000,
  component: Number(process.env.PASTEL_MAX_TOKENS_COMPONENT) || 5000,
  screen: Number(process.env.PASTEL_MAX_TOKENS_SCREEN) || 8000,
  patch: Number(process.env.PASTEL_MAX_TOKENS_PATCH) || 5000,
} as const;

// Reasoning models count chain-of-thought against max_tokens. When the budget
// is exhausted during reasoning the model emits empty/truncated text at
// finish_reason "max_tokens". Allow exactly one escalated retry as a safety
// net — stage-level budgets are sized so this should be rare.
const TRUNCATION_SCALE = 2.5;
const MAX_TRUNCATION_RETRIES = 1;
const MAX_ESCALATED_TOKENS = 24000;
const DEFAULT_THINKING_BUDGET = 2000;

// Gateway variants report truncation with different finish reasons. The
// OpenAI Responses API also exposes a top-level incomplete_details field.
const TRUNCATED_FINISH_REASONS = new Set(["max_tokens", "length", "incomplete"]);

export function isTruncated(response: ChatResponse): boolean {
  if (response.output?.some((o) => o.finish_reason && TRUNCATED_FINISH_REASONS.has(o.finish_reason))) {
    return true;
  }
  return !!(response.incomplete_details as { reason?: string } | undefined)?.reason;
}

/** Thinking budget for reasoning models. PASTEL_THINKING_BUDGET=off disables reasoning. */
function thinkingConfig(role?: ModelRole): ThinkingConfig | Record<string, unknown> | undefined {
  const raw = process.env.PASTEL_THINKING_BUDGET;
  if (raw === "off") return { type: "disabled" };
  // Light roles run small structured transforms on a mini model — reasoning
  // config is skipped from the start (saves a whole retry round-trip).
  if (role && LIGHT_ROLES.has(role) && raw === undefined) return undefined;
  const budget = Number(raw);
  if (Number.isFinite(budget) && budget > 0) return { type: "enabled", budget_tokens: Math.floor(budget) };
  return { type: "enabled", budget_tokens: DEFAULT_THINKING_BUDGET };
}

export const LIGHT_ROLES: ReadonlySet<ModelRole> = new Set<ModelRole>(["ia", "flows", "patternRank", "interactions"]);

let cachedClient: MergeGateway | null = null;

function getClient(): MergeGateway {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.MERGE_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI service not configured. Set MERGE_GATEWAY_API_KEY in your environment variables.",
    );
  }

  cachedClient = new MergeGateway({
    apiKey,
    baseUrl: "https://api-gateway.merge.dev/v1",
    timeout: 180000,
  });
  return cachedClient;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

function contentLength(content: ChatMessage["content"]): number {
  return typeof content === "string" ? content.length : JSON.stringify(content).length;
}

export interface ChatCallOptions {
  model: ModelRole;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
}

type JsonValidator<T> = (value: unknown) => T;

export interface ChatResult {
  content: string;
  model: string;
  inputChars: number;
  outputChars: number;
}

export async function chat(
  messages: ChatMessage[],
  opts: ChatCallOptions,
): Promise<ChatResult> {
  const client = getClient();
  const model = MODELS[opts.model];

  const inputChars = messages.reduce((s, m) => s + contentLength(m.content), 0);

  let budget = opts.maxTokens ?? 2000;
  let content = "";
  let response: ChatResponse;
  let withThinking = true;
  let skipTags = false;

  for (let attempt = 0; ; attempt++) {
    try {
      response = await client.responses.create({
        model,
        input: messages.map((m) => ({ type: "message" as const, ...m })),
        tags: skipTags ? undefined : getPastelGatewayTags(opts.model),
        temperature: opts.temperature ?? 0.5,
        max_tokens: budget,
        thinking: withThinking ? thinkingConfig(opts.model) : undefined,
        response_format:
          opts.responseFormat === "json_object"
            ? { type: "json_object" }
            : undefined,
      });
    } catch (err) {
      // If the org's tag registry rejects our tag for this role, retry once
      // without tags — generating the artifact matters more than its cost tag.
      if (!skipTags && /unknown tags/i.test(err instanceof Error ? err.message : String(err))) {
        skipTags = true;
        continue;
      }
      // Some gateways reject the thinking config for non-reasoning models.
      // Retry once without it before surfacing the error.
      if (withThinking) {
        withThinking = false;
        continue;
      }
      throw err;
    }

    content = extractTextContent(response);

    const truncated = isTruncated(response);

    if (truncated && attempt < MAX_TRUNCATION_RETRIES) {
      const nextBudget = Math.min(MAX_ESCALATED_TOKENS, Math.ceil(budget * TRUNCATION_SCALE));
      if (nextBudget > budget) {
        budget = nextBudget;
        continue;
      }
    }
    break;
  }

  if (!content.trim()) {
    // Dump response structure for debugging
    const structure = JSON.stringify(response).slice(0, 500);
    console.error(`[pastel-agent] Empty response from ${model}. Response structure: ${structure}`);
    throw new Error(`Empty response from model ${model}`);
  }
  return { content, model, inputChars, outputChars: content.length };
}

/** Minimal shape of a gateway response needed by this module. */
interface ChatResponse {
  output?: Array<{
    finish_reason?: "stop" | "max_tokens" | "length" | "incomplete" | "tool_use" | "content_filter";
    content?: Array<{ type?: string; text?: unknown }> | unknown;
  }>;
  output_text?: unknown;
  incomplete_details?: { reason?: string };
}

/** Extract all visible text blocks from a gateway response. */
function extractTextContent(response: ChatResponse): string {
  // Try primary extraction path: output[0].content text blocks
  const firstContent = response.output?.[0]?.content;
  let content = Array.isArray(firstContent)
    ? firstContent
        .filter((b) => b.type === "text")
        .map((b) => ("text" in b ? b.text : ""))
        .join("")
    : "";

  // Fallback: scan all output items for text content
  if (!content.trim() && Array.isArray(response.output)) {
    for (const output of response.output) {
      const blocks = Array.isArray(output.content) ? output.content : [output.content];
      for (const block of blocks) {
        if (block && typeof block === "object" && "text" in block && typeof block.text === "string") {
          content += block.text;
        }
      }
    }
  }

  // Last resort: try output_text or raw response stringification
  if (!content.trim() && typeof response.output_text === "string") {
    content = response.output_text;
  }

  return content;
}

type ParseResult<T> = { value: T } | { error: Error; kind: "parse" | "validate" };

/** Parse (with repair) and validate a JSON payload, reporting the failure kind. */
export function parseAndValidate<T>(raw: string, validate?: JsonValidator<T>): ParseResult<T> {
  let jsonStr = raw.trim();

  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const candidates = [jsonStr];
  const repaired = repairJSON(jsonStr);
  if (repaired !== jsonStr) candidates.push(repaired);

  for (const candidate of candidates) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }
    if (!validate) return { value: parsed as T };
    try {
      return { value: validate(parsed) };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)), kind: "validate" };
    }
  }
  return { error: new Error(jsonStr.slice(0, 300)), kind: "parse" };
}

/**
 * Call a model expecting a JSON object response.
 *
 * Validation-first policy: exactly one attempt, parse-repair (free), zod
 * validation, then ONE corrective retry with the validation error appended.
 * No blind retries — a stage that still fails degrades deterministically.
 */
export async function chatJSON<T>(
  messages: ChatMessage[],
  opts: Omit<ChatCallOptions, "responseFormat"> & { validate?: JsonValidator<T> },
): Promise<T> {
  const chatOpts: ChatCallOptions = { ...opts, responseFormat: "json_object" };

  const attempt = async (messageSet: ChatMessage[]): Promise<ParseResult<T>> => {
    const { content } = await chat(messageSet, chatOpts);
    return parseAndValidate(content, opts.validate);
  };

  const first = await attempt(messages);
  if ("value" in first) return first.value;

  // Validation failures get one corrective retry with the error appended.
  if (first.kind === "validate") {
    const correctiveMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: `Your previous response was valid JSON but failed this validation:
${first.error.message}

Fix the JSON so it satisfies the expected schema exactly — include every required item and field. Output ONLY the corrected JSON. No markdown, no code fences, no explanations.`,
      },
    ];
    let second: ParseResult<T> | null = null;
    try {
      second = await attempt(correctiveMessages);
    } catch (err) {
      console.warn(`[pastel-agent] corrective retry failed for model ${chatOpts.model}:`, err instanceof Error ? err.message : err);
    }
    if (second && "value" in second) return second.value;
    if (second && second.kind === "validate") {
      console.error(`[pastel-agent] JSON validation failed. Model: ${chatOpts.model}. Validation error: ${second.error.message}`);
      throw new Error(`AI returned JSON that failed validation. Model: ${chatOpts.model}. Validation error: ${second.error.message}`);
    }
  }

  if (first.kind === "validate") {
    console.error(`[pastel-agent] JSON validation failed. Model: ${chatOpts.model}. Validation error: ${first.error.message}`);
    throw new Error(`AI returned JSON that failed validation. Model: ${chatOpts.model}. Validation error: ${first.error.message}`);
  }

  const preview = first.error.message;
  console.error(`[pastel-agent] JSON parse failed. Model: ${chatOpts.model}. First 300 chars: ${preview}`);
  throw new Error(`AI returned non-JSON response. Model: ${chatOpts.model}. First 300 chars: ${preview}`);
}

/** Call a model expecting a plain-text (markdown) response. */
export async function chatText(
  messages: ChatMessage[],
  opts: Omit<ChatCallOptions, "responseFormat">,
): Promise<string> {
  const { content } = await chat(messages, { ...opts, responseFormat: "text" });
  return content.trim();
}

/**
 * Extract a fenced code block (e.g. ```json ... ```) from a markdown document.
 * Returns null when the block is absent or unparseable.
 */
export function extractFencedBlock(doc: string, lang: string): string | null {
  const re = new RegExp("```" + lang + "\\s*\\n([\\s\\S]*?)\\n```", "i");
  const match = doc.match(re);
  return match ? match[1].trim() : null;
}

/** Attempt to repair truncated or malformed JSON strings. */
function repairJSON(raw: string): string {
  let s = raw.trim();

  // Strip BOM
  s = s.replace(/^﻿/, "");

  s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

  if (!s) return raw;

  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  const jsonStart =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);

  if (jsonStart === -1) return raw;
  s = s.slice(jsonStart);

  // Fix single-quoted strings (single quotes are illegal JSON)
  // This handles common AI mistake: {'key': 'value'}
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, inner) => {
    return `"${inner.replace(/"/g, '\\"')}"`;
  });

  // Fix unquoted keys at the start of lines/after commas: { key: ... }
  s = s.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // Fix NaN and Infinity
  s = s.replace(/:\s*NaN\b/g, ": null");
  s = s.replace(/:\s*Infinity\b/g, ": null");
  s = s.replace(/:\s*-Infinity\b/g, ": null");

  // Fix trailing commas before closing brackets/braces
  s = s.replace(/,\s*([}\]])/g, "$1");

  let depth = 0;
  let lastBalancedEnd = -1;
  let inString = false;
  let escapeNext = false;
  const stack: string[] = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        escapeNext = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      depth++;
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      depth--;
      stack.pop();
      if (depth === 0) {
        lastBalancedEnd = i;
      }
    }
  }

  if (lastBalancedEnd === -1) {
    s = s.replace(/,\s*$/, "");

    // Output was cut off mid-string: close the open string literal so the
    // remaining delimiters can balance. A trailing backslash would escape the
    // closing quote, so drop it first.
    if (inString) {
      if (escapeNext) s = s.slice(0, -1);
      s += '"';
    }

    // Close still-open delimiters in reverse stack order so the nesting stays
    // valid. Closing all braces before all brackets would emit `[}]` when the
    // truncation happens inside a nested array.
    const closer: Record<string, string> = { "{": "}", "[": "]" };
    for (let i = stack.length - 1; i >= 0; i--) {
      s += closer[stack[i]];
    }
    return s;
  }

  let extracted = s.slice(0, lastBalancedEnd + 1);

  // Final pass: remove any trailing content after the balanced JSON
  extracted = extracted.replace(/,\s*([}\]])/g, "$1");
  extracted = extracted.replace(/,\s*$/, "");

  return extracted;
}

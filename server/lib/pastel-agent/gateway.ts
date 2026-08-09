import { MergeGateway, type ThinkingConfig } from "merge-gateway-sdk";

/**
 * Pastel Agent v14 — hybrid model gateway.
 *
 * V14 strategy: TWO models only. A CHEAP model (claude-haiku-4-5) carries the
 * bulk mechanical work — clarify, per-component planner, per-component builder,
 * and repair. A MID model (gpt-5.6-luna) handles every judgment stage —
 * design (tokens), data (all page content), brief, wireframe, copy (the
 * product voice), review, and visual review on rendered screenshots.
 *
 * The knowledge base (company design.md + megadesign.md) carries the visual
 * quality; models select and adapt within it. Override any role via env:
 * PASTEL_MODEL_{ROLE}.
 */

export const CHEAP_DEFAULT = "anthropic/claude-haiku-4-5";
export const MID_DEFAULT = "openai/gpt-5.6-luna";

export const MODELS = {
  clarify:      process.env.PASTEL_MODEL_CLARIFY      || CHEAP_DEFAULT,
  design:       process.env.PASTEL_MODEL_DESIGN        || MID_DEFAULT,
  data:         process.env.PASTEL_MODEL_DATA          || MID_DEFAULT,
  brief:        process.env.PASTEL_MODEL_BRIEF        || MID_DEFAULT,
  wireframe:    process.env.PASTEL_MODEL_WIREFRAME    || MID_DEFAULT,
  planner:      process.env.PASTEL_MODEL_PLANNER      || CHEAP_DEFAULT,
  /** V21: custom PRODUCT components are built on the MID tier (components
   * are where most visible design quality lives; v20 built them on the
   * cheapest model). Shell chrome stays on `builder` (cheap). */
  builderCustom: process.env.PASTEL_MODEL_BUILDER_CUSTOM || MID_DEFAULT,
  builder:      process.env.PASTEL_MODEL_BUILDER      || CHEAP_DEFAULT,
  copy:         process.env.PASTEL_MODEL_COPY         || MID_DEFAULT,
  assemble:     process.env.PASTEL_MODEL_ASSEMBLE     || CHEAP_DEFAULT,
  /** V19: the screen composer writes each screen's layout body with full
   * creative control (anti-slop guided). Mid model — layout is the single
   * biggest lever on visual quality. */
  compose:      process.env.PASTEL_MODEL_COMPOSE       || MID_DEFAULT,
  review:       process.env.PASTEL_MODEL_REVIEW       || MID_DEFAULT,
  visualReview: process.env.PASTEL_MODEL_VISUAL_REVIEW || MID_DEFAULT,
  /** V22: repair must be AT LEAST as capable as the model that found the
   * defects (review runs on MID). v21 ran repair on the cheap tier with a
   * 5000-token ceiling — structural fixes (real charts, viewport-filling
   * restructures) were beyond its budget, so every repair round no-oped and
   * broken runs shipped as "done". */
  repair:       process.env.PASTEL_MODEL_REPAIR       || MID_DEFAULT,
} as const;

export type ModelRole = keyof typeof MODELS;

export const MAX_TOKENS_PER_CALL: Record<ModelRole, number> = {
  clarify:      Number(process.env.PASTEL_MAX_TOKENS_CLARIFY)      || 2500,
  design:       Number(process.env.PASTEL_MAX_TOKENS_DESIGN)       || 5000,
  data:         Number(process.env.PASTEL_MAX_TOKENS_DATA)         || 6000,
  brief:        Number(process.env.PASTEL_MAX_TOKENS_BRIEF)        || 4000,
  wireframe:    Number(process.env.PASTEL_MAX_TOKENS_WIREFRAME)    || 16000,
  planner:      Number(process.env.PASTEL_MAX_TOKENS_PLANNER)      || 6000,
  builderCustom: Number(process.env.PASTEL_MAX_TOKENS_BUILDER_CUSTOM) || 9000,
  builder:      Number(process.env.PASTEL_MAX_TOKENS_BUILDER)      || 6500,
  copy:         Number(process.env.PASTEL_MAX_TOKENS_COPY)         || 3000,
  assemble:     Number(process.env.PASTEL_MAX_TOKENS_ASSEMBLE)     || 5000,
  compose:      Number(process.env.PASTEL_MAX_TOKENS_COMPOSE)      || 10000,
  review:       Number(process.env.PASTEL_MAX_TOKENS_REVIEW)       || 4000,
  visualReview: Number(process.env.PASTEL_MAX_TOKENS_VISUAL_REVIEW) || 4000,
  /** V22: a screen-level structural rewrite (new chart with axes/gridlines,
   * restructured detail layout) needs the same budget the builder gets for a
   * full file — not the smallest tier in the table. */
  repair:       Number(process.env.PASTEL_MAX_TOKENS_REPAIR)       || 9000,
} as const;

const TRUNCATION_SCALE = 2.5;
const MAX_TRUNCATION_RETRIES = 1;

/** Per-role ceiling for truncation escalation. */
const ESCALATION_CAP: Partial<Record<ModelRole, number>> = {
  wireframe: 16000,
};

function escalationCap(role: ModelRole): number {
  const env = Number(process.env.PASTEL_MAX_ESCALATED_TOKENS);
  if (Number.isFinite(env) && env > 0) return env;
  return ESCALATION_CAP[role] ?? 12000;
}

const DEFAULT_THINKING_BUDGET = 2000;

const TRUNCATED_FINISH_REASONS = new Set(["max_tokens", "length", "incomplete"]);

export function isTruncated(response: ChatResponse): boolean {
  if (response.output?.some((o) => o.finish_reason && TRUNCATED_FINISH_REASONS.has(o.finish_reason))) {
    return true;
  }
  return !!(response.incomplete_details as { reason?: string } | undefined)?.reason;
}

function thinkingConfig(role?: ModelRole): ThinkingConfig | Record<string, unknown> | undefined {
  const raw = process.env.PASTEL_THINKING_BUDGET;
  if (raw === "off") return { type: "disabled" };
  if (role && LIGHT_ROLES.has(role) && raw === undefined) return undefined;
  const budget = Number(raw);
  if (Number.isFinite(budget) && budget > 0) return { type: "enabled", budget_tokens: Math.floor(budget) };
  return { type: "enabled", budget_tokens: DEFAULT_THINKING_BUDGET };
}

/** Roles that don't support reasoning/thinking config — Luna models.
 * Thinking config is skipped entirely for these, avoiding a wasted retry round-trip.
 * v6 defaults ALL roles to thinking-off (cheap + fast); set PASTEL_THINKING_BUDGET
 * to a number to enable it. */
export const LIGHT_ROLES: ReadonlySet<ModelRole> = new Set<ModelRole>([
  "clarify", "design", "data", "brief", "wireframe", "planner", "builder", "builderCustom", "copy", "assemble", "compose", "review", "visualReview", "repair",
]);

let cachedClient: MergeGateway | null = null;

const GATEWAY_TIMEOUT_MS = Number(process.env.PASTEL_GATEWAY_TIMEOUT_MS) || 300000;

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
    timeout: GATEWAY_TIMEOUT_MS,
  });
  return cachedClient;
}

/** Minimal client shape needed for tests/stubs. */
export interface MergeGatewayLike {
  responses: { create: (params: Record<string, unknown>) => Promise<unknown> };
}

/** Test seam: swap the gateway client with a stub. Pass null to reset. */
export function __setTestClient(client: MergeGatewayLike | MergeGateway | null): void {
  cachedClient = client as MergeGateway | null;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

function contentLength(content: ChatMessage["content"]): number {
  return typeof content === "string" ? content.length : JSON.stringify(content).length;
}

function countImageBlocks(messages: ChatMessage[]): number {
  let n = 0;
  for (const m of messages) {
    if (Array.isArray(m.content)) {
      for (const block of m.content) {
        if (block && typeof block === "object" && (block as { type?: string }).type === "image") n++;
      }
    }
  }
  return n;
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
}

export interface UsageRecord {
  role: ModelRole;
  modelId: string;
  inputChars: number;
  outputChars: number;
  /** Real token counts from the API when available (else 0). */
  inputTokens: number;
  outputTokens: number;
  /** Number of image blocks sent — priced as image tokens, never text chars. */
  imageBlocks: number;
  costUsd?: number;
}

export type OnUsage = (rec: UsageRecord) => void;

export interface ChatCallOptions {
  model: ModelRole;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
  /** Called once per successful API call with real usage numbers. */
  onUsage?: OnUsage;
}

type JsonValidator<T> = (value: unknown) => T;

export interface ChatResult {
  content: string;
  model: string;
  inputChars: number;
  outputChars: number;
  usage?: ChatUsage;
}

interface ChatResponse {
  output?: Array<{
    finish_reason?: "stop" | "max_tokens" | "length" | "incomplete" | "tool_use" | "content_filter";
    content?: Array<{ type?: string; text?: unknown }> | unknown;
  }>;
  output_text?: unknown;
  incomplete_details?: { reason?: string };
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  routing?: { cost_usd?: number };
  model?: string;
}

function hasThinkingContent(response: ChatResponse): boolean {
  for (const output of response.output ?? []) {
    const blocks = Array.isArray(output.content) ? output.content : [output.content];
    for (const block of blocks) {
      if (block && typeof block === "object" && (block as { type?: string }).type === "thinking") return true;
    }
  }
  return false;
}

function extractUsage(response: ChatResponse): ChatUsage | undefined {
  const u = response.usage;
  if (u && typeof u.input_tokens === "number" && typeof u.output_tokens === "number") {
    const costUsd = response.routing?.cost_usd;
    return { inputTokens: u.input_tokens, outputTokens: u.output_tokens, ...(typeof costUsd === "number" ? { costUsd } : {}) };
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Transient gateway/upstream faults worth one bounded retry: rate limits,
 * 5xx, network resets, timeouts. Content problems (validation, auth, bad
 * request) are never retried here.
 */
export function isTransientError(message: string): boolean {
  return /429|\b5\d{2}\b|rate.?limit|overloaded|request timed?\s*out|timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|fetch failed|socket hang up|temporarily unavailable|service unavailable|bad gateway|gateway timeout/i.test(message);
}

const MAX_TOTAL_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [800, 2000];

export async function chat(
  messages: ChatMessage[],
  opts: ChatCallOptions,
): Promise<ChatResult> {
  const client = getClient();
  const model = MODELS[opts.model];
  const inputChars = messages.reduce((s, m) => s + contentLength(m.content), 0);
  const imageBlocks = countImageBlocks(messages);

  let budget = opts.maxTokens ?? 2000;
  let content = "";
  let response: ChatResponse | undefined;
  let withThinking = true;
  let attempts = 0;

  for (let escalations = 0; ; ) {
    try {
      response = (await client.responses.create({
        model,
        input: messages.map((m) => ({ type: "message" as const, ...m })),
        temperature: opts.temperature ?? 0.5,
        max_tokens: budget,
        thinking: withThinking ? thinkingConfig(opts.model) : undefined,
        response_format:
          opts.responseFormat === "json_object"
            ? { type: "json_object" }
            : undefined,
      })) as ChatResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Thinking config unsupported by this model — drop it and retry once for free.
      if (withThinking && /thinking.*(?:budget|token|limit)|no vendor.*(?:reasoning|capabilities)/i.test(msg)) {
        withThinking = false;
        continue;
      }
      attempts++;
      if (attempts < MAX_TOTAL_ATTEMPTS && isTransientError(msg)) {
        console.warn(`[pastel-agent] transient error from ${model} (attempt ${attempts}): ${msg} — retrying`);
        await sleep(RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)]);
        continue;
      }
      throw err;
    }

    content = extractTextContent(response);
    const truncated = isTruncated(response);

    // When a model burns its entire output budget producing thinking blocks
    // (common with M3), there is zero text to extract.  Disable thinking
    // and retry — this costs no escalation budget because no usable output
    // was produced.
    if (!content.trim() && withThinking && hasThinkingContent(response)) {
      console.warn(`[pastel-agent] ${model} returned only thinking content — retrying with thinking disabled`);
      withThinking = false;
      continue;
    }

    if (truncated && escalations < MAX_TRUNCATION_RETRIES) {
      // Only escalate when the response actually burned the budget (>=90% of
      // output tokens). Avoids paying a full second call for models that
      // stopped early but reported a truncated finish reason.
      const usage = extractUsage(response);
      const budgetExhausted = usage ? usage.outputTokens >= budget * 0.9 : true;
      if (budgetExhausted) {
        const nextBudget = Math.min(escalationCap(opts.model), Math.ceil(budget * TRUNCATION_SCALE));
        if (nextBudget > budget) {
          console.warn(`[pastel-agent] truncated response from ${model} — escalating output budget ${budget} → ${nextBudget}`);
          budget = nextBudget;
          escalations++;
          continue;
        }
      }
    }
    break;
  }

  if (!content.trim()) {
    const structure = JSON.stringify(response).slice(0, 500);
    console.error(`[pastel-agent] Empty response from ${model}. Response structure: ${structure}`);
    throw new Error(`Empty response from model ${model}`);
  }

  const usage = extractUsage(response!);
  if (opts.onUsage) {
    try {
      opts.onUsage({
        role: opts.model,
        modelId: model,
        inputChars,
        outputChars: content.length,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        imageBlocks,
        ...(usage?.costUsd !== undefined ? { costUsd: usage.costUsd } : {}),
      });
    } catch {
      // usage tracking must never break a call
    }
  }

  return { content, model, inputChars, outputChars: content.length, ...(usage ? { usage } : {}) };
}

function extractTextContent(response: ChatResponse): string {
  const firstContent = response.output?.[0]?.content;
  let content = Array.isArray(firstContent)
    ? firstContent
        .filter((b) => b.type === "text")
        .map((b) => ("text" in b ? b.text : ""))
        .join("")
    : "";

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

  if (!content.trim() && typeof response.output_text === "string") {
    content = response.output_text;
  }

  return content;
}

type ParseResult<T> = { value: T } | { error: Error; kind: "parse" | "validate" };

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

export async function chatJSON<T>(
  messages: ChatMessage[],
  opts: Omit<ChatCallOptions, "responseFormat"> & {
    validate?: JsonValidator<T>;
    /** Receives the raw model output when every attempt has failed — lets callers salvage. */
    onRawFailure?: (content: string) => void;
  },
): Promise<T> {
  const chatOpts: ChatCallOptions = { ...opts, responseFormat: "json_object" };

  const attempt = async (messageSet: ChatMessage[]): Promise<{ result: ParseResult<T>; content: string }> => {
    const { content } = await chat(messageSet, chatOpts);
    return { result: parseAndValidate(content, opts.validate), content };
  };

  const first = await attempt(messages);
  if ("value" in first.result) return first.result.value;

  // Corrective retry for BOTH parse and validation failures. The model's
  // broken output is included as an assistant turn so it can see exactly
  // what it must repair.
  const kind = first.result.kind;
  const errMsg = first.result.error.message;
  const correctiveMessages: ChatMessage[] = [
    ...messages,
    { role: "assistant", content: first.content },
    {
      role: "user",
      content: kind === "validate"
        ? `Your previous response was valid JSON but failed this validation:\n${errMsg}\n\nFix the JSON so it satisfies the expected schema exactly — include every required item and field. Output ONLY the corrected JSON. No markdown, no code fences, no explanations.`
        : `Your previous response could not be parsed as JSON. Output the SAME content as a single valid JSON document — no markdown, no code fences, no prose before or after the JSON.`,
    },
  ];

  let second: { result: ParseResult<T>; content: string } | null = null;
  try {
    second = await attempt(correctiveMessages);
  } catch (err) {
    console.warn(`[pastel-agent] corrective retry failed for model ${chatOpts.model}:`, err instanceof Error ? err.message : err);
  }
  if (second && "value" in second.result) return second.result.value;

  const finalResult = second && "error" in second.result ? second.result : first.result;
  try {
    opts.onRawFailure?.(second?.content ?? first.content);
  } catch {
    // salvage hook must never break the flow
  }
  if (finalResult.kind === "validate") {
    console.error(`[pastel-agent] JSON validation failed. Model: ${chatOpts.model}. Validation error: ${finalResult.error.message}`);
    throw new Error(`AI returned JSON that failed validation. Model: ${chatOpts.model}. Validation error: ${finalResult.error.message}`);
  }
  const preview = finalResult.error.message;
  console.error(`[pastel-agent] JSON parse failed. Model: ${chatOpts.model}. First 300 chars: ${preview}`);
  throw new Error(`AI returned non-JSON response. Model: ${chatOpts.model}. First 300 chars: ${preview}`);
}

export async function chatText(
  messages: ChatMessage[],
  opts: Omit<ChatCallOptions, "responseFormat">,
): Promise<string> {
  const { content } = await chat(messages, { ...opts, responseFormat: "text" });
  return content.trim();
}

export function extractFencedBlock(doc: string, lang: string): string | null {
  const re = new RegExp("```" + lang + "\\s*\\n([\\s\\S]*?)\\n```", "i");
  const match = doc.match(re);
  return match ? match[1].trim() : null;
}

export function repairJSON(raw: string): string {
  let s = raw.trim();
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

  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, inner) => {
    return `"${inner.replace(/"/g, '\\"')}"`;
  });
  s = s.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  s = s.replace(/:\s*NaN\b/g, ": null");
  s = s.replace(/:\s*Infinity\b/g, ": null");
  s = s.replace(/:\s*-Infinity\b/g, ": null");
  s = s.replace(/,\s*([}\]])/g, "$1");

  let depth = 0;
  let lastBalancedEnd = -1;
  let inString = false;
  let escapeNext = false;
  const stack: string[] = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (inString) {
      if (ch === "\\") { escapeNext = true; }
      else if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{" || ch === "[") { depth++; stack.push(ch); }
    else if (ch === "}" || ch === "]") {
      depth--;
      stack.pop();
      if (depth === 0) { lastBalancedEnd = i; }
    }
  }

  if (lastBalancedEnd === -1) {
    s = s.replace(/,\s*$/, "");
    if (inString) {
      if (escapeNext) s = s.slice(0, -1);
      s += '"';
    }
    const closer: Record<string, string> = { "{": "}", "[": "]" };
    for (let i = stack.length - 1; i >= 0; i--) {
      s += closer[stack[i]];
    }
    return s;
  }

  let extracted = s.slice(0, lastBalancedEnd + 1);
  extracted = extracted.replace(/,\s*([}\]])/g, "$1");
  extracted = extracted.replace(/,\s*$/, "");
  return extracted;
}

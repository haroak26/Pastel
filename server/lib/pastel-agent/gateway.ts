import { MergeGateway } from "merge-gateway-sdk";

/**
 * Multi-model gateway for the Pastel Agent loop.
 *
 * Each pipeline role uses a dedicated model (all served through
 * the Merge Gateway API). Override any via env:
 *   PASTEL_MODEL_CLARIFY, PASTEL_MODEL_TITLE, PASTEL_MODEL_BRIEF,
 *   PASTEL_MODEL_PLAN, PASTEL_MODEL_CODE.
 */
export const MODELS = {
  clarify: process.env.PASTEL_MODEL_CLARIFY || "openai/gpt-5.4-nano",
  title: process.env.PASTEL_MODEL_TITLE || "mistral/mistral-small-4",
  brief: process.env.PASTEL_MODEL_BRIEF || "openai/gpt-5.4-mini",
  plan: process.env.PASTEL_MODEL_PLAN || "anthropic/claude-sonnet-5",
  code: process.env.PASTEL_MODEL_CODE || "openai/gpt-5.6-terra",
} as const;

export type ModelRole = keyof typeof MODELS;

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
  content: string;
}

export interface ChatCallOptions {
  model: ModelRole;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
}

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

  const inputChars = messages.reduce((s, m) => s + m.content.length, 0);

  const response = await client.responses.create({
    model,
    input: messages.map((m) => ({ type: "message" as const, ...m })),
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 2000,
    response_format:
      opts.responseFormat === "json_object"
        ? { type: "json_object" }
        : undefined,
  });

  const content =
    response.output?.[0]?.content
      ?.filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("") ?? "";

  if (!content.trim()) {
    throw new Error(`Empty response from model ${model}`);
  }
  return { content, model, inputChars, outputChars: content.length };
}

/** Call a model expecting a JSON object response, with repair on malformed output. */
export async function chatJSON<T>(
  messages: ChatMessage[],
  opts: Omit<ChatCallOptions, "responseFormat">,
): Promise<T> {
  const { content, model } = await chat(messages, {
    ...opts,
    responseFormat: "json_object",
  });

  let jsonStr = content.trim();

  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    const repaired = repairJSON(jsonStr);
    if (repaired !== jsonStr) {
      try {
        return JSON.parse(repaired) as T;
      } catch {
        // fall through to error
      }
    }

    const preview = jsonStr.slice(0, 300);
    throw new Error(
      `AI returned non-JSON response. Model: ${model}. First 300 chars: ${preview}`,
    );
  }
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

  s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

  if (!s) return raw;

  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  const jsonStart =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBracket
        : Math.min(firstBrace, firstBracket);

  if (jsonStart === -1) return raw;
  s = s.slice(jsonStart);

  let depth = 0;
  let lastBalancedEnd = -1;
  let inString = false;
  let escapeNext = false;

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
    } else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        lastBalancedEnd = i;
      }
    }
  }

  if (lastBalancedEnd === -1) {
    s = s.replace(/,\s*$/, "");

    const openBraces = (s.match(/\{/g) || []).length;
    const closeBraces = (s.match(/\}/g) || []).length;
    const openBrackets = (s.match(/\[/g) || []).length;
    const closeBrackets = (s.match(/\]/g) || []).length;

    s += "}".repeat(Math.max(0, openBraces - closeBraces));
    s += "]".repeat(Math.max(0, openBrackets - closeBrackets));
    return s;
  }

  let extracted = s.slice(0, lastBalancedEnd + 1);

  extracted = extracted.replace(/,\s*([}\]])/g, "$1");
  extracted = extracted.replace(/,\s*$/, "");

  return extracted;
}

import { chat, parseAndValidate, type ChatMessage, type ModelRole, type OnUsage } from "../gateway";

/**
 * Maxi Agent v25 — injectable model chat.
 *
 * Every v25 agent takes a `chat` function instead of importing the gateway
 * directly. Production wires `gatewayModelChat()`; the deterministic test
 * suite injects a stub — "test without real model call" is a first-class
 * property of the architecture, not a mock layer bolted on top.
 *
 * The injected shape is deliberately narrow: messages in, raw string out
 * (json mode is a response-format hint, not a parse guarantee). JSON
 * parsing + the ONE corrective retry live here so every agent gets the
 * same retry semantics against any chat implementation.
 */

export interface ModelChatOptions {
  model: ModelRole;
  temperature?: number;
  maxTokens?: number;
  /** Ask the backend for a JSON response format (the caller still parses). */
  json?: boolean;
  onUsage?: OnUsage;
}

/** The single injection point every v25 agent codes against. */
export type ModelChat = (messages: ChatMessage[], opts: ModelChatOptions) => Promise<string>;

/** Production chat: wraps the shared gateway (retries, usage, escalation). */
export function gatewayModelChat(): ModelChat {
  return async (messages, opts) => {
    const { content } = await chat(messages, {
      model: opts.model,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      responseFormat: opts.json ? "json_object" : "text",
      onUsage: opts.onUsage,
    });
    return content;
  };
}

export interface CallJSONOptions {
  model: ModelRole;
  maxTokens: number;
  temperature?: number;
  onUsage?: OnUsage;
  /** zod-style validation — anything that throws on bad input works. */
  validate: (value: unknown) => unknown;
}

/**
 * JSON call with ONE corrective retry: the model's broken output is fed
 * back as an assistant turn with the exact validation error. Mirrors the
 * gateway's own chatJSON semantics but against the injectable chat, so
 * stubbed tests exercise the real retry path.
 */
export async function callJSON(chatFn: ModelChat, messages: ChatMessage[], opts: CallJSONOptions): Promise<unknown> {
  const raw = await chatFn(messages, {
    model: opts.model,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
    json: true,
    onUsage: opts.onUsage,
  });
  const first = parseAndValidate(raw, opts.validate);
  if ("value" in first) return first.value;

  const kind = first.kind;
  const errMsg = first.error.message;
  const corrective: ChatMessage[] = [
    ...messages,
    { role: "assistant", content: raw },
    {
      role: "user",
      content:
        kind === "validate"
          ? `Your previous response was valid JSON but failed validation:\n${errMsg}\n\nFix the JSON so it satisfies the expected schema exactly — include every required item and field. Output ONLY the corrected JSON. No markdown, no code fences, no explanations.`
          : `Your previous response could not be parsed as JSON. Output the SAME content as a single valid JSON document — no markdown, no code fences, no prose before or after the JSON.`,
    },
  ];
  const secondRaw = await chatFn(corrective, {
    model: opts.model,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
    json: true,
    onUsage: opts.onUsage,
  });
  const second = parseAndValidate(secondRaw, opts.validate);
  if ("value" in second) return second.value;
  throw second.error;
}

/** Plain text call — no parsing, no retry (callers add their own). */
export async function callText(chatFn: ModelChat, messages: ChatMessage[], opts: Omit<CallJSONOptions, "validate">): Promise<string> {
  return chatFn(messages, {
    model: opts.model,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
    onUsage: opts.onUsage,
  });
}

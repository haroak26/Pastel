import { ArtificialGateway } from "artificial-gateway-sdk";
import type { ChatMessage, ChatCompletionContentPart, ChatCompletionChunk } from "artificial-gateway-sdk";
import OpenAI from "openai";

const API_KEY = process.env.ARTIFICIAL_GATEWAY_API_KEY;

let _client: ArtificialGateway | null | undefined;
let _poeAI: OpenAI | null | undefined;

function getClient(): ArtificialGateway | null {
  if (_client === undefined)
    _client = API_KEY ? new ArtificialGateway({ apiKey: API_KEY }) : null;
  return _client;
}

function getAgentAI(): ArtificialGateway | null {
  return getClient();
}

function getHaikuAI(): ArtificialGateway | null {
  return getClient();
}

function getAssistantAI(): ArtificialGateway | null {
  return getClient();
}

function getPoeAI(): OpenAI | null {
  if (_poeAI === undefined) {
    const key = process.env.POE_API_KEY;
    if (!key) { _poeAI = null; return null; }
    _poeAI = new OpenAI({
      baseURL: "https://api.poe.com/bot",
      apiKey: key,
      defaultHeaders: { "Authorization": `Bearer ${key}` },
    });
  }
  return _poeAI;
}

function assertClient(client: ArtificialGateway | null, name: string): ArtificialGateway {
  if (!client) throw new Error(`AI unavailable: ${name} — ARTIFICIAL_GATEWAY_API_KEY not configured`);
  return client;
}

const AGENT_MODEL_POE = "claude-sonnet-4-6";
const AGENT_MODEL = "gemma-4-31b";
const HAIKU_MODEL = "mistral/ministral-14b-latest";
const ASSISTANT_MODEL = "openai/gpt-oss-20b";

// ── Per-character charge rates ───────────────────────────────────────────────
// 1 token ≈ 3 chars. These are flat rates charged against user credit.
// Sonnet (agent): $5/1M chars. Haiku (router, assistant, article): $0.50/1M chars.
const SONNET_RATE_PER_CHAR = 0.000005;
const HAIKU_RATE_PER_CHAR  = 0.0000005;

function calcSonnetCost(messages: { role: string; content: string }[], output: string): number {
  const inputChars = messages.reduce((s, m) => s + m.content.length, 0);
  return (inputChars + output.length) * SONNET_RATE_PER_CHAR;
}

function calcHaikuCost(messages: { role: string; content: string }[], output: string): number {
  const inputChars = messages.reduce((s, m) => s + m.content.length, 0);
  return (inputChars + output.length) * HAIKU_RATE_PER_CHAR;
}

// ── Return types ──────────────────────────────────────────────────────────────

export interface AgentChatResult {
  content: string;
  cost: number;
}

export interface AgentToolsResult {
  content?: string;
  toolCalls?: any[];
  cost: number;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
}

function toChatMessages(messages: { role: string; content: string }[]): any[] {
  return messages.map(m => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));
}

// ── Agent (gemma-4-31b via Artificial Gateway — consumes aiCredit) ────────────

export async function agentChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions,
): Promise<AgentChatResult> {
  const poe = getPoeAI();
  if (poe) {
    const response = await poe.chat.completions.create({
      model: AGENT_MODEL_POE,
      messages: toChatMessages(messages),
      temperature: opts?.temperature ?? 0.5,
      max_tokens: opts?.maxTokens ?? 800,
    }) as any;
    const content = response.choices?.[0]?.message?.content ?? "";
    const cost = calcSonnetCost(messages, content);
    return { content, cost };
  }

  const client = assertClient(getAgentAI(), "agent");
  const response = await client.chat.completions.create({
    model: AGENT_MODEL,
    messages: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 800,
    response_format: opts?.responseFormat,
  });
  const content = (response as any).choices?.[0]?.message?.content ?? "";
  const cost = calcSonnetCost(messages, content);
  return { content, cost };
}

export async function agentChatWithAttachments(
  messages: { role: string; content: string }[],
  fileContents: { name: string; content: string }[],
  opts?: ChatOptions,
): Promise<AgentChatResult> {
  const poe = getPoeAI();

  const contentParts: ChatCompletionContentPart[] = [
    { type: "text", text: messages[messages.length - 1].content },
  ];
  for (const file of fileContents) {
    contentParts.push({ type: "text", text: `[File: ${file.name}]\n${file.content}` });
  }

  const allMessages: (ChatMessage | { role: "user"; content: string | ChatCompletionContentPart[] })[] = [
    ...messages.slice(0, -1).map(m => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: contentParts },
  ];

  if (poe) {
    const response = await poe.chat.completions.create({
      model: AGENT_MODEL_POE,
      messages: allMessages as any,
      temperature: opts?.temperature ?? 0.5,
      max_tokens: opts?.maxTokens ?? 1500,
    }) as any;
    const content = response.choices?.[0]?.message?.content ?? "";
    const cost = calcSonnetCost(messages, content);
    return { content, cost };
  }

  const client = assertClient(getAgentAI(), "agent");
  const response = await client.chat.completions.create({
    model: AGENT_MODEL,
    messages: allMessages,
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 1500,
  });
  const content = (response as any).choices?.[0]?.message?.content ?? "";
  const cost = calcSonnetCost(messages, content);
  return { content, cost };
}

export async function agentChatWithTools(
  messages: { role: string; content: string }[],
  tools: any[],
  opts?: ChatOptions,
): Promise<AgentToolsResult> {
  const poe = getPoeAI();

  if (poe) {
    const response = await poe.chat.completions.create({
      model: AGENT_MODEL_POE,
      messages: toChatMessages(messages),
      tools,
      temperature: opts?.temperature ?? 0.5,
      max_tokens: opts?.maxTokens ?? 512,
    }) as any;
    const choice = response.choices?.[0]?.message;
    const content = choice?.content ?? "";
    const cost = calcSonnetCost(messages, content);
    return { content: choice?.content ?? "", toolCalls: choice?.tool_calls, cost };
  }

  const client = assertClient(getAgentAI(), "agent");
  const response = await client.chat.completions.create({
    model: AGENT_MODEL,
    messages: toChatMessages(messages),
    tools,
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 512,
  });
  const choice = (response as any).choices?.[0]?.message;
  const content = choice?.content ?? "";
  const cost = calcSonnetCost(messages, content);
  return { content: choice?.content ?? "", toolCalls: choice?.tool_calls, cost };
}

// ── Router (free, no cost — used for lightweight classification) ──────────────

export async function routerChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions,
): Promise<string> {
  const client = assertClient(getHaikuAI(), "haiku");
  const response = await client.chat.completions.create({
    model: HAIKU_MODEL,
    messages: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 512,
    response_format: opts?.responseFormat,
  });
  return (response as any).choices?.[0]?.message?.content ?? "";
}

// ── Haiku (router, article writer — consumes aiCredit) ───────────────────────

export async function haikuChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions,
): Promise<AgentChatResult> {
  const client = assertClient(getHaikuAI(), "haiku");
  const response = await client.chat.completions.create({
    model: HAIKU_MODEL,
    messages: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 1024,
    response_format: opts?.responseFormat,
  });
  const content = (response as any).choices?.[0]?.message?.content ?? "";
  const cost = calcHaikuCost(messages, content);
  return { content, cost };
}

// ── Assistant (Haiku — consumes assistantCredit) ──────────────────────────────

/** Non-streaming assistant call — returns content + cost */
export async function assistantChatNonStream(
  messages: { role: string; content: string }[],
  opts?: ChatOptions,
): Promise<{ content: string; cost: number }> {
  const client = assertClient(getAssistantAI(), "assistant");
  const response = await client.chat.completions.create({
    model: ASSISTANT_MODEL,
    messages: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 700,
  });
  const content = (response as any).choices?.[0]?.message?.content ?? "";
  const cost = calcHaikuCost(messages, content);
  return { content, cost };
}

/** Streaming assistant call — returns AsyncIterable of chunks */
export async function assistantChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions & { stream?: boolean },
): Promise<string | AsyncIterable<ChatCompletionChunk>> {
  const client = assertClient(getAssistantAI(), "assistant");
  if (opts?.stream) {
    const stream = await client.chat.completions.create({
      model: ASSISTANT_MODEL,
      messages: toChatMessages(messages),
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 900,
      stream: true,
    }) as any;
    return stream as AsyncIterable<ChatCompletionChunk>;
  }

  const response = await client.chat.completions.create({
    model: ASSISTANT_MODEL,
    messages: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 900,
  });
  return (response as any).choices?.[0]?.message?.content ?? "";
}

export async function getEmbedding(text: string): Promise<number[]> {
  const client = assertClient(getAgentAI(), "agent");
  const response = await client.embeddings.create({
    model: "openai/text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data?.[0]?.embedding ?? [];
}

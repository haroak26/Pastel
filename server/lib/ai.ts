import { MergeGateway, type OutputMessage, type ContentBlock } from "merge-gateway-sdk";
import { Stream } from "merge-gateway-sdk";

const API_KEY = process.env.MERGE_GATEWAY_API_KEY;

let _client: MergeGateway | null | undefined;

function getClient(): MergeGateway | null {
  if (_client === undefined)
    _client = API_KEY ? new MergeGateway({ apiKey: API_KEY }) : null;
  return _client;
}

function getAgentAI(): MergeGateway | null {
  return getClient();
}

function getHaikuAI(): MergeGateway | null {
  return getClient();
}

function getAssistantAI(): MergeGateway | null {
  return getClient();
}

function assertClient(client: MergeGateway | null, name: string): MergeGateway {
  if (!client) throw new Error(`AI unavailable: ${name} — MERGE_GATEWAY_API_KEY not configured`);
  return client;
}

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

function toChatMessages(messages: { role: string; content: string }[]): Record<string, unknown>[] {
  return messages.map(m => ({
    type: "message",
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));
}

function extractText(output: OutputMessage[] | undefined): string {
  return (
    output?.[0]?.content
      ?.filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("") ?? ""
  );
}

// ── Agent (gemma-4-31b via Merge Gateway — consumes aiCredit) ────────────────

export async function agentChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions,
): Promise<AgentChatResult> {
  const client = assertClient(getAgentAI(), "agent");
  const response = await client.responses.create({
    model: AGENT_MODEL,
    input: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 800,
    response_format: opts?.responseFormat as Record<string, unknown> | undefined,
  });
  const content = extractText(response.output);
  const cost = calcSonnetCost(messages, content);
  return { content, cost };
}

export async function agentChatWithAttachments(
  messages: { role: string; content: string }[],
  fileContents: { name: string; content: string }[],
  opts?: ChatOptions,
): Promise<AgentChatResult> {
  const contentParts: ContentBlock[] = [
    { type: "text", text: messages[messages.length - 1].content, annotations: [] },
  ];
  for (const file of fileContents) {
    contentParts.push({ type: "text", text: `[File: ${file.name}]\n${file.content}`, annotations: [] });
  }

  const allMessages: Record<string, unknown>[] = [
    ...messages.slice(0, -1).map(m => ({
      type: "message",
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    { type: "message", role: "user", content: contentParts },
  ];

  const client = assertClient(getAgentAI(), "agent");
  const response = await client.responses.create({
    model: AGENT_MODEL,
    input: allMessages,
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 1500,
    response_format: opts?.responseFormat as Record<string, unknown> | undefined,
  });
  const content = extractText(response.output);
  const cost = calcSonnetCost(messages, content);
  return { content, cost };
}

export async function agentChatWithTools(
  messages: { role: string; content: string }[],
  tools: any[],
  opts?: ChatOptions,
): Promise<AgentToolsResult> {
  const client = assertClient(getAgentAI(), "agent");
  const response = await client.responses.create({
    model: AGENT_MODEL,
    input: toChatMessages(messages),
    tools: tools as Record<string, unknown>[],
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 512,
    response_format: opts?.responseFormat as Record<string, unknown> | undefined,
  });
  const content = extractText(response.output);
  const cost = calcSonnetCost(messages, content);
  return { content: content || undefined, toolCalls: undefined, cost };
}

// ── Router (free, no cost — used for lightweight classification) ──────────────

export async function routerChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions,
): Promise<string> {
  const client = assertClient(getHaikuAI(), "haiku");
  const response = await client.responses.create({
    model: HAIKU_MODEL,
    input: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 512,
    response_format: opts?.responseFormat as Record<string, unknown> | undefined,
  });
  return extractText(response.output);
}

// ── Haiku (router, article writer — consumes aiCredit) ───────────────────────

export async function haikuChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions,
): Promise<AgentChatResult> {
  const client = assertClient(getHaikuAI(), "haiku");
  const response = await client.responses.create({
    model: HAIKU_MODEL,
    input: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 1024,
    response_format: opts?.responseFormat as Record<string, unknown> | undefined,
  });
  const content = extractText(response.output);
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
  const response = await client.responses.create({
    model: ASSISTANT_MODEL,
    input: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 700,
    response_format: opts?.responseFormat as Record<string, unknown> | undefined,
  });
  const content = extractText(response.output);
  const cost = calcHaikuCost(messages, content);
  return { content, cost };
}

/** Streaming assistant call — returns SSE stream */
export async function assistantChat(
  messages: { role: string; content: string }[],
  opts?: ChatOptions & { stream?: boolean },
): Promise<string | Stream> {
  const client = assertClient(getAssistantAI(), "assistant");
  if (opts?.stream) {
    const stream = await client.responses.create({
      model: ASSISTANT_MODEL,
      input: toChatMessages(messages),
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 900,
      stream: true,
    });
    return stream as unknown as Stream;
  }

  const response = await client.responses.create({
    model: ASSISTANT_MODEL,
    input: toChatMessages(messages),
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 900,
    response_format: opts?.responseFormat as Record<string, unknown> | undefined,
  });
  return extractText(response.output);
}

export async function getEmbedding(text: string): Promise<number[]> {
  const client = assertClient(getAgentAI(), "agent");
  const response = await client.embeddings.create({
    model: "openai/text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data?.[0]?.embedding as number[] ?? [];
}

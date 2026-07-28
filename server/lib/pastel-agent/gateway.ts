import OpenAI from "openai";

const MODEL = process.env.PASTEL_AGENT_MODEL || "gpt-5.4-mini";

function getGateway(): OpenAI | null {
  const apiKey = process.env.VERCEL_GATEWAY_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: process.env.VERCEL_GATEWAY_BASE_URL || "https://gateway.ai.vercel.com/v1",
    apiKey,
    maxRetries: 1,
    timeout: 30000,
  });
}

function assertGateway(): OpenAI {
  const g = getGateway();
  if (!g) throw new Error("VERCEL_GATEWAY_API_KEY not configured");
  return g;
}

export interface ChatCallOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
}

function toOpenAIMessages(messages: { role: string; content: string }[]) {
  return messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));
}

export interface ChatResult {
  content: string;
}

export async function chat(
  messages: { role: string; content: string }[],
  opts?: ChatCallOptions,
): Promise<ChatResult> {
  const client = assertGateway();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: toOpenAIMessages(messages),
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 800,
    response_format: opts?.responseFormat === "json_object"
      ? { type: "json_object" }
      : undefined,
  } as any);

  const content = response.choices?.[0]?.message?.content ?? "";
  return { content };
}

export async function chatJSON<T>(
  messages: { role: string; content: string }[],
  opts?: Omit<ChatCallOptions, "responseFormat">,
): Promise<T> {
  const { content } = await chat(messages, {
    ...opts,
    responseFormat: "json_object",
  });

  let jsonStr = content.trim();

  // Strip markdown fences if model wraps JSON in them
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    const preview = jsonStr.slice(0, 300);
    throw new Error(`Gateway returned non-JSON response. Model: ${MODEL}. First 300 chars: ${preview}`);
  }
}

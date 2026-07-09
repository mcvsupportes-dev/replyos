/**
 * AI Provider Abstraction
 * Supports: Z.ai (default), OpenAI, Anthropic, Google AI, Custom endpoint
 * Each provider implements the same chat() interface.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  tone?: string;
  length?: "short" | "medium" | "long";
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ChatResult {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
  provider: string;
  model: string;
}

const TONE_PROMPTS: Record<string, string> = {
  friendly: "Be warm, cheerful, and approachable. Use a friendly conversational tone like talking to a good friend.",
  sad: "Respond with gentle melancholy and emotional sensitivity. Use softer, more reflective language.",
  romantic: "Respond with warmth, affection, and tenderness. Use caring and emotionally expressive language.",
  serious: "Be direct, focused, and thoughtful. Keep the tone calm and measured without unnecessary levity.",
  professional: "Be polished and business-appropriate. Use clear, professional language suitable for customer communication.",
  casual: "Be relaxed and informal. Use everyday language as if chatting casually with someone.",
};

const LENGTH_GUIDE: Record<string, string> = {
  short: "Keep the reply to 1-2 sentences. Be concise.",
  medium: "Keep the reply to 2-4 sentences. Balanced detail.",
  long: "Provide a thorough reply of 4-8 sentences with helpful detail.",
};

/**
 * Build the system prompt that makes the AI act like a natural human assistant
 * for WhatsApp business replies.
 */
export function buildSystemPrompt(opts: ChatOptions): string {
  const tone = opts.tone || "friendly";
  const length = opts.length || "medium";

  return [
    "You are ReplyOS, a helpful AI assistant that helps WhatsApp business users write natural, human replies to customer messages.",
    "Your goal is to sound like a real person — simple, clear, and warm. Never sound robotic or overly formal.",
    "You help with: writing replies, summarizing chats, explaining messages, generating automation rules, and answering questions.",
    "Always reply in the same language the user is writing in (Arabic or English).",
    "Do not use markdown formatting (no ** or #). Use plain text suitable for WhatsApp.",
    TONE_PROMPTS[tone] || TONE_PROMPTS.friendly,
    LENGTH_GUIDE[length] || LENGTH_GUIDE.medium,
    "If the user asks you to generate an automation rule, output it in this format: WHEN [condition] THEN [action].",
  ].join(" ");
}

/**
 * Call Z.ai (default provider) via the z-ai-web-dev-sdk available in this environment.
 */
async function callZai(messages: ChatMessage[], opts: ChatOptions): Promise<ChatResult> {
  // Dynamic import so this only runs server-side
  const ZAI = await import("z-ai-web-dev-sdk").then((m) => m.default || m);
  const zai = await ZAI.create();

  const systemPrompt = buildSystemPrompt(opts);
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await zai.chat.completions.create({
    messages: formattedMessages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 800,
    model: opts.model || "glm-4.6",
  });

  return {
    content: response.choices[0]?.message?.content || "",
    provider: "zai",
    model: opts.model || "glm-4.6",
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens || 0,
          completionTokens: response.usage.completion_tokens || 0,
        }
      : undefined,
  };
}

/**
 * Call OpenAI-compatible API (works for OpenAI, Azure, any OpenAI-compatible endpoint).
 */
async function callOpenAICompatible(
  messages: ChatMessage[],
  opts: ChatOptions,
  config: { apiKey: string; baseUrl: string; model: string }
): Promise<ChatResult> {
  const systemPrompt = buildSystemPrompt(opts);
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 800,
  };

  const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI provider error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    provider: "openai-compatible",
    model: config.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
        }
      : undefined,
  };
}

/**
 * Main entry: route to the right provider based on config.
 */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
  providerConfig?: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  }
): Promise<ChatResult> {
  // If user supplied a custom provider config, use it
  if (providerConfig && providerConfig.apiKey && providerConfig.provider !== "zai") {
    return callOpenAICompatible(messages, opts, providerConfig);
  }

  // Default: use Z.ai
  return callZai(messages, opts);
}

import OpenAI from "openai";

/* ------------------------------------------------------------------ */
/*  Lazy singleton                                                     */
/* ------------------------------------------------------------------ */

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;
const MAX_RETRIES = 1;

/* ------------------------------------------------------------------ */
/*  Options                                                            */
/* ------------------------------------------------------------------ */

interface CompletionOptions {
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

/* ------------------------------------------------------------------ */
/*  Text completion                                                    */
/* ------------------------------------------------------------------ */

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: CompletionOptions = {},
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await getOpenAI().chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      return response.choices[0]?.message?.content ?? "";
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[OpenAI] Retry ${attempt + 1} after error:`, err);
      }
    }
  }

  console.error("[OpenAI] All retries exhausted:", lastError);
  throw new Error("Failed to generate AI completion after retries");
}

/* ------------------------------------------------------------------ */
/*  JSON completion (structured output)                                */
/* ------------------------------------------------------------------ */

export async function generateJsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  options: CompletionOptions = {},
): Promise<T> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  const jsonSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanations — just the raw JSON object.`;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await getOpenAI().chat.completions.create({
        model,
        messages: [
          { role: "system", content: jsonSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      return JSON.parse(raw) as T;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[OpenAI JSON] Retry ${attempt + 1} after error:`, err);
      }
    }
  }

  console.error("[OpenAI JSON] All retries exhausted:", lastError);
  throw new Error("Failed to generate AI JSON completion after retries");
}

/* ------------------------------------------------------------------ */
/*  Streaming (used by chat.service.ts)                                */
/* ------------------------------------------------------------------ */

export async function createChatStream(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: CompletionOptions = {},
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 300,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  return getOpenAI().chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });
}

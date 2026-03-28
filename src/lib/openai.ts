/**
 * OpenAI client — gracefully falls back when OPENAI_API_KEY is not set.
 */
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const isOpenAIAvailable = (): boolean =>
  Boolean(process.env.OPENAI_API_KEY);

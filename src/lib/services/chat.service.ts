import type OpenAI from "openai";
import { buildSystemPrompt } from "@/lib/chat-context";
import { createChatStream } from "@/lib/services/openai.service";
import type { ChatMessage } from "@/lib/validations/chat.schema";

export async function streamChatResponse(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = await buildSystemPrompt();

  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await createChatStream(openaiMessages, { maxTokens: 300 });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Chat stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

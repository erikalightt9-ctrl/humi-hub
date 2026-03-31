import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { chatMessageSchema } from "@/lib/validations/chat.schema";
import { streamChatResponse, streamChatResponseWithRole } from "@/lib/services/chat.service";
import { faqFallbackResponse, isRelevantQuestion } from "@/lib/services/chat-fallback.service";

// Simple in-memory rate limiter (per IP, 10 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  rateLimitMap.set(ip, { count: entry.count + 1, resetAt: entry.resetAt });
  return false;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

/** Stream a plain text answer word-by-word for a natural typing effect */
function streamTextAnswer(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const words = text.split(" ");
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          const chunk = (i === 0 ? "" : " ") + words[i];
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
          i++;
        } else {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          clearInterval(interval);
        }
      }, 30);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Too many requests. Please wait a moment before sending another message.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = chatMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error.issues[0]?.message ?? "Invalid input",
        },
        { status: 400 }
      );
    }

    const lastMessage = result.data.messages[result.data.messages.length - 1];
    const userText = lastMessage?.content ?? "";

    // ── Relevance Check ──────────────────────────────────────────────────────
    // If the question is not about the platform, signal the widget to escalate
    if (!isRelevantQuestion(userText)) {
      return NextResponse.json({ escalate: true }, { status: 200 });
    }

    // ── FAQ Fallback (no OpenAI key) ─────────────────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
      const answer = faqFallbackResponse(userText);
      return streamTextAnswer(answer);
    }

    // ── OpenAI Streaming ─────────────────────────────────────────────────────
    try {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const role = token?.role as string | undefined;
      const currentPage = body.currentPage as string | undefined;

      const stream = role
        ? await streamChatResponseWithRole(result.data.messages, role, currentPage)
        : await streamChatResponse(result.data.messages);

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (openaiError) {
      // OpenAI unavailable — fall back to FAQ response
      console.warn("OpenAI unavailable, using FAQ fallback:", openaiError);
      const answer = faqFallbackResponse(userText);
      return streamTextAnswer(answer);
    }
  } catch (error) {
    console.error("Chat API error:", error);
    // Last-resort: return a helpful message instead of a generic error
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Sorry, I couldn't process your message. Please try again or visit /contact for help.",
      },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const POLL_INTERVAL_MS = 2000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const actor = getActorFromToken(token);
  if (!actor) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: conversationId } = await params;

  // Verify participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, actorType: actor.actorType, actorId: actor.actorId },
  });
  if (!participant) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat so the client knows the connection is live
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Track the latest message timestamp seen so we only push new ones
      let lastSeenAt = new Date();

      while (!request.signal.aborted) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (request.signal.aborted) break;

        try {
          const newMessages = await prisma.directMessage.findMany({
            where: { conversationId, createdAt: { gt: lastSeenAt } },
            include: {
              reads: { select: { actorType: true, actorId: true } },
            },
            orderBy: { createdAt: "asc" },
          });

          if (newMessages.length > 0) {
            lastSeenAt = newMessages[newMessages.length - 1].createdAt;
            const payload = JSON.stringify(
              newMessages.map((m) => ({
                ...m,
                createdAt: m.createdAt.toISOString(),
              }))
            );
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch {
          // DB error — close stream gracefully
          break;
        }
      }

      try { controller.close(); } catch { /* already closed */ }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

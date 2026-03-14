import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import { createConversationSchema } from "@/lib/validations/messaging.schema";
import * as messagingService from "@/lib/services/messaging.service";
import * as messagingRepo from "@/lib/repositories/messaging.repository";

/* ------------------------------------------------------------------ */
/*  POST — Create conversation                                         */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createConversationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const { type, title, courseId, lessonId, participantIds, initialMessage } = result.data;

    let conversation;
    if (type === "DIRECT" && participantIds.length === 1) {
      conversation = await messagingService.getOrCreateDirectConversation(
        actor,
        participantIds[0]
      );
    } else {
      conversation = await messagingService.createGroupConversation({
        type,
        title,
        courseId,
        lessonId,
        createdByType: actor.actorType,
        createdById: actor.actorId,
        participantIds,
      });
    }

    if (initialMessage) {
      await messagingService.sendMessage(
        conversation.id,
        actor.actorType,
        actor.actorId,
        initialMessage
      );
    }

    return NextResponse.json({ success: true, data: conversation, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages/conversations]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET — List my conversations                                        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;

    const conversations = await messagingRepo.getConversations(
      actor.actorType,
      actor.actorId,
      page,
      limit
    );

    return NextResponse.json({ success: true, data: conversations, error: null });
  } catch (err) {
    console.error("[GET /api/messages/conversations]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

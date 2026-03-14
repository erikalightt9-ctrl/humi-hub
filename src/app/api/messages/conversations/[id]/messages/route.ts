import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import { sendMessageSchema } from "@/lib/validations/messaging.schema";
import * as messagingService from "@/lib/services/messaging.service";
import * as messagingRepo from "@/lib/repositories/messaging.repository";

/* ------------------------------------------------------------------ */
/*  POST — Send message                                                */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify participant
    const conversation = await messagingRepo.getConversationById(id);
    if (!conversation) {
      return NextResponse.json({ success: false, data: null, error: "Conversation not found" }, { status: 404 });
    }
    const isParticipant = conversation.participants.some(
      (p) => p.actorType === actor.actorType && p.actorId === actor.actorId
    );
    if (!isParticipant) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const message = await messagingService.sendMessage(
      id,
      actor.actorType,
      actor.actorId,
      result.data.content,
      result.data.attachmentUrl,
      result.data.attachmentName
    );

    return NextResponse.json({ success: true, data: message, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/messages/conversations/[id]/messages]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET — List messages (paginated)                                    */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

    const messages = await messagingRepo.getMessages(id, page, limit);

    return NextResponse.json({ success: true, data: messages, error: null });
  } catch (err) {
    console.error("[GET /api/messages/conversations/[id]/messages]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

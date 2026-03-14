import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import * as messagingRepo from "@/lib/repositories/messaging.repository";

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
    const conversation = await messagingRepo.getConversationById(id);
    if (!conversation) {
      return NextResponse.json({ success: false, data: null, error: "Conversation not found" }, { status: 404 });
    }

    // Verify participant
    const isParticipant = conversation.participants.some(
      (p) => p.actorType === actor.actorType && p.actorId === actor.actorId
    );
    if (!isParticipant && actor.actorType !== "ADMIN") {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: conversation, error: null });
  } catch (err) {
    console.error("[GET /api/messages/conversations/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

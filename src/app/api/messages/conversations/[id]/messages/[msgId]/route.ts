import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import * as messagingRepo from "@/lib/repositories/messaging.repository";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id, msgId } = await params;

    // Verify conversation exists and actor is a participant
    const conversation = await messagingRepo.getConversationById(id);
    if (!conversation) {
      return NextResponse.json({ success: false, data: null, error: "Conversation not found" }, { status: 404 });
    }
    if (actor.tenantId && conversation.tenantId && conversation.tenantId !== actor.tenantId) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    const isParticipant = conversation.participants.some(
      (p) => p.actorType === actor.actorType && p.actorId === actor.actorId
    );
    if (!isParticipant) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }

    await messagingRepo.softDeleteMessage(msgId, actor.actorType, actor.actorId);

    return NextResponse.json({ success: true, data: { deleted: true }, error: null });
  } catch (err) {
    console.error("[DELETE /api/messages/conversations/[id]/messages/[msgId]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

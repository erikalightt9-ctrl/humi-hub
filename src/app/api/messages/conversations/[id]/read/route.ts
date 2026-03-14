import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import * as messagingRepo from "@/lib/repositories/messaging.repository";

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
    await messagingRepo.markConversationRead(id, actor.actorType, actor.actorId);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[POST /api/messages/conversations/[id]/read]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

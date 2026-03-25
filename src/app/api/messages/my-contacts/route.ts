import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import * as messagingRepo from "@/lib/repositories/messaging.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const contacts = await messagingRepo.getSavedContacts(
      actor.actorType,
      actor.actorId,
      actor.tenantId
    );

    return NextResponse.json({ success: true, data: contacts, error: null });
  } catch (err) {
    console.error("[GET /api/messages/my-contacts]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

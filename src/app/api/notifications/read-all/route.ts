import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import * as notificationRepo from "@/lib/repositories/notification.repository";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    await notificationRepo.markAllAsRead(actor.actorType, actor.actorId);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[POST /api/notifications/read-all]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

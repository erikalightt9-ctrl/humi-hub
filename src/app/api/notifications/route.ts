import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import * as notificationRepo from "@/lib/repositories/notification.repository";

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

    const notifications = await notificationRepo.findByRecipient(
      actor.actorType,
      actor.actorId,
      { page, limit }
    );

    return NextResponse.json({ success: true, data: notifications, error: null });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

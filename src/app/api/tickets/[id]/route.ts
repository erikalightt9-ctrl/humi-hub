import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import * as ticketRepo from "@/lib/repositories/support-ticket.repository";

/* ------------------------------------------------------------------ */
/*  GET — Ticket detail                                                */
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
    const ticket = await ticketRepo.findTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, data: null, error: "Ticket not found" }, { status: 404 });
    }

    // Only submitter or admin can view
    const isSubmitter = ticket.submitterType === actor.actorType && ticket.submitterId === actor.actorId;
    if (!isSubmitter && actor.actorType !== "ADMIN") {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }

    // Non-admin users shouldn't see internal notes
    const responses = actor.actorType === "ADMIN"
      ? ticket.responses
      : ticket.responses.filter((r) => !r.isInternal);

    return NextResponse.json({
      success: true,
      data: { ...ticket, responses },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/tickets/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

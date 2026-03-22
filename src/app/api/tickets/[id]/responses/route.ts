import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import { respondToTicketSchema } from "@/lib/validations/support-ticket.schema";
import * as ticketService from "@/lib/services/support-ticket.service";
import * as ticketRepo from "@/lib/repositories/support-ticket.repository";

/* ------------------------------------------------------------------ */
/*  POST — Add response to ticket                                     */
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
    const ticket = await ticketRepo.findTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, data: null, error: "Ticket not found" }, { status: 404 });
    }

    // Only submitter or admin can respond
    const isSubmitter = ticket.submitterType === actor.actorType && ticket.submitterId === actor.actorId;
    if (!isSubmitter && actor.actorType !== "ADMIN") {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = respondToTicketSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    // Only admin can post internal notes
    const isInternal = actor.actorType === "ADMIN" ? result.data.isInternal : false;

    const response = await ticketService.addResponse(id, {
      authorType: actor.actorType,
      authorId: actor.actorId,
      content: result.data.content,
      isInternal,
      attachments: result.data.attachments,
    });

    return NextResponse.json({ success: true, data: response, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tickets/[id]/responses]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getActorFromToken } from "@/lib/auth-helpers";
import { createTicketSchema } from "@/lib/validations/support-ticket.schema";
import * as ticketService from "@/lib/services/support-ticket.service";
import * as ticketRepo from "@/lib/repositories/support-ticket.repository";

/* ------------------------------------------------------------------ */
/*  POST — Create a support ticket                                     */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createTicketSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const ticket = await ticketService.createTicket({
      ...result.data,
      submitterType: actor.actorType,
      submitterId: actor.actorId,
    });

    return NextResponse.json({ success: true, data: ticket, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/tickets]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET — List my tickets                                              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const tickets = await ticketRepo.findTickets({
      submitterType: actor.actorType,
      submitterId: actor.actorId,
      status: (searchParams.get("status") as never) ?? undefined,
      category: (searchParams.get("category") as never) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    return NextResponse.json({ success: true, data: tickets, error: null });
  } catch (err) {
    console.error("[GET /api/tickets]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

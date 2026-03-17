import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { updateTicketStatusSchema } from "@/lib/validations/support-ticket.schema";
import * as ticketRepo from "@/lib/repositories/support-ticket.repository";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const result = updateTicketStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const ticket = await ticketRepo.updateTicketStatus(id, result.data);
    return NextResponse.json({ success: true, data: ticket, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/tickets/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

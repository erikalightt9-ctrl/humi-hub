import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import * as ticketRepo from "@/lib/repositories/support-ticket.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const tickets = await ticketRepo.findTickets({
      status: (searchParams.get("status") as never) ?? undefined,
      category: (searchParams.get("category") as never) ?? undefined,
      priority: (searchParams.get("priority") as never) ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    return NextResponse.json({ success: true, data: tickets, error: null });
  } catch (err) {
    console.error("[GET /api/admin/tickets]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

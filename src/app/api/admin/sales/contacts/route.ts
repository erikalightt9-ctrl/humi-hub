import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  listContacts,
  createContact,
} from "@/lib/repositories/crm.repository";
import { CrmContactType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const search      = searchParams.get("search")      ?? undefined;
    const contactType = searchParams.get("contactType") ?? undefined;
    const page        = searchParams.get("page")  ? Number(searchParams.get("page"))  : undefined;
    const limit       = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const result = await listContacts(guard.tenantId, {
      search,
      contactType: contactType as CrmContactType | undefined,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/sales/contacts]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "name is required" },
        { status: 400 }
      );
    }

    const contact = await createContact(guard.tenantId, {
      name:        body.name,
      email:       body.email       ?? undefined,
      phone:       body.phone       ?? undefined,
      company:     body.company     ?? undefined,
      position:    body.position    ?? undefined,
      contactType: body.contactType ?? undefined,
      notes:       body.notes       ?? undefined,
    });

    return NextResponse.json({ success: true, data: contact, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sales/contacts]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

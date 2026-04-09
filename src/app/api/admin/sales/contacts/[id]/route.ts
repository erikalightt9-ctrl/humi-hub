import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getContactById,
  updateContact,
  deleteContact,
} from "@/lib/repositories/crm.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const contact = await getContactById(guard.tenantId, (await params).id);
    if (!contact) {
      return NextResponse.json(
        { success: false, data: null, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contact, error: null });
  } catch (err) {
    console.error("[GET /api/admin/sales/contacts/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    const contact = await updateContact(guard.tenantId, (await params).id, {
      name:        body.name        ?? undefined,
      email:       body.email       ?? undefined,
      phone:       body.phone       ?? undefined,
      company:     body.company     ?? undefined,
      position:    body.position    ?? undefined,
      contactType: body.contactType ?? undefined,
      notes:       body.notes       ?? undefined,
    });

    return NextResponse.json({ success: true, data: contact, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/sales/contacts/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Contact not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    await deleteContact(guard.tenantId, (await params).id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/sales/contacts/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Contact not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}

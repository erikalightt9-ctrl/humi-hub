import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
});

/**
 * GET /api/admin/profile
 * Returns the current admin's profile (name, email).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!admin) {
    return NextResponse.json({ success: false, data: null, error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: admin, error: null });
}

/**
 * PATCH /api/admin/profile
 * Updates the current admin's name.
 * Body: { name: string }
 */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 422 },
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!admin) {
    return NextResponse.json({ success: false, data: null, error: "Admin not found" }, { status: 404 });
  }

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { name: result.data.name },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ success: true, data: updated, error: null });
}

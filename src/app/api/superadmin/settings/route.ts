import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

function requireSuperAdmin(token: Awaited<ReturnType<typeof getToken>>) {
  if (!(token as { isSuperAdmin?: boolean } | null)?.isSuperAdmin) {
    return NextResponse.json(
      { success: false, data: null, error: "Forbidden" },
      { status: 403 },
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  GET — return current platform settings (upsert singleton row)      */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const denied = requireSuperAdmin(token);
    if (denied) return denied;

    const settings = await prisma.platformSettings.upsert({
      where:  { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    });

    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/settings]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — update platform settings                                   */
/* ------------------------------------------------------------------ */

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const denied = requireSuperAdmin(token);
    if (denied) return denied;

    const body = await request.json();

    const allowed = ["siteName", "timezone", "currency", "language"] as const;
    type AllowedKey = typeof allowed[number];

    const data: Partial<Record<AllowedKey, string>> = {};
    for (const key of allowed) {
      if (typeof body[key] === "string" && body[key].trim() !== "") {
        data[key] = body[key].trim();
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: "No valid fields to update" },
        { status: 422 },
      );
    }

    const updated = await prisma.platformSettings.upsert({
      where:  { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data },
      update: data,
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/superadmin/settings]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

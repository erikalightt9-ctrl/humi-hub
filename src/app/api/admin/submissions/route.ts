import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPendingSubmissions } from "@/lib/repositories/assignment.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const submissions = await getPendingSubmissions();
    return NextResponse.json({ success: true, data: submissions, error: null });
  } catch (err) {
    console.error("[GET /api/admin/submissions]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

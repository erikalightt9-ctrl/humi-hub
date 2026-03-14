import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateArticleSchema } from "@/lib/validations/knowledge-base.schema";
import * as kbService from "@/lib/services/knowledge-base.service";

/* ------------------------------------------------------------------ */
/*  PUT — Update article                                               */
/* ------------------------------------------------------------------ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateArticleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const article = await kbService.updateArticle(id, result.data);
    return NextResponse.json({ success: true, data: article, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/knowledge-base/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Delete article                                            */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: _request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await kbService.deleteArticle(id);
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/knowledge-base/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

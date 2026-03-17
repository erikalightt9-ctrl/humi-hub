import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { createArticleSchema } from "@/lib/validations/knowledge-base.schema";
import * as kbService from "@/lib/services/knowledge-base.service";

/* ------------------------------------------------------------------ */
/*  GET — List all articles (admin)                                    */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as never ?? undefined;

    const articles = await kbService.getArticles({ category });

    return NextResponse.json({ success: true, data: articles, error: null });
  } catch (err) {
    console.error("[GET /api/admin/knowledge-base]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create article                                              */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const result = createArticleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const article = await kbService.createArticle({
      ...result.data,
      createdBy: token!.id as string,
    });

    return NextResponse.json({ success: true, data: article, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/knowledge-base]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

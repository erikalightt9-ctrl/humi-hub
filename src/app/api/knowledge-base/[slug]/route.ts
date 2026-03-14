import { NextRequest, NextResponse } from "next/server";
import * as kbService from "@/lib/services/knowledge-base.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await kbService.getArticleBySlug(slug);

    if (!article || !article.isPublished) {
      return NextResponse.json({ success: false, data: null, error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: article, error: null });
  } catch (err) {
    console.error("[GET /api/knowledge-base/[slug]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

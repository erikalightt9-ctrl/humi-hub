import { NextRequest, NextResponse } from "next/server";
import * as kbService from "@/lib/services/knowledge-base.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as never ?? undefined;
    const search = searchParams.get("search");

    if (search) {
      const articles = await kbService.searchArticles(search, true);
      return NextResponse.json({ success: true, data: articles, error: null });
    }

    const articles = await kbService.getArticles({
      category,
      isPublished: true,
    });

    return NextResponse.json({ success: true, data: articles, error: null });
  } catch (err) {
    console.error("[GET /api/knowledge-base]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

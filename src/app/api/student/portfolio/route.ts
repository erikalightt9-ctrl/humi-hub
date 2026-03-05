import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPortfolioData, updatePortfolioVisibility } from "@/lib/repositories/portfolio.repository";
import { portfolioVisibilitySchema } from "@/lib/validations/portfolio.schema";

/* ------------------------------------------------------------------ */
/*  GET — Authenticated student's portfolio data                       */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await getPortfolioData(token.id as string);
    if (!data) {
      return NextResponse.json(
        { success: false, data: null, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    console.error("[GET /api/student/portfolio]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Toggle portfolio visibility                                */
/* ------------------------------------------------------------------ */

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = portfolioVisibilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid input" },
        { status: 400 }
      );
    }

    const result = await updatePortfolioVisibility(token.id as string, parsed.data.isPublic);

    return NextResponse.json({
      success: true,
      data: { isPublic: result.portfolioPublic },
      error: null,
    });
  } catch (err) {
    console.error("[PATCH /api/student/portfolio]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { generateDocument } from "@/lib/services/ai-business-assistant.service";
import { generateDocumentSchema } from "@/lib/validations/ai-business.schema";

/* ------------------------------------------------------------------ */
/*  POST — Generate a business document                                */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = generateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: parsed.error.issues[0]?.message ?? "Invalid request",
        },
        { status: 400 },
      );
    }

    const document = await generateDocument(parsed.data);

    return NextResponse.json({
      success: true,
      data: document,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/business-assistant]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

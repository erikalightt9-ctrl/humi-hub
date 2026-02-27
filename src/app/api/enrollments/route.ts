import { NextRequest, NextResponse } from "next/server";
import { enrollmentSchema } from "@/lib/validations/enrollment.schema";
import { processEnrollment } from "@/lib/services/enrollment.service";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const result = enrollmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const ip = getClientIp(request);
    const outcome = await processEnrollment(result.data, ip);

    if (!outcome.success) {
      const statusMap = {
        DUPLICATE_EMAIL: 409,
        RATE_LIMITED: 429,
        VALIDATION_ERROR: 422,
      };
      return NextResponse.json(
        { success: false, data: null, error: outcome.message },
        { status: statusMap[outcome.code] }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: outcome.enrollment.id },
        error: null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/enrollments]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

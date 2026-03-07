import { NextRequest, NextResponse } from "next/server";
import { activationSchema } from "@/lib/validations/activation.schema";
import { activateStudentAccount } from "@/lib/services/verification.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = activationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Validation error" },
        { status: 422 }
      );
    }

    const activateResult = await activateStudentAccount(
      result.data.token,
      result.data.password
    );

    if (!activateResult.success) {
      const statusMap: Record<string, number> = {
        invalid: 404,
        expired: 410,
        already_activated: 409,
      };

      return NextResponse.json(
        { success: false, data: null, error: activateResult.error },
        { status: statusMap[activateResult.error] ?? 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: null, error: null },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/activate]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

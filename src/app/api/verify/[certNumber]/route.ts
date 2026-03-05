import { NextRequest, NextResponse } from "next/server";
import { getCertificateByNumber } from "@/lib/repositories/certificate.repository";
import { certNumberSchema } from "@/lib/validations/verify.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  try {
    const { certNumber } = await params;

    const parsed = certNumberSchema.safeParse(certNumber);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid certificate number" },
        { status: 400 }
      );
    }

    const cert = await getCertificateByNumber(parsed.data);
    if (!cert) {
      return NextResponse.json(
        { success: false, data: null, error: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        studentName: cert.student.name,
        courseTitle: cert.course.title,
        issuedAt: cert.issuedAt.toISOString(),
        certNumber: cert.certNumber,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/verify/[certNumber]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

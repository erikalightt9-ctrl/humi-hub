import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MIN_DIMENSION = 300;
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) return jsonError("Unauthorized", 401);

  try {
    const formData = await request.formData();
    const file = formData.get("photo");

    if (!file || !(file instanceof File)) {
      return jsonError("No photo file provided", 422);
    }

    // Validate MIME type
    if (!ALLOWED_MIME.has(file.type)) {
      return jsonError("Only JPG and PNG images are allowed", 422);
    }

    // Validate file size
    if (file.size > MAX_BYTES) {
      return jsonError("Image must be smaller than 2 MB", 422);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate dimensions and aspect ratio using sharp
    const metadata = await sharp(buffer).metadata();
    const { width = 0, height = 0 } = metadata;

    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      return jsonError(
        `Image must be at least ${MIN_DIMENSION}×${MIN_DIMENSION} pixels`,
        422
      );
    }

    const ratio = width / height;
    if (ratio < 0.85 || ratio > 1.15) {
      return jsonError(
        "Image must be square (1:1 aspect ratio). Please crop it before uploading.",
        422
      );
    }

    // Resize to 400×400 for storage efficiency, convert to JPEG
    const processed = await sharp(buffer)
      .resize(400, 400, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64 = `data:image/jpeg;base64,${processed.toString("base64")}`;

    return NextResponse.json(
      { success: true, data: { photoUrl: base64 }, error: null },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/student/resume/photo]", err);
    return jsonError("Failed to process image", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { put } from "@vercel/blob";
import { getActorFromToken } from "@/lib/auth-helpers";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

/**
 * POST /api/tickets/upload
 *
 * Accepts a multipart form upload of a single file and returns the
 * public blob URL, original filename, size and mimeType.
 *
 * Body: FormData with a "file" field.
 * Response: { url, name, size, mimeType }
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, data: null, error: "No file provided" },
        { status: 400 }
      );
    }

    const fileName = (file as File).name ?? "attachment";
    const mimeType = file.type || "application/octet-stream";

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, data: null, error: "File exceeds 10 MB limit" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, data: null, error: "File type not allowed" },
        { status: 400 }
      );
    }

    const blobPath = `tickets/${actor.actorType}/${actor.actorId}/${Date.now()}-${fileName}`;
    const blob = await put(blobPath, file, { access: "public" });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        name: fileName,
        size: file.size,
        mimeType,
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/tickets/upload]", err);
    return NextResponse.json({ success: false, data: null, error: "Upload failed" }, { status: 500 });
  }
}

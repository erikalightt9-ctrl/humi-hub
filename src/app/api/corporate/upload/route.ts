import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/* ------------------------------------------------------------------ */
/*  POST — upload an image                                            */
/*  Accepts: multipart/form-data with field "file"                    */
/*  Validates: jpeg, png, webp, svg — max 2 MB                       */
/*  Returns: { url }                                                  */
/* ------------------------------------------------------------------ */

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function requireCorporateAuth(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return { error: "Unauthorized", status: 401, organizationId: null };

  const role = token.role as string;
  if (role !== "corporate" && role !== "tenant_admin") {
    return { error: "Forbidden", status: 403, organizationId: null };
  }

  const organizationId = (token as { organizationId?: string | null }).organizationId;
  if (!organizationId) return { error: "No organization associated with this account", status: 403, organizationId: null };

  return { error: null, status: 200, organizationId };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, data: null, error: "Request must be multipart/form-data" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, data: null, error: "No file provided — include a 'file' field" },
        { status: 400 },
      );
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, data: null, error: "Only JPEG, PNG, WebP, and SVG files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, data: null, error: "File size must not exceed 2 MB" },
        { status: 400 },
      );
    }

    // Ensure uploads directory exists
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Generate a unique filename
    const ext = EXTENSION_MAP[file.type] ?? ".bin";
    const uniqueName = `${randomBytes(16).toString("hex")}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/uploads/${uniqueName}`;
    return NextResponse.json({ success: true, data: { url }, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/corporate/upload]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

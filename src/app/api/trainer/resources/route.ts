import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireTrainer } from "@/lib/auth-guards";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getTrainerCourses } from "@/lib/repositories/trainer.repository";
import {
  getResourcesByCourses,
  createResource,
} from "@/lib/repositories/course-resource.repository";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "bin";
}

function getResourceType(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("application/vnd.ms-excel") || mimeType.includes("spreadsheet")) return "xls";
  if (mimeType.startsWith("application/vnd.ms-powerpoint") || mimeType.includes("presentation")) return "ppt";
  if (mimeType === "application/msword" || mimeType.includes("wordprocessing")) return "doc";
  if (mimeType.startsWith("image/")) return "image";
  return "other";
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireTrainer(token);
    if (!guard.ok) return guard.response;

    const trainerId = token!.id as string;
    const courses = await getTrainerCourses(trainerId);
    const courseIds = courses.map((c) => c.id);

    const resources = await getResourcesByCourses(courseIds);

    // Attach course title to each resource for the UI
    const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));
    const enriched = resources.map((r) => ({
      ...r,
      courseTitle: courseMap[r.courseId] ?? "Unknown Course",
    }));

    return NextResponse.json({ success: true, data: { resources: enriched, courses }, error: null });
  } catch (err) {
    console.error("[GET /api/trainer/resources]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireTrainer(token);
    if (!guard.ok) return guard.response;

    const trainerId = token!.id as string;

    // Verify trainer is assigned to the target course
    const courses = await getTrainerCourses(trainerId);
    const formData = await request.formData();
    const courseId = formData.get("courseId") as string | null;
    const title = formData.get("title") as string | null;
    const file = formData.get("file") as File | null;

    if (!courseId || !title || !file) {
      return NextResponse.json(
        { success: false, data: null, error: "courseId, title, and file are required" },
        { status: 422 },
      );
    }

    const isAssigned = courses.some((c) => c.id === courseId);
    if (!isAssigned) {
      return NextResponse.json(
        { success: false, data: null, error: "You are not assigned to this course" },
        { status: 403 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPEG, PNG, GIF, WebP" },
        { status: 422 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, data: null, error: "File too large. Maximum size is 10MB." },
        { status: 422 },
      );
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "resources");
    await mkdir(uploadDir, { recursive: true });

    const ext = getFileExtension(file.name);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const relativePath = `/uploads/resources/${uniqueName}`;
    const absolutePath = join(uploadDir, uniqueName);

    const bytes = await file.arrayBuffer();
    await writeFile(absolutePath, Buffer.from(bytes));

    const resource = await createResource({
      courseId,
      title,
      type: getResourceType(file.type),
      filePath: relativePath,
      fileName: file.name,
      fileSize: file.size,
    });

    return NextResponse.json(
      { success: true, data: resource, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/trainer/resources]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

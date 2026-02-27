import { writeFile } from "fs/promises";
import { join } from "path";
import { gradeSubmission } from "@/lib/repositories/assignment.repository";
import type { Submission } from "@prisma/client";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
}

export async function handleFileUpload(file: File): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only PDF, DOC, DOCX, and images are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const relativePath = `/uploads/submissions/${uniqueName}`;
  const absolutePath = join(process.cwd(), "public", "uploads", "submissions", uniqueName);

  const bytes = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  return {
    filePath: relativePath,
    fileName: file.name,
    fileSize: file.size,
  };
}

export async function gradeAndNotify(
  submissionId: string,
  grade: number,
  feedback: string
): Promise<Submission> {
  return gradeSubmission(submissionId, grade, feedback);
}

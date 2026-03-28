import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const workSchema = z.object({
  id: z.string(),
  company: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

const educationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  year: z.string(),
});

const certSchema = z.object({
  title: z.string(),
  certNumber: z.string(),
  issuedAt: z.string(),
});

const saveSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  summary: z.string().optional().default(""),
  skills: z.array(z.string()),
  workExperience: z.array(workSchema),
  education: z.array(educationSchema),
  certifications: z.array(certSchema),
  photoUrl: z.string().optional().nullable(),
  templateId: z.string().default("professional"),
  styleColor: z.string().default("#2563eb"),
  styleFont: z.string().default("inter"),
  styleLayout: z.string().default("single"),
  isPremiumDesign: z.boolean().default(false),
});

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
    }

    const data = parsed.data;

    // If premium template requested, verify active subscription
    if (data.isPremiumDesign) {
      const sub = await prisma.subscription.findFirst({
        where: { studentId, status: "ACTIVE" },
      });
      if (!sub) {
        return jsonError(
          "Premium templates require an active subscription",
          403
        );
      }
    }

    const resumeData = {
      studentId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone ?? "",
      headline: data.headline ?? "",
      summary: data.summary ?? "",
      skills: data.skills,
      experience: JSON.stringify(data.workExperience),
      education: JSON.stringify(data.education),
      photoUrl: data.photoUrl ?? null,
      templateId: data.templateId,
      styleColor: data.styleColor,
      styleFont: data.styleFont,
      styleLayout: data.styleLayout,
      isPremiumDesign: data.isPremiumDesign,
    };

    const resume = await prisma.placementResume.upsert({
      where: { id: (await prisma.placementResume.findFirst({ where: { studentId }, select: { id: true } }))?.id ?? "" },
      update: resumeData,
      create: resumeData,
    });

    return NextResponse.json(
      { success: true, data: { id: resume.id }, error: null },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/student/resume/save]", err);
    return jsonError("Failed to save resume", 500);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) return jsonError("Unauthorized", 401);

  try {
    const resume = await prisma.placementResume.findFirst({
      where: { studentId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      { success: true, data: resume, error: null },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/student/resume/save]", err);
    return jsonError("Failed to fetch resume", 500);
  }
}

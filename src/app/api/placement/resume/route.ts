import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "student" || !token.id) {
      return NextResponse.json({ success: true, data: null, error: null });
    }

    const studentId = token.id as string;

    const resume = await prisma.placementResume.findFirst({
      where: { studentId },
    });

    return NextResponse.json({ success: true, data: resume, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch resume";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const body = await req.json();
    const { fullName, email, phone, headline, summary, skills, experience, education } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "fullName is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, data: null, error: "A valid email is required" },
        { status: 400 }
      );
    }

    if (!experience || typeof experience !== "string" || experience.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "experience is required" },
        { status: 400 }
      );
    }

    if (!education || typeof education !== "string" || education.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "education is required" },
        { status: 400 }
      );
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills.filter((s) => typeof s === "string")
      : [];

    const studentId =
      token && token.role === "student" && token.id ? (token.id as string) : undefined;

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ?? null,
      headline: headline ?? null,
      summary: summary ?? null,
      skills: normalizedSkills,
      experience: experience.trim(),
      education: education.trim(),
    };

    let resume;

    if (studentId) {
      // studentId is not unique — find-then-create-or-update
      const existing = await prisma.placementResume.findFirst({
        where: { studentId },
        select: { id: true },
      });

      if (existing) {
        resume = await prisma.placementResume.update({
          where: { id: existing.id },
          data: payload,
        });
      } else {
        resume = await prisma.placementResume.create({
          data: { ...payload, studentId },
        });
      }
    } else {
      resume = await prisma.placementResume.create({
        data: payload,
      });
    }

    return NextResponse.json({ success: true, data: resume, error: null }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save resume";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

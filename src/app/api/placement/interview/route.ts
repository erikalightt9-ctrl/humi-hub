import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const MOCK_QUESTION_TEMPLATES = [
  "Tell me about yourself.",
  "What are your key strengths for the {role} role?",
  "Describe a challenging situation you faced and how you resolved it.",
  "How do you handle tight deadlines and competing priorities?",
  "Where do you see yourself in 2 years as a {role}?",
];

function buildQuestions(role: string): { id: string; question: string; order: number }[] {
  return MOCK_QUESTION_TEMPLATES.map((template, index) => ({
    id: `q${index + 1}`,
    question: template.replace(/\{role\}/g, role),
    order: index + 1,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "student" || !token.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      );
    }

    const studentId = token.id as string;

    const sessions = await prisma.interviewSession.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ success: true, data: sessions, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch interview sessions";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { role, courseSlug } = body;

    if (!role || typeof role !== "string" || role.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "role is required" },
        { status: 400 }
      );
    }

    const studentId = token.id as string;
    const questions = buildQuestions(role.trim());

    const session = await prisma.interviewSession.create({
      data: {
        studentId,
        role: role.trim(),
        courseSlug: courseSlug ?? null,
        questions,
        status: "active",
      },
    });

    return NextResponse.json(
      { success: true, data: { session, questions }, error: null },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create interview session";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

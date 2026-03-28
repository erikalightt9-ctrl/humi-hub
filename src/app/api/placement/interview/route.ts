import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getOpenAI, isOpenAIAvailable } from "@/lib/openai";
import { requireFeature } from "@/lib/require-feature";
import { FEATURES } from "@/lib/feature-flags";

/* ------------------------------------------------------------------ */
/*  Fallback questions when OpenAI is unavailable                      */
/* ------------------------------------------------------------------ */

const FALLBACK_TEMPLATES = [
  "Tell me about yourself and why you're interested in the {role} position.",
  "What are your top three strengths relevant to the {role} role?",
  "Describe a time you overcame a difficult challenge at work or school.",
  "How do you manage multiple tasks and tight deadlines?",
  "Where do you see yourself professionally in 2 years as a {role}?",
];

function buildFallbackQuestions(role: string) {
  return FALLBACK_TEMPLATES.map((t, i) => ({
    id: `q${i + 1}`,
    question: t.replace(/\{role\}/g, role),
    order: i + 1,
  }));
}

async function generateQuestionsWithAI(role: string) {
  const ai = getOpenAI();
  const completion = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert HR interviewer. Generate exactly 5 interview questions for the given role. Return only a JSON array of strings — no markdown, no extra text.",
      },
      {
        role: "user",
        content: `Generate 5 behavioural and situational interview questions for: ${role}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";
  const parsed: string[] = JSON.parse(raw);
  return parsed.slice(0, 5).map((q, i) => ({
    id: `q${i + 1}`,
    question: q,
    order: i + 1,
  }));
}

/* ------------------------------------------------------------------ */
/*  GET — list recent sessions                                         */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "student" || !token.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      );
    }

    const sessions = await prisma.interviewSession.findMany({
      where: { studentId: token.id as string },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ success: true, data: sessions, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch sessions";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — start a new interview session                               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      );
    }
    const featureCheck = await requireFeature((token.tenantId as string | undefined) ?? null, FEATURES.AI_INTERVIEWS);
    if (!featureCheck.ok) return featureCheck.response;

    const body = await req.json() as { role?: unknown; courseSlug?: unknown };
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (!role) {
      return NextResponse.json(
        { success: false, data: null, error: "role is required" },
        { status: 400 }
      );
    }

    const questions = isOpenAIAvailable()
      ? await generateQuestionsWithAI(role)
      : buildFallbackQuestions(role);

    const session = await prisma.interviewSession.create({
      data: {
        studentId: token.id as string,
        role,
        courseSlug: typeof body.courseSlug === "string" ? body.courseSlug : "",
        questions,
        status: "active",
      },
    });

    return NextResponse.json(
      { success: true, data: { session, questions, aiPowered: isOpenAIAvailable() }, error: null },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create session";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

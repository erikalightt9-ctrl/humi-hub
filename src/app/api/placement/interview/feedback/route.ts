import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getOpenAI, isOpenAIAvailable } from "@/lib/openai";

type StoredQuestion = { id: string; question: string; order: number; answer?: string };
type AnswerPayload = { questionId: string; question?: string; answer: string };

function mergeAnswers(questions: StoredQuestion[], answers: AnswerPayload[]): StoredQuestion[] {
  const map = new Map(answers.map((a) => [a.questionId, a.answer]));
  return questions.map((q) => {
    const answer = map.get(q.id);
    return answer !== undefined ? { ...q, answer } : { ...q };
  });
}

function mockScores(role: string) {
  const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const overall = r(68, 92);
  return {
    overallScore: overall,
    communicationScore: r(65, 95),
    knowledgeScore: r(65, 95),
    problemSolvingScore: r(65, 95),
    professionalismScore: r(65, 95),
    aiFeedback: `Your performance for the ${role} role shows solid potential (${overall}/100). You communicated clearly and showed enthusiasm. To improve: (1) Use the STAR method more consistently, (2) Include measurable outcomes in your examples, (3) Connect your experience directly to role requirements.`,
  };
}

async function scoreWithAI(role: string, answers: AnswerPayload[]) {
  const ai = getOpenAI();
  const qa = answers.map((a, i) => `Q${i + 1}: ${a.question ?? ""}\nA${i + 1}: ${a.answer}`).join("\n\n");

  const completion = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert interview coach evaluating a candidate for a ${role} role.
Return ONLY a JSON object (no markdown) with these exact keys:
{"overallScore":<0-100>,"communicationScore":<0-100>,"knowledgeScore":<0-100>,"problemSolvingScore":<0-100>,"professionalismScore":<0-100>,"aiFeedback":"<2-3 paragraph personalised feedback>"}`,
      },
      { role: "user", content: qa },
    ],
    temperature: 0.4,
    max_tokens: 800,
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? "{}") as ReturnType<typeof mockScores>;
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
      return NextResponse.json({ success: false, data: null, error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json() as { sessionId?: unknown; answers?: unknown };
    const { sessionId, answers } = body;

    if (typeof sessionId !== "string" || !sessionId) {
      return NextResponse.json({ success: false, data: null, error: "sessionId is required" }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ success: false, data: null, error: "answers array is required" }, { status: 400 });
    }

    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId, studentId: token.id as string },
    });
    if (!session) {
      return NextResponse.json({ success: false, data: null, error: "Session not found" }, { status: 404 });
    }
    if (session.status === "completed") {
      return NextResponse.json({ success: false, data: null, error: "Already submitted" }, { status: 409 });
    }

    const storedQuestions = session.questions as StoredQuestion[];
    const mergedQuestions = mergeAnswers(storedQuestions, answers as AnswerPayload[]);

    const scores = isOpenAIAvailable()
      ? await scoreWithAI(session.role, answers as AnswerPayload[])
      : mockScores(session.role);

    const updated = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        completedAt: new Date(),
        questions: mergedQuestions,
        ...scores,
      },
    });

    return NextResponse.json({
      success: true,
      data: { session: updated, aiPowered: isOpenAIAvailable() },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to submit feedback";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

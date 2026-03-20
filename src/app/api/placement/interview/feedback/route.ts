import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

type StoredQuestion = {
  id: string;
  question: string;
  order: number;
  answer?: string;
};

type AnswerPayload = {
  questionId: string;
  answer: string;
};

function randomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mergeAnswers(
  questions: StoredQuestion[],
  answers: AnswerPayload[]
): StoredQuestion[] {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  return questions.map((q) => {
    const answer = answerMap.get(q.id);
    return answer !== undefined ? { ...q, answer } : { ...q };
  });
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
    const { sessionId, answers } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "sessionId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: "answers array is required and must not be empty" },
        { status: 400 }
      );
    }

    const invalidAnswer = answers.find(
      (a) => !a.questionId || typeof a.questionId !== "string" || typeof a.answer !== "string"
    );
    if (invalidAnswer) {
      return NextResponse.json(
        { success: false, data: null, error: "Each answer must have a valid questionId and answer string" },
        { status: 400 }
      );
    }

    const studentId = token.id as string;

    const existingSession = await prisma.interviewSession.findFirst({
      where: { id: sessionId, studentId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, data: null, error: "Interview session not found" },
        { status: 404 }
      );
    }

    if (existingSession.status === "completed") {
      return NextResponse.json(
        { success: false, data: null, error: "Feedback has already been submitted for this session" },
        { status: 409 }
      );
    }

    const storedQuestions = existingSession.questions as StoredQuestion[];
    const mergedQuestions = mergeAnswers(storedQuestions, answers as AnswerPayload[]);

    const overallScore = randomScore(70, 95);
    const communicationScore = randomScore(70, 95);
    const knowledgeScore = randomScore(70, 95);
    const problemSolvingScore = randomScore(70, 95);
    const professionalismScore = randomScore(70, 95);

    const aiFeedback = `Great job on your responses! Your communication was clear and professional. Focus on ${existingSession.role}-specific technical skills for improvement.`;

    const updatedSession = await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        completedAt: new Date(),
        overallScore,
        communicationScore,
        knowledgeScore,
        problemSolvingScore,
        professionalismScore,
        aiFeedback,
        questions: mergedQuestions,
      },
    });

    return NextResponse.json({ success: true, data: updatedSession, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit feedback";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

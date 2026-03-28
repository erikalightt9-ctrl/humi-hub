import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { searchParams } = new URL(req.url);

    if (token && token.role === "student" && token.id) {
      const studentId = token.id as string;

      const sessions = await prisma.coachingSession.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: sessions, error: null });
    }

    const email = searchParams.get("email")?.trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "An email query parameter is required when not authenticated as a student",
        },
        { status: 400 }
      );
    }

    const sessions = await prisma.coachingSession.findMany({
      where: { email: email.toLowerCase() },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: sessions, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch coaching sessions";
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
    const { fullName, email, phone, topic, message, preferredDate } = body;

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

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "topic is required" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "message is required" },
        { status: 400 }
      );
    }

    let parsedPreferredDate: Date | null = null;
    if (preferredDate) {
      const d = new Date(preferredDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { success: false, data: null, error: "preferredDate must be a valid ISO date string" },
          { status: 400 }
        );
      }
      parsedPreferredDate = d;
    }

    const studentId =
      token && token.role === "student" && token.id ? (token.id as string) : undefined;

    const session = await prisma.coachingSession.create({
      data: {
        studentId: studentId ?? null,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ?? null,
        topic: topic.trim(),
        message: message.trim(),
        preferredDate: parsedPreferredDate,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { success: true, data: session, error: null },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to book coaching session";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

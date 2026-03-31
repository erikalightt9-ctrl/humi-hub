import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const escalateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required"),
  message: z.string().min(1, "Message is required").max(2000),
});

function generateRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CHAT-${ts}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = escalateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, message } = result.data;
    const referenceNo = generateRef();

    // Store contact details in description since these are guest (unauthenticated) users
    const description = `From: ${name} <${email}>\n\n${message}`;

    await prisma.supportTicket.create({
      data: {
        referenceNo,
        subject: `Chat inquiry from ${name}`,
        description,
        category: "TECHNICAL_SUPPORT",
        priority: "MEDIUM",
        submitterType: "STUDENT",
        submitterId: `guest-${Date.now()}`,
        status: "OPEN",
      },
    });

    return NextResponse.json({
      success: true,
      data: { referenceNo },
      error: null,
    });
  } catch (error) {
    console.error("Chat escalate error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }
}

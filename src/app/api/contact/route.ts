import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import sanitizeHtml from "sanitize-html";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(2000),
});

function sanitize(val: string) {
  return sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} }).trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, subject, message } = result.data;

    await prisma.contactMessage.create({
      data: {
        name: sanitize(name),
        email,
        subject: sanitize(subject),
        message: sanitize(message),
      },
    });

    return NextResponse.json({ success: true, data: null, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import sanitizeHtml from "sanitize-html";
import { notifyMany } from "@/lib/services/in-app-notification.service";

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

    const sanitizedName = sanitize(name);
    const sanitizedSubject = sanitize(subject);

    await prisma.contactMessage.create({
      data: {
        name: sanitizedName,
        email,
        subject: sanitizedSubject,
        message: sanitize(message),
      },
    });

    // Notify all admins (non-blocking — don't fail the response if this errors)
    prisma.admin
      .findMany({ select: { id: true } })
      .then((admins) => {
        if (admins.length === 0) return;
        const recipients = admins.map((a) => ({
          actorType: "ADMIN" as const,
          actorId: a.id,
        }));
        return notifyMany(recipients, {
          type: "CONTACT_MESSAGE",
          title: `New contact from ${sanitizedName}`,
          message: sanitizedSubject,
          linkUrl: "/admin/communications",
        });
      })
      .catch((err) => console.error("[contact] notification error:", err));

    return NextResponse.json({ success: true, data: null, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

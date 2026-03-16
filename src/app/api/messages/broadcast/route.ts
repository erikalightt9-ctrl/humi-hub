import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyMany } from "@/lib/services/in-app-notification.service";
import type { ActorType } from "@prisma/client";

const broadcastSchema = z.object({
  targetRole: z.enum(["TRAINER", "STUDENT", "CORPORATE_MANAGER", "ALL"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = broadcastSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const { targetRole, title, message } = result.data;

    // Collect recipients based on target role
    type Recipient = { readonly actorType: ActorType; readonly actorId: string };
    const recipients: Recipient[] = [];

    if (targetRole === "TRAINER" || targetRole === "ALL") {
      const trainers = await prisma.trainer.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      recipients.push(...trainers.map((t) => ({ actorType: "TRAINER" as ActorType, actorId: t.id })));
    }

    if (targetRole === "STUDENT" || targetRole === "ALL") {
      const students = await prisma.student.findMany({
        where: { accessGranted: true },
        select: { id: true },
      });
      recipients.push(...students.map((s) => ({ actorType: "STUDENT" as ActorType, actorId: s.id })));
    }

    if (targetRole === "CORPORATE_MANAGER" || targetRole === "ALL") {
      const managers = await prisma.corporateManager.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      recipients.push(...managers.map((m) => ({ actorType: "CORPORATE_MANAGER" as ActorType, actorId: m.id })));
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: "No recipients found for the selected role" },
        { status: 400 }
      );
    }

    await notifyMany(recipients, {
      type: "TRAINER_ANNOUNCEMENT",
      title,
      message,
      linkUrl: "/notifications",
    });

    return NextResponse.json({
      success: true,
      data: { sent: recipients.length },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/messages/broadcast]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

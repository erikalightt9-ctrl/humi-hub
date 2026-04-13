/**
 * POST /api/auth/request-unlock
 *
 * Sends an unlock request notification to the admin when a locked user
 * clicks "Request Unlock" on the login page.
 *
 * Request body: { email: string, provider: "student" | "trainer" | "humi-admin" | "corporate" }
 *
 * Responses:
 *   200  { ok: true }          — email sent (or queued)
 *   200  { ok: false, error }  — account not locked / user not found
 *   422  { ok: false, error }  — invalid input
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendUnlockRequestEmail } from "@/lib/email/send-unlock-request";

const bodySchema = z.object({
  email: z.string().email(),
  provider: z.enum(["student", "trainer", "humi-admin", "corporate", "admin"]),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 422 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 422 });
  }

  const { email, provider } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const now = new Date();

  // Look up the locked user and verify they are actually locked
  let lockedUser: { name: string; lockUntil: Date } | null = null;

  if (provider === "student") {
    const student = await prisma.student.findUnique({
      where: { email: normalizedEmail },
      select: { name: true, lockUntil: true },
    });
    if (student?.lockUntil && student.lockUntil > now) {
      lockedUser = { name: student.name, lockUntil: student.lockUntil };
    }
  } else if (provider === "trainer") {
    const trainer = await prisma.trainer.findUnique({
      where: { email: normalizedEmail },
      select: { name: true, lockUntil: true },
    });
    if (trainer?.lockUntil && trainer.lockUntil > now) {
      lockedUser = { name: trainer.name, lockUntil: trainer.lockUntil };
    }
  } else if (provider === "humi-admin") {
    const humiAdmin = await prisma.humiAdmin.findUnique({
      where: { email: normalizedEmail },
      select: { name: true, lockUntil: true },
    });
    if (humiAdmin?.lockUntil && humiAdmin.lockUntil > now) {
      lockedUser = { name: humiAdmin.name, lockUntil: humiAdmin.lockUntil };
    }
  } else if (provider === "corporate") {
    const manager = await prisma.corporateManager.findFirst({
      where: { email: normalizedEmail },
      select: { name: true, lockUntil: true },
    });
    if (manager?.lockUntil && manager.lockUntil > now) {
      lockedUser = { name: manager.name, lockUntil: manager.lockUntil };
    }
  } else if (provider === "admin") {
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
      select: { name: true, lockUntil: true },
    });
    if (admin?.lockUntil && admin.lockUntil > now) {
      lockedUser = { name: admin.name, lockUntil: admin.lockUntil };
    }
  }

  // Always return ok: true to avoid leaking account existence
  if (!lockedUser) {
    return NextResponse.json({ ok: true });
  }

  // Find other admin(s) to notify — exclude the requesting admin to avoid self-notification
  const admins = await prisma.admin.findMany({
    where: { email: { not: normalizedEmail } },
    select: { email: true },
    take: 3,
  });

  if (admins.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "http://localhost:3000";
  const adminPanelUrl = `${baseUrl}/admin`;

  // Fire-and-forget — don't block the response on email delivery
  const notifications = admins.map((admin) =>
    sendUnlockRequestEmail({
      adminEmail: admin.email,
      lockedUserEmail: normalizedEmail,
      lockedUserName: lockedUser!.name,
      userRole: provider,
      lockUntil: lockedUser!.lockUntil,
      adminPanelUrl,
    }).catch((err) => {
      console.error("[request-unlock] Failed to send email to", admin.email, err);
    }),
  );

  await Promise.allSettled(notifications);

  return NextResponse.json({ ok: true });
}

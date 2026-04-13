/**
 * POST /api/auth/validate-credentials
 *
 * Lightweight pre-login check — no bcrypt, no session creation.
 * Checks only operational access-control gates so the portal UI
 * can show a specific, actionable error message before calling signIn().
 *
 * Request body: { provider: "student" | "trainer" | "humi-admin" | "auto", email: string }
 *
 * Responses:
 *   200 ok            { ok: true,  mustChangePassword: boolean }
 *   200 blocked       { ok: false, error: string, lockUntil?: string } ← show in UI
 *   200 not_found     { ok: null }                   ← fall through to signIn()
 *   422               { ok: false, error: "Invalid input" }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  provider: z.enum(["student", "trainer", "humi-admin", "corporate", "auto"]),
  email: z.string().email(),
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

  const { provider, email } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const now = new Date();

  try {

  /* ── student ────────────────────────────────────────────────── */
  if (provider === "student") {
    const student = await prisma.student.findUnique({
      where: { email: normalizedEmail },
      select: {
        failedAttempts: true,
        lockUntil: true,
        accessGranted: true,
        accessExpiry: true,
        mustChangePassword: true,
      },
    });

    if (!student) return NextResponse.json({ ok: null });

    if (student.lockUntil && student.lockUntil > now) {
      return NextResponse.json({
        ok: false,
        error: "Your account is temporarily locked due to too many failed attempts.",
        lockUntil: student.lockUntil.toISOString(),
      });
    }

    if (!student.accessGranted) {
      return NextResponse.json({
        ok: false,
        error: "Your access has not been granted yet. Please contact admin.",
      });
    }

    if (student.accessExpiry && new Date(student.accessExpiry) < now) {
      return NextResponse.json({
        ok: false,
        error: "Your access has expired. Please contact admin to renew.",
      });
    }

    return NextResponse.json({
      ok: true,
      mustChangePassword: student.mustChangePassword,
    });
  }

  /* ── corporate ─────────────────────────────────────────────── */
  if (provider === "corporate") {
    const manager = await prisma.corporateManager.findFirst({
      where: { email: normalizedEmail },
      select: { isActive: true, mustChangePassword: true, lockUntil: true, failedAttempts: true },
    });

    if (!manager) return NextResponse.json({ ok: null });

    if (!manager.isActive) {
      return NextResponse.json({
        ok: false,
        error: "Your account has been deactivated. Please contact admin.",
      });
    }

    if (manager.lockUntil && manager.lockUntil > now) {
      return NextResponse.json({
        ok: false,
        error: "Your account is temporarily locked due to too many failed attempts.",
        lockUntil: manager.lockUntil.toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      mustChangePassword: manager.mustChangePassword,
    });
  }

  /* ── humi-admin ─────────────────────────────────────────────── */
  if (provider === "humi-admin") {
    const humiAdmin = await prisma.humiAdmin.findUnique({
      where: { email: normalizedEmail },
      select: {
        failedAttempts: true,
        lockUntil: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!humiAdmin) return NextResponse.json({ ok: null });

    if (!humiAdmin.isActive) {
      return NextResponse.json({
        ok: false,
        error: "Account deactivated. Contact the Super Admin.",
      });
    }

    if (humiAdmin.lockUntil && humiAdmin.lockUntil > now) {
      return NextResponse.json({
        ok: false,
        error: "Your account is temporarily locked due to too many failed attempts.",
        lockUntil: humiAdmin.lockUntil.toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      mustChangePassword: humiAdmin.mustChangePassword,
    });
  }

  /* ── auto-detect (Tenant Portal unified login) ──────────────── */
  if (provider === "auto") {
    // 1. Check corporate manager FIRST — tenant admins take priority and are
    //    never subject to the student/trainer failedAttempts lockout.
    const manager = await prisma.corporateManager.findFirst({
      where: { email: normalizedEmail },
      select: { isActive: true, mustChangePassword: true },
    });
    if (manager) {
      if (!manager.isActive) {
        return NextResponse.json({ ok: false, error: "Your account has been deactivated. Please contact admin." });
      }
      return NextResponse.json({ ok: true, provider: "corporate", mustChangePassword: manager.mustChangePassword });
    }

    // 2. Check student
    const studentAuto = await prisma.student.findUnique({
      where: { email: normalizedEmail },
      select: {
        failedAttempts: true,
        lockUntil: true,
        accessGranted: true,
        accessExpiry: true,
        mustChangePassword: true,
      },
    });
    if (studentAuto) {
      if (studentAuto.lockUntil && studentAuto.lockUntil > now) {
        return NextResponse.json({
          ok: false,
          error: "Your account is temporarily locked due to too many failed attempts.",
          lockUntil: studentAuto.lockUntil.toISOString(),
          provider: "student",
        });
      }
      if (!studentAuto.accessGranted) {
        return NextResponse.json({ ok: false, error: "Your access has not been granted yet. Please contact admin." });
      }
      if (studentAuto.accessExpiry && new Date(studentAuto.accessExpiry) < now) {
        return NextResponse.json({ ok: false, error: "Your access has expired. Please contact admin to renew." });
      }
      return NextResponse.json({ ok: true, provider: "student", mustChangePassword: studentAuto.mustChangePassword });
    }



    // 3. Check trainer
    const trainerAuto = await prisma.trainer.findUnique({
      where: { email: normalizedEmail },
      select: {
        passwordHash: true,
        failedAttempts: true,
        lockUntil: true,
        isActive: true,
        accessGranted: true,
        mustChangePassword: true,
      },
    });
    if (trainerAuto && trainerAuto.passwordHash) {
      if (trainerAuto.lockUntil && trainerAuto.lockUntil > now) {
        return NextResponse.json({
          ok: false,
          error: "Your account is temporarily locked due to too many failed attempts.",
          lockUntil: trainerAuto.lockUntil.toISOString(),
          provider: "trainer",
        });
      }
      if (!trainerAuto.isActive) {
        return NextResponse.json({ ok: false, error: "Your account has been deactivated. Please contact admin." });
      }
      if (!trainerAuto.accessGranted) {
        return NextResponse.json({ ok: false, error: "Your portal access has not been granted yet. Please contact admin." });
      }
      return NextResponse.json({ ok: true, provider: "trainer", mustChangePassword: trainerAuto.mustChangePassword });
    }

    // Not found in any table
    return NextResponse.json({ ok: null });
  }

  /* ── trainer (explicit provider) ───────────────────────────── */
  const trainer = await prisma.trainer.findUnique({
    where: { email: normalizedEmail },
    select: {
      passwordHash: true,
      failedAttempts: true,
      lockUntil: true,
      isActive: true,
      accessGranted: true,
      mustChangePassword: true,
    },
  });

  if (!trainer || !trainer.passwordHash) return NextResponse.json({ ok: null });

  if (trainer.lockUntil && trainer.lockUntil > now) {
    return NextResponse.json({
      ok: false,
      error: "Your account is temporarily locked due to too many failed attempts.",
      lockUntil: trainer.lockUntil.toISOString(),
    });
  }

  if (!trainer.isActive) {
    return NextResponse.json({
      ok: false,
      error: "Your account has been deactivated. Please contact admin.",
    });
  }

  if (!trainer.accessGranted) {
    return NextResponse.json({
      ok: false,
      error: "Your portal access has not been granted yet. Please contact admin.",
    });
  }

  return NextResponse.json({
    ok: true,
    mustChangePassword: trainer.mustChangePassword,
  });

  } catch (err) {
    console.error("[validate-credentials] DB error:", err);
    // Return ok: null so the login page falls through to signIn() which will
    // produce its own (more specific) error, rather than showing a generic crash.
    return NextResponse.json({ ok: null });
  }
}

/**
 * POST /api/trainer/change-password
 *
 * Allows an authenticated trainer to change their password.
 * Verifies the current password, saves the new hash, and clears
 * the mustChangePassword flag so the middleware no longer redirects.
 *
 * Body: { currentPassword: string, newPassword: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { changeTrainerPassword } from "@/lib/services/trainer-auth.service";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

function jsonError(msg: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: msg },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id || token.role !== "trainer") {
    return jsonError("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    return jsonError(msg, 422);
  }

  const { currentPassword, newPassword } = parsed.data;
  const trainerId = token.id as string;

  const result = await changeTrainerPassword(trainerId, currentPassword, newPassword);

  if (!result.success) {
    return jsonError(result.error, 400);
  }

  return NextResponse.json({ success: true, data: null, error: null });
}

import { prisma } from "@/lib/prisma";
import type { GoogleCalendarToken } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TokenData {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresAt?: Date | null;
  calendarId?: string;
}

// ── Repository ────────────────────────────────────────────────────────────────

export async function getToken(
  userId: string,
  userRole: string,
): Promise<GoogleCalendarToken | null> {
  return prisma.googleCalendarToken.findUnique({
    where: { userId_userRole: { userId, userRole } },
  });
}

export async function upsertToken(
  userId: string,
  userRole: string,
  data: TokenData,
): Promise<GoogleCalendarToken> {
  return prisma.googleCalendarToken.upsert({
    where: { userId_userRole: { userId, userRole } },
    create: {
      userId,
      userRole,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      tokenType: data.tokenType ?? null,
      expiresAt: data.expiresAt ?? null,
      calendarId: data.calendarId ?? "primary",
    },
    update: {
      accessToken: data.accessToken,
      ...(data.refreshToken !== undefined && { refreshToken: data.refreshToken }),
      ...(data.tokenType !== undefined && { tokenType: data.tokenType }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      ...(data.calendarId !== undefined && { calendarId: data.calendarId }),
      updatedAt: new Date(),
    },
  });
}

export async function deleteToken(
  userId: string,
  userRole: string,
): Promise<void> {
  await prisma.googleCalendarToken.deleteMany({
    where: { userId, userRole },
  });
}

export async function hasToken(
  userId: string,
  userRole: string,
): Promise<boolean> {
  const count = await prisma.googleCalendarToken.count({
    where: { userId, userRole },
  });
  return count > 0;
}

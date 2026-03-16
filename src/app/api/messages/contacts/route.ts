import { NextRequest, NextResponse } from "next/server";
import { getActorFromToken } from "@/lib/auth-helpers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { ActorType } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Role-based communication permissions (from spec)                  */
/*  - ADMIN: everyone                                                  */
/*  - TRAINER: students, admins                                        */
/*  - STUDENT: trainers only (not other students)                     */
/*  - CORPORATE_MANAGER: admins, trainers                             */
/* ------------------------------------------------------------------ */

const ALLOWED_TARGETS: Readonly<Record<ActorType, ReadonlyArray<ActorType>>> = {
  ADMIN: ["ADMIN", "TRAINER", "STUDENT", "CORPORATE_MANAGER"],
  TRAINER: ["ADMIN", "STUDENT"],
  STUDENT: ["TRAINER"],
  CORPORATE_MANAGER: ["ADMIN", "TRAINER"],
};

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const actor = getActorFromToken(token);
    if (!actor) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const roleFilter = searchParams.get("role") as ActorType | null;

    const allowedRoles = ALLOWED_TARGETS[actor.actorType];
    const rolesToQuery = roleFilter && allowedRoles.includes(roleFilter)
      ? [roleFilter]
      : allowedRoles;

    const searchWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const limit = 20;

    const results = await Promise.all(
      rolesToQuery.map(async (role) => {
        if (role === "ADMIN") {
          const admins = await prisma.admin.findMany({
            where: { ...searchWhere, NOT: { id: actor.actorType === "ADMIN" ? actor.actorId : undefined } },
            select: { id: true, name: true, email: true },
            take: limit,
          });
          return admins.map((a) => ({ ...a, actorType: "ADMIN" as ActorType }));
        }
        if (role === "TRAINER") {
          const trainers = await prisma.trainer.findMany({
            where: { ...searchWhere, isActive: true, NOT: { id: actor.actorType === "TRAINER" ? actor.actorId : undefined } },
            select: { id: true, name: true, email: true },
            take: limit,
          });
          return trainers.map((t) => ({ ...t, actorType: "TRAINER" as ActorType }));
        }
        if (role === "STUDENT") {
          const students = await prisma.student.findMany({
            where: { ...searchWhere, accessGranted: true, NOT: { id: actor.actorType === "STUDENT" ? actor.actorId : undefined } },
            select: { id: true, name: true, email: true },
            take: limit,
          });
          return students.map((s) => ({ ...s, actorType: "STUDENT" as ActorType }));
        }
        if (role === "CORPORATE_MANAGER") {
          const managers = await prisma.corporateManager.findMany({
            where: { ...searchWhere, isActive: true, NOT: { id: actor.actorType === "CORPORATE_MANAGER" ? actor.actorId : undefined } },
            select: { id: true, name: true, email: true },
            take: limit,
          });
          return managers.map((m) => ({ ...m, actorType: "CORPORATE_MANAGER" as ActorType }));
        }
        return [];
      })
    );

    const contacts = results.flat().slice(0, 50);

    return NextResponse.json({ success: true, data: contacts, error: null });
  } catch (err) {
    console.error("[GET /api/messages/contacts]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

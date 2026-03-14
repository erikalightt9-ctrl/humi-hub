import type { ActorType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ActorInfo } from "@/lib/types/communications.types";

/**
 * Resolves actor identity from the 4 separate user tables.
 * Returns null if the actor is not found.
 */
export async function resolveActor(
  type: ActorType,
  id: string
): Promise<ActorInfo | null> {
  switch (type) {
    case "ADMIN": {
      const admin = await prisma.admin.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      });
      return admin ? { ...admin, type: "ADMIN" } : null;
    }
    case "STUDENT": {
      const student = await prisma.student.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      });
      return student ? { ...student, type: "STUDENT" } : null;
    }
    case "TRAINER": {
      const trainer = await prisma.trainer.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      });
      return trainer ? { ...trainer, type: "TRAINER" } : null;
    }
    case "CORPORATE_MANAGER": {
      const manager = await prisma.corporateManager.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      });
      return manager ? { ...manager, type: "CORPORATE_MANAGER" } : null;
    }
    default:
      return null;
  }
}

/**
 * Batch-resolve actors. Deduplicates by type+id and queries each table once.
 */
export async function resolveActors(
  actors: ReadonlyArray<{ readonly type: ActorType; readonly id: string }>
): Promise<ReadonlyArray<ActorInfo>> {
  const grouped = new Map<ActorType, Set<string>>();

  for (const actor of actors) {
    const set = grouped.get(actor.type) ?? new Set();
    set.add(actor.id);
    grouped.set(actor.type, set);
  }

  const results: ActorInfo[] = [];

  const adminIds = grouped.get("ADMIN");
  if (adminIds?.size) {
    const admins = await prisma.admin.findMany({
      where: { id: { in: [...adminIds] } },
      select: { id: true, name: true, email: true },
    });
    results.push(...admins.map((a) => ({ ...a, type: "ADMIN" as const })));
  }

  const studentIds = grouped.get("STUDENT");
  if (studentIds?.size) {
    const students = await prisma.student.findMany({
      where: { id: { in: [...studentIds] } },
      select: { id: true, name: true, email: true },
    });
    results.push(...students.map((s) => ({ ...s, type: "STUDENT" as const })));
  }

  const trainerIds = grouped.get("TRAINER");
  if (trainerIds?.size) {
    const trainers = await prisma.trainer.findMany({
      where: { id: { in: [...trainerIds] } },
      select: { id: true, name: true, email: true },
    });
    results.push(...trainers.map((t) => ({ ...t, type: "TRAINER" as const })));
  }

  const managerIds = grouped.get("CORPORATE_MANAGER");
  if (managerIds?.size) {
    const managers = await prisma.corporateManager.findMany({
      where: { id: { in: [...managerIds] } },
      select: { id: true, name: true, email: true },
    });
    results.push(
      ...managers.map((m) => ({ ...m, type: "CORPORATE_MANAGER" as const }))
    );
  }

  return results;
}

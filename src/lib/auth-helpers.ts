import type { ActorType } from "@prisma/client";
import type { JWT } from "next-auth/jwt";

const ROLE_TO_ACTOR_TYPE: Readonly<Record<string, ActorType>> = {
  admin: "ADMIN",
  student: "STUDENT",
  trainer: "TRAINER",
  corporate: "CORPORATE_MANAGER",
};

export interface ActorIdentity {
  readonly actorType: ActorType;
  readonly actorId: string;
}

/**
 * Extracts the actor identity (type + id) from a NextAuth JWT token.
 * Returns null if the token is missing required fields.
 */
export function getActorFromToken(token: JWT | null): ActorIdentity | null {
  if (!token?.id || !token?.role) return null;

  const actorType = ROLE_TO_ACTOR_TYPE[token.role as string];
  if (!actorType) return null;

  return { actorType, actorId: token.id as string };
}

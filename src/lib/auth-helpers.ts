import type { ActorType } from "@prisma/client";
import type { JWT } from "next-auth/jwt";

const ROLE_TO_ACTOR_TYPE: Readonly<Record<string, ActorType>> = {
  admin:        "ADMIN",
  humi_admin:   "HUMI_ADMIN",
  student:      "STUDENT",
  trainer:      "TRAINER",
  corporate:    "CORPORATE_MANAGER",
  tenant_admin: "CORPORATE_MANAGER",
  tenant_user:  "CORPORATE_MANAGER",
  employee:     "EMPLOYEE",
};

export interface ActorIdentity {
  readonly actorType: ActorType;
  readonly actorId: string;
  /** null = superadmin or trainer (unrestricted); string = scoped to this tenant */
  readonly tenantId: string | null;
}

/**
 * Extracts the actor identity (type + id + tenantId) from a NextAuth JWT token.
 * Returns null if the token is missing required fields.
 */
export function getActorFromToken(token: JWT | null): ActorIdentity | null {
  if (!token?.id || !token?.role) return null;

  const actorType = ROLE_TO_ACTOR_TYPE[token.role as string];
  if (!actorType) return null;

  return {
    actorType,
    actorId: token.id as string,
    tenantId: (token.tenantId as string | null) ?? null,
  };
}

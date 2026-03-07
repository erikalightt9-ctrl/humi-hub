import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Skill Verification Schemas                                         */
/* ------------------------------------------------------------------ */

/** Refresh request is auth-only, no body required */
export const skillRefreshRequestSchema = z.object({});

/** Validated skill level (1-5) */
export const skillLevelSchema = z.number().int().min(1).max(5);

/** Verified skill response shape */
export const verifiedSkillSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  skillType: z.string(),
  level: skillLevelSchema,
  evidence: z.string(),
  verifiedAt: z.string().or(z.date()),
});

export type VerifiedSkillResponse = z.infer<typeof verifiedSkillSchema>;

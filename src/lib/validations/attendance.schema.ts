import { z } from "zod";

export const clockActionSchema = z.object({
  action: z.enum(["clock-in", "clock-out"]),
  /** Optional course scope — required for course-level check-in/out */
  courseId: z.string().min(1).optional(),
});

export type ClockAction = z.infer<typeof clockActionSchema>;

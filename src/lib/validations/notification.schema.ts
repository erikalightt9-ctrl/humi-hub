import { z } from "zod";

export const notificationFilterSchema = z.object({
  type: z
    .enum([
      "NEW_MESSAGE",
      "TICKET_RESPONSE",
      "TRAINER_ANNOUNCEMENT",
      "LESSON_UPDATE",
      "JOB_ALERT",
      "COURSE_UPDATE",
      "SYSTEM",
    ])
    .optional(),
  isRead: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;

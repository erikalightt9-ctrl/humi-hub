import { z } from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["DIRECT", "COURSE_GROUP", "ANNOUNCEMENT", "LESSON_DISCUSSION"]),
  title: z.string().max(200).optional(),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  participantIds: z.array(
    z.object({
      actorType: z.enum(["ADMIN", "STUDENT", "TRAINER", "CORPORATE_MANAGER"]),
      actorId: z.string(),
    })
  ).min(1, "At least one participant is required"),
  initialMessage: z.string().min(1).max(5000).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentName: z.string().max(255).optional().nullable(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

import { z } from "zod";

export const EVENT_TYPES = [
  "ANNOUNCEMENT",
  "DEADLINE",
  "ORIENTATION",
  "HOLIDAY",
  "CUSTOM",
  "CLASS",
  "MEETING",
] as const;

export type EventTypeKey = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventTypeKey, string> = {
  ANNOUNCEMENT: "Announcement",
  DEADLINE: "Deadline",
  ORIENTATION: "Orientation",
  HOLIDAY: "Holiday",
  CUSTOM: "Custom",
  CLASS: "Class",
  MEETING: "Meeting",
};

export const EVENT_TYPE_COLORS: Record<EventTypeKey, string> = {
  ANNOUNCEMENT: "bg-blue-500",
  DEADLINE: "bg-red-500",
  ORIENTATION: "bg-purple-500",
  HOLIDAY: "bg-green-500",
  CUSTOM: "bg-gray-500",
  CLASS: "bg-indigo-500",
  MEETING: "bg-orange-500",
};

/** HH:MM 24-hour format */
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or fewer"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or fewer")
    .optional()
    .nullable(),
  date: z.string().min(1, "Date is required"),
  endDate: z.string().optional().nullable(),
  startTime: z
    .string()
    .regex(timeRegex, "Time must be HH:MM (24-hour)")
    .optional()
    .nullable(),
  endTime: z
    .string()
    .regex(timeRegex, "Time must be HH:MM (24-hour)")
    .optional()
    .nullable(),
  type: z.enum(EVENT_TYPES).default("CUSTOM"),
  courseId: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventData = z.infer<typeof createEventSchema>;
export type UpdateEventData = z.infer<typeof updateEventSchema>;

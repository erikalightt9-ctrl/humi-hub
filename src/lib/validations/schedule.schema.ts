import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createScheduleSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    courseId: z.string().min(1, "Course is required"),
    trainerId: z.string().min(1).optional().nullable(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Select at least one day"),
    startTime: z.string().regex(timeRegex, "Use HH:mm format"),
    endTime: z.string().regex(timeRegex, "Use HH:mm format"),
    maxCapacity: z.number().int().min(1).max(100).default(25),
    enrollmentCutOffDays: z.number().int().min(0).max(30).default(2),
  })
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    { message: "End date must be after start date", path: ["endDate"] }
  )
  .refine(
    (data) => data.endTime > data.startTime,
    { message: "End time must be after start time", path: ["endTime"] }
  );

export const updateScheduleSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    courseId: z.string().min(1).optional(),
    trainerId: z.string().min(1).optional().nullable(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .optional(),
    startTime: z.string().regex(timeRegex, "Use HH:mm format").optional(),
    endTime: z.string().regex(timeRegex, "Use HH:mm format").optional(),
    maxCapacity: z.number().int().min(1).max(100).optional(),
    enrollmentCutOffDays: z.number().int().min(0).max(30).optional(),
    status: z.enum(["OPEN", "CLOSED", "FULL", "COMPLETED"]).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: "End date must be after start date", path: ["endDate"] }
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    { message: "End time must be after start time", path: ["endTime"] }
  );

export const assignScheduleSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required").nullable(),
});

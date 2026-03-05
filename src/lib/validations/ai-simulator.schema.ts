import { z } from "zod";

export const startSimulationSchema = z.object({
  scenarioId: z.string().min(1, "Scenario ID is required"),
});

export const sendMessageSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long"),
});

export const endSimulationSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

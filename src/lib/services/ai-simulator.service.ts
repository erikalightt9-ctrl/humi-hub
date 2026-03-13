import { generateCompletion, generateJsonCompletion } from "@/lib/services/openai.service";
import {
  createSession,
  addMessage,
  completeSession,
  getSession,
} from "@/lib/repositories/simulation.repository";
import type { SimulationMessage } from "@/lib/repositories/simulation.repository";
import type { CourseSlug } from "@/types";

/* ------------------------------------------------------------------ */
/*  Scenario definitions                                               */
/* ------------------------------------------------------------------ */

export interface SimulationScenario {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly clientPersona: string;
  readonly situation: string;
}

const SCENARIOS: Record<string, ReadonlyArray<SimulationScenario>> = {
  MEDICAL_VA: [
    {
      id: "med_patient_reschedule",
      title: "Patient Rescheduling Request",
      description: "A patient calls to reschedule their appointment and is frustrated about availability.",
      clientPersona: "Mrs. Johnson, a 62-year-old patient who needs to reschedule her follow-up appointment. She's frustrated because she already rescheduled once and has limited availability due to work.",
      situation: "The patient calls to reschedule her cardiology follow-up. The next available slot is 3 weeks out, but she wants something sooner. You need to help find a solution while maintaining professionalism.",
    },
    {
      id: "med_insurance_query",
      title: "Insurance Verification Issue",
      description: "A patient is confused about their insurance coverage for an upcoming procedure.",
      clientPersona: "Mr. Chen, a 45-year-old patient scheduled for an MRI. He's worried about costs and doesn't understand his insurance benefits. He's polite but anxious.",
      situation: "Mr. Chen calls asking about insurance coverage for his upcoming MRI. He has a high-deductible plan and is worried about out-of-pocket costs. Help him understand the process and next steps.",
    },
  ],
  REAL_ESTATE_VA: [
    {
      id: "re_buyer_inquiry",
      title: "New Buyer Inquiry",
      description: "A potential buyer contacts the office about a property listing they saw online.",
      clientPersona: "Sarah and Mark, a young couple looking for their first home. They have a budget of $350K, need at least 3 bedrooms, and want to be near good schools. They're excited but nervous about the process.",
      situation: "The couple found a listing online and wants more information. They have questions about the property, neighborhood, and the buying process. Schedule a viewing and gather their requirements.",
    },
    {
      id: "re_closing_delay",
      title: "Closing Delay Communication",
      description: "A client's closing is delayed and they're upset about the situation.",
      clientPersona: "David, a buyer who was supposed to close on his new home this Friday. He's already given notice at his apartment and arranged movers. He's upset and wants answers.",
      situation: "David's closing is delayed by 2 weeks due to a title issue. You need to communicate this delay, empathize with his frustration, and explain the next steps. The agent is unavailable right now.",
    },
  ],
  US_BOOKKEEPING_VA: [
    {
      id: "bk_invoice_dispute",
      title: "Invoice Dispute Resolution",
      description: "A client disputes a charge on their invoice and wants it resolved immediately.",
      clientPersona: "Ms. Rivera, owner of a small bakery. She received an invoice with what she believes is an incorrect charge for consulting services she never requested. She's direct and business-minded.",
      situation: "Ms. Rivera calls about a $500 charge on her latest invoice that she doesn't recognize. You need to research the charge, listen to her concern, and propose a resolution path.",
    },
    {
      id: "bk_tax_docs",
      title: "Year-End Tax Document Request",
      description: "A client needs their year-end financial documents prepared urgently.",
      clientPersona: "Tom, a freelance consultant who needs his 1099 forms and profit/loss statement for his tax accountant. He's behind schedule and his CPA appointment is next week.",
      situation: "Tom needs several year-end documents compiled quickly. You need to understand exactly what he needs, set realistic expectations, and organize the workflow to meet his deadline.",
    },
  ],
};

export function getScenariosForCourse(
  courseSlug: CourseSlug,
): ReadonlyArray<SimulationScenario> {
  return SCENARIOS[courseSlug] ?? [];
}

/* ------------------------------------------------------------------ */
/*  Start simulation                                                   */
/* ------------------------------------------------------------------ */

export async function startSimulation(
  studentId: string,
  scenarioId: string,
  courseSlug: CourseSlug,
) {
  const allScenarios = SCENARIOS[courseSlug] ?? [];
  const scenario = allScenarios.find((s) => s.id === scenarioId);

  if (!scenario) {
    throw new Error("Scenario not found");
  }

  // Generate the client's opening message
  const openingMessage = await generateCompletion(
    buildClientSystemPrompt(scenario),
    "Start the conversation. Introduce yourself and explain your situation. Keep it to 2-3 sentences.",
    { temperature: 0.8, maxTokens: 200 },
  );

  const initialMessage: SimulationMessage = {
    role: "client",
    content: openingMessage,
    timestamp: new Date().toISOString(),
  };

  const session = await createSession(
    studentId,
    scenarioId,
    courseSlug,
    initialMessage,
  );

  return { session, scenario };
}

/* ------------------------------------------------------------------ */
/*  Send student message & get client response                         */
/* ------------------------------------------------------------------ */

export async function sendMessage(
  sessionId: string,
  studentMessage: string,
) {
  const session = await getSession(sessionId);
  if (!session || session.status !== "active") {
    throw new Error("Session not found or already completed");
  }

  const allScenarios = SCENARIOS[session.courseSlug] ?? [];
  const scenario = allScenarios.find((s) => s.id === session.scenario);
  if (!scenario) throw new Error("Scenario not found");

  // Save student message
  const studentMsg: SimulationMessage = {
    role: "student",
    content: studentMessage,
    timestamp: new Date().toISOString(),
  };

  await addMessage(sessionId, studentMsg);

  // Build conversation history for AI
  const conversationHistory = [...session.messages, studentMsg]
    .map((m) => `${m.role === "client" ? "Client" : "VA"}: ${m.content}`)
    .join("\n\n");

  // Generate client response
  const clientResponse = await generateCompletion(
    buildClientSystemPrompt(scenario),
    `Here is the conversation so far:\n\n${conversationHistory}\n\nRespond as the client. Keep it natural and in character. 1-3 sentences.`,
    { temperature: 0.8, maxTokens: 200 },
  );

  const clientMsg: SimulationMessage = {
    role: "client",
    content: clientResponse,
    timestamp: new Date().toISOString(),
  };

  const updated = await addMessage(sessionId, clientMsg);

  return updated;
}

/* ------------------------------------------------------------------ */
/*  End simulation & score                                             */
/* ------------------------------------------------------------------ */

interface SimulationScores {
  readonly communicationScore: number;
  readonly problemSolvingScore: number;
  readonly professionalismScore: number;
  readonly overallScore: number;
  readonly aiFeedback: string;
}

export async function endSimulation(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session || session.status !== "active") {
    throw new Error("Session not found or already completed");
  }

  const allScenarios = SCENARIOS[session.courseSlug] ?? [];
  const scenario = allScenarios.find((s) => s.id === session.scenario);

  const conversationText = session.messages
    .map((m) => `${m.role === "client" ? "Client" : "VA"}: ${m.content}`)
    .join("\n\n");

  const scores = await generateJsonCompletion<SimulationScores>(
    `You are evaluating a Virtual Assistant student's performance in a client simulation exercise.

Score each dimension from 0 to 100:

1. **communicationScore** — Clarity, grammar, tone, active listening
2. **problemSolvingScore** — Addressed the issue, offered solutions, followed through
3. **professionalismScore** — Courteous, empathetic, maintained boundaries, appropriate language

Calculate **overallScore** as the average of the three scores.

Provide **aiFeedback** — a 2-3 sentence summary of their performance with specific praise and improvement suggestions.

Respond with JSON:
{
  "communicationScore": number,
  "problemSolvingScore": number,
  "professionalismScore": number,
  "overallScore": number,
  "aiFeedback": "string"
}`,
    `Evaluate this VA student's performance:

**Scenario**: ${scenario?.title ?? session.scenario}
**Client Persona**: ${scenario?.clientPersona ?? "Unknown"}
**Situation**: ${scenario?.situation ?? "Unknown"}

**Conversation**:
${conversationText}

**Total messages exchanged**: ${session.messages.length}

Evaluate the student's performance.`,
    { temperature: 0.5, maxTokens: 512 },
  );

  const clamped = {
    communicationScore: clamp(scores.communicationScore),
    problemSolvingScore: clamp(scores.problemSolvingScore),
    professionalismScore: clamp(scores.professionalismScore),
    overallScore: clamp(scores.overallScore),
    aiFeedback: scores.aiFeedback || "Simulation complete.",
  };

  return completeSession(sessionId, clamped);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildClientSystemPrompt(scenario: SimulationScenario): string {
  return `You are role-playing as a client in a Virtual Assistant training simulation.

**Your Character**: ${scenario.clientPersona}

**The Situation**: ${scenario.situation}

Stay in character at all times. Be realistic — express emotions naturally (frustration, confusion, satisfaction) based on how well the VA handles your situation.

IMPORTANT rules:
- Never break character
- Never say you are an AI
- Respond naturally as the client would
- If the VA handles things well, be satisfied and cooperative
- If the VA is unhelpful or rude, express appropriate displeasure
- Keep responses concise (1-3 sentences per message)`;
}

function clamp(value: unknown): number {
  const num = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

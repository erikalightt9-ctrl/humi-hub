import { generateJsonCompletion } from "@/lib/services/openai.service";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EmailScenarioTemplate {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly senderRole: string;
  readonly recipientRole: string;
}

interface ScenarioContext {
  readonly context: string;
  readonly keyPoints: ReadonlyArray<string>;
}

interface EmailEvaluation {
  readonly toneScore: number;
  readonly clarityScore: number;
  readonly completenessScore: number;
  readonly grammarScore: number;
  readonly industryLanguageScore: number;
  readonly overallScore: number;
  readonly feedback: string;
  readonly suggestedVersion: string;
  readonly strengths: ReadonlyArray<string>;
  readonly improvements: ReadonlyArray<string>;
}

/* ------------------------------------------------------------------ */
/*  Email scenario definitions per course                              */
/* ------------------------------------------------------------------ */

const EMAIL_SCENARIOS: Record<string, ReadonlyArray<EmailScenarioTemplate>> = {
  MEDICAL_VA: [
    {
      type: "appointment_followup",
      title: "Patient Appointment Follow-Up",
      description:
        "Write a follow-up email to a patient who missed their scheduled appointment. Be professional, empathetic, and offer rescheduling options.",
      senderRole: "Medical Virtual Assistant",
      recipientRole: "Patient",
    },
    {
      type: "insurance_denial",
      title: "Insurance Claim Denial Response",
      description:
        "Draft a professional response to an insurance company regarding a denied claim. Include relevant patient information and reasons for appeal.",
      senderRole: "Medical VA (on behalf of Dr. Office)",
      recipientRole: "Insurance Company",
    },
    {
      type: "referral_coordination",
      title: "Specialist Referral Coordination",
      description:
        "Email a specialist office to coordinate a patient referral. Include relevant medical information and scheduling preferences.",
      senderRole: "Medical Virtual Assistant",
      recipientRole: "Specialist Office Coordinator",
    },
  ],
  REAL_ESTATE_VA: [
    {
      type: "listing_inquiry",
      title: "Property Listing Inquiry Response",
      description:
        "Respond to a potential buyer who inquired about a listed property. Provide key details and schedule a showing.",
      senderRole: "Real Estate Virtual Assistant",
      recipientRole: "Prospective Buyer",
    },
    {
      type: "offer_negotiation",
      title: "Offer Negotiation Update",
      description:
        "Email the buyer's agent with a counter-offer from your client. Be diplomatic and professional.",
      senderRole: "Real Estate VA (on behalf of Listing Agent)",
      recipientRole: "Buyer's Agent",
    },
    {
      type: "closing_coordination",
      title: "Closing Document Follow-Up",
      description:
        "Follow up with the title company about pending closing documents and deadlines.",
      senderRole: "Real Estate Virtual Assistant",
      recipientRole: "Title Company Coordinator",
    },
  ],
  US_BOOKKEEPING_VA: [
    {
      type: "invoice_reminder",
      title: "Overdue Invoice Reminder",
      description:
        "Send a professional payment reminder for an overdue invoice. Be firm but courteous.",
      senderRole: "Bookkeeping Virtual Assistant",
      recipientRole: "Client (Business Owner)",
    },
    {
      type: "payment_receipt",
      title: "Payment Receipt Confirmation",
      description:
        "Confirm receipt of payment and provide updated account status.",
      senderRole: "Bookkeeping VA",
      recipientRole: "Client",
    },
    {
      type: "tax_document_request",
      title: "Tax Document Request",
      description:
        "Request missing W-9 forms from a contractor before the tax filing deadline.",
      senderRole: "Bookkeeping Virtual Assistant",
      recipientRole: "Independent Contractor",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Get available scenarios for a course                               */
/* ------------------------------------------------------------------ */

export function getScenarios(
  courseSlug: string,
): ReadonlyArray<EmailScenarioTemplate> {
  return EMAIL_SCENARIOS[courseSlug] ?? [];
}

/* ------------------------------------------------------------------ */
/*  Generate unique scenario context via AI                            */
/* ------------------------------------------------------------------ */

export async function generateScenarioContext(
  template: EmailScenarioTemplate,
): Promise<ScenarioContext> {
  const result = await generateJsonCompletion<{
    readonly context: string;
    readonly keyPoints: ReadonlyArray<string>;
  }>(
    `You are an expert scenario designer for Virtual Assistant training programs. Your job is to create realistic, unique email scenarios with specific details that students can practice writing.

Generate a realistic scenario context for the following email type. Include specific names, dates, amounts, reference numbers, and other concrete details that make the scenario feel real. The context should give the student everything they need to write a professional email.

IMPORTANT: Make each scenario unique with different names, situations, and details every time.`,
    `Create a unique scenario context for this email practice:

**Email Type**: ${template.title}
**Description**: ${template.description}
**From (sender role)**: ${template.senderRole}
**To (recipient role)**: ${template.recipientRole}

Generate:
1. "context" - A 3-5 sentence paragraph describing the specific situation with names, dates, amounts, and other relevant details the student needs to write the email.
2. "keyPoints" - An array of 4-6 specific points that should be addressed in the email.

Respond with JSON:
{
  "context": "Detailed scenario context...",
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"]
}`,
    { temperature: 0.9, maxTokens: 800 },
  );

  return {
    context: result.context || "No context generated.",
    keyPoints: result.keyPoints ?? [],
  };
}

/* ------------------------------------------------------------------ */
/*  Evaluate student email via AI                                      */
/* ------------------------------------------------------------------ */

export async function evaluateEmail(
  scenarioPrompt: string,
  senderRole: string,
  recipientRole: string,
  email: string,
): Promise<EmailEvaluation> {
  const result = await generateJsonCompletion<{
    readonly toneScore: number;
    readonly clarityScore: number;
    readonly completenessScore: number;
    readonly grammarScore: number;
    readonly industryLanguageScore: number;
    readonly overallScore: number;
    readonly feedback: string;
    readonly suggestedVersion: string;
    readonly strengths: ReadonlyArray<string>;
    readonly improvements: ReadonlyArray<string>;
  }>(
    `You are an expert professional email evaluator for a Virtual Assistant training program. Evaluate the student's email on 5 dimensions, each scored from 0 to 100.

**Scoring Dimensions:**
1. **toneScore** - Tone & Professionalism: appropriate formality, courteous language, empathetic when needed, confident without being arrogant
2. **clarityScore** - Clarity & Structure: well-organized, logical flow, easy to understand, proper paragraphing, clear subject/purpose
3. **completenessScore** - Completeness: addresses all key points from the scenario, includes necessary details, has proper greeting and closing
4. **grammarScore** - Grammar & Spelling: correct grammar, punctuation, spelling, sentence structure, no typos
5. **industryLanguageScore** - Industry Language: appropriate use of industry-specific terminology, correct jargon usage, professional vocabulary

Calculate **overallScore** as the weighted average: tone 25%, clarity 25%, completeness 20%, grammar 15%, industry language 15%.

Also provide:
- **feedback**: A 3-4 sentence constructive summary of the email's quality
- **suggestedVersion**: A complete rewritten version of the email that demonstrates best practices
- **strengths**: Array of 2-4 specific things the student did well
- **improvements**: Array of 2-4 specific areas for improvement with actionable suggestions`,
    `Evaluate this student's email:

**Scenario Context**: ${scenarioPrompt}
**Sender Role**: ${senderRole}
**Recipient Role**: ${recipientRole}

**Student's Email**:
${email}

Evaluate the email and respond with JSON:
{
  "toneScore": number,
  "clarityScore": number,
  "completenessScore": number,
  "grammarScore": number,
  "industryLanguageScore": number,
  "overallScore": number,
  "feedback": "string",
  "suggestedVersion": "string",
  "strengths": ["string"],
  "improvements": ["string"]
}`,
    { temperature: 0.4, maxTokens: 2000 },
  );

  return {
    toneScore: clamp(result.toneScore),
    clarityScore: clamp(result.clarityScore),
    completenessScore: clamp(result.completenessScore),
    grammarScore: clamp(result.grammarScore),
    industryLanguageScore: clamp(result.industryLanguageScore),
    overallScore: clamp(result.overallScore),
    feedback: result.feedback || "Evaluation complete.",
    suggestedVersion: result.suggestedVersion || "",
    strengths: result.strengths ?? [],
    improvements: result.improvements ?? [],
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(value: unknown): number {
  const num = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

import { generateCompletion } from "@/lib/services/openai.service";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DocumentType = "proposal" | "invoice" | "contract" | "email" | "sop";

export interface DocumentInput {
  readonly type: DocumentType;
  readonly clientName: string;
  readonly businessName: string;
  readonly details: string;
}

export interface GeneratedDocument {
  readonly type: DocumentType;
  readonly title: string;
  readonly content: string;
  readonly generatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Document templates / system prompts                                */
/* ------------------------------------------------------------------ */

const DOCUMENT_PROMPTS: Record<DocumentType, string> = {
  proposal: `You are a professional Virtual Assistant helping create a business proposal.

Generate a clean, professional service proposal with the following sections:
1. Cover / Title
2. Executive Summary
3. Scope of Services
4. Deliverables & Timeline
5. Pricing
6. Terms & Conditions
7. About Us / Why Choose Us

Use professional business language. Include placeholder amounts in [brackets] where the VA should fill in specific numbers.
Format the output as clean text with clear section headers (use ### for headers).`,

  invoice: `You are a professional Virtual Assistant helping create an invoice.

Generate a professional invoice with:
1. Invoice header (Invoice #, Date, Due Date)
2. From (Business info)
3. Bill To (Client info)
4. Line items table (Service Description, Quantity, Rate, Amount)
5. Subtotal, Tax, Total
6. Payment Terms & Methods

Use placeholder values in [brackets] for specific amounts.
Format as clean text with clear sections.`,

  contract: `You are a professional Virtual Assistant helping create a service agreement/contract.

Generate a professional service contract with:
1. Agreement title and effective date
2. Parties involved
3. Scope of Services
4. Term and Termination
5. Compensation and Payment Terms
6. Confidentiality
7. Independent Contractor Status
8. Limitation of Liability
9. General Provisions
10. Signatures block

Use professional legal-adjacent language (note: this is a template, not legal advice).
Format as clean text with numbered sections.`,

  email: `You are a professional Virtual Assistant helping draft a business email.

Generate a professional email with:
1. Subject line
2. Greeting
3. Body (clear, concise, professional)
4. Call to action
5. Professional sign-off

Keep it concise and professional. Match the tone to the context provided.`,

  sop: `You are a professional Virtual Assistant helping create a Standard Operating Procedure (SOP).

Generate a clear SOP document with:
1. Title and version
2. Purpose
3. Scope
4. Responsibilities
5. Step-by-step procedure (numbered)
6. Quality checks
7. Revision history placeholder

Be specific and actionable. Use clear, concise language.`,
};

const DOCUMENT_TITLES: Record<DocumentType, string> = {
  proposal: "Service Proposal",
  invoice: "Invoice",
  contract: "Service Agreement",
  email: "Business Email",
  sop: "Standard Operating Procedure",
};

/* ------------------------------------------------------------------ */
/*  Generate document                                                  */
/* ------------------------------------------------------------------ */

export async function generateDocument(
  input: DocumentInput,
): Promise<GeneratedDocument> {
  const systemPrompt = DOCUMENT_PROMPTS[input.type];

  const userPrompt = `Create a ${DOCUMENT_TITLES[input.type]} with these details:

**Business/Service Provider**: ${input.businessName || "[Your Business Name]"}
**Client**: ${input.clientName || "[Client Name]"}

**Details & Context**:
${input.details}

Generate the complete document now.`;

  const content = await generateCompletion(systemPrompt, userPrompt, {
    temperature: 0.6,
    maxTokens: 2048,
  });

  return {
    type: input.type,
    title: `${DOCUMENT_TITLES[input.type]} — ${input.clientName || "Client"}`,
    content,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Maps course slugs to related skill keywords for AI job matching.
 * Used by the job sync service to auto-tag imported jobs and by
 * the AI matching service for better course–job alignment.
 */
export const COURSE_SKILL_MAPPINGS: Readonly<Record<string, readonly string[]>> = {
  "us-bookkeeping-va": [
    "accounting", "QuickBooks", "invoicing", "bookkeeping",
    "financial reporting", "accounts payable", "accounts receivable",
    "bank reconciliation", "payroll", "tax preparation",
  ],
  "medical-va": [
    "medical billing", "healthcare", "EHR", "HIPAA",
    "patient scheduling", "medical coding", "insurance verification",
    "clinical documentation", "medical transcription",
  ],
  "ecommerce-va": [
    "Shopify", "product listing", "ecommerce", "inventory management",
    "order fulfillment", "customer support", "Amazon FBA",
    "product photography", "marketplace management",
  ],
  "real-estate-va": [
    "real estate", "CRM", "listing management", "transaction coordination",
    "property management", "MLS", "lead generation",
    "client follow-up", "market research",
  ],
  "customer-success": [
    "customer support", "client management", "CRM", "onboarding",
    "account management", "retention", "help desk",
    "customer service", "client success",
  ],
  "digital-marketing": [
    "SEO", "social media", "content marketing", "analytics",
    "PPC", "Google Ads", "email marketing", "copywriting",
    "Facebook Ads", "content creation",
  ],
  "general-va": [
    "virtual assistant", "admin support", "data entry", "scheduling",
    "email management", "calendar management", "travel booking",
    "executive assistant", "project coordination",
  ],
  "ai-automation": [
    "AI tools", "automation", "ChatGPT", "productivity",
    "workflow automation", "Zapier", "Make.com", "prompt engineering",
    "AI integration", "process optimization",
  ],
} as const;

/** Industries commonly matched to job postings */
export const JOB_INDUSTRIES: readonly string[] = [
  "Healthcare",
  "Finance & Accounting",
  "Real Estate",
  "E-commerce & Retail",
  "Technology",
  "Marketing & Advertising",
  "Legal",
  "Education",
  "Consulting",
  "Startups",
  "Other",
] as const;

/** Job types for filtering */
export const JOB_TYPE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "freelance", label: "Freelance" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;

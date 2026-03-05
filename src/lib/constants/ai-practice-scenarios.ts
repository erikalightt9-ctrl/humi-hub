import type { CourseSlug } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AIPracticeScenario {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly samplePrompt: string;
  readonly expectedOutputFormat: string;
}

export interface AIPracticeCategory {
  readonly name: string;
  readonly icon: string;
  readonly scenarios: ReadonlyArray<AIPracticeScenario>;
}

export interface AIPracticeCourseData {
  readonly courseTitle: string;
  readonly categories: ReadonlyArray<AIPracticeCategory>;
}

/* ------------------------------------------------------------------ */
/*  Medical VA Scenarios                                               */
/* ------------------------------------------------------------------ */

const MEDICAL_VA_DATA: AIPracticeCourseData = {
  courseTitle: "Medical Virtual Assistant",
  categories: [
    {
      name: "Clinical Documentation",
      icon: "FileText",
      scenarios: [
        {
          id: "med-doc-1",
          title: "SOAP Note Drafting",
          description:
            "Use AI to draft a SOAP note from raw consultation notes. You verify medical accuracy and HIPAA compliance.",
          samplePrompt:
            "Draft a SOAP note for a 45-year-old female patient presenting with persistent lower back pain for 2 weeks. Chief complaint: radiating pain to left leg. Vitals: BP 130/85, HR 78, Temp 98.6F. Physical exam: tenderness at L4-L5, positive straight leg raise on left. Assessment: suspected lumbar disc herniation. Plan: MRI ordered, NSAIDs prescribed, physical therapy referral.",
          expectedOutputFormat:
            "Structured SOAP note with Subjective, Objective, Assessment, and Plan sections. Each section should have clear bullet points. Include ICD-10 code suggestion.",
        },
        {
          id: "med-doc-2",
          title: "Patient Visit Summary",
          description:
            "Generate a patient-friendly visit summary from clinical notes. You review for accuracy and appropriate language.",
          samplePrompt:
            "Create a patient-friendly visit summary from the following clinical notes: Patient saw Dr. Martinez for follow-up on Type 2 Diabetes. A1C improved from 8.2 to 7.1. Metformin 500mg BID continued. Added dietary counseling referral. Next visit in 3 months with repeat labs 2 weeks prior.",
          expectedOutputFormat:
            "A clear, non-technical summary in 2-3 paragraphs that the patient can understand. Include: what was discussed, any changes to treatment, and next steps with dates.",
        },
      ],
    },
    {
      name: "Patient Scheduling",
      icon: "Calendar",
      scenarios: [
        {
          id: "med-sched-1",
          title: "Appointment Reminder Templates",
          description:
            "Use AI to create personalized appointment reminder messages. You verify patient details and timing.",
          samplePrompt:
            "Create 3 appointment reminder templates for a dental clinic: (1) 7-day reminder via email, (2) 1-day reminder via SMS, (3) 2-hour reminder via SMS. Include: patient name placeholder, appointment date/time, clinic name 'Smile Care Dental', address '123 Main St', and cancellation/reschedule instructions with 24-hour notice policy.",
          expectedOutputFormat:
            "Three separate templates with placeholders marked as [Patient Name], [Date], [Time]. Each template should be appropriately sized for its channel (email = longer, SMS = under 160 characters).",
        },
        {
          id: "med-sched-2",
          title: "Schedule Optimization Analysis",
          description:
            "Use AI to analyze appointment patterns and suggest schedule improvements.",
          samplePrompt:
            "Analyze this weekly appointment pattern for a family practice: Monday 8am-5pm (28 patients, 4 no-shows), Tuesday 8am-5pm (25 patients, 2 no-shows), Wednesday 8am-12pm (12 patients, 1 no-show), Thursday 8am-5pm (30 patients, 6 no-shows), Friday 8am-3pm (18 patients, 3 no-shows). Average appointment: 15 min. Suggest ways to reduce no-shows and optimize the schedule.",
          expectedOutputFormat:
            "Analysis with: (1) No-show rate per day, (2) Busiest/lightest days, (3) 3-5 specific recommendations with rationale, (4) Suggested overbooking strategy per day.",
        },
      ],
    },
    {
      name: "Insurance Verification",
      icon: "Shield",
      scenarios: [
        {
          id: "med-ins-1",
          title: "Insurance Verification Checklist",
          description:
            "Use AI to create a comprehensive insurance verification checklist for different insurance types.",
          samplePrompt:
            "Create a detailed insurance verification checklist for verifying a patient's health insurance coverage before a scheduled orthopedic surgery (knee arthroscopy). Include steps for: verifying eligibility, checking benefits, pre-authorization requirements, out-of-pocket cost estimation, and documentation needed.",
          expectedOutputFormat:
            "Numbered checklist with main categories and sub-items. Include specific questions to ask the insurance company and fields to document. Format as a reusable template.",
        },
      ],
    },
    {
      name: "Patient Communication",
      icon: "MessageCircle",
      scenarios: [
        {
          id: "med-comm-1",
          title: "Patient Education Materials",
          description:
            "Use AI to draft patient education handouts. You verify medical accuracy with the provider.",
          samplePrompt:
            "Create a patient education handout about managing Type 2 Diabetes at home. Target audience: newly diagnosed adults with no medical background. Include: what is diabetes (simple explanation), daily management tips (diet, exercise, medication), warning signs to watch for, and when to call the doctor. Keep language at 6th grade reading level.",
          expectedOutputFormat:
            "One-page handout format with: title, 4-5 sections with headers, bullet points for easy scanning, a 'Call Your Doctor If...' box at the bottom. No medical jargon.",
        },
        {
          id: "med-comm-2",
          title: "Follow-Up Email Template",
          description:
            "Generate professional follow-up emails for patients after procedures.",
          samplePrompt:
            "Write a follow-up email template to send to patients 48 hours after a minor outpatient procedure (skin biopsy). Include: care instructions for the biopsy site, signs of infection to watch for, when results will be available, how to schedule a follow-up, and emergency contact information. Clinic name: Advanced Dermatology Associates.",
          expectedOutputFormat:
            "Professional email with subject line, greeting with patient name placeholder, organized body with clear sections, and signature block. Warm but professional tone.",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Real Estate VA Scenarios                                           */
/* ------------------------------------------------------------------ */

const REAL_ESTATE_VA_DATA: AIPracticeCourseData = {
  courseTitle: "Real Estate Virtual Assistant",
  categories: [
    {
      name: "Property Listing Management",
      icon: "Home",
      scenarios: [
        {
          id: "re-list-1",
          title: "MLS Listing Description",
          description:
            "Use AI to write compelling property descriptions from raw details. You verify accuracy against the listing sheet.",
          samplePrompt:
            "Write an MLS listing description for: 3BR/2BA single-family home, 1,850 sq ft, built 2018, lot size 0.25 acres, in Sunset Hills subdivision, Orlando FL. Features: open floor plan, quartz countertops, stainless steel appliances, walk-in closet in master, covered lanai, 2-car garage, smart home system (Ring doorbell, Nest thermostat). HOA $150/month includes lawn care and community pool. Listed at $385,000.",
          expectedOutputFormat:
            "150-200 word description with attention-grabbing opening line, key features highlighted, neighborhood/lifestyle appeal, and a call to action. MLS-compliant format.",
        },
        {
          id: "re-list-2",
          title: "Social Media Property Post",
          description:
            "Create social media content from listing details. You add the final touch and local knowledge.",
          samplePrompt:
            "Create an Instagram post caption for a luxury condo listing: 2BR/2BA penthouse, 1,200 sq ft, 15th floor with ocean views, Miami Beach. Price: $1.2M. Features: floor-to-ceiling windows, Italian marble bathroom, private balcony, concierge, rooftop pool. Include relevant hashtags and an emoji-friendly tone.",
          expectedOutputFormat:
            "Instagram caption (under 2,200 characters) with: hook/opening line, 3-4 key highlights, lifestyle appeal, call to action, and 15-20 relevant hashtags.",
        },
      ],
    },
    {
      name: "Client Follow-Up",
      icon: "Users",
      scenarios: [
        {
          id: "re-follow-1",
          title: "Lead Nurture Email Sequence",
          description:
            "Use AI to draft a lead nurture email sequence. You personalize based on your knowledge of the lead.",
          samplePrompt:
            "Create a 3-email drip sequence for a buyer lead who attended an open house but hasn't scheduled a showing. Lead name: Sarah. Property visited: 4BR colonial in Maplewood, NJ ($550K). Lead mentioned interest in good school districts and a big backyard. Agent name: Mike Torres, RE/MAX Elite.",
          expectedOutputFormat:
            "Three emails: (1) Day 1: Thank you + related listings, (2) Day 4: Neighborhood/school district info, (3) Day 8: Soft follow-up with new listing alert. Each with subject line and body.",
        },
      ],
    },
    {
      name: "Market Research",
      icon: "TrendingUp",
      scenarios: [
        {
          id: "re-market-1",
          title: "Comparative Market Analysis Summary",
          description:
            "Use AI to summarize CMA data into a client-ready report. You verify the comparable sales data.",
          samplePrompt:
            "Summarize this CMA data into a client-ready report for a seller: Subject property: 3BR/2BA, 1,600 sq ft ranch in Austin, TX 78745. Comp 1: 3BR/2BA, 1,550 sq ft, sold $420K (30 days ago), Comp 2: 3BR/2BA, 1,700 sq ft, sold $445K (45 days ago), Comp 3: 4BR/2BA, 1,800 sq ft, sold $465K (20 days ago). Average DOM in area: 22 days. Suggest listing price range.",
          expectedOutputFormat:
            "Client-friendly summary with: property overview, comparable sales table, price adjustments, recommended listing price range with rationale, and suggested pricing strategy.",
        },
      ],
    },
    {
      name: "Transaction Coordination",
      icon: "ClipboardList",
      scenarios: [
        {
          id: "re-trans-1",
          title: "Closing Checklist Generator",
          description:
            "Use AI to create a comprehensive closing checklist based on transaction type.",
          samplePrompt:
            "Create a closing checklist for a standard residential purchase in Florida. Buyer is using FHA financing. Contract date: March 1, closing date: April 15. Include all key milestones, deadlines, and responsible parties (buyer, seller, lender, title company, agent). Include specific Florida requirements.",
          expectedOutputFormat:
            "Timeline-based checklist with dates calculated from contract and closing dates. Categories: contract execution, inspection period, financing, title, pre-closing, and closing day. Include responsible party for each item.",
        },
        {
          id: "re-trans-2",
          title: "Status Update Email",
          description:
            "Draft professional transaction update emails for all parties.",
          samplePrompt:
            "Write a weekly transaction status update email to send to the buyer and their agent. Transaction: 123 Oak Street purchase. Update: appraisal completed at $425K (meets contract price), title search clear, lender approved conditions — final underwriting review pending. Remaining items: buyer's final walkthrough (scheduled March 28), closing scheduled March 31.",
          expectedOutputFormat:
            "Professional email with: subject line including property address, status summary, completed items, pending items with dates, and next steps. Clean, scannable format.",
        },
      ],
    },
    {
      name: "CRM Data Entry",
      icon: "Database",
      scenarios: [
        {
          id: "re-crm-1",
          title: "Contact Data Standardization",
          description:
            "Use AI to clean and standardize contact data before CRM import.",
          samplePrompt:
            "Clean and standardize the following contact data for CRM import. Fix formatting, standardize phone numbers to (XXX) XXX-XXXX, standardize addresses, and flag any issues:\n1. john smith, 123 main st apt 4b, orlando fl, 3218675309, john@gmail.com\n2. SARAH JOHNSON, 456 Oak Avenue, Winter Park, FL 32789, (407) 555.1234, sarah_j@yahoo.com\n3. Dr. Mike Torres, 789 pine ln, Kissimmee Florida, 4075559876, mike@remax.com",
          expectedOutputFormat:
            "Formatted table with columns: Full Name, Address, City, State, ZIP, Phone, Email, Notes/Flags. All entries standardized to consistent format.",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  US Bookkeeping VA Scenarios                                        */
/* ------------------------------------------------------------------ */

const US_BOOKKEEPING_VA_DATA: AIPracticeCourseData = {
  courseTitle: "US Bookkeeping Virtual Assistant",
  categories: [
    {
      name: "Invoice Processing",
      icon: "Receipt",
      scenarios: [
        {
          id: "bk-inv-1",
          title: "Invoice Data Extraction",
          description:
            "Use AI to extract structured data from invoice text. You verify against the original document.",
          samplePrompt:
            "Extract and structure the following invoice data: Invoice #2024-0847 from TechSupply Inc (EIN: 12-3456789), 456 Commerce Dr, Dallas TX 75201, dated February 15, 2024, due March 17, 2024. Items: 5x Dell Monitor 24\" @ $289.99 each, 3x Logitech Keyboard @ $49.99 each, 1x Network Switch @ $399.99. Subtotal, TX sales tax 8.25%, shipping $45.00. Payment terms: Net 30. Bill to: Acme Corp, AP Dept.",
          expectedOutputFormat:
            "Structured table with: vendor info, invoice details, line items (qty, description, unit price, line total), subtotal, tax, shipping, total. Plus QuickBooks category suggestions for each line item.",
        },
        {
          id: "bk-inv-2",
          title: "Invoice Discrepancy Report",
          description:
            "Use AI to compare invoice against purchase order and flag discrepancies.",
          samplePrompt:
            "Compare this invoice against the original PO and flag any discrepancies. PO #PO-2024-102: 10x Widget A @ $25.00 ($250.00), 5x Widget B @ $40.00 ($200.00), Total: $450.00. Invoice #INV-5567: 10x Widget A @ $27.50 ($275.00), 5x Widget B @ $40.00 ($200.00), 2x Widget C @ $15.00 ($30.00), Total: $505.00. Summarize all differences.",
          expectedOutputFormat:
            "Discrepancy report with: (1) Price differences by item, (2) Quantity differences, (3) Items on invoice not on PO, (4) Items on PO not on invoice, (5) Total difference, (6) Recommended action.",
        },
      ],
    },
    {
      name: "Bank Reconciliation",
      icon: "Building",
      scenarios: [
        {
          id: "bk-recon-1",
          title: "Reconciliation Discrepancy Analysis",
          description:
            "Use AI to analyze bank reconciliation differences and suggest corrections.",
          samplePrompt:
            "Analyze the following bank reconciliation for March 2024. Bank statement ending balance: $24,567.89. Book balance: $23,892.45. Outstanding checks: #1045 ($350.00), #1048 ($125.44). Deposits in transit: $800.00. Bank service charge not recorded: $35.00. Interest earned not recorded: $12.50. NSF check from customer (returned): $497.50. Determine if the reconciliation balances and identify any remaining discrepancy.",
          expectedOutputFormat:
            "Step-by-step reconciliation worksheet showing: adjusted bank balance, adjusted book balance, all adjustments applied, final comparison, and journal entries needed for book adjustments.",
        },
      ],
    },
    {
      name: "Expense Categorization",
      icon: "Tags",
      scenarios: [
        {
          id: "bk-exp-1",
          title: "Transaction Categorization",
          description:
            "Use AI to categorize bank transactions into chart of accounts categories. You verify and fix any misclassifications.",
          samplePrompt:
            "Categorize these transactions using standard US small business chart of accounts (following IRS Schedule C categories where applicable): 1) AMZN Business Supply $234.56, 2) Comcast Internet $89.99, 3) Shell Gas Station $45.23, 4) Staples Office $127.80, 5) Adobe Creative Cloud $54.99, 6) Delta Airlines $456.00, 7) Hilton Hotels $189.50, 8) Uber trip $23.45, 9) AT&T Wireless $125.00, 10) GoDaddy domain renewal $17.99",
          expectedOutputFormat:
            "Table with: Transaction, Amount, Suggested Category, IRS Schedule C Line (if applicable), Confidence Level (High/Medium/Low), Notes. Group by category for review.",
        },
      ],
    },
    {
      name: "Financial Reporting",
      icon: "BarChart",
      scenarios: [
        {
          id: "bk-report-1",
          title: "Monthly Financial Summary",
          description:
            "Use AI to create a client-ready financial summary from raw numbers. You verify the calculations.",
          samplePrompt:
            "Create a monthly financial summary for a small consulting firm, March 2024. Revenue: Consulting fees $45,000, Training workshops $12,000. Expenses: Payroll $28,000, Rent $3,500, Software subscriptions $890, Marketing $2,200, Travel $1,850, Insurance $650, Utilities $380, Office supplies $245. Prior month (February): Total revenue $52,000, Total expenses $36,500. Prepare a summary with month-over-month comparison.",
          expectedOutputFormat:
            "Executive summary (2-3 sentences), P&L statement format, month-over-month comparison with % changes, key metrics (profit margin, expense ratio), and 2-3 observations or recommendations.",
        },
        {
          id: "bk-report-2",
          title: "Accounts Receivable Aging Report",
          description:
            "Use AI to generate an AR aging summary with collection priority recommendations.",
          samplePrompt:
            "Generate an accounts receivable aging analysis from this data: Client A: Invoice $5,000 (15 days past due), Client B: Invoice $12,500 (45 days past due), Client C: Invoice $3,200 (current, due in 10 days), Client D: Invoice $8,750 (60 days past due), Client E: Invoice $2,100 (30 days past due), Client F: Invoice $15,000 (90+ days past due). Total AR: $46,550. Create aging buckets and suggest collection priority.",
          expectedOutputFormat:
            "Aging summary table with buckets: Current, 1-30 days, 31-60 days, 61-90 days, 90+ days. Include: amount per bucket, % of total, collection priority ranking, and suggested action for each client.",
        },
      ],
    },
    {
      name: "Accounts Payable/Receivable",
      icon: "ArrowLeftRight",
      scenarios: [
        {
          id: "bk-ap-1",
          title: "Payment Reminder Email Drafting",
          description:
            "Use AI to draft professional payment reminder emails at various urgency levels.",
          samplePrompt:
            "Draft 3 payment reminder emails for an overdue invoice: Company: Design Pro LLC, Invoice #INV-2024-0234, Amount: $4,750.00, Original due date: February 1, 2024. Create: (1) Friendly first reminder (7 days overdue), (2) Firm second reminder (30 days overdue), (3) Final notice (60 days overdue, mention collections). From: Sarah, Accounts Receivable at Creative Solutions Inc.",
          expectedOutputFormat:
            "Three professional emails with escalating tone. Each with: subject line, body, specific invoice details, payment instructions, and appropriate closing. The final notice should mention next steps without being threatening.",
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Exported Data Map                                                  */
/* ------------------------------------------------------------------ */

export const AI_PRACTICE_DATA: Record<CourseSlug, AIPracticeCourseData> = {
  MEDICAL_VA: MEDICAL_VA_DATA,
  REAL_ESTATE_VA: REAL_ESTATE_VA_DATA,
  US_BOOKKEEPING_VA: US_BOOKKEEPING_VA_DATA,
};

export function getAIPracticeData(slug: string): AIPracticeCourseData | null {
  return AI_PRACTICE_DATA[slug as CourseSlug] ?? null;
}

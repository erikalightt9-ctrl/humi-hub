import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const CourseSlug = {
  MEDICAL_VA: "MEDICAL_VA",
  REAL_ESTATE_VA: "REAL_ESTATE_VA",
  US_BOOKKEEPING_VA: "US_BOOKKEEPING_VA",
} as const;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed courses
  const courses = [
    {
      slug: CourseSlug.MEDICAL_VA,
      title: "Medical Virtual Assistant",
      description:
        "Become a certified Medical VA equipped to support healthcare professionals with administrative and clinical documentation tasks. Learn medical terminology, EHR systems, appointment scheduling, insurance verification, and HIPAA compliance.",
      durationWeeks: 8,
      price: 15000,
      outcomes: [
        "Proficiency in medical terminology and clinical documentation",
        "Hands-on experience with Electronic Health Record (EHR) systems",
        "HIPAA compliance and patient data privacy best practices",
        "Insurance verification and prior authorization workflows",
        "Appointment scheduling and patient communication skills",
        "Medical billing and coding fundamentals",
      ],
    },
    {
      slug: CourseSlug.REAL_ESTATE_VA,
      title: "Real Estate Virtual Assistant",
      description:
        "Launch your career as a Real Estate VA by mastering property research, listing management, CRM tools, and client coordination. Support real estate agents and brokers remotely with tasks that drive sales and streamline operations.",
      durationWeeks: 6,
      price: 12000,
      outcomes: [
        "Property research and comparative market analysis (CMA)",
        "MLS listing management and real estate database tools",
        "CRM management and lead follow-up automation",
        "Contract preparation and transaction coordination",
        "Social media marketing for real estate",
        "Client communication and calendar management",
      ],
    },
    {
      slug: CourseSlug.US_BOOKKEEPING_VA,
      title: "US Bookkeeping Virtual Assistant",
      description:
        "Master US bookkeeping standards and become a trusted financial assistant for American businesses. Cover QuickBooks, accounts payable/receivable, bank reconciliation, payroll support, and financial reporting fundamentals.",
      durationWeeks: 10,
      price: 18000,
      outcomes: [
        "QuickBooks Online and Desktop proficiency",
        "Accounts payable and accounts receivable management",
        "Bank and credit card reconciliation",
        "Payroll processing basics and compliance",
        "Financial statement preparation and analysis",
        "US tax fundamentals and chart of accounts setup",
      ],
    },
  ];

  const createdCourses: Record<string, string> = {};

  for (const course of courses) {
    const c = await prisma.course.upsert({
      where: { slug: course.slug },
      update: course,
      create: course,
    });
    createdCourses[course.slug] = c.id;
  }

  console.log("✅ Courses seeded");

  // Seed admin user
  const passwordHash = await bcrypt.hash("Admin@123456!", 12);
  await prisma.admin.upsert({
    where: { email: "admin@vatrainingcenter.com" },
    update: {},
    create: {
      email: "admin@vatrainingcenter.com",
      passwordHash,
      name: "Super Admin",
    },
  });

  console.log("✅ Admin user seeded");

  // Seed badges
  const badges = [
    {
      type: "FIRST_LESSON" as const,
      name: "First Step",
      description: "Complete your very first lesson",
      icon: "🌟",
    },
    {
      type: "QUIZ_MASTER" as const,
      name: "Quiz Master",
      description: "Pass 3 or more quizzes",
      icon: "🏆",
    },
    {
      type: "COURSE_COMPLETER" as const,
      name: "Course Completer",
      description: "Complete all lessons in a course",
      icon: "🎓",
    },
    {
      type: "TOP_CONTRIBUTOR" as const,
      name: "Top Contributor",
      description: "Post 10 or more forum messages",
      icon: "💬",
    },
    {
      type: "ASSIGNMENT_STAR" as const,
      name: "Assignment Star",
      description: "Submit your first assignment",
      icon: "📝",
    },
    {
      type: "FORUM_STARTER" as const,
      name: "Forum Starter",
      description: "Post your first forum message",
      icon: "🗣️",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { type: badge.type },
      update: badge,
      create: badge,
    });
  }

  console.log("✅ Badges seeded");

  // Seed sample lessons for Medical VA
  const medicalLessons = [
    {
      title: "Introduction to Medical Virtual Assistance",
      content: `Welcome to the Medical Virtual Assistant course!

In this first lesson, we'll explore what it means to be a Medical VA and how this role is reshaping healthcare support systems globally.

**What is a Medical Virtual Assistant?**
A Medical VA is a remote professional who provides administrative and clinical support to healthcare providers, clinics, hospitals, and medical practices. Unlike in-person medical assistants, Medical VAs work entirely online, leveraging technology to bridge the gap between patients and providers.

**Key Responsibilities:**
- Managing patient scheduling and appointment reminders
- Handling electronic health records (EHR) data entry
- Insurance verification and prior authorization processing
- Medical transcription and documentation
- Patient follow-up communications
- Billing support and coding assistance

**Why Healthcare Needs Medical VAs:**
The demand for remote healthcare support has surged dramatically. Healthcare providers are overwhelmed with administrative tasks that take time away from patient care. Medical VAs fill this critical gap, allowing doctors and nurses to focus on what they do best — caring for patients.

**Course Overview:**
Over the next 8 weeks, you will gain comprehensive knowledge of medical terminology, HIPAA compliance, EHR systems, and the day-to-day workflows of a medical practice. By the end of this course, you will be job-ready as a certified Medical VA.

Take your time reviewing this lesson and move on when you feel confident!`,
      order: 1,
      durationMin: 15,
      isPublished: true,
    },
    {
      title: "Medical Terminology Fundamentals",
      content: `Understanding medical terminology is the foundation of your career as a Medical VA.

**Why Medical Terminology Matters:**
Healthcare professionals use precise medical language to communicate accurately. As a Medical VA, you must understand these terms to document correctly, communicate effectively with clinical staff, and avoid costly errors.

**Core Components of Medical Terms:**
Medical terms are built from three basic components:

1. **Root Word** — The core meaning of the term
   - Example: "cardi" = heart, "derm" = skin, "hepat" = liver

2. **Prefix** — Added before the root to modify meaning
   - Example: "brady" = slow, "tachy" = fast, "hyper" = above normal

3. **Suffix** — Added after the root to indicate condition or procedure
   - Example: "-itis" = inflammation, "-ectomy" = surgical removal, "-ology" = study of

**Common Medical Abbreviations:**
- BP = Blood Pressure
- HR = Heart Rate
- Rx = Prescription
- Dx = Diagnosis
- Hx = History
- Sx = Symptoms
- PMH = Past Medical History
- SOAP = Subjective, Objective, Assessment, Plan

**Practice Exercise:**
Break down the following terms:
1. Tachycardia = tachy (fast) + card (heart) + ia (condition)
2. Dermatology = dermat (skin) + ology (study of)
3. Hepatitis = hepat (liver) + itis (inflammation)

Mastering these building blocks will dramatically speed up your ability to understand and document medical information.`,
      order: 2,
      durationMin: 25,
      isPublished: true,
    },
    {
      title: "HIPAA Compliance and Patient Privacy",
      content: `HIPAA (Health Insurance Portability and Accountability Act) is one of the most critical topics for Medical VAs to master.

**What is HIPAA?**
HIPAA is a US federal law enacted in 1996 that establishes national standards for protecting sensitive patient health information from being disclosed without the patient's consent or knowledge.

**Why HIPAA Matters for Medical VAs:**
As a remote worker handling Protected Health Information (PHI), you are legally obligated to follow HIPAA regulations. Violations can result in:
- Civil penalties: $100 to $50,000 per violation
- Criminal penalties: up to 10 years imprisonment
- Loss of employment and professional reputation

**The Three HIPAA Rules:**

1. **Privacy Rule** — Controls how PHI can be used and disclosed
   - Patients have the right to access their own records
   - Information can only be shared for treatment, payment, or healthcare operations

2. **Security Rule** — Protects electronic PHI (ePHI)
   - Use of encryption for transmitted data
   - Secure password practices
   - Automatic logoff from systems

3. **Breach Notification Rule** — Requires notification when PHI is compromised
   - Must notify affected individuals within 60 days
   - Must report breaches to HHS (Department of Health and Human Services)

**Best Practices for Medical VAs:**
- Never share patient information on personal devices
- Use a VPN when accessing medical systems remotely
- Lock your screen when stepping away
- Never discuss patient information in public places
- Always verify identity before sharing information

**Remember:** When in doubt, don't share. HIPAA requires the "minimum necessary" standard.`,
      order: 3,
      durationMin: 30,
      isPublished: true,
    },
    {
      title: "Electronic Health Records (EHR) Systems",
      content: `Electronic Health Records (EHR) are the backbone of modern healthcare administration.

**What is an EHR?**
An EHR is a digital version of a patient's medical chart. Unlike paper records, EHRs are designed to be shared across different healthcare settings, giving providers a comprehensive view of a patient's health.

**Common EHR Systems You'll Encounter:**
1. **Epic** — Used by large hospitals and health systems; most widely used EHR in the US
2. **Cerner** — Popular in hospital settings; strong analytics capabilities
3. **Athenahealth** — Cloud-based; popular with independent practices
4. **Allscripts** — Used by physician practices of various sizes
5. **DrChrono** — Excellent for mobile-first practices

**Key EHR Functions for Medical VAs:**

*Patient Registration*
- Entering demographic information (name, DOB, address, insurance)
- Verifying insurance eligibility
- Creating and updating patient profiles

*Scheduling*
- Booking appointments by provider, time, and visit type
- Sending appointment reminders
- Managing cancellations and rescheduling

*Documentation*
- Entering clinical notes (often dictated by physicians)
- Documenting vital signs and patient history
- Updating problem lists and medication lists

*Billing Support*
- Attaching correct diagnosis codes (ICD-10)
- Verifying procedure codes (CPT)
- Following up on claim denials

**Tips for Learning EHR Systems:**
- Most systems offer free training videos and tutorials
- Focus on the workflows most relevant to your role
- Practice in demo environments before working with live data

EHR proficiency is one of the most in-demand skills for Medical VAs — master it and you'll stand out from the competition!`,
      order: 4,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Medical Billing and Insurance Verification",
      content: `Medical billing and insurance verification are core competencies that make Medical VAs invaluable to healthcare practices.

**Insurance Verification: The First Step**
Before a patient is seen, practices verify their insurance coverage to ensure they can receive payment. As a Medical VA, you may be responsible for:

1. **Eligibility Verification**
   - Confirm the patient is covered by their insurance
   - Check effective dates and policy status
   - Verify the provider is in-network

2. **Benefits Verification**
   - What is the patient's deductible? Have they met it?
   - What is the copay or coinsurance for this visit type?
   - Are referrals or prior authorizations required?

3. **Prior Authorization**
   - Some procedures, medications, or specialist visits require pre-approval
   - Submit requests with clinical documentation
   - Track authorization numbers and expiration dates

**Medical Billing Basics:**

*The Medical Billing Cycle:*
1. Patient registration and insurance verification
2. Patient encounter (the actual visit)
3. Medical coding (ICD-10 diagnosis + CPT procedure codes)
4. Claim creation and submission
5. Payment posting
6. Denial management and appeals

*Important Code Systems:*
- **ICD-10** — International Classification of Diseases, 10th Edition; used for diagnosis codes (e.g., J06.9 = Acute upper respiratory infection)
- **CPT** — Current Procedural Terminology; used for procedure codes (e.g., 99213 = Office visit, established patient)

*Common Denial Reasons:*
- Patient not eligible on date of service
- Service requires prior authorization
- Incorrect or missing information on claim
- Duplicate claim submission

**Tools You'll Use:**
- Waystar, Availity, or similar clearinghouses for claim submission
- Insurance portals (Navinet, UHC Provider Portal, Aetna provider site)
- The practice's EHR billing module

Mastering billing and verification protects the practice's revenue and ensures patients receive the care they need without financial surprises.`,
      order: 5,
      durationMin: 40,
      isPublished: true,
    },
  ];

  const medicalCourseId = createdCourses[CourseSlug.MEDICAL_VA];
  for (const lesson of medicalLessons) {
    await prisma.lesson.upsert({
      where: {
        // Use a composite check via findFirst approach
        id: (
          await prisma.lesson.findFirst({
            where: { courseId: medicalCourseId, order: lesson.order },
            select: { id: true },
          })
        )?.id ?? "non-existent-id",
      },
      update: lesson,
      create: { ...lesson, courseId: medicalCourseId },
    });
  }

  console.log("✅ Medical VA lessons seeded");

  // Seed sample lessons for Real Estate VA
  const realEstateLessons = [
    {
      title: "Introduction to Real Estate Virtual Assistance",
      content: `Welcome to the Real Estate Virtual Assistant course!

The real estate industry is fast-paced, relationship-driven, and increasingly digital. Real Estate VAs are the secret weapon of top-producing agents and brokers.

**The Real Estate VA Landscape:**
Real Estate agents and brokers are often solo entrepreneurs or small teams. They need support with:
- Transaction coordination
- Listing management
- Client communication
- Marketing and social media
- Research and analysis

**Your Role as a Real Estate VA:**
You'll be working remotely to handle time-consuming tasks that free up agents to focus on building relationships and closing deals.

**Key Skills You'll Develop:**
1. Property research and market analysis
2. MLS (Multiple Listing Service) proficiency
3. CRM management and lead nurturing
4. Contract and transaction coordination
5. Real estate marketing
6. Client communication excellence

**The Real Estate Transaction Timeline:**
Understanding the lifecycle of a real estate transaction is fundamental:
1. Lead generation → Lead qualification
2. Buyer consultation OR Listing appointment
3. Property search OR Listing preparation
4. Offer/Negotiation
5. Contract → Due diligence period
6. Closing process
7. Post-closing follow-up

This course will prepare you to support agents at every stage of this process. Let's get started!`,
      order: 1,
      durationMin: 15,
      isPublished: true,
    },
    {
      title: "MLS and Property Research",
      content: `The Multiple Listing Service (MLS) is the database of properties for sale and is central to your work as a Real Estate VA.

**What is the MLS?**
The MLS is a private database created by real estate professionals to share information about properties for sale. Access is restricted to licensed agents and their staff (including authorized VAs).

**Key MLS Data Points:**
- Property address and legal description
- Listing price and price history
- Square footage, bedrooms, bathrooms
- Days on market (DOM)
- Status: Active, Pending, Sold, Expired
- Photos, virtual tours, and documents
- Property taxes and HOA fees
- Listing agent and contact information

**Comparative Market Analysis (CMA):**
A CMA is used to determine a property's market value by comparing it to similar recently sold properties ("comps").

*Steps to Create a CMA:*
1. Identify the subject property's key features
2. Search for comparable sales in the same area (usually within 0.5-1 mile)
3. Filter by similar size, age, style, and condition
4. Analyze price per square foot
5. Adjust for differences (pool, garage, updates)
6. Calculate a suggested list or offer price range

**Common Research Tools:**
- **Zillow/Realtor.com** — Public-facing property data
- **Redfin** — Market trend data and days on market
- **ATTOM Data** — Property tax and ownership records
- **Google Maps/Street View** — Neighborhood assessment

**Your Research Tasks as a VA:**
- Pulling comps for listing presentations
- Researching school districts and neighborhood amenities
- Monitoring competitor listings
- Tracking days on market for follow-up strategies`,
      order: 2,
      durationMin: 30,
      isPublished: true,
    },
    {
      title: "CRM Management and Lead Follow-Up",
      content: `Customer Relationship Management (CRM) systems are the heart of a real estate agent's business.

**Why CRM Matters in Real Estate:**
Real estate is a relationship business. Agents who systematically follow up with leads convert more prospects into clients. Your job as a VA is to keep the CRM organized and ensure no lead falls through the cracks.

**Popular Real Estate CRMs:**
1. **Follow Up Boss (FUB)** — Industry-leading CRM for real estate teams
2. **kvCORE** — All-in-one platform with IDX website, CRM, and marketing
3. **LionDesk** — Affordable option with texting and video email
4. **Wise Agent** — Great for transaction management integration
5. **HubSpot** — Popular general CRM adapted for real estate

**Key CRM Tasks:**
*Lead Entry and Organization:*
- Import leads from various sources (Zillow, Realtor.com, website, open houses)
- Tag leads by source, stage, and timeline
- Set up drip campaigns for automated follow-up

*Contact Management:*
- Keep contact information current
- Log all communications (calls, emails, texts)
- Set reminders for follow-up calls
- Note client preferences and property criteria

*Pipeline Management:*
- Track where each client is in the buying/selling process
- Update stages as clients progress
- Flag hot leads for immediate agent attention

**Lead Nurturing Sequences:**
*New Buyer Lead:*
Day 1: Welcome email + intro call
Day 3: Neighborhood guide email
Day 7: New listing alerts set up
Day 14: Check-in call
Day 30: Market update email

*Past Client Stay-in-Touch:*
Monthly: Market newsletter
Quarterly: Check-in call
Annually: Home anniversary card + referral request`,
      order: 3,
      durationMin: 30,
      isPublished: true,
    },
    {
      title: "Transaction Coordination Basics",
      content: `Transaction coordination is one of the most valuable services a Real Estate VA can provide.

**What is Transaction Coordination?**
Once a purchase agreement is signed, the transaction coordinator (TC) manages all the moving parts to ensure the deal closes on time and without issues.

**The Transaction Timeline:**

*Day 1 — Contract Execution:*
- Distribute signed contract to all parties
- Open escrow/title
- Send earnest money deposit instructions
- Create transaction file and checklist

*Days 1-10 — Due Diligence Period:*
- Schedule home inspection
- Coordinate radon, pest, pool inspections if needed
- Track inspection report delivery
- Manage repair negotiations

*Days 10-21 — Loan Processing:*
- Send purchase contract to buyer's lender
- Track loan milestone deadlines
- Ensure appraisal is ordered and completed
- Follow up on loan conditions

*Days 21-30 — Closing Preparation:*
- Coordinate final walkthrough
- Confirm closing time and location
- Ensure all documents are signed and delivered
- Verify utilities transfer

**Key Documents You'll Manage:**
- Purchase and Sale Agreement
- Counter-offers and addenda
- Inspection reports and repair agreements
- Appraisal report
- Loan commitment letter
- Title commitment and insurance
- Closing disclosure (CD)
- Final walkthrough form
- Settlement statement (HUD-1 or ALTA)

**Communication is Everything:**
A good TC proactively communicates with:
- Buyers and sellers
- Real estate agents on both sides
- Lender and loan officer
- Title/escrow company
- Home inspectors
- Repair contractors
- HOA (if applicable)`,
      order: 4,
      durationMin: 35,
      isPublished: true,
    },
  ];

  const realEstateCourseId = createdCourses[CourseSlug.REAL_ESTATE_VA];
  for (const lesson of realEstateLessons) {
    await prisma.lesson.upsert({
      where: {
        id: (
          await prisma.lesson.findFirst({
            where: { courseId: realEstateCourseId, order: lesson.order },
            select: { id: true },
          })
        )?.id ?? "non-existent-id",
      },
      update: lesson,
      create: { ...lesson, courseId: realEstateCourseId },
    });
  }

  console.log("✅ Real Estate VA lessons seeded");

  // Seed sample lessons for US Bookkeeping VA
  const bookkeepingLessons = [
    {
      title: "Introduction to US Bookkeeping",
      content: `Welcome to the US Bookkeeping Virtual Assistant course!

Bookkeeping is the backbone of every successful business. As a Bookkeeping VA, you'll be trusted with the financial health of US-based businesses — a role that is both highly valued and well-compensated.

**What is Bookkeeping?**
Bookkeeping is the systematic recording and organization of financial transactions for a business. It provides the foundation for accounting, taxes, and business decision-making.

**Bookkeeping vs. Accounting:**
- **Bookkeeping** — Recording daily transactions, categorizing expenses, reconciling accounts
- **Accounting** — Analyzing data, preparing financial statements, tax planning, audits

As a Bookkeeping VA, you'll focus primarily on bookkeeping tasks, though understanding accounting concepts will make you more effective.

**The Fundamental Accounting Equation:**
Assets = Liabilities + Equity

Every transaction in double-entry bookkeeping affects at least two accounts and keeps this equation in balance.

**The Chart of Accounts:**
A chart of accounts is the organized list of all accounts a business uses. Main categories:
1. **Assets** — What the business owns (cash, accounts receivable, equipment)
2. **Liabilities** — What the business owes (loans, accounts payable, credit cards)
3. **Equity** — The owner's stake in the business
4. **Revenue** — Income from business activities
5. **Expenses** — Costs of running the business

**US Bookkeeping Standards:**
American businesses follow GAAP (Generally Accepted Accounting Principles). Key principles:
- Revenue Recognition: Record income when earned, not when paid
- Matching Principle: Match expenses to the revenue they helped generate
- Consistency: Use the same methods from period to period

This course will give you the skills to confidently manage books for US businesses using industry-standard tools and practices.`,
      order: 1,
      durationMin: 20,
      isPublished: true,
    },
    {
      title: "QuickBooks Online Essentials",
      content: `QuickBooks Online (QBO) is the most widely used bookkeeping software for small businesses in the United States.

**Why QuickBooks Online?**
- 80%+ of small businesses in the US use QuickBooks
- Cloud-based: access from anywhere
- Bank feeds: automatic transaction import
- Real-time collaboration with clients and accountants
- Extensive reporting capabilities

**Setting Up a Company in QBO:**

1. **Company Information**
   - Legal business name and DBA
   - Business type (Sole Proprietor, LLC, Corporation)
   - Industry type (affects chart of accounts defaults)
   - Tax year and accounting method (Cash vs. Accrual)
   - Fiscal year start date

2. **Chart of Accounts Setup**
   - Review default accounts
   - Add industry-specific accounts
   - Set up sub-accounts for detailed tracking

3. **Bank and Credit Card Connections**
   - Connect accounts for automatic feeds
   - Reconcile imported transactions
   - Categorize expenses correctly

**Key QBO Features:**

*Banking Tab:*
- Review and categorize imported transactions
- Match transactions to existing records
- Exclude personal transactions

*Customers and Invoicing:*
- Create and send invoices
- Record payments received
- Track outstanding receivables
- Set up recurring invoices

*Vendors and Bills:*
- Enter vendor bills
- Schedule and record payments
- Track outstanding payables

*Reports:*
- Profit & Loss (P&L) Statement
- Balance Sheet
- Cash Flow Statement
- Accounts Receivable/Payable Aging

**Pro Tips:**
- Always reconcile monthly — don't let it build up
- Use classes and locations to track profitability by segment
- Set up rules to auto-categorize recurring transactions
- Review the audit log regularly to catch errors`,
      order: 2,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Bank Reconciliation Mastery",
      content: `Bank reconciliation is one of the most important monthly tasks in bookkeeping — and one of the most common areas where errors occur.

**What is Bank Reconciliation?**
Bank reconciliation is the process of matching the transactions in your accounting software (like QuickBooks) to the transactions on your bank statement. The goal is to ensure that both records agree.

**Why Reconcile Monthly?**
- Catches bank errors and fraudulent transactions
- Identifies data entry mistakes
- Ensures your financial reports are accurate
- Required for tax preparation and audits

**The Reconciliation Process:**

*Step 1: Gather Your Documents*
- Download the bank statement for the period
- Open the reconciliation module in QBO
- Note the beginning balance (should match prior period's ending balance)
- Note the ending balance from the bank statement

*Step 2: Match Transactions*
- Check off each transaction that appears on both the bank statement AND in QBO
- Deposits: Match each bank deposit to an invoice payment or income entry
- Expenses: Match each bank debit to a bill payment, expense, or check

*Step 3: Identify Discrepancies*
Common issues:
- **Outstanding checks** — Written but not yet cleared the bank
- **Deposits in transit** — Recorded in QBO but not yet on bank statement
- **Bank charges** — Monthly fees, NSF charges (need to add to QBO)
- **Interest income** — Bank-earned interest (need to add to QBO)
- **Errors** — Transposed numbers, duplicates, or missing entries

*Step 4: Adjust and Finalize*
- Add any missing transactions (bank fees, interest)
- Research any unexplained differences
- When the difference is zero, click "Finish Reconciliation"
- Print and save the reconciliation report

**The Reconciliation Report:**
After reconciling, QBO generates a report showing:
- Beginning balance
- All cleared transactions
- Ending balance per bank statement
- Ending balance per books (should match)

**Red Flags to Watch For:**
- Large unexplained differences
- Same amount difference as a transaction (likely misposted)
- Recurring differences (systematic error)
- Negative balances in any accounts`,
      order: 3,
      durationMin: 35,
      isPublished: true,
    },
  ];

  const bookkeepingCourseId = createdCourses[CourseSlug.US_BOOKKEEPING_VA];
  for (const lesson of bookkeepingLessons) {
    await prisma.lesson.upsert({
      where: {
        id: (
          await prisma.lesson.findFirst({
            where: { courseId: bookkeepingCourseId, order: lesson.order },
            select: { id: true },
          })
        )?.id ?? "non-existent-id",
      },
      update: lesson,
      create: { ...lesson, courseId: bookkeepingCourseId },
    });
  }

  console.log("✅ US Bookkeeping VA lessons seeded");

  // Seed sample quiz for Medical VA
  const medicalQuiz = await prisma.quiz.upsert({
    where: {
      id: (
        await prisma.quiz.findFirst({
          where: { courseId: medicalCourseId, title: "HIPAA & Medical Terminology Quiz" },
          select: { id: true },
        })
      )?.id ?? "non-existent-id",
    },
    update: {},
    create: {
      courseId: medicalCourseId,
      title: "HIPAA & Medical Terminology Quiz",
      description: "Test your knowledge of HIPAA regulations and medical terminology fundamentals.",
      passingScore: 70,
      isPublished: true,
    },
  });

  const medicalQuestions = [
    {
      type: "MCQ" as const,
      question: "What does HIPAA stand for?",
      options: [
        "Health Insurance Portability and Accountability Act",
        "Health Information Privacy and Assurance Act",
        "Healthcare Industry Protection and Assistance Act",
        "Health Insurance Processing and Administration Act",
      ],
      correctAnswer: "0",
      points: 10,
      order: 1,
    },
    {
      type: "TRUE_FALSE" as const,
      question: "HIPAA violations can result in criminal penalties including imprisonment.",
      options: ["True", "False"],
      correctAnswer: "true",
      points: 10,
      order: 2,
    },
    {
      type: "MCQ" as const,
      question: "What does the prefix 'brady-' mean in medical terminology?",
      options: ["Fast", "Slow", "Large", "Small"],
      correctAnswer: "1",
      points: 10,
      order: 3,
    },
    {
      type: "MCQ" as const,
      question: "Which suffix means 'surgical removal of'?",
      options: ["-itis", "-ology", "-ectomy", "-plasty"],
      correctAnswer: "2",
      points: 10,
      order: 4,
    },
    {
      type: "TRUE_FALSE" as const,
      question: "EHR stands for Electronic Health Records.",
      options: ["True", "False"],
      correctAnswer: "true",
      points: 10,
      order: 5,
    },
    {
      type: "MCQ" as const,
      question: "Under HIPAA's minimum necessary standard, what should you do when sharing PHI?",
      options: [
        "Share all available information for context",
        "Share only what is needed for the specific purpose",
        "Share everything with other providers",
        "Avoid sharing any information at all",
      ],
      correctAnswer: "1",
      points: 10,
      order: 6,
    },
    {
      type: "SHORT_ANSWER" as const,
      question: "What does the abbreviation 'Dx' stand for in medical documentation?",
      options: [],
      correctAnswer: "diagnosis",
      points: 10,
      order: 7,
    },
  ];

  for (const q of medicalQuestions) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { quizId: medicalQuiz.id, order: q.order },
    });
    if (!existing) {
      await prisma.quizQuestion.create({
        data: { ...q, quizId: medicalQuiz.id },
      });
    }
  }

  console.log("✅ Medical VA quiz seeded");

  // Seed sample quiz for Real Estate VA
  const realEstateQuiz = await prisma.quiz.upsert({
    where: {
      id: (
        await prisma.quiz.findFirst({
          where: { courseId: realEstateCourseId, title: "Real Estate Fundamentals Quiz" },
          select: { id: true },
        })
      )?.id ?? "non-existent-id",
    },
    update: {},
    create: {
      courseId: realEstateCourseId,
      title: "Real Estate Fundamentals Quiz",
      description: "Test your understanding of real estate terminology and processes.",
      passingScore: 70,
      isPublished: true,
    },
  });

  const realEstateQuestions = [
    {
      type: "MCQ" as const,
      question: "What does MLS stand for in real estate?",
      options: ["Multiple Listing Service", "Master Listing System", "Market Listing Standard", "Main Listing Source"],
      correctAnswer: "0",
      points: 10,
      order: 1,
    },
    {
      type: "MCQ" as const,
      question: "What is a CMA in real estate?",
      options: ["Client Management Agreement", "Comparative Market Analysis", "Commercial Marketing Assessment", "Contract Management Agreement"],
      correctAnswer: "1",
      points: 10,
      order: 2,
    },
    {
      type: "TRUE_FALSE" as const,
      question: "Transaction coordinators manage all the paperwork after a purchase agreement is signed.",
      options: ["True", "False"],
      correctAnswer: "true",
      points: 10,
      order: 3,
    },
    {
      type: "MCQ" as const,
      question: "What does DOM stand for in real estate listings?",
      options: ["Days on Market", "Date of Mortgage", "Deed of Mortgage", "Document of Marketing"],
      correctAnswer: "0",
      points: 10,
      order: 4,
    },
    {
      type: "SHORT_ANSWER" as const,
      question: "What is the term for properties used to determine the market value of a subject property?",
      options: [],
      correctAnswer: "comps",
      points: 10,
      order: 5,
    },
  ];

  for (const q of realEstateQuestions) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { quizId: realEstateQuiz.id, order: q.order },
    });
    if (!existing) {
      await prisma.quizQuestion.create({
        data: { ...q, quizId: realEstateQuiz.id },
      });
    }
  }

  console.log("✅ Real Estate VA quiz seeded");

  // Seed sample quiz for Bookkeeping VA
  const bookkeepingQuiz = await prisma.quiz.upsert({
    where: {
      id: (
        await prisma.quiz.findFirst({
          where: { courseId: bookkeepingCourseId, title: "US Bookkeeping Fundamentals Quiz" },
          select: { id: true },
        })
      )?.id ?? "non-existent-id",
    },
    update: {},
    create: {
      courseId: bookkeepingCourseId,
      title: "US Bookkeeping Fundamentals Quiz",
      description: "Test your knowledge of bookkeeping concepts and QuickBooks.",
      passingScore: 70,
      isPublished: true,
    },
  });

  const bookkeepingQuestions = [
    {
      type: "MCQ" as const,
      question: "What is the fundamental accounting equation?",
      options: [
        "Assets = Liabilities + Equity",
        "Revenue - Expenses = Profit",
        "Assets + Liabilities = Equity",
        "Income = Assets - Expenses",
      ],
      correctAnswer: "0",
      points: 10,
      order: 1,
    },
    {
      type: "TRUE_FALSE" as const,
      question: "QuickBooks Online is cloud-based software accessible from anywhere.",
      options: ["True", "False"],
      correctAnswer: "true",
      points: 10,
      order: 2,
    },
    {
      type: "MCQ" as const,
      question: "What is the purpose of bank reconciliation?",
      options: [
        "To calculate taxes owed",
        "To match accounting records with the bank statement",
        "To create invoices for customers",
        "To record payroll transactions",
      ],
      correctAnswer: "1",
      points: 10,
      order: 3,
    },
    {
      type: "MCQ" as const,
      question: "Accounts Receivable represents:",
      options: [
        "Money the business owes to vendors",
        "The owner's investment in the business",
        "Money owed TO the business by customers",
        "Monthly business expenses",
      ],
      correctAnswer: "2",
      points: 10,
      order: 4,
    },
    {
      type: "SHORT_ANSWER" as const,
      question: "What does GAAP stand for? (abbreviation only, e.g., 'GAAP')",
      options: [],
      correctAnswer: "gaap",
      points: 10,
      order: 5,
    },
  ];

  for (const q of bookkeepingQuestions) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { quizId: bookkeepingQuiz.id, order: q.order },
    });
    if (!existing) {
      await prisma.quizQuestion.create({
        data: { ...q, quizId: bookkeepingQuiz.id },
      });
    }
  }

  console.log("✅ US Bookkeeping VA quiz seeded");
  console.log("\n✅ All seeding complete!");
  console.log("   Admin: admin@vatrainingcenter.com / Admin@123456!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

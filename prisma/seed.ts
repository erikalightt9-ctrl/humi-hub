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
  // ── Courses ────────────────────────────────────────────────────
  const courses = [
    {
      slug: CourseSlug.MEDICAL_VA,
      title: "Medical Virtual Assistant",
      description:
        "This comprehensive program prepares you to work as a remote Medical Virtual Assistant supporting US healthcare providers. You will master medical terminology, Electronic Health Records (EHR) systems, HIPAA compliance, patient scheduling, medical billing fundamentals, and telemedicine support. Graduates will be qualified for high-demand roles such as Virtual Medical Receptionist, Remote Medical Scribe, Telehealth Support Specialist, and Healthcare Administrative Coordinator.",
      durationWeeks: 8,
      price: 15000,
      outcomes: [
        "Navigate and manage patient records in major EHR/EMR systems including athenahealth, Epic, and NextGen",
        "Apply HIPAA privacy and security rules to protect Protected Health Information (PHI) in all remote work activities",
        "Use medical terminology accurately across clinical documentation, billing, and patient communication",
        "Manage patient scheduling, appointment confirmations, and follow-up workflows using practice management software",
        "Process insurance verifications, prior authorizations, and basic medical billing and coding tasks",
        "Support telemedicine consultations by coordinating virtual appointments and troubleshooting patient-facing technology",
        "Handle inbound and outbound patient communications with empathy, professionalism, and clinical accuracy",
        "Set up a HIPAA-compliant remote workspace with proper security protocols including VPN and two-factor authentication",
      ],
    },
    {
      slug: CourseSlug.REAL_ESTATE_VA,
      title: "Real Estate Virtual Assistant",
      description:
        "This hands-on program trains you to become a skilled Real Estate Virtual Assistant supporting US agents, brokers, and real estate teams. You will learn MLS listing management, CRM systems, lead generation and nurturing, transaction coordination from contract to close, and digital marketing for real estate. With the US real estate market relying heavily on remote support, graduates will be positioned for roles that typically command premium VA rates.",
      durationWeeks: 6,
      price: 12000,
      outcomes: [
        "Create, update, and manage property listings across MLS, Zillow, Realtor.com, and other major listing platforms",
        "Operate real estate CRM systems (Follow Up Boss, KVCore, HubSpot) to manage leads and track sales pipelines",
        "Execute lead generation campaigns using online portals, social media, cold outreach, and database mining",
        "Coordinate real estate transactions from contract to close including deadlines, disclosures, inspections, and escrow",
        "Create and schedule real estate social media content using Canva, Hootsuite, and platform-native tools",
        "Prepare Comparative Market Analyses (CMAs) and compile property research for listing presentations",
        "Manage agent calendars, showing schedules, open house logistics, and client communications",
        "Use transaction management platforms (dotloop, SkySlope) and e-signature tools (DocuSign) for compliant documentation",
      ],
    },
    {
      slug: CourseSlug.US_BOOKKEEPING_VA,
      title: "US Bookkeeping Virtual Assistant",
      description:
        "This program trains you to provide professional remote bookkeeping services for US-based small and medium businesses using QuickBooks Online and industry-standard accounting practices. You will learn the full bookkeeping cycle from recording daily transactions to producing financial statements, along with accounts payable/receivable management, bank reconciliation, payroll support, and US tax preparation basics. Graduates will be prepared to pursue the QuickBooks Online ProAdvisor Certification and serve US clients with confidence.",
      durationWeeks: 10,
      price: 18000,
      outcomes: [
        "Set up and manage a full company file in QuickBooks Online including chart of accounts, vendor and customer profiles, and bank feed connections",
        "Process complete accounts payable workflows from bill entry and approval to payment scheduling and vendor reconciliation",
        "Manage accounts receivable including invoice creation, payment application, collections follow-up, and aging report analysis",
        "Perform monthly bank and credit card reconciliations to ensure accurate financial records and detect discrepancies",
        "Generate and interpret key financial reports including Profit and Loss statements, Balance Sheets, and Cash Flow statements",
        "Support US payroll processing including timesheet validation, payroll tax concepts (federal, state, FICA), and compliance",
        "Prepare and organize financial records for US tax filing including 1099 contractor reporting and quarterly estimated taxes",
        "Apply double-entry bookkeeping principles and the accrual basis of accounting used by most US businesses",
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

  // ── Admin user ─────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@123456!", 12);
  await prisma.admin.upsert({
    where: { email: "gdscapital.168@gmail.com" },
    update: {},
    create: {
      email: "gdscapital.168@gmail.com",
      passwordHash,
      name: "Super Admin",
    },
  });

  console.log("✅ Admin user seeded");

  // ── Badges ─────────────────────────────────────────────────────
  const badges = [
    { type: "FIRST_LESSON" as const, name: "First Step", description: "Complete your very first lesson", icon: "🌟" },
    { type: "QUIZ_MASTER" as const, name: "Quiz Master", description: "Pass 3 or more quizzes", icon: "🏆" },
    { type: "COURSE_COMPLETER" as const, name: "Course Completer", description: "Complete all lessons in a course", icon: "🎓" },
    { type: "TOP_CONTRIBUTOR" as const, name: "Top Contributor", description: "Post 10 or more forum messages", icon: "💬" },
    { type: "ASSIGNMENT_STAR" as const, name: "Assignment Star", description: "Submit your first assignment", icon: "📝" },
    { type: "FORUM_STARTER" as const, name: "Forum Starter", description: "Post your first forum message", icon: "🗣️" },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({ where: { type: badge.type }, update: badge, create: badge });
  }

  console.log("✅ Badges seeded");

  // ── Helper to upsert lesson by courseId + order ────────────────
  async function upsertLesson(courseId: string, lesson: {
    title: string; content: string; order: number;
    durationMin: number; isPublished: boolean; isFreePreview?: boolean;
  }) {
    const existing = await prisma.lesson.findFirst({
      where: { courseId, order: lesson.order },
      select: { id: true },
    });
    await prisma.lesson.upsert({
      where: { id: existing?.id ?? "non-existent-id" },
      update: lesson,
      create: { ...lesson, courseId },
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  MEDICAL VA LESSONS (10)
  // ══════════════════════════════════════════════════════════════
  const medicalCourseId = createdCourses[CourseSlug.MEDICAL_VA];

  const medicalLessons = [
    {
      title: "Introduction to the Medical Virtual Assistant Role",
      content: `A Medical Virtual Assistant (MVA) is a remote professional who provides administrative and clinical support to US healthcare providers, clinics, and medical practices.

**Core Responsibilities:**
- Managing patient scheduling and appointment reminders
- Handling electronic health records (EHR) data entry and updates
- Insurance verification and prior authorization processing
- Medical transcription and clinical documentation support
- Patient follow-up communications and billing assistance

**MVA Specializations:**
- Virtual Medical Receptionist — remote front-desk operations
- Remote Medical Scribe — real-time clinical documentation
- Telehealth Support Specialist — managing virtual consultations
- Healthcare Administrative Coordinator — comprehensive office management

**What US Clients Expect:**
- Strong English communication skills and attention to detail
- Willingness to work US business hours (EST or PST)
- HIPAA compliance knowledge and cultural sensitivity
- Professionalism in handling sensitive patient information

Over the next 8 weeks, you will gain the skills needed to launch your Medical VA career.`,
      order: 1,
      durationMin: 20,
      isPublished: true,
      isFreePreview: true,
    },
    {
      title: "Medical Terminology Foundations",
      content: `Medical terminology is the foundation of accurate healthcare communication. All medical terms are built from three components:

**Word Building Blocks:**
- **Root words** — the core meaning (cardi = heart, derm = skin, hepat = liver, neur = nerve, gastr = stomach, pulmon = lung)
- **Prefixes** — modify the root (brady = slow, tachy = fast, hyper = above normal, hypo = below normal, pre = before, post = after)
- **Suffixes** — indicate condition or procedure (-itis = inflammation, -ectomy = removal, -ology = study of, -algia = pain)

**Body Systems to Know:**
Cardiovascular (heart), Respiratory (lungs), Gastrointestinal (digestive), Musculoskeletal (bones/muscles), Neurological (brain/nerves), Endocrine (hormones), Integumentary (skin), Urinary (kidneys/bladder)

**Essential Abbreviations:**
- BP = Blood Pressure, HR = Heart Rate, Rx = Prescription, Dx = Diagnosis, Tx = Treatment
- SOAP = Subjective, Objective, Assessment, Plan
- PRN = As needed, BID = Twice daily, STAT = Immediately
- CBC = Complete Blood Count, NPO = Nothing by mouth

**Practice:** Tachycardia = tachy (fast) + card (heart) + ia (condition) = rapid heart rate. Master these building blocks to quickly understand any medical term.`,
      order: 2,
      durationMin: 30,
      isPublished: true,
    },
    {
      title: "HIPAA Compliance and Patient Privacy",
      content: `HIPAA (Health Insurance Portability and Accountability Act) governs how patient information is used, stored, and shared. Compliance is mandatory for all Medical VAs.

**Protected Health Information (PHI)** includes patient names, dates of birth, medical records, diagnoses, insurance details, and any communication about a patient.

**The Three HIPAA Rules:**
1. **Privacy Rule** — Controls how PHI is used and disclosed; only share for Treatment, Payment, or Healthcare Operations; apply the "Minimum Necessary" standard
2. **Security Rule** — Protects electronic PHI through administrative, physical, and technical safeguards (encryption, access controls, audit trails)
3. **Breach Notification Rule** — Requires notifying affected individuals within 60 days if PHI is compromised

**Violation Penalties:** Range from $100 per violation (unaware) up to $50,000+ per violation (willful neglect), with possible criminal penalties up to 10 years imprisonment.

**Best Practices for Remote MVAs:**
- Use a dedicated workspace — no shared family computers
- Always connect through a VPN with two-factor authentication enabled
- Use encrypted email for any communication containing PHI
- Lock your screen whenever you step away, even briefly
- Never discuss patient information on social media or personal messaging apps
- Sign a Business Associate Agreement (BAA) with every client
- When in doubt, don't share — always verify authorization first`,
      order: 3,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Electronic Health Records (EHR) Systems",
      content: `EHR systems are digital patient charts that healthcare providers use to manage all clinical and administrative data. EHR proficiency is one of the most in-demand MVA skills.

**Top US EHR Systems:**
- **Epic** (42% market share) — dominant in large hospitals; MyChart patient portal
- **athenahealth** — popular with small-to-mid-sized practices; cloud-based
- **NextGen Healthcare** — strong for specialty and ambulatory care
- **Cerner (Oracle Health)** — large hospital systems and government/VA hospitals
- **DrChrono** — mobile-first, great for smaller practices

**Key EHR Functions for MVAs:**
- **Patient Registration** — Enter demographics, verify insurance, update profiles, attach documents
- **Scheduling** — Book appointments by provider and visit type, manage templates, send reminders, handle cancellations
- **Clinical Documentation** — Enter clinical notes, update medication and allergy lists, document vital signs, manage referrals
- **Billing Integration** — Attach ICD-10 diagnosis codes, verify CPT procedure codes, flag incomplete documentation

**Learning Tips:**
- Most vendors offer free online training and certifications
- Request demo/sandbox access to practice without live patient data
- Learn keyboard shortcuts — they save enormous time in daily workflows
- Focus on the workflows most relevant to your assigned role first`,
      order: 4,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Patient Scheduling and Practice Management",
      content: `Efficient scheduling is the lifeline of any medical practice. Poor scheduling leads to no-shows, provider burnout, and revenue loss.

**Appointment Types:**
- New Patient Visit (30-60 min) — comprehensive history and intake
- Established Patient Visit (15-20 min) — follow-up or problem-focused
- Annual Physical / Wellness Exam (30-45 min) — preventive care
- Telehealth Visit — virtual appointment via video platform
- Urgent / Same-Day — reserved slots for acute concerns

**Scheduling Best Practices:**
- Create provider-specific templates with blocked time for lunch and admin tasks
- Reserve urgent slots for same-day requests
- Send reminders 48 and 24 hours before appointments to reduce no-shows
- Maintain a waitlist to fill cancelled slots quickly

**Practice Management Software:** Kareo, AdvancedMD, Practice Fusion, Greenway Health — these handle the business side including billing and scheduling.

**Daily Scheduler Workflow:**
1. Review today's schedule for gaps or overbooking
2. Process overnight appointment requests from patient portal and voicemail
3. Confirm tomorrow's appointments via text or call
4. Handle incoming scheduling calls and online requests
5. Update patient insurance information as needed
6. Send end-of-day summary to provider(s)

**Communication Tips:** Always verify patient identity before discussing information, speak clearly, offer multiple appointment options, and document all communication in the patient's chart.`,
      order: 5,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Insurance Verification and Prior Authorization",
      content: `Insurance verification and prior authorization directly protect the practice's revenue. These are core competencies that make MVAs invaluable.

**Insurance Verification Steps:**
1. **Eligibility** — Confirm active coverage, check effective dates, verify provider is in-network, confirm member ID and group number
2. **Benefits** — Check deductible status, copay/coinsurance amounts, referral requirements, and out-of-pocket maximum

**Common US Insurance Types:**
- HMO — requires PCP referral for specialists, in-network only
- PPO — more flexibility, higher cost for out-of-network
- Medicare — federal insurance for 65+ and disabled (Parts A, B, C, D)
- Medicaid — state-managed insurance for low-income individuals
- TRICARE — military and veteran insurance

**Prior Authorization Process:**
1. Check if the service requires pre-approval from the insurance company
2. Gather clinical documentation (physician notes, labs, imaging)
3. Submit the request via phone, fax, or online portal
4. Track the request and follow up if not approved within expected timeframe
5. Document the authorization number, approved dates, and limitations
6. Communicate the result to scheduling team and patient

**Key Tools:** Availity (multi-payer portal), Waystar (revenue cycle management), individual payer portals (UHC, Aetna, Cigna, Blue Cross), and the practice's built-in EHR eligibility features.

**Tips:** Verify insurance at least 48 hours before appointments, log all authorization numbers and expiration dates, and document every call with date, time, rep name, and reference number.`,
      order: 6,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Medical Billing and Coding Fundamentals",
      content: `Medical billing is submitting and following up on claims with insurance companies to receive payment for services provided.

**The Billing Cycle:**
Patient registration → Encounter → Medical coding → Charge entry → Claim submission → Payment posting → Denial management → Patient billing

**Key Code Systems:**
- **ICD-10** (Diagnosis codes) — describes WHY the patient was seen (e.g., J06.9 = Acute upper respiratory infection). Over 70,000 codes available.
- **CPT** (Procedure codes) — describes WHAT was done. Common: 99213 = established patient visit, 99203 = new patient visit.
- **HCPCS** — for supplies and equipment not covered by CPT (e.g., J3420 = Vitamin B-12 injection)

**Reading an EOB (Explanation of Benefits):**
Shows services billed, allowed amount, insurance payment, and patient responsibility (copay, deductible, coinsurance).

**Common Denial Reasons:**
- Patient not eligible on date of service
- Service requires prior authorization not obtained
- Incorrect or missing diagnosis/procedure codes
- Out-of-network provider or duplicate claim

**Your Role as an MVA:**
You are NOT expected to be a certified coder. You WILL assist with charge entry, claim scrubbing, denial follow-up, and payment posting. Understanding coding basics helps you communicate effectively with the billing team. Always escalate complex coding questions to a certified coder or provider.`,
      order: 7,
      durationMin: 45,
      isPublished: true,
    },
    {
      title: "Telemedicine Support and Virtual Patient Care",
      content: `Telemedicine is a permanent fixture in US healthcare. MVAs play a critical role in ensuring smooth virtual consultations.

**Common Telehealth Platforms:**
- Doxy.me — free, browser-based, HIPAA-compliant
- Zoom for Healthcare — HIPAA-compliant with BAA
- EHR-integrated options — Epic's MyChart Video Visit, athenahealth Telehealth

**Your Role in Telemedicine:**

*Pre-Visit:*
- Schedule telehealth appointments with correct visit type
- Send patients the video link and connection instructions
- Verify insurance covers telehealth services
- Collect intake forms and update patient history

*During the Visit:*
- Monitor the virtual waiting room
- Troubleshoot patient connection issues (audio, video, browser)
- Assist with documentation if working as a virtual scribe

*Post-Visit:*
- Send visit summary and follow-up instructions to the patient
- Schedule follow-up appointments
- Process referrals and prescription requests
- Submit telehealth billing codes (modifier -95 or Place of Service 10)

**Telehealth Billing Notes:**
- POS code 10 = Telehealth in patient's home
- Audio-only visits may have different reimbursement rates
- Not all services can be billed via telehealth — always check payer policies`,
      order: 8,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Patient Communication and Front Desk Operations",
      content: `As a remote front desk MVA, you are often the first point of contact for patients. Professional communication is essential.

**Inbound Communication:**
- Answer calls with a warm, professional greeting and verify patient identity (name, DOB)
- Triage urgency: emergencies → direct to 911, urgent → same-day slot, routine → schedule
- Never provide medical advice — redirect clinical questions to nursing staff
- Respond to patient portal messages within 24 hours using templates for common requests

**Outbound Communication:**
- Automated appointment reminders 48 hours before via text/email
- Post-procedure check-in calls and lab result notifications (per provider instruction — never interpret results)
- Referral coordination and outstanding balance reminders

**Handling Difficult Situations:**
- Listen without interrupting, acknowledge their feelings, apologize for inconvenience (not care), offer a solution, escalate if needed
- For emergencies (chest pain, difficulty breathing, suicidal thoughts): instruct patient to call 911 immediately and notify the provider

**HIPAA in Communication:**
- Never leave detailed voicemails with medical information
- Never email PHI without encryption
- A patient's spouse or family does NOT automatically have access — follow authorization forms

**Documentation Standards:**
Record every patient interaction in the EHR with date, time, who you spoke with, reason for contact, action taken, and follow-up needed.`,
      order: 9,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Building Your Medical VA Career",
      content: `Congratulations on reaching the final lesson! Here's how to turn your knowledge into a thriving Medical VA career.

**HIPAA-Compliant Home Office Setup:**
- Dedicated computer (not shared), wired internet with backup hotspot, noise-cancelling headset, external monitor
- VPN required, two-factor authentication on all accounts, encrypted hard drive, automatic screen lock
- Private lockable room with professional background for video calls

**Certifications to Pursue:**
- HIPAA Compliance Training Certificate
- EHR-specific certifications (Epic, athenahealth)
- Medical Terminology Certificate
- This HUMI Training Center course completion certificate

**Where to Find Medical VA Jobs:**
- Specialized agencies: MedVA, VMeDx, REVA Global
- General platforms: OnlineJobs.ph, Upwork, Belay, Time Etc

**Salary Expectations:**
- Entry-level: $5–8/hour (PHP 280–450/hour)
- Experienced: $8–15/hour (PHP 450–850/hour)
- Specialized (scribing, billing): $10–20/hour (PHP 560–1,120/hour)

**Your First 30 Days Checklist:**
1. Complete client onboarding (BAA, NDA, employment agreement)
2. Set up VPN and all required software
3. Complete client-specific EHR training
4. Start with basic tasks and gradually take on more responsibility
5. Document workflows and create SOPs for recurring tasks

You are now prepared to launch your Medical VA career. Best of luck!`,
      order: 10,
      durationMin: 30,
      isPublished: true,
    },
  ];

  for (const lesson of medicalLessons) {
    await upsertLesson(medicalCourseId, lesson);
  }
  console.log("✅ Medical VA lessons seeded (10)");

  // ══════════════════════════════════════════════════════════════
  //  REAL ESTATE VA LESSONS (10)
  // ══════════════════════════════════════════════════════════════
  const realEstateCourseId = createdCourses[CourseSlug.REAL_ESTATE_VA];

  const realEstateLessons = [
    {
      title: "The Real Estate Virtual Assistant Role",
      content: `The US real estate industry is fast-paced, relationship-driven, and increasingly digital. Real Estate VAs are the behind-the-scenes support that top-producing agents rely on.

**Industry Overview:**
- Over 1.5 million licensed agents in the US compete for business
- Top agents close 30–50+ transactions per year and NEED administrative support
- Agents work under brokerages (Keller Williams, RE/MAX, Coldwell Banker, eXp Realty)
- Commission-based income: typically 5–6% of sale price, split between agents

**Key VA Specializations:**
- Administrative VA — calendar, email, general office support
- Transaction Coordinator — manage deals from contract to close
- Marketing VA — social media, listing presentations, flyers
- Lead Generation Specialist — prospecting, follow-up, database management
- Listing Coordinator — manage active listings and MLS data

**The Real Estate Transaction Flow:**
Lead generation → Lead qualification → Buyer consultation or Listing appointment → Property search or Listing prep → Showings / Open houses → Offer / Negotiation → Contract → Inspections & Appraisal → Loan processing → Closing day → Post-closing follow-up

This course will prepare you to support agents at every stage of this process.`,
      order: 1,
      durationMin: 20,
      isPublished: true,
      isFreePreview: true,
    },
    {
      title: "MLS and Property Listing Management",
      content: `The Multiple Listing Service (MLS) is the central database powering the real estate industry. Mastering MLS management is essential.

**Key MLS Data Points:**
Property address, listing price, price history, square footage, beds/baths, year built, lot size, days on market (DOM), status (Active, Pending, Sold, Expired), photos, virtual tours, taxes, HOA fees, and showing instructions.

**Creating Compelling Listings:**
- Use professional photography — it increases selling price significantly
- Lead descriptions with the most compelling feature
- Highlight upgrades, renovations, and neighborhood amenities
- Avoid fair housing violations — never mention race, religion, family status, or disability
- Keep descriptions concise (250–500 words) with practical details

**Cross-Posting Platforms:** Zillow, Trulia, Realtor.com, Redfin, Facebook Marketplace, and the agent's personal website.

**Listing Maintenance Tasks:**
- Update status changes immediately (price reductions, pending, sold)
- Add new photos or virtual tours when received
- Monitor showing feedback and report to the agent
- Track DOM and compare to market averages
- Schedule open houses and update MLS details

**Major MLS Systems:** CRMLS (California), Bright MLS (Mid-Atlantic), NWMLS (Pacific NW), Stellar MLS (Florida), MRED (Chicago). Each has different interfaces but similar core functions.`,
      order: 2,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Real Estate CRM Systems and Database Management",
      content: `CRM systems are the heart of a real estate business. Your job as a VA is to keep the CRM organized so no lead falls through the cracks.

**Why CRM Matters:**
- 80% of real estate sales come from repeat clients and referrals
- The average lead requires 8–12 touches before converting
- Without systematic follow-up, leads go cold within 48 hours

**Top Real Estate CRMs:**
- **Follow Up Boss** — automatic lead routing, built-in calling/texting, smart lists
- **KVCore** — all-in-one platform with IDX website, CRM, and AI lead scoring
- **BoomTown** — lead generation through paid advertising with predictive analytics
- **HubSpot** — versatile free tier with excellent email marketing and reporting

**Key CRM Tasks for VAs:**
- **Lead Management** — Import leads from various sources, tag by source/stage/timeline, assign to agents, merge duplicates
- **Pipeline Management** — Track stages: New → Contacted → Qualified → Showing → Under Contract → Closed
- **Drip Campaigns** — Set up automated email/text sequences (new buyer welcome, past client nurture, expired listing outreach)
- **Reporting** — Lead source ROI, response time tracking, pipeline value, conversion rates by stage`,
      order: 3,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Lead Generation and Nurturing",
      content: `Lead generation is the lifeblood of any real estate business. As a VA, you'll execute strategies that keep the pipeline full.

**Lead Sources:**
1. **Online Portals** (Zillow, Realtor.com, Redfin) — highest volume; contact within 5 minutes for 10x conversion rate
2. **Social Media** — Facebook/Instagram for brand awareness, LinkedIn for commercial, YouTube for listing tours
3. **Expired/Cancelled Listings** — motivated sellers whose homes didn't sell with another agent
4. **FSBO (For Sale By Owner)** — owners trying to sell without an agent who often convert to clients
5. **Open House Follow-Up** — collect sign-in info, follow up within 24 hours, add to CRM
6. **Database Mining** — past clients, friends, family; systematic touches through calls, emails, and events

**Lead Qualification (BANT Method):**
- **Budget** — Are they pre-approved? Price range?
- **Authority** — Are they the decision-maker?
- **Need** — What are they looking for? (beds, location, features)
- **Timeline** — When do they need to buy or sell?

**Lead Temperature:**
- Hot (0–30 days) — actively looking, pre-approved
- Warm (1–3 months) — interested but not urgent
- Cold (3–12 months) — still researching
- Nurture (12+ months) — long-term prospect

**Speed to Lead** is the #1 conversion factor. As a VA, you may be the first responder even outside the agent's working hours.`,
      order: 4,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Transaction Coordination Fundamentals",
      content: `Transaction coordination (TC) is one of the highest-paid Real Estate VA services. Once a purchase agreement is signed, the TC manages all moving parts to ensure the deal closes on time.

**Typical 30–45 Day Close Timeline:**

*Day 1 — Contract Execution:*
Distribute signed contract, open escrow/title, send earnest money instructions, create transaction file, notify lender

*Days 1–10 — Due Diligence:*
Schedule home inspection, coordinate additional inspections (radon, pest, sewer), track repair negotiations, monitor inspection objection deadline

*Days 10–21 — Loan Processing:*
Confirm mortgage application, track appraisal, follow up on underwriting conditions, collect additional documents from lender

*Days 21–30+ — Closing Preparation:*
Confirm "Clear to Close" from lender, coordinate final walkthrough, confirm closing date and location, verify all documents are signed

**Key Documents You'll Manage:**
Purchase agreement, counter-offers, earnest money receipt, inspection reports, appraisal report, loan commitment letter, title commitment, closing disclosure, settlement statement, commission authorization

**Transaction Management Tools:**
- **dotloop** — most popular TC platform (owned by Zillow)
- **SkySlope** — compliance-focused, popular with large brokerages
- **DocuSign** — e-signature standard in real estate

**Communication:** Send weekly updates to all parties, deadline reminders 3 days in advance, and same-day notifications of any issues or delays.`,
      order: 5,
      durationMin: 45,
      isPublished: true,
    },
    {
      title: "Transaction Management Tools and Document Handling",
      content: `Proficiency with transaction management tools separates professional Real Estate VAs from beginners.

**dotloop — The Industry Standard:**
- Create transaction "loops" (folders for each deal)
- Upload, organize, and share documents with all parties
- Built-in e-signatures and task templates with deadline tracking
- Compliance review tools for broker approval
- Integrates with major CRMs (Follow Up Boss, KVCore)

**DocuSign for Real Estate:**
- Legally binding electronic signatures (US E-SIGN Act compliant)
- Create signing workflows with multiple signers in a specific order
- Automatic reminders for unsigned documents

**Document Organization Best Practices:**
- Naming convention: [Address] — [Document Type] — [Date]
- Folder structure per transaction: Contract, Inspections, Appraisal, Loan Docs, Title, Closing, Commission, Correspondence
- Most brokerages require complete files within 7 days of closing
- Files must be retained 3–7 years depending on state law

**Checklist Management:**
Create master checklists for buyer-side transactions, seller-side transactions, new listing setup, and closing day preparation. Use tools like Trello, Asana, or Google Sheets alongside transaction platforms.`,
      order: 6,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Real Estate Social Media Marketing",
      content: `Social media is the #1 marketing channel for real estate agents. Content creation and management is a highly valued VA skill.

**Platform Strategy:**
- **Facebook** — business page, Just Listed/Sold posts, open house events, community engagement, paid ads for listings
- **Instagram** — property photos on feed, behind-the-scenes Stories, short Reels for video tours, carousel posts for tips
- **LinkedIn** — industry articles, professional networking, best for luxury and commercial real estate

**Weekly Content Calendar:**
Monday: Motivational quote + market stat | Tuesday: New listing or tips | Wednesday: Community spotlight | Thursday: Testimonial | Friday: Open house promo | Saturday: Live video or Story | Sunday: Lifestyle content

**Design & Scheduling Tools:**
- **Canva** — pre-made real estate templates for listings, flyers, and social posts
- **Hootsuite / Buffer** — multi-platform scheduling and analytics
- **Meta Business Suite** — free scheduling for Facebook and Instagram

**Paid Advertising Basics:**
- Target by location (zip code or radius), demographics (age, income, homeownership)
- Budget $5–20/day for listing ads; use carousel ads for multiple photos
- Include clear calls-to-action ("Schedule a Showing")

**Content Tips:** Use bright, well-lit photos, write captions that tell a story, respond to comments promptly, and always follow Fair Housing guidelines.`,
      order: 7,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Market Research and Comparative Market Analysis",
      content: `CMAs help agents price properties correctly and win listing appointments. This is a key skill for Real Estate VAs.

**What is a CMA?**
A Comparative Market Analysis estimates a property's market value by comparing it to similar recently sold properties ("comps"). It is NOT an appraisal.

**Steps to Create a CMA:**
1. **Identify the subject property** — address, beds/baths, sq ft, lot size, year built, condition, upgrades
2. **Find comparable sales** — within 0.5–1 mile, sold in last 3–6 months, similar size (within 10–20%), same neighborhood/school district, aim for 3–5 comps
3. **Analyze and adjust** — price per sq ft, adjust for differences (extra bedroom, pool, updated kitchen), factor in market conditions
4. **Present a price range** — narrow range shows confidence (e.g., $395,000–$415,000)

**Key Market Metrics:**
- Median Sale Price, Average Days on Market, List-to-Sale Price Ratio
- Months of Inventory: < 3 months = Seller's market, 3–6 = Balanced, > 6 = Buyer's market

**Research Tools:** MLS (primary source), Zillow, Redfin, Realtor.com, Google Maps/Street View, GreatSchools.org

**CMA Presentation:** Create a branded PDF with subject property summary, comparable sales grid, adjustments, recommended price range, market conditions, and the agent's marketing plan. Canva has excellent CMA templates.`,
      order: 8,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Open House and Showing Coordination",
      content: `Open houses and showings are where deals begin. As a VA, you manage the logistics that make these events run smoothly.

**Showing Coordination:**
- Respond to showing requests within 30 minutes
- Confirm with the seller if the property is occupied
- Provide instructions: lockbox code, parking, pets, alarm codes
- Space overlapping requests 30–60 minutes apart

**Showing Feedback Collection:**
Send feedback requests to buyer's agents within 24 hours asking about client interest, price expectations, and concerns. Compile weekly feedback reports for the seller.

**Showing Platforms:** ShowingTime (Zillow), Showing Assist, Centralized Showing Service

**Open House Planning:**
*Pre-Event:* Create flyers and social media posts, post on MLS, create Facebook event, send email to agent's database, prepare sign-in sheets (paper or digital via Spacio)

*Day-Of:* Confirm agent has all materials, ensure property is show-ready, post "Open House Today" on social media

*Post-Event (within 24 hours):* Enter all contacts into CRM, send personalized follow-up texts/emails, tag contacts by interest level, schedule follow-up tasks for agent, report attendance to seller

**Virtual Open Houses:** Use Facebook Live or Instagram Live for property walkthroughs, engage with live comments, and record for on-demand viewing.`,
      order: 9,
      durationMin: 35,
      isPublished: true,
    },
    {
      title: "Building Your Real Estate VA Career",
      content: `Congratulations on completing the Real Estate VA program! Here's how to build a high-demand career.

**Why Real Estate VA Roles Pay Premium Rates:**
Agents earn $5,000–$25,000+ per transaction. A great VA directly helps close more deals. Entry-level: $5–8/hour → Experienced TC: $10–18/hour.

**Must-Have Skills on Your Resume:**
MLS management, CRM proficiency (specify platforms), transaction coordination, social media content creation (Canva), lead generation, DocuSign and dotloop proficiency, CMA preparation

**Essential Tools:** Canva Pro, Google Workspace, Slack or WhatsApp Business, time tracking (Toggl, Hubstaff), password manager

**Where to Find Jobs:**
- Specialized: MyOutDesk, ShoreAgents, REVA Global, Virtudesk
- General: OnlineJobs.ph, Upwork, Indeed
- Direct outreach: Find top-producing agents and send personalized offers

**Your First 30 Days with a New Client:**
1. Complete onboarding and get access to MLS, CRM, email, and tools
2. Review current listings and active transactions
3. Understand lead sources and follow-up preferences
4. Study brand guidelines and shadow current workflows
5. Start with quick wins: organize CRM, set up drip campaigns
6. Document everything and create SOPs
7. Schedule weekly check-in calls and ask for feedback

**Scaling Your Career:** Start with one agent, get testimonials, consider specializing in transaction coordination, and eventually build a VA team serving multiple agents.`,
      order: 10,
      durationMin: 30,
      isPublished: true,
    },
  ];

  for (const lesson of realEstateLessons) {
    await upsertLesson(realEstateCourseId, lesson);
  }
  console.log("✅ Real Estate VA lessons seeded (10)");

  // ══════════════════════════════════════════════════════════════
  //  US BOOKKEEPING VA LESSONS (10)
  // ══════════════════════════════════════════════════════════════
  const bookkeepingCourseId = createdCourses[CourseSlug.US_BOOKKEEPING_VA];

  const bookkeepingLessons = [
    {
      title: "Introduction to US Bookkeeping for Virtual Assistants",
      content: `Bookkeeping is the backbone of every successful business. As a Bookkeeping VA, you'll manage the financial health of US-based businesses — a role that is highly valued and well-compensated.

**Bookkeeping vs. Accounting:**
- **Bookkeeping** — recording transactions, categorizing expenses, reconciling accounts, invoicing
- **Accounting** — analyzing data, preparing financial statements, tax planning, audits

**Your Professional Boundaries:**
You CAN record transactions, categorize expenses, reconcile accounts, generate reports, manage invoices, and process payroll data. You CANNOT file tax returns, provide tax advice, perform audits, or sign financial statements (that requires a CPA).

**The Fundamental Accounting Equation:** Assets = Liabilities + Equity

**The Five Account Types:**
1. **Assets** — what the business owns (cash, accounts receivable, equipment)
2. **Liabilities** — what the business owes (loans, accounts payable, credit cards)
3. **Equity** — owner's stake (investment, retained earnings)
4. **Revenue** — income from business activities
5. **Expenses** — costs of running the business

**Cash vs. Accrual Accounting:**
- **Cash Basis** — record when money is received/paid (simpler, used by small businesses)
- **Accrual Basis** — record when earned/incurred (more accurate, required by GAAP for larger businesses)

This course will give you the skills to confidently manage books for US businesses using industry-standard tools and practices.`,
      order: 1,
      durationMin: 25,
      isPublished: true,
      isFreePreview: true,
    },
    {
      title: "Accounting Fundamentals and Double-Entry Bookkeeping",
      content: `Every transaction in double-entry bookkeeping is recorded in at least TWO accounts — a debit and a credit. This system is self-balancing and error-detecting.

**Debit and Credit Rules:**
- Assets and Expenses: Debit increases, Credit decreases
- Liabilities, Equity, and Revenue: Credit increases, Debit decreases
- Memory aid "DEA-LER": Debits increase Expenses and Assets; Credits increase Liabilities, Equity, and Revenue

**Transaction Examples:**
- Receive $5,000 payment: Debit Cash +$5,000 / Credit Accounts Receivable -$5,000
- Pay $1,200 rent: Debit Rent Expense +$1,200 / Credit Cash -$1,200
- Buy $3,000 equipment on credit: Debit Equipment +$3,000 / Credit Accounts Payable +$3,000

**Chart of Accounts Structure:**
- 1000s: Assets (Checking, Savings, A/R, Equipment)
- 2000s: Liabilities (A/P, Credit Cards, Loans)
- 3000s: Equity (Owner's Equity, Retained Earnings)
- 4000s: Revenue (Service Revenue, Product Sales)
- 5000s: Cost of Goods Sold
- 6000s: Expenses (Rent, Utilities, Supplies, Payroll)

**The Accounting Cycle:**
Analyze transactions → Record journal entries → Post to general ledger → Prepare trial balance → Make adjusting entries → Prepare financial statements → Close temporary accounts → Start next period

In QuickBooks, many of these steps are automated — but understanding them helps you troubleshoot and catch errors.`,
      order: 2,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "QuickBooks Online Setup and Navigation",
      content: `QuickBooks Online (QBO) is the most widely used bookkeeping software for US small businesses. Over 80% of US small businesses use some version of QuickBooks.

**QBO Plans:** Simple Start (1 user), Essentials (3 users, bill management), Plus (5 users, inventory, budgeting), Advanced (25 users, custom roles). Most VAs work with Plus or Essentials.

**Initial Company Setup:**
1. **Company Info** — legal name, business type (LLC, S-Corp, etc.), EIN, fiscal year, accounting method
2. **Chart of Accounts** — review defaults, add industry-specific accounts, create sub-accounts for detailed tracking
3. **Bank Connections** — connect bank and credit card accounts via automatic feeds, set up bank rules for auto-categorization
4. **Vendors and Customers** — import lists with payment terms, set defaults (Net 15, Net 30, Due on Receipt)

**Key QBO Navigation:**
- Dashboard — overview of income, expenses, bank balances
- Banking — bank feed transactions, rules, reconciliation
- Sales — invoices, estimates, customers
- Expenses — bills, vendors, purchase orders
- Reports — 65+ built-in financial reports

**Bank Rules (Automation):** Set rules to auto-categorize recurring transactions (e.g., "ADOBE" → Software Subscriptions). Rules save 5–10 hours per month.

**Pro Tips:** Reconcile monthly, review uncategorized transactions weekly, use Classes to track profitability by department, and set up recurring transactions for monthly bills.`,
      order: 3,
      durationMin: 45,
      isPublished: true,
    },
    {
      title: "Accounts Payable — Managing Bills and Vendor Payments",
      content: `Accounts Payable (A/P) represents money the business owes to vendors. Proper management ensures good vendor relationships and healthy cash flow.

**The A/P Cycle:**
1. **Receive** — Verify the bill is legitimate, check for duplicates (the #1 A/P error)
2. **Enter in QBO** — Select vendor, enter dates and amounts, code to correct expense account, attach original PDF
3. **Approve** — Route for owner/manager approval, flag unusual expenses
4. **Schedule Payment** — Check terms (Net 15, Net 30), take early payment discounts when available (e.g., 2/10 Net 30)
5. **Process Payment** — Pay via check, ACH, or credit card; record method and reference number
6. **Reconcile** — Monthly, compare vendor statements to your A/P records

**Key A/P Reports:**
- A/P Aging Summary — unpaid bills grouped by due date (Current, 1–30, 31–60, 61–90, 90+ days)
- Vendor Balance Summary — total owed to each vendor

**1099 Vendor Tracking:**
US businesses must issue Form 1099-NEC to non-corporate vendors paid $600+ per year. Flag vendors as "1099 eligible" in QBO, collect W-9 forms, and generate 1099s in January.

**Best Practices:** Enter bills immediately, always attach original PDFs, never pay from a statement alone, and review the A/P Aging report weekly.`,
      order: 4,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Accounts Receivable — Invoicing and Collections",
      content: `Accounts Receivable (A/R) represents money owed TO the business. Getting paid on time is critical for business survival.

**The A/R Cycle:**
1. **Create Invoices** — In QBO: add products/services, set payment terms, customize with logo, send via email
2. **Record Payments** — Match payments to correct invoices, record method and deposit account
3. **Handle Credits/Refunds** — Credit memos reduce balance; refund receipts decrease revenue
4. **Collections Follow-Up** — Day 1 past due: automated reminder → Day 7: personal email → Day 14: phone call → Day 30: formal letter → Day 60+: consider write-off

**Invoice Best Practices:**
Include business name/logo, sequential invoice number, dates, itemized services, subtotal/taxes/total, accepted payment methods, and late payment policy.

**Key A/R Reports:**
- A/R Aging Summary — unpaid invoices by age (the most important A/R report)
- Customer Balance Summary — total owed by each customer

**Handling Bad Debt:**
When a customer truly won't pay: make final collection attempts, create a credit memo coded to "Bad Debt Expense," apply it to the invoice, and document all efforts for tax purposes.

**Tips for Faster Payments:** Send invoices immediately, offer multiple payment methods, consider early payment discounts, use QBO Payments for direct invoice payment, and track your Days Sales Outstanding (DSO).`,
      order: 5,
      durationMin: 40,
      isPublished: true,
    },
    {
      title: "Bank and Credit Card Reconciliation",
      content: `Bank reconciliation is the most important monthly bookkeeping task. It ensures your books match reality.

**Why Reconcile?**
Catches bank errors, detects fraud, identifies data entry mistakes, ensures financial reports are accurate, and is required for tax preparation.

**The Reconciliation Process in QBO:**
1. **Prepare** — Get the bank statement, verify beginning balance matches prior period's ending balance, enter statement ending balance and date
2. **Match Transactions** — Check off each transaction that appears on both the statement and QBO; work through deposits first, then debits
3. **Identify Discrepancies** — Outstanding checks (not yet cleared), deposits in transit, bank charges, interest income, automatic payments, or data entry errors
4. **Finalize** — Add missing transactions, research unexplained differences; the "Difference" field must show $0.00 before finishing

**Credit Card Reconciliation:** Same process — compare QBO to statement, verify categories, watch for fees and interest charges.

**Red Flags:** Large unexplained differences, recurring monthly discrepancies, negative balances, or transactions you don't recognize (possible fraud).

**Schedule:** Bank accounts monthly (first week of new month), credit cards monthly, PayPal/Stripe monthly if used.

**Key Rules:** Never change the opening balance to force a match — investigate the real cause. Reconcile one month at a time and never skip months.`,
      order: 6,
      durationMin: 45,
      isPublished: true,
    },
    {
      title: "Financial Reporting and Analysis",
      content: `Financial reports tell the story of a business's health. You'll generate these reports and present them clearly to clients.

**The Three Core Financial Statements:**

**1. Profit and Loss (Income Statement):**
Revenue - Cost of Goods Sold = Gross Profit - Operating Expenses = Net Income.
Key question: Is the business profitable and which costs are growing?

**2. Balance Sheet:**
Assets = Liabilities + Equity (at a specific point in time).
Shows what the business owns, owes, and is worth. If it doesn't balance, there's an error.

**3. Statement of Cash Flows:**
Operating Activities + Investing Activities + Financing Activities.
A profitable business can still run out of cash — this report reveals the true cash position.

**Additional Important Reports:**
A/R Aging, A/P Aging, General Ledger, Trial Balance, Sales by Customer, Expense by Vendor, Budget vs. Actual

**Generating Reports in QBO:** Navigate to Reports, customize date range and comparison periods, memorize frequently used reports, and schedule auto-email delivery to clients.

**Presenting to Clients:**
Many business owners aren't financial people. Lead with headlines ("Revenue is up 12%"), use charts, compare periods, highlight action items ("Your largest unpaid invoice is $12,000, now 45 days overdue"), and schedule monthly 15–30 minute review calls.`,
      order: 7,
      durationMin: 45,
      isPublished: true,
    },
    {
      title: "US Payroll Basics and Compliance",
      content: `Payroll is heavily regulated in the US. As a Bookkeeping VA, you'll support the payroll process while full processing is typically handled by dedicated services.

**Employee vs. Independent Contractor:**
- **W-2 Employee** — set hours, company tools, employer withholds taxes (income, SS, Medicare), receives benefits, Form W-2
- **1099 Contractor** — sets own hours/tools, NO tax withholding, no benefits, receives Form 1099-NEC if paid $600+
- Misclassification triggers IRS audits with severe penalties

**US Payroll Taxes:**
- *Employee withholdings:* Federal income tax, state income tax (varies by state), Social Security (6.2%), Medicare (1.45%)
- *Employer taxes:* Matching SS (6.2%), matching Medicare (1.45%), FUTA (0.6%), SUTA (varies by state)
- Total FICA: 15.3% split equally between employee and employer

**Common Payroll Schedules:** Weekly (52/year), Bi-weekly (26/year — most common), Semi-monthly (24/year), Monthly (12/year)

**Your Role:** Validate timesheets, submit hours to payroll service, review reports, record journal entries in QBO, reconcile payroll liabilities, track PTO balances, maintain employee records.

**Popular Payroll Services:** Gusto, ADP, Paychex, QuickBooks Payroll, Rippling

**Key Deadlines:** Quarterly Form 941, annual Form 940, W-2s and 1099s due January 31.`,
      order: 8,
      durationMin: 45,
      isPublished: true,
    },
    {
      title: "US Tax Preparation Support and Year-End Procedures",
      content: `You won't file tax returns (that's the CPA's job), but you play a critical role in preparing clean, organized records for tax season.

**Year-End Cleanup (December):**
1. Reconcile all bank and credit card accounts through December 31
2. Review and clear all uncategorized transactions
3. Verify A/R — are all invoices sent? Verify A/P — are all bills entered?
4. Review fixed asset purchases for depreciation
5. Confirm payroll is processed and reconciled
6. Verify 1099 vendor information (W-9s on file)

**Tax Preparation Package (January):**
- Final year-end statements: P&L, Balance Sheet, General Ledger, Trial Balance
- 1099-NEC forms for contractors paid $600+
- Supporting documents: bank statements, loan statements, asset receipts, mileage logs
- Send complete package to CPA by mid-February

**1099 Reporting:** Issue to non-corporate vendors paid $600+ for services. Collect W-9 forms before first payment, track in QBO, generate and file by January 31.

**Quarterly Estimated Taxes:** Due April 15, June 15, September 15, January 15. CPA calculates amounts; you remind the owner, record payments, and track compliance.

**Common IRS Expense Categories:** Advertising, car/truck expenses, contract labor, insurance, interest, legal services, office supplies, rent, repairs, taxes/licenses, travel, meals (50% deductible), utilities, wages.

**Year-End Checklist:** All 12 months reconciled, all transactions categorized, A/R and A/P accurate, payroll reconciled, 1099 info verified, financial statements generated, tax package sent to CPA.`,
      order: 9,
      durationMin: 45,
      isPublished: true,
    },
    {
      title: "Building Your Bookkeeping VA Career",
      content: `Congratulations on completing the US Bookkeeping VA program! Here's how to launch your career.

**QuickBooks Online ProAdvisor Certification (FREE):**
Create a free ProAdvisor account at quickbooks.intuit.com/accountants, study the training courses, pass the exam (80% score), and get listed in Intuit's "Find a ProAdvisor" directory. Benefits include a free QBO Advanced subscription and client discounts.

**Service Packages:**
- Basic ($300–800/mo): Transaction categorization, reconciliation, monthly statements
- Full-Service ($800–2,000/mo): Plus A/P, A/R, invoicing, payroll support, 1099 prep
- CFO-Level ($1,500–3,500/mo): Plus cash flow forecasting, budgeting, KPI dashboards, strategy calls

**Where to Find Jobs:**
- Specialized: Belay, Bookkeeper360, Bench, Wishup
- General: OnlineJobs.ph, Upwork, Indeed
- Direct: Network in Facebook groups for US small business owners, ask CPAs for referrals

**Salary Expectations:**
- Entry-level: $6–10/hour | Experienced (ProAdvisor): $10–18/hour | Specialized: $15–25/hour

**Client Onboarding Checklist:**
Signed engagement letter, NDA, QBO access (Accountant role — not admin), bank statement access, prior year tax returns, current chart of accounts review, open A/R and A/P balances

**Your Path Forward:**
1. Get your QBO ProAdvisor Certification (free — start this week)
2. Practice with your own QBO account or volunteer for a small business
3. Create professional profiles on OnlineJobs.ph and Upwork
4. Start with 1–2 clients and deliver excellent work
5. Get testimonials and gradually increase your rates

You are now prepared to launch your career as a US Bookkeeping Virtual Assistant!`,
      order: 10,
      durationMin: 30,
      isPublished: true,
    },
  ];

  for (const lesson of bookkeepingLessons) {
    await upsertLesson(bookkeepingCourseId, lesson);
  }
  console.log("✅ US Bookkeeping VA lessons seeded (10)");

  // ── Quizzes (existing — no changes) ────────────────────────────
  // Medical VA Quiz
  const medicalQuiz = await prisma.quiz.upsert({
    where: {
      id: (await prisma.quiz.findFirst({
        where: { courseId: medicalCourseId, title: "HIPAA & Medical Terminology Quiz" },
        select: { id: true },
      }))?.id ?? "non-existent-id",
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
    { type: "MCQ" as const, question: "What does HIPAA stand for?", options: ["Health Insurance Portability and Accountability Act", "Health Information Privacy and Assurance Act", "Healthcare Industry Protection and Assistance Act", "Health Insurance Processing and Administration Act"], correctAnswer: "0", points: 10, order: 1 },
    { type: "TRUE_FALSE" as const, question: "HIPAA violations can result in criminal penalties including imprisonment.", options: ["True", "False"], correctAnswer: "true", points: 10, order: 2 },
    { type: "MCQ" as const, question: "What does the prefix 'brady-' mean in medical terminology?", options: ["Fast", "Slow", "Large", "Small"], correctAnswer: "1", points: 10, order: 3 },
    { type: "MCQ" as const, question: "Which suffix means 'surgical removal of'?", options: ["-itis", "-ology", "-ectomy", "-plasty"], correctAnswer: "2", points: 10, order: 4 },
    { type: "TRUE_FALSE" as const, question: "EHR stands for Electronic Health Records.", options: ["True", "False"], correctAnswer: "true", points: 10, order: 5 },
    { type: "MCQ" as const, question: "Under HIPAA's minimum necessary standard, what should you do when sharing PHI?", options: ["Share all available information for context", "Share only what is needed for the specific purpose", "Share everything with other providers", "Avoid sharing any information at all"], correctAnswer: "1", points: 10, order: 6 },
    { type: "SHORT_ANSWER" as const, question: "What does the abbreviation 'Dx' stand for in medical documentation?", options: [], correctAnswer: "diagnosis", points: 10, order: 7 },
  ];

  for (const q of medicalQuestions) {
    const existing = await prisma.quizQuestion.findFirst({ where: { quizId: medicalQuiz.id, order: q.order } });
    if (!existing) await prisma.quizQuestion.create({ data: { ...q, quizId: medicalQuiz.id } });
  }
  console.log("✅ Medical VA quiz seeded");

  // Real Estate VA Quiz
  const realEstateQuiz = await prisma.quiz.upsert({
    where: {
      id: (await prisma.quiz.findFirst({
        where: { courseId: realEstateCourseId, title: "Real Estate Fundamentals Quiz" },
        select: { id: true },
      }))?.id ?? "non-existent-id",
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
    { type: "MCQ" as const, question: "What does MLS stand for in real estate?", options: ["Multiple Listing Service", "Master Listing System", "Market Listing Standard", "Main Listing Source"], correctAnswer: "0", points: 10, order: 1 },
    { type: "MCQ" as const, question: "What is a CMA in real estate?", options: ["Client Management Agreement", "Comparative Market Analysis", "Commercial Marketing Assessment", "Contract Management Agreement"], correctAnswer: "1", points: 10, order: 2 },
    { type: "TRUE_FALSE" as const, question: "Transaction coordinators manage all the paperwork after a purchase agreement is signed.", options: ["True", "False"], correctAnswer: "true", points: 10, order: 3 },
    { type: "MCQ" as const, question: "What does DOM stand for in real estate listings?", options: ["Days on Market", "Date of Mortgage", "Deed of Mortgage", "Document of Marketing"], correctAnswer: "0", points: 10, order: 4 },
    { type: "SHORT_ANSWER" as const, question: "What is the term for properties used to determine the market value of a subject property?", options: [], correctAnswer: "comps", points: 10, order: 5 },
  ];

  for (const q of realEstateQuestions) {
    const existing = await prisma.quizQuestion.findFirst({ where: { quizId: realEstateQuiz.id, order: q.order } });
    if (!existing) await prisma.quizQuestion.create({ data: { ...q, quizId: realEstateQuiz.id } });
  }
  console.log("✅ Real Estate VA quiz seeded");

  // Bookkeeping VA Quiz
  const bookkeepingQuiz = await prisma.quiz.upsert({
    where: {
      id: (await prisma.quiz.findFirst({
        where: { courseId: bookkeepingCourseId, title: "US Bookkeeping Fundamentals Quiz" },
        select: { id: true },
      }))?.id ?? "non-existent-id",
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
    { type: "MCQ" as const, question: "What is the fundamental accounting equation?", options: ["Assets = Liabilities + Equity", "Revenue - Expenses = Profit", "Assets + Liabilities = Equity", "Income = Assets - Expenses"], correctAnswer: "0", points: 10, order: 1 },
    { type: "TRUE_FALSE" as const, question: "QuickBooks Online is cloud-based software accessible from anywhere.", options: ["True", "False"], correctAnswer: "true", points: 10, order: 2 },
    { type: "MCQ" as const, question: "What is the purpose of bank reconciliation?", options: ["To calculate taxes owed", "To match accounting records with the bank statement", "To create invoices for customers", "To record payroll transactions"], correctAnswer: "1", points: 10, order: 3 },
    { type: "MCQ" as const, question: "Accounts Receivable represents:", options: ["Money the business owes to vendors", "The owner's investment in the business", "Money owed TO the business by customers", "Monthly business expenses"], correctAnswer: "2", points: 10, order: 4 },
    { type: "SHORT_ANSWER" as const, question: "What does GAAP stand for? (abbreviation only, e.g., 'GAAP')", options: [], correctAnswer: "gaap", points: 10, order: 5 },
  ];

  for (const q of bookkeepingQuestions) {
    const existing = await prisma.quizQuestion.findFirst({ where: { quizId: bookkeepingQuiz.id, order: q.order } });
    if (!existing) await prisma.quizQuestion.create({ data: { ...q, quizId: bookkeepingQuiz.id } });
  }
  console.log("✅ US Bookkeeping VA quiz seeded");

  console.log("\n✅ All seeding complete!");
  console.log("   Admin: gdscapital.168@gmail.com / Admin@123456!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

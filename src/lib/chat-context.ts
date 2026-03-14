import { prisma } from "@/lib/prisma";
import { findAllPublished } from "@/lib/repositories/knowledge-base.repository";

const FAQ_ENTRIES = [
  {
    q: "What courses do you offer?",
    a: "We offer three specialized VA training programs: Medical VA, Real Estate VA, and US Bookkeeping VA. Each program is designed to give you industry-specific skills for a successful virtual assistant career.",
  },
  {
    q: "How do I enroll?",
    a: "Visit our Enroll page, fill out the enrollment form with your details, and submit. Our team will review your application and notify you via email within 1-3 business days.",
  },
  {
    q: "How much does it cost?",
    a: "Course prices vary by program. Visit the Courses page to see current pricing for each program.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept online payments via GCash, PayMaya, and credit/debit card. After your enrollment is approved, you'll receive a secure payment link via email.",
  },
  {
    q: "How long are the courses?",
    a: "Course duration varies by program — typically between 4-12 weeks depending on the specialization.",
  },
  {
    q: "Do I get a certificate?",
    a: "Yes! Upon completing all lessons in your course, you'll receive a digital certificate of completion that you can download and share.",
  },
  {
    q: "What are the requirements?",
    a: "You need to be at least 16 years old, have basic computer skills, and reliable internet access. No prior VA experience is required — our courses are designed for beginners.",
  },
  {
    q: "How do I access my course after enrollment?",
    a: "Once your enrollment is approved (and payment confirmed for paid courses), you'll receive login credentials via email. Use them at the Student Login page to access your dashboard.",
  },
  {
    q: "Can I contact support?",
    a: "Yes! You can reach us through the Contact page on our website, or reply to any email you receive from us.",
  },
  {
    q: "What is a Virtual Assistant?",
    a: "A Virtual Assistant (VA) is a remote professional who provides administrative, technical, or creative support to businesses and entrepreneurs. It's a flexible career you can do from anywhere.",
  },
];

export function buildFaqContext(): string {
  return FAQ_ENTRIES.map((entry) => `Q: ${entry.q}\nA: ${entry.a}`).join("\n\n");
}

export async function buildCourseContext(): Promise<string> {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      title: true,
      slug: true,
      description: true,
      durationWeeks: true,
      price: true,
      outcomes: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (courses.length === 0) return "No courses are currently available.";

  return courses
    .map((course) => {
      const price = Number(course.price);
      const priceStr = price > 0 ? `PHP ${price.toLocaleString()}` : "Free";
      const outcomes = course.outcomes.length > 0
        ? `Key outcomes: ${course.outcomes.join(", ")}`
        : "";

      return [
        `Course: ${course.title}`,
        `Duration: ${course.durationWeeks} weeks`,
        `Price: ${priceStr}`,
        course.description,
        outcomes,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

export async function buildSystemPrompt(): Promise<string> {
  const faq = buildFaqContext();
  const courses = await buildCourseContext();

  return `You are a friendly and helpful assistant for HUMI Training Center, a platform that trains people for diverse professional careers.

Your role:
- Answer questions about courses, enrollment, pricing, payment, and the platform
- Be warm, encouraging, and professional
- Keep answers concise (2-4 sentences max)
- If you don't know something specific, suggest contacting support via the Contact page
- Never make up information not provided in the context below
- Do not discuss topics unrelated to HUMI Training Center or professional training programs
- Guide prospective students toward enrolling

COURSE CATALOG:
${courses}

FREQUENTLY ASKED QUESTIONS:
${faq}

IMPORTANT LINKS:
- Courses: /courses
- Enroll: /enroll
- Contact: /contact
- Student Login: /student/login
- Help Center: /help`;
}

/* ------------------------------------------------------------------ */
/*  Knowledge Base Context for AI                                      */
/* ------------------------------------------------------------------ */

async function buildKnowledgeBaseContext(): Promise<string> {
  const articles = await findAllPublished();
  if (articles.length === 0) return "";

  const summary = articles
    .map((a) => `[${a.category}] ${a.title}: ${a.content.slice(0, 300)}`)
    .join("\n\n");

  return `\n\nKNOWLEDGE BASE ARTICLES:\n${summary}`;
}

/* ------------------------------------------------------------------ */
/*  Role-Aware System Prompt                                           */
/* ------------------------------------------------------------------ */

const ROLE_INSTRUCTIONS: Readonly<Record<string, string>> = {
  student: `You are helping a student who is enrolled in the platform.
- Help with course navigation, lesson content, assignments, and quizzes
- Guide them on using the student dashboard features
- Answer questions about certificates, career readiness, and job matching
- If asked about billing or enrollment issues, suggest submitting a support ticket`,

  trainer: `You are helping a trainer on the platform.
- Help with course management, grading, and student communication
- Guide them on scheduling, materials, and trainer tools
- Answer questions about their dashboard features`,

  admin: `You are helping a platform administrator.
- Help with platform management, user management, and system settings
- Guide them on enrollment processing, payment verification, and analytics
- Answer questions about reports, organizations, and admin tools`,

  corporate: `You are helping a corporate manager.
- Help with employee enrollment, training progress tracking, and analytics
- Guide them on using the corporate dashboard and team management
- Answer questions about corporate training programs and seat management`,
};

export async function buildRoleAwareSystemPrompt(
  role?: string,
  currentPage?: string
): Promise<string> {
  const basePrompt = await buildSystemPrompt();
  const kbContext = await buildKnowledgeBaseContext();

  const roleInstruction = role ? ROLE_INSTRUCTIONS[role] ?? "" : "";
  const pageContext = currentPage
    ? `\nThe user is currently on the page: ${currentPage}`
    : "";

  return `${basePrompt}${kbContext}${roleInstruction ? `\n\nROLE-SPECIFIC INSTRUCTIONS:\n${roleInstruction}` : ""}${pageContext}`;
}

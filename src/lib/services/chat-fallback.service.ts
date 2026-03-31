/**
 * FAQ-based fallback chat service.
 * Used when OPENAI_API_KEY is not configured.
 * Matches user questions to pre-defined answers using keyword matching.
 */

type FaqEntry = {
  keywords: string[];
  answer: string;
};

const FAQ: FaqEntry[] = [
  {
    keywords: ["course", "courses", "offer", "program", "programs", "available"],
    answer:
      "We offer specialized training programs designed to prepare you for professional careers. Visit our Courses page at /courses to see the full catalog with pricing and duration details.",
  },
  {
    keywords: ["enroll", "enrollment", "register", "sign up", "join", "apply"],
    answer:
      "To enroll, visit our Enroll page at /enroll, fill out the enrollment form, and submit. Our team reviews applications and notifies you via email within 1-3 business days.",
  },
  {
    keywords: ["price", "cost", "fee", "how much", "pricing", "payment", "pay"],
    answer:
      "Course prices vary by program. Visit /courses to see current pricing. We accept GCash, PayMaya, and credit/debit card payments. After your enrollment is approved, you'll receive a secure payment link.",
  },
  {
    keywords: ["certificate", "certification", "diploma", "credential"],
    answer:
      "Yes! Upon completing all lessons in your course, you receive a digital certificate of completion that you can download and share on your professional profiles.",
  },
  {
    keywords: ["duration", "long", "weeks", "months", "time", "how long"],
    answer:
      "Course duration varies by program — typically between 4-12 weeks depending on the specialization. Check the Courses page at /courses for specific program lengths.",
  },
  {
    keywords: ["requirement", "requirements", "need", "qualifications", "age", "experience"],
    answer:
      "You need to be at least 16 years old, have basic computer skills, and reliable internet access. No prior professional experience is required — our courses are designed for beginners!",
  },
  {
    keywords: ["login", "access", "dashboard", "account", "credentials", "password"],
    answer:
      "Once your enrollment is approved, you'll receive login credentials via email. Use them at the Student Login page to access your personal dashboard and course materials.",
  },
  {
    keywords: ["support", "contact", "help", "question", "issue", "problem"],
    answer:
      "You can reach our support team through the Contact page at /contact, or visit the Help Center at /help for articles and FAQs. We're happy to assist!",
  },
  {
    keywords: ["certificate", "verify", "verification", "authentic"],
    answer:
      "All HUMI Hub certificates can be verified online. Share your certificate link and anyone can confirm its authenticity through our verification system at /verify.",
  },
  {
    keywords: ["start", "get started", "begin", "how to start", "first step"],
    answer:
      "Getting started is easy! 1) Browse courses at /courses, 2) Click Enroll on a course you like, 3) Complete the enrollment form, 4) Wait for approval email, 5) Log in and start learning!",
  },
  {
    keywords: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
    answer:
      "Hi there! 👋 Welcome to HUMI Hub! I'm here to help you with questions about our courses, enrollment, pricing, or anything else. What would you like to know?",
  },
  {
    keywords: ["thank", "thanks", "thank you", "appreciate"],
    answer:
      "You're welcome! 😊 Feel free to ask if you have any other questions. We're here to help you on your learning journey with HUMI Hub!",
  },
];

const DEFAULT_ANSWER =
  "Thanks for reaching out! For detailed assistance, please visit our Contact page at /contact or browse the Help Center at /help. Our team is happy to answer all your questions about HUMI Hub courses and enrollment.";

export function faqFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  for (const entry of FAQ) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }

  return DEFAULT_ANSWER;
}

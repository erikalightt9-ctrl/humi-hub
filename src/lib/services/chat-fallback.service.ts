/**
 * FAQ-based fallback chat service.
 * Used when OPENAI_API_KEY is not configured.
 * Provides relevance detection + keyword-matched FAQ answers.
 */

type FaqEntry = {
  keywords: string[];
  answer: string;
};

// ─── Relevance Detection ────────────────────────────────────────────────────

const RELEVANT_KEYWORDS = [
  // Platform & brand
  "humi", "hub", "platform", "website", "portal",
  // Courses & programs
  "course", "courses", "program", "programs", "module", "lesson", "class", "training",
  // Enrollment & registration
  "enroll", "enrollment", "register", "registration", "apply", "application", "join", "sign up",
  // Pricing & payment
  "price", "pricing", "cost", "fee", "how much", "payment", "pay", "gcash", "paymaya", "refund",
  // Certificates
  "certificate", "certification", "diploma", "credential", "completion",
  // Schedule & duration
  "schedule", "duration", "how long", "weeks", "months", "start date", "deadline",
  // Account & access
  "login", "log in", "account", "password", "access", "credentials", "dashboard",
  // Support & help
  "support", "help", "contact", "question", "issue", "problem", "ticket",
  // Requirements
  "requirement", "requirements", "need", "qualify", "eligible", "age",
  // Career
  "career", "job", "virtual assistant", "va", "work", "freelance",
  // Misc intent
  "what is", "how do", "how to", "can i", "do you", "is there", "when", "where",
];

/**
 * Returns true if the message is likely about the platform/courses.
 * Short greetings (< 4 words) are always considered relevant.
 */
export function isRelevantQuestion(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).length;

  // Short greetings are always relevant
  if (wordCount <= 3) return true;

  return RELEVANT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── FAQ Answers ─────────────────────────────────────────────────────────────

const FAQ: FaqEntry[] = [
  {
    keywords: ["course", "courses", "offer", "program", "programs", "available", "training", "module", "class"],
    answer:
      "We offer specialized professional training programs designed to launch your career. Visit our Courses page at /courses to see the full catalog with pricing and duration details. 📚",
  },
  {
    keywords: ["enroll", "enrollment", "register", "sign up", "join", "apply", "application"],
    answer:
      "To enroll: visit /enroll, fill out the enrollment form, and submit. Our team reviews applications and notifies you via email within 1-3 business days. Easy! 🎯",
  },
  {
    keywords: ["price", "cost", "fee", "how much", "pricing", "gcash", "paymaya", "refund"],
    answer:
      "Course prices vary by program — visit /courses to see current pricing. We accept GCash, PayMaya, and credit/debit card. After approval, you'll receive a secure payment link via email. 💳",
  },
  {
    keywords: ["certificate", "certification", "diploma", "credential", "completion"],
    answer:
      "Yes! 🎓 Upon completing all lessons, you receive a digital certificate you can download and share. Certificates can be verified online at /verify.",
  },
  {
    keywords: ["duration", "long", "weeks", "months", "time", "how long", "schedule"],
    answer:
      "Course duration varies by program — typically 4-12 weeks. Check /courses for specific program lengths and schedules. ⏱️",
  },
  {
    keywords: ["requirement", "requirements", "need", "qualifications", "age", "eligible", "qualify"],
    answer:
      "Requirements: 16+ years old, basic computer skills, and reliable internet. No prior experience needed — our courses are built for beginners! 🌱",
  },
  {
    keywords: ["login", "log in", "access", "dashboard", "account", "credentials", "password"],
    answer:
      "Once enrolled and approved, you'll receive login credentials via email. Head to the Student Login page to access your personal dashboard and course materials. 🔐",
  },
  {
    keywords: ["support", "contact", "help", "issue", "problem", "ticket"],
    answer:
      "Our support team is ready to help! Visit /contact to send a message or browse the Help Center at /help for articles and FAQs. 🙋",
  },
  {
    keywords: ["verify", "verification", "authentic", "legit"],
    answer:
      "All HUMI Hub certificates are verifiable online. Share your certificate link and anyone can confirm its authenticity at /verify. ✅",
  },
  {
    keywords: ["start", "get started", "begin", "first step", "how to start"],
    answer:
      "Getting started is simple! 1) Browse courses at /courses → 2) Click Enroll → 3) Complete the form → 4) Wait for approval email → 5) Log in and start learning! 🚀",
  },
  {
    keywords: ["virtual assistant", "va ", " va", "career", "job", "freelance", "work from home"],
    answer:
      "HUMI Hub trains you for professional remote careers. Our programs are industry-specific and designed to get you job-ready fast. Check /courses to explore your options! 💼",
  },
  {
    keywords: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy"],
    answer:
      "Hi there! 👋 Welcome to HUMI Hub! I'm here to help with questions about courses, enrollment, pricing, or anything else. What would you like to know?",
  },
  {
    keywords: ["thank", "thanks", "thank you", "appreciate", "awesome", "great"],
    answer:
      "You're welcome! 😊 Don't hesitate to ask if you have more questions. Good luck on your learning journey with HUMI Hub! 🌟",
  },
];

const DEFAULT_ANSWER =
  "I'm not sure I have the right answer for that. Let me connect you with our team — they'll be happy to help! 😊";

/**
 * Returns a matched FAQ answer or the default fallback.
 */
export function faqFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  for (const entry of FAQ) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }

  return DEFAULT_ANSWER;
}

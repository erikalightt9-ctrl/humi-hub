/* ------------------------------------------------------------------ */
/*  Support Ticket Constants                                           */
/* ------------------------------------------------------------------ */

export const TICKET_CATEGORIES = [
  { value: "ENROLLMENT", label: "Enrollment" },
  { value: "PAYMENT", label: "Payment" },
  { value: "TECHNICAL_SUPPORT", label: "Technical Support" },
  { value: "COURSE_CONTENT", label: "Course Content" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "CORPORATE_TRAINING", label: "Corporate Training" },
] as const;

export const TICKET_STATUSES = [
  { value: "OPEN", label: "Open", color: "bg-yellow-100 text-yellow-700" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "RESOLVED", label: "Resolved", color: "bg-green-100 text-green-700" },
  { value: "CLOSED", label: "Closed", color: "bg-gray-100 text-gray-500" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-600" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-100 text-blue-700" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-700" },
] as const;

export const TICKET_REFERENCE_PREFIX = "TK";

/* ------------------------------------------------------------------ */
/*  Notification Constants                                             */
/* ------------------------------------------------------------------ */

export const NOTIFICATION_TYPE_LABELS: Readonly<Record<string, string>> = {
  NEW_MESSAGE: "New Message",
  TICKET_RESPONSE: "Ticket Response",
  TRAINER_ANNOUNCEMENT: "Trainer Announcement",
  LESSON_UPDATE: "Lesson Update",
  JOB_ALERT: "Job Alert",
  COURSE_UPDATE: "Course Update",
  SYSTEM: "System",
};

/* ------------------------------------------------------------------ */
/*  Knowledge Base Constants                                           */
/* ------------------------------------------------------------------ */

export const KB_CATEGORIES = [
  { value: "GETTING_STARTED", label: "Getting Started" },
  { value: "COURSE_ENROLLMENT", label: "Course Enrollment" },
  { value: "PAYMENT_GUIDE", label: "Payment Guide" },
  { value: "CERTIFICATION_GUIDE", label: "Certification Guide" },
  { value: "CORPORATE_TRAINING_GUIDE", label: "Corporate Training Guide" },
  { value: "TECHNICAL_TROUBLESHOOTING", label: "Technical Troubleshooting" },
] as const;

/* ------------------------------------------------------------------ */
/*  Conversation Constants                                             */
/* ------------------------------------------------------------------ */

export const CONVERSATION_TYPE_LABELS: Readonly<Record<string, string>> = {
  DIRECT: "Direct Message",
  COURSE_GROUP: "Course Group",
  ANNOUNCEMENT: "Announcement",
  LESSON_DISCUSSION: "Lesson Discussion",
};

/* ------------------------------------------------------------------ */
/*  Actor Type Labels                                                  */
/* ------------------------------------------------------------------ */

export const ACTOR_TYPE_LABELS: Readonly<Record<string, string>> = {
  ADMIN: "Admin",
  STUDENT: "Student",
  TRAINER: "Trainer",
  CORPORATE_MANAGER: "Corporate Manager",
};

import { render } from "@react-email/components";
import { sendMailWithRetry } from "@/lib/mailer";
import { EnrollmentApprovedEmail } from "@/lib/email/templates/enrollment-approved";
import { EnrollmentRejectedEmail } from "@/lib/email/templates/enrollment-rejected";
import { PaymentConfirmedEmail } from "@/lib/email/templates/payment-confirmed";
import { LessonCompletedEmail } from "@/lib/email/templates/lesson-completed";
import { QuizPassedEmail } from "@/lib/email/templates/quiz-passed";
import { CourseCompletedEmail } from "@/lib/email/templates/course-completed";
import { WeeklyProgressEmail } from "@/lib/email/templates/weekly-progress";
import { BadgeEarnedEmail } from "@/lib/email/templates/badge-earned";
import { AssignmentDueReminderEmail } from "@/lib/email/templates/assignment-due-reminder";
import { AssignmentGradedEmail } from "@/lib/email/templates/assignment-graded";
import { InactivityReminderEmail } from "@/lib/email/templates/inactivity-reminder";
import { PasswordResetEmail } from "@/lib/email/templates/password-reset";
import { PaymentReminderEmail } from "@/lib/email/templates/payment-reminder";
import { ForumReplyEmail } from "@/lib/email/templates/forum-reply";
import { PaymentInstructionsEmail } from "@/lib/email/templates/payment-instructions";
import { AdminReviewReminderEmail } from "@/lib/email/templates/admin-review-reminder";
import { NewEnrollmentAdminEmail } from "@/lib/email/templates/new-enrollment-admin";
import { EmailVerificationEmail } from "@/lib/email/templates/email-verification";
import { AccountActivationEmail } from "@/lib/email/templates/account-activation";
import { EnrollmentConfirmationWithPaymentEmail } from "@/lib/email/templates/enrollment-confirmation-with-payment";

const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "HUMI Hub";
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? process.env.GMAIL_USER ?? "noreply@humihub.com";

const fromAddress = () => `"${FROM_NAME}" <${FROM_ADDRESS}>`;

const baseUrl = () => process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await sendMailWithRetry(
    { from: fromAddress(), to, subject, html },
    `${subject} → ${to}`,
  );
}

export async function sendEnrollmentApproved(opts: {
  name: string;
  email: string;
  courseTitle: string;
  temporaryPassword: string;
  paymentLink?: string;
}): Promise<void> {
  const html = await render(
    EnrollmentApprovedEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      temporaryPassword: opts.temporaryPassword,
      loginUrl: `${baseUrl()}/student/login`,
      paymentLink: opts.paymentLink,
    })
  );

  const subject = opts.paymentLink
    ? `Enrollment Approved — Complete Payment | ${opts.courseTitle}`
    : `Welcome! Your Learning Portal Access — ${opts.courseTitle}`;

  await sendEmail(opts.email, subject, html);
}

export async function sendEnrollmentRejected(opts: {
  name: string;
  email: string;
  courseTitle: string;
  feedback?: string;
}): Promise<void> {
  const html = await render(
    EnrollmentRejectedEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      feedback: opts.feedback,
      contactEmail: process.env.EMAIL_FROM_ADDRESS ?? process.env.GMAIL_USER ?? "",
    })
  );

  await sendEmail(
    opts.email,
    `Application Update — ${opts.courseTitle} | HUMI Hub`,
    html
  );
}

export async function sendPaymentConfirmed(opts: {
  name: string;
  email: string;
  courseTitle: string;
  amount: string;
  paymentMethod: string;
  temporaryPassword: string;
}): Promise<void> {
  const html = await render(
    PaymentConfirmedEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      amount: opts.amount,
      paymentMethod: opts.paymentMethod,
      temporaryPassword: opts.temporaryPassword,
      loginUrl: `${baseUrl()}/student/login`,
    })
  );

  await sendEmail(
    opts.email,
    `Payment Confirmed — Access ${opts.courseTitle} Now!`,
    html
  );
}

export async function sendLessonCompleted(opts: {
  name: string;
  email: string;
  lessonTitle: string;
  courseTitle: string;
  courseId: string;
  nextLessonTitle?: string;
}): Promise<void> {
  const html = await render(
    LessonCompletedEmail({
      name: opts.name,
      email: opts.email,
      lessonTitle: opts.lessonTitle,
      courseTitle: opts.courseTitle,
      nextLessonTitle: opts.nextLessonTitle,
      dashboardUrl: `${baseUrl()}/student/courses/${opts.courseId}`,
    })
  );

  await sendEmail(
    opts.email,
    `Lesson Completed: ${opts.lessonTitle} | HUMI Hub`,
    html
  );
}

export async function sendQuizPassed(opts: {
  name: string;
  email: string;
  quizTitle: string;
  courseTitle: string;
  score: number;
  passingScore: number;
}): Promise<void> {
  const html = await render(
    QuizPassedEmail({
      name: opts.name,
      email: opts.email,
      quizTitle: opts.quizTitle,
      courseTitle: opts.courseTitle,
      score: opts.score,
      passingScore: opts.passingScore,
      dashboardUrl: `${baseUrl()}/student/dashboard`,
    })
  );

  await sendEmail(
    opts.email,
    `Quiz Passed: ${opts.quizTitle} — Score ${opts.score}%`,
    html
  );
}

export async function sendCourseCompleted(opts: {
  name: string;
  email: string;
  courseTitle: string;
  certNumber: string;
}): Promise<void> {
  const html = await render(
    CourseCompletedEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      certNumber: opts.certNumber,
      certificateUrl: `${baseUrl()}/student/certificates`,
    })
  );

  await sendEmail(
    opts.email,
    `Congratulations! ${opts.courseTitle} Certificate Ready`,
    html
  );
}

export async function sendWeeklyProgress(opts: {
  name: string;
  email: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}): Promise<void> {
  const html = await render(
    WeeklyProgressEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      completedLessons: opts.completedLessons,
      totalLessons: opts.totalLessons,
      progressPercent: opts.progressPercent,
      dashboardUrl: `${baseUrl()}/student/dashboard`,
    })
  );

  await sendEmail(
    opts.email,
    `Your Weekly Progress — ${opts.courseTitle}`,
    html
  );
}

export async function sendBadgeEarned(opts: {
  name: string;
  email: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
}): Promise<void> {
  const html = await render(
    BadgeEarnedEmail({
      name: opts.name,
      email: opts.email,
      badgeName: opts.badgeName,
      badgeDescription: opts.badgeDescription,
      badgeIcon: opts.badgeIcon,
      dashboardUrl: `${baseUrl()}/student/dashboard`,
    })
  );

  await sendEmail(
    opts.email,
    `Badge Earned: ${opts.badgeName} | HUMI Hub`,
    html
  );
}

export async function sendAssignmentDueReminder(opts: {
  name: string;
  email: string;
  assignmentTitle: string;
  courseTitle: string;
  courseId: string;
  assignmentId: string;
  dueDate: string;
}): Promise<void> {
  const html = await render(
    AssignmentDueReminderEmail({
      name: opts.name,
      email: opts.email,
      assignmentTitle: opts.assignmentTitle,
      courseTitle: opts.courseTitle,
      dueDate: opts.dueDate,
      assignmentUrl: `${baseUrl()}/student/courses/${opts.courseId}/assignments`,
    })
  );

  await sendEmail(
    opts.email,
    `Reminder: "${opts.assignmentTitle}" due ${opts.dueDate}`,
    html
  );
}

export async function sendAssignmentGraded(opts: {
  name: string;
  email: string;
  assignmentTitle: string;
  courseTitle: string;
  courseId: string;
  grade: number;
  maxPoints: number;
  feedback?: string;
}): Promise<void> {
  const html = await render(
    AssignmentGradedEmail({
      name: opts.name,
      email: opts.email,
      assignmentTitle: opts.assignmentTitle,
      courseTitle: opts.courseTitle,
      grade: opts.grade,
      maxPoints: opts.maxPoints,
      feedback: opts.feedback,
      assignmentUrl: `${baseUrl()}/student/courses/${opts.courseId}/assignments`,
    })
  );

  await sendEmail(
    opts.email,
    `Assignment Graded: ${opts.assignmentTitle} — ${opts.grade}/${opts.maxPoints}`,
    html
  );
}

export async function sendInactivityReminder(opts: {
  name: string;
  email: string;
  courseTitle: string;
  courseId: string;
  daysSinceLastActivity: number;
  progressPercent: number;
}): Promise<void> {
  const html = await render(
    InactivityReminderEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      daysSinceLastActivity: opts.daysSinceLastActivity,
      progressPercent: opts.progressPercent,
      dashboardUrl: `${baseUrl()}/student/courses/${opts.courseId}`,
    })
  );

  await sendEmail(
    opts.email,
    `We miss you! Continue your ${opts.courseTitle} journey`,
    html
  );
}

export async function sendPasswordReset(opts: {
  name: string;
  email: string;
  resetToken: string;
  expiresInMinutes?: number;
}): Promise<void> {
  const html = await render(
    PasswordResetEmail({
      name: opts.name,
      email: opts.email,
      resetUrl: `${baseUrl()}/student/reset-password?token=${opts.resetToken}`,
      expiresInMinutes: opts.expiresInMinutes ?? 30,
    })
  );

  await sendEmail(
    opts.email,
    "Reset Your Password — HUMI Hub",
    html
  );
}

export async function sendPaymentReminder(opts: {
  name: string;
  email: string;
  courseTitle: string;
  amount: string;
  paymentLink: string;
  daysSinceApproval: number;
}): Promise<void> {
  const html = await render(
    PaymentReminderEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      amount: opts.amount,
      paymentLink: opts.paymentLink,
      daysSinceApproval: opts.daysSinceApproval,
    })
  );

  await sendEmail(
    opts.email,
    `Payment Reminder: ${opts.courseTitle} — Complete Your Enrollment`,
    html
  );
}

export async function sendForumReply(opts: {
  name: string;
  email: string;
  threadTitle: string;
  threadId: string;
  courseId: string;
  replierName: string;
  replyPreview: string;
}): Promise<void> {
  const html = await render(
    ForumReplyEmail({
      name: opts.name,
      email: opts.email,
      threadTitle: opts.threadTitle,
      replierName: opts.replierName,
      replyPreview: opts.replyPreview,
      threadUrl: `${baseUrl()}/student/courses/${opts.courseId}/forum/${opts.threadId}`,
    })
  );

  await sendEmail(
    opts.email,
    `New reply to "${opts.threadTitle}" from ${opts.replierName}`,
    html
  );
}

export async function sendPaymentInstructions(opts: {
  name: string;
  email: string;
  courseTitle: string;
  amount: string;
  enrollmentId: string;
  referenceCode?: string;
}): Promise<void> {
  const html = await render(
    PaymentInstructionsEmail({
      name: opts.name,
      email: opts.email,
      courseTitle: opts.courseTitle,
      amount: opts.amount,
      referenceCode: opts.referenceCode,
      gcashNumber: process.env.GCASH_NUMBER,
      gcashName: process.env.GCASH_NAME,
      gcashQrUrl: process.env.GCASH_QR_URL,
      bankName: process.env.BANK_NAME,
      bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER,
      bankAccountName: process.env.BANK_ACCOUNT_NAME,
      paymentUploadUrl: `${baseUrl()}/pay/${opts.enrollmentId}`,
    })
  );

  await sendEmail(
    opts.email,
    `Payment Instructions — ${opts.courseTitle} | HUMI Hub`,
    html
  );
}

export async function sendAdminReviewReminder(opts: {
  adminName: string;
  adminEmail: string;
  pendingEnrollments: ReadonlyArray<{
    id: string;
    fullName: string;
    email: string;
    courseTitle: string;
    hoursWaiting: number;
    submittedAt: string;
  }>;
  isUrgent: boolean;
}): Promise<void> {
  const count = opts.pendingEnrollments.length;
  const label = count === 1 ? "enrollment" : "enrollments";

  const html = await render(
    AdminReviewReminderEmail({
      adminName: opts.adminName,
      pendingEnrollments: opts.pendingEnrollments,
      isUrgent: opts.isUrgent,
      dashboardUrl: `${baseUrl()}/admin/enrollees`,
    })
  );

  const subject = opts.isUrgent
    ? `URGENT: ${count} ${label} pending over 12h — HUMI Hub`
    : `Reminder: ${count} pending ${label} to review — HUMI Hub`;

  await sendEmail(opts.adminEmail, subject, html);
}

export async function sendNewEnrollmentAdminNotification(opts: {
  adminEmails: ReadonlyArray<string>;
  enrolleeName: string;
  enrolleeEmail: string;
  courseTitle: string;
  enrollmentId: string;
  submittedAt: string;
}): Promise<void> {
  const reviewUrl = `${baseUrl()}/admin/enrollees/${opts.enrollmentId}`;

  const html = await render(
    NewEnrollmentAdminEmail({
      adminName: "Admin",
      enrolleeName: opts.enrolleeName,
      enrolleeEmail: opts.enrolleeEmail,
      courseTitle: opts.courseTitle,
      enrollmentId: opts.enrollmentId,
      submittedAt: opts.submittedAt,
      reviewUrl,
    })
  );

  const subject = `New Enrollment: ${opts.enrolleeName} — ${opts.courseTitle}`;

  await Promise.all(
    opts.adminEmails.map((email) => sendEmail(email, subject, html))
  );
}

export async function sendEmailVerification(opts: {
  name: string;
  email: string;
  courseTitle: string;
  verificationUrl: string;
}): Promise<void> {
  const html = await render(
    EmailVerificationEmail({
      name: opts.name,
      courseTitle: opts.courseTitle,
      verificationUrl: opts.verificationUrl,
      expiresInHours: 24,
    })
  );

  await sendEmail(
    opts.email,
    `Verify Your Email — ${opts.courseTitle} | HUMI Hub`,
    html
  );
}

export async function sendAccountActivation(opts: {
  name: string;
  email: string;
  courseTitle: string;
  activationUrl: string;
  statusTrackingUrl: string;
}): Promise<void> {
  const html = await render(
    AccountActivationEmail({
      name: opts.name,
      courseTitle: opts.courseTitle,
      activationUrl: opts.activationUrl,
      statusTrackingUrl: opts.statusTrackingUrl,
      expiresInHours: 48,
    })
  );

  await sendEmail(
    opts.email,
    `Create Your Password — ${opts.courseTitle} | HUMI Hub`,
    html
  );
}

export async function sendEnrollmentConfirmationWithPayment(opts: {
  fullName: string;
  email: string;
  courseTitle: string;
  enrollmentId: string;
  submittedAt: string;
  paymentUrl: string;
  statusTrackingUrl: string;
}): Promise<void> {
  const html = await render(
    EnrollmentConfirmationWithPaymentEmail({
      fullName: opts.fullName,
      courseTitle: opts.courseTitle,
      enrollmentId: opts.enrollmentId,
      submittedAt: opts.submittedAt,
      paymentUrl: opts.paymentUrl,
      statusTrackingUrl: opts.statusTrackingUrl,
    })
  );

  await sendEmail(
    opts.email,
    `Application Received — Complete Payment | ${opts.courseTitle}`,
    html
  );
}

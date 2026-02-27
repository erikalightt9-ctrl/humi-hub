import { render } from "@react-email/components";
import { transporter } from "@/lib/mailer";
import { ConfirmationEmail } from "@/lib/email/templates/confirmation";
import { prisma } from "@/lib/prisma";
import type { Enrollment } from "@prisma/client";

export async function sendConfirmationEmail(enrollment: Enrollment): Promise<void> {
  // Fetch course title
  const course = await prisma.course.findUnique({
    where: { id: enrollment.courseId },
    select: { title: true },
  });

  const courseTitle = course?.title ?? "Selected Course";

  const submittedAt = enrollment.createdAt.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = await render(
    ConfirmationEmail({
      fullName: enrollment.fullName,
      courseTitle,
      enrollmentId: enrollment.id,
      submittedAt,
    })
  );

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: enrollment.email,
    subject: `Application Received — ${courseTitle} | VA Training Center`,
    html,
  });
}

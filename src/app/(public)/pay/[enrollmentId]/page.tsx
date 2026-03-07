import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogIn, ClipboardList } from "lucide-react";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import { findPaymentsByEnrollment } from "@/lib/repositories/payment.repository";
import { PaymentUploadForm } from "./PaymentUploadForm";
import { PayOnlineButton } from "./PayOnlineButton";

export const metadata: Metadata = { title: "Submit Payment | VA Training Center" };

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const enrollment = await findEnrollmentById(enrollmentId);

  // Allow access for PENDING, APPROVED, PAYMENT_SUBMITTED, and ENROLLED enrollments
  const allowedStatuses = ["PENDING", "APPROVED", "PAYMENT_SUBMITTED", "ENROLLED", "PAYMENT_VERIFIED"];
  if (!enrollment || !allowedStatuses.includes(enrollment.status)) {
    return notFound();
  }

  const payments = await findPaymentsByEnrollment(enrollmentId);
  const hasPendingPayment = payments.some((p) => p.status === "PENDING_PAYMENT");
  const isPaid = enrollment.paymentStatus === "PAID" || enrollment.status === "ENROLLED";

  const coursePrice = Number(enrollment.course.price);
  const referenceCode = enrollment.referenceCode;
  const gcashQrUrl = process.env.GCASH_QR_URL;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">VA Training Center</h1>
          <p className="text-gray-500 mt-1">Payment Submission</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {isPaid ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">&#9989;</div>
              <h2 className="text-xl font-bold text-green-700 mb-2">Payment Confirmed!</h2>
              <p className="text-gray-600">
                Your payment for <strong>{enrollment.course.title}</strong> has been verified.
                Check your email for login credentials.
              </p>
              <Link
                href="/student/login"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Go to Student Dashboard
              </Link>
              <Link
                href={`/enrollment-status/${enrollmentId}`}
                className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ClipboardList className="h-4 w-4" />
                Track My Enrollment Status
              </Link>
              <p className="text-xs text-gray-400 mt-3">
                Use the credentials sent to your email to log in.
              </p>
            </div>
          ) : hasPendingPayment ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">&#9203;</div>
              <h2 className="text-xl font-bold text-amber-700 mb-2">Payment Under Review</h2>
              <p className="text-gray-600">
                We received your payment proof for <strong>{enrollment.course.title}</strong>.
                We&apos;ll verify it within 24 hours and send you an email once confirmed.
              </p>
              {referenceCode && (
                <p className="text-sm text-gray-500 mt-3">
                  Reference Code: <span className="font-mono font-bold">{referenceCode}</span>
                </p>
              )}
              <Link
                href={`/enrollment-status/${enrollmentId}`}
                className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ClipboardList className="h-4 w-4" />
                Track My Enrollment Status
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {enrollment.course.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enrollee: {enrollment.fullName}
                </p>
              </div>

              {/* Reference Code */}
              {referenceCode && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-center mb-6">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide mb-1">
                    Your Payment Reference Code
                  </p>
                  <p className="text-2xl font-bold font-mono text-amber-900 tracking-wider">
                    {referenceCode}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Include this code in your payment reference/note
                  </p>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
                <p className="text-sm text-green-700 font-medium">Amount Due</p>
                <p className="text-3xl font-bold text-green-800">
                  PHP {coursePrice.toLocaleString()}
                </p>
              </div>

              {/* Payment methods */}
              <div className="space-y-4 mb-6">
                {process.env.GCASH_NUMBER && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">GCash</h3>
                    <p className="text-sm text-blue-700">
                      Number: <span className="font-mono font-bold">{process.env.GCASH_NUMBER}</span>
                    </p>
                    {process.env.GCASH_NAME && (
                      <p className="text-sm text-blue-700">
                        Name: <span className="font-bold">{process.env.GCASH_NAME}</span>
                      </p>
                    )}
                    {gcashQrUrl && (
                      <div className="mt-3 flex justify-center">
                        <Image
                          src={gcashQrUrl}
                          alt="GCash QR Code"
                          width={200}
                          height={200}
                          className="rounded-lg border border-blue-200"
                        />
                      </div>
                    )}
                  </div>
                )}

                {process.env.BANK_ACCOUNT_NUMBER && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">Bank Transfer</h3>
                    {process.env.BANK_NAME && (
                      <p className="text-sm text-purple-700">
                        Bank: <span className="font-bold">{process.env.BANK_NAME}</span>
                      </p>
                    )}
                    <p className="text-sm text-purple-700">
                      Account #: <span className="font-mono font-bold">{process.env.BANK_ACCOUNT_NUMBER}</span>
                    </p>
                    {process.env.BANK_ACCOUNT_NAME && (
                      <p className="text-sm text-purple-700">
                        Name: <span className="font-bold">{process.env.BANK_ACCOUNT_NAME}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Online Payment */}
              <PayOnlineButton enrollmentId={enrollmentId} />

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400 font-medium">or pay manually</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <PaymentUploadForm enrollmentId={enrollmentId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, LogIn } from "lucide-react";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Payment Successful | VA Training Center",
};

export default async function PaymentSuccessPage({
  params,
}: {
  readonly params: Promise<{ readonly enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const enrollment = await findEnrollmentById(enrollmentId);

  if (!enrollment) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-1">
            Thank you for your payment for
          </p>
          <p className="text-lg font-semibold text-gray-900 mb-4">
            {enrollment.course.title}
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-700">
              Your payment is being processed. You will receive an email with
              your login credentials shortly.
            </p>
          </div>

          <Link
            href="/student/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Go to Student Login
          </Link>

          <p className="text-xs text-gray-400 mt-4">
            Use the credentials sent to your email to log in.
          </p>
        </div>
      </div>
    </div>
  );
}

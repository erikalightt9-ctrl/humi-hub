import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, RotateCcw } from "lucide-react";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Payment Failed | VA Training Center",
};

export default async function PaymentFailedPage({
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
            <XCircle className="h-16 w-16 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>

          <p className="text-gray-600 mb-6">
            Your payment was cancelled or failed. You can try again or use the
            manual payment option.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/pay/${enrollmentId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            If you continue to experience issues, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

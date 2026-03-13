import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { PaymentStatusBadge } from "@/components/admin/PaymentStatusBadge";
import { PaymentActions } from "@/components/admin/PaymentActions";
import { PaymentProofModal } from "@/components/admin/PaymentProofModal";
import { listAllPayments } from "@/lib/repositories/payment.repository";
import type { PaymentStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Payments | HUMI Admin" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const currentPage = parseInt(page ?? "1", 10);
  const filterStatus = status as PaymentStatus | undefined;

  const { data: payments, total } = await listAllPayments({
    status: filterStatus,
    page: currentPage,
    limit: 20,
  });

  const statuses: { value: string; label: string }[] = [
    { value: "", label: "All" },
    { value: "PENDING_PAYMENT", label: "Pending" },
    { value: "PAID", label: "Paid" },
    { value: "FAILED", label: "Rejected" },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Verify payment proofs submitted by students. {total} payment(s) total.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {statuses.map((s) => (
          <Link
            key={s.value}
            href={s.value ? `/admin/payments?status=${s.value}` : "/admin/payments"}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              (status ?? "") === s.value
                ? "bg-blue-50 border-blue-200 text-blue-800 font-medium"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Course</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ref Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proof</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ref #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{payment.enrollment.fullName}</p>
                        <p className="text-xs text-gray-500">{payment.enrollment.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {payment.enrollment.course.title}
                    </td>
                    <td className="px-4 py-3">
                      {payment.enrollment.referenceCode ? (
                        <span className="font-mono text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          {payment.enrollment.referenceCode}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        payment.method === "GCASH"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {payment.method === "GCASH" ? "GCash" : "Bank Transfer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      PHP {Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {payment.proofFilePath ? (
                        <PaymentProofModal
                          proofFilePath={payment.proofFilePath}
                          proofFileName={payment.proofFileName}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No proof</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                      {payment.referenceNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {payment.createdAt.toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentActions paymentId={payment.id} status={payment.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

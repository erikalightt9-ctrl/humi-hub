import type { Metadata } from "next";
import { AdminSubscriptionsPage } from "@/components/admin/AdminSubscriptionsPage";
import { Crown } from "lucide-react";

export const metadata: Metadata = {
  title: "Subscriptions | Admin",
};

export default function SubscriptionsRoute() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-100 rounded-xl p-2.5">
          <Crown className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            AI Premium Subscriptions
          </h1>
          <p className="text-sm text-gray-500">
            Manage student subscription payments
          </p>
        </div>
      </div>

      <AdminSubscriptionsPage />
    </div>
  );
}

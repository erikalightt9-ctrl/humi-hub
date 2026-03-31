import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TestimonialManager } from "@/components/admin/TestimonialManager";
import { MessageSquareQuote } from "lucide-react";

export const metadata: Metadata = {
  title: "Testimonials | HUMI Hub Admin",
};

export default async function AdminTestimonialsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-50 rounded-lg p-2">
            <MessageSquareQuote className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
            <p className="text-sm text-gray-500">
              Manage graduate testimonials displayed on the public site
            </p>
          </div>
        </div>
      </div>

      {/* Manager */}
      <TestimonialManager />
    </div>
  );
}

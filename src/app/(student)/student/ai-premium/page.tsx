import type { Metadata } from "next";
import { AIPremiumPage } from "@/components/student/AIPremiumPage";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Premium | HUMI Student",
};

export default function AIPremiumRoute() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-2.5">
          <Sparkles className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Premium</h1>
          <p className="text-sm text-gray-500">
            Unlock AI-powered training tools
          </p>
        </div>
      </div>

      <AIPremiumPage />
    </div>
  );
}

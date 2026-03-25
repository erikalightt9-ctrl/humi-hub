import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalTabs } from "@/components/portal/PortalTabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login — HUMI Training Center",
  description:
    "Sign in as a student, trainer, or admin. New students can enroll using the button in the header.",
};

export default async function PortalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto text-center text-gray-500 py-20">
            Loading…
          </div>
        }
      >
        <PortalTabs />
      </Suspense>
    </div>
  );
}

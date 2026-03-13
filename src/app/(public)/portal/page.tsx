import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PortalTabs } from "@/components/portal/PortalTabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login & Enroll — HUMI Training Center",
  description:
    "Sign in as a student or admin, or enroll in a VA training course. All access in one place.",
};

export default async function PortalPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto text-center text-gray-500 py-20">
            Loading…
          </div>
        }
      >
        <PortalTabs courses={courses} />
      </Suspense>
    </div>
  );
}

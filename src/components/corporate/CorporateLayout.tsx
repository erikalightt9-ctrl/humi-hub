"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CorporateSidebar } from "./CorporateSidebar";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";

/* ------------------------------------------------------------------ */
/*  Layout Component                                                   */
/* ------------------------------------------------------------------ */

export function CorporateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string; organizationId?: string }
    | undefined;

  if (!user || user.role !== "corporate") {
    redirect("/corporate/login");
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <CorporateSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-end px-8 py-3 border-b border-gray-200 bg-white shrink-0">
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <ChatWidgetEnhanced role="corporate" currentPage={pathname} />
    </div>
  );
}

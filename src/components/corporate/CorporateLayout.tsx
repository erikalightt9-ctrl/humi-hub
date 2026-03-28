"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CorporateSidebar } from "./CorporateSidebar";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";

export function CorporateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-ds-bg">
        <Loader2 className="h-8 w-8 animate-spin text-ds-primary" />
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
    <div className="flex h-screen bg-ds-bg overflow-hidden">
      <CorporateSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end px-6 h-14 border-b border-ds-border bg-ds-surface shrink-0">
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>

      <ChatWidgetEnhanced role="corporate" currentPage={pathname} />
    </div>
  );
}

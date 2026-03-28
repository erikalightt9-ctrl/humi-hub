import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTheme } from "@/lib/services/tenant-theme.service";
import { ThemeEditor } from "@/components/theme-panel/ThemeEditor";

export const metadata: Metadata = {
  title: "Brand & Theme | HUMI Corporate",
};

export default async function CorporateThemePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const initialTheme = await getTheme(user.organizationId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Brand &amp; Theme</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Customize your platform&apos;s look and feel
        </p>
      </div>

      <ThemeEditor initialTheme={initialTheme} />
    </div>
  );
}

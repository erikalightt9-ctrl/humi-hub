import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import type { HumiAdminPermissions } from "@/types/next-auth";

export const metadata = { title: "Content Management | HUMI Admin" };

export default async function HumiAdminContentPage() {
  const session = await getServerSession(authOptions);
  const permissions = (session?.user as typeof session?.user & {
    humiAdminPermissions: HumiAdminPermissions | null;
  })?.humiAdminPermissions;

  if (!session?.user || !(session.user as typeof session.user & { isHumiAdmin?: boolean }).isHumiAdmin) {
    redirect("/humi-admin/login");
  }

  if (!permissions?.canManageContent) {
    redirect("/humi-admin");
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
          <p className="text-slate-500 text-sm">Manage platform-wide content, announcements, and knowledge base</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Content management tools</p>
        <p className="text-slate-400 text-sm mt-1">
          Platform-level announcements and knowledge base articles will appear here.
        </p>
      </div>
    </div>
  );
}

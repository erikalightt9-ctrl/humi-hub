import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Plus, CheckCircle2, XCircle, UserX } from "lucide-react";
import { getAllHumiAdmins } from "@/lib/repositories/humi-admin.repository";

export const metadata = { title: "HUMI Admins | Super Admin" };

const PERMISSION_LABELS: Record<string, string> = {
  canReviewTenants: "Review Tenants",
  canOnboardTenants: "Onboarding",
  canMonitorPlatform: "Monitoring",
  canProvideSupport: "Support",
  canManageContent: "Content",
};

export default async function HumiAdminsManagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isSuperAdmin) redirect("/superadmin/login");

  const admins = await getAllHumiAdmins();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">HUMI Admins</h1>
            <p className="text-slate-500 text-sm">Platform support staff — managed by Super Admin only</p>
          </div>
        </div>
        <Link
          href="/superadmin/humi-admins/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create HUMI Admin
        </Link>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-blue-700 text-sm font-medium">ℹ️ Role Distinction</p>
        <p className="text-blue-600 text-xs mt-1">
          HUMI Admins are internal platform support staff. They are completely separate from Tenant Admins
          who manage their own training platforms. HUMI Admins can only access platform-level tools based
          on their granted permissions.
        </p>
      </div>

      {admins.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No HUMI Admins yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first platform support staff member.</p>
          <Link
            href="/superadmin/humi-admins/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create HUMI Admin
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Permissions</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const enabledPerms = Object.entries(PERMISSION_LABELS).filter(
                  ([key]) => admin[key as keyof typeof admin] === true
                );
                return (
                  <tr key={admin.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {admin.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{admin.email}</td>
                    <td className="px-5 py-4">
                      {admin.isActive ? (
                        <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
                          <UserX className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {enabledPerms.length === 0 ? (
                        <span className="text-slate-400 text-xs">No permissions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {enabledPerms.map(([, label]) => (
                            <span key={label} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/superadmin/humi-admins/${admin.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

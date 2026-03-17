import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Users, BookOpen, UserCog, Crown } from "lucide-react";
import { getTenantById } from "@/lib/repositories/superadmin.repository";

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-700",
  STARTER: "bg-blue-100 text-blue-700",
  PROFESSIONAL: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-emerald-100 text-emerald-700",
};

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/tenants" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {tenant.name}
            {tenant.isDefault && (
              <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                <Crown className="h-3 w-3" />
                Default Tenant
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">{tenant.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Students", value: tenant._count.students, icon: Users },
          { label: "Courses", value: tenant._count.courses, icon: BookOpen },
          { label: "Managers", value: tenant._count.managers, icon: UserCog },
          { label: "Enrollments", value: tenant._count.enrollments, icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <Icon className="h-4 w-4 text-slate-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-slate-800 mb-2">Tenant Details</h2>
        {[
          { label: "Slug", value: tenant.slug },
          { label: "Subdomain", value: tenant.subdomain ?? "—" },
          { label: "Custom Domain", value: tenant.customDomain ?? "—" },
          { label: "Industry", value: tenant.industry ?? "—" },
          { label: "Max Seats", value: tenant.maxSeats },
          {
            label: "Plan",
            value: (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_BADGE[tenant.plan] ?? "bg-slate-100 text-slate-600"}`}>
                {tenant.plan}
              </span>
            ),
          },
          {
            label: "Status",
            value: (
              <span className={`text-xs font-medium ${tenant.isActive ? "text-emerald-600" : "text-red-500"}`}>
                {tenant.isActive ? "Active" : "Suspended"}
              </span>
            ),
          },
          {
            label: "Created",
            value: new Date(tenant.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm border-b border-slate-50 pb-2">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800 font-medium">{value}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 italic">
        Tenant content (courses, students, submissions) is not accessible from the Super Admin
        portal to protect data privacy.
      </p>
    </div>
  );
}

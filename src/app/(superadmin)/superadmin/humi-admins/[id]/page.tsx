"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shield, Save, ArrowLeft, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

type Permissions = {
  canReviewTenants: boolean;
  canOnboardTenants: boolean;
  canMonitorPlatform: boolean;
  canProvideSupport: boolean;
  canManageContent: boolean;
};

type FormData = {
  name: string;
  email: string;
  password: string;
  permissions: Permissions;
};

const DEFAULT_PERMISSIONS: Permissions = {
  canReviewTenants: false,
  canOnboardTenants: false,
  canMonitorPlatform: false,
  canProvideSupport: false,
  canManageContent: false,
};

const PERMISSION_DESCRIPTIONS: Record<keyof Permissions, { label: string; desc: string }> = {
  canReviewTenants:   { label: "Review Tenants",      desc: "View and review tenant platform applications" },
  canOnboardTenants:  { label: "Tenant Onboarding",   desc: "Assist in onboarding new tenant platforms" },
  canMonitorPlatform: { label: "Platform Monitoring", desc: "View aggregate platform analytics and health metrics" },
  canProvideSupport:  { label: "Support Access",      desc: "Access and respond to platform support tickets" },
  canManageContent:   { label: "Content Management",  desc: "Manage global platform content and knowledge base" },
};

export default function HumiAdminFormPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    permissions: { ...DEFAULT_PERMISSIONS },
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/superadmin/humi-admins/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const a = data.data;
            setForm({
              name: a.name,
              email: a.email,
              password: "",
              permissions: {
                canReviewTenants: a.canReviewTenants,
                canOnboardTenants: a.canOnboardTenants,
                canMonitorPlatform: a.canMonitorPlatform,
                canProvideSupport: a.canProvideSupport,
                canManageContent: a.canManageContent,
              },
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = isNew
      ? { name: form.name, email: form.email, password: form.password, permissions: form.permissions }
      : { name: form.name, ...form.permissions, ...(form.password ? { resetPassword: form.password } : {}) };

    const res = await fetch(
      isNew ? "/api/superadmin/humi-admins" : `/api/superadmin/humi-admins/${id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error ?? "Failed to save");
      return;
    }

    setSuccess(isNew ? "HUMI Admin created successfully!" : "Changes saved successfully!");
    if (isNew) {
      setTimeout(() => router.push("/superadmin/humi-admins"), 1500);
    }
  }

  function togglePermission(key: keyof Permissions) {
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/superadmin/humi-admins" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Shield className="w-5 h-5 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? "Create HUMI Admin" : "Edit HUMI Admin"}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Maria Santos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required={isNew}
              disabled={!isNew}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="staff@humihub.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isNew ? "Password" : "Reset Password (leave blank to keep current)"}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required={isNew}
              minLength={8}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-400 mt-1">
              {isNew
                ? "User will be prompted to change password on first login."
                : "Setting a new password will force the user to change it on next login."}
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Feature Permissions</h2>
          <p className="text-xs text-slate-400 mb-5">
            All permissions are disabled by default (principle of least privilege). Enable only what is needed.
          </p>

          <div className="space-y-4">
            {(Object.keys(PERMISSION_DESCRIPTIONS) as (keyof Permissions)[]).map((key) => {
              const { label, desc } = PERMISSION_DESCRIPTIONS[key];
              const enabled = form.permissions[key];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                    enabled ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50"
                  }`}
                  onClick={() => togglePermission(key)}
                >
                  <div>
                    <p className={`text-sm font-medium ${enabled ? "text-blue-800" : "text-slate-600"}`}>{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  {enabled ? (
                    <ToggleRight className="w-8 h-8 text-blue-600 shrink-0" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Create HUMI Admin" : "Save Changes"}
          </button>
          <Link
            href="/superadmin/humi-admins"
            className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

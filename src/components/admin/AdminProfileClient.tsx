"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { User, Lock, Bell, CheckCircle2, Eye, EyeOff } from "lucide-react";

type Tab = "profile" | "password" | "notifications";

export function AdminProfileClient() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile Info", icon: User },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "notifications", label: "Notification Settings", icon: Bell },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information and preferences</p>
      </div>

      {/* Avatar + name banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
          {(session?.user?.name ?? "A")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{session?.user?.name ?? "Admin"}</p>
          <p className="text-blue-200 text-sm">{session?.user?.email ?? ""}</p>
          <span className="mt-1 inline-block text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
            Administrator
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "profile" && <ProfileInfoPanel session={session} />}
      {activeTab === "password" && <ChangePasswordPanel />}
      {activeTab === "notifications" && <NotificationSettingsPanel />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Profile Info
// ---------------------------------------------------------------------------

function ProfileInfoPanel({ session }: { session: ReturnType<typeof useSession>["data"] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="font-semibold text-gray-800">Account Information</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
          <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {session?.user?.name ?? "—"}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
          <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {session?.user?.email ?? "—"}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
          <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            Administrator
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Contact your system administrator to update your name or email.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Change Password
// ---------------------------------------------------------------------------

function ChangePasswordPanel() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setErrorMsg("New passwords do not match.");
      setStatus("error");
      return;
    }
    if (form.next.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update password");
      }
      setStatus("success");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
    }
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "current", label: "Current Password" },
    { key: "next", label: "New Password" },
    { key: "confirm", label: "Confirm New Password" },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="font-semibold text-gray-800">Change Password</h2>

      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-4 w-4" />
          Password updated successfully.
        </div>
      )}
      {status === "error" && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <div className="relative">
              <input
                type={show[key] ? "text" : "password"}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Panel: Notification Settings
// ---------------------------------------------------------------------------

const NOTIFICATION_PREFS = [
  { key: "enrollments", label: "New Enrollment Applications", description: "Get notified when a new enrollment is submitted" },
  { key: "payments", label: "Payment Submissions", description: "Get notified when a student submits payment proof" },
  { key: "support", label: "Support Ticket Updates", description: "Get notified on new or updated support tickets" },
  { key: "certificates", label: "Certificate Issuances", description: "Get notified when a certificate is generated" },
] as const;

function NotificationSettingsPanel() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    enrollments: true,
    payments: true,
    support: false,
    certificates: false,
  });
  const [saved, setSaved] = useState(false);

  function toggle(key: string) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="font-semibold text-gray-800">Notification Preferences</h2>
      <p className="text-sm text-gray-500">Choose which in-app notifications you receive.</p>

      <div className="divide-y divide-gray-100">
        {NOTIFICATION_PREFS.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                prefs[key] ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  prefs[key] ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-4 w-4" />
          Preferences saved.
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Save Preferences
      </button>
    </div>
  );
}

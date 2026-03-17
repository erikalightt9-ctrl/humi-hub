import { Settings } from "lucide-react";
import Link from "next/link";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Global settings that apply to the entire platform
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Platform Configuration</h2>
        </div>
        <p className="text-sm text-slate-500">
          Global platform settings (SMTP, security policies, default branding) are managed from the
          HUMI tenant admin portal.
        </p>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          Open HUMI Admin Settings →
        </Link>
      </div>
    </div>
  );
}

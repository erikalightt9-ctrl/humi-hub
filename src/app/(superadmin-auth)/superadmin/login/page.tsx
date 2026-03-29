"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { Shield, Loader2 } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("admin", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // Verify this account actually has super admin privileges
    const meRes = await fetch("/api/auth/me");
    const me = await meRes.json();

    if (!me?.data?.isSuperAdmin) {
      // Kick them out — regular admins don't belong here
      await signOut({ redirect: false });
      setError("This account does not have Super Admin access. Use /admin/login instead.");
      setLoading(false);
      return;
    }

    router.push("/superadmin");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-8 flex flex-col items-center gap-3 bg-[#1E3A8A]">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center ring-2 ring-white/30">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg leading-tight">Super Admin</p>
            <p className="text-white/60 text-xs mt-1 uppercase tracking-widest">Platform Control</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@example.com"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1e40af] transition-colors disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in to Super Admin
          </button>

          <p className="text-center text-xs text-slate-500 pt-1">
            Tenant Admin Portal?{" "}
            <a href="/admin/login" className="text-blue-700 hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </form>
      </div>

      <p className="mt-6 text-slate-500 text-xs">
        Restricted access — authorised personnel only
      </p>
    </div>
  );
}

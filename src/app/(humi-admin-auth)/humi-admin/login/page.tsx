"use client";

import { Suspense, useState, useCallback } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { AccountLockedBanner } from "@/components/auth/AccountLockedBanner";

function HumiAdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only allow relative paths to prevent open redirect attacks
  const rawCallback = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/humi-admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState<string | null>(null);

  const handleUnlocked = useCallback(() => {
    setLockUntil(null);
    setError(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLockUntil(null);

    try {
      // Pre-flight check for lock status
      const checkRes = await fetch("/api/auth/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "humi-admin", email: email.trim().toLowerCase() }),
      });
      const checkData = (await checkRes.json()) as {
        ok: boolean | null;
        error?: string;
        lockUntil?: string;
      };

      if (checkData.ok === false) {
        if (checkData.lockUntil) {
          setLockUntil(checkData.lockUntil);
        } else {
          setError(checkData.error ?? "Access denied.");
        }
        setLoading(false);
        return;
      }

      const result = await signIn("humi-admin", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        if (result?.error?.startsWith("LOCKED:")) {
          setLockUntil(result.error.slice("LOCKED:".length));
        } else {
          setError(result?.error ?? "Invalid credentials. Please try again.");
        }
        return;
      }

      // Verify identity — must be a HUMI Admin
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (!meData?.data?.isHumiAdmin) {
        await signOut({ redirect: false });
        setError("Access denied. This portal is for HUMI Admin staff only.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isLocked = lockUntil !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">HUMI Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Platform Support Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">HUMI Admin Sign In</h2>
          <p className="text-slate-500 text-sm mb-6">
            Internal staff access only. Contact Super Admin if you need an account.
          </p>

          {error && !isLocked && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={isLocked}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="admin@humihub.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLocked}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLocked && (
              <AccountLockedBanner
                lockUntil={lockUntil!}
                email={email}
                provider="humi-admin"
                onUnlocked={handleUnlocked}
              />
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Unauthorized access is prohibited and monitored.
        </p>
      </div>
    </div>
  );
}

export default function HumiAdminLoginPage() {
  return (
    <Suspense>
      <HumiAdminLoginForm />
    </Suspense>
  );
}

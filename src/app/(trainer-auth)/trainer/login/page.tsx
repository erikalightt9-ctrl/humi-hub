"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserCog, Loader2 } from "lucide-react";
import { AccountLockedBanner } from "@/components/auth/AccountLockedBanner";

export default function TrainerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState<string | null>(null);

  const handleUnlocked = useCallback(() => {
    setLockUntil(null);
    setError(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLockUntil(null);
    setLoading(true);

    try {
      // Pre-flight check for lock status before bcrypt
      const checkRes = await fetch("/api/auth/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "trainer", email }),
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
          setError(checkData.error ?? "Access denied. Please contact admin.");
        }
        setLoading(false);
        return;
      }

      const result = await signIn("trainer", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        if (result.error.startsWith("LOCKED:")) {
          setLockUntil(result.error.slice("LOCKED:".length));
          return;
        }
        setError("Invalid email or password. Please try again.");
        return;
      }

      router.push("/trainer");
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  const isLocked = lockUntil !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-8 flex flex-col items-center gap-3 bg-[#1E3A8A]">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
            <UserCog className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg leading-tight">HUMI Hub</p>
            <p className="text-white/70 text-sm mt-0.5">Trainer Portal</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && !isLocked && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
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
              placeholder="trainer@example.com"
              disabled={isLocked}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
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
              disabled={isLocked}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {isLocked && (
            <AccountLockedBanner
              lockUntil={lockUntil!}
              email={email}
              provider="trainer"
              onUnlocked={handleUnlocked}
            />
          )}

          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1e40af] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in to Trainer Portal
          </button>

          <p className="text-center text-xs text-slate-500">
            Students & Corporate?{" "}
            <a href="/portal" className="text-blue-700 hover:underline font-medium">
              Use the portal
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Building2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountLockedBanner } from "@/components/auth/AccountLockedBanner";

export default function CorporateLoginPage() {
  const router = useRouter();
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [lockUntil, setLockUntil]       = useState<string | null>(null);

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
        body: JSON.stringify({ provider: "corporate", email: email.trim().toLowerCase() }),
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

      const result = await signIn("corporate", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.startsWith("LOCKED:")) {
          setLockUntil(result.error.slice("LOCKED:".length));
        } else {
          setError("Invalid email or password. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Check session to route correctly:
      // - isTenantAdmin → admin workspace (/admin)
      // - regular corporate manager → employee portal (/corporate/dashboard)
      const session = await getSession();
      const user    = session?.user as {
        isTenantAdmin?:    boolean;
        isTenantUser?:     boolean;
        mustChangePassword?: boolean;
      } | undefined;

      if (user?.mustChangePassword) {
        router.push("/corporate/change-password");
      } else if (user?.isTenantAdmin || user?.isTenantUser) {
        router.push("/admin");
      } else {
        router.push("/corporate/dashboard");
      }

      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isLocked = lockUntil !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-2xl mb-4">
            <GraduationCap className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">HUMI Hub</h1>
          <p className="text-sm text-blue-300 mt-1">Tenant Portal</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sign In</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !isLocked && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                autoFocus
                disabled={loading || isLocked}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading || isLocked}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isLocked && (
              <AccountLockedBanner
                lockUntil={lockUntil!}
                email={email}
                provider="corporate"
                onUnlocked={handleUnlocked}
              />
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading || isLocked}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in…</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-6">
            Contact your admin if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Slug derivation helper
// ---------------------------------------------------------------------------

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StartTrialPage() {
  const router = useRouter();

  const [orgName, setOrgName]         = useState("");
  const [subdomain, setSubdomain]     = useState("");
  const [industry, setIndustry]       = useState("");
  const [adminName, setAdminName]     = useState("");
  const [adminEmail, setAdminEmail]   = useState("");
  const [password, setPassword]       = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [createdOrg, setCreatedOrg]   = useState<string | null>(null);

  function handleOrgNameChange(val: string) {
    setOrgName(val);
    setSubdomain(toSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/signup/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgName.trim(),
          subdomain: subdomain.trim(),
          industry: industry.trim() || undefined,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword: password,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setCreatedOrg(json.data.orgName);
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You're all set!</h1>
          <p className="text-gray-500">
            <strong>{createdOrg}</strong> is on the <strong>Free Trial</strong> plan.
            Check your email for login credentials.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 text-left space-y-1">
            <p className="font-semibold mb-2">Next steps:</p>
            <p>✅ Check your email for login credentials</p>
            <p>✅ Log in to your portal and change your password</p>
            <p>✅ Invite team members and assign courses</p>
          </div>
          <Button className="w-full" onClick={() => router.push("/portal")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">HUMI Hub</span>
        </div>
        <Link href="/portal" className="text-sm text-blue-600 hover:underline">
          Already have an account? Log in
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg overflow-hidden">
          {/* Hero strip */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-7 text-white">
            <h1 className="text-2xl font-bold">Start your free trial</h1>
            <p className="text-blue-100 mt-1 text-sm">
              10 seats · 14-day trial · No credit card required
            </p>
            <div className="mt-4 flex gap-4 text-xs text-blue-200">
              <span>✓ Courses &amp; enrollments</span>
              <span>✓ Progress tracking</span>
              <span>✓ Analytics</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Org section */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <Building2 className="h-3.5 w-3.5" />
                Organization
              </div>

              <div>
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  placeholder="Acme Corp"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="subdomain">
                  Subdomain *
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    ({subdomain || "your-org"}.humihub.com)
                  </span>
                </Label>
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(toSlug(e.target.value))}
                  placeholder="acme-corp"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Healthcare, Technology"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Admin account section */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100 pt-4">
                Your Admin Account
              </div>

              <div>
                <Label htmlFor="adminName">Full Name *</Label>
                <Input
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Jane Smith"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <Label htmlFor="adminEmail">Work Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="jane@acme.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    minLength={8}
                    maxLength={128}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Free Trial
            </Button>

            <p className="text-center text-xs text-gray-400">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline">Terms</Link> and{" "}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

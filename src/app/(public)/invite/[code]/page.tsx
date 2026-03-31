"use client";

/**
 * /invite/[code]
 *
 * Tenant invite landing page.
 * URL: tenantA.yourplatform.com/invite/abc123
 *
 * Flow:
 *  1. Validate invite code via GET /api/invite/[code]
 *  2. Show tenant branding + registration form
 *  3. On submit → POST /api/enrollments (student) or redirect to corporate signup
 *  4. Redeem invite via POST /api/invite/[code]
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface InviteTenant {
  name: string;
  slug: string;
  subdomain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  tagline: string | null;
}

interface InviteData {
  code: string;
  role: string;
  email: string | null;
  expiresAt: string;
  tenant: InviteTenant;
}

type Status = "loading" | "valid" | "invalid" | "expired" | "used";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!code) return;
    fetch(`/api/invite/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInvite(data.data);
          setStatus("valid");
        } else {
          const msg: string = data.error ?? "";
          if (msg.includes("expired")) setStatus("expired");
          else if (msg.includes("already been used")) setStatus("used");
          else setStatus("invalid");
          setErrorMsg(msg);
        }
      })
      .catch(() => { setStatus("invalid"); setErrorMsg("Could not validate invite."); });
  }, [code]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status !== "valid" || !invite) {
    const icon =
      status === "expired" ? "⏰" :
      status === "used"    ? "✅" : "❌";

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{icon}</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {status === "expired" ? "Invite Expired" :
             status === "used"    ? "Invite Already Used" : "Invalid Invite"}
          </h1>
          <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const { tenant } = invite;
  const primary = tenant.primaryColor;

  // Redirect to tenant login with invite code in params
  // Students register through the enrollment flow; corporate through the tenant login
  function handleAccept() {
    const loginUrl = `/tenant-login?slug=${tenant.subdomain ?? tenant.slug}&invite=${code}`;
    router.push(loginUrl);
  }

  function handleEnroll() {
    const enrollUrl = `/enroll?invite=${code}`;
    router.push(enrollUrl);
  }

  const expiresDate = new Date(invite.expiresAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: `linear-gradient(135deg, ${primary}18 0%, #f8fafc 100%)` }}
    >
      {/* Tenant branding */}
      <div className="text-center mb-8">
        {tenant.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-auto mx-auto mb-4 object-contain" />
        ) : (
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: primary }}
          >
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
        {tenant.tagline && (
          <p className="text-slate-500 text-sm mt-1">{tenant.tagline}</p>
        )}
      </div>

      {/* Invite card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-6"
          style={{ backgroundColor: `${primary}15`, border: `1px solid ${primary}30` }}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: primary }} />
          <div>
            <p className="text-sm font-semibold text-slate-900">You&apos;ve been invited!</p>
            <p className="text-xs text-slate-500">
              Role: <span className="font-medium capitalize">{invite.role}</span>
              {invite.email ? ` · For: ${invite.email}` : ""}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Join {tenant.name}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          You&apos;ve been invited to join as a <strong>{invite.role}</strong>.
          This invite expires on <strong>{expiresDate}</strong>.
        </p>

        <div className="space-y-3">
          {invite.role === "student" ? (
            <button
              onClick={handleEnroll}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              <GraduationCap className="h-4 w-4" />
              Start Enrollment
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleAccept}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              Accept Invite & Sign In
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <p className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <button
              onClick={handleAccept}
              className="font-medium underline"
              style={{ color: primary }}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Powered by <span className="font-semibold text-slate-500">Humi Hub</span>
      </p>
    </div>
  );
}

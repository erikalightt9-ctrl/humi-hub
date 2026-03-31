"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type UserType = "student" | "admin" | "trainer";

const LABEL_MAP: Record<UserType, string> = {
  student: "Student",
  admin: "Admin",
  trainer: "Trainer",
};

const PORTAL_TAB_MAP: Record<UserType, string> = {
  student: "student",
  admin: "admin",
  trainer: "trainer",
};

function isValidType(value: string | null): value is UserType {
  return value === "student" || value === "admin" || value === "trainer";
}

/* ------------------------------------------------------------------ */
/*  Email Recovery Panel (mode=email)                                  */
/* ------------------------------------------------------------------ */

function EmailRecoveryPanel({ userType }: { readonly userType: UserType }) {
  return (
    <div className="text-center space-y-5">
      <div className="flex justify-center">
        <div className="rounded-full bg-blue-900/40 p-4">
          <MessageCircle className="h-10 w-10 text-blue-400" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Recover Your Email Address
        </h2>
        <p className="text-sm text-gray-500">
          For your security, email addresses can only be recovered by our
          support team.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 leading-relaxed text-left">
        <p className="font-medium mb-1">To recover your email, please:</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-400">
          <li>Contact us at <span className="font-medium">info@humihub.com</span></li>
          <li>Include your full name and the course you enrolled in</li>
          <li>Our team will verify your identity and send your email</li>
        </ol>
      </div>

      <div className="space-y-3 pt-1">
        <Button asChild className="w-full bg-blue-700 hover:bg-blue-800">
          <a href="mailto:info@humihub.com">
            <Mail className="mr-2 h-4 w-4" />
            Email Support
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/portal?tab=${PORTAL_TAB_MAP[userType]}`}>
            Back to Login
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Forgot Password Panel (main form)                                  */
/* ------------------------------------------------------------------ */

function ForgotPasswordPanel({ userType }: { readonly userType: UserType }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Check Your Email
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            If <span className="font-medium text-gray-700">{email}</span> is
            registered, you will receive a password reset link shortly. Check
            your spam folder if you don&apos;t see it.
          </p>
        </div>
        <div className="space-y-3 pt-1">
          <Button asChild className="w-full bg-blue-700 hover:bg-blue-800">
            <Link href={`/portal?tab=${PORTAL_TAB_MAP[userType]}`}>
              Back to Login
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
            }}
            className="block w-full text-sm text-blue-400 hover:underline text-center"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Reset Your Password
        </h2>
        <p className="text-sm text-gray-500">
          Enter your {LABEL_MAP[userType].toLowerCase()} email and we&apos;ll send
          you a reset link.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="forgot-email">Email Address</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send Reset Link
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <div className="pt-1 border-t border-gray-100">
        <Link
          href={`/portal?tab=${PORTAL_TAB_MAP[userType]}`}
          className="block text-sm text-blue-400 hover:underline text-center"
        >
          Back to {LABEL_MAP[userType]} Login
        </Link>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Export                                                         */
/* ------------------------------------------------------------------ */

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();

  const typeParam = searchParams.get("type");
  const mode = searchParams.get("mode");
  const userType: UserType = isValidType(typeParam) ? typeParam : "student";
  const isEmailMode = mode === "email";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-blue-800 rounded-xl p-3">
              <GraduationCap className="h-8 w-8 text-blue-300" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            HUMI Hub
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEmailMode ? "Account Recovery" : "Password Reset"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {isEmailMode ? (
            <EmailRecoveryPanel userType={userType} />
          ) : (
            <ForgotPasswordPanel userType={userType} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Need help?{" "}
          <Link href="/contact" className="text-blue-400 hover:underline">
            Contact us
          </Link>{" "}
          at info@humihub.com
        </p>
      </div>
    </div>
  );
}

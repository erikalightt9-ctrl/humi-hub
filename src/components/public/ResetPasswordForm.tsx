"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type UserType = "student" | "admin" | "trainer" | "manager";

const PORTAL_TAB_MAP: Record<string, string> = {
  student: "student",
  admin: "admin",
  trainer: "trainer",
  manager: "admin",
};

function isValidType(value: string | null): value is UserType {
  return (
    value === "student" ||
    value === "admin" ||
    value === "trainer" ||
    value === "manager"
  );
}

/* ------------------------------------------------------------------ */
/*  Password Input with toggle                                          */
/* ------------------------------------------------------------------ */

interface PasswordInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly autoComplete?: string;
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={8}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Invalid / Missing Token State                                       */
/* ------------------------------------------------------------------ */

function InvalidTokenPanel({ userType }: { readonly userType: string }) {
  const tab = PORTAL_TAB_MAP[userType] ?? "student";
  return (
    <div className="text-center space-y-5">
      <div className="flex justify-center">
        <div className="rounded-full bg-red-900/40 p-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Invalid Reset Link
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          This password reset link is missing, invalid, or has already been
          used. Please request a new one.
        </p>
      </div>
      <div className="space-y-3 pt-1">
        <Button asChild className="w-full bg-blue-700 hover:bg-blue-800">
          <Link href={`/forgot-password?type=${userType}`}>
            Request New Link
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/portal?tab=${tab}`}>Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Reset Form                                                     */
/* ------------------------------------------------------------------ */

interface ResetFormProps {
  readonly token: string;
  readonly userType: UserType;
}

function ResetForm({ token, userType }: ResetFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const tab = PORTAL_TAB_MAP[userType] ?? "student";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password, userType }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/portal?tab=${tab}`);
      }, 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Password Updated!
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your password has been reset successfully. You will be redirected to
            the login page in a moment.
          </p>
        </div>
        <Button asChild className="w-full bg-blue-700 hover:bg-blue-800">
          <Link href={`/portal?tab=${tab}`}>
            Go to Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Set New Password
        </h2>
        <p className="text-sm text-gray-500">
          Choose a strong password — at least 8 characters.
        </p>
      </div>

      <PasswordInput
        id="new-password"
        label="New Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />

      <PasswordInput
        id="confirm-password"
        label="Confirm New Password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

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
            Updating…
          </>
        ) : (
          <>
            Reset Password
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <div className="pt-1 border-t border-gray-100">
        <Link
          href={`/portal?tab=${tab}`}
          className="block text-sm text-blue-400 hover:underline text-center"
        >
          Cancel — Back to Login
        </Link>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Export                                                         */
/* ------------------------------------------------------------------ */

export function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const typeParam = searchParams.get("type");
  const userType: UserType = isValidType(typeParam) ? typeParam : "student";

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
          <p className="text-gray-500 text-sm mt-1">Password Reset</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {!token ? (
            <InvalidTokenPanel userType={userType} />
          ) : (
            <ResetForm token={token} userType={userType} />
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

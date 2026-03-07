"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccountActivationFormProps {
  readonly token: string;
  readonly name: string;
  readonly courseTitle: string;
}

interface PasswordValidation {
  readonly minLength: boolean;
  readonly hasUppercase: boolean;
  readonly hasLowercase: boolean;
  readonly hasNumber: boolean;
  readonly passwordsMatch: boolean;
}

type PasswordStrength = "empty" | "weak" | "fair" | "good" | "strong";

interface StrengthConfig {
  readonly label: string;
  readonly width: string;
  readonly color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PASSWORD_MIN_LENGTH = 8;

const STRENGTH_CONFIGS: Record<PasswordStrength, StrengthConfig> = {
  empty: { label: "", width: "w-0", color: "bg-gray-200" },
  weak: { label: "Weak", width: "w-1/4", color: "bg-red-500" },
  fair: { label: "Fair", width: "w-2/4", color: "bg-yellow-500" },
  good: { label: "Good", width: "w-3/4", color: "bg-blue-500" },
  strong: { label: "Strong", width: "w-full", color: "bg-green-500" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validatePassword(
  password: string,
  confirmPassword: string,
): PasswordValidation {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    passwordsMatch: password.length > 0 && password === confirmPassword,
  };
}

function calculateStrength(validation: PasswordValidation): PasswordStrength {
  const { minLength, hasUppercase, hasLowercase, hasNumber } = validation;

  if (!minLength) return "empty";

  const passedChecks = [hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;

  if (passedChecks === 0) return "weak";
  if (passedChecks === 1) return "fair";
  if (passedChecks === 2) return "good";
  return "strong";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ValidationIndicator({
  passed,
  label,
}: {
  readonly passed: boolean;
  readonly label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-300 shrink-0" />
      )}
      <span className={passed ? "text-green-700" : "text-gray-500"}>
        {label}
      </span>
    </div>
  );
}

function PasswordStrengthBar({
  strength,
}: {
  readonly strength: PasswordStrength;
}) {
  const config = STRENGTH_CONFIGS[strength];

  return (
    <div className="space-y-1">
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${config.width} ${config.color}`}
        />
      </div>
      {config.label && (
        <p className={`text-xs text-right font-medium ${
          strength === "weak" ? "text-red-500" :
          strength === "fair" ? "text-yellow-600" :
          strength === "good" ? "text-blue-600" :
          "text-green-600"
        }`}>
          {config.label}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AccountActivationForm({
  token,
  name,
  courseTitle,
}: AccountActivationFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const validation = useMemo(
    () => validatePassword(password, confirmPassword),
    [password, confirmPassword],
  );

  const strength = useMemo(
    () => calculateStrength(validation),
    [validation],
  );

  const isFormValid = useMemo(
    () =>
      validation.minLength &&
      validation.hasUppercase &&
      validation.hasLowercase &&
      validation.hasNumber &&
      validation.passwordsMatch,
    [validation],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!isFormValid) return;

      setStatus("submitting");
      setErrorMsg("");

      try {
        const res = await fetch("/api/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password, confirmPassword }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            body?.error ?? "Failed to activate account. Please try again.",
          );
        }

        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    },
    [token, password, confirmPassword, isFormValid],
  );

  if (status === "success") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <ShieldCheck className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Account Activated!
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your account has been successfully created. You can now log in to
            access your course materials.
          </p>
          <div className="pt-2">
            <Button asChild className="w-full bg-blue-700 hover:bg-blue-800">
              <Link href="/portal?tab=student">Go to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome, {name}!
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Create your password to access{" "}
          <span className="font-medium text-blue-700">{courseTitle}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password field */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Strength bar */}
        {password.length > 0 && <PasswordStrengthBar strength={strength} />}

        {/* Confirm password field */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Validation checklist */}
        {(password.length > 0 || confirmPassword.length > 0) && (
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Password Requirements
            </p>
            <ValidationIndicator
              passed={validation.minLength}
              label="At least 8 characters"
            />
            <ValidationIndicator
              passed={validation.hasUppercase}
              label="Contains uppercase letter"
            />
            <ValidationIndicator
              passed={validation.hasLowercase}
              label="Contains lowercase letter"
            />
            <ValidationIndicator
              passed={validation.hasNumber}
              label="Contains a number"
            />
            <ValidationIndicator
              passed={validation.passwordsMatch}
              label="Passwords match"
            />
          </div>
        )}

        {/* Error message */}
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <XCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!isFormValid || status === "submitting"}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TrainerAccessPanelProps {
  readonly trainerId: string;
  readonly trainerName: string;
  readonly trainerEmail: string;
  readonly accessGranted: boolean;
  readonly isActive: boolean;
  readonly onUpdate: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TrainerAccessPanel({
  trainerId,
  trainerName,
  trainerEmail,
  accessGranted,
  isActive,
  onUpdate,
}: TrainerAccessPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAction(action: "grant" | "revoke" | "reset-password") {
    setLoading(true);
    setError(null);
    setTempPassword(null);

    try {
      const res = await fetch(`/api/admin/trainers/${trainerId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Something went wrong");
        return;
      }

      if (json.data?.temporaryPassword) {
        setTempPassword(json.data.temporaryPassword);
      }

      onUpdate();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Portal Access
      </h4>

      {/* Access status */}
      <div className="flex items-center gap-2">
        {accessGranted ? (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            Has Portal Access
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium">
            <ShieldOff className="h-3.5 w-3.5" />
            No Portal Access
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Temporary password display */}
      {tempPassword && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-800 mb-1">
            Temporary Login Credentials
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Name:</span> {trainerName}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Email:</span> {trainerEmail}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Password:</span>{" "}
                <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-sm font-mono">
                  {tempPassword}
                </code>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Share these credentials with the trainer. They can change their
            password after first login.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {!accessGranted && isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("grant")}
            disabled={loading}
            className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Grant Access
          </Button>
        )}

        {accessGranted && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("revoke")}
              disabled={loading}
              className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldOff className="h-3.5 w-3.5" />
              )}
              Revoke Access
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("reset-password")}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <KeyRound className="h-3.5 w-3.5" />
              )}
              Reset Password
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, Search, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CertificateData {
  readonly studentName: string;
  readonly courseTitle: string;
  readonly issuedAt: string;
  readonly certNumber: string;
}

type VerifyState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "found"; readonly data: CertificateData }
  | { readonly status: "not-found" }
  | { readonly status: "error"; readonly message: string };

export function VerifyForm() {
  const [certNumber, setCertNumber] = useState("");
  const [state, setState] = useState<VerifyState>({ status: "idle" });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = certNumber.trim();
      if (!trimmed) return;

      setState({ status: "loading" });

      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(trimmed)}`);
        const json = await res.json();

        if (res.ok && json.success) {
          setState({ status: "found", data: json.data });
        } else if (res.status === 404) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "error", message: json.error ?? "Something went wrong" });
        }
      } catch {
        setState({ status: "error", message: "Network error. Please try again." });
      }
    },
    [certNumber]
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="max-w-xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          type="text"
          placeholder="Enter certificate number (e.g. cm9...)"
          value={certNumber}
          onChange={(e) => setCertNumber(e.target.value)}
          className="flex-1 h-12 text-base"
          disabled={state.status === "loading"}
        />
        <Button
          type="submit"
          size="lg"
          className="bg-blue-700 hover:bg-blue-800 h-12 px-6"
          disabled={!certNumber.trim() || state.status === "loading"}
        >
          {state.status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Verify</span>
        </Button>
      </form>

      {/* Results */}
      <div className="mt-8">
        {state.status === "found" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-800">Certificate Verified</h3>
                <p className="text-sm text-green-600">This is an authentic HUMI Hub certificate</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 border border-green-100 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Graduate Name</p>
                <p className="text-lg font-semibold text-gray-900">{state.data.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Program Completed</p>
                <p className="text-base font-medium text-gray-800">{state.data.courseTitle}</p>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Date Issued</p>
                  <p className="text-sm text-gray-700">{formatDate(state.data.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Certificate No.</p>
                  <p className="text-sm text-gray-700 font-mono">{state.data.certNumber}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.status === "not-found" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-900/40 rounded-full p-2">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-red-800">Certificate Not Found</h3>
                <p className="text-sm text-red-400">
                  No certificate matches this number. Please double-check and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <ShieldCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-800">Verification Error</h3>
                <p className="text-sm text-yellow-600">{state.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

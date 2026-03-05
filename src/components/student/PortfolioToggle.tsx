"use client";

import { useState, useCallback } from "react";
import { Globe, Lock, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface PortfolioToggleProps {
  readonly studentId: string;
  readonly initialIsPublic: boolean;
}

export function PortfolioToggle({ studentId, initialIsPublic }: PortfolioToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portfolio/${studentId}`
    : `/portfolio/${studentId}`;

  const handleToggle = useCallback(async (checked: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/student/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: checked }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setIsPublic(json.data.isPublic);
      } else {
        setError(json.error ?? "Failed to update visibility");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isPublic ? (
            <div className="bg-green-100 rounded-lg p-2">
              <Globe className="h-5 w-5 text-green-600" />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-2">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              Portfolio is {isPublic ? "Public" : "Private"}
            </h3>
            <p className="text-xs text-gray-500">
              {isPublic
                ? "Anyone with the link can view your portfolio"
                : "Only you can see your portfolio"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <Switch
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      )}

      {isPublic && (
        <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Megaphone, Loader2, CheckCircle, Users, GraduationCap, Briefcase, Globe } from "lucide-react";

type TargetRole = "TRAINER" | "STUDENT" | "CORPORATE_MANAGER" | "ALL";

interface RoleOption {
  readonly value: TargetRole;
  readonly label: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly color: string;
}

const ROLE_OPTIONS: ReadonlyArray<RoleOption> = [
  {
    value: "STUDENT",
    label: "All Students",
    description: "All active enrolled students",
    icon: <GraduationCap className="h-4 w-4" />,
    color: "blue",
  },
  {
    value: "TRAINER",
    label: "All Trainers",
    description: "All active trainers",
    icon: <Users className="h-4 w-4" />,
    color: "green",
  },
  {
    value: "CORPORATE_MANAGER",
    label: "Corporate Partners",
    description: "All active corporate managers",
    icon: <Briefcase className="h-4 w-4" />,
    color: "purple",
  },
  {
    value: "ALL",
    label: "Everyone",
    description: "All students, trainers, and corporate partners",
    icon: <Globe className="h-4 w-4" />,
    color: "amber",
  },
];

export function BroadcastMessageComposer() {
  const [targetRole, setTargetRole] = useState<TargetRole>("STUDENT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, title: title.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setTitle("");
        setMessage("");
      } else {
        setError(data.error ?? "Failed to send broadcast");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSending(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Megaphone className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-gray-900">Broadcast Announcement</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Audience selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Send to</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetRole(opt.value)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition ${
                  targetRole === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${targetRole === opt.value ? "text-blue-600" : "text-gray-400"}`}>
                  {opt.icon}
                </span>
                <div>
                  <p className={`text-sm font-medium ${targetRole === opt.value ? "text-blue-700" : "text-gray-700"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Announcement title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Important schedule update"
            maxLength={200}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your announcement here..."
            rows={4}
            maxLength={2000}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/2000</p>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {result && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Announcement sent to <strong>{result.sent}</strong> recipient{result.sent !== 1 ? "s" : ""}.
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Megaphone className="h-4 w-4" />
              Send Announcement
            </>
          )}
        </button>
      </form>
    </div>
  );
}

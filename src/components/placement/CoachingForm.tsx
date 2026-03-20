"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

type CoachingTopic =
  | "Career Planning"
  | "Resume Review"
  | "Interview Prep"
  | "Salary Negotiation"
  | "General Coaching";

const TOPICS: readonly CoachingTopic[] = [
  "Career Planning",
  "Resume Review",
  "Interview Prep",
  "Salary Negotiation",
  "General Coaching",
] as const;

interface CoachingFormState {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly topic: CoachingTopic | "";
  readonly message: string;
  readonly preferredDate: string;
}

interface ValidationErrors {
  readonly fullName?: string;
  readonly email?: string;
  readonly topic?: string;
}

const INITIAL_STATE: CoachingFormState = {
  fullName: "",
  email: "",
  phone: "",
  topic: "",
  message: "",
  preferredDate: "",
};

function validate(form: CoachingFormState): ValidationErrors {
  if (!form.fullName.trim()) {
    return { fullName: "Full name is required." };
  }
  if (!form.email.trim() || !form.email.includes("@")) {
    return { email: "A valid email address is required." };
  }
  if (!form.topic) {
    return { topic: "Please select a coaching topic." };
  }
  return {};
}

export function CoachingForm() {
  const [form, setForm] = useState<CoachingFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof CoachingFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setServerError(null);
        setSuccess(false);
      },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(form);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setLoading(true);
      setServerError(null);
      setSuccess(false);

      try {
        const res = await fetch("/api/placement/coaching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            topic: form.topic,
            message: form.message.trim() || null,
            preferredDate: form.preferredDate || null,
          }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setServerError(json.error ?? "Failed to book session. Please try again.");
          return;
        }

        setSuccess(true);
        setForm(INITIAL_STATE);
      } catch {
        setServerError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  if (success) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 px-6 py-6 text-center space-y-2">
        <p className="text-green-800 font-semibold text-base">
          Coaching session booked! We will contact you within 24 hours.
        </p>
        <p className="text-green-700 text-sm">
          Check your email for a confirmation message with next steps.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="text-sm text-green-700 underline hover:text-green-900 mt-2"
        >
          Book another session
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="coachFullName" className="text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="coachFullName"
            type="text"
            value={form.fullName}
            onChange={handleChange("fullName")}
            placeholder="Maria Santos"
            className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              errors.fullName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mt-0.5">{errors.fullName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="coachEmail" className="text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="coachEmail"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="maria@example.com"
            className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="coachPhone" className="text-sm font-medium text-gray-700">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="coachPhone"
            type="tel"
            value={form.phone}
            onChange={handleChange("phone")}
            placeholder="+63 912 345 6789"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="coachTopic" className="text-sm font-medium text-gray-700">
            Coaching Topic <span className="text-red-500">*</span>
          </label>
          <select
            id="coachTopic"
            value={form.topic}
            onChange={handleChange("topic")}
            className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 bg-white ${
              errors.topic ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          >
            <option value="">Select a topic...</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.topic && (
            <p className="text-xs text-red-500 mt-0.5">{errors.topic}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="coachPreferredDate" className="text-sm font-medium text-gray-700">
          Preferred Date <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="coachPreferredDate"
          type="date"
          value={form.preferredDate}
          onChange={handleChange("preferredDate")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="coachMessage" className="text-sm font-medium text-gray-700">
          Message <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="coachMessage"
          rows={4}
          value={form.message}
          onChange={handleChange("message")}
          placeholder="Share a bit about your goals or what you'd like to focus on in this session..."
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
        {loading ? "Booking Session..." : "Book Coaching Session"}
      </Button>
    </form>
  );
}

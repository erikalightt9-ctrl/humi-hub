"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Video, CheckCircle2 } from "lucide-react";

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
  if (!form.fullName.trim()) return { fullName: "Full name is required." };
  if (!form.email.trim() || !form.email.includes("@")) return { email: "A valid email is required." };
  if (!form.topic) return { topic: "Please select a coaching topic." };
  return {};
}

type Step = "form" | "payment" | "confirmed";

export function CoachingForm() {
  const [form, setForm] = useState<CoachingFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [zoomJoinUrl, setZoomJoinUrl] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof CoachingFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setServerError(null);
      },
    []
  );

  /* Step 1: Submit booking form */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationErrors = validate(form);
      if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

      setLoading(true);
      setServerError(null);

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

        const json = await res.json() as { success: boolean; data?: { id: string }; error?: string };

        if (!res.ok || !json.success) {
          setServerError(json.error ?? "Failed to book session.");
          return;
        }

        setSessionId(json.data?.id ?? null);
        setStep("payment");
      } catch {
        setServerError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form]
  );

  /* Step 2: Pay with Stripe */
  async function handleStripeCheckout() {
    if (!sessionId) return;
    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/placement/coaching/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json() as { success: boolean; data?: { checkoutUrl: string }; error?: string };

      if (!json.success || !json.data?.checkoutUrl) {
        // Stripe not configured — skip payment, mark confirmed
        setStep("confirmed");
        return;
      }

      window.location.href = json.data.checkoutUrl;
    } catch {
      setServerError("Payment unavailable. Your session is booked — we'll contact you.");
      setStep("confirmed");
    } finally {
      setLoading(false);
    }
  }

  /* Step 2 alt-a: Pay with PayMongo */
  async function handlePayMongoCheckout() {
    if (!sessionId) return;
    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/placement/coaching/paymongo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json() as { success: boolean; data?: { checkoutUrl: string }; error?: string };
      if (!json.success || !json.data?.checkoutUrl) {
        setStep("confirmed");
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      setServerError("PayMongo unavailable. Your session is booked — we'll contact you.");
      setStep("confirmed");
    } finally {
      setLoading(false);
    }
  }

  /* Step 2 alt-b: Skip payment (free / admin will bill separately) */
  function handleSkipPayment() {
    setStep("confirmed");
  }

  /* Confirmed screen */
  if (step === "confirmed") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 px-6 py-8 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
        <p className="text-green-800 font-extrabold text-lg">Session Confirmed!</p>
        <p className="text-green-700 text-sm">
          We will contact you within 24 hours to schedule your session and send a Zoom link.
        </p>
        {zoomJoinUrl && (
          <a
            href={zoomJoinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 bg-purple-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-purple-800"
          >
            <Video className="h-4 w-4" /> Join Zoom Session
          </a>
        )}
        <button
          type="button"
          onClick={() => { setStep("form"); setForm(INITIAL_STATE); setSessionId(null); setZoomJoinUrl(null); }}
          className="block text-sm text-green-700 underline hover:text-green-900 mx-auto mt-2"
        >
          Book another session
        </button>
      </div>
    );
  }

  /* Payment step */
  if (step === "payment") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg mb-1">Complete Your Booking</h3>
          <p className="text-sm text-gray-600">
            Pay $49 to confirm your 60-minute coaching session. Your spot is held for 30 minutes.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-1">
          <p><span className="font-semibold">Topic:</span> {form.topic}</p>
          <p><span className="font-semibold">Name:</span> {form.fullName}</p>
          {form.preferredDate && <p><span className="font-semibold">Preferred date:</span> {form.preferredDate}</p>}
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleStripeCheckout}
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold gap-2"
            size="lg"
          >
            <CreditCard className="h-4 w-4" />
            {loading ? "Redirecting to payment…" : "Pay $49 with Card (Stripe)"}
          </Button>

          <Button
            onClick={handlePayMongoCheckout}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
            size="lg"
          >
            <CreditCard className="h-4 w-4" />
            {loading ? "Redirecting to payment…" : "Pay ₱2,900 via GCash / Maya (PayMongo) 🇵🇭"}
          </Button>

          <button
            type="button"
            onClick={handleSkipPayment}
            className="w-full text-sm text-gray-500 underline hover:text-gray-700 py-2"
          >
            Pay later / invoice me
          </button>
        </div>
      </div>
    );
  }

  /* Form step */
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Full Name */}
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
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
        </div>

        {/* Email */}
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
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Phone */}
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

        {/* Topic */}
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
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.topic && <p className="text-xs text-red-500">{errors.topic}</p>}
        </div>
      </div>

      {/* Date */}
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

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label htmlFor="coachMessage" className="text-sm font-medium text-gray-700">
          Message <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="coachMessage"
          rows={4}
          value={form.message}
          onChange={handleChange("message")}
          placeholder="Share your goals or what you'd like to focus on..."
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
        {loading ? "Booking…" : "Book Coaching Session — $49"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  Check,
  Crown,
  Zap,
  Shield,
  Bot,
  Mail,
  Mic,
  Briefcase,
  Target,
  BarChart2,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SubscriptionData {
  readonly isSubscribed: boolean;
  readonly activeSubscription: {
    readonly id: string;
    readonly plan: string;
    readonly startDate: string | null;
    readonly endDate: string | null;
  } | null;
  readonly pendingSubscription: {
    readonly id: string;
    readonly plan: string;
    readonly createdAt: string;
  } | null;
  readonly plans: {
    readonly MONTHLY: number;
    readonly QUARTERLY: number;
    readonly LIFETIME: number;
  };
}

interface PlanCard {
  readonly key: "MONTHLY" | "QUARTERLY" | "LIFETIME";
  readonly label: string;
  readonly duration: string;
  readonly badge: string | null;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const PLAN_CARDS: ReadonlyArray<PlanCard> = [
  {
    key: "MONTHLY",
    label: "Monthly",
    duration: "30 days",
    badge: null,
    icon: Zap,
  },
  {
    key: "QUARTERLY",
    label: "Quarterly",
    duration: "90 days",
    badge: "Save 22%",
    icon: Shield,
  },
  {
    key: "LIFETIME",
    label: "Lifetime",
    duration: "Forever",
    badge: "Best Value",
    icon: Crown,
  },
];

const AI_FEATURES = [
  { icon: Users, label: "VA Simulator — Practice real VA scenarios" },
  { icon: Zap, label: "Task Generator — AI-created tasks with evaluation" },
  { icon: Target, label: "AI Review — Instant assessment of your work" },
  { icon: Mic, label: "Mock Interviews — Prepare for real interviews" },
  { icon: Briefcase, label: "Business Assistant — Generate professional documents" },
  { icon: Mail, label: "Email Practice — Write & get scored on emails" },
  { icon: BarChart2, label: "Feedback Engine — Consolidated AI insights" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AIPremiumPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/student/subscription");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      setError("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubscribe = useCallback(async () => {
    if (!selectedPlan) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/student/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod,
          referenceNumber: refNumber || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        fetchData();
      } else {
        setError(json.error ?? "Failed to submit");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlan, paymentMethod, refNumber, fetchData]);

  /* ---------------------------------------------------------------- */
  /*  Loading                                                          */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-center py-10 text-red-500">
        Failed to load subscription data
      </p>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Active subscription                                              */
  /* ---------------------------------------------------------------- */

  if (data.isSubscribed && data.activeSubscription) {
    const sub = data.activeSubscription;
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-8 text-center">
          <div className="bg-amber-50 rounded-full p-3 w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <Crown className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            AI Premium Active
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {sub.plan} plan
            {sub.endDate
              ? ` · Expires ${new Date(sub.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`
              : " · Lifetime access"}
          </p>
          <div className="bg-white/60 rounded-xl p-4 text-left space-y-2">
            {AI_FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link href="/student/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Pending subscription                                             */
  /* ---------------------------------------------------------------- */

  if (data.pendingSubscription) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment Under Review
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Your <strong>{data.pendingSubscription.plan}</strong> subscription
            payment is being reviewed by our admin team.
          </p>
          <p className="text-xs text-gray-400">
            Submitted{" "}
            {new Date(data.pendingSubscription.createdAt).toLocaleDateString(
              "en-PH",
              { month: "short", day: "numeric", year: "numeric" },
            )}
          </p>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link href="/student/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Success state                                                    */
  /* ---------------------------------------------------------------- */

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment Submitted!
          </h2>
          <p className="text-sm text-gray-600">
            Your subscription payment has been submitted. Our admin will review
            and activate your account shortly.
          </p>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link href="/student/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Pricing cards                                                    */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <Sparkles className="h-3 w-3" />
          AI PREMIUM
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Unlock AI-Powered Training
        </h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Get access to 7 AI training tools that help you practice, learn, and
          prepare for your VA career with instant feedback.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {PLAN_CARDS.map((plan) => {
          const price = data.plans[plan.key];
          const isSelected = selectedPlan === plan.key;
          const PlanIcon = plan.icon;

          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {plan.badge}
                </span>
              )}
              <PlanIcon
                className={`h-5 w-5 mb-3 ${isSelected ? "text-blue-700" : "text-gray-400"}`}
              />
              <p className="font-semibold text-gray-900">{plan.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₱{price.toLocaleString("en-PH")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{plan.duration}</p>

              {isSelected && (
                <div className="absolute top-3 left-3">
                  <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Features list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl mx-auto">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          What You Get
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AI_FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-center gap-2 text-sm text-gray-700 py-1"
              >
                <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                {f.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment form (shown when plan selected) */}
      {selectedPlan && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto space-y-4">
          <h3 className="font-semibold text-gray-900">Payment Details</h3>

          {/* Payment instructions */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-300 space-y-2">
            <p className="font-medium">Send payment via:</p>
            <div className="space-y-1 text-xs">
              <p>
                <strong>GCash:</strong> 0917-XXX-XXXX (HUMI Hub Training)
              </p>
              <p>
                <strong>Bank Transfer:</strong> BDO SA 001234567890
              </p>
            </div>
            <p className="text-xs text-blue-700">
              Amount:{" "}
              <strong>
                ₱
                {data.plans[
                  selectedPlan as keyof typeof data.plans
                ].toLocaleString("en-PH")}
              </strong>
            </p>
          </div>

          {/* Method */}
          <div>
            <label
              htmlFor="payment-method"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Payment Method
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="GCash">GCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="PayMaya">PayMaya</option>
            </select>
          </div>

          {/* Reference number */}
          <div>
            <label
              htmlFor="ref-number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reference Number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="ref-number"
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="Enter transaction reference number"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={handleSubscribe}
            disabled={submitting}
            className="w-full gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {submitting ? "Submitting..." : "Submit Payment"}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Smartphone } from "lucide-react";

interface PayOnlineButtonProps {
  readonly enrollmentId: string;
}

interface CheckoutResponse {
  readonly success: boolean;
  readonly data: { readonly checkoutUrl: string } | null;
  readonly error: string | null;
}

type PaymentProvider = "paymongo" | "stripe";

export function PayOnlineButton({ enrollmentId }: PayOnlineButtonProps) {
  const [loading, setLoading] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(provider: PaymentProvider) {
    setLoading(provider);
    setError(null);

    const endpoint =
      provider === "stripe"
        ? "/api/payments/create-checkout-stripe"
        : "/api/payments/create-checkout";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });

      const json = (await response.json()) as CheckoutResponse;

      if (!response.ok || !json.success || !json.data) {
        setError(json.error ?? "Failed to create checkout session. Please try again.");
        return;
      }

      window.location.href = json.data.checkoutUrl;
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* PayMongo — GCash, PayMaya, Card (Philippines) */}
      <Button
        type="button"
        onClick={() => handlePay("paymongo")}
        disabled={loading !== null}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-base font-medium"
        size="lg"
      >
        {loading === "paymongo" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Redirecting…
          </>
        ) : (
          <>
            <Smartphone className="h-5 w-5 mr-2" />
            Pay via GCash / PayMaya / Card
          </>
        )}
      </Button>

      {/* Stripe — International Credit / Debit Card */}
      <Button
        type="button"
        onClick={() => handlePay("stripe")}
        disabled={loading !== null}
        variant="outline"
        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-base font-medium"
        size="lg"
      >
        {loading === "stripe" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Redirecting…
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay via Stripe (International Card)
          </>
        )}
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

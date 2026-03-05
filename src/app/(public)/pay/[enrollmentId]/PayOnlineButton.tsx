"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

interface PayOnlineButtonProps {
  readonly enrollmentId: string;
}

interface CheckoutResponse {
  readonly success: boolean;
  readonly data: { readonly checkoutUrl: string } | null;
  readonly error: string | null;
}

export function PayOnlineButton({ enrollmentId }: PayOnlineButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayOnline = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });

      const json = (await response.json()) as CheckoutResponse;

      if (!response.ok || !json.success || !json.data) {
        setError(json.error ?? "Failed to create checkout session. Please try again.");
        return;
      }

      // Redirect to PayMongo checkout page
      window.location.href = json.data.checkoutUrl;
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handlePayOnline}
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-base font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Redirecting to payment...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay Online via GCash / PayMaya / Card
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

/**
 * PayMongo SaaS Billing Service
 *
 * Handles payment link creation for tenant subscriptions.
 * Uses the /v1/links API (suitable for one-time invoices and manual renewals).
 * Distinct from paymongo.service.ts which handles student enrollment payments.
 */

const PAYMONGO_LINKS_URL = "https://api.paymongo.com/v1/links";

// ── Plan pricing (PHP, stored in centavos) ────────────────────────────────────

export const PLAN_PRICES_CENTAVOS: Record<string, number> = {
  TRIAL: 0,
  STARTER: 299_900,       // ₱2,999 / month
  PROFESSIONAL: 799_900,  // ₱7,999 / month
  ENTERPRISE: 1_499_900,  // ₱14,999 / month
};

export const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateSaasPaymentLinkInput {
  readonly subscriptionId: string;
  readonly tenantName: string;
  readonly plan: string;
  readonly amountCentavos: number;
}

export interface SaasPaymentLinkResult {
  readonly linkId: string;
  readonly checkoutUrl: string;
  readonly referenceNumber: string;
}

interface PayMongoLinkResponse {
  readonly data: {
    readonly id: string;
    readonly attributes: {
      readonly checkout_url: string;
      readonly reference_number: string;
      readonly status: string;
    };
  };
}

// ── Auth header ───────────────────────────────────────────────────────────────

function getSaasAuthHeader(): string {
  const secretKey = (process.env.PAYMONGO_SECRET_KEY ?? "").trim();
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY environment variable is not set");
  }
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
}

// ── Create payment link ───────────────────────────────────────────────────────

/**
 * Creates a PayMongo payment link for a SaaS tenant subscription.
 * The `subscriptionId` is embedded in the description so the webhook
 * can look it up when payment is confirmed.
 */
export async function createSaasPaymentLink(
  input: CreateSaasPaymentLinkInput
): Promise<SaasPaymentLinkResult> {
  if (input.amountCentavos <= 0) {
    throw new Error("Cannot create a payment link for a zero-amount plan");
  }

  const planLabel = PLAN_LABELS[input.plan] ?? input.plan;
  const description = `${input.tenantName} — ${planLabel} Plan Subscription`;
  const remarks = `sub:${input.subscriptionId}`;

  const body = {
    data: {
      attributes: {
        amount: input.amountCentavos,
        description,
        remarks,
      },
    },
  };

  const response = await fetch(PAYMONGO_LINKS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: getSaasAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[PayMongo SaaS] Link creation failed:", errorBody);
    throw new Error(
      `PayMongo API error: ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as PayMongoLinkResponse;

  return {
    linkId: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
    referenceNumber: json.data.attributes.reference_number,
  };
}

import crypto from "crypto";

interface CreateCheckoutInput {
  readonly enrollmentId: string;
  readonly amount: number;
  readonly description: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
}

interface CheckoutSessionResult {
  readonly checkoutSessionId: string;
  readonly checkoutUrl: string;
}

interface PayMongoCheckoutResponse {
  readonly data: {
    readonly id: string;
    readonly attributes: {
      readonly checkout_url: string;
    };
  };
}

const PAYMONGO_API_URL = "https://api.paymongo.com/v1/checkout_sessions";

function getAuthHeader(): string {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY environment variable is not set");
  }
  return `Basic ${Buffer.from(secretKey + ":").toString("base64")}`;
}

export async function createCheckoutSession(
  input: CreateCheckoutInput
): Promise<CheckoutSessionResult> {
  const amountInCentavos = Math.round(input.amount * 100);

  const body = {
    data: {
      attributes: {
        line_items: [
          {
            name: input.description,
            amount: amountInCentavos,
            currency: "PHP",
            quantity: 1,
          },
        ],
        payment_method_types: ["gcash", "paymaya", "card"],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        reference_number: input.enrollmentId,
        description: input.description,
      },
    },
  };

  const response = await fetch(PAYMONGO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[PayMongo] Checkout session creation failed:", errorBody);
    throw new Error(`PayMongo API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as PayMongoCheckoutResponse;

  return {
    checkoutSessionId: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[PayMongo] PAYMONGO_WEBHOOK_SECRET is not set");
    return false;
  }

  const parts = signatureHeader.split(",");
  const signatureMap = new Map<string, string>();

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      signatureMap.set(key.trim(), value.trim());
    }
  }

  const timestamp = signatureMap.get("t");
  if (!timestamp) {
    console.error("[PayMongo] Missing timestamp in signature header");
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const computedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  // Check against test signature (te) or live signature (li)
  const testSignature = signatureMap.get("te");
  const liveSignature = signatureMap.get("li");

  if (liveSignature) {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, "hex"),
      Buffer.from(liveSignature, "hex")
    );
  }

  if (testSignature) {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, "hex"),
      Buffer.from(testSignature, "hex")
    );
  }

  console.error("[PayMongo] No te or li signature found in header");
  return false;
}

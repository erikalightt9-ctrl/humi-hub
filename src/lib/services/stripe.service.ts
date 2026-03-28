import Stripe from "stripe";

/* ------------------------------------------------------------------ */
/* Singleton client                                                     */
/* ------------------------------------------------------------------ */

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(key);
}

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface CreateStripeCheckoutInput {
  readonly enrollmentId: string;
  readonly amount: number; // in PHP peso (whole number)
  readonly description: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly tierName?: string;
}

export interface StripeCheckoutResult {
  readonly sessionId: string;
  readonly checkoutUrl: string;
}

/* ------------------------------------------------------------------ */
/* Create Checkout Session                                              */
/* ------------------------------------------------------------------ */

export async function createStripeCheckoutSession(
  input: CreateStripeCheckoutInput
): Promise<StripeCheckoutResult> {
  const stripe = getStripeClient();

  // Stripe expects the smallest currency unit (centavos for PHP)
  const amountInCentavos = Math.round(input.amount * 100);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "php",
          product_data: {
            name: input.description,
            ...(input.tierName && { description: `${input.tierName} Tier` }),
          },
          unit_amount: amountInCentavos,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      enrollmentId: input.enrollmentId,
      tierName: input.tierName ?? "",
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

/* ------------------------------------------------------------------ */
/* Verify Webhook Signature                                             */
/* ------------------------------------------------------------------ */

export function constructStripeEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

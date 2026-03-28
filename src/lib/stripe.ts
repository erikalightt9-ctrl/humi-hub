import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

export const COACHING_PRICE_USD = 4900; // $49.00 in cents
export const isStripeAvailable = (): boolean =>
  Boolean(process.env.STRIPE_SECRET_KEY);

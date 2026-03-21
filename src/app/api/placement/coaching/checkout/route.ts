import { NextRequest, NextResponse } from "next/server";
import { getStripe, COACHING_PRICE_USD, isStripeAvailable } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkoutSchema = z.object({
  sessionId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!isStripeAvailable()) {
      return NextResponse.json(
        { success: false, data: null, error: "Payment not configured. Please add STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "sessionId is required" },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;

    const coaching = await prisma.coachingSession.findUnique({
      where: { id: sessionId },
    });
    if (!coaching) {
      return NextResponse.json(
        { success: false, data: null, error: "Coaching session not found" },
        { status: 404 }
      );
    }
    if (coaching.paymentStatus === "PAID") {
      return NextResponse.json(
        { success: false, data: null, error: "Already paid" },
        { status: 409 }
      );
    }

    const origin = req.headers.get("origin") ?? "https://va-training-center.vercel.app";
    const stripe = getStripe();

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: COACHING_PRICE_USD,
            product_data: {
              name: "Career Coaching Session",
              description: `Topic: ${coaching.topic} — 60-minute one-on-one session`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { coachingSessionId: sessionId },
      success_url: parsed.data.successUrl ?? `${origin}/placement/coaching/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: parsed.data.cancelUrl ?? `${origin}/placement/coaching`,
    });

    await prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        stripeSessionId: stripeSession.id,
        paymentStatus: "PENDING",
        paymentAmount: COACHING_PRICE_USD / 100,
        paymentCurrency: "USD",
        paymentMethod: "stripe",
      },
    });

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: stripeSession.url, stripeSessionId: stripeSession.id },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayMongoSignature } from "@/lib/paymongo";

export const runtime = "nodejs";

interface PayMongoWebhookEvent {
  data: {
    attributes: {
      type: string;
      data: {
        attributes: {
          remarks?: string;
          status?: string;
        };
      };
    };
  };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("paymongo-signature") ?? "";
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET ?? "";

  if (secret && !verifyPayMongoSignature(rawBody, signature, secret)) {
    console.warn("[paymongo-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as PayMongoWebhookEvent;
    const eventType = event.data.attributes.type;

    if (eventType === "payment.paid" || eventType === "link.payment.paid") {
      const remarks = event.data.attributes.data.attributes.remarks?.trim() ?? "";

      if (remarks) {
        const updated = await prisma.coachingSession.updateMany({
          where: {
            OR: [{ id: remarks }, { paymongoPaymentId: remarks }],
          },
          data: {
            paymentStatus: "PAID",
            paymentMethod: "paymongo",
            paymentCurrency: "PHP",
          },
        });
        console.log(`[paymongo-webhook] Marked ${updated.count} session(s) as PAID for remarks="${remarks}"`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[paymongo-webhook] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

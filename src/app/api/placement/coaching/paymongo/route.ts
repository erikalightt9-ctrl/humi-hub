import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPayMongoLink,
  COACHING_PRICE_PHP_CENTAVOS,
  COACHING_PRICE_PHP_DISPLAY,
  isPayMongoAvailable,
} from "@/lib/paymongo";

export async function POST(req: Request) {
  if (!isPayMongoAvailable()) {
    return NextResponse.json(
      { success: false, error: "PayMongo is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json() as { sessionId?: string };
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { success: false, error: "sessionId is required." },
        { status: 400 }
      );
    }

    const session = await prisma.coachingSession.findUnique({
      where: { id: sessionId },
      select: { id: true, topic: true, fullName: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found." },
        { status: 404 }
      );
    }

    const link = await createPayMongoLink({
      amount: COACHING_PRICE_PHP_CENTAVOS,
      description: `1-on-1 Coaching Session — ${session.topic}`,
      remarks: session.id,
    });

    await prisma.coachingSession.update({
      where: { id: sessionId },
      data: { paymongoPaymentId: link.referenceNumber },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: link.checkoutUrl,
        amount: COACHING_PRICE_PHP_DISPLAY,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayMongo error.";
    console.error("[paymongo] checkout error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

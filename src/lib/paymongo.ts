import { createHmac, timingSafeEqual } from "crypto";

const PAYMONGO_BASE = "https://api.paymongo.com/v1";

export const COACHING_PRICE_PHP_CENTAVOS = 290000; // ₱2,900 in centavos
export const COACHING_PRICE_PHP_DISPLAY = "₱2,900";

export const isPayMongoAvailable = (): boolean =>
  Boolean(process.env.PAYMONGO_SECRET_KEY);

function authHeader(): string {
  const key = process.env.PAYMONGO_SECRET_KEY ?? "";
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export interface PayMongoLink {
  readonly checkoutUrl: string;
  readonly referenceNumber: string;
  readonly linkId: string;
}

export async function createPayMongoLink(params: {
  readonly amount: number;
  readonly description: string;
  readonly remarks: string;
}): Promise<PayMongoLink> {
  const res = await fetch(`${PAYMONGO_BASE}/links`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: params.amount,
          description: params.description,
          remarks: params.remarks,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { errors?: Array<{ detail: string }> };
    throw new Error(err.errors?.[0]?.detail ?? `PayMongo error: ${res.status}`);
  }

  const json = await res.json() as {
    data: {
      id: string;
      attributes: {
        checkout_url: string;
        reference_number: string;
      };
    };
  };

  return {
    checkoutUrl: json.data.attributes.checkout_url,
    referenceNumber: json.data.attributes.reference_number,
    linkId: json.data.id,
  };
}

/** Verify PayMongo webhook signature (HMAC-SHA256) */
export function verifyPayMongoSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    // Format: t=timestamp,te=testHash,li=liveHash
    const parts: Record<string, string> = {};
    for (const segment of signatureHeader.split(",")) {
      const idx = segment.indexOf("=");
      if (idx !== -1) parts[segment.slice(0, idx)] = segment.slice(idx + 1);
    }
    const timestamp = parts["t"];
    const hash = parts["te"] ?? parts["li"];
    if (!timestamp || !hash) return false;

    const computed = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const computedBuf = Buffer.from(computed, "hex");
    const hashBuf = Buffer.from(hash, "hex");
    if (computedBuf.length !== hashBuf.length) return false;
    return timingSafeEqual(computedBuf, hashBuf);
  } catch {
    return false;
  }
}

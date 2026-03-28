/* ------------------------------------------------------------------ */
/*  Discount types and helpers                                          */
/*  Single source of truth for discount logic — used by the repo,      */
/*  API routes, and UI components.                                      */
/* ------------------------------------------------------------------ */

export interface DiscountConfig {
  readonly type: "percent" | "fixed";
  readonly value: number;
  readonly active: boolean;
}

/**
 * Calculate the final price after applying a discount.
 * Returns the original price if no discount is active.
 *
 * Uses integer-cent arithmetic to avoid IEEE-754 floating-point accumulation
 * errors common with the `Math.round(x * 100) / 100` idiom.
 */
export function computeFinalPrice(
  price: number,
  discount: DiscountConfig | null | undefined,
): number {
  if (!discount || !discount.active || discount.value <= 0) return price;

  const priceCents = Math.round(price * 100);
  const discountedCents =
    discount.type === "percent"
      ? Math.round(priceCents * (1 - discount.value / 100))
      : priceCents - Math.round(discount.value * 100);

  return Math.max(0, discountedCents) / 100;
}

/**
 * Format a discount for display: "20% OFF" or "SAVE ₱500"
 */
export function formatDiscountLabel(discount: DiscountConfig): string {
  if (discount.type === "percent") {
    return `${discount.value}% OFF`;
  }
  return `SAVE ₱${discount.value.toLocaleString()}`;
}

/**
 * Safely parse an unknown JSON value into a typed DiscountConfig.
 * Returns null if the value is missing or malformed.
 * Single source of truth — import this instead of writing local parseDiscount copies.
 */
export function parseDiscount(raw: unknown): DiscountConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (
    (d.type === "percent" || d.type === "fixed") &&
    typeof d.value === "number" &&
    typeof d.active === "boolean"
  ) {
    return { type: d.type, value: d.value, active: d.active };
  }
  return null;
}

import { prisma } from "@/lib/prisma";

/**
 * Generates a unique payment reference code in the format VTC-YYYY-NNNNN.
 *
 * Uses MAX-based sequencing (finds the highest existing code for the year)
 * instead of COUNT-based, which avoids false collisions caused by sequence gaps
 * (e.g. deleted enrollments leave holes that count-based logic trips over).
 *
 * The @unique constraint on Enrollment.referenceCode is the ultimate safety net
 * for any concurrent writes that slip through.
 */
export async function generateReferenceCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VTC-${year}-`;

  // Find the highest sequence number currently in use for this year.
  // Lexicographic desc on zero-padded 5-digit codes equals numeric desc.
  const latest = await prisma.enrollment.findFirst({
    where: { referenceCode: { startsWith: prefix } },
    orderBy: { referenceCode: "desc" },
    select: { referenceCode: true },
  });

  const nextSeq =
    latest?.referenceCode != null
      ? parseInt(latest.referenceCode.slice(prefix.length), 10) + 1
      : 1;

  return retryReferenceCode(prefix, nextSeq);
}

async function retryReferenceCode(
  prefix: string,
  startFrom: number,
  maxAttempts = 10
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = `${prefix}${String(startFrom + i).padStart(5, "0")}`;
    const existing = await prisma.enrollment.findUnique({
      where: { referenceCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique reference code after retries");
}

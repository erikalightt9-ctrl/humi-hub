/**
 * Simple JWT-based auth for employer sessions.
 * Uses a separate cookie from NextAuth to avoid conflicts.
 */
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const EMPLOYER_COOKIE = "employer_token";
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "fallback-secret-change-me"
);

export interface EmployerPayload {
  id: string;
  email: string;
  companyName: string;
}

export async function signEmployerToken(payload: EmployerPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export async function getEmployerSession(): Promise<EmployerPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(EMPLOYER_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as EmployerPayload;
  } catch {
    return null;
  }
}

export { EMPLOYER_COOKIE };

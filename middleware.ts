/**
 * Next.js Middleware (Edge Runtime)
 *
 * Enforces mustChangePassword redirect so users with a temporary password
 * cannot access protected pages before updating their credentials.
 *
 * Uses raw JWT decoding instead of next-auth/jwt to stay Edge-compatible
 * on Vercel with Next.js 16.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* Paths that must NEVER be blocked by this middleware */
const ALWAYS_ALLOW = [
  "/portal",
  "/api/",
  "/_next/",
  "/favicon",
  "/student/change-password",
  "/trainer/change-password",
  "/forgot-password",
  "/reset-password",
  "/enroll",
  "/contact",
  "/about",
  "/terms",
  "/privacy",
];

/**
 * Decode the next-auth session token (unsigned JWT stored in a cookie).
 * Returns the payload or null if the cookie is missing / malformed.
 */
function decodeSessionToken(request: NextRequest): Record<string, unknown> | null {
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;

  try {
    // next-auth JWTs are JWE (encrypted), but the cookie is a signed JWT
    // when using the default strategy. Try decoding the middle segment.
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let always-allowed paths through immediately
  if (ALWAYS_ALLOW.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const payload = decodeSessionToken(request);

  // Not authenticated — let NextAuth handle it
  if (!payload) return NextResponse.next();

  const mustChange = payload.mustChangePassword as boolean | undefined;
  if (!mustChange) return NextResponse.next();

  const role = payload.role as string | undefined;

  if (role === "student" && !pathname.startsWith("/student/change-password")) {
    return NextResponse.redirect(
      new URL("/student/change-password", request.url),
    );
  }

  if (role === "trainer" && !pathname.startsWith("/trainer/change-password")) {
    return NextResponse.redirect(
      new URL("/trainer/change-password", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

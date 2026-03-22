/**
 * Next.js Edge Middleware
 *
 * Enforces mustChangePassword redirect so users with a temporary password
 * cannot access protected pages before updating their credentials.
 *
 * Rules:
 *  - Students  with mustChangePassword=true → redirect to /student/change-password
 *  - Trainers  with mustChangePassword=true → redirect to /trainer/change-password
 *
 * The change-password pages themselves (and all /api routes, /_next assets, /portal)
 * are always allowed through to avoid redirect loops.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let always-allowed paths through immediately
  if (ALWAYS_ALLOW.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not authenticated — let NextAuth handle it
  if (!token) return NextResponse.next();

  const mustChange = token.mustChangePassword as boolean | undefined;
  if (!mustChange) return NextResponse.next();

  const role = token.role as string | undefined;

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
  /*
   * Match every route except static files and Next.js internals.
   * This lets the middleware run cheaply only where needed.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

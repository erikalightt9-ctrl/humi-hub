import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Extract the subdomain from the hostname.
 *  e.g. "acme.yoursite.com" with rootDomain "yoursite.com" → "acme"
 *  e.g. "localhost:3000" → null (no subdomain) */
function extractSubdomain(hostname: string, rootDomain: string): string | null {
  const cleanHostname = hostname.split(":")[0];
  const cleanRoot = rootDomain.split(":")[0];

  if (cleanHostname === cleanRoot || cleanHostname === `www.${cleanRoot}`) return null;
  if (cleanHostname.endsWith(`.${cleanRoot}`)) {
    return cleanHostname.slice(0, cleanHostname.length - cleanRoot.length - 1);
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Tenant subdomain detection ──────────────────────────────────────────
  const hostname = request.headers.get("host") ?? "";
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const subdomain = extractSubdomain(hostname, rootDomain);

  const response = NextResponse.next();
  if (subdomain) {
    response.headers.set("x-tenant-subdomain", subdomain);
  }

  // ── Superadmin protection ────────────────────────────────────────────────
  if (pathname.startsWith("/superadmin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.isSuperAdmin) {
      const loginUrl = new URL("/portal", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Admin route protection ───────────────────────────────────────────────
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminRoute || isAdminApi) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, data: null, error: "Unauthorized" },
          { status: 401 },
        );
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Student route protection ─────────────────────────────────────────────
  const isStudentRoute = pathname.startsWith("/student") && !pathname.startsWith("/student/login");
  const isStudentApi = pathname.startsWith("/api/student");

  if (isStudentRoute || isStudentApi) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "student") {
      if (isStudentApi) {
        return NextResponse.json(
          { success: false, data: null, error: "Unauthorized" },
          { status: 401 },
        );
      }
      const loginUrl = new URL("/student/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if access has expired (JWT snapshot)
    if (token.accessExpiry) {
      const expiry = new Date(token.accessExpiry as string);
      if (expiry < new Date()) {
        if (isStudentApi) {
          return NextResponse.json(
            { success: false, data: null, error: "Access expired" },
            { status: 403 },
          );
        }
        return NextResponse.redirect(
          new URL("/portal?tab=student&error=expired", request.url),
        );
      }
    }

    // Force password change on first login
    const isChangePasswordPage = pathname === "/student/change-password";
    const isChangePasswordApi = pathname === "/api/student/change-password";

    if (token.mustChangePassword === true && !isChangePasswordPage && !isChangePasswordApi) {
      return NextResponse.redirect(new URL("/student/change-password", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

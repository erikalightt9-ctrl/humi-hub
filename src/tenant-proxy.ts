/**
 * tenant-proxy.ts — Edge-compatible tenant routing middleware.
 *
 * NO Prisma / database calls here. This runs in Next.js Edge Runtime
 * where the Prisma client is too large (exceeds Vercel 1 MB limit).
 *
 * Tenant resolution strategy:
 *  1. Subdomain extracted via string ops (no DB)
 *  2. x-tenant-subdomain header set for downstream server components / API routes
 *  3. Cross-tenant guard compares JWT.orgSubdomain (stored at login) to URL subdomain
 *  4. Custom domain → tenant mapping is handled at the API/server layer, not here
 */
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Subdomains that belong to the platform itself — never redirect to tenant login. */
const PLATFORM_SUBDOMAINS = new Set(["www", "app", "admin", "superadmin"]);

/**
 * Extract the tenant subdomain from the hostname.
 * e.g. "acme.yoursite.com" with rootDomain "yoursite.com" → "acme"
 * e.g. "localhost:3000" → null (no subdomain)
 */
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

  // ── Tenant subdomain resolution ──────────────────────────────────────────
  const hostname = request.headers.get("host") ?? "";
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const subdomain = extractSubdomain(hostname, rootDomain);

  const response = NextResponse.next();

  // ── superadmin subdomain → rewrite to /superadmin/* ─────────────────────
  if (subdomain === "superadmin") {
    const url = request.nextUrl.clone();
    if (!pathname.startsWith("/superadmin")) {
      if (pathname === "/login" || pathname === "/") {
        url.pathname = "/superadmin/login";
        return NextResponse.rewrite(url);
      }
      url.pathname = `/superadmin${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── Tenant subdomain routing ─────────────────────────────────────────────
  if (subdomain && !PLATFORM_SUBDOMAINS.has(subdomain)) {
    // Root / /login → branded tenant login page
    if (pathname === "/" || pathname === "/login") {
      const tenantLoginUrl = new URL("/tenant-login", request.url);
      tenantLoginUrl.searchParams.set("slug", subdomain);
      return NextResponse.rewrite(tenantLoginUrl);
    }

    // Propagate subdomain downstream via request/response headers
    response.headers.set("x-tenant-subdomain", subdomain);
    response.headers.set("x-forwarded-host", hostname);
  }

  // ── Auth token (decoded JWT — no DB call) ────────────────────────────────
  const needsAuth =
    pathname.startsWith("/superadmin") ||
    (pathname.startsWith("/humi-admin") && !pathname.startsWith("/humi-admin/login")) ||
    pathname.startsWith("/api/humi-admin") ||
    (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) ||
    pathname.startsWith("/api/admin") ||
    (pathname.startsWith("/student") && !pathname.startsWith("/student/login")) ||
    pathname.startsWith("/api/student") ||
    (pathname.startsWith("/trainer") && !pathname.startsWith("/trainer/login")) ||
    pathname.startsWith("/api/trainer");

  const token = needsAuth
    ? await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    : null;

  // ── Superadmin protection ────────────────────────────────────────────────
  if (pathname.startsWith("/superadmin") && !pathname.startsWith("/superadmin/login")) {
    if (!token?.isSuperAdmin) {
      return NextResponse.redirect(new URL("/superadmin/login", request.url));
    }
  }

  // ── HUMI Admin route protection ──────────────────────────────────────────
  const isHumiAdminRoute = pathname.startsWith("/humi-admin") && !pathname.startsWith("/humi-admin/login");
  const isHumiAdminApi = pathname.startsWith("/api/humi-admin");

  if (isHumiAdminRoute || isHumiAdminApi) {
    if (!token || token.isHumiAdmin !== true) {
      if (isHumiAdminApi) {
        return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/humi-admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Block HUMI Admins from accessing tenant or platform admin routes
  if (token?.isHumiAdmin === true) {
    const blockedPrefixes = ["/admin", "/superadmin", "/student", "/trainer", "/corporate"];
    if (blockedPrefixes.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/humi-admin", request.url));
    }
  }

  // ── Admin route protection ───────────────────────────────────────────────
  // Allows: platform super-admin, tenant admins, and corporate team members
  // with an explicit userRole (EXECUTIVE / MANAGER / ADMIN).
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminRoute || isAdminApi) {
    const isAuthorized =
      token &&
      (token.role === "admin" ||
        token.isTenantAdmin === true ||
        (token.userRole != null && token.tenantId != null));
    if (!isAuthorized) {
      if (isAdminApi) {
        return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
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
    if (!token || token.role !== "student") {
      if (isStudentApi) {
        return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/student/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Access expiry check (JWT snapshot — no DB)
    if (token.accessExpiry) {
      const expiry = new Date(token.accessExpiry as string);
      if (expiry < new Date()) {
        if (isStudentApi) {
          return NextResponse.json({ success: false, data: null, error: "Access expired" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/portal?tab=student&error=expired", request.url));
      }
    }

    // Force password change on first login
    const isChangePasswordPage = pathname === "/student/change-password";
    const isChangePasswordApi = pathname === "/api/student/change-password";
    if (token.mustChangePassword === true && !isChangePasswordPage && !isChangePasswordApi) {
      return NextResponse.redirect(new URL("/student/change-password", request.url));
    }
  }

  // ── Trainer route protection ─────────────────────────────────────────────
  const isTrainerRoute = pathname.startsWith("/trainer") && !pathname.startsWith("/trainer/login");
  const isTrainerApi = pathname.startsWith("/api/trainer");

  if (isTrainerRoute || isTrainerApi) {
    if (!token || token.role !== "trainer") {
      if (isTrainerApi) {
        return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/trainer/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Cross-tenant session guard (no DB — uses JWT.orgSubdomain) ────────────
  // When a user logged in on tenantA.app.com visits tenantB.app.com,
  // their JWT.orgSubdomain will be "tenanta" but the URL subdomain is "tenantb".
  // Redirect them to the correct tenant's login page.
  if (subdomain && !PLATFORM_SUBDOMAINS.has(subdomain) && token) {
    const isTenantScopedRole =
      token.role === "student" ||
      token.role === "corporate" ||
      token.role === "trainer" ||
      token.isTenantAdmin === true;

    const isProtectedPath =
      pathname.startsWith("/student") ||
      pathname.startsWith("/corporate") ||
      pathname.startsWith("/trainer") ||
      pathname.startsWith("/admin");

    if (isTenantScopedRole && token.orgSubdomain && isProtectedPath) {
      if ((token.orgSubdomain as string) !== subdomain) {
        const mismatchUrl = new URL("/tenant-login", request.url);
        mismatchUrl.searchParams.set("slug", subdomain);
        mismatchUrl.searchParams.set("error", "tenant_mismatch");
        return NextResponse.redirect(mismatchUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

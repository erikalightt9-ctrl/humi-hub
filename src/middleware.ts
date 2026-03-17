import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const rootDomain = process.env.ROOT_DOMAIN ?? "localhost:3000";

  const subdomain = extractSubdomain(hostname, rootDomain);

  const response = NextResponse.next();

  // Pass subdomain downstream as a header for layouts and API routes
  if (subdomain) {
    response.headers.set("x-tenant-subdomain", subdomain);
  }

  // Protect /superadmin routes — only isSuperAdmin tokens may enter
  if (request.nextUrl.pathname.startsWith("/superadmin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.isSuperAdmin) {
      const loginUrl = new URL("/portal", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};

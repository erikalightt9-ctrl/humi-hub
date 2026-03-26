import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "localhost:3000";

  const url = request.nextUrl.clone();

  // Remove port for comparison
  const hostWithoutPort = hostname.split(":")[0];
  const baseWithoutPort = baseDomain.split(":")[0];

  // Check if it's a subdomain request
  if (hostWithoutPort.endsWith(`.${baseWithoutPort}`)) {
    const subdomain = hostWithoutPort.replace(`.${baseWithoutPort}`, "");

    if (subdomain && subdomain !== "www" && subdomain !== "app") {
      // Rewrite to /site/[slug][pathname]
      const originalPathname = url.pathname === "/" ? "" : url.pathname;
      url.pathname = `/site/${subdomain}${originalPathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};

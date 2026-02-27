import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isStudentRoute = pathname.startsWith("/student") && !pathname.startsWith("/student/login");
  const isStudentApi = pathname.startsWith("/api/student");

  if (isAdminRoute || isAdminApi) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "admin") {
      if (isAdminApi) {
        return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isStudentRoute || isStudentApi) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "student") {
      if (isStudentApi) {
        return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/student/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/student/:path*", "/api/student/:path*"],
};

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signEmployerToken, EMPLOYER_COOKIE } from "@/lib/employer-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const employer = await prisma.employer.findUnique({ where: { email } });
    if (!employer) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, employer.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (employer.status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, data: null, error: "Account suspended. Contact support." },
        { status: 403 }
      );
    }

    const token = await signEmployerToken({
      id: employer.id,
      email: employer.email,
      companyName: employer.companyName,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: employer.id,
        email: employer.email,
        companyName: employer.companyName,
        status: employer.status,
      },
      error: null,
    });
    response.cookies.set(EMPLOYER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

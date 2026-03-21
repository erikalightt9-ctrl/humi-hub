import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signEmployerToken, EMPLOYER_COOKIE } from "@/lib/employer-auth";

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(100),
  companyName: z.string().min(2).max(200),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const { email, password, companyName, website, industry, location, description } = parsed.data;

    const existing = await prisma.employer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const employer = await prisma.employer.create({
      data: {
        email,
        passwordHash,
        companyName,
        website: website || null,
        industry: industry || null,
        location: location || null,
        description: description || null,
      },
      select: { id: true, email: true, companyName: true, status: true },
    });

    const token = await signEmployerToken({
      id: employer.id,
      email: employer.email,
      companyName: employer.companyName,
    });

    const response = NextResponse.json(
      { success: true, data: employer, error: null },
      { status: 201 }
    );
    response.cookies.set(EMPLOYER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

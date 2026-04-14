import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const allowedRoles = ["corporate", "tenant_admin", "tenant_user"];
    if (!token?.id || !allowedRoles.includes(token.role as string)) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json() as { currentPassword?: string; newPassword?: string };
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, data: null, error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, data: null, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 },
      );
    }

    // Tenant users have their own table
    if (token.role === "tenant_user") {
      const tenantUser = await prisma.tenantUser.findUnique({
        where: { id: token.id as string },
        select: { id: true, passwordHash: true },
      });

      if (!tenantUser || !tenantUser.passwordHash) {
        return NextResponse.json(
          { success: false, data: null, error: "Account not found" },
          { status: 404 },
        );
      }

      const isValid = await bcrypt.compare(currentPassword, tenantUser.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, data: null, error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await prisma.tenantUser.update({
        where: { id: tenantUser.id },
        data: { passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() },
      });

      return NextResponse.json({ success: true, data: null, error: null });
    }

    // Corporate managers (tenant_admin / corporate)
    const manager = await prisma.corporateManager.findUnique({
      where: { id: token.id as string },
      select: { id: true, passwordHash: true },
    });

    if (!manager) {
      return NextResponse.json(
        { success: false, data: null, error: "Account not found" },
        { status: 404 },
      );
    }

    const isValid = await bcrypt.compare(currentPassword, manager.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, data: null, error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.corporateManager.update({
      where: { id: manager.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    return NextResponse.json({ success: true, data: null, error: null });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

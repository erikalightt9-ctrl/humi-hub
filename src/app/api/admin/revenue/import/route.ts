import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { RevenueType } from "@prisma/client";

const VALID_TYPES: string[] = [
  "PLATFORM_FEE",
  "TENANT_SUBSCRIPTION",
  "ENROLLMENT_PAYMENT",
  "TRAINER_EARNING",
  "REFUND",
  "MANUAL",
];

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || (!token.isTenantAdmin && !token.isSuperAdmin)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file)
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 422 }
      );

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

    const created: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const amount = parseFloat(
          String(row["amount"] ?? row["Amount"] ?? 0)
        );
        const type = String(
          row["type"] ?? row["Type"] ?? "MANUAL"
        ).toUpperCase();
        const userId =
          String(row["user_id"] ?? row["User ID"] ?? "").trim() || null;
        const tenantId =
          String(row["tenant_id"] ?? row["Tenant ID"] ?? "").trim() || null;
        const description =
          String(row["description"] ?? row["Description"] ?? "").trim() ||
          null;
        const status = String(
          row["status"] ?? row["Status"] ?? "active"
        ).toLowerCase();

        if (isNaN(amount) || amount <= 0) {
          errors.push(`Row ${i + 2}: invalid amount`);
          continue;
        }
        if (!VALID_TYPES.includes(type)) {
          errors.push(`Row ${i + 2}: invalid type "${type}"`);
          continue;
        }

        const record = await prisma.revenueRecord.create({
          data: {
            type: type as RevenueType,
            amount,
            currency: String(row["currency"] ?? row["Currency"] ?? "PHP"),
            description,
            userId,
            userType:
              String(row["user_type"] ?? row["User Type"] ?? "").trim() ||
              null,
            tenantId: token.isSuperAdmin
              ? tenantId
              : ((token.tenantId as string) ?? null),
            referenceId:
              String(
                row["reference_id"] ?? row["Reference ID"] ?? ""
              ).trim() || null,
            referenceType:
              String(
                row["reference_type"] ?? row["Reference Type"] ?? ""
              ).trim() || null,
            status,
          },
        });

        await prisma.revenueAuditLog.create({
          data: {
            recordId: record.id,
            action: "IMPORT",
            actorId: token.id as string,
            actorRole: token.isSuperAdmin ? "SUPERADMIN" : "ADMIN",
            after: JSON.parse(JSON.stringify(record)),
          },
        });

        created.push(record.id);
      } catch (rowErr) {
        errors.push(`Row ${i + 2}: ${String(rowErr)}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: { created: created.length, errors },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/admin/revenue/import]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

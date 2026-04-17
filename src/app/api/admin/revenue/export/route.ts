import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
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

    const tenantFilter = token.isSuperAdmin
      ? {}
      : { tenantId: token.tenantId as string };

    const records = await prisma.revenueRecord.findMany({
      where: { status: "active", ...tenantFilter },
      orderBy: { createdAt: "desc" },
    });

    const rows = records.map((r) => ({
      ID: r.id,
      Type: r.type,
      Amount: Number(r.amount),
      Currency: r.currency,
      Description: r.description ?? "",
      "User ID": r.userId ?? "",
      "User Type": r.userType ?? "",
      "Tenant ID": r.tenantId ?? "",
      "Reference ID": r.referenceId ?? "",
      "Reference Type": r.referenceType ?? "",
      Status: r.status,
      "Created At": r.createdAt.toISOString(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `revenue-export-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/revenue/export]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

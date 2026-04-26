import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const employeeId = token.id as string;

    const requests = await prisma.itRequest.findMany({
      where: { submittedById: employeeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests, error: null });
  } catch (err) {
    console.error("[GET /api/employee/it-requests]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const employeeId = token.id as string;
    const orgId      = token.organizationId as string;

    const body = await request.json() as {
      requestType?: string;
      priority?: string;
      subject: string;
      description: string;
      assetId?: string;
    };

    if (!body.subject?.trim() || !body.description?.trim()) {
      return NextResponse.json({ success: false, data: null, error: "Subject and description are required" }, { status: 400 });
    }

    const count = await prisma.itRequest.count({ where: { organizationId: orgId } });
    const referenceNo = `IT-${String(count + 1).padStart(4, "0")}`;

    const created = await prisma.itRequest.create({
      data: {
        organizationId: orgId,
        referenceNo,
        requestType:   (body.requestType ?? "SUPPORT") as never,
        priority:      (body.priority    ?? "MEDIUM")  as never,
        subject:       body.subject.trim(),
        description:   body.description.trim(),
        submittedById: employeeId,
        assetId:       body.assetId ?? null,
      },
    });

    return NextResponse.json({ success: true, data: created, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/employee/it-requests]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

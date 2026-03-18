import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  updatePlacement,
  deletePlacement,
  getPlacementById,
} from "@/lib/repositories/placement.repository";

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const PLACEMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const;

const updateSchema = z.object({
  companyName: z.string().min(1).max(150).optional(),
  jobTitle: z.string().min(1).max(150).optional(),
  employmentType: z.enum(PLACEMENT_TYPES).optional(),
  monthlyRate: z.number().positive().nullable().optional(),
  currency: z.string().length(3).optional(),
  startDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date")
    .optional(),
  notes: z.string().max(1000).nullable().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET  /api/admin/placements/[id]                                    */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const placement = await getPlacementById(id);
    if (!placement) {
      return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: placement, error: null });
  } catch (err) {
    console.error("[GET /api/admin/placements/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH  /api/admin/placements/[id]                                  */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 422 });
    }

    const { id } = await params;
    const { startDate: rawStartDate, ...rest } = result.data;
    const updated = await updatePlacement(id, {
      ...rest,
      ...(rawStartDate !== undefined ? { startDate: new Date(rawStartDate) } : {}),
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "P2025") {
      return NextResponse.json({ success: false, data: null, error: "Placement not found" }, { status: 404 });
    }
    console.error("[PATCH /api/admin/placements/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE  /api/admin/placements/[id]                                 */
/* ------------------------------------------------------------------ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deletePlacement(id);
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "P2025") {
      return NextResponse.json({ success: false, data: null, error: "Placement not found" }, { status: 404 });
    }
    console.error("[DELETE /api/admin/placements/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

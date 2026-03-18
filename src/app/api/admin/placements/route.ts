import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  listPlacements,
  createPlacement,
  getPlacementStats,
} from "@/lib/repositories/placement.repository";
import type { PlacementType } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const PLACEMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"] as const;

const createSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  jobApplicationId: z.string().optional(),
  companyName: z.string().min(1, "Company name is required").max(150),
  jobTitle: z.string().min(1, "Job title is required").max(150),
  employmentType: z.enum(PLACEMENT_TYPES),
  monthlyRate: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  notes: z.string().max(1000).optional(),
});

/* ------------------------------------------------------------------ */
/*  GET  /api/admin/placements?page=1&limit=25&search=&courseSlug=     */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const mode = sp.get("mode");

    // Analytics mode — return summary stats
    if (mode === "stats") {
      const stats = await getPlacementStats();
      return NextResponse.json({ success: true, data: stats, error: null });
    }

    // List mode
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "25", 10)));
    const search = sp.get("search") ?? undefined;
    const courseSlug = sp.get("courseSlug") ?? undefined;
    const employmentType = (sp.get("employmentType") as PlacementType | null) ?? undefined;

    const result = await listPlacements({ page, limit, search, courseSlug, employmentType });
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/placements]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST  /api/admin/placements                                        */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ success: false, data: null, error: msg }, { status: 422 });
    }

    const placement = await createPlacement({
      ...result.data,
      startDate: new Date(result.data.startDate),
    });

    return NextResponse.json({ success: true, data: placement, error: null }, { status: 201 });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "P2002") {
      return NextResponse.json(
        { success: false, data: null, error: "This student already has a placement record" },
        { status: 409 },
      );
    }
    console.error("[POST /api/admin/placements]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

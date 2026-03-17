import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  syncFromRemotive,
  syncFromJSearch,
  syncAllSources,
} from "@/lib/services/job-sync.service";

/* ------------------------------------------------------------------ */
/*  POST — Sync jobs from external sources                             */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => ({}));
    const source = (body as { source?: string }).source ?? "all";

    let result;

    switch (source) {
      case "remotive":
        result = {
          remotive: await syncFromRemotive(),
          jsearch: { synced: 0, skipped: 0, errors: 0 },
          total: { synced: 0, skipped: 0, errors: 0 },
        };
        result.total = result.remotive;
        break;

      case "jsearch":
        result = {
          remotive: { synced: 0, skipped: 0, errors: 0 },
          jsearch: await syncFromJSearch(),
          total: { synced: 0, skipped: 0, errors: 0 },
        };
        result.total = result.jsearch;
        break;

      default:
        result = await syncAllSources();
        break;
    }

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/admin/job-postings/sync]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Sync failed. Please try again." },
      { status: 500 },
    );
  }
}

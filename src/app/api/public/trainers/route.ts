import { NextRequest, NextResponse } from "next/server";
import { getActiveTrainers } from "@/lib/repositories/trainer.repository";

/* ------------------------------------------------------------------ */
/*  GET — Public: list active trainers (for enrollment)                */
/*  Optional query param: courseId (filter by course assignment)        */
/* ------------------------------------------------------------------ */

export async function GET(_request: NextRequest) {
  try {
    const trainers = await getActiveTrainers();

    // Return only public-safe fields (no passwordHash, no internal IDs)
    const publicTrainers = trainers.map((t) => ({
      id: t.id,
      name: t.name,
      photoUrl: t.photoUrl,
      bio: t.bio,
      specializations: t.specializations,
      credentials: t.credentials,
      certifications: t.certifications,
      industryExperience: t.industryExperience,
      yearsOfExperience: t.yearsOfExperience,
      averageRating: t.averageRating,
      totalRatings: t.totalRatings,
      studentsTrainedCount: t.studentsTrainedCount,
    }));

    return NextResponse.json({
      success: true,
      data: publicTrainers,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/public/trainers]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

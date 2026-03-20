import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const ZERO_STATS = {
  totalApplications: 0,
  pendingApplications: 0,
  interviewsCompleted: 0,
  jobMatches: 0,
  resumeUploaded: false,
  coachingBooked: 0,
};

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "student" || !token.id) {
      return NextResponse.json({ success: true, data: ZERO_STATS, error: null });
    }

    const studentId = token.id as string;

    const [
      totalApplications,
      pendingApplications,
      interviewsCompleted,
      resumeRecord,
      coachingBooked,
    ] = await Promise.all([
      prisma.jobApplication.count({
        where: { studentId },
      }),
      prisma.jobApplication.count({
        where: { studentId, status: "PENDING" },
      }),
      prisma.interviewSession.count({
        where: { studentId, status: "completed" },
      }),
      prisma.placementResume.findFirst({
        where: { studentId },
        select: { id: true },
      }),
      prisma.coachingSession.count({
        where: { studentId },
      }),
    ]);

    // jobMatches is currently a placeholder; wire to a JobMatch model when available
    const jobMatches = 0;

    const stats = {
      totalApplications,
      pendingApplications,
      interviewsCompleted,
      jobMatches,
      resumeUploaded: resumeRecord !== null,
      coachingBooked,
    };

    return NextResponse.json({ success: true, data: stats, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch placement stats";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}

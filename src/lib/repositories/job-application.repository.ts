import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";
import type { CourseSlug } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ApplicationFilters {
  readonly status?: ApplicationStatus;
  readonly courseSlug?: CourseSlug;
}

/* ------------------------------------------------------------------ */
/*  Internship Listings                                                */
/* ------------------------------------------------------------------ */

export async function getInternshipListings(courseSlug?: CourseSlug) {
  const where: Record<string, unknown> = {
    isInternship: true,
    isActive: true,
  };

  if (courseSlug) {
    where.OR = [{ courseSlug }, { courseSlug: null }];
  }

  const listings = await prisma.jobPosting.findMany({
    where,
    include: {
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return listings;
}

/* ------------------------------------------------------------------ */
/*  Freelance Listings                                                 */
/* ------------------------------------------------------------------ */

export async function getFreelanceListings(courseSlug?: CourseSlug) {
  const where: Record<string, unknown> = {
    type: "freelance",
    isActive: true,
    isInternship: false,
  };

  if (courseSlug) {
    where.OR = [{ courseSlug }, { courseSlug: null }];
  }

  const listings = await prisma.jobPosting.findMany({
    where,
    include: {
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return listings;
}

/* ------------------------------------------------------------------ */
/*  Student Applications                                               */
/* ------------------------------------------------------------------ */

export async function getStudentApplications(studentId: string) {
  const applications = await prisma.jobApplication.findMany({
    where: { studentId },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          type: true,
          salaryRange: true,
          isInternship: true,
          skills: true,
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return applications;
}

/* ------------------------------------------------------------------ */
/*  Check if student already applied                                   */
/* ------------------------------------------------------------------ */

export async function hasApplied(
  studentId: string,
  jobPostingId: string,
): Promise<boolean> {
  const existing = await prisma.jobApplication.findUnique({
    where: {
      studentId_jobPostingId: { studentId, jobPostingId },
    },
    select: { id: true },
  });

  return existing !== null;
}

/* ------------------------------------------------------------------ */
/*  Create Application                                                 */
/* ------------------------------------------------------------------ */

export async function createApplication(
  studentId: string,
  jobPostingId: string,
  coverLetter: string,
) {
  const application = await prisma.jobApplication.create({
    data: {
      studentId,
      jobPostingId,
      coverLetter,
    },
    include: {
      jobPosting: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          type: true,
          salaryRange: true,
          isInternship: true,
          skills: true,
        },
      },
    },
  });

  return application;
}

/* ------------------------------------------------------------------ */
/*  Admin — Get All Applications                                       */
/* ------------------------------------------------------------------ */

export async function getAllApplications(filters?: ApplicationFilters) {
  const where: Record<string, unknown> = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.courseSlug) {
    where.student = {
      enrollment: {
        course: {
          slug: filters.courseSlug,
        },
      },
    };
  }

  const applications = await prisma.jobApplication.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          portfolioPublic: true,
          enrollment: {
            select: {
              course: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
          careerScores: {
            select: {
              overallScore: true,
              communication: true,
              accuracy: true,
              speed: true,
              reliability: true,
              technicalSkills: true,
              professionalism: true,
              aiSummary: true,
              evaluatedAt: true,
            },
            orderBy: { evaluatedAt: "desc" },
            take: 1,
          },
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          type: true,
          salaryRange: true,
          isInternship: true,
          skills: true,
          requirements: true,
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return applications;
}

/* ------------------------------------------------------------------ */
/*  Admin — Update Application Status                                  */
/* ------------------------------------------------------------------ */

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  adminNotes?: string,
) {
  const updateData: Record<string, unknown> = { status };

  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  const application = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: updateData,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
  });

  return application;
}

/* ------------------------------------------------------------------ */
/*  Get Application by ID                                              */
/* ------------------------------------------------------------------ */

export async function getApplicationById(applicationId: string) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          portfolioPublic: true,
          enrollment: {
            select: {
              course: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
          careerScores: {
            select: {
              overallScore: true,
              communication: true,
              accuracy: true,
              speed: true,
              reliability: true,
              technicalSkills: true,
              professionalism: true,
              aiSummary: true,
              evaluatedAt: true,
            },
            orderBy: { evaluatedAt: "desc" },
            take: 1,
          },
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
          company: true,
          description: true,
          location: true,
          type: true,
          salaryRange: true,
          isInternship: true,
          skills: true,
          requirements: true,
        },
      },
    },
  });

  return application;
}

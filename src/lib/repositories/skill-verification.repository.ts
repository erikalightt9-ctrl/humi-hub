import { prisma } from "@/lib/prisma";
import type { SkillType } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VerifiedSkillRecord {
  readonly id: string;
  readonly studentId: string;
  readonly skillType: SkillType;
  readonly level: number;
  readonly evidence: string;
  readonly verifiedAt: Date;
}

export interface CareerReadinessData {
  readonly communication: number | null;
  readonly accuracy: number | null;
  readonly speed: number | null;
  readonly technicalSkills: number | null;
  readonly professionalism: number | null;
}

export interface SimulationAverages {
  readonly overallScore: number | null;
  readonly communicationScore: number | null;
  readonly problemSolvingScore: number | null;
  readonly professionalismScore: number | null;
}

export interface InterviewAverages {
  readonly overallScore: number | null;
  readonly communicationScore: number | null;
  readonly problemSolvingScore: number | null;
  readonly professionalismScore: number | null;
}

export interface EmailPracticeAverages {
  readonly overallScore: number | null;
  readonly toneScore: number | null;
  readonly clarityScore: number | null;
}

export interface SkillDataForVerification {
  readonly careerReadiness: CareerReadinessData | null;
  readonly simulation: SimulationAverages;
  readonly interview: InterviewAverages;
  readonly emailPractice: EmailPracticeAverages;
  readonly quizAverage: number | null;
  readonly assignmentAverage: number | null;
  readonly badgesCount: number;
}

export interface PublicVerifiedSkillData {
  readonly studentName: string;
  readonly courseTitle: string;
  readonly skills: ReadonlyArray<VerifiedSkillRecord>;
}

/* ------------------------------------------------------------------ */
/*  Read — Get verified skills for a student                           */
/* ------------------------------------------------------------------ */

export async function getVerifiedSkills(
  studentId: string,
): Promise<ReadonlyArray<VerifiedSkillRecord>> {
  const skills = await prisma.verifiedSkill.findMany({
    where: { studentId },
    orderBy: { skillType: "asc" },
  });

  return skills;
}

/* ------------------------------------------------------------------ */
/*  Read — Aggregate data from all sources for skill verification      */
/* ------------------------------------------------------------------ */

export async function getSkillDataForVerification(
  studentId: string,
): Promise<SkillDataForVerification> {
  const [
    latestCareerScore,
    simulationAgg,
    interviewAgg,
    emailPracticeAgg,
    quizAgg,
    assignmentAgg,
    badgesCount,
  ] = await Promise.all([
    // CareerReadinessScore: latest values
    prisma.careerReadinessScore.findFirst({
      where: { studentId },
      orderBy: { evaluatedAt: "desc" },
      select: {
        communication: true,
        accuracy: true,
        speed: true,
        technicalSkills: true,
        professionalism: true,
      },
    }),

    // SimulationSession: average of completed sessions
    prisma.simulationSession.aggregate({
      where: { studentId, status: "completed" },
      _avg: {
        overallScore: true,
        communicationScore: true,
        problemSolvingScore: true,
        professionalismScore: true,
      },
    }),

    // InterviewSession: average of completed sessions
    prisma.interviewSession.aggregate({
      where: { studentId, status: "completed" },
      _avg: {
        overallScore: true,
        communicationScore: true,
        problemSolvingScore: true,
        professionalismScore: true,
      },
    }),

    // EmailPracticeSession: average of evaluated sessions
    prisma.emailPracticeSession.aggregate({
      where: { studentId, status: "evaluated" },
      _avg: {
        overallScore: true,
        toneScore: true,
        clarityScore: true,
      },
    }),

    // QuizAttempt: average score
    prisma.quizAttempt.aggregate({
      where: { studentId },
      _avg: { score: true },
    }),

    // Submission: average grade (where grade is not null)
    prisma.submission.aggregate({
      where: { studentId, grade: { not: null } },
      _avg: { grade: true },
    }),

    // StudentBadge: count of unique badges
    prisma.studentBadge.count({
      where: { studentId },
    }),
  ]);

  return {
    careerReadiness: latestCareerScore
      ? {
          communication: latestCareerScore.communication,
          accuracy: latestCareerScore.accuracy,
          speed: latestCareerScore.speed,
          technicalSkills: latestCareerScore.technicalSkills,
          professionalism: latestCareerScore.professionalism,
        }
      : null,
    simulation: {
      overallScore: simulationAgg._avg.overallScore ?? null,
      communicationScore: simulationAgg._avg.communicationScore ?? null,
      problemSolvingScore: simulationAgg._avg.problemSolvingScore ?? null,
      professionalismScore: simulationAgg._avg.professionalismScore ?? null,
    },
    interview: {
      overallScore: interviewAgg._avg.overallScore ?? null,
      communicationScore: interviewAgg._avg.communicationScore ?? null,
      problemSolvingScore: interviewAgg._avg.problemSolvingScore ?? null,
      professionalismScore: interviewAgg._avg.professionalismScore ?? null,
    },
    emailPractice: {
      overallScore: emailPracticeAgg._avg.overallScore ?? null,
      toneScore: emailPracticeAgg._avg.toneScore ?? null,
      clarityScore: emailPracticeAgg._avg.clarityScore ?? null,
    },
    quizAverage: quizAgg._avg.score ?? null,
    assignmentAverage: assignmentAgg._avg.grade ?? null,
    badgesCount,
  };
}

/* ------------------------------------------------------------------ */
/*  Write — Upsert a verified skill                                    */
/* ------------------------------------------------------------------ */

interface UpsertSkillInput {
  readonly studentId: string;
  readonly skillType: SkillType;
  readonly level: number;
  readonly evidence: string;
}

export async function upsertVerifiedSkill(
  input: UpsertSkillInput,
): Promise<VerifiedSkillRecord> {
  const skill = await prisma.verifiedSkill.upsert({
    where: {
      studentId_skillType: {
        studentId: input.studentId,
        skillType: input.skillType,
      },
    },
    create: {
      studentId: input.studentId,
      skillType: input.skillType,
      level: input.level,
      evidence: input.evidence,
    },
    update: {
      level: input.level,
      evidence: input.evidence,
      verifiedAt: new Date(),
    },
  });

  return skill;
}

/* ------------------------------------------------------------------ */
/*  Read — Last verification timestamp (for rate limiting)             */
/* ------------------------------------------------------------------ */

export async function getLastVerificationTimestamp(
  studentId: string,
): Promise<Date | null> {
  const latest = await prisma.verifiedSkill.findFirst({
    where: { studentId },
    orderBy: { verifiedAt: "desc" },
    select: { verifiedAt: true },
  });

  return latest?.verifiedAt ?? null;
}

/* ------------------------------------------------------------------ */
/*  Read — Public verified skills (only if portfolioPublic is true)    */
/* ------------------------------------------------------------------ */

export async function getPublicVerifiedSkills(
  studentId: string,
): Promise<PublicVerifiedSkillData | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      portfolioPublic: true,
      enrollment: {
        select: {
          course: {
            select: { title: true },
          },
        },
      },
      verifiedSkills: {
        orderBy: { skillType: "asc" },
      },
    },
  });

  if (!student || !student.portfolioPublic) {
    return null;
  }

  return {
    studentName: student.name,
    courseTitle: student.enrollment.course.title,
    skills: student.verifiedSkills,
  };
}

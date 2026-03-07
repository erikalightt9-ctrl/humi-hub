import type { SkillType } from "@prisma/client";
import {
  getSkillDataForVerification,
  getLastVerificationTimestamp,
  upsertVerifiedSkill,
  type SkillDataForVerification,
  type VerifiedSkillRecord,
} from "@/lib/repositories/skill-verification.repository";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const TOTAL_BADGE_TYPES = 6;

/** score 0-19 = level 1, 20-39 = level 2, 40-59 = level 3, 60-79 = level 4, 80-100 = level 5 */
function scoreToLevel(score: number): number {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= 80) return 5;
  if (clamped >= 60) return 4;
  if (clamped >= 40) return 3;
  if (clamped >= 20) return 2;
  return 1;
}

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/* ------------------------------------------------------------------ */

export async function canRefreshSkills(studentId: string): Promise<boolean> {
  const lastTimestamp = await getLastVerificationTimestamp(studentId);
  if (!lastTimestamp) return true;

  const elapsed = Date.now() - lastTimestamp.getTime();
  return elapsed >= COOLDOWN_MS;
}

export async function getHoursUntilRefresh(
  studentId: string,
): Promise<number> {
  const lastTimestamp = await getLastVerificationTimestamp(studentId);
  if (!lastTimestamp) return 0;

  const elapsed = Date.now() - lastTimestamp.getTime();
  const remaining = COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / (1000 * 60 * 60)) : 0;
}

/* ------------------------------------------------------------------ */
/*  Skill calculations                                                 */
/* ------------------------------------------------------------------ */

interface SkillCalculation {
  readonly skillType: SkillType;
  readonly score: number;
  readonly evidence: string;
}

function calculateSkills(
  data: SkillDataForVerification,
): ReadonlyArray<SkillCalculation> {
  return [
    calculateCommunication(data),
    calculateTechnical(data),
    calculateTimeManagement(data),
    calculateProblemSolving(data),
    calculateProfessionalism(data),
    calculateAccuracy(data),
    calculateToolProficiency(data),
    calculateClientManagement(data),
  ];
}

function calculateCommunication(
  data: SkillDataForVerification,
): SkillCalculation {
  const sources: Array<{ readonly value: number; readonly label: string }> = [];

  if (data.careerReadiness?.communication !== null && data.careerReadiness?.communication !== undefined) {
    sources.push({
      value: data.careerReadiness.communication,
      label: `career readiness communication score of ${data.careerReadiness.communication}`,
    });
  }
  if (data.simulation.communicationScore !== null) {
    sources.push({
      value: data.simulation.communicationScore,
      label: `simulation communication score of ${Math.round(data.simulation.communicationScore)}`,
    });
  }
  if (data.interview.communicationScore !== null) {
    sources.push({
      value: data.interview.communicationScore,
      label: `interview communication score of ${Math.round(data.interview.communicationScore)}`,
    });
  }
  if (data.emailPractice.toneScore !== null) {
    sources.push({
      value: data.emailPractice.toneScore,
      label: `email practice tone score of ${Math.round(data.emailPractice.toneScore)}`,
    });
  }

  const avg = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.value, 0) / sources.length
    : 0;

  const evidence = sources.length > 0
    ? `Based on ${sources.map((s) => s.label).join(", ")}`
    : "No communication data available yet";

  return { skillType: "COMMUNICATION", score: avg, evidence };
}

function calculateTechnical(
  data: SkillDataForVerification,
): SkillCalculation {
  const score = data.careerReadiness?.technicalSkills ?? 0;
  const evidence = data.careerReadiness?.technicalSkills !== null &&
    data.careerReadiness?.technicalSkills !== undefined
    ? `Based on career readiness technical skills score of ${score}`
    : "No technical skills data available yet";

  return { skillType: "TECHNICAL", score, evidence };
}

function calculateTimeManagement(
  data: SkillDataForVerification,
): SkillCalculation {
  const score = data.careerReadiness?.speed ?? 0;
  const evidence = data.careerReadiness?.speed !== null &&
    data.careerReadiness?.speed !== undefined
    ? `Based on career readiness speed score of ${score}`
    : "No time management data available yet";

  return { skillType: "TIME_MANAGEMENT", score, evidence };
}

function calculateProblemSolving(
  data: SkillDataForVerification,
): SkillCalculation {
  const sources: Array<{ readonly value: number; readonly label: string }> = [];

  if (data.simulation.problemSolvingScore !== null) {
    sources.push({
      value: data.simulation.problemSolvingScore,
      label: `simulation problem-solving score of ${Math.round(data.simulation.problemSolvingScore)}`,
    });
  }
  if (data.interview.problemSolvingScore !== null) {
    sources.push({
      value: data.interview.problemSolvingScore,
      label: `interview problem-solving score of ${Math.round(data.interview.problemSolvingScore)}`,
    });
  }

  const avg = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.value, 0) / sources.length
    : 0;

  const evidence = sources.length > 0
    ? `Based on ${sources.map((s) => s.label).join(" and ")}`
    : "No problem-solving data available yet";

  return { skillType: "PROBLEM_SOLVING", score: avg, evidence };
}

function calculateProfessionalism(
  data: SkillDataForVerification,
): SkillCalculation {
  const sources: Array<{ readonly value: number; readonly label: string }> = [];

  if (data.careerReadiness?.professionalism !== null && data.careerReadiness?.professionalism !== undefined) {
    sources.push({
      value: data.careerReadiness.professionalism,
      label: `career readiness professionalism score of ${data.careerReadiness.professionalism}`,
    });
  }
  if (data.interview.professionalismScore !== null) {
    sources.push({
      value: data.interview.professionalismScore,
      label: `interview professionalism score of ${Math.round(data.interview.professionalismScore)}`,
    });
  }
  if (data.simulation.professionalismScore !== null) {
    sources.push({
      value: data.simulation.professionalismScore,
      label: `simulation professionalism score of ${Math.round(data.simulation.professionalismScore)}`,
    });
  }

  const avg = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.value, 0) / sources.length
    : 0;

  const evidence = sources.length > 0
    ? `Based on ${sources.map((s) => s.label).join(", ")}`
    : "No professionalism data available yet";

  return { skillType: "PROFESSIONALISM", score: avg, evidence };
}

function calculateAccuracy(
  data: SkillDataForVerification,
): SkillCalculation {
  const sources: Array<{ readonly value: number; readonly label: string }> = [];

  if (data.quizAverage !== null) {
    sources.push({
      value: data.quizAverage,
      label: `quiz average of ${Math.round(data.quizAverage)}`,
    });
  }
  if (data.assignmentAverage !== null) {
    sources.push({
      value: data.assignmentAverage,
      label: `assignment average of ${Math.round(data.assignmentAverage)}`,
    });
  }

  const avg = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.value, 0) / sources.length
    : 0;

  const evidence = sources.length > 0
    ? `Based on ${sources.map((s) => s.label).join(" and ")}`
    : "No accuracy data available yet";

  return { skillType: "ACCURACY", score: avg, evidence };
}

function calculateToolProficiency(
  data: SkillDataForVerification,
): SkillCalculation {
  const raw = (data.badgesCount / TOTAL_BADGE_TYPES) * 100;
  const score = Math.min(100, raw);

  const evidence = data.badgesCount > 0
    ? `Based on ${data.badgesCount} of ${TOTAL_BADGE_TYPES} badges earned (${Math.round(score)}%)`
    : "No badges earned yet";

  return { skillType: "TOOL_PROFICIENCY", score, evidence };
}

function calculateClientManagement(
  data: SkillDataForVerification,
): SkillCalculation {
  const sources: Array<{ readonly value: number; readonly label: string }> = [];

  if (data.emailPractice.overallScore !== null) {
    sources.push({
      value: data.emailPractice.overallScore,
      label: `email practice overall score of ${Math.round(data.emailPractice.overallScore)}`,
    });
  }
  if (data.simulation.overallScore !== null) {
    sources.push({
      value: data.simulation.overallScore,
      label: `simulation overall score of ${Math.round(data.simulation.overallScore)}`,
    });
  }

  const avg = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.value, 0) / sources.length
    : 0;

  const evidence = sources.length > 0
    ? `Based on ${sources.map((s) => s.label).join(" and ")}`
    : "No client management data available yet";

  return { skillType: "CLIENT_MANAGEMENT", score: avg, evidence };
}

/* ------------------------------------------------------------------ */
/*  Main verification function                                         */
/* ------------------------------------------------------------------ */

export async function verifyStudentSkills(
  studentId: string,
): Promise<ReadonlyArray<VerifiedSkillRecord>> {
  // 1. Check cooldown
  const allowed = await canRefreshSkills(studentId);
  if (!allowed) {
    throw new Error(
      "Skills can only be refreshed once every 24 hours",
    );
  }

  // 2. Get all skill data
  const skillData = await getSkillDataForVerification(studentId);

  // 3. Calculate levels for each skill
  const calculations = calculateSkills(skillData);

  // 4. Upsert all 8 skills
  const results = await Promise.all(
    calculations.map((calc) =>
      upsertVerifiedSkill({
        studentId,
        skillType: calc.skillType as SkillType,
        level: scoreToLevel(calc.score),
        evidence: calc.evidence,
      }),
    ),
  );

  return results;
}

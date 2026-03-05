import { generateJsonCompletion } from "@/lib/services/openai.service";
import {
  getStudentProfileForMatching,
  getJobPostings,
  getLastMatchTimestamp,
  saveMatch,
  getStudentMatches,
} from "@/lib/repositories/job-matching.repository";
import type { JobMatchRecord, JobPostingRecord } from "@/lib/types/ai.types";
import type { StudentProfileForMatching } from "@/lib/repositories/job-matching.repository";

/* ------------------------------------------------------------------ */
/*  Rate limit check                                                   */
/* ------------------------------------------------------------------ */

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function canRunMatching(studentId: string): Promise<boolean> {
  const lastRun = await getLastMatchTimestamp(studentId);
  if (!lastRun) return true;

  const elapsed = Date.now() - lastRun.getTime();
  return elapsed >= COOLDOWN_MS;
}

/* ------------------------------------------------------------------ */
/*  AI prompt                                                          */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an AI job matching engine for a Virtual Assistant training platform.

You will receive a student profile and a job posting. Your task is to evaluate how well the student matches the job requirements.

Score the match from 0 to 100 based on:
- **Course alignment** (30%): Does the student's training course align with the job's field?
- **Skills match** (25%): How many of the required skills does the student possess?
- **Academic performance** (20%): Quiz and assignment scores indicate competence.
- **Progress & engagement** (15%): Lesson completion rate and badges show dedication.
- **Tools familiarity** (10%): Does the student know the tools needed for the job?

Provide a concise **reasoning** (2-3 sentences) explaining the match score, highlighting strengths and gaps.

Respond with a JSON object matching this exact structure:
{
  "matchScore": number,
  "reasoning": "string"
}`;

/* ------------------------------------------------------------------ */
/*  AI match result type                                               */
/* ------------------------------------------------------------------ */

interface AIMatchResult {
  readonly matchScore: number;
  readonly reasoning: string;
}

/* ------------------------------------------------------------------ */
/*  Score a single student-job pair                                    */
/* ------------------------------------------------------------------ */

async function scoreStudentJobMatch(
  profile: StudentProfileForMatching,
  job: JobPostingRecord,
): Promise<AIMatchResult> {
  const completionPercent =
    profile.totalLessons > 0
      ? Math.round((profile.lessonsCompleted / profile.totalLessons) * 100)
      : 0;

  const userPrompt = `Evaluate this student-job match:

**STUDENT PROFILE**:
- Name: ${profile.name}
- Course: ${profile.courseTitle} (${profile.courseSlug})
- Quiz Average: ${profile.quizAverage}%
- Assignment Average: ${profile.assignmentAverage}/100
- Lessons Completed: ${profile.lessonsCompleted}/${profile.totalLessons} (${completionPercent}%)
- Badges Earned: ${profile.badgeNames.length > 0 ? profile.badgeNames.join(", ") : "None yet"}
- Total Points: ${profile.totalPoints}
- Technical Skills: ${profile.technicalSkills.length > 0 ? profile.technicalSkills.join(", ") : "Not specified"}
- Tools Familiar With: ${profile.toolsFamiliarity.length > 0 ? profile.toolsFamiliarity.join(", ") : "Not specified"}

**JOB POSTING**:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Type: ${job.type}
- Required Skills: ${job.skills.join(", ")}
- Requirements: ${job.requirements.join("; ")}
- Course Preference: ${job.courseSlug ?? "Any VA background"}

Please evaluate the match and provide a score and reasoning.`;

  const result = await generateJsonCompletion<AIMatchResult>(
    SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.4, maxTokens: 256 },
  );

  return {
    matchScore: clampScore(result.matchScore),
    reasoning: result.reasoning || "Match evaluated.",
  };
}

/* ------------------------------------------------------------------ */
/*  Orchestrate matching for a student                                 */
/* ------------------------------------------------------------------ */

const MIN_MATCH_SCORE = 40;

export async function matchStudentToJobs(
  studentId: string,
): Promise<ReadonlyArray<JobMatchRecord>> {
  const profile = await getStudentProfileForMatching(studentId);
  if (!profile) {
    throw new Error("Student not found or has no enrollment data");
  }

  const allActiveJobs = await getJobPostings({ isActive: true });
  if (allActiveJobs.length === 0) {
    return [];
  }

  // Prioritize jobs matching the student's course, but include all active jobs
  const sortedJobs = sortJobsByRelevance(allActiveJobs, profile.courseSlug);

  // Score each job against the student profile
  const matchResults: Array<{
    readonly job: JobPostingRecord;
    readonly score: number;
    readonly reasoning: string;
  }> = [];

  for (const job of sortedJobs) {
    try {
      const result = await scoreStudentJobMatch(profile, job);
      matchResults.push({
        job,
        score: result.matchScore,
        reasoning: result.reasoning,
      });
    } catch (err) {
      console.error(
        `[AI Job Matching] Failed to score job ${job.id}:`,
        err,
      );
      // Skip this job and continue with others
    }
  }

  // Save matches that meet the minimum score threshold
  const savedMatches: JobMatchRecord[] = [];

  for (const result of matchResults) {
    if (result.score >= MIN_MATCH_SCORE) {
      try {
        const saved = await saveMatch(
          studentId,
          result.job.id,
          result.score,
          result.reasoning,
        );
        savedMatches.push(saved);
      } catch (err) {
        console.error(
          `[AI Job Matching] Failed to save match for job ${result.job.id}:`,
          err,
        );
      }
    }
  }

  // Return all matches sorted by score descending
  const allMatches = await getStudentMatches(studentId);
  return allMatches;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function sortJobsByRelevance(
  jobs: ReadonlyArray<JobPostingRecord>,
  studentCourseSlug: string,
): ReadonlyArray<JobPostingRecord> {
  const courseMatches: JobPostingRecord[] = [];
  const others: JobPostingRecord[] = [];

  for (const job of jobs) {
    if (job.courseSlug === studentCourseSlug) {
      courseMatches.push(job);
    } else {
      others.push(job);
    }
  }

  return [...courseMatches, ...others];
}

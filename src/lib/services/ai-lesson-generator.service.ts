import type { CourseTier } from "@prisma/client";
import { generateJsonCompletion } from "@/lib/services/openai.service";
import { bulkCreateLessons } from "@/lib/repositories/lesson.repository";
import { COURSE_TIER_MODULES } from "@/lib/constants/course-tiers";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GeneratedModule {
  readonly title: string;
  readonly learningObjectives: readonly string[];
  readonly content: string;
  readonly exercise: string;
  readonly quiz: string;
  readonly resources: string;
  readonly durationMin: number;
}

interface AIGenerationResult {
  readonly modules: readonly GeneratedModule[];
}

interface GenerationInput {
  readonly courseId: string;
  readonly courseTitle: string;
  readonly courseDescription: string;
  readonly tier: CourseTier;
}

interface GenerationOutput {
  readonly tier: CourseTier;
  readonly lessonsCreated: number;
}

/* ------------------------------------------------------------------ */
/*  System prompt                                                      */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(tier: CourseTier): string {
  const modules = COURSE_TIER_MODULES[tier];
  const tierLabel = tier.charAt(0) + tier.slice(1).toLowerCase();

  return `You are an expert curriculum designer for professional training programs.
Your task is to generate structured lesson modules for the "${tierLabel}" tier of a course.

Each tier has specific module categories:
${modules.map((m, i) => `${i + 1}. ${m}`).join("\n")}

For EACH module category, generate a complete lesson module with:
- title: A specific, descriptive lesson title (not just the category name)
- learningObjectives: 3-5 measurable objectives starting with action verbs
- content: Comprehensive lesson content (500-800 words) with headings and key points
- exercise: A practical exercise with clear instructions (200-300 words)
- quiz: 3-5 quiz questions in this format: "Q: question? A: answer" (one per line)
- resources: 2-4 recommended resources (books, websites, tools) with brief descriptions
- durationMin: Estimated lesson duration in minutes (30-60)

Return a JSON object with this exact structure:
{
  "modules": [
    {
      "title": "string",
      "learningObjectives": ["string"],
      "content": "string",
      "exercise": "string",
      "quiz": "string",
      "resources": "string",
      "durationMin": number
    }
  ]
}

Generate exactly ${modules.length} modules, one for each category listed above.
Make content industry-specific, practical, and progressively complex within the tier.`;
}

/* ------------------------------------------------------------------ */
/*  User prompt                                                        */
/* ------------------------------------------------------------------ */

function buildUserPrompt(
  courseTitle: string,
  courseDescription: string,
  tier: CourseTier,
): string {
  const tierLabel = tier.charAt(0) + tier.slice(1).toLowerCase();
  return `Generate ${tierLabel} tier lesson modules for this course:

Course: ${courseTitle}
Description: ${courseDescription}

Create ${COURSE_TIER_MODULES[tier].length} structured lesson modules that are specific to this course topic and appropriate for the ${tierLabel} difficulty level.`;
}

/* ------------------------------------------------------------------ */
/*  Format AI content into a single lesson content block               */
/* ------------------------------------------------------------------ */

function formatLessonContent(module: GeneratedModule): string {
  const objectives = module.learningObjectives
    .map((obj) => `• ${obj}`)
    .join("\n");

  return `## Learning Objectives
${objectives}

## Lesson Content
${module.content}

## Exercise
${module.exercise}

## Quiz
${module.quiz}

## Resources
${module.resources}`;
}

/* ------------------------------------------------------------------ */
/*  Generate lessons for a single tier                                 */
/* ------------------------------------------------------------------ */

export async function generateLessonsForTier(
  input: GenerationInput,
): Promise<GenerationOutput> {
  const systemPrompt = buildSystemPrompt(input.tier);
  const userPrompt = buildUserPrompt(
    input.courseTitle,
    input.courseDescription,
    input.tier,
  );

  const result = await generateJsonCompletion<AIGenerationResult>(
    systemPrompt,
    userPrompt,
    { maxTokens: 12000, temperature: 0.7 },
  );

  if (!result.modules || result.modules.length === 0) {
    throw new Error(`AI returned no modules for tier ${input.tier}`);
  }

  const tierOrderOffset = getTierOrderOffset(input.tier);

  const lessonsToInsert = result.modules.map((module, index) => ({
    courseId: input.courseId,
    title: module.title,
    content: formatLessonContent(module),
    order: tierOrderOffset + index + 1,
    durationMin: module.durationMin || 40,
    tier: input.tier,
    isPublished: false,
    isFreePreview: false,
  }));

  const { count } = await bulkCreateLessons(lessonsToInsert);

  return { tier: input.tier, lessonsCreated: count };
}

/* ------------------------------------------------------------------ */
/*  Generate lessons for all tiers                                     */
/* ------------------------------------------------------------------ */

export async function generateLessonsForAllTiers(
  courseId: string,
  courseTitle: string,
  courseDescription: string,
): Promise<readonly GenerationOutput[]> {
  const tiers: readonly CourseTier[] = ["BASIC", "PROFESSIONAL", "ADVANCED"];
  const results: GenerationOutput[] = [];

  for (const tier of tiers) {
    const result = await generateLessonsForTier({
      courseId,
      courseTitle,
      courseDescription,
      tier,
    });
    results.push(result);
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Tier order offset (so lessons don't overlap across tiers)          */
/* ------------------------------------------------------------------ */

function getTierOrderOffset(tier: CourseTier): number {
  switch (tier) {
    case "BASIC":
      return 0;
    case "PROFESSIONAL":
      return 100;
    case "ADVANCED":
      return 200;
  }
}

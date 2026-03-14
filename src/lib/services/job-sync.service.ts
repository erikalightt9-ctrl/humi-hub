import { upsertExternalJob } from "@/lib/repositories/job-matching.repository";
import { COURSE_SKILL_MAPPINGS } from "@/lib/constants/job-skill-mappings";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SyncResult {
  readonly synced: number;
  readonly skipped: number;
  readonly errors: number;
}

interface SyncAllResult {
  readonly remotive: SyncResult;
  readonly jsearch: SyncResult;
  readonly total: {
    readonly synced: number;
    readonly skipped: number;
    readonly errors: number;
  };
}

/** Shape of a single job from Remotive API */
interface RemotiveJob {
  readonly id: number;
  readonly title: string;
  readonly company_name: string;
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
  readonly job_type: string;
  readonly url: string;
  readonly salary: string;
  readonly category: string;
  readonly publication_date: string;
}

interface RemotiveResponse {
  readonly jobs: ReadonlyArray<RemotiveJob>;
}

/** Shape of a single job from JSearch API */
interface JSearchJob {
  readonly job_id: string;
  readonly job_title: string;
  readonly employer_name: string;
  readonly job_description: string;
  readonly job_employment_type: string;
  readonly job_apply_link: string;
  readonly job_city: string;
  readonly job_state: string;
  readonly job_country: string;
  readonly job_min_salary: number | null;
  readonly job_max_salary: number | null;
  readonly job_salary_currency: string | null;
  readonly job_is_remote: boolean;
  readonly job_required_skills: ReadonlyArray<string> | null;
}

interface JSearchResponse {
  readonly status: string;
  readonly data: ReadonlyArray<JSearchJob>;
}

interface ExternalJobInput {
  readonly title: string;
  readonly company: string;
  readonly description: string;
  readonly requirements: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<string>;
  readonly courseSlug: string | null;
  readonly location: string;
  readonly type: string;
  readonly salaryRange: string | null;
  readonly industry: string | null;
  readonly externalId: string;
  readonly externalSource: string;
  readonly externalUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Skill-to-course matcher                                            */
/* ------------------------------------------------------------------ */

/**
 * Given a job's title + tags/skills, determine the best-matching courseSlug.
 * Returns null if no course matches strongly.
 */
function matchCourseSlug(
  title: string,
  tags: ReadonlyArray<string>,
): string | null {
  const searchText = [title, ...tags].join(" ").toLowerCase();

  let bestSlug: string | null = null;
  let bestCount = 0;

  for (const [slug, keywords] of Object.entries(COURSE_SKILL_MAPPINGS)) {
    const matchCount = keywords.filter((keyword) =>
      searchText.includes(keyword.toLowerCase()),
    ).length;

    if (matchCount > bestCount) {
      bestCount = matchCount;
      bestSlug = slug;
    }
  }

  // Require at least 2 keyword matches to assign a course
  return bestCount >= 2 ? bestSlug : null;
}

/* ------------------------------------------------------------------ */
/*  Remotive job-type mapper                                           */
/* ------------------------------------------------------------------ */

function mapRemotiveJobType(remoteType: string): string {
  const normalized = remoteType.toLowerCase().trim();
  if (normalized.includes("full_time") || normalized.includes("full-time")) {
    return "full-time";
  }
  if (normalized.includes("part_time") || normalized.includes("part-time")) {
    return "part-time";
  }
  if (normalized.includes("freelance")) return "freelance";
  if (normalized.includes("contract")) return "contract";
  if (normalized.includes("internship")) return "internship";
  return "freelance";
}

/* ------------------------------------------------------------------ */
/*  JSearch job-type mapper                                            */
/* ------------------------------------------------------------------ */

function mapJSearchJobType(employmentType: string): string {
  const normalized = employmentType.toLowerCase().trim();
  if (normalized.includes("fulltime") || normalized.includes("full_time") || normalized.includes("full-time")) {
    return "full-time";
  }
  if (normalized.includes("parttime") || normalized.includes("part_time") || normalized.includes("part-time")) {
    return "part-time";
  }
  if (normalized.includes("contractor") || normalized.includes("contract")) {
    return "contract";
  }
  if (normalized.includes("intern")) return "internship";
  return "freelance";
}

/* ------------------------------------------------------------------ */
/*  Strip HTML tags from description                                   */
/* ------------------------------------------------------------------ */

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/*  Salary range formatter                                             */
/* ------------------------------------------------------------------ */

function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string | null {
  if (!min && !max) return null;
  const curr = currency ?? "USD";
  if (min && max) return `${curr} ${min.toLocaleString()}-${max.toLocaleString()}`;
  if (min) return `${curr} ${min.toLocaleString()}+`;
  return `${curr} up to ${max!.toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/*  Industry guesser from category                                     */
/* ------------------------------------------------------------------ */

function guessIndustry(category: string, title: string): string | null {
  const combined = `${category} ${title}`.toLowerCase();
  if (combined.includes("health") || combined.includes("medical")) return "Healthcare";
  if (combined.includes("finance") || combined.includes("account") || combined.includes("bookkeep")) {
    return "Finance & Accounting";
  }
  if (combined.includes("real estate") || combined.includes("property")) return "Real Estate";
  if (combined.includes("ecommerce") || combined.includes("e-commerce") || combined.includes("retail") || combined.includes("shop")) {
    return "E-commerce & Retail";
  }
  if (combined.includes("tech") || combined.includes("software") || combined.includes("data") || combined.includes("devops")) {
    return "Technology";
  }
  if (combined.includes("market") || combined.includes("seo") || combined.includes("content") || combined.includes("social")) {
    return "Marketing & Advertising";
  }
  if (combined.includes("legal") || combined.includes("law")) return "Legal";
  if (combined.includes("educat") || combined.includes("teach") || combined.includes("tutor")) return "Education";
  return null;
}

/* ------------------------------------------------------------------ */
/*  Sync from Remotive (free, no API key)                              */
/* ------------------------------------------------------------------ */

const REMOTIVE_SEARCH_QUERIES: ReadonlyArray<string> = [
  "virtual assistant",
  "administrative assistant remote",
  "data entry remote",
  "customer support remote",
  "bookkeeping remote",
];

export async function syncFromRemotive(): Promise<SyncResult> {
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const query of REMOTIVE_SEARCH_QUERIES) {
    try {
      const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=20`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        console.error(`[Remotive] HTTP ${response.status} for query "${query}"`);
        errors++;
        continue;
      }

      const data: RemotiveResponse = await response.json();

      for (const job of data.jobs) {
        try {
          const plainDescription = stripHtml(job.description).slice(0, 5000);
          const skills = job.tags.length > 0 ? [...job.tags] : extractSkillsFromText(plainDescription);

          const input: ExternalJobInput = {
            title: job.title.slice(0, 200),
            company: job.company_name.slice(0, 200),
            description: plainDescription,
            requirements: extractRequirementsFromText(plainDescription),
            skills,
            courseSlug: matchCourseSlug(job.title, job.tags),
            location: "Remote",
            type: mapRemotiveJobType(job.job_type),
            salaryRange: job.salary || null,
            industry: guessIndustry(job.category, job.title),
            externalId: String(job.id),
            externalSource: "remotive",
            externalUrl: job.url,
          };

          const result = await upsertExternalJob(input);
          if (result.created) {
            synced++;
          } else {
            skipped++;
          }
        } catch (err) {
          console.error(`[Remotive] Error upserting job ${job.id}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error(`[Remotive] Fetch error for query "${query}":`, err);
      errors++;
    }
  }

  return { synced, skipped, errors };
}

/* ------------------------------------------------------------------ */
/*  Sync from JSearch (RapidAPI free tier — 500 req/month)             */
/* ------------------------------------------------------------------ */

const JSEARCH_QUERIES: ReadonlyArray<string> = [
  "virtual assistant remote",
  "bookkeeping remote",
  "medical virtual assistant",
];

export async function syncFromJSearch(): Promise<SyncResult> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    console.warn("[JSearch] RAPIDAPI_KEY not configured, skipping sync");
    return { synced: 0, skipped: 0, errors: 0 };
  }

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const query of JSEARCH_QUERIES) {
    try {
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&page=1`;

      const response = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        console.error(`[JSearch] HTTP ${response.status} for query "${query}"`);
        errors++;
        continue;
      }

      const data: JSearchResponse = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        console.warn(`[JSearch] No data array for query "${query}"`);
        continue;
      }

      for (const job of data.data) {
        try {
          const plainDescription = stripHtml(job.job_description ?? "").slice(0, 5000);
          const skills = job.job_required_skills?.length
            ? [...job.job_required_skills]
            : extractSkillsFromText(plainDescription);

          const location = job.job_is_remote
            ? "Remote"
            : [job.job_city, job.job_state, job.job_country]
                .filter(Boolean)
                .join(", ") || "Remote";

          const input: ExternalJobInput = {
            title: job.job_title.slice(0, 200),
            company: job.employer_name.slice(0, 200),
            description: plainDescription,
            requirements: extractRequirementsFromText(plainDescription),
            skills,
            courseSlug: matchCourseSlug(job.job_title, skills),
            location: location.slice(0, 200),
            type: mapJSearchJobType(job.job_employment_type ?? ""),
            salaryRange: formatSalaryRange(
              job.job_min_salary,
              job.job_max_salary,
              job.job_salary_currency,
            ),
            industry: guessIndustry("", job.job_title),
            externalId: job.job_id,
            externalSource: "jsearch",
            externalUrl: job.job_apply_link ?? "",
          };

          const result = await upsertExternalJob(input);
          if (result.created) {
            synced++;
          } else {
            skipped++;
          }
        } catch (err) {
          console.error(`[JSearch] Error upserting job ${job.job_id}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error(`[JSearch] Fetch error for query "${query}":`, err);
      errors++;
    }
  }

  return { synced, skipped, errors };
}

/* ------------------------------------------------------------------ */
/*  Sync all sources                                                   */
/* ------------------------------------------------------------------ */

export async function syncAllSources(): Promise<SyncAllResult> {
  const [remotive, jsearch] = await Promise.all([
    syncFromRemotive(),
    syncFromJSearch(),
  ]);

  return {
    remotive,
    jsearch,
    total: {
      synced: remotive.synced + jsearch.synced,
      skipped: remotive.skipped + jsearch.skipped,
      errors: remotive.errors + jsearch.errors,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Text extraction helpers                                            */
/* ------------------------------------------------------------------ */

const COMMON_VA_SKILLS: ReadonlyArray<string> = [
  "data entry", "scheduling", "email management", "customer support",
  "CRM", "Excel", "Google Sheets", "QuickBooks", "social media",
  "project management", "communication", "typing", "research",
  "calendar management", "travel booking", "invoicing",
];

function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  return COMMON_VA_SKILLS.filter((skill) =>
    lower.includes(skill.toLowerCase()),
  ).slice(0, 10);
}

function extractRequirementsFromText(text: string): string[] {
  // Look for bullet points or numbered items that look like requirements
  const lines = text.split(/[.\n]/).filter((l) => l.trim().length > 10);
  const reqPatterns = /(?:require|must|experience|proficien|knowledge|familiar|ability)/i;

  const requirements = lines
    .filter((line) => reqPatterns.test(line))
    .map((line) => line.trim().slice(0, 200))
    .slice(0, 5);

  // Fallback: return a generic requirement
  if (requirements.length === 0) {
    return ["Virtual assistant experience preferred"];
  }

  return requirements;
}

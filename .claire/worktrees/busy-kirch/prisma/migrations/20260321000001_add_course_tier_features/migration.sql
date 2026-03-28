-- Add tier features arrays and popularTier to courses table
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "featuresBasic" TEXT[] NOT NULL DEFAULT ARRAY['Introduction modules', 'Core concept lessons', 'Beginner exercises', 'Simple quizzes', 'Basic certificate'];
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "featuresProfessional" TEXT[] NOT NULL DEFAULT ARRAY['Everything in Basic', 'Case studies', 'Hands-on exercises', 'Applied quizzes', 'Professional certificate', 'Community access'];
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "featuresAdvanced" TEXT[] NOT NULL DEFAULT ARRAY['Everything in Professional', 'Industry tools training', 'Real-world scenarios', 'Mastery assessments', 'Advanced certificate', '1-on-1 mentoring', 'Job placement support'];
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "popularTier" TEXT;

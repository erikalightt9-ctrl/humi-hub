-- Add industry field to courses table
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "industry" TEXT;

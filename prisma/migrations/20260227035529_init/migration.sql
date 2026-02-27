-- CreateEnum
CREATE TYPE "CourseSlug" AS ENUM ('MEDICAL_VA', 'REAL_ESTATE_VA', 'US_BOOKKEEPING_VA');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED_FULL_TIME', 'EMPLOYED_PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'FREELANCER');

-- CreateEnum
CREATE TYPE "ToolFamiliarity" AS ENUM ('QUICKBOOKS', 'CRM', 'EHR', 'MICROSOFT_OFFICE', 'GOOGLE_WORKSPACE', 'SLACK', 'ZOOM', 'TRELLO', 'ASANA', 'SALESFORCE', 'HUBSPOT', 'OTHER');

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "slug" "CourseSlug" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "outcomes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "educationalBackground" TEXT NOT NULL,
    "workExperience" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL,
    "technicalSkills" TEXT[],
    "toolsFamiliarity" "ToolFamiliarity"[],
    "whyEnroll" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "emailConfirmedAt" TIMESTAMP(3),
    "statusUpdatedAt" TIMESTAMP(3),
    "statusUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_attempts" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_email_key" ON "enrollments"("email");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_createdAt_idx" ON "enrollments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "rate_limit_attempts_ip_endpoint_createdAt_idx" ON "rate_limit_attempts"("ip", "endpoint", "createdAt");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

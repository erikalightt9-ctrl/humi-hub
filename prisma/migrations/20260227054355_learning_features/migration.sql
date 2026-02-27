-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'GRADED', 'RETURNED');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('FIRST_LESSON', 'QUIZ_MASTER', 'COURSE_COMPLETER', 'TOP_CONTRIBUTOR', 'ASSIGNMENT_STAR', 'FORUM_STARTER');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_completions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certNumber" TEXT NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_threads" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "maxPoints" INTEGER NOT NULL DEFAULT 100,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "grade" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_badges" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_enrollmentId_key" ON "students"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "lessons_courseId_order_idx" ON "lessons"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_completions_studentId_lessonId_key" ON "lesson_completions"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "quizzes_courseId_idx" ON "quizzes"("courseId");

-- CreateIndex
CREATE INDEX "quiz_questions_quizId_order_idx" ON "quiz_questions"("quizId", "order");

-- CreateIndex
CREATE INDEX "quiz_attempts_studentId_quizId_idx" ON "quiz_attempts"("studentId", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certNumber_key" ON "certificates"("certNumber");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_studentId_courseId_key" ON "certificates"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "forum_threads_courseId_idx" ON "forum_threads"("courseId");

-- CreateIndex
CREATE INDEX "forum_posts_threadId_idx" ON "forum_posts"("threadId");

-- CreateIndex
CREATE INDEX "assignments_courseId_idx" ON "assignments"("courseId");

-- CreateIndex
CREATE INDEX "submissions_assignmentId_idx" ON "submissions"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_assignmentId_studentId_key" ON "submissions"("assignmentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_type_key" ON "badges"("type");

-- CreateIndex
CREATE UNIQUE INDEX "student_badges_studentId_badgeId_key" ON "student_badges"("studentId", "badgeId");

-- CreateIndex
CREATE INDEX "point_transactions_studentId_idx" ON "point_transactions"("studentId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "forum_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

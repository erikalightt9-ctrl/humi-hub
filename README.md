# HUMI Training Hub

A full-stack Learning Management System (LMS) built for training professionals across any field or industry. The platform manages the entire student lifecycle — from enrollment and payment to course delivery, AI-powered practice, assessments, certifications, and job placement.

**Live:** [va-training-center.vercel.app](https://va-training-center.vercel.app)

---

## Platform Overview

```
humi-training-hub/
│
├── platform/
│   ├── marketing-site/        # Landing page, about, contact, testimonials
│   ├── learning-system/       # Courses, lessons, quizzes, assignments, forums
│   ├── career-platform/       # Job board, job matching, portfolio, certificates
│   ├── ai-training-lab/       # AI simulator, interviews, assessments, tasks, business assistant
│   └── operations-system/     # Enrollment pipeline, payments, schedules, attendance, analytics
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Auth | NextAuth.js 4 (JWT sessions, credentials-based) |
| AI | OpenAI API (`gpt-4o-mini`) |
| Email | React Email + Nodemailer (Gmail SMTP) |
| PDF | `@react-pdf/renderer` (certificates) |
| Payments | PayMongo (GCash, PayMaya, cards) |
| Styling | Tailwind CSS 4 |
| UI | Radix UI + shadcn/ui, Lucide icons |
| Validation | Zod 4 + React Hook Form |
| Deployment | Vercel |

---

## Features

### Public Pages
- **Landing Page** — Hero section, course previews, testimonials, and value propositions
- **Course Catalog** — Browse available programs with pricing and outcomes
- **Free Lesson Previews** — Preview select lessons before enrolling
- **Multi-Step Enrollment** — Personal info, skills assessment, and motivation capture
- **Online Payment** — PayMongo checkout (GCash, PayMaya, cards) or manual proof upload
- **Job Board** — Browse job postings with search and type filters
- **Certificate Verification** — Public verification of issued certificates by cert number
- **Contact Form** — Direct inquiry with email notification

### Admin Dashboard (25 pages)
- **Dashboard** — Real-time metrics (enrollments, payments, attendance, schedules)
- **Enrollee Pipeline** — Full lifecycle: Pending > Approved > Enrolled with profile view
- **Payment Verification** — Review proofs, verify payments, PayMongo webhook tracking
- **Course Management** — CRUD with outcomes, pricing, and active/inactive toggle
- **Lesson Management** — Lesson CRUD with video URLs, ordering, and preview flags
- **Trainer Management** — Trainer profiles, specializations, and course assignments
- **Course Resources** — Upload training documents (PDF, DOC, PPT, XLS, images)
- **Quiz & Assignment Management** — Create quizzes, grade submissions, provide feedback
- **Schedule Management** — Training batches with capacity, dates, and enrollment cutoffs
- **Calendar** — Platform-wide events (announcements, deadlines, orientations, holidays)
- **Student Management** — Active students, access control, batch assignment
- **Attendance** — Live clock-in/out monitoring
- **Analytics** — Enrollment trends, course popularity, quiz performance
- **Engagement Metrics** — Activity tracking and inactivity identification
- **Communications** — Email management with 19+ templates
- **AI Control Tower** — AI-powered risk indicators, anomaly detection, recommendations
- **AI Insights** — Performance predictions and dropout risk scores
- **Testimonials** — Curate and publish student success stories
- **Job Postings** — Create and manage job listings
- **Reports & Export** — CSV/Excel data export
- **Certificate Issuance** — Generate and manage completion certificates

### Student Portal (23 pages)
- **Dashboard** — Progress overview, quiz averages, points, badges, and activity feed
- **Lesson Viewer** — Structured lessons with video support and completion tracking
- **Quizzes** — Multiple choice, true/false, short answer with instant scoring
- **Assignments** — File submission with grading, feedback, and AI evaluation
- **Discussion Forum** — Course-specific threaded discussions
- **Leaderboard** — Gamified ranking with points and badges
- **Certificates** — View, download (PDF), and share completion certificates
- **Calendar** — Personal schedule with events and due dates
- **Attendance** — Daily clock-in/out tracking
- **Portfolio** — Build and showcase a public portfolio
- **Change Password** — Required on first login

### AI-Powered Features (10)

| Feature | Description |
|---------|-------------|
| AI Client Simulator | Practice with virtual client scenarios per course specialty |
| AI Mock Interviews | Realistic job interview practice with multi-question scoring |
| AI Practice Tasks | On-demand task generation with evaluation and feedback |
| AI Skill Assessments | 6-dimension career readiness scoring |
| AI Task Generator | Course-specific tasks at varying difficulty levels |
| AI Business Assistant | Real-time Q&A, template suggestions, email drafting |
| AI Job Matching | Skill-based job recommendations with match percentages |
| AI Control Tower | Admin dashboard with AI insights and risk detection |
| AI Admin Insights | Platform-wide predictions and analytics |
| Work Pace Monitor | Productivity tracking with improvement suggestions |

### Email Notifications (19+ templates)
- Enrollment confirmation, approval, rejection
- Payment instructions, reminders, confirmation
- Assignment due reminders, graded notifications
- Course and lesson completion
- Badge earned, quiz passed/failed
- Certificate issued
- Weekly progress reports
- Forum reply notifications
- Inactivity reminders

---

## Project Structure

```
humi-training-hub/
├── prisma/
│   ├── schema.prisma              # Database schema (30+ models)
│   └── seed.ts                    # Seed data (courses, admin, badges, lessons)
├── src/
│   ├── app/
│   │   ├── (public)/              # Public pages
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── about/                 # About page
│   │   │   ├── contact/               # Contact form
│   │   │   ├── courses/               # Course catalog & detail pages
│   │   │   ├── enroll/                # Multi-step enrollment form
│   │   │   ├── jobs/                  # Public job board
│   │   │   ├── pay/[enrollmentId]/    # Payment page (online + manual)
│   │   │   ├── portal/                # Login portal (admin + student)
│   │   │   ├── portfolio/[studentId]/ # Public student portfolio
│   │   │   └── verify/                # Certificate verification
│   │   ├── (admin)/admin/         # Admin dashboard (25 protected routes)
│   │   │   ├── page.tsx               # Dashboard overview
│   │   │   ├── ai-insights/           # AI analytics
│   │   │   ├── analytics/             # Platform analytics
│   │   │   ├── attendance/            # Live attendance tracking
│   │   │   ├── calendar/              # Event calendar
│   │   │   ├── certificates/          # Certificate management
│   │   │   ├── communications/        # Email management
│   │   │   ├── control-tower/         # AI control tower
│   │   │   ├── courses/               # Course CRUD
│   │   │   ├── engagement/            # Student engagement
│   │   │   ├── enrollees/             # Enrollment pipeline
│   │   │   ├── job-postings/          # Job posting management
│   │   │   ├── lessons/               # Lesson management
│   │   │   ├── payments/              # Payment verification
│   │   │   ├── reports/               # Data export
│   │   │   ├── schedules/             # Batch schedule management
│   │   │   ├── students/              # Student management
│   │   │   ├── submissions/           # Assignment grading
│   │   │   ├── testimonials/          # Testimonial management
│   │   │   └── trainers/              # Trainer management
│   │   ├── student/               # Student portal (23 protected routes)
│   │   │   ├── dashboard/             # Student dashboard
│   │   │   ├── ai-assessments/        # AI skill assessments
│   │   │   ├── ai-interviews/         # AI mock interviews
│   │   │   ├── ai-practice/           # AI practice scenarios
│   │   │   ├── ai-simulator/          # AI client simulation
│   │   │   ├── ai-tasks/              # AI task generator
│   │   │   ├── business-assistant/    # AI business assistant
│   │   │   ├── calendar/              # Personal calendar
│   │   │   ├── career-readiness/      # Career readiness scores
│   │   │   ├── certificates/          # Certificate downloads
│   │   │   ├── change-password/       # Password change
│   │   │   ├── courses/[courseId]/     # Course content & activities
│   │   │   ├── job-matches/           # AI job recommendations
│   │   │   ├── portfolio/             # Portfolio builder
│   │   │   └── work-pace/             # Work pace monitor
│   │   └── api/                   # 90+ API endpoints
│   │       ├── auth/                  # NextAuth
│   │       ├── admin/                 # Admin API (30+ endpoints)
│   │       ├── student/               # Student API (25+ endpoints)
│   │       ├── payments/              # Payment processing & webhooks
│   │       ├── cron/                  # Scheduled jobs
│   │       ├── jobs/                  # Public job board API
│   │       ├── testimonials/          # Public testimonials API
│   │       └── chat/                  # AI chatbot
│   ├── components/
│   │   ├── admin/                 # 40+ admin components
│   │   ├── student/               # 14+ student components
│   │   ├── public/                # Public page components
│   │   ├── enrollment/            # Enrollment form components
│   │   ├── portal/                # Login portal components
│   │   └── ui/                    # shadcn/ui primitives
│   └── lib/
│       ├── auth.ts                # NextAuth configuration
│       ├── prisma.ts              # Prisma client singleton
│       ├── proxy.ts               # Auth middleware
│       ├── repositories/          # 27 data access modules
│       ├── services/              # 19 business logic modules
│       ├── validations/           # 15+ Zod schemas
│       ├── email/templates/       # 19+ React Email templates
│       ├── constants/             # Enums and constants
│       └── types/                 # TypeScript type definitions
└── public/
    └── uploads/                   # Uploaded files (payments, resources)
```

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌───────────┐
│   Client     │ ──▸ │  API Routes  │ ──▸ │  Services        │ ──▸ │  Prisma   │
│  (React)     │     │  (Next.js)   │     │  (Business Logic)│     │  (ORM)    │
└─────────────┘     └──────────────┘     └──────────────────┘     └───────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌──────────────────┐
                    │  Validations │     │  Repositories    │
                    │  (Zod)       │     │  (Data Access)   │
                    └──────────────┘     └──────────────────┘
```

- **API Routes** — Handle HTTP requests, auth checks, and input validation
- **Services** — Business logic, AI integrations, and email notifications
- **Repositories** — Database queries via Prisma (no business logic)
- **Validations** — Zod schemas for type-safe input validation at boundaries

---

## Enrollment Workflow

```
Student submits enrollment form
        │
        ▼
Admin reviews application ──▸ Rejected (email sent)
        │
        ▼ Approved (email with payment instructions)
Student pays online (PayMongo) or uploads proof
        │
        ▼
Admin verifies payment (or webhook auto-verifies)
        │
        ▼
Student account created ──▸ Welcome email with credentials
        │
        ▼
Student logs in ──▸ Must change password on first login
        │
        ▼
Course access begins
```

---

## Database Models

| Category | Models |
|----------|--------|
| **Core** | Course, Enrollment, Student, Admin, Payment |
| **Content** | Lesson, Quiz, QuizQuestion, QuizAnswer, QuizAttempt, Assignment, Submission |
| **Certification** | Certificate, Badge, StudentBadge, PointTransaction |
| **Community** | ForumThread, ForumPost |
| **Scheduling** | Schedule, AttendanceRecord, CalendarEvent |
| **AI & Career** | SimulationSession, InterviewSession, CareerReadinessScore, JobPosting, JobMatch, WorkPaceMonitor |
| **Management** | Trainer, CourseTrainer, CourseResource, Testimonial, ContactMessage |

---

## Available Programs

Courses are fully configurable from the Admin Dashboard. The platform supports any training program — professional skills, technical courses, certifications, and more.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Gmail account with App Password (for email)
- OpenAI API key (for AI features)
- PayMongo account (for online payments — optional)

### 1. Clone and Install

```bash
git clone https://github.com/erikalightt9-ctrl/va-training-center.git
cd va-training-center
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Authentication (Required)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email - Gmail SMTP (Required)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
EMAIL_FROM_NAME="HUMI Training Hub"
EMAIL_FROM_ADDRESS="your-email@gmail.com"

# AI Features (Required for AI features)
OPENAI_API_KEY="sk-..."

# PayMongo - Online Payments (Optional)
PAYMONGO_SECRET_KEY="sk_test_..."
PAYMONGO_WEBHOOK_SECRET="whsk_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Manual Payment Info (Optional)
GCASH_NUMBER="09XX-XXX-XXXX"
GCASH_NAME="Your Name"
GCASH_QR_URL="https://..."
BANK_NAME="BDO"
BANK_ACCOUNT_NUMBER="0000-0000-0000"
BANK_ACCOUNT_NAME="Your Name"

# Cron Jobs (Optional)
CRON_SECRET="your-cron-secret"
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Admin Credentials
- **Email:** admin@humitraininghub.com
- **Password:** Admin@123456!

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage report |

---

## Security

- JWT-based sessions with 8-hour expiry
- bcrypt password hashing
- Role-based access control (admin / student)
- Security headers (X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy)
- Rate limiting on API endpoints
- Input validation at all boundaries (Zod)
- Parameterized queries via Prisma (SQL injection prevention)
- HTML sanitization (`sanitize-html`)
- Student access expiry enforcement
- PayMongo webhook signature verification (HMAC-SHA256)

---

## Deployment

Deployed on [Vercel](https://vercel.com) with automatic `prisma generate` in the build step.

```bash
npx vercel --prod
```

**Required Vercel Environment Variables:**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | Production URL |
| `GMAIL_USER` | Email sender address |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `OPENAI_API_KEY` | AI features |
| `PAYMONGO_SECRET_KEY` | Online payments |
| `PAYMONGO_WEBHOOK_SECRET` | Payment webhook verification |
| `NEXT_PUBLIC_APP_URL` | Payment redirect URLs |

---

## License

Private project. All rights reserved.

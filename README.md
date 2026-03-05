# VA Training Center

A full-stack Learning Management System (LMS) built for a Virtual Assistant training center. It manages the entire student lifecycle — from enrollment and payment verification to course delivery, assessments, certifications, and gamification.

**Live:** https://va-training-center.vercel.app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Auth | NextAuth.js (credentials-based, JWT sessions) |
| Email | React Email + Nodemailer (Gmail SMTP) |
| PDF | @react-pdf/renderer (certificates) |
| AI Chat | OpenAI API |
| Styling | Tailwind CSS |
| UI | Radix UI, Lucide icons |
| Forms | React Hook Form + Zod validation |
| Deployment | Vercel |

---

## Project Structure

```
va-training-center/
├── prisma/
│   ├── schema.prisma          # Database schema (24 models)
│   └── seed.ts                # Seed data (courses, admin, badges, lessons)
├── src/
│   ├── app/
│   │   ├── (public)/          # Public-facing pages
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── about/             # About page
│   │   │   ├── contact/           # Contact form
│   │   │   ├── courses/           # Course catalog & individual course pages
│   │   │   ├── enroll/            # Enrollment form
│   │   │   ├── pay/[enrollmentId]/ # Payment upload page
│   │   │   └── portal/            # Login portal (admin + student)
│   │   ├── (admin)/admin/     # Admin dashboard (protected)
│   │   │   ├── page.tsx           # Dashboard overview
│   │   │   ├── analytics/         # Platform analytics
│   │   │   ├── assignments/       # Assignment management
│   │   │   ├── attendance/        # Live attendance tracking
│   │   │   ├── calendar/          # Event calendar
│   │   │   ├── certificates/      # Certificate management
│   │   │   ├── communications/    # Email communications
│   │   │   ├── courses/           # Course management
│   │   │   ├── engagement/        # Student engagement metrics
│   │   │   ├── enrollees/         # Enrollee management & profiles
│   │   │   ├── lessons/           # Lesson CRUD
│   │   │   ├── payments/          # Payment verification & tracking
│   │   │   ├── reports/           # Reports & exports
│   │   │   ├── schedules/         # Training schedule management
│   │   │   ├── settings/          # Platform settings
│   │   │   ├── students/          # Student management & profiles
│   │   │   ├── submissions/       # Assignment submission grading
│   │   │   └── trainers/          # Trainer management
│   │   ├── (student)/student/ # Student portal (protected)
│   │   │   ├── dashboard/         # Student dashboard
│   │   │   ├── calendar/          # Student calendar
│   │   │   ├── certificates/      # View & download certificates
│   │   │   ├── change-password/   # Password change
│   │   │   └── courses/[courseId]/ # Course content
│   │   │       ├── lessons/[lessonId]/  # Lesson viewer
│   │   │       ├── quizzes/             # Quiz list & attempts
│   │   │       ├── assignments/         # Assignment submissions
│   │   │       ├── forum/               # Discussion forum
│   │   │       └── leaderboard/         # Course leaderboard
│   │   └── api/               # API routes
│   │       ├── auth/              # NextAuth endpoints
│   │       ├── admin/             # Admin API (18 endpoints)
│   │       ├── student/           # Student API (15 endpoints)
│   │       ├── enrollments/       # Public enrollment
│   │       ├── payments/          # Payment proof upload
│   │       ├── contact/           # Contact form
│   │       ├── chat/              # AI chatbot
│   │       └── cron/              # Scheduled tasks
│   ├── components/
│   │   ├── admin/             # Admin UI components (30+)
│   │   ├── student/           # Student UI components
│   │   ├── public/            # Public page components
│   │   ├── enrollment/        # Enrollment form components
│   │   ├── portal/            # Login portal components
│   │   ├── calendar/          # Shared calendar components
│   │   └── ui/                # Reusable UI primitives
│   └── lib/
│       ├── auth.ts            # NextAuth configuration
│       ├── prisma.ts          # Prisma client singleton
│       ├── proxy.ts           # Auth middleware (access expiry, role checks)
│       ├── repositories/      # Data access layer (16 repositories)
│       ├── services/          # Business logic layer (10 services)
│       ├── validations/       # Zod schemas for input validation
│       ├── email/
│       │   └── templates/     # React Email templates (19 templates)
│       ├── constants/         # Enums and constant values
│       └── types/             # TypeScript type definitions
└── public/                    # Static assets (images, icons)
```

---

## Database Models (24)

| Model | Purpose |
|-------|---------|
| `Course` | Training courses (Medical VA, Real Estate VA, US Bookkeeping VA) |
| `Enrollment` | Student enrollment applications with status tracking |
| `Payment` | Payment proof submissions and verification |
| `Admin` | Admin user accounts |
| `Student` | Student accounts (created on payment verification) |
| `Lesson` | Course lessons with content |
| `LessonCompletion` | Tracks completed lessons per student |
| `Quiz` | Course quizzes |
| `QuizQuestion` | Quiz questions with options |
| `QuizAttempt` | Student quiz attempt records |
| `QuizAnswer` | Individual question answers |
| `Certificate` | Issued course completion certificates |
| `ForumThread` | Discussion forum threads |
| `ForumPost` | Forum replies |
| `Assignment` | Course assignments |
| `Submission` | Student assignment submissions |
| `Badge` | Gamification badges |
| `StudentBadge` | Earned badges per student |
| `PointTransaction` | Gamification point tracking |
| `AttendanceRecord` | Daily clock-in/clock-out records |
| `ContactMessage` | Contact form submissions |
| `RateLimitAttempt` | API rate limiting tracker |
| `Schedule` | Training batch schedules |
| `CalendarEvent` | Calendar events |

---

## Key Features

### Public Website
- Landing page with course offerings
- Individual course pages with curriculum details
- Free lesson previews
- Multi-step enrollment form
- Contact form with email notifications
- AI-powered chatbot

### Enrollment & Payment Workflow
1. Student submits enrollment form
2. Admin reviews and approves/rejects
3. Approved students receive payment instructions email with reference code
4. Student uploads payment proof (screenshot/receipt) with reference number
5. Admin verifies payment ("Verify & Activate")
6. System atomically creates student account with 90-day access
7. Student receives credentials via email

### Admin Dashboard
- **Dashboard** — Overview metrics and quick stats
- **Enrollees** — Full enrollment pipeline management with profile view
- **Students** — Active student management with access controls
- **Payments** — Payment verification with proof image viewer
- **Courses** — Course CRUD management
- **Lessons** — Lesson content management
- **Assignments** — Assignment creation and submission grading
- **Quizzes** — Quiz management
- **Certificates** — View issued certificates
- **Schedules** — Training batch schedule management
- **Calendar** — Event management
- **Attendance** — Live attendance monitoring
- **Analytics** — Platform-wide analytics
- **Engagement** — Student engagement metrics
- **Communications** — Email management
- **Reports** — Data export

### Student Portal
- **Dashboard** — Progress overview, enrolled courses, badges
- **Course Content** — Lesson viewer with completion tracking
- **Quizzes** — Take quizzes with instant scoring
- **Assignments** — Submit assignments for grading
- **Forum** — Course discussion threads
- **Leaderboard** — Gamified ranking
- **Certificates** — View and download PDF certificates
- **Calendar** — Personal schedule
- **Attendance** — Daily clock-in/clock-out
- **Change Password** — Required on first login

### Email Notifications (19 templates)
- Enrollment confirmation, approval, rejection
- Payment instructions, reminders, confirmation
- Assignment due reminders, graded notifications
- Course and lesson completion
- Badge earned, quiz passed
- Weekly progress reports
- Forum reply notifications
- Inactivity reminders
- Admin review reminders

---

## Architecture

```
Client (Browser)
    |
    v
Next.js App Router --> Middleware (proxy.ts)
    |                      |
    v                      v
API Routes <---- JWT Auth (NextAuth)
    |
    v
Service Layer (business logic)
    |
    v
Repository Layer (data access)
    |
    v
Prisma ORM --> PostgreSQL (Neon)
```

**Pattern:** Repository + Service layers with Zod validation at API boundaries.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth JWT secret |
| `NEXTAUTH_URL` | App base URL |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Gmail app-specific password |
| `EMAIL_FROM_NAME` | Email sender name |
| `EMAIL_FROM_ADDRESS` | Email sender address |
| `CRON_SECRET` | Secret for cron job authentication |
| `GCASH_QR_URL` | (Optional) GCash QR code image URL |
| `OPENAI_API_KEY` | (Optional) OpenAI API key for chatbot |

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (or Neon account)

### Setup

```bash
# Clone the repository
git clone https://github.com/erikalightt9-ctrl/va-training-center.git
cd va-training-center

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

### Default Admin Credentials
- **Email:** admin@vatrainingcenter.com
- **Password:** Admin@123456!

---

## Available Courses

| Course | Duration | Price |
|--------|----------|-------|
| Medical Virtual Assistant | 8 weeks | PHP 15,000 |
| Real Estate Virtual Assistant | 8 weeks | PHP 12,000 |
| US Bookkeeping Virtual Assistant | 8 weeks | PHP 12,000 |

---

## Deployment

Deployed on **Vercel** with:
- Automatic `prisma generate` in build step
- Neon serverless PostgreSQL
- Gmail SMTP for transactional emails

```bash
# Deploy to Vercel
vercel --prod
```

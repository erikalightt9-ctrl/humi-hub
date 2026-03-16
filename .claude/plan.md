# Training Enrollment & Scheduling System Enhancement

## Overview

Add schedule selection to the enrollment flow, real-time seat availability, waitlist system, tier-based capacity limits, trainer assignment in schedules, and an enhanced admin tracking dashboard.

## What Already Exists

- **Schedule model**: `name`, `courseId`, `trainerId`, `startDate/endDate`, `daysOfWeek`, `startTime/endTime`, `maxCapacity` (default 25), `enrollmentCutOffDays`, `status` (OPEN/CLOSED/FULL/COMPLETED)
- **Schedule admin pages**: Create/edit dialog, list with filters, detail page with enrolled students
- **`listOpenSchedulesByCourse()`**: Already filters OPEN schedules within cutoff
- **`updateScheduleStatusIfFull()`**: Auto-transitions OPEN -> FULL
- **Trainer tiers**: BASIC / PROFESSIONAL / PREMIUM with pricing
- **Enrollment model**: Has `trainerId`, `trainerTier`, pricing fields but NO `scheduleId`

## Implementation Phases

---

### Phase 1: Schedule Selection in Enrollment (Core)

**Schema Changes** (Prisma migration):
- Add `scheduleId String?` to `Enrollment` model with relation to `Schedule`
- Add `Waitlist` model: `id`, `scheduleId`, `enrollmentId`, `position`, `status` (WAITING/PROMOTED/CANCELLED), `createdAt`
- Add tier capacity constants: BASIC=15, PROFESSIONAL=20, PREMIUM=25

**Files to create/modify**:

1. **`prisma/schema.prisma`** - Add `scheduleId` to Enrollment, add Waitlist model
2. **`src/lib/constants/pricing.ts`** - Add `TIER_MAX_CAPACITY` map (BASIC:15, PROFESSIONAL:20, PREMIUM:25)
3. **`src/lib/validations/enrollment.schema.ts`** - Add `scheduleId` optional field
4. **`src/app/api/public/schedules/route.ts`** (NEW) - Public GET endpoint: open schedules by courseId with seat counts
5. **`src/components/enrollment/StepScheduleSelect.tsx`** (NEW) - Schedule picker showing date, time, days, seats remaining as progress bar, trainer name
6. **`src/components/enrollment/EnrollmentForm.tsx`** - Add Step 3 "Schedule" (6 steps total: Personal > Trainer > Schedule > Professional > Statement > Review)
7. **`src/components/enrollment/StepReview.tsx`** - Show selected schedule in review
8. **`src/lib/repositories/enrollment.repository.ts`** - Add `scheduleId` to `CreateEnrollmentInput`
9. **`src/lib/services/enrollment.service.ts`** - Validate schedule has seats, save `scheduleId`, auto-close if full

**User flow**: Course select -> Personal info -> Choose Trainer -> Choose Schedule (shows open sessions for selected course, real-time seat count, only schedules matching trainer if selected) -> Professional info -> Statement -> Review -> Submit

---

### Phase 2: Waitlist System

**Files to create/modify**:

1. **`src/lib/repositories/waitlist.repository.ts`** (NEW) - CRUD for waitlist entries, position management
2. **`src/lib/services/waitlist.service.ts`** (NEW) - Join waitlist, auto-promote when seat opens, send notification emails
3. **`src/lib/email/send-waitlist-notification.ts`** (NEW) - Email templates: "You're on the waitlist" + "A seat opened up!"
4. **`src/app/api/public/waitlist/route.ts`** (NEW) - POST to join waitlist for a full schedule
5. **`src/components/enrollment/StepScheduleSelect.tsx`** - Add "Join Waitlist" button on FULL schedules
6. **`src/app/api/admin/schedules/[id]/route.ts`** - Include waitlist count in schedule detail
7. **Schedule detail admin page** - Show waitlisted applicants table

---

### Phase 3: Trainer Assignment in Schedules + Capacity Enforcement

**Files to create/modify**:

1. **`src/components/admin/ScheduleDialog.tsx`** - Add trainer selection dropdown (filter by course assignment)
2. **`src/app/api/admin/schedules/route.ts`** - Accept `trainerId` on create/update, enforce tier capacity
3. **`src/lib/validations/schedule.schema.ts`** - Add `trainerId` optional field
4. **`src/lib/repositories/schedule.repository.ts`** - Include trainer in queries, enforce capacity per tier
5. **`src/components/admin/ScheduleTable.tsx`** - Show assigned trainer name in table

**Capacity enforcement**: When trainer assigned, auto-set `maxCapacity` to tier limit (BASIC:15, PROFESSIONAL:20, PREMIUM:25). Admin can override but gets a warning.

---

### Phase 4: Enhanced Admin Tracking Dashboard

**Files to create/modify**:

1. **`src/app/(admin)/admin/schedules/page.tsx`** - Enhanced stats: add waitlist count, attendance rate, seat utilization %
2. **`src/lib/repositories/schedule.repository.ts`** - Extend `getScheduleStats()` with waitlist data, attendance metrics
3. **`src/components/admin/ScheduleTable.tsx`** - Add seat availability progress bar, waitlist badge
4. **`src/app/(admin)/admin/schedules/[id]/page.tsx`** - Add attendance tracking tab, waitlist management tab
5. **`src/components/admin/SessionAttendance.tsx`** (NEW) - Mark attendance per student per session date
6. **`src/components/admin/WaitlistManager.tsx`** (NEW) - View/promote/remove waitlisted applicants

---

### Phase 5: Smart Scheduling (Trainer Availability)

1. **`prisma/schema.prisma`** - Add `TrainerAvailability` model (trainerId, dayOfWeek, startTime, endTime)
2. **`src/components/admin/TrainerAvailabilityEditor.tsx`** (NEW) - Admin/trainer sets weekly availability slots
3. **`src/components/admin/ScheduleDialog.tsx`** - Show trainer availability when assigning, warn on conflicts
4. **Training Analytics** - Session demand charts, peak schedule identification, trainer utilization rates

---

## Migration Strategy

Single Prisma migration adding:
```sql
ALTER TABLE enrollments ADD COLUMN "scheduleId" TEXT REFERENCES schedules(id);
CREATE INDEX idx_enrollments_scheduleId ON enrollments("scheduleId");

CREATE TABLE waitlist (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "scheduleId" TEXT NOT NULL REFERENCES schedules(id),
  "enrollmentId" TEXT NOT NULL REFERENCES enrollments(id),
  position INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'WAITING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Priority Order

**Phase 1** is the must-have (schedule selection in enrollment). **Phase 2** (waitlist) follows naturally. **Phase 3** (trainer assignment) enhances admin control. **Phase 4** (dashboard) gives visibility. **Phase 5** (smart scheduling) is the stretch goal.

I'll implement **Phases 1-3** in this session as they form the core system. Phases 4-5 can follow.

/**
 * Feature Flags Service
 * Per-tenant feature toggle system with in-memory caching.
 */
import { prisma } from "@/lib/prisma";
import type { TenantPlan } from "@prisma/client";

// ─── Feature Definitions ──────────────────────────────────────────────────────

export const FEATURES = {
  AI_SIMULATIONS: "ai_simulations",
  AI_INTERVIEWS: "ai_interviews",
  AI_EMAIL_PRACTICE: "ai_email_practice",
  JOB_BOARD: "job_board",
  FORUM: "forum",
  MENTORSHIP: "mentorship",
  CAREER_READINESS: "career_readiness",
  GAMIFICATION: "gamification",
  CERTIFICATES: "certificates",
  WAITLIST: "waitlist",
  ATTENDANCE_TRACKING: "attendance_tracking",
  CORPORATE_PORTAL: "corporate_portal",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

// ─── Default features by plan tier ────────────────────────────────────────────

export const DEFAULT_FEATURES_BY_PLAN: Record<TenantPlan, FeatureKey[]> = {
  TRIAL: [
    FEATURES.FORUM,
    FEATURES.CERTIFICATES,
  ],
  STARTER: [
    FEATURES.FORUM,
    FEATURES.CERTIFICATES,
    FEATURES.GAMIFICATION,
    FEATURES.WAITLIST,
  ],
  PROFESSIONAL: [
    FEATURES.FORUM,
    FEATURES.CERTIFICATES,
    FEATURES.GAMIFICATION,
    FEATURES.WAITLIST,
    FEATURES.JOB_BOARD,
    FEATURES.CAREER_READINESS,
    FEATURES.AI_SIMULATIONS,
    FEATURES.ATTENDANCE_TRACKING,
    FEATURES.CORPORATE_PORTAL,
  ],
  ENTERPRISE: Object.values(FEATURES) as FeatureKey[],
};

// ─── Simple in-memory cache (30s TTL) ─────────────────────────────────────────

interface CacheEntry {
  readonly features: ReadonlySet<string>;
  readonly expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

function getCached(tenantId: string): ReadonlySet<string> | null {
  const entry = cache.get(tenantId);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(tenantId);
    return null;
  }
  return entry.features;
}

function setCache(tenantId: string, features: ReadonlySet<string>): void {
  cache.set(tenantId, { features, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateTenantFeatureCache(tenantId: string): void {
  cache.delete(tenantId);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getEnabledFeatures(tenantId: string): Promise<ReadonlySet<string>> {
  const cached = getCached(tenantId);
  if (cached) return cached;

  const flags = await prisma.tenantFeatureFlag.findMany({
    where: { tenantId, enabled: true },
    select: { feature: true },
  });

  const features = new Set(flags.map((f) => f.feature));
  setCache(tenantId, features);
  return features;
}

export async function isFeatureEnabled(tenantId: string | null, feature: FeatureKey): Promise<boolean> {
  if (!tenantId) return true; // superadmin: all features enabled
  const features = await getEnabledFeatures(tenantId);
  return features.has(feature);
}

export async function seedDefaultFlags(tenantId: string, plan: TenantPlan): Promise<void> {
  const defaultFeatures = DEFAULT_FEATURES_BY_PLAN[plan] ?? [];
  const allFeatures = Object.values(FEATURES) as FeatureKey[];

  await Promise.all(
    allFeatures.map((feature) =>
      prisma.tenantFeatureFlag.upsert({
        where: { tenantId_feature: { tenantId, feature } },
        create: {
          tenantId,
          feature,
          enabled: defaultFeatures.includes(feature),
        },
        update: {}, // don't overwrite existing flags
      }),
    ),
  );

  invalidateTenantFeatureCache(tenantId);
}

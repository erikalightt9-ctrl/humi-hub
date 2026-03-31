/**
 * Tenant Onboarding Script
 * Usage: npx tsx --env-file=.env prisma/scripts/onboard-tenant.ts \
 *   --name "Acme Corp" --subdomain "acme" --email "admin@acme.com" \
 *   --password "SecurePass123!" --plan PROFESSIONAL
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function parseArgs(): {
  name: string;
  subdomain: string;
  email: string;
  password: string;
  plan: "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
} {
  const args = process.argv.slice(2);
  const get = (flag: string): string => {
    const idx = args.indexOf(flag);
    if (idx === -1 || !args[idx + 1]) throw new Error(`Missing ${flag}`);
    return args[idx + 1];
  };

  return {
    name: get("--name"),
    subdomain: get("--subdomain").toLowerCase(),
    email: get("--email").toLowerCase(),
    password: get("--password"),
    plan: (get("--plan") ?? "TRIAL") as "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
  };
}

const DEFAULT_FEATURES_BY_PLAN = {
  TRIAL: ["forum", "certificates"],
  STARTER: ["forum", "certificates", "gamification", "waitlist"],
  PROFESSIONAL: ["forum", "certificates", "gamification", "waitlist", "job_board", "career_readiness", "ai_simulations", "attendance_tracking", "corporate_portal"],
  ENTERPRISE: ["ai_simulations", "ai_interviews", "ai_email_practice", "job_board", "forum", "mentorship", "career_readiness", "gamification", "certificates", "waitlist", "attendance_tracking", "corporate_portal"],
};

async function main() {
  const { name, subdomain, email, password, plan } = parseArgs();

  console.log(`\nOnboarding tenant: ${name} (${subdomain})`);

  // 1. Check subdomain uniqueness
  const existing = await prisma.organization.findUnique({ where: { subdomain } });
  if (existing) {
    throw new Error(`Subdomain "${subdomain}" is already taken`);
  }

  // 2. Create organization
  const org = await prisma.organization.create({
    data: {
      name,
      slug: subdomain,
      subdomain,
      email,
      plan,
      isActive: true,
      isDefault: false,
      siteName: name,
    },
  });
  console.log(`✓ Organization created: ${org.id}`);

  // 3. Create tenant admin (CorporateManager with isTenantAdmin: true)
  const passwordHash = await bcrypt.hash(password, 12);
  const manager = await prisma.corporateManager.create({
    data: {
      organizationId: org.id,
      email,
      passwordHash,
      name: `${name} Admin`,
      isTenantAdmin: true,
      mustChangePassword: true,
    },
  });
  console.log(`✓ Tenant admin created: ${manager.id}`);

  // 4. Seed default feature flags
  const features = DEFAULT_FEATURES_BY_PLAN[plan] ?? [];
  const allFeatures = ["ai_simulations", "ai_interviews", "ai_email_practice", "job_board", "forum", "mentorship", "career_readiness", "gamification", "certificates", "waitlist", "attendance_tracking", "corporate_portal"];

  await Promise.all(
    allFeatures.map((feature) =>
      prisma.tenantFeatureFlag.create({
        data: { tenantId: org.id, feature, enabled: features.includes(feature) },
      }),
    ),
  );
  console.log(`✓ Feature flags seeded (${features.length} enabled for ${plan} plan)`);

  const domain = process.env.ROOT_DOMAIN ?? "humi-hub.vercel.app";
  console.log(`\n✅ Tenant onboarded successfully!`);
  console.log(`   Portal URL: https://${subdomain}.${domain}/portal`);
  console.log(`   Admin email: ${email}`);
  console.log(`   Plan: ${plan}`);
  console.log(`   Features enabled: ${features.join(", ")}`);
}

main()
  .catch((e) => {
    console.error("❌ Onboarding failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

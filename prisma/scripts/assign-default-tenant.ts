/**
 * Data Migration: Assign existing data to the default tenant
 * Run once after adding tenantId columns to tables that didn't have it.
 *
 * Usage: npx tsx --env-file=.env prisma/scripts/assign-default-tenant.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaultTenantId = process.env.DEFAULT_TENANT_ID;
  if (!defaultTenantId) {
    throw new Error("DEFAULT_TENANT_ID env var is required");
  }

  // Verify tenant exists
  const tenant = await prisma.organization.findUnique({ where: { id: defaultTenantId } });
  if (!tenant) {
    // Create default tenant if it doesn't exist
    await prisma.organization.create({
      data: {
        id: defaultTenantId,
        name: "HUMI Hub",
        slug: "default",
        subdomain: "app",
        email: process.env.ADMIN_EMAIL ?? "admin@humihub.com",
        plan: "ENTERPRISE",
        isActive: true,
        isDefault: true,
      },
    });
    console.log(`✓ Default tenant created: ${defaultTenantId}`);
  } else {
    console.log(`✓ Default tenant found: ${tenant.name}`);
  }

  // Assign unscoped courses to default tenant
  const coursesUpdated = await prisma.course.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenantId },
  });
  console.log(`✓ Courses assigned to default tenant: ${coursesUpdated.count}`);

  // Assign unscoped enrollments (via organizationId) to default tenant
  const enrollmentsUpdated = await prisma.enrollment.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultTenantId },
  });
  console.log(`✓ Enrollments assigned to default tenant: ${enrollmentsUpdated.count}`);

  // Assign unscoped students to default tenant
  const studentsUpdated = await prisma.student.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultTenantId },
  });
  console.log(`✓ Students assigned to default tenant: ${studentsUpdated.count}`);

  console.log("\n✅ Default tenant data migration complete");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

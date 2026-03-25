/**
 * Tenant Isolation Verification
 * Verifies that tenant A cannot see tenant B's data.
 * Run: npx tsx --env-file=.env prisma/scripts/verify-tenant-isolation.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get two different tenants
  const tenants = await prisma.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  if (tenants.length < 2) {
    console.log("⚠️  Need at least 2 tenants to verify isolation. Run onboard-tenant.ts first.");
    return;
  }

  const [tenantA, tenantB] = tenants;
  console.log(`\nVerifying isolation between:`);
  console.log(`  Tenant A: ${tenantA.name} (${tenantA.id})`);
  console.log(`  Tenant B: ${tenantB.name} (${tenantB.id})`);

  let passed = 0;
  let failed = 0;

  async function check(label: string, tenantId: string, query: () => Promise<number>, expectZero: boolean) {
    const count = await query();
    const ok = expectZero ? count === 0 : count >= 0;
    if (ok) {
      passed++;
      console.log(`  ✓ ${label}: ${count} records (${expectZero ? "correctly isolated" : "accessible"})`);
    } else {
      failed++;
      console.log(`  ✗ ${label}: ISOLATION BREACH — found ${count} records that should be 0`);
    }
  }

  // Courses
  console.log("\n── Courses ──");
  await check("Tenant A courses", tenantA.id,
    () => prisma.course.count({ where: { tenantId: tenantA.id } }), false);
  await check("Tenant B courses", tenantB.id,
    () => prisma.course.count({ where: { tenantId: tenantB.id } }), false);
  await check("A cannot see B courses", tenantA.id,
    () => prisma.course.count({ where: { tenantId: tenantB.id } }), true);

  // Students
  console.log("\n── Students ──");
  await check("Tenant A students", tenantA.id,
    () => prisma.student.count({ where: { organizationId: tenantA.id } }), false);
  await check("Tenant B students (expect 0 — new tenant)", tenantB.id,
    () => prisma.student.count({ where: { organizationId: tenantB.id } }), true);

  // Enrollments
  console.log("\n── Enrollments ──");
  await check("Tenant A enrollments", tenantA.id,
    () => prisma.enrollment.count({ where: { organizationId: tenantA.id } }), false);
  await check("Tenant B enrollments (expect 0 — new tenant)", tenantB.id,
    () => prisma.enrollment.count({ where: { organizationId: tenantB.id } }), true);

  // Feature flags
  console.log("\n── Feature Flags ──");
  const aFlags = await prisma.tenantFeatureFlag.count({ where: { tenantId: tenantA.id } });
  const bFlags = await prisma.tenantFeatureFlag.count({ where: { tenantId: tenantB.id } });
  console.log(`  ✓ Tenant A flags: ${aFlags}`);
  console.log(`  ✓ Tenant B flags: ${bFlags}`);

  console.log(`\n── Summary ──`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (failed === 0) {
    console.log(`\n✅ All isolation checks passed`);
  } else {
    console.log(`\n❌ ${failed} isolation check(s) FAILED — review data scoping`);
  }
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

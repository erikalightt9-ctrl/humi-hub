/**
 * Seed script: create default HUMI tenant and migrate existing data.
 * Run: npx tsx prisma/seed-tenant.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding default tenant...");

  // 1. Create the default HUMI tenant Organization
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: "humi" },
    create: {
      name: "HUMI Hub",
      slug: "humi",
      subdomain: "humi",
      email: "admin@humitrainingcenter.com",
      isDefault: true,
      isActive: true,
      plan: "PROFESSIONAL",
      siteName: "HUMI Hub",
      tagline: "Your Path to a VA Career",
      primaryColor: "#1d4ed8",
      secondaryColor: "#7c3aed",
    },
    update: {
      isDefault: true,
      subdomain: "humi",
      plan: "PROFESSIONAL",
      siteName: "HUMI Hub",
      primaryColor: "#1d4ed8",
      secondaryColor: "#7c3aed",
    },
  });

  console.log(`✅ Default tenant: ${defaultOrg.name} (id: ${defaultOrg.id})`);

  // 2. Assign all untenanted courses to the default tenant
  const updated = await prisma.course.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultOrg.id },
  });

  console.log(`✅ Assigned ${updated.count} courses to default tenant`);

  // 3. Link all existing trainers to default tenant via TenantTrainer
  const trainers = await prisma.trainer.findMany({ select: { id: true } });
  if (trainers.length > 0) {
    await prisma.tenantTrainer.createMany({
      data: trainers.map((t) => ({
        tenantId: defaultOrg.id,
        trainerId: t.id,
      })),
      skipDuplicates: true,
    });
    console.log(`✅ Linked ${trainers.length} trainers to default tenant`);
  }

  // 4. Print the tenant ID so it can be added to .env as DEFAULT_TENANT_ID
  console.log("\n📌 Add this to your .env file:");
  console.log(`DEFAULT_TENANT_ID="${defaultOrg.id}"`);

  console.log("\n🎉 Tenant seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

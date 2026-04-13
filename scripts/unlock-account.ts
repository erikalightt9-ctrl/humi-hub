/**
 * Usage:
 *   npx tsx scripts/unlock-account.ts albert120291@gmail.com
 *
 * Unlocks any locked account (student, trainer, humiAdmin, admin, corporate)
 * matching the given email by resetting failedAttempts and lockUntil.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function unlockAccount(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  let unlocked = false;

  // Student
  const student = await prisma.student.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, failedAttempts: true, lockUntil: true },
  });
  if (student) {
    await prisma.student.update({
      where: { id: student.id },
      data: { failedAttempts: 0, lockUntil: null },
    });
    console.log(`✅ Student unlocked: ${student.name} (${normalized})`);
    console.log(`   Was: failedAttempts=${student.failedAttempts}, lockUntil=${student.lockUntil ?? "null"}`);
    unlocked = true;
  }

  // Trainer
  const trainer = await prisma.trainer.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, failedAttempts: true, lockUntil: true },
  });
  if (trainer) {
    await prisma.trainer.update({
      where: { id: trainer.id },
      data: { failedAttempts: 0, lockUntil: null },
    });
    console.log(`✅ Trainer unlocked: ${trainer.name} (${normalized})`);
    console.log(`   Was: failedAttempts=${trainer.failedAttempts}, lockUntil=${trainer.lockUntil ?? "null"}`);
    unlocked = true;
  }

  // HumiAdmin
  const humiAdmin = await prisma.humiAdmin.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, failedAttempts: true, lockUntil: true },
  });
  if (humiAdmin) {
    await prisma.humiAdmin.update({
      where: { id: humiAdmin.id },
      data: { failedAttempts: 0, lockUntil: null },
    });
    console.log(`✅ HumiAdmin unlocked: ${humiAdmin.name} (${normalized})`);
    console.log(`   Was: failedAttempts=${humiAdmin.failedAttempts}, lockUntil=${humiAdmin.lockUntil ?? "null"}`);
    unlocked = true;
  }

  // Admin
  const admin = await prisma.admin.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, failedAttempts: true, lockUntil: true },
  });
  if (admin) {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockUntil: null },
    });
    console.log(`✅ Admin unlocked: ${admin.name} (${normalized})`);
    console.log(`   Was: failedAttempts=${admin.failedAttempts}, lockUntil=${admin.lockUntil ?? "null"}`);
    unlocked = true;
  }

  // CorporateManager
  const manager = await prisma.corporateManager.findFirst({
    where: { email: normalized },
    select: { id: true, name: true, failedAttempts: true, lockUntil: true },
  });
  if (manager) {
    await prisma.corporateManager.update({
      where: { id: manager.id },
      data: { failedAttempts: 0, lockUntil: null },
    });
    console.log(`✅ Corporate Manager unlocked: ${manager.name} (${normalized})`);
    console.log(`   Was: failedAttempts=${manager.failedAttempts}, lockUntil=${manager.lockUntil ?? "null"}`);
    unlocked = true;
  }

  if (!unlocked) {
    console.error(`❌ No account found with email: ${normalized}`);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/unlock-account.ts <email>");
  process.exit(1);
}

unlockAccount(email)
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

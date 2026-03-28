import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
async function main() {
  const courses = await prisma.course.findMany({ where: { isActive: true }, select: { id: true, title: true } });
  for (const c of courses) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id);
    const isCUID = /^c[a-z0-9]{24,}$/.test(c.id);
    console.log(isUUID ? 'UUID' : isCUID ? 'CUID' : 'OTHER', c.id, c.title);
  }
  await prisma.$disconnect();
}
main().catch(console.error);

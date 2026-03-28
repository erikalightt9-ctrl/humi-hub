import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DATABASE_URL = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const course = await prisma.course.findFirst({ where: { isActive: true }, select: { id: true, title: true } });
    console.log('Course:', JSON.stringify(course));
    
    if (!course) { console.log('NO ACTIVE COURSES'); return; }
    
    const enrollment = await prisma.enrollment.create({
      data: {
        fullName: 'Debug Test User',
        dateOfBirth: new Date('1990-01-01'),
        email: 'debug-' + Date.now() + '@test.com',
        contactNumber: '+639171234567',
        address: '123 Test Street, Test City, Test Province',
        educationalBackground: 'Bachelor of Science in IT with honors',
        workExperience: 'No work experience',
        employmentStatus: 'EMPLOYED_PART_TIME',
        technicalSkills: ['Excel'],
        toolsFamiliarity: ['MICROSOFT_OFFICE'],
        whyEnroll: 'I want to learn virtual assistant skills to improve my career prospects.',
        courseId: course.id,
        courseTier: 'BASIC',
      }
    });
    console.log('SUCCESS - id:', enrollment.id);
    await prisma.enrollment.delete({ where: { id: enrollment.id } });
    console.log('Cleaned up test record');
  } catch(e: any) {
    console.error('ERROR TYPE:', e.constructor.name);
    console.error('ERROR MSG:', e.message);
    if (e.meta) console.error('META:', JSON.stringify(e.meta));
    if (e.code) console.error('PRISMA CODE:', e.code);
  } finally {
    await prisma.$disconnect();
  }
}

main();
